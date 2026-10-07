import React, { useState, useEffect, useMemo, useRef } from 'react';
import AdminLoader from '../components/common/AdminLoader';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus, Search, Filter, Edit, Trash2, Eye,
  CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw,
  CheckSquare, Square, X, Quote, ImageIcon, ArrowUpDown,
  ShieldCheck, MapPin, Building2, Sparkles, ChevronRight,
  RotateCcw, Upload, Check, ExternalLink, SlidersHorizontal
} from 'lucide-react';
import API from '../api/api';

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const API_BASE = RAW_API_URL.replace(/\/+api\/?$/i, '').replace(/\/+$/, '');

const getMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads')) return `${API_BASE}${url}`;
  const match = url.match(/\/uploads\/[^\s"']+/);
  if (match) return `${API_BASE}${match[0]}`;
  return `${API_BASE}/${url.replace(/^\/+/, '')}`;
};

// Generates a soft pastel gradient avatar based on the author's name
const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'MB';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarGradient = (name = '') => {
  const gradients = [
    'from-orange-500 to-amber-500 text-white',
    'from-blue-500 to-indigo-600 text-white',
    'from-emerald-500 to-teal-600 text-white',
    'from-rose-500 to-pink-600 text-white',
    'from-violet-500 to-purple-600 text-white',
    'from-cyan-500 to-blue-600 text-white',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

const TestimonialManagement = () => {
  const navigate = useNavigate();

  // Primary Data States
  const [testimonials, setTestimonials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selection & Bulk Operations
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [verifiedFilter, setVerifiedFilter] = useState('all'); // 'all' | 'verified' | 'unverified'
  const [sortDirection, setSortDirection] = useState('desc'); // 'desc' (newest) | 'asc' (oldest)

  // Quick Inline Status Updating tracker
  const [statusTogglingId, setStatusTogglingId] = useState(null);

  // Live Card Preview Modal
  const [previewTestimonial, setPreviewTestimonial] = useState(null);

  // Form Modal (Add / Edit)
  const initialModalState = {
    open: false,
    mode: 'create', // 'create' | 'edit'
    id: null,
    quote: '',
    name: '',
    role: '',
    location: '',
    propertyType: '',
    journeyType: '',
    stages: 'Discover, Verify, Understand, Decide',
    activeStageIndex: 1,
    avatar: '',
    avatarFile: null,
    removeAvatar: false,
    propertyImage: '',
    propertyImageFile: null,
    removePropertyImage: false,
    isVerified: true,
    isActive: true,
    displayOrder: 0,
    isSubmitting: false,
    error: null,
  };
  const [modalState, setModalState] = useState(initialModalState);

  // Single Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    id: null,
    name: '',
    isDeleting: false
  });

  // Toast Notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  // Image load error cache
  const [imageErrors, setImageErrors] = useState({});
  const handleImageError = (id) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  // Fetch testimonials
  const fetchTestimonials = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter === 'active') params.isActive = true;
      if (statusFilter === 'inactive') params.isActive = false;
      params.sort = sortDirection;

      const res = await API.get('/admin/testimonials', { params });
      if (res.data?.data?.testimonials) {
        setTestimonials(res.data.data.testimonials);
      }
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setError('Failed to load testimonials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, [search, statusFilter, sortDirection]);

  // Derived filtered items (client-side filters like verified)
  const filteredTestimonials = useMemo(() => {
    return testimonials.filter(t => {
      if (verifiedFilter === 'verified' && !t.isVerified) return false;
      if (verifiedFilter === 'unverified' && t.isVerified) return false;
      return true;
    });
  }, [testimonials, verifiedFilter]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = testimonials.length;
    const active = testimonials.filter(t => t.isActive).length;
    const verified = testimonials.filter(t => t.isVerified).length;
    const inactive = total - active;
    return { total, active, verified, inactive };
  }, [testimonials]);

  // Selection helpers
  const isAllSelected = filteredTestimonials.length > 0 && selectedIds.length === filteredTestimonials.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < filteredTestimonials.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTestimonials.map(t => t._id));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // 1-Click Fast Inline Status Toggle
  const handleToggleStatus = async (id, currentStatus, e) => {
    if (e) e.stopPropagation();
    if (statusTogglingId) return;

    setStatusTogglingId(id);
    const newStatus = !currentStatus;

    // Optimistic UI update
    setTestimonials(prev =>
      prev.map(t => (t._id === id ? { ...t, isActive: newStatus } : t))
    );

    try {
      await API.put(`/admin/testimonials/${id}`, { isActive: newStatus });
      triggerToast(`Story ${newStatus ? 'published' : 'hidden'} successfully`);
    } catch (err) {
      // Revert on error
      setTestimonials(prev =>
        prev.map(t => (t._id === id ? { ...t, isActive: currentStatus } : t))
      );
      triggerToast('Failed to update status', 'error');
    } finally {
      setStatusTogglingId(null);
    }
  };

  // Bulk Status Update (Activate / Deactivate)
  const handleBulkStatus = async (isActive) => {
    if (selectedIds.length === 0) return;
    setIsBulkUpdating(true);

    try {
      await API.post('/admin/testimonials/bulk-status', {
        ids: selectedIds,
        isActive
      });

      setTestimonials(prev =>
        prev.map(t => selectedIds.includes(t._id) ? { ...t, isActive } : t)
      );
      triggerToast(`${selectedIds.length} stories marked as ${isActive ? 'active' : 'inactive'}`);
      setSelectedIds([]);
    } catch (err) {
      // Fallback: batch individual updates if server bulk-status isn't reachable
      try {
        await Promise.all(
          selectedIds.map(id => API.put(`/admin/testimonials/${id}`, { isActive }))
        );
        setTestimonials(prev =>
          prev.map(t => selectedIds.includes(t._id) ? { ...t, isActive } : t)
        );
        triggerToast(`${selectedIds.length} stories updated successfully`);
        setSelectedIds([]);
      } catch (fallbackErr) {
        triggerToast('Failed to update selected stories', 'error');
      }
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Single Delete
  const handleDeleteConfirm = async () => {
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      await API.delete(`/admin/testimonials/${deleteModal.id}`);
      triggerToast('Testimonial deleted successfully');
      setTestimonials(prev => prev.filter(t => t._id !== deleteModal.id));
      setSelectedIds(prev => prev.filter(id => id !== deleteModal.id));
      setDeleteModal({ open: false, id: null, name: '', isDeleting: false });
      if (previewTestimonial?._id === deleteModal.id) setPreviewTestimonial(null);
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Failed to delete testimonial', 'error');
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Bulk Delete
  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await API.post('/admin/testimonials/bulk-delete', { ids: selectedIds });
      triggerToast(`${selectedIds.length} testimonials deleted successfully`);
      setTestimonials(prev => prev.filter(t => !selectedIds.includes(t._id)));
      setSelectedIds([]);
      setShowBulkDeleteModal(false);
      if (previewTestimonial && selectedIds.includes(previewTestimonial._id)) {
        setPreviewTestimonial(null);
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Failed to delete testimonials', 'error');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Add / Edit Modal Submit
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const {
      quote, name, role, location, propertyType, journeyType,
      stages, activeStageIndex, isVerified, isActive, displayOrder, mode, id
    } = modalState;

    if (!quote.trim() || !name.trim()) {
      setModalState(prev => ({ ...prev, error: 'Author Name and Quote are required fields' }));
      return;
    }

    setModalState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const formData = new FormData();
      formData.append('quote', quote.trim());
      formData.append('name', name.trim());
      formData.append('role', role.trim());
      formData.append('location', location.trim());
      formData.append('propertyType', propertyType.trim());
      formData.append('journeyType', journeyType.trim());

      const stagesList = stages
        ? stages.split(',').map(s => s.trim()).filter(Boolean)
        : ['Discover', 'Verify', 'Understand', 'Decide'];
      formData.append('stages', JSON.stringify(stagesList));
      formData.append('activeStageIndex', Math.max(0, parseInt(activeStageIndex, 10) || 0));
      formData.append('isVerified', isVerified);
      formData.append('isActive', isActive);
      formData.append('sortOrder', parseInt(displayOrder, 10) || 0);

      if (modalState.avatarFile) formData.append('avatar', modalState.avatarFile);
      if (modalState.propertyImageFile) formData.append('propertyImage', modalState.propertyImageFile);

      if (modalState.removeAvatar) formData.append('removeAvatar', 'true');
      if (modalState.removePropertyImage) formData.append('removePropertyImage', 'true');

      if (mode === 'create') {
        const res = await API.post('/admin/testimonials', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        triggerToast('Testimonial created successfully');
        if (res.data?.data?.testimonial) {
          setTestimonials([res.data.data.testimonial, ...testimonials]);
        } else {
          fetchTestimonials();
        }
      } else {
        const res = await API.put(`/admin/testimonials/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        triggerToast('Testimonial updated successfully');
        if (res.data?.data?.testimonial) {
          const updated = res.data.data.testimonial;
          setTestimonials(testimonials.map(t => (t._id === id ? updated : t)));
          if (previewTestimonial?._id === id) setPreviewTestimonial(updated);
        } else {
          fetchTestimonials();
        }
      }
      setModalState(initialModalState);
    } catch (err) {
      setModalState(prev => ({
        ...prev,
        error: err.response?.data?.message || 'Something went wrong while saving.',
        isSubmitting: false
      }));
    }
  };

  const openAddModal = () => {
    setModalState({
      ...initialModalState,
      open: true,
      mode: 'create'
    });
  };

  const openEditModal = (t, e) => {
    if (e) e.stopPropagation();
    setModalState({
      open: true,
      mode: 'edit',
      id: t._id,
      quote: t.quote || '',
      name: t.name || '',
      role: t.role || '',
      location: t.location || '',
      propertyType: t.propertyType || '',
      journeyType: t.journeyType || '',
      stages: (t.stages || ['Discover', 'Verify', 'Understand', 'Decide']).join(', '),
      activeStageIndex: t.activeStageIndex !== undefined ? t.activeStageIndex : 1,
      avatar: t.avatar ? getMediaUrl(t.avatar) : '',
      avatarFile: null,
      removeAvatar: false,
      propertyImage: t.propertyImage ? getMediaUrl(t.propertyImage) : '',
      propertyImageFile: null,
      removePropertyImage: false,
      isVerified: t.isVerified ?? true,
      isActive: t.isActive ?? true,
      displayOrder: t.sortOrder || t.displayOrder || 0,
      isSubmitting: false,
      error: null,
    });
  };

  const handleImageUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setModalState(prev => ({
        ...prev,
        [`${field}File`]: file,
        [field]: URL.createObjectURL(file),
        [`remove${field.charAt(0).toUpperCase() + field.slice(1)}`]: false
      }));
    }
  };

  const handleRemoveImage = (field) => {
    setModalState(prev => ({
      ...prev,
      [`${field}File`]: null,
      [field]: '',
      [`remove${field.charAt(0).toUpperCase() + field.slice(1)}`]: true
    }));
  };

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'all' || verifiedFilter !== 'all';
  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setVerifiedFilter('all');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${
            toast.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/70 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-slate-200/50 dark:shadow-black/40'
          }`}>
            {toast.type === 'error' ? (
              <XCircle size={18} className="text-red-500 shrink-0" />
            ) : (
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            )}
            <p className="text-xs font-semibold">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Header & Page Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)] mb-1">
            <span>Content</span>
            <ChevronRight size={12} className="text-slate-400" />
            <span className="text-[var(--text-primary)] font-semibold">Testimonials</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Real Stories</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand/10 text-brand border border-brand/20">
              {stats.total} {stats.total === 1 ? 'story' : 'stories'}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Manage authentic customer experiences, verified badges, and social proof shown on GharMB.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchTestimonials}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors shadow-2xs cursor-pointer"
            title="Refresh Stories"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin text-brand' : ''} />
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-brand hover:bg-brand-dark rounded-xl transition-all shadow-xs hover:shadow active:scale-[0.98] cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Testimonial</span>
          </button>
        </div>
      </div>

      {/* Unified Search & Minimal Filter Toolbar */}
      <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search author, quote, or role..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-[var(--bg-muted)] border border-transparent focus:border-[var(--border)] focus:bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-slate-400 transition-colors outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter Controls & Sort */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
          {/* Status Tabs / Segmented Control */}
          <div className="inline-flex p-1 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-[var(--bg-surface)] text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'inactive'
                  ? 'bg-[var(--bg-surface)] text-amber-600 dark:text-amber-400 shadow-2xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Inactive
            </button>
          </div>

          {/* Verified Filter */}
          <select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--text-primary)] outline-none cursor-pointer hover:bg-[var(--bg-surface)] transition-colors"
          >
            <option value="all">All Experiences</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Unverified Only</option>
          </select>

          {/* Sort Order */}
          <button
            onClick={() => setSortDirection(prev => (prev === 'desc' ? 'asc' : 'desc'))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] transition-colors cursor-pointer"
            title={`Sorting ${sortDirection === 'desc' ? 'Newest first' : 'Oldest first'}`}
          >
            <ArrowUpDown size={13} className="text-slate-500" />
            <span>{sortDirection === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating / Inline Bulk Actions Ribbon */}
      {selectedIds.length > 0 && (
        <div className="p-3 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3 pl-2">
            <span className="flex items-center justify-center px-2 py-0.5 rounded-md bg-brand text-white text-xs font-bold">
              {selectedIds.length}
            </span>
            <span className="text-xs font-medium text-slate-200">
              {selectedIds.length === 1 ? 'story selected' : 'stories selected'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStatus(true)}
              disabled={isBulkUpdating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 size={13} />
              <span>Set Active</span>
            </button>

            <button
              onClick={() => handleBulkStatus(false)}
              disabled={isBulkUpdating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Clock size={13} />
              <span>Set Inactive</span>
            </button>

            <button
              onClick={() => setShowBulkDeleteModal(true)}
              disabled={isBulkDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="p-1 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
              title="Clear selection"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xs overflow-hidden">
        {isLoading ? (
          <AdminLoader
            text="Loading client testimonials..."
            subtext="Fetching customer reviews, stories, and ratings"
            minHeight="min-h-[240px]"
          />
        ) : error ? (
          <div className="py-16 text-center px-4">
            <AlertCircle size={28} className="mx-auto text-red-500 mb-2" />
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
            <button
              onClick={fetchTestimonials}
              className="mt-3 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand text-white cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredTestimonials.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Quote size={20} />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">No testimonials found</h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mt-1">
              {hasActiveFilters
                ? 'No testimonials match your current search and filter criteria.'
                : 'Get started by creating your first customer story.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {hasActiveFilters ? (
                <button
                  onClick={handleResetFilters}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand text-white shadow-xs cursor-pointer"
                >
                  <Plus size={14} /> Add Testimonial
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  {/* Select All */}
                  <th className="py-3 px-4 w-12 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-slate-400 hover:text-brand transition-colors cursor-pointer"
                      title={isAllSelected ? 'Deselect all' : 'Select all'}
                    >
                      {isAllSelected ? (
                        <CheckSquare size={16} className="text-brand" />
                      ) : isSomeSelected ? (
                        <div className="relative w-4 h-4 flex items-center justify-center text-brand">
                          <Square size={16} />
                          <div className="absolute w-2 h-0.5 bg-brand rounded-xs" />
                        </div>
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </th>

                  {/* S.No */}
                  <th className="py-3 px-3 w-12 text-center">#</th>

                  {/* Author */}
                  <th className="py-3 px-4 min-w-[220px]">Author & Profile</th>

                  {/* Story & Quote */}
                  <th className="py-3 px-4 min-w-[320px]">Story & Highlights</th>

                  {/* Status */}
                  <th className="py-3 px-4 w-36 text-center">Status</th>

                  {/* Actions */}
                  <th className="py-3 px-4 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {filteredTestimonials.map((t, index) => {
                  const isSelected = selectedIds.includes(t._id);
                  const avatarSrc = t.avatar ? getMediaUrl(t.avatar) : null;
                  const hasImgError = imageErrors[t._id];

                  return (
                    <tr
                      key={t._id}
                      onClick={() => setPreviewTestimonial(t)}
                      className={`group transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-brand/5 dark:bg-brand/10'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleToggleSelectOne(t._id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'text-brand' : 'text-slate-400 hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                        </button>
                      </td>

                      {/* S.No */}
                      <td className="py-3.5 px-3 text-center font-mono text-[11px] text-[var(--text-muted)]">
                        {index + 1}
                      </td>

                      {/* Author */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar with fallback */}
                          <div className="relative shrink-0">
                            {avatarSrc && !hasImgError ? (
                              <img
                                src={avatarSrc}
                                alt={t.name}
                                onError={() => handleImageError(t._id)}
                                className="w-10 h-10 rounded-full object-cover border border-[var(--border)] shadow-2xs"
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(t.name)} flex items-center justify-center font-bold text-xs tracking-wider shadow-2xs`}>
                                {getInitials(t.name)}
                              </div>
                            )}

                            {t.isVerified && (
                              <div
                                className="absolute -bottom-0.5 -right-0.5 bg-blue-500 text-white rounded-full p-0.5 shadow-2xs"
                                title="Verified Buyer Experience"
                              >
                                <Check size={9} strokeWidth={3} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[var(--text-primary)] truncate max-w-[160px]">
                                {t.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] mt-0.5 truncate max-w-[200px]">
                              <span>{t.role || 'Homebuyer'}</span>
                              {t.location && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                                  <span className="flex items-center gap-0.5 truncate">
                                    <MapPin size={10} className="shrink-0 text-slate-400" />
                                    {t.location}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Story & Quote */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <p className="text-[12.5px] text-[var(--text-primary)] leading-snug line-clamp-2">
                            "{t.quote}"
                          </p>

                          {/* Chips row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {t.propertyType && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border)]">
                                <Building2 size={10} className="text-slate-400" />
                                {t.propertyType}
                              </span>
                            )}

                            {t.journeyType && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-brand/10 text-brand border border-brand/20">
                                <Sparkles size={10} />
                                {t.journeyType}
                              </span>
                            )}

                            {t.stages && t.stages.length > 0 && (
                              <span className="text-[10.5px] text-[var(--text-muted)]">
                                Stage: <strong className="font-medium text-[var(--text-primary)]">{t.stages[t.activeStageIndex] || t.stages[0]}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status & 1-Click Toggle */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleToggleStatus(t._id, t.isActive, e)}
                          disabled={statusTogglingId === t._id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                            t.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                          title={`Click to ${t.isActive ? 'hide from website' : 'publish to website'}`}
                        >
                          {statusTogglingId === t._id ? (
                            <RefreshCw size={11} className="animate-spin text-slate-500" />
                          ) : (
                            <span className={`w-1.5 h-1.5 rounded-full ${t.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          )}
                          <span>{t.isActive ? 'Active' : 'Hidden'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick Preview */}
                          <button
                            type="button"
                            onClick={() => setPreviewTestimonial(t)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                            title="Quick preview card"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={(e) => openEditModal(t, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors cursor-pointer"
                            title="Edit story"
                          >
                            <Edit size={15} />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeleteModal({ open: true, id: t._id, name: t.name, isDeleting: false })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="Delete story"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Info */}
        {!isLoading && filteredTestimonials.length > 0 && (
          <div className="px-5 py-3 border-t border-[var(--border)] bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-muted)] gap-2">
            <div>
              Showing <span className="font-semibold text-[var(--text-primary)]">{filteredTestimonials.length}</span> of <span className="font-semibold text-[var(--text-primary)]">{stats.total}</span> total stories
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {stats.active} published
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {stats.verified} verified
              </span>
            </div>
          </div>
        )}
      </div>

      {/* --- LIVE STORY PREVIEW MODAL --- */}
      {previewTestimonial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setPreviewTestimonial(null)}
          />

          <div className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Top Header */}
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-muted)]/50">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-brand" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Frontend Card Preview</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTestimonial(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Testimonial Card Body */}
            <div className="p-6 space-y-5">
              {/* Optional Property Header Image */}
              {previewTestimonial.propertyImage && (
                <div className="relative w-full h-44 rounded-xl overflow-hidden border border-[var(--border)] bg-slate-100 dark:bg-slate-800">
                  <img
                    src={getMediaUrl(previewTestimonial.propertyImage)}
                    alt="Property"
                    className="w-full h-full object-cover"
                  />
                  {previewTestimonial.propertyType && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-semibold bg-black/60 backdrop-blur-md text-white border border-white/20">
                      {previewTestimonial.propertyType}
                    </div>
                  )}
                </div>
              )}

              {/* Quote Mark Decoration & Text */}
              <div className="relative">
                <Quote size={28} className="text-brand/20 mb-2" />
                <p className="text-sm text-[var(--text-primary)] font-normal leading-relaxed">
                  "{previewTestimonial.quote}"
                </p>
              </div>

              {/* Journey Steps Progress Bar */}
              {previewTestimonial.stages && previewTestimonial.stages.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-muted)]">
                    <span>Buyer Journey Progress</span>
                    <span className="text-brand">
                      Step {(previewTestimonial.activeStageIndex || 0) + 1} of {previewTestimonial.stages.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {previewTestimonial.stages.map((stage, idx) => {
                      const isActive = idx === (previewTestimonial.activeStageIndex || 0);
                      const isCompleted = idx < (previewTestimonial.activeStageIndex || 0);
                      return (
                        <div key={idx} className="space-y-1 text-center">
                          <div className={`h-1.5 rounded-full ${
                            isActive
                              ? 'bg-brand'
                              : isCompleted
                              ? 'bg-emerald-500'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`} />
                          <span className={`block text-[10px] truncate ${
                            isActive
                              ? 'font-bold text-brand'
                              : 'text-[var(--text-muted)]'
                          }`}>
                            {stage}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Author Info Bar */}
              <div className="pt-2 flex items-center justify-between border-t border-[var(--border)]">
                <div className="flex items-center gap-3">
                  {previewTestimonial.avatar ? (
                    <img
                      src={getMediaUrl(previewTestimonial.avatar)}
                      alt={previewTestimonial.name}
                      className="w-11 h-11 rounded-full object-cover border border-[var(--border)] shadow-xs"
                    />
                  ) : (
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarGradient(previewTestimonial.name)} flex items-center justify-center font-bold text-xs shadow-xs`}>
                      {getInitials(previewTestimonial.name)}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">
                        {previewTestimonial.name}
                      </h4>
                      {previewTestimonial.isVerified && (
                        <ShieldCheck size={14} className="text-blue-500 shrink-0" title="Verified" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      {previewTestimonial.role || 'Homebuyer'}
                      {previewTestimonial.location && ` • ${previewTestimonial.location}`}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                    previewTestimonial.isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${previewTestimonial.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {previewTestimonial.isActive ? 'Live on Site' : 'Draft'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-[var(--border)] bg-[var(--bg-muted)]/50 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPreviewTestimonial(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] hover:bg-[var(--bg-surface)] text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const t = previewTestimonial;
                  setPreviewTestimonial(null);
                  openEditModal(t);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-brand text-white hover:bg-brand-dark transition-colors cursor-pointer"
              >
                <Edit size={14} />
                <span>Edit Story</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT FORM MODAL --- */}
      {modalState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => !modalState.isSubmitting && setModalState(prev => ({ ...prev, open: false }))}
          />

          <div className="relative w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-muted)]/50 shrink-0">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {modalState.mode === 'create' ? 'Create New Testimonial' : 'Edit Testimonial'}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Provide customer story details, photo, and journey milestone.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalState(prev => ({ ...prev, open: false }))}
                disabled={modalState.isSubmitting}
                className="p-1 rounded-lg text-slate-400 hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleModalSubmit} className="overflow-y-auto flex-1 p-6 space-y-6">
              {modalState.error && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center gap-2.5 text-red-700 dark:text-red-300 text-xs font-medium">
                  <AlertCircle size={16} className="shrink-0" />
                  <p>{modalState.error}</p>
                </div>
              )}

              {/* Section 1: Author Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-[var(--border)]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Author Information
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={modalState.name}
                      onChange={(e) => setModalState(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Priya Kapoor"
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] focus:border-brand focus:bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-slate-400 outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                      Role / User Type
                    </label>
                    <input
                      type="text"
                      value={modalState.role}
                      onChange={(e) => setModalState(prev => ({ ...prev, role: e.target.value }))}
                      placeholder="e.g. First-time Homebuyer"
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] focus:border-brand focus:bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-slate-400 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                      Location
                    </label>
                    <input
                      type="text"
                      value={modalState.location}
                      onChange={(e) => setModalState(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g. Bandra West, Mumbai"
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] focus:border-brand focus:bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-slate-400 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                      Profile Avatar
                    </label>
                    <div className="flex items-center gap-3">
                      {modalState.avatar ? (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[var(--border)] shrink-0">
                          <img src={modalState.avatar} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage('avatar')}
                            className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                            title="Remove avatar"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[var(--bg-muted)] border border-dashed border-[var(--border)] flex items-center justify-center text-slate-400 shrink-0">
                          <ImageIcon size={18} />
                        </div>
                      )}

                      <label className="cursor-pointer px-3 py-1.5 text-xs font-semibold rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] transition-all">
                        <span>{modalState.avatar ? 'Change' : 'Upload Avatar'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, 'avatar')}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Story & Quote */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-[var(--border)]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Story & Review
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">
                      Customer Quote *
                    </label>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {modalState.quote.length} characters
                    </span>
                  </div>
                  <textarea
                    value={modalState.quote}
                    onChange={(e) => setModalState(prev => ({ ...prev, quote: e.target.value }))}
                    placeholder="Enter the customer's exact feedback or quote..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] focus:border-brand focus:bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-slate-400 outline-none transition-all resize-y"
                    required
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
                  <div>
                    <span className="block text-xs font-semibold text-[var(--text-primary)]">
                      Verified Experience
                    </span>
                    <span className="block text-[11px] text-[var(--text-muted)]">
                      Display verified buyer badge next to the author's name
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modalState.isVerified}
                      onChange={(e) => setModalState(prev => ({ ...prev, isVerified: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>
              </div>

              {/* Section 3: Property & Journey Configuration */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-[var(--border)]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Property & Journey Milestone
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                      Property Type
                    </label>
                    <input
                      type="text"
                      value={modalState.propertyType}
                      onChange={(e) => setModalState(prev => ({ ...prev, propertyType: e.target.value }))}
                      placeholder="e.g. Residential 3BHK"
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] focus:border-brand focus:bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-slate-400 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                      Journey Label
                    </label>
                    <input
                      type="text"
                      value={modalState.journeyType}
                      onChange={(e) => setModalState(prev => ({ ...prev, journeyType: e.target.value }))}
                      placeholder="e.g. First-time homebuyer"
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] focus:border-brand focus:bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-slate-400 outline-none transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                      Journey Stages (comma separated)
                    </label>
                    <input
                      type="text"
                      value={modalState.stages}
                      onChange={(e) => setModalState(prev => ({ ...prev, stages: e.target.value }))}
                      placeholder="Discover, Verify, Understand, Decide"
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] focus:border-brand focus:bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-slate-400 outline-none transition-all"
                    />
                    {/* Live Stages preview */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[11px] text-[var(--text-muted)] mr-1">Active Stage:</span>
                      {modalState.stages.split(',').map((s, idx) => {
                        const trimmed = s.trim();
                        if (!trimmed) return null;
                        const isSelected = idx === parseInt(modalState.activeStageIndex, 10);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setModalState(prev => ({ ...prev, activeStageIndex: idx }))}
                            className={`px-2.5 py-0.5 rounded-lg text-[10.5px] font-semibold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-brand text-white border-brand shadow-2xs'
                                : 'bg-[var(--bg-muted)] text-[var(--text-muted)] border-[var(--border)] hover:border-slate-400'
                            }`}
                          >
                            {trimmed}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                      Property Image (Optional)
                    </label>
                    <div className="flex items-center gap-3">
                      {modalState.propertyImage ? (
                        <div className="relative w-28 h-18 rounded-xl overflow-hidden border border-[var(--border)] shrink-0 bg-slate-100 dark:bg-slate-800">
                          <img src={modalState.propertyImage} alt="Property" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage('propertyImage')}
                            className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                            title="Remove photo"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-28 h-18 rounded-xl bg-[var(--bg-muted)] border border-dashed border-[var(--border)] flex items-center justify-center text-slate-400 shrink-0">
                          <ImageIcon size={20} />
                        </div>
                      )}

                      <label className="cursor-pointer px-3 py-1.5 text-xs font-semibold rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] transition-all">
                        <span>{modalState.propertyImage ? 'Change Image' : 'Upload Property Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, 'propertyImage')}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Settings & Visibility */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-[var(--border)]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Visibility & Ordering
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                      Display Sort Order
                    </label>
                    <input
                      type="number"
                      value={modalState.displayOrder}
                      onChange={(e) => setModalState(prev => ({ ...prev, displayOrder: e.target.value }))}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] focus:border-brand focus:bg-[var(--bg-surface)] text-[var(--text-primary)] outline-none transition-all"
                    />
                    <span className="text-[10.5px] text-[var(--text-muted)] mt-1 block">
                      Lower numbers appear first on the frontend.
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] self-start">
                    <div>
                      <span className="block text-xs font-semibold text-[var(--text-primary)]">
                        Active Status
                      </span>
                      <span className="block text-[11px] text-[var(--text-muted)]">
                        Publish story to live homepage
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalState.isActive}
                        onChange={(e) => setModalState(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-[var(--border)] flex justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalState(prev => ({ ...prev, open: false }))}
                  disabled={modalState.isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalState.isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-brand hover:bg-brand-dark rounded-xl transition-all shadow-xs active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {modalState.isSubmitting ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  <span>{modalState.mode === 'create' ? 'Publish Story' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SINGLE DELETE CONFIRMATION MODAL --- */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => !deleteModal.isDeleting && setDeleteModal({ open: false, id: null, name: '', isDeleting: false })}
          />
          <div className="relative w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-5 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center mx-auto mb-3 border border-red-200 dark:border-red-900 text-red-500">
              <Trash2 size={20} />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">Delete Testimonial?</h3>
            <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">
              Are you sure you want to permanently remove this testimonial? This action cannot be undone.
            </p>
            {deleteModal.name && (
              <div className="p-2.5 bg-[var(--bg-muted)] rounded-xl border border-[var(--border)] text-xs font-medium text-[var(--text-primary)] mb-4 text-left truncate">
                Author: {deleteModal.name}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, id: null, name: '', isDeleting: false })}
                disabled={deleteModal.isDeleting}
                className="flex-1 py-2 text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl hover:bg-[var(--bg-muted)] transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteModal.isDeleting}
                className="flex-1 inline-flex justify-center items-center gap-1.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-70"
              >
                {deleteModal.isDeleting ? <RefreshCw size={13} className="animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BULK DELETE CONFIRMATION MODAL --- */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => !isBulkDeleting && setShowBulkDeleteModal(false)}
          />
          <div className="relative w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-5 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center mx-auto mb-3 border border-red-200 dark:border-red-900 text-red-500">
              <Trash2 size={20} />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
              Delete {selectedIds.length} Testimonials?
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
              You are about to permanently delete {selectedIds.length} selected stories. This action cannot be undone.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={isBulkDeleting}
                className="flex-1 py-2 text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl hover:bg-[var(--bg-muted)] transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDeleteConfirm}
                disabled={isBulkDeleting}
                className="flex-1 inline-flex justify-center items-center gap-1.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-70"
              >
                {isBulkDeleting ? <RefreshCw size={13} className="animate-spin" /> : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestimonialManagement;
