import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Send,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Info,
  Layers,
  User,
  MessageSquare,
  Calendar,
  Coins,
  Building2,
  Check,
  Copy,
  Trash2,
  X,
  Phone,
  PhoneCall,
  CheckCheck,
  XCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Inbox,
  FilterX,
  MessageCircle,
  Radio
} from 'lucide-react';

const AdminNotifications = () => {
  const navigate = useNavigate();

  // Navigation / Filter States
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'enquiry' | 'visit_booking' | 'token_request' | 'verification' | 'system'
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'
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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Drawer & Modal States
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Action Dialog State (Accept / Decline with Note)
  const [actionDialog, setActionDialog] = useState({
    show: false,
    action: 'accept', // 'accept' | 'decline'
    notif: null,
    targetType: '', // 'visit' | 'token'
    targetId: '',
    note: '',
  });

  const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const API_BASE = RAW_API_URL.replace(/\/+api\/?$/i, '').replace(/\/+$/, '');

  // Broadcast Form State
  const [formData, setFormData] = useState({
    recipientType: 'all',
    recipientId: '',
    title: '',
    message: '',
    type: 'system',
  });

  // Toast feedback
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3500);
  };

  // Helper: Format Relative Time
  const formatTime = (dateString) => {
    if (!dateString) return 'Just now';
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

  // Helper: Format Full Date Time
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

  // Fetch Users for targeted broadcast selector
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        setUsers(data.data.users || []);
      }
    } catch (err) {
      console.warn('API users fetch failed:', err);
    }
  };

  // Fetch Notification Logs from Server
  const fetchNotificationLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
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
        setError(data.message || 'Failed to fetch notification logs.');
      }
    } catch (err) {
      console.error('API logs fetch failed:', err);
      setError('Could not connect to database. Make sure backend server is running.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchNotificationLogs();
  }, []);

  // Mark Single Notification Read / Unread
  const handleToggleRead = async (notif, e) => {
    if (e) e.stopPropagation();
    const newStatus = !notif.isRead;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/admin/notifications/${notif._id}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isRead: newStatus }),
      });
      if (response.ok) {
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
      }
    } catch (err) {
      console.error('Error toggling read state:', err);
    }
  };

  // Mark All Notifications Read
  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/admin/notifications/mark-all-read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setCounts((prev) => ({ ...prev, unread: 0 }));
        triggerToast('All marked as read');
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Delete Single Notification
  const handleDeleteNotif = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/admin/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        if (selectedNotif && selectedNotif._id === id) {
          setSelectedNotif(null);
        }
        triggerToast('Notification deleted');
        fetchNotificationLogs(true);
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Clear All Notifications
  const handleClearAll = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/admin/notifications/clear-all`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setNotifications([]);
        setShowClearConfirm(false);
        setSelectedNotif(null);
        setCounts({ total: 0, unread: 0, enquiries: 0, visits: 0, tokens: 0, system: 0 });
        triggerToast('Notification history cleared');
      }
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
    } else {
      triggerToast('No linked schedule or token booking found.', 'error');
    }
  };

  // Confirm Decision (Accept / Decline)
  const handleConfirmDecision = async () => {
    const { action, targetType, targetId, note, notif } = actionDialog;
    if (!targetId) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      let url = '';
      let payload = {};

      if (targetType === 'visit') {
        url = `${API_BASE}/api/admin/visit-requests/${targetId}/${action === 'accept' ? 'accept' : 'reject'}`;
        payload = action === 'accept'
          ? { adminNote: note }
          : { adminNote: note, reason: note };
      } else if (targetType === 'token') {
        url = `${API_BASE}/api/admin/tokens/${targetId}/status`;
        payload = {
          action: action === 'accept' ? 'accept' : 'reject',
          notes: note,
        };
      }

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok && data.status === 'success') {
        triggerToast(
          action === 'accept' ? 'Request accepted and user notified' : 'Request declined and user notified'
        );

        if (notif && !notif.isRead) {
          handleToggleRead(notif);
        }

        setNotifications((prev) =>
          prev.map((item) => {
            if (item._id === notif?._id) {
              const updatedMeta = { ...item.metadata };
              if (targetType === 'visit' && updatedMeta.visitRequestId) {
                if (typeof updatedMeta.visitRequestId === 'object') {
                  updatedMeta.visitRequestId.status = action === 'accept' ? 'accepted' : 'rejected';
                }
              }
              if (targetType === 'token' && updatedMeta.tokenRequestId) {
                if (typeof updatedMeta.tokenRequestId === 'object') {
                  updatedMeta.tokenRequestId.status = action === 'accept' ? 'accepted' : 'rejected';
                }
              }
              return { ...item, metadata: updatedMeta, isRead: true };
            }
            return item;
          })
        );

        if (selectedNotif && selectedNotif._id === notif?._id) {
          setSelectedNotif((prev) => {
            if (!prev) return null;
            const updatedMeta = { ...prev.metadata };
            if (targetType === 'visit' && updatedMeta.visitRequestId) {
              if (typeof updatedMeta.visitRequestId === 'object') {
                updatedMeta.visitRequestId.status = action === 'accept' ? 'accepted' : 'rejected';
              }
            }
            if (targetType === 'token' && updatedMeta.tokenRequestId) {
              if (typeof updatedMeta.tokenRequestId === 'object') {
                updatedMeta.tokenRequestId.status = action === 'accept' ? 'accepted' : 'rejected';
              }
            }
            return { ...prev, metadata: updatedMeta, isRead: true };
          });
        }

        setActionDialog({ show: false, action: 'accept', notif: null, targetType: '', targetId: '', note: '' });
        fetchNotificationLogs(true);
      } else {
        triggerToast(data.message || 'Operation failed.', 'error');
      }
    } catch (err) {
      console.error('Decision execution error:', err);
      triggerToast('Network error while processing.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Broadcast Notification
  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      triggerToast('Please provide a title and message body', 'error');
      return;
    }
    if (formData.recipientType === 'specific' && !formData.recipientId) {
      triggerToast('Please select a recipient user', 'error');
      return;
    }

    setSubmitting(true);
    const payload = {
      title: formData.title.trim(),
      message: formData.message.trim(),
      type: formData.type,
      recipientId: formData.recipientType === 'specific' ? formData.recipientId : undefined,
    };

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/admin/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        triggerToast('Notification sent successfully');
        setFormData({
          recipientType: 'all',
          recipientId: '',
          title: '',
          message: '',
          type: 'system',
        });
        setShowBroadcastModal(false);
        fetchNotificationLogs(true);
      } else {
        triggerToast(data.message || 'Failed to dispatch notification', 'error');
      }
    } catch (err) {
      console.error('API dispatch failed:', err);
      triggerToast('Network error while dispatching', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Clipboard Copy Helper
  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1800);
  };

  // Clean Meta & Colors for Categories
  const getCategoryMeta = (type) => {
    switch (type) {
      case 'enquiry':
        return {
          label: 'Enquiry',
          color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900',
          icon: <MessageSquare size={15} className="text-sky-500" />,
        };
      case 'visit_booking':
        return {
          label: 'Site Visit',
          color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
          icon: <Calendar size={15} className="text-emerald-500" />,
        };
      case 'token_request':
        return {
          label: 'Token',
          color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
          icon: <Coins size={15} className="text-amber-500" />,
        };
      case 'verification':
        return {
          label: 'Verification',
          color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900',
          icon: <ShieldCheck size={15} className="text-purple-500" />,
        };
      default:
        return {
          label: 'System',
          color: 'text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700',
          icon: <Bell size={15} className="text-zinc-500 dark:text-zinc-400" />,
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
        if (activeTab === 'enquiry' && notif.type !== 'enquiry') return false;
        if (activeTab === 'visit_booking' && notif.type !== 'visit_booking') return false;
        if (activeTab === 'token_request' && notif.type !== 'token_request') return false;
        if (activeTab === 'verification' && notif.type !== 'verification') return false;
        if (activeTab === 'system' && notif.type !== 'system') return false;

        if (unreadOnly && notif.isRead) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const client = getClientInfo(notif);
          const propTitle = notif.metadata?.propertyId?.title || '';
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
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [notifications, activeTab, unreadOnly, sortOrder, searchQuery]);

  // Tab Definitions
  const tabs = [
    { id: 'all', label: 'All', count: counts.total },
    { id: 'enquiry', label: 'Enquiries', count: counts.enquiries },
    { id: 'visit_booking', label: 'Site Visits', count: counts.visits },
    { id: 'token_request', label: 'Token Bookings', count: counts.tokens },
    { id: 'verification', label: 'Agent & KYC', count: counts.verifications || 0 },
    { id: 'system', label: 'System', count: counts.system },
  ];

  return (
    <div className="w-full space-y-4 pb-16">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 py-2.5 px-4 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-medium border backdrop-blur-md transition-all animate-slide-down ${
            toast.type === 'success'
              ? 'bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 border-zinc-800 dark:border-zinc-200'
              : 'bg-rose-950/90 text-rose-200 border-rose-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="text-emerald-400 dark:text-emerald-600 shrink-0" size={15} />
          ) : (
            <AlertTriangle className="text-rose-400 shrink-0" size={15} />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Database Error Alert */}
      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="shrink-0 text-rose-500" size={16} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => { setError(null); fetchNotificationLogs(); }}
            className="px-3 py-1 bg-rose-500 text-white hover:bg-rose-600 rounded-lg text-xs font-medium cursor-pointer transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Sleek Minimal Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)]">
              Notifications
            </h1>
            {counts.unread > 0 ? (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                {counts.unread} unread
              </span>
            ) : (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border)]">
                All caught up
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Real-time inquiries, site visit requests, and token booking updates.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fetchNotificationLogs()}
            disabled={loading}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-brand' : ''} />
          </button>

          {counts.unread > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCheck size={14} className="text-emerald-500" />
              <span>Mark all read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Clear all notification history"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/admin/broadcasts')}
            className="px-3.5 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ml-1"
            title="Open Dedicated Broadcast Messages Hub"
          >
            <Radio size={13} />
            <span>Manage Broadcasts</span>
          </button>
        </div>
      </div>

      {/* Clean Tabs & Filter Controls */}
      <div className="space-y-3">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 border-b border-[var(--border)] overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2.5 px-3.5 text-xs font-medium transition-all whitespace-nowrap relative cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-[var(--text-primary)] text-[var(--bg-surface)]'
                      : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
                  }`}
                >
                  {tab.count}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Search, Unread Toggle & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute top-2.5 left-3 text-[var(--text-muted)]" size={14} />
            <input
              type="text"
              placeholder="Search by client, property or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-brand placeholder:text-[var(--text-muted)] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute top-2 right-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Unread Only Toggle */}
            <button
              type="button"
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={`px-3 py-1.5 text-xs rounded-lg border font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                unreadOnly
                  ? 'bg-brand/10 border-brand/30 text-brand'
                  : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${unreadOnly ? 'bg-brand' : 'bg-zinc-400'}`} />
              <span>Unread only</span>
            </button>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded-lg focus:outline-none cursor-pointer font-medium"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Notification Feed */}
      {loading ? (
        /* Minimal Pulse Skeleton */
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] animate-pulse flex items-start gap-3.5"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-muted)] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-[var(--bg-muted)] rounded w-1/3" />
                <div className="h-3 bg-[var(--bg-muted)] rounded w-3/4" />
                <div className="h-2.5 bg-[var(--bg-muted)] rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        /* Clean Empty State */
        <div className="py-20 text-center border border-[var(--border)] rounded-2xl bg-[var(--bg-surface)] px-4">
          <div className="w-12 h-12 rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)] flex items-center justify-center mx-auto mb-3">
            <Inbox size={20} />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">No notifications</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No results found for "${searchQuery}".`
              : unreadOnly
              ? 'No unread notifications in this category.'
              : 'You have no notifications in this category.'}
          </p>
          {(searchQuery || unreadOnly) && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setUnreadOnly(false); }}
              className="mt-3 px-3 py-1.5 text-xs font-medium text-brand hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        /* Minimalist List */
        <div className="space-y-2">
          {filteredNotifications.map((notif) => {
            const meta = getCategoryMeta(notif.type);
            const client = getClientInfo(notif);
            const prop = notif.metadata?.propertyId;
            const schedule = notif.metadata?.scheduleDetails;
            const visitReq = notif.metadata?.visitRequestId;
            const tokenReq = notif.metadata?.tokenRequestId;

            const isPendingAction =
              (visitReq && (!visitReq.status || visitReq.status === 'pending')) ||
              (tokenReq && (!tokenReq.status || tokenReq.status === 'pending'));

            const decisionStatus = visitReq?.status || tokenReq?.status;

            const isAgentVerification =
              notif.type === 'verification' ||
              Boolean(notif.metadata?.agentId) ||
              (notif.title || '').toLowerCase().includes('agent');

            const targetAgentId =
              (typeof notif.metadata?.agentId === 'object'
                ? notif.metadata?.agentId?._id
                : notif.metadata?.agentId) ||
              notif.sender?._id ||
              '';

            return (
              <div
                key={notif._id}
                onClick={() => setSelectedNotif(notif)}
                className={`group relative p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer bg-[var(--bg-surface)] hover:border-zinc-300 dark:hover:border-zinc-700 ${
                  !notif.isRead
                    ? 'border-brand/40 bg-brand/[0.015]'
                    : 'border-[var(--border)]'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Category Icon */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${meta.color}`}
                  >
                    {meta.icon}
                  </div>

                  {/* Body Content */}
                  <div className="min-w-0 flex-1 space-y-1">
                    {/* Top Meta Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        {/* Unread indicator dot */}
                        {!notif.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                        )}

                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${meta.color}`}>
                          {meta.label}
                        </span>

                        <h4 className={`text-xs font-semibold truncate ${!notif.isRead ? 'text-[var(--text-primary)]' : 'text-[var(--text-subtle)]'}`}>
                          {notif.title}
                        </h4>

                        {/* Request Status Badge */}
                        {decisionStatus === 'accepted' && (
                          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Approved
                          </span>
                        )}
                        {decisionStatus === 'rejected' && (
                          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            Declined
                          </span>
                        )}
                      </div>

                      {/* Time */}
                      <span className="text-[11px] text-[var(--text-muted)] shrink-0 font-normal">
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>

                    {/* Message Preview */}
                    <p className="text-xs text-[var(--text-muted)] line-clamp-1 leading-relaxed">
                      {notif.message}
                    </p>

                    {/* Compact Context Pill Row */}
                    <div className="flex items-center gap-2 flex-wrap pt-0.5 text-[11px] text-[var(--text-muted)]">
                      {/* Schedule info */}
                      {(schedule || visitReq?.visitDate) && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <Calendar size={11} />
                          <span>
                            {schedule?.date || (visitReq?.visitDate ? new Date(visitReq.visitDate).toLocaleDateString('en-IN') : 'Visit')}
                            {schedule?.time ? ` • ${schedule.time}` : (visitReq?.visitTime ? ` • ${visitReq.visitTime}` : '')}
                          </span>
                        </span>
                      )}

                      {/* Client name */}
                      {client.name && (
                        <span className="inline-flex items-center gap-1">
                          <User size={11} />
                          <span className="text-[var(--text-primary)] font-medium">{client.name}</span>
                        </span>
                      )}

                      {/* Property title */}
                      {prop && (
                        <span className="inline-flex items-center gap-1 truncate max-w-[240px]">
                          <Building2 size={11} />
                          <span className="truncate">{prop.title}</span>
                          {prop.price && (
                            <span className="text-[var(--text-primary)] font-semibold">
                              ₹{typeof prop.price === 'number' ? prop.price.toLocaleString('en-IN') : prop.price}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Actions Toolbar */}
                  <div className="flex items-center gap-1 shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
                    {/* Direct Agent Verification CTA */}
                    {isAgentVerification && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(targetAgentId ? `/admin/agents?agentId=${targetAgentId}` : '/admin/agents');
                        }}
                        className="px-2.5 py-1 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs mr-1"
                        title="Open agent verification desk"
                      >
                        <ShieldCheck size={11} />
                        <span>Verify Agent</span>
                      </button>
                    )}

                    {/* Direct Quick Decisions (Accept / Decline) */}
                    {isPendingAction && (
                      <div className="flex items-center gap-1 mr-1">
                        <button
                          type="button"
                          onClick={(e) => openActionPrompt(notif, 'accept', e)}
                          className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          title="Accept and notify user"
                        >
                          <Check size={11} />
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => openActionPrompt(notif, 'decline', e)}
                          className="px-2.5 py-1 rounded-md bg-[var(--bg-muted)] hover:bg-rose-500/10 text-rose-500 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors border border-[var(--border)]"
                          title="Decline request"
                        >
                          <X size={11} />
                          <span>Decline</span>
                        </button>
                      </div>
                    )}

                    {/* Quick Call */}
                    {client.phone && (
                      <a
                        href={`tel:${client.phone}`}
                        className="p-1.5 text-[var(--text-muted)] hover:text-emerald-500 hover:bg-[var(--bg-muted)] rounded-md transition-colors"
                        title={`Call ${client.phone}`}
                      >
                        <Phone size={13} />
                      </a>
                    )}

                    {/* Quick WhatsApp */}
                    {client.phone && (
                      <a
                        href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${client.name}, this is GharMB regarding your inquiry...`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-[var(--text-muted)] hover:text-emerald-500 hover:bg-[var(--bg-muted)] rounded-md transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle size={13} />
                      </a>
                    )}

                    {/* Mark read / unread */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleRead(notif, e)}
                      className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] rounded-md transition-colors cursor-pointer"
                      title={notif.isRead ? 'Mark as unread' : 'Mark as read'}
                    >
                      <Check size={13} className={notif.isRead ? 'text-zinc-400' : 'text-brand font-bold'} />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteNotif(notif._id, e)}
                      className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SLIDE-OVER DETAIL DRAWER */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
            onClick={() => setSelectedNotif(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[var(--bg-surface)] border-l border-[var(--border)] shadow-2xl flex flex-col justify-between animate-slide-down">
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center border ${getCategoryMeta(selectedNotif.type).color}`}
                  >
                    {getCategoryMeta(selectedNotif.type).icon}
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    {getCategoryMeta(selectedNotif.type).label} Details
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleRead(selectedNotif)}
                    className="px-2.5 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] rounded-lg transition-colors cursor-pointer font-medium"
                  >
                    {selectedNotif.isRead ? 'Mark unread' : 'Mark read'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedNotif(null)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                {/* Title & Timestamp */}
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {selectedNotif.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                    <Clock size={12} />
                    <span>{formatFullDate(selectedNotif.createdAt)}</span>
                  </div>
                </div>

                {/* Actionable Request Card (If Visit / Token) */}
                {(selectedNotif.metadata?.visitRequestId || selectedNotif.metadata?.tokenRequestId) && (
                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)]/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[var(--text-primary)]">
                        Action Required
                      </span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-brand/10 text-brand">
                        {selectedNotif.metadata?.visitRequestId?.status || selectedNotif.metadata?.tokenRequestId?.status || 'Pending'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => openActionPrompt(selectedNotif, 'accept')}
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Check size={13} />
                        <span>Accept Request</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openActionPrompt(selectedNotif, 'decline')}
                        className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <X size={13} />
                        <span>Decline Request</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Actionable Request Card (If Agent Verification) */}
                {(selectedNotif.type === 'verification' ||
                  Boolean(selectedNotif.metadata?.agentId) ||
                  (selectedNotif.title || '').toLowerCase().includes('agent')) && (
                  <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/[0.04] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-purple-600 dark:text-purple-400" />
                        Agent RERA Verification Application
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        Audit Pending
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      This agent has submitted their state RERA certificate and identity documents. Open the Agent Verification Desk to inspect uploaded documents and verify credentials.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        const targetId =
                          (typeof selectedNotif.metadata?.agentId === 'object'
                            ? selectedNotif.metadata?.agentId?._id
                            : selectedNotif.metadata?.agentId) ||
                          selectedNotif.sender?._id ||
                          '';
                        navigate(targetId ? `/admin/agents?agentId=${targetId}` : '/admin/agents');
                      }}
                      className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs hover:scale-101"
                    >
                      <span>Review in Agent Verification Desk</span>
                      <ExternalLink size={13} />
                    </button>
                  </div>
                )}

                {/* Message Body */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Message
                  </p>
                  <div className="p-3.5 bg-[var(--bg-muted)]/60 rounded-xl border border-[var(--border)] text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-line font-normal">
                    {selectedNotif.message}
                  </div>
                </div>

                {/* Requester Contact Profile */}
                {(() => {
                  const client = getClientInfo(selectedNotif);
                  return client.name || client.phone || client.email ? (
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                        Client Information
                      </p>
                      <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-2.5">
                        {client.name && (
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-muted)] text-[11px]">Name:</span>
                            <span className="font-semibold text-[var(--text-primary)]">{client.name}</span>
                          </div>
                        )}

                        {client.phone && (
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-muted)] text-[11px]">Phone:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-medium text-[var(--text-primary)]">{client.phone}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(client.phone, 'phone')}
                                className="p-1 text-[var(--text-muted)] hover:text-brand cursor-pointer"
                                title="Copy Phone"
                              >
                                {copiedField === 'phone' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </div>
                        )}

                        {client.email && (
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-muted)] text-[11px]">Email:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-[var(--text-primary)]">{client.email}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(client.email, 'email')}
                                className="p-1 text-[var(--text-muted)] hover:text-brand cursor-pointer"
                                title="Copy Email"
                              >
                                {copiedField === 'email' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Quick Contact Buttons */}
                        {client.phone && (
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)]">
                            <a
                              href={`tel:${client.phone}`}
                              className="py-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg font-medium text-center flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <PhoneCall size={12} />
                              <span>Call</span>
                            </a>
                            <a
                              href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${client.name}, this is GharMB Admin regarding your notification inquiry...`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-center flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <MessageCircle size={12} />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Linked Property Card */}
                {selectedNotif.metadata?.propertyId && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      Associated Property
                    </p>
                    <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] flex items-start gap-3">
                      {selectedNotif.metadata.propertyId.images?.[0] ? (
                        <img
                          src={selectedNotif.metadata.propertyId.images[0]}
                          alt={selectedNotif.metadata.propertyId.title}
                          className="w-12 h-12 rounded-lg object-cover border border-[var(--border)] shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[var(--bg-muted)] text-[var(--text-muted)] flex items-center justify-center shrink-0">
                          <Building2 size={18} />
                        </div>
                      )}

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <h5 className="font-semibold text-xs text-[var(--text-primary)] truncate">
                          {selectedNotif.metadata.propertyId.title}
                        </h5>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {[selectedNotif.metadata.propertyId.locality, selectedNotif.metadata.propertyId.city].filter(Boolean).join(', ')}
                        </p>
                        {selectedNotif.metadata.propertyId.price && (
                          <p className="text-xs font-bold text-brand pt-0.5">
                            ₹{typeof selectedNotif.metadata.propertyId.price === 'number'
                              ? selectedNotif.metadata.propertyId.price.toLocaleString('en-IN')
                              : selectedNotif.metadata.propertyId.price}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedNotif.type === 'verification' && (
                  <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/10 space-y-2.5">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs">
                      <ShieldCheck size={16} />
                      <span>Developer / Builder Verification Application</span>
                    </div>
                    <p className="text-xs text-[var(--text-subtle)] leading-relaxed">
                      A builder has submitted company credentials and government documents (RERA & PAN) for authorization.
                    </p>
                    <a
                      href="/admin/builders"
                      className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand/20 cursor-pointer"
                    >
                      <span>Review in Builders Management</span>
                      <ArrowRight size={14} />
                    </a>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-[var(--border)] flex items-center justify-between bg-[var(--bg-muted)]/30">
                <button
                  type="button"
                  onClick={() => handleDeleteNotif(selectedNotif._id)}
                  className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Delete notification</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedNotif(null)}
                  className="px-4 py-1.5 bg-[var(--text-primary)] text-[var(--bg-surface)] rounded-lg font-medium text-xs cursor-pointer transition-opacity hover:opacity-90"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BROADCAST COMPOSER MODAL */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-slide-down">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-brand" />
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  New Broadcast Announcement
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleBroadcastSubmit} className="p-5 space-y-4 text-xs">
              {/* Audience Selector */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Target Audience
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, recipientType: 'all', recipientId: '' })}
                    className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                      formData.recipientType === 'all'
                        ? 'border-brand bg-brand/5 text-brand font-semibold'
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    All Active Users
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, recipientType: 'specific' })}
                    className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                      formData.recipientType === 'specific'
                        ? 'border-brand bg-brand/5 text-brand font-semibold'
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Specific User
                  </button>
                </div>
              </div>

              {/* Specific User Select */}
              {formData.recipientType === 'specific' && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-[var(--text-muted)]">
                    Choose Recipient
                  </label>
                  <select
                    required
                    value={formData.recipientId}
                    onChange={(e) => setFormData({ ...formData, recipientId: e.target.value })}
                    className="w-full p-2 bg-[var(--bg-muted)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-brand cursor-pointer"
                  >
                    <option value="">-- Select a User --</option>
                    {users.map((u) => (
                      <option key={u._id || u.id} value={u._id || u.id}>
                        {u.name} ({u.email || u.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-[11px] font-medium text-[var(--text-muted)]">
                    Notification Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Platform update or booking notice"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2 bg-[var(--bg-muted)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-brand placeholder:text-[var(--text-muted)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-[var(--text-muted)]">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full p-2 bg-[var(--bg-muted)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-brand cursor-pointer font-medium"
                  >
                    <option value="system">System</option>
                    <option value="verification">Verification</option>
                    <option value="payment">Payment</option>
                    <option value="enquiry">Enquiry</option>
                    <option value="visit_booking">Site Visit</option>
                  </select>
                </div>
              </div>

              {/* Message Body */}
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-[var(--text-muted)]">
                  Message Content
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter message text that will display in user trays..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-brand placeholder:text-[var(--text-muted)] resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-3.5 py-1.5 border border-[var(--border)] rounded-lg font-medium text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white rounded-lg font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send size={12} />
                  <span>{submitting ? 'Sending...' : 'Send Broadcast'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DECISION NOTE MODAL (Accept / Decline Confirmation) */}
      {actionDialog.show && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 animate-slide-down">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  actionDialog.action === 'accept'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-rose-500/10 text-rose-600'
                }`}
              >
                {actionDialog.action === 'accept' ? <Check size={16} /> : <X size={16} />}
              </div>
              <div>
                <h4 className="font-bold text-sm text-[var(--text-primary)] capitalize">
                  {actionDialog.action === 'accept' ? 'Accept Request' : 'Decline Request'}
                </h4>
                <p className="text-[11px] text-[var(--text-muted)]">
                  The client will be notified in their inbox.
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-[var(--text-muted)]">
                {actionDialog.action === 'accept' ? 'Admin Confirmation Note' : 'Reason for Declining'}
              </label>
              <textarea
                rows={3}
                value={actionDialog.note}
                onChange={(e) => setActionDialog({ ...actionDialog, note: e.target.value })}
                placeholder="Optional message to requester..."
                className="w-full p-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-brand resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActionDialog({ show: false, action: 'accept', notif: null, targetType: '', targetId: '', note: '' })}
                className="px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmDecision}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50 ${
                  actionDialog.action === 'accept'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionLoading ? 'Saving...' : 'Confirm & Notify'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR ALL CONFIRMATION DIALOG */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 animate-slide-down">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Trash2 size={18} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[var(--text-primary)]">Clear all notifications?</h4>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                This will permanently delete all notification records. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-xs"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
