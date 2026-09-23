// Custom Report Builder - Build and execute custom reports
import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit2, Trash2, Play, Copy, Download } from 'lucide-react';
import { customReportApi } from '../../services/enterpriseApi';
import PROFESSIONAL_COLORS from '../../utils/professionalColors';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const CustomReports = () => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [reportResults, setReportResults] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await customReportApi.getAll();
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error(error.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (id) => {
    try {
      toast.loading('Executing report...', { id: 'execute' });
      const result = await customReportApi.execute(id);
      toast.success('Report executed successfully', { id: 'execute' });
      
      // Show results in modal
      setReportResults(result.data);
      setShowResultsModal(true);
    } catch (error) {
      console.error('Execute error:', error);
      toast.error(error.response?.data?.message || 'Failed to execute report', { id: 'execute' });
    }
  };

  const handleExport = async (id, format = 'csv') => {
    try {
      toast.loading(`Generating ${format.toUpperCase()}...`, { id: 'export' });
      const result = await customReportApi.execute(id);
      
      if (format === 'csv') {
        const csvContent = convertToCSV(result.data);
        downloadFile(csvContent, `report-${id}.csv`, 'text/csv');
      } else if (format === 'json') {
        const jsonContent = JSON.stringify(result.data, null, 2);
        downloadFile(jsonContent, `report-${id}.json`, 'application/json');
      }
      
      toast.success(`${format.toUpperCase()} exported successfully`, { id: 'export' });
    } catch (error) {
      toast.error('Failed to export report', { id: 'export' });
    }
  };

  const convertToCSV = (data) => {
    if (!data || !data.results || data.results.length === 0) return '';
    
    const headers = Object.keys(data.results[0]);
    const rows = data.results.map(row => 
      headers.map(header => JSON.stringify(row[header] || '')).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    try {
      await customReportApi.delete(id);
      toast.success('Report deleted');
      fetchReports();
    } catch (error) {
      toast.error('Failed to delete report');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Custom Report Builder
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Build and execute custom reports with advanced filtering
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Reports" value={reports.length} icon={FileText} gradient={PROFESSIONAL_COLORS.gradients.blue} isDark={isDark} />
        <StatCard title="Scheduled" value={reports.filter(r => r.schedule).length} icon={FileText} gradient={PROFESSIONAL_COLORS.gradients.green} isDark={isDark} />
        <StatCard title="Executions" value={reports.reduce((sum, r) => sum + (r.executionCount || 0), 0)} icon={FileText} gradient={PROFESSIONAL_COLORS.gradients.purple} isDark={isDark} />
      </div>

      <div className={`rounded-xl p-6 ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg`}>
        <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Reports ({reports.length})
        </h2>
        
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              No reports yet
            </h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Create your first custom report to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors"
            >
              Create First Report
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(report => (
              <div key={report._id} className={`p-4 rounded-lg ${isDark ? 'bg-[#334155]' : 'bg-gray-50'} flex items-center justify-between`}>
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: `${PROFESSIONAL_COLORS.primary.main}20` }}>
                    <FileText className="w-5 h-5" style={{ color: PROFESSIONAL_COLORS.primary.main }} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{report.name}</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{report.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {report.dataSource?.entity || 'Unknown'} report
                      </span>
                      {report.stats?.runs > 0 && (
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          • {report.stats.runs} executions
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleExecute(report._id)}
                    className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
                    title="Execute Report"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleExport(report._id, 'csv')}
                    className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                    title="Export as CSV"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(report._id)}
                    className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                    title="Delete Report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Report Modal */}
      {showCreateModal && (
        <CreateReportModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchReports();
          }}
          isDark={isDark}
        />
      )}

      {/* Results Modal */}
      {showResultsModal && reportResults && (
        <ResultsModal
          isOpen={showResultsModal}
          onClose={() => {
            setShowResultsModal(false);
            setReportResults(null);
          }}
          results={reportResults}
          isDark={isDark}
        />
      )}
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

// Create Report Modal Component
const CreateReportModal = ({ isOpen, onClose, onSuccess, isDark }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'summary',
    dataSource: {
      entity: 'Sale',
      fields: [],
      filters: [],
      dateRange: { type: 'this_month' },
      sortBy: [],
      limit: 1000
    }
  });
  const [submitting, setSubmitting] = useState(false);

  const entities = ['Sale', 'Deal', 'Client', 'User', 'Product', 'Activity', 'Goal'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter a report name');
      return;
    }

    setSubmitting(true);
    try {
      await customReportApi.create(formData);
      toast.success('Report created successfully!');
      onSuccess();
    } catch (error) {
      console.error('Create error:', error);
      toast.error(error.response?.data?.message || 'Failed to create report');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${isDark ? 'bg-[#1E293B]' : 'bg-white'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Create New Report
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Report Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-[#334155] border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                placeholder="e.g., Monthly Sales Report"
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-[#334155] border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                placeholder="What does this report show?"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Report Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-[#334155] border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  <option value="summary">Summary</option>
                  <option value="detailed">Detailed</option>
                  <option value="comparison">Comparison</option>
                  <option value="trend">Trend</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Data Source
                </label>
                <select
                  value={formData.dataSource.entity}
                  onChange={(e) => setFormData({
                    ...formData,
                    dataSource: { ...formData.dataSource, entity: e.target.value }
                  })}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-[#334155] border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  {entities.map(entity => (
                    <option key={entity} value={entity}>{entity}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Date Range
              </label>
              <select
                value={formData.dataSource.dateRange.type}
                onChange={(e) => setFormData({
                  ...formData,
                  dataSource: {
                    ...formData.dataSource,
                    dateRange: { type: e.target.value }
                  }
                })}
                className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-[#334155] border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
                <option value="last_week">Last Week</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_quarter">This Quarter</option>
                <option value="this_year">This Year</option>
                <option value="all_time">All Time</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className={`px-6 py-2 rounded-lg border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Results Modal Component
const ResultsModal = ({ isOpen, onClose, results, isDark }) => {
  if (!isOpen || !results) return null;

  const data = results.data || results.results || [];
  const metadata = results.metadata || {};

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col ${isDark ? 'bg-[#1E293B]' : 'bg-white'}`}>
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Report Results
              </h2>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {metadata.totalRecords || 0} records • Generated in {metadata.executionTime || 0}ms
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {data.length === 0 ? (
            <div className="text-center py-12">
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No data found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={`sticky top-0 ${isDark ? 'bg-[#334155]' : 'bg-gray-50'}`}>
                  <tr>
                    {Object.keys(data[0]).map(key => (
                      <th key={key} className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {data.map((row, idx) => (
                    <tr key={idx} className={`hover:bg-gray-800/30`}>
                      {Object.values(row).map((value, i) => (
                        <td key={i} className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomReports;
