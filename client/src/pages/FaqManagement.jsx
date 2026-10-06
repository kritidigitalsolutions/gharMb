import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus, Search, Edit, Trash2,
  CheckCircle2, Clock, Folder, AlertCircle, RefreshCw, 
  Layers, CheckSquare, Square, X, Check, ArrowUpDown,
  FileQuestion, HelpCircle, RotateCcw, ChevronDown
} from 'lucide-react';
import API from '../api/api';

const FaqManagement = () => {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selection & Bulk Operations
  const [selectedFaqIds, setSelectedFaqIds] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortDirection, setSortDirection] = useState('desc');

  // Stats from Database
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  // Form Modal (Add / Edit)
  const [modalState, setModalState] = useState({
    open: false,
    mode: 'create', // 'create' or 'edit'
    faqId: null,
    question: '',
    answer: '',
    category: '',
    isActive: true,
    isSubmitting: false,
    error: null,
  });

  // Single Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    faqId: null,
    question: '',
    isDeleting: false,
  });

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Fetch real categories for filter & modal dropdown
  const fetchCategories = async () => {
    try {
      const res = await API.get('/admin/faq-categories');
      if (res.data?.data?.categories) {
        setCategories(res.data.data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Fetch real FAQs from database
  const fetchFaqs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;
      params.sort = sortDirection;

      const res = await API.get('/admin/faqs', { params });
      if (res.data?.data?.faqs) {
        let fetchedFaqs = res.data.data.faqs;
        // Client-side fallback filter if backend didn't filter status
        if (selectedStatus === 'active') {
          fetchedFaqs = fetchedFaqs.filter(f => f.isActive === true);
        } else if (selectedStatus === 'inactive') {
          fetchedFaqs = fetchedFaqs.filter(f => f.isActive === false);
        }
        setFaqs(fetchedFaqs);
      }

      // Update real database stats
      if (res.data?.stats) {
        setStats({
          total: res.data.stats.total ?? 0,
          active: res.data.stats.active ?? 0,
          inactive: res.data.stats.inactive ?? 0,
        });
      } else if (res.data?.data?.faqs) {
        const total = res.data.data.faqs.length;
        const active = res.data.data.faqs.filter(f => f.isActive).length;
        setStats({
          total,
          active,
          inactive: total - active,
        });
      }
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      setError('Failed to load FAQs. Please check database connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [selectedCategory, selectedStatus, sortDirection]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFaqs();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Check active filter state
  const hasActiveFilters = Boolean(search.trim() || selectedCategory || selectedStatus);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedStatus('');
  };

  // Selection helpers
  const isAllSelected = faqs.length > 0 && selectedFaqIds.length === faqs.length;
  const isSomeSelected = selectedFaqIds.length > 0 && selectedFaqIds.length < faqs.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedFaqIds([]);
    } else {
      setSelectedFaqIds(faqs.map(f => f._id));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedFaqIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Single Delete
  const handleDeleteConfirm = async () => {
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      await API.delete(`/admin/faqs/${deleteModal.faqId}`);
      triggerToast('FAQ deleted successfully');
      setFaqs(prev => prev.filter(f => f._id !== deleteModal.faqId));
      setSelectedFaqIds(prev => prev.filter(id => id !== deleteModal.faqId));
      setDeleteModal({ open: false, faqId: null, question: '', isDeleting: false });
      fetchFaqs();
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Failed to delete FAQ', 'error');
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Bulk Delete
  const handleBulkDeleteConfirm = async () => {
    if (selectedFaqIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await API.post('/admin/faqs/bulk-delete', { ids: selectedFaqIds });
      triggerToast(`${selectedFaqIds.length} FAQs deleted successfully`);
      setFaqs(prev => prev.filter(f => !selectedFaqIds.includes(f._id)));
      setSelectedFaqIds([]);
      setShowBulkDeleteModal(false);
      fetchFaqs();
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Failed to delete FAQs', 'error');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Quick Inline Status Toggle
  const handleToggleStatus = async (faq) => {
    const updatedStatus = !faq.isActive;
    try {
      await API.put(`/admin/faqs/${faq._id}`, { isActive: updatedStatus });
      setFaqs(prev =>
        prev.map(f => (f._id === faq._id ? { ...f, isActive: updatedStatus } : f))
      );
      setStats(prev => ({
        ...prev,
        active: updatedStatus ? prev.active + 1 : prev.active - 1,
        inactive: updatedStatus ? prev.inactive - 1 : prev.inactive + 1,
      }));
      triggerToast(`FAQ marked as ${updatedStatus ? 'active' : 'inactive'}`);
    } catch (err) {
      triggerToast('Failed to update status', 'error');
    }
  };

  // Add / Edit Modal Submit
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const { question, answer, category, isActive, mode, faqId } = modalState;

    if (!question.trim() || !answer.trim() || !category) {
      setModalState(prev => ({ ...prev, error: 'Please fill all required fields' }));
      return;
    }

    setModalState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const payload = { question: question.trim(), answer: answer.trim(), category, isActive };

      if (mode === 'create') {
        const res = await API.post('/admin/faqs', payload);
        triggerToast('FAQ created successfully');
        setModalState(prev => ({ ...prev, open: false }));
        fetchFaqs();
      } else {
        const res = await API.put(`/admin/faqs/${faqId}`, payload);
        triggerToast('FAQ updated successfully');
        setModalState(prev => ({ ...prev, open: false }));
        fetchFaqs();
      }
    } catch (err) {
      setModalState(prev => ({
        ...prev,
        error: err.response?.data?.message || 'Something went wrong',
        isSubmitting: false,
      }));
    }
  };

  const openAddModal = () => {
    setModalState({
      open: true,
      mode: 'create',
      faqId: null,
      question: '',
      answer: '',
      category: categories.length > 0 ? categories[0]._id : '',
      isActive: true,
      isSubmitting: false,
      error: null,
    });
  };

  const openEditModal = (faq) => {
    setModalState({
      open: true,
      mode: 'edit',
      faqId: faq._id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category?._id || faq.category,
      isActive: faq.isActive,
      isSubmitting: false,
      error: null,
    });
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2.5 transition-all animate-in fade-in slide-in-from-top-3 ${
            toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/60 dark:border-red-900 dark:text-red-300'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-900 dark:text-emerald-300'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)] mb-1">
            <span>Content</span>
            <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]/40" />
            <span className="text-[var(--text-primary)]">FAQ Management</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
              FAQs
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md">
              {stats.total} total
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Manage frequently asked questions, categorized answers, and public visibility.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/faq/categories"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] transition-colors shadow-xs"
          >
            <Layers size={14} className="text-[var(--text-muted)]" />
            Manage Categories ({categories.length})
          </Link>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand hover:bg-brand-dark text-white transition-all shadow-xs hover:shadow-sm active:scale-98 cursor-pointer"
          >
            <Plus size={15} />
            Add FAQ
          </button>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedFaqIds.length > 0 && (
        <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-brand/30 shadow-2xs flex items-center justify-between flex-wrap gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2 pl-1">
            <span className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold">
              {selectedFaqIds.length}
            </span>
            <span className="text-xs font-medium text-[var(--text-primary)]">
              {selectedFaqIds.length} FAQ{selectedFaqIds.length === 1 ? '' : 's'} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isBulkDeleting}
              onClick={() => setShowBulkDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={13} />
              Delete Selected
            </button>
            <button
              type="button"
              onClick={() => setSelectedFaqIds([])}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
              title="Deselect all"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xs flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search questions or answers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 h-8 text-xs rounded-lg bg-[var(--bg-muted)]/50 border border-[var(--border)] focus:bg-[var(--bg-surface)] focus:border-brand text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter pills */}
          <div className="flex items-center p-0.5 bg-[var(--bg-muted)]/60 rounded-lg border border-[var(--border)] text-xs">
            <button
              type="button"
              onClick={() => setSelectedStatus('')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                !selectedStatus || selectedStatus === 'all'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('active')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                selectedStatus === 'active'
                  ? 'bg-[var(--bg-surface)] text-emerald-600 dark:text-emerald-400 shadow-2xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live ({stats.active})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('inactive')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                selectedStatus === 'inactive'
                  ? 'bg-[var(--bg-surface)] text-amber-600 dark:text-amber-400 shadow-2xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Hidden ({stats.inactive})
            </button>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 pl-3 pr-7 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors outline-none cursor-pointer appearance-none"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
              <ChevronDown size={12} />
            </div>
          </div>

          {/* Sort Direction Toggle */}
          <button
            onClick={() => setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] transition-colors text-xs cursor-pointer"
            title={`Sort order: ${sortDirection === 'desc' ? 'Newest first' : 'Oldest first'}`}
          >
            <ArrowUpDown size={13} className="text-slate-400" />
            <span className="hidden sm:inline">{sortDirection === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={fetchFaqs}
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-muted)] transition-colors cursor-pointer"
            title="Refresh FAQs"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-muted)]/60 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                <th className="py-3 px-4 w-10">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-slate-400 hover:text-[var(--text-primary)] transition-colors flex items-center cursor-pointer"
                  >
                    {isAllSelected ? (
                      <CheckSquare size={16} className="text-brand" />
                    ) : isSomeSelected ? (
                      <div className="relative">
                        <Square size={16} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-[2px] bg-brand rounded-xs" />
                        </div>
                      </div>
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4 w-14 text-center font-mono">S.No</th>
                <th className="py-3 px-4 min-w-[280px]">Question</th>
                <th className="py-3 px-4 min-w-[140px]">Category</th>
                <th className="py-3 px-4 text-center w-28">Status</th>
                <th className="py-3 px-4 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="w-4 h-4 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="py-4 px-4 text-center"><div className="w-6 h-3 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                    <td className="py-4 px-4 space-y-2">
                      <div className="w-3/5 h-3.5 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="w-4/5 h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded" />
                    </td>
                    <td className="py-4 px-4"><div className="w-20 h-5 bg-slate-200 dark:bg-slate-800 rounded-md" /></td>
                    <td className="py-4 px-4 text-center"><div className="w-16 h-5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" /></td>
                    <td className="py-4 px-4 text-right"><div className="w-14 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-red-500">
                    <AlertCircle size={22} className="mx-auto mb-2 opacity-60" />
                    <p className="text-xs font-semibold">{error}</p>
                    <button
                      onClick={fetchFaqs}
                      className="mt-3 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand text-white cursor-pointer"
                    >
                      Try Again
                    </button>
                  </td>
                </tr>
              ) : faqs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-muted)] flex items-center justify-center mx-auto mb-3 border border-[var(--border)] text-slate-400">
                      <Search size={18} />
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">No FAQs found</h3>
                    <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                      {hasActiveFilters
                        ? 'Try adjusting your search query or filters to find what you are looking for.'
                        : 'No FAQs have been created yet. Click "Add FAQ" to create your first question.'}
                    </p>
                    {hasActiveFilters ? (
                      <button
                        onClick={handleResetFilters}
                        className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand hover:underline cursor-pointer"
                      >
                        <RotateCcw size={12} />
                        Clear filters
                      </button>
                    ) : (
                      <button
                        onClick={openAddModal}
                        className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand hover:bg-brand-dark text-white cursor-pointer transition-colors"
                      >
                        <Plus size={14} />
                        Add First FAQ
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                faqs.map((faq, index) => {
                  const isSelected = selectedFaqIds.includes(faq._id);
                  return (
                    <tr
                      key={faq._id}
                      className={`transition-colors duration-150 group ${
                        isSelected
                          ? 'bg-orange-50/40 dark:bg-orange-950/20'
                          : 'hover:bg-[var(--bg-muted)]/50'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectOne(faq._id)}
                          className={`cursor-pointer transition-colors flex items-center ${
                            isSelected ? 'text-brand' : 'text-slate-400 hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                        </button>
                      </td>

                      {/* S.No */}
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-[var(--text-muted)]">
                        {index + 1}
                      </td>

                      {/* Question & Answer Excerpt */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[var(--text-primary)] leading-snug line-clamp-1 group-hover:text-brand transition-colors">
                          {faq.question}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                          {faq.answer}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--text-primary)]">
                          <Folder size={11} className="text-slate-400" />
                          {faq.category?.name || 'Uncategorized'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(faq)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                            faq.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                          }`}
                          title={`Click to ${faq.isActive ? 'hide FAQ from' : 'show FAQ on'} public website`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              faq.isActive ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          {faq.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(faq)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-brand hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                            title="Edit FAQ"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteModal({
                                open: true,
                                faqId: faq._id,
                                question: faq.question,
                                isDeleting: false,
                              })
                            }
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="Delete FAQ"
                          >
                            <Trash2 size={14} />
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

        {/* Table Footer */}
        {!isLoading && faqs.length > 0 && (
          <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-muted)]/30 flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>
              Showing <strong className="text-[var(--text-primary)]">{faqs.length}</strong> of{' '}
              <strong className="text-[var(--text-primary)]">{stats.total}</strong> FAQs
            </span>
            <span className="text-[11px]">
              {selectedFaqIds.length > 0 ? `${selectedFaqIds.length} selected` : 'All real database records'}
            </span>
          </div>
        )}
      </div>

      {/* --- ADD / EDIT MODAL --- */}
      {modalState.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] max-w-lg w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {modalState.mode === 'create' ? 'Add New FAQ' : 'Edit FAQ'}
              </h3>
              <button
                type="button"
                onClick={() => setModalState(prev => ({ ...prev, open: false }))}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm cursor-pointer p-1 rounded-md"
              >
                <X size={16} />
              </button>
            </div>

            {modalState.error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 font-medium flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{modalState.error}</span>
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-3.5">
              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
                  Category <span className="text-brand">*</span>
                </label>
                <select
                  value={modalState.category}
                  onChange={(e) => setModalState(prev => ({ ...prev, category: e.target.value }))}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] focus:border-brand focus:bg-[var(--bg-surface)] text-[var(--text-primary)] outline-none transition-colors cursor-pointer"
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Question */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
                  Question <span className="text-brand">*</span>
                </label>
                <input
                  type="text"
                  value={modalState.question}
                  onChange={(e) => setModalState(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="e.g., How does GharMB verify properties?"
                  required
                  autoFocus
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] focus:border-brand focus:bg-[var(--bg-surface)] text-[var(--text-primary)] outline-none transition-colors"
                />
              </div>

              {/* Answer */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
                  Answer <span className="text-brand">*</span>
                </label>
                <textarea
                  value={modalState.answer}
                  onChange={(e) => setModalState(prev => ({ ...prev, answer: e.target.value }))}
                  placeholder="Provide a clear, detailed answer..."
                  rows={4}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] focus:border-brand focus:bg-[var(--bg-surface)] text-[var(--text-primary)] outline-none transition-colors resize-y"
                />
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)]">
                <div>
                  <p className="text-xs font-medium text-[var(--text-primary)]">Public Visibility</p>
                  <p className="text-[11px] text-[var(--text-muted)]">Show this question on the public FAQ section</p>
                </div>
                <input
                  type="checkbox"
                  checked={modalState.isActive}
                  onChange={(e) => setModalState(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-brand rounded accent-brand cursor-pointer"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  disabled={modalState.isSubmitting}
                  onClick={() => setModalState(prev => ({ ...prev, open: false }))}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalState.isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand hover:bg-brand-dark text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {modalState.isSubmitting && <RefreshCw size={13} className="animate-spin" />}
                  {modalState.mode === 'create' ? 'Save FAQ' : 'Update FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SINGLE DELETE MODAL --- */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] max-w-sm w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Delete FAQ</h3>
                <p className="text-xs text-[var(--text-muted)]">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete:
            </p>
            <div className="p-2.5 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] text-xs text-[var(--text-primary)] font-medium line-clamp-2 italic">
              "{deleteModal.question}"
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                disabled={deleteModal.isDeleting}
                onClick={() => setDeleteModal({ open: false, faqId: null, question: '', isDeleting: false })}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteModal.isDeleting}
                onClick={handleDeleteConfirm}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleteModal.isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BULK DELETE MODAL --- */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] max-w-sm w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Delete {selectedFaqIds.length} FAQs
                </h3>
                <p className="text-xs text-[var(--text-muted)]">Permanent removal from database</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-[var(--text-primary)]">{selectedFaqIds.length}</strong> selected FAQs?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={handleBulkDeleteConfirm}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {isBulkDeleting ? 'Deleting...' : `Delete ${selectedFaqIds.length} FAQs`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaqManagement;
