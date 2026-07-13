import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
   Users,
   Settings,
   LogOut,
   X,
   Target,
   Calendar,
   Home,
   PieChart,
   UserPlus,
   TrendingUp,
   Building2,
   ShieldCheck,
   ArrowLeftRight,
   Zap,
   UserCheck,
   BookUser,
   ListTodo,
   AlertTriangle,
   Package,
   MapPin,
   Brain,
   Layers,
   Trophy,
   GitBranch,
   Sliders,
   FileText,
   BarChart3,
   Shield,
   Building,
 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';
import { generateNavigation } from '../utils/navigationBuilder';
import NotificationCenter from './NotificationCenter';
import ProfileModal from './ProfileModal';
import LogoutModal from './LogoutModal';
import QuickActionModal from './QuickActionModal';
import Taskbar from './Taskbar';
import { PLATFORM_BRAND } from '../utils/platformBranding';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [navSections, setNavSections] = useState([]);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';
  const isSuperAdmin = user?.role === 'superadmin';
  
  // Generate dynamic navigation based on user role and permissions
  useEffect(() => {
    if (user) {
      const navigation = generateNavigation(user);
      setNavSections(navigation);
    }
  }, [user]);
  // Load unread notifications for all authenticated roles
  useEffect(() => {
    loadUnreadNotifications();
    const interval = setInterval(() => { loadUnreadNotifications(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadNotifications = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadNotifications(response.data.count || 0);
    } catch (error) {
      console.error('Failed to load unread notifications:', error);
    }
  };

  const superAdminNavSections = [
    {
      title: 'Platform',
      items: [
        { path: '/dashboard', icon: PieChart, label: 'Dashboard', description: 'Platform insights and tenant summaries at a glance.' },
        { path: '/superadmin', icon: ShieldCheck, label: 'Dashboard', description: 'Welcome to HoneyPot CRM. Manage every tenant, user, subscription, and platform signal from one place.' },
        { path: '/superadmin/tenants', icon: Building2, label: 'Tenants', description: 'View and manage tenant organizations from one place.' },
      ],
    },
    {
      title: 'Organization',
      items: [
        { path: '/admin', icon: Home, label: 'Admin View', description: 'Switch to the admin dashboard for organization-level management.' },
        { path: '/admin/users', icon: UserPlus, label: 'User Management', description: 'Manage users, roles, and access across the organization.' },
        { path: '/admin/settings', icon: Settings, label: 'Settings', description: 'Update application and account settings.' },
      ],
    },
    {
      title: 'Reports',
      items: [
        { path: '/admin/reports', icon: PieChart, label: 'Reports', description: 'Generate and review reports for performance and activity.' },
        { path: '/admin/analytics', icon: TrendingUp, label: 'Analytics', description: 'Performance metrics and conversion tracking.' },
      ],
    },
    {
      title: 'Products & Territory',
      items: [
        { path: '/admin/products', icon: Package, label: 'Products', description: 'Manage product catalog and inventory.' },
        { path: '/admin/territories', icon: MapPin, label: 'Territories', description: 'Manage locations and agent assignments.' },
      ],
    },
  ];

  const adminNavSections = [
    {
      title: 'Workspace',
      items: [
        { path: '/admin', icon: PieChart, label: 'Dashboard', description: 'Your organization summary with quick access to key metrics.' },
        { path: '/admin/users', icon: UserPlus, label: 'User Management', description: 'Manage users, roles, and permissions for your team.' },
        { path: '/admin/departments', icon: Layers, label: 'Departments & Teams', description: 'Organize your company structure and manage teams.' },
        { path: '/admin/branches', icon: Building2, label: 'Branch Locations', description: 'Manage multi-location offices and hierarchical structure.' },
        { path: '/admin/pipelines', icon: GitBranch, label: 'Pipeline Builder', description: 'Customize sales stages and business process workflows.' },
        { path: '/admin/custom-fields', icon: Sliders, label: 'Custom Fields', description: 'Add custom fields to capture industry-specific data.' },
        { path: '/admin/goals', icon: Target, label: 'Goals & Targets', description: 'Set and track progress on individual, team, and company goals.' },
        { path: '/admin/activities', icon: Trophy, label: 'Performance Battle Card', description: 'Real-time leaderboard showing top performers and gamification.' },
        { path: '/admin/workflows', icon: Zap, label: 'Workflow Automation', description: 'Automate repetitive tasks and business processes.' },
        { path: '/admin/forecasts', icon: BarChart3, label: 'Revenue Forecasts', description: 'Weighted pipeline forecasting and revenue predictions.' },
        { path: '/predictive-analytics', icon: Zap, label: 'Predictive Analytics', description: 'Use AI insights to make smarter decisions and forecasts.' },
        { path: '/admin/intelligence', icon: Brain, label: 'Business Intelligence', description: 'Proactive alerts and insights for your business.' },
        { path: '/admin/custom-reports', icon: FileText, label: 'Custom Reports', description: 'Build and execute custom reports with advanced filtering.' },
      ],
    },
    {
      title: 'Products & Territory',
      items: [
        { path: '/admin/products', icon: Package, label: 'Products', description: 'Manage product catalog and inventory.' },
        { path: '/admin/territories', icon: MapPin, label: 'Territories', description: 'Manage locations and agent assignments.' },
        { path: '/admin/analytics', icon: TrendingUp, label: 'Analytics', description: 'Performance metrics and conversion tracking.' },
      ],
    },
    {
      title: 'Operations',
      items: [
        { path: '/admin/bulk-operations', icon: ArrowLeftRight, label: 'Bulk Operations', description: 'Execute bulk tasks quickly and efficiently.' },
        { path: '/admin/permissions', icon: Shield, label: 'Permission Manager', description: 'Configure role-based access control and data visibility.' },
        { path: '/admin/tenant-settings', icon: Building, label: 'Tenant Settings', description: 'Configure company profile, branding, and modules.' },
        { path: '/admin/settings', icon: Settings, label: 'Settings', description: 'Update account preferences and system settings.' },
      ],
    },
    {
      title: 'Reports',
      items: [
        { path: '/admin/reports', icon: PieChart, label: 'Reports', description: 'Review performance and activity reports across the business.' },
      ],
    },
  ];

const agentNavSections = [
    {
      title: 'Workspace',
      items: [
        { path: '/agent',            icon: PieChart,   label: 'Dashboard', description: 'Your sales dashboard with performance and activity summaries.' },
        { path: '/agent/clients',    icon: Users,      label: 'Clients & Organizations', description: 'View your client list and manage customer relationships.' },
        { path: '/agent/contacts',   icon: BookUser,   label: 'Contacts', description: 'Manage your contact directory and communication details.' },
        { path: '/agent/leads',      icon: UserCheck,  label: 'Leads', description: 'Track and manage sales leads in one place.' },
        { path: '/agent/deals',      icon: Target,     label: 'Sales Pipeline', description: 'Review and progress your current deals.' },
        { path: '/agent/sales',      icon: TrendingUp, label: 'Sales', description: 'Track sales performance and revenue results.' },
        { path: '/agent/products',   icon: Package,    label: 'Product Catalogue', description: 'Browse available products and pricing to quote clients.' },
        { path: '/agent/my-territory', icon: MapPin,   label: 'My Territory', description: 'View your assigned territory and team members.' },
      ],
    },
    {
      title: 'Activities',
      items: [
        { path: '/agent/schedules',  icon: Calendar,   label: 'Calendar', description: 'Manage your meetings and calendar events.' },
        { path: '/agent/tasks',      icon: ListTodo,   label: 'Tasks', description: 'Track tasks and stay on top of daily work items.' },
        { path: '/agent/issues',     icon: AlertTriangle, label: 'Issues', description: 'Manage issues and support requests efficiently.' },
      ],
    },
 ];

  // Dynamic navigation is now set in useEffect above, remove the static assignment
  const navItems = navSections.flatMap(section => section.items);
  const roleTitle = isSuperAdmin ? 'Platform Admin' : isAdmin ? 'Tenant Admin' : 'Sales Agent';
  const roleSubtitle = isSuperAdmin ? 'Platform Control' : isAdmin ? 'Company Control' : 'Sales Workspace';
  const userInitial = (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase();
  const displayRole = isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Agent';

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/login');
    setShowLogoutModal(false);
  };

  const getActiveNavItem = () => {
    const exactMatch = navItems.find(item => item.path === location.pathname);
    if (exactMatch) return exactMatch;
    return navItems.find(item => item.path !== '/' && location.pathname.startsWith(item.path)) || { label: 'Dashboard' };
  };

  const activeNavItem = getActiveNavItem();

  const NavItem = ({ item, isActive, onClick }) => {
    const Icon = item.icon;
    return (
      <Link
        to={item.path}
        onClick={onClick}
        className={`sidebar-item flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 group ${isActive ? 'active' : ''}`}
      >
        <Icon className={`sidebar-item-icon w-5 h-5 shrink-0 transition-all duration-150 ${isActive ? '' : 'text-white/80 group-hover:text-white'}`} strokeWidth={2} />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[13px]">{item.label}</div>
        </div>
        {isActive && (
          <div className="w-1.5 h-1.5 rounded-full sidebar-active-dot" style={{ backgroundColor: 'var(--primary-color)' }} />
        )}
      </Link>
    );
  };

  const SidebarHeader = () => {
    const tenantLogo = !isSuperAdmin ? user?.tenant?.branding?.logo : null;
    const logo = isSuperAdmin ? PLATFORM_BRAND.logo : tenantLogo;
    const tenantName = isSuperAdmin ? PLATFORM_BRAND.name : user?.tenant?.name || PLATFORM_BRAND.name;
    const initial = tenantName.charAt(0).toUpperCase();
    return (
    <div className="flex items-center justify-between px-6 py-5 border-b sidebar-divider">
      <div className="flex items-center space-x-3 min-w-0">
        <div className="w-10 h-10 shrink-0 flex items-center justify-center">
          {logo ? (
            <img src={logo} alt={`${tenantName} logo`} className="max-w-full max-h-full object-contain" />
          ) : (
            <span className="text-white font-bold text-2xl leading-none">{initial}</span>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-white leading-tight truncate">
            {tenantName}
          </h2>
          <p className="text-[10px] font-semibold tracking-wider uppercase text-white/70 mt-0.5">{roleSubtitle}</p>
        </div>
      </div>
    </div>
  );
  };

  const SidebarNav = ({ onItemClick }) => (
    <nav className="flex-1 px-3 py-6 overflow-y-auto scrollbar-thin">
      {navSections.map((section, index) => (
        <div key={section.title} className={index > 0 ? 'mt-6 border-t sidebar-divider pt-6' : ''}>
          <p className="px-4 pb-3 sidebar-section-label">
            {section.title}
          </p>
          <div className="space-y-1">
            {section.items.map((item) => {
              const isActive = location.pathname === item.path || (
                item.path !== '/admin' &&
                item.path !== '/agent' &&
                item.path !== '/superadmin' &&
                location.pathname.startsWith(item.path)
              );
              return (
                <NavItem
                  key={item.path}
                  item={item}
                  isActive={isActive}
                  onClick={onItemClick}
                />
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const SidebarFooter = ({ mobile = false }) => (
    <div className="sidebar-footer p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white font-bold text-sm border border-white/20">
          {userInitial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{user?.name || 'Admin'}</p>
          <p className="text-xs text-white/70">{displayRole}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (mobile) setSidebarOpen(false);
            handleLogout();
          }}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 text-white transition-colors duration-150 hover:bg-white/10"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg-page)]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="sidebar-shell w-64 flex flex-col shadow-2xl text-white">
          <SidebarHeader />
          <SidebarNav onItemClick={() => {}} />
          <SidebarFooter />
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 flex z-40">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="sidebar-shell relative flex-1 flex flex-col max-w-xs w-full shadow-2xl text-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all focus:outline-none"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <SidebarHeader />
              <SidebarNav onItemClick={() => setSidebarOpen(false)} />
              <SidebarFooter mobile />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto bg-[var(--color-bg-page)]">
          <Taskbar
            onOpenNotifications={() => setShowNotifications(true)}
            onOpenQuickActions={() => setShowQuickActions(true)}
            onOpenProfile={() => setShowProfileModal(true)}
            onMenuClick={() => setSidebarOpen(true)}
            unreadNotifications={unreadNotifications}
          />
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="dashboard-page">
              <div className="space-y-2 mb-3">
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{activeNavItem.label}</h1>
                <p className="text-sm text-[var(--color-text-muted)] max-w-3xl leading-relaxed">{activeNavItem.description || 'Welcome to HoneyPot CRM — where every opportunity finds its value.'}</p>
              </div>
              {children}
            </div>
          </div>
        </main>
      </div>

      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          loadUnreadNotifications();
        }}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

{/* Logout Modal */}
       <LogoutModal
         isOpen={showLogoutModal}
         onClose={() => setShowLogoutModal(false)}
         onConfirm={confirmLogout}
       />

       {/* Quick Action Modal */}
       <QuickActionModal
         isOpen={showQuickActions}
         onClose={() => setShowQuickActions(false)}
       />
     </div>
  );
};

export default Layout;
