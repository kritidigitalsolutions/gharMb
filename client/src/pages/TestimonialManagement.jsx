import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus, Search, Filter, Edit, Trash2,
  CheckCircle2, XCircle, Clock, Folder, AlertCircle, RefreshCw, 
  Layers, CheckSquare, Square, X, ArrowRight, Quote, ImageIcon, ArrowUp, ArrowDown
} from 'lucide-react';
import API from '../api/api';

const TestimonialManagement = () => {
  const navigate = useNavigate();
  const [testimonials, setTestimonials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selection & Bulk Operations
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Form Modal (Add / Edit)
  const [modalState, setModalState] = useState({
    open: false,
    mode: 'create', // 'create' or 'edit'
    id: null,
    quote: '',
    name: '',
    role: '',
    location: '',
    propertyType: '',
    journeyType: '',
    stages: 'Discover, Verify, Understand, Decide',
    activeStageIndex: 1,
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
  });

  // Single Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    id: null,
    name: '',
    isDeleting: false
  });

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Fetch testimonials
  const fetchTestimonials = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedStatus === 'active') params.isActive = true;
      if (selectedStatus === 'inactive') params.isActive = false;

      const res = await API.get('/admin/testimonials', { params });
      if (res.data?.data?.testimonials) {
        setTestimonials(res.data.data.testimonials);
      }
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setError('Failed to load testimonials.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, [search, selectedStatus]);

  const handleReorder = async (currentIndex, direction) => {
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === testimonials.length - 1) return;

    const newItems = [...testimonials];
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    const temp = newItems[currentIndex];
    newItems[currentIndex] = newItems[swapIndex];
    newItems[swapIndex] = temp;

    setTestimonials(newItems);

    const items = newItems.map((item, index) => ({
      id: item._id,
      sortOrder: index
    }));

    try {
      await API.put('/admin/testimonials/reorder', { items });
      triggerToast('Order updated', 'success');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to update order', 'error');
      fetchTestimonials();
    }
  };

  // Selection helpers
  const isAllSelected = testimonials.length > 0 && selectedIds.length === testimonials.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < testimonials.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(testimonials.map(t => t._id));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
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
      stages, activeStageIndex, avatar, propertyImage, 
      isVerified, isActive, displayOrder, mode, id 
    } = modalState;

    if (!quote.trim() || !name.trim()) {
      setModalState(prev => ({ ...prev, error: 'Name and Quote are required fields' }));
      return;
    }

    setModalState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const formData = new FormData();
      formData.append('quote', quote);
      formData.append('name', name);
      formData.append('role', role);
      formData.append('location', location);
      formData.append('propertyType', propertyType);
      formData.append('journeyType', journeyType);
      formData.append('stages', JSON.stringify(stages.split(',').map(s => s.trim())));
      formData.append('activeStageIndex', activeStageIndex);
      formData.append('isVerified', isVerified);
      formData.append('isActive', isActive);
      formData.append('displayOrder', displayOrder);
      
      if (modalState.avatarFile) formData.append('avatar', modalState.avatarFile);
      if (modalState.propertyImageFile) formData.append('propertyImage', modalState.propertyImageFile);
      
      if (modalState.removeAvatar) formData.append('removeAvatar', 'true');
      if (modalState.removePropertyImage) formData.append('removePropertyImage', 'true');

      // Note: the backend config handles parsing FormData

      if (mode === 'create') {
        const res = await API.post('/admin/testimonials', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        triggerToast('Testimonial created successfully');
        setTestimonials([res.data.data.testimonial, ...testimonials]);
      } else {
        const res = await API.put(`/admin/testimonials/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        triggerToast('Testimonial updated successfully');
        setTestimonials(testimonials.map(t => t._id === id ? res.data.data.testimonial : t));
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
      id: null,
      quote: '',
      name: '',
      role: '',
      location: '',
      propertyType: '',
      journeyType: '',
      stages: 'Discover, Verify, Understand, Decide',
      activeStageIndex: 1,
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
    });
  };

  const openEditModal = (t) => {
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
      stages: (t.stages || []).join(', '),
      activeStageIndex: t.activeStageIndex || 0,
      activeStageIndex: t.activeStageIndex || 0,
      avatar: t.avatar || '',
      avatarFile: null,
      removeAvatar: false,
      propertyImage: t.propertyImage || '',
      propertyImageFile: null,
      removePropertyImage: false,
      isVerified: t.isVerified ?? true,
      isActive: t.isActive ?? true,
      displayOrder: t.displayOrder || 0,
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
        [field]: URL.createObjectURL(file), // for preview
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
                <span className="text-[#17202A]">Testimonials</span>
              </div>
              <h1 className="text-[24px] font-bold text-[#17202A] tracking-tight">Real Stories</h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 text-[13.5px] font-semibold text-white bg-[#FF5A3C] rounded-xl hover:bg-[#E04F34] transition-all shadow-sm hover:shadow active:scale-[0.98]"
              >
                <Plus size={16} />
                Add Testimonial
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        
        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-white border border-[#FF5A3C]/20 rounded-xl p-3 flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-3 pl-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-[#FFF0ED] text-[#FF5A3C] text-[12px] font-bold">
                {selectedIds.length}
              </span>
              <span className="text-[13.5px] font-medium text-[#17202A]">
                Selected
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
                onClick={() => setSelectedIds([])}
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
                placeholder="Search name, quote, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8F8F7] border border-[#E8E5E1] rounded-xl text-[13.5px] text-[#17202A] placeholder:text-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#FF5A3C] focus:ring-1 focus:ring-[#FF5A3C] transition-all"
              />
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
              onClick={fetchTestimonials}
              disabled={isLoading}
              className="p-2.5 bg-[#F8F8F7] border border-[#E8E5E1] text-[#64748B] hover:text-[#17202A] rounded-xl transition-colors shrink-0"
              title="Refresh Testimonials"
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
                  <th className="px-5 py-4 text-[12px] font-bold text-[#64748B] uppercase tracking-wider">Name & Role</th>
                  <th className="px-5 py-4 text-[12px] font-bold text-[#64748B] uppercase tracking-wider">Quote</th>
                  <th className="px-5 py-4 text-[12px] font-bold text-[#64748B] uppercase tracking-wider text-center">Order</th>
                  <th className="px-5 py-4 text-[12px] font-bold text-[#64748B] uppercase tracking-wider text-center">Status</th>
                  <th className="px-5 py-4 text-[12px] font-bold text-[#64748B] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E5E1]">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-5"><div className="w-4 h-4 bg-[#F1F1F0] rounded" /></td>
                      <td className="px-5 py-5"><div className="w-32 h-4 bg-[#F1F1F0] rounded mb-2" /><div className="w-24 h-3 bg-[#F1F1F0] rounded" /></td>
                      <td className="px-5 py-5"><div className="w-full h-4 bg-[#F1F1F0] rounded" /></td>
                      <td className="px-5 py-5 text-center"><div className="w-8 h-4 bg-[#F1F1F0] rounded mx-auto" /></td>
                      <td className="px-5 py-5 text-center"><div className="w-16 h-5 bg-[#F1F1F0] rounded-full mx-auto" /></td>
                      <td className="px-5 py-5"><div className="w-16 h-8 bg-[#F1F1F0] rounded-lg ml-auto" /></td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-red-500">
                      <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                      <p className="text-[14px] font-medium">{error}</p>
                    </td>
                  </tr>
                ) : testimonials.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-[#F8F8F7] flex items-center justify-center mx-auto mb-4 border border-[#E8E5E1]">
                        <Quote size={20} className="text-[#94A3B8]" />
                      </div>
                      <h3 className="text-[16px] font-bold text-[#17202A] mb-1">No testimonials found</h3>
                      <p className="text-[13.5px] text-[#64748B] max-w-sm mx-auto">
                        Try adjusting your filters or search query, or create a new testimonial.
                      </p>
                      <button
                        onClick={() => { setSearch(''); setSelectedStatus(''); }}
                        className="mt-4 text-[13px] font-semibold text-[#FF5A3C] hover:underline"
                      >
                        Clear all filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  testimonials.map((t, index) => {
                    const isSelected = selectedIds.includes(t._id);
                    return (
                      <tr key={t._id} className={`hover:bg-[#FAF9F7] transition-colors ${isSelected ? 'bg-[#FFF7F4] hover:bg-[#FFF7F4]' : ''}`}>
                        <td className="px-5 py-5">
                          <button
                            onClick={() => handleToggleSelectOne(t._id)}
                            className={`transition-colors ${isSelected ? 'text-[#FF5A3C]' : 'text-[#94A3B8] hover:text-[#17202A]'}`}
                          >
                            {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                          </button>
                        </td>
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#E8E5E1] overflow-hidden border border-[#D1D5DB] shrink-0">
                              {t.avatar ? (
                                <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#94A3B8]">
                                  <ImageIcon size={16} />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-[14px] font-semibold text-[#17202A] leading-tight">
                                {t.name}
                              </div>
                              <div className="text-[12px] text-[#64748B] mt-0.5">
                                {t.role || 'No Role'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-5">
                          <div className="text-[13px] text-[#17202A] max-w-sm line-clamp-2 italic">
                            "{t.quote}"
                          </div>
                        </td>
                        <td className="px-5 py-5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleReorder(index, 'up')}
                              disabled={index === 0}
                              className={`p-1.5 rounded-lg border transition-all ${
                                index === 0 
                                  ? 'bg-[#F8F8F7] border-transparent text-[#CBD5E1] cursor-not-allowed'
                                  : 'bg-white border-[#E8E5E1] text-[#64748B] hover:text-[#17202A] hover:bg-[#F8F8F7]'
                              }`}
                              title="Move Up"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              onClick={() => handleReorder(index, 'down')}
                              disabled={index === testimonials.length - 1}
                              className={`p-1.5 rounded-lg border transition-all ${
                                index === testimonials.length - 1
                                  ? 'bg-[#F8F8F7] border-transparent text-[#CBD5E1] cursor-not-allowed'
                                  : 'bg-white border-[#E8E5E1] text-[#64748B] hover:text-[#17202A] hover:bg-[#F8F8F7]'
                              }`}
                              title="Move Down"
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-5 text-center">
                          <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border ${
                            t.isActive 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {t.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(t)}
                              className="p-2 rounded-lg bg-white border border-[#E8E5E1] text-[#64748B] hover:text-[#FF5A3C] hover:border-[#FF5A3C]/30 hover:bg-[#FFF7F4] transition-all shadow-sm"
                              title="Edit"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteModal({ open: true, id: t._id, name: t.name, isDeleting: false })}
                              className="p-2 rounded-lg bg-white border border-[#E8E5E1] text-[#64748B] hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm"
                              title="Delete"
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
          
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-[#E8E5E1] flex items-center justify-between bg-[#F8F8F7] shrink-0">
              <h3 className="text-[17px] font-bold text-[#17202A]">
                {modalState.mode === 'create' ? 'Add Testimonial' : 'Edit Testimonial'}
              </h3>
              <button
                onClick={() => setModalState(prev => ({ ...prev, open: false }))}
                disabled={modalState.isSubmitting}
                className="text-[#94A3B8] hover:text-[#17202A] p-1 rounded-lg hover:bg-black/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="overflow-y-auto flex-1 p-6 space-y-6">
              {modalState.error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-700 text-[13px] font-medium">
                  <AlertCircle size={16} />
                  <p>{modalState.error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-[13px] font-bold text-[#17202A] mb-1.5">Quote *</label>
                  <textarea
                    value={modalState.quote}
                    onChange={(e) => setModalState(prev => ({ ...prev, quote: e.target.value }))}
                    placeholder="Enter testimonial quote..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white border border-[#E8E5E1] rounded-xl text-[13.5px] text-[#17202A] focus:outline-none focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/15 transition-all resize-y"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#17202A] mb-1.5">Name *</label>
                  <input
                    type="text"
                    value={modalState.name}
                    onChange={(e) => setModalState(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Ananya Sharma"
                    className="w-full px-4 py-2.5 bg-white border border-[#E8E5E1] rounded-xl text-[13.5px] text-[#17202A] focus:outline-none focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/15 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#17202A] mb-1.5">Role / User Type</label>
                  <input
                    type="text"
                    value={modalState.role}
                    onChange={(e) => setModalState(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g., First-time Homebuyer"
                    className="w-full px-4 py-2.5 bg-white border border-[#E8E5E1] rounded-xl text-[13.5px] text-[#17202A] focus:outline-none focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/15 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#17202A] mb-1.5">User Location</label>
                  <input
                    type="text"
                    value={modalState.location}
                    onChange={(e) => setModalState(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Noida, NCR"
                    className="w-full px-4 py-2.5 bg-white border border-[#E8E5E1] rounded-xl text-[13.5px] text-[#17202A] focus:outline-none focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/15 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#17202A] mb-1.5">Profile Image</label>
                  <div className="flex items-center gap-4">
                    {modalState.avatar ? (
                      <div className="relative w-14 h-14 rounded-full overflow-hidden border border-[#E8E5E1] shrink-0">
                        <img src={modalState.avatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('avatar')}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#F8F8F7] border border-[#E8E5E1] border-dashed flex items-center justify-center shrink-0">
                        <ImageIcon size={20} className="text-[#94A3B8]" />
                      </div>
                    )}
                    <label className="cursor-pointer px-4 py-2 bg-white border border-[#E8E5E1] rounded-xl text-[13px] font-semibold text-[#64748B] hover:text-[#17202A] hover:bg-[#F8F8F7] transition-all">
                      <span>Upload Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'avatar')}
                      />
                    </label>
                  </div>
                </div>

                <div className="sm:col-span-2 pt-2 pb-1">
                  <h4 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E8E5E1] pb-2">Property Details</h4>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#17202A] mb-1.5">Property Type</label>
                  <input
                    type="text"
                    value={modalState.propertyType}
                    onChange={(e) => setModalState(prev => ({ ...prev, propertyType: e.target.value }))}
                    placeholder="e.g., Residential"
                    className="w-full px-4 py-2.5 bg-white border border-[#E8E5E1] rounded-xl text-[13.5px] text-[#17202A] focus:outline-none focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/15 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#17202A] mb-1.5">Journey Label</label>
                  <input
                    type="text"
                    value={modalState.journeyType}
                    onChange={(e) => setModalState(prev => ({ ...prev, journeyType: e.target.value }))}
                    placeholder="e.g., First-time homebuyer"
                    className="w-full px-4 py-2.5 bg-white border border-[#E8E5E1] rounded-xl text-[13.5px] text-[#17202A] focus:outline-none focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/15 transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[13px] font-bold text-[#17202A] mb-1.5">Property Image</label>
                  <div className="flex items-center gap-4">
                    {modalState.propertyImage ? (
                      <div className="relative w-32 h-20 rounded-xl overflow-hidden border border-[#E8E5E1] shrink-0">
                        <img src={modalState.propertyImage} alt="Property Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('propertyImage')}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-20 rounded-xl bg-[#F8F8F7] border border-[#E8E5E1] border-dashed flex items-center justify-center shrink-0">
                        <ImageIcon size={24} className="text-[#94A3B8]" />
                      </div>
                    )}
                    <label className="cursor-pointer px-4 py-2 bg-white border border-[#E8E5E1] rounded-xl text-[13px] font-semibold text-[#64748B] hover:text-[#17202A] hover:bg-[#F8F8F7] transition-all">
                      <span>Upload Property Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'propertyImage')}
                      />
                    </label>
                  </div>
                </div>

                <div className="sm:col-span-2 pt-2 pb-1">
                  <h4 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E8E5E1] pb-2">Journey Steps Configuration</h4>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#17202A] mb-1.5">Journey Steps (comma separated)</label>
                  <input
                    type="text"
                    value={modalState.stages}
                    onChange={(e) => setModalState(prev => ({ ...prev, stages: e.target.value }))}
                    placeholder="Discover, Verify, Understand, Decide"
                    className="w-full px-4 py-2.5 bg-white border border-[#E8E5E1] rounded-xl text-[13.5px] text-[#17202A] focus:outline-none focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/15 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#17202A] mb-1.5">Active Step Index (0-based)</label>
                  <input
                    type="number"
                    min="0"
                    value={modalState.activeStageIndex}
                    onChange={(e) => setModalState(prev => ({ ...prev, activeStageIndex: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white border border-[#E8E5E1] rounded-xl text-[13.5px] text-[#17202A] focus:outline-none focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/15 transition-all"
                  />
                </div>

                <div className="sm:col-span-2 pt-2 pb-1">
                  <h4 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E8E5E1] pb-2">Settings</h4>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#17202A] mb-1.5">Display Order</label>
                  <input
                    type="number"
                    value={modalState.displayOrder}
                    onChange={(e) => setModalState(prev => ({ ...prev, displayOrder: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white border border-[#E8E5E1] rounded-xl text-[13.5px] text-[#17202A] focus:outline-none focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/15 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-3 justify-center pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modalState.isVerified}
                      onChange={(e) => setModalState(prev => ({ ...prev, isVerified: e.target.checked }))}
                      className="w-4 h-4 rounded border-[#D1D5DB] text-[#FF5A3C] focus:ring-[#FF5A3C] cursor-pointer"
                    />
                    <span className="block text-[13px] font-bold text-[#17202A]">Verified Experience</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modalState.isActive}
                      onChange={(e) => setModalState(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="w-4 h-4 rounded border-[#D1D5DB] text-[#FF5A3C] focus:ring-[#FF5A3C] cursor-pointer"
                    />
                    <span className="block text-[13px] font-bold text-[#17202A]">Active Status</span>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-[#E8E5E1] flex justify-end gap-3 shrink-0">
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
                  {modalState.mode === 'create' ? 'Save Testimonial' : 'Update Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SINGLE DELETE MODAL --- */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !deleteModal.isDeleting && setDeleteModal({ open: false, id: null, name: '', isDeleting: false })} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 text-center animate-fade-in-up">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-[18px] font-bold text-[#17202A] mb-2">Delete Testimonial?</h3>
            <p className="text-[13.5px] text-[#64748B] mb-2">
              Are you sure you want to delete this testimonial? This action cannot be undone.
            </p>
            <div className="p-3 bg-[#F8F8F7] rounded-xl border border-[#E8E5E1] text-[13px] font-medium text-[#17202A] mb-6 text-left">
              From: {deleteModal.name}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, id: null, name: '', isDeleting: false })}
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
            <h3 className="text-[18px] font-bold text-[#17202A] mb-2">Delete {selectedIds.length} Testimonials?</h3>
            <p className="text-[13.5px] text-[#64748B] mb-6">
              You are about to permanently delete {selectedIds.length} selected testimonials. This action cannot be undone.
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

export default TestimonialManagement;
