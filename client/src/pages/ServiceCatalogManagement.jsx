import React, { useState, useEffect, useMemo } from 'react';
import AdminLoader from '../components/common/AdminLoader';
import API from '../api/api';
import {
  CreditCard, Home, Truck, Scale, Search, Plus,
  X, Layers, Check, Edit2, Trash2, RefreshCw,
  AlertTriangle, CheckCircle2, ArrowUpDown, ChevronLeft,
  ChevronRight, ToggleLeft, ToggleRight, Sparkles, Tag,
  Users, DollarSign, CheckCircle
} from 'lucide-react';

const ServiceCatalogManagement = () => {
  const [offerings, setOfferings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Filters
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Sorting and Pagination
  const [sortField, setSortField] = useState('order');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    category: 'Legal',
    title: '',
    subtitle: '',
    description: '',
    price: '',
    priceDisplay: '',
    badge: '',
    featuresText: '',
    partnersText: '',
    order: 0,
    isActive: true
  });

  const showToast = (text, type = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Fetch real offerings from MongoDB
  const fetchOfferings = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const response = await API.get('/admin/service-catalog');
      const resData = response.data;

      if (resData && resData.status === 'success') {
        setOfferings(resData.data.offerings || []);
      } else {
        setOfferings([]);
      }
    } catch (err) {
      console.error('Failed to fetch service offerings:', err);
      showToast('Network error loading service catalog', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOfferings();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      category: activeCategory !== 'ALL' ? activeCategory : 'Interior',
      title: '',
      subtitle: '',
      description: '',
      price: '',
      priceDisplay: '',
      badge: '',
      order: offerings.length + 1,
      isActive: true
    });
    setIsAddEditModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      title: item.title,
      subtitle: item.subtitle || '',
      description: item.description || '',
      price: item.price || '',
      priceDisplay: item.priceDisplay || '',
      badge: item.badge || '',
      order: item.order || 0,
      isActive: item.isActive !== false
    });
    setIsAddEditModalOpen(true);
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const numPrice = Number(formData.price) || 0;
      const cleanDisplay = formData.priceDisplay.trim() || (numPrice > 0 ? `₹${numPrice.toLocaleString('en-IN')}` : 'Contact for Quote');

      const payload = {
        category: formData.category,
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        description: formData.description.trim() || formData.subtitle.trim(),
        price: numPrice,
        priceDisplay: cleanDisplay,
        badge: formData.badge.trim(),
        features: editingItem?.features || [],
        partners: editingItem?.partners || [],
        order: Number(formData.order) || 0,
        isActive: Boolean(formData.isActive)
      };

      const response = editingItem
        ? await API.patch(`/admin/service-catalog/${editingItem._id}`, payload)
        : await API.post('/admin/service-catalog', payload);

      const resData = response.data;

      if (resData && resData.status === 'success') {
        showToast(editingItem ? 'Service offering updated successfully' : 'New service offering created');
        setIsAddEditModalOpen(false);
        fetchOfferings(true);
      } else {
        showToast(resData?.message || 'Failed to save offering', 'error');
      }
    } catch (err) {
      console.error('Error saving offering:', err);
      showToast('Network error saving service offering', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active Status directly
  const handleToggleActive = async (item) => {
    try {
      const nextState = !item.isActive;
      const response = await API.patch(`/admin/service-catalog/${item._id}`, { isActive: nextState });

      if (response.data && response.data.status === 'success') {
        setOfferings(prev => prev.map(o => o._id === item._id ? { ...o, isActive: nextState } : o));
        showToast(`${item.title} is now ${nextState ? 'Active (Live)' : 'Inactive (Hidden)'}`);
      } else {
        showToast('Failed to toggle status on server', 'error');
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      showToast('Network error updating status', 'error');
    }
  };

  // Delete Offering
  const handleDeleteOffering = async (id) => {
    try {
      const response = await API.delete(`/admin/service-catalog/${id}`);

      if (response.data && response.data.status === 'success') {
        setOfferings(prev => prev.filter(o => o._id !== id));
        showToast('Service offering deleted');
      } else {
        showToast('Failed to delete on server', 'error');
      }
    } catch (err) {
      console.error('Error deleting offering:', err);
      showToast('Network error deleting offering', 'error');
    } finally {
      setDeleteConfirmItem(null);
    }
  };

  // Reset to default catalog items
  const handleResetDefaults = async () => {
    if (!window.confirm('Reset all service packages and offerings back to system defaults? This will restore standard legal services, interior packages, and mover rates.')) {
      return;
    }
    try {
      const res = await API.post('/admin/service-catalog/seed?force=true');
      const data = res.data;
      if (data && data.status === 'success') {
        showToast('Service catalog reset to system defaults');
        fetchOfferings();
      }
    } catch (err) {
      console.error('Error resetting defaults:', err);
      showToast('Failed to reset catalog', 'error');
    }
  };

  // Sorting Handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Filtered & Sorted Offerings
  const sortedAndFilteredOfferings = useMemo(() => {
    const list = offerings.filter(item => {
      const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
      const matchesStatus = statusFilter === 'All' 
        ? true 
        : statusFilter === 'Active' ? item.isActive 
        : !item.isActive;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory && matchesStatus;

      const matchesSearch = 
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        (item.badge && item.badge.toLowerCase().includes(q)) ||
        (item.priceDisplay && item.priceDisplay.toLowerCase().includes(q)) ||
        (item.partners && item.partners.some(p => p.toLowerCase().includes(q))) ||
        (item.features && item.features.some(f => f.toLowerCase().includes(q)));

      return matchesCategory && matchesStatus && matchesSearch;
    });

    if (!sortField) return list;

    return [...list].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'price' || sortField === 'order') {
        const numA = Number(valA) || 0;
        const numB = Number(valB) || 0;
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();
      return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [offerings, activeCategory, statusFilter, searchQuery, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedAndFilteredOfferings.length / itemsPerPage) || 1;
  const paginatedOfferings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredOfferings.slice(start, start + itemsPerPage);
  }, [sortedAndFilteredOfferings, currentPage, itemsPerPage]);

  const getCategoryConfig = (category) => {
    switch (category) {
      case 'Loan':
        return { label: 'Loan Services', icon: CreditCard, color: 'text-blue-600 bg-blue-500/10 border-blue-500/20' };
      case 'Interior':
        return { label: 'Home Interior', icon: Home, color: 'text-purple-600 bg-purple-500/10 border-purple-500/20' };
      case 'Movers':
        return { label: 'Packers & Movers', icon: Truck, color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' };
      case 'Legal':
        return { label: 'Legal Services', icon: Scale, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' };
      default:
        return { label: 'General', icon: Layers, color: 'text-slate-600 bg-slate-500/10 border-slate-500/20' };
    }
  };

  const renderSortHeader = (label, field, align = 'left') => {
    const isSorted = sortField === field;
    return (
      <th
        className={`py-2 px-3 align-middle text-${align} whitespace-nowrap cursor-pointer select-none group/th hover:text-[var(--text-primary)] transition-colors`}
        onClick={() => handleSort(field)}
      >
        <div className={`inline-flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : ''}`}>
          <span>{label}</span>
          <ArrowUpDown
            size={11}
            className={`transition-colors ${isSorted ? 'text-brand' : 'text-slate-400/50 opacity-0 group-hover/th:opacity-100'}`}
          />
        </div>
      </th>
    );
  };

  return (
    <div className="w-full space-y-4">

      {/* Floating Notification Toast */}
      {feedbackMsg && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border animate-in slide-in-from-bottom duration-200 ${
          feedbackMsg.type === 'error'
            ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-800'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-800'
        }`}>
          {feedbackMsg.type === 'error' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* ─── 3 POLISHED KPI CARDS (TOP-ACCENT MINIMAL STYLE) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-3">
        {[
          {
            key: 'Interior',
            title: 'Interior Packages',
            subtitle: 'Modular Fitouts & Styles',
            icon: Home,
            count: offerings.filter(o => o.category === 'Interior').length,
            unit: 'Packages',
            accent: 'border-t-brand/40 hover:border-t-brand'
          },
          {
            key: 'Movers',
            title: 'Moving Packages',
            subtitle: 'Verified Relocation Tiers',
            icon: Truck,
            count: offerings.filter(o => o.category === 'Movers').length,
            unit: 'Tiers',
            accent: 'border-t-brand/40 hover:border-t-brand'
          },
          {
            key: 'Legal',
            title: 'Legal Offerings',
            subtitle: 'Deeds, Search & Registration',
            icon: Scale,
            count: offerings.filter(o => o.category === 'Legal').length,
            unit: 'Services',
            accent: 'border-t-brand/40 hover:border-t-brand'
          }
        ].map((card) => {
          const Icon = card.icon;
          const isSelected = activeCategory === card.key;
          return (
            <div
              key={card.key}
              onClick={() => {
                setActiveCategory(isSelected ? 'ALL' : card.key);
                setCurrentPage(1);
              }}
              role="button"
              tabIndex={0}
              className={`group bg-[var(--bg-surface)] rounded-xl p-3.5 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden flex flex-col justify-between border border-[var(--border)] border-t-2 text-left cursor-pointer ${
                isSelected 
                  ? 'border-brand border-t-brand ring-1 ring-brand/30 bg-brand/[0.02]' 
                  : `${card.accent}`
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
                    {card.title}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                      {card.count}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] font-medium">
                      {card.unit}
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 text-brand bg-brand/10">
                  <Icon size={16} strokeWidth={2} />
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)] truncate max-w-[150px]">
                  {card.subtitle}
                </span>
                {isSelected ? (
                  <span className="text-[10px] font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                    Filtered
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-[var(--text-muted)] group-hover:text-brand transition-colors">
                    Click to filter
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── MAIN MASTER CONTAINER ─── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xs overflow-hidden transition-all duration-200">
        
        {/* Header Toolbar */}
        <div className="p-3 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-2.5 bg-[var(--bg-surface)]">
          
          {/* Segmented Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-[var(--bg-muted)]/60 p-1 rounded-xl border border-[var(--border)]">
            {[
              { id: 'ALL', label: 'All Catalog', count: offerings.length },
              { id: 'Interior', label: 'Interior', count: offerings.filter(o => o.category === 'Interior').length },
              { id: 'Movers', label: 'Movers', count: offerings.filter(o => o.category === 'Movers').length },
              { id: 'Legal', label: 'Legal', count: offerings.filter(o => o.category === 'Legal').length }
            ].map((tab) => {
              const active = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    active
                      ? 'bg-brand text-white font-semibold shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold transition-colors ${
                    active ? 'bg-white/20 text-white' : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border)]'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Controls: Search + Status Filter + Refresh + Actions */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Search Input */}
            <div className="relative w-44 sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" size={13} />
              <input
                type="text"
                placeholder="Search offering, price, badge..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-8 pl-8 pr-7 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 focus:bg-[var(--bg-surface)] placeholder:text-[var(--text-muted)] transition-all duration-150"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 transition-colors cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 px-2.5 bg-[var(--bg-muted)] text-xs font-medium text-[var(--text-primary)] rounded-lg border border-[var(--border)] hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 cursor-pointer shrink-0 transition-all duration-150"
            >
              <option value="All">All Visibility</option>
              <option value="Active">Live (Active)</option>
              <option value="Inactive">Hidden (Inactive)</option>
            </select>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchOfferings(true)}
              disabled={isRefreshing}
              title="Refresh Catalog Data"
              className="w-8 h-8 rounded-lg text-xs font-semibold bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-brand hover:border-brand/40 border border-[var(--border)] transition-all flex items-center justify-center shrink-0 cursor-pointer active:scale-95 disabled:opacity-60"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-brand' : ''} />
            </button>

            {/* Reset to Defaults Button */}
            <button
              type="button"
              onClick={handleResetDefaults}
              title="Reset catalog offerings to platform defaults"
              className="h-8 px-2.5 rounded-lg text-xs font-medium bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] transition-all flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={12} />
              <span className="hidden md:inline">Reset Defaults</span>
            </button>

            {/* Add Service Button */}
            <button
              type="button"
              onClick={openCreateModal}
              className="h-8 px-3 rounded-lg text-xs font-semibold bg-brand text-white hover:bg-brand-dark transition-all duration-150 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs hover:shadow-brand/20 active:scale-95"
            >
              <Plus size={14} />
              <span>Add Service</span>
            </button>
          </div>

        </div>

        {/* ─── DATA TABLE: 100% WIDTH, ZERO HORIZONTAL SCROLL ─── */}
        <div className="w-full overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed">
            <colgroup>
              <col className="w-[40%]" />
              <col className="w-[20%]" />
              <col className="w-[18%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[11px] font-semibold uppercase tracking-wider bg-[var(--bg-muted)]/50">
                {renderSortHeader('Service Offering', 'title')}
                {renderSortHeader('Category', 'category')}
                {renderSortHeader('Price / Rate', 'price')}
                <th 
                  className="py-2 px-3 align-middle text-center whitespace-nowrap cursor-pointer select-none group/th hover:text-[var(--text-primary)] transition-colors"
                  onClick={() => handleSort('isActive')}
                >
                  <div className="inline-flex items-center justify-center gap-1.5">
                    <span>Visibility</span>
                    <ArrowUpDown size={11} className={`transition-colors ${sortField === 'isActive' ? 'text-brand' : 'text-slate-400/50 opacity-0 group-hover/th:opacity-100'}`} />
                  </div>
                </th>
                <th className="py-2 px-3 align-middle text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center">
                    <AdminLoader
                      text="Loading service catalog..."
                      subtext="Fetching live service offerings and pricing tiers"
                      minHeight="min-h-[180px]"
                    />
                  </td>
                </tr>
              ) : paginatedOfferings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col items-center justify-center space-y-1.5 animate-in fade-in duration-200">
                      <div className="w-9 h-9 rounded-full bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)]">
                        <Search size={16} />
                      </div>
                      <p className="font-semibold text-xs text-[var(--text-primary)]">No service offerings found</p>
                      <p className="text-[11px] text-[var(--text-muted)] max-w-xs mx-auto">
                        Try adjusting your search criteria, reset active filters, or click "Add Service" to create one.
                      </p>
                      <div className="flex items-center gap-2 justify-center mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('All');
                            setActiveCategory('ALL');
                            setCurrentPage(1);
                          }}
                          className="text-xs font-semibold text-brand hover:underline cursor-pointer"
                        >
                          Clear all filters
                        </button>
                        <span className="text-[var(--border)]">|</span>
                        <button
                          type="button"
                          onClick={openCreateModal}
                          className="text-xs font-semibold text-brand hover:underline cursor-pointer"
                        >
                          + Create first offering
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOfferings.map((item) => {
                  const catCfg = getCategoryConfig(item.category);

                  return (
                    <tr
                      key={item._id}
                      className="group hover:bg-[var(--bg-muted)]/40 transition-colors duration-150"
                    >
                      {/* 1. Title & Subtitle */}
                      <td className="py-1.5 px-3 align-middle min-w-0">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-nowrap">
                            <span className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-brand transition-colors truncate">
                              {item.title}
                            </span>
                            {item.badge && (
                              <span className="text-[9px] font-bold text-brand bg-brand/10 px-1 py-0.2 rounded border border-brand/20 shrink-0">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.subtitle && (
                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate" title={item.subtitle}>
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 2. Category */}
                      <td className="py-1.5 px-3 align-middle whitespace-nowrap min-w-0">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${catCfg.color}`}>
                          <span>{catCfg.label}</span>
                        </span>
                      </td>

                      {/* 3. Price / Display */}
                      <td className="py-1.5 px-3 align-middle whitespace-nowrap min-w-0">
                        <span className="font-semibold text-xs text-[var(--text-primary)] font-mono truncate">
                          {item.priceDisplay}
                        </span>
                      </td>

                      {/* 4. Active Toggle */}
                      <td className="py-1.5 px-3 align-middle text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-all cursor-pointer ${
                            item.isActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/20'
                          }`}
                          title="Click to toggle visibility on App & Website"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          <span>{item.isActive ? 'Live' : 'Hidden'}</span>
                        </button>
                      </td>

                      {/* 7. Actions: Edit, Delete */}
                      <td className="py-1.5 px-3 align-middle text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 justify-end shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            title="Edit Service Offering"
                            className="w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-brand hover:border-brand/40 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          >
                            <Edit2 size={12} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmItem(item)}
                            title="Delete Offering"
                            className="w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-900/50 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          >
                            <Trash2 size={12} />
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

        {/* Clean Footer Bar with Pagination */}
        <div className="p-2.5 px-3.5 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--text-muted)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-[var(--text-primary)] font-semibold">{sortedAndFilteredOfferings.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</strong>
              {' '}-{' '}
              <strong className="text-[var(--text-primary)] font-semibold">{Math.min(currentPage * itemsPerPage, sortedAndFilteredOfferings.length)}</strong> of <strong className="text-[var(--text-primary)] font-semibold">{sortedAndFilteredOfferings.length}</strong> catalog offerings
            </span>
            <span className="hidden sm:inline text-[var(--border)]">|</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Synced to User App & Web</span>
            </span>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 px-2 rounded-md border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft size={13} />
                <span>Prev</span>
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isActive = currentPage === pageNum;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-brand text-white shadow-2xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] border border-transparent'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-7 px-2 rounded-md border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ─── MODAL: CREATE OR EDIT SERVICE OFFERING (CLEAN & SIMPLE) ─── */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl max-w-md w-full shadow-2xl border border-[var(--border)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-4 px-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-muted)]/30">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                  {editingItem ? 'Edit Service Offering' : 'Add New Service Offering'}
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {editingItem ? 'Update package details and pricing' : 'Create an offering for the customer app & website'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
              
              {/* 1. Category Selection: 3 Instant Tap Cards */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                  Select Category *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Interior', label: 'Interior', desc: 'Decor & Fitouts', icon: Home },
                    { id: 'Movers', label: 'Movers', desc: 'Relocation', icon: Truck },
                    { id: 'Legal', label: 'Legal', desc: 'Deeds & Title', icon: Scale }
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = formData.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.id })}
                        className={`p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-brand bg-brand/10 text-brand ring-1 ring-brand/40 shadow-xs'
                            : 'border-[var(--border)] bg-[var(--bg-muted)]/40 text-[var(--text-secondary)] hover:border-slate-300 dark:hover:border-slate-700 hover:bg-[var(--bg-muted)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon size={16} className={isSelected ? 'text-brand' : 'text-[var(--text-muted)]'} />
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>}
                        </div>
                        <div className="mt-2">
                          <span className="text-xs font-bold leading-none block">{cat.label}</span>
                          <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">{cat.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Service Title */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-primary)]">
                  Service Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    formData.category === 'Interior' ? 'e.g. Modern 3 BHK Living Fitout' :
                    formData.category === 'Movers' ? 'e.g. Standard 2 BHK Relocation' :
                    'e.g. Sale Deed Drafting & Verification'
                  }
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full h-9 px-3 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all placeholder:text-[var(--text-muted)]"
                />
              </div>

              {/* 3. Subtitle / Tagline */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-muted)]">
                  Short Tagline / Summary
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lawyer prepares registered deed within 24 hours"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full h-8.5 px-3 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all placeholder:text-[var(--text-muted)]"
                />
              </div>

              {/* 4. Smart Price Input */}
              <div className="space-y-1.5 p-3 rounded-xl bg-[var(--bg-muted)]/40 border border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[var(--text-primary)]">
                    Service Price (₹)
                  </label>
                  {formData.priceDisplay && (
                    <span className="text-[10px] font-semibold text-brand font-mono bg-brand/10 px-1.5 py-0.2 rounded">
                      Preview: {formData.priceDisplay}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--text-muted)] font-mono">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter amount (e.g. 2999 or 250000)"
                    value={formData.price}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = Number(val);
                      let autoDisplay = '';
                      if (!val || num === 0) {
                        autoDisplay = 'Contact for Quote';
                      } else if (num >= 100000) {
                        autoDisplay = `₹${(num / 100000).toFixed(1).replace(/\.0$/, '')} Lakhs`;
                      } else {
                        autoDisplay = `₹${num.toLocaleString('en-IN')}`;
                      }
                      setFormData({
                        ...formData,
                        price: val,
                        priceDisplay: autoDisplay
                      });
                    }}
                    className="w-full h-9 pl-7 pr-3 bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                  />
                </div>

                {/* Optional Custom Display Text */}
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-[10px] text-[var(--text-muted)] shrink-0">Custom label:</span>
                  <input
                    type="text"
                    placeholder="e.g. ₹8,500 est. or Contact for Quote"
                    value={formData.priceDisplay}
                    onChange={(e) => setFormData({ ...formData, priceDisplay: e.target.value })}
                    className="h-6 px-2 bg-transparent text-[11px] text-[var(--text-primary)] border-b border-[var(--border)] focus:border-brand outline-none flex-1 placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>

              {/* 5. Highlight Badge Chips (1-Click Selection) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[var(--text-muted)]">
                  Highlight Badge (Optional)
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {['None', 'Popular', 'Best Value', 'Top Rated', 'Essential'].map((tag) => {
                    const isNone = tag === 'None';
                    const isSelected = isNone ? !formData.badge : formData.badge.toLowerCase() === tag.toLowerCase();
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setFormData({ ...formData, badge: isNone ? '' : tag })}
                        className={`h-6 px-2.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-brand text-white shadow-2xs'
                            : 'bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]/50'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. Publish Toggle Switch */}
              <div className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-[var(--bg-muted)]/50 border border-[var(--border)]">
                <div>
                  <span className="text-xs font-semibold text-[var(--text-primary)] block">
                    Publish to App & Website
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                    {formData.isActive ? 'Active — immediately visible to customers' : 'Hidden — saved as draft'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.isActive ? 'bg-brand' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      formData.isActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs hover:shadow-brand/20 active:scale-95 disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingItem ? 'Save Changes' : 'Create Offering'}</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CONFIRM DELETE OFFERING ─── */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl max-w-sm w-full shadow-2xl border border-[var(--border)] p-5 space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle size={20} />
              <h3 className="text-sm font-bold">Delete Service Offering?</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Are you sure you want to delete <strong className="text-[var(--text-primary)]">{deleteConfirmItem.title}</strong>? It will no longer be visible to customers on the app or website.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteOffering(deleteConfirmItem._id)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs active:scale-95"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ServiceCatalogManagement;
