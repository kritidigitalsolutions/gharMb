import React, { useState, useEffect, useMemo } from 'react';
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
  FileText
} from 'lucide-react';
import ProgressMetricCard from '@/components/ui/progress-metric-card';

const RevenueDashboard = () => {
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
  const [tokenFilter, setTokenFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [activeChartMetric, setActiveChartMetric] = useState('gross');
  const [selectedPeriod, setSelectedPeriod] = useState('Past 6 months');

  const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const API_BASE = RAW_API_URL.replace(/\/+api\/?$/i, '').replace(/\/+$/, '');

  const fetchRevenueData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Please log in with an admin account to view revenue details.');
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/admin/dashboard/revenue`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
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
      } else {
        setError(data.message || 'Failed to fetch revenue data.');
      }
    } catch (err) {
      console.error('Error fetching revenue details:', err);
      setError('Could not connect to backend server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, []);

  // Action: approve/release escrow to seller
  const approveToken = async (transaction) => {
    const targetId = transaction?.rawId || transaction?.id;
    if (!targetId) return;
    setIsProcessingAction(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/admin/tokens/${targetId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'release' })
      });
      const data = await response.json();
      if (response.ok) {
        await fetchRevenueData(true);
        if (selectedTransaction?.id === transaction.id || selectedTransaction?.rawId === transaction.rawId) {
          setSelectedTransaction(prev => prev ? { ...prev, status: 'Approved', escrowStatus: 'Released' } : null);
        }
      } else {
        alert(data.message || 'Failed to release escrow.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating token status.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Action: refund token
  const refundToken = async (transaction) => {
    const targetId = transaction?.rawId || transaction?.id;
    if (!targetId) return;
    if (!window.confirm(`Are you sure you want to refund Token ${transaction.id}?`)) return;
    setIsProcessingAction(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/admin/tokens/${targetId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'refund' })
      });
      const data = await response.json();
      if (response.ok) {
        await fetchRevenueData(true);
        if (selectedTransaction?.id === transaction.id || selectedTransaction?.rawId === transaction.rawId) {
          setSelectedTransaction(prev => prev ? { ...prev, status: 'Refunded', escrowStatus: 'Refunded' } : null);
        }
      } else {
        alert(data.message || 'Failed to process refund.');
      }
    } catch (err) {
      console.error(err);
      alert('Error processing refund.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Filtered & searched tokens
  const filteredTokens = useMemo(() => {
    return tokens.filter((t) => {
      const matchesFilter =
        tokenFilter === 'All' ||
        (tokenFilter === 'Pending' && t.status === 'Pending') ||
        (tokenFilter === 'Approved' && (t.status === 'Approved' || t.status === 'Released')) ||
        (tokenFilter === 'Refunded' && t.status === 'Refunded');

      if (!matchesFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.id?.toLowerCase().includes(q) ||
        t.buyer?.toLowerCase().includes(q) ||
        t.seller?.toLowerCase().includes(q) ||
        t.property?.toLowerCase().includes(q) ||
        t.amount?.toLowerCase().includes(q) ||
        t.utrRef?.toLowerCase().includes(q)
      );
    });
  }, [tokens, tokenFilter, searchQuery]);

  // Aggregate calculations
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

  const counts = useMemo(() => {
    return {
      all: tokens.length,
      pending: tokens.filter(t => t.status === 'Pending').length,
      approved: tokens.filter(t => t.status === 'Approved' || t.status === 'Released').length,
      refunded: tokens.filter(t => t.status === 'Refunded').length
    };
  }, [tokens]);

  const kpiCards = [
    {
      title: 'Gross Platform Revenue',
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      change: stats?.changes?.revenueGrowth || '0.0%',
      trend: stats?.changes?.revenueGrowth?.startsWith('+') ? 'up' : 'neutral',
      subtitle: 'Combined billing across streams',
      tag: 'All Streams',
      icon: Wallet,
      accent: 'border-brand/40 hover:border-brand',
      iconColor: 'text-brand bg-brand/10'
    },
    {
      title: 'Showcase & Premium Subs',
      value: `₹${((stats?.featuredRev || 0) + (stats?.premiumRev || 0)).toLocaleString('en-IN')}`,
      change: stats?.changes?.subsGrowth || '0.0%',
      trend: (stats?.featuredRev || 0) + (stats?.premiumRev || 0) > 0 ? 'up' : 'neutral',
      subtitle: (stats?.counts?.featuredCount || 0) + (stats?.counts?.premiumCount || 0) > 0
        ? `${stats.counts.featuredCount} Featured · ${stats.counts.premiumCount} Premium`
        : 'Listing tiers & agency desks',
      tag: 'Recurring Tiers',
      icon: Sparkles,
      accent: 'border-purple-500/40 hover:border-purple-500',
      iconColor: 'text-purple-600 bg-purple-500/10'
    },
    {
      title: 'Listing Boosts & Addons',
      value: `₹${(stats?.boostRev || 0).toLocaleString('en-IN')}`,
      change: stats?.changes?.boostGrowth || '0.0%',
      trend: (stats?.boostRev || 0) > 0 ? 'up' : 'neutral',
      subtitle: (stats?.counts?.boostCount || 0) > 0
        ? `${stats.counts.boostCount} active promotions`
        : 'Search boosts & urgent tags',
      tag: 'Instant Addons',
      icon: Zap,
      accent: 'border-amber-500/40 hover:border-amber-500',
      iconColor: 'text-amber-600 bg-amber-500/10'
    },
    {
      title: 'Escrow Token Collections',
      value: `₹${(stats?.escrowCommission || 0).toLocaleString('en-IN')}`,
      change: stats?.changes?.escrowGrowth || '0.0%',
      trend: (stats?.escrowCommission || 0) > 0 ? 'up' : 'neutral',
      subtitle: counts.all > 0
        ? `${counts.pending} held · ${counts.approved} settled`
        : 'Verified booking advances held',
      tag: 'Escrow Custody',
      icon: ShieldCheck,
      accent: 'border-blue-500/40 hover:border-blue-500',
      iconColor: 'text-blue-600 bg-blue-500/10'
    }
  ];

  const chartPeriodOptions = useMemo(() => [
    { label: 'Past 30 days', points: 30 },
    { label: 'Past 3 months', points: 12 },
    { label: 'Past 6 months', points: 6 },
    { label: 'All data' },
  ], []);

  // 100% Real Trajectory Series from MongoDB Atlas
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

    // Default: Past 6 months (using monthly real aggregated points)
    const monthlyList = isGross ? trajectories?.monthly?.gross : trajectories?.monthly?.escrow;
    if (monthlyList && monthlyList.length >= 2) return monthlyList;

    // Direct fallback from revenueTrend if trajectories still empty
    if (revenueTrend && revenueTrend.length >= 2) {
      return revenueTrend.map(m => ({
        date: m.month,
        value: isGross ? m.total : m.escrow
      }));
    }

    return [
      { date: 'May 26', value: 0 },
      { date: 'Jun 26', value: 0 },
      { date: 'Jul 26', value: 0 },
      { date: 'Aug 26', value: 0 },
      { date: 'Sep 26', value: 0 },
      { date: 'Oct 26', value: isGross ? totalRevenue : (stats?.escrowCommission || 0) }
    ];
  }, [activeChartMetric, selectedPeriod, trajectories, revenueTrend, totalRevenue, stats]);

  return (
    <div className="w-full space-y-4">
      {/* ─── HEADER BAR ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Revenue & Monetization</h1>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Live Billing
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Track subscription revenue, listing boost earnings, and buyer escrow clearance from real transactions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchRevenueData(true)}
            disabled={isRefreshing || isLoading}
            className="h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
            title="Refresh revenue data"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-brand' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ─── ERROR ALERT ─── */}
      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-700 dark:text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchRevenueData()}
            className="text-xs font-semibold underline hover:no-underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── 4 POLISHED KPI CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`group bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3.5 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden flex flex-col justify-between border-t-2 ${card.accent}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
                    {card.title}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                      {isLoading ? (
                        <span className="inline-block w-20 h-5 bg-[var(--bg-muted)] animate-pulse rounded" />
                      ) : (
                        card.value
                      )}
                    </span>
                  </div>
                </div>

                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${card.iconColor}`}>
                  <Icon size={16} strokeWidth={2} />
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)] truncate">{card.subtitle}</span>
                <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                  card.trend === 'up'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-[var(--text-muted)]'
                }`}>
                  <ArrowUpRight size={11} /> {card.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── FOCUSED REVENUE TRAJECTORY CHART ─── */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          {/* Chart Metric Switcher */}
          <div className="flex items-center gap-1 p-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl w-max shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveChartMetric('gross')}
              className={`h-7 px-3 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                activeChartMetric === 'gross'
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
              }`}
            >
              <Wallet size={12} />
              <span>Gross Billing Trend</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveChartMetric('escrow')}
              className={`h-7 px-3 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                activeChartMetric === 'escrow'
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
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

      {/* ─── ESCROW TOKEN TRANSACTIONS MASTER CONTAINER ─── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xs overflow-hidden transition-all duration-200">
        {/* Header Toolbar */}
        <div className="p-3 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-2.5 bg-[var(--bg-surface)]">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'All', label: 'All Transactions', count: counts.all },
              { id: 'Pending', label: 'Needs Action (Pending)', count: counts.pending, isAlert: counts.pending > 0 },
              { id: 'Approved', label: 'Settled', count: counts.approved },
              { id: 'Refunded', label: 'Refunded', count: counts.refunded }
            ].map((tab) => {
              const active = tokenFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTokenFilter(tab.id)}
                  className={`h-8 px-3 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    active
                      ? 'bg-brand text-white font-semibold shadow-xs shadow-brand/25 scale-[1.02]'
                      : tab.isAlert
                      ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-100'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold transition-colors ${
                      active
                        ? 'bg-white/25 text-white'
                        : tab.isAlert
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                        : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
              <input
                type="text"
                placeholder="Search token, buyer, seller..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-6 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 focus:bg-[var(--bg-surface)] placeholder:text-[var(--text-muted)] transition-all duration-200"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 hover:scale-110 transition-all cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── DATA TABLE: 100% FLUID, ZERO HORIZONTAL SCROLL ─── */}
        <div className="w-full">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-muted)]/50">
                <th className="py-2.5 px-3 align-middle whitespace-nowrap">Token ID</th>
                <th className="py-2.5 px-3 align-middle">Buyer (Payer)</th>
                <th className="py-2.5 px-3 align-middle">Seller / Builder</th>
                <th className="py-2.5 px-3 align-middle">Property Listing</th>
                <th className="py-2.5 px-3 align-middle text-center whitespace-nowrap">Escrow Sum</th>
                <th className="py-2.5 px-3 align-middle whitespace-nowrap">Date</th>
                <th className="py-2.5 px-3 align-middle text-center whitespace-nowrap">Escrow Status</th>
                <th className="py-2.5 px-3 align-middle text-right whitespace-nowrap w-[76px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-3"><div className="h-4 bg-[var(--bg-muted)] rounded w-16" /></td>
                    <td className="py-3 px-3"><div className="h-4 bg-[var(--bg-muted)] rounded w-24" /></td>
                    <td className="py-3 px-3"><div className="h-4 bg-[var(--bg-muted)] rounded w-28" /></td>
                    <td className="py-3 px-3"><div className="h-4 bg-[var(--bg-muted)] rounded w-36" /></td>
                    <td className="py-3 px-3"><div className="h-4 bg-[var(--bg-muted)] rounded w-16 mx-auto" /></td>
                    <td className="py-3 px-3"><div className="h-4 bg-[var(--bg-muted)] rounded w-20" /></td>
                    <td className="py-3 px-3"><div className="h-4 bg-[var(--bg-muted)] rounded w-16 mx-auto" /></td>
                    <td className="py-3 px-3"><div className="h-6 bg-[var(--bg-muted)] rounded w-14 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-1.5 text-[var(--text-muted)]">
                      <Receipt size={28} className="opacity-30 mb-1" />
                      <p className="text-xs font-semibold text-[var(--text-primary)]">No Escrow Transactions Found</p>
                      <p className="text-[11px] max-w-xs">
                        {searchQuery ? 'Try clearing your search term.' : 'No escrow transactions match this filter.'}
                      </p>
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="mt-2 text-xs font-bold text-brand hover:underline cursor-pointer"
                        >
                          Clear Search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTokens.map((t) => {
                  const isPending = t.status === 'Pending';
                  const isApproved = t.status === 'Approved' || t.status === 'Released';
                  const isRefunded = t.status === 'Refunded';

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTransaction(t)}
                      className="hover:bg-[var(--bg-muted)]/50 transition-colors duration-150 cursor-pointer group"
                    >
                      {/* Token ID */}
                      <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-brand">
                          {t.id}
                        </span>
                      </td>

                      {/* Buyer */}
                      <td className="py-2.5 px-3 align-middle">
                        <div className="font-semibold text-[var(--text-primary)] group-hover:text-brand transition-colors">
                          {t.buyer}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)]">{t.buyerPhone || 'Verified Payer'}</div>
                      </td>

                      {/* Seller */}
                      <td className="py-2.5 px-3 align-middle">
                        <div className="font-medium text-[var(--text-primary)]">
                          {t.seller}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)]">{t.sellerPhone || 'Escrow Beneficiary'}</div>
                      </td>

                      {/* Property */}
                      <td className="py-2.5 px-3 align-middle max-w-[200px]">
                        <div className="font-medium text-[var(--text-primary)] truncate" title={t.property}>
                          {t.property}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)]">{t.propertyPrice}</div>
                      </td>

                      {/* Escrow Sum */}
                      <td className="py-2.5 px-3 align-middle text-center whitespace-nowrap">
                        <span className="font-bold text-[var(--text-primary)]">
                          {t.amount}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-3 align-middle whitespace-nowrap text-[11px] text-[var(--text-muted)]">
                        {t.date}
                      </td>

                      {/* Status Pill with Live Beacon */}
                      <td className="py-2.5 px-3 align-middle text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isApproved
                              ? 'bg-emerald-50/90 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                              : isPending
                              ? 'bg-amber-50/90 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          <span className="relative flex h-1.5 w-1.5">
                            {isPending && (
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            )}
                            <span
                              className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                                isApproved ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-slate-400'
                              }`}
                            />
                          </span>
                          {t.status}
                        </span>
                      </td>

                      {/* Strictly Aligned Actions Column (Fixed Width 76px) */}
                      <td className="py-2.5 px-3 align-middle text-right whitespace-nowrap w-[76px]">
                        <div
                          className="flex items-center justify-end gap-1.5 w-[76px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Slot 1: View / Inspect details (Always in Position 1) */}
                          <button
                            type="button"
                            onClick={() => setSelectedTransaction(t)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[var(--text-muted)] hover:text-brand hover:bg-brand/10 transition-all duration-150 active:scale-95 cursor-pointer"
                            title="Inspect escrow transaction"
                          >
                            <Eye size={13} strokeWidth={2} />
                          </button>

                          {/* Slot 2: Action or Fixed Indicator (Always in Position 2) */}
                          {isPending ? (
                            <button
                              type="button"
                              onClick={() => approveToken(t)}
                              disabled={isProcessingAction}
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-50"
                              title="Quick Release to Seller"
                            >
                              <ShieldCheck size={13} strokeWidth={2} />
                            </button>
                          ) : isApproved ? (
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-emerald-600/70 bg-emerald-50/40 dark:bg-emerald-500/5 cursor-default"
                              title="Escrow Settled"
                            >
                              <CheckCircle2 size={13} strokeWidth={2} />
                            </div>
                          ) : (
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-slate-400 bg-slate-100/50 dark:bg-slate-800/50 cursor-default"
                              title="Refunded to Buyer"
                            >
                              <RotateCcw size={12} strokeWidth={2} />
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
        <div className="p-2.5 px-3 border-t border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span>
            Showing <strong className="text-[var(--text-primary)]">{filteredTokens.length}</strong> of{' '}
            <strong className="text-[var(--text-primary)]">{tokens.length}</strong> transactions
          </span>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Settled: {counts.approved}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending: {counts.pending}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Refunded: {counts.refunded}
            </span>
          </div>
        </div>
      </div>

      {/* ─── INSPECT TRANSACTION DETAILS MODAL ─── */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transition-all duration-200 scale-in-95">
            {/* Modal Header */}
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-surface)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">
                  <Receipt size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Escrow Transaction {selectedTransaction.id}
                    </h3>
                    <span
                      className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${
                        selectedTransaction.status === 'Approved' || selectedTransaction.status === 'Released'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : selectedTransaction.status === 'Pending'
                          ? 'bg-amber-500/10 text-amber-600'
                          : 'bg-slate-500/10 text-slate-500'
                      }`}
                    >
                      {selectedTransaction.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Initiated on {selectedTransaction.date}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-[var(--bg-muted)] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3.5 text-xs max-h-[75vh] overflow-y-auto">
              {/* Financial Box */}
              <div className="p-3.5 bg-brand/5 border border-brand/15 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-brand block">Escrow Deposit</span>
                  <span className="text-lg font-bold text-[var(--text-primary)]">{selectedTransaction.amount}</span>
                  <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                    {selectedTransaction.paymentMethod} · UTR: {selectedTransaction.utrRef}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[var(--text-muted)] block">Platform Custody</span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 justify-end">
                    <ShieldCheck size={12} /> 100% Guaranteed
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                    {selectedTransaction.escrowBank}
                  </span>
                </div>
              </div>

              {/* Property Details */}
              <div className="p-3 border border-[var(--border)] rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] flex items-center gap-1">
                  <Building2 size={12} /> Linked Listing
                </span>
                <p className="font-semibold text-xs text-[var(--text-primary)]">{selectedTransaction.property}</p>
                <p className="text-[11px] text-brand font-medium">
                  Agreed Price: {selectedTransaction.propertyPrice}
                </p>
              </div>

              {/* Parties Split */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 border border-[var(--border)] rounded-xl space-y-1">
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

                <div className="p-3 border border-[var(--border)] rounded-xl space-y-1">
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
                  <div className="text-[10px] text-[var(--text-muted)]">Escrow Target Account</div>
                </div>
              </div>

              {/* Extra Client Background if available */}
              {(selectedTransaction.occupation && selectedTransaction.occupation !== '—') && (
                <div className="p-3 bg-[var(--bg-muted)]/50 border border-[var(--border)] rounded-xl space-y-1 text-[11px]">
                  <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] flex items-center gap-1">
                    <Briefcase size={12} /> Buyer Verification Profile
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--text-subtle)] pt-1">
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px]">Profession:</span>
                      <span className="font-medium text-[var(--text-primary)]">{selectedTransaction.occupation}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px]">Monthly Income:</span>
                      <span className="font-medium text-[var(--text-primary)]">{selectedTransaction.monthlyIncome}</span>
                    </div>
                    {selectedTransaction.familyMembers && selectedTransaction.familyMembers !== '—' && (
                      <div>
                        <span className="text-[var(--text-muted)] block text-[10px]">Family Members:</span>
                        <span className="font-medium text-[var(--text-primary)]">{selectedTransaction.familyMembers}</span>
                      </div>
                    )}
                    {selectedTransaction.idProof && (
                      <div>
                        <span className="text-[var(--text-muted)] block text-[10px]">ID Proof:</span>
                        <span className="font-medium text-brand truncate flex items-center gap-1">
                          <FileText size={10} /> {selectedTransaction.idProof}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Custody Info */}
              <div className="p-3 bg-[var(--bg-muted)]/50 border border-[var(--border)] rounded-xl space-y-1.5 text-[11px] text-[var(--text-subtle)]">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Escrow Provider</span>
                  <span className="font-medium text-[var(--text-primary)]">{selectedTransaction.escrowBank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Free-Look Period</span>
                  <span className="font-medium text-emerald-600">72-Hour Legal Window</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Dispute Status</span>
                  <span className="font-medium text-[var(--text-primary)]">Clean / Verified Account</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-3.5 border-t border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="h-8 px-3 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-semibold hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
              >
                Close
              </button>

              {selectedTransaction.status === 'Pending' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isProcessingAction}
                    onClick={() => refundToken(selectedTransaction)}
                    className="h-8 px-3 rounded-lg border border-rose-500/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw size={12} />
                    <span>Refund Buyer</span>
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingAction}
                    onClick={() => approveToken(selectedTransaction)}
                    className="h-8 px-3.5 rounded-lg bg-brand hover:bg-brand-dark text-white text-xs font-semibold shadow-xs shadow-brand/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck size={13} />
                    <span>Release Escrow</span>
                  </button>
                </div>
              ) : selectedTransaction.status === 'Approved' ? (
                <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <Check size={13} />
                  <span>Escrow Settled & Released</span>
                </div>
              ) : (
                <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <RotateCcw size={12} />
                  <span>Refunded to Buyer</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueDashboard;
