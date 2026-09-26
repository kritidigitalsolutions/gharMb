import React, { useState, useEffect, useCallback } from 'react';
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
  ExternalLink,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Send,
  Calendar,
  Layers,
  FileText
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
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
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

  const handleSelectOne = (id) => {
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
      item.refId || item._id,
      item.type === 'deletion_request' ? 'Account Deletion' : 'Contact Us',
      `"${item.fullName.replace(/"/g, '""')}"`,
      item.email,
      item.phone,
      item.role,
      item.status,
      new Date(item.createdAt).toLocaleDateString('en-IN'),
      `"${(item.message || item.reason || '').replace(/"/g, '""')}"`,
      `"${(item.adminNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gharmb_web_inquiries_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('CSV Export downloaded successfully!');
  };

  // Helpers for Type & Status Styles
  const getTypeBadge = (type) => {
    if (type === 'deletion_request') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <Trash2 size={12} className="text-rose-600" />
          <span>Delete Profile</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <MessageSquare size={12} className="text-blue-600" />
        <span>Contact Form</span>
      </span>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <Clock size={11} />
            <span>New</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <RefreshCw size={11} className="animate-spin" />
            <span>In Progress</span>
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Mail size={11} />
            <span>Contacted</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={11} />
            <span>Resolved</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
            <XCircle size={11} />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-50 text-gray-600 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-800'
              : toast.type === 'info'
              ? 'bg-slate-900 text-white border-slate-800'
              : 'bg-emerald-900 text-white border-emerald-800'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle size={18} className="text-rose-400" />
          ) : toast.type === 'info' ? (
            <Copy size={18} className="text-sky-400" />
          ) : (
            <CheckCircle2 size={18} className="text-emerald-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          01 — HEADER & TOP KPI STATS
          ═══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <Inbox size={18} />
            </div>
            <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
              Web Inquiries & Requests
            </h1>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Manage incoming contact queries from the landing page and account deletion requests from the website.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-all shadow-xs cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fetchInquiries();
              fetchStats();
              triggerToast('Refreshed inquiries list', 'info');
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-brand text-white hover:bg-brand/90 transition-all shadow-sm shadow-brand/20 cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Inquiries */}
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              Total Inquiries
            </span>
            <span className="text-2xl font-black text-[var(--text-primary)]">
              {stats.total}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Layers size={18} />
          </div>
        </div>

        {/* New Submissions */}
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              Pending / New
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-amber-600">
                {stats.newInquiries}
              </span>
              {stats.newInquiries > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-800">
                  Action Needed
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={18} />
          </div>
        </div>

        {/* Contact Us Messages */}
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              Contact Queries
            </span>
            <span className="text-2xl font-black text-blue-600">
              {stats.contactTotal}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <MessageSquare size={18} />
          </div>
        </div>

        {/* Account Deletion Requests */}
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              Deletion Requests
            </span>
            <span className="text-2xl font-black text-rose-600">
              {stats.deletionTotal}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Trash2 size={18} />
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════
          02 — TABS, SEARCH & FILTER TOOLBAR
          ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-4 shadow-xs space-y-4">
        
        {/* Top Tab Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
          
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
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
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand text-white shadow-xs shadow-brand/30'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : tab.alert && tab.count > 0
                        ? 'bg-rose-100 text-rose-700 font-black'
                        : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bulk Action Button (if selected) */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand">
                {selectedIds.length} selected
              </span>
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Delete Selected</span>
              </button>
            </div>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="text"
              placeholder="Search by name, email, phone, reference ID or message..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Filter size={14} className="text-[var(--text-muted)] hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-bold bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="new">New / Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="contacted">Contacted</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════
          03 — DATA TABLE & LIST
          ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] shadow-xs overflow-hidden">
        
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-brand/20 border-t-brand rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-[var(--text-muted)]">Loading inquiries data...</p>
          </div>
        ) : error ? (
          <div className="p-10 text-center space-y-3">
            <AlertCircle size={32} className="text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-[var(--text-primary)]">{error}</p>
            <button
              onClick={fetchInquiries}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-brand text-white cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[var(--bg-muted)] text-[var(--text-muted)] flex items-center justify-center mx-auto">
              <Inbox size={28} />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              No inquiries found
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              {search || statusFilter !== 'all' || activeTab !== 'all'
                ? 'No inquiries match your current search and filter criteria.'
                : 'Submissions from the website Contact Us form and Delete Profile page will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-muted)]/50 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isSomeSelected;
                      }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-[var(--border)] text-brand focus:ring-brand cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">Reference & Type</th>
                  <th className="py-3 px-4">User Contact</th>
                  <th className="py-3 px-4">Role / Context</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {inquiries.map((item) => {
                  const isSelected = selectedIds.includes(item._id);
                  const formattedDate = new Date(item.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={item._id}
                      className={`hover:bg-[var(--bg-muted)]/40 transition-colors ${
                        isSelected ? 'bg-brand/5' : ''
                      }`}
                    >
                      {/* Select Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(item._id)}
                          className="w-4 h-4 rounded border-[var(--border)] text-brand focus:ring-brand cursor-pointer"
                        />
                      </td>

                      {/* Reference & Type */}
                      <td className="py-3.5 px-4 space-y-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(item.refId || item._id, 'Ref ID')}
                            className="font-mono font-bold text-[var(--text-primary)] hover:text-brand flex items-center gap-1 group cursor-pointer"
                            title="Click to copy Reference ID"
                          >
                            <span>{item.refId || item._id.slice(-8).toUpperCase()}</span>
                            <Copy size={10} className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)]" />
                          </button>
                        </div>
                        <div>{getTypeBadge(item.type)}</div>
                      </td>

                      {/* User Contact */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="font-bold text-[var(--text-primary)] text-[13px] flex items-center gap-1.5">
                          <User size={13} className="text-[var(--text-muted)]" />
                          <span>{item.fullName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11.5px] text-[var(--text-muted)]">
                          <a
                            href={`mailto:${item.email}`}
                            className="hover:text-brand hover:underline flex items-center gap-1 truncate max-w-[180px]"
                            title={item.email}
                          >
                            <Mail size={11} />
                            <span>{item.email}</span>
                          </a>
                        </div>
                        <div className="flex items-center gap-1 text-[11.5px] text-[var(--text-muted)] font-mono">
                          <Phone size={11} />
                          <span>{item.phone}</span>
                        </div>
                      </td>

                      {/* Role / Context */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[var(--text-primary)] capitalize block">
                          {item.role || 'General Seeker'}
                        </span>
                        {item.subject && (
                          <span className="text-[11px] text-[var(--text-muted)] truncate max-w-[160px] block">
                            {item.subject}
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-[var(--text-muted)] whitespace-nowrap">
                        <div className="font-medium text-[var(--text-primary)]">{formattedDate}</div>
                        <div className="text-[10px]">
                          {new Date(item.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {getStatusBadge(item.status)}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openDetails(item)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[var(--bg-muted)] hover:bg-brand hover:text-white text-[var(--text-primary)] transition-all cursor-pointer"
                        >
                          View Details
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
                          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          title="Delete Inquiry"
                        >
                          <Trash2 size={15} />
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

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>

              <span className="font-bold text-[var(--text-primary)] px-2">
                Page {page} of {pagination.totalPages || 1}
              </span>

              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ═══════════════════════════════════════════════════════════════
          04 — INQUIRY DETAILS DRAWER / MODAL
          ═══════════════════════════════════════════════════════════════ */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-left">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--border)]">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  {getTypeBadge(selectedInquiry.type)}
                  <span className="font-mono font-bold text-xs text-[var(--text-muted)]">
                    {selectedInquiry.refId}
                  </span>
                </div>
                <h3 className="text-xl font-black text-[var(--text-primary)]">
                  {selectedInquiry.type === 'deletion_request'
                    ? 'Account Deletion Request'
                    : 'Website Contact Message'}
                </h3>
                <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 mt-1">
                  <Calendar size={12} />
                  <span>
                    Received on{' '}
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
                className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* User Details Grid */}
            <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[var(--bg-muted)]/50 border border-[var(--border)]">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  Full Name
                </span>
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  {selectedInquiry.fullName}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  Account Role
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)] capitalize">
                  {selectedInquiry.role || 'Property Seeker'}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  Email Address
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {selectedInquiry.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedInquiry.email, 'Email')}
                    className="text-[var(--text-muted)] hover:text-brand cursor-pointer"
                    title="Copy Email"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  Mobile Number
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-[var(--text-primary)]">
                    {selectedInquiry.phone}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedInquiry.phone, 'Phone')}
                    className="text-[var(--text-muted)] hover:text-brand cursor-pointer"
                    title="Copy Phone"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Inquiry Content / Deletion Reason */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                {selectedInquiry.type === 'deletion_request' ? 'Reason for Deletion' : 'Message / Requirements'}
              </span>
              <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                {selectedInquiry.message || selectedInquiry.reason || 'No message provided.'}
              </div>
            </div>

            {selectedInquiry.notes && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                  Additional Notes
                </span>
                <p className="text-xs text-[var(--text-muted)] italic">
                  {selectedInquiry.notes}
                </p>
              </div>
            )}

            {/* Status & Admin Action Bar */}
            <div className="space-y-4 pt-4 border-t border-[var(--border)]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-[var(--text-primary)] block">
                    Workflow Status
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Change status to track review progress
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {['new', 'in_progress', 'contacted', 'resolved', 'rejected'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateInquiry(selectedInquiry._id, st, adminNotesInput)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
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
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                  Admin Internal Notes
                </label>
                <textarea
                  rows={3}
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  placeholder="Add internal verification notes, contact log, or audit notes..."
                  className="w-full p-3 rounded-xl text-xs bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-brand transition-all resize-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--border)]">
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
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Delete Record</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedInquiry(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-muted)] hover:bg-[var(--border)] text-[var(--text-primary)] transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleUpdateInquiry(selectedInquiry._id, selectedInquiry.status, adminNotesInput)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-brand text-white hover:bg-brand/90 transition-all shadow-sm shadow-brand/20 cursor-pointer"
                >
                  {isUpdatingStatus ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          05 — SINGLE DELETE MODAL
          ═══════════════════════════════════════════════════════════════ */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-3xl w-full max-w-md shadow-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 size={24} />
            </div>

            <div>
              <h3 className="text-lg font-black text-[var(--text-primary)]">
                Delete Web Inquiry?
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Are you sure you want to delete the record for <strong>{deleteModal.name}</strong> ({deleteModal.refId})? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, id: null, refId: '', name: '', isDeleting: false })}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-muted)] text-[var(--text-primary)] hover:bg-[var(--border)] cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleteModal.isDeleting}
                onClick={handleDeleteSingle}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {deleteModal.isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          06 — BULK DELETE MODAL
          ═══════════════════════════════════════════════════════════════ */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-3xl w-full max-w-md shadow-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle size={24} />
            </div>

            <div>
              <h3 className="text-lg font-black text-[var(--text-primary)]">
                Delete {selectedIds.length} Inquiries?
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Are you sure you want to permanently delete all <strong>{selectedIds.length} selected inquiries</strong>?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-muted)] text-[var(--text-primary)] hover:bg-[var(--border)] cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={handleBulkDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {isBulkDeleting ? 'Deleting...' : 'Yes, Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
