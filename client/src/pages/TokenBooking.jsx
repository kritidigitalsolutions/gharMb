import React, { useState, useEffect } from 'react';
import AdminLoader from '../components/common/AdminLoader';
import CallContactModal from '../components/common/CallContactModal';
import API from '../api/api';
import {
  IndianRupee, ShieldCheck, Lock, RotateCcw, CheckCircle2,
  XCircle, Clock, Search, Filter, AlertCircle, Download,
  ExternalLink, Calendar, User, Building, ArrowUpRight,
  Sparkles, FileText, Check, ChevronRight, X, Eye, Edit2,
  UserCheck, Shield, CheckCircle, Settings, Plus, Trash2,
  Briefcase, Users, FileCheck, Layers, ArrowRight, RefreshCw,
  Phone, MessageSquare, Mail, AlertTriangle, Copy, PhoneCall,
  MoreHorizontal, ChevronDown
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const TokenBooking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tokens, setTokens] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingCount: 0,
    contactedCount: 0,
    acceptedCount: 0,
    rejectedCount: 0,
    cancelledCount: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedToken, setSelectedToken] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { type: 'accept' | 'reject', token }
  const [actionReason, setActionReason] = useState('');
  const [deleteModal, setDeleteModal] = useState(null); // token to delete
  const [callTarget, setCallTarget] = useState(null);
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
    adjustmentNote: "Token reservation request. Deal terms and token deposit are arranged directly between parties offline. No online payment is processed on the platform.",
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
    notes: '',
    maritalStatus: 'Single',
    numberOfFamilyMembers: '1',
    profession: 'Salaried Professional',
    companyName: '',
    monthlyIncome: '',
  });

  // Toast Notification
  const [toast, setToast] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.row-actions-dropdown')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const showToastMsg = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Fetch Real Tokens from Backend API
  const fetchTokens = async () => {
    setIsLoading(true);
    try {
      const res = await API.get('/admin/tokens');
      const data = res.data;

      if (data && data.status === 'success' && data.data) {
        setTokens(data.data.tokens || []);
        if (data.data.stats) {
          setStats({
            totalRequests: data.data.stats.totalRequests || data.data.tokens?.length || 0,
            pendingCount: data.data.stats.pendingCount || 0,
            contactedCount: data.data.stats.contactedCount || 0,
            acceptedCount: data.data.stats.acceptedCount || 0,
            rejectedCount: data.data.stats.rejectedCount || 0,
            cancelledCount: data.data.stats.cancelledCount || 0,
          });
        }
      } else {
        setTokens([]);
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
      const res = await API.get('/admin/tokens/settings');
      const data = res.data;

      if (data && data.status === 'success' && data.data?.settings) {
        const s = data.data.settings;
        setTokenConfig({
          tokenAmounts: s.tokenAmounts && s.tokenAmounts.length > 0 ? s.tokenAmounts : [2000, 5000],
          defaultTokenAmount: s.defaultTokenAmount || 2000,
          minTokenAmount: s.minTokenAmount || 1000,
          maxTokenAmount: s.maxTokenAmount || 100000,
          allowCustomAmount: s.allowCustomAmount || false,
          adjustmentNote: s.adjustmentNote || "Token reservation request. Deal terms and token deposit are arranged directly between parties offline. No online payment is processed on the platform.",
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
      const res = await API.get('/admin/properties', { params: { limit: 100 } });
      const data = res.data;
      if (data && data.data?.properties) {
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

  // Handle direct navigation & search params from notifications
  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q');
    const targetId = searchParams.get('id');

    if (q) {
      setSearchQuery(q);
      setStatusFilter('All');
    }

    if (tokens.length > 0) {
      if (targetId) {
        const found = tokens.find(t => t._id === targetId || t.id === targetId || t.tokenRequestId === targetId);
        if (found) {
          setSelectedToken(found);
          setStatusFilter('All');
        }
      } else if (q) {
        const lowerQ = q.toLowerCase();
        const found = tokens.find(t =>
          (t.clientDetails?.name && t.clientDetails.name.toLowerCase().includes(lowerQ)) ||
          (t.personalDetails?.fullName && t.personalDetails.fullName.toLowerCase().includes(lowerQ)) ||
          (t.propertyDetails?.title && t.propertyDetails.title.toLowerCase().includes(lowerQ)) ||
          (t.propertyId?.title && t.propertyId.title.toLowerCase().includes(lowerQ)) ||
          (t.tokenRequestId && t.tokenRequestId.toLowerCase().includes(lowerQ))
        );
        if (found) {
          setSelectedToken(found);
          setStatusFilter('All');
        }
      }
    }
  }, [searchParams, tokens]);

  // 4. Save Admin Token Amount Settings
  const handleSaveTokenConfig = async (e) => {
    e?.preventDefault();
    if (!tokenConfig.tokenAmounts || tokenConfig.tokenAmounts.length === 0) {
      showToastMsg('Please add at least one token amount option.', 'error');
      return;
    }

    setIsSavingConfig(true);
    try {
      const res = await API.patch('/admin/tokens/settings', tokenConfig);
      const data = res.data;
      if (data && data.status === 'success') {
        showToastMsg(`Token amounts updated: ${tokenConfig.tokenAmounts.map(a => `₹${a.toLocaleString()}`).join(', ')}`);
        setShowConfigModal(false);
      } else {
        showToastMsg(data?.message || 'Failed to save token settings', 'error');
      }
    } catch (err) {
      showToastMsg(err.response?.data?.message || 'Network error while saving token settings', 'error');
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

  // 5. Handle Action Confirm (Accept / Reject)
  const handleActionConfirm = async () => {
    if (!actionModal) return;
    const { type, token } = actionModal;
    setIsSubmitting(true);

    try {
      const idToUpdate = token.mongoId || token.id;
      const targetStatus = type === 'contact' ? 'contacted' : type === 'accept' ? 'accepted' : type === 'reject' ? 'rejected' : 'cancelled';
      const res = await API.patch(`/admin/tokens/${idToUpdate}/status`, {
        status: targetStatus,
        action: type,
        notes: actionReason.trim() || undefined,
      });

      const data = res.data;

      if (data && data.status === 'success') {
        const newStatus = targetStatus;
        showToastMsg(`Token request ${token.id} updated to "${newStatus}".`);
        setActionModal(null);
        setActionReason('');
        fetchTokens();

        if (selectedToken && (selectedToken.id === token.id || selectedToken.mongoId === token.mongoId)) {
          setSelectedToken(prev => ({
            ...prev,
            status: newStatus,
            outOfAppStatus: newStatus === 'accepted' ? 'token_received' : newStatus === 'contacted' ? 'contacted' : newStatus,
            contactNotes: actionReason.trim() || prev.contactNotes,
            notes: `${prev.notes || ''} | ${actionReason || `Status updated to ${newStatus}`}`.trim(),
          }));
        }
      } else {
        showToastMsg(data?.message || 'Failed to update token request status.', 'error');
      }
    } catch (err) {
      showToastMsg(err.response?.data?.message || 'Network error while updating token status.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Delete Token Booking
  const handleDeleteConfirm = async () => {
    if (!deleteModal) return;
    setIsSubmitting(true);
    try {
      const idToDelete = deleteModal.mongoId || deleteModal.id;
      const res = await API.delete(`/admin/tokens/${idToDelete}`);
      const data = res.data;
      if (data && data.status === 'success') {
        showToastMsg(`Token booking ${deleteModal.id} permanently deleted.`);
        setTokens(prev => prev.filter(t => t.id !== deleteModal.id && t.mongoId !== deleteModal.mongoId));
        if (selectedToken && (selectedToken.id === deleteModal.id || selectedToken.mongoId === deleteModal.mongoId)) {
          setSelectedToken(null);
        }
        setDeleteModal(null);
        fetchTokens();
      } else {
        showToastMsg(data?.message || 'Failed to delete token record.', 'error');
      }
    } catch (err) {
      showToastMsg(err.response?.data?.message || 'Network error while deleting token.', 'error');
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
      const payload = {
        buyerName: createForm.buyerName.trim(),
        buyerPhone: createForm.buyerPhone.trim(),
        buyerEmail: createForm.buyerEmail.trim(),
        currentCity: createForm.currentCity.trim(),
        propertyId: createForm.propertyId || undefined,
        tokenAmount: Number(createForm.tokenAmount) || 2000,
        monthlyRent: Number(createForm.monthlyRent) || undefined,
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

      const res = await API.post('/admin/tokens', payload);
      const data = res.data;
      if (data && data.status === 'success') {
        showToastMsg('Token booking request created successfully in database!');
        setShowCreateModal(false);
        setCreateForm({
          buyerName: '',
          buyerPhone: '',
          buyerEmail: '',
          currentCity: '',
          propertyId: '',
          tokenAmount: tokenConfig.defaultTokenAmount || 2000,
          monthlyRent: '',
          notes: '',
          maritalStatus: 'Single',
          numberOfFamilyMembers: '1',
          profession: 'Salaried Professional',
          companyName: '',
          monthlyIncome: '',
        });
        fetchTokens();
      } else {
        showToastMsg(data?.message || 'Failed to create token booking request.', 'error');
      }
    } catch (err) {
      showToastMsg(err.response?.data?.message || 'Network error creating token booking.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter & Search
  const filteredTokens = tokens.filter(t => {
    const s = (t.status || '').toLowerCase();
    const sf = statusFilter.toLowerCase();
    let matchesStatus = true;
    if (sf === 'pending' || sf === 'pending contact') {
      matchesStatus = s === 'pending' || s === 'escrow held';
    } else if (sf === 'contacted' || sf === 'in discussion') {
      matchesStatus = s === 'contacted';
    } else if (sf === 'accepted' || sf === 'token received') {
      matchesStatus = s === 'accepted' || s === 'released' || s === 'approved';
    } else if (sf === 'declined' || sf === 'rejected') {
      matchesStatus = s === 'rejected' || s === 'declined';
    } else if (sf === 'cancelled') {
      matchesStatus = s === 'cancelled' || s === 'refunded';
    } else if (sf !== 'all') {
      matchesStatus = s === sf;
    }

    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesStatus;

    const matchesSearch =
      (t.id || '').toLowerCase().includes(query) ||
      (t.buyerName || '').toLowerCase().includes(query) ||
      (t.propertyTitle || '').toLowerCase().includes(query) ||
      (t.sellerName || '').toLowerCase().includes(query) ||
      (t.buyerPhone || '').toLowerCase().includes(query) ||
      (t.buyerEmail || '').toLowerCase().includes(query) ||
      (t.contactNotes || '').toLowerCase().includes(query) ||
      (t.notes || '').toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'accepted' || s === 'released' || s === 'approved' || s === 'token_received') {
      return {
        label: 'Token Received',
        pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/40',
        dot: 'bg-emerald-500'
      };
    }
    if (s === 'contacted' || s === 'in_discussion') {
      return {
        label: 'In Discussion',
        pill: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/40',
        dot: 'bg-blue-500'
      };
    }
    if (s === 'rejected' || s === 'declined') {
      return {
        label: 'Declined',
        pill: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/40',
        dot: 'bg-rose-500'
      };
    }
    if (s === 'cancelled' || s === 'refunded') {
      return {
        label: 'Cancelled',
        pill: 'bg-slate-100 text-slate-700 dark:bg-slate-800/70 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400'
      };
    }
    return {
      label: 'Pending Contact',
      pill: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/40',
      dot: 'bg-amber-500'
    };
  };

  const pendingCount = tokens.filter(t => {
    const s = (t.status || '').toLowerCase();
    return s === 'pending' || s === 'escrow held';
  }).length;

  const contactedCount = tokens.filter(t => {
    const s = (t.status || '').toLowerCase();
    return s === 'contacted';
  }).length;

  const acceptedCount = tokens.filter(t => {
    const s = (t.status || '').toLowerCase();
    return s === 'accepted' || s === 'released' || s === 'approved';
  }).length;

  const declinedCount = tokens.filter(t => {
    const s = (t.status || '').toLowerCase();
    return s === 'rejected' || s === 'declined';
  }).length;

  const cancelledCount = tokens.filter(t => {
    const s = (t.status || '').toLowerCase();
    return s === 'cancelled' || s === 'refunded';
  }).length;

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
      <div className="p-4 sm:p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        {/* Left Side: Title & Info */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0 border border-brand/20 shadow-2xs">
            <Layers size={18} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                Rental Token Requests
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Direct Offline Settlement</span>
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate max-w-xl">
              Manage prospective tenant token reservations, contact users directly, and record offline settlements.
            </p>
          </div>
        </div>

        {/* Right Side: Clean Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchTokens}
            disabled={isLoading}
            title="Refresh Token Bookings"
            className="w-8.5 h-8.5 rounded-lg bg-[var(--bg-muted)] hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-brand flex items-center justify-center border border-[var(--border)] transition-all cursor-pointer active:scale-95 disabled:opacity-50 shadow-2xs"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-brand' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="h-8.5 px-3 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] text-xs font-semibold flex items-center gap-1.5 border border-[var(--border)] transition-all cursor-pointer active:scale-95 shadow-2xs"
          >
            <Settings size={13} className="text-[var(--text-muted)]" />
            <span>Configure Amounts</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="h-8.5 px-3.5 rounded-lg bg-brand hover:bg-brand-dark text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-brand/25 transition-all cursor-pointer active:scale-95"
          >
            <Plus size={14} />
            <span>Record Token Booking</span>
          </button>
        </div>
      </div>

      {/* ─── 4 POLISHED KPI CARDS (STANDARDIZED TOP-ACCENT KPI STYLE) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            key: 'total',
            title: 'Total Requests',
            subtitle: 'All recorded inquiries',
            icon: Layers,
            count: tokens.length,
            tag: 'All Time',
            tagClass: 'text-brand bg-brand/10',
            accent: 'border-brand/40 hover:border-brand',
            iconColor: 'text-brand bg-brand/10'
          },
          {
            key: 'pending',
            title: 'Pending Contact',
            subtitle: 'Awaiting admin outreach',
            icon: Clock,
            count: pendingCount,
            tag: pendingCount > 0 ? 'Needs Attention' : 'All Clear',
            tagClass: 'text-brand bg-brand/10',
            accent: 'border-brand/40 hover:border-brand',
            iconColor: 'text-brand bg-brand/10'
          },
          {
            key: 'contacted',
            title: 'In Discussion',
            subtitle: 'Contacted out of app',
            icon: PhoneCall,
            count: contactedCount,
            tag: 'In Touch',
            tagClass: 'text-brand bg-brand/10',
            accent: 'border-brand/40 hover:border-brand',
            iconColor: 'text-brand bg-brand/10'
          },
          {
            key: 'accepted',
            title: 'Token Received',
            subtitle: 'Offline deposit confirmed',
            icon: CheckCircle2,
            count: acceptedCount,
            tag: 'Completed',
            tagClass: 'text-brand bg-brand/10',
            accent: 'border-brand/40 hover:border-brand',
            iconColor: 'text-brand bg-brand/10'
          }
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className={`group bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3.5 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden flex flex-col justify-between border-t-2 ${card.accent}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
                    {card.title}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                      {card.count}
                    </span>
                  </div>
                </div>

                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${card.iconColor}`}>
                  <Icon size={16} strokeWidth={2} />
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)] truncate">{card.subtitle}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${card.tagClass}`}>
                  {card.tag}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── MAIN MASTER CONTAINER: TOOLBAR + 100% REAL DATA TABLE ─── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xs transition-all duration-200">

        {/* Clean Filter & Search Toolbar */}
        <div className="p-3 border-b border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--bg-surface)] rounded-t-xl">

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-[var(--bg-muted)]/70 rounded-lg border border-[var(--border)] max-w-full">
            {[
              { id: 'All', label: 'All Requests', count: tokens.length },
              { id: 'Pending', label: 'Pending Contact', count: pendingCount },
              { id: 'Contacted', label: 'In Discussion', count: contactedCount },
              { id: 'Accepted', label: 'Token Received', count: acceptedCount },
              { id: 'Declined', label: 'Declined', count: declinedCount },
            ].map((tab) => {
              const active = statusFilter.toLowerCase() === tab.id.toLowerCase();
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95 ${
                    active
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] font-semibold shadow-xs border border-[var(--border)]/70'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold transition-colors ${
                    active ? 'bg-brand/10 text-brand' : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
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
              placeholder="Search token ID, tenant, property..."
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

        {/* ─── DATA TABLE: CLEAN & MINIMAL WITH RESPONSIVE LAYOUT ─── */}
        <div className="w-full overflow-x-auto min-h-[260px]">
          <table className="w-full text-left border-collapse table-auto min-w-[760px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-muted)]/40">
                <th className="py-3 px-3.5 align-middle whitespace-nowrap w-[130px]">Token ID</th>
                <th className="py-3 px-3.5 align-middle min-w-[170px]">Property</th>
                <th className="py-3 px-3.5 align-middle min-w-[190px]">Tenant Details</th>
                <th className="py-3 px-3.5 align-middle whitespace-nowrap min-w-[130px]">Proposed Token</th>
                <th className="py-3 px-3.5 align-middle whitespace-nowrap min-w-[110px]">Agreed Rent</th>
                <th className="py-3 px-3.5 align-middle text-center whitespace-nowrap min-w-[130px]">Status</th>
                <th className="py-3 px-3.5 align-middle text-right whitespace-nowrap min-w-[100px] sticky right-0 bg-[var(--bg-surface)] shadow-[-4px_0_8px_rgba(0,0,0,0.03)]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <AdminLoader
                      text="Fetching token bookings..."
                      subtext="Loading reservations and customer details"
                      minHeight="min-h-[180px]"
                    />
                  </td>
                </tr>
              ) : filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col items-center justify-center space-y-2 animate-in fade-in duration-200">
                      <div className="w-10 h-10 rounded-full bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)] border border-[var(--border)]">
                        <FileCheck size={18} />
                      </div>
                      <p className="font-semibold text-sm text-[var(--text-primary)]">
                        {tokens.length === 0 ? 'No Token Booking Requests Recorded' : 'No matching token records found'}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] max-w-sm">
                        {tokens.length === 0
                          ? 'Token reservation requests submitted by buyers through the mobile app or web portal will show up here in real time.'
                          : 'Try changing your search query or switching the status filter.'}
                      </p>
                      {tokens.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => setShowCreateModal(true)}
                          className="mt-2 px-3.5 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer hover:bg-brand-dark"
                        >
                          <Plus size={13} />
                          <span>Record First Token Request</span>
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
                  const isMenuOpen = openMenuId === (t.id || t.mongoId);

                  return (
                    <tr
                      key={t.id || t.mongoId}
                      onClick={() => setSelectedToken(t)}
                      className="group hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors duration-150 cursor-pointer"
                    >
                      {/* 1. Token ID & Date */}
                      <td className="py-3.5 px-3.5 align-middle whitespace-nowrap">
                        <div className="leading-tight">
                          <span className="font-mono text-xs font-semibold text-[var(--text-primary)] group-hover:text-brand transition-colors block">
                            {t.id}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                            {t.bookingDate}
                          </span>
                        </div>
                      </td>

                      {/* 2. Linked Property */}
                      <td className="py-3.5 px-3.5 align-middle">
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--text-primary)] group-hover:text-brand transition-colors truncate max-w-[180px]" title={t.propertyTitle}>
                            {t.propertyTitle}
                          </p>
                          <span className="font-mono text-[10px] text-[var(--text-muted)] mt-0.5 block truncate max-w-[180px]">
                            {t.propertyCity ? `${t.propertyCity} • ` : ''}{t.propertyId || 'Direct'}
                          </span>
                        </div>
                      </td>

                      {/* 3. Tenant Details (KYC tag, Contact) */}
                      <td className="py-3.5 px-3.5 align-middle">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-[var(--text-primary)] truncate max-w-[140px]">
                              {t.buyerName}
                            </span>
                            {t.idProof?.documentUrl && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                                KYC
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] mt-0.5">
                            <span className="font-mono">{t.buyerPhone}</span>
                            {t.currentCity && <span className="truncate max-w-[90px]">({t.currentCity})</span>}
                          </div>
                        </div>
                      </td>

                      {/* 4. Proposed Token */}
                      <td className="py-3.5 px-3.5 align-middle whitespace-nowrap">
                        <div className="leading-tight">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                            {t.tokenAmount && t.tokenAmount > 0 ? `₹${t.tokenAmount.toLocaleString()}` : '₹0 Token'}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5 block">
                            Direct Offline
                          </span>
                        </div>
                      </td>

                      {/* 5. Agreed Rent */}
                      <td className="py-3.5 px-3.5 align-middle whitespace-nowrap">
                        <div className="leading-tight">
                          <span className="font-semibold text-[var(--text-primary)] block">
                            {t.totalAgreedPrice || (t.monthlyRent ? `₹${t.monthlyRent.toLocaleString()}/mo` : '—')}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                            Agreed Price
                          </span>
                        </div>
                      </td>

                      {/* 6. Booking Status */}
                      <td className="py-3.5 px-3.5 align-middle text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-2xs ${statusCfg.pill}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`}></span>
                          <span>{statusCfg.label}</span>
                        </span>
                      </td>

                      {/* 7. Actions (Quick WA, Quick Call, More Actions Dropdown) */}
                      <td className="py-3.5 px-3.5 align-middle text-right whitespace-nowrap sticky right-0 bg-[var(--bg-surface)] shadow-[-4px_0_8px_rgba(0,0,0,0.03)] group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-flex items-center justify-end gap-1.5 row-actions-dropdown">
                          {t.buyerPhone && (
                            <a
                              href={`https://wa.me/${(t.buyerPhone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${t.buyerName}, regarding your token amount request on GharMB for "${t.propertyTitle}", I am contacting you to coordinate the booking details.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="WhatsApp Tenant"
                              className="w-7.5 h-7.5 rounded-lg flex items-center justify-center text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition-all active:scale-95 shrink-0"
                            >
                              <MessageSquare size={13} />
                            </a>
                          )}

                          {t.buyerPhone && (
                            <button
                              type="button"
                              onClick={() => setCallTarget(t)}
                              title={`Call Tenant (${t.buyerPhone})`}
                              className="w-7.5 h-7.5 rounded-lg flex items-center justify-center text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 transition-all active:scale-95 shrink-0 cursor-pointer"
                            >
                              <Phone size={13} />
                            </button>
                          )}

                          {/* More Options Button */}
                          <button
                            type="button"
                            onClick={() => setOpenMenuId(isMenuOpen ? null : (t.id || t.mongoId))}
                            title="More Actions"
                            className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center border transition-all cursor-pointer active:scale-95 shrink-0 ${
                              isMenuOpen
                                ? 'bg-brand text-white border-brand shadow-xs'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] border-[var(--border)]'
                            }`}
                          >
                            <MoreHorizontal size={14} />
                          </button>

                          {/* Sleek Action Popover Menu */}
                          {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-1.5 w-52 py-1.5 bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl border border-[var(--border)] shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedToken(t);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-[var(--bg-muted)] transition-colors cursor-pointer text-left"
                              >
                                <Eye size={13} className="text-slate-400" />
                                <span>View Full Details</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const summary = `Token ID: ${t.id}\nTenant: ${t.buyerName}\nPhone: ${t.buyerPhone}\nEmail: ${t.buyerEmail || 'N/A'}\nProperty: ${t.propertyTitle}\nRent: ${t.totalAgreedPrice || t.monthlyRent}\nToken: ₹${(t.tokenAmount || 0).toLocaleString()}`;
                                  navigator.clipboard.writeText(summary);
                                  showToastMsg(`Copied ${t.buyerName}'s details!`, 'info');
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-[var(--bg-muted)] transition-colors cursor-pointer text-left"
                              >
                                <Copy size={13} className="text-slate-400" />
                                <span>Copy Booking Details</span>
                              </button>

                              <div className="my-1 border-t border-[var(--border)]" />

                              {(t.status === 'pending' || t.status === 'Pending' || t.status === 'Escrow Held') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionModal({ type: 'contact', token: t });
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-xs flex items-center gap-2 text-sky-600 hover:bg-sky-500/10 transition-colors cursor-pointer text-left font-medium"
                                >
                                  <PhoneCall size={13} />
                                  <span>Log Discussion (In Progress)</span>
                                </button>
                              )}

                              {(t.status === 'pending' || t.status === 'contacted' || t.status === 'Pending') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionModal({ type: 'accept', token: t });
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-xs flex items-center gap-2 text-emerald-600 hover:bg-emerald-500/10 transition-colors cursor-pointer text-left font-medium"
                                >
                                  <CheckCircle2 size={13} />
                                  <span>Confirm Token Received</span>
                                </button>
                              )}

                              {(t.status === 'pending' || t.status === 'contacted') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionModal({ type: 'reject', token: t });
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-xs flex items-center gap-2 text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer text-left font-medium"
                                >
                                  <XCircle size={13} />
                                  <span>Decline Request</span>
                                </button>
                              )}

                              <div className="my-1 border-t border-[var(--border)]" />

                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteModal(t);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-xs flex items-center gap-2 text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
                              >
                                <Trash2 size={13} />
                                <span>Delete Record</span>
                              </button>
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

        {/* Clean Aligned Footer */}
        <div className="p-3 px-4 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[var(--text-muted)] bg-[var(--bg-surface)] rounded-b-xl">
          <span>Showing <strong className="text-[var(--text-primary)] font-semibold">{filteredTokens.length}</strong> of {tokens.length} token booking requests</span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Direct Buyer-Seller Token Reservations (No Platform Payments)</span>
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
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Direct Reservation Entry</span>
                <h3 className="text-sm font-bold text-[var(--text-primary)] mt-0.5 flex items-center gap-1.5">
                  <Plus size={16} className="text-emerald-600" />
                  <span>Record Token Booking Request</span>
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
              {/* Property Selection - Rental Properties Only */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[var(--text-muted)]">
                    Linked Rental Property
                  </label>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                    Rental Listings Only
                  </span>
                </div>
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
                  {propertiesList
                    .filter(p => p.listingFor === 'Rent' || p.listingFor === 'Lease' || p.listingFor === 'PG')
                    .map(p => (
                      <option key={p._id} value={p._id}>
                        {p.title} ({p.city || 'City'}) • ₹{p.price ? p.price.toLocaleString() : 'N/A'}/mo [{p.submissionId || p._id.slice(-6)}]
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

              {/* Direct Reservation Info */}
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
                <span className="font-semibold block mb-0.5">Direct Property Reservation:</span>
                GharMB does not process or hold online payments. The token amount is settled directly between the buyer and property owner/builder offline.
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
                  {isSubmitting ? 'Saving...' : 'Record Token Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: OUT-OF-APP ACTION (CONTACT / ACCEPT / DECLINE) ─── */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl max-w-sm w-full shadow-2xl border border-[var(--border)] p-5 space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <div>
                <span className="text-[9px] font-bold text-brand uppercase tracking-wider">
                  {actionModal.type === 'contact' ? 'Out-of-App Followup' : 'Booking Decision'}
                </span>
                <h3 className="text-xs font-bold text-[var(--text-primary)] mt-0.5">
                  {actionModal.type === 'contact'
                    ? 'Log User Discussion (In Progress)'
                    : actionModal.type === 'accept'
                    ? 'Confirm Token Received Offline'
                    : 'Decline Token Request'}
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
                <span className="text-[var(--text-muted)]">Tenant / Buyer:</span>
                <span className="font-semibold truncate max-w-[170px] text-right">
                  {actionModal.token.buyerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Phone:</span>
                <span className="font-mono font-semibold text-brand">
                  {actionModal.token.buyerPhone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Proposed Token:</span>
                <span className="font-bold text-emerald-600">₹{(actionModal.token.tokenAmount || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[var(--text-muted)]">
                {actionModal.type === 'contact'
                  ? 'Discussion Notes (Call / WhatsApp summary)'
                  : actionModal.type === 'accept'
                  ? 'Offline Settlement Notes (UPI/Cash/Receipt ref)'
                  : 'Reason for Declining'}
              </label>
              <textarea
                rows={3}
                placeholder={
                  actionModal.type === 'contact'
                    ? 'e.g. Spoke with tenant on phone. Scheduled visit for tomorrow...'
                    : actionModal.type === 'accept'
                    ? 'e.g. Received ₹2,000 token offline via UPI. Rental agreement drafted...'
                    : 'e.g. Tenant cancelled or property already rented...'
                }
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
                  actionModal.type === 'contact'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : actionModal.type === 'accept'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isSubmitting
                  ? 'Saving...'
                  : actionModal.type === 'contact'
                  ? 'Confirm In Discussion'
                  : actionModal.type === 'accept'
                  ? 'Confirm Token Received'
                  : 'Confirm Decline'}
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

      {/* ─── DRAWER: FULL 5-STEP AUDIT & RESERVATION DETAILS (REAL DATA) ─── */}
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

            {/* Drawer Scrollable Body: Out-of-App Contact & Rental Details */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar text-xs">

              {/* Out-of-App Action Hub */}
              <div className="p-3.5 bg-gradient-to-br from-blue-500/10 via-emerald-500/10 to-transparent rounded-xl border border-blue-500/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                      Out-of-App Contact Hub
                    </span>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Directly reach prospective tenant outside the app
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 border border-blue-500/30">
                    Direct Contact
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {selectedToken.buyerPhone ? (
                    <button
                      type="button"
                      onClick={() => setCallTarget(selectedToken)}
                      className="py-2 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                    >
                      <Phone size={13} />
                      <span>Call Now</span>
                    </button>
                  ) : null}

                  {selectedToken.buyerPhone ? (
                    <a
                      href={`https://wa.me/${(selectedToken.buyerPhone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${selectedToken.buyerName}, regarding your token amount request on GharMB for "${selectedToken.propertyTitle}", I am contacting you from the GharMB Admin team to finalize your booking details.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95"
                    >
                      <MessageSquare size={13} />
                      <span>WhatsApp</span>
                    </a>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => {
                      const summary = `Token ID: ${selectedToken.id}\nTenant: ${selectedToken.buyerName}\nPhone: ${selectedToken.buyerPhone}\nEmail: ${selectedToken.buyerEmail || 'N/A'}\nProperty: ${selectedToken.propertyTitle}\nRent: ${selectedToken.totalAgreedPrice || selectedToken.monthlyRent}\nToken: ₹${(selectedToken.tokenAmount || 0).toLocaleString()}`;
                      navigator.clipboard.writeText(summary);
                      showToastMsg(`Copied tenant details to clipboard!`, 'info');
                    }}
                    className="py-2 px-2.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] rounded-lg text-xs font-semibold border border-[var(--border)] flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Copy size={13} />
                    <span>Copy Info</span>
                  </button>
                </div>
              </div>

              {/* Step 1: Personal Details */}
              <div className="p-3 bg-[var(--bg-muted)]/50 rounded-lg border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-brand font-bold text-[11px] uppercase tracking-wider">
                    <User size={14} />
                    <span>Tenant Contact Details</span>
                  </div>
                  {/* Quick Direct Triggers */}
                  <div className="flex items-center gap-1">
                    {selectedToken.buyerPhone && (
                      <button
                        type="button"
                        onClick={() => setCallTarget(selectedToken)}
                        title="Call Buyer"
                        className="p-1 rounded bg-[var(--bg-surface)] hover:text-emerald-600 border border-[var(--border)] transition-colors cursor-pointer"
                      >
                        <Phone size={12} />
                      </button>
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

              {/* Step 5: Proposed Token & Deal Terms */}
              <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <IndianRupee size={14} />
                    <span>Step 5: Proposed Token & Deal Terms</span>
                  </span>
                  <span className="text-xs font-bold text-emerald-600">
                    Proposed: ₹{(selectedToken.tokenAmount || 0).toLocaleString()}
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
                    <span className="text-[var(--text-muted)]">Settlement Type:</span>
                    <span className="font-medium text-emerald-600">Direct Offline Arrangement</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Platform Payment:</span>
                    <span className="font-medium text-[var(--text-muted)]">None (Direct buyer-seller terms)</span>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-emerald-500/20 text-[10px] text-emerald-800 dark:text-emerald-300 italic">
                  Note: {selectedToken.adjustmentNote || "Token reservation request. Deal terms and deposit arranged directly between parties offline."}
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
              {(selectedToken.status === 'pending' || selectedToken.status === 'Pending' || selectedToken.status === 'contacted') ? (
                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => setActionModal({ type: 'contact', token: selectedToken })}
                    className="flex-1 h-8 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <PhoneCall size={13} />
                    <span>Log Discussion</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionModal({ type: 'accept', token: selectedToken })}
                    className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 shadow-xs hover:shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={13} />
                    <span>Token Received</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionModal({ type: 'reject', token: selectedToken })}
                    className="h-8 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 flex items-center justify-center"
                    title="Decline Request"
                  >
                    <XCircle size={13} />
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
                  <span>Status: <strong className="text-[var(--text-primary)]">{selectedToken.status}</strong></span>
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

      {/* ─── MODAL: CALL & CONTACT CLIENT (CUSTOM UI) ─── */}
      {callTarget && (
        <CallContactModal
          isOpen={Boolean(callTarget)}
          onClose={() => setCallTarget(null)}
          contact={{
            clientName: callTarget.buyerName,
            clientPhone: callTarget.buyerPhone,
            clientEmail: callTarget.buyerEmail,
            title: callTarget.propertyTitle,
            code: callTarget.id || callTarget._id,
            category: 'Token Booking Request',
            status: callTarget.status
          }}
        />
      )}
    </div>
  );
};

export default TokenBooking;
