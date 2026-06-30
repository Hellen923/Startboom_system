import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Target, AlertTriangle, BarChart3, PieChart, Activity, Zap } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// import { predictiveAnalyticsAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Mock API for development
const predictiveAnalyticsAPI = {
  getSalesForecast: async (params = {}) => {
    console.log('Mock: getSalesForecast called with params:', params);
    // Mock sales forecast data
    return {
      data: {
        historicalData: [
          { _id: { year: 2024, month: 1 }, totalRevenue: 45000, totalDeals: 12 },
          { _id: { year: 2024, month: 2 }, totalRevenue: 52000, totalDeals: 15 },
          { _id: { year: 2024, month: 3 }, totalRevenue: 48000, totalDeals: 13 },
          { _id: { year: 2024, month: 4 }, totalRevenue: 61000, totalDeals: 18 },
          { _id: { year: 2024, month: 5 }, totalRevenue: 55000, totalDeals: 16 }
        ],
        forecast: [
          { month: 7, predictedRevenue: 58000, monthName: 'July' },
          { month: 8, predictedRevenue: 62000, monthName: 'August' },
          { month: 9, predictedRevenue: 59000, monthName: 'September' },
          { month: 10, predictedRevenue: 65000, monthName: 'October' },
          { month: 11, predictedRevenue: 68000, monthName: 'November' },
          { month: 12, predictedRevenue: 72000, monthName: 'December' }
        ],
        confidence: 'high',
        recommendations: [
          'Strong growth trend - consider increasing sales targets',
          'Focus on high-value deals to maintain momentum'
        ]
      }
    };
  },
  getLeadScoring: async () => {
    console.log('Mock: getLeadScoring called');
    return {
      data: {
        leads: [
          {
            _id: '1',
            name: 'John Smith',
            company: 'TechCorp Inc',
            leadScore: 85,
            conversionProbability: 78,
            recommendedAction: 'High priority - Schedule immediate follow-up',
            scoreBreakdown: {
              interactionFrequency: 22,
              dealHistory: 28,
              companySize: 15,
              engagementLevel: 16,
              timeSinceLastContact: 4
            }
          },
          {
            _id: '2',
            name: 'Sarah Johnson',
            company: 'StartupXYZ',
            leadScore: 72,
            conversionProbability: 65,
            recommendedAction: 'Medium priority - Send personalized proposal',
            scoreBreakdown: {
              interactionFrequency: 18,
              dealHistory: 24,
              companySize: 12,
              engagementLevel: 14,
              timeSinceLastContact: 4
            }
          }
        ],
        scoringCriteria: {
          interactionFrequency: 'Weight: 25%',
          dealHistory: 'Weight: 30%',
          companySize: 'Weight: 15%',
          engagementLevel: 'Weight: 20%',
          timeSinceLastContact: 'Weight: 10%'
        }
      }
    };
  },
  getPerformancePrediction: async (agentId) => {
    console.log('Mock: getPerformancePrediction called for agent:', agentId);
    return {
      data: {
        agent: { id: agentId, name: 'Sales Agent', currentPerformance: 75 },
        prediction: {
          predictedScore: 82,
          trend: 'improving',
          confidence: 'high',
          factors: {
            dealVolume: 24,
            conversionRate: 68,
            averageDealSize: 12500
          }
        },
        recommendations: [
          'Continue current strategies - performance is trending upward',
          'Focus on maintaining high conversion rates'
        ]
      }
    };
  },
  getChurnPrediction: async () => {
    console.log('Mock: getChurnPrediction called');
    return {
      data: {
        predictions: [
          {
            clientId: '1',
            clientName: 'ABC Corp',
            churnRisk: 85,
            riskLevel: 'high',
            riskFactors: ['No contact in 90+ days', 'High proportion of lost deals'],
            recommendedActions: ['Schedule immediate follow-up call', 'Send reactivation email'],
            predictedChurnDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          },
          {
            clientId: '2',
            clientName: 'XYZ Ltd',
            churnRisk: 45,
            riskLevel: 'medium',
            riskFactors: ['No contact in 30+ days'],
            recommendedActions: ['Send personalized check-in email'],
            predictedChurnDate: null
          }
        ],
        summary: {
          highRisk: 1,
          mediumRisk: 1,
          lowRisk: 3
        }
      }
    };
  }
};

const PredictiveAnalytics = () => {
  const [activeTab, setActiveTab] = useState('forecast');
  const [salesForecast, setSalesForecast] = useState(null);
  const [leadScoring, setLeadScoring] = useState(null);
  const [churnPrediction, setChurnPrediction] = useState(null);
  const [performancePrediction, setPerformancePrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllAnalytics();
  }, []);

  const loadAllAnalytics = async () => {
    setLoading(true);
    try {
      const [forecastRes, leadsRes, churnRes, performanceRes] = await Promise.all([
        predictiveAnalyticsAPI.getSalesForecast(),
        predictiveAnalyticsAPI.getLeadScoring(),
        predictiveAnalyticsAPI.getChurnPrediction(),
        predictiveAnalyticsAPI.getPerformancePrediction('current-user')
      ]);

      setSalesForecast(forecastRes.data);
      setLeadScoring(leadsRes.data);
      setChurnPrediction(churnRes.data);
      setPerformancePrediction(performanceRes.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load predictive analytics');
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="py-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD700] mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading predictive analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-1">Predictive Analytics</h2>
            <p className="text-gray-600 mb-0">AI-powered insights for strategic decision making</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadAllAnalytics}
              className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 flex items-center"
            >
              <Zap className="mr-2" size={16} />
              Refresh Insights
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'forecast', label: 'Sales Forecast', icon: TrendingUp },
            { id: 'leads', label: 'Lead Scoring', icon: Target },
            { id: 'churn', label: 'Churn Prediction', icon: AlertTriangle },
            { id: 'performance', label: 'Performance Prediction', icon: Activity }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="mr-2" size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Forecast Tab */}
      {activeTab === 'forecast' && salesForecast && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <TrendingUp className="text-green-500 mr-3" size={24} />
                <div>
                  <h4 className="text-lg font-semibold">
                    ${salesForecast.forecast[0]?.predictedRevenue?.toLocaleString() || '0'}
                  </h4>
                  <p className="text-gray-600 text-sm">Next Month Forecast</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <BarChart3 className="text-blue-500 mr-3" size={24} />
                <div>
                  <h4 className="text-lg font-semibold capitalize">{salesForecast.confidence}</h4>
                  <p className="text-gray-600 text-sm">Forecast Confidence</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <Activity className="text-purple-500 mr-3" size={24} />
                <div>
                  <h4 className="text-lg font-semibold">
                    ${salesForecast.forecast.reduce((sum, item) => sum + item.predictedRevenue, 0).toLocaleString()}
                  </h4>
                  <p className="text-gray-600 text-sm">6-Month Projection</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Sales Forecast Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesForecast.forecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthName" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Predicted Revenue']} />
                <Line type="monotone" dataKey="predictedRevenue" stroke="#FFD700" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {salesForecast.recommendations && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">AI Recommendations</h4>
              <ul className="space-y-1">
                {salesForecast.recommendations.map((rec, index) => (
                  <li key={index} className="text-blue-800 text-sm">• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Lead Scoring Tab */}
      {activeTab === 'leads' && leadScoring && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Lead Scoring Dashboard</h3>
              <p className="text-gray-600 text-sm">AI-powered lead prioritization</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversion Probability</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recommended Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leadScoring.leads.map(lead => (
                    <tr key={lead._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{lead.name}</div>
                          <div className="text-gray-500 text-sm">{lead.company}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            lead.leadScore >= 80 ? 'bg-green-100 text-green-800' :
                            lead.leadScore >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {lead.leadScore}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{lead.conversionProbability}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${lead.conversionProbability}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {lead.recommendedAction}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Churn Prediction Tab */}
      {activeTab === 'churn' && churnPrediction && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <AlertTriangle className="text-red-500 mr-3" size={24} />
                <div>
                  <h4 className="text-lg font-semibold text-red-600">{churnPrediction.summary.highRisk}</h4>
                  <p className="text-gray-600 text-sm">High Risk Clients</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <AlertTriangle className="text-yellow-500 mr-3" size={24} />
                <div>
                  <h4 className="text-lg font-semibold text-yellow-600">{churnPrediction.summary.mediumRisk}</h4>
                  <p className="text-gray-600 text-sm">Medium Risk Clients</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <Users className="text-green-500 mr-3" size={24} />
                <div>
                  <h4 className="text-lg font-semibold text-green-600">{churnPrediction.summary.lowRisk}</h4>
                  <p className="text-gray-600 text-sm">Low Risk Clients</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Churn Risk Assessment</h3>
            </div>
            <div className="p-6 space-y-4">
              {churnPrediction.predictions.map(prediction => (
                <div key={prediction.clientId} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{prediction.clientName}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                        prediction.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                        prediction.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {prediction.riskLevel.toUpperCase()} RISK
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600">{prediction.churnRisk}%</div>
                      <div className="text-sm text-gray-500">Risk Score</div>
                    </div>
                  </div>

                  {prediction.riskFactors.length > 0 && (
                    <div className="mb-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Risk Factors:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {prediction.riskFactors.map((factor, index) => (
                          <li key={index}>• {factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {prediction.recommendedActions.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-green-700 mb-2">Recommended Actions:</h5>
                      <ul className="text-sm text-green-600 space-y-1">
                        {prediction.recommendedActions.map((action, index) => (
                          <li key={index}>• {action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance Prediction Tab */}
      {activeTab === 'performance' && performancePrediction && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <Activity className="text-blue-500 mr-3" size={24} />
                <div>
                  <h4 className="text-lg font-semibold">{performancePrediction.prediction.predictedScore}</h4>
                  <p className="text-gray-600 text-sm">Predicted Performance Score</p>
                </div>
              </div>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  performancePrediction.prediction.trend === 'improving' ? 'bg-green-100 text-green-800' :
                  performancePrediction.prediction.trend === 'declining' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {performancePrediction.prediction.trend.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <Target className="text-green-500 mr-3" size={24} />
                <div>
                  <h4 className="text-lg font-semibold">{performancePrediction.agent.currentPerformance}</h4>
                  <p className="text-gray-600 text-sm">Current Performance Score</p>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Confidence: {performancePrediction.prediction.confidence}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Factors</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {performancePrediction.prediction.factors.dealVolume}
                </div>
                <div className="text-sm text-gray-600">Total Deals</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {performancePrediction.prediction.factors.conversionRate}%
                </div>
                <div className="text-sm text-gray-600">Conversion Rate</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  ${performancePrediction.prediction.factors.averageDealSize.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Avg Deal Size</div>
              </div>
            </div>
          </div>

          {performancePrediction.recommendations && (
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">AI Recommendations</h4>
              <ul className="space-y-1">
                {performancePrediction.recommendations.map((rec, index) => (
                  <li key={index} className="text-green-800 text-sm">• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PredictiveAnalytics;