import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AdminLoader from '../components/common/AdminLoader';
import CallContactModal from '../components/common/CallContactModal';
import API from '../api/api';
import Badge from '../components/ui/Badge';
import {
  Inbox,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Mail,
  Phone,
  User,
  MessageSquare,
  Building2,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  X,
  Copy,
  Check,
  Download,
  Trash2,
  Plus,
  Send,
  PhoneCall,
  CalendarDays,
  Home,
  ChevronDown,
  Eye,
  MessageCircle,
  Filter,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Normalize any database status string to standard category keys
const normalizeStatus = (status) => {
  const s = String(status || '').toLowerCase().replace(/[\s_-]+/g, '');
  if (['pending', 'new', 'unassigned', 'open'].includes(s)) return 'pending';
  if (['contacted', 'inprogress', 'assigned', 'active'].includes(s)) return 'contacted';
  if (['confirmed', 'scheduled', 'accepted', 'quotationsent', 'quote', 'booked'].includes(s)) return 'confirmed';
  if (['resolved', 'closed', 'completed', 'converted', 'done'].includes(s)) return 'resolved';
  if (['cancelled', 'rejected', 'spam'].includes(s)) return 'cancelled';
  return s || 'pending';
};

// Status Badge Metadata (Mapped to BADGES_UI_DESIGN_SYSTEM.md Tokens)
const getStatusBadge = (status) => {
  const norm = normalizeStatus(status);
  switch (norm) {
    case 'pending':
      return {
        label: 'Pending',
        dot: 'bg-[#78350f] dark:bg-[#fef08a]',
        pill: 'bg-[#fef08a] text-[#78350f] dark:bg-[#4d3209] dark:text-[#fef08a] border-transparent',
        badgeColor: 'amber',
      };
    case 'contacted':
      return {
        label: 'In Follow-Up',
        dot: 'bg-[#075985] dark:bg-[#38bdf8]',
        pill: 'bg-[#bae6fd] text-[#075985] dark:bg-[#113c54] dark:text-[#7dd3fc] border-transparent',
        badgeColor: 'sky',
      };
    case 'confirmed':
      return {
        label: 'Confirmed',
        dot: 'bg-[#4c1d95] dark:bg-[#c4b5fd]',
        pill: 'bg-[#c4b5fd] text-[#4c1d95] dark:bg-[#3b1968] dark:text-[#ddd6fe] border-transparent',
        badgeColor: 'purple',
      };
    case 'resolved':
      return {
        label: 'Completed',
        dot: 'bg-[#064e3b] dark:bg-[#6ee7b7]',
        pill: 'bg-[#52c99b] text-[#064e3b] dark:bg-[#1a4a38] dark:text-[#6ee7b7] border-transparent',
        badgeColor: 'emerald',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        dot: 'bg-[#701a2b] dark:bg-[#fda4af]',
        pill: 'bg-[#fca5a5] text-[#701a2b] dark:bg-[#521722] dark:text-[#fda4af] border-transparent',
        badgeColor: 'red',
      };
    default:
      return {
        label: status ? String(status).charAt(0).toUpperCase() + String(status).slice(1) : 'Pending',
        dot: 'bg-[#334155] dark:bg-[#94a3b8]',
        pill: 'bg-[#e2e8f0] text-[#334155] dark:bg-[#273244] dark:text-[#cbd5e1] border-transparent',
        badgeColor: 'slate',
      };
  }
};

export default function EnquiriesManagement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Loading & Data States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Raw Data from APIs
  const [propertyEnquiries, setPropertyEnquiries] = useState([]);
  const [developerEnquiries, setDeveloperEnquiries] = useState([]);
  const [visitRequests, setVisitRequests] = useState([]);
  const [webInquiries, setWebInquiries] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);

  // Active Category Tab: 'all' | 'property' | 'service' | 'developer' | 'visit' | 'web'
  const [activeCategory, setActiveCategory] = useState('all');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  // Handle direct navigation & search params from notifications
  useEffect(() => {
    const tab = searchParams.get('tab') || searchParams.get('category');
    const q = searchParams.get('search') || searchParams.get('q');
    if (tab) {
      setActiveCategory(tab);
    }
    if (q) {
      setSearchQuery(q);
      setStatusFilter('all');
    }
  }, [searchParams]);

  // Selection & Details Drawer
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  // Manual Add Enquiry Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    propertyName: '',
    location: '',
    channel: 'Portal Form',
    budget: '',
    message: '',
    notes: '',
  });

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Call / Contact Modal Target
  const [callTarget, setCallTarget] = useState(null);

  // Feedback Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [copiedKey, setCopiedKey] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleCopy = (text, fieldKey) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(fieldKey);
    showToast(`Copied ${fieldKey}`);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Fetch all enquiry streams from database
  const fetchEnquiries = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const [dashRes, webRes, serviceRes] = await Promise.all([
        API.get('/admin/dashboard/enquiries').catch(() => null),
        API.get('/admin/web-inquiries', { params: { limit: 100 } }).catch(() => null),
        API.get('/admin/services').catch(() => null)
      ]);

      const dashData = dashRes?.data;
      const webData = webRes?.data;
      const serviceData = serviceRes?.data;

      if (dashData && dashData.status === 'success' && dashData.data) {
        setPropertyEnquiries(dashData.data.propertyEnquiries || []);
        setDeveloperEnquiries(dashData.data.developerEnquiries || []);
        setVisitRequests(dashData.data.visitRequests || []);
      }

      if (webData && webData.status === 'success' && webData.data) {
        setWebInquiries(webData.data.inquiries || []);
      }

      if (serviceData && serviceData.status === 'success' && serviceData.data) {
        setServiceRequests(serviceData.data.services || []);
      }
    } catch (err) {
      console.error('Error fetching enquiries:', err);
      setError('Unable to load inquiries.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // Normalize all streams into unified structure
  const unifiedEnquiries = useMemo(() => {
    const list = [];

    // 1. Property Enquiries
    (propertyEnquiries || []).forEach((item) => {
      const clientName = item.client?.name || item.clientDetails?.name || 'Customer';
      const clientPhone = item.client?.phone || item.clientDetails?.phone || '';
      const clientEmail = item.client?.email || item.clientDetails?.email || '';
      const propTitle = item.property?.title || item.propertyName || 'Property Direct Lead';
      const locality = [item.property?.locality, item.property?.city].filter(Boolean).join(', ') || item.location || '';
      const budget = item.property?.price ? `₹${Number(item.property.price).toLocaleString('en-IN')}` : item.budget || '';

      list.push({
        id: item._id,
        code: `PRP-${String(item._id).slice(-4).toUpperCase()}`,
        stream: 'property',
        categoryLabel: 'Property Lead',
        categoryColor: 'sky',
        title: propTitle,
        subtitle: locality,
        budget: budget,
        clientName,
        clientPhone,
        clientEmail,
        isRegisteredUser: Boolean(item.client?._id),
        message: item.message || 'Customer requested details for this property.',
        channel: item.channel || 'Portal Form',
        status: (item.status || 'pending').toLowerCase(),
        createdAt: item.createdAt,
        assignedTo: item.assignedTo || 'Executive Desk',
        notes: item.notes || (item.agentNotes ? [{ text: item.agentNotes, author: 'Admin', createdAt: item.updatedAt }] : []),
        raw: item,
        propertyObj: item.property,
      });
    });

    // 2. Developer Enquiries
    (developerEnquiries || []).forEach((item) => {
      const clientName = item.clientDetails?.name || item.client?.name || item.clientName || 'Prospective Buyer';
      const clientPhone = item.clientDetails?.phone || item.client?.phone || item.clientPhone || '';
      const clientEmail = item.clientDetails?.email || item.client?.email || item.clientEmail || '';
      const projectName = item.projectName || item.project?.projectName || '';
      const devName = item.developerName || item.developer?.companyName || item.developer?.name || 'Project Developer';
      const title = projectName ? projectName : devName;
      const subtitle = projectName ? `By ${devName}` : (item.projectInterest || 'Developer / Project Enquiry');

      list.push({
        id: item._id,
        code: `DEV-${String(item._id).slice(-4).toUpperCase()}`,
        stream: 'developer',
        categoryLabel: 'Builder Lead',
        categoryColor: 'purple',
        title,
        subtitle,
        budget: item.budget || '',
        clientName,
        clientPhone,
        clientEmail,
        isRegisteredUser: Boolean(item.client?._id),
        message: item.message || 'Direct lead submitted for builder/project.',
        channel: item.channel || 'Developer Portal',
        status: (item.status || 'pending').toLowerCase(),
        createdAt: item.createdAt,
        assignedTo: item.assignedTo || 'Developer Liaison',
        notes: item.notes || (item.developerNotes ? [{ text: item.developerNotes, author: 'Admin', createdAt: item.updatedAt }] : []),
        raw: item,
      });
    });

    // 3. Site Visit Requests
    (visitRequests || []).forEach((item) => {
      const clientName = item.user?.name || item.userDetails?.name || 'Site Visitor';
      const clientPhone = item.user?.phone || item.userDetails?.phone || '';
      const clientEmail = item.user?.email || item.userDetails?.email || '';
      const propTitle = item.property?.title || 'Scheduled Site Visit';
      const visitDateFormatted = item.visitDate
        ? new Date(item.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        : 'Pending Slot';
      const slotText = item.timeSlot ? ` (${item.timeSlot})` : '';

      list.push({
        id: item._id,
        code: `VST-${String(item._id).slice(-4).toUpperCase()}`,
        stream: 'visit',
        categoryLabel: 'Site Visit',
        categoryColor: 'emerald',
        title: propTitle,
        subtitle: `${visitDateFormatted}${slotText}`,
        budget: item.property?.price ? `₹${Number(item.property.price).toLocaleString('en-IN')}` : '',
        clientName,
        clientPhone,
        clientEmail,
        isRegisteredUser: Boolean(item.user?._id),
        message: item.adminNote || item.reason || `Site visit requested for ${visitDateFormatted}${slotText}`,
        channel: 'Visit Scheduler',
        status: (item.status || 'pending').toLowerCase(),
        createdAt: item.createdAt,
        assignedTo: item.assignedTo || 'Field Executive',
        notes: item.followUpNotes || (item.adminNotes ? [{ text: item.adminNotes, author: 'Admin', createdAt: item.updatedAt }] : []),
        raw: item,
        propertyObj: item.property,
      });
    });

    // 4. Web Contact Inquiries
    (webInquiries || []).forEach((item) => {
      const clientName = item.name || 'Web Visitor';
      const clientPhone = item.phone || '';
      const clientEmail = item.email || '';
      const subject = item.subject || (item.inquiryType === 'deletion_request' ? 'Account Deletion' : 'General Enquiry');

      list.push({
        id: item._id,
        code: item.referenceId ? `WEB-${item.referenceId}` : `WEB-${String(item._id).slice(-4).toUpperCase()}`,
        stream: 'web',
        categoryLabel: 'Web Contact',
        categoryColor: 'slate',
        title: subject,
        subtitle: item.referenceId ? `Ref #${item.referenceId}` : 'Contact Form Submission',
        budget: '',
        clientName,
        clientPhone,
        clientEmail,
        isRegisteredUser: false,
        message: item.message || '',
        channel: 'Web Contact Us',
        status: (item.status || 'new').toLowerCase(),
        createdAt: item.createdAt,
        assignedTo: 'Support Desk',
        notes: item.adminNotes ? [{ text: item.adminNotes, author: 'Admin', createdAt: item.updatedAt }] : [],
        raw: item,
      });
    });

    // 5. Service Requests (Home Loans, Interiors, Movers, Legal)
    (serviceRequests || []).forEach((item) => {
      const clientName = item.clientName || item.client?.name || 'Customer';
      const clientPhone = item.clientPhone || item.client?.phone || '';
      const clientEmail = item.clientEmail || item.client?.email || '';
      const sType = item.serviceType || 'Service';
      const serviceTitle = item.serviceName || `${sType} Assistance`;
      const locationSub = item.location || item.propertyRef || (item.property?.locality ? `${item.property.locality}, ${item.property.city || ''}` : '');
      const budget = item.quotation && item.quotation !== 'Under Review' ? item.quotation : (item.budgetRange || item.estimatedPrice || item.quotation || '');

      const sColor = sType === 'Interior' ? 'purple' : sType === 'Loan' ? 'emerald' : sType === 'Legal' ? 'amber' : sType === 'Movers' ? 'sky' : 'peach';

      const notesList = (item.notesHistory || []).map((n) => ({
        text: n.text,
        author: n.author || 'Admin',
        createdAt: n.createdAt,
        date: n.date,
      }));
      if (notesList.length === 0 && item.notes) {
        notesList.push({ text: item.notes, author: 'Admin', createdAt: item.updatedAt || item.createdAt });
      }

      list.push({
        id: item._id,
        code: item.serviceRequestId || `SRV-${String(item._id).slice(-4).toUpperCase()}`,
        stream: 'service',
        categoryLabel: `${sType} Service`,
        categoryColor: sColor,
        title: serviceTitle,
        subtitle: `${item.serviceRequestId ? `#${item.serviceRequestId} · ` : ''}${locationSub}`,
        budget: budget,
        clientName,
        clientPhone,
        clientEmail,
        isRegisteredUser: Boolean(item.client?._id),
        message: item.notes || `Inquiry for ${item.serviceName || sType}`,
        channel: 'Services Hub',
        status: (item.status || 'In Progress'),
        createdAt: item.createdAt,
        assignedTo: item.assignedPartner || 'Operations Team',
        notes: notesList,
        raw: item,
        propertyObj: item.property,
      });
    });

    return list;
  }, [propertyEnquiries, developerEnquiries, visitRequests, webInquiries, serviceRequests]);

  // Overall Counts
  const counts = useMemo(() => {
    const total = unifiedEnquiries.length;
    let pending = 0;
    let contacted = 0;
    let confirmed = 0;
    let resolved = 0;
    let cancelled = 0;

    unifiedEnquiries.forEach((e) => {
      const norm = normalizeStatus(e.status);
      if (norm === 'pending') pending++;
      else if (norm === 'contacted') contacted++;
      else if (norm === 'confirmed') confirmed++;
      else if (norm === 'resolved') resolved++;
      else if (norm === 'cancelled') cancelled++;
    });

    const propertyCount = unifiedEnquiries.filter((e) => e.stream === 'property').length;
    const serviceCount = unifiedEnquiries.filter((e) => e.stream === 'service').length;
    const developerCount = unifiedEnquiries.filter((e) => e.stream === 'developer').length;
    const visitCount = unifiedEnquiries.filter((e) => e.stream === 'visit').length;
    const webCount = unifiedEnquiries.filter((e) => e.stream === 'web').length;

    return {
      total,
      pending,
      contacted,
      confirmed,
      resolved,
      cancelled,
      propertyCount,
      serviceCount,
      developerCount,
      visitCount,
      webCount,
    };
  }, [unifiedEnquiries]);

  // Filtered & Sorted Enquiries
  const filteredEnquiries = useMemo(() => {
    return unifiedEnquiries
      .filter((item) => {
        if (activeCategory !== 'all' && item.stream !== activeCategory) return false;

        if (statusFilter !== 'all') {
          const norm = normalizeStatus(item.status);
          if (statusFilter === 'pending' && norm !== 'pending') return false;
          if (statusFilter === 'contacted' && norm !== 'contacted') return false;
          if (statusFilter === 'confirmed' && norm !== 'confirmed') return false;
          if (statusFilter === 'resolved' && norm !== 'resolved') return false;
          if (statusFilter === 'cancelled' && norm !== 'cancelled') return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matches =
            item.clientName.toLowerCase().includes(q) ||
            item.clientPhone.toLowerCase().includes(q) ||
            item.clientEmail.toLowerCase().includes(q) ||
            item.title.toLowerCase().includes(q) ||
            item.subtitle.toLowerCase().includes(q) ||
            item.code.toLowerCase().includes(q) ||
            item.message.toLowerCase().includes(q);
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime() || 0;
        const dateB = new Date(b.createdAt).getTime() || 0;
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [unifiedEnquiries, activeCategory, statusFilter, searchQuery, sortOrder]);

  // Update Status across all streams with robust mapping
  const handleUpdateStatus = async (enquiry, newStatusKey) => {
    setStatusUpdatingId(enquiry.id);
    try {
      let url = '';
      let targetDbStatus = newStatusKey;

      if (enquiry.stream === 'service') {
        url = `/admin/services/${enquiry.id}`;
        const serviceMap = {
          pending: 'In Progress',
          contacted: 'In Progress',
          confirmed: 'Confirmed',
          resolved: 'Completed',
          cancelled: 'Cancelled',
        };
        targetDbStatus = serviceMap[newStatusKey] || 'In Progress';
      } else if (enquiry.stream === 'visit') {
        url = `/admin/dashboard/enquiries/${enquiry.id}`;
        const visitMap = {
          pending: 'pending',
          contacted: 'contacted',
          confirmed: 'accepted',
          resolved: 'completed',
          cancelled: 'rejected',
        };
        targetDbStatus = visitMap[newStatusKey] || newStatusKey;
      } else if (enquiry.stream === 'web') {
        url = `/admin/web-inquiries/${enquiry.id}`;
        const webMap = {
          pending: 'new',
          contacted: 'in_progress',
          confirmed: 'confirmed',
          resolved: 'resolved',
          cancelled: 'rejected',
        };
        targetDbStatus = webMap[newStatusKey] || newStatusKey;
      } else {
        url = `/admin/dashboard/enquiries/${enquiry.id}`;
        const propMap = {
          pending: 'pending',
          contacted: 'contacted',
          confirmed: 'confirmed',
          resolved: 'resolved',
          cancelled: 'cancelled',
        };
        targetDbStatus = propMap[newStatusKey] || newStatusKey;
      }

      const res = await API.patch(url, { status: targetDbStatus });

      if (res.data && res.data.status === 'success') {
        showToast(`Status updated to ${getStatusBadge(targetDbStatus).label}`);

        // Update local state immediately
        const updateItem = (item) => (item._id === enquiry.id ? { ...item, status: targetDbStatus } : item);

        if (enquiry.stream === 'property') setPropertyEnquiries((prev) => prev.map(updateItem));
        else if (enquiry.stream === 'developer') setDeveloperEnquiries((prev) => prev.map(updateItem));
        else if (enquiry.stream === 'visit') setVisitRequests((prev) => prev.map(updateItem));
        else if (enquiry.stream === 'web') setWebInquiries((prev) => prev.map(updateItem));
        else if (enquiry.stream === 'service') setServiceRequests((prev) => prev.map(updateItem));

        if (selectedEnquiry && selectedEnquiry.id === enquiry.id) {
          setSelectedEnquiry((prev) => ({ ...prev, status: targetDbStatus }));
        }

        // Silent re-fetch to ensure complete sync
        fetchEnquiries(true);
      } else {
        showToast(res.data?.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Network error updating status', 'error');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Add Follow-up Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!selectedEnquiry || !noteText.trim()) return;

    setIsSubmittingNote(true);

    try {
      let url = '';
      let payload = {};

      if (selectedEnquiry.stream === 'web') {
        url = `/admin/web-inquiries/${selectedEnquiry.id}`;
        payload = { adminNotes: noteText.trim() };
      } else if (selectedEnquiry.stream === 'service') {
        url = `/admin/services/${selectedEnquiry.id}`;
        payload = { notes: noteText.trim() };
      } else {
        url = `/admin/dashboard/enquiries/${selectedEnquiry.id}`;
        payload = { newNote: noteText.trim() };
      }

      const res = await API.patch(url, payload);

      if (res.data && res.data.status === 'success') {
        showToast('Note added');
        const newNoteItem = {
          text: noteText.trim(),
          author: 'Admin',
          createdAt: new Date().toISOString(),
        };

        setSelectedEnquiry((prev) => ({
          ...prev,
          notes: [newNoteItem, ...(prev.notes || [])],
        }));

        setNoteText('');
        fetchEnquiries(true);
      } else {
        showToast('Could not save note', 'error');
      }
    } catch (err) {
      console.error('Error adding note:', err);
      showToast('Network error', 'error');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Delete Single Enquiry
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      let url = '';
      if (deleteTarget.stream === 'web') {
        url = `/admin/web-inquiries/${deleteTarget.id}`;
      } else if (deleteTarget.stream === 'service') {
        url = `/admin/services/${deleteTarget.id}`;
      } else {
        url = `/admin/dashboard/enquiries/${deleteTarget.id}`;
      }

      const res = await API.delete(url);

      if (res.data && res.data.status === 'success') {
        showToast('Enquiry deleted');
        if (deleteTarget.stream === 'property') {
          setPropertyEnquiries((prev) => prev.filter((i) => i._id !== deleteTarget.id));
        } else if (deleteTarget.stream === 'developer') {
          setDeveloperEnquiries((prev) => prev.filter((i) => i._id !== deleteTarget.id));
        } else if (deleteTarget.stream === 'visit') {
          setVisitRequests((prev) => prev.filter((i) => i._id !== deleteTarget.id));
        } else if (deleteTarget.stream === 'web') {
          setWebInquiries((prev) => prev.filter((i) => i._id !== deleteTarget.id));
        } else if (deleteTarget.stream === 'service') {
          setServiceRequests((prev) => prev.filter((i) => i._id !== deleteTarget.id));
        }

        if (selectedEnquiry && selectedEnquiry.id === deleteTarget.id) {
          setSelectedEnquiry(null);
        }
        setDeleteTarget(null);
      } else {
        showToast('Failed to delete', 'error');
      }
    } catch (err) {
      console.error('Error deleting enquiry:', err);
      showToast('Network error', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Submit Manual Lead
  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!newLeadForm.clientName.trim() || !newLeadForm.clientPhone.trim()) {
      showToast('Client name and phone are required', 'error');
      return;
    }

    setIsSubmittingLead(true);

    try {
      const res = await API.post('/admin/dashboard/enquiries', newLeadForm);
      const resData = res.data;
      if (resData && resData.status === 'success') {
        showToast('Lead recorded');
        setShowAddModal(false);
        setNewLeadForm({
          clientName: '',
          clientPhone: '',
          clientEmail: '',
          propertyName: '',
          location: '',
          channel: 'Portal Form',
          budget: '',
          message: '',
          notes: '',
        });
        fetchEnquiries(true);
      } else {
        showToast(resData?.message || 'Failed to record lead', 'error');
      }
    } catch (err) {
      console.error('Error creating lead:', err);
      showToast('Network error', 'error');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  // Relative Date Helper
  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '—';
    const diffMs = new Date() - new Date(dateStr);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredEnquiries.length === 0) {
      showToast('No enquiries to export', 'error');
      return;
    }

    const headers = ['Inquiry ID', 'Category', 'Client Name', 'Phone', 'Email', 'Property / Subject', 'Status', 'Date', 'Message'];
    const rows = filteredEnquiries.map((e) => [
      `"${e.code}"`,
      `"${e.categoryLabel}"`,
      `"${e.clientName.replace(/"/g, '""')}"`,
      `"${e.clientPhone}"`,
      `"${e.clientEmail}"`,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${e.status}"`,
      `"${new Date(e.createdAt).toLocaleString('en-IN')}"`,
      `"${(e.message || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Enquiries_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV');
  };

  return (
    <div className="w-full space-y-4 pb-16 select-none animate-fadeIn">
      {/* Toast Feedback */}
      {toast.show && (
        <div
          className={`fixed bottom-5 right-5 z-50 py-2.5 px-4 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold border backdrop-blur-md transition-all ${
            toast.type === 'success'
              ? 'bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 border-zinc-800'
              : 'bg-rose-950/90 text-rose-200 border-rose-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="text-emerald-400 shrink-0" size={14} />
          ) : (
            <AlertCircle className="text-rose-400 shrink-0" size={14} />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ─── 4 POLISHED TOP-ACCENT KPI CARDS (GHARMB STANDARDIZED DESIGN) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {[
          {
            key: 'total',
            title: 'Total Inquiries',
            subtitle: 'Across all 5 channels',
            icon: Inbox,
            count: counts.total,
            unit: 'Leads',
            tag: 'Live DB',
            tagClass: 'text-brand bg-brand/10',
            accent: 'border-brand/40 hover:border-brand',
            iconColor: 'text-brand bg-brand/10',
            onClick: () => { setStatusFilter('all'); setActiveCategory('all'); }
          },
          {
            key: 'pending',
            title: 'Pending Review',
            subtitle: 'Requires initial contact',
            icon: Clock,
            count: counts.pending,
            unit: 'Queue',
            tag: counts.pending > 0 ? `${counts.pending} Action Needed` : 'All Clear',
            tagClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
            accent: 'border-amber-500/40 hover:border-amber-500',
            iconColor: 'text-amber-500 bg-amber-500/10',
            onClick: () => setStatusFilter('pending')
          },
          {
            key: 'contacted',
            title: 'In Follow-Up',
            subtitle: 'Ongoing discussions',
            icon: PhoneCall,
            count: counts.contacted,
            unit: 'Active',
            tag: 'In Progress',
            tagClass: 'text-sky-600 dark:text-sky-400 bg-sky-500/10',
            accent: 'border-sky-500/40 hover:border-sky-500',
            iconColor: 'text-sky-500 bg-sky-500/10',
            onClick: () => setStatusFilter('contacted')
          },
          {
            key: 'resolved',
            title: 'Completed Deals',
            subtitle: `${counts.confirmed} confirmed, ${counts.resolved} completed`,
            icon: CheckCircle2,
            count: counts.confirmed + counts.resolved,
            unit: 'Deals',
            tag: 'Completed',
            tagClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
            accent: 'border-emerald-500/40 hover:border-emerald-500',
            iconColor: 'text-emerald-500 bg-emerald-500/10',
            onClick: () => setStatusFilter(counts.confirmed > 0 ? 'confirmed' : 'resolved')
          }
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              onClick={card.onClick}
              className={`group bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3 sm:p-3.5 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden flex flex-col justify-between border-t-2 cursor-pointer ${card.accent}`}
            >
              <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                  <span className="text-[9.5px] sm:text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block truncate">
                    {card.title}
                  </span>
                  <div className="flex items-baseline gap-1 sm:gap-1.5">
                    <span className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)]">
                      {card.count}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-[var(--text-muted)] font-medium">
                      {card.unit}
                    </span>
                  </div>
                </div>

                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${card.iconColor}`}>
                  <Icon size={14} className="sm:size-[16px]" strokeWidth={2} />
                </div>
              </div>

              <div className="mt-2 sm:mt-2.5 pt-1.5 sm:pt-2 border-t border-[var(--border)] flex items-center justify-between text-[10px] sm:text-[11px] gap-1">
                <span className="text-[var(--text-muted)] truncate max-w-[85px] sm:max-w-[150px]">
                  {card.subtitle}
                </span>
                <span className={`text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded truncate shrink-0 ${card.tagClass}`}>
                  {card.tag}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── MAIN MASTER CONTAINER: CLEAN TOOLBAR + DATA DISPLAY ─── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xs overflow-hidden transition-all duration-200">
        
        {/* Header Toolbar */}
        <div className="p-3 border-b border-[var(--border)] space-y-2.5 bg-[var(--bg-surface)]">
          {/* Top Row: Category Tabs & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Category Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto p-1 bg-[var(--bg-muted)]/70 rounded-lg border border-[var(--border)] max-w-full custom-scrollbar scroll-smooth">
              {[
                { id: 'all', label: 'All Inquiries', count: counts.total },
                { id: 'property', label: 'Properties', count: counts.propertyCount },
                { id: 'service', label: 'Services', count: counts.serviceCount },
                { id: 'developer', label: 'Builders', count: counts.developerCount },
                { id: 'visit', label: 'Site Visits', count: counts.visitCount },
                { id: 'web', label: 'Web Forms', count: counts.webCount },
              ].map((tab) => {
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCategory(tab.id)}
                    className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 active:scale-95 ${
                      isActive
                        ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] font-semibold shadow-xs border border-[var(--border)]/70'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold transition-colors ${
                        isActive
                          ? 'bg-brand/10 text-brand'
                          : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center justify-end gap-1.5 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => fetchEnquiries(false)}
                disabled={isLoading || isRefreshing}
                className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] rounded-lg border border-[var(--border)] transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh from Database"
              >
                <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-brand' : ''} />
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="h-8 px-2.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] rounded-lg border border-[var(--border)] transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Download CSV"
              >
                <Download size={13} />
                <span className="hidden sm:inline">Export</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex-1 sm:flex-none h-8 px-3 bg-brand hover:bg-brand-dark text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Plus size={13} />
                <span>Log Lead</span>
              </button>
            </div>
          </div>

          {/* Bottom Row: Search & Status Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-[var(--border)]/60">
            {/* Search Input Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
              <input
                type="text"
                placeholder="Search client, phone, property, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-7 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 focus:bg-[var(--bg-surface)] placeholder:text-[var(--text-muted)] transition-all duration-200"
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

            {/* Dropdown Filters */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-[11px] text-[var(--text-muted)] font-medium hidden sm:inline">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto h-8 px-2.5 bg-[var(--bg-muted)] text-xs font-medium text-[var(--text-primary)] rounded-lg border border-[var(--border)] hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:border-brand cursor-pointer transition-all"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending Review</option>
                  <option value="contacted">In Follow-Up</option>
                  <option value="confirmed">Confirmed / Scheduled</option>
                  <option value="resolved">Completed</option>
                  <option value="cancelled">Cancelled / Rejected</option>
                </select>
              </div>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full sm:w-auto h-8 px-2.5 bg-[var(--bg-muted)] text-xs font-medium text-[var(--text-primary)] rounded-lg border border-[var(--border)] hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:border-brand cursor-pointer transition-all"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── LOADING STATE ─── */}
        {isLoading ? (
          <div className="py-16 text-center">
            <AdminLoader
              text="Fetching customer inquiries..."
              subtext="Loading verified leads, site visits, and service requests"
              minHeight="min-h-[180px]"
            />
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="py-16 text-center text-[var(--text-muted)]">
            {/* ─── EMPTY STATE ─── */}
            <div className="flex flex-col items-center justify-center space-y-2 animate-in fade-in duration-200">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)] border border-[var(--border)]">
                <Inbox size={18} />
              </div>
              <p className="font-semibold text-sm text-[var(--text-primary)]">
                {unifiedEnquiries.length === 0 ? 'No Inquiries Recorded' : 'No Matching Enquiries Found'}
              </p>
              <p className="text-xs text-[var(--text-muted)] max-w-sm px-4">
                {unifiedEnquiries.length === 0
                  ? 'Customer property leads, builder consultations, scheduled site visits, and service requests will appear here automatically.'
                  : 'Try adjusting your search keywords, category filter, or status selection.'}
              </p>
              {unifiedEnquiries.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setActiveCategory('all');
                  }}
                  className="mt-1 text-xs font-semibold text-brand hover:underline cursor-pointer"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* ─── DESKTOP DATA TABLE: (Hidden on Mobile, Visible on Desktop/Tablet) ─── */}
            <div className="hidden md:block w-full overflow-x-auto min-h-[300px]">
              <table className="w-full text-left border-collapse table-fixed min-w-[760px]">
                <colgroup>
                  <col className="w-[14%]" />
                  <col className="w-[22%]" />
                  <col className="w-[26%]" />
                  <col className="w-[12%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[9.5px] font-semibold uppercase tracking-wider bg-[var(--bg-muted)]/40 select-none">
                    <th className="py-2 px-3 align-middle">Lead ID & Stream</th>
                    <th className="py-2 px-3 align-middle">Client Details</th>
                    <th className="py-2 px-3 align-middle">Interest / Subject</th>
                    <th className="py-2 px-3 align-middle">Date</th>
                    <th className="py-2 px-3 align-middle text-center">Status</th>
                    <th className="py-2 pl-2 pr-3 align-middle text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--border)]/60 text-xs">
                  {filteredEnquiries.map((enquiry) => {
                    const statusCfg = getStatusBadge(enquiry.status);
                    const isUpdating = statusUpdatingId === enquiry.id;

                    return (
                      <tr
                        key={enquiry.id}
                        onClick={() => setSelectedEnquiry(enquiry)}
                        className="group hover:bg-[var(--bg-muted)]/35 transition-colors duration-150 cursor-pointer"
                      >
                        {/* 1. Lead Code & Category */}
                        <td className="py-1.5 px-3 align-middle overflow-hidden">
                          <span className="font-mono text-xs font-semibold text-[var(--text-primary)] group-hover:text-brand transition-colors block leading-tight truncate">
                            {enquiry.code}
                          </span>
                          <div className="mt-0.5">
                            <Badge color={enquiry.categoryColor || 'peach'} variant="pastel" size="2xs">
                              {enquiry.categoryLabel}
                            </Badge>
                          </div>
                        </td>

                        {/* 2. Client Name & Phone */}
                        <td className="py-1.5 px-3 align-middle overflow-hidden">
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-brand transition-colors truncate">
                              {enquiry.clientName}
                            </p>
                            <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5 truncate leading-tight">
                              {enquiry.clientPhone || enquiry.clientEmail || '—'}
                            </p>
                          </div>
                        </td>

                        {/* 3. Interest / Subject */}
                        <td className="py-1.5 px-3 align-middle overflow-hidden">
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-brand transition-colors truncate" title={enquiry.title}>
                              {enquiry.title}
                            </p>
                            <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5 leading-tight" title={enquiry.subtitle}>
                              {enquiry.subtitle || enquiry.budget || 'Direct Consultation'}
                            </p>
                          </div>
                        </td>

                        {/* 4. Date */}
                        <td className="py-1.5 px-3 align-middle whitespace-nowrap overflow-hidden">
                          <span className="text-[10.5px] text-[var(--text-muted)] font-medium">
                            {formatRelativeTime(enquiry.createdAt)}
                          </span>
                        </td>

                        {/* 5. Interactive Status Pill */}
                        <td className="py-1.5 px-3 align-middle text-center whitespace-nowrap overflow-hidden" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center justify-center relative">
                            <select
                              value={normalizeStatus(enquiry.status)}
                              onChange={(e) => handleUpdateStatus(enquiry, e.target.value)}
                              disabled={isUpdating}
                              className={`appearance-none inline-flex items-center pl-4.5 pr-4.5 py-0.5 rounded-full text-[9.5px] font-bold border shadow-2xs cursor-pointer transition-all hover:scale-102 focus:outline-none focus:ring-1 focus:ring-brand/30 disabled:opacity-50 ${statusCfg.pill}`}
                              title="Click to update status"
                            >
                              <option value="pending">Pending</option>
                              <option value="contacted">In Follow-Up</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="resolved">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            <span className={`absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full pointer-events-none ${statusCfg.dot} ${isUpdating ? 'animate-ping' : ''}`} />
                            <ChevronDown size={9} className="absolute right-1 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
                          </div>
                        </td>

                        {/* 6. Actions */}
                        <td className="py-1.5 pl-2 pr-3 align-middle text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1 justify-end shrink-0">
                            {/* WhatsApp Trigger */}
                            {enquiry.clientPhone && (
                              <a
                                href={`https://wa.me/${enquiry.clientPhone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Chat on WhatsApp"
                                className="w-6 h-6 rounded-md flex items-center justify-center text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 transition-all shadow-2xs active:scale-95"
                              >
                                <MessageCircle size={11} />
                              </a>
                            )}

                            {/* Direct Call Trigger */}
                            {enquiry.clientPhone && (
                              <button
                                type="button"
                                onClick={() => setCallTarget(enquiry)}
                                title={`Call ${enquiry.clientName}`}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500 hover:text-white border border-sky-500/20 transition-all shadow-2xs active:scale-95 cursor-pointer"
                              >
                                <Phone size={11} />
                              </button>
                            )}

                            {/* Inspect Eye */}
                            <button
                              type="button"
                              onClick={() => setSelectedEnquiry(enquiry)}
                              title="Inspect Details"
                              className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--bg-muted)]/70 hover:bg-brand hover:text-white text-[var(--text-secondary)] border border-[var(--border)] transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                            >
                              <Eye size={12} />
                            </button>

                            {/* Delete Trigger */}
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(enquiry)}
                              title="Delete Enquiry"
                              className="w-6 h-6 rounded-md flex items-center justify-center text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ─── MOBILE CARDS VIEW: (Visible on Mobile, Hidden on Desktop) ─── */}
            <div className="block md:hidden divide-y divide-[var(--border)]/70">
              {filteredEnquiries.map((enquiry) => {
                const statusCfg = getStatusBadge(enquiry.status);
                const isUpdating = statusUpdatingId === enquiry.id;

                return (
                  <div
                    key={enquiry.id}
                    onClick={() => setSelectedEnquiry(enquiry)}
                    className="p-3.5 space-y-2.5 hover:bg-[var(--bg-muted)]/20 transition-colors cursor-pointer active:bg-[var(--bg-muted)]/35"
                  >
                    {/* Top Row: Code, Category, Time & Status Pill */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                          {enquiry.code}
                        </span>
                        <Badge color={enquiry.categoryColor || 'peach'} variant="pastel" size="2xs">
                          {enquiry.categoryLabel}
                        </Badge>
                        <span className="text-[10px] text-[var(--text-muted)] font-medium">
                          • {formatRelativeTime(enquiry.createdAt)}
                        </span>
                      </div>

                      {/* Interactive Status Pill */}
                      <div onClick={(e) => e.stopPropagation()} className="shrink-0 relative">
                        <select
                          value={normalizeStatus(enquiry.status)}
                          onChange={(e) => handleUpdateStatus(enquiry, e.target.value)}
                          disabled={isUpdating}
                          className={`appearance-none inline-flex items-center pl-4.5 pr-4.5 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs cursor-pointer transition-all ${statusCfg.pill}`}
                          title="Click to update status"
                        >
                          <option value="pending">Pending</option>
                          <option value="contacted">In Follow-Up</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="resolved">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <span className={`absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full pointer-events-none ${statusCfg.dot} ${isUpdating ? 'animate-ping' : ''}`} />
                        <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none" />
                      </div>
                    </div>

                    {/* Middle: Client Info & Subject */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-xs text-[var(--text-primary)] truncate">
                          {enquiry.clientName}
                        </h4>
                        {enquiry.budget && (
                          <span className="text-[10px] font-bold text-brand bg-brand/10 border border-brand/20 px-1.5 py-0.5 rounded shrink-0">
                            {enquiry.budget}
                          </span>
                        )}
                      </div>

                      {/* Phone & Email */}
                      <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] font-mono flex-wrap">
                        {enquiry.clientPhone && (
                          <span className="flex items-center gap-1">
                            <Phone size={10} className="text-slate-400" />
                            {enquiry.clientPhone}
                          </span>
                        )}
                        {enquiry.clientEmail && (
                          <span className="flex items-center gap-1 truncate max-w-[180px]">
                            <Mail size={10} className="text-slate-400" />
                            <span className="truncate">{enquiry.clientEmail}</span>
                          </span>
                        )}
                      </div>

                      {/* Property/Service Subject */}
                      <div className="p-2 rounded-lg bg-[var(--bg-muted)]/50 border border-[var(--border)]/60 text-xs">
                        <p className="font-semibold text-[var(--text-primary)] truncate">
                          {enquiry.title}
                        </p>
                        {enquiry.subtitle && (
                          <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                            {enquiry.subtitle}
                          </p>
                        )}
                      </div>

                      {/* Customer Note */}
                      {enquiry.message && (
                        <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 italic px-0.5">
                          "{enquiry.message}"
                        </p>
                      )}
                    </div>

                    {/* Bottom: Action Buttons */}
                    <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]/40" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {enquiry.clientPhone && (
                          <a
                            href={`https://wa.me/${enquiry.clientPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 transition-all active:scale-95"
                          >
                            <MessageCircle size={12} />
                            <span>WhatsApp</span>
                          </a>
                        )}
                        {enquiry.clientPhone && (
                          <button
                            type="button"
                            onClick={() => setCallTarget(enquiry)}
                            className="h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500 hover:text-white border border-sky-500/20 transition-all active:scale-95 cursor-pointer"
                          >
                            <Phone size={12} />
                            <span>Call</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedEnquiry(enquiry)}
                          className="h-7 px-2.5 rounded-lg flex items-center gap-1 text-xs font-semibold bg-[var(--bg-muted)] hover:bg-brand hover:text-white text-[var(--text-secondary)] border border-[var(--border)] transition-all cursor-pointer active:scale-95"
                        >
                          <Eye size={12} />
                          <span>Details</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(enquiry)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all cursor-pointer active:scale-95"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Footer summary bar */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-muted)]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
          <span>
            Showing <strong className="text-[var(--text-primary)]">{filteredEnquiries.length}</strong> of{' '}
            <strong className="text-[var(--text-primary)]">{unifiedEnquiries.length}</strong> total inquiries
          </span>
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>{counts.pending} Pending</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              <span>{counts.contacted} In Progress</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>{counts.confirmed} Confirmed</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{counts.resolved} Completed</span>
            </span>
          </div>
        </div>
      </div>

      {/* ─── SLIDE-OVER DRAWER: DETAILED INSPECTION & FOLLOW-UP ─── */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setSelectedEnquiry(null)}
          />

          <div className="relative w-full max-w-md bg-[var(--bg-surface)] border-l border-[var(--border)] shadow-2xl h-full flex flex-col z-10 animate-slide-down">
            {/* Drawer Header */}
            <div className="py-3 px-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--bg-muted)]/40">
              <div className="flex items-center gap-2">
                <Badge color={selectedEnquiry.categoryColor || 'peach'} variant="pastel" size="xs">
                  {selectedEnquiry.categoryLabel}
                </Badge>
                <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                  {selectedEnquiry.code}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              
              {/* Client Profile Card */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-muted)]/40 border border-[var(--border)] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center text-sm font-bold shrink-0">
                    {selectedEnquiry.clientName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-[var(--text-primary)] truncate">
                      {selectedEnquiry.clientName}
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {selectedEnquiry.isRegisteredUser ? 'Verified Registered User' : selectedEnquiry.channel}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)] text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Phone</span>
                    <p
                      onClick={() => handleCopy(selectedEnquiry.clientPhone, 'phone')}
                      className="font-semibold text-[var(--text-primary)] hover:text-brand cursor-pointer truncate flex items-center gap-1 font-mono mt-0.5"
                    >
                      {selectedEnquiry.clientPhone || '—'}
                      <Copy size={11} className="text-slate-400" />
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Email</span>
                    <p
                      onClick={() => handleCopy(selectedEnquiry.clientEmail, 'email')}
                      className="font-semibold text-[var(--text-primary)] hover:text-brand cursor-pointer truncate flex items-center gap-1 mt-0.5"
                    >
                      {selectedEnquiry.clientEmail || '—'}
                      <Copy size={11} className="text-slate-400" />
                    </p>
                  </div>
                </div>

                {/* Direct Action Triggers */}
                {selectedEnquiry.clientPhone && (
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`https://wa.me/${selectedEnquiry.clientPhone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setCallTarget(selectedEnquiry)}
                      className="flex-1 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Phone size={13} />
                      <span>Call Client</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Status Update Quick Bar */}
              <div className="p-3 rounded-xl bg-[var(--bg-muted)]/30 border border-[var(--border)] flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--text-primary)]">Update Status</span>
                <select
                  value={normalizeStatus(selectedEnquiry.status)}
                  onChange={(e) => handleUpdateStatus(selectedEnquiry, e.target.value)}
                  disabled={statusUpdatingId === selectedEnquiry.id}
                  className="h-7 px-2.5 bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand cursor-pointer"
                >
                  <option value="pending">Pending</option>
                  <option value="contacted">In Follow-Up</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="resolved">Completed</option>
                  <option value="cancelled">Cancelled / Rejected</option>
                </select>
              </div>

              {/* Subject Details */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Subject Details
                </span>
                <div className="p-3 rounded-xl bg-[var(--bg-muted)]/30 border border-[var(--border)] space-y-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-bold text-xs text-[var(--text-primary)]">{selectedEnquiry.title}</p>
                      {selectedEnquiry.subtitle && (
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{selectedEnquiry.subtitle}</p>
                      )}
                    </div>
                    {selectedEnquiry.budget && (
                      <span className="text-xs font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-md shrink-0">
                        {selectedEnquiry.budget}
                      </span>
                    )}
                  </div>

                  {selectedEnquiry.stream === 'service' && (
                    <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-muted)]">
                        Assigned: <strong className="text-[var(--text-primary)]">{selectedEnquiry.assignedTo}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate('/admin/services')}
                        className="font-semibold text-brand hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open Services Hub</span>
                        <ExternalLink size={11} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Inquiry Message */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Customer Message / Request
                </span>
                <div className="p-3 rounded-xl bg-[var(--bg-muted)]/40 border border-[var(--border)] text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                  {selectedEnquiry.message || 'No additional note provided with inquiry.'}
                </div>
              </div>

              {/* Follow-up Notes Timeline */}
              <div className="space-y-2 pt-1 border-t border-[var(--border)]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Follow-Up Timeline Notes ({selectedEnquiry.notes?.length || 0})
                </span>

                <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                  {(!selectedEnquiry.notes || selectedEnquiry.notes.length === 0) ? (
                    <p className="text-[11px] text-[var(--text-muted)] italic py-1">No remarks recorded yet.</p>
                  ) : (
                    selectedEnquiry.notes.map((n, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-[var(--bg-muted)]/50 border border-[var(--border)] text-xs space-y-1"
                      >
                        <p className="text-[var(--text-primary)] leading-normal">{n.text}</p>
                        <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                          <span>{n.author || 'Admin'}</span>
                          <span>{n.createdAt ? formatRelativeTime(n.createdAt) : n.date || 'Recent'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddNote} className="space-y-2 pt-1">
                  <textarea
                    rows={2}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add follow-up notes, call remarks, or updates..."
                    className="w-full p-2.5 text-xs bg-[var(--bg-muted)]/60 border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 resize-none transition-all"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingNote || !noteText.trim()}
                      className="h-7 px-3 bg-brand hover:bg-brand-dark text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Send size={11} />
                      <span>{isSubmittingNote ? 'Saving...' : 'Add Note'}</span>
                    </button>
                  </div>
                </form>
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="py-3 px-4 border-t border-[var(--border)] bg-[var(--bg-muted)]/40 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setDeleteTarget(selectedEnquiry)}
                className="px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Delete Lead</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="px-3.5 py-1.5 text-xs font-semibold bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: MANUAL ADD LEAD ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xl p-4 sm:p-5 space-y-3.5 sm:space-y-4 z-10 animate-slide-down max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Log Customer Lead</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.clientName}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, clientName: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] rounded-lg border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newLeadForm.clientPhone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, clientPhone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] rounded-lg border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newLeadForm.clientEmail}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, clientEmail: e.target.value })}
                    placeholder="client@example.com"
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] rounded-lg border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                    Source Channel
                  </label>
                  <select
                    value={newLeadForm.channel}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, channel: e.target.value })}
                    className="w-full h-8 px-2 bg-[var(--bg-muted)] rounded-lg border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-brand"
                  >
                    <option value="Portal Form">Portal Form</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="WhatsApp">WhatsApp Inquiry</option>
                    <option value="Direct Walk-in">Direct Walk-in</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                  Property or Project
                </label>
                <input
                  type="text"
                  value={newLeadForm.propertyName}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, propertyName: e.target.value })}
                  placeholder="e.g. Green Meadows 3BHK"
                  className="w-full h-8 px-2.5 bg-[var(--bg-muted)] rounded-lg border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.location}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, location: e.target.value })}
                    placeholder="e.g. Whitefield, Bengaluru"
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] rounded-lg border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                    Budget
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.budget}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, budget: e.target.value })}
                    placeholder="e.g. ₹75 Lakh"
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] rounded-lg border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                  Client Message / Notes
                </label>
                <textarea
                  rows={2}
                  value={newLeadForm.message}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, message: e.target.value })}
                  placeholder="Inquiry requirements or remarks..."
                  className="w-full p-2 bg-[var(--bg-muted)] rounded-lg border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-brand resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="px-3.5 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 transition-all"
                >
                  {isSubmittingLead ? 'Saving...' : 'Record Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: DELETE CONFIRMATION ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xl p-5 space-y-3 z-10 animate-slide-down">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                <Trash2 size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Delete Inquiry?</h3>
                <p className="text-xs text-[var(--text-muted)]">This action will remove this lead record permanently.</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--bg-muted)]/50 border border-[var(--border)] text-xs space-y-1">
              <p className="font-semibold text-[var(--text-primary)]">{deleteTarget.clientName}</p>
              <p className="text-[11px] text-[var(--text-muted)]">{deleteTarget.title}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 transition-all"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
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
          onUpdateStatus={(newStatus) => handleUpdateStatus(callTarget, newStatus)}
          onAddNote={async (text) => {
            let url = '';
            let payload = {};
            if (callTarget.stream === 'web') {
              url = `/admin/web-inquiries/${callTarget.id}`;
              payload = { adminNotes: text };
            } else if (callTarget.stream === 'service') {
              url = `/admin/services/${callTarget.id}`;
              payload = { notes: text };
            } else {
              url = `/admin/dashboard/enquiries/${callTarget.id}`;
              payload = { newNote: text };
            }
            const res = await API.patch(url, payload);
            if (res.data?.status === 'success') {
              showToast('Call note logged successfully');
              fetchEnquiries(true);
            }
          }}
        />
      )}
    </div>
  );
}
