import React, { useState, useEffect } from 'react';
import AdminLoader from '../components/common/AdminLoader';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Edit, Trash2, CheckCircle2,
  Folder, Layers, AlertCircle, RefreshCw, FileText,
  X, Check, Search, CheckSquare, Square
} from 'lucide-react';
import API from '../api/api';
import Badge from '../components/ui/Badge';

const FaqCategories = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Selection & Bulk Operations
  const [selectedCatIds, setSelectedCatIds] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkMoveToCategory, setBulkMoveToCategory] = useState('');
  const [bulkDeleteError, setBulkDeleteError] = useState(null);

  // Form Modal (Add / Edit)
  const [modalState, setModalState] = useState({
    open: false,
    mode: 'create', // 'create' or 'edit'
    categoryId: null,
    name: '',
    isActive: true,
    isSubmitting: false,
    error: null,
  });

  // Delete Modal (Single)
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    category: null,
    moveToCategory: '',
    isDeleting: false,
    error: null,
  });

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await API.get('/admin/faq-categories');
      if (res.data?.data?.categories) {
        setCategories(res.data.data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please check database connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filtered categories based on search
  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Selection helpers
  const isAllSelected = filteredCategories.length > 0 && selectedCatIds.length === filteredCategories.length;
  const isSomeSelected = selectedCatIds.length > 0 && selectedCatIds.length < filteredCategories.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCatIds([]);
    } else {
      setSelectedCatIds(filteredCategories.map(c => c._id));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedCatIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Bulk Delete Action
  const handleOpenBulkDelete = () => {
    setBulkDeleteError(null);
    const remainingCats = categories.filter(c => !selectedCatIds.includes(c._id));
    setBulkMoveToCategory(remainingCats.length > 0 ? remainingCats[0]._id : '');
    setShowBulkDeleteModal(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedCatIds.length === 0) return;

    const totalFAQs = categories
      .filter(c => selectedCatIds.includes(c._id))
      .reduce((sum, c) => sum + (c.faqCount || 0), 0);
    const remainingCats = categories.filter(c => !selectedCatIds.includes(c._id));

    if (totalFAQs > 0 && (!bulkMoveToCategory || remainingCats.length === 0)) {
      setBulkDeleteError(
        remainingCats.length === 0
          ? 'Cannot delete all categories because FAQs exist. Please leave at least one category to reassign FAQs.'
          : 'Please select a valid remaining category to reassign FAQs to.'
      );
      return;
    }

    setIsBulkDeleting(true);
    setBulkDeleteError(null);

    try {
      const payload = {
        ids: selectedCatIds,
      };
      if (totalFAQs > 0 && bulkMoveToCategory) {
        payload.moveToCategory = bulkMoveToCategory;
      }

      const res = await API.post('/admin/faq-categories/bulk-delete', payload);
      triggerToast(res.data?.message || `${selectedCatIds.length} categories deleted successfully.`);
      setSelectedCatIds([]);
      setShowBulkDeleteModal(false);
      fetchCategories();
    } catch (err) {
      console.error('Error bulk deleting categories:', err);
      setBulkDeleteError(err.response?.data?.message || 'Failed to delete selected categories.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Preview generated slug
  const previewSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  // Open Create Modal
  const handleOpenAdd = () => {
    setModalState({
      open: true,
      mode: 'create',
      categoryId: null,
      name: '',
      isActive: true,
      isSubmitting: false,
      error: null,
    });
  };

  // Open Edit Modal
  const handleOpenEdit = (category) => {
    setModalState({
      open: true,
      mode: 'edit',
      categoryId: category._id,
      name: category.name,
      isActive: category.isActive !== undefined ? category.isActive : true,
      isSubmitting: false,
      error: null,
    });
  };

  // Submit Add / Edit
  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    if (!modalState.name.trim()) {
      setModalState(prev => ({ ...prev, error: 'Category name is required.' }));
      return;
    }

    setModalState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      if (modalState.mode === 'create') {
        await API.post('/admin/faq-categories', {
          name: modalState.name.trim(),
          isActive: modalState.isActive,
        });
        triggerToast('Category created successfully!');
      } else {
        await API.put(`/admin/faq-categories/${modalState.categoryId}`, {
          name: modalState.name.trim(),
          isActive: modalState.isActive,
        });
        triggerToast('Category updated successfully!');
      }

      setModalState({
        open: false,
        mode: 'create',
        categoryId: null,
        name: '',
        isActive: true,
        isSubmitting: false,
        error: null,
      });
      fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      setModalState(prev => ({
        ...prev,
        isSubmitting: false,
        error: err.response?.data?.message || 'Failed to save category.',
      }));
    }
  };

  // Open Delete Modal (Single)
  const handleOpenDelete = (category) => {
    const otherCats = categories.filter(c => c._id !== category._id);
    const defaultReassign = otherCats.length > 0 ? otherCats[0]._id : '';

    setDeleteModal({
      open: true,
      category,
      moveToCategory: defaultReassign,
      isDeleting: false,
      error: null,
    });
  };

  // Submit Delete (Single)
  const handleDeleteConfirm = async () => {
    if (!deleteModal.category) return;
    const cat = deleteModal.category;

    if (cat.faqCount > 0 && !deleteModal.moveToCategory) {
      setDeleteModal(prev => ({
        ...prev,
        error: 'Please select a category to reassign existing FAQs.',
      }));
      return;
    }

    setDeleteModal(prev => ({ ...prev, isDeleting: true, error: null }));

    try {
      await API.delete(`/admin/faq-categories/${cat._id}`, {
        data: cat.faqCount > 0 ? { moveToCategory: deleteModal.moveToCategory } : {},
      });
      triggerToast('Category deleted successfully.');
      setDeleteModal({ open: false, category: null, moveToCategory: '', isDeleting: false, error: null });
      setSelectedCatIds(prev => prev.filter(id => id !== cat._id));
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      setDeleteModal(prev => ({
        ...prev,
        isDeleting: false,
        error: err.response?.data?.message || 'Failed to delete category.',
      }));
    }
  };

  // Quick toggle active status
  const handleToggleActive = async (category) => {
    try {
      await API.put(`/admin/faq-categories/${category._id}`, {
        name: category.name,
        isActive: !category.isActive,
      });
      triggerToast(`Category ${!category.isActive ? 'activated' : 'hidden'} successfully!`);
      fetchCategories();
    } catch (err) {
      console.error('Error updating status:', err);
      triggerToast('Failed to update category status.', 'error');
    }
  };

  // Real aggregations
  const totalAssignedFaqs = categories.reduce((sum, c) => sum + (c.faqCount || 0), 0);
  const activeCount = categories.filter(c => c.isActive).length;

  return (
    <div className="w-full space-y-4 pb-20">
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

      {/* Top Header & Breadcrumb */}
      <div className="border-b border-[var(--border)] pb-3">
        <Link
          to="/admin/faq"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-brand transition-colors mb-2 cursor-pointer"
        >
          <ArrowLeft size={13} /> Back to FAQs
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
                FAQ Categories
              </h1>
              <Badge color="slate" variant="pastel" size="xs">
                {categories.length} total
              </Badge>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Organize frequently asked questions into topic taxonomies for discovery on the public portal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchCategories}
              title="Refresh categories"
              className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-muted)] transition-colors cursor-pointer"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand hover:bg-brand-dark text-white transition-all shadow-xs hover:shadow-sm active:scale-98 cursor-pointer"
            >
              <Plus size={15} />
              New Category
            </button>
          </div>
        </div>
      </div>

      {/* Real Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total Categories */}
        <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-muted)]">Total Categories</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Layers size={14} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              {categories.length}
            </span>
            <span className="text-[11px] font-medium text-[var(--text-muted)]">Configured in DB</span>
          </div>
        </div>

        {/* Active on Site */}
        <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-muted)]">Active Topics</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {activeCount}
            </span>
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              Live on website
            </span>
          </div>
        </div>

        {/* Total Assigned FAQs */}
        <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-muted)]">Assigned FAQs</span>
            <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
              <FileText size={14} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              {totalAssignedFaqs}
            </span>
            <span className="text-[11px] font-medium text-[var(--text-muted)]">Across all topics</span>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedCatIds.length > 0 && (
        <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-brand/30 shadow-sm flex items-center justify-between flex-wrap gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2.5 pl-1">
            <span className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold shadow-xs">
              {selectedCatIds.length}
            </span>
            <span className="text-xs font-medium text-[var(--text-primary)]">
              {selectedCatIds.length} categor{selectedCatIds.length === 1 ? 'y' : 'ies'} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isBulkDeleting}
              onClick={handleOpenBulkDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={13} />
              Delete Selected
            </button>
            <button
              type="button"
              onClick={() => setSelectedCatIds([])}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
              title="Deselect all"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories by name or slug..."
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg bg-[var(--bg-muted)] border border-transparent focus:border-[var(--border)] focus:bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-slate-400 transition-colors outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <span className="text-xs text-[var(--text-muted)] hidden sm:inline">
          Showing {filteredCategories.length} of {categories.length} categories
        </span>
      </div>

      {/* Categories Table Card */}
      <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xs overflow-hidden">
        {isLoading ? (
          <AdminLoader
            text="Loading FAQ categories..."
            subtext="Fetching taxonomy and article counts"
            minHeight="min-h-[220px]"
          />
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-xs text-red-600 font-semibold mb-2">{error}</p>
            <button
              onClick={fetchCategories}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-brand text-white cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-muted)] flex items-center justify-center text-slate-400 mb-3 border border-[var(--border)]">
              <Layers size={20} />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {searchQuery ? 'No categories matched your search' : 'No categories created yet'}
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mt-1">
              {searchQuery
                ? 'Try a different search query or clear the filter.'
                : 'Create topics like "Platform", "Verification", or "Tools" to organize your FAQs.'}
            </p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3.5 text-xs text-brand font-semibold hover:underline cursor-pointer"
              >
                Clear Search
              </button>
            ) : (
              <button
                onClick={handleOpenAdd}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand text-white cursor-pointer"
              >
                <Plus size={14} /> Create First Category
              </button>
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse table-fixed min-w-[650px]">
              <colgroup>
                <col className="w-[5%]" />
                <col className="w-[32%]" />
                <col className="w-[22%]" />
                <col className="w-[14%]" />
                <col className="w-[10%]" />
                <col className="w-[9%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-muted)]/60 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="py-2 px-2 text-center align-middle">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-slate-400 hover:text-[var(--text-primary)] transition-colors inline-flex items-center cursor-pointer"
                    >
                      {isAllSelected ? (
                        <CheckSquare size={14} className="text-brand" />
                      ) : isSomeSelected ? (
                        <div className="relative">
                          <Square size={14} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-[2px] bg-brand rounded-xs" />
                          </div>
                        </div>
                      ) : (
                        <Square size={14} />
                      )}
                    </button>
                  </th>
                  <th className="py-2 px-3 align-middle">Category Name</th>
                  <th className="py-2 px-3 align-middle">Slug (URL Key)</th>
                  <th className="py-2 px-3 text-center align-middle">FAQs Count</th>
                  <th className="py-2 px-3 text-center align-middle">Status</th>
                  <th className="py-2 px-3 align-middle">Created Date</th>
                  <th className="py-2 px-3 text-right align-middle">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {filteredCategories.map((cat) => {
                  const isSelected = selectedCatIds.includes(cat._id);
                  return (
                    <tr
                      key={cat._id}
                      className={`transition-colors duration-150 group ${
                        isSelected
                          ? 'bg-brand/5 dark:bg-brand/10'
                          : 'hover:bg-[var(--bg-muted)]/40'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-1.5 px-2 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectOne(cat._id)}
                          className={`cursor-pointer transition-colors inline-flex items-center ${
                            isSelected ? 'text-brand' : 'text-slate-400 hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                        </button>
                      </td>

                      {/* Category Name */}
                      <td className="py-1.5 px-3 font-semibold text-[var(--text-primary)] align-middle min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-brand/10 text-brand flex items-center justify-center shrink-0">
                            <Folder size={12} />
                          </div>
                          <span className="group-hover:text-brand transition-colors text-xs truncate">{cat.name}</span>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="py-1.5 px-3 font-mono text-[10px] text-[var(--text-muted)] align-middle min-w-0 truncate">
                        /{cat.slug}
                      </td>

                      {/* FAQs count */}
                      <td className="py-1.5 px-3 text-center align-middle whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--text-primary)] font-medium text-[10px]">
                          <FileText size={10} className="text-slate-400" />
                          {cat.faqCount || 0}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-1.5 px-3 text-center align-middle whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(cat)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border shadow-2xs cursor-pointer transition-all ${
                            cat.isActive
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
                          }`}
                          title={`Click to ${cat.isActive ? 'hide category from' : 'show category on'} public website`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cat.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{cat.isActive ? 'Active' : 'Hidden'}</span>
                        </button>
                      </td>

                      {/* Created Date */}
                      <td className="py-1.5 px-3 text-[10px] text-[var(--text-muted)] whitespace-nowrap align-middle">
                        {cat.createdAt
                          ? new Date(cat.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-1.5 px-3 text-right whitespace-nowrap align-middle">
                        <div className="inline-flex items-center justify-end gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cat)}
                            className="w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-brand hover:border-brand/40 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                            title="Edit Category"
                          >
                            <Edit size={12} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDelete(cat)}
                            className="w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-900/50 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                            title="Delete Category"
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
        )}
      </div>

      {/* --- ADD / EDIT MODAL --- */}
      {modalState.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] max-w-md w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {modalState.mode === 'create' ? 'Create New Category' : 'Edit Category'}
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

            <form onSubmit={handleSubmitCategory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
                  Category Name <span className="text-brand">*</span>
                </label>
                <input
                  type="text"
                  value={modalState.name}
                  onChange={(e) => setModalState(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Platform, Verification, Tools"
                  required
                  autoFocus
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] focus:border-brand focus:bg-[var(--bg-surface)] text-[var(--text-primary)] outline-none transition-colors"
                />
              </div>

              {/* Slug Preview */}
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                  Generated Slug (URL Path)
                </label>
                <div className="px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-muted)] font-mono text-[var(--text-muted)] border border-[var(--border)]">
                  /{previewSlug(modalState.name) || 'category-slug'}
                </div>
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)]">
                <div>
                  <p className="text-xs font-medium text-[var(--text-primary)]">Active Status</p>
                  <p className="text-[11px] text-[var(--text-muted)]">Show this category as a filter tab on public website</p>
                </div>
                <input
                  type="checkbox"
                  checked={modalState.isActive}
                  onChange={(e) => setModalState(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-brand rounded accent-brand cursor-pointer"
                />
              </div>

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
                  {modalState.mode === 'create' ? 'Create Category' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SINGLE DELETE MODAL --- */}
      {deleteModal.open && deleteModal.category && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] max-w-sm w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Delete "{deleteModal.category.name}"?
                </h3>
                <p className="text-xs text-[var(--text-muted)]">This category will be permanently removed.</p>
              </div>
            </div>

            {deleteModal.error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 font-medium flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{deleteModal.error}</span>
              </div>
            )}

            {/* If FAQs exist, require reassignment */}
            {deleteModal.category.faqCount > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  <AlertCircle size={14} />
                  <span>{deleteModal.category.faqCount} FAQ(s) are using this category</span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Select a category to reassign these FAQs to before deleting:
                </p>
                <select
                  value={deleteModal.moveToCategory}
                  onChange={(e) => setDeleteModal(prev => ({ ...prev, moveToCategory: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-[var(--text-primary)] font-medium outline-none cursor-pointer"
                >
                  <option value="">-- Choose Reassignment Category --</option>
                  {categories
                    .filter(c => c._id !== deleteModal.category._id)
                    .map(c => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                disabled={deleteModal.isDeleting}
                onClick={() => setDeleteModal({ open: false, category: null, moveToCategory: '', isDeleting: false, error: null })}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteModal.isDeleting || (deleteModal.category.faqCount > 0 && !deleteModal.moveToCategory)}
                onClick={handleDeleteConfirm}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleteModal.isDeleting ? 'Deleting...' : 'Confirm Delete'}
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
                  Delete {selectedCatIds.length} Categories?
                </h3>
                <p className="text-xs text-[var(--text-muted)]">Permanent removal from database</p>
              </div>
            </div>

            {bulkDeleteError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 font-medium flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{bulkDeleteError}</span>
              </div>
            )}

            {/* If FAQs exist in selected categories, require reassignment */}
            {(() => {
              const totalFAQs = categories
                .filter(c => selectedCatIds.includes(c._id))
                .reduce((sum, c) => sum + (c.faqCount || 0), 0);
              const remainingCats = categories.filter(c => !selectedCatIds.includes(c._id));

              if (totalFAQs === 0) return null;

              return (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                    <AlertCircle size={14} />
                    <span>{totalFAQs} FAQ(s) are using the selected categories</span>
                  </div>

                  {remainingCats.length > 0 ? (
                    <>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        Select a category to move these FAQs to before deleting:
                      </p>
                      <select
                        value={bulkMoveToCategory}
                        onChange={(e) => setBulkMoveToCategory(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-md bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-[var(--text-primary)] font-medium outline-none cursor-pointer"
                      >
                        <option value="">-- Choose Reassignment Category --</option>
                        {remainingCats.map(c => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                      All existing categories are selected. You cannot delete all categories when FAQs exist. Please deselect at least one category to keep FAQs organized.
                    </p>
                  )}
                </div>
              );
            })()}

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
                disabled={(() => {
                  if (isBulkDeleting) return true;
                  const totalFAQs = categories
                    .filter(c => selectedCatIds.includes(c._id))
                    .reduce((sum, c) => sum + (c.faqCount || 0), 0);
                  const remainingCats = categories.filter(c => !selectedCatIds.includes(c._id));
                  if (totalFAQs > 0 && (!bulkMoveToCategory || remainingCats.length === 0)) return true;
                  return false;
                })()}
                onClick={handleBulkDeleteConfirm}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {isBulkDeleting ? 'Deleting...' : `Delete ${selectedCatIds.length} Categories`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaqCategories;
