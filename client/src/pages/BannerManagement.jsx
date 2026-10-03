import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit, Trash2, CheckCircle2, AlertCircle, RefreshCw,
  Link as LinkIcon, X, Grid, List, UploadCloud, Check, Eye, MousePointerClick
} from 'lucide-react';
import API from '../api/api';

const PLACEMENT_OPTIONS = [
  { id: 'all', label: 'All Placements' },
  { id: 'home_top', label: 'Home Hero Carousel' },
  { id: 'home_middle', label: 'Middle Promo Card' },
  { id: 'home_bottom', label: 'Bottom CTA Banner' },
  { id: 'commercial', label: 'Commercial Spaces' },
  { id: 'residential', label: 'Residential Hub' },
  { id: 'popup', label: 'App Launch Popup' },
];

const LINK_TYPE_OPTIONS = [
  { value: 'none', label: 'None (Display only)' },
  { value: 'property', label: 'Property (ID or slug)' },
  { value: 'commercial', label: 'Commercial Space' },
  { value: 'project', label: 'Project' },
  { value: 'category', label: 'Category Filter' },
  { value: 'screen', label: 'In-App Screen' },
  { value: 'external_url', label: 'External Web Link' },
];

const BannerManagement = () => {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [placementFilter, setPlacementFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Selection & Bulk
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Single Delete
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, title: '', isDeleting: false });

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Add / Edit Modal
  const defaultForm = {
    open: false,
    mode: 'create',
    id: null,
    title: '',
    subtitle: '',
    position: 'home_top',
    linkType: 'none',
    linkValue: '',
    buttonText: 'Explore Now',
    sortOrder: 0,
    isActive: true,
    image: '',
    imageFile: null,
    mobileImage: '',
    mobileImageFile: null,
    isSubmitting: false,
    error: null,
  };
  const [modalState, setModalState] = useState(defaultForm);

  // Fetch Banners
  const fetchBanners = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (placementFilter !== 'all') params.position = placementFilter;
      if (statusFilter === 'active') params.isActive = true;
      if (statusFilter === 'inactive') params.isActive = false;
      if (search.trim()) params.search = search.trim();

      const res = await API.get('/admin/banners', { params });
      if (res.data?.data?.banners) {
        setBanners(res.data.data.banners);
      }
    } catch (err) {
      console.error('Error fetching banners:', err);
      setError('Failed to load banners.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [placementFilter, statusFilter, search]);

  // Quick Status Toggle
  const handleToggleStatus = async (banner, e) => {
    e?.stopPropagation();
    try {
      const nextStatus = !banner.isActive;
      await API.patch(`/admin/banners/${banner._id}/status`, { isActive: nextStatus });
      setBanners(prev => prev.map(b => (b._id === banner._id ? { ...b, isActive: nextStatus } : b)));
      triggerToast(`Banner is now ${nextStatus ? 'Active' : 'Inactive'}`);
    } catch (err) {
      triggerToast('Failed to update banner status', 'error');
    }
  };

  // Selection
  const isAllSelected = banners.length > 0 && selectedIds.length === banners.length;
  const toggleSelectAll = () => {
    if (isAllSelected) setSelectedIds([]);
    else setSelectedIds(banners.map(b => b._id));
  };
  const toggleSelectOne = (id) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  // Single Delete
  const handleDeleteConfirm = async () => {
    if (!deleteModal.id) return;
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      await API.delete(`/admin/banners/${deleteModal.id}`);
      setBanners(prev => prev.filter(b => b._id !== deleteModal.id));
      setSelectedIds(prev => prev.filter(i => i !== deleteModal.id));
      triggerToast('Banner deleted successfully');
      setDeleteModal({ open: false, id: null, title: '', isDeleting: false });
    } catch (err) {
      triggerToast('Failed to delete banner', 'error');
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Bulk Delete
  const handleBulkDeleteConfirm = async () => {
    if (!selectedIds.length) return;
    setIsBulkDeleting(true);
    try {
      await API.post('/admin/banners/bulk-delete', { ids: selectedIds });
      setBanners(prev => prev.filter(b => !selectedIds.includes(b._id)));
      triggerToast(`${selectedIds.length} banners deleted`);
      setSelectedIds([]);
      setShowBulkDeleteModal(false);
    } catch (err) {
      triggerToast('Failed to delete banners', 'error');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (banner) => {
    setModalState({
      open: true,
      mode: 'edit',
      id: banner._id,
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      position: banner.position || 'home_top',
      linkType: banner.linkType || 'none',
      linkValue: banner.linkValue || '',
      buttonText: banner.buttonText || 'Explore Now',
      sortOrder: banner.sortOrder ?? 0,
      isActive: banner.isActive ?? true,
      image: banner.image || '',
      imageFile: null,
      mobileImage: banner.mobileImage || '',
      mobileImageFile: null,
      isSubmitting: false,
      error: null,
    });
  };

  // Modal Submit
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!modalState.title.trim()) {
      setModalState(prev => ({ ...prev, error: 'Banner title is required.' }));
      return;
    }
    if (!modalState.image && !modalState.imageFile) {
      setModalState(prev => ({ ...prev, error: 'Banner image is required.' }));
      return;
    }

    setModalState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const formData = new FormData();
      formData.append('title', modalState.title.trim());
      formData.append('subtitle', modalState.subtitle.trim());
      formData.append('position', modalState.position);
      formData.append('linkType', modalState.linkType);
      formData.append('linkValue', modalState.linkValue.trim());
      formData.append('buttonText', modalState.buttonText.trim());
      formData.append('sortOrder', modalState.sortOrder || 0);
      formData.append('isActive', modalState.isActive);

      if (modalState.imageFile) {
        formData.append('image', modalState.imageFile);
      } else if (modalState.image) {
        formData.append('image', modalState.image);
      }

      if (modalState.mobileImageFile) {
        formData.append('mobileImage', modalState.mobileImageFile);
      } else if (modalState.mobileImage) {
        formData.append('mobileImage', modalState.mobileImage);
      }

      if (modalState.mode === 'create') {
        const res = await API.post('/admin/banners', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const created = res.data?.data?.banner;
        setBanners(prev => [created, ...prev]);
        triggerToast('Banner uploaded successfully');
      } else {
        const res = await API.put(`/admin/banners/${modalState.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const updated = res.data?.data?.banner;
        setBanners(prev => prev.map(b => (b._id === modalState.id ? updated : b)));
        triggerToast('Banner updated successfully');
      }

      setModalState(defaultForm);
    } catch (err) {
      console.error('Error saving banner:', err);
      setModalState(prev => ({
        ...prev,
        isSubmitting: false,
        error: err.response?.data?.message || 'Failed to save banner',
      }));
    }
  };

  const getPlacementLabel = (pos) => {
    return PLACEMENT_OPTIONS.find(p => p.id === pos)?.label || pos;
  };

  return (
    <div className="space-y-5 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-50 animate-fade-in">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-md text-xs font-semibold ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            {toast.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">App Banners</h1>
          <p className="text-xs text-[var(--text-muted)]">Upload and manage promotional banners for the mobile app</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchBanners}
            title="Refresh"
            className="p-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setModalState({ ...defaultForm, open: true })}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand/90 transition-all cursor-pointer shadow-xs"
          >
            <Plus size={15} />
            <span>Upload Banner</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[var(--bg-surface)] p-2.5 rounded-xl border border-[var(--border)]">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search banners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-[var(--bg-muted)]/50 border border-transparent focus:border-brand focus:bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filters and View Switch */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Placement Filter */}
          <select
            value={placementFilter}
            onChange={(e) => setPlacementFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-[var(--bg-muted)]/50 border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-brand cursor-pointer"
          >
            {PLACEMENT_OPTIONS.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-[var(--bg-muted)]/50 border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-brand cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* View Mode */}
          <div className="flex items-center bg-[var(--bg-muted)]/60 p-0.5 rounded-lg border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded-md text-xs cursor-pointer ${
                viewMode === 'grid' ? 'bg-[var(--bg-surface)] text-brand shadow-xs' : 'text-[var(--text-muted)]'
              }`}
              title="Grid"
            >
              <Grid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1 rounded-md text-xs cursor-pointer ${
                viewMode === 'table' ? 'bg-[var(--bg-surface)] text-brand shadow-xs' : 'text-[var(--text-muted)]'
              }`}
              title="Table"
            >
              <List size={14} />
            </button>
          </div>

          {/* Bulk Delete */}
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setShowBulkDeleteModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Delete ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] flex flex-col items-center justify-center gap-2">
          <RefreshCw size={20} className="animate-spin text-brand" />
          <span>Loading banners...</span>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-xs text-rose-600 bg-rose-50/50 rounded-xl border border-rose-200">
          <p className="font-semibold mb-2">{error}</p>
          <button
            type="button"
            onClick={fetchBanners}
            className="px-3 py-1 rounded-lg bg-brand text-white text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : banners.length === 0 ? (
        <div className="p-12 text-center text-xs bg-[var(--bg-surface)] rounded-xl border border-dashed border-[var(--border)] space-y-3">
          <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto">
            <UploadCloud size={20} />
          </div>
          <div>
            <p className="font-semibold text-[var(--text-primary)]">No Banners Found</p>
            <p className="text-[var(--text-muted)] mt-0.5">Upload a banner to display promotions on the app.</p>
          </div>
          <button
            type="button"
            onClick={() => setModalState({ ...defaultForm, open: true })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold cursor-pointer"
          >
            <Plus size={14} />
            <span>Upload Banner</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Minimal Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map(banner => {
            const isSelected = selectedIds.includes(banner._id);

            return (
              <div
                key={banner._id}
                className={`bg-[var(--bg-surface)] rounded-xl border transition-all overflow-hidden flex flex-col ${
                  isSelected ? 'border-brand ring-1 ring-brand' : 'border-[var(--border)] hover:border-brand/40'
                }`}
              >
                {/* Banner Thumbnail */}
                <div className="relative aspect-[16/8] bg-zinc-900 overflow-hidden">
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80';
                    }}
                  />
                  {/* Select Checkbox & Placement Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(banner._id)}
                      className="w-3.5 h-3.5 rounded text-brand focus:ring-brand border-white/60 cursor-pointer"
                    />
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 backdrop-blur-xs text-white">
                      {getPlacementLabel(banner.position)}
                    </span>
                  </div>

                  {/* Active Toggle Switch */}
                  <div className="absolute top-2 right-2">
                    <button
                      type="button"
                      onClick={(e) => handleToggleStatus(banner, e)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                        banner.isActive ? 'bg-emerald-500 text-white' : 'bg-black/60 text-zinc-300'
                      }`}
                    >
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-[var(--text-primary)] truncate" title={banner.title}>
                      {banner.title}
                    </h3>
                    {banner.subtitle && (
                      <p className="text-[11px] text-[var(--text-muted)] truncate" title={banner.subtitle}>
                        {banner.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Target and Stats */}
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border)]">
                    <div className="flex items-center gap-1 truncate max-w-[65%]" title={banner.linkValue || 'No link'}>
                      <LinkIcon size={11} className="text-brand shrink-0" />
                      <span className="truncate">{banner.linkType === 'none' ? 'Display only' : banner.linkValue || banner.linkType}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="flex items-center gap-0.5 text-[10px]" title="Views">
                        <Eye size={11} /> {banner.viewsCount || 0}
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px]" title="Clicks">
                        <MousePointerClick size={11} /> {banner.clicksCount || 0}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-1 pt-1 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => openEditModal(banner)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Edit size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteModal({ open: true, id: banner._id, title: banner.title, isDeleting: false })}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Minimal Table View */
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-muted)]/50 border-b border-[var(--border)] text-[var(--text-muted)] font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded text-brand focus:ring-brand cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3">Banner</th>
                  <th className="py-2.5 px-3">Title & Target</th>
                  <th className="py-2.5 px-3">Placement</th>
                  <th className="py-2.5 px-3">Views / Clicks</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {banners.map(banner => {
                  const isSelected = selectedIds.includes(banner._id);

                  return (
                    <tr key={banner._id} className={`hover:bg-[var(--bg-muted)]/30 ${isSelected ? 'bg-brand/5' : ''}`}>
                      <td className="py-2.5 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(banner._id)}
                          className="w-3.5 h-3.5 rounded text-brand focus:ring-brand cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="w-16 h-9 rounded-md bg-zinc-900 overflow-hidden border border-[var(--border)]">
                          <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="font-semibold text-[var(--text-primary)] truncate">{banner.title}</div>
                        <div className="text-[11px] text-[var(--text-muted)] truncate">{banner.linkValue || 'No link'}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {getPlacementLabel(banner.position)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {banner.viewsCount || 0} / {banner.clicksCount || 0}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={(e) => handleToggleStatus(banner, e)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                            banner.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                          }`}
                        >
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(banner)}
                            className="p-1 rounded text-sky-600 hover:bg-sky-50 cursor-pointer"
                            title="Edit"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteModal({ open: true, id: banner._id, title: banner.title, isDeleting: false })}
                            className="p-1 rounded text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clean Add / Edit Modal */}
      {modalState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[var(--bg-surface)] w-full max-w-lg rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                {modalState.mode === 'create' ? 'Upload Banner' : 'Edit Banner'}
              </h2>
              <button
                type="button"
                onClick={() => setModalState(defaultForm)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleModalSubmit} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
              {modalState.error && (
                <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-1.5 border border-rose-200">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{modalState.error}</span>
                </div>
              )}

              {/* Banner Image Upload / URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">Banner Image *</label>

                {modalState.image ? (
                  <div className="relative aspect-[16/8] rounded-lg overflow-hidden border border-[var(--border)] bg-zinc-900">
                    <img src={modalState.image} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setModalState(prev => ({ ...prev, image: '', imageFile: null }))}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="border border-dashed border-[var(--border)] rounded-xl p-4 text-center bg-[var(--bg-muted)]/20 relative hover:border-brand/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setModalState(prev => ({
                            ...prev,
                            imageFile: file,
                            image: URL.createObjectURL(file),
                          }));
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <UploadCloud size={20} className="text-brand mx-auto mb-1" />
                    <span className="text-xs font-semibold text-[var(--text-primary)] block">Choose image file</span>
                    <span className="text-[10px] text-[var(--text-muted)]">PNG, JPG, WEBP (16:9 recommended)</span>
                  </div>
                )}

                <div className="pt-1">
                  <input
                    type="url"
                    placeholder="Or paste image URL directly"
                    value={modalState.imageFile ? '' : modalState.image}
                    onChange={(e) => setModalState(prev => ({ ...prev, image: e.target.value, imageFile: null }))}
                    className="w-full px-3 py-1.5 rounded-lg text-xs bg-[var(--bg-muted)]/40 border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-primary)]">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special Festive Offer"
                  value={modalState.title}
                  onChange={(e) => setModalState(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--bg-muted)]/40 border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-primary)]">Subtitle (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Verified luxury properties with zero brokerage"
                  value={modalState.subtitle}
                  onChange={(e) => setModalState(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--bg-muted)]/40 border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-brand"
                />
              </div>

              {/* Placement & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Placement Position *</label>
                  <select
                    value={modalState.position}
                    onChange={(e) => setModalState(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg text-xs bg-[var(--bg-muted)]/40 border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-brand cursor-pointer"
                  >
                    {PLACEMENT_OPTIONS.filter(p => p.id !== 'all').map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Order / Priority</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={modalState.sortOrder}
                    onChange={(e) => setModalState(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                    className="w-full px-2.5 py-2 rounded-lg text-xs bg-[var(--bg-muted)]/40 border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Action / Link */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Tap Action</label>
                  <select
                    value={modalState.linkType}
                    onChange={(e) => setModalState(prev => ({ ...prev, linkType: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg text-xs bg-[var(--bg-muted)]/40 border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-brand cursor-pointer"
                  >
                    {LINK_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">CTA Button Label</label>
                  <input
                    type="text"
                    placeholder="Explore Now"
                    value={modalState.buttonText}
                    onChange={(e) => setModalState(prev => ({ ...prev, buttonText: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg text-xs bg-[var(--bg-muted)]/40 border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {modalState.linkType !== 'none' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Destination Value (ID / URL)</label>
                  <input
                    type="text"
                    placeholder="Enter target ID, category name, or URL"
                    value={modalState.linkValue}
                    onChange={(e) => setModalState(prev => ({ ...prev, linkValue: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--bg-muted)]/40 border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-brand"
                  />
                </div>
              )}

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeToggle"
                  checked={modalState.isActive}
                  onChange={(e) => setModalState(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded text-brand focus:ring-brand cursor-pointer"
                />
                <label htmlFor="activeToggle" className="text-xs font-semibold text-[var(--text-primary)] cursor-pointer select-none">
                  Make visible on mobile app immediately
                </label>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setModalState(defaultForm)}
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalState.isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand/90 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {modalState.isSubmitting ? 'Saving...' : modalState.mode === 'create' ? 'Publish Banner' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Single Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[var(--bg-surface)] w-full max-w-sm rounded-xl border border-[var(--border)] p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Delete Banner</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Are you sure you want to remove <span className="font-semibold text-[var(--text-primary)]">"{deleteModal.title}"</span>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, id: null, title: '', isDeleting: false })}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-muted)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteModal.isDeleting}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 cursor-pointer"
              >
                {deleteModal.isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[var(--bg-surface)] w-full max-w-sm rounded-xl border border-[var(--border)] p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Delete Selected Banners</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Are you sure you want to delete <span className="font-semibold text-rose-600">{selectedIds.length}</span> selected banners?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-muted)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDeleteConfirm}
                disabled={isBulkDeleting}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 cursor-pointer"
              >
                {isBulkDeleting ? 'Deleting...' : `Delete ${selectedIds.length}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerManagement;
