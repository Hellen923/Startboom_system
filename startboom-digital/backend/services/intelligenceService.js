// services/intelligenceService.js
// Proactive intelligence and alerts for sales operations

import Client from '../models/Client.js';
import Deal from '../models/Deal.js';
import Activity from '../models/Activity.js';
import Sale from '../models/Sale.js';
import Goal from '../models/Goal.js';
import User from '../models/User.js';

/**
 * Get stale clients (not contacted in X days)
 */
export const getStaleClients = async (tenantId, daysThreshold = 14, filters = {}) => {
  try {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);
    
    const query = {
      tenant: tenantId,
      isActive: true,
      lastContactDate: { $lt: thresholdDate }
    };
    
    // Apply additional filters
    if (filters.userId) query.owner = filters.userId;
    if (filters.teamId) query.team = filters.teamId;
    if (filters.departmentId) query.department = filters.departmentId;
    if (filters.branchId) query.branch = filters.branchId;
    
    const clients = await Client.find(query)
      .populate('owner', 'name email')
      .select('name email phone lastContactDate owner team department branch')
      .sort({ lastContactDate: 1 })
      .limit(100);
    
    return clients.map(client => ({
      clientId: client._id,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone,
      lastContactDate: client.lastContactDate,
      daysSinceContact: Math.floor((new Date() - client.lastContactDate) / (1000 * 60 * 60 * 24)),
      owner: client.owner,
      severity: getDaysSeverity(Math.floor((new Date() - client.lastContactDate) / (1000 * 60 * 60 * 24))),
      recommendation: 'Schedule follow-up call or email'
    }));
  } catch (error) {
    console.error('Get stale clients error:', error);
    throw error;
  }
};

/**
 * Get stuck deals (in same stage for X days)
 */
export const getStuckDeals = async (tenantId, daysThreshold = 45, filters = {}) => {
  try {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);
    
    const query = {
      tenant: tenantId,
      status: 'open',
      stageEntryDate: { $lt: thresholdDate }
    };
    
    if (filters.userId) query.owner = filters.userId;
    if (filters.teamId) query.team = filters.teamId;
    if (filters.departmentId) query.department = filters.departmentId;
    if (filters.branchId) query.branch = filters.branchId;
    
    const deals = await Deal.find(query)
      .populate('owner', 'name email')
      .populate('client', 'name')
      .populate('currentStage')
      .select('title value stage stageEntryDate expectedCloseDate owner client')
      .sort({ stageEntryDate: 1 })
      .limit(100);
    
    return deals.map(deal => ({
      dealId: deal._id,
      dealTitle: deal.title,
      dealValue: deal.value,
      stage: deal.stage,
      stageName: deal.currentStage?.name || deal.stage,
      stageEntryDate: deal.stageEntryDate,
      daysInStage: Math.floor((new Date() - deal.stageEntryDate) / (1000 * 60 * 60 * 24)),
      expectedCloseDate: deal.expectedCloseDate,
      client: deal.client?.name,
      owner: deal.owner,
      severity: getDaysSeverity(Math.floor((new Date() - deal.stageEntryDate) / (1000 * 60 * 60 * 24))),
      recommendation: 'Review deal progress and push forward or disqualify'
    }));
  } catch (error) {
    console.error('Get stuck deals error:', error);
    throw error;
  }
};

/**
 * Get goal progress predictions (likely to exceed or miss targets)
 */
export const getGoalPredictions = async (tenantId, filters = {}) => {
  try {
    const query = {
      tenant: tenantId,
      status: { $in: ['on_track', 'at_risk', 'behind'] },
      isActive: true,
      endDate: { $gte: new Date() } // Only active goals
    };
    
    if (filters.userId) query.user = filters.userId;
    if (filters.teamId) query.team = filters.teamId;
    if (filters.departmentId) query.department = filters.departmentId;
    if (filters.branchId) query.branch = filters.branchId;
    
    const goals = await Goal.find(query)
      .populate('user', 'name email')
      .populate('team', 'name')
      .populate('department', 'name');
    
    const predictions = goals.map(goal => {
      const totalDays = Math.ceil((goal.endDate - goal.startDate) / (1000 * 60 * 60 * 24));
      const daysPassed = Math.ceil((new Date() - goal.startDate) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.ceil((goal.endDate - new Date()) / (1000 * 60 * 60 * 24));
      
      const expectedProgress = (daysPassed / totalDays) * 100;
      const actualProgressPercent = goal.progressPercentage || 0;
      const variance = actualProgressPercent - expectedProgress;
      
      // Predict if target will be met
      let prediction = 'on_track';
      let confidence = 0;
      
      if (variance < -20) {
        prediction = 'will_miss';
        confidence = Math.min(90, Math.abs(variance) * 2);
      } else if (variance < -10) {
        prediction = 'at_risk';
        confidence = Math.min(80, Math.abs(variance) * 3);
      } else if (variance > 15) {
        prediction = 'will_exceed';
        confidence = Math.min(95, variance * 2);
      } else {
        prediction = 'on_track';
        confidence = 70;
      }
      
      return {
        goalId: goal._id,
        goalName: goal.name,
        type: goal.type,
        target: goal.target,
        actual: goal.actual,
        progressPercentage: actualProgressPercent,
        expectedProgress,
        variance,
        daysRemaining,
        prediction,
        confidence,
        user: goal.user,
        team: goal.team,
        department: goal.department,
        recommendation: getGoalRecommendation(prediction, variance, daysRemaining)
      };
    });
    
    return predictions;
  } catch (error) {
    console.error('Get goal predictions error:', error);
    throw error;
  }
};

/**
 * Get overdue tasks/follow-ups
 */
export const getOverdueFollowUps = async (tenantId, filters = {}) => {
  try {
    const query = {
      tenant: tenantId,
      followUpRequired: true,
      followUpDate: { $lt: new Date() },
      isActive: true
    };
    
    if (filters.userId) query.user = filters.userId;
    if (filters.teamId) query.team = filters.teamId;
    if (filters.departmentId) query.department = filters.departmentId;
    if (filters.branchId) query.branch = filters.branchId;
    
    const activities = await Activity.find(query)
      .populate('user', 'name email')
      .populate('entityId')
      .sort({ followUpDate: 1 })
      .limit(100);
    
    return activities.map(activity => ({
      activityId: activity._id,
      title: activity.title,
      type: activity.type,
      entityType: activity.entityType,
      entityName: activity.entityId?.name || activity.entityId?.title,
      followUpDate: activity.followUpDate,
      daysOverdue: Math.floor((new Date() - activity.followUpDate) / (1000 * 60 * 60 * 24)),
      user: activity.user,
      severity: getDaysSeverity(Math.floor((new Date() - activity.followUpDate) / (1000 * 60 * 60 * 24))),
      recommendation: 'Complete follow-up immediately'
    }));
  } catch (error) {
    console.error('Get overdue follow-ups error:', error);
    throw error;
  }
};

/**
 * Get deals approaching close date (next 7 days)
 */
export const getDealsClosingSoon = async (tenantId, daysAhead = 7, filters = {}) => {
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);
    
    const query = {
      tenant: tenantId,
      status: 'open',
      expectedCloseDate: {
        $gte: startDate,
        $lte: endDate
      }
    };
    
    if (filters.userId) query.owner = filters.userId;
    if (filters.teamId) query.team = filters.teamId;
    if (filters.departmentId) query.department = filters.departmentId;
    if (filters.branchId) query.branch = filters.branchId;
    
    const deals = await Deal.find(query)
      .populate('owner', 'name email')
      .populate('client', 'name email phone')
      .populate('currentStage')
      .sort({ expectedCloseDate: 1 });
    
    return deals.map(deal => ({
      dealId: deal._id,
      dealTitle: deal.title,
      dealValue: deal.value,
      stage: deal.stage,
      stageName: deal.currentStage?.name || deal.stage,
      probability: deal.probability || deal.currentStage?.probability || 0,
      expectedCloseDate: deal.expectedCloseDate,
      daysUntilClose: Math.ceil((deal.expectedCloseDate - new Date()) / (1000 * 60 * 60 * 24)),
      client: deal.client,
      owner: deal.owner,
      urgency: getDaysUrgency(Math.ceil((deal.expectedCloseDate - new Date()) / (1000 * 60 * 60 * 24))),
      recommendation: 'Prioritize closing activities and final negotiations'
    }));
  } catch (error) {
    console.error('Get deals closing soon error:', error);
    throw error;
  }
};

/**
 * Get low activity users (below average activity in last 7 days)
 */
export const getLowActivityUsers = async (tenantId, filters = {}) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Get all active users
    const userQuery = {
      tenant: tenantId,
      isActive: true,
      role: { $in: ['agent', 'manager'] }
    };
    
    if (filters.teamId) userQuery.team = filters.teamId;
    if (filters.departmentId) userQuery.department = filters.departmentId;
    if (filters.branchId) userQuery.branch = filters.branchId;
    
    const users = await User.find(userQuery).select('name email role team department');
    
    // Get activity stats for each user
    const userStats = await Promise.all(
      users.map(async (user) => {
        const activityCount = await Activity.countDocuments({
          tenant: tenantId,
          user: user._id,
          completedAt: { $gte: sevenDaysAgo },
          isActive: true
        });
        
        const activityScore = await Activity.aggregate([
          {
            $match: {
              tenant: tenantId,
              user: user._id,
              completedAt: { $gte: sevenDaysAgo },
              isActive: true
            }
          },
          {
            $group: {
              _id: null,
              totalScore: { $sum: '$score' }
            }
          }
        ]);
        
        return {
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          role: user.role,
          activityCount,
          activityScore: activityScore[0]?.totalScore || 0
        };
      })
    );
    
    // Calculate average
    const avgActivityCount = userStats.reduce((sum, stat) => sum + stat.activityCount, 0) / userStats.length;
    const avgActivityScore = userStats.reduce((sum, stat) => sum + stat.activityScore, 0) / userStats.length;
    
    // Filter users below 50% of average
    const lowActivityUsers = userStats
      .filter(stat => stat.activityCount < avgActivityCount * 0.5 || stat.activityScore < avgActivityScore * 0.5)
      .map(stat => ({
        ...stat,
        avgActivityCount: Math.round(avgActivityCount),
        avgActivityScore: Math.round(avgActivityScore),
        variance: Math.round(((stat.activityCount - avgActivityCount) / avgActivityCount) * 100),
        severity: stat.activityCount === 0 ? 'critical' : stat.activityCount < avgActivityCount * 0.3 ? 'high' : 'medium',
        recommendation: stat.activityCount === 0 
          ? 'Check in with user - no activity in 7 days'
          : 'Encourage more client engagement and activity logging'
      }));
    
    return lowActivityUsers.sort((a, b) => a.activityCount - b.activityCount);
  } catch (error) {
    console.error('Get low activity users error:', error);
    throw error;
  }
};

/**
 * Get comprehensive intelligence dashboard
 */
export const getIntelligenceDashboard = async (tenantId, filters = {}) => {
  try {
    const [
      staleClients,
      stuckDeals,
      goalPredictions,
      overdueFollowUps,
      dealsClosingSoon,
      lowActivityUsers
    ] = await Promise.all([
      getStaleClients(tenantId, 14, filters),
      getStuckDeals(tenantId, 45, filters),
      getGoalPredictions(tenantId, filters),
      getOverdueFollowUps(tenantId, filters),
      getDealsClosingSoon(tenantId, 7, filters),
      getLowActivityUsers(tenantId, filters)
    ]);
    
    // Generate priority alerts
    const alerts = [];
    
    // Critical alerts
    if (staleClients.filter(c => c.severity === 'critical').length > 0) {
      alerts.push({
        type: 'stale_clients',
        severity: 'critical',
        count: staleClients.filter(c => c.severity === 'critical').length,
        message: `${staleClients.filter(c => c.severity === 'critical').length} clients not contacted in 30+ days`
      });
    }
    
    if (overdueFollowUps.filter(f => f.severity === 'critical').length > 0) {
      alerts.push({
        type: 'overdue_followups',
        severity: 'critical',
        count: overdueFollowUps.filter(f => f.severity === 'critical').length,
        message: `${overdueFollowUps.filter(f => f.severity === 'critical').length} follow-ups overdue by 7+ days`
      });
    }
    
    if (goalPredictions.filter(g => g.prediction === 'will_miss').length > 0) {
      alerts.push({
        type: 'goals_at_risk',
        severity: 'high',
        count: goalPredictions.filter(g => g.prediction === 'will_miss').length,
        message: `${goalPredictions.filter(g => g.prediction === 'will_miss').length} goals likely to miss target`
      });
    }
    
    if (lowActivityUsers.filter(u => u.severity === 'critical').length > 0) {
      alerts.push({
        type: 'inactive_users',
        severity: 'high',
        count: lowActivityUsers.filter(u => u.severity === 'critical').length,
        message: `${lowActivityUsers.filter(u => u.severity === 'critical').length} users with no activity in 7 days`
      });
    }
    
    return {
      summary: {
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
        highAlerts: alerts.filter(a => a.severity === 'high').length,
        staleClientsCount: staleClients.length,
        stuckDealsCount: stuckDeals.length,
        overdueFollowUpsCount: overdueFollowUps.length,
        dealsClosingSoonCount: dealsClosingSoon.length,
        lowActivityUsersCount: lowActivityUsers.length,
        goalsAtRisk: goalPredictions.filter(g => g.prediction !== 'will_exceed').length
      },
      alerts,
      details: {
        staleClients: staleClients.slice(0, 10), // Top 10
        stuckDeals: stuckDeals.slice(0, 10),
        goalPredictions: goalPredictions.filter(g => g.prediction !== 'on_track'),
        overdueFollowUps: overdueFollowUps.slice(0, 10),
        dealsClosingSoon: dealsClosingSoon.slice(0, 10),
        lowActivityUsers: lowActivityUsers.slice(0, 10)
      }
    };
  } catch (error) {
    console.error('Get intelligence dashboard error:', error);
    throw error;
  }
};

// Helper functions
function getDaysSeverity(days) {
  if (days >= 30) return 'critical';
  if (days >= 14) return 'high';
  if (days >= 7) return 'medium';
  return 'low';
}

function getDaysUrgency(daysRemaining) {
  if (daysRemaining <= 1) return 'critical';
  if (daysRemaining <= 3) return 'high';
  if (daysRemaining <= 7) return 'medium';
  return 'low';
}

function getGoalRecommendation(prediction, variance, daysRemaining) {
  if (prediction === 'will_miss') {
    if (daysRemaining < 7) {
      return 'Goal unlikely to be met. Focus on closing existing opportunities.';
    }
    return 'Significant gap detected. Increase activity and pipeline urgently.';
  }
  
  if (prediction === 'at_risk') {
    return 'Goal at risk. Accelerate activities and focus on high-value opportunities.';
  }
  
  if (prediction === 'will_exceed') {
    return 'Exceeding target. Consider raising goals or supporting team members.';
  }
  
  return 'On track. Maintain current pace and activity levels.';
}

export default {
  getStaleClients,
  getStuckDeals,
  getGoalPredictions,
  getOverdueFollowUps,
  getDealsClosingSoon,
  getLowActivityUsers,
  getIntelligenceDashboard
};
