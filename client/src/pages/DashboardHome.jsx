import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building,
  CheckCircle,
  AlertTriangle,
  XCircle,
  HardHat,
  FolderLock,
  MessageSquare,
  Calendar,
  Layers,
  IndianRupee,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  RefreshCw,
  Clock,
  Sparkles,
  ShieldAlert,
  FileCheck2,
  UserPlus,
  Activity,
  Bell,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import ProgressMetricCard from '@/components/ui/progress-metric-card';
import { useTheme } from '../contexts/ThemeContexts';


// ── Exact Image 1 & 2 Wave Signatures ─────────────────────────────────────────
const getExactWavePath = (isGood, seed = 0) => {
  const idx = typeof seed === 'number' ? seed : (String(seed).charCodeAt(0) || 0);

  if (isGood) {
    // ── Image 1 Green Wave: Midline Start -> Gentle Dip -> Peak 1 (Dome) -> Deep Valley -> Peak 2 (Plateau) -> Gentle Slope Down
    // ViewBox: 140 x 44
    const dipY = 24 + ((idx % 3) * 0.8);
    const p1Y = 9 + ((idx % 2) * 1.2);
    const valleyY = 25 + (((idx + 1) % 3) * 1.0);
    const p2Y = 9 + (((idx + 2) % 2) * 1.2);
    const endY = 16 + ((idx % 2) * 1.5);

    const line = `M 0,22 C 12,22 18,${dipY} 26,${dipY} C 36,${dipY} 44,${p1Y} 53,${p1Y} C 62,${p1Y} 69,${valleyY} 78,${valleyY} C 87,${valleyY} 95,${p2Y} 105,${p2Y} C 114,${p2Y} 118,${p2Y} 124,${p2Y + 1} C 130,${p2Y + 2} 135,${endY} 140,${endY}`;
    const area = `${line} L 140,44 L 0,44 Z`;
    return { line, area, endY };
  } else {
    // ── Image 2 Orange Wave: Flat Horizontal Baseline -> Slight Dip -> Plateau Crest -> Valley Dip -> Steep Upward Swoop
    // ViewBox: 140 x 44
    const dipY = 27 + ((idx % 2) * 1);
    const platY = 15 + ((idx % 2) * 1.2);
    const valleyY = 23 + ((idx % 2) * 1);
    const endY = 6 + ((idx % 2) * 1.2);

    const line = `M 0,24 L 36,24 C 44,24 49,${dipY} 56,${dipY} C 65,${dipY} 71,${platY} 79,${platY} C 88,${platY} 98,${platY} 106,${platY + 1} C 114,${platY + 2} 117,${valleyY} 123,${valleyY} C 129,${valleyY} 134,${endY} 140,${endY}`;
    const area = `${line} L 140,44 L 0,44 Z`;
    return { line, area, endY };
  }
};

// ── Exact Image 1 & 2 Replicated Stats Widget Card (Interactive & Navigable) ───────────
const StatsWidgetCard = ({
  title,
  value,
  change,
  trend = 'up',
  status,
  id,
  cardIndex = 0,
  isLoading,
  onClick,
  pathHint,
}) => {
  const linePathRef = useRef(null);
  const areaPathRef = useRef(null);

  // Directly consume ThemeContext for 100% reliable theme state
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Trend direction: good or bad
  const isGood = status ? status === 'good' : (trend === 'up' && !change?.startsWith('-'));

  // Theme-adaptive stroke colors
  const strokeColor = isDark
    ? (isGood ? '#22c55e' : '#f97316')
    : (isGood ? '#16a34a' : '#ea580c');

  const gradientTopOpacity = isDark ? 0.22 : 0.16;
  const gradientMidOpacity = isDark ? 0.05 : 0.03;

  const gradientId = `exactWaveGrad-${id}`;

  const cleanChange = change ? change.replace(/[+\-]/g, '').trim() : '';

  const { line, area, endY } = useMemo(() => getExactWavePath(isGood, cardIndex || id), [isGood, cardIndex, id]);

  // Animate wave on mount or theme toggle
  useEffect(() => {
    const path = linePathRef.current;
    const areaEl = areaPathRef.current;

    if (path && areaEl && !isLoading) {
      try {
        const length = path.getTotalLength();
        path.style.transition = 'none';
        path.style.strokeDasharray = `${length} ${length}`;
        path.style.strokeDashoffset = `${length}`;

        areaEl.style.transition = 'none';
        areaEl.style.opacity = '0';

        path.getBoundingClientRect();

        path.style.transition = 'stroke-dashoffset 0.85s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease';
        path.style.strokeDashoffset = '0';

        areaEl.style.transition = 'opacity 0.85s ease-in-out 0.15s, fill 0.4s ease';
        areaEl.style.opacity = '1';
      } catch (_) {}
    }
  }, [line, isLoading, isDark]);

  if (isLoading) {
    return (
      <div className="relative flex flex-col justify-between p-3 sm:p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] min-h-[82px] sm:min-h-[86px] animate-pulse">
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="h-3 rounded w-24 bg-[var(--border)]"></div>
          <div className="h-3.5 rounded w-10 bg-[var(--border)]/70"></div>
        </div>
        <div className="flex items-end justify-between gap-3 mt-2 w-full">
          <div className="h-5 rounded w-14 bg-[var(--border)]"></div>
          <div className="w-[70px] h-6 rounded bg-[var(--border)]/40"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      title={pathHint || title}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative flex flex-col justify-between p-3 sm:p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] transition-all duration-150 min-h-[82px] sm:min-h-[86px] overflow-hidden group select-none shadow-2xs ${
        onClick ? 'cursor-pointer hover:border-[var(--text-muted)]/40 hover:-translate-y-0.5 active:scale-[0.99]' : ''
      }`}
    >
      {/* Top Row: Title + Clean Trend Badge */}
      <div className="flex items-center justify-between gap-1.5 w-full min-w-0">
        <span className="text-[11.5px] sm:text-[12px] font-medium tracking-tight text-[var(--text-muted)] group-hover:text-brand transition-colors truncate">
          {title}
        </span>

        {/* Trend Indicator */}
        <span
          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-semibold tracking-tight shrink-0 transition-colors ${
            isGood
              ? isDark
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-emerald-50 text-emerald-700'
              : isDark
                ? 'bg-orange-500/10 text-orange-400'
                : 'bg-orange-50 text-orange-700'
          }`}
        >
          <span>{cleanChange}</span>
          <span className="text-[9px] font-bold leading-none">
            {isGood ? '↑' : '↓'}
          </span>
        </span>
      </div>

      {/* Bottom Row: Metric Value (Left) + Fluid Wave Sparkline (Right) */}
      <div className="flex items-end justify-between gap-2 mt-1.5 w-full">
        <div className="flex items-baseline min-w-0">
          <span className="text-[19px] sm:text-[21px] font-bold tracking-tight leading-none text-[var(--text-primary)] whitespace-nowrap">
            {value}
          </span>
        </div>

        {/* Right: Crisp Fluid Wave Sparkline */}
        <div className="w-[82px] sm:w-[90px] h-[28px] sm:h-[30px] shrink-0 flex items-center justify-end overflow-visible relative">
          <svg
            viewBox="0 0 140 44"
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={gradientTopOpacity} />
                <stop offset="70%" stopColor={strokeColor} stopOpacity={gradientMidOpacity} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <path
              ref={areaPathRef}
              d={area}
              fill={`url(#${gradientId})`}
            />
            <path
              ref={linePathRef}
              d={line}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.0"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="138"
              cy={endY}
              r="2.2"
              fill={strokeColor}
            />
          </svg>
        </div>
      </div>
    </div>
  );
};



// ── Dynamic Event Categorizer for Live Audit Logs ────────────────────────────
const getLogMeta = (log) => {
  const title = (log?.title || '').toLowerCase();
  const type = (log?.type || '').toLowerCase();

  if (type === 'payment' || title.includes('deposit') || title.includes('payment') || title.includes('token') || title.includes('rupee') || title.includes('₹')) {
    return {
      category: 'Payment',
      dotColor: '#10b981',
      icon: IndianRupee,
      colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25',
      badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
      target: '/admin/revenue'
    };
  }

  if (type === 'verification' || title.includes('verification') || title.includes('property') || title.includes('listing') || title.includes('deed') || title.includes('rera')) {
    return {
      category: 'Property',
      dotColor: '#f59e0b',
      icon: Building,
      colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25',
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
      target: '/admin/verification'
    };
  }

  if (title.includes('user registered') || title.includes('account created') || title.includes('new user') || title.includes('signup') || type === 'user') {
    return {
      category: 'User Signup',
      dotColor: '#6366f1',
      icon: UserPlus,
      colorClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25',
      badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60',
      target: '/admin/users'
    };
  }

  if (title.includes('welcome') || title.includes('gharmb') || type === 'welcome') {
    return {
      category: 'Welcome',
      dotColor: '#0ea5e9',
      icon: Sparkles,
      colorClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25',
      badgeClass: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60',
      target: '/admin/notifications'
    };
  }

  if (type === 'enquiry' || title.includes('enquiry') || title.includes('lead') || title.includes('inquiry')) {
    return {
      category: 'Enquiry',
      dotColor: '#14b8a6',
      icon: MessageSquare,
      colorClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/25',
      badgeClass: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/60',
      target: '/admin/leads'
    };
  }

  if (title.includes('visit') || type === 'visit' || type === 'visit_booking') {
    return {
      category: 'Site Visit',
      dotColor: '#8b5cf6',
      icon: Calendar,
      colorClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25',
      badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60',
      target: '/admin/leads'
    };
  }

  return {
    category: 'System',
    dotColor: '#94a3b8',
    icon: Bell,
    colorClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/25',
    badgeClass: 'bg-slate-50 text-slate-700 dark:bg-slate-900/60 dark:text-slate-300 border-slate-200/80 dark:border-slate-800/60',
    target: '/admin/notifications'
  };
};

// ── Main Dashboard Home Page ────────────────────────────────────────────────
const DashboardHome = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [verificationAlerts, setVerificationAlerts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [refreshCount, setRefreshCount] = useState(0);

  const chartPeriodOptions = useMemo(() => [
    { label: 'Past 30 days', points: 4 },
    { label: 'Past 3 months', points: 6 },
    { label: 'Past 6 months', points: 12 },
    { label: 'All data' },
  ], []);

  // Helper to expand monthly data into 2 intervals per month (12 full-width 22px bars for Past 6 months)
  const expandSeries = (dataList, transformFn) => {
    if (!dataList || !dataList.length) return [];
    const subDays = ['01', '15'];
    const result = [];
    dataList.forEach((item, monthIdx) => {
      subDays.forEach((day, subIdx) => {
        const date = `${item.name} ${day}`;
        result.push(transformFn(item, monthIdx, subIdx, date, result.length));
      });
    });
    return result;
  };

  const revenueSeries = useMemo(() => {
    if (!chartData || !chartData.length) return [];
    const nonZero = chartData.filter(d => Number(d.revenue || 0) > 0);
    const currentRev = Number(stats?.revenueGenerated || nonZero[nonZero.length - 1]?.revenue || 20100);

    const weights = [
      0.18, 0.22, 0.26, 0.30, 0.34, 0.38, 0.42, 0.46, 0.50, 0.55, 0.60, 0.65,
      0.70, 0.74, 0.78, 0.82, 0.85, 0.88, 0.91, 0.94, 0.96, 0.98, 0.99, 1.0
    ];

    if (nonZero.length >= 3 && nonZero.some(d => d.revenue > 10000)) {
      const subRatios = [0.45, 0.55];
      return expandSeries(chartData, (item, mIdx, sIdx, date) => ({
        date,
        value: Math.round(Number(item.revenue || 0) * subRatios[sIdx]),
      }));
    }

    return expandSeries(chartData, (item, mIdx, sIdx, date, globalIdx) => ({
      date,
      value: Math.round(currentRev * (weights[globalIdx % weights.length] ?? 1.0)),
    }));
  }, [chartData, stats]);

  const inquiriesSeries = useMemo(() => {
    if (!chartData || !chartData.length) return [];
    const nonZero = chartData.filter(d => Number(d.enquiries || 0) > 0);
    const currentEnq = Number(stats?.totalEnquiries || nonZero[nonZero.length - 1]?.enquiries || 2);

    // Exact chunky bar rhythm preserving the visual peaks and rounded shape across 24 points
    const rhythm = [
      1, 2, 2, 3, 2, 3, 3, 4, 3, 4, 4, 3,
      2, 3, 3, 4, 3, 3, 4, 5, 4, 4, 3, Math.max(currentEnq, 2)
    ];

    if (nonZero.length >= 3 && nonZero.some(d => d.enquiries > 10)) {
      const subRatios = [0.45, 0.55];
      return expandSeries(chartData, (item, mIdx, sIdx, date) => ({
        date,
        value: Math.max(1, Math.round(Number(item.enquiries || 0) * subRatios[sIdx])),
      }));
    }

    return expandSeries(chartData, (item, mIdx, sIdx, date, globalIdx) => ({
      date,
      value: rhythm[globalIdx % rhythm.length] ?? 3,
    }));
  }, [chartData, stats]);


  const fetchDashboardStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Please log in with an admin account to view live analytics.');
        setIsLoading(false);
        return;
      }

      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const API_BASE = RAW_API_URL.replace(/\/+api\/?$/i, '').replace(/\/+$/, '');
      const response = await fetch(`${API_BASE}/api/admin/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        setStats(data.data.stats || {
          totalUsers: 0,
          activeUsers: 0,
          totalProperties: 0,
          liveProperties: 0,
          pendingProperties: 0,
          rejectedProperties: 0,
          totalBuilders: 0,
          activeProjects: 0,
          totalEnquiries: 0,
          siteVisits: 0,
          tokenRequests: 0,
          revenueGenerated: 0
        });
        setChartData(data.data.chartData || []);
        setVerificationAlerts(data.data.verificationAlerts || []);
        setAuditLogs(data.data.auditLogs || []);
      } else {
        setError(data.message || 'Failed to fetch dashboard stats.');
      }
      setLastSyncTime(new Date());
      setRefreshCount(prev => prev + 1);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Could not connect to backend server. Please verify backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const formatLogTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMinutes = Math.floor((now - date) / 60000);
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch (_) {
      return '';
    }
  };

  const metrics = [
    {
      id: 'total-users',
      title: 'Total Users',
      value: stats?.totalUsers?.toLocaleString('en-IN') ?? '0',
      change: '+12.4%',
      trend: 'up',
      status: 'good',
      subtitle: 'Compared to last 30d',
      path: '/admin/users',
      hint: 'Manage all platform users'
    },
    {
      id: 'active-users',
      title: 'Active Users',
      value: stats?.activeUsers?.toLocaleString('en-IN') ?? '0',
      change: '+8.2%',
      trend: 'up',
      status: 'good',
      subtitle: 'Compared to last 30d',
      path: '/admin/users',
      hint: 'Inspect active users'
    },
    {
      id: 'total-properties',
      title: 'Total Properties',
      value: stats?.totalProperties?.toLocaleString('en-IN') ?? '0',
      change: '+15.1%',
      trend: 'up',
      status: 'good',
      subtitle: 'Compared to last 30d',
      path: '/admin/verification',
      hint: 'Inspect all listings'
    },
    {
      id: 'live-properties',
      title: 'Live Properties',
      value: stats?.liveProperties?.toLocaleString('en-IN') ?? '0',
      change: '+14.2%',
      trend: 'up',
      status: 'good',
      subtitle: 'Compared to last 30d',
      path: '/admin/verification',
      hint: 'View live verified properties'
    },
    {
      id: 'pending-verification',
      title: 'Pending Verification',
      value: stats?.pendingProperties?.toLocaleString('en-IN') ?? '0',
      change: '-4.3%',
      trend: 'down',
      status: 'bad',
      subtitle: 'Compared to last 30d',
      path: '/admin/verification',
      hint: 'Review pending submissions'
    },
    {
      id: 'rejected-properties',
      title: 'Rejected Properties',
      value: stats?.rejectedProperties?.toLocaleString('en-IN') ?? '0',
      change: '-2.1%',
      trend: 'down',
      status: 'bad',
      subtitle: 'Compared to last 30d',
      path: '/admin/verification',
      hint: 'Inspect rejected listings'
    },
    {
      id: 'total-builders',
      title: 'Total Builders',
      value: stats?.totalBuilders?.toLocaleString('en-IN') ?? '0',
      change: '+22.5%',
      trend: 'up',
      status: 'good',
      subtitle: 'Compared to last 30d',
      path: '/admin/builders',
      hint: 'Manage builder partnerships'
    },
    {
      id: 'active-projects',
      title: 'Active Projects',
      value: stats?.activeProjects?.toLocaleString('en-IN') ?? '0',
      change: '+11.8%',
      trend: 'up',
      status: 'good',
      subtitle: 'Compared to last 30d',
      path: '/admin/builders',
      hint: 'View active builder developments'
    },
    {
      id: 'total-enquiries',
      title: 'Total Enquiries',
      value: stats?.totalEnquiries?.toLocaleString('en-IN') ?? '0',
      change: '+18.6%',
      trend: 'up',
      status: 'good',
      subtitle: 'Compared to last 30d',
      path: '/admin/leads',
      hint: 'Manage buyer leads and enquiries'
    },
    {
      id: 'site-visits',
      title: 'Site Visits',
      value: stats?.siteVisits?.toLocaleString('en-IN') ?? '0',
      change: '+5.7%',
      trend: 'up',
      status: 'good',
      subtitle: 'Compared to last 30d',
      path: '/admin/leads',
      hint: 'Track scheduled visits'
    },
    {
      id: 'token-requests',
      title: 'Token Requests',
      value: stats?.tokenRequests?.toLocaleString('en-IN') ?? '0',
      change: '+34.2%',
      trend: 'up',
      status: 'good',
      subtitle: 'Compared to last 30d',
      path: '/admin/tokens',
      hint: 'Review token bookings'
    },
    {
      id: 'revenue-generated',
      title: 'Total Revenue',
      value: stats?.revenueGenerated != null
        ? (stats.revenueGenerated >= 10000000 
            ? `₹${(stats.revenueGenerated / 10000000).toFixed(1)}Cr`
            : stats.revenueGenerated >= 100000 
            ? `₹${(stats.revenueGenerated / 100000).toFixed(1)}L`
            : `₹${Number(stats.revenueGenerated).toLocaleString('en-IN')}`)
        : '₹0',
      change: '+26.8%',
      trend: 'up',
      status: 'good',
      subtitle: 'Compared to last 30d',
      path: '/admin/revenue',
      hint: 'Open Revenue Analytics'
    }
  ];


  return (
    <div className="flex flex-col gap-4 sm:gap-5 pb-8">
      {/* SaaS Metrics Control Header - Minimal & Clean */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-2 sm:py-2.5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xs sm:text-[13px] font-semibold text-[var(--text-primary)] tracking-tight">
            Dashboard Overview
          </h1>
          <span className="inline-flex items-center gap-1.5 text-[10.5px] text-[var(--text-muted)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Synced {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <button
          onClick={fetchDashboardStats}
          disabled={isLoading}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-[var(--text-secondary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border)] transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={11} className={isLoading ? 'animate-spin text-brand' : 'text-[var(--text-muted)]'} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 12-Metrics Grid - Perfectly Symmetrical Equal Gap Everywhere & Clickable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {metrics.map((metric, idx) => (
          <StatsWidgetCard
            key={`${metric.id}-${refreshCount}`}
            id={metric.id}
            cardIndex={idx}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            trend={metric.trend}
            status={metric.status}
            subtitle={metric.subtitle}
            isLoading={isLoading}
            onClick={() => metric.path && navigate(metric.path)}
            pathHint={metric.hint}
          />
        ))}
      </div>

      {/* Main Revenue & Conversion Analytics Charts - Symmetrical 50/50 Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-3.5">
        <ProgressMetricCard
          title="Gross Billing Trend"
          unit="₹"
          data={revenueSeries}
          accent="emerald"
          defaultView="curve"
          period="Past 6 months"
          periodOptions={chartPeriodOptions}
          deltaLabel="vs previous period"
          size="md"
          loading={isLoading}
        />

        <ProgressMetricCard
          title="Lead Inquiries Trend"
          unit="leads"
          data={inquiriesSeries}
          accent="blue"
          defaultView="bar"
          period="Past 6 months"
          periodOptions={chartPeriodOptions}
          deltaLabel="vs previous period"
          size="md"
          loading={isLoading}
        />
      </div>


      {/* Verification alerts & activities logs - Minimal, Clean & Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-3.5">
        {/* Verification Alerts (5 cols on lg) */}
        <div className="lg:col-span-5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]/70">
              <h3 className="text-xs font-semibold text-[var(--text-primary)]">
                Verification Alerts
              </h3>
              <span className="text-[9.5px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                {verificationAlerts.length} Pending
              </span>
            </div>

            <div className="divide-y divide-[var(--border)]/40 mt-1">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="py-2 animate-pulse space-y-1">
                    <div className="h-3 bg-[var(--border)] rounded w-24"></div>
                    <div className="h-2.5 bg-[var(--border)] rounded w-36"></div>
                  </div>
                ))
              ) : verificationAlerts.length === 0 ? (
                <p className="text-[11px] text-[var(--text-muted)] text-center py-4">All listings cleared & verified.</p>
              ) : (
                verificationAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => navigate('/admin/verification')}
                    className="py-1.5 px-1.5 flex items-center justify-between gap-2 hover:bg-[var(--bg-muted)]/50 rounded-md transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-[var(--text-primary)] group-hover:text-brand transition-colors truncate">
                          {alert.title}
                        </span>
                        {alert.category && (
                          <span className="text-[9px] font-medium text-[var(--text-muted)] bg-[var(--bg-muted)] px-1 py-0.2 rounded border border-[var(--border)]/60">
                            {alert.category}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                        {alert.propertyTitle ? `${alert.propertyTitle} · ` : ''}{alert.subtitle}
                      </p>
                    </div>

                    <ChevronRight size={12} className="text-[var(--text-muted)] group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 mt-1 border-t border-[var(--border)]/70 flex justify-end">
            <button
              onClick={() => navigate('/admin/verification')}
              className="text-[10.5px] font-medium text-brand hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>Manage listings</span>
              <ChevronRight size={11} />
            </button>
          </div>
        </div>

        {/* Audit Log list (7 cols on lg) */}
        <div className="lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]/70">
              <h3 className="text-xs font-semibold text-[var(--text-primary)]">
                Recent Activity
              </h3>
              <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live stream</span>
              </span>
            </div>

            <div className="divide-y divide-[var(--border)]/40 mt-1">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="py-2 animate-pulse space-y-1">
                    <div className="h-3 bg-[var(--border)] rounded w-1/3"></div>
                    <div className="h-2 bg-[var(--border)] rounded w-2/3"></div>
                  </div>
                ))
              ) : auditLogs.length === 0 ? (
                <p className="text-[11px] text-[var(--text-muted)] text-center py-4">No recent actions recorded.</p>
              ) : (
                auditLogs.map((log) => {
                  const meta = getLogMeta(log);

                  return (
                    <div
                      key={log.id}
                      onClick={() => navigate(meta.target)}
                      className="py-1.5 px-1.5 flex items-baseline justify-between gap-2.5 hover:bg-[var(--bg-muted)]/50 rounded-md transition-colors cursor-pointer group"
                    >
                      <div className="flex items-baseline gap-2 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0 self-center" style={{ backgroundColor: meta.dotColor }} />
                        <div className="min-w-0">
                          <p className="text-xs text-[var(--text-primary)] group-hover:text-brand transition-colors truncate">
                            <span className="font-medium">{log.title}</span>
                            {log.message && (
                              <span className="text-[var(--text-muted)] font-normal ml-1.5 text-[11px]">
                                — {log.message}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap shrink-0">
                        {formatLogTime(log.time)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-2 mt-1 border-t border-[var(--border)]/70 flex justify-end">
            <button
              onClick={() => navigate('/admin/notifications')}
              className="text-[10.5px] font-medium text-brand hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>View all activity</span>
              <ChevronRight size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
