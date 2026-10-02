import React, { useId, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export const ACCENTS = {
  emerald: { stroke: '#10B981', text: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
  rose: { stroke: '#EF4444', text: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
  neutral: { stroke: '#888888', text: '#888888', bg: 'rgba(136, 136, 136, 0.1)' },
  brand: { stroke: '#FF5A3C', text: '#FF5A3C', bg: 'rgba(255, 90, 60, 0.1)' },
  blue: { stroke: '#3B82F6', text: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
  amber: { stroke: '#F59E0B', text: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  violet: { stroke: '#8B5CF6', text: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
};

export const SERIES_COLORS = [
  '#FF5A3C',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
];

export function formatCompact(value, unit = '') {
  if (value === null || value === undefined || isNaN(value)) return '0';
  const num = Number(value);
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  const prefix = unit === '₹' ? '₹' : '';

  if (abs >= 10000000) {
    return `${sign}${prefix}${(abs / 10000000).toFixed(2).replace(/\.00$/, '')}Cr`;
  }
  if (abs >= 100000) {
    return `${sign}${prefix}${(abs / 100000).toFixed(2).replace(/\.00$/, '')}L`;
  }
  if (abs >= 1000) {
    return `${sign}${prefix}${(abs / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return `${sign}${prefix}${abs.toLocaleString('en-IN')}`;
}


const CustomTooltip = ({ active, payload, label, valueFormatter, dateFormatter }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="z-50 min-w-[130px] rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-xs shadow-xl backdrop-blur-md transition-all">
      {label && (
        <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)]/60 pb-1">
          {dateFormatter ? dateFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, index) => {
          const val = entry.value;
          const formatted = valueFormatter ? valueFormatter(val) : formatCompact(val);
          return (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <span className="text-[11px] font-medium text-[var(--text-subtle)] truncate max-w-[110px]">
                  {entry.name || 'Value'}
                </span>
              </div>
              <span className="font-extrabold text-[var(--text-primary)]">{formatted}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export function MetricChart({
  series = [],
  view = 'curve',
  defaultIndex,
  valueFormatter,
  dateFormatter,
  onHoverPoint,
}) {
  const chartId = useId().replace(/:/g, '');

  // Transform series into unified Recharts format
  // [{ date: '...', index: 0, [seriesName]: value }]
  const chartData = useMemo(() => {
    if (!series.length) return [];

    const primaryData = series[0]?.data || [];
    return primaryData.map((item, idx) => {
      const point = { date: item.date, index: idx };
      series.forEach((s) => {
        point[s.name] = s.data[idx]?.value ?? 0;
      });
      return point;
    });
  }, [series]);

  if (!chartData.length) return null;

  return (
    <div className="h-full w-full select-none">
      <ResponsiveContainer width="100%" height="100%">
        {view === 'curve' ? (
          <AreaChart
            data={chartData}
            margin={{ top: 18, right: 14, left: 14, bottom: 8 }}
            onMouseMove={(state) => {
              if (state && state.isTooltipActive && state.activePayload && state.activePayload.length) {
                const entry = state.activePayload[0];
                onHoverPoint?.({
                  date: state.activeLabel || entry.payload?.date,
                  value: entry.value,
                  name: entry.name,
                  color: entry.color,
                  index: state.activeTooltipIndex !== undefined ? state.activeTooltipIndex : entry.payload?.index,
                  payload: entry.payload,
                });
              }
            }}
            onMouseLeave={() => {
              onHoverPoint?.(null);
            }}
          >
            <defs>
              {series.map((s, i) => (
                <linearGradient
                  key={s.name || i}
                  id={`area-grad-${chartId}-${i}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
                  <stop offset="90%" stopColor={s.color} stopOpacity={0.0} />
                </linearGradient>
              ))}
            </defs>

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9.5, fill: 'var(--text-muted)' }}
              dy={6}
              minTickGap={25}
              tickFormatter={(val) => {
                if (typeof val === 'string' && val.includes(' ')) {
                  return val.split(' ')[0];
                }
                return val;
              }}
            />
            <YAxis hide domain={[0, (dataMax) => (dataMax <= 2 ? 3 : Math.ceil(dataMax * 1.25))]} />

            <Tooltip
              defaultIndex={defaultIndex}
              content={
                <CustomTooltip
                  valueFormatter={valueFormatter}
                  dateFormatter={dateFormatter}
                />
              }
              cursor={{
                stroke: 'var(--border)',
                strokeWidth: 1.5,
                strokeDasharray: '3 3',
              }}
            />

            {series.map((s, i) => (
              <Area
                key={s.name || i}
                type="monotone"
                dataKey={s.name}
                stroke={s.color}
                strokeWidth={2.4}
                fill={`url(#area-grad-${chartId}-${i})`}
                dot={false}
                activeDot={{
                  r: 5,
                  stroke: s.color,
                  strokeWidth: 2.2,
                  fill: 'var(--bg-surface)',
                }}
              />
            ))}
          </AreaChart>
        ) : (
          <BarChart
            data={chartData}
            barCategoryGap={4}
            margin={{ top: 14, right: 6, left: 6, bottom: 6 }}
            onMouseMove={(state) => {
              if (state && state.isTooltipActive && state.activePayload && state.activePayload.length) {
                const entry = state.activePayload[0];
                onHoverPoint?.({
                  date: state.activeLabel || entry.payload?.date,
                  value: entry.value,
                  name: entry.name,
                  color: entry.color,
                  index: state.activeTooltipIndex !== undefined ? state.activeTooltipIndex : entry.payload?.index,
                  payload: entry.payload,
                });
              }
            }}
            onMouseLeave={() => {
              onHoverPoint?.(null);
            }}
          >
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9.5, fill: 'var(--text-muted)' }}
              dy={6}
              minTickGap={25}
              tickFormatter={(val) => {
                if (typeof val === 'string' && val.includes(' ')) {
                  return val.split(' ')[0];
                }
                return val;
              }}
            />
            <YAxis hide domain={[0, (dataMax) => (dataMax <= 2 ? 3 : Math.ceil(dataMax * 1.25))]} />

            <Tooltip
              defaultIndex={defaultIndex}
              content={
                <CustomTooltip
                  valueFormatter={valueFormatter}
                  dateFormatter={dateFormatter}
                />
              }
              cursor={{ fill: 'var(--text-primary)', opacity: 0.05 }}
            />

            {series.map((s, i) => (
              <Bar
                key={s.name || i}
                dataKey={s.name}
                fill={s.color}
                fillOpacity={0.88}
                radius={[4, 4, 1, 1]}
                maxBarSize={22}
                className="cursor-pointer transition-opacity hover:opacity-100"
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
