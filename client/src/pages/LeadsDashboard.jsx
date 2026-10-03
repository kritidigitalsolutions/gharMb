import React, { useState, useEffect, useMemo } from 'react';
import {
  PhoneCall, MessageSquare, FileSpreadsheet, CalendarDays,
  ArrowRight, TrendingUp, Percent, MapPin, ExternalLink,
  Search, Filter, UserCheck, Plus, Trash2, X, XCircle,
  AlertCircle, Activity, CheckCircle2, Building,
  Building2, Eye, IndianRupee, Home, User, Send, Clock,
  Check, Phone, Mail, Edit2, Layers, CheckCircle, Sparkles,
  RefreshCw, MessageCircle, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LeadsDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Tab: 'leads' or 'buyer_needs'
  const [activeTab, setActiveTab] = useState('leads');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

  // Modals & Drawers
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [propertyPreviewModal, setPropertyPreviewModal] = useState(null);
  const [assignModalLead, setAssignModalLead] = useState(null);
  const [selectedAgentToAssign, setSelectedAgentToAssign] = useState('Executive Desk');
  const [deleteConfirmLead, setDeleteConfirmLead] = useState(null);

  // Form states for creating a new inquiry
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadSelectedPropId, setNewLeadSelectedPropId] = useState('');
  const [newLeadPropertyName, setNewLeadPropertyName] = useState('');
  const [newLeadLocation, setNewLeadLocation] = useState('');
  const [newLeadType, setNewLeadType] = useState('Portal Form');
  const [newLeadBudget, setNewLeadBudget] = useState('');
  const [newLeadMessage, setNewLeadMessage] = useState('');
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  // Follow-up note state in drawer
  const [noteText, setNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Real data state
  const [leads, setLeads] = useState([]);
  const [availableProperties, setAvailableProperties] = useState([]);
  const [availableAgents, setAvailableAgents] = useState([]);

  const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const API_BASE = RAW_API_URL.replace(/\/+api\/?$/i, '').replace(/\/+$/, '');

  const showToast = (text, type = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Helper to fetch admin authentication token
  const getAuthToken = () => {
    return localStorage.getItem('adminToken') || localStorage.getItem('token') || '';
  };

  // Fetch real leads & enquiries from backend
  const fetchLeads = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/api/admin/dashboard/enquiries`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const resData = await response.json();

      if (response.ok && resData.status === 'success') {
        const rawPropEnquiries = resData.data.propertyEnquiries || [];
        const rawDevEnquiries = resData.data.developerEnquiries || [];
        const rawVisitRequests = resData.data.visitRequests || [];

        // 1. Map Property Enquiries
        const propList = rawPropEnquiries.map(e => {
          const clientName = e.client?.name || e.clientDetails?.name || 'Client Lead';
          const clientPhone = e.client?.phone || e.clientDetails?.phone || 'N/A';
          const clientEmail = e.client?.email || e.clientDetails?.email || '';
          const propTitle = e.property?.title || e.propertyName || 'Property Direct Lead';
          const propLocation = [e.property?.locality, e.property?.city].filter(Boolean).join(', ') || e.location || 'India';
          const priceFormatted = e.property?.price ? `₹${Number(e.property.price).toLocaleString('en-IN')}` : (e.budget || 'On Request');
          
          return {
            id: `LED-${e._id.slice(-4).toUpperCase()}`,
            _id: e._id,
            origin: 'property',
            client: clientName,
            phone: clientPhone,
            email: clientEmail,
            propertyId: e.property?.submissionId || e.property?._id || 'PROP-DIR',
            propertyObj: e.property || null,
            propertyName: propTitle,
            location: propLocation,
            type: e.channel || (e.visitPreferredDate ? 'Site Visit' : 'Portal Form'),
            budget: priceFormatted,
            date: e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today',
            rawDate: e.createdAt ? new Date(e.createdAt).getTime() : 0,
            status: e.status ? (e.status.charAt(0).toUpperCase() + e.status.slice(1).toLowerCase()) : 'Pending',
            assignedTo: e.assignedTo || 'Executive Desk',
            rawMsg: e.message || 'Direct property inquiry registered.',
            notes: Array.isArray(e.notes) && e.notes.length > 0 
              ? e.notes 
              : (e.agentNotes ? [{ date: 'Initial', text: e.agentNotes }] : [])
          };
        });

        // 2. Map Developer Enquiries
        const devList = rawDevEnquiries.map(e => {
          const clientName = e.client?.name || e.clientDetails?.name || 'Developer Inquirer';
          const clientPhone = e.client?.phone || e.clientDetails?.phone || 'N/A';
          const clientEmail = e.client?.email || e.clientDetails?.email || '';
          const devTitle = e.developer?.companyName || e.developer?.name || e.developerName || 'Builder Project Desk';

          return {
            id: `DEV-${e._id.slice(-4).toUpperCase()}`,
            _id: e._id,
            origin: 'developer',
            client: clientName,
            phone: clientPhone,
            email: clientEmail,
            propertyId: e.developer?._id || 'DEV-DESK',
            propertyObj: null,
            propertyName: devTitle,
            location: 'Project Sales Desk',
            type: e.channel || 'Developer Consultation',
            budget: e.budget || 'On Request',
            date: e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today',
            rawDate: e.createdAt ? new Date(e.createdAt).getTime() : 0,
            status: e.status ? (e.status.charAt(0).toUpperCase() + e.status.slice(1).toLowerCase()) : 'Pending',
            assignedTo: e.assignedTo || 'Developer Desk',
            rawMsg: e.message || 'Builder project consultation inquiry received.',
            notes: Array.isArray(e.notes) && e.notes.length > 0 
              ? e.notes 
              : (e.developerNotes ? [{ date: 'Initial', text: e.developerNotes }] : [])
          };
        });

        // 3. Map Scheduled Site Visit Requests
        const visitList = rawVisitRequests.map(e => {
          const clientName = e.userDetails?.name || e.user?.name || 'Site Visitor';
          const clientPhone = e.userDetails?.phone || e.user?.phone || 'N/A';
          const clientEmail = e.userDetails?.email || e.user?.email || '';
          const propTitle = e.propertyDetails?.title || e.property?.title || 'Site Visit Tour';
          const propLocation = [e.propertyDetails?.locality || e.property?.locality, e.propertyDetails?.city || e.property?.city].filter(Boolean).join(', ') || 'Site Locality';
          const priceFormatted = e.property?.price ? `₹${Number(e.property.price).toLocaleString('en-IN')}` : 'On Request';
          const visitDateStr = e.visitDate ? new Date(e.visitDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Scheduled';

          return {
            id: e.visitRequestId || `VST-${e._id.slice(-4).toUpperCase()}`,
            _id: e._id,
            origin: 'visit',
            client: clientName,
            phone: clientPhone,
            email: clientEmail,
            propertyId: e.property?.submissionId || e.property?._id || 'PROP-VISIT',
            propertyObj: e.property || null,
            propertyName: propTitle,
            location: propLocation,
            type: 'Site Visit',
            budget: priceFormatted,
            date: `${visitDateStr} ${e.visitTime || ''}`.trim(),
            rawDate: e.createdAt ? new Date(e.createdAt).getTime() : 0,
            status: e.status ? (e.status.charAt(0).toUpperCase() + e.status.slice(1).toLowerCase()) : 'Pending',
            assignedTo: e.assignedTo || 'Executive Desk',
            rawMsg: e.notes || e.ownerMessage || e.rejectionReason || 'Scheduled property walkthrough and site tour.',
            notes: Array.isArray(e.followUpNotes) && e.followUpNotes.length > 0
              ? e.followUpNotes
              : (e.adminNotes ? [{ date: 'Initial', text: e.adminNotes }] : [])
          };
        });

        // Combine and sort by newest first
        const allRealLeads = [...propList, ...devList, ...visitList].sort((a, b) => b.rawDate - a.rawDate);
        setLeads(allRealLeads);

        // Update selectedLead reference if drawer is open
        if (selectedLead) {
          const refreshedCurrent = allRealLeads.find(l => l._id === selectedLead._id);
          if (refreshedCurrent) setSelectedLead(refreshedCurrent);
        }
      } else {
        setLeads([]);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
      setLeads([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch available real properties to link with new leads
  const fetchAvailableProperties = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/api/admin/properties?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        const props = data.data?.properties || [];
        setAvailableProperties(props);
      }
    } catch (err) {
      console.error('Failed to fetch properties for lead linking:', err);
    }
  };

  // Fetch real team agents & users
  const fetchAvailableAgents = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/api/admin/users?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        const users = data.data?.users || [];
        // Filter agents or staff
        const agents = users.filter(u => u.role === 'agent' || u.role === 'admin');
        setAvailableAgents(agents);
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchAvailableProperties();
    fetchAvailableAgents();
  }, []);

  // Compute dynamic distinct locations from loaded leads & properties
  const dynamicLocations = useMemo(() => {
    const locSet = new Set();
    locSet.add('All');

    leads.forEach(l => {
      if (l.location && l.location !== 'India' && l.location !== 'Project Sales Desk') {
        locSet.add(l.location);
      }
    });

    availableProperties.forEach(p => {
      const locString = [p.locality, p.city].filter(Boolean).join(', ');
      if (locString) locSet.add(locString);
      else if (p.city) locSet.add(p.city);
    });

    return Array.from(locSet);
  }, [leads, availableProperties]);

  // Compute assignable desks & real agents list
  const activeAgentsList = useMemo(() => {
    const defaultDesks = [
      { name: 'Executive Desk', region: 'All India General', count: leads.filter(l => l.assignedTo?.includes('Executive Desk')).length },
      { name: 'Direct Sales Ops', region: 'HQ Closures', count: leads.filter(l => l.assignedTo?.includes('Direct Sales Ops')).length }
    ];

    const mappedAgents = availableAgents.map(a => ({
      name: a.name || 'Verified Agent',
      region: a.address?.city || a.city || 'Regional Specialist',
      count: leads.filter(l => l.assignedTo?.toLowerCase() === a.name?.toLowerCase()).length
    }));

    return [...defaultDesks, ...mappedAgents];
  }, [availableAgents, leads]);

  // Open Property Preview with 100% REAL data
  const handleOpenPropertyModal = (propertyId, fallbackTitle, leadObj) => {
    // If real property object is already populated
    if (leadObj?.propertyObj) {
      const p = leadObj.propertyObj;
      const mainImage = (p.propertyImages && p.propertyImages[0]) || 
                        (p.images && p.images[0]?.url) || 
                        (Array.isArray(p.images) && p.images[0]) || 
                        null;
      setPropertyPreviewModal({
        id: p.submissionId || p._id,
        _id: p._id,
        title: p.title || fallbackTitle,
        location: [p.locality, p.city].filter(Boolean).join(', ') || 'Location on Record',
        price: p.price ? `₹${Number(p.price).toLocaleString('en-IN')}` : 'Price on Request',
        type: `${p.category || 'Residential'} • ${p.propertyType || 'Property'}`,
        builder: p.listingAs || (p.owner?.name ? `${p.owner.name} (${p.owner.role || 'Owner'})` : 'Verified Lister'),
        area: p.carpetArea ? `${p.carpetArea} sq.ft` : 'Area as specified',
        image: mainImage,
        status: p.approvalStatus || 'Active'
      });
      return;
    }

    // Lookup in availableProperties list
    const found = availableProperties.find(p => p._id === propertyId || p.submissionId === propertyId);
    if (found) {
      const mainImage = (found.propertyImages && found.propertyImages[0]) || 
                        (found.images && found.images[0]?.url) || 
                        (Array.isArray(found.images) && found.images[0]) || 
                        null;
      setPropertyPreviewModal({
        id: found.submissionId || found._id,
        _id: found._id,
        title: found.title || fallbackTitle,
        location: [found.locality, found.city].filter(Boolean).join(', ') || 'Location on Record',
        price: found.price ? `₹${Number(found.price).toLocaleString('en-IN')}` : 'Price on Request',
        type: `${found.category || 'Residential'} • ${found.propertyType || 'Property'}`,
        builder: found.listingAs || (found.owner?.name ? `${found.owner.name} (${found.owner.role || 'Owner'})` : 'Verified Lister'),
        area: found.carpetArea ? `${found.carpetArea} sq.ft` : 'Area on Record',
        image: mainImage,
        status: found.approvalStatus || 'Active'
      });
      return;
    }

    // Direct Lead property details
    setPropertyPreviewModal({
      id: propertyId || 'LEAD-PROP',
      _id: null,
      title: fallbackTitle || 'Inquired Property',
      location: leadObj?.location || 'Target Locality',
      price: leadObj?.budget || 'Price on Request',
      type: 'Direct Client Inquiry',
      builder: leadObj?.assignedTo || 'Executive Desk',
      area: 'Specified in consultation',
      image: null,
      status: 'Inquired'
    });
  };

  // Open modal to assign agent
  const handleAssignLead = (lead) => {
    setAssignModalLead(lead);
    setSelectedAgentToAssign(lead.assignedTo || 'Executive Desk');
  };

  // Confirm agent assignment and persist to MongoDB
  const confirmAssignment = async () => {
    if (!assignModalLead) return;
    const cleanAgentName = selectedAgentToAssign.split(' (')[0].trim();

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/api/admin/dashboard/enquiries/${assignModalLead._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          assignedTo: cleanAgentName,
          newNote: `Lead re-assigned to ${cleanAgentName}`
        })
      });

      if (response.ok) {
        setLeads(prev => prev.map(l => l._id === assignModalLead._id ? {
          ...l,
          assignedTo: cleanAgentName,
          notes: [
            ...(l.notes || []),
            { date: 'Today', text: `Lead re-assigned to ${cleanAgentName}`, author: 'Admin' }
          ]
        } : l));

        if (selectedLead?._id === assignModalLead._id) {
          setSelectedLead(prev => ({
            ...prev,
            assignedTo: cleanAgentName,
            notes: [
              ...(prev.notes || []),
              { date: 'Today', text: `Lead re-assigned to ${cleanAgentName}`, author: 'Admin' }
            ]
          }));
        }

        showToast(`Lead assigned to ${cleanAgentName}`);
      } else {
        showToast('Failed to assign agent on server', 'error');
      }
    } catch (err) {
      console.error('Error assigning lead:', err);
      showToast('Network error while assigning lead', 'error');
    } finally {
      setAssignModalLead(null);
    }
  };

  // Add Follow-up Note and persist to MongoDB
  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedLead || isSubmittingNote) return;
    setIsSubmittingNote(true);

    try {
      const token = getAuthToken();
      const trimmedNote = noteText.trim();
      const response = await fetch(`${API_BASE}/api/admin/dashboard/enquiries/${selectedLead._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          newNote: trimmedNote
        })
      });

      if (response.ok) {
        const newNoteObj = {
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          text: trimmedNote,
          author: 'Admin'
        };

        setLeads(prev => prev.map(l => l._id === selectedLead._id ? {
          ...l,
          notes: [...(l.notes || []), newNoteObj]
        } : l));

        setSelectedLead(prev => ({
          ...prev,
          notes: [...(prev.notes || []), newNoteObj]
        }));

        setNoteText('');
        showToast('Follow-up note logged');
      } else {
        showToast('Failed to record follow-up note', 'error');
      }
    } catch (err) {
      console.error('Error adding note:', err);
      showToast('Network error saving note', 'error');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Update Lead Status and persist to MongoDB
  const handleUpdateStatus = async (leadId, newStatus) => {
    try {
      const token = getAuthToken();
      const formattedStatus = newStatus.toLowerCase();

      const response = await fetch(`${API_BASE}/api/admin/dashboard/enquiries/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: formattedStatus
        })
      });

      if (response.ok) {
        const capitalized = newStatus.charAt(0).toUpperCase() + newStatus.slice(1).toLowerCase();
        setLeads(prev => prev.map(l => l._id === leadId ? { ...l, status: capitalized } : l));

        if (selectedLead?._id === leadId) {
          setSelectedLead(prev => ({ ...prev, status: capitalized }));
        }

        showToast(`Status updated to ${capitalized}`);
      } else {
        showToast('Failed to update status on server', 'error');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Network error updating status', 'error');
    }
  };

  // Delete Lead from MongoDB
  const handleDeleteLead = async (leadId) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/api/admin/dashboard/enquiries/${leadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setLeads(prev => prev.filter(l => l._id !== leadId));
        if (selectedLead?._id === leadId) setSelectedLead(null);
        showToast('Inquiry lead deleted permanently');
      } else {
        showToast('Failed to delete inquiry from server', 'error');
      }
    } catch (err) {
      console.error('Error deleting lead:', err);
      showToast('Network error deleting lead', 'error');
    } finally {
      setDeleteConfirmLead(null);
    }
  };

  // Create New Lead and save directly to MongoDB
  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!newLeadName.trim() || !newLeadPhone.trim() || isSubmittingLead) return;

    setIsSubmittingLead(true);
    try {
      const token = getAuthToken();

      let targetLocation = newLeadLocation.trim();
      let targetPropertyName = newLeadPropertyName.trim();

      // If a property was picked from availableProperties dropdown
      if (newLeadSelectedPropId) {
        const found = availableProperties.find(p => p._id === newLeadSelectedPropId);
        if (found) {
          targetPropertyName = found.title;
          targetLocation = [found.locality, found.city].filter(Boolean).join(', ') || targetLocation;
        }
      }

      const payload = {
        clientName: newLeadName.trim(),
        clientPhone: newLeadPhone.trim(),
        clientEmail: newLeadEmail.trim(),
        propertyId: newLeadSelectedPropId || undefined,
        propertyName: targetPropertyName || 'Direct Consultation Inquiry',
        location: targetLocation || 'India',
        channel: newLeadType,
        budget: newLeadBudget.trim() || 'On Request',
        message: newLeadMessage.trim() || 'Direct client inquiry recorded by admin console.',
        assignedTo: selectedAgentToAssign.split(' (')[0].trim() || 'Executive Desk'
      };

      const response = await fetch(`${API_BASE}/api/admin/dashboard/enquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        const created = data.data.enquiry;
        const newLeadItem = {
          id: `LED-${created._id.slice(-4).toUpperCase()}`,
          _id: created._id,
          origin: 'property',
          client: created.clientDetails?.name || newLeadName.trim(),
          phone: created.clientDetails?.phone || newLeadPhone.trim(),
          email: created.clientDetails?.email || newLeadEmail.trim(),
          propertyId: created.property?.submissionId || created.property?._id || 'PROP-DIR',
          propertyObj: created.property || null,
          propertyName: created.property?.title || created.propertyName || targetPropertyName || 'Direct Consultation Inquiry',
          location: [created.property?.locality, created.property?.city].filter(Boolean).join(', ') || created.location || targetLocation || 'India',
          type: created.channel || newLeadType,
          budget: created.budget || newLeadBudget.trim() || 'On Request',
          date: 'Today',
          rawDate: Date.now(),
          status: 'Pending',
          assignedTo: created.assignedTo || 'Executive Desk',
          rawMsg: created.message || 'Direct client inquiry recorded.',
          notes: created.notes || [{ date: 'Today', text: 'Inquiry logged by admin console.', author: 'Admin' }]
        };

        setLeads(prev => [newLeadItem, ...prev]);
        setIsAddLeadModalOpen(false);
        setNewLeadName('');
        setNewLeadPhone('');
        setNewLeadEmail('');
        setNewLeadSelectedPropId('');
        setNewLeadPropertyName('');
        setNewLeadLocation('');
        setNewLeadBudget('');
        setNewLeadMessage('');
        showToast('New lead inquiry recorded successfully in database');
      } else {
        showToast(data.message || 'Failed to create lead on server', 'error');
      }
    } catch (err) {
      console.error('Error creating lead:', err);
      showToast('Network error while recording lead', 'error');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  // Filtered Leads calculation
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        l.client.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        l.propertyName.toLowerCase().includes(q) ||
        (l.propertyId && l.propertyId.toLowerCase().includes(q)) ||
        (l.location && l.location.toLowerCase().includes(q));

      const matchesType = selectedTypeFilter === 'All' || 
        l.type.toLowerCase().includes(selectedTypeFilter.toLowerCase());

      const matchesLocation = selectedLocationFilter === 'All' || 
        (l.location && l.location.toLowerCase().includes(selectedLocationFilter.toLowerCase()));

      const matchesStatus = selectedStatusFilter === 'All' || 
        l.status.toLowerCase() === selectedStatusFilter.toLowerCase();

      return matchesSearch && matchesType && matchesLocation && matchesStatus;
    });
  }, [leads, searchTerm, selectedTypeFilter, selectedLocationFilter, selectedStatusFilter]);

  // Clean Badge Configs
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
      case 'completed':
      case 'accepted':
        return {
          pill: 'bg-emerald-50/90 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
          dot: 'bg-emerald-500'
        };
      case 'contacted':
        return {
          pill: 'bg-sky-50/90 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200 dark:border-sky-800/40',
          dot: 'bg-sky-500'
        };
      case 'cancelled':
      case 'rejected':
        return {
          pill: 'bg-rose-50/90 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/40',
          dot: 'bg-rose-500'
        };
      case 'pending':
      default:
        return {
          pill: 'bg-amber-50/90 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
          dot: 'bg-amber-500'
        };
    }
  };

  const getChannelBadge = (type) => {
    if (type?.toLowerCase().includes('whatsapp')) {
      return { label: 'WhatsApp', color: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40' };
    }
    if (type?.toLowerCase().includes('visit')) {
      return { label: 'Site Visit', color: 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/40' };
    }
    if (type?.toLowerCase().includes('call')) {
      return { label: 'Call Back', color: 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40' };
    }
    if (type?.toLowerCase().includes('developer')) {
      return { label: 'Builder Desk', color: 'bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/40' };
    }
    return { label: 'Portal Form', color: 'bg-orange-50 text-orange-700 border-orange-200/60 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/40' };
  };

  return (
    <div className="w-full space-y-4">

      {/* Floating Feedback Alert */}
      {feedbackMsg && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border animate-in slide-in-from-bottom duration-200 ${
          feedbackMsg.type === 'error'
            ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-800'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-800'
        }`}>
          {feedbackMsg.type === 'error' ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}
      
      {/* ─── 4 POLISHED KPI CARDS WITH HOVER LIFT & GLOW ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {[
          { key: 'total', title: 'Total Inquiries', subtitle: 'Live customer leads', icon: TrendingUp, count: leads.length, unit: 'Real Leads' },
          { key: 'site_visits', title: 'Site Visits Booked', subtitle: 'Scheduled buyer tours', icon: CalendarDays, count: leads.filter(l => l.type?.toLowerCase().includes('visit')).length, unit: 'Walkthroughs' },
          { key: 'in_progress', title: 'Pending Follow-up', subtitle: 'Actionable response queue', icon: Clock, count: leads.filter(l => l.status?.toLowerCase() === 'pending').length, unit: 'Pending' },
          { key: 'resolved', title: 'Resolved Deals', subtitle: 'Closed tours & agreements', icon: CheckCircle2, count: leads.filter(l => l.status?.toLowerCase() === 'resolved' || l.status?.toLowerCase() === 'accepted').length, unit: 'Resolved' }
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="group relative p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-1 select-none flex flex-col justify-between overflow-hidden"
            >
              {/* Top Accent Gradient Glow Line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

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

                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[var(--bg-muted)] text-[var(--text-muted)] group-hover:scale-110 group-hover:text-brand group-hover:bg-brand/10 transition-all duration-300">
                  <Icon size={16} strokeWidth={1.8} />
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-[var(--border)]/70 flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)] truncate transition-colors group-hover:text-[var(--text-primary)]">
                  {card.subtitle}
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live DB
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── MAIN MASTER CONTAINER ─── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xs overflow-hidden transition-all duration-200">
        
        {/* Header Toolbar */}
        <div className="p-3 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-2.5 bg-[var(--bg-surface)]">
          
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('leads')}
              className={`h-8 px-2.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                activeTab === 'leads'
                  ? 'bg-brand text-white font-semibold shadow-xs shadow-brand/25 scale-[1.02]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
              }`}
            >
              <span>All Inquiries</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold transition-colors ${
                activeTab === 'leads' ? 'bg-white/25 text-white' : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
              }`}>
                {filteredLeads.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('buyer_needs')}
              className={`h-8 px-2.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                activeTab === 'buyer_needs'
                  ? 'bg-brand text-white font-semibold shadow-xs shadow-brand/25 scale-[1.02]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
              }`}
            >
              <span>Buyer Needs & Matches</span>
            </button>
          </div>

          {/* Right Controls: Filters, Search, Refresh, Add */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Search Input */}
            <div className="relative w-40 sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
              <input
                type="text"
                placeholder="Search client, phone, prop..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 pl-8 pr-6 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 focus:bg-[var(--bg-surface)] placeholder:text-[var(--text-muted)] transition-all duration-200"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 hover:scale-110 transition-all cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Dynamic Locations Filter */}
            <select
              value={selectedLocationFilter}
              onChange={(e) => setSelectedLocationFilter(e.target.value)}
              className="h-8 px-2 bg-[var(--bg-muted)] text-xs font-medium text-[var(--text-primary)] rounded-lg border border-[var(--border)] hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 cursor-pointer shrink-0 transition-all duration-200 max-w-[140px] truncate"
            >
              <option value="All">All Locations</option>
              {dynamicLocations.filter(l => l !== 'All').map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            {/* Channel Type Filter */}
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="h-8 px-2 bg-[var(--bg-muted)] text-xs font-medium text-[var(--text-primary)] rounded-lg border border-[var(--border)] hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 cursor-pointer shrink-0 transition-all duration-200"
            >
              <option value="All">All Channels</option>
              <option value="Site Visit">Site Visit</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Call Back">Call Back</option>
              <option value="Portal Form">Portal Form</option>
              <option value="Developer Consultation">Builder Desk</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="h-8 px-2 bg-[var(--bg-muted)] text-xs font-medium text-[var(--text-primary)] rounded-lg border border-[var(--border)] hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 cursor-pointer shrink-0 transition-all duration-200"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Contacted">Contacted</option>
              <option value="Resolved">Resolved</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Refresh Live Button */}
            <button
              type="button"
              onClick={() => fetchLeads(true)}
              disabled={isRefreshing}
              title="Refresh Real Data"
              className="w-8 h-8 rounded-lg text-xs font-semibold bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-brand hover:border-brand/40 border border-[var(--border)] transition-all flex items-center justify-center shrink-0 cursor-pointer active:scale-95 disabled:opacity-60"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-brand' : ''} />
            </button>

            {/* New Inquiry Button */}
            <button
              type="button"
              onClick={() => setIsAddLeadModalOpen(true)}
              className="h-8 px-2.5 rounded-lg text-xs font-semibold bg-brand text-white hover:bg-brand-dark transition-all duration-150 flex items-center gap-1 shrink-0 cursor-pointer shadow-xs hover:shadow-sm hover:shadow-brand/25 active:scale-95"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">New Inquiry</span>
            </button>
          </div>

        </div>

        {/* ─── TAB 1: ALL INQUIRIES LIST (100% REAL DATA, FLUID LAYOUT) ─── */}
        {activeTab === 'leads' ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-muted)]/50">
                  <th className="py-2.5 px-3 align-middle whitespace-nowrap">Lead ID</th>
                  <th className="py-2.5 px-3 align-middle">Client Name</th>
                  <th className="py-2.5 px-3 align-middle">Interested Property</th>
                  <th className="py-2.5 px-3 align-middle">Location</th>
                  <th className="py-2.5 px-3 align-middle">Channel</th>
                  <th className="py-2.5 px-3 align-middle">Assigned Desk / Agent</th>
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
                        <p className="text-xs font-medium">Fetching real leads from database...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-[var(--text-muted)]">
                      <div className="flex flex-col items-center justify-center space-y-2 animate-in fade-in duration-200">
                        <div className="w-10 h-10 rounded-full bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)]">
                          <Search size={18} />
                        </div>
                        <p className="font-semibold text-xs text-[var(--text-primary)]">
                          {leads.length === 0 ? 'No inquiry leads in database yet' : 'No matching inquiries found'}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] max-w-sm">
                          {leads.length === 0 
                            ? 'Client property inquiries and scheduled site visits submitted across the portal will automatically appear here in real time.'
                            : 'Try adjusting your search query, location filter, channel, or status selection.'}
                        </p>
                        {leads.length === 0 ? (
                          <button
                            type="button"
                            onClick={() => setIsAddLeadModalOpen(true)}
                            className="mt-2 h-7 px-3 bg-brand text-white rounded-md text-xs font-semibold hover:bg-brand-dark transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Plus size={13} /> Log First Inquiry
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchTerm('');
                              setSelectedTypeFilter('All');
                              setSelectedLocationFilter('All');
                              setSelectedStatusFilter('All');
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
                  filteredLeads.map((lead) => {
                    const statusCfg = getStatusBadge(lead.status);
                    const channelCfg = getChannelBadge(lead.type);

                    return (
                      <tr
                        key={lead._id}
                        onClick={() => setSelectedLead(lead)}
                        className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors duration-150 cursor-pointer"
                      >
                        {/* 1. Lead ID */}
                        <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                          <span className="font-mono text-[11px] font-semibold text-[var(--text-primary)] group-hover:text-brand transition-colors duration-150">
                            {lead.id}
                          </span>
                        </td>

                        {/* 2. Client Name & Phone */}
                        <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                          <div className="leading-tight">
                            <p className="font-semibold text-[var(--text-primary)] group-hover:text-brand transition-colors duration-150">
                              {lead.client}
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                              {lead.phone}
                            </p>
                          </div>
                        </td>

                        {/* 3. Interested Property (Clickable to preview real property) */}
                        <td className="py-2.5 px-3 align-middle">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPropertyModal(lead.propertyId, lead.propertyName, lead);
                            }}
                            className="group/prop text-left inline-flex items-center gap-1.5 hover:text-brand transition-colors max-w-[210px] cursor-pointer"
                            title="Click to view real property specs"
                          >
                            <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-[var(--bg-muted)] text-[var(--text-muted)] group-hover/prop:bg-brand/10 group-hover/prop:text-brand shrink-0 border border-[var(--border)]">
                              {lead.propertyId ? String(lead.propertyId).slice(-6).toUpperCase() : 'PROP'}
                            </span>
                            <span className="font-medium text-[var(--text-primary)] group-hover/prop:text-brand truncate">
                              {lead.propertyName}
                            </span>
                          </button>
                        </td>

                        {/* 4. Location */}
                        <td className="py-2.5 px-3 align-middle">
                          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                            <MapPin size={11} className="shrink-0 text-slate-400 group-hover:text-brand transition-colors duration-200" />
                            <span className="truncate max-w-[130px]" title={lead.location}>
                              {lead.location}
                            </span>
                          </div>
                        </td>

                        {/* 5. Channel Badge */}
                        <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${channelCfg.color}`}>
                            {channelCfg.label}
                          </span>
                        </td>

                        {/* 6. Assigned Agent */}
                        <td className="py-2.5 px-3 align-middle whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleAssignLead(lead)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-[var(--text-primary)] bg-[var(--bg-muted)] hover:bg-brand/10 hover:border-brand/30 hover:text-brand border border-[var(--border)] transition-all duration-150 cursor-pointer active:scale-95"
                            title="Click to re-route or assign specialist"
                          >
                            <UserCheck size={11} className="text-brand shrink-0" />
                            <span>{lead.assignedTo || 'Assign Agent'}</span>
                          </button>
                        </td>

                        {/* 7. Status */}
                        <td className="py-2.5 px-3 align-middle text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border shadow-2xs ${statusCfg.pill}`}>
                            <span className="relative flex h-1.5 w-1.5 shrink-0">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusCfg.dot}`}></span>
                              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${statusCfg.dot}`}></span>
                            </span>
                            <span>{lead.status}</span>
                          </span>
                        </td>

                        {/* 8. Actions */}
                        <td className="py-2.5 px-3 align-middle text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1">
                            {/* Call Trigger */}
                            {lead.phone && lead.phone !== 'N/A' && (
                              <a
                                href={`tel:${lead.phone}`}
                                title={`Call ${lead.client}`}
                                className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-[var(--border)] transition-all duration-150 cursor-pointer active:scale-90 shadow-2xs"
                              >
                                <Phone size={12} />
                              </a>
                            )}

                            {/* WhatsApp Trigger */}
                            {lead.phone && lead.phone !== 'N/A' && (
                              <a
                                href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Chat on WhatsApp"
                                className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-[var(--border)] transition-all duration-150 cursor-pointer active:scale-90 shadow-2xs"
                              >
                                <MessageCircle size={12} />
                              </a>
                            )}

                            {/* Inspect Lead Eye Icon */}
                            <button
                              type="button"
                              onClick={() => setSelectedLead(lead)}
                              title="Inspect Lead Details"
                              className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-brand hover:border-brand/40 hover:bg-brand/10 border border-[var(--border)] transition-all duration-150 cursor-pointer active:scale-90 shadow-2xs"
                            >
                              <Eye size={13} />
                            </button>

                            {/* Route Agent Icon */}
                            <button
                              type="button"
                              onClick={() => handleAssignLead(lead)}
                              title="Assign Specialist"
                              className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-brand hover:border-brand/40 hover:bg-brand/10 border border-[var(--border)] transition-all duration-150 cursor-pointer active:scale-90 shadow-2xs"
                            >
                              <UserCheck size={13} />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmLead(lead)}
                              title="Delete Lead"
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
        ) : (
          /* ─── TAB 2: BUYER NEEDS & MATCHES (REAL REQUIREMENTS CARDS) ─── */
          <div className="p-4">
            {leads.length === 0 ? (
              <div className="py-12 text-center text-[var(--text-muted)]">
                <p className="font-semibold text-xs text-[var(--text-primary)]">No buyer requirements recorded</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Buyer requirements logged via consultation forms or site requests will be displayed here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead._id}
                    className="group p-4 bg-[var(--bg-surface)] hover:bg-slate-50/80 dark:hover:bg-slate-800/40 rounded-xl border border-[var(--border)] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between border-b border-[var(--border)]/70 pb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[9px] font-semibold text-brand bg-brand/10 px-1.5 py-0.5 rounded border border-brand/20">
                              {lead.id}
                            </span>
                            <span className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-semibold border ${getChannelBadge(lead.type).color}`}>
                              {lead.type}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-[var(--text-primary)] mt-1.5">{lead.client}</h4>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/40">
                          {lead.budget}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[var(--text-muted)]">Target Location:</span>
                          <span className="font-medium text-[var(--text-primary)] flex items-center gap-1 truncate max-w-[170px]" title={lead.location}>
                            <MapPin size={10} className="text-slate-400 shrink-0" /> {lead.location}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[var(--text-muted)]">Phone:</span>
                          <span className="font-mono text-[var(--text-primary)]">{lead.phone}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[var(--text-muted)]">Assigned To:</span>
                          <button
                            type="button"
                            onClick={() => handleAssignLead(lead)}
                            className="font-medium text-brand hover:underline cursor-pointer"
                          >
                            {lead.assignedTo}
                          </button>
                        </div>
                      </div>

                      {/* Direct Inquired Property Card */}
                      <div className="p-2.5 bg-[var(--bg-muted)]/70 rounded-lg border border-[var(--border)]/80 flex items-center justify-between">
                        <div className="min-w-0 mr-2">
                          <p className="text-[11px] font-semibold text-[var(--text-primary)] truncate">{lead.propertyName}</p>
                          <span className="text-[9px] font-mono text-[var(--text-muted)]">
                            {lead.propertyId ? String(lead.propertyId).slice(-6).toUpperCase() : 'DIRECT'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenPropertyModal(lead.propertyId, lead.propertyName, lead)}
                          className="px-2 py-1 bg-brand hover:bg-brand-dark text-white rounded-md text-[10px] font-semibold transition-all duration-150 flex items-center gap-1 shrink-0 cursor-pointer shadow-xs active:scale-95"
                        >
                          <Eye size={11} /> View Specs
                        </button>
                      </div>

                      {/* Client Query Snip */}
                      {lead.rawMsg && (
                        <div className="p-2 bg-[var(--bg-muted)]/50 rounded text-[11px] text-[var(--text-muted)] italic line-clamp-2">
                          "{lead.rawMsg}"
                        </div>
                      )}
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadge(lead.status).pill}`}>
                        <span>{lead.status}</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        {lead.phone && lead.phone !== 'N/A' && (
                          <a
                            href={`tel:${lead.phone}`}
                            className="p-1 text-[var(--text-muted)] hover:text-emerald-600 transition-colors"
                            title="Call Buyer"
                          >
                            <Phone size={13} />
                          </a>
                        )}
                        {lead.phone && lead.phone !== 'N/A' && (
                          <a
                            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-[var(--text-muted)] hover:text-emerald-600 transition-colors"
                            title="WhatsApp Buyer"
                          >
                            <MessageCircle size={13} />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedLead(lead)}
                          className="px-2 py-1 text-[11px] font-medium text-[var(--text-primary)] hover:text-brand bg-[var(--bg-muted)] hover:bg-brand/10 rounded border border-[var(--border)] cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Clean Aligned Footer */}
        <div className="p-2 px-3.5 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-muted)] bg-[var(--bg-surface)]">
          <span>Showing <strong className="text-[var(--text-primary)] font-semibold">{filteredLeads.length}</strong> of {leads.length} real inquiries</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Real-time connected to Database</span>
          </span>
        </div>

      </div>

      {/* ─── MODAL 1: REAL PROPERTY PREVIEW ─── */}
      {propertyPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl max-w-md w-full shadow-2xl border border-[var(--border)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header Image Preview */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-900 flex items-center justify-center">
              {propertyPreviewModal.image ? (
                <img
                  src={propertyPreviewModal.image}
                  alt={propertyPreviewModal.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-400 p-6 text-center">
                  <Building2 size={36} className="text-brand/80 mb-2" />
                  <p className="text-xs font-semibold text-slate-200">{propertyPreviewModal.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{propertyPreviewModal.location}</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4 text-white">
                <div>
                  <span className="text-[9px] font-bold bg-brand px-1.5 py-0.5 rounded uppercase">
                    {propertyPreviewModal.id ? String(propertyPreviewModal.id).slice(-6).toUpperCase() : 'PROP'}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1">{propertyPreviewModal.title}</h3>
                  <p className="text-[11px] text-white/80">{propertyPreviewModal.location}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPropertyPreviewModal(null)}
                className="absolute top-2.5 right-2.5 p-1 rounded-full bg-black/50 text-white hover:bg-black/75 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Property Body */}
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 bg-[var(--bg-muted)]/70 rounded-lg border border-[var(--border)]">
                  <span className="text-[9px] font-medium text-[var(--text-muted)] uppercase block">Listed Price</span>
                  <span className="text-xs font-bold text-emerald-600 block mt-0.5">{propertyPreviewModal.price}</span>
                </div>
                <div className="p-2.5 bg-[var(--bg-muted)]/70 rounded-lg border border-[var(--border)]">
                  <span className="text-[9px] font-medium text-[var(--text-muted)] uppercase block">Property Type</span>
                  <span className="text-xs font-medium text-[var(--text-primary)] block mt-0.5 truncate">{propertyPreviewModal.type}</span>
                </div>
                <div className="p-2.5 bg-[var(--bg-muted)]/70 rounded-lg border border-[var(--border)]">
                  <span className="text-[9px] font-medium text-[var(--text-muted)] uppercase block">Super Area</span>
                  <span className="text-xs font-medium text-[var(--text-primary)] block mt-0.5">{propertyPreviewModal.area}</span>
                </div>
                <div className="p-2.5 bg-[var(--bg-muted)]/70 rounded-lg border border-[var(--border)]">
                  <span className="text-[9px] font-medium text-[var(--text-muted)] uppercase block">Lister / Builder</span>
                  <span className="text-xs font-medium text-[var(--text-primary)] block mt-0.5 truncate">{propertyPreviewModal.builder}</span>
                </div>
              </div>

              {/* Direct Jump to Verification */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPropertyPreviewModal(null);
                    navigate('/admin/verification');
                  }}
                  className="flex-1 h-8 bg-brand hover:bg-brand-dark text-white rounded-md text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <ExternalLink size={12} /> Open Property Verification
                </button>
                <button
                  type="button"
                  onClick={() => setPropertyPreviewModal(null)}
                  className="h-8 px-3 bg-[var(--bg-muted)] hover:bg-[var(--border)] text-[var(--text-primary)] rounded-md text-xs font-medium transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─── MODAL 2: ASSIGN AREA AGENT / SPECIALIST DESK ─── */}
      {assignModalLead && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl max-w-sm w-full shadow-2xl border border-[var(--border)] p-5 space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <div>
                <span className="text-[9px] font-bold text-brand uppercase">Specialist Routing</span>
                <h3 className="text-xs font-bold text-[var(--text-primary)] mt-0.5">Assign Lead: {assignModalLead.client}</h3>
              </div>
              <button onClick={() => setAssignModalLead(null)} className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                <X size={15} />
              </button>
            </div>

            <div className="p-2.5 bg-blue-50/80 dark:bg-blue-950/40 rounded-lg border border-blue-200/60 dark:border-blue-900/40 text-xs space-y-0.5">
              <p className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                <MapPin size={11} /> Target Market: {assignModalLead.location}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">
                Assign an active specialist agent or operations desk for this inquiry.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-muted)]">Select Specialist or Operations Desk</label>
              <div className="space-y-1 max-h-52 overflow-y-auto custom-scrollbar">
                {activeAgentsList.map((agent) => {
                  const isSelected = selectedAgentToAssign.startsWith(agent.name);
                  return (
                    <button
                      key={agent.name}
                      type="button"
                      onClick={() => setSelectedAgentToAssign(`${agent.name} (${agent.region})`)}
                      className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-brand text-white border-brand shadow-xs font-semibold'
                          : 'bg-[var(--bg-muted)] border-[var(--border)] hover:border-slate-400'
                      }`}
                    >
                      <div>
                        <p className="text-xs">{agent.name}</p>
                        <p className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
                          {agent.region}
                        </p>
                      </div>
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                      }`}>
                        {agent.count} active
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setAssignModalLead(null)}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAssignment}
                className="px-3.5 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs active:scale-95"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: LOG REAL NEW INQUIRY DIRECTLY TO DATABASE ─── */}
      {isAddLeadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl max-w-lg w-full shadow-2xl border border-[var(--border)] p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Log New Lead Inquiry</h3>
                <p className="text-[11px] text-[var(--text-muted)]">Record a prospective buyer inquiry or site visit directly into MongoDB</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddLeadModalOpen(false)}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Client Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98..."
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
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
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Link Existing Property (Optional)</label>
                  <select
                    value={newLeadSelectedPropId}
                    onChange={(e) => {
                      setNewLeadSelectedPropId(e.target.value);
                      const sel = availableProperties.find(p => p._id === e.target.value);
                      if (sel) {
                        setNewLeadPropertyName(sel.title);
                        setNewLeadLocation([sel.locality, sel.city].filter(Boolean).join(', '));
                        if (sel.price) setNewLeadBudget(`₹${Number(sel.price).toLocaleString('en-IN')}`);
                      }
                    }}
                    className="w-full h-8 px-2 bg-[var(--bg-muted)] text-xs font-medium text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 cursor-pointer transition-all"
                  >
                    <option value="">-- Direct Lead / General Inquiry --</option>
                    {availableProperties.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.title} ({p.city}) - ₹{Number(p.price || 0).toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Property / Project Title</label>
                  <input
                    type="text"
                    placeholder="e.g. 3BHK Apartment or Project Name"
                    value={newLeadPropertyName}
                    onChange={(e) => setNewLeadPropertyName(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Target Location / City</label>
                  <input
                    type="text"
                    placeholder="e.g. Agra, Uttar Pradesh"
                    value={newLeadLocation}
                    onChange={(e) => setNewLeadLocation(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Inquiry Channel</label>
                  <select
                    value={newLeadType}
                    onChange={(e) => setNewLeadType(e.target.value)}
                    className="w-full h-8 px-2 bg-[var(--bg-muted)] text-xs font-medium text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 cursor-pointer transition-all"
                  >
                    <option value="Portal Form">Portal Form</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Call Back">Call Back</option>
                    <option value="Site Visit">Site Visit</option>
                    <option value="Developer Consultation">Developer Consultation</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-muted)]">Approx Budget (₹)</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹50,000 / ₹1.5 Cr"
                    value={newLeadBudget}
                    onChange={(e) => setNewLeadBudget(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-muted)]">Client Inquiry Message / Query</label>
                <textarea
                  rows={2}
                  placeholder="Enter specific client query or preferred scheduling..."
                  value={newLeadMessage}
                  onChange={(e) => setNewLeadMessage(e.target.value)}
                  className="w-full p-2 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsAddLeadModalOpen(false)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="px-3.5 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs active:scale-95 disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isSubmittingLead ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving to DB...</span>
                    </>
                  ) : (
                    <span>Record Inquiry</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: CONFIRM DELETE INQUIRY ─── */}
      {deleteConfirmLead && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl max-w-sm w-full shadow-2xl border border-[var(--border)] p-5 space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle size={20} />
              <h3 className="text-sm font-bold">Delete Lead Inquiry?</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Are you sure you want to permanently delete lead <strong className="text-[var(--text-primary)]">{deleteConfirmLead.id}</strong> ({deleteConfirmLead.client})? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setDeleteConfirmLead(null)}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteLead(deleteConfirmLead._id)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs active:scale-95"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DRAWER: INSPECT LEAD & NOTES TIMELINE ─── */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex justify-end transition-opacity duration-300">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] h-full max-w-md w-full shadow-2xl border-l border-[var(--border)] flex flex-col justify-between animate-in slide-in-from-right duration-250 ease-out">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-[var(--border)] flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded border border-brand/20">
                    {selectedLead.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border shadow-2xs ${getStatusBadge(selectedLead.status).pill}`}>
                    {selectedLead.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] mt-1.5">
                  {selectedLead.client}
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Logged on {selectedLead.date} • {selectedLead.type}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmLead(selectedLead)}
                  title="Delete Lead"
                  className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors active:scale-90"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              
              {/* Quick Status Controller */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-muted)]">Lead Status</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['Pending', 'Contacted', 'Resolved', 'Cancelled'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateStatus(selectedLead._id, st)}
                      className={`h-7 px-1.5 rounded-md text-[11px] font-medium border text-center transition-all duration-150 cursor-pointer active:scale-95 ${
                        selectedLead.status?.toLowerCase() === st.toLowerCase()
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
                  <span className="font-semibold text-[var(--text-primary)]">{selectedLead.client}</span>
                  {selectedLead.phone && selectedLead.phone !== 'N/A' && (
                    <a
                      href={`tel:${selectedLead.phone}`}
                      className="inline-flex items-center gap-1 text-[11px] text-brand hover:underline font-mono"
                    >
                      <Phone size={10} /> {selectedLead.phone}
                    </a>
                  )}
                </div>
                {selectedLead.email && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                    <Mail size={11} className="text-slate-400" />
                    <span>{selectedLead.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <MapPin size={11} className="text-slate-400" />
                  <span>{selectedLead.location}</span>
                </div>
              </div>

              {/* Inquiry Specifications */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Inquiry Specs</span>
                <div className="rounded-lg border border-[var(--border)] divide-y divide-[var(--border)] text-xs bg-[var(--bg-surface)]">
                  <div className="p-2.5 flex justify-between items-center hover:bg-[var(--bg-muted)]/40 transition-colors">
                    <span className="text-[var(--text-muted)]">Interested Property</span>
                    <button
                      type="button"
                      onClick={() => handleOpenPropertyModal(selectedLead.propertyId, selectedLead.propertyName, selectedLead)}
                      className="font-medium text-brand hover:underline flex items-center gap-1 truncate max-w-[190px] cursor-pointer"
                    >
                      <span className="truncate">{selectedLead.propertyName}</span>
                      <ExternalLink size={10} />
                    </button>
                  </div>
                  <div className="p-2.5 flex justify-between hover:bg-[var(--bg-muted)]/40 transition-colors">
                    <span className="text-[var(--text-muted)]">Buyer Budget</span>
                    <span className="font-semibold text-emerald-600">{selectedLead.budget || 'On Request'}</span>
                  </div>
                  <div className="p-2.5 flex justify-between items-center hover:bg-[var(--bg-muted)]/40 transition-colors">
                    <span className="text-[var(--text-muted)]">Assigned Specialist</span>
                    <button
                      type="button"
                      onClick={() => handleAssignLead(selectedLead)}
                      className="text-brand font-medium hover:underline text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>{selectedLead.assignedTo}</span>
                      <Edit2 size={10} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Client Query Note */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Client Message</span>
                <div className="p-2.5 bg-[var(--bg-muted)]/60 text-[var(--text-muted)] text-xs rounded-lg border-l-2 border-brand italic leading-relaxed">
                  "{selectedLead.rawMsg || 'Direct contact inquiry registered.'}"
                </div>
              </div>

              {/* Follow-up Notes Tracker */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Follow-up Notes</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                  {selectedLead.notes && selectedLead.notes.length > 0 ? (
                    selectedLead.notes.map((n, i) => (
                      <div key={i} className="p-2 bg-[var(--bg-muted)]/50 rounded-lg text-xs space-y-0.5 border border-[var(--border)]">
                        <div className="flex justify-between text-[10px] font-semibold text-[var(--text-muted)]">
                          <span>{n.author || 'Admin Remark'}</span>
                          <span>{n.date || 'Recorded'}</span>
                        </div>
                        <p className="text-[var(--text-primary)] text-[11px]">{n.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-[var(--text-muted)] italic">No follow-up notes logged yet.</p>
                  )}
                </div>

                {/* Add Note Input */}
                <div className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="Add follow-up notes..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNote();
                      }
                    }}
                    className="flex-1 h-8 px-2.5 bg-[var(--bg-muted)] text-xs font-medium text-[var(--text-primary)] rounded-md border border-[var(--border)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddNote}
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
                onClick={() => handleAssignLead(selectedLead)}
                className="flex-1 h-8 bg-[var(--bg-muted)] hover:bg-[var(--border)] text-[var(--text-primary)] rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <UserCheck size={12} />
                <span>Re-Assign</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleUpdateStatus(selectedLead._id, 'Resolved');
                }}
                className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 shadow-xs hover:shadow-emerald-600/20"
              >
                Mark Resolved
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default LeadsDashboard;
