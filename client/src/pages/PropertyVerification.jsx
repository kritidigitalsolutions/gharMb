import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, RefreshCw, MapPin, Building, Building2,
  Clock, CheckCircle2, XCircle, ChevronRight, ChevronLeft,
  Edit3, Save, X, Trash2, Image as ImageIcon,
  ShieldCheck, AlertCircle, IndianRupee, User,
  Maximize, Home, Sparkles, Filter, Eye, Check,
  ExternalLink, Layers, FileText, Phone, Mail,
  Calendar, Award, CheckSquare, Compass, ShieldAlert,
  ArrowRight, Download, FileCheck, HardHat, CheckCircle,
  HelpCircle, ArrowUpRight, CheckCheck, MessageSquare,
  FileSpreadsheet, ClipboardCheck, Info, Copy, AlertTriangle,
  PhoneCall, RotateCcw
} from 'lucide-react';

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const API_BASE = RAW_API_URL.replace(/\/+api\/?$/i, '').replace(/\/+$/, '');
const API_URL = `${API_BASE}/api`;

const QUICK_REJECTION_REASONS = [
  'Documents incomplete or missing',
  'Price or area specifications discrepancy',
  'Low quality or misleading photographs',
  'Physical address or location could not be verified',
  'RERA registration missing or unverified',
  'Duplicate property listing'
];

const STANDARD_DOCUMENT_TYPES = [
  { key: 'identityProof', label: 'Identity / PAN Proof' },
  { key: 'reraCertificate', label: 'RERA Registration Certificate' },
  { key: 'electricityBill', label: 'Electricity / Utility Bill' },
  { key: 'taxReceipt', label: 'Property Tax Receipt' },
  { key: 'saleDeed', label: 'Title Deed / Sale Deed' },
  { key: 'khataCertificate', label: 'Khata / Mutation Certificate' },
  { key: 'encumbranceCertificate', label: 'Encumbrance Certificate (EC)' }
];

const PropertyVerification = () => {
  // --- Core States ---
  const [activePipeline, setActivePipeline] = useState('properties'); // 'properties' | 'projects'
  const [properties, setProperties] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  // Navigation & Tabs inside detail pane
  const [activeDetailTab, setActiveDetailTab] = useState('specs'); // 'specs' | 'docs' | 'audit'

  // Filters & Category
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL'); // ALL, Residential, Commercial, Land
  const [statusFilter, setStatusFilter] = useState('Pending'); // Default to Pending for efficient workflow!
  const [conditionFilter, setConditionFilter] = useState('All');

  // Selection & Editing
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Modals (Shown ONLY when explicitly needed!)
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRejectReason, setSelectedRejectReason] = useState(QUICK_REJECTION_REASONS[0]);
  const [customRejectNote, setCustomRejectNote] = useState('');
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // In-app Toast Notification (Non-blocking replacement for browser alerts)
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' | 'info' }
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  // Lightbox Modal state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Review checklist state
  const [reviewChecklist, setReviewChecklist] = useState({
    priceValid: false,
    photosApproved: false,
    addressVerified: false,
    reraChecked: false,
    amenitiesConfirmed: false
  });

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen || !selectedItem) return;
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') {
        setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : selectedItem.images.length - 1));
      }
      if (e.key === 'ArrowRight') {
        setActiveImageIndex((prev) => (prev < selectedItem.images.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, selectedItem]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // Helper to format currency
  const formatCurrency = (val) => {
    if (!val || isNaN(val)) return '0';
    const num = Number(val);
    if (num >= 10000000) return `${(num / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(2).replace(/\.00$/, '')} L`;
    return num.toLocaleString('en-IN');
  };

  // Helper to copy text to clipboard
  const copyToClipboard = (text, label) => {
    if (!text || text === 'N/A') return;
    navigator.clipboard?.writeText(text);
    showToast(`${label} copied to clipboard!`, 'info');
  };

  // Map Backend Property to UI model — 100% real data, no hardcoded fallbacks
  const mapPropertyToUi = (p) => {
    // Only use real uploaded images; empty array if none uploaded yet
    const images = Array.isArray(p.images) && p.images.length > 0 ? p.images : [];

    const carpet = Number(p.carpetArea) || 0;
    const priceNum = Number(p.price) || 0;
    const pricePerSqFt = carpet > 0 && priceNum > 0
      ? `₹${Math.round(priceNum / carpet).toLocaleString('en-IN')}/sq.ft`
      : 'N/A';

    return {
      _id: p._id,
      id: p.submissionId || `PROP-${p._id.slice(-4).toUpperCase()}`,
      title: p.title || 'Untitled Property',
      category: p.category || 'Residential',
      subCategory: p.propertyType || '',
      // Configuration from real bedrooms & propertyType fields
      configuration: [
        p.bedrooms ? `${p.bedrooms} BHK` : null,
        p.bathrooms ? `${p.bathrooms} Bath` : null,
        p.propertyType || null
      ].filter(Boolean).join(' · ') || p.propertyType || 'N/A',
      listingFor: p.listingFor || 'N/A',
      ownerName: p.owner?.companyName || p.owner?.name || 'N/A',
      ownerRole: p.listingAs || (p.owner?.role === 'builder' ? 'Builder' : p.owner?.role === 'agent' ? 'Agent' : 'Owner'),
      ownerPhone: p.owner?.phone || 'N/A',
      ownerEmail: p.owner?.email || 'N/A',
      ownerVerified: p.owner?.isVerified || false,
      location: [
        p.fullAddress,
        p.locality ? `${p.locality},` : null,
        p.city,
        p.pincode ? `- ${p.pincode}` : null
      ].filter(Boolean).join(' ').trim() || 'Location not specified',
      locality: p.locality || '',
      city: p.city || '',
      pincode: p.pincode || '',
      price: formatCurrency(p.price),
      priceVal: priceNum,
      pricePerSqFt,
      // Real maintenance charges from DB
      maintenanceCharges: p.maintenanceCharges > 0 ? `₹${Number(p.maintenanceCharges).toLocaleString('en-IN')}/mo` : 'N/A',
      // Real security deposit from DB — no hardcoded default
      tokenAmount: p.securityDeposit > 0 ? `₹${Number(p.securityDeposit).toLocaleString('en-IN')}` : 'N/A',
      area: p.builtUpArea ? `${p.builtUpArea} sq.ft` : p.carpetArea ? `${p.carpetArea} sq.ft` : 'N/A',
      carpetArea: p.carpetArea ? `${p.carpetArea} sq.ft` : 'N/A',
      // Real age/condition from DB
      condition: p.ageOfProperty || 'N/A',
      possessionDate: p.availableFrom || p.ageOfProperty || 'N/A',
      floorInfo: p.floorNo ? `Floor ${p.floorNo}${p.totalFloors ? ` of ${p.totalFloors}` : ''}` : 'N/A',
      // Real facing direction — no fallback
      facing: p.facingDirection ? `${p.facingDirection} Facing` : 'N/A',
      furnishing: p.furnishing || 'N/A',
      parking: p.parking || 'N/A',
      reraNumber: p.propertyDocuments?.reraCertificate || '',
      reraStatus: p.approvalStatus === 'approved' ? 'Verified' : 'Pending Verification',
      // Real amenities only — no dummy fallback array
      amenities: Array.isArray(p.amenities) ? p.amenities : [],
      preferredTenants: Array.isArray(p.preferredTenants) ? p.preferredTenants : [],
      brokerageFree: p.brokerageFree || false,
      rentNegotiable: p.rentNegotiable || false,
      noticePeriod: p.noticePeriod || 'N/A',
      petsAllowed: p.petsAllowed || false,
      status: p.approvalStatus === 'approved' ? 'Approved' : p.approvalStatus === 'rejected' ? 'Rejected' : 'Pending',
      approvalStatus: p.approvalStatus || 'pending',
      rejectionReason: p.rejectionReason || '',
      isLive: p.isLive || false,
      listingTier: p.listingTier || 'Standard',
      submittedDate: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
      images,
      propertyDocuments: p.propertyDocuments || {},
      documents: Array.isArray(p.documents) ? p.documents : [],
      description: p.description || '',
      // Commercial-specific real fields — no hardcoded strings
      commercialTerms: {
        lockInPeriod: p.lockInPeriod || 'N/A',
        securityDeposit: p.securityDeposit > 0 ? `₹${Number(p.securityDeposit).toLocaleString('en-IN')}` : 'N/A',
        powerLoad: p.powerLoad ? `${p.powerLoad} kW` : 'N/A',
        frontage: p.frontage ? `${p.frontage} ft` : 'N/A',
        ceilingHeight: p.ceilingHeight || 'N/A',
        camIncluded: p.camIncluded || 'N/A',
        rentEscalation: p.rentEscalationPercentage ? `${p.rentEscalationPercentage}% p.a.` : 'N/A'
      },
      // Analytics from DB
      viewsCount: p.viewsCount || 0,
      shortlistedCount: p.shortlistedCount || 0,
      inquiriesCount: p.inquiriesCount || 0,
      itemType: 'property'
    };
  };

  // Map Backend Project to UI model — 100% real data, no hardcoded fallbacks
  const mapProjectToUi = (p) => {
    // Only use real uploaded project photos; empty array if none
    const images = Array.isArray(p.projectPhotos) && p.projectPhotos.length > 0 ? p.projectPhotos : [];

    // Price from real BHK configurations, no hardcoded fallback
    const firstBhk = Array.isArray(p.bhkConfigurations) && p.bhkConfigurations.length > 0 ? p.bhkConfigurations[0] : null;
    const priceDisplay = firstBhk?.minPrice > 0
      ? `${formatCurrency(firstBhk.minPrice)} onwards`
      : 'Price on Request';

    return {
      _id: p._id,
      id: p.submissionId || `PRJ-${p._id.slice(-4).toUpperCase()}`,
      title: p.projectName || 'Untitled Project',
      category: p.projectType || 'Residential',
      subCategory: p.projectType || 'Project',
      // Real towers & units — no hardcoded fallback string
      configuration: [
        p.towers ? `${p.towers} Tower${p.towers > 1 ? 's' : ''}` : null,
        p.totalUnits ? `${p.totalUnits} Units` : null,
        p.floors ? `${p.floors} Floors` : null
      ].filter(Boolean).join(' · ') || 'N/A',
      ownerName: p.developerName || p.developer?.companyName || p.developer?.name || 'N/A',
      ownerRole: 'Builder / Developer',
      ownerPhone: p.developer?.phone || 'N/A',
      ownerEmail: p.developer?.email || 'N/A',
      ownerVerified: p.developer?.isVerified || false,
      location: [
        p.fullAddress,
        p.locality ? `${p.locality},` : null,
        p.city,
        p.pincode ? `- ${p.pincode}` : null
      ].filter(Boolean).join(' ').trim() || 'Location not specified',
      locality: p.locality || '',
      city: p.city || '',
      pincode: p.pincode || '',
      price: priceDisplay,
      priceVal: firstBhk?.minPrice || 0,
      pricePerSqFt: firstBhk?.carpetArea && firstBhk?.minPrice
        ? `₹${Math.round(firstBhk.minPrice / firstBhk.carpetArea).toLocaleString('en-IN')}/sq.ft`
        : 'N/A',
      maintenanceCharges: 'N/A',
      // No hardcoded token amount for projects
      tokenAmount: 'N/A',
      area: p.openSpacePercentage > 0 ? `${p.openSpacePercentage}% Open Area` : 'N/A',
      carpetArea: firstBhk?.carpetArea ? `${firstBhk.carpetArea} sq.ft onwards` : 'N/A',
      // Real project status from DB
      condition: p.projectStatus || 'N/A',
      possessionDate: p.possessionDate || 'N/A',
      floorInfo: p.floors || 'N/A',
      // No hardcoded 'Vastu Compliant' — from real field
      facing: p.vastuCompliant ? 'Vastu Compliant' : 'N/A',
      furnishing: 'N/A',
      parking: 'N/A',
      // Real RERA number from DB — no 'Pending RERA' fallback
      reraNumber: p.reraProjectNumber || '',
      reraExpiryDate: p.reraExpiryDate || 'N/A',
      launchDate: p.launchDate || 'N/A',
      reraStatus: p.approvalStatus === 'approved' ? 'Verified' : 'Pending Verification',
      // Real amenities only — no dummy fallback array
      amenities: Array.isArray(p.amenities) ? p.amenities : [],
      nearbyLandmarks: Array.isArray(p.nearbyLandmarks) ? p.nearbyLandmarks : [],
      status: p.approvalStatus === 'approved' ? 'Approved' : p.approvalStatus === 'rejected' ? 'Rejected' : 'Pending',
      approvalStatus: p.approvalStatus || 'pending',
      rejectionReason: p.rejectionReason || '',
      isLive: p.isLive || false,
      submittedDate: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
      images,
      bhkConfigurations: Array.isArray(p.bhkConfigurations) ? p.bhkConfigurations : [],
      masterPlanUrl: p.masterPlanUrl || null,
      floorPlanUrl: p.floorPlanUrl || null,
      brochureUrl: p.brochureUrl || null,
      projectWebsite: p.projectWebsite || null,
      projectTagline: p.projectTagline || '',
      description: p.shortDescription || '',
      // Analytics from DB
      viewsCount: p.viewsCount || 0,
      inquiriesCount: p.inquiriesCount || 0,
      itemType: 'project'
    };
  };

  // --- Fetch All Data from Backend ---
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const propRes = await fetch(`${API_URL}/admin/properties`, {
        headers: getAuthHeaders()
      });
      const propData = await propRes.json();
      if (propRes.ok && propData.status === 'success') {
        const mapped = (propData.data?.properties || []).map(mapPropertyToUi);
        setProperties(mapped);
      }

      const projRes = await fetch(`${API_URL}/admin/projects`, {
        headers: getAuthHeaders()
      });
      const projData = await projRes.json();
      if (projRes.ok && projData.status === 'success') {
        const mappedProj = (projData.data?.projects || []).map(mapProjectToUi);
        setProjects(mappedProj);
      }
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Error fetching admin moderation data:', err);
      setError('Could not connect to backend server. Please verify backend is running on port 5001.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
    showToast('Listing pipeline refreshed successfully.', 'info');
  };

  const switchPipeline = (pipeline) => {
    if (isEditing) {
      showToast('Please save or cancel your corrections before switching.', 'info');
      return;
    }
    setActivePipeline(pipeline);
    setSelectedItem(null);
    setFormData(null);
  };

  // --- Handlers ---
  const handleSelectItem = (item) => {
    if (!item) {
      setSelectedItem(null);
      setFormData(null);
      return;
    }
    setSelectedItem(item);
    setFormData({ ...item });
    setIsEditing(false);
    setRemarks('');
    setReviewChecklist({
      priceValid: item.status === 'Approved',
      photosApproved: item.status === 'Approved',
      addressVerified: item.status === 'Approved',
      reraChecked: item.status === 'Approved',
      amenitiesConfirmed: item.status === 'Approved'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckAll = () => {
    const allChecked = Object.values(reviewChecklist).every(Boolean);
    const nextState = !allChecked;
    setReviewChecklist({
      priceValid: nextState,
      photosApproved: nextState,
      addressVerified: nextState,
      reraChecked: nextState,
      amenitiesConfirmed: nextState
    });
    showToast(nextState ? 'All 5 checklist parameters verified.' : 'Checklist reset.', 'info');
  };

  // Save Edits to backend (NO browser alerts)
  const saveEdits = async () => {
    if (!formData.title?.trim()) {
      showToast('Listing title cannot be empty.', 'error');
      return;
    }
    if (!formData.priceVal && !formData.price) {
      showToast('Please provide a valid listing price.', 'error');
      return;
    }
    if (!formData.location?.trim()) {
      showToast('Listing address / location is required.', 'error');
      return;
    }

    try {
      const endpoint = formData.itemType === 'project'
        ? `${API_URL}/projects/${formData._id}`
        : `${API_URL}/properties/${formData._id}`;

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: formData.title,
          price: formData.priceVal || formData.price,
          fullAddress: formData.location,
          city: formData.city,
          locality: formData.locality,
          category: formData.category,
          condition: formData.condition,
          furnishing: formData.furnishing,
          reraNumber: formData.reraNumber
        })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setIsEditing(false);
        showToast(`Listing ${formData.id} updated successfully!`, 'success');
        await fetchData();

        const updated = formData.itemType === 'project'
          ? (data.data?.project ? mapProjectToUi(data.data.project) : null)
          : (data.data?.property ? mapPropertyToUi(data.data.property) : null);
        if (updated) {
          setSelectedItem(updated);
          setFormData(updated);
        }
      } else {
        showToast(data.message || 'Failed to save edits to server.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while saving edits.', 'error');
    }
  };

  // Real-time Update Status (Approve / Reject / Reset) in MongoDB (NO browser alerts)
  const updateStatus = async (newStatus, explicitReason = null) => {
    if (!selectedItem) return;

    if (isEditing) {
      showToast('Please save or cancel your corrections before updating status.', 'info');
      return;
    }

    setIsSubmittingAction(true);
    const apiStatus = newStatus === 'Approved' ? 'approved' : newStatus === 'Rejected' ? 'rejected' : 'pending';
    const activeRemarks = explicitReason || remarks || (newStatus === 'Rejected' ? selectedRejectReason : 'Verified & Approved by Admin');

    try {
      const endpoint = selectedItem.itemType === 'project'
        ? `${API_URL}/admin/projects/${selectedItem._id}/status`
        : `${API_URL}/admin/properties/${selectedItem._id}/status`;

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          approvalStatus: apiStatus,
          rejectionReason: activeRemarks
        })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setRemarks('');
        setShowRejectModal(false);
        setCustomRejectNote('');

        const actionLabel = newStatus === 'Approved' 
          ? 'approved and published live! 🏡' 
          : newStatus === 'Rejected' 
          ? 'marked as rejected.' 
          : 'reset to pending audit.';
        showToast(`Listing ${selectedItem.id} ${actionLabel}`, newStatus === 'Approved' ? 'success' : newStatus === 'Rejected' ? 'error' : 'info');

        await fetchData();

        if (selectedItem.itemType === 'project') {
          const updated = (data.data?.project) ? mapProjectToUi(data.data.project) : null;
          if (updated) {
            setSelectedItem(updated);
            setFormData(updated);
          }
        } else {
          const updated = (data.data?.property) ? mapPropertyToUi(data.data.property) : null;
          if (updated) {
            setSelectedItem(updated);
            setFormData(updated);
          }
        }
      } else {
        showToast(data.message || 'Failed to update approval status.', 'error');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Connection error while updating status.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Permanently Delete from DB (Controlled via in-app confirmation modal)
  const confirmDelete = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);

    try {
      const endpoint = selectedItem.itemType === 'project'
        ? `${API_URL}/admin/projects/${selectedItem._id}`
        : `${API_URL}/admin/properties/${selectedItem._id}`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const deletedId = selectedItem.id;
        setShowDeleteModal(false);
        setSelectedItem(null);
        setFormData(null);
        showToast(`Listing ${deletedId} permanently deleted from database.`, 'success');
        await fetchData();
      } else {
        const data = await res.json();
        showToast(data.message || 'Failed to delete listing.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to server while deleting.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const openLightbox = (index) => {
    setActiveImageIndex(index);
    setLightboxOpen(true);
  };

  // Determine active item list
  const currentList = activePipeline === 'properties' ? properties : projects;

  // Filtering Logic
  const filteredItems = useMemo(() => {
    return currentList.filter(p => {
      const matchesSearch = 
        !searchQuery.trim() ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.city.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = activeCategory === 'ALL' || p.category === activeCategory;
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchesCondition = conditionFilter === 'All' || p.condition.toLowerCase().includes(conditionFilter.toLowerCase());

      return matchesSearch && matchesCategory && matchesStatus && matchesCondition;
    });
  }, [currentList, searchQuery, activeCategory, statusFilter, conditionFilter]);

  // Auto-select first item when list loads or changes to avoid empty right pane
  useEffect(() => {
    if (filteredItems.length > 0) {
      const isStillSelected = selectedItem && filteredItems.some(i => i._id === selectedItem._id);
      if (!isStillSelected) {
        const firstPending = filteredItems.find(i => i.status === 'Pending') || filteredItems[0];
        handleSelectItem(firstPending);
      }
    } else {
      setSelectedItem(null);
      setFormData(null);
    }
  }, [filteredItems]);

  const categories = ['ALL', 'Residential', 'Commercial', 'Land'];

  // Global counts for quick moderation filter pills
  const totalPending = currentList.filter(p => p.status === 'Pending').length;
  const totalApproved = currentList.filter(p => p.status === 'Approved').length;
  const totalRejected = currentList.filter(p => p.status === 'Rejected').length;
  const totalAll = currentList.length;

  return (
    <div className="space-y-3.5 pb-8 relative">
      
      {/* ─── 01. UNIFIED, HIGH-EFFICIENCY CONTROL STRIP (Compact & Action-Oriented) ─── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        
        {/* Left: Section identity + Pipeline Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand" />
            <h1 className="text-xs sm:text-[13px] font-bold tracking-tight text-[var(--text-primary)]">
              Listing Verification
            </h1>
          </div>

          <span className="text-[var(--border)]">|</span>

          {/* Properties vs Developer Projects Toggle */}
          <div className="inline-flex items-center rounded-lg bg-[var(--bg-muted)]/70 p-0.5 border border-[var(--border)] text-[11px]">
            <button
              type="button"
              onClick={() => switchPipeline('properties')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                activePipeline === 'properties'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Home size={12} className={activePipeline === 'properties' ? 'text-brand' : ''} />
              <span>Properties ({properties.length})</span>
            </button>

            <button
              type="button"
              onClick={() => switchPipeline('projects')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                activePipeline === 'projects'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Building2 size={12} className={activePipeline === 'projects' ? 'text-brand' : ''} />
              <span>Projects ({projects.length})</span>
            </button>
          </div>
        </div>

        {/* Right: Interactive Moderation Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto justify-end text-[11px]">
          <button
            type="button"
            onClick={() => setStatusFilter('Pending')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 border cursor-pointer ${
              statusFilter === 'Pending'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold shadow-2xs'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-muted)]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Needs Audit</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 font-bold">
              {totalPending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Approved')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 border cursor-pointer ${
              statusFilter === 'Approved'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold shadow-2xs'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-muted)]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Live Approved</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 font-bold">
              {totalApproved}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Rejected')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 border cursor-pointer ${
              statusFilter === 'Rejected'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 font-semibold shadow-2xs'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-muted)]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Rejected</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/15 font-bold">
              {totalRejected}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('All')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 border cursor-pointer ${
              statusFilter === 'All'
                ? 'bg-[var(--text-primary)] text-[var(--bg-surface)] border-[var(--text-primary)] font-semibold shadow-2xs'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-muted)]'
            }`}
          >
            <span>All ({totalAll})</span>
          </button>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isLoading || isRefreshing}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] border border-[var(--border)] transition-colors cursor-pointer ml-1"
            title="Refresh database records"
          >
            <RefreshCw size={12} className={isLoading || isRefreshing ? 'animate-spin text-brand' : ''} />
          </button>
        </div>

      </div>

      {/* ─── 02. CLEAN TWO-PANEL WORKBENCH CONTAINER ─── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xs overflow-hidden flex flex-col lg:flex-row h-[calc(100vh-160px)] min-h-[640px]">
        
        {/* ─── LEFT STREAM: FOCUSED LISTING LIST (360px) ─── */}
        <div className="w-full lg:w-[360px] border-b lg:border-b-0 lg:border-r border-[var(--border)] flex flex-col bg-[var(--bg-surface)] shrink-0">
          
          {/* Search & Category Filter */}
          <div className="p-3 border-b border-[var(--border)] space-y-2.5 bg-[var(--bg-surface)]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={13} />
              <input
                type="text"
                placeholder="Search ID, title, locality, submitter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7.5 pr-7 py-1.5 bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg border border-[var(--border)] focus:border-brand focus:ring-1 focus:ring-brand/20 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 rounded cursor-pointer"
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Compact Category Segment */}
            {activePipeline === 'properties' && (
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar text-[10.5px]">
                {categories.map((cat) => {
                  const count = cat === 'ALL'
                    ? properties.length
                    : properties.filter(p => p.category === cat).length;
                  const isActive = activeCategory === cat;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-brand text-white font-semibold shadow-2xs'
                          : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Listing Cards Stream */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-2">
                <RefreshCw size={16} className="animate-spin text-brand" />
                <span>Loading listings...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)] mx-auto">
                  <Filter size={14} />
                </div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">No listings match filters</p>
                <p className="text-[11px] text-[var(--text-muted)]">Try adjusting search or status criteria.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('All');
                    setActiveCategory('ALL');
                  }}
                  className="mt-1 px-3 py-1 bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] text-brand border border-brand/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredItems.map((p) => {
                const isSelected = selectedItem?._id === p._id;
                const isCommercial = p.category === 'Commercial';

                return (
                  <div
                    key={p._id}
                    onClick={() => handleSelectItem(p)}
                    className={`group relative p-2.5 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-brand/[0.04] dark:bg-brand/[0.08] border-brand/60 ring-1.5 ring-brand/30 shadow-xs hover:-translate-y-0.5 hover:shadow-md'
                        : 'bg-[var(--bg-surface)] border-[var(--border)] hover:-translate-y-0.5 hover:shadow-md hover:border-brand/40 hover:bg-[var(--bg-muted)]/50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Photo Thumbnail — only real uploaded images */}
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-[var(--border)] bg-[var(--bg-muted)] flex items-center justify-center">
                        {p.images.length > 0 ? (
                          <>
                            <img 
                              src={p.images[0]} 
                              alt={p.title} 
                              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                            <span className="absolute bottom-0.5 right-0.5 bg-black/75 backdrop-blur-xs text-white text-[7.5px] font-semibold px-1 rounded flex items-center gap-0.5">
                              <ImageIcon size={6} /> {p.images.length}
                            </span>
                          </>
                        ) : (
                          <ImageIcon size={18} className="text-[var(--text-muted)]/40" />
                        )}
                      </div>

                      {/* Content Summary */}
                      <div className="flex-1 min-w-0">
                        {/* ID + Status */}
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`text-[10px] font-mono font-bold tracking-tight transition-colors ${
                              isSelected
                                ? 'bg-brand text-white px-1.5 py-0.2 rounded shadow-2xs'
                                : 'text-brand'
                            }`}>
                              {p.id}
                            </span>
                            {isSelected && (
                              <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-brand/15 text-brand border border-brand/25 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-brand animate-pulse" />
                                <span>Inspecting</span>
                              </span>
                            )}
                          </div>

                          <span className={`text-[8.5px] font-semibold px-1.5 py-0.2 rounded uppercase tracking-wider flex items-center gap-1 shrink-0 ${
                            p.status === 'Approved'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : p.status === 'Rejected'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${
                              p.status === 'Approved' ? 'bg-emerald-500' : p.status === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
                            }`} />
                            <span>{p.status}</span>
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className={`text-xs font-semibold truncate transition-colors ${
                          isSelected ? 'text-brand' : 'text-[var(--text-primary)] group-hover:text-brand'
                        }`}>
                          {p.title}
                        </h4>

                        {/* Locality */}
                        <p className="text-[10px] text-[var(--text-muted)] truncate flex items-center gap-0.5 mt-0.5">
                          <MapPin size={9} className="shrink-0 text-[var(--text-muted)]/70" />
                          <span className="truncate">{p.location}</span>
                        </p>

                        {/* Bottom: Tags + Price + Active/Hover Indicator */}
                        <div className="flex items-center justify-between pt-1 mt-1 border-t border-[var(--border)]/50 text-[10px]">
                          <div className="flex items-center gap-1 truncate">
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-[var(--bg-muted)] text-[var(--text-subtle)]">
                              {p.ownerRole}
                            </span>
                            {isCommercial && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                Comm
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[11.5px] font-bold text-[var(--text-primary)] whitespace-nowrap">
                              ₹{p.price}
                            </span>
                            {isSelected ? (
                              <ChevronRight size={13} className="text-brand shrink-0" />
                            ) : (
                              <ChevronRight size={13} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ─── RIGHT PANE: FOCUSED WORKBENCH WITH STICKY DECISION HEADER ─── */}
        <div className="flex-1 flex flex-col bg-[var(--bg-surface)] overflow-hidden">
          {!selectedItem ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)]">
                <CheckSquare size={20} />
              </div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">Select a listing to inspect</p>
              <p className="text-[11px] text-[var(--text-muted)]">Choose any submission from the left queue.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* 1. STICKY TOP ACTION BAR (Decision Controls Right in View!) */}
              <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-surface)] shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                
                {/* Title & Key Identifier */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[11px] font-mono font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.2 rounded">
                      {formData.id}
                    </span>
                    <span className={`text-[9.5px] font-semibold px-2 py-0.2 rounded uppercase tracking-wider flex items-center gap-1 ${
                      formData.status === 'Approved'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : formData.status === 'Rejected'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${
                        formData.status === 'Approved' ? 'bg-emerald-500' : formData.status === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
                      }`} />
                      <span>{formData.status} {formData.isLive ? '· Live' : '· Unlisted'}</span>
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      Submitted {formData.submittedDate}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        name="title"
                        value={formData.title || ''}
                        onChange={handleInputChange}
                        placeholder="Listing Title..."
                        className="flex-1 px-2.5 py-1 bg-[var(--bg-muted)] text-xs font-bold text-[var(--text-primary)] border border-brand/40 rounded-lg outline-none focus:ring-1 focus:ring-brand"
                      />
                      <div className="flex items-center gap-1 shrink-0 bg-[var(--bg-muted)] px-2 py-1 rounded-lg border border-[var(--border)]">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">₹</span>
                        <input
                          type="number"
                          value={formData.priceVal || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              priceVal: val,
                              price: formatCurrency(val)
                            }));
                          }}
                          placeholder="Price..."
                          className="w-28 bg-transparent text-xs font-extrabold text-emerald-600 dark:text-emerald-400 outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2.5">
                      <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] truncate">
                        {formData.title}
                      </h2>
                      <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        ₹{formData.price}
                      </span>
                    </div>
                  )}
                </div>

                {/* Primary Moderation Action Buttons (Immediate Execution) */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {formData.status !== 'Approved' && (
                    <button
                      type="button"
                      disabled={isSubmittingAction}
                      onClick={() => updateStatus('Approved')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-98"
                    >
                      <CheckCircle2 size={13} />
                      <span>Approve & Publish</span>
                    </button>
                  )}

                  {formData.status !== 'Rejected' && (
                    <button
                      type="button"
                      disabled={isSubmittingAction}
                      onClick={() => setShowRejectModal(true)}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <XCircle size={13} />
                      <span>Reject</span>
                    </button>
                  )}

                  {formData.status !== 'Pending' && (
                    <button
                      type="button"
                      disabled={isSubmittingAction}
                      onClick={() => updateStatus('Pending')}
                      className="px-2.5 py-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded-lg text-xs font-medium border border-[var(--border)] transition-colors cursor-pointer flex items-center gap-1"
                      title="Reset status back to Pending Review"
                    >
                      <RotateCcw size={11} />
                      <span>Reset</span>
                    </button>
                  )}

                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={saveEdits}
                        className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1 shadow-2xs"
                        title="Save Corrections"
                      >
                        <Save size={13} />
                        <span>Save</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...selectedItem });
                          setIsEditing(false);
                          showToast('Corrections discarded.', 'info');
                        }}
                        className="p-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] rounded-lg transition-colors cursor-pointer"
                        title="Cancel Editing"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] rounded-lg transition-colors cursor-pointer"
                      title="Edit listing details"
                    >
                      <Edit3 size={13} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="p-1.5 text-rose-600 hover:bg-rose-500/10 border border-rose-200 dark:border-rose-900/40 rounded-lg transition-colors cursor-pointer"
                    title="Delete listing permanently"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

              </div>

              {/* 2. TAB NAVIGATION BAR (Organized Hierarchy) */}
              <div className="px-4 border-b border-[var(--border)] bg-[var(--bg-surface)] shrink-0 flex items-center gap-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveDetailTab('specs')}
                  className={`py-2 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeDetailTab === 'specs'
                      ? 'border-brand text-brand font-bold'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Home size={13} />
                  <span>Specs & Visuals</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDetailTab('docs')}
                  className={`py-2 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeDetailTab === 'docs'
                      ? 'border-brand text-brand font-bold'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <FileText size={13} />
                  <span>Documents & Lister</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDetailTab('audit')}
                  className={`py-2 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeDetailTab === 'audit'
                      ? 'border-brand text-brand font-bold'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <ClipboardCheck size={13} />
                  <span>Audit & Checklist</span>
                </button>
              </div>

              {/* 3. TAB CONTENT WORKSPACE (Clean, Scrollable, Organized) */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
                
                {/* ─── TAB 1: SPECS & VISUALS ─── */}
                {activeDetailTab === 'specs' && (
                  <div className="space-y-4">
                    
                    {/* Media Strip — Only real uploaded images, no placeholders */}
                    <div className="flex items-center gap-3">
                      {/* Featured Preview — only if images exist */}
                      {formData.images.length > 0 ? (
                        <div 
                          onClick={() => openLightbox(0)}
                          className="relative w-44 sm:w-56 aspect-video rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-muted)] shrink-0 group cursor-pointer"
                          title="Click to view full photo gallery"
                        >
                          <img 
                            src={formData.images[0]} 
                            alt="Featured" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-1.5 left-1.5 bg-brand text-white text-[8px] font-bold px-1.5 py-0.2 rounded shadow-2xs">
                            Cover
                          </span>
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye size={16} />
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-44 sm:w-56 aspect-video rounded-xl overflow-hidden border border-dashed border-[var(--border)] bg-[var(--bg-muted)]/40 shrink-0 flex flex-col items-center justify-center gap-1">
                          <ImageIcon size={22} className="text-[var(--text-muted)]/50" />
                          <span className="text-[9.5px] text-[var(--text-muted)] font-medium">No Photos Uploaded</span>
                        </div>
                      )}

                      {/* Thumbnail List — only if images exist */}
                      {formData.images.length > 0 ? (
                        <div className="flex-1 flex items-center gap-2 overflow-x-auto py-1 custom-scrollbar">
                          {formData.images.map((imgUrl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => openLightbox(idx)}
                              className="relative w-24 aspect-video rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg-muted)] shrink-0 hover:border-brand transition-all cursor-pointer"
                              title={`View Photo ${idx + 1}`}
                            >
                              <img src={imgUrl} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <span className="text-[10px] text-[var(--text-muted)] italic">Lister has not uploaded any photos yet.</span>
                        </div>
                      )}
                    </div>

                    {/* 4 Key Highlight Metric Tiles */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/30">
                        <span className="text-[9.5px] uppercase font-semibold text-[var(--text-muted)] block">Rate / Sq.Ft</span>
                        <span className="text-xs font-bold text-[var(--text-primary)] block mt-0.5">{formData.pricePerSqFt}</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/30">
                        <span className="text-[9.5px] uppercase font-semibold text-[var(--text-muted)] block">Carpet Area</span>
                        <span className="text-xs font-bold text-[var(--text-primary)] block mt-0.5">{formData.carpetArea}</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/30">
                        <span className="text-[9.5px] uppercase font-semibold text-[var(--text-muted)] block">Condition</span>
                        <span className="text-xs font-bold text-[var(--text-primary)] block mt-0.5">{formData.condition}</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/30">
                        <span className="text-[9.5px] uppercase font-semibold text-[var(--text-muted)] block">Floor & Facing</span>
                        <span className="text-xs font-bold text-[var(--text-primary)] block mt-0.5 truncate">{formData.floorInfo} · {formData.facing}</span>
                      </div>
                    </div>

                    {/* Detailed Key-Value Grid */}
                    <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-3">
                      <h3 className="text-xs font-bold text-[var(--text-primary)] flex items-center justify-between pb-2 border-b border-[var(--border)]">
                        <span>Property Attributes</span>
                        <span className="text-[10px] text-[var(--text-muted)] font-normal">{formData.category} · {formData.subCategory}</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] uppercase block">Configuration</span>
                          {isEditing ? (
                            <input
                              type="text"
                              name="configuration"
                              value={formData.configuration || ''}
                              onChange={handleInputChange}
                              className="w-full mt-1 p-1.5 bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-primary)] border border-[var(--border)] rounded focus:border-brand outline-none"
                            />
                          ) : (
                            <span className="font-semibold text-[var(--text-primary)]">{formData.configuration}</span>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] uppercase block">Furnishing Status</span>
                          {isEditing ? (
                            <select
                              name="furnishing"
                              value={formData.furnishing || 'Unfurnished'}
                              onChange={handleInputChange}
                              className="w-full mt-1 p-1.5 bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-primary)] border border-[var(--border)] rounded focus:border-brand outline-none"
                            >
                              <option value="Unfurnished">Unfurnished</option>
                              <option value="Semi-Furnished">Semi-Furnished</option>
                              <option value="Fully Furnished">Fully Furnished</option>
                            </select>
                          ) : (
                            <span className="font-semibold text-[var(--text-primary)]">{formData.furnishing}</span>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] uppercase block">Monthly Maintenance</span>
                          <span className="font-semibold text-[var(--text-primary)]">{formData.maintenanceCharges}</span>
                        </div>

                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] uppercase block">Token / Deposit</span>
                          <span className="font-semibold text-[var(--text-primary)]">{formData.tokenAmount}</span>
                        </div>

                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] uppercase block">Category & Condition</span>
                          {isEditing ? (
                            <div className="grid grid-cols-2 gap-1 mt-1">
                              <select
                                name="category"
                                value={formData.category || 'Residential'}
                                onChange={handleInputChange}
                                className="p-1 bg-[var(--bg-muted)] text-[11px] font-semibold text-[var(--text-primary)] border border-[var(--border)] rounded outline-none"
                              >
                                <option value="Residential">Residential</option>
                                <option value="Commercial">Commercial</option>
                                <option value="Land">Land</option>
                              </select>
                              <select
                                name="condition"
                                value={formData.condition || 'Ready to Move'}
                                onChange={handleInputChange}
                                className="p-1 bg-[var(--bg-muted)] text-[11px] font-semibold text-[var(--text-primary)] border border-[var(--border)] rounded outline-none"
                              >
                                <option value="Ready to Move">Ready to Move</option>
                                <option value="Under Construction">Under Construction</option>
                                <option value="Resale">Resale</option>
                              </select>
                            </div>
                          ) : (
                            <span className="font-semibold text-[var(--text-primary)]">{formData.category} ({formData.condition})</span>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] uppercase block">City & Locality</span>
                          {isEditing ? (
                            <div className="grid grid-cols-2 gap-1 mt-1">
                              <input
                                type="text"
                                name="locality"
                                placeholder="Locality"
                                value={formData.locality || ''}
                                onChange={handleInputChange}
                                className="p-1 bg-[var(--bg-muted)] text-[11px] font-semibold text-[var(--text-primary)] border border-[var(--border)] rounded outline-none"
                              />
                              <input
                                type="text"
                                name="city"
                                placeholder="City"
                                value={formData.city || ''}
                                onChange={handleInputChange}
                                className="p-1 bg-[var(--bg-muted)] text-[11px] font-semibold text-[var(--text-primary)] border border-[var(--border)] rounded outline-none"
                              />
                            </div>
                          ) : (
                            <span className="font-semibold text-[var(--text-primary)]">{formData.locality ? `${formData.locality}, ` : ''}{formData.city || 'N/A'}</span>
                          )}
                        </div>

                        <div className="sm:col-span-3">
                          <span className="text-[10px] text-[var(--text-muted)] uppercase block">Physical Address</span>
                          {isEditing ? (
                            <input 
                              type="text" 
                              name="location" 
                              value={formData.location} 
                              onChange={handleInputChange} 
                              className="w-full mt-1 p-1.5 bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-primary)] border border-[var(--border)] rounded focus:border-brand outline-none" 
                            />
                          ) : (
                            <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1 mt-0.5">
                              <MapPin size={11} className="text-brand shrink-0" />
                              <span>{formData.location}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Commercial specifics — real fields from DB only */}
                    {formData.category === 'Commercial' && (
                      <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-2">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block">
                          Commercial Lease Specifications
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-[var(--text-muted)] block">Lock-In Period</span>
                            <span className="font-semibold">{formData.commercialTerms?.lockInPeriod}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[var(--text-muted)] block">Power Load</span>
                            <span className="font-semibold">{formData.commercialTerms?.powerLoad}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[var(--text-muted)] block">Frontage</span>
                            <span className="font-semibold">{formData.commercialTerms?.frontage}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[var(--text-muted)] block">Ceiling Height</span>
                            <span className="font-semibold">{formData.commercialTerms?.ceilingHeight}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[var(--text-muted)] block">CAM Charges</span>
                            <span className="font-semibold">{formData.commercialTerms?.camIncluded}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[var(--text-muted)] block">Rent Escalation</span>
                            <span className="font-semibold">{formData.commercialTerms?.rentEscalation}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[var(--text-muted)] block">Security Deposit</span>
                            <span className="font-semibold">{formData.commercialTerms?.securityDeposit}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[var(--text-muted)] block">Parking</span>
                            <span className="font-semibold">{formData.parking}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Developer Project BHK Configurations */}
                    {formData.itemType === 'project' && Array.isArray(formData.bhkConfigurations) && formData.bhkConfigurations.length > 0 && (
                      <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-2.5">
                        <span className="text-xs font-bold text-[var(--text-primary)] block">
                          BHK Unit Plans ({formData.bhkConfigurations.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {formData.bhkConfigurations.map((bhk, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/30 space-y-0.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-brand">{bhk.bhkType}</span>
                                <span className="text-[10px] text-[var(--text-muted)]">{bhk.carpetArea} sq.ft</span>
                              </div>
                              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                {bhk.priceRangeText || `₹${formatCurrency(bhk.minPrice)} - ₹${formatCurrency(bhk.maxPrice)}`}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Confirmed Amenities — real data only, empty state if none */}
                    <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-1.5">
                      <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                        Confirmed Amenities ({formData.amenities.length})
                      </span>
                      {formData.amenities.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {formData.amenities.map((amenity, idx) => (
                            <span 
                              key={idx} 
                              className="px-2 py-0.5 bg-[var(--bg-muted)]/70 text-[10.5px] font-medium text-[var(--text-secondary)] rounded border border-[var(--border)]/70 flex items-center gap-1"
                            >
                              <Check size={9} className="text-emerald-500" />
                              <span>{amenity}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-[var(--text-muted)] italic">No amenities specified by lister.</p>
                      )}
                    </div>

                    {/* Nearby Landmarks — Projects only, real data */}
                    {formData.itemType === 'project' && Array.isArray(formData.nearbyLandmarks) && formData.nearbyLandmarks.length > 0 && (
                      <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-1.5">
                        <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                          Nearby Landmarks ({formData.nearbyLandmarks.length})
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {formData.nearbyLandmarks.map((lm, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-xs">
                              <MapPin size={10} className="text-brand shrink-0" />
                              <span className="font-medium text-[var(--text-primary)]">{lm.locationName}</span>
                              {lm.distance && <span className="text-[var(--text-muted)]">{lm.distance}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* ─── TAB 2: DOCUMENTS & LISTER COMPLIANCE ─── */}
                {activeDetailTab === 'docs' && (
                  <div className="space-y-4">
                    
                    {/* RERA Registry Card */}
                    <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                          RERA License & Registration
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                            {formData.reraNumber || 'EXEMPTED / NOT APPLICABLE'}
                          </span>
                          {formData.reraNumber && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(formData.reraNumber, 'RERA Number')}
                              className="text-[var(--text-muted)] hover:text-brand transition-colors p-0.5 cursor-pointer"
                              title="Copy RERA Number"
                            >
                              <Copy size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        formData.reraNumber
                          ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                          : 'bg-[var(--bg-muted)] text-[var(--text-muted)] border-[var(--border)]'
                      }`}>
                        {formData.reraNumber ? 'Registered' : 'Not Provided'}
                      </span>
                    </div>

                    {/* Uploaded Documents List */}
                    <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                        <h3 className="text-xs font-bold text-[var(--text-primary)]">
                          Attached Verification Documents
                        </h3>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          Click any file to review attachment
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Standard Property Documents */}
                        {STANDARD_DOCUMENT_TYPES.map((docDef) => {
                          const docUrl = formData.propertyDocuments?.[docDef.key];
                          const isUploaded = !!docUrl;

                          if (isUploaded) {
                            return (
                              <a
                                key={docDef.key}
                                href={docUrl.startsWith('http') ? docUrl : `${API_BASE}/${docUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2.5 rounded-lg border border-[var(--border)] hover:border-brand bg-[var(--bg-muted)]/20 hover:bg-[var(--bg-muted)]/60 flex items-center justify-between transition-colors group cursor-pointer"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileCheck size={14} className="text-emerald-500 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-semibold text-[var(--text-primary)] truncate">
                                      {docDef.label}
                                    </p>
                                    <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 font-medium">Uploaded & Available</span>
                                  </div>
                                </div>
                                <ArrowUpRight size={13} className="text-[var(--text-muted)] group-hover:text-brand shrink-0" />
                              </a>
                            );
                          }

                          return (
                            <div
                              key={docDef.key}
                              className="p-2.5 rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-muted)]/10 flex items-center justify-between opacity-60"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText size={14} className="text-[var(--text-muted)] shrink-0" />
                                <span className="text-[11px] text-[var(--text-muted)] truncate">{docDef.label}</span>
                              </div>
                              <span className="text-[9.5px] text-[var(--text-muted)] font-medium">Not Uploaded</span>
                            </div>
                          );
                        })}

                        {/* Project specific files */}
                        {formData.masterPlanUrl && (
                          <a
                            href={formData.masterPlanUrl.startsWith('http') ? formData.masterPlanUrl : `${API_BASE}/${formData.masterPlanUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2.5 rounded-lg border border-[var(--border)] hover:border-brand bg-[var(--bg-muted)]/20 flex items-center justify-between transition-colors group cursor-pointer"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Compass size={14} className="text-blue-500 shrink-0" />
                              <span className="text-[11px] font-semibold text-[var(--text-primary)]">Master Plan Document</span>
                            </div>
                            <ArrowUpRight size={13} className="text-[var(--text-muted)] group-hover:text-brand" />
                          </a>
                        )}

                        {formData.floorPlanUrl && (
                          <a
                            href={formData.floorPlanUrl.startsWith('http') ? formData.floorPlanUrl : `${API_BASE}/${formData.floorPlanUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2.5 rounded-lg border border-[var(--border)] hover:border-brand bg-[var(--bg-muted)]/20 flex items-center justify-between transition-colors group cursor-pointer"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Layers size={14} className="text-indigo-500 shrink-0" />
                              <span className="text-[11px] font-semibold text-[var(--text-primary)]">Unit Floor Plan</span>
                            </div>
                            <ArrowUpRight size={13} className="text-[var(--text-muted)] group-hover:text-brand" />
                          </a>
                        )}

                        {formData.brochureUrl && (
                          <a
                            href={formData.brochureUrl.startsWith('http') ? formData.brochureUrl : `${API_BASE}/${formData.brochureUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2.5 rounded-lg border border-[var(--border)] hover:border-brand bg-[var(--bg-muted)]/20 flex items-center justify-between transition-colors group cursor-pointer"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Download size={14} className="text-purple-500 shrink-0" />
                              <span className="text-[11px] font-semibold text-[var(--text-primary)]">Project Brochure</span>
                            </div>
                            <ArrowUpRight size={13} className="text-[var(--text-muted)] group-hover:text-brand" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Submitter Profile Card with Instant Contact Actions */}
                    <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-2.5">
                      <span className="text-xs font-bold text-[var(--text-primary)] block pb-1 border-b border-[var(--border)]">
                        Lister & Submitter Identity
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] uppercase block">Name / Entity</span>
                          <span className="font-semibold text-[var(--text-primary)] block mt-0.5">{formData.ownerName}</span>
                          <span className="text-[10px] font-mono text-brand font-semibold">{formData.ownerRole}</span>
                        </div>

                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] uppercase block">Phone Contact</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-semibold text-[var(--text-primary)]">{formData.ownerPhone}</span>
                            {formData.ownerPhone && formData.ownerPhone !== 'N/A' && (
                              <div className="flex items-center gap-1">
                                <a
                                  href={`tel:${formData.ownerPhone}`}
                                  className="p-1 rounded bg-[var(--bg-muted)] hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors"
                                  title="Call Lister"
                                >
                                  <PhoneCall size={11} />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(formData.ownerPhone, 'Phone')}
                                  className="p-1 rounded bg-[var(--bg-muted)] hover:bg-brand/10 hover:text-brand transition-colors cursor-pointer"
                                  title="Copy Phone"
                                >
                                  <Copy size={11} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] uppercase block">Email Address</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-semibold text-[var(--text-primary)] truncate">{formData.ownerEmail}</span>
                            {formData.ownerEmail && formData.ownerEmail !== 'N/A' && (
                              <div className="flex items-center gap-1 shrink-0">
                                <a
                                  href={`mailto:${formData.ownerEmail}`}
                                  className="p-1 rounded bg-[var(--bg-muted)] hover:bg-blue-500/10 hover:text-blue-600 transition-colors"
                                  title="Send Email"
                                >
                                  <Mail size={11} />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(formData.ownerEmail, 'Email')}
                                  className="p-1 rounded bg-[var(--bg-muted)] hover:bg-brand/10 hover:text-brand transition-colors cursor-pointer"
                                  title="Copy Email"
                                >
                                  <Copy size={11} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* ─── TAB 3: AUDIT CHECKLIST & DECISION NOTES ─── */}
                {activeDetailTab === 'audit' && (
                  <div className="space-y-4">
                    
                    {/* 5-Point Interactive Checklist with Check All */}
                    <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                        <div>
                          <h3 className="text-xs font-bold text-[var(--text-primary)]">
                            Moderator Verification Checklist
                          </h3>
                          <p className="text-[10px] text-[var(--text-muted)]">Check off parameters verified during audit</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleCheckAll}
                          className="text-[10.5px] font-semibold text-brand hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <CheckCheck size={12} />
                          <span>Toggle All</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {[
                          { key: 'priceValid', label: 'Price & Area Validated' },
                          { key: 'photosApproved', label: 'Photographs Authenticated' },
                          { key: 'addressVerified', label: 'Physical Address & Pin Verified' },
                          { key: 'reraChecked', label: 'Title Deed / RERA Checked' },
                          { key: 'amenitiesConfirmed', label: 'Specifications & Amenities Confirmed' }
                        ].map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              setReviewChecklist(prev => {
                                const next = !prev[item.key];
                                return { ...prev, [item.key]: next };
                              });
                            }}
                            className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                              reviewChecklist[item.key]
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold'
                                : 'bg-[var(--bg-muted)]/40 border-[var(--border)] text-[var(--text-secondary)]'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                              reviewChecklist[item.key] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--text-muted)]'
                            }`}>
                              {reviewChecklist[item.key] && <Check size={9} strokeWidth={3} />}
                            </div>
                            <span className="text-[11px]">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Review Notes / Rejection Remarks */}
                    <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-[var(--text-primary)] block">
                          Internal Moderator Notes & Audit Feedback
                        </label>
                        <span className="text-[10px] text-[var(--text-muted)]">{remarks.length} characters</span>
                      </div>

                      <textarea
                        rows={3}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Add review notes, comments for submitter, or reasons if requesting fixes..."
                        className="w-full p-2.5 bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg border border-[var(--border)] focus:border-brand outline-none resize-none transition-all"
                      />

                      {/* Quick-Fill Chips */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] text-[var(--text-muted)] font-medium">Quick reason:</span>
                        {QUICK_REJECTION_REASONS.slice(0, 3).map((r, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setRemarks(r);
                              showToast('Quick reason added to notes.', 'info');
                            }}
                            className="text-[9.5px] px-2 py-0.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded-md border border-[var(--border)] transition-colors cursor-pointer"
                          >
                            {r}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                        <button
                          type="button"
                          onClick={() => {
                            if (!remarks.trim()) {
                              showToast('Please enter review notes first.', 'info');
                              return;
                            }
                            showToast(`Review notes recorded for ${selectedItem.id}.`, 'success');
                          }}
                          className="px-3 py-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg text-xs font-semibold border border-[var(--border)] transition-colors cursor-pointer"
                        >
                          Save Internal Notes
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (remarks.trim()) {
                              setCustomRejectNote(remarks);
                            }
                            setShowRejectModal(true);
                          }}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <XCircle size={12} />
                          <span>Reject with Notes</span>
                        </button>
                      </div>
                    </div>

                  </div>
                )}

              </div>

            </div>
          )}
        </div>

      </div>

      {/* ─── 03. PERMANENT DELETE CONFIRMATION MODAL (Needed Only!) ─── */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Delete Listing Permanently?</h3>
                <p className="text-xs text-[var(--text-muted)]">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3 bg-[var(--bg-muted)]/50 rounded-xl border border-[var(--border)] text-xs text-[var(--text-secondary)] space-y-1">
              <p>
                You are about to remove <strong className="text-[var(--text-primary)] font-mono">{selectedItem.id}</strong> ({selectedItem.title}).
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                All uploaded images, RERA documentation, and listing associations will be permanently erased.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 04. CLEAN REJECTION REASON MODAL (Needed Only!) ─── */}
      {showRejectModal && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xl p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <XCircle size={16} className="text-rose-500" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Reject Listing Submission</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              Specify the primary reason for rejecting <span className="font-bold text-[var(--text-primary)] font-mono">{selectedItem.id}</span>. This feedback will be recorded and delivered to the lister.
            </p>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {QUICK_REJECTION_REASONS.map((reason, idx) => (
                <label 
                  key={idx}
                  className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    selectedRejectReason === reason
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400 font-semibold'
                      : 'bg-[var(--bg-muted)]/40 border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    checked={selectedRejectReason === reason}
                    onChange={() => setSelectedRejectReason(reason)}
                    className="accent-rose-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            {/* Custom Notes / Addition */}
            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-semibold text-[var(--text-secondary)] block">
                Additional moderator remarks (optional):
              </label>
              <textarea
                rows={2}
                value={customRejectNote}
                onChange={(e) => setCustomRejectNote(e.target.value)}
                placeholder="Specific guidance for the lister to fix before resubmitting..."
                className="w-full p-2 bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg border border-[var(--border)] focus:border-rose-500 outline-none resize-none transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={() => {
                  const finalReason = customRejectNote?.trim() 
                    ? `${selectedRejectReason} - Notes: ${customRejectNote.trim()}`
                    : selectedRejectReason;
                  updateStatus('Rejected', finalReason);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
              >
                {isSubmittingAction ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <XCircle size={13} />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 05. LIGHTBOX IMAGE GALLERY MODAL (Needed Only When Clicking Photos!) ─── */}
      {lightboxOpen && selectedItem && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxOpen(false);
          }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-8 animate-in fade-in duration-200"
        >
          <div className="w-full flex items-center justify-between text-white max-w-5xl">
            <div className="space-y-0.5">
              <span className="text-xs font-mono font-bold text-brand tracking-wide">{selectedItem.id} · MEDIA GALLERY</span>
              <p className="text-sm font-semibold">{selectedItem.title} ({activeImageIndex + 1} of {selectedItem.images.length})</p>
            </div>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>

          <div className="relative w-full max-w-5xl flex-1 flex items-center justify-center p-4">
            <button
              type="button"
              onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : selectedItem.images.length - 1))}
              className="absolute left-2 sm:left-6 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all cursor-pointer z-10"
              title="Previous photo (Left Arrow)"
            >
              <ChevronLeft size={20} />
            </button>

            <img
              src={selectedItem.images[activeImageIndex]}
              alt={`Photo ${activeImageIndex + 1}`}
              className="max-h-[68vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/10 select-none"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />

            <button
              type="button"
              onClick={() => setActiveImageIndex((prev) => (prev < selectedItem.images.length - 1 ? prev + 1 : 0))}
              className="absolute right-2 sm:right-6 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all cursor-pointer z-10"
              title="Next photo (Right Arrow)"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto max-w-2xl p-2 bg-white/10 rounded-xl backdrop-blur-md">
            {selectedItem.images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveImageIndex(i)}
                className={`w-14 h-11 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                  activeImageIndex === i ? 'border-brand scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt="thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── 06. IN-APP TOAST NOTIFICATION (Sleek, Auto-dismiss, Non-intrusive) ─── */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border backdrop-blur-md text-xs font-semibold ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/40 shadow-emerald-950/30'
              : toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-100 border-rose-500/40 shadow-rose-950/30'
              : 'bg-slate-900/90 text-slate-100 border-slate-700 shadow-slate-950/30'
          }`}>
            {toast.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle size={16} className="text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info size={16} className="text-blue-400 shrink-0" />}
            
            <span className="leading-snug">{toast.message}</span>

            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-2 p-1 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
              title="Dismiss notification"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default PropertyVerification;