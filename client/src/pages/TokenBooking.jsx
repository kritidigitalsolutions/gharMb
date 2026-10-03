import React, { useState, useEffect } from 'react';
import {
  IndianRupee, ShieldCheck, Lock, RotateCcw, CheckCircle2,
  XCircle, Clock, Search, Filter, AlertCircle, Download,
  ExternalLink, Calendar, User, Building, ArrowUpRight,
  Sparkles, FileText, Check, ChevronRight, X, Eye, Edit2,
  UserCheck, Shield, CheckCircle, Settings, Plus, Trash2,
  Briefcase, Users, FileCheck, Layers, ArrowRight, RefreshCw,
  Phone, MessageSquare, Mail, AlertTriangle, Copy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TokenBooking = () => {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState([]);
  const [stats, setStats] = useState({
    totalHeldInEscrow: 0,
    totalReleased: 0,
    activeCount: 0,
    refundedCount: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedToken, setSelectedToken] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { type: 'release' | 'refund' | 'dispute' | 'escrow held', token }
  const [actionReason, setActionReason] = useState('');
  const [utrInput, setUtrInput] = useState('');
  const [deleteModal, setDeleteModal] = useState(null); // token to delete
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Property list for linking bookings
  const [propertiesList, setPropertiesList] = useState([]);

  // Token Amount Configuration Modal (Admin Controls)
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [tokenConfig, setTokenConfig] = useState({
    tokenAmounts: [2000, 5000],
    defaultTokenAmount: 2000,
    minTokenAmount: 1000,
    maxTokenAmount: 100000,
    allowCustomAmount: false,
    adjustmentNote: "Token amount will be adjusted in security deposit or first month's rent",
    validityDays: 7,
  });
  const [newAmountInput, setNewAmountInput] = useState('');

  // Record New Token Booking Modal (Admin Entry)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    buyerName: '',
    buyerPhone: '',
    buyerEmail: '',
    currentCity: '',
    propertyId: '',
    tokenAmount: 2000,
    monthlyRent: '',
    paymentMethod: 'upi',
    utrRef: '',
    escrowBank: 'ICICI Escrow Trust #9910',
    notes: '',
    maritalStatus: 'Single',
    numberOfFamilyMembers: '1',
    profession: 'Salaried Professional',
    companyName: '',
    monthlyIncome: '',
  });

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

  // 1. Fetch Real Tokens from Backend API
  const fetchTokens = async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeader();
      const res = await fetch(`${API_BASE}/api/admin/tokens`, { headers });
      const data = await res.json();

      if (res.ok && data.status === 'success' && data.data) {
        setTokens(data.data.tokens || []);
        if (data.data.stats) {
          setStats({
            totalHeldInEscrow: data.data.stats.totalHeldInEscrow || 0,
            totalReleased: data.data.stats.totalReleased || 0,
            activeCount: data.data.stats.activeCount || 0,
            refundedCount: data.data.stats.refundedCount || 0,
          });
        }
      } else {
        setTokens([]);
        if (res.status === 401 || res.status === 403) {
          showToastMsg('Session expired or admin access required.', 'error');
        }
      }
    } catch (err) {
      console.error('API error fetching real tokens:', err.message);
      setTokens([]);
      showToastMsg('Failed to fetch real token records from backend.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Fetch Token Settings (Configured by Admin)
  const fetchTokenSettings = async () => {
    try {
      const headers = getAuthHeader();
      const res = await fetch(`${API_BASE}/api/admin/tokens/settings`, { headers });
      const data = await res.json();

      if (res.ok && data.status === 'success' && data.data?.settings) {
        const s = data.data.settings;
        setTokenConfig({
          tokenAmounts: s.tokenAmounts && s.tokenAmounts.length > 0 ? s.tokenAmounts : [2000, 5000],
          defaultTokenAmount: s.defaultTokenAmount || 2000,
          minTokenAmount: s.minTokenAmount || 1000,
          maxTokenAmount: s.maxTokenAmount || 100000,
          allowCustomAmount: s.allowCustomAmount || false,
          adjustmentNote: s.adjustmentNote || "Token amount will be adjusted in security deposit or first month's rent",
          validityDays: s.validityDays || 7,
        });
      }
    } catch (err) {
      console.warn('Could not fetch token settings:', err.message);
    }
  };

  // 3. Fetch Real Properties for Property Selector
  const fetchProperties = async () => {
    try {
      const headers = getAuthHeader();
      const res = await fetch(`${API_BASE}/api/admin/properties?limit=100`, { headers });
      const data = await res.json();
      if (res.ok && data.data?.properties) {
        setPropertiesList(data.data.properties);
      }
    } catch (err) {
      console.warn('Could not fetch properties list:', err.message);
    }
  };

  useEffect(() => {
    fetchTokens();
    fetchTokenSettings();
    fetchProperties();
  }, []);

  // 4. Save Admin Token Amount Settings
  const handleSaveTokenConfig = async (e) => {
    e?.preventDefault();
    if (!tokenConfig.tokenAmounts || tokenConfig.tokenAmounts.length === 0) {
      showToastMsg('Please add at least one token amount option.', 'error');
      return;
    }

    setIsSavingConfig(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      };

      const res = await fetch(`${API_BASE}/api/admin/tokens/settings`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(tokenConfig),
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        showToastMsg(`Token amounts updated: ${tokenConfig.tokenAmounts.map(a => `₹${a.toLocaleString()}`).join(', ')}`);
        setShowConfigModal(false);
      } else {
        showToastMsg(data.message || 'Failed to save token settings', 'error');
      }
    } catch (err) {
      showToastMsg('Network error while saving token settings', 'error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleAddAmount = () => {
    const val = parseInt(newAmountInput.replace(/[^0-9]/g, ''), 10);
    if (!val || val <= 0) {
      showToastMsg('Please enter a valid numeric token amount.', 'error');
      return;
    }
    if (tokenConfig.tokenAmounts.includes(val)) {
      showToastMsg('This token amount is already in the list.', 'error');
      return;
    }
    const updated = [...tokenConfig.tokenAmounts, val].sort((a, b) => a - b);
    setTokenConfig({
      ...tokenConfig,
      tokenAmounts: updated,
      defaultTokenAmount: tokenConfig.defaultTokenAmount || val,
    });
    setNewAmountInput('');
  };

  const handleRemoveAmount = (amountToRemove) => {
    if (tokenConfig.tokenAmounts.length <= 1) {
      showToastMsg('You must have at least one token amount option.', 'error');
      return;
    }
    const updated = tokenConfig.tokenAmounts.filter(a => a !== amountToRemove);
    setTokenConfig({
      ...tokenConfig,
      tokenAmounts: updated,
      defaultTokenAmount: tokenConfig.defaultTokenAmount === amountToRemove ? updated[0] : tokenConfig.defaultTokenAmount,
    });
  };

  // 5. Handle Escrow Authorization Confirm (Release / Refund / Dispute)
  const handleActionConfirm = async () => {
    if (!actionModal) return;
    const { type, token } = actionModal;
    setIsSubmitting(true);

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      };

      const idToUpdate = token.mongoId || token.id;
      const res = await fetch(`${API_BASE}/api/admin/tokens/${idToUpdate}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          action: type,
          notes: actionReason,
          utrRef: utrInput || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        let newStatus = token.status;
        if (type === 'release') newStatus = 'Released';
        else if (type === 'refund') newStatus = 'Refunded';
        else if (type === 'dispute') newStatus = 'Disputed';
        else if (type === 'escrow held') newStatus = 'Escrow Held';

        showToastMsg(`Token ${token.id} updated to "${newStatus}".`);
        setActionModal(null);
        setActionReason('');
        setUtrInput('');
        fetchTokens();

        if (selectedToken && (selectedToken.id === token.id || selectedToken.mongoId === token.mongoId)) {
          setSelectedToken(prev => ({
            ...prev,
            status: newStatus,
            notes: `${prev.notes || ''} | ${actionReason || `Escrow ${type} completed`}`.trim(),
            utrRef: utrInput || prev.utrRef,
          }));
        }
      } else {
        showToastMsg(data.message || 'Failed to update token escrow status.', 'error');
      }
    } catch (err) {
      showToastMsg('Network error while updating token status.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Delete Token Booking
  const handleDeleteConfirm = async () => {
    if (!deleteModal) return;
    setIsSubmitting(true);
    try {
      const headers = getAuthHeader();
      const idToDelete = deleteModal.mongoId || deleteModal.id;

      const res = await fetch(`${API_BASE}/api/admin/tokens/${idToDelete}`, {
        method: 'DELETE',
        headers,
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        showToastMsg(`Token booking ${deleteModal.id} permanently deleted.`);
        setTokens(prev => prev.filter(t => t.id !== deleteModal.id && t.mongoId !== deleteModal.mongoId));
        if (selectedToken && (selectedToken.id === deleteModal.id || selectedToken.mongoId === deleteModal.mongoId)) {
          setSelectedToken(null);
        }
        setDeleteModal(null);
        fetchTokens();
      } else {
        showToastMsg(data.message || 'Failed to delete token record.', 'error');
      }
    } catch (err) {
      showToastMsg('Network error while deleting token.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Create New Token Booking Manually
  const handleCreateTokenSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.buyerName.trim() || !createForm.buyerPhone.trim()) {
      showToastMsg('Buyer full name and mobile number are required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      };

      const payload = {
        buyerName: createForm.buyerName.trim(),
        buyerPhone: createForm.buyerPhone.trim(),
        buyerEmail: createForm.buyerEmail.trim(),
        currentCity: createForm.currentCity.trim(),
        propertyId: createForm.propertyId || undefined,
        tokenAmount: Number(createForm.tokenAmount) || 2000,
        monthlyRent: Number(createForm.monthlyRent) || undefined,
        paymentMethod: createForm.paymentMethod,
        utrRef: createForm.utrRef.trim() || `UTR-UPI-${Date.now().toString().slice(-8)}`,
        escrowBank: createForm.escrowBank.trim(),
        notes: createForm.notes.trim() || 'Recorded manually via Admin Console',
        familyDetails: {
          numberOfFamilyMembers: createForm.numberOfFamilyMembers || '1',
          adults: '1',
          children: '0',
          maritalStatus: createForm.maritalStatus || 'Single',
        },
        occupationDetails: {
          profession: createForm.profession || 'Professional',
          companyName: createForm.companyName || '',
          monthlyIncome: createForm.monthlyIncome || '',
        },
      };

      const res = await fetch(`${API_BASE}/api/admin/tokens`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        showToastMsg('Real token booking created successfully in database!');
        setShowCreateModal(false);
        setCreateForm({
          buyerName: '',
          buyerPhone: '',
          buyerEmail: '',
          currentCity: '',
          propertyId: '',
          tokenAmount: tokenConfig.defaultTokenAmount || 2000,
          monthlyRent: '',
          paymentMethod: 'upi',
          utrRef: '',
          escrowBank: 'ICICI Escrow Trust #9910',
          notes: '',
          maritalStatus: 'Single',
          numberOfFamilyMembers: '1',
          profession: 'Salaried Professional',
          companyName: '',
          monthlyIncome: '',
        });
        fetchTokens();
      } else {
        showToastMsg(data.message || 'Failed to create token booking.', 'error');
      }
    } catch (err) {
      showToastMsg('Network error creating token booking.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter & Search
  const filteredTokens = tokens.filter(t => {
    const matchesStatus = statusFilter === 'All' || (t.status || '').toLowerCase() === statusFilter.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesStatus;

    const matchesSearch =
      (t.id || '').toLowerCase().includes(query) ||
      (t.buyerName || '').toLowerCase().includes(query) ||
      (t.propertyTitle || '').toLowerCase().includes(query) ||
      (t.sellerName || '').toLowerCase().includes(query) ||
      (t.buyerPhone || '').toLowerCase().includes(query) ||
      (t.buyerEmail || '').toLowerCase().includes(query) ||
      (t.utrRef || '').toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const totalHeldInEscrow = stats.totalHeldInEscrow || tokens
    .filter(t => t.status === 'Escrow Held')
    .reduce((sum, t) => sum + (t.tokenAmount || 0), 0);

  const totalReleased = stats.totalReleased || tokens
    .filter(t => t.status === 'Released')
    .reduce((sum, t) => sum + (t.tokenAmount || 0), 0);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'released':
        return {
          pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/40',
          dot: 'bg-emerald-500'
        };
      case 'refunded':
        return {
          pill: 'bg-slate-100 text-slate-700 dark:bg-slate-800/70 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          dot: 'bg-slate-400'
        };
      case 'disputed':
        return {
          pill: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/40',
          dot: 'bg-rose-500'
        };
      case 'escrow held':
      default:
        return {
          pill: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/40',
          dot: 'bg-blue-500'
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
            : toast.type === 'info'
            ? 'bg-blue-950 border-blue-800 text-blue-200'
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
            <IndianRupee size={20} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                Property Token Booking & Escrow
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live MongoDB</span>
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate max-w-xl">
              Active Booking Amounts: <strong className="text-[var(--text-primary)] font-semibold">{tokenConfig.tokenAmounts.map(amt => `₹${amt.toLocaleString()}`).join(' / ')}</strong>
              <span className="mx-1.5 text-[var(--border)]">•</span>
              <span>{tokenConfig.adjustmentNote}</span>
            </p>
          </div>
        </div>

        {/* Right Side: Cleanly Aligned Actions In One Single Row */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchTokens}
            disabled={isLoading}
            title="Refresh Real Token Deposits"
            className="w-8 h-8 rounded-lg bg-[var(--bg-muted)] hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-brand flex items-center justify-center border border-[var(--border)] transition-all cursor-pointer active:scale-95 disabled:opacity-50 shadow-2xs"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-brand' : ''} />
          </button>

          {/* Configure Amounts Button */}
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="h-8 px-3 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] text-xs font-semibold flex items-center gap-1.5 border border-[var(--border)] transition-all cursor-pointer active:scale-95 shadow-2xs"
          >
            <Settings size={13} className="text-[var(--text-muted)]" />
            <span>Configure Amounts</span>
          </button>

          {/* Record Token Booking Button */}
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="h-8 px-3 rounded-lg bg-brand hover:bg-brand-dark text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-brand/25 transition-all cursor-pointer active:scale-95"
          >
            <Plus size={14} />
            <span>Record Token Booking</span>
          </button>
        </div>
      </div>

      {/* ─── 4 POLISHED KPI CARDS WITH HARMONIOUS PROPORTIONS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {[
          {
            key: 'held',
            title: 'Escrow Held Amount',
            subtitle: 'Protected in GharMB Escrow',
            icon: Lock,
            count: `₹${totalHeldInEscrow >= 100000 ? (totalHeldInEscrow / 100000).toFixed(2) : totalHeldInEscrow.toLocaleString()}`,
            unit: totalHeldInEscrow >= 100000 ? 'Lakhs' : 'Total',
            tag: 'Held in Escrow',
            tagClass: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
            iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
          },
          {
            key: 'released',
            title: 'Deals Closed (Released)',
            subtitle: 'Disbursed to developers',
            icon: CheckCircle2,
            count: `₹${totalReleased >= 100000 ? (totalReleased / 100000).toFixed(2) : totalReleased.toLocaleString()}`,
            unit: totalReleased >= 100000 ? 'Lakhs' : 'Total',
            tag: 'Disbursed',
            tagClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          },
          {
            key: 'active',
            title: 'Active Token Deposits',
            subtitle: 'Within 7-day validity',
            icon: ShieldCheck,
            count: tokens.filter(t => t.status === 'Escrow Held').length,
            unit: 'Active',
            tag: `${tokens.filter(t => t.status === 'Escrow Held').length} Active`,
            tagClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
            iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
          },
          {
            key: 'refunded',
            title: 'Refunds Processed',
            subtitle: '100% Policy adherence',
            icon: RotateCcw,
            count: tokens.filter(t => t.status === 'Refunded').length,
            unit: 'Settled',
            tag: `${tokens.filter(t => t.status === 'Refunded').length} Settled`,
            tagClass: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
            iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
          }
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
              { id: 'All', label: 'All Tokens', count: tokens.length },
              { id: 'Escrow Held', label: 'Escrow Held', count: tokens.filter(t => t.status === 'Escrow Held').length },
              { id: 'Released', label: 'Released', count: tokens.filter(t => t.status === 'Released').length },
              { id: 'Refunded', label: 'Refunded', count: tokens.filter(t => t.status === 'Refunded').length },
              { id: 'Disputed', label: 'Disputed', count: tokens.filter(t => t.status === 'Disputed').length }
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
              placeholder="Search token, buyer, property, UTR..."
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
                <th className="py-3 px-3.5 align-middle whitespace-nowrap w-[140px]">Token ID</th>
                <th className="py-3 px-3.5 align-middle w-[180px]">Linked Property</th>
                <th className="py-3 px-3.5 align-middle w-[210px]">Buyer Details (KYC)</th>
                <th className="py-3 px-3.5 align-middle w-[150px]">Seller / Developer</th>
                <th className="py-3 px-3.5 align-middle w-[150px]">Deposit (Escrow)</th>
                <th className="py-3 px-3.5 align-middle w-[110px]">Agreed Value</th>
                <th className="py-3 px-3.5 align-middle text-center whitespace-nowrap w-[120px]">Escrow Status</th>
                <th className="py-3 px-3.5 align-middle text-right whitespace-nowrap w-[110px]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="py-14 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col items-center justify-center space-y-2.5">
                      <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-medium">Fetching real token escrow transactions from MongoDB...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-14 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col items-center justify-center space-y-2 animate-in fade-in duration-200">
                      <div className="w-10 h-10 rounded-full bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)] border border-[var(--border)]">
                        <Lock size={18} />
                      </div>
                      <p className="font-semibold text-sm text-[var(--text-primary)]">
                        {tokens.length === 0 ? 'No Token Booking Deposits Recorded' : 'No matching token records found'}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] max-w-sm">
                        {tokens.length === 0
                          ? 'Token bookings initiated by buyers through the mobile app or web portal will securely show up here in real time.'
                          : 'Try changing your search query or switching the escrow status filter.'}
                      </p>
                      {tokens.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => setShowCreateModal(true)}
                          className="mt-2 px-3.5 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer hover:bg-brand-dark"
                        >
                          <Plus size={13} />
                          <span>Record First Token Booking</span>
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
                filteredTokens.map((t) => {
                  const statusCfg = getStatusBadge(t.status);

                  return (
                    <tr
                      key={t.id || t.mongoId}
                      onClick={() => setSelectedToken(t)}
                      className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors duration-150 cursor-pointer"
                    >
                      {/* 1. Token ID */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <div className="leading-tight">
                          <span className="font-mono text-[11px] font-semibold text-[var(--text-primary)] group-hover:text-brand transition-colors duration-150 block">
                            {t.id}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                            {t.bookingDate}
                          </span>
                        </div>
                      </td>

                      {/* 2. Linked Property */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--text-primary)] group-hover:text-brand transition-colors duration-150 truncate max-w-[170px]" title={t.propertyTitle}>
                            {t.propertyTitle}
                          </p>
                          <span className="font-mono text-[10px] text-[var(--text-muted)] mt-0.5 block truncate max-w-[170px]">
                            {t.propertyId} {t.propertyCity ? `• ${t.propertyCity}` : ''}
                          </span>
                        </div>
                      </td>

                      {/* 3. Buyer Details (5-Step Form) */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <div className="leading-tight">
                          <p className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                            <span>{t.buyerName}</span>
                            {t.idProof?.documentUrl && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
                                KYC Verified
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-[var(--text-muted)] font-mono">
                              {t.buyerPhone}
                            </span>
                            {t.currentCity && (
                              <span className="text-[10px] text-[var(--text-muted)]">
                                • {t.currentCity}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 4. Seller / Developer */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <div className="leading-tight">
                          <p className="font-medium text-[var(--text-primary)] truncate max-w-[140px]">
                            {t.sellerName}
                          </p>
                          <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                            {t.sellerRole}
                          </span>
                        </div>
                      </td>

                      {/* 5. Booking Deposit */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <div className="leading-tight">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                            ₹{(t.tokenAmount || 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5 block">
                            {(t.paymentMethod || 'UPI').toUpperCase()} • {t.escrowBank || 'Escrow Trust'}
                          </span>
                        </div>
                      </td>

                      {/* 6. Agreed Value */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <div className="leading-tight">
                          <span className="font-semibold text-[var(--text-primary)] block">
                            {t.totalAgreedPrice || (t.monthlyRent ? `₹${t.monthlyRent.toLocaleString()}/mo` : '₹0')}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                            Agreed Price
                          </span>
                        </div>
                      </td>

                      {/* 7. Escrow Status */}
                      <td className="py-3 px-3.5 align-middle text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border shadow-2xs ${statusCfg.pill}`}>
                          <span className="relative flex h-1.5 w-1.5 shrink-0">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusCfg.dot}`}></span>
                            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${statusCfg.dot}`}></span>
                          </span>
                          <span>{t.status}</span>
                        </span>
                      </td>

                      {/* 8. Actions (View, Direct Call/WA, Delete) */}
                      <td className="py-3 px-3.5 align-middle text-right whitespace-nowrap w-[110px]" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {t.buyerPhone && (
                            <a
                              href={`tel:${t.buyerPhone}`}
                              title={`Call Buyer (${t.buyerPhone})`}
                              className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-emerald-600 hover:bg-emerald-500/10 border border-[var(--border)] transition-all duration-150 active:scale-90 shadow-2xs shrink-0"
                            >
                              <Phone size={12} />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedToken(t)}
                            title="Audit 5-Step Booking & KYC Details"
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-brand hover:border-brand/40 hover:bg-brand/10 border border-[var(--border)] transition-all duration-150 cursor-pointer active:scale-90 shadow-2xs shrink-0"
                          >
                            <Eye size={13} />
                          </button>

                          {t.status === 'Escrow Held' && (
                            <button
                              type="button"
                              onClick={() => setActionModal({ type: 'release', token: t })}
                              title="Release Escrow Payout to Developer"
                              className="w-7 h-7 rounded-md flex items-center justify-center text-emerald-600 hover:bg-emerald-500/10 border border-emerald-500/30 transition-all duration-150 cursor-pointer active:scale-90 shadow-2xs shrink-0"
                            >
                              <CheckCircle2 size={13} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setDeleteModal(t)}
                            title="Delete Token Booking"
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
          <span>Showing <strong className="text-[var(--text-primary)] font-semibold">{filteredTokens.length}</strong> of {tokens.length} token deposits recorded in MongoDB</span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>GharMB Escrow Trust Ledger Node Verified</span>
          </span>
        </div>

      </div>

      {/* ─── MODAL: CONFIGURE TOKEN AMOUNTS (ADMIN SETTING) ─── */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 transition-all">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl max-w-md w-full shadow-2xl border border-[var(--border)] p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-brand uppercase tracking-wider">Admin Configuration</span>
                <h3 className="text-sm font-bold text-[var(--text-primary)] mt-0.5 flex items-center gap-1.5">
                  <IndianRupee size={16} className="text-brand" />
                  <span>Set Token Booking Amounts</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Configure the token booking amounts presented to buyers on the mobile app and website (Step 5 of "Book with Token").
            </p>

            {/* Active Amount Chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                Available Token Amounts (Displayed to Users)
              </label>
              <div className="flex flex-wrap gap-2">
                {tokenConfig.tokenAmounts.map((amt) => {
                  const isDefault = tokenConfig.defaultTokenAmount === amt;
                  return (
                    <div
                      key={amt}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        isDefault
                          ? 'bg-brand/10 border-brand text-brand'
                          : 'bg-[var(--bg-muted)] border-[var(--border)] text-[var(--text-primary)]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setTokenConfig({ ...tokenConfig, defaultTokenAmount: amt })}
                        title="Click to set as pre-selected default"
                        className="cursor-pointer"
                      >
                        ₹{amt.toLocaleString()}
                        {isDefault && <span className="ml-1 text-[9px] font-bold uppercase">(Default)</span>}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveAmount(amt)}
                        className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer ml-1"
                        title="Remove amount"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add New Amount Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[var(--text-muted)]">Add Custom Token Amount (₹)</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    placeholder="e.g. 10000"
                    value={newAmountInput}
                    onChange={(e) => setNewAmountInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAmount();
                      }
                    }}
                    className="w-full h-8 pl-6 pr-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddAmount}
                  className="h-8 px-3 rounded-lg bg-[var(--bg-muted)] hover:bg-[var(--border)] text-[var(--text-primary)] text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors border border-[var(--border)]"
                >
                  <Plus size={13} />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Adjustment Note */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[var(--text-muted)]">
                Policy Notice / Adjustment Term
              </label>
              <textarea
                rows={2}
                value={tokenConfig.adjustmentNote}
                onChange={(e) => setTokenConfig({ ...tokenConfig, adjustmentNote: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand resize-none"
              />
              <span className="text-[10px] text-[var(--text-muted)] block">
                Shown below the token radio options in the mobile app.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTokenConfig}
                disabled={isSavingConfig}
                className="px-4 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              >
                {isSavingConfig ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: RECORD MANUAL TOKEN BOOKING (NEW REAL DEPOSIT) ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 transition-all">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl max-w-lg w-full shadow-2xl border border-[var(--border)] p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Manual Escrow Entry</span>
                <h3 className="text-sm font-bold text-[var(--text-primary)] mt-0.5 flex items-center gap-1.5">
                  <Plus size={16} className="text-emerald-600" />
                  <span>Record Real Token Booking</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTokenSubmit} className="space-y-3.5 text-xs">
              {/* Linked Property Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-muted)]">
                  Linked Property (From Real Listings)
                </label>
                <select
                  value={createForm.propertyId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const prop = propertiesList.find(p => p._id === selId);
                    setCreateForm({
                      ...createForm,
                      propertyId: selId,
                      monthlyRent: prop?.price || createForm.monthlyRent,
                    });
                  }}
                  className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand"
                >
                  <option value="">-- Direct Booking (No Linked Property) --</option>
                  {propertiesList.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.title} ({p.city || 'City'}) • ₹{p.price ? p.price.toLocaleString() : 'N/A'} [{p.submissionId || p._id.slice(-6)}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Buyer Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-muted)]">Buyer Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aman Verma"
                    value={createForm.buyerName}
                    onChange={(e) => setCreateForm({ ...createForm, buyerName: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-muted)]">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={createForm.buyerPhone}
                    onChange={(e) => setCreateForm({ ...createForm, buyerPhone: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Buyer Email</label>
                  <input
                    type="email"
                    placeholder="buyer@gmail.com"
                    value={createForm.buyerEmail}
                    onChange={(e) => setCreateForm({ ...createForm, buyerEmail: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Current City</label>
                  <input
                    type="text"
                    placeholder="e.g. Noida, Delhi NCR"
                    value={createForm.currentCity}
                    onChange={(e) => setCreateForm({ ...createForm, currentCity: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Deposit Financials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-muted)]">Token Deposit (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      required
                      value={createForm.tokenAmount}
                      onChange={(e) => setCreateForm({ ...createForm, tokenAmount: e.target.value })}
                      className="w-full h-8 pl-6 pr-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand font-semibold text-emerald-600"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Agreed Price / Rent (₹)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      placeholder="e.g. 25000"
                      value={createForm.monthlyRent}
                      onChange={(e) => setCreateForm({ ...createForm, monthlyRent: e.target.value })}
                      className="w-full h-8 pl-6 pr-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Payment Mode</label>
                  <select
                    value={createForm.paymentMethod}
                    onChange={(e) => setCreateForm({ ...createForm, paymentMethod: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand"
                  >
                    <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="netbanking">Net Banking</option>
                    <option value="card">Debit / Credit Card</option>
                    <option value="escrow_transfer">Direct Escrow Transfer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">UTR / Transaction Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR-HDFC-99881122"
                    value={createForm.utrRef}
                    onChange={(e) => setCreateForm({ ...createForm, utrRef: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand font-mono"
                  />
                </div>
              </div>

              {/* Escrow Custody Node */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-muted)]">Escrow Custody Node / Trust</label>
                <input
                  type="text"
                  value={createForm.escrowBank}
                  onChange={(e) => setCreateForm({ ...createForm, escrowBank: e.target.value })}
                  className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-muted)]">Notes / Verification Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Additional verification details..."
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Saving...' : 'Save Real Token Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ESCROW AUTHORIZATION (RELEASE / REFUND / DISPUTE) ─── */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl max-w-sm w-full shadow-2xl border border-[var(--border)] p-5 space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <div>
                <span className="text-[9px] font-bold text-brand uppercase">Escrow Authorization</span>
                <h3 className="text-xs font-bold text-[var(--text-primary)] mt-0.5">
                  {actionModal.type === 'release' ? 'Release Escrow to Seller' : actionModal.type === 'refund' ? 'Process Buyer Refund' : 'Lock Escrow Dispute'}
                </h3>
              </div>
              <button onClick={() => setActionModal(null)} className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                <X size={15} />
              </button>
            </div>

            <div className="p-3 bg-[var(--bg-muted)]/70 rounded-lg border border-[var(--border)] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Token ID:</span>
                <span className="font-mono font-semibold">{actionModal.token.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Deposit Amount:</span>
                <span className="font-bold text-emerald-600">₹{(actionModal.token.tokenAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Beneficiary:</span>
                <span className="font-semibold truncate max-w-[170px] text-right">
                  {actionModal.type === 'release' ? actionModal.token.sellerName : actionModal.token.buyerName}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[var(--text-muted)]">Bank Transaction / UTR Ref</label>
              <input
                type="text"
                placeholder="e.g. UTR-AXIS-992018402"
                value={utrInput}
                onChange={(e) => setUtrInput(e.target.value)}
                className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[var(--text-muted)]">Authorization Notes / Remarks</label>
              <textarea
                rows={2}
                placeholder="Enter settlement notes, agreement reference, or reason..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 resize-none transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActionConfirm}
                disabled={isSubmitting}
                className={`px-3.5 py-1.5 text-white rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 ${
                  actionModal.type === 'release' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-brand hover:bg-brand-dark'
                }`}
              >
                {isSubmitting ? 'Processing...' : 'Confirm Payout'}
              </button>
            </div>
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
                <h3 className="text-xs font-bold text-[var(--text-primary)]">Delete Token Record</h3>
                <span className="text-[10px] text-[var(--text-muted)]">Permanent Database Deletion</span>
              </div>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Are you sure you want to permanently delete token deposit record <strong className="text-[var(--text-primary)] font-mono">{deleteModal.id}</strong> for <strong className="text-[var(--text-primary)]">{deleteModal.buyerName}</strong>?
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

      {/* ─── DRAWER: FULL 5-STEP AUDIT & ESCROW DETAILS (REAL DATA) ─── */}
      {selectedToken && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex justify-end transition-opacity duration-300">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] h-full max-w-lg w-full shadow-2xl border-l border-[var(--border)] flex flex-col justify-between animate-in slide-in-from-right duration-250 ease-out">

            {/* Drawer Header */}
            <div className="p-4 border-b border-[var(--border)] flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded border border-brand/20">
                    {selectedToken.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border shadow-2xs ${getStatusBadge(selectedToken.status).pill}`}>
                    {selectedToken.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] mt-1.5">
                  {selectedToken.propertyTitle}
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Deposit: ₹{(selectedToken.tokenAmount || 0).toLocaleString()} • Logged on {selectedToken.bookingDate}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedToken(null)}
                className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors active:scale-90 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Scrollable Body: Matches the 5-Step Real Mobile Flow */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar text-xs">

              {/* Step 1: Personal Details */}
              <div className="p-3 bg-[var(--bg-muted)]/50 rounded-lg border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-brand font-bold text-[11px] uppercase tracking-wider">
                    <User size={14} />
                    <span>Step 1: Personal Details</span>
                  </div>
                  {/* Quick Direct Triggers */}
                  <div className="flex items-center gap-1">
                    {selectedToken.buyerPhone && (
                      <a
                        href={`tel:${selectedToken.buyerPhone}`}
                        title="Call Buyer"
                        className="p-1 rounded bg-[var(--bg-surface)] hover:text-emerald-600 border border-[var(--border)] transition-colors"
                      >
                        <Phone size={12} />
                      </a>
                    )}
                    {selectedToken.buyerPhone && (
                      <a
                        href={`https://wa.me/${selectedToken.buyerPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="WhatsApp Buyer"
                        className="p-1 rounded bg-[var(--bg-surface)] hover:text-emerald-600 border border-[var(--border)] transition-colors"
                      >
                        <MessageSquare size={12} />
                      </a>
                    )}
                    {selectedToken.buyerEmail && (
                      <a
                        href={`mailto:${selectedToken.buyerEmail}`}
                        title="Email Buyer"
                        className="p-1 rounded bg-[var(--bg-surface)] hover:text-brand border border-[var(--border)] transition-colors"
                      >
                        <Mail size={12} />
                      </a>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Full Name</span>
                    <span className="font-semibold text-[var(--text-primary)]">{selectedToken.buyerName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Mobile Number</span>
                    <span className="font-mono font-semibold text-[var(--text-primary)]">{selectedToken.buyerPhone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Email Address</span>
                    <span className="font-medium text-[var(--text-primary)] truncate block">{selectedToken.buyerEmail || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Current City</span>
                    <span className="font-medium text-[var(--text-primary)]">{selectedToken.currentCity || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              {/* Step 2: Family Details */}
              <div className="p-3 bg-[var(--bg-muted)]/50 rounded-lg border border-[var(--border)] space-y-2">
                <div className="flex items-center gap-1.5 text-brand font-bold text-[11px] uppercase tracking-wider">
                  <Users size={14} />
                  <span>Step 2: Family Details</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Family Size</span>
                    <span className="font-semibold text-[var(--text-primary)]">{selectedToken.familyDetails?.numberOfFamilyMembers || '1'} Members</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Adults</span>
                    <span className="font-semibold text-[var(--text-primary)]">{selectedToken.familyDetails?.adults || '1'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Children</span>
                    <span className="font-semibold text-[var(--text-primary)]">{selectedToken.familyDetails?.children || '0'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Marital Status</span>
                    <span className="font-semibold text-[var(--text-primary)]">{selectedToken.familyDetails?.maritalStatus || 'Single'}</span>
                  </div>
                </div>
              </div>

              {/* Step 3: Occupation Details */}
              <div className="p-3 bg-[var(--bg-muted)]/50 rounded-lg border border-[var(--border)] space-y-2">
                <div className="flex items-center gap-1.5 text-brand font-bold text-[11px] uppercase tracking-wider">
                  <Briefcase size={14} />
                  <span>Step 3: Occupation Details</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Profession</span>
                    <span className="font-semibold text-[var(--text-primary)]">{selectedToken.occupationDetails?.profession || 'Self Employed'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Organisation</span>
                    <span className="font-semibold text-[var(--text-primary)]">{selectedToken.occupationDetails?.companyName || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Monthly Income</span>
                    <span className="font-semibold text-emerald-600">{selectedToken.occupationDetails?.monthlyIncome || 'Confidential'}</span>
                  </div>
                </div>
              </div>

              {/* Step 4: Uploaded ID Proof */}
              <div className="p-3 bg-[var(--bg-muted)]/50 rounded-lg border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-brand font-bold text-[11px] uppercase tracking-wider">
                    <FileCheck size={14} />
                    <span>Step 4: Uploaded ID Proof</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    {selectedToken.idProof?.idProofType || 'Aadhaar Card'}
                  </span>
                </div>

                {selectedToken.idProof?.documentUrl ? (
                  <div className="flex items-center justify-between p-2 rounded bg-[var(--bg-surface)] border border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-brand" />
                      <span className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[200px]">
                        {selectedToken.idProof.documentOriginalName || 'KYC_Document.pdf'}
                      </span>
                    </div>
                    <a
                      href={`${API_BASE}${selectedToken.idProof.documentUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-brand text-white rounded text-[11px] font-semibold flex items-center gap-1 hover:bg-brand-dark"
                    >
                      <Download size={11} />
                      <span>View File</span>
                    </a>
                  </div>
                ) : (
                  <div className="text-[11px] text-[var(--text-muted)] italic">
                    ID Document on file: {selectedToken.idProof?.idProofType || 'Aadhaar'} verified via Digilocker/Portal.
                  </div>
                )}
              </div>

              {/* Step 5: Token Amount & Escrow Financial Breakdown */}
              <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <IndianRupee size={14} />
                    <span>Step 5: Token Amount & Escrow Audit</span>
                  </span>
                  <span className="text-xs font-bold text-emerald-600">
                    Deposit: ₹{(selectedToken.tokenAmount || 0).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Monthly Rent / Price Reference:</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {selectedToken.totalAgreedPrice || (selectedToken.monthlyRent ? `₹${selectedToken.monthlyRent.toLocaleString()}` : '₹0')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Escrow Ledger:</span>
                    <span className="font-mono text-[11px] text-[var(--text-primary)]">{selectedToken.escrowBank}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Transaction UTR Ref:</span>
                    <span className="font-mono text-[11px] text-brand font-semibold">{selectedToken.utrRef}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Payment Mode & Status:</span>
                    <span className="font-semibold capitalize text-emerald-600">{selectedToken.paymentMethod} • {selectedToken.paymentStatus}</span>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-emerald-500/20 text-[10px] text-emerald-800 dark:text-emerald-300 italic">
                  Note: {selectedToken.adjustmentNote || "Token amount will be adjusted in security deposit or first month's rent"}
                </div>
              </div>

              {/* Developer / Seller Details */}
              <div className="p-3 bg-[var(--bg-muted)]/50 rounded-lg border border-[var(--border)] space-y-1.5">
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Property Owner / Developer Desk</span>
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{selectedToken.sellerName}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{selectedToken.sellerRole} {selectedToken.sellerPhone ? `• ${selectedToken.sellerPhone}` : ''}</p>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">{selectedToken.propertyId}</span>
                </div>
              </div>

              {/* Audit Notes */}
              {selectedToken.notes && (
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Audit Log & Remarks</span>
                  <div className="p-2.5 bg-[var(--bg-muted)]/60 text-[var(--text-muted)] text-xs rounded-lg border border-[var(--border)] leading-relaxed">
                    {selectedToken.notes}
                  </div>
                </div>
              )}

            </div>

            {/* Drawer Actions */}
            <div className="p-3.5 border-t border-[var(--border)] flex items-center justify-between gap-2 bg-[var(--bg-surface)]">
              {selectedToken.status === 'Escrow Held' ? (
                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => setActionModal({ type: 'refund', token: selectedToken })}
                    className="flex-1 h-8 bg-[var(--bg-muted)] hover:bg-[var(--border)] text-[var(--text-primary)] rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw size={12} />
                    <span>Refund Buyer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionModal({ type: 'release', token: selectedToken })}
                    className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 shadow-xs hover:shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={12} />
                    <span>Release to Seller</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteModal(selectedToken)}
                    title="Delete Token Booking"
                    className="w-8 h-8 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20 flex items-center justify-center cursor-pointer active:scale-90 shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full text-xs text-[var(--text-muted)]">
                  <span>Escrow status: <strong className="text-[var(--text-primary)]">{selectedToken.status}</strong></span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDeleteModal(selectedToken)}
                      className="px-2.5 py-1 text-rose-600 hover:bg-rose-500/10 rounded-md text-xs font-medium cursor-pointer transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedToken(null)}
                      className="px-3 py-1 bg-[var(--bg-muted)] rounded-md text-xs font-medium cursor-pointer hover:bg-[var(--border)]"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default TokenBooking;
