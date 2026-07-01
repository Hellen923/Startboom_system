import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Download, Filter, Calendar, Users, TrendingUp, TrendingDown,
  DollarSign, ShoppingBag, BarChart3, RefreshCw, ChevronDown, ChevronRight,
  CreditCard, Banknote, Briefcase, CalendarCheck, CheckCircle, XCircle,
  FileText, User as UserIcon, Phone, Mail, MapPin, Building
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { usersAPI, reportsAPI, clientsAPI, dealsAPI, salesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Reports = () => {
  // Filter State
  const [filters, setFilters] = useState({
    start: '',
    end: '',
    agent: ''
  });

  // Data State
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [agentsList, setAgentsList] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [detailedData, setDetailedData] = useState({
    clients: [],
    deals: [],
    sales: [],
    agents: []
  });
  const [pagination, setPagination] = useState({
    sales: { page: 1, limit: 10, total: 0 },
    deals: { page: 1, limit: 10, total: 0 },
    agents: { page: 1, limit: 10, total: 0 }
  });

  // Helper Date Functions
  const setPeriod = (period) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (period === 'thisMonth') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (period === 'lastMonth') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (period === 'thisYear') {
      start = new Date(today.getFullYear(), 0, 1);
      end = today;
    }

    setFilters({
      ...filters,
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  };

  // Load Reports Data
  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.start) params.start = filters.start;
      if (filters.end) params.end = filters.end;
      if (filters.agent) params.agent = filters.agent;

      const res = await reportsAPI.getAnalytics(params);
      setReportData(res.data);

      // Fetch detailed data with high limit to get all records
      const [clientsRes, dealsRes, salesRes, agentsRes] = await Promise.allSettled([
        clientsAPI.getAll({ limit: 10000, ...params }),
        dealsAPI.getAll({ limit: 10000, ...params }),
        salesAPI.getAll({ limit: 10000, ...params }),
        usersAPI.getAll()
      ]);

      const clients = clientsRes.status === 'fulfilled' ? (clientsRes.value.data?.clients || clientsRes.value.data || []) : [];
      const deals = dealsRes.status === 'fulfilled' ? (dealsRes.value.data?.deals || dealsRes.value.data || []) : [];
      const sales = salesRes.status === 'fulfilled' ? (salesRes.value.data?.sales || salesRes.value.data || []) : [];
      const agents = agentsRes.status === 'fulfilled' ? (agentsRes.value.data?.filter(u => u.role === 'agent') || []) : [];

      setDetailedData({
        clients: Array.isArray(clients) ? clients : [],
        deals: Array.isArray(deals) ? deals : [],
        sales: Array.isArray(sales) ? sales : [],
        agents: Array.isArray(agents) ? agents : []
      });

      // Set pagination totals
      setPagination(prev => ({
        sales: { ...prev.sales, total: Array.isArray(sales) ? sales.length : 0 },
        deals: { ...prev.deals, total: Array.isArray(deals) ? deals.length : 0 },
        agents: { ...prev.agents, total: Array.isArray(agents) ? agents.length : 0 }
      }));
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load Agents List
  const loadAgents = async () => {
    try {
      const res = await usersAPI.getAll();
      const agents = res.data?.filter(u => u.role === 'agent') || [];
      setAgentsList(agents);
    } catch (error) {
      console.error('Failed to load agents:', error);
      toast.error('Failed to load agents list');
    }
  };

  // Initial Load
  useEffect(() => {
    loadReports();
    loadAgents();
  }, []);

  // Export to CSV (Tables Only)
  const handleExportCSV = () => {
    try {
      let csvContent = 'CRM SALES & DEALS REPORT\n';
      csvContent += `Generated: ${new Date().toLocaleString()}\n`;
      if (filters.start && filters.end) {
        csvContent += `Period: ${filters.start} to ${filters.end}\n`;
      }
      csvContent += '\n\n';

      // Sales Table
      csvContent += '=== SALES TRANSACTIONS ===\n';
      csvContent += 'Date,Customer Name,Agent Name,Amount,Payment Method\n';
      detailedData.sales.forEach(sale => {
        const date = new Date(sale.saleDate || sale.createdAt).toLocaleDateString();
        const customer = sale.customerName || 'Unknown';
        const agent = getAgentFromSale(sale);
        const amount = Number(sale.finalAmount || sale.totalAmount || 0);
        const method = sale.paymentMethod || 'Unknown';
        csvContent += `"${date}","${customer}","${agent}",${amount},"${method}"\n`;
      });
      csvContent += '\n\n';

      // Agents Performance Table
      csvContent += '=== AGENTS PERFORMANCE ===\n';
      csvContent += 'Agent Name,Email,Phone,Total Sales,Revenue,Total Deals,Won Deals,Lost Deals,Win Rate %,Total Clients\n';
      getSortedAgents().forEach(agent => {
        const phone = agent.phone || 'Not Provided';
        const revenue = agent.revenue || 0;
        const total = agent.deals.length || 0;
        const won = agent.dealsWon || 0;
        const lost = agent.dealsLost || 0;
        const rate = agent.conversionRate || 0;
        const clients = agent.clients.length || 0;
        csvContent += `"${agent.name}","${agent.email}","${phone}",${agent.sales.length},${revenue},${total},${won},${lost},${rate},${clients}\n`;
      });
      csvContent += '\n\n';

      // Deals Table
      csvContent += '=== ALL DEALS ===\n';
      csvContent += 'Date,Deal Title,Client Name,Agent Name,Value,Stage\n';
      detailedData.deals.forEach(deal => {
        const date = new Date(deal.createdAt).toLocaleDateString();
        const title = deal.title || 'Unknown';
        const client = getClientName(deal.client);
        const agent = getAgentFromDeal(deal);
        const value = Number(deal.value || 0);
        const stage = deal.stage || 'Unknown';
        csvContent += `"${date}","${title}","${client}","${agent}",${value},"${stage}"\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `crm-report-tables-${new Date().toLocaleDateString()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Tables exported to CSV successfully');
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('Failed to export CSV');
    }
  };

  const handlePDFDownload = async () => {
    if (!reportData || !detailedData.agents.length) {
      toast.error('No data available for PDF export');
      return;
    }

    try {
      toast.loading('Generating comprehensive PDF report...');
      
      // Create a temporary container for the entire report
      const element = document.getElementById('reports-container');
      if (!element) {
        toast.error('Report container not found');
        return;
      }

      // Generate canvas from the entire report
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      // Create PDF with proper dimensions
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add title page
      pdf.setFontSize(20);
      pdf.setTextColor(33, 37, 41);
      pdf.text('Sales Analytics Report', pdf.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setTextColor(75, 85, 99);
      const dateRange = filters.start && filters.end 
        ? `${filters.start} to ${filters.end}` 
        : 'All Time';
      pdf.text(`Period: ${dateRange}`, pdf.internal.pageSize.getWidth() / 2, 45, { align: 'center' });
      pdf.text(`Generated: ${new Date().toLocaleString()}`, pdf.internal.pageSize.getWidth() / 2, 55, { align: 'center' });
      
      // Add summary stats on first page
      pdf.setFontSize(14);
      pdf.setTextColor(33, 37, 41);
      pdf.text('Summary Statistics', 20, 80);
      
      pdf.setFontSize(10);
      pdf.setTextColor(55, 65, 81);
      const summaryStats = [
        `Total Revenue: UGX ${(reportData.summary?.totalRevenue || 0).toLocaleString()}`,
        `Total Sales: ${reportData.summary?.totalSales || 0}`,
        `Cash Sales: UGX ${(reportData.summary?.cashSalesAmount || 0).toLocaleString()}`,
        `Credit Sales: UGX ${(reportData.summary?.creditSalesAmount || 0).toLocaleString()}`,
        `Deals Won: ${reportData.summary?.dealsWon || 0}`,
        `Deals Lost: ${reportData.summary?.dealsLost || 0}`,
        `Clients Met: ${reportData.summary?.clientsMet || 0}`
      ];
      
      let yPos = 95;
      summaryStats.forEach(stat => {
        if (yPos > pageHeight - 20) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.text(stat, 20, yPos);
        yPos += 8;
      });

      // Add new page for the full report image
      pdf.addPage();
      
      // Add the full report as an image
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Save the PDF
      pdf.save(`comprehensive-sales-report-${new Date().toLocaleDateString()}.pdf`);
      toast.success('Comprehensive PDF report generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report');
    }
  };

  const getAgentName = (agentIdOrObj) => {
    if (!agentIdOrObj) return 'Not Assigned';
    
    // If it's an object (already populated), return the name directly
    if (typeof agentIdOrObj === 'object' && agentIdOrObj.name) {
      return agentIdOrObj.name;
    }
    
    // If it's an ID string, look it up
    if (typeof agentIdOrObj === 'string') {
      const agent = detailedData.agents.find(a => a._id === agentIdOrObj);
      return agent ? agent.name : 'Unknown Agent';
    }
    
    return 'Unknown Agent';
  };

  const getAgentEmail = (agentIdOrObj) => {
    if (!agentIdOrObj) return 'not.assigned@example.com';
    
    // If it's an object (already populated), return the email directly
    if (typeof agentIdOrObj === 'object' && agentIdOrObj.email) {
      return agentIdOrObj.email;
    }
    
    // If it's an ID string, look it up
    if (typeof agentIdOrObj === 'string') {
      const agent = detailedData.agents.find(a => a._id === agentIdOrObj);
      return agent ? agent.email : 'unknown@example.com';
    }
    
    return 'unknown@example.com';
  };

  const getClientName = (clientIdOrObj) => {
    if (!clientIdOrObj) return 'Unknown Client';
    
    // If it's an object (already populated), return the name directly
    if (typeof clientIdOrObj === 'object' && clientIdOrObj.name) {
      return clientIdOrObj.name;
    }
    
    // If it's an ID string, look it up
    if (typeof clientIdOrObj === 'string') {
      const client = detailedData.clients.find(c => c._id === clientIdOrObj);
      return client ? client.name : 'Unknown Client';
    }
    
    return 'Unknown Client';
  };

  const getClientEmail = (clientIdOrObj) => {
    if (!clientIdOrObj) return 'unknown.client@example.com';
    
    // If it's an object (already populated), return the email directly
    if (typeof clientIdOrObj === 'object' && clientIdOrObj.email) {
      return clientIdOrObj.email;
    }
    
    // If it's an ID string, look it up
    if (typeof clientIdOrObj === 'string') {
      const client = detailedData.clients.find(c => c._id === clientIdOrObj);
      return client ? client.email : 'unknown.client@example.com';
    }
    
    return 'unknown.client@example.com';
  };

  const getClientPhone = (clientIdOrObj) => {
    if (!clientIdOrObj) return 'Not Available';
    
    // If it's an object (already populated), return the phone directly
    if (typeof clientIdOrObj === 'object' && clientIdOrObj.phone) {
      return clientIdOrObj.phone;
    }
    
    // If it's an ID string, look it up
    if (typeof clientIdOrObj === 'string') {
      const client = detailedData.clients.find(c => c._id === clientIdOrObj);
      return client ? client.phone : 'Not Available';
    }
    
    return 'Not Available';
  };

  const getAgentFromSale = (sale) => {
    // If sale has agent info directly, use it
    if (sale.agent) {
      return getAgentName(sale.agent);
    }
    // If sale has createdBy field, use that
    if (sale.createdBy) {
      return getAgentName(sale.createdBy);
    }
    // If sale has agent name directly, use it
    if (sale.agentName) {
      return sale.agentName;
    }
    return 'Unknown Agent';
  };

  const getAgentFromDeal = (deal) => {
    // If deal has agent info directly, use it
    if (deal.agent) {
      return getAgentName(deal.agent);
    }
    // If deal has createdBy field, use that
    if (deal.createdBy) {
      return getAgentName(deal.createdBy);
    }
    // If deal has agent name directly, use it
    if (deal.agentName) {
      return deal.agentName;
    }
    return 'Unknown Agent';
  };

  const handlePageChange = (table, page) => {
    setPagination(prev => ({
      ...prev,
      [table]: { ...prev[table], page }
    }));
  };

  const getPaginatedData = (data, table) => {
    const { page, limit } = pagination[table];
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return data.slice(startIndex, endIndex);
  };

  const getSortedAgents = () => {
    return detailedData.agents.filter(agent => agent && agent._id).map((agent) => {
      const agentId = agent._id?.toString();

      const agentSales = detailedData.sales.filter(s => {
        if (!s.agent) return false;
        if (typeof s.agent === 'object' && s.agent !== null) {
          return s.agent._id?.toString() === agentId;
        }
        return s.agent?.toString() === agentId;
      });

      const agentRevenue = agentSales.reduce((sum, s) => sum + Number(s.finalAmount || s.totalAmount || 0), 0);

      const agentDeals = detailedData.deals.filter(d => {
        if (!d.agent) return false;
        if (typeof d.agent === 'object' && d.agent !== null) {
          return d.agent._id?.toString() === agentId;
        }
        return d.agent?.toString() === agentId;
      });

      const agentDealsWon = agentDeals.filter(d => d.stage === 'won').length;
      const agentDealsLost = agentDeals.filter(d => d.stage === 'lost').length;

      const agentClients = detailedData.clients.filter(c => {
        if (!c.agent) return false;
        if (typeof c.agent === 'object' && c.agent !== null) {
          return c.agent._id?.toString() === agentId;
        }
        return c.agent?.toString() === agentId;
      });

      const conversionRate = agentDeals.length > 0 ? ((agentDealsWon / agentDeals.length) * 100).toFixed(1) : 0;

      return {
        ...agent,
        sales: agentSales,
        revenue: agentRevenue,
        deals: agentDeals,
        dealsWon: agentDealsWon,
        dealsLost: agentDealsLost,
        clients: agentClients,
        conversionRate: parseFloat(conversionRate)
      };
    }).sort((a, b) => b.dealsWon - a.dealsWon);
  };

  const toggleRowExpand = (weekStart) => {
    setExpandedRows(prev => ({
      ...prev,
      [weekStart]: !prev[weekStart]
    }));
  };

  // Generate weekly sales trend data
  const getWeeklySalesTrend = () => {
    const weeklyData = {};
    
    detailedData.sales.forEach(sale => {
      const saleDate = new Date(sale.saleDate || sale.createdAt);
      const dayOfWeek = saleDate.getDay();
      const diff = saleDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const weekStart = new Date(saleDate.setDate(diff));
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          week: new Date(weekStart).toLocaleDateString(),
          sales: 0,
          revenue: 0,
          cashSales: 0,
          creditSales: 0,
          cashAmount: 0,
          creditAmount: 0
        };
      }

      weeklyData[weekKey].sales += 1;
      weeklyData[weekKey].revenue += Number(sale.finalAmount || sale.totalAmount || 0);
      
      if (sale.paymentMethod === 'cash') {
        weeklyData[weekKey].cashSales += 1;
        weeklyData[weekKey].cashAmount += Number(sale.finalAmount || sale.totalAmount || 0);
      } else if (sale.paymentMethod === 'credit') {
        weeklyData[weekKey].creditSales += 1;
        weeklyData[weekKey].creditAmount += Number(sale.finalAmount || sale.totalAmount || 0);
      }
    });

    return Object.values(weeklyData).sort((a, b) => new Date(a.week) - new Date(b.week));
  };

  // Calculate live summary stats from database
  const calculateSummaryStats = () => {
    const totalSales = detailedData.sales.length;
    const totalRevenue = detailedData.sales.reduce((sum, s) => sum + (Number(s.finalAmount || s.totalAmount || 0)), 0);
    const dealsWon = detailedData.deals.filter(d => d.stage === 'won').length;
    const dealsLost = detailedData.deals.filter(d => d.stage === 'lost').length;
    
    const cashSales = detailedData.sales.filter(s => s.paymentMethod === 'cash');
    const creditSales = detailedData.sales.filter(s => s.paymentMethod === 'credit');
    const cashSalesAmount = cashSales.reduce((sum, s) => sum + (Number(s.finalAmount || s.totalAmount || 0)), 0);
    const creditSalesAmount = creditSales.reduce((sum, s) => sum + (Number(s.finalAmount || s.totalAmount || 0)), 0);
    const cashSalesCount = cashSales.length;
    const creditSalesCount = creditSales.length;
    
    const clientsMet = new Set(detailedData.sales.map(s => s.client)).size;
    const avgRevenuePerDealWon = dealsWon > 0 ? totalRevenue / dealsWon : 0;
    
    return {
      totalSales,
      totalRevenue,
      dealsWon,
      dealsLost,
      cashSalesAmount,
      creditSalesAmount,
      cashSalesCount,
      creditSalesCount,
      clientsMet,
      avgRevenuePerDealWon
    };
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) return `UGX ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `UGX ${(value / 1000).toFixed(1)}K`;
    return `UGX ${value?.toLocaleString() || 0}`;
  };

  // Colors
  const COLORS = ['#10b981', '#ef4444', '#f59e0b']; // Won, Lost, In Progress
  const funnelColors = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'];

  if (!reportData && loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 bg-gray-50 min-h-screen p-6" id="reports-container">
      {/* Export Controls */}
      <div className="flex justify-end items-center gap-2">
        <div className="flex gap-2">
          <button
            onClick={handlePDFDownload}
            className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 text-sm"
            title="Export full report with graphs and tables as PDF"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2 text-sm"
            title="Export sales, agents, and deals tables as CSV"
          >
            <FileText className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Quick Filters */}
        <div className="flex space-x-1 bg-white p-1 rounded-lg border border-gray-200">
          <button onClick={() => setPeriod('thisMonth')} className="px-3 py-1 text-xs font-medium hover:bg-primary-50 hover:text-primary-600 rounded">Month</button>
          <button onClick={() => setPeriod('lastMonth')} className="px-3 py-1 text-xs font-medium hover:bg-primary-50 hover:text-primary-600 rounded">Last Month</button>
          <button onClick={() => setPeriod('thisYear')} className="px-3 py-1 text-xs font-medium hover:bg-primary-50 hover:text-primary-600 rounded">Year</button>
        </div>

        {/* Date Range */}
        <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
          <input
            type="date"
            value={filters.start}
            onChange={e => setFilters({ ...filters, start: e.target.value })}
            className="px-3 py-1 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Start Date"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={filters.end}
            onChange={e => setFilters({ ...filters, end: e.target.value })}
            className="px-3 py-1 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="End Date"
          />
        </div>

        {/* Refresh Button */}
        <button
          onClick={loadReports}
          className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
          title="Refresh Data"
        >
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Summary Cards Row - Optimized */}
      {(() => {
        const stats = calculateSummaryStats();
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <SummaryCard title="Revenue" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} />
            <SummaryCard title="Total Sales" value={stats.totalSales} icon={ShoppingBag} />
            <SummaryCard title="Deals Won" value={stats.dealsWon} icon={CheckCircle} />
            <SummaryCard title="Deals Lost" value={stats.dealsLost} icon={XCircle} />
            <SummaryCard title="Clients Met" value={stats.clientsMet} icon={Users} />
          </div>
        );
      })()}

      {/* Graphs Section */}
      {reportData && (
        <div className="space-y-6">
          {/* Row 1: Four Key Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Deals Won vs Lost */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-800">Deals Won vs Lost</h3>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={(() => {
                    const weekMap = {};
                    detailedData.deals.forEach(deal => {
                      const dealDate = new Date(deal.createdAt || new Date());
                      const weekStart = new Date(dealDate);
                      weekStart.setDate(dealDate.getDate() - dealDate.getDay());
                      const weekKey = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      
                      if (!weekMap[weekKey]) {
                        weekMap[weekKey] = { week: weekKey, won: 0, lost: 0 };
                      }
                      
                      if (deal.stage === 'won') {
                        weekMap[weekKey].won++;
                      } else if (deal.stage === 'lost') {
                        weekMap[weekKey].lost++;
                      }
                    });
                    
                    return Object.values(weekMap).sort((a, b) => new Date(a.week) - new Date(b.week));
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="won" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 5 }} name="Won" />
                    <Line type="monotone" dataKey="lost" stroke="#dc2626" strokeWidth={2.5} dot={{ fill: '#dc2626', r: 5 }} name="Lost" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Credit Sales vs Cash Sales */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-800">Credit Sales vs Cash Sales</h3>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getWeeklySalesTrend()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'Cash Amount' || name === 'Credit Amount') return `UGX ${Number(value).toLocaleString()}`;
                        return value;
                      }}
                      contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="cashAmount" 
                      stroke="#FFD700" 
                      strokeWidth={2.5}
                      dot={{ fill: '#FFD700', r: 4 }}
                      name="Cash Amount (UGX)"
                    />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="creditAmount" 
                      stroke="#f59e0b" 
                      strokeWidth={2.5}
                      dot={{ fill: '#f59e0b', r: 4 }}
                      name="Credit Amount (UGX)"
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="cashSales" 
                      stroke="#3385FF" 
                      strokeWidth={2.5}
                      dot={{ fill: '#3385FF', r: 4 }}
                      name="Cash Count"
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="creditSales" 
                      stroke="#d97706" 
                      strokeWidth={2.5}
                      dot={{ fill: '#d97706', r: 4 }}
                      name="Credit Count"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 3: Deals in Pipeline */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-800">Deals in Pipeline</h3>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(() => {
                    const stages = {
                      lead: 0,
                      qualification: 0,
                      proposal: 0,
                      negotiation: 0,
                      won: 0,
                      lost: 0
                    };
                    detailedData.deals.forEach(deal => {
                      if (stages.hasOwnProperty(deal.stage)) {
                        stages[deal.stage]++;
                      }
                    });
                    return [
                      { name: 'Lead', value: stages.lead },
                      { name: 'Qualification', value: stages.qualification },
                      { name: 'Proposal', value: stages.proposal },
                      { name: 'Negotiation', value: stages.negotiation },
                      { name: 'Won', value: stages.won },
                      { name: 'Lost', value: stages.lost }
                    ];
                  })()} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#FFD700" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Weekly Performance by Agent */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-800">Weekly Performance by Agent (Sales & Deals Won)</h3>
              </div>
              <div className="h-[280px]">
                {(() => {
                  const colors = ['#FFD700', '#3385FF', '#0052CC', '#FFD700', '#FFF166', '#E6C200'];
                  
                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={(() => {
                        const weekMap = {};
                        
                        // Build week map with agent-specific sales data
                        detailedData.sales.forEach(sale => {
                          const saleDate = new Date(sale.saleDate || sale.createdAt || new Date());
                          const weekStart = new Date(saleDate);
                          weekStart.setDate(saleDate.getDate() - saleDate.getDay());
                          const weekKey = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          
                          const agentName = getAgentFromSale(sale);
                          
                          if (!weekMap[weekKey]) {
                            weekMap[weekKey] = { week: weekKey };
                          }
                          
                          const agentKey = `sales_${agentName}`;
                          weekMap[weekKey][agentKey] = (weekMap[weekKey][agentKey] || 0) + 1;
                        });
                        
                        // Add deals won data
                        detailedData.deals.forEach(deal => {
                          if (deal.stage === 'won') {
                            const dealDate = new Date(deal.createdAt || new Date());
                            const weekStart = new Date(dealDate);
                            weekStart.setDate(dealDate.getDate() - dealDate.getDay());
                            const weekKey = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            
                            const agentName = getAgentFromDeal(deal);
                            
                            if (!weekMap[weekKey]) {
                              weekMap[weekKey] = { week: weekKey };
                            }
                            
                            const agentKey = `deals_${agentName}`;
                            weekMap[weekKey][agentKey] = (weekMap[weekKey][agentKey] || 0) + 1;
                          }
                        });
                        
                        return Object.values(weekMap).sort((a, b) => new Date(a.week) - new Date(b.week));
                      })()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip 
                          formatter={(value) => value || 0}
                          contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                        {(() => {
                          const agents = new Set();
                          detailedData.sales.forEach(sale => {
                            agents.add(getAgentFromSale(sale));
                          });
                          detailedData.deals.forEach(deal => {
                            if (deal.stage === 'won') {
                              agents.add(getAgentFromDeal(deal));
                            }
                          });
                          
                          return Array.from(agents).slice(0, 6).flatMap((agent, idx) => [
                            <Line
                              key={`sales_${agent}`}
                              type="monotone"
                              dataKey={`sales_${agent}`}
                              stroke={colors[idx % colors.length]}
                              strokeWidth={2}
                              dot={{ fill: colors[idx % colors.length], r: 3 }}
                              activeDot={{ r: 5 }}
                              name={`${agent} - Sales`}
                              isAnimationActive={true}
                            />,
                            <Line
                              key={`deals_${agent}`}
                              type="monotone"
                              dataKey={`deals_${agent}`}
                              stroke={colors[idx % colors.length]}
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              dot={{ fill: colors[idx % colors.length], r: 3 }}
                              activeDot={{ r: 5 }}
                              name={`${agent} - Won Deals`}
                              isAnimationActive={true}
                            />
                          ]);
                        })()}
                      </LineChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tables Section */}
      {reportData && (
        <div className="space-y-6">
          {/* Sales Table with Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-gray-800">Sales Transactions</h3>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Agent Filter */}
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={filters.agent}
                    onChange={e => setFilters({ ...filters, agent: e.target.value })}
                  >
                    <option value="">All Agents</option>
                    {agentsList.map(agent => (
                      <option key={agent._id} value={agent._id}>{agent.name}</option>
                    ))}
                  </select>

                  {/* Date Filter */}
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={filters.dateFilter || ''}
                    onChange={e => {
                      const value = e.target.value;
                      if (value === 'today') {
                        const today = new Date().toISOString().split('T')[0];
                        setFilters({ ...filters, start: today, end: today, dateFilter: value });
                      } else if (value === 'week') {
                        const today = new Date();
                        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        setFilters({ 
                          ...filters, 
                          start: weekAgo.toISOString().split('T')[0], 
                          end: today.toISOString().split('T')[0], 
                          dateFilter: value 
                        });
                      } else if (value === 'month') {
                        const today = new Date();
                        const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);
                        setFilters({ 
                          ...filters, 
                          start: monthAgo.toISOString().split('T')[0], 
                          end: today.toISOString().split('T')[0], 
                          dateFilter: value 
                        });
                      } else if (value === 'year') {
                        const today = new Date();
                        const yearAgo = new Date(today.getFullYear(), 0, 1);
                        setFilters({ 
                          ...filters, 
                          start: yearAgo.toISOString().split('T')[0], 
                          end: today.toISOString().split('T')[0], 
                          dateFilter: value 
                        });
                      } else if (value === 'custom') {
                        setFilters({ ...filters, dateFilter: value });
                      }
                    }}
                  >
                    <option value="">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="table-header">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Customer Name</th>
                    <th className="px-4 py-3 text-left font-medium">Agent Name</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                    <th className="px-4 py-3 text-center font-medium">Payment Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getPaginatedData(detailedData.sales, 'sales').map((sale) => (
                    <tr key={sale._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(sale.saleDate || sale.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{sale.customerName}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {getAgentFromSale(sale)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-primary-600">
                        UGX {Number(sale.finalAmount || sale.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                           sale.paymentMethod === 'cash' ? 'bg-primary-100 text-primary-800' : 'bg-primary-50 text-primary-800'
                        }`}>
                          {sale.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination for Sales */}
            {pagination.sales.total > pagination.sales.limit && (
              <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.sales.page - 1) * pagination.sales.limit) + 1} to{' '}
                  {Math.min(pagination.sales.page * pagination.sales.limit, pagination.sales.total)} of {pagination.sales.total} sales
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange('sales', pagination.sales.page - 1)}
                    disabled={pagination.sales.page === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange('sales', pagination.sales.page + 1)}
                    disabled={pagination.sales.page * pagination.sales.limit >= pagination.sales.total}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Agents Performance Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Agents Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="table-header">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Sales Agent Name</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Phone</th>
                    <th className="px-4 py-3 text-right font-medium">Total Sales</th>
                    <th className="px-4 py-3 text-right font-medium">Revenue</th>
                    <th className="px-4 py-3 text-center font-medium">Total Deals</th>
                    <th className="px-4 py-3 text-center font-medium">Won Deals</th>
                    <th className="px-4 py-3 text-center font-medium">Lost Deals</th>
                    <th className="px-4 py-3 text-center font-medium">Win Rate</th>
                    <th className="px-4 py-3 text-center font-medium">Total Clients</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getPaginatedData(getSortedAgents(), 'agents').map((agent) => {
                    return (
                      <React.Fragment key={agent._id}>
                        <tr 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => toggleRowExpand(`agent-${agent._id}`)}
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {agent.name}
                            <ChevronRight className={`inline-block ml-2 w-4 h-4 transition-transform ${expandedRows[`agent-${agent._id}`] ? 'rotate-90' : ''}`} />
                          </td>
                          <td className="px-4 py-3 text-gray-600">{agent.email}</td>
                          <td className="px-4 py-3 text-gray-600">{agent.phone || 'Not Provided'}</td>
                          <td className="px-4 py-3 text-right">{agent.sales.length}</td>
                          <td className="px-4 py-3 text-right font-semibold text-primary-600">
                            UGX {agent.revenue.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">{agent.deals.length}</td>
                              <td className="px-4 py-3 text-center text-primary-600">{agent.dealsWon}</td>
                          <td className="px-4 py-3 text-center text-red-500">{agent.dealsLost}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              agent.conversionRate > 50 ? 'bg-primary-100 text-primary-800' : 'bg-primary-50 text-primary-700'
                            }`}>
                              {agent.conversionRate}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">{agent.clients.length}</td>
                        </tr>
                        {expandedRows[`agent-${agent._id}`] && (
                          <tr>
                            <td colSpan="10" className="px-4 py-3 bg-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-gray-700">Agent ID:</span>
                                  <span className="text-gray-900 ml-2">{agent._id}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Role:</span>
                                  <span className="text-gray-900 ml-2">{agent.role}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Department:</span>
                                  <span className="text-gray-900 ml-2">{agent.department || 'Not specified'}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Joined:</span>
                                  <span className="text-gray-900 ml-2">{new Date(agent.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Last Active:</span>
                                  <span className="text-gray-900 ml-2">{new Date(agent.lastLogin || agent.updatedAt).toLocaleDateString()}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Status:</span>
                                  <span className="text-gray-900 ml-2">{agent.status || 'Active'}</span>
                                </div>
                                <div className="md:col-span-2 lg:col-span-3">
                                  <span className="font-medium text-gray-700">Recent Sales:</span>
                                  <div className="mt-2 space-y-1">
                                    {agent.sales.slice(0, 3).map(sale => (
                                      <div key={sale._id} className="text-gray-600">
                                        {new Date(sale.saleDate || sale.createdAt).toLocaleDateString()} - {sale.customerName} - UGX {Number(sale.finalAmount || sale.totalAmount || 0).toLocaleString()}
                                      </div>
                                    ))}
                                    {agent.sales.length > 3 && <div className="text-gray-400">... and {agent.sales.length - 3} more</div>}
                                  </div>
                                </div>
                                <div className="md:col-span-2 lg:col-span-3">
                                  <span className="font-medium text-gray-700">Recent Deals:</span>
                                  <div className="mt-2 space-y-1">
                                    {agent.deals.slice(0, 3).map(deal => (
                                      <div key={deal._id} className="text-gray-600">
                                        {new Date(deal.createdAt).toLocaleDateString()} - {deal.title} - {deal.stage} - UGX {Number(deal.value || 0).toLocaleString()}
                                      </div>
                                    ))}
                                    {agent.deals.length > 3 && <div className="text-gray-400">... and {agent.deals.length - 3} more</div>}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Pagination for Agents */}
            {pagination.agents.total > pagination.agents.limit && (
              <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.agents.page - 1) * pagination.agents.limit) + 1} to{' '}
                  {Math.min(pagination.agents.page * pagination.agents.limit, pagination.agents.total)} of {pagination.agents.total} agents
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange('agents', pagination.agents.page - 1)}
                    disabled={pagination.agents.page === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange('agents', pagination.agents.page + 1)}
                    disabled={pagination.agents.page * pagination.agents.limit >= pagination.agents.total}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Deals Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">All Deals</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="table-header">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Deal Title</th>
                    <th className="px-4 py-3 text-left font-medium">Client Name</th>
                    <th className="px-4 py-3 text-left font-medium">Agent Name</th>
                    <th className="px-4 py-3 text-right font-medium">Value</th>
                    <th className="px-4 py-3 text-center font-medium">Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getPaginatedData(detailedData.deals, 'deals').map((deal) => (
                    <tr key={deal._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(deal.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{deal.title}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {getClientName(deal.client)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {getAgentFromDeal(deal)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-primary-600">
                        UGX {Number(deal.value || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          deal.stage === 'lost' ? 'bg-red-100 text-red-700' :
                           deal.stage === 'won' ? 'bg-primary-100 text-primary-800' :
                           deal.stage === 'negotiation' ? 'bg-primary-50 text-primary-800' :
                           deal.stage === 'proposal' ? 'bg-primary-50 text-primary-800' :
                           deal.stage === 'qualification' ? 'bg-primary-50 text-primary-800' :
                           'bg-primary-50 text-primary-700'
                        }`}>
                          {deal.stage}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination for Deals */}
            {pagination.deals.total > pagination.deals.limit && (
              <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.deals.page - 1) * pagination.deals.limit) + 1} to{' '}
                  {Math.min(pagination.deals.page * pagination.deals.limit, pagination.deals.total)} of {pagination.deals.total} deals
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange('deals', pagination.deals.page - 1)}
                    disabled={pagination.deals.page === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange('deals', pagination.deals.page + 1)}
                    disabled={pagination.deals.page * pagination.deals.limit >= pagination.deals.total}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 mt-8">
        Report generated at {new Date().toLocaleString()} • Data reflects all sales agent activities
      </div>
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ title, value, subValue, icon: Icon }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-between h-full min-h-[100px]"
  >
    <div className="flex justify-between items-start gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
      </div>
      <div className="p-2.5 rounded-full bg-primary-50 shrink-0">
        <Icon className="w-5 h-5 text-primary-500" />
      </div>
    </div>
  </motion.div>
);

export default Reports;
