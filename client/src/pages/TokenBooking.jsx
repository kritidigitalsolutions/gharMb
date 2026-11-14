import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminLoader from '../components/common/AdminLoader';
import CallContactModal from '../components/common/CallContactModal';
import API, { getMediaUrl } from '../api/api';
import Badge from '../components/ui/Badge';
import {
  IndianRupee,
  ShieldCheck,
  Lock,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  AlertCircle,
  Download,
  ExternalLink,
  Calendar,
  User,
  Building,
  ArrowUpRight,
  Sparkles,
  FileText,
  Check,
  ChevronRight,
  X,
  Eye,
  Edit2,
  UserCheck,
  Shield,
  CheckCircle,
  Settings,
  Plus,
  Trash2,
  Briefcase,
  Users,
  FileCheck,
  Layers,
  ArrowRight,
  RefreshCw,
  Phone,
  MessageSquare,
  Mail,
  AlertTriangle,
  Copy,
  PhoneCall,
  MoreHorizontal,
  ChevronDown,
  List,
  LayoutGrid,
  Coins,
  MapPin,
  ShieldAlert
} from 'lucide-react';

export default function TokenBooking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ── 01. Data States ───────────────────────────────────────────────────────
  const [tokens, setTokens] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingCount: 0,
    contactedCount: 0,
    acceptedCount: 0,
    rejectedCount: 0,
    cancelledCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Just now');
  const lastSyncTimestampRef = useRef(Date.now());

  // ── 02. Filter & View States ──────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Pending' | 'Contacted' | 'Accepted' | 'Declined'
  const [secondaryFilter, setSecondaryFilter] = useState('ALL'); // 'ALL' | 'KYC_VERIFIED' | 'HIGH_VALUE'
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('token_bookings_view') || 'table';
    } catch {
      return 'table';
    }
  });

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('token_bookings_view', mode);
    } catch {
      // ignore
    }
  };

  // ── 03. Sliding Switch Indicator States ────────────────────────────────────
  const statusTabRefs = useRef({});
  const [statusIndicatorStyle, setStatusIndicatorStyle] = useState({ left: 4, width: 0, opacity: 0 });

  const viewModeRefs = useRef({});
  const [viewModeIndicatorStyle, setViewModeIndicatorStyle] = useState({ left: 4, width: 0, opacity: 0 });

  // ── 04. Drawer & Selection States ─────────────────────────────────────────
  const [selectedToken, setSelectedToken] = useState(null);
  const [drawerTab, setDrawerTab] = useState('overview'); // 'overview' | 'kyc' | 'terms'
  const [openMenuId, setOpenMenuId] = useState(null);

  // ── 05. Modals ────────────────────────────────────────────────────────────
  const [actionModal, setActionModal] = useState(null); // { type: 'contact' | 'accept' | 'reject', token }
  const [actionReason, setActionReason] = useState('');
  const [deleteModal, setDeleteModal] = useState(null); // token to delete
  const [callTarget, setCallTarget] = useState(null);

  // Property list for linking bookings
  const [propertiesList, setPropertiesList] = useState([]);

  // Token Amount Configuration Modal
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

  // Record New Token Booking Modal
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

  // Toast Feedback
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToastMsg = (msg, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ msg, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3500);
  };

  const copyToClipboard = (text, label = 'Text') => {
    if (!text || text === 'N/A') return;
    navigator.clipboard?.writeText(text);
    showToastMsg(`${label} copied to clipboard!`, 'info');
  };

  // Close row menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.row-actions-dropdown')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // ── 06. Data Fetching ─────────────────────────────────────────────────────
  const fetchTokens = useCallback(async () => {
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
  }, []);

  const fetchTokenSettings = useCallback(async () => {
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
  }, []);

  const fetchProperties = useCallback(async () => {
    try {
      const res = await API.get('/admin/properties', { params: { limit: 100 } });
      const data = res.data;
      if (data && data.data?.properties) {
        setPropertiesList(data.data.properties);
      }
    } catch (err) {
      console.warn('Could not fetch properties list:', err.message);
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchTokens(), fetchTokenSettings(), fetchProperties()]);
    lastSyncTimestampRef.current = Date.now();
    setLastSyncTime('Just now');
    setIsRefreshing(false);
    showToastMsg('Token reservations synchronized!', 'info');
  }, [fetchTokens, fetchTokenSettings, fetchProperties]);

  useEffect(() => {
    fetchTokens();
    fetchTokenSettings();
    fetchProperties();

    const interval = setInterval(() => {
      const diffSecs = Math.floor((Date.now() - lastSyncTimestampRef.current) / 1000);
      if (diffSecs < 60) setLastSyncTime('Just now');
      else setLastSyncTime(`${Math.floor(diffSecs / 60)}m ago`);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchTokens, fetchTokenSettings, fetchProperties]);

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

  // ── 07. Counts & Computed Categories ──────────────────────────────────────
  const pendingCount = useMemo(() => tokens.filter(t => {
    const s = (t.status || '').toLowerCase();
    return s === 'pending' || s === 'escrow held';
  }).length, [tokens]);

  const contactedCount = useMemo(() => tokens.filter(t => {
    const s = (t.status || '').toLowerCase();
    return s === 'contacted';
  }).length, [tokens]);

  const acceptedCount = useMemo(() => tokens.filter(t => {
    const s = (t.status || '').toLowerCase();
    return s === 'accepted' || s === 'released' || s === 'approved';
  }).length, [tokens]);

  const declinedCount = useMemo(() => tokens.filter(t => {
    const s = (t.status || '').toLowerCase();
    return s === 'rejected' || s === 'declined';
  }).length, [tokens]);

  // ── 08. Sliding Status Tabs (BADGES_UI_DESIGN_SYSTEM.md Tokens) ────────────
  const statusTabs = useMemo(() => [
    {
      key: 'All',
      label: 'All Requests',
      count: tokens.length,
      icon: Layers,
      activeBg: 'bg-[#ffc5bb] dark:bg-[#4f160e]',
      activeText: 'text-[#992211] dark:text-[#ff9b8a]',
      activeCountBg: 'bg-[#992211]/15 text-[#992211] dark:bg-[#ff9b8a]/25 dark:text-[#ff9b8a]'
    },
    {
      key: 'Pending',
      label: 'Pending Contact',
      count: pendingCount,
      icon: Clock,
      activeBg: 'bg-[#fef08a] dark:bg-[#4d3209]',
      activeText: 'text-[#78350f] dark:text-[#fef08a]',
      activeCountBg: 'bg-[#78350f]/15 text-[#78350f] dark:bg-[#fef08a]/25 dark:text-[#fef08a]'
    },
    {
      key: 'Contacted',
      label: 'In Discussion',
      count: contactedCount,
      icon: PhoneCall,
      activeBg: 'bg-[#bae6fd] dark:bg-[#113c54]',
      activeText: 'text-[#075985] dark:text-[#7dd3fc]',
      activeCountBg: 'bg-[#075985]/15 text-[#075985] dark:bg-[#7dd3fc]/25 dark:text-[#7dd3fc]'
    },
    {
      key: 'Accepted',
      label: 'Token Received',
      count: acceptedCount,
      icon: CheckCircle2,
      activeBg: 'bg-[#52c99b] dark:bg-[#1a4a38]',
      activeText: 'text-[#064e3b] dark:text-[#6ee7b7]',
      activeCountBg: 'bg-[#064e3b]/15 text-[#064e3b] dark:bg-[#6ee7b7]/25 dark:text-[#6ee7b7]'
    },
    {
      key: 'Declined',
      label: 'Declined',
      count: declinedCount,
      icon: XCircle,
      activeBg: 'bg-[#fca5a5] dark:bg-[#521722]',
      activeText: 'text-[#701a2b] dark:text-[#fda4af]',
      activeCountBg: 'bg-[#701a2b]/15 text-[#701a2b] dark:bg-[#fda4af]/25 dark:text-[#fda4af]'
    }
  ], [tokens.length, pendingCount, contactedCount, acceptedCount, declinedCount]);

  const activeStatusTab = useMemo(() => {
    return statusTabs.find(t => t.key.toLowerCase() === statusFilter.toLowerCase()) || statusTabs[0];
  }, [statusTabs, statusFilter]);

  // Geometries for sliding switch indicators
  useEffect(() => {
    const updateStatusIndicator = () => {
      const el = statusTabRefs.current[statusFilter];
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
  }, [statusFilter, statusTabs]);

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

  // ── 09. Filtering Logic ───────────────────────────────────────────────────
  const filteredTokens = useMemo(() => {
    return tokens.filter(t => {
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
      } else if (sf !== 'all') {
        matchesStatus = s === sf;
      }

      if (secondaryFilter !== 'ALL') {
        if (secondaryFilter === 'KYC_VERIFIED' && !t.idProof?.documentUrl) return false;
        if (secondaryFilter === 'HIGH_VALUE' && (Number(t.tokenAmount) || 0) < 5000) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          (t.id || '').toLowerCase().includes(query) ||
          (t.buyerName || '').toLowerCase().includes(query) ||
          (t.propertyTitle || '').toLowerCase().includes(query) ||
          (t.sellerName || '').toLowerCase().includes(query) ||
          (t.buyerPhone || '').toLowerCase().includes(query) ||
          (t.buyerEmail || '').toLowerCase().includes(query) ||
          (t.contactNotes || '').toLowerCase().includes(query) ||
          (t.notes || '').toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      return matchesStatus;
    });
  }, [tokens, statusFilter, secondaryFilter, searchQuery]);

  // ── 10. Status Badge Helpers (BADGES_UI_DESIGN_SYSTEM.md Spec) ────────────
  const getTokenStatusBadge = (status, size = 'xs') => {
    const s = (status || '').toLowerCase();
    if (s === 'accepted' || s === 'released' || s === 'approved' || s === 'token_received') {
      return <Badge.Approved size={size}>Token Received</Badge.Approved>;
    }
    if (s === 'contacted' || s === 'in_discussion') {
      return (
        <Badge color="sky" variant="pastel" size={size} icon={<PhoneCall size={10} className="shrink-0" />}>
          In Discussion
        </Badge>
      );
    }
    if (s === 'rejected' || s === 'declined') {
      return <Badge.Rejected size={size}>Declined</Badge.Rejected>;
    }
    if (s === 'cancelled' || s === 'refunded') {
      return <Badge color="slate" variant="pastel" size={size}>Cancelled</Badge>;
    }
    return <Badge.Pending size={size} pulse>Pending Contact</Badge.Pending>;
  };

  // ── 11. Modal Actions ─────────────────────────────────────────────────────
  const handleActionConfirm = async () => {
    if (!actionModal) return;
    const { type, token } = actionModal;
    setIsSubmitting(true);

    try {
      const idToUpdate = token.mongoId || token.id;
      const targetStatus = type === 'contact' ? 'contacted' : type === 'accept' ? 'accepted' : 'rejected';
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

  return (
    <div className="space-y-5 pb-12">
      {/* ── 01. TOAST NOTIFICATION ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[80] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] animate-slide-down">
          {toast.type === 'error' ? (
            <AlertCircle size={16} className="text-rose-500 shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.msg}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer ml-2"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── 02. TOP HEADER & CONTROL BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-2 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Rental Token Requests
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#52c99b]/15 text-[#064e3b] dark:bg-[#1a4a38]/40 dark:text-[#6ee7b7] border border-[#52c99b]/25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync • {lastSyncTime}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Manage prospective tenant token reservations, KYC proofs, and direct offline settlements
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={refreshAllData}
            disabled={isRefreshing || isLoading}
            className="p-2 border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Refresh Token Bookings"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-brand' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="h-8.5 px-3 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] text-xs font-semibold flex items-center gap-1.5 border border-[var(--border)] transition-all cursor-pointer active:scale-95 shadow-2xs"
          >
            <Settings size={13} className="text-[var(--text-muted)]" />
            <span>Configure Amounts</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="h-8.5 px-3.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-brand/25 transition-all cursor-pointer active:scale-95"
          >
            <Plus size={14} />
            <span>Record Token Booking</span>
          </button>
        </div>
      </div>

      {/* ── 03. 4 STANDARDIZED TOP-ACCENT KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            key: 'kpi_total',
            title: 'Total Requests',
            value: tokens.length,
            subtitle: 'All recorded inquiries',
            tag: 'All Time',
            icon: Coins,
            isActive: statusFilter === 'All',
            activeAccent: 'border-t-2 border-t-brand ring-1 ring-brand/30',
            onClick: () => setStatusFilter('All')
          },
          {
            key: 'kpi_pending',
            title: 'Pending Contact',
            value: pendingCount,
            subtitle: 'Awaiting admin outreach',
            tag: pendingCount > 0 ? `${pendingCount} Urgent` : 'All Clear',
            icon: Clock,
            pulse: pendingCount > 0,
            isActive: statusFilter === 'Pending',
            activeAccent: 'border-t-2 border-t-amber-500 ring-1 ring-amber-500/30',
            onClick: () => setStatusFilter('Pending')
          },
          {
            key: 'kpi_contacted',
            title: 'In Discussion',
            value: contactedCount,
            subtitle: 'Ongoing outreach',
            tag: 'In Touch',
            icon: PhoneCall,
            isActive: statusFilter === 'Contacted',
            activeAccent: 'border-t-2 border-t-sky-500 ring-1 ring-sky-500/30',
            onClick: () => setStatusFilter('Contacted')
          },
          {
            key: 'kpi_accepted',
            title: 'Token Received',
            value: acceptedCount,
            subtitle: 'Offline deposit settled',
            tag: 'Settled',
            icon: CheckCircle2,
            isActive: statusFilter === 'Accepted',
            activeAccent: 'border-t-2 border-t-emerald-500 ring-1 ring-emerald-500/30',
            onClick: () => setStatusFilter('Accepted')
          }
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              onClick={card.onClick}
              className={`group bg-[var(--bg-surface)] rounded-xl p-3.5 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden flex flex-col justify-between border border-[var(--border)] text-left cursor-pointer ${
                card.isActive ? card.activeAccent : 'border-t-2 border-t-[var(--border)] hover:border-t-brand'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                    {card.title}
                    {card.pulse && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                      {card.value}
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 text-brand bg-brand/10">
                  <Icon size={16} strokeWidth={2} />
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)] truncate">{card.subtitle}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-[var(--text-muted)]">
                  {card.tag}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 04. HIGH-VISIBILITY PENDING OUTREACH BANNER ── */}
      {pendingCount > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-[var(--text-primary)]">
                  {pendingCount} Token Reservation Request{pendingCount > 1 ? 's' : ''} Awaiting Outreach
                </h4>
                <Badge.Pending size="xs" pulse>Priority Action</Badge.Pending>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
                Prospective tenants have reserved rental properties and submitted family/occupation KYC details. Reach out via phone or WhatsApp to finalize token terms.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('Pending')}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Clock size={13} /> Filter Pending ({pendingCount})
            </button>
            {tokens.find(t => (t.status || '').toLowerCase() === 'pending') && (
              <button
                type="button"
                onClick={() => setSelectedToken(tokens.find(t => (t.status || '').toLowerCase() === 'pending'))}
                className="px-3 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                Review First <ChevronRight size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── 05. SLIDING STATUS TOGGLE SWITCH (BADGES DESIGN SYSTEM TOKENS) ── */}
      <div className="flex items-center overflow-x-auto scrollbar-none py-1 border-b border-[var(--border)]/60">
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
            const isActive = statusFilter.toLowerCase() === tab.key.toLowerCase();

            return (
              <button
                key={tab.key}
                ref={(el) => { statusTabRefs.current[tab.key] = el; }}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`relative z-10 px-3.5 py-1.5 rounded-full transition-colors duration-200 cursor-pointer flex items-center gap-2 whitespace-nowrap text-xs ${
                  isActive
                    ? `${tab.activeText} font-bold`
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
                }`}
              >
                <Icon size={13} className="shrink-0" />
                <span>{tab.label}</span>
                <span className={`min-w-[18px] h-4 px-1.5 rounded-full text-[10px] font-bold inline-flex items-center justify-center transition-colors ${
                  isActive
                    ? tab.activeCountBg
                    : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border)]'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 06. TOOLBAR: SEARCH, CATEGORY PILLS & VIEW SWITCHER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border)] shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by token ID, tenant name, phone, property..."
            className="w-full pl-9 pr-8 py-2 bg-[var(--bg-muted)]/60 hover:bg-[var(--bg-muted)] focus:bg-[var(--bg-surface)] border border-transparent focus:border-brand/40 text-xs font-medium rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Secondary Category Filters & View Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { key: 'ALL', label: 'All Requests' },
            { key: 'KYC_VERIFIED', label: 'KYC Attached' },
            { key: 'HIGH_VALUE', label: 'High Value (₹5,000+)' },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setSecondaryFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                secondaryFilter === f.key
                  ? 'bg-[var(--text-primary)] text-[var(--bg-surface)] shadow-2xs'
                  : 'bg-[var(--bg-muted)]/70 text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {f.label}
            </button>
          ))}

          <div className="h-5 w-[1px] bg-[var(--border)] mx-1" />

          {/* View Switcher: List vs Grid Sliding Switch */}
          <div className="relative inline-flex items-center p-1 bg-[var(--bg-muted)]/80 rounded-full border border-[var(--border)] text-xs font-semibold select-none shadow-inner-xs">
            <span
              className="absolute top-1 bottom-1 rounded-full shadow-xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none bg-[#bae6fd] dark:bg-[#113c54]"
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
              className={`relative z-10 px-3 py-1 rounded-full transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
                viewMode === 'table'
                  ? 'text-[#075985] dark:text-[#7dd3fc] font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
              }`}
              title="Table view"
            >
              <List size={13} />
              <span>List</span>
            </button>
            <button
              ref={(el) => { viewModeRefs.current['grid'] = el; }}
              type="button"
              onClick={() => handleSetViewMode('grid')}
              className={`relative z-10 px-3 py-1 rounded-full transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
                viewMode === 'grid'
                  ? 'text-[#075985] dark:text-[#7dd3fc] font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
              }`}
              title="Grid view"
            >
              <LayoutGrid size={13} />
              <span>Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 07. MAIN INVENTORY DISPLAY (TABLE OR GRID) ── */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <AdminLoader text="Loading rental token reservations..." />
        </div>
      ) : filteredTokens.length === 0 ? (
        <div className="p-16 text-center bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)]">
            <Coins size={24} className="text-emerald-500" />
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            {statusFilter === 'Pending' ? 'All Outreach Inquiries Completed!' : 'No Matching Token Requests Found'}
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
            {statusFilter === 'Pending'
              ? 'There are currently no token reservations pending admin contact.'
              : 'Try clearing your search query or changing filters.'}
          </p>
          {(searchQuery || statusFilter !== 'All' || secondaryFilter !== 'ALL') ? (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setStatusFilter('All'); setSecondaryFilter('ALL'); }}
              className="mt-4 px-4 py-2 bg-brand/10 text-brand hover:bg-brand/15 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Clear All Filters
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-brand text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-brand-dark transition-colors"
            >
              Record First Token Request
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Table View: Responsive Scrollable Table */
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-2xs">
          <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse table-fixed min-w-[850px]">
              <colgroup>
                <col className="w-[13%]" />
                <col className="w-[27%]" />
                <col className="w-[23%]" />
                <col className="w-[15%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
              </colgroup>
              <thead className="bg-[var(--bg-muted)]/40 text-[var(--text-muted)] uppercase text-[9.5px] font-semibold tracking-wider border-b border-[var(--border)] select-none">
                <tr>
                  <th className="py-2 px-3">Token ID</th>
                  <th className="py-2 px-3">Linked Property</th>
                  <th className="py-2 px-3">Tenant Details</th>
                  <th className="py-2 px-3">Financial Terms</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 pl-2 pr-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60 text-xs">
                {filteredTokens.map((t) => {
                  const isMenuOpen = openMenuId === (t.id || t.mongoId);

                  return (
                    <tr
                      key={t.id || t.mongoId}
                      onClick={() => { setSelectedToken(t); setDrawerTab('overview'); }}
                      className="hover:bg-[var(--bg-muted)]/35 transition-colors cursor-pointer group"
                    >
                      {/* Column 1: Token ID & Date */}
                      <td className="py-1.5 px-3 align-middle whitespace-nowrap overflow-hidden">
                        <span className="font-mono text-xs font-semibold text-[var(--text-primary)] group-hover:text-brand transition-colors block leading-tight">
                          {t.id}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] block mt-0.5 leading-tight">
                          {t.bookingDate}
                        </span>
                      </td>

                      {/* Column 2: Linked Property */}
                      <td className="py-1.5 px-3 align-middle overflow-hidden">
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-brand transition-colors truncate" title={t.propertyTitle}>
                            {t.propertyTitle}
                          </p>
                          <span className="font-mono text-[10px] text-[var(--text-muted)] block truncate mt-0.5 leading-tight">
                            {t.propertyCity ? `${t.propertyCity} • ` : ''}{t.propertyId || 'Direct Listing'}
                          </span>
                        </div>
                      </td>

                      {/* Column 3: Tenant Details */}
                      <td className="py-1.5 px-3 align-middle overflow-hidden">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-semibold text-xs text-[var(--text-primary)] truncate" title={t.buyerName}>
                              {t.buyerName}
                            </span>
                            {t.idProof?.documentUrl && (
                              <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20 shrink-0">
                                KYC
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10.5px] text-[var(--text-muted)] font-mono mt-0.5 leading-tight truncate">
                            <span>{t.buyerPhone}</span>
                            {t.currentCity && <span className="font-sans text-[10px]">({t.currentCity})</span>}
                          </div>
                        </div>
                      </td>

                      {/* Column 4: Financial Terms (Proposed Token & Agreed Rent Stacked) */}
                      <td className="py-1.5 px-3 align-middle whitespace-nowrap overflow-hidden">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
                            {t.tokenAmount && t.tokenAmount > 0 ? `₹${t.tokenAmount.toLocaleString()}` : '₹0'}
                          </span>
                          <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-medium">
                            Token
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] block mt-0.5 leading-tight truncate">
                          {t.totalAgreedPrice || (t.monthlyRent ? `₹${t.monthlyRent.toLocaleString()}/mo Rent` : 'Agreed Term')}
                        </span>
                      </td>

                      {/* Column 5: Status */}
                      <td className="py-1.5 px-3 align-middle whitespace-nowrap overflow-hidden">
                        {getTokenStatusBadge(t.status, 'xs')}
                      </td>

                      {/* Column 6: Actions */}
                      <td className="py-1.5 pl-2 pr-3 align-middle text-right whitespace-nowrap">
                        <div className="relative inline-flex items-center justify-end gap-1 shrink-0 row-actions-dropdown" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => { setSelectedToken(t); setDrawerTab('overview'); }}
                            className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--bg-muted)]/70 hover:bg-brand hover:text-white text-[var(--text-secondary)] border border-[var(--border)] transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                            title="Inspect Details"
                          >
                            <Eye size={12} />
                          </button>

                          {t.buyerPhone && (
                            <a
                              href={`https://wa.me/${(t.buyerPhone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${t.buyerName}, regarding your token request on GharMB for "${t.propertyTitle}", I am contacting you to finalize booking terms.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="WhatsApp Tenant"
                              className="w-6 h-6 rounded-md flex items-center justify-center text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 transition-all shadow-2xs active:scale-95"
                            >
                              <MessageSquare size={11} />
                            </a>
                          )}

                          {t.buyerPhone && (
                            <button
                              type="button"
                              onClick={() => setCallTarget(t)}
                              title={`Call ${t.buyerPhone}`}
                              className="w-6 h-6 rounded-md flex items-center justify-center text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500 hover:text-white border border-sky-500/20 transition-all shadow-2xs active:scale-95 cursor-pointer"
                            >
                              <Phone size={11} />
                            </button>
                          )}

                          {/* Popover Toggle */}
                          <button
                            type="button"
                            onClick={() => setOpenMenuId(isMenuOpen ? null : (t.id || t.mongoId))}
                            title="More Actions"
                            className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all cursor-pointer active:scale-95 ${
                              isMenuOpen
                                ? 'bg-brand text-white border-brand'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] border-[var(--border)]'
                            }`}
                          >
                            <MoreHorizontal size={12} />
                          </button>

                          {/* Action Popover Menu */}
                          {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-1 w-48 py-1 bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl border border-[var(--border)] shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedToken(t);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                              >
                                <Eye size={12} className="text-[var(--text-muted)]" />
                                <span>Inspect Full Record</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const summary = `Token ID: ${t.id}\nTenant: ${t.buyerName}\nPhone: ${t.buyerPhone}\nEmail: ${t.buyerEmail || 'N/A'}\nProperty: ${t.propertyTitle}\nRent: ${t.totalAgreedPrice || t.monthlyRent}\nToken: ₹${(t.tokenAmount || 0).toLocaleString()}`;
                                  copyToClipboard(summary, `Details for ${t.buyerName}`);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                              >
                                <Copy size={12} className="text-[var(--text-muted)]" />
                                <span>Copy Summary</span>
                              </button>

                              <div className="my-1 border-t border-[var(--border)]" />

                              {(t.status === 'pending' || t.status === 'Pending') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionModal({ type: 'contact', token: t });
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-xs flex items-center gap-2 text-sky-600 hover:bg-sky-500/10 transition-colors cursor-pointer font-medium"
                                >
                                  <PhoneCall size={12} />
                                  <span>Log Discussion</span>
                                </button>
                              )}

                              {(t.status === 'pending' || t.status === 'contacted' || t.status === 'Pending') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionModal({ type: 'accept', token: t });
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-xs flex items-center gap-2 text-emerald-600 hover:bg-emerald-500/10 transition-colors cursor-pointer font-medium"
                                >
                                  <CheckCircle2 size={12} />
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
                                  className="w-full px-3 py-1.5 text-xs flex items-center gap-2 text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer font-medium"
                                >
                                  <XCircle size={12} />
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
                                className="w-full px-3 py-1.5 text-xs flex items-center gap-2 text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              >
                                <Trash2 size={12} />
                                <span>Delete Record</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-3.5 py-2 border-t border-[var(--border)] bg-[var(--bg-muted)]/20 flex items-center justify-between text-[11px] text-[var(--text-muted)] select-none">
            <span>Showing <span className="font-semibold text-[var(--text-primary)]">{filteredTokens.length}</span> of {tokens.length} token booking requests</span>
            <span>Direct buyer-seller terms • No online platform escrow</span>
          </div>
        </div>
      ) : (
        /* Grid View: Responsive Interactive Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5">
          {filteredTokens.map((t) => (
            <div
              key={t.id || t.mongoId}
              onClick={() => { setSelectedToken(t); setDrawerTab('overview'); }}
              className="bg-[var(--bg-surface)] border border-[var(--border)] hover:border-brand/40 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-brand block">{t.id}</span>
                    <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">{t.bookingDate}</span>
                  </div>
                  {getTokenStatusBadge(t.status, 'xs')}
                </div>

                {/* Property & Tenant */}
                <div className="mt-3">
                  <h3 className="font-bold text-xs text-[var(--text-primary)] group-hover:text-brand transition-colors truncate" title={t.propertyTitle}>
                    {t.propertyTitle}
                  </h3>
                  <p className="text-[10.5px] text-[var(--text-muted)] truncate mt-0.5">
                    {t.propertyCity || 'Rental Property'}
                  </p>

                  <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-[var(--border)]/60">
                    <div className="w-6 h-6 rounded-full bg-brand/10 text-brand text-[10px] font-bold flex items-center justify-center shrink-0">
                      {t.buyerName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs text-[var(--text-primary)] truncate">{t.buyerName}</p>
                      <p className="font-mono text-[10px] text-[var(--text-muted)] truncate">{t.buyerPhone}</p>
                    </div>
                    {t.idProof?.documentUrl && (
                      <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        KYC
                      </span>
                    )}
                  </div>
                </div>

                {/* Financials Ribbon */}
                <div className="grid grid-cols-2 gap-1.5 mt-3 p-2 rounded-xl bg-[var(--bg-muted)]/50 text-[10px]">
                  <div>
                    <span className="text-[var(--text-muted)] block text-[9px] uppercase">Token</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                      {t.tokenAmount && t.tokenAmount > 0 ? `₹${t.tokenAmount.toLocaleString()}` : '₹0'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block text-[9px] uppercase">Agreed Rent</span>
                    <strong className="text-[var(--text-primary)] font-semibold truncate block">
                      {t.totalAgreedPrice || (t.monthlyRent ? `₹${t.monthlyRent.toLocaleString()}` : '—')}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-3.5 pt-2.5 border-t border-[var(--border)] flex items-center justify-between gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => { setSelectedToken(t); setDrawerTab('overview'); }}
                  className="flex-1 py-1 px-2 bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)]/80 text-[var(--text-primary)] rounded-lg text-[10.5px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Eye size={11} /> Inspect
                </button>
                {t.buyerPhone && (
                  <button
                    type="button"
                    onClick={() => setCallTarget(t)}
                    className="p-1 rounded-lg bg-sky-500/10 hover:bg-sky-500 hover:text-white text-sky-600 transition-all cursor-pointer"
                    title="Call Tenant"
                  >
                    <Phone size={12} />
                  </button>
                )}
                {t.buyerPhone && (
                  <a
                    href={`https://wa.me/${(t.buyerPhone || '').replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 transition-all"
                    title="WhatsApp"
                  >
                    <MessageSquare size={12} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 08. REVIEW DRAWER: 5-STEP AUDIT & OUTREACH HUB ── */}
      {selectedToken && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-end">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] h-full max-w-xl w-full shadow-2xl border-l border-[var(--border)] flex flex-col justify-between animate-slide-left">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[var(--border)] flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brand">{selectedToken.id}</span>
                  {getTokenStatusBadge(selectedToken.status, 'xs')}
                </div>
                <h2 className="text-base font-bold text-[var(--text-primary)] mt-0.5">
                  {selectedToken.propertyTitle}
                </h2>
                <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                  <Coins size={11} className="text-emerald-500" /> Proposed Token: ₹{(selectedToken.tokenAmount || 0).toLocaleString()} • {selectedToken.bookingDate}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedToken(null)}
                className="p-1.5 rounded-xl bg-[var(--bg-muted)] hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                title="Close Drawer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Tabs */}
            <div className="flex items-center gap-6 px-5 border-b border-[var(--border)] text-xs font-bold select-none">
              {[
                { key: 'overview', label: 'Outreach & Overview' },
                { key: 'kyc', label: '5-Step Tenant KYC' },
                { key: 'terms', label: 'Deal Terms & Owner Desk' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setDrawerTab(tab.key)}
                  className={`py-2.5 border-b-2 transition-all cursor-pointer ${
                    drawerTab === tab.key
                      ? 'border-brand text-brand'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {drawerTab === 'overview' && (
                <div className="space-y-4 text-xs">
                  {/* Out-of-App Direct Outreach Box */}
                  <div className="p-4 bg-gradient-to-br from-blue-500/10 via-emerald-500/10 to-transparent rounded-2xl border border-blue-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                          Out-of-App Outreach Hub
                        </span>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          Directly communicate with buyer outside the platform
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 border border-blue-500/30">
                        Direct Outreach
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {selectedToken.buyerPhone && (
                        <button
                          type="button"
                          onClick={() => setCallTarget(selectedToken)}
                          className="py-2 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <Phone size={13} />
                          <span>Call Tenant</span>
                        </button>
                      )}

                      {selectedToken.buyerPhone && (
                        <a
                          href={`https://wa.me/${(selectedToken.buyerPhone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${selectedToken.buyerName}, regarding your token request on GharMB for "${selectedToken.propertyTitle}", I am contacting you from the GharMB Admin team.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                        >
                          <MessageSquare size={13} />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          const summary = `Token ID: ${selectedToken.id}\nTenant: ${selectedToken.buyerName}\nPhone: ${selectedToken.buyerPhone}\nEmail: ${selectedToken.buyerEmail || 'N/A'}\nProperty: ${selectedToken.propertyTitle}\nRent: ${selectedToken.totalAgreedPrice || selectedToken.monthlyRent}\nToken: ₹${(selectedToken.tokenAmount || 0).toLocaleString()}`;
                          copyToClipboard(summary, `Details for ${selectedToken.buyerName}`);
                        }}
                        className="py-2 px-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] rounded-xl text-xs font-semibold border border-[var(--border)] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Copy size={13} />
                        <span>Copy Summary</span>
                      </button>
                    </div>
                  </div>

                  {/* Tenant Overview Card */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border)] space-y-2.5">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Tenant Overview</span>
                    <div className="flex items-center justify-between">
                      <strong className="text-sm text-[var(--text-primary)]">{selectedToken.buyerName}</strong>
                      {selectedToken.idProof?.documentUrl && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
                          KYC Attached
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block">Phone</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="font-mono font-semibold text-[var(--text-primary)]">{selectedToken.buyerPhone}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(selectedToken.buyerPhone, 'Phone')}
                            className="p-0.5 text-[var(--text-muted)] hover:text-brand"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block">Current City</span>
                        <span className="font-medium text-[var(--text-primary)] mt-0.5 block">{selectedToken.currentCity || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financials Box */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border)] space-y-2">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Settlement Financials</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
                        <span className="text-[9px] uppercase text-[var(--text-muted)] block">Proposed Token</span>
                        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                          ₹{(selectedToken.tokenAmount || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
                        <span className="text-[9px] uppercase text-[var(--text-muted)] block">Agreed Rent</span>
                        <span className="text-base font-bold text-[var(--text-primary)] mt-0.5 block">
                          {selectedToken.totalAgreedPrice || (selectedToken.monthlyRent ? `₹${selectedToken.monthlyRent.toLocaleString()}` : '—')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === 'kyc' && (
                <div className="space-y-3.5 text-xs">
                  {/* Step 1: Personal */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border)] space-y-2">
                    <span className="text-[10px] font-bold text-brand uppercase tracking-wider block">1. Personal Verification</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block">Full Name</span>
                        <strong className="text-[var(--text-primary)]">{selectedToken.buyerName}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block">Email</span>
                        <span className="text-[var(--text-primary)] truncate block">{selectedToken.buyerEmail || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Family */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border)] space-y-2">
                    <span className="text-[10px] font-bold text-brand uppercase tracking-wider block">2. Family Profile</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block">Total Members</span>
                        <strong className="text-[var(--text-primary)]">{selectedToken.familyDetails?.numberOfFamilyMembers || '1'}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block">Marital Status</span>
                        <strong className="text-[var(--text-primary)]">{selectedToken.familyDetails?.maritalStatus || 'Single'}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block">Adults / Kids</span>
                        <strong className="text-[var(--text-primary)]">{selectedToken.familyDetails?.adults || '1'} / {selectedToken.familyDetails?.children || '0'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Occupation */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border)] space-y-2">
                    <span className="text-[10px] font-bold text-brand uppercase tracking-wider block">3. Occupation Profile</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block">Profession</span>
                        <strong className="text-[var(--text-primary)]">{selectedToken.occupationDetails?.profession || 'Self Employed'}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block">Company</span>
                        <strong className="text-[var(--text-primary)]">{selectedToken.occupationDetails?.companyName || 'Not specified'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Step 4: ID Document Proof */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border)] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-brand uppercase tracking-wider">4. Statutory ID Proof</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {selectedToken.idProof?.idProofType || 'Aadhaar Card'}
                      </span>
                    </div>

                    {selectedToken.idProof?.documentUrl ? (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-brand" />
                          <span className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[200px]">
                            {selectedToken.idProof.documentOriginalName || 'KYC_Proof.pdf'}
                          </span>
                        </div>
                        <a
                          href={getMediaUrl(selectedToken.idProof.documentUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-brand text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 hover:bg-brand-dark"
                        >
                          <Download size={11} />
                          <span>View Proof</span>
                        </a>
                      </div>
                    ) : (
                      <p className="text-[11px] text-[var(--text-muted)] italic">
                        ID Document on file: verified via Digilocker/portal submission.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {drawerTab === 'terms' && (
                <div className="space-y-3.5 text-xs">
                  {/* Property Owner / Developer Desk */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border)] space-y-2">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Property Owner / Developer Desk</span>
                    <div className="flex items-center justify-between">
                      <div>
                        <strong className="text-sm text-[var(--text-primary)]">{selectedToken.sellerName}</strong>
                        <p className="text-[11px] text-[var(--text-muted)]">{selectedToken.sellerRole} {selectedToken.sellerPhone ? `• ${selectedToken.sellerPhone}` : ''}</p>
                      </div>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">{selectedToken.propertyId}</span>
                    </div>
                  </div>

                  {/* Direct Settlement Policy Notice */}
                  <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                    <strong className="font-bold block">Direct Offline Settlement Policy</strong>
                    <p className="text-[11px] opacity-90 leading-relaxed">
                      {selectedToken.adjustmentNote || "Token reservation request. Deal terms and deposit are arranged directly between parties offline. No online payment is processed on the platform."}
                    </p>
                  </div>

                  {/* Remarks & Audit Notes */}
                  {selectedToken.notes && (
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border)] space-y-1">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Audit Remarks</span>
                      <p className="text-xs text-[var(--text-secondary)] italic leading-relaxed">
                        {selectedToken.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-muted)]/20 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteModal(selectedToken)}
                className="h-8 px-3 rounded-full text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/25 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={13} /> Delete
              </button>

              <div className="flex items-center gap-2">
                {(selectedToken.status === 'pending' || selectedToken.status === 'Pending') && (
                  <button
                    type="button"
                    onClick={() => setActionModal({ type: 'contact', token: selectedToken })}
                    className="h-8 px-3.5 rounded-full text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-500/10 hover:bg-sky-500 hover:text-white border border-sky-500/25 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <PhoneCall size={13} /> Log Discussion
                  </button>
                )}

                {(selectedToken.status === 'pending' || selectedToken.status === 'contacted' || selectedToken.status === 'Pending') && (
                  <button
                    type="button"
                    onClick={() => setActionModal({ type: 'accept', token: selectedToken })}
                    className="h-8 px-4 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 size={13} /> Confirm Token Received
                  </button>
                )}

                {(selectedToken.status === 'pending' || selectedToken.status === 'contacted') && (
                  <button
                    type="button"
                    onClick={() => setActionModal({ type: 'reject', token: selectedToken })}
                    className="h-8 px-3 rounded-full text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/25 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <XCircle size={13} /> Decline
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 09. MODAL: OUT-OF-APP ACTION CONFIRMATION (CONTACT / ACCEPT / DECLINE) ── */}
      {actionModal && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl max-w-sm w-full shadow-2xl border border-[var(--border)] p-5 space-y-3.5 animate-scale-up">
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
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-3 bg-[var(--bg-muted)]/70 rounded-xl border border-[var(--border)] space-y-1.5 text-xs">
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

            <div className="space-y-1 text-xs">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">
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
                className="w-full px-2.5 py-1.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActionConfirm}
                disabled={isSubmitting}
                className={`px-3.5 py-1.5 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 ${
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

      {/* ── 10. MODAL: DELETE CONFIRMATION ── */}
      {deleteModal && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl max-w-sm w-full shadow-2xl border border-[var(--border)] p-5 space-y-3.5 text-center animate-scale-up">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Delete Token Record?</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Are you sure you want to permanently delete token deposit record <strong className="text-[var(--text-primary)] font-mono">{deleteModal.id}</strong> for <strong className="text-[var(--text-primary)]">{deleteModal.buyerName}</strong>?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="flex-1 py-2 border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--text-subtle)] hover:bg-[var(--bg-muted)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 11. MODAL: CONFIGURE TOKEN AMOUNTS ── */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl max-w-md w-full shadow-2xl border border-[var(--border)] p-5 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-brand uppercase tracking-wider">Admin Controls</span>
                <h3 className="text-sm font-bold text-[var(--text-primary)] mt-0.5 flex items-center gap-1.5">
                  <IndianRupee size={16} className="text-brand" />
                  <span>Configure Token Booking Amounts</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Configure the preset token amounts presented to prospective tenants on the mobile app and website (Step 5 of "Book with Token").
            </p>

            {/* Active Amount Chips */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                Active Preset Amounts
              </label>
              <div className="flex flex-wrap gap-2">
                {tokenConfig.tokenAmounts.map((amt) => {
                  const isDefault = tokenConfig.defaultTokenAmount === amt;
                  return (
                    <div
                      key={amt}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
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
                        className="text-slate-400 hover:text-rose-500 cursor-pointer ml-1"
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
            <div className="space-y-1 text-xs">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Add Preset Amount (₹)</label>
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
                    className="w-full h-8 pl-6 pr-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddAmount}
                  className="h-8 px-3 rounded-xl bg-[var(--bg-muted)] hover:bg-[var(--border)] text-[var(--text-primary)] text-xs font-semibold flex items-center gap-1 cursor-pointer border border-[var(--border)]"
                >
                  <Plus size={13} />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Policy Notice */}
            <div className="space-y-1 text-xs">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">
                Policy Notice / Adjustment Term
              </label>
              <textarea
                rows={2}
                value={tokenConfig.adjustmentNote}
                onChange={(e) => setTokenConfig({ ...tokenConfig, adjustmentNote: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTokenConfig}
                disabled={isSavingConfig}
                className="px-4 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              >
                {isSavingConfig ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 12. MODAL: RECORD MANUAL TOKEN BOOKING ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl max-w-lg w-full shadow-2xl border border-[var(--border)] p-5 space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
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
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTokenSubmit} className="space-y-3.5 text-xs">
              {/* Linked Property Selector */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">
                    Linked Rental Property
                  </label>
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
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
                  className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand"
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

              {/* Buyer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Buyer Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aman Verma"
                    value={createForm.buyerName}
                    onChange={(e) => setCreateForm({ ...createForm, buyerName: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={createForm.buyerPhone}
                    onChange={(e) => setCreateForm({ ...createForm, buyerPhone: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Buyer Email</label>
                  <input
                    type="email"
                    placeholder="buyer@gmail.com"
                    value={createForm.buyerEmail}
                    onChange={(e) => setCreateForm({ ...createForm, buyerEmail: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Current City</label>
                  <input
                    type="text"
                    placeholder="e.g. Noida, Delhi NCR"
                    value={createForm.currentCity}
                    onChange={(e) => setCreateForm({ ...createForm, currentCity: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Deposit Financials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Token Deposit (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      required
                      value={createForm.tokenAmount}
                      onChange={(e) => setCreateForm({ ...createForm, tokenAmount: e.target.value })}
                      className="w-full h-8 pl-6 pr-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand font-bold text-emerald-600"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Agreed Rent (₹)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      placeholder="e.g. 25000"
                      value={createForm.monthlyRent}
                      onChange={(e) => setCreateForm({ ...createForm, monthlyRent: e.target.value })}
                      className="w-full h-8 pl-6 pr-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Notes / Verification Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Additional verification details..."
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Record Token Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 13. MODAL: CALL & CONTACT CLIENT ── */}
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
}
