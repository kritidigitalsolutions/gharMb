import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Edit, Trash2, CheckCircle2,
  XCircle, Folder, Layers, AlertCircle, RefreshCw, FileText,
  X, CheckSquare, Square
} from 'lucide-react';
import API from '../api/api';

const InsightsCategories = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const res = await API.get('/admin/blog-categories');
      if (res.data?.data?.categories) {
        setCategories(res.data.data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Selection helpers
  const isAllSelected = categories.length > 0 && selectedCatIds.length === categories.length;
  const isSomeSelected = selectedCatIds.length > 0 && selectedCatIds.length < categories.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCatIds([]);
    } else {
      setSelectedCatIds(categories.map(c => c._id));
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
    // Find first non-selected category for default reassignment
    const remainingCats = categories.filter(c => !selectedCatIds.includes(c._id));
    setBulkMoveToCategory(remainingCats.length > 0 ? remainingCats[0]._id : '');
    setShowBulkDeleteModal(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedCatIds.length === 0) return;

    // Calculate how many articles exist in selected categories
    const totalArticles = categories
      .filter(c => selectedCatIds.includes(c._id))
      .reduce((sum, c) => sum + (c.articleCount || 0), 0);

    const remainingCats = categories.filter(c => !selectedCatIds.includes(c._id));

    if (totalArticles > 0 && (!bulkMoveToCategory || remainingCats.length === 0)) {
      setBulkDeleteError(
        remainingCats.length === 0
          ? 'Cannot delete all categories because articles exist. Please leave at least one category to reassign articles.'
          : 'Please select a target category to reassign existing articles.'
      );
      return;
    }

    setIsBulkDeleting(true);
    setBulkDeleteError(null);

    try {
      const payload = { ids: selectedCatIds };
      if (totalArticles > 0) {
        payload.moveToCategory = bulkMoveToCategory;
      }

      const res = await API.post('/admin/blog-categories/bulk-delete', payload);
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

  // Helper slug generator preview
  const previewSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  // Open Add Modal
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
        await API.post('/admin/blog-categories', {
          name: modalState.name.trim(),
          isActive: modalState.isActive,
        });
        triggerToast('Category created successfully!');
      } else {
        await API.put(`/admin/blog-categories/${modalState.categoryId}`, {
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

    if (cat.articleCount > 0 && !deleteModal.moveToCategory) {
      setDeleteModal(prev => ({
        ...prev,
        error: 'Please select a category to reassign existing articles.',
      }));
      return;
    }

    setDeleteModal(prev => ({ ...prev, isDeleting: true, error: null }));

    try {
      await API.delete(`/admin/blog-categories/${cat._id}`, {
        data: cat.articleCount > 0 ? { moveToCategory: deleteModal.moveToCategory } : {},
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

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200 ${
          toast.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/admin/insights"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-brand transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Articles
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
              Blog Categories
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-md bg-brand-light text-brand tracking-wider">
              {categories.length} Total
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">
            Organize editorial insights into topics. Active categories automatically appear as filter tabs on the public site.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchCategories}
            title="Refresh"
            className="p-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-muted)] transition-all cursor-pointer"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-brand hover:bg-brand-dark text-white transition-all shadow-md shadow-brand/20 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            New Category
          </button>
        </div>
      </div>

      {/* Floating Bulk Action Bar when categories are selected */}
      {selectedCatIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-white border border-[var(--border)] shadow-sm flex items-center justify-between flex-wrap gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-xs font-black shadow-sm">
              {selectedCatIds.length}
            </span>
            <span className="text-xs font-bold text-[var(--text-primary)]">
              {selectedCatIds.length} categor{selectedCatIds.length === 1 ? 'y' : 'ies'} selected
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={isBulkDeleting}
              onClick={handleOpenBulkDelete}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-md shadow-red-600/20 cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={14} /> Delete Selected ({selectedCatIds.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedCatIds([])}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--text-primary)] hover:bg-slate-100 transition-colors cursor-pointer"
              title="Deselect All"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Categories Table Card */}
      <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[var(--text-muted)]">
            <RefreshCw size={28} className="animate-spin text-brand mb-3" />
            <p className="text-xs font-semibold">Loading categories...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-xs text-red-600 font-semibold">{error}</p>
            <button
              onClick={fetchCategories}
              className="mt-3 px-4 py-1.5 rounded-lg text-xs font-bold bg-brand text-white"
            >
              Try Again
            </button>
          </div>
        ) : categories.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-light flex items-center justify-center text-brand mb-4">
              <Layers size={28} />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">No categories created yet</h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mt-1">
              Create categories like "Market Trends", "Buyer Guides", "Investment", or "Legal & Tax".
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-brand text-white shadow-md shadow-brand/20 hover:scale-105 transition-all cursor-pointer"
            >
              <Plus size={16} /> Create First Category
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-muted)] text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">
                  {/* Select All Checkbox */}
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={input => {
                        if (input) input.indeterminate = isSomeSelected;
                      }}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded accent-brand cursor-pointer"
                      title="Select all categories"
                    />
                  </th>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Slug (URL Key)</th>
                  <th className="py-3 px-4">Articles Count</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {categories.map((cat) => {
                  const isSelected = selectedCatIds.includes(cat._id);
                  return (
                    <tr
                      key={cat._id}
                      className={`transition-colors duration-150 group ${
                        isSelected ? 'bg-orange-50/40 dark:bg-orange-950/20' : 'hover:bg-[var(--bg-muted)]/50'
                      }`}
                    >
                      {/* Individual Checkbox */}
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(cat._id)}
                          className="w-4 h-4 rounded accent-brand cursor-pointer"
                        />
                      </td>

                      {/* Category Name */}
                      <td className="py-3.5 px-4 font-bold text-[var(--text-primary)] flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-brand-light text-brand flex items-center justify-center shrink-0">
                          <Folder size={15} />
                        </div>
                        <span>{cat.name}</span>
                      </td>

                      {/* Slug */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[var(--text-muted)]">
                        /{cat.slug}
                      </td>

                      {/* Articles count */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                          <FileText size={12} className="text-slate-400" />
                          {cat.articleCount || 0} article{cat.articleCount === 1 ? '' : 's'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          cat.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cat.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {cat.isActive ? 'Active on Site' : 'Hidden'}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                        {cat.createdAt
                          ? new Date(cat.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-all cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit size={15} />
                          </button>

                          <button
                            onClick={() => handleOpenDelete(cat)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                            title="Delete Category"
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
      </div>

      {/* Create / Edit Modal */}
      {modalState.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {modalState.mode === 'create' ? 'Create New Category' : 'Edit Category'}
              </h3>
              <button
                type="button"
                onClick={() => setModalState(prev => ({ ...prev, open: false }))}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm"
              >
                ✕
              </button>
            </div>

            {modalState.error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{modalState.error}</span>
              </div>
            )}

            <form onSubmit={handleSubmitCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                  Category Name <span className="text-brand">*</span>
                </label>
                <input
                  type="text"
                  value={modalState.name}
                  onChange={(e) => setModalState(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Market Trends & Analysis"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] focus:border-brand focus:bg-[var(--bg-surface)] text-[var(--text-primary)] transition-all outline-none"
                />
              </div>

              {/* Slug Preview */}
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">
                  Generated Slug (URL Path)
                </label>
                <div className="px-3.5 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-[var(--text-muted)]">
                  /{previewSlug(modalState.name) || 'category-slug'}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">Active Status</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Show this category as a filter tab on public website</p>
                </div>
                <input
                  type="checkbox"
                  checked={modalState.isActive}
                  onChange={(e) => setModalState(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-brand rounded accent-brand cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  disabled={modalState.isSubmitting}
                  onClick={() => setModalState(prev => ({ ...prev, open: false }))}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border)] hover:bg-[var(--bg-muted)] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalState.isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-brand hover:bg-brand-dark text-white transition-all shadow-md shadow-brand/20 cursor-pointer disabled:opacity-50"
                >
                  {modalState.isSubmitting
                    ? 'Saving...'
                    : modalState.mode === 'create'
                    ? 'Create Category'
                    : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Delete Modal with Article Reassignment Safeguard */}
      {deleteModal.open && deleteModal.category && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <Trash2 size={24} />
            </div>

            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Delete "{deleteModal.category.name}"?
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                This category will be permanently removed.
              </p>
            </div>

            {deleteModal.error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{deleteModal.error}</span>
              </div>
            )}

            {/* If articles exist, require reassignment */}
            {deleteModal.category.articleCount > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                  <AlertCircle size={15} />
                  <span>{deleteModal.category.articleCount} article(s) are using this category</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-normal">
                  To protect content integrity, select another category to move these articles to before deleting:
                </p>
                <select
                  value={deleteModal.moveToCategory}
                  onChange={(e) => setDeleteModal(prev => ({ ...prev, moveToCategory: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-amber-300 text-slate-800 font-semibold outline-none"
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

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                disabled={deleteModal.isDeleting}
                onClick={() => setDeleteModal({ open: false, category: null, moveToCategory: '', isDeleting: false, error: null })}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border)] hover:bg-[var(--bg-muted)] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteModal.isDeleting || (deleteModal.category.articleCount > 0 && !deleteModal.moveToCategory)}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-md shadow-red-600/20 cursor-pointer disabled:opacity-50"
              >
                {deleteModal.isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal with Article Reassignment Safeguard */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <Trash2 size={24} />
            </div>

            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Delete {selectedCatIds.length} Categories?
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                The selected categories will be permanently removed from the system.
              </p>
            </div>

            {bulkDeleteError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{bulkDeleteError}</span>
              </div>
            )}

            {/* If articles exist in selected categories, require reassignment */}
            {(() => {
              const totalArticles = categories
                .filter(c => selectedCatIds.includes(c._id))
                .reduce((sum, c) => sum + (c.articleCount || 0), 0);
              const remainingCats = categories.filter(c => !selectedCatIds.includes(c._id));

              if (totalArticles === 0) return null;

              return (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                    <AlertCircle size={15} />
                    <span>{totalArticles} article(s) are using the selected categories</span>
                  </div>
                  {remainingCats.length > 0 ? (
                    <>
                      <p className="text-[11px] text-amber-700 leading-normal">
                        To protect content integrity, select a remaining category to move these articles to before deleting:
                      </p>
                      <select
                        value={bulkMoveToCategory}
                        onChange={(e) => setBulkMoveToCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-amber-300 text-slate-800 font-semibold outline-none"
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
                    <p className="text-[11px] text-red-600 font-semibold leading-normal">
                      All existing categories are selected. You cannot delete all categories when articles exist. Please deselect at least one category to keep articles organized.
                    </p>
                  )}
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={() => {
                  setShowBulkDeleteModal(false);
                  setBulkDeleteError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border)] hover:bg-[var(--bg-muted)] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={(() => {
                  if (isBulkDeleting) return true;
                  const totalArticles = categories
                    .filter(c => selectedCatIds.includes(c._id))
                    .reduce((sum, c) => sum + (c.articleCount || 0), 0);
                  const remainingCats = categories.filter(c => !selectedCatIds.includes(c._id));
                  if (totalArticles > 0 && (!bulkMoveToCategory || remainingCats.length === 0)) return true;
                  return false;
                })()}
                onClick={handleBulkDeleteConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-md shadow-red-600/20 cursor-pointer disabled:opacity-50"
              >
                {isBulkDeleting ? 'Deleting...' : `Confirm Bulk Delete (${selectedCatIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightsCategories;
