import { useState, useEffect, useMemo, useCallback } from 'react';
import AdminLoader from '../components/common/AdminLoader';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api/api';
import Badge from '../components/ui/Badge';
import {
  Bell,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  User,
  Calendar,
  Coins,
  Check,
  Copy,
  Trash2,
  X,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  MessageSquare
} from 'lucide-react';

const AdminNotifications = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Navigation / Filter States
  const [activeTab, setActiveTab] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Data States
  const [notifications, setNotifications] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    unread: 0,
    enquiries: 0,
    visits: 0,
    tokens: 0,
    verifications: 0,
    system: 0,
  });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Drawer & Modal States
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Action Dialog State (Accept / Decline with Note for Visit/Token)
  const [actionDialog, setActionDialog] = useState({
    show: false,
    action: 'accept',
    notif: null,
    targetType: '',
    targetId: '',
    note: '',
  });

  // Toast feedback
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message, type: 'success' });
    }, 3000);
  };

  // Format Relative Time
  const formatTime = (dateString) => {
    if (!dateString) return '—';
    const diffMs = new Date() - new Date(dateString);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Format Full Date Time
  const formatFullDate = (dateString) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (_) {
      return String(dateString);
    }
  };

  // Fetch Notification Logs
  const fetchNotificationLogs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const response = await API.get('/admin/notifications');
      const data = response.data;
      if (data?.status === 'success') {
        const notifList = data.data.notifications || [];
        setNotifications(notifList);
        if (data.counts) {
          setCounts(data.counts);
        } else {
          setCounts({
            total: notifList.length,
            unread: notifList.filter((n) => !n.isRead).length,
            enquiries: notifList.filter((n) => n.type === 'enquiry').length,
            visits: notifList.filter((n) => n.type === 'visit_booking').length,
            tokens: notifList.filter((n) => n.type === 'token_request').length,
            verifications: notifList.filter((n) => n.type === 'verification').length,
            system: notifList.filter((n) => n.type === 'system').length,
          });
        }
      } else {
        setError(data?.message || 'Failed to fetch notifications.');
      }
    } catch (err) {
      console.error('API logs fetch failed:', err);
      setError(err?.response?.data?.message || 'Could not connect to database.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotificationLogs();
  }, [fetchNotificationLogs]);

  // Handle deep-linking by ID from notification clicks
  useEffect(() => {
    const targetId = searchParams.get('id');
    if (targetId && notifications.length > 0) {
      const found = notifications.find(n => n._id === targetId);
      if (found) {
        setSelectedNotif(found);
      }
    }
  }, [searchParams, notifications]);

  // Mark Single Notification Read / Unread
  const handleToggleRead = async (notif, e) => {
    if (e) e.stopPropagation();
    const newStatus = !notif.isRead;
    try {
      await API.patch(`/admin/notifications/${notif._id}/read`, { isRead: newStatus });
      setNotifications((prev) =>
        prev.map((item) => (item._id === notif._id ? { ...item, isRead: newStatus } : item))
      );
      setCounts((prev) => ({
        ...prev,
        unread: Math.max(0, prev.unread + (newStatus ? -1 : 1)),
      }));
      if (selectedNotif && selectedNotif._id === notif._id) {
        setSelectedNotif((prev) => ({ ...prev, isRead: newStatus }));
      }
      triggerToast(newStatus ? 'Marked as read' : 'Marked as unread');
    } catch (err) {
      console.error('Error toggling read state:', err);
    }
  };

  // Mark All Notifications Read
  const handleMarkAllRead = async () => {
    try {
      await API.post('/admin/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setCounts((prev) => ({ ...prev, unread: 0 }));
      triggerToast('All marked as read');
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Delete Single Notification
  const handleDeleteNotif = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await API.delete(`/admin/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (selectedNotif && selectedNotif._id === id) {
        setSelectedNotif(null);
      }
      triggerToast('Notification removed');
      fetchNotificationLogs(true);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Clear All Notifications
  const handleClearAll = async () => {
    try {
      await API.delete('/admin/notifications/clear-all');
      setNotifications([]);
      setShowClearConfirm(false);
      setSelectedNotif(null);
      setCounts({ total: 0, unread: 0, enquiries: 0, visits: 0, tokens: 0, verifications: 0, system: 0 });
      triggerToast('History cleared');
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  // Open Action Modal for Accept / Decline
  const openActionPrompt = (notif, action, e) => {
    if (e) e.stopPropagation();
    const meta = notif.metadata || {};
    const visitReqId = meta.visitRequestId?._id || meta.visitRequestId;
    const tokenReqId = meta.tokenRequestId?._id || meta.tokenRequestId;

    if (visitReqId) {
      setActionDialog({
        show: true,
        action,
        notif,
        targetType: 'visit',
        targetId: visitReqId,
        note: action === 'accept'
          ? 'Confirmed by Admin. You are welcome to visit on the scheduled time.'
          : 'Declined by Admin. Please select another slot or reach out to support.',
      });
    } else if (tokenReqId) {
      setActionDialog({
        show: true,
        action,
        notif,
        targetType: 'token',
        targetId: tokenReqId,
        note: action === 'accept'
          ? 'Booking approved by GharMB Admin.'
          : 'Booking request declined by GharMB Admin.',
      });
    }
  };

  // Confirm Decision (Accept / Decline)
  const handleConfirmDecision = async () => {
    const { action, targetType, targetId, note, notif } = actionDialog;
    if (!targetId) return;

    setActionLoading(true);
    try {
      let endpoint = '';
      let payload = {};

      if (targetType === 'visit') {
        endpoint = `/admin/visit-requests/${targetId}/${action === 'accept' ? 'accept' : 'reject'}`;
        payload = action === 'accept'
          ? { adminNote: note }
          : { adminNote: note, reason: note };
      } else if (targetType === 'token') {
        endpoint = `/admin/tokens/${targetId}/status`;
        payload = {
          action: action === 'accept' ? 'accept' : 'reject',
          notes: note,
        };
      }

      const response = await API.patch(endpoint, payload);
      const data = response.data;
      if (data?.status === 'success') {
        triggerToast(action === 'accept' ? 'Request accepted' : 'Request declined');
        if (notif && !notif.isRead) handleToggleRead(notif);
        setActionDialog({ show: false, action: 'accept', notif: null, targetType: '', targetId: '', note: '' });
        fetchNotificationLogs(true);
      } else {
        triggerToast(data?.message || 'Operation failed', 'error');
      }
    } catch (err) {
      console.error('Decision execution error:', err);
      triggerToast(err?.response?.data?.message || 'Network error', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Clipboard Copy Helper
  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    triggerToast(`Copied ${fieldName}`);
    setTimeout(() => setCopiedField(null), 1800);
  };

  // Meta & Icons for Notification Categories
  const getCategoryMeta = (type) => {
    switch (type) {
      case 'verification':
        return {
          label: 'KYC / Agent',
          color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
          badgeColor: 'purple',
          icon: <ShieldCheck size={13} className="text-purple-500" />,
        };
      case 'token_request':
        return {
          label: 'Token',
          color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
          badgeColor: 'amber',
          icon: <Coins size={13} className="text-amber-500" />,
        };
      case 'visit_booking':
        return {
          label: 'Site Visit',
          color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          badgeColor: 'emerald',
          icon: <Calendar size={13} className="text-emerald-500" />,
        };
      case 'enquiry':
        return {
          label: 'Enquiry',
          color: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20',
          badgeColor: 'sky',
          icon: <MessageSquare size={13} className="text-sky-500" />,
        };
      default:
        return {
          label: 'System',
          color: 'text-zinc-600 dark:text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
          badgeColor: 'slate',
          icon: <Bell size={13} className="text-zinc-500" />,
        };
    }
  };

  // Helper to extract client details
  const getClientInfo = (notif) => {
    const meta = notif.metadata || {};
    const cd = meta.clientDetails || {};
    const sender = notif.sender || {};
    const recipient = notif.recipient || {};
    const visitReq = meta.visitRequestId || {};
    const tokenReq = meta.tokenRequestId || {};

    const name =
      cd.name ||
      sender.name ||
      visitReq.userDetails?.name ||
      tokenReq.personalDetails?.fullName ||
      (notif.type !== 'system' ? recipient.name : '') ||
      '';

    const phone =
      cd.phone ||
      sender.phone ||
      visitReq.userDetails?.phone ||
      tokenReq.personalDetails?.mobileNumber ||
      recipient.phone ||
      '';

    const email =
      cd.email ||
      sender.email ||
      visitReq.userDetails?.email ||
      tokenReq.personalDetails?.email ||
      recipient.email ||
      '';

    return { name, phone, email };
  };

  // Filtered & Sorted Notification List
  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((notif) => {
        // Exclude all broadcast messages
        if (notif.metadata?.broadcastId || notif.broadcastId || notif.type === 'broadcast') {
          return false;
        }

        if (activeTab === 'unread' && notif.isRead) return false;
        if (activeTab === 'enquiry' && notif.type !== 'enquiry') return false;
        if (activeTab === 'verification' && notif.type !== 'verification') return false;
        if (activeTab === 'visit_booking' && notif.type !== 'visit_booking') return false;
        if (activeTab === 'token_request' && notif.type !== 'token_request') return false;
        if (activeTab === 'system' && notif.type !== 'system') return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const client = getClientInfo(notif);
          const propTitle = notif.metadata?.propertyId?.title || notif.metadata?.projectId?.projectName || '';
          const matches =
            (notif.title || '').toLowerCase().includes(q) ||
            (notif.message || '').toLowerCase().includes(q) ||
            client.name.toLowerCase().includes(q) ||
            client.phone.toLowerCase().includes(q) ||
            client.email.toLowerCase().includes(q) ||
            propTitle.toLowerCase().includes(q);
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime() || 0;
        const dateB = new Date(b.createdAt).getTime() || 0;
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [notifications, activeTab, sortOrder, searchQuery]);

  return (
    <div className="w-full space-y-3 pb-16 select-none animate-fadeIn">
      {/* Toast Feedback */}
      {toast.show && (
        <div
          className={`fixed bottom-5 right-5 z-50 py-2 px-3.5 rounded-lg shadow-md flex items-center gap-2 text-xs font-medium border backdrop-blur-md transition-all ${
            toast.type === 'success'
              ? 'bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 border-zinc-800'
              : 'bg-rose-950/90 text-rose-200 border-rose-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="text-emerald-400 shrink-0" size={13} />
          ) : (
            <AlertTriangle className="text-rose-400 shrink-0" size={13} />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="py-2 px-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="shrink-0 text-rose-500" size={14} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => { setError(null); fetchNotificationLogs(); }}
            className="px-2 py-0.5 bg-rose-500 text-white rounded text-[11px] font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Sleek Compact Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-[var(--text-primary)]">
              Notifications & Alerts
            </h1>
            {counts.unread > 0 ? (
              <Badge color="brand" variant="pastel" size="xs">
                {counts.unread} unread
              </Badge>
            ) : (
              <Badge color="slate" variant="pastel" size="xs">
                Up to date
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Platform activity, KYC verification requests, and system alert logs.
          </p>
        </div>

        {/* Compact Header Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            id="refresh-notifs-btn"
            onClick={() => fetchNotificationLogs()}
            disabled={loading}
            className="w-7 h-7 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] rounded-lg border border-[var(--border)] transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin text-brand' : ''} />
          </button>

          {counts.unread > 0 && (
            <button
              type="button"
              id="mark-all-read-btn"
              onClick={handleMarkAllRead}
              className="h-7 px-2.5 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] rounded-lg border border-[var(--border)] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={12} className="text-emerald-500" />
              <span>Mark Read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              id="clear-all-notifs-btn"
              onClick={() => setShowClearConfirm(true)}
              className="h-7 px-2 text-[11px] font-medium text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg border border-[var(--border)] transition-colors flex items-center gap-1 cursor-pointer"
              title="Clear all alerts"
            >
              <Trash2 size={12} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Slim Metric Strip (Linear / Vercel style - Compact Height) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="py-2 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Total Alerts</span>
            <p className="text-sm font-bold text-[var(--text-primary)] leading-tight mt-0.5">{counts.total}</p>
          </div>
          <Bell size={14} className="text-[var(--text-muted)]" />
        </div>

        <div
          onClick={() => setActiveTab('unread')}
          className="py-2 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-between cursor-pointer hover:border-brand/40 transition-colors"
        >
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-brand">Unread</span>
            <p className="text-sm font-bold text-brand leading-tight mt-0.5">{counts.unread}</p>
          </div>
          <Sparkles size={14} className="text-brand" />
        </div>

        <div
          onClick={() => setActiveTab('verification')}
          className="py-2 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-between cursor-pointer hover:border-purple-500/40 transition-colors"
        >
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">KYC & Agent</span>
            <p className="text-sm font-bold text-purple-600 dark:text-purple-400 leading-tight mt-0.5">{counts.verifications || 0}</p>
          </div>
          <ShieldCheck size={14} className="text-purple-500" />
        </div>

        <div
          onClick={() => setActiveTab('system')}
          className="py-2 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-between cursor-pointer hover:border-zinc-500/40 transition-colors"
        >
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">System Logs</span>
            <p className="text-sm font-bold text-[var(--text-primary)] leading-tight mt-0.5">{counts.system || 0}</p>
          </div>
          <Layers size={14} className="text-[var(--text-muted)]" />
        </div>
      </div>

      {/* Slim Filter Strip & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {/* Category Segmented Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar">
          {[
            { id: 'all', label: 'All', count: counts.total },
            { id: 'unread', label: 'Unread', count: counts.unread },
            { id: 'enquiry', label: 'Inquiries', count: counts.enquiries || 0 },
            { id: 'visit_booking', label: 'Visits', count: counts.visits || 0 },
            { id: 'token_request', label: 'Tokens', count: counts.tokens || 0 },
            { id: 'verification', label: 'KYC', count: counts.verifications || 0 },
            { id: 'system', label: 'System', count: counts.system || 0 },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                id={`tab-notifs-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`h-7 px-2.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[var(--text-primary)] text-[var(--bg-surface)] font-semibold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                    isActive
                      ? 'bg-[var(--bg-surface)]/20 text-[var(--bg-surface)]'
                      : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Compact Search & Sort */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              id="search-notifs-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alerts..."
              className="w-48 sm:w-60 h-7 pl-7 pr-6 text-[11px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:ring-1 focus:ring-brand/50 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 rounded cursor-pointer"
              >
                <X size={11} />
              </button>
            )}
          </div>

          <select
            id="sort-notifs-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="h-7 px-2 text-[11px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-hidden cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      {/* Notifications List (Compact Height - ~44px per item) */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center">
          <AdminLoader size="sm" />
          <p className="text-[11px] text-[var(--text-muted)] mt-2">Loading alerts...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="py-10 text-center border border-[var(--border)] border-dashed rounded-xl bg-[var(--bg-surface)] p-4">
          <Bell size={18} className="text-[var(--text-muted)] mx-auto mb-1.5" />
          <p className="text-xs font-semibold text-[var(--text-primary)]">No notifications</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {searchQuery || activeTab !== 'all' ? 'No alerts match your filter.' : 'All caught up!'}
          </p>
        </div>
      ) : (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-xs overflow-hidden">
          <div className="divide-y divide-[var(--border)]">
            {filteredNotifications.map((notif) => {
              const meta = getCategoryMeta(notif.type);
              const client = getClientInfo(notif);
              const isSelected = selectedNotif?._id === notif._id;
              const isEnquiry = notif.type === 'enquiry';
              const hasActionPending =
                (notif.type === 'visit_booking' || notif.type === 'token_request') &&
                (notif.metadata?.visitRequestId?.status === 'pending' ||
                  notif.metadata?.tokenRequestId?.status === 'pending');

              return (
                <div
                  key={notif._id}
                  id={`notif-item-${notif._id}`}
                  onClick={() => setSelectedNotif(notif)}
                  className={`py-2 px-3 hover:bg-[var(--bg-muted)]/50 transition-all cursor-pointer flex items-center justify-between gap-2.5 group ${
                    isSelected ? 'bg-brand/5 dark:bg-brand/10' : ''
                  } ${!notif.isRead ? 'bg-brand/[0.02]' : ''}`}
                >
                  {/* Left: Unread dot + Compact Category Icon */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Unread dot */}
                    <div className="w-1.5 flex justify-center shrink-0">
                      {!notif.isRead ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand" title="Unread" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                      )}
                    </div>

                    {/* Small Icon Badge */}
                    <div
                      className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${meta.color}`}
                    >
                      {meta.icon}
                    </div>

                    {/* Compact Title & Text Snippet */}
                    <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`text-xs truncate ${
                            notif.isRead ? 'font-medium text-[var(--text-primary)]' : 'font-bold text-[var(--text-primary)]'
                          }`}
                        >
                          {notif.title}
                        </span>

                        <Badge color={meta.badgeColor} variant="pastel" size="2xs" className="shrink-0">
                          {meta.label}
                        </Badge>
                      </div>

                      {/* Snippet truncate */}
                      <span className="text-[11px] text-[var(--text-muted)] truncate max-w-md hidden md:inline">
                        • {notif.message}
                      </span>
                    </div>
                  </div>

                  {/* Right: Metadata & Actions */}
                  <div
                    className="flex items-center gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* If enquiry, 1-click button to Enquiries */}
                    {isEnquiry && (
                      <button
                        type="button"
                        onClick={() => navigate('/admin/enquiries')}
                        className="h-6 px-2 text-[10px] font-semibold text-brand bg-brand/5 hover:bg-brand/10 border border-brand/20 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                        title="Open Enquiries"
                      >
                        <ExternalLink size={10} />
                        <span className="hidden sm:inline">Enquiries</span>
                      </button>
                    )}

                    {/* Inline Accept/Decline */}
                    {hasActionPending && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => openActionPrompt(notif, 'accept', e)}
                          className="h-6 px-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-md transition-colors cursor-pointer"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={(e) => openActionPrompt(notif, 'decline', e)}
                          className="h-6 px-2 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-md transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {/* Client name if present */}
                    {client.name && (
                      <span className="text-[10px] text-[var(--text-muted)] hidden lg:inline max-w-[100px] truncate">
                        {client.name}
                      </span>
                    )}

                    {/* Timestamp */}
                    <span className="text-[10px] text-[var(--text-muted)] w-14 text-right">
                      {formatTime(notif.createdAt)}
                    </span>

                    {/* Read Toggle */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleRead(notif, e)}
                      className={`p-1 rounded transition-colors cursor-pointer ${
                        notif.isRead
                          ? 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          : 'text-brand hover:bg-brand/10'
                      }`}
                      title={notif.isRead ? 'Mark unread' : 'Mark read'}
                    >
                      <Check size={13} />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteNotif(notif._id, e)}
                      className="p-1 text-[var(--text-muted)] hover:text-rose-500 rounded transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>

                    {/* Open Arrow */}
                    <ChevronRight
                      size={14}
                      className="text-[var(--text-muted)] group-hover:text-brand group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Slide-Over Drawer: Details */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setSelectedNotif(null)}
          />

          <div className="relative w-full max-w-md bg-[var(--bg-surface)] border-l border-[var(--border)] shadow-2xl h-full flex flex-col z-10 animate-slide-down">
            {/* Header */}
            <div className="py-3 px-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--bg-muted)]/30">
              <div className="flex items-center gap-2">
                <Badge color={getCategoryMeta(selectedNotif.type).badgeColor} variant="pastel" size="xs">
                  {getCategoryMeta(selectedNotif.type).label}
                </Badge>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {formatFullDate(selectedNotif.createdAt)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotif(null)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              <div className="space-y-1.5">
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  {selectedNotif.title}
                </h3>
                <div className="p-3 rounded-xl bg-[var(--bg-muted)]/40 border border-[var(--border)] text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                  {selectedNotif.message}
                </div>
              </div>

              {/* Client info */}
              {(() => {
                const client = getClientInfo(selectedNotif);
                if (!client.name && !client.phone && !client.email) return null;
                return (
                  <div className="p-3 rounded-xl bg-[var(--bg-muted)]/30 border border-[var(--border)] space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      User Details
                    </span>
                    <div className="space-y-1 text-xs">
                      {client.name && (
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Name</span>
                          <span className="font-semibold text-[var(--text-primary)]">{client.name}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Phone</span>
                          <span
                            onClick={() => handleCopy(client.phone, 'phone')}
                            className="font-medium text-[var(--text-primary)] hover:text-brand cursor-pointer flex items-center gap-1"
                          >
                            {client.phone}
                            <Copy size={10} />
                          </span>
                        </div>
                      )}
                      {client.email && (
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Email</span>
                          <span
                            onClick={() => handleCopy(client.email, 'email')}
                            className="font-medium text-[var(--text-primary)] hover:text-brand cursor-pointer flex items-center gap-1 truncate max-w-[180px]"
                          >
                            {client.email}
                            <Copy size={10} />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* If enquiry, switch to Enquiries */}
              {selectedNotif.type === 'enquiry' && (
                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs space-y-2">
                  <p className="text-[11px] text-[var(--text-subtle)]">
                    This alert is tied to a client enquiry. Manage status, follow-up notes, and call links directly in Enquiries.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNotif(null);
                      navigate('/admin/enquiries');
                    }}
                    className="w-full py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Open in Enquiries</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              )}

              {/* Visit / Token Actions */}
              {(selectedNotif.type === 'visit_booking' || selectedNotif.type === 'token_request') && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Request Actions
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={(e) => openActionPrompt(selectedNotif, 'accept', e)}
                      className="py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Check size={13} />
                      <span>Accept</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => openActionPrompt(selectedNotif, 'decline', e)}
                      className="py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <X size={13} />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="py-2.5 px-4 border-t border-[var(--border)] bg-[var(--bg-muted)]/30 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={(e) => handleDeleteNotif(selectedNotif._id, e)}
                className="px-2.5 py-1 text-xs font-medium text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedNotif(null)}
                className="px-3 py-1 text-xs font-medium bg-[var(--bg-muted)] hover:bg-[var(--border)] text-[var(--text-primary)] rounded-md transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decision Dialog */}
      {actionDialog.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => !actionLoading && setActionDialog({ ...actionDialog, show: false })}
          />
          <div className="relative w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-xl p-4 space-y-3 z-10 animate-slide-down">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">
              {actionDialog.action === 'accept' ? 'Accept Request' : 'Decline Request'}
            </h3>

            <textarea
              rows={2}
              value={actionDialog.note}
              onChange={(e) => setActionDialog({ ...actionDialog, note: e.target.value })}
              placeholder="Admin note for the customer..."
              className="w-full p-2 text-xs bg-[var(--bg-muted)]/60 border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-brand/50 resize-none"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setActionDialog({ ...actionDialog, show: false })}
                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-muted)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmDecision}
                className={`px-3 py-1 text-xs font-bold text-white rounded-lg transition-all cursor-pointer disabled:opacity-50 ${
                  actionDialog.action === 'accept' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'
                }`}
              >
                {actionLoading ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setShowClearConfirm(false)}
          />
          <div className="relative w-full max-w-xs bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-xl p-4 space-y-3 z-10 animate-slide-down">
            <div className="flex items-center gap-2">
              <Trash2 size={16} className="text-rose-500" />
              <h3 className="text-xs font-bold text-[var(--text-primary)]">Clear All History?</h3>
            </div>
            <p className="text-[11px] text-[var(--text-subtle)]">
              This will remove all notification records permanently.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-muted)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-1 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-lg cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
