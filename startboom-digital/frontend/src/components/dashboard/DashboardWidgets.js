import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Target, 
  DollarSign, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

// Stat Card Widget - Universal component for key metrics
export const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue', onClick }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
    teal: 'bg-teal-50 text-teal-600'
  };

  return (
    <div 
      className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
};

// Revenue Widget - For sales/finance departments
export const RevenueWidget = ({ revenue, trend, period = 'This Month' }) => (
  <StatCard
    title="Revenue"
    value={`$${revenue?.toLocaleString() || 0}`}
    subtitle={period}
    icon={DollarSign}
    trend={trend}
    color="green"
  />
);

// Deals Widget - For sales departments
export const DealsWidget = ({ deals, trend }) => (
  <StatCard
    title="Active Deals"
    value={deals || 0}
    subtitle="In Pipeline"
    icon={Target}
    trend={trend}
    color="blue"
  />
);

// Clients Widget - For sales/support departments
export const ClientsWidget = ({ clients, newClients }) => (
  <StatCard
    title="Total Clients"
    value={clients || 0}
    subtitle={`${newClients || 0} new this month`}
    icon={Users}
    color="purple"
  />
);

// Tasks Widget - For operations/general
export const TasksWidget = ({ completed, total }) => (
  <StatCard
    title="Tasks"
    value={`${completed}/${total}`}
    subtitle={`${Math.round((completed/total) * 100)}% complete`}
    icon={CheckCircle}
    color="teal"
  />
);

// Issues Widget - For support departments
export const IssuesWidget = ({ open, resolved, onClick }) => (
  <StatCard
    title="Open Issues"
    value={open || 0}
    subtitle={`${resolved || 0} resolved this month`}
    icon={AlertCircle}
    color="orange"
    onClick={onClick}
  />
);

// Activities Widget - General
export const ActivitiesWidget = ({ count, type = 'This Week' }) => (
  <StatCard
    title="Activities"
    value={count || 0}
    subtitle={type}
    icon={Calendar}
    color="blue"
  />
);

// Quick Stats Grid - Combines multiple stat cards
export const QuickStatsGrid = ({ stats, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {stats.map((stat, idx) => (
        <StatCard key={idx} {...stat} />
      ))}
    </div>
  );
};

// Department Header - Shows department context
export const DepartmentHeader = ({ departmentName, memberCount, description }) => {
  return (
    <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 mb-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">{departmentName} Dashboard</h2>
          <p className="text-primary-100">{description || 'Team performance and metrics'}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">{memberCount}</p>
          <p className="text-sm text-primary-100">Team Members</p>
        </div>
      </div>
    </div>
  );
};

// Empty State - When no data available
export const EmptyDashboardState = ({ message = 'No data available yet', action }) => {
  return (
    <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Clock className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Getting Started</h3>
      <p className="text-gray-500 mb-4">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-brand px-6 py-2 rounded-lg text-white"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

// Widget Container - Consistent styling for dashboard widgets
export const WidgetContainer = ({ title, subtitle, children, action, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {action.label}
          </button>
        )}
      </div>
      {children}
    </div>
  );
};

export default {
  StatCard,
  RevenueWidget,
  DealsWidget,
  ClientsWidget,
  TasksWidget,
  IssuesWidget,
  ActivitiesWidget,
  QuickStatsGrid,
  DepartmentHeader,
  EmptyDashboardState,
  WidgetContainer
};
