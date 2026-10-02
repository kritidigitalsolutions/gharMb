import React, { useId, useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';
import {
  ACCENTS,
  formatCompact,
  MetricChart,
  SERIES_COLORS,
} from './metric-chart';
import { PeriodSelect, ViewToggle } from './metric-controls';

// Re-export for convenience
export { ACCENTS, formatCompact, MetricChart, SERIES_COLORS };
export { PeriodSelect, ViewToggle };

const DEFAULT_PERIODS = [
  { label: 'Past 7 days', points: 4 },
  { label: 'Past 14 days', points: 7 },
  { label: 'Past 30 days' },
];

// Part of the card (from the right) occupied by the graph
const REGION_W = 62; // %
// Variation below this threshold = "stable" -> neutral accent
const NEUTRAL_PCT = 0.5;

const SIZES = {
  sm: { minH: 'min-h-[180px]', pad: 'px-4 py-3', footer: 'px-4 py-2', title: 'text-xs', headline: 'text-[20px]' },
  md: { minH: 'min-h-[220px] sm:min-h-[235px]', pad: 'px-4 sm:px-5 pt-4 pb-2.5', footer: 'px-4 sm:px-5 py-2.5', title: 'text-xs sm:text-[13px]', headline: 'text-[22px] sm:text-[24px]' },
  lg: { minH: 'min-h-[265px]', pad: 'px-5 pt-4.5 pb-3', footer: 'px-5 py-3', title: 'text-[13px]', headline: 'text-[26px]' },
};

const sliceWindow = (points, n) =>
  n && n < points.length ? points.slice(-n) : points;

export default function ProgressMetricCard({
  title,
  total,
  delta,
  deltaLabel = 'today',
  percent,
  trend,
  unit,
  period = 'Past 30 days',
  periodOptions,
  onPeriodChange,
  defaultView = 'curve',
  accent,
  data,
  series,
  defaultIndex,
  size = 'md',
  showStats = true,
  valueFormatter,
  dateFormatter,
  loading = false,
  className = '',
}) {
  const sz = SIZES[size] || SIZES.md;
  const shell = `relative flex ${sz.minH} w-full flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs transition-all ${className}`;

  const periods = periodOptions ?? DEFAULT_PERIODS;
  const [selectedLabel, setSelectedLabel] = useState(period);
  const [view, setView] = useState(defaultView);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Normalize input into series list (a single data -> one series)
  const baseSeries = useMemo(
    () => (series?.length ? series : [{ name: title, data: data ?? [], accent }]),
    [series, data, title, accent],
  );

  const selectedOption =
    periods.find((p) => p.label === selectedLabel) ?? periods[periods.length - 1];

  // Slice series according to selected period window
  const visibleSeries = useMemo(
    () => baseSeries.map((s) => ({ ...s, data: sliceWindow(s.data, selectedOption?.points) })),
    [baseSeries, selectedOption],
  );

  const primary = visibleSeries[0];
  const isMulti = visibleSeries.length > 1;
  const hasData = (primary?.data?.length ?? 0) >= 2;

  // Derive stats from primary series
  const stats = useMemo(() => {
    const vals = primary?.data?.map((d) => d.value) ?? [];
    const sum = vals.reduce((a, b) => a + b, 0);
    const first = vals[0] ?? 0;
    const last = vals[vals.length - 1] ?? 0;
    const prev = vals.length >= 2 ? vals[vals.length - 2] : first;
    const net = last - first;

    let pct = 0;
    if (first > 0) {
      pct = ((last - first) / first) * 100;
    } else if (last > 0) {
      pct = 100;
    }

    const step = last - prev;
    const peak = vals.length ? Math.max(...vals) : 0;
    const low = vals.length ? Math.min(...vals) : 0;
    const avg = vals.length ? sum / vals.length : 0;

    return {
      sum,
      net,
      pct,
      step,
      peak,
      low,
      avg,
    };
  }, [primary]);

  // Determine trend color
  const resolvedTrend =
    trend ?? (stats.net > 0 ? 'up' : stats.net < 0 ? 'down' : 'flat');
  const resolvedAccent =
    accent ?? (resolvedTrend === 'up' ? 'emerald' : resolvedTrend === 'down' ? 'rose' : 'neutral');
  const color = ACCENTS[resolvedAccent] || ACCENTS.emerald || ACCENTS.brand;
  const TrendIcon =
    resolvedTrend === 'flat' ? ArrowRight : resolvedTrend === 'down' ? ArrowDown : ArrowUp;

  const fmtCompact = (n) => (valueFormatter ? valueFormatter(n) : formatCompact(n, unit));
  const fmtFull = (n) => (unit === '₹' ? `₹${Number(n).toLocaleString('en-IN')}` : `${Number(n).toLocaleString('en-IN')}${unit ? ` ${unit}` : ''}`);
  const fmtDate = dateFormatter ?? ((d) => d);

  const displayTotal = total ?? fmtCompact(stats.sum);
  const displayDelta = delta ?? (stats.step >= 0 ? `+${fmtCompact(stats.step)}` : `−${fmtCompact(Math.abs(stats.step))}`);
  const displayPercent = percent ?? (stats.pct > 0 ? `+${stats.pct.toFixed(1)}%` : `${stats.pct.toFixed(1)}%`);

  // Color each series
  const chartSeries = visibleSeries.map((s, i) => ({
    name: s.name,
    data: s.data,
    color: s.accent
      ? (ACCENTS[s.accent]?.stroke || color.stroke)
      : isMulti
        ? SERIES_COLORS[i % SERIES_COLORS.length]
        : color.stroke,
  }));

  const lastIndex = (primary?.data?.length ?? 1) - 1;
  const fallback = Math.min(defaultIndex ?? lastIndex, lastIndex);

  const handlePeriodChange = (option) => {
    setSelectedLabel(option.label);
    setHoveredPoint(null);
    onPeriodChange?.(option);
  };

  if (loading) {
    return (
      <div className={shell} aria-busy="true">
        <div className={`flex flex-1 flex-col ${sz.pad}`}>
          <div className="flex items-center justify-between">
            <div className="h-5 w-32 animate-pulse rounded bg-[var(--bg-muted)]" />
            <div className="h-5 w-24 animate-pulse rounded bg-[var(--bg-muted)]" />
          </div>
          <div className="mt-5 h-10 w-36 animate-pulse rounded-lg bg-[var(--bg-muted)]" />
          <div className="mt-auto h-20 w-full animate-pulse rounded-lg bg-[var(--bg-muted)]/50" />
        </div>
        <div className={`border-t border-[var(--border)] ${sz.footer}`}>
          <div className="h-4 w-40 animate-pulse rounded bg-[var(--bg-muted)]" />
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className={shell}>
        <div className={`flex flex-1 flex-col ${sz.pad}`}>
          <h3 className={`${sz.title} font-bold tracking-tight text-[var(--text-primary)]`}>{title}</h3>
          <div className="flex flex-1 flex-col items-center justify-center gap-1 py-10 text-center">
            <p className="text-sm font-medium text-[var(--text-primary)]">No data yet</p>
            <p className="text-xs text-[var(--text-muted)]">
              Metrics will appear once data is available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      {/* Chart Zone (on right, behind content) - Fully Interactive & Responsive */}
      <div className="absolute inset-y-0 right-0 z-0 pointer-events-auto" style={{ width: `${REGION_W}%` }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(to left, ${color.stroke}0e, transparent 80%)` }}
        />

        <MetricChart
          series={chartSeries}
          view={view}
          defaultIndex={fallback}
          valueFormatter={fmtFull}
          dateFormatter={fmtDate}
          onHoverPoint={setHoveredPoint}
        />
      </div>

      {/* Main Content (Foreground) */}
      <div className={`pointer-events-none relative z-10 flex flex-1 flex-col ${sz.pad}`}>
        {/* Header row: Title + ViewToggle on left, Trend badge + Period select on right */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className={`${sz.title} font-semibold text-[var(--text-primary)] truncate`}>
              {title}
            </h3>
            <ViewToggle value={view} onChange={setView} />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span
              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
              style={{ backgroundColor: `${color.stroke}15`, color: color.text }}
            >
              <TrendIcon size={11} strokeWidth={2.4} />
              {displayPercent}
            </span>
            <PeriodSelect
              value={selectedLabel}
              options={periods}
              onChange={handlePeriodChange}
              accentText={color.text}
            />
          </div>
        </div>

        {/* Legend (only when multiple series) */}
        {isMulti && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {chartSeries.map((s) => (
              <span
                key={s.name}
                className="flex items-center gap-1 text-[10.5px] text-[var(--text-muted)]"
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                {s.name}
              </span>
            ))}
          </div>
        )}

        {/* Value Headline + Live Hover Tracking Subline */}
        <div className="mt-2 sm:mt-3">
          <div className="text-[10.5px] font-medium text-[var(--text-muted)] min-h-[15px] mb-0.5">
            {hoveredPoint ? `${hoveredPoint.date} · ${fmtFull(hoveredPoint.value)}` : `${selectedLabel} total`}
          </div>
          <div
            className={`${sz.headline} font-bold tracking-tight text-[var(--text-primary)] transition-all`}
          >
            {hoveredPoint ? fmtCompact(hoveredPoint.value) : displayTotal}
          </div>
        </div>
      </div>

      {/* Footer: Delta on left, secondary stats on right */}
      <div
        className={`relative z-10 flex items-center justify-between gap-2 border-t border-[var(--border)]/70 bg-[var(--bg-surface)] ${sz.footer} text-[10.5px]`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold text-[11px]" style={{ color: color.text }}>
            {hoveredPoint && hoveredPoint.index > 0 ? (
              (() => {
                const prevVal = primary?.data?.[hoveredPoint.index - 1]?.value ?? 0;
                const diff = hoveredPoint.value - prevVal;
                return diff >= 0 ? `+${fmtCompact(diff)}` : `−${fmtCompact(Math.abs(diff))}`;
              })()
            ) : displayDelta}
          </span>
          <span className="text-[var(--text-muted)] text-[10.5px] truncate">
            {hoveredPoint && hoveredPoint.index > 0
              ? `vs ${primary?.data?.[hoveredPoint.index - 1]?.date || 'prev'}`
              : deltaLabel}
          </span>
        </div>
        {showStats && (
          <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] shrink-0 font-medium">
            <span className="inline-flex items-center gap-1">
              <span className="text-[var(--text-subtle)] text-[9px] uppercase font-semibold">Peak</span>
              <span className="font-semibold text-[var(--text-primary)]">{fmtCompact(stats.peak)}</span>
            </span>
            <span className="opacity-25">·</span>
            <span className="inline-flex items-center gap-1">
              <span className="text-[var(--text-subtle)] text-[9px] uppercase font-semibold">Low</span>
              <span className="font-semibold text-[var(--text-primary)]">{fmtCompact(stats.low)}</span>
            </span>
            <span className="opacity-25">·</span>
            <span className="inline-flex items-center gap-1">
              <span className="text-[var(--text-subtle)] text-[9px] uppercase font-semibold">Avg</span>
              <span className="font-semibold text-[var(--text-primary)]">{fmtCompact(Math.round(stats.avg))}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
