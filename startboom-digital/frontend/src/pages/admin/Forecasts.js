// Forecasts Dashboard - Revenue forecasting and pipeline analysis
import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Target, Calendar, BarChart3, AlertCircle } from 'lucide-react';
import { forecastApi } from '../../services/enterpriseApi';
import PROFESSIONAL_COLORS from '../../utils/professionalColors';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Forecasts = () => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const [loading, setLoading] = useState(true);
  const [forecasts, setForecasts] = useState([]);
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    fetchForecasts();
  }, [period]);

  const fetchForecasts = async () => {
    try {
      setLoading(true);
      const response = await forecastApi.getAll({ period });
      setForecasts(response.data.forecasts || []);
    } catch (error) {
      console.error('Error fetching forecasts:', error);
      toast.error('Failed to load forecasts');
    } finally {
      setLoading(false);
    }
  };

  const totalForecast = forecasts.reduce((sum, f) => sum + (f.forecastAmount || 0), 0);
  const totalActual = forecasts.reduce((sum, f) => sum + (f.actualAmount || 0), 0);
  const accuracy = totalForecast > 0 ? ((totalActual / totalForecast) * 100).toFixed(1) : 0;

  if (loading) return <LoadingSpinner />;

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Revenue Forecasts
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Weighted pipeline forecasting and revenue predictions
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className={`px-4 py-2 rounded-lg ${isDark ? 'bg-[#1E293B] text-white' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Forecast" value={`$${totalForecast.toLocaleString()}`} icon={TrendingUp} gradient={PROFESSIONAL_COLORS.gradients.blue} isDark={isDark} />
        <StatCard title="Actual Revenue" value={`$${totalActual.toLocaleString()}`} icon={DollarSign} gradient={PROFESSIONAL_COLORS.gradients.green} isDark={isDark} />
        <StatCard title="Accuracy" value={`${accuracy}%`} icon={Target} gradient={PROFESSIONAL_COLORS.gradients.purple} isDark={isDark} />
        <StatCard title="Forecasts" value={forecasts.length} icon={BarChart3} gradient={PROFESSIONAL_COLORS.gradients.orange} isDark={isDark} />
      </div>

      <div className={`rounded-xl p-6 ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg`}>
        <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Forecast Details
        </h2>
        <div className="space-y-4">
          {forecasts.map(forecast => (
            <div key={forecast._id} className={`p-4 rounded-lg ${isDark ? 'bg-[#334155]' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {forecast.name || 'Forecast'}
                </h3>
                <span className={`px-3 py-1 rounded text-sm ${
                  forecast.accuracy >= 90 ? 'bg-green-100 text-green-800' :
                  forecast.accuracy >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                  {forecast.accuracy}% accurate
                </span>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Forecast</p>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>${forecast.forecastAmount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Actual</p>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>${forecast.actualAmount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Variance</p>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>${Math.abs((forecast.forecastAmount || 0) - (forecast.actualAmount || 0)).toLocaleString()}</p>
                </div>
                <div>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Period</p>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'} capitalize`}>{forecast.period}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, gradient, isDark }) => (
  <div className="rounded-xl p-6" style={{ background: isDark ? gradient : 'white', border: isDark ? 'none' : '1px solid #E5E7EB' }}>
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-lg ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
        <Icon className="w-5 h-5" style={{ color: isDark ? 'white' : PROFESSIONAL_COLORS.primary.main }} />
      </div>
    </div>
    <p className={`text-sm mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{title}</p>
    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
  </div>
);

export default Forecasts;
