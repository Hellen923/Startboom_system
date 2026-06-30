import express from 'express';
import Deal from '../models/Deal.js';
import Client from '../models/Client.js';
import Sale from '../models/Sale.js';
import User from '../models/User.js';
import { tenantAuth, requireRole } from '../middleware/tenantAuth.js';
import { logAction } from '../utils/auditLog.js';

const router = express.Router();

router.use(tenantAuth);

// Sales Forecasting API
router.get('/sales-forecast', async (req, res) => {
  try {
    const tenantQuery = req.isSuperAdmin ? {} : { tenant: req.tenantId };
    const { months = 6 } = req.query;

    // Get historical sales data for forecasting
    const historicalSales = await Sale.aggregate([
      {
        $match: {
          ...tenantQuery,
          status: 'completed',
          saleDate: {
            $gte: new Date(Date.now() - (12 * 30 * 24 * 60 * 60 * 1000)) // Last 12 months
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$saleDate' },
            month: { $month: '$saleDate' }
          },
          totalRevenue: { $sum: '$finalAmount' },
          totalDeals: { $sum: 1 },
          averageDealSize: { $avg: '$finalAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Calculate forecasting metrics
    const forecast = calculateSalesForecast(historicalSales, parseInt(months));

    res.json({
      historicalData: historicalSales,
      forecast: forecast,
      confidence: calculateForecastConfidence(historicalSales),
      recommendations: generateForecastRecommendations(forecast)
    });

  } catch (error) {
    res.status(500).json({ message: 'Error generating sales forecast', error: error.message });
  }
});

// Lead Scoring API
router.get('/lead-scoring', async (req, res) => {
  try {
    const tenantQuery = req.isSuperAdmin ? {} : { tenant: req.tenantId };

    // Get all clients for scoring
    const clients = await Client.find(tenantQuery)
      .populate('agent', 'name')
      .lean();

    // Calculate lead scores for each client
    const scoredLeads = await Promise.all(
      clients.map(async (client) => {
        const score = await calculateLeadScore(client, tenantQuery);
        return {
          ...client,
          leadScore: score.totalScore,
          scoreBreakdown: score.breakdown,
          conversionProbability: calculateConversionProbability(score.totalScore),
          recommendedAction: getRecommendedAction(score.totalScore, client)
        };
      })
    );

    // Sort by lead score (highest first)
    scoredLeads.sort((a, b) => b.leadScore - a.leadScore);

    res.json({
      leads: scoredLeads,
      scoringCriteria: {
        interactionFrequency: 'Weight: 25%',
        dealHistory: 'Weight: 30%',
        companySize: 'Weight: 15%',
        engagementLevel: 'Weight: 20%',
        timeSinceLastContact: 'Weight: 10%'
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Error calculating lead scores', error: error.message });
  }
});

// Performance Prediction API
router.get('/performance-prediction/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const tenantQuery = req.isSuperAdmin ? { _id: agentId } : { _id: agentId, tenant: req.tenantId };

    const agent = await User.findOne(tenantQuery);
    if (!agent) return res.status(404).json({ message: 'Agent not found' });

    // Get agent's historical performance data
    const performanceData = await getAgentPerformanceHistory(agentId, req.tenantId);

    // Calculate performance prediction
    const prediction = predictAgentPerformance(performanceData, agent);

    res.json({
      agent: {
        id: agent._id,
        name: agent.name,
        currentPerformance: agent.performanceScore || 0
      },
      prediction: prediction,
      historicalData: performanceData,
      recommendations: generatePerformanceRecommendations(prediction, agent)
    });

  } catch (error) {
    res.status(500).json({ message: 'Error predicting performance', error: error.message });
  }
});

// Churn Prediction API
router.get('/churn-prediction', async (req, res) => {
  try {
    const tenantQuery = req.isSuperAdmin ? {} : { tenant: req.tenantId };

    const clients = await Client.find({
      ...tenantQuery,
      status: { $in: ['active', 'inactive'] }
    }).lean();

    const churnPredictions = await Promise.all(
      clients.map(async (client) => {
        const risk = await calculateChurnRisk(client, tenantQuery);
        return {
          clientId: client._id,
          clientName: client.name,
          churnRisk: risk.score,
          riskLevel: risk.level,
          riskFactors: risk.factors,
          recommendedActions: risk.actions,
          predictedChurnDate: risk.predictedDate
        };
      })
    );

    // Sort by churn risk (highest first)
    churnPredictions.sort((a, b) => b.churnRisk - a.churnRisk);

    res.json({
      predictions: churnPredictions,
      summary: {
        highRisk: churnPredictions.filter(p => p.riskLevel === 'high').length,
        mediumRisk: churnPredictions.filter(p => p.riskLevel === 'medium').length,
        lowRisk: churnPredictions.filter(p => p.riskLevel === 'low').length
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Error calculating churn predictions', error: error.message });
  }
});

// Helper Functions

function calculateSalesForecast(historicalData, months) {
  if (historicalData.length < 3) {
    return { error: 'Insufficient historical data for forecasting' };
  }

  // Simple linear regression for forecasting
  const data = historicalData.map(item => ({
    month: item._id.year * 12 + item._id.month,
    revenue: item.totalRevenue
  }));

  const n = data.length;
  const sumX = data.reduce((sum, item) => sum + item.month, 0);
  const sumY = data.reduce((sum, item) => sum + item.revenue, 0);
  const sumXY = data.reduce((sum, item) => sum + item.month * item.revenue, 0);
  const sumXX = data.reduce((sum, item) => sum + item.month * item.month, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const forecast = [];
  const lastMonth = Math.max(...data.map(d => d.month));

  for (let i = 1; i <= months; i++) {
    const month = lastMonth + i;
    const predictedRevenue = slope * month + intercept;

    forecast.push({
      month: month,
      predictedRevenue: Math.max(0, predictedRevenue),
      monthName: new Date(2024, (month - 1) % 12, 1).toLocaleString('default', { month: 'long' })
    });
  }

  return forecast;
}

function calculateForecastConfidence(historicalData) {
  if (historicalData.length < 2) return 'low';

  // Calculate coefficient of variation
  const revenues = historicalData.map(d => d.totalRevenue);
  const mean = revenues.reduce((a, b) => a + b, 0) / revenues.length;
  const variance = revenues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / revenues.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;

  if (cv < 0.2) return 'high';
  if (cv < 0.4) return 'medium';
  return 'low';
}

function generateForecastRecommendations(forecast) {
  const recommendations = [];

  if (forecast.length > 0) {
    const avgGrowth = forecast.reduce((sum, item, index) => {
      if (index === 0) return 0;
      const growth = (item.predictedRevenue - forecast[index - 1].predictedRevenue) / forecast[index - 1].predictedRevenue;
      return sum + growth;
    }, 0) / (forecast.length - 1);

    if (avgGrowth > 0.1) {
      recommendations.push('Strong growth trend - consider increasing sales targets');
    } else if (avgGrowth < -0.05) {
      recommendations.push('Declining trend detected - review sales strategies');
    } else {
      recommendations.push('Stable performance - focus on maintaining current momentum');
    }
  }

  return recommendations;
}

async function calculateLeadScore(client, tenantQuery) {
  let score = 0;
  const breakdown = {};

  // Interaction frequency (25% weight)
  const interactions = await Deal.find({
    ...tenantQuery,
    client: client._id
  }).countDocuments();

  const interactionScore = Math.min(interactions * 10, 25);
  score += interactionScore;
  breakdown.interactionFrequency = interactionScore;

  // Deal history (30% weight)
  const deals = await Deal.find({
    ...tenantQuery,
    client: client._id
  }).lean();

  const wonDeals = deals.filter(d => d.stage === 'won').length;
  const dealScore = wonDeals > 0 ? 30 : Math.min(deals.length * 5, 15);
  score += dealScore;
  breakdown.dealHistory = dealScore;

  // Company size indicator (15% weight)
  const companySizeScore = client.company ? 15 : 5;
  score += companySizeScore;
  breakdown.companySize = companySizeScore;

  // Engagement level based on data completeness (20% weight)
  const fields = ['email', 'phone', 'company', 'industry'];
  const completedFields = fields.filter(field => client[field]).length;
  const engagementScore = (completedFields / fields.length) * 20;
  score += engagementScore;
  breakdown.engagementLevel = engagementScore;

  // Time since last contact (10% weight)
  const lastContactScore = client.updatedAt ?
    Math.max(0, 10 - Math.floor((Date.now() - new Date(client.updatedAt)) / (1000 * 60 * 60 * 24 * 30))) : 0;
  score += lastContactScore;
  breakdown.timeSinceLastContact = lastContactScore;

  return { totalScore: Math.round(score), breakdown };
}

function calculateConversionProbability(score) {
  // Simple logistic function for conversion probability
  const probability = 1 / (1 + Math.exp(-(score - 50) / 15));
  return Math.round(probability * 100);
}

function getRecommendedAction(score, client) {
  if (score >= 80) return 'High priority - Schedule immediate follow-up';
  if (score >= 60) return 'Medium priority - Send personalized proposal';
  if (score >= 40) return 'Low priority - Nurture with educational content';
  return 'Monitor - Limited engagement detected';
}

async function getAgentPerformanceHistory(agentId, tenantId) {
  const sixMonthsAgo = new Date(Date.now() - (6 * 30 * 24 * 60 * 60 * 1000));

  const deals = await Deal.find({
    agent: agentId,
    tenant: tenantId,
    createdAt: { $gte: sixMonthsAgo }
  }).lean();

  const sales = await Sale.find({
    agent: agentId,
    tenant: tenantId,
    saleDate: { $gte: sixMonthsAgo }
  }).lean();

  return {
    totalDeals: deals.length,
    wonDeals: deals.filter(d => d.stage === 'won').length,
    totalSales: sales.length,
    totalRevenue: sales.reduce((sum, s) => sum + s.finalAmount, 0),
    averageDealSize: sales.length > 0 ? sales.reduce((sum, s) => sum + s.finalAmount, 0) / sales.length : 0,
    conversionRate: deals.length > 0 ? (deals.filter(d => d.stage === 'won').length / deals.length) * 100 : 0
  };
}

function predictAgentPerformance(performanceData, agent) {
  const currentScore = agent.performanceScore || 0;

  // Simple trend analysis
  const trend = performanceData.conversionRate > 25 ? 'improving' :
               performanceData.conversionRate < 15 ? 'declining' : 'stable';

  const predictedScore = currentScore * (trend === 'improving' ? 1.1 :
                       trend === 'declining' ? 0.9 : 1.0);

  return {
    predictedScore: Math.round(predictedScore),
    trend: trend,
    confidence: performanceData.totalDeals > 10 ? 'high' : 'medium',
    factors: {
      dealVolume: performanceData.totalDeals,
      conversionRate: performanceData.conversionRate,
      averageDealSize: performanceData.averageDealSize
    }
  };
}

function generatePerformanceRecommendations(prediction, agent) {
  const recommendations = [];

  if (prediction.trend === 'improving') {
    recommendations.push('Continue current strategies - performance is trending upward');
  } else if (prediction.trend === 'declining') {
    recommendations.push('Review sales techniques and seek additional training');
    recommendations.push('Focus on high-quality leads and relationship building');
  }

  if (prediction.predictedScore > 80) {
    recommendations.push('Consider mentoring junior team members');
  } else if (prediction.predictedScore < 50) {
    recommendations.push('Schedule coaching session to improve performance');
  }

  return recommendations;
}

async function calculateChurnRisk(client, tenantQuery) {
  let riskScore = 0;
  const factors = [];
  const actions = [];

  // Time since last interaction
  const daysSinceLastContact = Math.floor((Date.now() - new Date(client.updatedAt)) / (1000 * 60 * 60 * 24));

  if (daysSinceLastContact > 90) {
    riskScore += 40;
    factors.push('No contact in 90+ days');
    actions.push('Schedule immediate follow-up call');
  } else if (daysSinceLastContact > 30) {
    riskScore += 20;
    factors.push('No contact in 30+ days');
    actions.push('Send personalized check-in email');
  }

  // Deal history
  const deals = await Deal.find({
    ...tenantQuery,
    client: client._id
  }).lean();

  if (deals.length === 0) {
    riskScore += 30;
    factors.push('No previous deals');
    actions.push('Offer introductory consultation');
  } else {
    const lostDeals = deals.filter(d => d.stage === 'lost').length;
    if (lostDeals > deals.length / 2) {
      riskScore += 25;
      factors.push('High proportion of lost deals');
      actions.push('Review deal feedback and adjust approach');
    }
  }

  // Status-based risk
  if (client.status === 'inactive') {
    riskScore += 50;
    factors.push('Client marked as inactive');
    actions.push('Reactivation campaign required');
  }

  // Calculate risk level and predicted churn date
  let riskLevel = 'low';
  let predictedDate = null;

  if (riskScore >= 70) {
    riskLevel = 'high';
    predictedDate = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)); // 30 days
  } else if (riskScore >= 40) {
    riskLevel = 'medium';
    predictedDate = new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)); // 90 days
  }

  return {
    score: riskScore,
    level: riskLevel,
    factors: factors,
    actions: actions,
    predictedDate: predictedDate
  };
}

export { router as predictiveAnalyticsRoutes };