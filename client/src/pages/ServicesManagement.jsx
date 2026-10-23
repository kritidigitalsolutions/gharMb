import React, { useState, useEffect, useMemo } from 'react';
import AdminLoader from '../components/common/AdminLoader';
import CallContactModal from '../components/common/CallContactModal';
import API from '../api/api';
import Badge from '../components/ui/Badge';
import {
  Home, Truck, Scale, CreditCard, Search, Plus,
  MapPin, UserCheck, X, Eye, Layers, Check, Edit2,
  Phone, Mail, ArrowUpRight, Sparkles, Clock, CheckCircle2,
  Trash2, RefreshCw, MessageCircle, AlertTriangle, Send,
  Smartphone, Globe, ArrowUpDown, ChevronLeft, ChevronRight, ArrowRight
} from 'lucide-react';

const ServicesManagement = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Active Category Filter: ALL, Loan, Interior, Movers, Legal
  const [activeService, setActiveService] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Sorting and Pagination State
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals & Drawers
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [editingEnquiry, setEditingEnquiry] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [partnerAssignModal, setPartnerAssignModal] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [newQuotationAmount, setNewQuotationAmount] = useState('');
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [callTarget, setCallTarget] = useState(null);

  // Note submission in drawer
  const [drawerNoteText, setDrawerNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Form state for creating a new service request
  const [newRequest, setNewRequest] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    serviceType: 'Interior',
    serviceName: '',
    location: '',
    propertyId: '',
    propertyRef: '',
    propertyValue: '',
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

  const showToast = (text, type = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const [catalogOfferings, setCatalogOfferings] = useState([]);

  // Dynamically compute partners from active service catalog stored in database
  const partnersCatalog = useMemo(() => {
    const map = {
      Loan: ['HDFC Home Loans', 'SBI Home Finance', 'ICICI Bank Loans', 'Axis Bank Direct', 'GharMB Finance Desk'],
      Interior: [],
      Movers: [],
      Legal: []
    };
    catalogOfferings.forEach(item => {
      const cat = item.category;
      if (cat && Array.isArray(item.partners)) {
        if (!map[cat]) map[cat] = [];
        item.partners.forEach(p => {
          const cleanPartner = typeof p === 'string' ? p.trim() : '';
          if (cleanPartner && !map[cat].includes(cleanPartner)) {
            map[cat].push(cleanPartner);
          }
        });
      }
    });
    return map;
  }, [catalogOfferings]);

  // Fetch real service inquiries from MongoDB
  const fetchServices = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const response = await API.get('/admin/services');
      const resData = response.data;

      if (resData && resData.status === 'success') {
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
          monthlyIncome: item.monthlyIncome || '',
          existingEmis: item.existingEmis || '',
          loanRequired: item.loanRequired || '',
          loanTenure: item.loanTenure || '',
          calculatedEligibility: item.calculatedEligibility || '',
          estimatedEmi: item.estimatedEmi || '',
          employmentType: item.employmentType || '',
          preferredBank: item.preferredBank || '',
          interestRate: item.interestRate || '',
          cibilScore: item.cibilScore || '',
          budgetRange: item.budgetRange || '',
          designStyle: item.designStyle || '',
          scope: item.scope || [],
          moveType: item.moveType || '',
          moveFrom: item.moveFrom || '',
          moveTo: item.moveTo || '',
          bhkType: item.bhkType || item.propertySize || '',
          selectedMover: item.selectedMover || '',
          packageSelected: item.packageSelected || '',
          legalServiceType: item.legalServiceType || item.legalServiceScope || '',
          consultationDate: item.consultationDate || '',
          source: item.source || 'app',
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
      const res = await API.get('/admin/properties', { params: { limit: 100 } });
      const data = res.data;
      if (data && data.status === 'success') {
        setAvailableProperties(data.data?.properties || []);
      }
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    }
  };

  // Fetch live offerings from service catalog for auto-populating
  const fetchCatalogOfferings = async () => {
    try {
      const res = await API.get('/admin/service-catalog');
      const data = res.data;
      if (data && data.status === 'success') {
        setCatalogOfferings(data.data?.offerings || []);
      }
    } catch (err) {
      console.error('Failed to fetch catalog offerings:', err);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchAvailableProperties();
    fetchCatalogOfferings();
  }, []);

  // Update Status in MongoDB
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const response = await API.patch(`/admin/services/${id}`, {
        status: newStatus,
        newNote: `Status updated to ${newStatus}`
      });

      if (response.data && response.data.status === 'success') {
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
      const newStatus = item.status === 'New' ? 'In Progress' : item.status;

      const response = await API.patch(`/admin/services/${item._id}`, {
        assignedPartner: selectedPartner,
        quotation: cleanQuote,
        status: newStatus,
        newNote: `Partner assigned: ${selectedPartner} (Quote: ${cleanQuote})`
      });

      if (response.data && response.data.status === 'success') {
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
      const response = await API.patch(`/admin/services/${selectedEnquiry._id}`, {
        timeline: updatedTimeline
      });

      if (response.data && response.data.status === 'success') {
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
      const response = await API.patch(`/admin/services/${editingEnquiry._id}`, editingEnquiry);

      if (response.data && response.data.status === 'success') {
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
      const trimmed = drawerNoteText.trim();
      const response = await API.patch(`/admin/services/${selectedEnquiry._id}`, {
        newNote: trimmed
      });

      if (response.data && response.data.status === 'success') {
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
      const response = await API.delete(`/admin/services/${id}`);

      if (response.data && response.data.status === 'success') {
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

      const response = await API.post('/admin/services', payload);
      const resData = response.data;

      if (resData && resData.status === 'success') {
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
          serviceType: 'Interior',
          serviceName: '',
          location: '',
          propertyId: '',
          propertyRef: '',
          propertyValue: '',
          budgetRange: '',
          shiftingDate: '',
          assignedPartner: '',
          quotation: '',
          notes: ''
        });
        showToast('New service request created in database');
      } else {
        showToast(resData?.message || 'Failed to create service request', 'error');
      }
    } catch (err) {
      console.error('Error creating service:', err);
      showToast('Network error creating request', 'error');
    } finally {
      setIsSubmittingNew(false);
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

  // Filter and sort inquiries based on service vertical, status, search query, and sort field
  const sortedAndFilteredEnquiries = useMemo(() => {
    const list = enquiries.filter(item => {
      const matchesService = activeService === 'ALL' || item.serviceType === activeService;
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesService && matchesStatus;

      const matchesSearch = 
        (item.clientName && item.clientName.toLowerCase().includes(q)) ||
        (item.id && item.id.toLowerCase().includes(q)) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        (item.serviceName && item.serviceName.toLowerCase().includes(q)) ||
        (item.clientPhone && item.clientPhone.toLowerCase().includes(q)) ||
        (item.assignedPartner && item.assignedPartner.toLowerCase().includes(q));
      return matchesService && matchesStatus && matchesSearch;
    });

    if (!sortField) return list;

    return [...list].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'quotation') {
        const numA = parseFloat(String(valA || '').replace(/[^0-9.]/g, '')) || 0;
        const numB = parseFloat(String(valB || '').replace(/[^0-9.]/g, '')) || 0;
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();
      if (sortDirection === 'asc') {
        return valA.localeCompare(valB);
      }
      return valB.localeCompare(valA);
    });
  }, [enquiries, activeService, statusFilter, searchQuery, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedAndFilteredEnquiries.length / itemsPerPage) || 1;
  const paginatedEnquiries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredEnquiries.slice(start, start + itemsPerPage);
  }, [sortedAndFilteredEnquiries, currentPage, itemsPerPage]);

  const getServiceConfig = (type) => {
    switch (type) {
      case 'Loan':
        return {
          label: 'Home Loan',
          icon: CreditCard,
          pillColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          hoverBorder: 'group-hover:border-emerald-400'
        };
      case 'Interior':
        return {
          label: 'Home Interior',
          icon: Home,
          pillColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
          hoverBorder: 'group-hover:border-purple-400'
        };
      case 'Movers':
        return {
          label: 'Packers & Movers',
          icon: Truck,
          pillColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          hoverBorder: 'group-hover:border-amber-400'
        };
      case 'Legal':
        return {
          label: 'Legal Services',
          icon: Scale,
          pillColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          hoverBorder: 'group-hover:border-emerald-400'
        };
      default:
        return {
          label: 'General',
          icon: Layers,
          pillColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
          hoverBorder: 'group-hover:border-slate-400'
        };
    }
  };

  const renderStatusBadge = (status, size = 'xs') => {
    switch (status) {
      case 'Confirmed':
      case 'Completed':
        return <Badge.Approved size={size}>{status}</Badge.Approved>;
      case 'Quotation Sent':
        return <Badge color="purple" variant="pastel" size={size}>{status}</Badge>;
      case 'In Progress':
        return <Badge color="sky" variant="pastel" size={size}>{status}</Badge>;
      case 'Cancelled':
        return <Badge.Rejected size={size}>{status}</Badge.Rejected>;
      case 'Pending':
      default:
        return <Badge.Pending size={size}>{status || 'Pending'}</Badge.Pending>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
      case 'Completed':
        return {
          pill: 'bg-[#52c99b] text-[#064e3b] dark:bg-[#1a4a38] dark:text-[#6ee7b7] border-transparent',
          dot: 'bg-[#064e3b]'
        };
      case 'Quotation Sent':
        return {
          pill: 'bg-[#c4b5fd] text-[#4c1d95] dark:bg-[#3b1968] dark:text-[#ddd6fe] border-transparent',
          dot: 'bg-[#4c1d95]'
        };
      case 'In Progress':
        return {
          pill: 'bg-[#bae6fd] text-[#075985] dark:bg-[#113c54] dark:text-[#7dd3fc] border-transparent',
          dot: 'bg-[#075985]'
        };
      case 'Cancelled':
        return {
          pill: 'bg-[#fca5a5] text-[#701a2b] dark:bg-[#521722] dark:text-[#fda4af] border-transparent',
          dot: 'bg-[#701a2b]'
        };
      default:
        return {
          pill: 'bg-[#fef08a] text-[#78350f] dark:bg-[#4d3209] dark:text-[#fef08a] border-transparent',
          dot: 'bg-[#78350f]'
        };
    }
  };

  const getDisplayServiceName = (item) => {
    if (!item) return { title: 'Service', categoryLabel: '' };
    const raw = item.serviceName || '';
    // Strip redundant service prefixes if present (e.g., "Legal - ", "Interior Design - ")
    const cleanTitle = raw.replace(/^(Legal|Interior(\s+Design)?|Packers\s*&\s*Movers)\s*[-:–—]\s*/i, '').trim();

    const categoryLabel = 
      item.serviceType === 'Loan' ? 'Home Loan Assistance' :
      item.serviceType === 'Interior' ? 'Home Interior' :
      item.serviceType === 'Movers' ? 'Packers & Movers' :
      item.serviceType === 'Legal' ? 'Legal & Title' : 'General Service';

    return {
      title: cleanTitle || raw || 'Service Request',
      categoryLabel
    };
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
      
      {/* ─── 4 POLISHED KPI CARDS (TOP-ACCENT MINIMAL STYLE) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            key: 'Loan',
            title: 'Home Loans',
            subtitle: 'Eligibility & Finance',
            icon: CreditCard,
            count: enquiries.filter(e => e.serviceType === 'Loan').length,
            unit: 'Inquiries',
            accent: 'border-t-brand/40 hover:border-t-brand',
            iconColor: 'text-brand bg-brand/10'
          },
          {
            key: 'Interior',
            title: 'Home Interior',
            subtitle: 'Design & Modular Fitouts',
            icon: Home,
            count: enquiries.filter(e => e.serviceType === 'Interior').length,
            unit: 'Projects',
            accent: 'border-t-brand/40 hover:border-t-brand',
            iconColor: 'text-brand bg-brand/10'
          },
          {
            key: 'Movers',
            title: 'Packers & Movers',
            subtitle: 'Local & Relocation',
            icon: Truck,
            count: enquiries.filter(e => e.serviceType === 'Movers').length,
            unit: 'Moves',
            accent: 'border-t-brand/40 hover:border-t-brand',
            iconColor: 'text-brand bg-brand/10'
          },
          {
            key: 'Legal',
            title: 'Legal Services',
            subtitle: 'Title Search & Registry',
            icon: Scale,
            count: enquiries.filter(e => e.serviceType === 'Legal').length,
            unit: 'Cases',
            accent: 'border-t-brand/40 hover:border-t-brand',
            iconColor: 'text-brand bg-brand/10'
          }
        ].map((card) => {
          const Icon = card.icon;
          const isSelected = activeService === card.key;
          return (
            <div
              key={card.key}
              onClick={() => {
                setActiveService(isSelected ? 'ALL' : card.key);
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
              { id: 'ALL', label: 'All Services', count: enquiries.length },
              { id: 'Loan', label: 'Home Loans', count: enquiries.filter(e => e.serviceType === 'Loan').length },
              { id: 'Interior', label: 'Interior', count: enquiries.filter(e => e.serviceType === 'Interior').length },
              { id: 'Movers', label: 'Movers', count: enquiries.filter(e => e.serviceType === 'Movers').length },
              { id: 'Legal', label: 'Legal', count: enquiries.filter(e => e.serviceType === 'Legal').length }
            ].map((tab) => {
              const active = activeService === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveService(tab.id);
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

          {/* Right Controls: Search + Status Filter + Refresh + Add Button */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Search Input */}
            <div className="relative w-44 sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" size={13} />
              <input
                type="text"
                placeholder="Search client, ID, partner..."
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
              className="h-8 px-3 rounded-lg text-xs font-semibold bg-brand text-white hover:bg-brand-dark transition-all duration-150 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs hover:shadow-brand/20 active:scale-95"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">New Request</span>
            </button>
          </div>

        </div>

        {/* ─── DATA TABLE: 100% WIDTH, ZERO HORIZONTAL SCROLL ─── */}
        <div className="w-full overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed">
            <colgroup>
              <col className="w-[26%]" />
              <col className="w-[26%]" />
              <col className="w-[16%]" />
              <col className="w-[14%]" />
              <col className="w-[10%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[11px] font-semibold uppercase tracking-wider bg-[var(--bg-muted)]/50">
                {renderSortHeader('Service Request', 'serviceName')}
                {renderSortHeader('Client & Route', 'clientName')}
                {renderSortHeader('Assigned Partner', 'assignedPartner')}
                {renderSortHeader('Quotation', 'quotation')}
                <th 
                  className="py-2 px-3 align-middle text-center whitespace-nowrap cursor-pointer select-none group/th hover:text-[var(--text-primary)] transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="inline-flex items-center justify-center gap-1.5">
                    <span>Status</span>
                    <ArrowUpDown size={11} className={`transition-colors ${sortField === 'status' ? 'text-brand' : 'text-slate-400/50 opacity-0 group-hover/th:opacity-100'}`} />
                  </div>
                </th>
                <th className="py-2 px-3 align-middle text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <AdminLoader
                      text="Loading service requests..."
                      subtext="Fetching customer service requirements from database"
                      minHeight="min-h-[180px]"
                    />
                  </td>
                </tr>
              ) : paginatedEnquiries.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col items-center justify-center space-y-1.5 animate-in fade-in duration-200">
                      <div className="w-9 h-9 rounded-full bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)]">
                        <Search size={16} />
                      </div>
                      <p className="font-semibold text-xs text-[var(--text-primary)]">No matching service inquiries</p>
                      <p className="text-[11px] text-[var(--text-muted)] max-w-xs mx-auto">
                        Try adjusting your search criteria or resetting active filters.
                      </p>
                      {(searchQuery || statusFilter !== 'All' || activeService !== 'ALL') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('All');
                            setActiveService('ALL');
                            setCurrentPage(1);
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
                paginatedEnquiries.map((item) => {
                  const statusCfg = getStatusBadge(item.status);
                  const displayService = getDisplayServiceName(item);
                  const isMove = item.location && (item.location.includes('->') || item.location.includes('→'));

                  return (
                    <tr
                      key={item._id}
                      onClick={() => setSelectedEnquiry(item)}
                      className="group hover:bg-[var(--bg-muted)]/40 transition-colors duration-150 cursor-pointer"
                    >
                      {/* 1. Service Request (ID Pill + Title + Category) */}
                      <td className="py-1.5 px-3 align-middle min-w-0">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-nowrap">
                            <span className="font-mono text-[10px] font-semibold text-brand bg-brand/10 px-1 py-0.5 rounded border border-brand/20 select-all shrink-0">
                              {item.id}
                            </span>
                            <span className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-brand transition-colors truncate" title={item.serviceName}>
                              {displayService.title}
                            </span>
                          </div>
                          <p className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5 truncate">
                            {displayService.categoryLabel}
                          </p>
                        </div>
                      </td>

                      {/* 2. Client Details & Route */}
                      <td className="py-1.5 px-3 align-middle min-w-0">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-brand transition-colors truncate capitalize">
                              {item.clientName}
                            </span>
                            {item.clientPhone && item.clientPhone !== 'N/A' && (
                              <div className="inline-flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => setCallTarget(item)}
                                  title={`Call ${item.clientName}`}
                                  className="w-4 h-4 rounded text-[var(--text-muted)] hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Phone size={10} />
                                </button>
                                <a
                                  href={`https://wa.me/${item.clientPhone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Chat on WhatsApp"
                                  className="w-4 h-4 rounded text-[var(--text-muted)] hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <MessageCircle size={10} />
                                </a>
                              </div>
                            )}
                          </div>
                          {/* Route / Location line */}
                          {isMove ? (
                            <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] mt-0.5 truncate" title={item.location}>
                              <span className="truncate">{item.location.split(/->|→/)[0]?.trim()}</span>
                              <ArrowRight size={10} className="text-brand shrink-0" />
                              <span className="truncate">{item.location.split(/->|→/)[1]?.trim() || ''}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
                              <MapPin size={10} className="shrink-0 text-slate-400" />
                              <span className="truncate">{item.location || 'India'}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 3. Assigned Partner */}
                      <td className="py-1.5 px-3 align-middle whitespace-nowrap min-w-0" onClick={(e) => e.stopPropagation()}>
                        {item.assignedPartner ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPartnerAssignModal(item);
                              setSelectedPartner(item.assignedPartner || (partnersCatalog[item.serviceType] && partnersCatalog[item.serviceType][0]));
                              setNewQuotationAmount(item.quotation || '');
                            }}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium text-[var(--text-primary)] bg-[var(--bg-muted)] hover:bg-[var(--bg-surface)] hover:border-brand/40 hover:text-brand border border-[var(--border)] transition-all duration-150 cursor-pointer active:scale-95 max-w-full truncate"
                            title="Click to change partner"
                          >
                            <UserCheck size={11} className="text-brand shrink-0" />
                            <span className="truncate">{item.assignedPartner}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setPartnerAssignModal(item);
                              setSelectedPartner((partnersCatalog[item.serviceType] && partnersCatalog[item.serviceType][0]) || '');
                              setNewQuotationAmount(item.quotation || '');
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-[var(--text-muted)] hover:text-brand hover:border-brand/40 hover:bg-brand/5 border border-dashed border-[var(--border)] transition-all duration-150 cursor-pointer active:scale-95"
                            title="Click to assign partner"
                          >
                            <Plus size={11} className="text-brand shrink-0" />
                            <span>Assign</span>
                          </button>
                        )}
                      </td>

                      {/* 4. Quotation / Value */}
                      <td className="py-1.5 px-3 align-middle whitespace-nowrap min-w-0">
                        <div className="leading-tight">
                          <p className={`font-semibold text-xs ${item.quotation && !item.quotation.toLowerCase().includes('under review') ? 'text-[var(--text-primary)] font-mono' : 'text-[var(--text-muted)] italic font-normal'}`}>
                            {item.quotation || 'Under Review'}
                          </p>
                          {item.quotationSubtext && (
                            <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate" title={item.quotationSubtext}>
                              {item.quotationSubtext}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 5. Status */}
                      <td className="py-1.5 px-3 align-middle text-center whitespace-nowrap">
                        {renderStatusBadge(item.status, 'xs')}
                      </td>

                      {/* 6. Actions: View, Edit, Delete */}
                      <td className="py-1.5 px-3 align-middle text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1 justify-end shrink-0">
                          <button
                            type="button"
                            onClick={() => setSelectedEnquiry(item)}
                            title="View Details"
                            className="w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-brand hover:border-brand/40 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          >
                            <Eye size={12} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingEnquiry({ ...item })}
                            title="Edit Inquiry"
                            className="w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-brand hover:border-brand/40 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          >
                            <Edit2 size={12} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmItem(item)}
                            title="Delete Inquiry"
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
              Showing <strong className="text-[var(--text-primary)] font-semibold">{sortedAndFilteredEnquiries.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</strong>
              {' '}-{' '}
              <strong className="text-[var(--text-primary)] font-semibold">{Math.min(currentPage * itemsPerPage, sortedAndFilteredEnquiries.length)}</strong> of <strong className="text-[var(--text-primary)] font-semibold">{sortedAndFilteredEnquiries.length}</strong> inquiries
            </span>
            <span className="hidden sm:inline text-[var(--border)]">|</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Database Connected</span>
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

      {/* ─── MODAL: NEW SERVICE REQUEST (CLEAN, SIMPLE & CATALOG LINKED) ─── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl max-w-md w-full shadow-2xl border border-[var(--border)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-4 px-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-muted)]/30">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">Record Service Request</h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Create a customer inquiry across Interior, Movers, or Legal</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
              
              {/* 1. Category Selection: 3 Instant Tap Cards */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                  Service Vertical *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'Loan', label: 'Home Loan', desc: 'Eligibility & Quote', icon: CreditCard },
                    { id: 'Interior', label: 'Interior', desc: 'Decor & Fitouts', icon: Home },
                    { id: 'Movers', label: 'Movers', desc: 'Relocation', icon: Truck },
                    { id: 'Legal', label: 'Legal', desc: 'Deeds & Title', icon: Scale }
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = newRequest.serviceType === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setNewRequest(prev => ({
                            ...prev,
                            serviceType: cat.id,
                            serviceName: '',
                            assignedPartner: (partnersCatalog[cat.id] && partnersCatalog[cat.id][0]) || ''
                          }));
                        }}
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

              {/* 2. Select Catalog Offering / Package (Auto-populates price & partner) */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-primary)] flex items-center justify-between">
                  <span>Package / Offering</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-normal">Select from catalog or type custom</span>
                </label>
                <div className="space-y-1.5">
                  <select
                    value=""
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (!selectedId) return;
                      const found = catalogOfferings.find(o => o._id === selectedId);
                      if (found) {
                        setNewRequest(prev => ({
                          ...prev,
                          serviceName: found.title,
                          quotation: found.priceDisplay || (found.price ? `₹${Number(found.price).toLocaleString('en-IN')}` : 'Under Review'),
                          assignedPartner: (found.partners && found.partners[0]) || prev.assignedPartner
                        }));
                      }
                    }}
                    className="w-full h-8.5 px-2 bg-[var(--bg-muted)] text-xs font-medium text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 cursor-pointer transition-all"
                  >
                    <option value="">-- Choose from Catalog (Auto-fill) --</option>
                    {catalogOfferings
                      .filter(o => o.category === newRequest.serviceType)
                      .map(o => (
                        <option key={o._id} value={o._id}>
                          {o.title} ({o.priceDisplay || 'Quote'})
                        </option>
                      ))}
                  </select>

                  <input
                    type="text"
                    required
                    placeholder="Or enter custom service title..."
                    value={newRequest.serviceName}
                    onChange={(e) => setNewRequest({ ...newRequest, serviceName: e.target.value })}
                    className="w-full h-8.5 px-3 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>

              {/* 3. Client Name & Phone */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-primary)]">Client Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Singhania"
                    value={newRequest.clientName}
                    onChange={(e) => setNewRequest({ ...newRequest, clientName: e.target.value })}
                    className="w-full h-8.5 px-3 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-primary)]">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98..."
                    value={newRequest.clientPhone}
                    onChange={(e) => setNewRequest({ ...newRequest, clientPhone: e.target.value })}
                    className="w-full h-8.5 px-3 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all font-mono"
                  />
                </div>
              </div>

              {/* 4. Location / Route */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-muted)]">Location / Route</label>
                <input
                  type="text"
                  placeholder={newRequest.serviceType === 'Movers' ? 'e.g. Sector 62, Noida → Indirapuram' : 'e.g. Sector 43, Noida'}
                  value={newRequest.location}
                  onChange={(e) => setNewRequest({ ...newRequest, location: e.target.value })}
                  className="w-full h-8.5 px-3 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all placeholder:text-[var(--text-muted)]"
                />
              </div>

              {/* 5. Partner & Quotation in clean card */}
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-[var(--bg-muted)]/40 border border-[var(--border)]">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Assign Partner</label>
                  <select
                    value={newRequest.assignedPartner}
                    onChange={(e) => setNewRequest({ ...newRequest, assignedPartner: e.target.value })}
                    className="w-full h-8 px-2 bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 cursor-pointer transition-all"
                  >
                    <option value="">-- Select Partner --</option>
                    {(partnersCatalog[newRequest.serviceType] || []).map((p, i) => (
                      <option key={i} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Quotation Value</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹8,500 est."
                    value={newRequest.quotation}
                    onChange={(e) => setNewRequest({ ...newRequest, quotation: e.target.value })}
                    className="w-full h-8 px-2.5 bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                  />
                </div>
              </div>

              {/* 6. Admin Notes (Optional) */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-muted)]">Notes / Instructions (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Special instructions or customer preferences..."
                  value={newRequest.notes}
                  onChange={(e) => setNewRequest({ ...newRequest, notes: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 resize-none transition-all placeholder:text-[var(--text-muted)]"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs hover:shadow-brand/20 active:scale-95 disabled:opacity-60 flex items-center gap-1.5"
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
                  {renderStatusBadge(selectedEnquiry.status, 'xs')}
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-[var(--text-muted)] border border-[var(--border)]">
                    {selectedEnquiry.source === 'app' ? (
                      <><Smartphone size={10} className="text-brand" /> App</>
                    ) : (
                      <><Globe size={10} className="text-blue-500" /> Web</>
                    )}
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
                    <button
                      type="button"
                      onClick={() => setCallTarget(selectedEnquiry)}
                      className="inline-flex items-center gap-1 text-[11px] text-brand hover:underline font-mono cursor-pointer"
                    >
                      <Phone size={10} /> {selectedEnquiry.clientPhone}
                    </button>
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
                  {selectedEnquiry.moveFrom && (
                    <div className="p-2.5 flex justify-between hover:bg-[var(--bg-muted)]/40 transition-colors">
                      <span className="text-[var(--text-muted)]">Pickup Location</span>
                      <span className="font-medium text-[var(--text-primary)] text-right">{selectedEnquiry.moveFrom}</span>
                    </div>
                  )}
                  {selectedEnquiry.moveTo && (
                    <div className="p-2.5 flex justify-between hover:bg-[var(--bg-muted)]/40 transition-colors">
                      <span className="text-[var(--text-muted)]">Destination</span>
                      <span className="font-medium text-[var(--text-primary)] text-right">{selectedEnquiry.moveTo}</span>
                    </div>
                  )}
                  {selectedEnquiry.bhkType && (
                    <div className="p-2.5 flex justify-between hover:bg-[var(--bg-muted)]/40 transition-colors">
                      <span className="text-[var(--text-muted)]">Move / BHK Size</span>
                      <span className="font-semibold text-brand">{selectedEnquiry.bhkType}</span>
                    </div>
                  )}
                  {selectedEnquiry.selectedMover && (
                    <div className="p-2.5 flex justify-between hover:bg-[var(--bg-muted)]/40 transition-colors">
                      <span className="text-[var(--text-muted)]">Preferred Mover</span>
                      <span className="font-medium text-emerald-600">{selectedEnquiry.selectedMover}</span>
                    </div>
                  )}
                  {selectedEnquiry.legalServiceType && (
                    <div className="p-2.5 flex justify-between hover:bg-[var(--bg-muted)]/40 transition-colors">
                      <span className="text-[var(--text-muted)]">Legal Service</span>
                      <span className="font-medium text-[var(--text-primary)] text-right">{selectedEnquiry.legalServiceType}</span>
                    </div>
                  )}
                  {selectedEnquiry.designStyle && (
                    <div className="p-2.5 flex justify-between hover:bg-[var(--bg-muted)]/40 transition-colors">
                      <span className="text-[var(--text-muted)]">Interior Style</span>
                      <span className="font-medium text-[var(--text-primary)]">{selectedEnquiry.designStyle}</span>
                    </div>
                  )}
                  {selectedEnquiry.packageSelected && (
                    <div className="p-2.5 flex justify-between hover:bg-[var(--bg-muted)]/40 transition-colors">
                      <span className="text-[var(--text-muted)]">Design Package</span>
                      <span className="font-semibold text-amber-600">{selectedEnquiry.packageSelected}</span>
                    </div>
                  )}
                  {selectedEnquiry.consultationDate && (
                    <div className="p-2.5 flex justify-between hover:bg-[var(--bg-muted)]/40 transition-colors">
                      <span className="text-[var(--text-muted)]">Consultation Date</span>
                      <span className="font-medium text-[var(--text-primary)]">{selectedEnquiry.consultationDate}</span>
                    </div>
                  )}
                  {selectedEnquiry.monthlyIncome && (
                    <div className="p-2.5 flex justify-between hover:bg-[var(--bg-muted)]/40 transition-colors">
                      <span className="text-[var(--text-muted)]">Monthly Net Income</span>
                      <span className="font-semibold text-emerald-600">{selectedEnquiry.monthlyIncome}</span>
                    </div>
                  )}
                  {selectedEnquiry.propertyValue && (
                    <div className="p-2.5 flex justify-between hover:bg-[var(--bg-muted)]/40 transition-colors">
                      <span className="text-[var(--text-muted)]">Estimated Property Value</span>
                      <span className="font-semibold text-[var(--text-primary)]">{selectedEnquiry.propertyValue}</span>
                    </div>
                  )}
                  {selectedEnquiry.existingEmis && (
                    <div className="p-2.5 flex justify-between hover:bg-[var(--bg-muted)]/40 transition-colors">
                      <span className="text-[var(--text-muted)]">Existing Monthly EMIs</span>
                      <span className="font-medium text-amber-600">{selectedEnquiry.existingEmis}</span>
                    </div>
                  )}
                  {selectedEnquiry.calculatedEligibility && (
                    <div className="p-2.5 flex justify-between bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">Max Eligible Loan</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">{selectedEnquiry.calculatedEligibility}</span>
                    </div>
                  )}
                  {selectedEnquiry.estimatedEmi && (
                    <div className="p-2.5 flex justify-between hover:bg-[var(--bg-muted)]/40 transition-colors">
                      <span className="text-[var(--text-muted)]">Estimated Monthly EMI</span>
                      <span className="font-semibold text-sky-600">{selectedEnquiry.estimatedEmi}</span>
                    </div>
                  )}
                  {selectedEnquiry.loanRequired && (
                    <div className="p-2.5 flex justify-between hover:bg-[var(--bg-muted)]/40 transition-colors">
                      <span className="text-[var(--text-muted)]">Requested Loan Amount</span>
                      <span className="font-semibold text-blue-600">{selectedEnquiry.loanRequired}</span>
                    </div>
                  )}
                  {selectedEnquiry.employmentType && (
                    <div className="p-2.5 flex justify-between hover:bg-[var(--bg-muted)]/40 transition-colors">
                      <span className="text-[var(--text-muted)]">Employment Type</span>
                      <span className="font-medium text-[var(--text-primary)]">{selectedEnquiry.employmentType}</span>
                    </div>
                  )}
                  {selectedEnquiry.preferredBank && (
                    <div className="p-2.5 flex justify-between hover:bg-[var(--bg-muted)]/40 transition-colors">
                      <span className="text-[var(--text-muted)]">Preferred Bank</span>
                      <span className="font-medium text-indigo-600">{selectedEnquiry.preferredBank}</span>
                    </div>
                  )}
                  {selectedEnquiry.loanTenure && (
                    <div className="p-2.5 flex justify-between hover:bg-[var(--bg-muted)]/40 transition-colors">
                      <span className="text-[var(--text-muted)]">Loan Tenure</span>
                      <span className="font-medium text-[var(--text-primary)]">{selectedEnquiry.loanTenure}</span>
                    </div>
                  )}
                  {selectedEnquiry.propertyRef && (
                    <div className="p-2.5 flex justify-between hover:bg-[var(--bg-muted)]/40 transition-colors">
                      <span className="text-[var(--text-muted)]">Property</span>
                      <span className="font-medium text-[var(--text-primary)]">{selectedEnquiry.propertyRef}</span>
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

      {/* ─── MODAL: CALL & CONTACT CLIENT (CUSTOM UI) ─── */}
      {callTarget && (
        <CallContactModal
          isOpen={Boolean(callTarget)}
          onClose={() => setCallTarget(null)}
          contact={callTarget}
          onUpdateStatus={(newStatus) => handleUpdateStatus(callTarget._id, newStatus)}
          onAddNote={async (text) => {
            const res = await API.patch(`/admin/services/${callTarget._id}`, { notes: text });
            if (res.data?.status === 'success') {
              showFeedback('Call note saved');
              fetchServices(true);
            }
          }}
        />
      )}
    </div>
  );
};

export default ServicesManagement;
