import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useModules } from './ModuleContext';

const DashboardContext = createContext();

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
};

// Define department-specific widget configurations
const DEPARTMENT_WIDGETS = {
  'Sales': {
    primary: ['revenue', 'deals', 'pipeline', 'conversion'],
    secondary: ['clients', 'forecasts', 'targets'],
    charts: ['revenue-trend', 'deals-funnel', 'team-performance']
  },
  'Marketing': {
    primary: ['campaigns', 'leads', 'conversion', 'roi'],
    secondary: ['content', 'social-engagement', 'analytics'],
    charts: ['campaign-performance', 'lead-sources', 'engagement-trend']
  },
  'Finance': {
    primary: ['revenue', 'expenses', 'profit', 'budget'],
    secondary: ['invoices', 'payments', 'cash-flow'],
    charts: ['revenue-vs-expenses', 'budget-tracking', 'payment-status']
  },
  'Operations': {
    primary: ['tasks', 'projects', 'efficiency', 'capacity'],
    secondary: ['schedules', 'resources', 'bottlenecks'],
    charts: ['task-completion', 'project-timeline', 'resource-utilization']
  },
  'HR': {
    primary: ['employees', 'attendance', 'performance', 'hiring'],
    secondary: ['leave', 'payroll', 'training'],
    charts: ['headcount-trend', 'performance-distribution', 'attrition-rate']
  },
  'Customer Support': {
    primary: ['tickets', 'satisfaction', 'response-time', 'resolution'],
    secondary: ['issues', 'feedback', 'escalations'],
    charts: ['ticket-volume', 'satisfaction-trend', 'resolution-time']
  },
  'Executive': {
    primary: ['revenue', 'profit', 'growth', 'kpis'],
    secondary: ['departments', 'teams', 'strategic-goals'],
    charts: ['company-performance', 'department-comparison', 'goal-progress']
  },
  'Default': {
    primary: ['overview', 'tasks', 'activities', 'notifications'],
    secondary: ['schedules', 'updates', 'quick-actions'],
    charts: ['activity-trend', 'task-completion']
  }
};

// Map modules to relevant widgets
const MODULE_WIDGETS = {
  'clients': ['clients', 'client-interactions', 'client-satisfaction'],
  'deals': ['deals', 'pipeline', 'conversion', 'deal-stages'],
  'sales': ['revenue', 'sales-volume', 'sales-trend'],
  'products': ['products', 'inventory', 'top-products'],
  'schedules': ['calendar', 'upcoming-events', 'schedules'],
  'meetings': ['meetings', 'meeting-hours'],
  'issues': ['issues', 'issue-resolution', 'open-issues'],
  'reports': ['reports', 'analytics'],
  'analytics': ['analytics', 'insights', 'trends'],
  'forecasts': ['forecasts', 'predictions'],
  'goals': ['goals', 'targets', 'goal-progress'],
  'activities': ['activities', 'team-activities'],
  'workflows': ['workflows', 'automation'],
  'tasks': ['tasks', 'task-completion'],
  'customFields': ['custom-data'],
  'dashboards': ['dashboard-widgets']
};

export const DashboardProvider = ({ children }) => {
  const { user } = useAuth();
  const { enabledModules, userDepartment, isUnrestricted } = useModules();
  const [dashboardConfig, setDashboardConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateDashboardConfig();
  }, [user, userDepartment, enabledModules]);

  const generateDashboardConfig = () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Determine dashboard type based on role and department
      let config = {
        type: 'default',
        department: null,
        widgets: [],
        charts: [],
        layout: 'standard'
      };

      // Admin/Manager get executive view
      if (user.role === 'admin' || user.role === 'manager' || user.role === 'superadmin') {
        config.type = 'executive';
        config.widgets = DEPARTMENT_WIDGETS['Executive'].primary;
        config.charts = DEPARTMENT_WIDGETS['Executive'].charts;
        config.layout = 'executive';
      }
      // Regular employees get department-specific view
      else if (userDepartment) {
        const deptName = userDepartment.name;
        const deptConfig = DEPARTMENT_WIDGETS[deptName] || DEPARTMENT_WIDGETS['Default'];
        
        config.type = 'department';
        config.department = deptName;
        config.widgets = deptConfig.primary;
        config.charts = deptConfig.charts;
        config.layout = 'department';
      }
      // No department - show basic view
      else {
        config.type = 'basic';
        config.widgets = DEPARTMENT_WIDGETS['Default'].primary;
        config.charts = DEPARTMENT_WIDGETS['Default'].charts;
        config.layout = 'basic';
      }

      // Add module-based widgets if not unrestricted
      if (!isUnrestricted && enabledModules.length > 0) {
        const moduleWidgets = enabledModules
          .filter(m => MODULE_WIDGETS[m])
          .flatMap(m => MODULE_WIDGETS[m]);
        
        // Merge with existing widgets (avoid duplicates)
        config.widgets = [...new Set([...config.widgets, ...moduleWidgets])];
      }

      setDashboardConfig(config);
    } catch (error) {
      console.error('Error generating dashboard config:', error);
      // Fallback to default
      setDashboardConfig({
        type: 'default',
        widgets: DEPARTMENT_WIDGETS['Default'].primary,
        charts: DEPARTMENT_WIDGETS['Default'].charts,
        layout: 'standard'
      });
    } finally {
      setLoading(false);
    }
  };

  const shouldShowWidget = (widgetName) => {
    if (!dashboardConfig) return false;
    return dashboardConfig.widgets.includes(widgetName);
  };

  const shouldShowChart = (chartName) => {
    if (!dashboardConfig) return false;
    return dashboardConfig.charts.includes(chartName);
  };

  const getLayoutType = () => {
    return dashboardConfig?.layout || 'standard';
  };

  const getDepartmentContext = () => {
    return {
      name: userDepartment?.name || 'General',
      modules: enabledModules,
      isUnrestricted
    };
  };

  const value = {
    dashboardConfig,
    loading,
    shouldShowWidget,
    shouldShowChart,
    getLayoutType,
    getDepartmentContext,
    isExecutive: dashboardConfig?.type === 'executive',
    isDepartmentView: dashboardConfig?.type === 'department',
    isBasicView: dashboardConfig?.type === 'basic'
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export default DashboardContext;
