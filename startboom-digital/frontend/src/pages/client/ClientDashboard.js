import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, DollarSign, FileText, MessageSquare, 
  LogOut, Bell, Download, BarChart3, Sun, Moon
} from 'lucide-react';
import { dealsAPI, clientsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import sidebarLogo from '../../assets/sidebar.png';

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { theme, updateTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const toggleTheme = () => {
    updateTheme({ mode: theme.mode === 'dark' ? 'light' : 'dark' });
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.role !== 'client') {
      navigate('/client-portal/login');
      return;
    }
    setUser(userData);
    loadClientData();
  }, []);

  const loadClientData = async () => {
    try {
      // Get client record linked to this user
      const clientsRes = await clientsAPI.getAll();
      const myClient = clientsRes.data.clients?.find(c => 
        c.portalUser && c.portalUser.toString() === JSON.parse(localStorage.getItem('user'))._id
      );
      
      if (myClient) {
        setClientData(myClient);
        
        // Load deals for this client
        const dealsRes = await dealsAPI.getAll();
        const myDeals = dealsRes.data.deals?.filter(d => 
          d.client && (d.client._id || d.client).toString() === myClient._id
        ) || [];
        setDeals(myDeals);
      }
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/client-portal/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your portal...</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalInvestment: deals.reduce((sum, d) => sum + (d.value || 0), 0),
    activeDeals: deals.filter(d => d.stage === 'won').length,
    documents: 0, // TODO: Implement documents
    returns: 0 // TODO: Calculate returns
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FFD700] to-[#FFC700] rounded-lg flex items-center justify-center shadow-md p-1.5">
                <img src={sidebarLogo} alt="HoneyPot CRM" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  HoneyPot CRM
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Client Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
              </button>
              <button 
                onClick={toggleTheme}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={theme.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme.mode === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.name || 'Client'}! 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {clientData?.company || 'Your account overview'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={DollarSign}
            title="Total Investment"
            value={`UGX ${stats.totalInvestment.toLocaleString()}`}
            color="bg-blue-500"
          />
          <StatCard
            icon={BarChart3}
            title="Active Deals"
            value={stats.activeDeals}
            color="bg-green-500"
          />
          <StatCard
            icon={FileText}
            title="Documents"
            value={stats.documents}
            color="bg-purple-500"
          />
          <StatCard
            icon={TrendingUp}
            title="Returns"
            value={`+${stats.returns}%`}
            color="bg-orange-500"
          />
        </div>

        {/* Recent Deals */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Your Investments
            </h3>
            <button className="text-[#FFD700] hover:text-[#FFC700] text-sm font-medium transition-colors">
              View All
            </button>
          </div>

          {deals.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No investments found
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {deals.map((deal) => (
                <div
                  key={deal._id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {deal.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Stage: <span className="capitalize">{deal.stage}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">
                      UGX {(deal.value || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(deal.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickAction
            icon={FileText}
            title="Documents"
            description="Access your important documents"
            onClick={() => toast.info('Coming soon: Document library')}
          />
          <QuickAction
            icon={MessageSquare}
            title="Messages"
            description="Contact your account manager"
            onClick={() => toast.info('Coming soon: Messaging')}
          />
          <QuickAction
            icon={Download}
            title="Reports"
            description="Download investment reports"
            onClick={() => toast.info('Coming soon: Report downloads')}
          />
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color} shadow-sm`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
  </div>
);

const QuickAction = ({ icon: Icon, title, description, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md hover:border-[#FFD700] transition-all text-left group"
  >
    <div className="flex items-center space-x-4">
      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg group-hover:bg-gradient-to-br group-hover:from-[#FFD700] group-hover:to-[#FFC700] transition-all">
        <Icon className="w-6 h-6 text-[#FFD700] group-hover:text-gray-900 transition-colors" />
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
          {title}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  </button>
);

export default ClientDashboard;
