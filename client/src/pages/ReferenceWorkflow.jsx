import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Gift, Award, CheckCircle2, XCircle, Clock,
  Search, Filter, Plus, ArrowRight, IndianRupee,
  Share2, ShieldCheck, UserCheck, ExternalLink, Calendar,
  Copy, Check, Trash2, X, Send, Eye, Edit2, CheckCircle,
  RefreshCw, Phone, MessageSquare, Mail, AlertTriangle, Building
} from 'lucide-react';

const ReferenceWorkflow = () => {
  const [references, setReferences] = useState([]);
  const [stats, setStats] = useState({
    totalRewardsPaid: 0,
    totalEligible: 0,
    activeDealsCount: 0,
    paidCount: 0,
    eligibleCount: 0,
    totalReferralsCount: 0,
  });
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRef, setSelectedRef] = useState(null);
  const [payoutModal, setPayoutModal] = useState(null);
  const [payoutRefId, setPayoutRefId] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('UPI');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available real properties from DB
  const [availableProperties, setAvailableProperties] = useState([]);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToastMsg = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const API_BASE = RAW_API_URL.replace(/\/+api\/?$/i, '').replace(/\/+$/, '');

  const getAuthHeader = () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // New Referral Form
  const [newRef, setNewRef] = useState({
    referrerName: '',
    referrerPhone: '',
    referrerEmail: '',
    referrerRole: 'Resident Ambassador',
    referralCode: '',
    refereeName: '',
    refereePhone: '',
    refereeEmail: '',
    linkedProperty: '',
    propertyTitle: '',
    dealValue: '',
    rewardAmount: '20000',
    payoutStatus: 'Deal In Progress',
    bankDetails: '',
    upiId: '',
    notes: '',
  });

  // 1. Fetch Real Referrals from Backend API
  const fetchReferrals = async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeader();
      const res = await fetch(`${API_BASE}/api/admin/referrals`, { headers });
      const data = await res.json();

      if (res.ok && data.status === 'success' && data.data) {
        setReferences(data.data.referrals || []);
        if (data.data.stats) {
          setStats(data.data.stats);
        }
      } else {
        setReferences([]);
        if (res.status === 401 || res.status === 403) {
          showToastMsg('Session expired or admin access required.', 'error');
        }
      }
    } catch (err) {
      console.error('Error fetching real referrals:', err.message);
      setReferences([]);
      showToastMsg('Failed to fetch referrals from database.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Fetch Real Properties for Property Selector
  const fetchProperties = async () => {
    try {
      const headers = getAuthHeader();
      const res = await fetch(`${API_BASE}/api/admin/properties?limit=100`, { headers });
      const data = await res.json();
      if (res.ok && data.data?.properties) {
        setAvailableProperties(data.data.properties);
      }
    } catch (err) {
      console.warn('Could not fetch properties for referrals:', err.message);
    }
  };

  useEffect(() => {
    fetchReferrals();
    fetchProperties();
  }, []);

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToastMsg(`Copied code: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // 3. Confirm Payout Settlement via API
  const handleConfirmPayout = async () => {
    if (!payoutModal || !payoutRefId.trim()) {
      showToastMsg('Bank UTR or Transaction Reference ID is required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      };

      const id = payoutModal.mongoId || payoutModal.id;
      const res = await fetch(`${API_BASE}/api/admin/referrals/${id}/payout`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          payoutRefId: payoutRefId.trim(),
          payoutMethod,
          notes: payoutNotes.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        showToastMsg(`Payout of ₹${payoutModal.rewardAmount.toLocaleString()} marked as Paid.`);
        setPayoutModal(null);
        setPayoutRefId('');
        setPayoutNotes('');
        fetchReferrals();
        if (selectedRef && (selectedRef.id === payoutModal.id || selectedRef.mongoId === payoutModal.mongoId)) {
          setSelectedRef(prev => ({
            ...prev,
            payoutStatus: 'Paid',
            payoutDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            payoutRefId: payoutRefId.trim(),
          }));
        }
      } else {
        showToastMsg(data.message || 'Failed to process payout.', 'error');
      }
    } catch (err) {
      showToastMsg('Network error while processing payout.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Update Status Lifecycle (e.g. Eligible for Payout, In Progress, Audit)
  const handleUpdateStatus = async (refItem, newStatus) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      };

      const id = refItem.mongoId || refItem.id;
      const res = await fetch(`${API_BASE}/api/admin/referrals/${id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          payoutStatus: newStatus,
          notes: `Status updated by administrator to ${newStatus}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        showToastMsg(`Referral ${refItem.id} marked as "${newStatus}".`);
        fetchReferrals();
        if (selectedRef && (selectedRef.id === refItem.id || selectedRef.mongoId === refItem.mongoId)) {
          setSelectedRef(prev => ({ ...prev, payoutStatus: newStatus }));
        }
      } else {
        showToastMsg(data.message || 'Failed to update referral status.', 'error');
      }
    } catch (err) {
      showToastMsg('Network error updating status.', 'error');
    }
  };

  // 5. Delete Referral Permanently
  const handleDeleteConfirm = async () => {
    if (!deleteModal) return;
    setIsSubmitting(true);
    try {
      const headers = getAuthHeader();
      const id = deleteModal.mongoId || deleteModal.id;

      const res = await fetch(`${API_BASE}/api/admin/referrals/${id}`, {
        method: 'DELETE',
        headers,
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        showToastMsg(`Referral ${deleteModal.id} permanently deleted.`);
        setReferences(prev => prev.filter(r => r.id !== deleteModal.id && r.mongoId !== deleteModal.mongoId));
        if (selectedRef && (selectedRef.id === deleteModal.id || selectedRef.mongoId === deleteModal.mongoId)) {
          setSelectedRef(null);
        }
        setDeleteModal(null);
        fetchReferrals();
      } else {
        showToastMsg(data.message || 'Failed to delete referral record.', 'error');
      }
    } catch (err) {
      showToastMsg('Network error deleting referral.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Create Real Referral Deal
  const handleCreateReferral = async (e) => {
    e.preventDefault();
    if (!newRef.referrerName.trim() || !newRef.refereeName.trim()) {
      showToastMsg('Referrer and referee names are required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      };

      const payload = {
        referrerName: newRef.referrerName.trim(),
        referrerPhone: newRef.referrerPhone.trim() || '+91 98000 00000',
        referrerEmail: newRef.referrerEmail.trim(),
        referrerRole: newRef.referrerRole,
        referralCode: newRef.referralCode.trim(),
        refereeName: newRef.refereeName.trim(),
        refereePhone: newRef.refereePhone.trim() || '+91 99000 00000',
        refereeEmail: newRef.refereeEmail.trim(),
        linkedProperty: newRef.linkedProperty || undefined,
        propertyTitle: newRef.propertyTitle.trim() || 'Direct Property Deal',
        dealValue: newRef.dealValue.trim() || 'On Request',
        rewardAmount: parseInt(newRef.rewardAmount, 10) || 20000,
        payoutStatus: newRef.payoutStatus || 'Deal In Progress',
        bankDetails: newRef.bankDetails.trim(),
        upiId: newRef.upiId.trim(),
        notes: newRef.notes.trim() || 'Registered via Admin Referral Hub.',
      };

      const res = await fetch(`${API_BASE}/api/admin/referrals`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        showToastMsg('Real referral deal registered in database!');
        setIsAddModalOpen(false);
        setNewRef({
          referrerName: '',
          referrerPhone: '',
          referrerEmail: '',
          referrerRole: 'Resident Ambassador',
          referralCode: '',
          refereeName: '',
          refereePhone: '',
          refereeEmail: '',
          linkedProperty: '',
          propertyTitle: '',
          dealValue: '',
          rewardAmount: '20000',
          payoutStatus: 'Deal In Progress',
          bankDetails: '',
          upiId: '',
          notes: '',
        });
        fetchReferrals();
      } else {
        showToastMsg(data.message || 'Failed to register referral.', 'error');
      }
    } catch (err) {
      showToastMsg('Network error while registering referral.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter & Search
  const filteredRefs = useMemo(() => {
    return references.filter(r => {
      const matchesStatus = statusFilter === 'All' || (r.payoutStatus || '').toLowerCase() === statusFilter.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesStatus;

      const matchesSearch =
        (r.id || '').toLowerCase().includes(q) ||
        (r.referrerName || '').toLowerCase().includes(q) ||
        (r.referrerPhone || '').toLowerCase().includes(q) ||
        (r.refereeName || '').toLowerCase().includes(q) ||
        (r.refereePhone || '').toLowerCase().includes(q) ||
        (r.referralCode || '').toLowerCase().includes(q) ||
        (r.linkedProperty || '').toLowerCase().includes(q) ||
        (r.payoutRefId || '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [references, statusFilter, searchQuery]);

  const totalRewardsPaid = stats.totalRewardsPaid || references
    .filter(r => r.payoutStatus === 'Paid')
    .reduce((sum, r) => sum + (r.rewardAmount || 0), 0);

  const totalEligible = stats.totalEligible || references
    .filter(r => r.payoutStatus === 'Eligible for Payout')
    .reduce((sum, r) => sum + (r.rewardAmount || 0), 0);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return {
          pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/40',
          dot: 'bg-emerald-500'
        };
      case 'eligible for payout':
        return {
          pill: 'bg-brand/10 text-brand border-brand/30',
          dot: 'bg-brand'
        };
      case 'deal in progress':
        return {
          pill: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/40',
          dot: 'bg-blue-500'
        };
      case 'pending audit':
      default:
        return {
          pill: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/40',
          dot: 'bg-amber-500'
        };
    }
  };

  return (
    <div className="w-full space-y-4">

      {/* ─── TOAST NOTIFICATION ─── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 py-2.5 px-4 rounded-xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 ${
          toast.type === 'error'
            ? 'bg-rose-950 border-rose-800 text-rose-200'
            : 'bg-slate-900 border-slate-700 text-white'
        }`}>
          {toast.type === 'error' ? (
            <AlertCircle size={15} className="text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ─── POLISHED HEADER & CONTROL BAR ─── */}
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        {/* Left Side: Title & Info */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0 border border-brand/20 shadow-2xs">
            <Gift size={20} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                Referral Network & Rewards
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live MongoDB</span>
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate max-w-xl">
              Track ambassador referrals, lead attribution, and commission payout settlements
            </p>
          </div>
        </div>

        {/* Right Side: Cleanly Aligned Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchReferrals}
            disabled={isLoading}
            title="Refresh Real Referrals"
            className="w-8 h-8 rounded-lg bg-[var(--bg-muted)] hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-brand flex items-center justify-center border border-[var(--border)] transition-all cursor-pointer active:scale-95 disabled:opacity-50 shadow-2xs"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-brand' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="h-8 px-3 rounded-lg bg-brand hover:bg-brand-dark text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-brand/25 transition-all cursor-pointer active:scale-95"
          >
            <Plus size={14} />
            <span>Register Referral</span>
          </button>
        </div>
      </div>

      {/* ─── 4 POLISHED KPI CARDS WITH HARMONIOUS PROPORTIONS (100% REAL DATA) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {[
          {
            key: 'paid',
            title: 'Total Rewards Disbursed',
            subtitle: 'Paid to advocates',
            icon: Award,
            count: `₹${totalRewardsPaid >= 100000 ? (totalRewardsPaid / 100000).toFixed(2) : totalRewardsPaid.toLocaleString()}`,
            unit: totalRewardsPaid >= 100000 ? 'Lakhs' : 'Total',
            tag: 'Settled',
            tagClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
          },
          {
            key: 'eligible',
            title: 'Eligible for Payout',
            subtitle: 'Ready for bank transfer',
            icon: Gift,
            count: `₹${totalEligible >= 100000 ? (totalEligible / 100000).toFixed(2) : totalEligible.toLocaleString()}`,
            unit: totalEligible >= 100000 ? 'Lakhs' : 'Total',
            tag: 'Actionable',
            tagClass: 'text-brand bg-brand/10 border-brand/20',
            iconBg: 'bg-brand/10 text-brand',
          },
          {
            key: 'funnel',
            title: 'Active Funnel Deals',
            subtitle: 'Deal in progress / survey',
            icon: Clock,
            count: references.filter(r => r.payoutStatus === 'Deal In Progress').length,
            unit: 'Deals',
            tag: `${references.filter(r => r.payoutStatus === 'Deal In Progress').length} Active`,
            tagClass: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
            iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
          },
          {
            key: 'registered',
            title: 'Advocate Network',
            subtitle: 'Total recorded referrals',
            icon: Users,
            count: references.length,
            unit: 'Referrals',
            tag: 'Live DB',
            tagClass: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
            iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="group relative p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-0.5 select-none flex flex-col justify-between overflow-hidden min-h-[104px]"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block transition-colors group-hover:text-[var(--text-primary)]">
                    {card.title}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)] transition-transform duration-200 group-hover:scale-102 inline-block">
                      {card.count}
                    </span>
                    <span className="text-xs font-semibold text-[var(--text-muted)]">
                      {card.unit}
                    </span>
                  </div>
                </div>

                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${card.iconBg} transition-all duration-300 group-hover:scale-105`}>
                  <Icon size={16} strokeWidth={2} />
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-[var(--border)]/70 flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)] truncate max-w-[150px]">
                  {card.subtitle}
                </span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${card.tagClass}`}>
                  {card.tag}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── MAIN MASTER CONTAINER: TOOLBAR + 100% REAL DATA TABLE ─── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xs overflow-hidden transition-all duration-200">

        {/* Clean Filter & Search Toolbar */}
        <div className="p-3 border-b border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--bg-surface)]">

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'All', label: 'All Referrals', count: references.length },
              { id: 'Eligible for Payout', label: 'Eligible', count: references.filter(r => r.payoutStatus === 'Eligible for Payout').length },
              { id: 'Paid', label: 'Paid', count: references.filter(r => r.payoutStatus === 'Paid').length },
              { id: 'Deal In Progress', label: 'In Progress', count: references.filter(r => r.payoutStatus === 'Deal In Progress').length },
              { id: 'Pending Audit', label: 'Audit', count: references.filter(r => r.payoutStatus === 'Pending Audit').length },
            ].map((tab) => {
              const active = statusFilter.toLowerCase() === tab.id.toLowerCase();
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`h-8 px-2.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    active
                      ? 'bg-brand text-white font-semibold shadow-xs shadow-brand/25'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] border border-transparent'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold transition-colors ${
                    active ? 'bg-white/20 text-white' : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input Bar with Clear Button */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            <input
              type="text"
              placeholder="Search referrer, code, referee, UTR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-7 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 focus:bg-[var(--bg-surface)] placeholder:text-[var(--text-muted)] transition-all duration-200"
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

        {/* ─── DATA TABLE: 100% REAL DATA WITH BALANCED PROPORTIONS ─── */}
        <div className="w-full overflow-x-auto min-h-[220px]">
          <table className="w-full text-left border-collapse table-auto min-w-[850px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-muted)]/40">
                <th className="py-3 px-3.5 align-middle whitespace-nowrap w-[130px]">Ref ID</th>
                <th className="py-3 px-3.5 align-middle w-[180px]">Referrer (Advocate)</th>
                <th className="py-3 px-3.5 align-middle w-[150px]">Referral Code</th>
                <th className="py-3 px-3.5 align-middle w-[180px]">Referee (Client)</th>
                <th className="py-3 px-3.5 align-middle w-[180px]">Linked Deal</th>
                <th className="py-3 px-3.5 align-middle w-[130px]">Reward Amount</th>
                <th className="py-3 px-3.5 align-middle text-center whitespace-nowrap w-[140px]">Payout Status</th>
                <th className="py-3 px-3.5 align-middle text-right whitespace-nowrap w-[120px]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="py-14 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col items-center justify-center space-y-2.5">
                      <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-medium">Fetching real referrals from MongoDB...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredRefs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-14 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col items-center justify-center space-y-2 animate-in fade-in duration-200">
                      <div className="w-10 h-10 rounded-full bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)] border border-[var(--border)]">
                        <Gift size={18} />
                      </div>
                      <p className="font-semibold text-sm text-[var(--text-primary)]">
                        {references.length === 0 ? 'No Referral Deals Registered' : 'No matching referral records found'}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] max-w-sm">
                        {references.length === 0
                          ? 'Referrals submitted by community ambassadors or channel partners will securely appear here in real time.'
                          : 'Try changing your search query or switching the payout status filter.'}
                      </p>
                      {references.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => setIsAddModalOpen(true)}
                          className="mt-2 px-3.5 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer hover:bg-brand-dark"
                        >
                          <Plus size={13} />
                          <span>Register First Referral Deal</span>
                        </button>
                      ) : (
                        (searchQuery || statusFilter !== 'All') && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery('');
                              setStatusFilter('All');
                            }}
                            className="mt-1 text-xs font-semibold text-brand hover:underline cursor-pointer"
                          >
                            Clear all filters
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRefs.map((r) => {
                  const statusCfg = getStatusBadge(r.payoutStatus);

                  return (
                    <tr
                      key={r.id || r.mongoId}
                      onClick={() => setSelectedRef(r)}
                      className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors duration-150 cursor-pointer"
                    >
                      {/* 1. Ref ID */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <div className="leading-tight">
                          <span className="font-mono text-[11px] font-semibold text-[var(--text-primary)] group-hover:text-brand transition-colors duration-150 block">
                            {r.id}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                            {r.createdDate}
                          </span>
                        </div>
                      </td>

                      {/* 2. Referrer */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <div className="leading-tight">
                          <p className="font-semibold text-[var(--text-primary)] group-hover:text-brand transition-colors duration-150">
                            {r.referrerName}
                          </p>
                          <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                            {r.referrerRole} {r.referrerPhone ? `• ${r.referrerPhone}` : ''}
                          </span>
                        </div>
                      </td>

                      {/* 3. Referral Code (Click to Copy) */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(r.referralCode)}
                          className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold bg-[var(--bg-muted)] hover:bg-brand/10 hover:border-brand/30 hover:text-brand px-2.5 py-1 rounded-md border border-[var(--border)] transition-all cursor-pointer active:scale-95 shadow-2xs"
                          title="Click to copy referral code"
                        >
                          {copiedCode === r.referralCode ? (
                            <Check size={11} className="text-emerald-500" />
                          ) : (
                            <Copy size={11} className="text-slate-400" />
                          )}
                          <span>{r.referralCode}</span>
                        </button>
                      </td>

                      {/* 4. Referee (Client) */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <div className="leading-tight">
                          <p className="font-medium text-[var(--text-primary)]">
                            {r.refereeName}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                            {r.refereePhone}
                          </p>
                        </div>
                      </td>

                      {/* 5. Linked Deal */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--text-primary)] truncate max-w-[170px]" title={r.linkedProperty}>
                            {r.linkedProperty}
                          </p>
                          <span className="text-[10px] font-semibold text-emerald-600 block mt-0.5">
                            {r.dealValue}
                          </span>
                        </div>
                      </td>

                      {/* 6. Reward Amount */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <div className="leading-tight">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                            ₹{(r.rewardAmount || 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                            Commission
                          </span>
                        </div>
                      </td>

                      {/* 7. Payout Status with Pulsing Beacon */}
                      <td className="py-3 px-3.5 align-middle text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border shadow-2xs ${statusCfg.pill}`}>
                          <span className="relative flex h-1.5 w-1.5 shrink-0">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusCfg.dot}`}></span>
                            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${statusCfg.dot}`}></span>
                          </span>
                          <span>{r.payoutStatus}</span>
                        </span>
                      </td>

                      {/* 8. Actions */}
                      <td className="py-3 px-3.5 align-middle text-right whitespace-nowrap w-[120px]" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {r.refereePhone && (
                            <a
                              href={`tel:${r.refereePhone}`}
                              title={`Call Referee (${r.refereePhone})`}
                              className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-emerald-600 hover:bg-emerald-500/10 border border-[var(--border)] transition-all duration-150 active:scale-90 shadow-2xs shrink-0"
                            >
                              <Phone size={12} />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedRef(r)}
                            title="Inspect Referral Deal"
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-brand hover:border-brand/40 hover:bg-brand/10 border border-[var(--border)] transition-all duration-150 cursor-pointer active:scale-90 shadow-2xs shrink-0"
                          >
                            <Eye size={13} />
                          </button>

                          {r.payoutStatus === 'Eligible for Payout' && (
                            <button
                              type="button"
                              onClick={() => setPayoutModal(r)}
                              title="Settle Reward Payout"
                              className="w-7 h-7 rounded-md flex items-center justify-center text-emerald-600 hover:bg-emerald-500/10 border border-emerald-500/30 transition-all duration-150 cursor-pointer active:scale-90 shadow-2xs shrink-0"
                            >
                              <Gift size={13} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setDeleteModal(r)}
                            title="Delete Referral Record"
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-rose-600 hover:border-rose-500/40 hover:bg-rose-500/10 border border-[var(--border)] transition-all duration-150 cursor-pointer active:scale-90 shadow-2xs shrink-0"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Clean Aligned Footer */}
        <div className="p-3 px-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)] bg-[var(--bg-surface)]">
          <span>Showing <strong className="text-[var(--text-primary)] font-semibold">{filteredRefs.length}</strong> of {references.length} referrals recorded in MongoDB</span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Automated reward tracking ledger verified</span>
          </span>
        </div>

      </div>

      {/* ─── MODAL: PAYOUT SETTLEMENT ─── */}
      {payoutModal && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl max-w-sm w-full shadow-2xl border border-[var(--border)] p-5 space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <div>
                <span className="text-[9px] font-bold text-brand uppercase">Reward Settlement</span>
                <h3 className="text-xs font-bold text-[var(--text-primary)] mt-0.5">Settle Referral Payout</h3>
              </div>
              <button onClick={() => setPayoutModal(null)} className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                <X size={15} />
              </button>
            </div>

            <div className="p-3 bg-[var(--bg-muted)]/70 rounded-lg border border-[var(--border)] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Beneficiary:</span>
                <span className="font-semibold">{payoutModal.referrerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Reward Amount:</span>
                <span className="font-bold text-emerald-600">₹{(payoutModal.rewardAmount || 0).toLocaleString()}</span>
              </div>
              {payoutModal.upiId && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">UPI ID:</span>
                  <span className="font-mono font-medium text-brand">{payoutModal.upiId}</span>
                </div>
              )}
              {payoutModal.bankDetails && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Bank Details:</span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)] text-right truncate max-w-[170px]">{payoutModal.bankDetails}</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[var(--text-muted)]">Payment Method</label>
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="NEFT/IMPS">NEFT / IMPS Bank Transfer</option>
                <option value="Cheque">Cheque Payout</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[var(--text-muted)]">Bank UTR / Transaction Reference *</label>
              <input
                type="text"
                required
                placeholder="e.g. UTR-HDFC-991204812"
                value={payoutRefId}
                onChange={(e) => setPayoutRefId(e.target.value)}
                className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[var(--text-muted)]">Settlement Remarks</label>
              <input
                type="text"
                placeholder="Optional audit remarks..."
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setPayoutModal(null)}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayout}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : 'Confirm Payout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: REGISTER NEW REFERRAL ─── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl max-w-lg w-full shadow-2xl border border-[var(--border)] p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Register Real Referral Deal</h3>
                <p className="text-[11px] text-[var(--text-muted)]">Record an ambassador referral code or peer referral directly in MongoDB</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateReferral} className="space-y-3.5 text-xs">
              {/* Linked Property Dropdown */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-muted)]">Linked Property (Real DB Listings)</label>
                <select
                  value={newRef.linkedProperty}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const prop = availableProperties.find(p => p._id === selId);
                    setNewRef({
                      ...newRef,
                      linkedProperty: selId,
                      propertyTitle: prop?.title || newRef.propertyTitle,
                      dealValue: prop?.price ? `₹${Number(prop.price).toLocaleString('en-IN')}` : newRef.dealValue,
                    });
                  }}
                  className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand"
                >
                  <option value="">-- Direct Deal (No Linked Listing) --</option>
                  {availableProperties.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.title} ({p.city || 'City'}) • ₹{p.price ? p.price.toLocaleString() : 'N/A'} [{p.submissionId || p._id.slice(-6)}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Referrer (Ambassador) Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-muted)]">Referrer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Saxena"
                    value={newRef.referrerName}
                    onChange={(e) => setNewRef({ ...newRef, referrerName: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-muted)]">Referrer Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98711 22339"
                    value={newRef.referrerPhone}
                    onChange={(e) => setNewRef({ ...newRef, referrerPhone: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Referrer Role</label>
                  <select
                    value={newRef.referrerRole}
                    onChange={(e) => setNewRef({ ...newRef, referrerRole: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand"
                  >
                    <option value="Resident Ambassador">Resident Ambassador</option>
                    <option value="Channel Partner">Channel Partner</option>
                    <option value="Existing Homeowner">Existing Homeowner</option>
                    <option value="Verified Agent">Verified Agent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Custom Referral Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={newRef.referralCode}
                    onChange={(e) => setNewRef({ ...newRef, referralCode: e.target.value.toUpperCase() })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand font-mono uppercase"
                  />
                </div>
              </div>

              {/* Referee (Referred Client) Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-muted)]">Referee Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Deepak Joshi"
                    value={newRef.refereeName}
                    onChange={(e) => setNewRef({ ...newRef, refereeName: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-muted)]">Referee Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 99000 33445"
                    value={newRef.refereePhone}
                    onChange={(e) => setNewRef({ ...newRef, refereePhone: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand font-mono"
                  />
                </div>
              </div>

              {/* Reward & Deal Values */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-muted)]">Reward Amount (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 25000"
                      value={newRef.rewardAmount}
                      onChange={(e) => setNewRef({ ...newRef, rewardAmount: e.target.value })}
                      className="w-full h-8 pl-6 pr-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand font-semibold text-emerald-600"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Deal Value Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹1.85 Cr"
                    value={newRef.dealValue}
                    onChange={(e) => setNewRef({ ...newRef, dealValue: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Settlement Banking Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Referrer UPI ID</label>
                  <input
                    type="text"
                    placeholder="e.g. ramesh@okaxis"
                    value={newRef.upiId}
                    onChange={(e) => setNewRef({ ...newRef, upiId: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Referrer Bank A/c & IFSC</label>
                  <input
                    type="text"
                    placeholder="HDFC • A/c 50100... • IFSC..."
                    value={newRef.bankDetails}
                    onChange={(e) => setNewRef({ ...newRef, bankDetails: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand text-[11px]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-muted)]">Audit Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional context or campaign source..."
                  value={newRef.notes}
                  onChange={(e) => setNewRef({ ...newRef, notes: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Register Referral'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: DELETE CONFIRMATION ─── */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl max-w-sm w-full shadow-2xl border border-[var(--border)] p-5 space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5 text-rose-600">
              <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[var(--text-primary)]">Delete Referral Record</h3>
                <span className="text-[10px] text-[var(--text-muted)]">Permanent Database Deletion</span>
              </div>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Are you sure you want to permanently delete referral <strong className="text-[var(--text-primary)] font-mono">{deleteModal.id}</strong> by <strong className="text-[var(--text-primary)]">{deleteModal.referrerName}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DRAWER: INSPECT REFERRAL ─── */}
      {selectedRef && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex justify-end transition-opacity duration-300">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] h-full max-w-md w-full shadow-2xl border-l border-[var(--border)] flex flex-col justify-between animate-in slide-in-from-right duration-250 ease-out">

            {/* Drawer Header */}
            <div className="p-4 border-b border-[var(--border)] flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded border border-brand/20">
                    {selectedRef.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border shadow-2xs ${getStatusBadge(selectedRef.payoutStatus).pill}`}>
                    {selectedRef.payoutStatus}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] mt-1.5">
                  Referral: {selectedRef.referrerName}
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Code: {selectedRef.referralCode} • Registered {selectedRef.createdDate}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRef(null)}
                className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors active:scale-90 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar text-xs">

              {/* Financial Reward Card */}
              <div className="p-3 bg-[var(--bg-muted)]/60 rounded-lg border border-[var(--border)] space-y-2">
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Commission & Payout</span>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Reward Amount</span>
                  <span className="font-bold text-emerald-600 text-sm">₹{(selectedRef.rewardAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Payout Status</span>
                  <span className="font-semibold text-[var(--text-primary)]">{selectedRef.payoutStatus}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Payout Timeline</span>
                  <span className="font-medium text-[var(--text-primary)]">{selectedRef.payoutDate || 'Pending Settlement'}</span>
                </div>
                {selectedRef.payoutRefId && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Bank UTR / Ref</span>
                    <span className="font-mono text-brand font-semibold">{selectedRef.payoutRefId}</span>
                  </div>
                )}
                {selectedRef.upiId && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">UPI ID</span>
                    <span className="font-mono text-brand font-medium">{selectedRef.upiId}</span>
                  </div>
                )}
                {selectedRef.bankDetails && (
                  <div className="text-xs pt-1 border-t border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">Bank Account</span>
                    <span className="font-mono text-[10px] text-[var(--text-primary)]">{selectedRef.bankDetails}</span>
                  </div>
                )}
              </div>

              {/* Status Action Switcher */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Update Deal Stage</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {['Deal In Progress', 'Eligible for Payout', 'Pending Audit'].map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => handleUpdateStatus(selectedRef, stage)}
                      className={`h-7 px-2 rounded-md text-[10px] font-semibold border transition-all cursor-pointer ${
                        selectedRef.payoutStatus === stage
                          ? 'bg-brand/10 text-brand border-brand font-bold'
                          : 'bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border-[var(--border)]'
                      }`}
                    >
                      {stage === 'Eligible for Payout' ? 'Eligible' : stage === 'Deal In Progress' ? 'In Progress' : 'Audit'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stakeholders Card */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Parties</span>
                <div className="rounded-lg border border-[var(--border)] divide-y divide-[var(--border)] text-xs bg-[var(--bg-surface)]">
                  <div className="p-2.5 flex justify-between">
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] block">Referrer Advocate</span>
                      <span className="font-semibold text-[var(--text-primary)]">{selectedRef.referrerName}</span>
                      <span className="font-mono text-[10px] text-[var(--text-muted)] block mt-0.5">{selectedRef.referrerPhone}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[var(--text-muted)] block">Role</span>
                      <span className="text-[11px] text-[var(--text-primary)] font-medium">{selectedRef.referrerRole}</span>
                    </div>
                  </div>
                  <div className="p-2.5 flex justify-between">
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] block">Referred Client (Referee)</span>
                      <span className="font-semibold text-[var(--text-primary)]">{selectedRef.refereeName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[var(--text-muted)] block">Phone</span>
                      <span className="font-mono text-[11px] text-[var(--text-primary)]">{selectedRef.refereePhone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Linked Deal */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Linked Deal Info</span>
                <div className="p-2.5 bg-[var(--bg-muted)]/50 rounded-lg text-xs space-y-1 border border-[var(--border)]">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Property</span>
                    <span className="font-semibold text-[var(--text-primary)]">{selectedRef.linkedProperty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Deal Value</span>
                    <span className="font-semibold text-emerald-600">{selectedRef.dealValue}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedRef.notes && (
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Activity Notes</span>
                  <div className="p-2.5 bg-[var(--bg-muted)]/60 text-[var(--text-muted)] text-xs rounded-lg border border-[var(--border)] leading-relaxed">
                    {selectedRef.notes}
                  </div>
                </div>
              )}

            </div>

            {/* Drawer Actions */}
            <div className="p-3.5 border-t border-[var(--border)] flex items-center justify-between gap-2 bg-[var(--bg-surface)]">
              {selectedRef.payoutStatus === 'Eligible for Payout' ? (
                <button
                  type="button"
                  onClick={() => setPayoutModal(selectedRef)}
                  className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 shadow-xs hover:shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                >
                  <Gift size={12} />
                  <span>Settle Payout</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedRef(null)}
                  className="flex-1 h-8 bg-[var(--bg-muted)] hover:bg-[var(--border)] text-[var(--text-primary)] rounded-md text-xs font-medium cursor-pointer"
                >
                  Close Inspection
                </button>
              )}

              <button
                type="button"
                onClick={() => setDeleteModal(selectedRef)}
                title="Delete Referral"
                className="w-8 h-8 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20 flex items-center justify-center cursor-pointer active:scale-90 shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ReferenceWorkflow;
