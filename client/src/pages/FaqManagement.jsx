import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus, Search, Filter, Edit, Trash2,
  CheckCircle2, XCircle, Clock, Folder, AlertCircle, RefreshCw, 
  Layers, CheckSquare, Square, X, ArrowRight
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
    isDeleting: false
  });

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Fetch categories for filter & modal dropdown
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

  // Fetch faqs
  const fetchFaqs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category = selectedCategory;

      const res = await API.get('/admin/faqs', { params });
      if (res.data?.data?.faqs) {
        let fetchedFaqs = res.data.data.faqs;
        // Client side filtering for status if needed (since backend might not filter it natively if we didn't add it)
        if (selectedStatus === 'active') {
          fetchedFaqs = fetchedFaqs.filter(f => f.isActive === true);
        } else if (selectedStatus === 'inactive') {
          fetchedFaqs = fetchedFaqs.filter(f => f.isActive === false);
        }
        setFaqs(fetchedFaqs);
      }
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      setError('Failed to load FAQs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [search, selectedCategory, selectedStatus]);

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
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Failed to delete FAQs', 'error');
    } finally {
      setIsBulkDeleting(false);
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
      const payload = { question, answer, category, isActive };

      if (mode === 'create') {
        const res = await API.post('/admin/faqs', payload);
        triggerToast('FAQ created successfully');
        setFaqs([res.data.data.faq, ...faqs]);
      } else {
        const res = await API.put(`/admin/faqs/${faqId}`, payload);
        triggerToast('FAQ updated successfully');
        setFaqs(faqs.map(f => f._id === faqId ? res.data.data.faq : f));
      }
      setModalState(prev => ({ ...prev, open: false }));
    } catch (err) {
      setModalState(prev => ({
        ...prev,
        error: err.response?.data?.message || 'Something went wrong',
        isSubmitting: false
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
    <div className="min-h-screen bg-[#F8F8F7] pb-20">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-lg ${
            toast.type === 'error'
              ? 'bg-red-50 border-red-100 text-red-800'
              : 'bg-white border-[#E8E5E1] text-[#17202A]'
          }`}>
            {toast.type === 'error' ? (
              <XCircle size={18} className="text-red-500" />
            ) : (
              <CheckCircle2 size={18} className="text-[#16A66A]" />
            )}
            <p className="text-[13.5px] font-semibold">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-[#E8E5E1] sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[12px] font-medium text-[#64748B] mb-1">
                <span>Content</span>
                <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
                <span className="text-[#17202A]">FAQ Management</span>
              </div>
              <h1 className="text-[24px] font-bold text-[#17202A] tracking-tight">FAQs</h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/admin/faq/categories"
                className="inline-flex items-center gap-2 px-4 py-2 text-[13.5px] font-semibold text-[#17202A] bg-white border border-[#E8E5E1] rounded-xl hover:bg-[#F8F8F7] hover:border-[#D1D5DB] transition-all shadow-sm"
              >
                <Layers size={15} />
                Manage Categories
              </Link>
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 text-[13.5px] font-semibold text-white bg-[#FF5A3C] rounded-xl hover:bg-[#E04F34] transition-all shadow-sm hover:shadow active:scale-[0.98]"
              >
                <Plus size={16} />
                Add FAQ
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        
        {/* Bulk Actions Bar */}
        {selectedFaqIds.length > 0 && (
          <div className="bg-white border border-[#FF5A3C]/20 rounded-xl p-3 flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-3 pl-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-[#FFF0ED] text-[#FF5A3C] text-[12px] font-bold">
                {selectedFaqIds.length}
              </span>
              <span className="text-[13.5px] font-medium text-[#17202A]">
                FAQs selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
              >
                <Trash2 size={14} />
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedFaqIds([])}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-semibold text-[#64748B] hover:text-[#17202A] hover:bg-[#F8F8F7] rounded-lg transition-colors"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="bg-white rounded-2xl border border-[#E8E5E1] shadow-sm p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search questions or answers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8F8F7] border border-[#E8E5E1] rounded-xl text-[13.5px] text-[#17202A] placeholder:text-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#FF5A3C] focus:ring-1 focus:ring-[#FF5A3C] transition-all"
              />
            </div>

            {/* Category Filter */}
            <div className="relative min-w-[200px] w-full sm:w-auto">
              <Folder size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-[#F8F8F7] border border-[#E8E5E1] rounded-xl text-[13.5px] text-[#17202A] appearance-none focus:outline-none focus:bg-white focus:border-[#FF5A3C] focus:ring-1 focus:ring-[#FF5A3C] transition-all cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative min-w-[160px] w-full sm:w-auto">
              <Filter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-[#F8F8F7] border border-[#E8E5E1] rounded-xl text-[13.5px] text-[#17202A] appearance-none focus:outline-none focus:bg-white focus:border-[#FF5A3C] focus:ring-1 focus:ring-[#FF5A3C] transition-all cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <button 
              onClick={fetchFaqs}
              disabled={isLoading}
              className="p-2.5 bg-[#F8F8F7] border border-[#E8E5E1] text-[#64748B] hover:text-[#17202A] rounded-xl transition-colors shrink-0"
              title="Refresh FAQs"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-[#E8E5E1] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F8F8F7] border-b border-[#E8E5E1]">
                  <th className="px-5 py-4 w-[50px]">
                    <button
                      onClick={handleToggleSelectAll}
                      className="text-[#94A3B8] hover:text-[#FF5A3C] transition-colors"
                    >
                      {isAllSelected ? (
                        <CheckSquare size={18} className="text-[#FF5A3C]" />
                      ) : isSomeSelected ? (
                        <div className="relative">
                          <Square size={18} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2.5 h-[2px] bg-[#FF5A3C] rounded-sm" />
                          </div>
                        </div>
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                  <th className="px-5 py-4 text-[12px] font-bold text-[#64748B] uppercase tracking-wider">Question</th>
                  <th className="px-5 py-4 text-[12px] font-bold text-[#64748B] uppercase tracking-wider">Category</th>
                  <th className="px-5 py-4 text-[12px] font-bold text-[#64748B] uppercase tracking-wider text-center">Status</th>
                  <th className="px-5 py-4 text-[12px] font-bold text-[#64748B] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E5E1]">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-5"><div className="w-4 h-4 bg-[#F1F1F0] rounded" /></td>
                      <td className="px-5 py-5"><div className="w-3/4 h-4 bg-[#F1F1F0] rounded" /></td>
                      <td className="px-5 py-5"><div className="w-24 h-4 bg-[#F1F1F0] rounded" /></td>
                      <td className="px-5 py-5 text-center"><div className="w-16 h-5 bg-[#F1F1F0] rounded-full mx-auto" /></td>
                      <td className="px-5 py-5"><div className="w-16 h-8 bg-[#F1F1F0] rounded-lg ml-auto" /></td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-red-500">
                      <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                      <p className="text-[14px] font-medium">{error}</p>
                    </td>
                  </tr>
                ) : faqs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-[#F8F8F7] flex items-center justify-center mx-auto mb-4 border border-[#E8E5E1]">
                        <Search size={20} className="text-[#94A3B8]" />
                      </div>
                      <h3 className="text-[16px] font-bold text-[#17202A] mb-1">No FAQs found</h3>
                      <p className="text-[13.5px] text-[#64748B] max-w-sm mx-auto">
                        Try adjusting your filters or search query, or create a new FAQ.
                      </p>
                      <button
                        onClick={() => { setSearch(''); setSelectedCategory(''); setSelectedStatus(''); }}
                        className="mt-4 text-[13px] font-semibold text-[#FF5A3C] hover:underline"
                      >
                        Clear all filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  faqs.map((faq) => {
                    const isSelected = selectedFaqIds.includes(faq._id);
                    return (
                      <tr key={faq._id} className={`hover:bg-[#FAF9F7] transition-colors ${isSelected ? 'bg-[#FFF7F4] hover:bg-[#FFF7F4]' : ''}`}>
                        <td className="px-5 py-5">
                          <button
                            onClick={() => handleToggleSelectOne(faq._id)}
                            className={`transition-colors ${isSelected ? 'text-[#FF5A3C]' : 'text-[#94A3B8] hover:text-[#17202A]'}`}
                          >
                            {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                          </button>
                        </td>
                        <td className="px-5 py-5">
                          <div className="text-[14px] font-semibold text-[#17202A] mb-1 leading-snug max-w-lg truncate">
                            {faq.question}
                          </div>
                          <div className="text-[12.5px] text-[#64748B] max-w-lg truncate">
                            {faq.answer}
                          </div>
                        </td>
                        <td className="px-5 py-5">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8F8F7] border border-[#E8E5E1] text-[12px] font-medium text-[#64748B]">
                            <Folder size={12} />
                            {faq.category?.name || 'Uncategorized'}
                          </div>
                        </td>
                        <td className="px-5 py-5 text-center">
                          <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border ${
                            faq.isActive 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {faq.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(faq)}
                              className="p-2 rounded-lg bg-white border border-[#E8E5E1] text-[#64748B] hover:text-[#FF5A3C] hover:border-[#FF5A3C]/30 hover:bg-[#FFF7F4] transition-all shadow-sm"
                              title="Edit FAQ"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteModal({ open: true, faqId: faq._id, question: faq.question, isDeleting: false })}
                              className="p-2 rounded-lg bg-white border border-[#E8E5E1] text-[#64748B] hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm"
                              title="Delete FAQ"
                            >
                              <Trash2 size={15} />
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
        </div>
      </div>

      {/* --- ADD / EDIT MODAL --- */}
      {modalState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => !modalState.isSubmitting && setModalState(prev => ({ ...prev, open: false }))} 
          />
          
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-[#E8E5E1] flex items-center justify-between bg-[#F8F8F7]">
              <h3 className="text-[17px] font-bold text-[#17202A]">
                {modalState.mode === 'create' ? 'Add New FAQ' : 'Edit FAQ'}
              </h3>
              <button
                onClick={() => setModalState(prev => ({ ...prev, open: false }))}
                disabled={modalState.isSubmitting}
                className="text-[#94A3B8] hover:text-[#17202A] p-1 rounded-lg hover:bg-black/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-6 space-y-5">
              {modalState.error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-700 text-[13px] font-medium">
                  <AlertCircle size={16} />
                  <p>{modalState.error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-[#17202A] mb-1.5">Category *</label>
                  <select
                    value={modalState.category}
                    onChange={(e) => setModalState(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white border border-[#E8E5E1] rounded-xl text-[13.5px] text-[#17202A] focus:outline-none focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/15 transition-all"
                    required
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#17202A] mb-1.5">Question *</label>
                  <input
                    type="text"
                    value={modalState.question}
                    onChange={(e) => setModalState(prev => ({ ...prev, question: e.target.value }))}
                    placeholder="e.g., What is GharMB?"
                    className="w-full px-4 py-2.5 bg-white border border-[#E8E5E1] rounded-xl text-[13.5px] text-[#17202A] focus:outline-none focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/15 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#17202A] mb-1.5">Answer *</label>
                  <textarea
                    value={modalState.answer}
                    onChange={(e) => setModalState(prev => ({ ...prev, answer: e.target.value }))}
                    placeholder="Enter the detailed answer..."
                    rows={4}
                    className="w-full px-4 py-2.5 bg-white border border-[#E8E5E1] rounded-xl text-[13.5px] text-[#17202A] focus:outline-none focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/15 transition-all resize-y"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modalState.isActive}
                      onChange={(e) => setModalState(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="w-4 h-4 rounded border-[#D1D5DB] text-[#FF5A3C] focus:ring-[#FF5A3C] cursor-pointer"
                    />
                    <div>
                      <span className="block text-[13px] font-bold text-[#17202A]">Active Status</span>
                      <span className="block text-[11px] text-[#64748B]">Inactive FAQs won't appear on the public website.</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E8E5E1] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalState(prev => ({ ...prev, open: false }))}
                  disabled={modalState.isSubmitting}
                  className="px-5 py-2.5 text-[13.5px] font-semibold text-[#64748B] hover:text-[#17202A] hover:bg-[#F8F8F7] rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalState.isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-[13.5px] font-semibold text-white bg-[#FF5A3C] hover:bg-[#E04F34] rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {modalState.isSubmitting ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  {modalState.mode === 'create' ? 'Save FAQ' : 'Update FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SINGLE DELETE MODAL --- */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !deleteModal.isDeleting && setDeleteModal({ open: false, faqId: null, question: '', isDeleting: false })} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 text-center animate-fade-in-up">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-[18px] font-bold text-[#17202A] mb-2">Delete FAQ?</h3>
            <p className="text-[13.5px] text-[#64748B] mb-2">
              Are you sure you want to delete this FAQ? This action cannot be undone.
            </p>
            <div className="p-3 bg-[#F8F8F7] rounded-xl border border-[#E8E5E1] text-[13px] font-medium text-[#17202A] mb-6 line-clamp-2 text-left italic">
              "{deleteModal.question}"
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, faqId: null, question: '', isDeleting: false })}
                disabled={deleteModal.isDeleting}
                className="flex-1 py-2.5 text-[13.5px] font-semibold text-[#17202A] bg-white border border-[#E8E5E1] rounded-xl hover:bg-[#F8F8F7] transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteModal.isDeleting}
                className="flex-1 inline-flex justify-center items-center gap-2 py-2.5 text-[13.5px] font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-70"
              >
                {deleteModal.isDeleting ? <RefreshCw size={15} className="animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BULK DELETE MODAL --- */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isBulkDeleting && setShowBulkDeleteModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 text-center animate-fade-in-up">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-[18px] font-bold text-[#17202A] mb-2">Delete {selectedFaqIds.length} FAQs?</h3>
            <p className="text-[13.5px] text-[#64748B] mb-6">
              You are about to permanently delete {selectedFaqIds.length} selected FAQs. This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={isBulkDeleting}
                className="flex-1 py-2.5 text-[13.5px] font-semibold text-[#17202A] bg-white border border-[#E8E5E1] rounded-xl hover:bg-[#F8F8F7] transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDeleteConfirm}
                disabled={isBulkDeleting}
                className="flex-1 inline-flex justify-center items-center gap-2 py-2.5 text-[13.5px] font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-70"
              >
                {isBulkDeleting ? <RefreshCw size={15} className="animate-spin" /> : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaqManagement;
