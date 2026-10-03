import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard, Home, Truck, Scale, Search, Plus,
  MapPin, UserCheck, X, Eye, Layers, Check, Edit2,
  Phone, Mail, ArrowUpRight, Sparkles, Clock, CheckCircle2,
  Trash2, RefreshCw, MessageCircle, AlertTriangle, Send
} from 'lucide-react';

const ServicesManagement = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Active Category Filter: ALL, Loan, Interior, Movers, Legal
  const [activeService, setActiveService] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [editingEnquiry, setEditingEnquiry] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [partnerAssignModal, setPartnerAssignModal] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [newQuotationAmount, setNewQuotationAmount] = useState('');
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

  // Note submission in drawer
  const [drawerNoteText, setDrawerNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Form state for creating a new service request
  const [newRequest, setNewRequest] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    serviceType: 'Loan',
    serviceName: '',
    location: '',
    propertyId: '',
    propertyRef: '',
    propertyValue: '',
    loanRequired: '',
    budgetRange: '',
    shiftingDate: '',
    assignedPartner: '',
    quotation: '',
    notes: ''
  });
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Real data state
  const [enquiries, setEnquiries] = useState([]);
  const [availableProperties, setAvailableProperties] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    loan: 0,
    interior: 0,
    movers: 0,
    legal: 0
  });

  const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const API_BASE = RAW_API_URL.replace(/\/+api\/?$/i, '').replace(/\/+$/, '');

  const showToast = (text, type = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const getAuthToken = () => {
    return localStorage.getItem('adminToken') || localStorage.getItem('token') || '';
  };

  const partnersCatalog = {
    Loan: ['HDFC Home Loans', 'State Bank of India (SBI)', 'ICICI Bank Home Finance', 'Axis Bank Loan Desk', 'Bajaj Housing Finance'],
    Interior: ['Studio Luxe Interiors', 'Livspace Certified Partner', 'HomeLane Studio', 'Urban Woodcrafts Delhi/NCR', 'DecorSpace Mumbai'],
    Movers: ['Agarwal Premium Shifting', 'Gati Relocations', 'Porter Enterprise', 'SafeX Packers & Movers', 'UrbanMove Intercity'],
    Legal: ['Adv. M.K. Shinde', 'LawDesk Property Advisors', 'LexJuris Legal Associates', 'Chambers of R.N. Joshi']
  };

  // Fetch real service inquiries from MongoDB
  const fetchServices = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/api/admin/services`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const resData = await response.json();

      if (response.ok && resData.status === 'success') {
        const rawServices = resData.data.services || [];
        const mapped = rawServices.map(item => ({
          _id: item._id,
          id: item.serviceRequestId || `SRV-${String(item._id).slice(-4).toUpperCase()}`,
          serviceType: item.serviceType,
          serviceName: item.serviceName,
          clientName: item.clientName,
          clientPhone: item.clientPhone,
          clientEmail: item.clientEmail || '',
          location: item.location || 'India',
          propertyRef: item.propertyRef || (item.property?.title ? item.property.title : 'Direct Inquiry'),
          propertyValue: item.propertyValue || (item.property?.price ? `₹${Number(item.property.price).toLocaleString('en-IN')}` : ''),
          loanRequired: item.loanRequired || '',
          employmentType: item.employmentType || '',
          monthlyIncome: item.monthlyIncome || '',
          cibilScore: item.cibilScore || '',
          preferredBank: item.preferredBank || '',
          budgetRange: item.budgetRange || '',
          designStyle: item.designStyle || '',
          scope: item.scope || [],
          moveType: item.moveType || '',
          shiftingDate: item.shiftingDate || '',
          packingQuality: item.packingQuality || '',
          insuranceRequired: item.insuranceRequired || '',
          legalServiceScope: item.legalServiceScope || '',
          courtJurisdiction: item.courtJurisdiction || '',
          assignedPartner: item.assignedPartner || '',
          quotation: item.quotation || 'Under Review',
          quotationSubtext: item.quotationSubtext || 'Initial Estimate',
          date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today',
          status: item.status || 'In Progress',
          timeline: item.timeline && item.timeline.length > 0 ? item.timeline : [],
          notes: item.notes || '',
          notesHistory: item.notesHistory || []
        }));

        setEnquiries(mapped);
        if (resData.counts) {
          setCounts(resData.counts);
        }

        // Update selectedEnquiry reference if drawer is open
        if (selectedEnquiry) {
          const refreshedCurrent = mapped.find(e => e._id === selectedEnquiry._id);
          if (refreshedCurrent) setSelectedEnquiry(refreshedCurrent);
        }
      } else {
        setEnquiries([]);
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
      setEnquiries([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch real properties for linking
  const fetchAvailableProperties = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/api/admin/properties?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setAvailableProperties(data.data?.properties || []);
      }
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchAvailableProperties();
  }, []);

  // Update Status in MongoDB
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/api/admin/services/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          newNote: `Status updated to ${newStatus}`
        })
      });

      if (response.ok) {
        setEnquiries(prev => prev.map(e => e._id === id ? { ...e, status: newStatus } : e));
        if (selectedEnquiry?._id === id) {
          setSelectedEnquiry(prev => ({ ...prev, status: newStatus }));
        }
        showToast(`Service status updated to ${newStatus}`);
      } else {
        showToast('Failed to update status on server', 'error');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Network error updating status', 'error');
    }
  };

  // Assign Partner & Quotation in MongoDB
  const handleAssignPartner = async () => {
    if (!partnerAssignModal || !selectedPartner) return;
    const item = partnerAssignModal;
    const cleanQuote = newQuotationAmount.trim() 
      ? (newQuotationAmount.startsWith('₹') ? newQuotationAmount.trim() : `₹${newQuotationAmount.trim()}`) 
      : item.quotation;

    try {
      const token = getAuthToken();
      const newStatus = item.status === 'New' ? 'In Progress' : item.status;

      const response = await fetch(`${API_BASE}/api/admin/services/${item._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          assignedPartner: selectedPartner,
          quotation: cleanQuote,
          status: newStatus,
          newNote: `Partner assigned: ${selectedPartner} (Quote: ${cleanQuote})`
        })
      });

      if (response.ok) {
        setEnquiries(prev => prev.map(e => e._id === item._id ? {
          ...e,
          assignedPartner: selectedPartner,
          quotation: cleanQuote,
          status: newStatus
        } : e));

        if (selectedEnquiry?._id === item._id) {
          setSelectedEnquiry(prev => ({
            ...prev,
            assignedPartner: selectedPartner,
            quotation: cleanQuote,
            status: newStatus
          }));
        }

        showToast(`Assigned to ${selectedPartner}`);
      } else {
        showToast('Failed to update partner on server', 'error');
      }
    } catch (err) {
      console.error('Error assigning partner:', err);
      showToast('Network error while assigning partner', 'error');
    } finally {
      setPartnerAssignModal(null);
      setSelectedPartner('');
      setNewQuotationAmount('');
    }
  };

  // Toggle or Update Milestone Stage Status in MongoDB
  const handleToggleStageStatus = async (stageIdx) => {
    if (!selectedEnquiry || !selectedEnquiry.timeline) return;
    const updatedTimeline = selectedEnquiry.timeline.map((st, i) => {
      if (i === stageIdx) {
        const nextStatus = st.status === 'done' ? 'pending' : st.status === 'active' ? 'done' : 'active';
        return {
          ...st,
          status: nextStatus,
          date: nextStatus === 'done' 
            ? new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) 
            : (nextStatus === 'active' ? 'In Progress' : 'Pending')
        };
      }
      return st;
    });

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/api/admin/services/${selectedEnquiry._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          timeline: updatedTimeline
        })
      });

      if (response.ok) {
        setEnquiries(prev => prev.map(e => e._id === selectedEnquiry._id ? { ...e, timeline: updatedTimeline } : e));
        setSelectedEnquiry(prev => ({ ...prev, timeline: updatedTimeline }));
        showToast('Milestone status updated');
      }
    } catch (err) {
      console.error('Error updating milestone:', err);
    }
  };

  // Save Full Edit to MongoDB
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingEnquiry) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/api/admin/services/${editingEnquiry._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingEnquiry)
      });

      if (response.ok) {
        setEnquiries(prev => prev.map(item => item._id === editingEnquiry._id ? editingEnquiry : item));
        if (selectedEnquiry?._id === editingEnquiry._id) {
          setSelectedEnquiry(editingEnquiry);
        }
        setEditingEnquiry(null);
        showToast('Service inquiry updated in database');
      } else {
        showToast('Failed to save changes on server', 'error');
      }
    } catch (err) {
      console.error('Error saving edits:', err);
      showToast('Network error saving changes', 'error');
    }
  };

  // Add Internal Follow-up Note in Drawer
  const handleAddDrawerNote = async () => {
    if (!drawerNoteText.trim() || !selectedEnquiry || isSubmittingNote) return;
    setIsSubmittingNote(true);

    try {
      const token = getAuthToken();
      const trimmed = drawerNoteText.trim();
      const response = await fetch(`${API_BASE}/api/admin/services/${selectedEnquiry._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          newNote: trimmed
        })
      });

      if (response.ok) {
        const newNoteObj = {
          text: trimmed,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          author: 'Admin'
        };

        const updatedHistory = [...(selectedEnquiry.notesHistory || []), newNoteObj];

        setEnquiries(prev => prev.map(e => e._id === selectedEnquiry._id ? {
          ...e,
          notes: trimmed,
          notesHistory: updatedHistory
        } : e));

        setSelectedEnquiry(prev => ({
          ...prev,
          notes: trimmed,
          notesHistory: updatedHistory
        }));

        setDrawerNoteText('');
        showToast('Internal note saved to database');
      }
    } catch (err) {
      console.error('Error saving note:', err);
      showToast('Network error saving note', 'error');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Delete Service Request from MongoDB
  const handleDeleteService = async (id) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/api/admin/services/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setEnquiries(prev => prev.filter(e => e._id !== id));
        if (selectedEnquiry?._id === id) setSelectedEnquiry(null);
        showToast('Service inquiry deleted permanently');
      } else {
        showToast('Failed to delete service on server', 'error');
      }
    } catch (err) {
      console.error('Error deleting service:', err);
      showToast('Network error deleting service', 'error');
    } finally {
      setDeleteConfirmItem(null);
    }
  };

  // Create Real Service Request in MongoDB
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!newRequest.clientName.trim() || !newRequest.clientPhone.trim() || isSubmittingNew) return;

    setIsSubmittingNew(true);
    try {
      const token = getAuthToken();

      let targetRef = newRequest.propertyRef.trim();
      let targetLoc = newRequest.location.trim();
      let targetVal = newRequest.propertyValue.trim();

      if (newRequest.propertyId) {
        const found = availableProperties.find(p => p._id === newRequest.propertyId);
        if (found) {
          targetRef = found.title;
          targetLoc = [found.locality, found.city].filter(Boolean).join(', ') || targetLoc;
          if (found.price) targetVal = `₹${Number(found.price).toLocaleString('en-IN')}`;
        }
      }

      const payload = {
        ...newRequest,
        propertyRef: targetRef || 'Direct Service Inquiry',
        location: targetLoc || 'India',
        propertyValue: targetVal,
        assignedPartner: newRequest.assignedPartner || (partnersCatalog[newRequest.serviceType] && partnersCatalog[newRequest.serviceType][0]) || 'Specialist Desk'
      };

      const response = await fetch(`${API_BASE}/api/admin/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      if (response.ok && resData.status === 'success') {
        const created = resData.data.service;
        const mappedNew = {
          _id: created._id,
          id: created.serviceRequestId || `SRV-${String(created._id).slice(-4).toUpperCase()}`,
          serviceType: created.serviceType,
          serviceName: created.serviceName,
          clientName: created.clientName,
          clientPhone: created.clientPhone,
          clientEmail: created.clientEmail || '',
          location: created.location,
          propertyRef: created.propertyRef,
          propertyValue: created.propertyValue,
          loanRequired: created.loanRequired,
          budgetRange: created.budgetRange,
          shiftingDate: created.shiftingDate,
          assignedPartner: created.assignedPartner,
          quotation: created.quotation,
          quotationSubtext: created.quotationSubtext,
          date: 'Today',
          status: created.status || 'In Progress',
          timeline: created.timeline || [],
          notes: created.notes,
          notesHistory: created.notesHistory || []
        };

        setEnquiries(prev => [mappedNew, ...prev]);
        setIsAddModalOpen(false);
        setNewRequest({
          clientName: '',
          clientPhone: '',
          clientEmail: '',
          serviceType: 'Loan',
          serviceName: '',
          location: '',
          propertyId: '',
          propertyRef: '',
          propertyValue: '',
          loanRequired: '',
          budgetRange: '',
          shiftingDate: '',
          assignedPartner: '',
          quotation: '',
          notes: ''
        });
        showToast('New service request created in database');
      } else {
        showToast(resData.message || 'Failed to create service request', 'error');
      }
    } catch (err) {
      console.error('Error creating service:', err);
      showToast('Network error creating request', 'error');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Filter inquiries based on service vertical, status, and search query
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter(item => {
      const matchesService = activeService === 'ALL' || item.serviceType === activeService;
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        item.clientName.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.serviceName.toLowerCase().includes(q) ||
        (item.assignedPartner && item.assignedPartner.toLowerCase().includes(q));
      return matchesService && matchesStatus && matchesSearch;
    });
  }, [enquiries, activeService, statusFilter, searchQuery]);

  const getServiceConfig = (type) => {
    switch (type) {
      case 'Loan':
        return {
          label: 'Home Loans',
          icon: CreditCard,
          pillColor: 'bg-blue-50/80 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/50',
          hoverBorder: 'group-hover:border-blue-300 dark:group-hover:border-blue-800'
        };
      case 'Interior':
        return {
          label: 'Home Interior',
          icon: Home,
          pillColor: 'bg-purple-50/80 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200/60 dark:border-purple-900/50',
          hoverBorder: 'group-hover:border-purple-300 dark:group-hover:border-purple-800'
        };
      case 'Movers':
        return {
          label: 'Packers & Movers',
          icon: Truck,
          pillColor: 'bg-amber-50/80 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/50',
          hoverBorder: 'group-hover:border-amber-300 dark:group-hover:border-amber-800'
        };
      case 'Legal':
        return {
          label: 'Legal Services',
          icon: Scale,
          pillColor: 'bg-emerald-50/80 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/50',
          hoverBorder: 'group-hover:border-emerald-300 dark:group-hover:border-emerald-800'
        };
      default:
        return {
          label: 'General',
          icon: Layers,
          pillColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200',
          hoverBorder: 'group-hover:border-slate-300'
        };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
      case 'Completed':
        return {
          pill: 'bg-emerald-50/90 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
          dot: 'bg-emerald-500'
        };
      case 'Quotation Sent':
        return {
          pill: 'bg-purple-50/90 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800/40',
          dot: 'bg-purple-500'
        };
      case 'In Progress':
        return {
          pill: 'bg-sky-50/90 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200 dark:border-sky-800/40',
          dot: 'bg-sky-500'
        };
      case 'Cancelled':
        return {
          pill: 'bg-rose-50/90 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/40',
          dot: 'bg-rose-500'
        };
      default:
        return {
          pill: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          dot: 'bg-slate-400'
        };
    }
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
      
      {/* ─── 4 POLISHED KPI CARDS WITH HOVER LIFT & GLOW ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {[
          { key: 'Loan', title: 'Loan Services', subtitle: 'Home Loans & LAP Desk', icon: CreditCard, count: enquiries.filter(e => e.serviceType === 'Loan').length, unit: 'Inquiries', accent: 'from-blue-500 to-indigo-500' },
          { key: 'Interior', title: 'Home Interior', subtitle: 'Design & Modular Fitouts', icon: Home, count: enquiries.filter(e => e.serviceType === 'Interior').length, unit: 'Projects', accent: 'from-purple-500 to-pink-500' },
          { key: 'Movers', title: 'Packers & Movers', subtitle: 'Local & Intercity Relocation', icon: Truck, count: enquiries.filter(e => e.serviceType === 'Movers').length, unit: 'Moves', accent: 'from-amber-500 to-orange-500' },
          { key: 'Legal', title: 'Legal Services', subtitle: 'Title Search & Registry', icon: Scale, count: enquiries.filter(e => e.serviceType === 'Legal').length, unit: 'Cases', accent: 'from-emerald-500 to-teal-500' }
        ].map((card) => {
          const Icon = card.icon;
          const isSelected = activeService === card.key;
          return (
            <div
              key={card.key}
              onClick={() => setActiveService(isSelected ? 'ALL' : card.key)}
              role="button"
              tabIndex={0}
              className={`group relative p-3.5 rounded-xl border bg-[var(--bg-surface)] transition-all duration-200 cursor-pointer select-none flex flex-col justify-between overflow-hidden ${
                isSelected
                  ? 'border-brand ring-2 ring-brand/20 shadow-sm -translate-y-0.5'
                  : 'border-[var(--border)] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-1'
              }`}
            >
              {/* Subtle Top Gradient Glow Accent */}
              <div className={`absolute top-0 left-0 right-0 h-0.5 transition-opacity duration-300 ${
                isSelected ? 'bg-brand opacity-100' : 'bg-gradient-to-r from-transparent via-brand to-transparent opacity-0 group-hover:opacity-100'
              }`} />

              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block transition-colors group-hover:text-[var(--text-primary)]">
                    {card.title}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)] transition-transform duration-200 group-hover:scale-105 inline-block">
                      {card.count}
                    </span>
                    <span className="text-xs font-semibold text-[var(--text-muted)]">
                      {card.unit}
                    </span>
                  </div>
                </div>

                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                  isSelected
                    ? 'bg-brand/10 text-brand scale-105'
                    : 'bg-[var(--bg-muted)] text-[var(--text-muted)] group-hover:scale-110 group-hover:text-brand group-hover:bg-brand/10'
                }`}>
                  <Icon size={16} strokeWidth={1.8} />
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-[var(--border)]/70 flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)] truncate transition-colors group-hover:text-[var(--text-primary)]">
                  {card.subtitle}
                </span>
                {isSelected ? (
                  <span className="text-brand font-bold text-[10px] shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse"></span>
                    <span>Filtered</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                    Live DB
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
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'ALL', label: 'All Services', count: enquiries.length },
              { id: 'Loan', label: 'Loans', count: enquiries.filter(e => e.serviceType === 'Loan').length },
              { id: 'Interior', label: 'Interior', count: enquiries.filter(e => e.serviceType === 'Interior').length },
              { id: 'Movers', label: 'Movers', count: enquiries.filter(e => e.serviceType === 'Movers').length },
              { id: 'Legal', label: 'Legal', count: enquiries.filter(e => e.serviceType === 'Legal').length }
            ].map((tab) => {
              const active = activeService === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveService(tab.id)}
                  className={`h-8 px-2.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    active
                      ? 'bg-brand text-white font-semibold shadow-xs shadow-brand/25 scale-[1.02]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold transition-colors ${
                    active ? 'bg-white/25 text-white' : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Controls: Search + Status Filter + Refresh + Add Button */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Search Input */}
            <div className="relative w-40 sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors pointer-events-none" size={13} />
              <input
                type="text"
                placeholder="Search client, partner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-6 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 focus:bg-[var(--bg-surface)] placeholder:text-[var(--text-muted)] transition-all duration-200"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 hover:scale-110 transition-all cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2.5 bg-[var(--bg-muted)] text-xs font-medium text-[var(--text-primary)] rounded-lg border border-[var(--border)] hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 cursor-pointer shrink-0 transition-all duration-200"
            >
              <option value="All">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Quotation Sent">Quotation Sent</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchServices(true)}
              disabled={isRefreshing}
              title="Refresh Live Data"
              className="w-8 h-8 rounded-lg text-xs font-semibold bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-brand hover:border-brand/40 border border-[var(--border)] transition-all flex items-center justify-center shrink-0 cursor-pointer active:scale-95 disabled:opacity-60"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-brand' : ''} />
            </button>

            {/* New Request Button */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="h-8 px-2.5 rounded-lg text-xs font-semibold bg-brand text-white hover:bg-brand-dark transition-all duration-150 flex items-center gap-1 shrink-0 cursor-pointer shadow-xs hover:shadow-sm hover:shadow-brand/25 active:scale-95"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">New Request</span>
            </button>
          </div>

        </div>

        {/* ─── DATA TABLE: 100% WIDTH, ZERO HORIZONTAL SCROLL ─── */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-muted)]/50">
                <th className="py-2.5 px-3 align-middle whitespace-nowrap">ID</th>
                <th className="py-2.5 px-3 align-middle">Service</th>
                <th className="py-2.5 px-3 align-middle">Client</th>
                <th className="py-2.5 px-3 align-middle">Location</th>
                <th className="py-2.5 px-3 align-middle">Partner</th>
                <th className="py-2.5 px-3 align-middle">Quotation</th>
                <th className="py-2.5 px-3 align-middle text-center whitespace-nowrap">Status</th>
                <th className="py-2.5 px-3 align-middle text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-medium">Loading real service requests from database...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col items-center justify-center space-y-1.5 animate-in fade-in duration-200">
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)]">
                        <Search size={15} />
                      </div>
                      <p className="font-semibold text-xs text-[var(--text-primary)]">No matching service inquiries</p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Try adjusting your search criteria or resetting filters.
                      </p>
                      {(searchQuery || statusFilter !== 'All' || activeService !== 'ALL') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('All');
                            setActiveService('ALL');
                          }}
                          className="mt-1 text-xs font-semibold text-brand hover:underline cursor-pointer"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEnquiries.map((item) => {
                  const cfg = getServiceConfig(item.serviceType);
                  const Icon = cfg.icon;
                  const statusCfg = getStatusBadge(item.status);

                  return (
                    <tr
                      key={item._id}
                      onClick={() => setSelectedEnquiry(item)}
                      className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors duration-150 cursor-pointer"
                    >
                      {/* 1. ID */}
                      <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                        <span className="font-mono text-[11px] font-semibold text-[var(--text-primary)] group-hover:text-brand transition-colors duration-150">
                          {item.id}
                        </span>
                      </td>

                      {/* 2. Service Category & Name */}
                      <td className="py-2.5 px-3 align-middle">
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${cfg.pillColor} group-hover:scale-105 transition-transform duration-200`}>
                            <Icon size={11} />
                          </div>
                          <span className="font-medium text-[var(--text-primary)] group-hover:text-brand transition-colors duration-150" title={item.serviceName}>
                            {item.serviceName}
                          </span>
                        </div>
                      </td>

                      {/* 3. Client Name & Phone */}
                      <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                        <div className="leading-tight">
                          <p className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--text-primary)] transition-colors">
                            {item.clientName}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                            {item.clientPhone}
                          </p>
                        </div>
                      </td>

                      {/* 4. Target Location */}
                      <td className="py-2.5 px-3 align-middle">
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                          <MapPin size={11} className="shrink-0 text-slate-400 group-hover:text-brand transition-colors duration-200" />
                          <span className="truncate max-w-[140px]" title={item.location}>
                            {item.location}
                          </span>
                        </div>
                      </td>

                      {/* 5. Assigned Partner */}
                      <td className="py-2.5 px-3 align-middle whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setPartnerAssignModal(item);
                            setSelectedPartner(item.assignedPartner || partnersCatalog[item.serviceType][0]);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-[var(--text-primary)] bg-[var(--bg-muted)] hover:bg-brand/10 hover:border-brand/30 hover:text-brand border border-[var(--border)] transition-all duration-150 cursor-pointer active:scale-95"
                          title="Click to assign or change partner"
                        >
                          <UserCheck size={11} className="text-brand shrink-0" />
                          <span>{item.assignedPartner || 'Assign'}</span>
                        </button>
                      </td>

                      {/* 6. Quotation / Value */}
                      <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                        <div className="leading-tight">
                          <p className="font-semibold text-[var(--text-primary)]">
                            {item.quotation || 'Under Review'}
                          </p>
                          {item.quotationSubtext && (
                            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                              {item.quotationSubtext}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 7. Status with Pulsing Live Dot */}
                      <td className="py-2.5 px-3 align-middle text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border shadow-2xs ${statusCfg.pill} transition-all duration-200`}>
                          <span className="relative flex h-1.5 w-1.5 shrink-0">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusCfg.dot}`}></span>
                            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${statusCfg.dot}`}></span>
                          </span>
                          <span>{item.status}</span>
                        </span>
                      </td>

                      {/* 8. Actions: Call, WhatsApp, View, Edit, Delete */}
                      <td className="py-2.5 px-3 align-middle text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1">
                          {/* Call Button */}
                          {item.clientPhone && item.clientPhone !== 'N/A' && (
                            <a
                              href={`tel:${item.clientPhone}`}
                              title={`Call ${item.clientName}`}
                              className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-[var(--border)] transition-all duration-150 cursor-pointer active:scale-90 shadow-2xs"
                            >
                              <Phone size={12} />
                            </a>
                          )}

                          {/* WhatsApp Button */}
                          {item.clientPhone && item.clientPhone !== 'N/A' && (
                            <a
                              href={`https://wa.me/${item.clientPhone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Chat on WhatsApp"
                              className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-[var(--border)] transition-all duration-150 cursor-pointer active:scale-90 shadow-2xs"
                            >
                              <MessageCircle size={12} />
                            </a>
                          )}

                          {/* Details Eye Icon Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedEnquiry(item)}
                            title="View Details"
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-brand hover:border-brand/40 hover:bg-brand/10 border border-[var(--border)] transition-all duration-150 cursor-pointer active:scale-90 shadow-2xs"
                          >
                            <Eye size={13} />
                          </button>

                          {/* Edit Icon Button */}
                          <button
                            type="button"
                            onClick={() => setEditingEnquiry({ ...item })}
                            title="Edit Inquiry"
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-brand hover:border-brand/40 hover:bg-brand/10 border border-[var(--border)] transition-all duration-150 cursor-pointer active:scale-90 shadow-2xs"
                          >
                            <Edit2 size={13} />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmItem(item)}
                            title="Delete Inquiry"
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-[var(--border)] transition-all duration-150 cursor-pointer active:scale-90 shadow-2xs"
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

        {/* Clean Footer Bar */}
        <div className="p-2 px-3.5 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-muted)] bg-[var(--bg-surface)]">
          <span>Showing <strong className="text-[var(--text-primary)] font-semibold">{filteredEnquiries.length}</strong> of {enquiries.length} live inquiries</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Real-time connected to Database</span>
          </span>
        </div>

      </div>

      {/* ─── MODAL: EDIT SERVICE INQUIRY ─── */}
      {editingEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl max-w-lg w-full shadow-2xl border border-[var(--border)] p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-semibold text-brand bg-brand/10 px-1.5 py-0.5 rounded border border-brand/20">
                    {editingEnquiry.id}
                  </span>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Edit Service Inquiry</h3>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Update client requirements, partner assignment, or pricing in database</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEnquiry(null)}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Client Name</label>
                  <input
                    type="text"
                    required
                    value={editingEnquiry.clientName}
                    onChange={(e) => setEditingEnquiry({ ...editingEnquiry, clientName: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={editingEnquiry.clientPhone}
                    onChange={(e) => setEditingEnquiry({ ...editingEnquiry, clientPhone: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Service Title</label>
                  <input
                    type="text"
                    required
                    value={editingEnquiry.serviceName}
                    onChange={(e) => setEditingEnquiry({ ...editingEnquiry, serviceName: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Target Location</label>
                  <input
                    type="text"
                    value={editingEnquiry.location}
                    onChange={(e) => setEditingEnquiry({ ...editingEnquiry, location: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Assigned Partner</label>
                  <select
                    value={editingEnquiry.assignedPartner || ''}
                    onChange={(e) => setEditingEnquiry({ ...editingEnquiry, assignedPartner: e.target.value })}
                    className="w-full h-8 px-2 bg-[var(--bg-muted)] text-xs font-medium text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 cursor-pointer transition-all"
                  >
                    <option value="">-- Unassigned --</option>
                    {(partnersCatalog[editingEnquiry.serviceType] || []).map((p, i) => (
                      <option key={i} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Workflow Status</label>
                  <select
                    value={editingEnquiry.status}
                    onChange={(e) => setEditingEnquiry({ ...editingEnquiry, status: e.target.value })}
                    className="w-full h-8 px-2 bg-[var(--bg-muted)] text-xs font-medium text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 cursor-pointer transition-all"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Quotation Sent">Quotation Sent</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Quotation Value</label>
                  <input
                    type="text"
                    value={editingEnquiry.quotation}
                    onChange={(e) => setEditingEnquiry({ ...editingEnquiry, quotation: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Quotation Subtext</label>
                  <input
                    type="text"
                    value={editingEnquiry.quotationSubtext || ''}
                    onChange={(e) => setEditingEnquiry({ ...editingEnquiry, quotationSubtext: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-muted)]">Internal Notes</label>
                <textarea
                  rows={2}
                  value={editingEnquiry.notes || ''}
                  onChange={(e) => setEditingEnquiry({ ...editingEnquiry, notes: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 resize-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setEditingEnquiry(null)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs hover:shadow-brand/20 active:scale-95"
                >
                  Save Changes to DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: NEW REAL SERVICE REQUEST ─── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl max-w-lg w-full shadow-2xl border border-[var(--border)] p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">New Service Request</h3>
                <p className="text-[11px] text-[var(--text-muted)]">Record a customer inquiry across any service line directly into MongoDB</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Client Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Singhania"
                    value={newRequest.clientName}
                    onChange={(e) => setNewRequest({ ...newRequest, clientName: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98..."
                    value={newRequest.clientPhone}
                    onChange={(e) => setNewRequest({ ...newRequest, clientPhone: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Client Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="client@example.com"
                    value={newRequest.clientEmail}
                    onChange={(e) => setNewRequest({ ...newRequest, clientEmail: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Service Category *</label>
                  <select
                    value={newRequest.serviceType}
                    onChange={(e) => setNewRequest({ ...newRequest, serviceType: e.target.value })}
                    className="w-full h-8 px-2 bg-[var(--bg-muted)] text-xs font-medium text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 cursor-pointer transition-all"
                  >
                    <option value="Loan">Home Loan</option>
                    <option value="Interior">Home Interior</option>
                    <option value="Movers">Packers & Movers</option>
                    <option value="Legal">Legal & Title Search</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Link Existing Property (Optional)</label>
                  <select
                    value={newRequest.propertyId}
                    onChange={(e) => {
                      setNewRequest({ ...newRequest, propertyId: e.target.value });
                      const found = availableProperties.find(p => p._id === e.target.value);
                      if (found) {
                        setNewRequest(prev => ({
                          ...prev,
                          propertyId: e.target.value,
                          propertyRef: found.title,
                          location: [found.locality, found.city].filter(Boolean).join(', '),
                          propertyValue: found.price ? `₹${Number(found.price).toLocaleString('en-IN')}` : ''
                        }));
                      }
                    }}
                    className="w-full h-8 px-2 bg-[var(--bg-muted)] text-xs font-medium text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 cursor-pointer transition-all"
                  >
                    <option value="">-- Direct Inquiry / No Linked Property --</option>
                    {availableProperties.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.title} ({p.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Location / Route</label>
                  <input
                    type="text"
                    placeholder="e.g. Sector 43, Noida"
                    value={newRequest.location}
                    onChange={(e) => setNewRequest({ ...newRequest, location: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Quotation Amount (₹)</label>
                  <input
                    type="text"
                    placeholder="e.g. 15,00,000"
                    value={newRequest.quotation}
                    onChange={(e) => setNewRequest({ ...newRequest, quotation: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Initial Partner</label>
                  <select
                    value={newRequest.assignedPartner}
                    onChange={(e) => setNewRequest({ ...newRequest, assignedPartner: e.target.value })}
                    className="w-full h-8 px-2 bg-[var(--bg-muted)] text-xs font-medium text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 cursor-pointer transition-all"
                  >
                    <option value="">-- Select Partner --</option>
                    {(partnersCatalog[newRequest.serviceType] || []).map((p, i) => (
                      <option key={i} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-muted)]">Admin Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional client requirements or instructions..."
                  value={newRequest.notes}
                  onChange={(e) => setNewRequest({ ...newRequest, notes: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 resize-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-3.5 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs hover:shadow-brand/20 active:scale-95 disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isSubmittingNew ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving to DB...</span>
                    </>
                  ) : (
                    <span>Create Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ASSIGN SERVICE PARTNER ─── */}
      {partnerAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl max-w-sm w-full shadow-2xl border border-[var(--border)] p-5 space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <div>
                <h3 className="text-xs font-bold text-[var(--text-primary)]">Assign Service Partner</h3>
                <p className="text-[11px] text-[var(--text-muted)]">{partnerAssignModal.id} • {partnerAssignModal.serviceName}</p>
              </div>
              <button
                type="button"
                onClick={() => setPartnerAssignModal(null)}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-muted)]">Select Verified Partner</label>
                <select
                  value={selectedPartner}
                  onChange={(e) => setSelectedPartner(e.target.value)}
                  className="w-full h-8 px-2 bg-[var(--bg-muted)] text-xs font-medium text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 cursor-pointer transition-all"
                >
                  {(partnersCatalog[partnerAssignModal.serviceType] || []).map((p, i) => (
                    <option key={i} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-muted)]">Quotation Amount (₹)</label>
                <input
                  type="text"
                  placeholder="e.g. 14,50,000"
                  value={newQuotationAmount}
                  onChange={(e) => setNewQuotationAmount(e.target.value)}
                  className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setPartnerAssignModal(null)}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignPartner}
                className="px-3.5 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs hover:shadow-brand/20 active:scale-95"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CONFIRM DELETE INQUIRY ─── */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl max-w-sm w-full shadow-2xl border border-[var(--border)] p-5 space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle size={20} />
              <h3 className="text-sm font-bold">Delete Service Request?</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Are you sure you want to permanently delete service inquiry <strong className="text-[var(--text-primary)]">{deleteConfirmItem.id}</strong> ({deleteConfirmItem.clientName})? This action cannot be undone.
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
                onClick={() => handleDeleteService(deleteConfirmItem._id)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs active:scale-95"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SLIDE-OVER DRAWER: DETAILS & TIMELINE ─── */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex justify-end transition-opacity duration-300">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] h-full max-w-md w-full shadow-2xl border-l border-[var(--border)] flex flex-col justify-between animate-in slide-in-from-right duration-250 ease-out">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-[var(--border)] flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded border border-brand/20">
                    {selectedEnquiry.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border shadow-2xs ${getStatusBadge(selectedEnquiry.status).pill}`}>
                    {selectedEnquiry.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] mt-1.5">
                  {selectedEnquiry.serviceName}
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {selectedEnquiry.clientName} • Registered {selectedEnquiry.date}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmItem(selectedEnquiry)}
                  title="Delete Service Request"
                  className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEnquiry(null)}
                  className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors active:scale-90 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              
              {/* Quick Status Controller */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-muted)]">Workflow Status</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['In Progress', 'Quotation Sent', 'Confirmed', 'Completed'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateStatus(selectedEnquiry._id, st)}
                      className={`h-7 px-1.5 rounded-md text-[11px] font-medium border text-center transition-all duration-150 cursor-pointer active:scale-95 ${
                        selectedEnquiry.status === st
                          ? 'bg-brand text-white border-brand shadow-xs font-semibold'
                          : 'bg-[var(--bg-muted)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]/50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Client Contact Card */}
              <div className="p-3 bg-[var(--bg-muted)]/60 hover:bg-[var(--bg-muted)] rounded-lg border border-[var(--border)] space-y-2 transition-colors">
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Client Details</span>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--text-primary)]">{selectedEnquiry.clientName}</span>
                  {selectedEnquiry.clientPhone && (
                    <a
                      href={`tel:${selectedEnquiry.clientPhone}`}
                      className="inline-flex items-center gap-1 text-[11px] text-brand hover:underline font-mono"
                    >
                      <Phone size={10} /> {selectedEnquiry.clientPhone}
                    </a>
                  )}
                </div>
                {selectedEnquiry.clientEmail && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                    <Mail size={11} className="text-slate-400" />
                    <span>{selectedEnquiry.clientEmail}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <MapPin size={11} className="text-slate-400" />
                  <span>{selectedEnquiry.location}</span>
                </div>
              </div>

              {/* Service Specifications */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Specifications</span>
                <div className="rounded-lg border border-[var(--border)] divide-y divide-[var(--border)] text-xs bg-[var(--bg-surface)]">
                  {selectedEnquiry.propertyRef && (
                    <div className="p-2.5 flex justify-between hover:bg-[var(--bg-muted)]/40 transition-colors">
                      <span className="text-[var(--text-muted)]">Property</span>
                      <span className="font-medium text-[var(--text-primary)]">{selectedEnquiry.propertyRef}</span>
                    </div>
                  )}
                  {selectedEnquiry.loanRequired && (
                    <div className="p-2.5 flex justify-between hover:bg-[var(--bg-muted)]/40 transition-colors">
                      <span className="text-[var(--text-muted)]">Loan Required</span>
                      <span className="font-semibold text-emerald-600">{selectedEnquiry.loanRequired}</span>
                    </div>
                  )}
                  {selectedEnquiry.budgetRange && (
                    <div className="p-2.5 flex justify-between hover:bg-[var(--bg-muted)]/40 transition-colors">
                      <span className="text-[var(--text-muted)]">Budget Range</span>
                      <span className="font-semibold text-purple-600">{selectedEnquiry.budgetRange}</span>
                    </div>
                  )}
                  {selectedEnquiry.shiftingDate && (
                    <div className="p-2.5 flex justify-between hover:bg-[var(--bg-muted)]/40 transition-colors">
                      <span className="text-[var(--text-muted)]">Shifting Date</span>
                      <span className="font-medium text-[var(--text-primary)]">{selectedEnquiry.shiftingDate}</span>
                    </div>
                  )}
                  <div className="p-2.5 flex justify-between items-center hover:bg-[var(--bg-muted)]/40 transition-colors">
                    <span className="text-[var(--text-muted)]">Assigned Partner</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPartnerAssignModal(selectedEnquiry);
                        setSelectedPartner(selectedEnquiry.assignedPartner || (partnersCatalog[selectedEnquiry.serviceType] && partnersCatalog[selectedEnquiry.serviceType][0]));
                      }}
                      className="text-brand font-medium hover:underline text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>{selectedEnquiry.assignedPartner || 'Assign'}</span>
                      <Edit2 size={10} />
                    </button>
                  </div>
                  <div className="p-2.5 flex justify-between hover:bg-[var(--bg-muted)]/40 transition-colors">
                    <span className="text-[var(--text-muted)]">Quotation Value</span>
                    <span className="font-bold text-[var(--text-primary)]">{selectedEnquiry.quotation}</span>
                  </div>
                </div>
              </div>

              {/* Service Execution Stages Timeline (Clickable to advance milestone) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Milestones & Progress</span>
                  <span className="text-[10px] text-slate-400">Click stage to toggle status</span>
                </div>
                <div className="space-y-1.5">
                  {selectedEnquiry.timeline && selectedEnquiry.timeline.map((step, idx) => {
                    const isDone = step.status === 'done';
                    const isActive = step.status === 'active';
                    return (
                      <div
                        key={idx}
                        onClick={() => handleToggleStageStatus(idx)}
                        className="flex items-center justify-between p-2 bg-[var(--bg-muted)]/50 hover:bg-[var(--bg-muted)] rounded-lg border border-[var(--border)] text-xs transition-colors cursor-pointer select-none"
                        title="Click to cycle status: Done -> Pending -> Active"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${
                            isDone ? 'bg-emerald-500 text-white shadow-xs' : isActive ? 'bg-brand text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                          }`}>
                            {isDone ? <Check size={8} strokeWidth={3} /> : <span className="w-1 h-1 rounded-full bg-current"></span>}
                          </div>
                          <span className={`font-medium ${isActive ? 'text-brand font-semibold' : 'text-[var(--text-primary)]'}`}>
                            {step.stage}
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">{step.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes History & Add Note */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Internal Remarks</span>
                {selectedEnquiry.notes && (
                  <div className="p-2.5 bg-[var(--bg-muted)]/60 text-[var(--text-muted)] text-xs rounded-lg border border-[var(--border)] leading-relaxed italic">
                    "{selectedEnquiry.notes}"
                  </div>
                )}

                {/* Add Note Input */}
                <div className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="Log update or remark..."
                    value={drawerNoteText}
                    onChange={(e) => setDrawerNoteText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDrawerNote();
                      }
                    }}
                    className="flex-1 h-8 px-2.5 bg-[var(--bg-muted)] text-xs font-medium text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddDrawerNote}
                    disabled={isSubmittingNote}
                    className="h-8 px-3 bg-brand text-white rounded-md text-xs font-semibold hover:bg-brand-dark transition-all duration-150 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 disabled:opacity-60"
                  >
                    <Send size={12} />
                  </button>
                </div>
              </div>

            </div>

            {/* Drawer Actions */}
            <div className="p-3.5 border-t border-[var(--border)] flex items-center gap-2 bg-[var(--bg-surface)]">
              <button
                type="button"
                onClick={() => {
                  setEditingEnquiry({ ...selectedEnquiry });
                  setSelectedEnquiry(null);
                }}
                className="flex-1 h-8 bg-[var(--bg-muted)] hover:bg-[var(--border)] text-[var(--text-primary)] rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Edit2 size={12} />
                <span>Edit Request</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleUpdateStatus(selectedEnquiry._id, 'Completed');
                  setSelectedEnquiry(null);
                }}
                className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 shadow-xs hover:shadow-emerald-600/20"
              >
                Mark Completed
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ServicesManagement;
