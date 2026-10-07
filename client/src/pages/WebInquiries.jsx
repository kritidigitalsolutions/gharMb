import React, { useState, useEffect, useCallback } from 'react';
import AdminLoader from '../components/common/AdminLoader';
import {
  Inbox,
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Mail,
  Phone,
  User,
  ShieldAlert,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Calendar,
  Layers,
  RotateCcw,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import API from '../api/api';

export default function WebInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    newInquiries: 0,
    contactTotal: 0,
    deletionTotal: 0,
    resolvedTotal: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'contact', 'deletion_request'
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Detail Modal
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [adminNotesInput, setAdminNotesInput] = useState('');

  // Delete Single Modal
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    id: null,
    refId: '',
    name: '',
    isDeleting: false,
  });

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [copiedField, setCopiedField] = useState('');

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(text);
    triggerToast(`Copied ${fieldName} to clipboard!`, 'info');
    setTimeout(() => setCopiedField(''), 2000);
  };

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const res = await API.get('/admin/web-inquiries/stats');
      if (res.data?.data?.stats) {
        setStats(res.data.data.stats);
      }
    } catch (err) {
      console.warn('Could not fetch inquiry stats:', err);
    }
  };

  // Fetch Inquiries
  const fetchInquiries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit,
      };

      if (activeTab !== 'all') params.type = activeTab;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await API.get('/admin/web-inquiries', { params });
      if (res.data?.data) {
        setInquiries(res.data.data.inquiries || []);
        if (res.data.data.pagination) {
          setPagination(res.data.data.pagination);
        }
      }
    } catch (err) {
      console.error('Error fetching web inquiries:', err);
      setError('Failed to load inquiries. Please check network connection.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, statusFilter, search, page, limit]);

  useEffect(() => {
    fetchInquiries();
    fetchStats();
  }, [fetchInquiries]);

  // Handle Tab Switch
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setSelectedIds([]);
  };

  // Handle Status Filter Change
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPage(1);
    setSelectedIds([]);
  };

  // Selection helpers
  const isAllSelected = inquiries.length > 0 && selectedIds.length === inquiries.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < inquiries.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(inquiries.map((item) => item._id));
    }
  };

  const handleSelectOne = (id, e) => {
    if (e) e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Update Status & Admin Notes
  const handleUpdateInquiry = async (id, newStatus, notes) => {
    setIsUpdatingStatus(true);
    try {
      const payload = {};
      if (newStatus) payload.status = newStatus;
      if (notes !== undefined) payload.adminNotes = notes;

      const res = await API.patch(`/admin/web-inquiries/${id}`, payload);
      if (res.data?.data?.inquiry) {
        const updated = res.data.data.inquiry;
        setInquiries((prev) =>
          prev.map((item) => (item._id === id ? { ...item, ...updated } : item))
        );
        if (selectedInquiry && selectedInquiry._id === id) {
          setSelectedInquiry({ ...selectedInquiry, ...updated });
        }
        triggerToast('Inquiry status updated successfully!');
        fetchStats();
      }
    } catch (err) {
      console.error('Error updating inquiry:', err);
      triggerToast('Failed to update status.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Single Delete
  const handleDeleteSingle = async () => {
    if (!deleteModal.id) return;
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      await API.delete(`/admin/web-inquiries/${deleteModal.id}`);
      setInquiries((prev) => prev.filter((item) => item._id !== deleteModal.id));
      if (selectedInquiry && selectedInquiry._id === deleteModal.id) {
        setSelectedInquiry(null);
      }
      setSelectedIds((prev) => prev.filter((id) => id !== deleteModal.id));
      triggerToast('Inquiry deleted successfully.');
      setDeleteModal({ open: false, id: null, refId: '', name: '', isDeleting: false });
      fetchStats();
    } catch (err) {
      console.error('Error deleting inquiry:', err);
      triggerToast('Failed to delete inquiry.', 'error');
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await API.post('/admin/web-inquiries/bulk-delete', { ids: selectedIds });
      setInquiries((prev) => prev.filter((item) => !selectedIds.includes(item._id)));
      if (selectedInquiry && selectedIds.includes(selectedInquiry._id)) {
        setSelectedInquiry(null);
      }
      triggerToast(`${selectedIds.length} inquiries deleted successfully.`);
      setSelectedIds([]);
      setShowBulkDeleteModal(false);
      fetchStats();
    } catch (err) {
      console.error('Error in bulk delete:', err);
      triggerToast('Failed to bulk delete inquiries.', 'error');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Open Details Modal
  const openDetails = (inquiry) => {
    setSelectedInquiry(inquiry);
    setAdminNotesInput(inquiry.adminNotes || '');
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (inquiries.length === 0) {
      triggerToast('No data to export', 'error');
      return;
    }

    const headers = ['Ref ID', 'Type', 'Full Name', 'Email', 'Phone', 'Role', 'Status', 'Date', 'Message/Reason', 'Admin Notes'];
    const rows = inquiries.map((item) => [
      item.refId || item._id || '',
      item.type === 'deletion_request' ? 'Account Deletion' : 'Contact Us',
      item.fullName || '',
      item.email || '',
      item.phone || '',
      item.role || '',
      item.status || '',
      new Date(item.createdAt).toLocaleDateString('en-IN'),
      item.message || item.reason || '',
      item.adminNotes || '',
    ]);

    const escapeCell = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csvContent = '\uFEFF' + [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gharmb_web_inquiries_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast('CSV Export downloaded successfully!');
  };

  // Type Badges (Subtle, sleek, modern SaaS style)
  const getTypeBadge = (type) => {
    if (type === 'deletion_request') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <Trash2 size={11} className="shrink-0" />
          <span>Account Deletion</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
        <MessageSquare size={11} className="shrink-0" />
        <span>Contact Form</span>
      </span>
    );
  };

  // Status Badges (Modern dot indicator style)
  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>New</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span>In Progress</span>
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>Contacted</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Resolved</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            <span className="capitalize">{status}</span>
          </span>
        );
    }
  };

  // Helper for initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const hasActiveFilters = search || statusFilter !== 'all' || activeTab !== 'all';

  const resetAllFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setActiveTab('all');
    setPage(1);
    setSelectedIds([]);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 py-2.5 px-4 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-medium border backdrop-blur-md transition-all animate-slide-down ${
            toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-800'
              : toast.type === 'info'
              ? 'bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 border-zinc-800 dark:border-zinc-200'
              : 'bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 border-zinc-800 dark:border-zinc-200'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="text-rose-400 shrink-0" size={15} />
          ) : toast.type === 'info' ? (
            <Copy className="text-sky-400 dark:text-sky-600 shrink-0" size={15} />
          ) : (
            <CheckCircle2 className="text-emerald-400 dark:text-emerald-600 shrink-0" size={15} />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          01 — HEADER SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Web Inquiries & Requests
            </h1>
            {stats.newInquiries > 0 ? (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {stats.newInquiries} pending
              </span>
            ) : (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border)]">
                All up to date
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Manage incoming contact queries from the landing page and account deletion requests.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              fetchInquiries();
              fetchStats();
              triggerToast('Refreshed inquiries list', 'info');
            }}
            disabled={isLoading}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] rounded-lg transition-colors cursor-pointer disabled:opacity-50 border border-transparent hover:border-[var(--border)]"
            title="Refresh"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin text-brand' : ''} />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={inquiries.length === 0}
            className="px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] border border-[var(--border)] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-40"
          >
            <Download size={13} className="text-[var(--text-muted)]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          02 — TABS & FILTER CONTROLS
          ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        
        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between border-b border-[var(--border)]">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Inquiries', count: stats.total },
              { id: 'contact', label: 'Contact Messages', count: stats.contactTotal },
              { id: 'deletion_request', label: 'Account Deletion Requests', count: stats.deletionTotal, alert: true },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`pb-2.5 px-3.5 text-xs font-medium transition-all whitespace-nowrap relative cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? 'text-[var(--text-primary)] font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      isActive
                        ? 'bg-[var(--text-primary)] text-[var(--bg-surface)]'
                        : tab.alert && tab.count > 0
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold'
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

          {/* Bulk Selection Actions (Inline) */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 pb-2">
              <span className="text-xs font-medium text-brand">
                {selectedIds.length} selected
              </span>
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(true)}
                className="px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {/* Search & Status Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="text"
              placeholder="Search by name, email, phone, reference ID or message..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-brand placeholder:text-[var(--text-muted)] transition-colors shadow-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer p-0.5"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Right Filter Selectors */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="w-full sm:w-auto appearance-none pl-3 pr-8 py-1.5 text-xs font-medium bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-brand cursor-pointer shadow-xs"
              >
                <option value="all">All Statuses</option>
                <option value="new">New / Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="contacted">Contacted</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-2.5 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] border border-dashed border-[var(--border)] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>

        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════
          04 — DATA TABLE
          ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
        
        {isLoading ? (
          <AdminLoader
            text="Loading inquiries..."
            subtext="Fetching customer messages and web inquiries"
            minHeight="min-h-[240px]"
          />
        ) : error ? (
          <div className="p-10 text-center space-y-3">
            <AlertCircle size={28} className="text-rose-500 mx-auto" />
            <p className="text-xs font-medium text-[var(--text-primary)]">{error}</p>
            <button
              onClick={fetchInquiries}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-brand text-white hover:bg-brand/90 cursor-pointer shadow-xs"
            >
              Retry
            </button>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-muted)] text-[var(--text-muted)] flex items-center justify-center mx-auto">
              <Inbox size={22} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                No inquiries found
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
                {hasActiveFilters
                  ? 'No records match your active search and filter conditions.'
                  : 'Submissions from the landing page and account deletion requests will appear here.'}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-muted)] hover:bg-[var(--border)] text-[var(--text-primary)] cursor-pointer transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-muted)]/40 text-[11px] font-semibold text-[var(--text-muted)] tracking-wider uppercase">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isSomeSelected;
                      }}
                      onChange={handleSelectAll}
                      className="w-3.5 h-3.5 rounded border-[var(--border)] text-brand focus:ring-brand cursor-pointer accent-brand"
                    />
                  </th>
                  <th className="py-3 px-4 font-semibold">Reference & Type</th>
                  <th className="py-3 px-4 font-semibold">User Contact</th>
                  <th className="py-3 px-4 font-semibold">Role / Subject</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60 text-xs">
                {inquiries.map((item) => {
                  const isSelected = selectedIds.includes(item._id);
                  const formattedDate = new Date(item.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const formattedTime = new Date(item.createdAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const isCopied = copiedField === (item.refId || item._id);

                  return (
                    <tr
                      key={item._id}
                      onClick={() => openDetails(item)}
                      className={`hover:bg-[var(--bg-muted)]/40 transition-colors cursor-pointer ${
                        isSelected ? 'bg-brand/5' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectOne(item._id, e)}
                          className="w-3.5 h-3.5 rounded border-[var(--border)] text-brand focus:ring-brand cursor-pointer accent-brand"
                        />
                      </td>

                      {/* Reference & Type */}
                      <td className="py-3 px-4 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(item.refId || item._id, 'Ref ID');
                            }}
                            className="font-mono text-xs font-semibold text-[var(--text-primary)] hover:text-brand flex items-center gap-1 group cursor-pointer"
                            title="Click to copy ID"
                          >
                            <span>{item.refId || item._id.slice(-8).toUpperCase()}</span>
                            {isCopied ? (
                              <Check size={11} className="text-emerald-500" />
                            ) : (
                              <Copy size={11} className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] transition-opacity" />
                            )}
                          </button>
                        </div>
                        <div>{getTypeBadge(item.type)}</div>
                      </td>

                      {/* User Contact */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-brand/10 text-brand font-semibold text-[11px] flex items-center justify-center shrink-0">
                            {getInitials(item.fullName)}
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <span className="font-semibold text-[var(--text-primary)] text-xs block truncate">
                              {item.fullName}
                            </span>
                            <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-[var(--text-muted)]">
                              <a
                                href={`mailto:${item.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-brand hover:underline flex items-center gap-1 truncate max-w-[170px]"
                                title={item.email}
                              >
                                <Mail size={10} className="shrink-0" />
                                <span className="truncate">{item.email}</span>
                              </a>
                              <a
                                href={`tel:${item.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-brand flex items-center gap-1 font-mono text-[10.5px]"
                                title={item.phone}
                              >
                                <Phone size={10} className="shrink-0" />
                                <span>{item.phone}</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Context */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-[var(--text-primary)] capitalize block text-xs">
                          {item.role || 'General Inquiry'}
                        </span>
                        <p
                          className="text-[11px] text-[var(--text-muted)] truncate max-w-[200px]"
                          title={item.subject || item.message || item.reason}
                        >
                          {item.subject || item.message || item.reason || '—'}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-[var(--text-primary)] text-xs">{formattedDate}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{formattedTime}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Action Buttons */}
                      <td
                        className="py-3 px-4 text-right space-x-1 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => openDetails(item)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-muted)] hover:bg-brand hover:text-white transition-all cursor-pointer"
                        >
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setDeleteModal({
                              open: true,
                              id: item._id,
                              refId: item.refId,
                              name: item.fullName,
                              isDeleting: false,
                            })
                          }
                          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete Inquiry"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!isLoading && inquiries.length > 0 && (
          <div className="py-3 px-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
            <span>
              Showing {inquiries.length} of {pagination.total} records
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-medium text-xs shadow-xs"
              >
                <ChevronLeft size={13} />
                <span>Prev</span>
              </button>

              <span className="font-medium text-[var(--text-primary)] px-2">
                Page {page} of {pagination.totalPages || 1}
              </span>

              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-medium text-xs shadow-xs"
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ═══════════════════════════════════════════════════════════════
          05 — INQUIRY DETAILS MODAL
          ═══════════════════════════════════════════════════════════════ */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl p-5 sm:p-6 space-y-5 text-left">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-[var(--border)]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getTypeBadge(selectedInquiry.type)}
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedInquiry.refId, 'Reference ID')}
                    className="font-mono text-xs font-medium text-[var(--text-muted)] hover:text-brand flex items-center gap-1 group cursor-pointer"
                    title="Click to copy Reference ID"
                  >
                    <span>{selectedInquiry.refId}</span>
                    <Copy size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {selectedInquiry.type === 'deletion_request'
                    ? 'Account Deletion Request'
                    : 'Website Contact Message'}
                </h3>
                <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                  <Calendar size={11} />
                  <span>
                    Submitted on{' '}
                    {new Date(selectedInquiry.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* User Info Grid */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[var(--bg-muted)]/40 border border-[var(--border)]">
              <div>
                <span className="text-[10.5px] font-medium uppercase tracking-wider text-[var(--text-muted)] block mb-0.5">
                  Full Name
                </span>
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  {selectedInquiry.fullName}
                </span>
              </div>

              <div>
                <span className="text-[10.5px] font-medium uppercase tracking-wider text-[var(--text-muted)] block mb-0.5">
                  Account Role
                </span>
                <span className="text-xs font-medium text-[var(--text-primary)] capitalize">
                  {selectedInquiry.role || 'Property Seeker'}
                </span>
              </div>

              <div>
                <span className="text-[10.5px] font-medium uppercase tracking-wider text-[var(--text-muted)] block mb-0.5">
                  Email Address
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[var(--text-primary)] truncate">
                    {selectedInquiry.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedInquiry.email, 'Email')}
                    className="text-[var(--text-muted)] hover:text-brand cursor-pointer"
                    title="Copy Email"
                  >
                    <Copy size={11} />
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10.5px] font-medium uppercase tracking-wider text-[var(--text-muted)] block mb-0.5">
                  Mobile Number
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-medium text-[var(--text-primary)]">
                    {selectedInquiry.phone}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedInquiry.phone, 'Phone')}
                    className="text-[var(--text-muted)] hover:text-brand cursor-pointer"
                    title="Copy Phone"
                  >
                    <Copy size={11} />
                  </button>
                </div>
              </div>
            </div>

            {/* Inquiry Content / Message */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] block">
                {selectedInquiry.type === 'deletion_request' ? 'Reason for Deletion' : 'Message / Requirements'}
              </span>
              <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                {selectedInquiry.message || selectedInquiry.reason || 'No message provided.'}
              </div>
            </div>

            {selectedInquiry.notes && (
              <div className="space-y-1">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] block">
                  Additional Notes
                </span>
                <p className="text-xs text-[var(--text-muted)] italic">
                  {selectedInquiry.notes}
                </p>
              </div>
            )}

            {/* Status & Admin Action Bar */}
            <div className="space-y-3 pt-3 border-t border-[var(--border)]">
              <div>
                <span className="text-xs font-semibold text-[var(--text-primary)] block mb-1.5">
                  Workflow Status
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {['new', 'in_progress', 'contacted', 'resolved', 'rejected'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateInquiry(selectedInquiry._id, st, adminNotesInput)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                        selectedInquiry.status === st
                          ? 'bg-brand text-white shadow-xs'
                          : 'bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Internal Notes */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Admin Internal Notes
                </label>
                <textarea
                  rows={2}
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  placeholder="Add internal contact notes, verification status, or action log..."
                  className="w-full p-2.5 rounded-lg text-xs bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-brand transition-all resize-none shadow-xs"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => {
                  setDeleteModal({
                    open: true,
                    id: selectedInquiry._id,
                    refId: selectedInquiry.refId,
                    name: selectedInquiry.fullName,
                    isDeleting: false,
                  });
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedInquiry(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-muted)] hover:bg-[var(--border)] text-[var(--text-primary)] transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleUpdateInquiry(selectedInquiry._id, selectedInquiry.status, adminNotesInput)}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-brand text-white hover:bg-brand/90 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingStatus ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          06 — SINGLE DELETE MODAL
          ═══════════════════════════════════════════════════════════════ */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl w-full max-w-sm shadow-xl p-5 text-center space-y-3.5">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
              <Trash2 size={18} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Delete Inquiry?
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Are you sure you want to delete inquiry <strong>{deleteModal.refId || deleteModal.name}</strong>? This cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, id: null, refId: '', name: '', isDeleting: false })}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-muted)] text-[var(--text-primary)] hover:bg-[var(--border)] cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleteModal.isDeleting}
                onClick={handleDeleteSingle}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-rose-600 text-white hover:bg-rose-700 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deleteModal.isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          07 — BULK DELETE MODAL
          ═══════════════════════════════════════════════════════════════ */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl w-full max-w-sm shadow-xl p-5 text-center space-y-3.5">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertTriangle size={18} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Delete {selectedIds.length} Inquiries?
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Are you sure you want to permanently delete all <strong>{selectedIds.length} selected inquiries</strong>?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-muted)] text-[var(--text-primary)] hover:bg-[var(--border)] cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={handleBulkDelete}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-rose-600 text-white hover:bg-rose-700 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isBulkDeleting ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
