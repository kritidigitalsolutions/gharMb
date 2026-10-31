import React, { useState, useEffect, useMemo, useRef } from 'react';
import AdminLoader from '../components/common/AdminLoader';
import { useSearchParams } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import {
  Radio,
  Send,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Users,
  User,
  Shield,
  Building2,
  Bell,
  AlertTriangle,
  Sparkles,
  Info,
  CheckCircle2,
  Trash2,
  Copy,
  ExternalLink,
  RotateCw,
  Eye,
  X,
  Layers,
  ChevronDown,
  Megaphone,
  ArrowRight,
  Clock,
  SendHorizontal,
  Flame,
  Check,
  Calendar,
  AlertCircle,
  Lock
} from 'lucide-react';
import API from '../api/api';

// Pre-defined quick templates to enhance UX
const BROADCAST_TEMPLATES = [
  {
    label: 'Maintenance Notice',
    title: 'Scheduled System Maintenance',
    type: 'system',
    priority: 'normal',
    message: 'We will be conducting scheduled system maintenance on Sunday between 2:00 AM and 4:00 AM IST. Some services may experience temporary disruptions.',
    actionLabel: 'Check Status',
    actionUrl: '/status',
  },
  {
    label: 'New Feature Launch',
    title: 'Exciting Update: Instant Property Verification',
    type: 'update',
    priority: 'normal',
    message: 'Explore our newly upgraded instant document verification workflow for verified builders and certified agents on GHARMB.',
    actionLabel: 'Explore Feature',
    actionUrl: '/properties',
  },
  {
    label: 'Policy Update',
    title: 'Platform Terms & Guidelines Update',
    type: 'announcement',
    priority: 'normal',
    message: 'We have updated our platform listing verification standards and privacy policies for all community members.',
    actionLabel: 'Read Terms',
    actionUrl: '/legal',
  },
  {
    label: 'Critical Alert',
    title: 'Important Security & Verification Reminder',
    type: 'alert',
    priority: 'urgent',
    message: 'Please ensure your RERA ID and contact details are up to date. Verified profiles get 4x more buyer engagement.',
    actionLabel: 'Update Profile',
    actionUrl: '/profile',
  },
  {
    label: 'Festive Offer',
    title: 'Exclusive Festive Property Showcase Now Live',
    type: 'promotional',
    priority: 'normal',
    message: 'Unlock zero brokerage deals and premium verified residential listings during our special festive showcase.',
    actionLabel: 'View Listings',
    actionUrl: '/properties',
  },
];

const TYPE_CONFIG = {
  announcement: {
    label: 'Announcement',
    icon: Megaphone,
    badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    badgeColor: 'sky',
    color: '#3b82f6',
  },
  system: {
    label: 'System Notice',
    icon: Shield,
    badgeBg: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
    badgeColor: 'slate',
    color: '#71717a',
  },
  update: {
    label: 'Product Update',
    icon: Sparkles,
    badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    badgeColor: 'emerald',
    color: '#10b981',
  },
  alert: {
    label: 'Alert',
    icon: AlertTriangle,
    badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    badgeColor: 'red',
    color: '#f43f5e',
  },
  promotional: {
    label: 'Promotional',
    icon: Flame,
    badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    badgeColor: 'amber',
    color: '#f59e0b',
  },
};

const ROLE_OPTIONS = [
  { value: 'buyer', label: 'Buyers & Clients', icon: User },
  { value: 'agent', label: 'Agents & Brokers', icon: Shield },
  { value: 'builder', label: 'Builders & Developers', icon: Building2 },
  { value: 'owner', label: 'Property Owners', icon: User },
  { value: 'tenant', label: 'Tenants', icon: User },
];

export default function BroadcastManagement() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalBroadcasts: 0,
    totalReached: 0,
    totalPlatformUsers: 0,
    typeBreakdown: {},
    audienceBreakdown: {},
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Tab State & URL Search Params sync ('history' | 'compose')
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam === 'compose' ? 'compose' : 'history');

  useEffect(() => {
    if (tabParam === 'compose' && activeTab !== 'compose') {
      setActiveTab('compose');
    } else if ((!tabParam || tabParam === 'history') && activeTab !== 'history') {
      setActiveTab('history');
    }
  }, [tabParam]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'compose') {
      setSearchParams({ tab: 'compose' });
    } else {
      setSearchParams({});
    }
  };

  const [submitting, setSubmitting] = useState(false);
  const [formAudience, setFormAudience] = useState('all'); // 'all' | 'role' | 'specific'
  const [formRole, setFormRole] = useState('agent');
  const [formSelectedUser, setFormSelectedUser] = useState(null);
  const [formType, setFormType] = useState('announcement');
  const [formPriority, setFormPriority] = useState('normal');
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formActionLabel, setFormActionLabel] = useState('');
  const [formActionUrl, setFormActionUrl] = useState('');

  // Direct User Selection states
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // 'all' | 'agent' | 'builder' | 'buyer' | 'owner' | 'tenant'
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  // Audience real-time estimate
  const [audienceEstimate, setAudienceEstimate] = useState(0);
  const [isEstimating, setIsEstimating] = useState(false);

  // Detail Modal / Inspector
  const [selectedBroadcast, setSelectedBroadcast] = useState(null);

  // Delete Confirmation
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: null,
    title: '',
    loading: false,
  });

  // Toast feedback
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  // Keyboard shortcut listener (Alt+N to compose, Esc to close detail dialog)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.altKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        handleTabChange('compose');
      }
      if (e.key === 'Escape') {
        if (isUserDropdownOpen) setIsUserDropdownOpen(false);
        if (selectedBroadcast) setSelectedBroadcast(null);
        if (deleteConfirm.isOpen) setDeleteConfirm({ isOpen: false, id: null, title: '', loading: false });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUserDropdownOpen, selectedBroadcast, deleteConfirm]);

  // Click outside listener for user dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch broadcasts & stats
  const fetchBroadcasts = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (typeFilter !== 'all') params.type = typeFilter;
      if (audienceFilter !== 'all') params.targetAudience = audienceFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;

      const res = await API.get('/admin/broadcasts', { params });
      if (res.data?.status === 'success') {
        setBroadcasts(res.data.data.broadcasts || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to fetch broadcasts:', err);
      showToast(err.response?.data?.message || 'Failed to load broadcasts', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, [typeFilter, audienceFilter, priorityFilter]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchBroadcasts(true);
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Fetch real-time audience count estimate
  useEffect(() => {
    let active = true;
    const fetchEstimate = async () => {
      setIsEstimating(true);
      try {
        const params = { targetAudience: formAudience };
        if (formAudience === 'role') params.targetRole = formRole;
        if (formAudience === 'specific') params.targetUserId = formSelectedUser?._id;

        const res = await API.get('/admin/broadcasts/audience-estimate', { params });
        if (active && res.data?.status === 'success') {
          setAudienceEstimate(res.data.data?.estimate || 0);
        }
      } catch (err) {
        console.warn('Audience estimate failed:', err);
      } finally {
        if (active) setIsEstimating(false);
      }
    };

    if (activeTab === 'compose') {
      fetchEstimate();
    }
    return () => {
      active = false;
    };
  }, [formAudience, formRole, formSelectedUser, activeTab]);

  // Fetch users for direct user dropdown selection
  const fetchAvailableUsers = async (search = '', role = 'all') => {
    setIsLoadingUsers(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (role !== 'all') params.role = role;
      const res = await API.get('/admin/users', { params });
      if (res.data?.status === 'success') {
        setAvailableUsers(res.data.data?.users || []);
      }
    } catch (err) {
      console.warn('Failed to load users for direct broadcast:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'compose' || formAudience === 'specific') {
      const delay = userSearchTerm.trim() ? 250 : 0;
      const timer = setTimeout(() => {
        fetchAvailableUsers(userSearchTerm, userRoleFilter);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [userSearchTerm, userRoleFilter, formAudience, activeTab]);

  // Load a template into the composer
  const handleApplyTemplate = (tpl) => {
    setFormTitle(tpl.title);
    setFormMessage(tpl.message);
    setFormType(tpl.type);
    setFormPriority(tpl.priority);
    setFormActionLabel(tpl.actionLabel || '');
    setFormActionUrl(tpl.actionUrl || '');
    showToast(`Template "${tpl.label}" loaded`);
  };

  // Reset composer state
  const resetComposer = () => {
    setFormAudience('all');
    setFormRole('agent');
    setFormSelectedUser(null);
    setFormType('announcement');
    setFormPriority('normal');
    setFormTitle('');
    setFormMessage('');
    setFormActionLabel('');
    setFormActionUrl('');
    setUserSearchTerm('');
    setUserRoleFilter('all');
    setIsUserDropdownOpen(false);
  };

  // Submit Broadcast
  const handleSubmitBroadcast = async (e) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      showToast('Please enter a broadcast title/subject', 'error');
      return;
    }
    if (!formMessage.trim()) {
      showToast('Please write the broadcast message body', 'error');
      return;
    }
    if (formAudience === 'specific' && !formSelectedUser) {
      showToast('Please search and select a specific recipient user', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formTitle.trim(),
        message: formMessage.trim(),
        type: formType,
        priority: formPriority,
        targetAudience: formAudience,
        targetRole: formAudience === 'role' ? formRole : undefined,
        targetUserId: formAudience === 'specific' ? formSelectedUser._id : undefined,
        actionLabel: formActionLabel.trim() || undefined,
        actionUrl: formActionUrl.trim() || undefined,
      };

      const res = await API.post('/admin/broadcasts', payload);
      if (res.data?.status === 'success') {
        showToast(res.data.message || 'Broadcast dispatched successfully!', 'success');
        resetComposer();
        fetchBroadcasts(true);
        handleTabChange('history');
      }
    } catch (err) {
      console.error('Error dispatching broadcast:', err);
      showToast(err.response?.data?.message || 'Failed to dispatch broadcast', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete broadcast
  const handleDeleteBroadcast = async () => {
    if (!deleteConfirm.id) return;
    setDeleteConfirm((prev) => ({ ...prev, loading: true }));

    try {
      const res = await API.delete(`/admin/broadcasts/${deleteConfirm.id}`);
      if (res.data?.status === 'success') {
        showToast(res.data.message || 'Broadcast deleted & retracted successfully', 'success');
        setDeleteConfirm({ isOpen: false, id: null, title: '', loading: false });
        if (selectedBroadcast?._id === deleteConfirm.id) {
          setSelectedBroadcast(null);
        }
        fetchBroadcasts(true);
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast(err.response?.data?.message || 'Failed to delete broadcast', 'error');
      setDeleteConfirm((prev) => ({ ...prev, loading: false }));
    }
  };

  // Re-send / duplicate broadcast to composer
  const handleDuplicateToComposer = (b) => {
    setFormTitle(b.title);
    setFormMessage(b.message);
    setFormType(b.type || 'system');
    setFormPriority(b.priority || 'normal');
    setFormAudience(b.targetAudience || 'all');
    setFormRole(b.targetRole || 'agent');
    setFormSelectedUser(b.targetUser || null);
    setFormActionLabel(b.actionLabel || '');
    setFormActionUrl(b.actionUrl || '');
    handleTabChange('compose');
    if (selectedBroadcast) setSelectedBroadcast(null);
    showToast('Loaded into composer. Make edits or dispatch directly.');
  };

  // Copy broadcast content
  const handleCopyContent = (b) => {
    const text = `${b.title}\n\n${b.message}${b.actionUrl ? `\n\nLink: ${b.actionUrl}` : ''}`;
    navigator.clipboard.writeText(text);
    showToast('Broadcast content copied to clipboard');
  };

  // Format relative time helper
  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const diff = (new Date() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatFullDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full space-y-3 pb-12 select-none animate-fadeIn">
      {/* Toast Feedback */}
      {toast.show && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-3.5 py-2 rounded-lg shadow-md border text-xs font-medium backdrop-blur-md transition-all duration-300 animate-slide-down ${
            toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-800'
              : 'bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 border-zinc-800'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle size={14} className="text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP HEADER SECTION - Compact & Sleek */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-brand)]/10 text-[var(--color-brand)] flex items-center justify-center border border-[var(--color-brand)]/20 shadow-2xs shrink-0">
            <Radio size={16} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[var(--text-primary)] leading-tight">
              Broadcast Messages
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Dispatch platform announcements, urgent alerts, and targeted notifications
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {activeTab === 'history' ? (
            <>
              <button
                type="button"
                onClick={() => fetchBroadcasts(true)}
                disabled={refreshing}
                className="h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-all flex items-center gap-1.5 text-xs font-semibold shadow-2xs cursor-pointer disabled:opacity-50"
                title="Refresh logs"
              >
                <RotateCw size={12} className={refreshing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetComposer();
                  handleTabChange('compose');
                }}
                className="h-8 px-3 rounded-lg bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer group"
              >
                <Plus size={14} className="group-hover:rotate-90 transition-transform duration-200" />
                <span>New Broadcast</span>
                <span className="hidden lg:inline text-[9px] bg-white/20 px-1 py-0.2 rounded font-mono">
                  Alt+N
                </span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={resetComposer}
                className="h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-all flex items-center gap-1.5 text-xs font-semibold shadow-2xs cursor-pointer"
                title="Reset Form"
              >
                <RotateCw size={12} />
                <span>Reset Form</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('history')}
                className="h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-all flex items-center gap-1.5 text-xs font-semibold shadow-2xs cursor-pointer"
              >
                <Layers size={13} />
                <span>View All Broadcasts</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* TOP TABS NAVIGATION - Slim & Clean */}
      <div className="flex items-center gap-1.5 border-b border-[var(--border)] pb-2">
        <button
          type="button"
          onClick={() => handleTabChange('history')}
          className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-[var(--color-brand)] text-white shadow-2xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
          }`}
        >
          <Layers size={13} />
          <span>Broadcast History</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'history'
                ? 'bg-white/20 text-white'
                : 'bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--text-subtle)]'
            }`}
          >
            {stats.totalBroadcasts || broadcasts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('compose')}
          className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'compose'
              ? 'bg-[var(--color-brand)] text-white shadow-2xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
          }`}
        >
          <Megaphone size={13} />
          <span>Compose Announcement</span>
          {activeTab !== 'compose' && (
            <span className="flex h-1.5 w-1.5 relative ml-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: BROADCAST HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-2.5 animate-fadeIn">
          {/* FILTER & SEARCH BAR - Slim & Compact */}
          <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search broadcasts by title, message body, or link..."
                  className="w-full h-7.5 pl-8 pr-7 rounded-lg border border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-primary)] text-[11px] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Quick Filter Selectors */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Audience Filter */}
                <select
                  value={audienceFilter}
                  onChange={(e) => setAudienceFilter(e.target.value)}
                  className="h-7.5 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-subtle)] text-[11px] font-medium focus:outline-hidden focus:border-[var(--color-brand)] cursor-pointer"
                >
                  <option value="all">All Audiences</option>
                  <option value="all">🌐 Everyone (All)</option>
                  <option value="role">🛡️ Role Targeted</option>
                  <option value="specific">👤 Direct User</option>
                </select>

                {/* Priority Filter */}
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="h-7.5 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-subtle)] text-[11px] font-medium focus:outline-hidden focus:border-[var(--color-brand)] cursor-pointer"
                >
                  <option value="all">All Priorities</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Type Category Pills */}
            <div className="flex flex-wrap items-center gap-1 pt-0.5 text-xs">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mr-1 hidden sm:inline">
                Category:
              </span>
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`h-6.5 px-2.5 rounded-lg border text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)] shadow-2xs font-semibold'
                    : 'border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                All Categories ({stats.totalBroadcasts || broadcasts.length})
              </button>

              {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                const count = stats.typeBreakdown?.[key] || 0;
                const isActive = typeFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTypeFilter(key)}
                    className={`h-6.5 px-2.5 rounded-lg border text-[11px] font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)] shadow-2xs font-semibold'
                        : 'border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Icon size={11} />
                    <span>{config.label}</span>
                    {count > 0 && (
                      <span
                        className={`text-[9.5px] px-1 py-0.2 rounded-full font-bold ${
                          isActive ? 'bg-white/25 text-white' : 'bg-[var(--border)] text-[var(--text-subtle)]'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* BROADCASTS LISTING SECTION - Compact Height matching Notification page */}
          {loading ? (
            <AdminLoader
              card
              text="Loading broadcast history..."
              subtext="Fetching platform announcements and delivery statuses"
              minHeight="min-h-[200px]"
            />
          ) : broadcasts.length === 0 ? (
            // Clean Minimal Empty State
            <div className="p-8 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[var(--color-brand)]/10 text-[var(--color-brand)] flex items-center justify-center border border-[var(--color-brand)]/20 shadow-2xs">
                <Radio size={22} />
              </div>
              <div className="max-w-md mx-auto space-y-0.5">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  {searchQuery || typeFilter !== 'all' || audienceFilter !== 'all'
                    ? 'No matching broadcast messages found'
                    : 'No broadcasts dispatched yet'}
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {searchQuery || typeFilter !== 'all' || audienceFilter !== 'all'
                    ? 'Try tweaking your filters or search keywords to locate previous broadcasts.'
                    : 'Compose and dispatch your first platform-wide notification or targeted audience message.'}
                </p>
              </div>

              <div className="pt-1">
                {searchQuery || typeFilter !== 'all' || audienceFilter !== 'all' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setTypeFilter('all');
                      setAudienceFilter('all');
                      setPriorityFilter('all');
                    }}
                    className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-primary)] text-xs font-semibold hover:bg-[var(--bg-muted)] transition-all cursor-pointer"
                  >
                    Reset Filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      resetComposer();
                      handleTabChange('compose');
                    }}
                    className="px-4 py-2 rounded-lg bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Plus size={14} />
                    <span>Create Your First Broadcast</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* COMPACT DENSE TABLE / LIST VIEW (~42-45px row height like Notifications) */
            <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xs overflow-hidden">
              <div className="w-full overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse table-fixed min-w-[700px]">
                  <colgroup>
                    <col className="w-[14%]" />
                    <col className="w-[42%]" />
                    <col className="w-[16%]" />
                    <col className="w-[8%]" />
                    <col className="w-[10%]" />
                    <col className="w-[10%]" />
                  </colgroup>
                  <thead className="bg-[var(--bg-muted)]/60 text-[var(--text-muted)] uppercase text-[9.5px] font-bold tracking-wider border-b border-[var(--border)]">
                    <tr>
                      <th className="py-2 px-3 font-semibold align-middle">Type</th>
                      <th className="py-2 px-3 font-semibold align-middle">Subject & Message</th>
                      <th className="py-2 px-3 font-semibold align-middle">Target Audience</th>
                      <th className="py-2 px-3 font-semibold text-center align-middle">Recipients</th>
                      <th className="py-2 px-3 font-semibold align-middle">Dispatched</th>
                      <th className="py-2 px-3 font-semibold text-right align-middle">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)]">
                    {broadcasts.map((b) => {
                      const typeConf = TYPE_CONFIG[b.type] || TYPE_CONFIG.system;
                      const TypeIcon = typeConf.icon;

                      return (
                        <tr
                          key={b._id}
                          className="hover:bg-[var(--bg-muted)]/50 transition-colors group"
                        >
                          {/* Type Badge - Compact */}
                          <td className="py-1.5 px-3 whitespace-nowrap align-middle min-w-0">
                            <Badge
                              color={typeConf.badgeColor || 'sky'}
                              variant="pastel"
                              size="xs"
                              icon={<TypeIcon size={10} />}
                            >
                              {typeConf.label}
                            </Badge>
                          </td>

                          {/* Title & Preview with Priority */}
                          <td className="py-1.5 px-3 align-middle min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                              <span
                                onClick={() => setSelectedBroadcast(b)}
                                className="font-bold text-xs text-[var(--text-primary)] hover:text-brand cursor-pointer truncate leading-tight"
                              >
                                {b.title}
                              </span>
                              {b.priority === 'urgent' && (
                                <Badge color="red" variant="pastel" size="2xs">
                                  Urgent
                                </Badge>
                              )}
                              {b.priority === 'high' && (
                                <Badge color="amber" variant="pastel" size="2xs">
                                  High
                                </Badge>
                              )}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5 leading-tight">
                              {b.message}
                            </div>
                          </td>

                          {/* Audience - Compact */}
                          <td className="py-1.5 px-3 whitespace-nowrap text-[11px] align-middle min-w-0">
                            {b.targetAudience === 'all' && (
                              <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium truncate">
                                <Users size={11} />
                                <span className="truncate">Everyone</span>
                              </span>
                            )}
                            {b.targetAudience === 'role' && (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium capitalize truncate">
                                <Shield size={11} />
                                <span className="truncate">All {b.targetRole}s</span>
                              </span>
                            )}
                            {b.targetAudience === 'specific' && (
                              <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium truncate">
                                <User size={11} />
                                <span className="truncate">{b.targetUser?.name || 'Direct User'}</span>
                              </span>
                            )}
                          </td>

                          {/* Recipients count - Compact */}
                          <td className="py-1.5 px-3 text-center whitespace-nowrap align-middle">
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-subtle)]">
                              {(b.recipientCount || 0).toLocaleString()}
                            </span>
                          </td>

                          {/* Time - Compact */}
                          <td className="py-1.5 px-3 whitespace-nowrap text-[10px] text-[var(--text-muted)] align-middle">
                            <div title={formatFullDate(b.createdAt)} className="truncate">
                              {formatRelativeTime(b.createdAt)}
                            </div>
                          </td>

                          {/* Actions - Standard w-6 h-6 */}
                          <td className="py-1.5 px-3 text-right whitespace-nowrap align-middle">
                            <div className="inline-flex items-center justify-end gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setSelectedBroadcast(b)}
                                className="w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-brand hover:border-brand/40 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                                title="Inspect Details"
                              >
                                <Eye size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicateToComposer(b)}
                                className="w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-brand hover:border-brand/40 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                                title="Duplicate to Composer"
                              >
                                <RotateCw size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyContent(b)}
                                className="w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-brand hover:border-brand/40 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                                title="Copy Message Text"
                              >
                                <Copy size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteConfirm({
                                    isOpen: true,
                                    id: b._id,
                                    title: b.title,
                                    loading: false,
                                  })
                                }
                                className="w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-900/50 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                                title="Delete & Retract"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COMPOSE BROADCAST ANNOUNCEMENT (Dedicated Tab, Enhanced UX/UI) */}
      {/* ========================================================================= */}
      {activeTab === 'compose' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 sm:p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xs">
            {/* Tab Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[var(--color-brand)]/10 text-[var(--color-brand)] flex items-center justify-center border border-[var(--color-brand)]/20 shadow-xs">
                  <Megaphone size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    Compose Broadcast Announcement
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Dispatch targeted platform announcements and direct member notifications
                  </p>
                </div>
              </div>

              {/* Dynamic Target Reach Indicator */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                    formAudience === 'specific'
                      ? formSelectedUser
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  <Users size={14} />
                  <span>
                    {isEstimating
                      ? 'Estimating reach...'
                      : formAudience === 'specific'
                      ? formSelectedUser
                        ? `1 Direct Recipient: ${formSelectedUser.name}`
                        : 'Select 1 Recipient Member'
                      : `Will reach ~${audienceEstimate.toLocaleString()} user${
                          audienceEstimate === 1 ? '' : 's'
                        }`}
                  </span>
                </span>
              </div>
            </div>

            {/* Main Composer Form */}
            <form onSubmit={handleSubmitBroadcast} className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT COLUMN: Controls & Inputs */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Quick Templates Selector */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                        Quick Templates
                      </label>
                      <span className="text-[10px] text-[var(--text-muted)]">Click any template to auto-fill</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {BROADCAST_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.label}
                          type="button"
                          onClick={() => handleApplyTemplate(tpl)}
                          className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-main)] text-[11px] font-medium text-[var(--text-subtle)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] hover:bg-[var(--color-brand)]/5 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Plus size={11} className="text-[var(--color-brand)]" />
                          <span>{tpl.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Audience Segment Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[var(--text-primary)]">
                        Target Audience Segment *
                      </label>
                      <span className="text-[11px] font-medium text-[var(--text-muted)]">
                        {formAudience === 'all' && 'Broadcast to everyone registered'}
                        {formAudience === 'role' && 'Broadcast to specific user roles'}
                        {formAudience === 'specific' && 'Private broadcast to a single user'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Everyone */}
                      <button
                        type="button"
                        onClick={() => {
                          setFormAudience('all');
                          setFormSelectedUser(null);
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          formAudience === 'all'
                            ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/5 ring-1 ring-[var(--color-brand)] shadow-xs'
                            : 'border-[var(--border)] bg-[var(--bg-main)] hover:bg-[var(--bg-muted)]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Users
                            size={18}
                            className={
                              formAudience === 'all' ? 'text-[var(--color-brand)]' : 'text-[var(--text-muted)]'
                            }
                          />
                          {formAudience === 'all' && (
                            <Check size={16} className="text-[var(--color-brand)]" />
                          )}
                        </div>
                        <div className="text-xs font-bold text-[var(--text-primary)]">Everyone</div>
                        <div className="text-[10px] text-[var(--text-muted)]">All registered users</div>
                      </button>

                      {/* By Role */}
                      <button
                        type="button"
                        onClick={() => {
                          setFormAudience('role');
                          setFormSelectedUser(null);
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          formAudience === 'role'
                            ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/5 ring-1 ring-[var(--color-brand)] shadow-xs'
                            : 'border-[var(--border)] bg-[var(--bg-main)] hover:bg-[var(--bg-muted)]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Shield
                            size={18}
                            className={
                              formAudience === 'role' ? 'text-[var(--color-brand)]' : 'text-[var(--text-muted)]'
                            }
                          />
                          {formAudience === 'role' && (
                            <Check size={16} className="text-[var(--color-brand)]" />
                          )}
                        </div>
                        <div className="text-xs font-bold text-[var(--text-primary)]">By Role</div>
                        <div className="text-[10px] text-[var(--text-muted)]">Agents, builders...</div>
                      </button>

                      {/* Direct User (Separate User Broadcast) */}
                      <button
                        type="button"
                        onClick={() => {
                          setFormAudience('specific');
                          if (!formSelectedUser) setIsUserDropdownOpen(true);
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          formAudience === 'specific'
                            ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/5 ring-1 ring-[var(--color-brand)] shadow-xs'
                            : 'border-[var(--border)] bg-[var(--bg-main)] hover:bg-[var(--bg-muted)]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <User
                            size={18}
                            className={
                              formAudience === 'specific'
                                ? 'text-[var(--color-brand)]'
                                : 'text-[var(--text-muted)]'
                            }
                          />
                          {formAudience === 'specific' && (
                            <Check size={16} className="text-[var(--color-brand)]" />
                          )}
                        </div>
                        <div className="text-xs font-bold text-[var(--text-primary)]">Direct User</div>
                        <div className="text-[10px] text-[var(--text-muted)]">One specific member</div>
                      </button>
                    </div>

                    {/* Conditional: Role Selector */}
                    {formAudience === 'role' && (
                      <div className="pt-2 p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] space-y-2 animate-fade-in">
                        <label className="text-[11px] font-medium text-[var(--text-muted)] block">
                          Select Specific Platform Role:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {ROLE_OPTIONS.map((r) => {
                            const isSelected = formRole === r.value;
                            return (
                              <button
                                key={r.value}
                                type="button"
                                onClick={() => setFormRole(r.value)}
                                className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-2 cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-[var(--color-brand)] bg-[var(--color-brand)] text-white shadow-xs font-semibold'
                                    : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-subtle)] hover:bg-[var(--bg-muted)]'
                                }`}
                              >
                                <r.icon size={14} />
                                <span>{r.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Conditional: Direct User Selection Dropdown & Profile Preview */}
                    {formAudience === 'specific' && (
                      <div className="space-y-3 pt-2 animate-fade-in relative" ref={userDropdownRef}>
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                            <User size={14} className="text-[var(--color-brand)]" />
                            <span>Select Recipient Member *</span>
                          </label>
                          {formSelectedUser && (
                            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 size={12} />
                              <span>Member targeted</span>
                            </span>
                          )}
                        </div>

                        {/* If user is ALREADY selected: Show Selected User Profile Card with Switch and Deselect actions */}
                        {formSelectedUser ? (
                          <div className="p-4 rounded-2xl border border-[var(--color-brand)]/30 bg-[var(--color-brand)]/5 flex items-center justify-between gap-3 shadow-2xs transition-all">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-[var(--color-brand)] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                                {formSelectedUser.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                                    {formSelectedUser.name}
                                  </span>
                                  {formSelectedUser.isVerified && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                      <CheckCircle2 size={12} />
                                      Verified
                                    </span>
                                  )}
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-subtle)]">
                                    {formSelectedUser.role || 'user'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                                  {formSelectedUser.email || 'No email'}{formSelectedUser.phone ? ` • ${formSelectedUser.phone}` : ''}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                                className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
                              >
                                <ChevronDown size={13} className={`transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                                <span>Switch User</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormSelectedUser(null);
                                  setUserSearchTerm('');
                                  setIsUserDropdownOpen(true);
                                }}
                                className="p-2 rounded-xl text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors"
                                title="Deselect recipient"
                              >
                                <X size={15} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* If NO user selected: Show Dropdown Trigger Button */
                          <button
                            type="button"
                            onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                            className={`w-full h-11 px-3.5 rounded-xl border text-xs font-medium flex items-center justify-between cursor-pointer transition-all ${
                              isUserDropdownOpen
                                ? 'border-[var(--color-brand)] ring-1 ring-[var(--color-brand)] bg-[var(--bg-surface)] shadow-xs'
                                : 'border-[var(--border)] bg-[var(--bg-main)] hover:border-[var(--color-brand)]/50 text-[var(--text-subtle)]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Search size={15} className="text-[var(--text-muted)] shrink-0" />
                              <span className="text-[var(--text-muted)]">
                                Select recipient user from dropdown...
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 text-[var(--text-muted)]">
                              {availableUsers.length > 0 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] font-mono">
                                  {availableUsers.length} members
                                </span>
                              )}
                              <ChevronDown
                                size={15}
                                className={`transition-transform duration-200 ${
                                  isUserDropdownOpen ? 'rotate-180 text-[var(--color-brand)]' : ''
                                }`}
                              />
                            </div>
                          </button>
                        )}

                        {/* Floating / Anchored Dropdown Menu */}
                        {isUserDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full mt-2 z-40 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden animate-scale-up">
                            {/* Search & Role Filter Header */}
                            <div className="p-3 border-b border-[var(--border)] bg-[var(--bg-main)]/70 space-y-2.5">
                              <div className="relative">
                                <Search
                                  size={14}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                                />
                                <input
                                  type="text"
                                  autoFocus
                                  value={userSearchTerm}
                                  onChange={(e) => setUserSearchTerm(e.target.value)}
                                  placeholder="Search member by name, email, or phone..."
                                  className="w-full h-9 pl-9 pr-8 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-all"
                                />
                                {userSearchTerm && (
                                  <button
                                    type="button"
                                    onClick={() => setUserSearchTerm('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                                  >
                                    <X size={13} />
                                  </button>
                                )}
                              </div>

                              {/* Role Filter Chips */}
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                {['all', 'agent', 'builder', 'buyer', 'owner', 'tenant'].map((r) => (
                                  <button
                                    key={r}
                                    type="button"
                                    onClick={() => setUserRoleFilter(r)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold capitalize transition-all cursor-pointer shrink-0 ${
                                      userRoleFilter === r
                                        ? 'bg-[var(--color-brand)] text-white shadow-xs'
                                        : 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-subtle)] hover:text-[var(--text-primary)]'
                                    }`}
                                  >
                                    {r === 'all' ? 'All Roles' : `${r}s`}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* User List */}
                            <div className="max-h-60 overflow-y-auto divide-y divide-[var(--border)] custom-scrollbar">
                              {isLoadingUsers ? (
                                <div className="p-6 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                                  <RotateCw size={14} className="animate-spin text-[var(--color-brand)]" />
                                  <span>Loading platform members...</span>
                                </div>
                              ) : availableUsers.length === 0 ? (
                                <div className="p-6 text-center space-y-1">
                                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                                    No members found
                                  </div>
                                  <p className="text-[11px] text-[var(--text-muted)]">
                                    {userSearchTerm
                                      ? `No members match "${userSearchTerm}"`
                                      : 'No registered members in this category'}
                                  </p>
                                  {(userSearchTerm || userRoleFilter !== 'all') && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setUserSearchTerm('');
                                        setUserRoleFilter('all');
                                      }}
                                      className="text-[11px] font-semibold text-[var(--color-brand)] hover:underline pt-1 cursor-pointer inline-block"
                                    >
                                      Clear search filters
                                    </button>
                                  )}
                                </div>
                              ) : (
                                availableUsers.map((u) => {
                                  const isSelected = formSelectedUser?._id === u._id;
                                  return (
                                    <div
                                      key={u._id}
                                      onClick={() => {
                                        setFormSelectedUser(u);
                                        setIsUserDropdownOpen(false);
                                      }}
                                      className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                                        isSelected
                                          ? 'bg-[var(--color-brand)]/10 font-medium'
                                          : 'hover:bg-[var(--bg-muted)]'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--color-brand)]/15 text-[var(--color-brand)] font-bold text-xs flex items-center justify-center shrink-0">
                                          {u.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="text-xs font-semibold text-[var(--text-primary)] truncate flex items-center gap-1.5">
                                            <span>{u.name}</span>
                                            {u.isVerified && (
                                              <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                            )}
                                          </div>
                                          <div className="text-[11px] text-[var(--text-muted)] truncate">
                                            {u.email || u.phone || 'No direct contact'}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-subtle)] capitalize">
                                          {u.role || 'user'}
                                        </span>
                                        {isSelected && (
                                          <Check size={14} className="text-[var(--color-brand)] font-bold" />
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            {/* Dropdown footer */}
                            <div className="px-3.5 py-2 border-t border-[var(--border)] bg-[var(--bg-main)]/50 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                              <span>Showing {availableUsers.length} members</span>
                              <button
                                type="button"
                                onClick={() => setIsUserDropdownOpen(false)}
                                className="text-[var(--text-subtle)] hover:text-[var(--text-primary)] font-medium cursor-pointer"
                              >
                                Close
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Broadcast Category & Priority */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1.5">
                        Category Type *
                      </label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-main)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand)] cursor-pointer"
                      >
                        <option value="announcement">📢 Announcement</option>
                        <option value="system">⚙️ System Notice</option>
                        <option value="update">🚀 Feature Update</option>
                        <option value="alert">⚠️ Critical Alert</option>
                        <option value="promotional">🎉 Promotional / Offer</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1.5">
                        Priority Level
                      </label>
                      <select
                        value={formPriority}
                        onChange={(e) => setFormPriority(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-main)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand)] cursor-pointer"
                      >
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  {/* Subject Title */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-[var(--text-primary)]">
                        Subject / Title *
                      </label>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        {formTitle.length}/100
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={100}
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Scheduled Maintenance or Exclusive Festive Property Offer"
                      className="w-full h-11 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-main)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-all"
                      required
                    />
                  </div>

                  {/* Message Body */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-[var(--text-primary)]">
                        Message Body *
                      </label>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        {formMessage.length}/1000
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      maxLength={1000}
                      value={formMessage}
                      onChange={(e) => setFormMessage(e.target.value)}
                      placeholder="Write the broadcast message body clearly..."
                      className="w-full p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-main)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] resize-none leading-relaxed transition-all"
                      required
                    />
                  </div>

                  {/* Optional Action CTA Link */}
                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-main)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                        <ExternalLink size={14} className="text-[var(--color-brand)]" />
                        <span>Interactive Action Link (Optional)</span>
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        Clickable CTA button in notification
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          value={formActionLabel}
                          onChange={(e) => setFormActionLabel(e.target.value)}
                          placeholder="Button Label (e.g. View Properties)"
                          className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand)]"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={formActionUrl}
                          onChange={(e) => setFormActionUrl(e.target.value)}
                          placeholder="Action URL (e.g. /properties or https://...)"
                          className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand)] font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Simple, Clean & Minimal Live Preview */}
                <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
                  {/* Clean Minimal In-App Notification Preview */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-main)]/60 space-y-3 shadow-xs">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-[var(--text-primary)]">
                          Live In-App Preview
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-subtle)] truncate max-w-[180px]">
                        {formAudience === 'specific'
                          ? formSelectedUser
                            ? `👤 Direct: ${formSelectedUser.name}`
                            : '👤 Direct (No member)'
                          : formAudience === 'role'
                          ? `🛡️ Role: ${formRole}s`
                          : '🌐 All Users'}
                      </span>
                    </div>

                    {/* Clean Notification Card Simulator (Apple / Modern Drawer style) */}
                    <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xs space-y-2.5 transition-all">
                      {/* Top Row: Brand Mark, Time & Priority */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[var(--color-brand)] text-white font-bold text-[10px] flex items-center justify-center shadow-2xs">
                            G
                          </div>
                          <span className="text-xs font-bold text-[var(--text-primary)]">
                            GHARMB
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">• Just now</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {formPriority === 'urgent' && (
                            <Badge color="red" variant="pastel" size="2xs">
                              Urgent
                            </Badge>
                          )}
                          {formPriority === 'high' && (
                            <Badge color="amber" variant="pastel" size="2xs">
                              High
                            </Badge>
                          )}
                          <Badge
                            color={TYPE_CONFIG[formType]?.badgeColor || 'sky'}
                            variant="pastel"
                            size="2xs"
                          >
                            {TYPE_CONFIG[formType]?.label || 'Notice'}
                          </Badge>
                        </div>
                      </div>

                      {/* Title */}
                      <div className="text-xs font-bold text-[var(--text-primary)] leading-snug">
                        {formTitle.trim() || 'Announcement Subject Line'}
                      </div>

                      {/* Message Body */}
                      <div className="text-[11px] text-[var(--text-subtle)] leading-relaxed whitespace-pre-wrap">
                        {formMessage.trim() ||
                          'The broadcast notification message will be rendered cleanly in the recipient user’s notification center and push drawer.'}
                      </div>

                      {/* Optional CTA Button */}
                      {formActionUrl && (
                        <div className="pt-1">
                          <div className="w-full py-2 px-3 rounded-lg bg-[var(--color-brand)] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs">
                            <span>{formActionLabel.trim() || 'Open Link'}</span>
                            <ArrowRight size={13} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Simple, Minimal Delivery Protocol Note */}
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-0.5 px-0.5">
                      <span className="flex items-center gap-1.5">
                        <Lock size={12} className="text-emerald-500 shrink-0" />
                        <span>Direct platform feed delivery</span>
                      </span>
                      <span>Retractable anytime</span>
                    </div>
                  </div>

                  {/* Submission Buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleTabChange('history')}
                      disabled={submitting}
                      className="flex-1 h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-subtle)] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Back to History
                    </button>

                    <button
                      type="submit"
                      disabled={submitting || (formAudience === 'specific' && !formSelectedUser)}
                      className="flex-2 h-11 px-5 rounded-xl bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <RotateCw size={15} className="animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <>
                          <Send size={15} />
                          <span>
                            {formAudience === 'specific'
                              ? formSelectedUser
                                ? `Dispatch to ${formSelectedUser.name}`
                                : 'Select User to Dispatch'
                              : `Dispatch to ~${audienceEstimate.toLocaleString()} Users`}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. BROADCAST DETAIL / INSPECTION MODAL */}
      {/* ========================================================================= */}
      {selectedBroadcast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedBroadcast(null)}
          />

          <div className="relative w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl z-10 overflow-hidden animate-scale-up">
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--color-brand)]/10 text-[var(--color-brand)] flex items-center justify-center">
                  <Eye size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Broadcast Inspector
                  </h3>
                  <span className="text-[11px] text-[var(--text-muted)] font-mono">
                    ID: {selectedBroadcast._id}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBroadcast(null)}
                className="w-8 h-8 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Type, Priority & Time */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Badge
                    color={TYPE_CONFIG[selectedBroadcast.type]?.badgeColor || 'sky'}
                    variant="pastel"
                    size="xs"
                  >
                    {TYPE_CONFIG[selectedBroadcast.type]?.label || 'Notice'}
                  </Badge>
                  {selectedBroadcast.priority && selectedBroadcast.priority !== 'normal' && (
                    <Badge
                      color={selectedBroadcast.priority === 'urgent' ? 'red' : 'amber'}
                      variant="pastel"
                      size="xs"
                    >
                      {selectedBroadcast.priority}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                  <Calendar size={12} />
                  {formatFullDate(selectedBroadcast.createdAt)}
                </span>
              </div>

              {/* Title & Body */}
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-[var(--text-primary)]">
                  {selectedBroadcast.title}
                </h4>
                <p className="text-xs text-[var(--text-subtle)] leading-relaxed whitespace-pre-wrap p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)]">
                  {selectedBroadcast.message}
                </p>
              </div>

              {/* Audience & Delivery Metrics */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-main)] space-y-1">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
                    Target Audience
                  </span>
                  <div className="text-xs font-bold text-[var(--text-primary)] capitalize">
                    {selectedBroadcast.targetAudience === 'all' && '🌐 Everyone (All Platform)'}
                    {selectedBroadcast.targetAudience === 'role' && `🛡️ Role: ${selectedBroadcast.targetRole}s`}
                    {selectedBroadcast.targetAudience === 'specific' && `👤 Direct: ${selectedBroadcast.targetUser?.name || 'User'}`}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-main)] space-y-1">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
                    Recipient Count
                  </span>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    👥 {(selectedBroadcast.recipientCount || 0).toLocaleString()} users delivered
                  </div>
                </div>
              </div>

              {/* Action Link if Present */}
              {selectedBroadcast.actionUrl && (
                <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-main)] space-y-1">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
                    Attached Action URL
                  </span>
                  <a
                    href={selectedBroadcast.actionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-[var(--color-brand)] hover:underline flex items-center gap-1.5"
                  >
                    <ExternalLink size={12} />
                    <span>{selectedBroadcast.actionUrl}</span>
                    {selectedBroadcast.actionLabel && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
                        {selectedBroadcast.actionLabel}
                      </span>
                    )}
                  </a>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-main)] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirm({
                    isOpen: true,
                    id: selectedBroadcast._id,
                    title: selectedBroadcast.title,
                    loading: false,
                  });
                }}
                className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Delete & Retract</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyContent(selectedBroadcast)}
                  className="px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-subtle)] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy size={13} />
                  <span>Copy</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDuplicateToComposer(selectedBroadcast)}
                  className="px-4 py-2 rounded-xl bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RotateCw size={13} />
                  <span>Duplicate to Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DELETE & RETRACT CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => !deleteConfirm.loading && setDeleteConfirm({ isOpen: false, id: null, title: '', loading: false })}
          />

          <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl z-10 p-6 space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
              <Trash2 size={22} />
            </div>

            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Delete & Retract Broadcast?
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                Are you sure you want to delete <strong className="text-[var(--text-primary)]">"{deleteConfirm.title}"</strong>?
                This action will also retract and remove this message from all recipients' notifications feeds.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ isOpen: false, id: null, title: '', loading: false })}
                disabled={deleteConfirm.loading}
                className="flex-1 h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-subtle)] text-xs font-semibold transition-colors cursor-pointer"
              >
                Keep Broadcast
              </button>
              <button
                type="button"
                onClick={handleDeleteBroadcast}
                disabled={deleteConfirm.loading}
                className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleteConfirm.loading ? (
                  <>
                    <RotateCw size={14} className="animate-spin" />
                    <span>Retracting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Yes, Retract & Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
