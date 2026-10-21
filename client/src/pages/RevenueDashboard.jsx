import React, { useState, useEffect, useMemo, useRef } from 'react';
import AdminLoader from '../components/common/AdminLoader';
import API from '../api/api';
import Badge from '../components/ui/Badge';
import {
  TrendingUp,
  ShieldCheck,
  RotateCcw,
  ArrowUpRight,
  Sparkles,
  Zap,
  Search,
  X,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  RefreshCw,
  Receipt,
  Check,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  FileText,
  Copy,
  ExternalLink,
  Clock,
  List,
  LayoutGrid,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import ProgressMetricCard from '../components/ui/progress-metric-card';

const RevenueDashboard = () => {
  // ── 01. Data States ────────────────────────────────────────────────────────
  const [stats, setStats] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [trajectories, setTrajectories] = useState({
    daily: { gross: [], escrow: [] },
    weekly: { gross: [], escrow: [] },
    monthly: { gross: [], escrow: [] }
  });
  const [tokens, setTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState('Just now');
  const lastSyncTimestampRef = useRef(Date.now());

  // ── 02. Filter & View States ──────────────────────────────────────────────
  const [tokenFilter, setTokenFilter] = useState('All'); // 'All' | 'Pending' | 'Approved' | 'Refunded'
  const [amountTierFilter, setAmountTierFilter] = useState('ALL'); // 'ALL' | 'HIGH_VALUE' | 'MEDIUM' | 'MICRO'
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('revenue_view_mode') || 'table';
    } catch {
      return 'table';
    }
  });

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('revenue_view_mode', mode);
    } catch {
      // ignore
    }
  };

  // ── 03. Modal & Action States ─────────────────────────────────────────────
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [activeChartMetric, setActiveChartMetric] = useState('gross'); // 'gross' | 'escrow'
  const [selectedPeriod, setSelectedPeriod] = useState('Past 6 months');

  // ── 04. Sliding Switch Geometries ─────────────────────────────────────────
  const statusTabRefs = useRef({});
  const [statusIndicatorStyle, setStatusIndicatorStyle] = useState({ left: 4, width: 0, opacity: 0 });

  const viewModeRefs = useRef({});
  const [viewModeIndicatorStyle, setViewModeIndicatorStyle] = useState({ left: 4, width: 0, opacity: 0 });

  // ── 05. Toast Notification System ─────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const copyToClipboard = (text, label = 'Text') => {
    if (!text || text === 'N/A') return;
    navigator.clipboard?.writeText(text);
    showToast(`${label} copied to clipboard!`, 'info');
  };

  // ── 06. Fetch Revenue Data ────────────────────────────────────────────────
  const fetchRevenueData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const response = await API.get('/admin/dashboard/revenue');
      const data = response.data;
      if (data && data.status === 'success') {
        setStats(data.data.stats || {
          totalRevenue: 0,
          featuredRev: 0,
          premiumRev: 0,
          boostRev: 0,
          escrowCommission: 0,
          heldEscrow: 0,
          settledEscrow: 0,
          refundedEscrow: 0,
          counts: {
            featuredCount: 0,
            premiumCount: 0,
            boostCount: 0,
            totalTokens: 0,
            pendingTokens: 0,
            settledTokens: 0,
            refundedTokens: 0
          },
          changes: {
            revenueGrowth: '0.0%',
            subsGrowth: '0.0%',
            boostGrowth: '0.0%',
            escrowGrowth: '0.0%'
          }
        });
        setRevenueTrend(data.data.revenueTrend || []);
        setTrajectories(data.data.trajectories || {
          daily: { gross: [], escrow: [] },
          weekly: { gross: [], escrow: [] },
          monthly: { gross: [], escrow: [] }
        });
        setTokens(data.data.tokenTransactions || []);
        lastSyncTimestampRef.current = Date.now();
        setLastSyncTime('Just now');
      } else {
        setError(data?.message || 'Failed to fetch revenue data.');
      }
    } catch (err) {
      console.error('Error fetching revenue details:', err);
      setError(err.response?.data?.message || 'Could not connect to backend server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
    const interval = setInterval(() => {
      const diffSec = Math.floor((Date.now() - lastSyncTimestampRef.current) / 1000);
      if (diffSec < 60) setLastSyncTime('Just now');
      else if (diffSec < 3600) setLastSyncTime(`${Math.floor(diffSec / 60)}m ago`);
      else setLastSyncTime(`${Math.floor(diffSec / 3600)}h ago`);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── 07. Action Handlers (Approve / Refund Token) ───────────────────────────
  const approveToken = async (transaction) => {
    const targetId = transaction?.rawId || transaction?.id;
    if (!targetId) return;
    setIsProcessingAction(true);
    try {
      const response = await API.patch(`/admin/tokens/${targetId}/status`, { action: 'release' });
      const data = response.data;
      if (data && data.status === 'success') {
        showToast(`Escrow for Token ${transaction.id} released to seller!`, 'success');
        await fetchRevenueData(true);
        if (selectedTransaction?.id === transaction.id || selectedTransaction?.rawId === transaction.rawId) {
          setSelectedTransaction(prev => prev ? { ...prev, status: 'Approved', escrowStatus: 'Released' } : null);
        }
      } else {
        showToast(data?.message || 'Failed to release escrow.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Error updating token status.', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const refundToken = async (transaction) => {
    const targetId = transaction?.rawId || transaction?.id;
    if (!targetId) return;
    if (!window.confirm(`Are you sure you want to refund Token ${transaction.id} to buyer?`)) return;
    setIsProcessingAction(true);
    try {
      const response = await API.patch(`/admin/tokens/${targetId}/status`, { action: 'refund' });
      const data = response.data;
      if (data && data.status === 'success') {
        showToast(`Token ${transaction.id} refunded to buyer.`, 'info');
        await fetchRevenueData(true);
        if (selectedTransaction?.id === transaction.id || selectedTransaction?.rawId === transaction.rawId) {
          setSelectedTransaction(prev => prev ? { ...prev, status: 'Refunded', escrowStatus: 'Refunded' } : null);
        }
      } else {
        showToast(data?.message || 'Failed to process refund.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Error processing refund.', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // ── 08. Counts & Aggregates ───────────────────────────────────────────────
  const counts = useMemo(() => {
    return {
      all: tokens.length,
      pending: tokens.filter(t => t.status === 'Pending').length,
      approved: tokens.filter(t => t.status === 'Approved' || t.status === 'Released').length,
      refunded: tokens.filter(t => t.status === 'Refunded').length
    };
  }, [tokens]);

  const totalRevenue = useMemo(() => {
    if (stats?.totalRevenue !== undefined) return stats.totalRevenue;
    if (!stats) return 0;
    return (
      (stats.featuredRev || 0) +
      (stats.premiumRev || 0) +
      (stats.boostRev || 0) +
      (stats.escrowCommission || 0)
    );
  }, [stats]);

  // ── 09. Status Tabs Definition with BADGES_UI_DESIGN_SYSTEM.md Tokens ──────
  const statusTabs = useMemo(() => {
    return [
      {
        key: 'All',
        label: 'All Transactions',
        icon: Receipt,
        count: counts.all,
        activeBg: 'bg-[#e2e8f0] dark:bg-[#273244]',
        activeText: 'text-[#334155] dark:text-[#cbd5e1]',
        activeCountBg: 'bg-[#334155]/15 text-[#334155] dark:bg-[#cbd5e1]/25 dark:text-[#cbd5e1]'
      },
      {
        key: 'Pending',
        label: 'Needs Action (Pending)',
        icon: Clock,
        count: counts.pending,
        pulse: counts.pending > 0,
        activeBg: 'bg-[#fef08a] dark:bg-[#4d3209]',
        activeText: 'text-[#78350f] dark:text-[#fef08a]',
        activeCountBg: 'bg-[#78350f]/15 text-[#78350f] dark:bg-[#fef08a]/25 dark:text-[#fef08a]'
      },
      {
        key: 'Approved',
        label: 'Settled & Released',
        icon: CheckCircle2,
        count: counts.approved,
        activeBg: 'bg-[#52c99b] dark:bg-[#1a4a38]',
        activeText: 'text-[#064e3b] dark:text-[#6ee7b7]',
        activeCountBg: 'bg-[#064e3b]/15 text-[#064e3b] dark:bg-[#6ee7b7]/25 dark:text-[#6ee7b7]'
      },
      {
        key: 'Refunded',
        label: 'Refunded',
        icon: RotateCcw,
        count: counts.refunded,
        activeBg: 'bg-[#fca5a5] dark:bg-[#521722]',
        activeText: 'text-[#701a2b] dark:text-[#fda4af]',
        activeCountBg: 'bg-[#701a2b]/15 text-[#701a2b] dark:bg-[#fda4af]/25 dark:text-[#fda4af]'
      }
    ];
  }, [counts]);

  const activeStatusTab = useMemo(() => {
    return statusTabs.find(t => t.key === tokenFilter) || statusTabs[0];
  }, [statusTabs, tokenFilter]);

  // ── 10. Geometry Calculators for Sliding Switch Indicators ─────────────────
  useEffect(() => {
    const updateStatusIndicator = () => {
      const el = statusTabRefs.current[tokenFilter];
      if (el) {
        setStatusIndicatorStyle({
          left: el.offsetLeft,
          width: el.offsetWidth,
          opacity: 1
        });
      }
    };
    updateStatusIndicator();
    window.addEventListener('resize', updateStatusIndicator);
    const t = setTimeout(updateStatusIndicator, 50);
    return () => {
      window.removeEventListener('resize', updateStatusIndicator);
      clearTimeout(t);
    };
  }, [tokenFilter, statusTabs]);

  useEffect(() => {
    const updateViewIndicator = () => {
      const el = viewModeRefs.current[viewMode];
      if (el) {
        setViewModeIndicatorStyle({
          left: el.offsetLeft,
          width: el.offsetWidth,
          opacity: 1
        });
      }
    };
    updateViewIndicator();
    window.addEventListener('resize', updateViewIndicator);
    const t = setTimeout(updateViewIndicator, 50);
    return () => {
      window.removeEventListener('resize', updateViewIndicator);
      clearTimeout(t);
    };
  }, [viewMode]);

  // ── 11. Filtering Logic ───────────────────────────────────────────────────
  const filteredTokens = useMemo(() => {
    return tokens.filter((t) => {
      // Status filter
      if (tokenFilter !== 'All') {
        if (tokenFilter === 'Pending' && t.status !== 'Pending') return false;
        if (tokenFilter === 'Approved' && (t.status !== 'Approved' && t.status !== 'Released')) return false;
        if (tokenFilter === 'Refunded' && t.status !== 'Refunded') return false;
      }

      // Amount Tier filter
      const numAmount = Number(String(t.amount || '').replace(/[^0-9.-]+/g, '')) || 0;
      if (amountTierFilter === 'HIGH_VALUE' && numAmount < 50000) return false;
      if (amountTierFilter === 'MEDIUM' && (numAmount < 10000 || numAmount >= 50000)) return false;
      if (amountTierFilter === 'MICRO' && numAmount >= 10000) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          t.id?.toLowerCase().includes(q) ||
          t.buyer?.toLowerCase().includes(q) ||
          t.buyerPhone?.toLowerCase().includes(q) ||
          t.seller?.toLowerCase().includes(q) ||
          t.sellerPhone?.toLowerCase().includes(q) ||
          t.property?.toLowerCase().includes(q) ||
          t.amount?.toLowerCase().includes(q) ||
          t.utrRef?.toLowerCase().includes(q) ||
          t.paymentMethod?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tokens, tokenFilter, amountTierFilter, searchQuery]);

  // ── 12. Trajectory Series ─────────────────────────────────────────────────
  const chartPeriodOptions = useMemo(() => [
    { label: 'Past 30 days', points: 30 },
    { label: 'Past 3 months', points: 12 },
    { label: 'Past 6 months', points: 6 },
    { label: 'All data' },
  ], []);

  const activeSeriesData = useMemo(() => {
    const isGross = activeChartMetric === 'gross';

    if (selectedPeriod === 'Past 30 days') {
      const dailyList = isGross ? trajectories?.daily?.gross : trajectories?.daily?.escrow;
      if (dailyList && dailyList.length >= 2) return dailyList;
    }

    if (selectedPeriod === 'Past 3 months') {
      const weeklyList = isGross ? trajectories?.weekly?.gross : trajectories?.weekly?.escrow;
      if (weeklyList && weeklyList.length >= 2) return weeklyList.slice(-12);
    }

    const monthlyList = isGross ? trajectories?.monthly?.gross : trajectories?.monthly?.escrow;
    if (monthlyList && monthlyList.length >= 2) return monthlyList;

    if (revenueTrend && revenueTrend.length >= 2) {
      return revenueTrend.map(m => ({
        date: m.month,
        value: isGross ? m.total : m.escrow
      }));
    }

    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fallbackSeries = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      fallbackSeries.push({
        date: `${months[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`,
        value: i === 0 ? (isGross ? totalRevenue : (stats?.escrowCommission || 0)) : 0
      });
    }
    return fallbackSeries;
  }, [activeChartMetric, selectedPeriod, trajectories, revenueTrend, totalRevenue, stats]);

  // ── 13. Semantic Badge Helper (Design System Mappings) ────────────────────
  const getEscrowStatusBadge = (status, size = 'xs') => {
    switch (status) {
      case 'Pending':
        return <Badge.Pending size={size} pulse>Needs Action</Badge.Pending>;
      case 'Approved':
      case 'Released':
        return <Badge.Active size={size}>Settled</Badge.Active>;
      case 'Refunded':
        return <Badge.Offline size={size}>Refunded</Badge.Offline>;
      default:
        return <Badge color="slate" variant="pastel" size={size}>{status || 'Unknown'}</Badge>;
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* ── 01. TOAST NOTIFICATION ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[80] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] animate-slide-down">
          {toast.type === 'success' && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
          {toast.type === 'error' && <AlertCircle size={16} className="text-rose-500 shrink-0" />}
          {toast.type === 'info' && <Sparkles size={16} className="text-brand shrink-0" />}
          <span className="text-xs font-semibold">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer ml-2"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── 02. TOP HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-2 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Revenue & Monetization
            </h1>
            <Badge color="emerald" variant="pastel" size="xs" dot pulse>
              Live Billing • {lastSyncTime}
            </Badge>
            {counts.pending > 0 && (
              <Badge color="amber" variant="pastel" size="xs" dot pulse>
                {counts.pending} Action Needed
              </Badge>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Track platform billing streams, premium tier subscriptions, and buyer escrow custody from real transactions
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchRevenueData(true)}
            disabled={isRefreshing || isLoading}
            className="h-8 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
            title="Refresh revenue data"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-brand' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ── 03. ERROR ALERT ── */}
      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-700 dark:text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchRevenueData()}
            className="text-xs font-bold underline hover:no-underline cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* ── 04. 4 POLISHED KPI CARDS WITH PASTEL DESIGN SYSTEM TOKENS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Gross Platform Revenue */}
        <div className="group bg-[var(--bg-surface)] border border-[var(--border)] border-t-2 border-t-[#52c99b] rounded-2xl p-4 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                Gross Platform Revenue
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  {isLoading ? (
                    <span className="inline-block w-24 h-6 bg-[var(--bg-muted)] animate-pulse rounded-md" />
                  ) : (
                    `₹${totalRevenue.toLocaleString('en-IN')}`
                  )}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#52c99b]/15 text-[#064e3b] dark:text-[#6ee7b7] group-hover:scale-110 transition-transform">
              <Wallet size={18} strokeWidth={2.2} />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
            <Badge color="slate" variant="pastel" size="xs">All Streams</Badge>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={11} /> {stats?.changes?.revenueGrowth || '+0.0%'}
            </span>
          </div>
        </div>

        {/* Card 2: Showcase & Premium Subs */}
        <div className="group bg-[var(--bg-surface)] border border-[var(--border)] border-t-2 border-t-[#c4b5fd] rounded-2xl p-4 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                Showcase & Premium Subs
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  {isLoading ? (
                    <span className="inline-block w-24 h-6 bg-[var(--bg-muted)] animate-pulse rounded-md" />
                  ) : (
                    `₹${((stats?.featuredRev || 0) + (stats?.premiumRev || 0)).toLocaleString('en-IN')}`
                  )}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#c4b5fd]/25 text-[#4c1d95] dark:text-[#ddd6fe] group-hover:scale-110 transition-transform">
              <Sparkles size={18} strokeWidth={2.2} />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
            <Badge color="purple" variant="pastel" size="xs">Recurring Tiers</Badge>
            <span className="text-[10px] font-bold text-[#4c1d95] dark:text-[#ddd6fe] truncate max-w-[120px]">
              {stats?.counts?.featuredCount || 0} Featured · {stats?.counts?.premiumCount || 0} Pro
            </span>
          </div>
        </div>

        {/* Card 3: Listing Boosts & Addons */}
        <div className="group bg-[var(--bg-surface)] border border-[var(--border)] border-t-2 border-t-[#fed7aa] rounded-2xl p-4 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                Listing Boosts & Addons
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  {isLoading ? (
                    <span className="inline-block w-24 h-6 bg-[var(--bg-muted)] animate-pulse rounded-md" />
                  ) : (
                    `₹${(stats?.boostRev || 0).toLocaleString('en-IN')}`
                  )}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#fed7aa]/30 text-[#9a3412] dark:text-[#fed7aa] group-hover:scale-110 transition-transform">
              <Zap size={18} strokeWidth={2.2} />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
            <Badge color="peach" variant="pastel" size="xs">Instant Addons</Badge>
            <span className="text-[10px] font-semibold text-[var(--text-muted)]">
              {stats?.counts?.boostCount || 0} promotions
            </span>
          </div>
        </div>

        {/* Card 4: Escrow Custody Vault */}
        <div className="group bg-[var(--bg-surface)] border border-[var(--border)] border-t-2 border-t-[#bae6fd] rounded-2xl p-4 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                Escrow Custody Vault
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  {isLoading ? (
                    <span className="inline-block w-24 h-6 bg-[var(--bg-muted)] animate-pulse rounded-md" />
                  ) : (
                    `₹${((stats?.heldEscrow || 0) + (stats?.settledEscrow || 0)).toLocaleString('en-IN')}`
                  )}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#bae6fd]/25 text-[#075985] dark:text-[#7dd3fc] group-hover:scale-110 transition-transform">
              <ShieldCheck size={18} strokeWidth={2.2} />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
            <Badge color="sky" variant="pastel" size="xs">Escrow Custody</Badge>
            <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300">
              {counts.pending} held · {counts.approved} settled
            </span>
          </div>
        </div>
      </div>

      {/* ── 05. REVENUE TRAJECTORY CHART ── */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          {/* Chart Metric Switcher with Sliding Indicator */}
          <div className="flex items-center gap-1 p-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-full w-max shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveChartMetric('gross')}
              className={`h-7 px-3.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                activeChartMetric === 'gross'
                  ? 'bg-[#52c99b] text-[#064e3b] dark:bg-[#1a4a38] dark:text-[#6ee7b7] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Wallet size={12} />
              <span>Gross Billing Trend</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveChartMetric('escrow')}
              className={`h-7 px-3.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                activeChartMetric === 'escrow'
                  ? 'bg-[#bae6fd] text-[#075985] dark:bg-[#113c54] dark:text-[#7dd3fc] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <ShieldCheck size={12} />
              <span>Escrow Collections</span>
            </button>
          </div>

          <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
            Live database trajectory · Hover over any point to inspect exact dates
          </span>
        </div>

        <ProgressMetricCard
          title={activeChartMetric === 'gross' ? 'Platform Billing Trajectory' : 'Escrow Collections Trajectory'}
          unit="₹"
          data={activeSeriesData}
          accent={activeChartMetric === 'gross' ? 'emerald' : 'brand'}
          defaultView={activeChartMetric === 'gross' ? 'curve' : 'bar'}
          period={selectedPeriod}
          periodOptions={chartPeriodOptions}
          onPeriodChange={(newPeriod) => setSelectedPeriod(newPeriod)}
          deltaLabel="vs previous period"
          size="md"
          loading={isLoading}
        />
      </div>

      {/* ── 06. SLIDING STATUS TOGGLE SWITCH (Design System Pastel Palette) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-x-auto scrollbar-none py-1 border-b border-[var(--border)]">
        <div className="relative inline-flex items-center p-1 bg-[var(--bg-muted)]/80 rounded-full border border-[var(--border)] text-xs font-semibold select-none shadow-inner-xs">
          {/* Sliding Pill Indicator */}
          <span
            className={`absolute top-1 bottom-1 rounded-full shadow-xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none ${activeStatusTab.activeBg}`}
            style={{
              left: `${statusIndicatorStyle.left}px`,
              width: `${statusIndicatorStyle.width}px`,
              opacity: statusIndicatorStyle.opacity
            }}
          />

          {statusTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tokenFilter === tab.key;

            return (
              <button
                key={tab.key}
                ref={(el) => { statusTabRefs.current[tab.key] = el; }}
                type="button"
                onClick={() => setTokenFilter(tab.key)}
                className={`relative z-10 px-3.5 py-1.5 rounded-full transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? `${tab.activeText} font-bold`
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
                }`}
              >
                <Icon size={12} className="shrink-0" />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold transition-colors ${
                    isActive
                      ? tab.activeCountBg
                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border)]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode Switcher (Table vs Card Grid) */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Secondary Filter: Value Tier */}
          <div className="flex items-center gap-1 p-0.5 bg-[var(--bg-muted)]/80 rounded-full border border-[var(--border)] text-[11px] font-medium">
            {[
              { id: 'ALL', label: 'All Values' },
              { id: 'HIGH_VALUE', label: '> ₹50k' },
              { id: 'MEDIUM', label: '₹10k - 50k' },
              { id: 'MICRO', label: '< ₹10k' }
            ].map(tier => (
              <button
                key={tier.id}
                type="button"
                onClick={() => setAmountTierFilter(tier.id)}
                className={`px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${
                  amountTierFilter === tier.id
                    ? 'bg-[var(--bg-surface)] text-brand font-bold shadow-2xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="relative inline-flex items-center p-0.5 bg-[var(--bg-muted)]/80 rounded-full border border-[var(--border)] text-xs font-semibold select-none">
            <span
              className="absolute top-0.5 bottom-0.5 rounded-full bg-[var(--bg-surface)] shadow-xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
              style={{
                left: `${viewModeIndicatorStyle.left}px`,
                width: `${viewModeIndicatorStyle.width}px`,
                opacity: viewModeIndicatorStyle.opacity
              }}
            />
            <button
              ref={(el) => { viewModeRefs.current['table'] = el; }}
              type="button"
              onClick={() => handleSetViewMode('table')}
              className={`relative z-10 px-2.5 py-1 rounded-full text-xs transition-colors flex items-center gap-1 cursor-pointer ${
                viewMode === 'table' ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Table View"
            >
              <List size={13} />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              ref={(el) => { viewModeRefs.current['cards'] = el; }}
              type="button"
              onClick={() => handleSetViewMode('cards')}
              className={`relative z-10 px-2.5 py-1 rounded-full text-xs transition-colors flex items-center gap-1 cursor-pointer ${
                viewMode === 'cards' ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid size={13} />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 07. SEARCH & QUICK TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" size={14} />
          <input
            type="text"
            placeholder="Search by Token ID, buyer, seller, property, UTR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8.5 pl-9 pr-8 bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] rounded-full border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 placeholder:text-[var(--text-muted)] transition-all duration-200"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>Showing</span>
          <Badge color="slate" variant="pastel" size="xs">
            {filteredTokens.length} of {tokens.length}
          </Badge>
          <span>transactions</span>
        </div>
      </div>

      {/* ── 08. DATA CONTAINER: TABLE VIEW OR CARDS VIEW ── */}
      {viewMode === 'table' ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-2xs">
          <div className="w-full overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <colgroup>
                <col className="w-[12%]" />
                <col className="w-[17%]" />
                <col className="w-[17%]" />
                <col className="w-[23%]" />
                <col className="w-[13%]" />
                <col className="w-[10%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead className="bg-[var(--bg-muted)]/40 text-[var(--text-muted)] uppercase text-[9.5px] font-semibold tracking-wider border-b border-[var(--border)] select-none">
                <tr>
                  <th className="py-2 px-3">Token ID</th>
                  <th className="py-2 px-3">Buyer (Payer)</th>
                  <th className="py-2 px-3">Seller / Builder</th>
                  <th className="py-2 px-3">Property Listing</th>
                  <th className="py-2 px-3">Financial Terms</th>
                  <th className="py-2 px-3 text-center">Escrow Status</th>
                  <th className="py-2 pl-2 pr-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="py-14 text-center">
                      <AdminLoader
                        text="Reconciling escrow transactions..."
                        subtext="Verifying payment gateways, token ledgers, and buyer deposits"
                        minHeight="min-h-[160px]"
                      />
                    </td>
                  </tr>
                ) : filteredTokens.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
                        <Receipt size={28} className="opacity-30 mb-1" />
                        <p className="text-xs font-semibold text-[var(--text-primary)]">No Escrow Transactions Found</p>
                        <p className="text-[11px] max-w-xs">
                          {searchQuery ? 'No transactions match your search filter.' : 'No transactions exist in this category.'}
                        </p>
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="mt-2 text-xs font-bold text-brand hover:underline cursor-pointer"
                          >
                            Clear Search Filter
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTokens.map((t) => {
                    const isPending = t.status === 'Pending';
                    const isApproved = t.status === 'Approved' || t.status === 'Released';

                    return (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedTransaction(t)}
                        className="hover:bg-[var(--bg-muted)]/35 transition-colors cursor-pointer group"
                      >
                        {/* Token ID & Date */}
                        <td className="py-1.5 px-3 align-middle whitespace-nowrap overflow-hidden">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs font-semibold text-[var(--text-primary)] group-hover:text-brand transition-colors leading-tight">
                              {t.id}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(t.id, 'Token ID');
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--text-muted)] hover:text-brand transition-all cursor-pointer"
                              title="Copy Token ID"
                            >
                              <Copy size={10} />
                            </button>
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)] block mt-0.5 leading-tight">
                            {t.date}
                          </span>
                        </td>

                        {/* Buyer */}
                        <td className="py-1.5 px-3 align-middle overflow-hidden">
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-brand transition-colors truncate" title={t.buyer}>
                              {t.buyer}
                            </p>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5 leading-tight truncate">
                              {t.buyerPhone || 'Verified Payer'}
                            </div>
                          </div>
                        </td>

                        {/* Seller */}
                        <td className="py-1.5 px-3 align-middle overflow-hidden">
                          <div className="min-w-0">
                            <p className="font-medium text-xs text-[var(--text-primary)] truncate" title={t.seller}>
                              {t.seller}
                            </p>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5 leading-tight truncate">
                              {t.sellerPhone || 'Escrow Beneficiary'}
                            </div>
                          </div>
                        </td>

                        {/* Property */}
                        <td className="py-1.5 px-3 align-middle overflow-hidden">
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-brand transition-colors truncate" title={t.property}>
                              {t.property}
                            </p>
                            <span className="text-[10px] text-[var(--text-muted)] block mt-0.5 leading-tight truncate">
                              {t.propertyPrice ? `Agreed: ${t.propertyPrice}` : 'Direct Listing'}
                            </span>
                          </div>
                        </td>

                        {/* Escrow Amount & Payment Mode Stacked */}
                        <td className="py-1.5 px-3 align-middle whitespace-nowrap overflow-hidden">
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
                              {t.amount}
                            </span>
                            <span className="text-[9.5px] text-emerald-700/80 dark:text-emerald-400/80 font-medium">
                              Escrow
                            </span>
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)] block mt-0.5 leading-tight truncate">
                            {t.paymentMethod || 'UPI / NetBanking'}{t.utrRef ? ` • ${t.utrRef}` : ''}
                          </span>
                        </td>

                        {/* Escrow Status Pill */}
                        <td className="py-1.5 px-3 align-middle text-center whitespace-nowrap overflow-hidden">
                          {getEscrowStatusBadge(t.status, 'xs')}
                        </td>

                        {/* Actions (Icon-Only Minimalist Buttons) */}
                        <td className="py-1.5 pl-2 pr-3 align-middle text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setSelectedTransaction(t)}
                              className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--bg-muted)]/70 hover:bg-brand hover:text-white text-[var(--text-secondary)] border border-[var(--border)] transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                              title="Inspect Details"
                            >
                              <Eye size={12} />
                            </button>

                            {isPending ? (
                              <button
                                type="button"
                                onClick={() => approveToken(t)}
                                disabled={isProcessingAction}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                                title="Quick Release to Seller"
                              >
                                <ShieldCheck size={12} />
                              </button>
                            ) : isApproved ? (
                              <div
                                className="w-6 h-6 rounded-md flex items-center justify-center text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 cursor-default"
                                title="Escrow Settled"
                              >
                                <CheckCircle2 size={12} />
                              </div>
                            ) : (
                              <div
                                className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 cursor-default"
                                title="Refunded to Buyer"
                              >
                                <RotateCcw size={11} />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary */}
          <div className="p-2 px-3 border-t border-[var(--border)] bg-[var(--bg-surface)] flex flex-col sm:flex-row items-center justify-between gap-2 text-[10.5px] text-[var(--text-muted)]">
            <span>
              Showing <strong className="text-[var(--text-primary)]">{filteredTokens.length}</strong> of{' '}
              <strong className="text-[var(--text-primary)]">{tokens.length}</strong> transactions
            </span>
            <div className="flex items-center gap-2">
              <Badge.Active size="xs">{counts.approved} Settled</Badge.Active>
              <Badge.Pending size="xs" pulse={counts.pending > 0}>{counts.pending} Held</Badge.Pending>
              <Badge.Offline size="xs">{counts.refunded} Refunded</Badge.Offline>
            </div>
          </div>
        </div>
      ) : (
        /* Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredTokens.length === 0 ? (
            <div className="col-span-full py-14 text-center bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl">
              <Receipt size={32} className="opacity-30 mx-auto mb-2 text-[var(--text-muted)]" />
              <p className="text-xs font-semibold text-[var(--text-primary)]">No Escrow Transactions Found</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Try switching the status filter or resetting your search.
              </p>
            </div>
          ) : (
            filteredTokens.map((t) => {
              const isPending = t.status === 'Pending';
              const isApproved = t.status === 'Approved' || t.status === 'Released';

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTransaction(t)}
                  className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: ID & Status Badge */}
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[var(--border)]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-brand">
                          {t.id}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(t.id, 'Token ID');
                          }}
                          className="p-1 rounded-md text-[var(--text-muted)] hover:text-brand transition-colors cursor-pointer"
                          title="Copy Token ID"
                        >
                          <Copy size={11} />
                        </button>
                      </div>
                      {getEscrowStatusBadge(t.status, 'xs')}
                    </div>

                    {/* Escrow Value & Linked Property */}
                    <div className="py-3 border-b border-[var(--border)] space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Escrow Amount</span>
                        <span className="text-base font-bold text-[var(--text-primary)]">{t.amount}</span>
                      </div>
                      <div className="text-xs font-semibold text-[var(--text-primary)] truncate mt-1" title={t.property}>
                        {t.property}
                      </div>
                      <div className="text-[10px] text-brand font-medium">Agreed: {t.propertyPrice}</div>
                    </div>

                    {/* Buyer & Seller Split */}
                    <div className="grid grid-cols-2 gap-2 py-2.5 text-[11px]">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Buyer</span>
                        <span className="font-semibold text-[var(--text-primary)] truncate block">{t.buyer}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">{t.buyerPhone || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Seller</span>
                        <span className="font-semibold text-[var(--text-primary)] truncate block">{t.seller}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">{t.sellerPhone || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Card Actions */}
                  <div className="pt-2.5 border-t border-[var(--border)] flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] text-[var(--text-muted)]">{t.date}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedTransaction(t)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => approveToken(t)}
                          disabled={isProcessingAction}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#52c99b] text-[#064e3b] hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                        >
                          Release
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── 09. INSPECT TRANSACTION DETAILS MODAL ── */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transition-all duration-200 scale-in-95">
            {/* Modal Header */}
            <div className="p-4 px-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-surface)]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold text-xs shrink-0">
                  <Receipt size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Escrow Token {selectedTransaction.id}
                    </h3>
                    {getEscrowStatusBadge(selectedTransaction.status, 'xs')}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Initiated on {selectedTransaction.date}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-[var(--bg-muted)] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {/* Financial Box */}
              <div className="p-4 bg-brand/5 border border-brand/20 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-brand block">Escrow Deposit</span>
                  <span className="text-xl font-bold text-[var(--text-primary)]">{selectedTransaction.amount}</span>
                  <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                    {selectedTransaction.paymentMethod || 'UPI / NetBanking'} · UTR: {selectedTransaction.utrRef || 'Pending'}
                  </span>
                </div>
                <div className="text-right">
                  <Badge.Verified size="xs">100% Escrow Protected</Badge.Verified>
                  <span className="text-[10px] text-[var(--text-muted)] block mt-1.5">
                    {selectedTransaction.escrowBank || 'HDFC Escrow Vault'}
                  </span>
                </div>
              </div>

              {/* Linked Property Details */}
              <div className="p-3.5 border border-[var(--border)] rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] flex items-center gap-1">
                    <Building2 size={12} /> Linked Property
                  </span>
                  <Badge.Category type="Residential" size="xs">Residential</Badge.Category>
                </div>
                <p className="font-semibold text-xs text-[var(--text-primary)]">{selectedTransaction.property}</p>
                <p className="text-[11px] text-brand font-medium">
                  Agreed Price: {selectedTransaction.propertyPrice}
                </p>
              </div>

              {/* Parties Split */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 border border-[var(--border)] rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] flex items-center gap-1">
                    <User size={12} /> Buyer (Payer)
                  </span>
                  <div className="font-semibold text-[var(--text-primary)]">{selectedTransaction.buyer}</div>
                  {selectedTransaction.buyerPhone && (
                    <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                      <Phone size={10} /> {selectedTransaction.buyerPhone}
                    </div>
                  )}
                  {selectedTransaction.buyerEmail && (
                    <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 truncate">
                      <Mail size={10} /> {selectedTransaction.buyerEmail}
                    </div>
                  )}
                  {selectedTransaction.buyerCity && selectedTransaction.buyerCity !== '—' && (
                    <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                      <MapPin size={10} /> {selectedTransaction.buyerCity}
                    </div>
                  )}
                </div>

                <div className="p-3.5 border border-[var(--border)] rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] flex items-center gap-1">
                    <Building2 size={12} /> Seller / Builder
                  </span>
                  <div className="font-semibold text-[var(--text-primary)]">{selectedTransaction.seller}</div>
                  {selectedTransaction.sellerPhone && (
                    <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                      <Phone size={10} /> {selectedTransaction.sellerPhone}
                    </div>
                  )}
                  {selectedTransaction.sellerEmail && (
                    <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 truncate">
                      <Mail size={10} /> {selectedTransaction.sellerEmail}
                    </div>
                  )}
                  <div className="text-[10px] text-[var(--text-muted)]">Verified Escrow Account</div>
                </div>
              </div>

              {/* Extra Client Verification Profile */}
              {selectedTransaction.occupation && selectedTransaction.occupation !== '—' && (
                <div className="p-3.5 bg-[var(--bg-muted)]/50 border border-[var(--border)] rounded-2xl space-y-1.5 text-[11px]">
                  <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] flex items-center gap-1">
                    <Briefcase size={12} /> Buyer Verification Profile
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px]">Profession:</span>
                      <span className="font-medium text-[var(--text-primary)]">{selectedTransaction.occupation}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px]">Monthly Income:</span>
                      <span className="font-medium text-[var(--text-primary)]">{selectedTransaction.monthlyIncome}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Legal Custody Info */}
              <div className="p-3.5 bg-[var(--bg-muted)]/40 border border-[var(--border)] rounded-2xl space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Escrow Provider</span>
                  <span className="font-medium text-[var(--text-primary)]">{selectedTransaction.escrowBank || 'HDFC Bank Custody'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Free-Look Legal Window</span>
                  <Badge color="emerald" variant="pastel" size="xs">72-Hour Legal Window</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Dispute Status</span>
                  <Badge color="emerald" variant="pastel" size="xs">Clean / No Disputes</Badge>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 px-5 border-t border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="h-8.5 px-3.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-semibold hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
              >
                Close
              </button>

              {selectedTransaction.status === 'Pending' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isProcessingAction}
                    onClick={() => refundToken(selectedTransaction)}
                    className="h-8.5 px-3.5 rounded-xl border border-rose-500/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw size={12} />
                    <span>Refund Buyer</span>
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingAction}
                    onClick={() => approveToken(selectedTransaction)}
                    className="h-8.5 px-4 rounded-xl bg-[#52c99b] text-[#064e3b] text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer hover:opacity-90 disabled:opacity-50"
                  >
                    <ShieldCheck size={14} />
                    <span>Release Escrow</span>
                  </button>
                </div>
              ) : selectedTransaction.status === 'Approved' || selectedTransaction.status === 'Released' ? (
                <Badge.Active size="sm">Escrow Settled & Released</Badge.Active>
              ) : (
                <Badge.Offline size="sm">Refunded to Buyer</Badge.Offline>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueDashboard;
