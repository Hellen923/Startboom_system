import {
  Users,
  TrendingUp,
  UserCheck,
  Clock,
  FileText,
  ShieldCheck,
  Settings,
  BarChart3,
  Building2,
  ArrowLeftRight,
  Zap,
  Calendar,
  Target,
  ListTodo,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';

const ICON_COLORS = {
  primary: { bg: 'bg-primary-50', text: 'text-primary-600', hover: 'hover:border-primary-300' },
  green: { bg: 'bg-green-50', text: 'text-green-600', hover: 'hover:border-green-300' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', hover: 'hover:border-blue-300' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', hover: 'hover:border-yellow-300' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', hover: 'hover:border-purple-300' },
  red: { bg: 'bg-red-50', text: 'text-red-600', hover: 'hover:border-red-300' },
};

export const getSearchConfig = (role) => {
  switch (role) {
    case 'superadmin':
      return {
        placeholder: 'Search tenants, organizations, users…',
        path: '/superadmin/tenants',
      };
    case 'admin':
    case 'manager':
      return {
        placeholder: 'Search users, deals, reports…',
        path: '/admin/users',
      };
    case 'agent':
    default:
      return {
        placeholder: 'Search leads, deals, contacts…',
        path: '/agent/clients',
      };
  }
};

export const getQuickActions = (role) => {
  switch (role) {
    case 'superadmin':
      return [
        {
          label: 'Manage Tenants',
          description: 'Review and update tenant accounts.',
          icon: Building2,
          color: 'primary',
          path: '/superadmin/tenants',
        },
        {
          label: 'Create Organization',
          description: 'Onboard a new company to the platform.',
          icon: UserPlus,
          color: 'green',
          path: '/superadmin/tenants',
          state: { openCreate: true },
        },
        {
          label: 'Platform Overview',
          description: 'View cross-tenant metrics and health.',
          icon: BarChart3,
          color: 'blue',
          path: '/superadmin',
        },
        {
          label: 'Security & Access',
          description: 'Manage platform roles and permissions.',
          icon: ShieldCheck,
          color: 'purple',
          path: '/admin/users',
        },
      ];
    case 'admin':
    case 'manager':
      return [
        {
          label: 'Add User',
          description: 'Open the new user form directly.',
          icon: UserPlus,
          color: 'primary',
          path: '/admin/users',
          state: { openCreate: true },
        },
        {
          label: 'View Reports',
          description: 'Open sales and performance dashboards.',
          icon: FileText,
          color: 'blue',
          path: '/admin/reports',
        },
        {
          label: 'Predictive Analytics',
          description: 'AI-powered forecasts and insights.',
          icon: Zap,
          color: 'green',
          path: '/predictive-analytics',
        },
        {
          label: 'Bulk Operations',
          description: 'Perform large updates across records.',
          icon: ArrowLeftRight,
          color: 'yellow',
          path: '/admin/bulk-operations',
        },
      ];
    case 'agent':
    default:
      return [
        {
          label: 'New Lead',
          description: 'Capture a prospect quickly.',
          icon: UserCheck,
          color: 'blue',
          path: '/agent/leads',
          state: { openCreate: true },
        },
        {
          label: 'New Sale',
          description: 'Record a sale or convert a lead.',
          icon: TrendingUp,
          color: 'green',
          path: '/agent/sales',
          state: { openCreate: true },
        },
        {
          label: 'New Client',
          description: 'Open the new client workflow.',
          icon: Users,
          color: 'primary',
          path: '/agent/clients',
          state: { openCreate: true },
        },
        {
          label: 'New Deal',
          description: 'Add an opportunity to the pipeline.',
          icon: Target,
          color: 'purple',
          path: '/agent/deals',
          state: { openCreate: true },
        },
        {
          label: 'New Task',
          description: 'Create a follow-up reminder.',
          icon: ListTodo,
          color: 'yellow',
          path: '/agent/tasks',
          state: { openCreate: true },
        },
        {
          label: 'Schedule',
          description: 'Plan a meeting or follow-up.',
          icon: Calendar,
          color: 'primary',
          path: '/agent/schedules',
          state: { openCreate: true },
        },
      ];
  }
};

export const getAddNewActions = (role) => {
  switch (role) {
    case 'superadmin':
      return [
        { label: 'New Organization', icon: Building2, path: '/superadmin/tenants', state: { openCreate: true } },
        { label: 'Manage Tenants', icon: ShieldCheck, path: '/superadmin/tenants' },
        { label: 'Platform Users', icon: Users, path: '/admin/users' },
        { label: 'Admin Settings', icon: Settings, path: '/admin/settings' },
      ];
    case 'admin':
    case 'manager':
      return [
        { label: 'Add User', icon: UserPlus, path: '/admin/users', state: { openCreate: true } },
        { label: 'View Reports', icon: BarChart3, path: '/admin/reports' },
        { label: 'Bulk Operations', icon: ArrowLeftRight, path: '/admin/bulk-operations' },
        { label: 'Settings', icon: Settings, path: '/admin/settings' },
      ];
    case 'agent':
    default:
      return [
        { label: 'New Client', icon: Users, path: '/agent/clients', state: { openCreate: true } },
        { label: 'New Sale', icon: TrendingUp, path: '/agent/sales', state: { openCreate: true } },
        { label: 'New Lead', icon: UserCheck, path: '/agent/leads', state: { openCreate: true } },
        { label: 'Schedule Meeting', icon: Calendar, path: '/agent/schedules', state: { openCreate: true } },
        { label: 'New Task', icon: ListTodo, path: '/agent/tasks', state: { openCreate: true } },
        { label: 'New Deal', icon: Target, path: '/agent/deals', state: { openCreate: true } },
        { label: 'Log Issue', icon: AlertTriangle, path: '/agent/issues', state: { openCreate: true } },
      ];
  }
};

export const getQuickActionsMeta = (role) => {
  switch (role) {
    case 'superadmin':
      return {
        title: 'Platform quick actions',
        subtitle: 'Manage tenants, organizations, and platform-wide operations.',
      };
    case 'admin':
    case 'manager':
      return {
        title: 'Admin quick actions',
        subtitle: 'Run the top organization workflows from one place.',
      };
    case 'agent':
    default:
      return {
        title: 'Sales quick actions',
        subtitle: 'Jump directly into your most common sales workflows.',
      };
  }
};

export const getIconColors = (color) => ICON_COLORS[color] || ICON_COLORS.primary;

export const DASHBOARD_ROUTES = ['/superadmin', '/admin', '/agent', '/dashboard'];

export const isDashboardRoute = (pathname) => DASHBOARD_ROUTES.includes(pathname);
