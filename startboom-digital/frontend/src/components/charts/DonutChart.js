import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useChartTheme } from '../../utils/chartTheme';
import dm from '../../utils/darkModeClasses';

const DEFAULT_COLORS = [
  '#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#FFD700', '#8b5cf6',
];

export const ORANGE_GRADIENT_COLORS = [
  '#FFD700', '#FFF166', '#E6C200', '#10b981', '#3b82f6', '#8b5cf6', '#FFF9CC', '#FFFCE6',
];

const DonutChart = ({
  data = [], title, subtitle, colors = DEFAULT_COLORS, height = 300,
  innerRadius = 60, outerRadius = 100, showPercentage = true, showLegend = true,
  showTooltip = true, labelFormatter, tooltipFormatter, centerContent,
  emptyMessage = 'No data available',
}) => {
  const { isDark, tooltipStyle, legend, labelStyle, itemStyle } = useChartTheme();
  const hasData = data && data.length > 0 && data.some(item => item.value > 0);

  const defaultLabelFormatter = ({ name, percent }) =>
    showPercentage ? `${name} ${(percent * 100).toFixed(0)}%` : name;

  const tooltipBoxStyle = tooltipStyle;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0];
      const value = tooltipFormatter ? tooltipFormatter(d.value) : d.value.toLocaleString();
      return (
        <div style={tooltipBoxStyle} className="px-3 py-2 shadow-lg">
          <p className="text-sm font-semibold" style={itemStyle}>{d.name}</p>
          <p className="text-sm" style={labelStyle}>{value}</p>
        </div>
      );
    }
    return null;
  };

  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);

  return (
    <div className={`chart-panel h-full ${dm.card}`}>
      {(title || subtitle) && (
        <div className={`${dm.unifiedCardHeader} -mx-[1px] -mt-[1px] rounded-t-xl`}>
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>
      )}

      <div className={title || subtitle ? dm.chartBody : 'p-6'}>
      {!hasData ? (
        <div className={`flex items-center justify-center text-sm ${dm.textMuted}`} style={{ height }}>
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
              <Pie data={data} cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius}
                paddingAngle={2} dataKey="value" nameKey="name"
                label={labelFormatter || defaultLabelFormatter}
                labelLine={{ stroke: isDark ? '#3A3D52' : '#E5E7EB', strokeWidth: 1 }}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]}
                    className="transition-opacity hover:opacity-80 cursor-pointer" />
                ))}
              </Pie>
              {showTooltip && <Tooltip content={<CustomTooltip />} />}
              {showLegend && (
                <Legend verticalAlign="bottom" height={36} iconType="circle"
                  wrapperStyle={{ color: legend }}
                  formatter={(value) => <span style={{ color: legend, fontSize: '13px' }}>{value}</span>} />
              )}
            </PieChart>
          </ResponsiveContainer>
          {centerContent && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              {typeof centerContent === 'function' ? centerContent(total) : centerContent}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default DonutChart;

export const DealStatusChart = ({ data, ...props }) => (
  <DonutChart data={data} title="Deal Outcomes" subtitle="Closed wins, closed losses, and open pipeline counts"
    colors={['#10b981', '#ef4444', '#f59e0b']}
    labelFormatter={({ name, value }) => `${name}: ${value}`}
    tooltipFormatter={(value) => `${value.toLocaleString()} deal${value === 1 ? '' : 's'}`}
    centerContent={(total) => (
      <div>
        <p className={`text-3xl font-bold ${dm.textPrimary}`}>{total}</p>
        <p className={`text-xs mt-1 ${dm.textMuted}`}>Total Deals</p>
      </div>
    )}
    {...props} />
);

export const PaymentMethodChart = ({ data, formatCurrency, ...props }) => (
  <DonutChart data={data} title="Payment Methods" colors={['#FFD700', '#FFF166']}
    tooltipFormatter={formatCurrency}
    labelFormatter={({ name, value }) => `${name}: ${formatCurrency ? formatCurrency(value) : value}`}
    {...props} />
);

export const TaskStatusChart = ({ data, ...props }) => (
  <DonutChart data={data} title="Task Status" showLegend={true}
    centerContent={(total) => (
      <div>
        <p className={`text-3xl font-bold ${dm.textPrimary}`}>{total}</p>
        <p className={`text-xs mt-1 ${dm.textMuted}`}>Total Tasks</p>
      </div>
    )}
    {...props} />
);

export const StageValueChart = ({ data, formatCurrency, ...props }) => (
  <DonutChart data={data} title="Deal Stages by Value"
    colors={['#E6C200', '#f59e0b', '#FFD700', '#10b981', '#22c55e', '#ef4444']}
    tooltipFormatter={formatCurrency} {...props} />
);

export const TopAgentsChart = ({ data, formatCurrency, title = "Top Agents by Won Deals", height = 280 }) => {
  if (!data || data.length === 0) {
    return (
      <div className={`rounded-xl shadow-sm p-6 ${dm.card}`}>
        <h3 className={`text-lg font-semibold mb-4 ${dm.textPrimary}`}>{title}</h3>
        <div className={`flex items-center justify-center text-sm ${dm.textMuted}`} style={{ height }}>
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

  const topAgents = [...data].sort((a, b) => b.value - a.value).slice(0, 6)
    .map((agent, index) => ({ ...agent, rank: index + 1, color: ORANGE_GRADIENT_COLORS[index % ORANGE_GRADIENT_COLORS.length] }));

  return (
    <div className={`rounded-xl shadow-sm p-6 ${dm.card}`}>
      <h3 className={`text-lg font-semibold mb-4 ${dm.textPrimary}`}>{title}</h3>
      <div className="space-y-3">
        {topAgents.map((agent) => {
          const maxValue = topAgents[0].value;
          const percentage = (agent.value / maxValue) * 100;
          return (
            <div key={agent.name} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold">
                    {agent.rank}
                  </span>
                  <span className={`text-sm font-medium ${dm.textSecondary} group-hover:text-[var(--color-text-primary)] transition-colors`}>
                    {agent.name}
                  </span>
                </div>
                <span className={`text-sm font-bold ${dm.textPrimary}`}>
                  {formatCurrency ? formatCurrency(agent.value) : agent.value.toLocaleString()}
                </span>
              </div>
              <div className="relative h-8 bg-[var(--color-bg-muted)] rounded-lg overflow-hidden">
                <div className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500 ease-out group-hover:opacity-90"
                  style={{ width: `${percentage}%`, background: `linear-gradient(90deg, ${agent.color} 0%, ${agent.color}dd 100%)` }}>
                  <div className="absolute inset-0 flex items-center justify-end pr-3">
                    <span className="text-xs font-semibold text-white drop-shadow">{percentage.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className={`mt-4 pt-4 border-t ${dm.border}`}>
        <div className="flex items-center justify-between text-sm">
          <span className={dm.textSecondary}>Total Won Value</span>
          <span className={`font-bold ${dm.textPrimary}`}>
            {formatCurrency ? formatCurrency(topAgents.reduce((sum, a) => sum + a.value, 0)) : topAgents.reduce((sum, a) => sum + a.value, 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
