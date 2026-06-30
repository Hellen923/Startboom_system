import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

/**
 * Standardized Donut Chart Component
 * Modern, consistent pie chart with center hole for better readability
 */

// Unified color palette - Blue-based theme with harmonious complementary colors
// This creates a cohesive look across all dashboards
const DEFAULT_COLORS = [
  '#10b981', // Green - for positive/won/success
  '#ef4444', // Red - for negative/lost/danger  
  '#f59e0b', // Amber - for warning/pending
  '#3b82f6', // Blue - for info/active
  '#FFD700', // Primary Gold - for primary/cash
  '#8b5cf6', // Purple - for special/vip
];

// Blue gradient palette for multi-agent charts (harmonious shades)
export const ORANGE_GRADIENT_COLORS = [
  '#FFD700', // Primary gold
  '#FFF166', // Light gold
  '#E6C200', // Dark gold
  '#10b981', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#FFF9CC', // Very light gold
  '#FFFCE6', // Pale gold
];

const DonutChart = ({
  data = [],
  title,
  subtitle,
  colors = DEFAULT_COLORS,
  height = 300,
  innerRadius = 60,
  outerRadius = 100,
  showPercentage = true,
  showLegend = true,
  showTooltip = true,
  labelFormatter,
  tooltipFormatter,
  centerContent,
  emptyMessage = 'No data available',
}) => {
  // Check if data is empty or all values are zero
  const hasData = data && data.length > 0 && data.some(item => item.value > 0);

  // Default label formatter showing percentage
  const defaultLabelFormatter = ({ name, percent }) => {
    if (showPercentage) {
      return `${name} ${(percent * 100).toFixed(0)}%`;
    }
    return name;
  };

  // Custom tooltip content
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const value = tooltipFormatter ? tooltipFormatter(data.value) : data.value.toLocaleString();
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">{value}</p>
        </div>
      );
    }
    return null;
  };

  // Calculate total for center display
  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full">
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      )}

      {/* Chart or Empty State */}
      {!hasData ? (
        <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height }}>
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-2 opacity-20" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
            </svg>
            <p>{emptyMessage}</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={labelFormatter || defaultLabelFormatter}
                labelLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || colors[index % colors.length]}
                    className="transition-opacity hover:opacity-80 cursor-pointer"
                  />
                ))}
              </Pie>
              {showTooltip && <Tooltip content={<CustomTooltip />} />}
              {showLegend && (
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
                />
              )}
            </PieChart>
          </ResponsiveContainer>

          {/* Center Content (Total, Custom Text, etc.) */}
          {centerContent && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              {typeof centerContent === 'function' ? centerContent(total) : centerContent}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DonutChart;

// Preset configurations for common use cases
export const DealStatusChart = ({ data, ...props }) => (
  <DonutChart
    data={data}
    title="Deal Outcomes"
    subtitle="Closed wins, closed losses, and open pipeline counts"
    colors={['#10b981', '#ef4444', '#f59e0b']} // Green, Red, Amber
    labelFormatter={({ name, value }) => `${name}: ${value}`}
    tooltipFormatter={(value) => `${value.toLocaleString()} deal${value === 1 ? '' : 's'}`}
    centerContent={(total) => (
      <div>
        <p className="text-3xl font-bold text-gray-900">{total}</p>
        <p className="text-xs text-gray-500 mt-1">Total Deals</p>
      </div>
    )}
    {...props}
  />
);

export const PaymentMethodChart = ({ data, formatCurrency, ...props }) => (
  <DonutChart
    data={data}
    title="Payment Methods"
    colors={['#FFD700', '#FFF166']} // Primary Gold (Cash), Light Gold (Credit)
    tooltipFormatter={formatCurrency}
    labelFormatter={({ name, value }) => `${name}: ${formatCurrency ? formatCurrency(value) : value}`}
    {...props}
  />
);

export const TaskStatusChart = ({ data, ...props }) => (
  <DonutChart
    data={data}
    title="Task Status"
    showLegend={true}
    centerContent={(total) => (
      <div>
        <p className="text-3xl font-bold text-gray-900">{total}</p>
        <p className="text-xs text-gray-500 mt-1">Total Tasks</p>
      </div>
    )}
    {...props}
  />
);

export const StageValueChart = ({ data, formatCurrency, ...props }) => (
  <DonutChart
    data={data}
    title="Deal Stages by Value"
    colors={['#E6C200', '#f59e0b', '#FFD700', '#10b981', '#22c55e', '#ef4444']}
    tooltipFormatter={formatCurrency}
    {...props}
  />
);

// Horizontal bar chart component for better agent comparison
export const TopAgentsChart = ({ data, formatCurrency, title = "Top Agents by Won Deals", height = 280 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height }}>
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-2 opacity-20" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            <p>No won-deal data yet</p>
          </div>
        </div>
      </div>
    );
  }

  // Sort and take top 6 agents
  const topAgents = [...data]
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
    .map((agent, index) => ({
      ...agent,
      rank: index + 1,
      color: ORANGE_GRADIENT_COLORS[index % ORANGE_GRADIENT_COLORS.length]
    }));

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {topAgents.map((agent) => {
          const maxValue = topAgents[0].value;
          const percentage = (agent.value / maxValue) * 100;
          
          return (
            <div key={agent.name} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs font-bold">
                    {agent.rank}
                  </span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                    {agent.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {formatCurrency ? formatCurrency(agent.value) : agent.value.toLocaleString()}
                </span>
              </div>
              <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500 ease-out group-hover:opacity-90"
                  style={{
                    width: `${percentage}%`,
                    background: `linear-gradient(90deg, ${agent.color} 0%, ${agent.color}dd 100%)`
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-end pr-3">
                    <span className="text-xs font-semibold text-white drop-shadow">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Summary footer */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total Won Value</span>
          <span className="font-bold text-gray-900">
            {formatCurrency ? formatCurrency(topAgents.reduce((sum, a) => sum + a.value, 0)) : topAgents.reduce((sum, a) => sum + a.value, 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
