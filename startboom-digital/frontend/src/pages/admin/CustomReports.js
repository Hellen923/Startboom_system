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
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (id) => {
    try {
      const result = await customReportApi.execute(id);
      toast.success('Report executed successfully');
      // Display results or download
      if (result.data) {
        console.log('Report results:', result.data);
      }
    } catch (error) {
      toast.error('Failed to execute report');
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
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleExecute(report._id)}
                  className="p-2 rounded-lg bg-indigo-100 text-[var(--primary-color)] hover:bg-indigo-200"
                  title="Execute Report"
                >
                  <Play className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleExport(report._id, 'csv')}
                  className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200"
                  title="Export as CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(report._id)}
                  className="p-2 rounded-lg hover:bg-red-100 text-red-600"
                  title="Delete Report"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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

export default CustomReports;
