import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLoader from '../components/common/AdminLoader';
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
  PhoneCall, RotateCcw, CreditCard, Wallet, Percent, Tag, BadgePercent,
  Star, LayoutGrid, ListFilter
} from 'lucide-react';
import API from '../api/api';
import SmoothImage from '../components/common/SmoothImage';

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
  const [searchParams] = useSearchParams();

  // --- Core States ---
  const [activePipeline, setActivePipeline] = useState('properties'); // 'properties' | 'projects'
  const [properties, setProperties] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  // Navigation & Tabs inside detail pane
  const [activeDetailTab, setActiveDetailTab] = useState('specs'); // 'specs' | 'docs' | 'edit'

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL'); // ALL, Residential, Commercial, Land
  const [statusFilter, setStatusFilter] = useState('All'); // Smart default: 'All' so users never see an empty screen
  const [hasUserChangedFilter, setHasUserChangedFilter] = useState(false);

  // Selection & Editing
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Modals
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRejectReason, setSelectedRejectReason] = useState(QUICK_REJECTION_REASONS[0]);
  const [customRejectNote, setCustomRejectNote] = useState('');
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Verification Commission & Discount Modal
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountModalMode, setDiscountModalMode] = useState('verify'); // 'verify' | 'edit'
  const [discountForm, setDiscountForm] = useState({
    commissionType: 'percentage',
    commissionRate: 2,
    commissionAmount: 0,
    discountEnabled: false,
    discountType: 'percentage',
    discountValue: 0,
    discountNotes: '',
  });

  // Project Investment Score Modal
  const [showProjectScoreModal, setShowProjectScoreModal] = useState(false);
  const [projectScoreForm, setProjectScoreForm] = useState({
    connectivity: 9.0,
    rentalPotential: 8.5,
    growthPotential: 9.0,
    familyLiving: 8.8,
    futureDemand: 9.0,
  });
  const [isSavingScore, setIsSavingScore] = useState(false);

  const openProjectScoreModal = (project) => {
    const cur = project.investmentScore?.metrics || {};
    setProjectScoreForm({
      connectivity: cur.connectivity ?? 9.0,
      rentalPotential: cur.rentalPotential ?? 8.5,
      growthPotential: cur.growthPotential ?? 9.0,
      familyLiving: cur.familyLiving ?? 8.8,
      futureDemand: cur.futureDemand ?? 9.0,
    });
    setShowProjectScoreModal(true);
  };

  const computedProjectOverall = useMemo(() => {
    const vals = [
      Number(projectScoreForm.connectivity) || 0,
      Number(projectScoreForm.rentalPotential) || 0,
      Number(projectScoreForm.growthPotential) || 0,
      Number(projectScoreForm.familyLiving) || 0,
      Number(projectScoreForm.futureDemand) || 0,
    ];
    const sum = vals.reduce((a, b) => a + b, 0);
    return Math.round((sum / vals.length) * 10) / 10;
  }, [projectScoreForm]);

  const computedProjectGrade = useMemo(() => {
    if (computedProjectOverall >= 8.0) return 'Excellent';
    if (computedProjectOverall >= 6.5) return 'Good';
    if (computedProjectOverall >= 5.0) return 'Average';
    return 'Below Average';
  }, [computedProjectOverall]);

  const handleSaveProjectScore = async () => {
    if (!selectedItem) return;
    setIsSavingScore(true);
    try {
      const payload = {
        connectivity: Number(projectScoreForm.connectivity),
        rentalPotential: Number(projectScoreForm.rentalPotential),
        growthPotential: Number(projectScoreForm.growthPotential),
        familyLiving: Number(projectScoreForm.familyLiving),
        futureDemand: Number(projectScoreForm.futureDemand),
      };
      const endpoint = selectedItem.itemType === 'project'
        ? `/admin/projects/${selectedItem._id}/investment-score`
        : `/admin/properties/${selectedItem._id}/investment-score`;

      const res = await API.put(endpoint, payload);
      if (res.data?.status === 'success') {
        const newScore = res.data.data.investmentScore;
        if (selectedItem.itemType === 'project') {
          setProjects((prev) =>
            prev.map((p) => (p._id === selectedItem._id ? { ...p, investmentScore: newScore } : p))
          );
        } else {
          setProperties((prev) =>
            prev.map((p) => (p._id === selectedItem._id ? { ...p, investmentScore: newScore } : p))
          );
        }
        setSelectedItem((prev) => ({ ...prev, investmentScore: newScore }));
        setFormData((prev) => ({ ...prev, investmentScore: newScore }));
        showToast(
          `${selectedItem.itemType === 'project' ? 'Project' : 'Property'} investment score updated successfully!`,
          'success'
        );
        setShowProjectScoreModal(false);
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update investment score.', 'error');
    } finally {
      setIsSavingScore(false);
    }
  };

  // Toast Feedback
  const [toast, setToast] = useState(null);
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


  const formatCurrency = (val) => {
    if (!val || isNaN(val)) return '0';
    const num = Number(val);
    if (num >= 10000000) return `${(num / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(2).replace(/\.00$/, '')} L`;
    return num.toLocaleString('en-IN');
  };

  const copyToClipboard = (text, label) => {
    if (!text || text === 'N/A') return;
    navigator.clipboard?.writeText(text);
    showToast(`${label} copied to clipboard!`, 'info');
  };

  // Map Backend Property to UI model
  const mapPropertyToUi = (p) => {
    const images = Array.isArray(p.images) && p.images.length > 0 
      ? p.images 
      : Array.isArray(p.photos) && p.photos.length > 0 
      ? p.photos 
      : [];

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
      configuration: [
        p.bedrooms ? `${p.bedrooms} BHK` : null,
        p.bathrooms ? `${p.bathrooms} Bath` : null,
        p.propertyType || null
      ].filter(Boolean).join(' · ') || p.propertyType || 'N/A',
      listingFor: p.listingFor || 'Sale',
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
      maintenanceCharges: p.maintenanceCharges > 0 ? `₹${Number(p.maintenanceCharges).toLocaleString('en-IN')}/mo` : 'N/A',
      tokenAmount: p.securityDeposit > 0 ? `₹${Number(p.securityDeposit).toLocaleString('en-IN')}` : 'N/A',
      area: p.builtUpArea ? `${p.builtUpArea} sq.ft` : p.carpetArea ? `${p.carpetArea} sq.ft` : 'N/A',
      carpetArea: p.carpetArea ? `${p.carpetArea} sq.ft` : 'N/A',
      condition: p.ageOfProperty || 'Ready to Move',
      possessionDate: p.availableFrom || p.ageOfProperty || 'Immediate',
      floorInfo: p.floorNo ? `Floor ${p.floorNo}${p.totalFloors ? ` of ${p.totalFloors}` : ''}` : 'N/A',
      facing: p.facingDirection ? `${p.facingDirection} Facing` : 'N/A',
      furnishing: p.furnishing || 'N/A',
      parking: p.parking || 'N/A',
      reraNumber: p.propertyDocuments?.reraCertificate || p.reraNumber || '',
      reraStatus: p.approvalStatus === 'approved' ? 'Verified' : 'Pending Verification',
      amenities: Array.isArray(p.amenities) ? p.amenities : [],
      preferredTenants: Array.isArray(p.preferredTenants) ? p.preferredTenants : [],
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
      viewsCount: p.viewsCount || 0,
      shortlistedCount: p.shortlistedCount || 0,
      inquiriesCount: p.inquiriesCount || 0,
      rating: Number(p.rating || p.averageRating) || 0,
      reviewsCount: Number(p.reviewsCount || p.totalRatings) || 0,
      adminCommission: p.adminCommission || {
        type: 'percentage',
        rate: 2,
        amount: Math.round((priceNum * 2) / 100),
      },
      commissionDiscount: p.commissionDiscount || {
        enabled: false,
        discountType: 'percentage',
        discountValue: 0,
        discountAmount: 0,
        netCommission: p.adminCommission?.amount || Math.round((priceNum * 2) / 100),
        discountOnCommissionOnly: true,
        notes: '',
      },
      hasDiscount: Boolean(p.hasDiscount || (p.commissionDiscount?.enabled && p.commissionDiscount?.discountAmount > 0)),
      discountAmount: Number(p.discountAmount || p.commissionDiscount?.discountAmount || 0),
      effectiveBuyerPrice: Number(p.effectiveBuyerPrice || (priceNum - (p.commissionDiscount?.discountAmount || 0))),
      pricingSummary: p.pricingSummary || null,
      investmentScore: p.investmentScore || {
        overall: 0,
        grade: 'Not Rated',
        metrics: {
          connectivity: 0,
          rentalPotential: 0,
          growthPotential: 0,
          familyLiving: 0,
          futureDemand: 0,
        },
      },
      itemType: 'property'
    };
  };

  // Map Backend Project to UI model
  const mapProjectToUi = (p) => {
    const images = Array.isArray(p.projectPhotos) && p.projectPhotos.length > 0 ? p.projectPhotos : [];
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
      configuration: [
        p.towers ? `${p.towers} Tower${p.towers > 1 ? 's' : ''}` : null,
        p.totalUnits ? `${p.totalUnits} Units` : null,
        p.floors ? `${p.floors} Floors` : null
      ].filter(Boolean).join(' · ') || 'N/A',
      listingFor: 'Sale',
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
      tokenAmount: 'N/A',
      area: p.openSpacePercentage > 0 ? `${p.openSpacePercentage}% Open Area` : 'N/A',
      carpetArea: firstBhk?.carpetArea ? `${firstBhk.carpetArea} sq.ft onwards` : 'N/A',
      condition: p.projectStatus || 'Under Construction',
      possessionDate: p.possessionDate || 'N/A',
      floorInfo: p.floors || 'N/A',
      facing: p.vastuCompliant ? 'Vastu Compliant' : 'N/A',
      furnishing: 'N/A',
      parking: 'N/A',
      reraNumber: p.reraProjectNumber || '',
      reraExpiryDate: p.reraExpiryDate || 'N/A',
      launchDate: p.launchDate || 'N/A',
      reraStatus: p.approvalStatus === 'approved' ? 'Verified' : 'Pending Verification',
      amenities: Array.isArray(p.amenities) ? p.amenities : [],
      status: p.approvalStatus === 'approved' ? 'Approved' : p.approvalStatus === 'rejected' ? 'Rejected' : 'Pending',
      approvalStatus: p.approvalStatus || 'pending',
      rejectionReason: p.rejectionReason || '',
      isLive: p.isLive || false,
      submittedDate: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
      images,
      bhkConfigurations: Array.isArray(p.bhkConfigurations) ? p.bhkConfigurations : [],
      description: p.shortDescription || p.description || '',
      viewsCount: p.viewsCount || 0,
      inquiriesCount: p.inquiriesCount || 0,
      rating: Number(p.rating || p.averageRating) || 0,
      reviewsCount: Number(p.reviewsCount || p.totalRatings) || 0,
      investmentScore: p.investmentScore || {
        overall: 0,
        grade: 'Not Rated',
        metrics: {
          connectivity: 0,
          rentalPotential: 0,
          growthPotential: 0,
          familyLiving: 0,
          futureDemand: 0,
        },
      },
      itemType: 'project'
    };
  };

  // --- Fetch All Data from Backend ---
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [propRes, projRes] = await Promise.all([
        API.get('/admin/properties', { params: { limit: 1000 } }),
        API.get('/admin/projects', { params: { limit: 1000 } })
      ]);

      let mappedProps = [];
      if (propRes.data?.status === 'success') {
        mappedProps = (propRes.data?.data?.properties || []).map(mapPropertyToUi);
        setProperties(mappedProps);
      }

      if (projRes.data?.status === 'success') {
        const mappedProj = (projRes.data?.data?.projects || []).map(mapProjectToUi);
        setProjects(mappedProj);
      }

      // Default to All listings so all properties are shown by default
      if (!hasUserChangedFilter) {
        setStatusFilter('All');
      }

      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Error fetching admin moderation data:', err);
      setError(err?.response?.data?.message || 'Could not connect to backend server. Please verify backend is running on port 5001.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle direct navigation & search params from notifications
  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q');
    const targetId = searchParams.get('id');

    if (q) {
      setSearchQuery(q);
      setStatusFilter('All');
      setHasUserChangedFilter(true);
    }

    if (properties.length > 0) {
      if (targetId) {
        const found = properties.find(p => p._id === targetId || p.id === targetId || p.submissionId === targetId);
        if (found) {
          setStatusFilter('All');
          handleSelectItem(found);
        }
      } else if (q) {
        const lowerQ = q.toLowerCase();
        const found = properties.find(p =>
          (p.title && p.title.toLowerCase().includes(lowerQ)) ||
          (p.id && p.id.toLowerCase().includes(lowerQ)) ||
          (p.submissionId && p.submissionId.toLowerCase().includes(lowerQ)) ||
          (p.ownerName && p.ownerName.toLowerCase().includes(lowerQ))
        );
        if (found) {
          handleSelectItem(found);
        }
      }
    }
  }, [searchParams, properties]);

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

  const handleSelectItem = (item) => {
    if (!item) {
      setSelectedItem(null);
      setFormData(null);
      return;
    }
    setSelectedItem(item);
    setFormData({ ...item });
    setIsEditing(false);
    setActiveDetailTab('specs');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Save Inline Corrections
  const saveEdits = async () => {
    if (!formData) return;
    try {
      const endpoint = formData.itemType === 'project'
        ? `/admin/projects/${formData._id}`
        : `/admin/properties/${formData._id}`;

      const res = await API.put(endpoint, {
        title: formData.title,
        price: formData.priceVal || formData.price,
        description: formData.description,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        locality: formData.locality,
        city: formData.city,
      });

      const data = res.data;
      if (data?.status === 'success') {
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
        showToast(data?.message || 'Failed to save edits.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || 'Network error while saving edits.', 'error');
    }
  };

  // Real-time Update Status (Approve / Reject / Reset) in MongoDB
  const updateStatus = async (newStatus, explicitReason = null, commissionPayload = null) => {
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
        ? `/admin/projects/${selectedItem._id}/status`
        : `/admin/properties/${selectedItem._id}/status`;

      const requestBody = {
        approvalStatus: apiStatus,
        rejectionReason: activeRemarks
      };

      if (commissionPayload) {
        if (commissionPayload.adminCommission) requestBody.adminCommission = commissionPayload.adminCommission;
        if (commissionPayload.commissionDiscount) requestBody.commissionDiscount = commissionPayload.commissionDiscount;
      }

      const res = await API.patch(endpoint, requestBody);
      const data = res.data;
      if (data?.status === 'success') {
        setRemarks('');
        setShowRejectModal(false);
        setCustomRejectNote('');

        const actionLabel = newStatus === 'Approved' 
          ? 'approved and published live! 🏡' 
          : newStatus === 'Rejected' 
          ? 'marked as rejected.' 
          : 'reset to pending review.';
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
        showToast(data?.message || 'Failed to update status.', 'error');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      showToast(err?.response?.data?.message || 'Connection error while updating status.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Open Verification & Commission Discount Modal
  const openVerificationDiscountModal = (mode = 'verify') => {
    if (!selectedItem) return;
    setDiscountModalMode(mode);

    const priceVal = Number(selectedItem.priceVal || selectedItem.price || 0);
    const existingComm = selectedItem.adminCommission || {};
    const existingDisc = selectedItem.commissionDiscount || {};

    const cType = existingComm.type === 'fixed' ? 'fixed' : 'percentage';
    const cRate = existingComm.rate !== undefined && existingComm.rate !== null ? Number(existingComm.rate) : 2;
    const cAmount = existingComm.amount !== undefined && existingComm.amount > 0
      ? Number(existingComm.amount)
      : Math.round((priceVal * cRate) / 100);

    const dEnabled = Boolean(existingDisc.enabled);
    const dType = existingDisc.discountType === 'fixed' ? 'fixed' : 'percentage';
    const dVal = existingDisc.discountValue !== undefined ? Number(existingDisc.discountValue) : 0;
    const dNotes = existingDisc.notes || '';

    setDiscountForm({
      commissionType: cType,
      commissionRate: cRate,
      commissionAmount: cAmount,
      discountEnabled: dEnabled,
      discountType: dType,
      discountValue: dVal,
      discountNotes: dNotes,
    });

    setShowDiscountModal(true);
  };

  // Confirm Approval with Commission Discount
  const handleConfirmApprovalWithDiscount = async () => {
    if (!selectedItem) return;
    const priceVal = Number(selectedItem.priceVal || selectedItem.price || 0);
    const cType = discountForm.commissionType;
    const cRate = Number(discountForm.commissionRate) || 0;
    const cAmount = cType === 'percentage'
      ? Math.round((priceVal * cRate) / 100)
      : Math.round(Number(discountForm.commissionAmount) || 0);

    const dEnabled = discountForm.discountEnabled;
    const dType = discountForm.discountType;
    const dVal = Number(discountForm.discountValue) || 0;
    let dAmount = 0;
    if (dEnabled && dVal > 0) {
      dAmount = dType === 'percentage'
        ? Math.round((cAmount * Math.min(100, Math.max(0, dVal))) / 100)
        : Math.round(Math.min(cAmount, Math.max(0, dVal)));
    }

    const payload = {
      adminCommission: {
        type: cType,
        rate: cRate,
        amount: cAmount,
      },
      commissionDiscount: {
        enabled: dEnabled,
        discountType: dType,
        discountValue: dVal,
        discountAmount: dAmount,
        netCommission: Math.max(0, cAmount - dAmount),
        discountOnCommissionOnly: true,
        notes: discountForm.discountNotes,
      }
    };

    setShowDiscountModal(false);
    await updateStatus('Approved', 'Verified & Approved by Admin', payload);
  };

  // Permanently Delete Listing
  const confirmDelete = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);

    try {
      const endpoint = selectedItem.itemType === 'project'
        ? `/admin/projects/${selectedItem._id}`
        : `/admin/properties/${selectedItem._id}`;

      await API.delete(endpoint);
      const deletedId = selectedItem.id;
      setShowDeleteModal(false);
      setSelectedItem(null);
      setFormData(null);
      showToast(`Listing ${deletedId} deleted successfully.`, 'success');
      await fetchData();
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || 'Error connecting to server while deleting.', 'error');
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

  // Global counts
  const totalPending = currentList.filter(p => p.status === 'Pending').length;
  const totalApproved = currentList.filter(p => p.status === 'Approved').length;
  const totalRejected = currentList.filter(p => p.status === 'Rejected').length;
  const totalAll = currentList.length;

  // Active status filtered subset for context-aware category counts
  const statusFilteredList = useMemo(() => {
    if (statusFilter === 'All') return currentList;
    return currentList.filter(p => p.status === statusFilter);
  }, [currentList, statusFilter]);

  // Dynamic categories with standard defaults
  const categories = useMemo(() => {
    const listCats = Array.from(new Set(currentList.map(p => p.category).filter(Boolean)));
    const base = ['ALL', 'Residential', 'Commercial', 'Land'];
    listCats.forEach(c => {
      if (!base.some(b => b.toLowerCase() === c.toLowerCase())) {
        base.push(c);
      }
    });
    return base;
  }, [currentList]);

  // Context-aware category counts (for active status queue)
  const categoryCounts = useMemo(() => {
    const counts = {};
    categories.forEach(cat => {
      if (cat === 'ALL') {
        counts[cat] = statusFilteredList.length;
      } else {
        counts[cat] = statusFilteredList.filter(p => p.category?.toLowerCase() === cat.toLowerCase()).length;
      }
    });
    return counts;
  }, [categories, statusFilteredList]);

  // Total inventory counts for each category (across all statuses)
  const totalCategoryCounts = useMemo(() => {
    const counts = {};
    categories.forEach(cat => {
      if (cat === 'ALL') {
        counts[cat] = currentList.length;
      } else {
        counts[cat] = currentList.filter(p => p.category?.toLowerCase() === cat.toLowerCase()).length;
      }
    });
    return counts;
  }, [categories, currentList]);

  // Filtering Logic
  const filteredItems = useMemo(() => {
    return currentList.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        (p.title && p.title.toLowerCase().includes(q)) || 
        (p.location && p.location.toLowerCase().includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q)) ||
        (p.ownerName && p.ownerName.toLowerCase().includes(q)) ||
        (p.city && p.city.toLowerCase().includes(q));
      
      const matchesCategory = activeCategory === 'ALL' || (p.category && p.category.toLowerCase() === activeCategory.toLowerCase());
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [currentList, searchQuery, activeCategory, statusFilter]);

  // Auto-select first item when list loads or changes
  useEffect(() => {
    if (filteredItems.length > 0) {
      const isStillSelected = selectedItem && filteredItems.some(i => i._id === selectedItem._id);
      if (!isStillSelected) {
        handleSelectItem(filteredItems[0]);
      }
    } else {
      setSelectedItem(null);
      setFormData(null);
    }
  }, [filteredItems]);

  return (
    <div className="space-y-4 pb-8 relative">
      
      {/* ─── 01. CLEAN MINIMAL HEADER & REAL-TIME STATS ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand" />
            <h1 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
              Listing Verification & Moderation
            </h1>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Audit property details, verify documents, and publish listings live on GharMB
          </p>
        </div>

        {/* Pipeline Segmented Pill & Refresh */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <div className="inline-flex bg-[var(--bg-muted)]/70 p-1 rounded-xl border border-[var(--border)] text-xs font-semibold">
            <button
              type="button"
              onClick={() => switchPipeline('properties')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activePipeline === 'properties'
                  ? 'bg-[var(--bg-surface)] text-brand shadow-xs font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Home size={13} />
              <span>Properties ({properties.length})</span>
            </button>
            <button
              type="button"
              onClick={() => switchPipeline('projects')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activePipeline === 'projects'
                  ? 'bg-[var(--bg-surface)] text-brand shadow-xs font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Building2 size={13} />
              <span>Developer Projects ({projects.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoading}
            className="p-2 border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] rounded-xl text-[var(--text-secondary)] transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Refresh pipeline"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-brand' : ''} />
          </button>
        </div>
      </div>

      {/* ─── 02. STATS OVERVIEW CARDS (Interactive Filter Pills) ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => { setStatusFilter('Pending'); setHasUserChangedFilter(true); }}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'Pending'
              ? 'bg-amber-500/10 border-amber-500/40 shadow-xs ring-1 ring-amber-500/30'
              : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Needs Audit</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="text-xl font-extrabold text-[var(--text-primary)] mt-1">{totalPending}</div>
          <span className="text-[10px] text-[var(--text-muted)]">Awaiting approval</span>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('Approved'); setHasUserChangedFilter(true); }}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'Approved'
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-xs ring-1 ring-emerald-500/30'
              : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Live & Approved</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-xl font-extrabold text-[var(--text-primary)] mt-1">{totalApproved}</div>
          <span className="text-[10px] text-[var(--text-muted)]">Active on platform</span>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('Rejected'); setHasUserChangedFilter(true); }}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'Rejected'
              ? 'bg-rose-500/10 border-rose-500/40 shadow-xs ring-1 ring-rose-500/30'
              : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-rose-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">Rejected</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="text-xl font-extrabold text-[var(--text-primary)] mt-1">{totalRejected}</div>
          <span className="text-[10px] text-[var(--text-muted)]">Requires revision</span>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('All'); setHasUserChangedFilter(true); }}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'All'
              ? 'bg-brand/10 border-brand/40 shadow-xs ring-1 ring-brand/30'
              : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-brand/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-brand">All Listings</span>
            <span className="w-2 h-2 rounded-full bg-brand" />
          </div>
          <div className="text-xl font-extrabold text-[var(--text-primary)] mt-1">{totalAll}</div>
          <span className="text-[10px] text-[var(--text-muted)]">Full inventory queue</span>
        </button>
      </div>

      {/* ─── 03. MASTER-DETAIL SPLIT WORKSPACE ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* ─── LEFT: LISTING QUEUE LIST (Col 4) ─── */}
        <div className="lg:col-span-5 xl:col-span-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xs flex flex-col h-[740px]">
          
          {/* Search & Category Filter Header */}
          <div className="p-3 border-b border-[var(--border)] space-y-2 bg-[var(--bg-surface)]">
            <div className="relative">
              <Search className="absolute top-1/2 -translate-y-1/2 left-3 text-[var(--text-muted)]" size={13} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, title, locality, seller..."
                className="w-full pl-8.5 pr-8 py-2 border border-[var(--border)] bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar text-[11px]">
              {categories.map((cat) => {
                const count = categoryCounts[cat] ?? 0;
                const totalInCat = totalCategoryCounts[cat] ?? 0;
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      isActive
                        ? 'bg-brand text-white font-bold shadow-2xs'
                        : 'bg-[var(--bg-muted)]/70 text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                    title={statusFilter !== 'All' ? `${count} ${statusFilter} of ${totalInCat} total` : `${count} total`}
                  >
                    <span>{cat}</span>
                    <span className={`text-[9px] px-1 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Queue Status Context Bar */}
            <div className="flex items-center justify-between px-2 py-1 text-[10.5px] rounded-lg bg-[var(--bg-muted)]/50 border border-[var(--border)]">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  statusFilter === 'Pending' ? 'bg-amber-500 animate-pulse' :
                  statusFilter === 'Approved' ? 'bg-emerald-500' :
                  statusFilter === 'Rejected' ? 'bg-rose-500' :
                  'bg-brand'
                }`} />
                <span className="font-semibold text-[var(--text-secondary)] truncate">
                  Queue: <strong className="text-[var(--text-primary)]">{statusFilter === 'Pending' ? 'Needs Audit' : statusFilter === 'Approved' ? 'Live & Approved' : statusFilter === 'Rejected' ? 'Rejected' : 'All Listings'}</strong>
                </span>
                {activeCategory !== 'ALL' && (
                  <span className="text-[var(--text-muted)] truncate">
                    • {activeCategory}
                  </span>
                )}
              </div>
              {statusFilter !== 'All' && (
                <button
                  type="button"
                  onClick={() => { setStatusFilter('All'); setHasUserChangedFilter(true); }}
                  className="text-[10px] text-brand hover:underline font-semibold cursor-pointer shrink-0 ml-1.5"
                  title="View inventory across all statuses"
                >
                  View All ({currentList.length})
                </button>
              )}
            </div>

            {/* Cross-status hint when category has more items in other statuses */}
            {activeCategory !== 'ALL' && statusFilter !== 'All' && (totalCategoryCounts[activeCategory] || 0) > (categoryCounts[activeCategory] || 0) && (
              <div className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10.5px] text-amber-700 dark:text-amber-400 flex items-center justify-between gap-1">
                <span className="truncate">
                  Showing {categoryCounts[activeCategory] || 0} {statusFilter.toLowerCase()} of <strong>{totalCategoryCounts[activeCategory]}</strong> {activeCategory}
                </span>
                <button
                  type="button"
                  onClick={() => { setStatusFilter('All'); setHasUserChangedFilter(true); }}
                  className="font-bold underline cursor-pointer shrink-0 ml-1"
                >
                  Show All {totalCategoryCounts[activeCategory]}
                </button>
              </div>
            )}
          </div>

          {/* Queue Listing Scroll Area */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {isLoading ? (
              <AdminLoader text="Loading listings..." minHeight="min-h-[280px]" />
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-muted)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                  <Filter size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">No listings match this filter</h4>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {statusFilter !== 'All' 
                      ? `There are currently 0 listings in "${statusFilter}" status.` 
                      : 'Try adjusting your search keywords.'}
                  </p>
                </div>
                {statusFilter !== 'All' && (
                  <button
                    type="button"
                    onClick={() => { setStatusFilter('All'); setActiveCategory('ALL'); setSearchQuery(''); }}
                    className="px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-dark transition-all cursor-pointer shadow-xs"
                  >
                    View All {currentList.length} Listings
                  </button>
                )}
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedItem?._id === item._id;
                const coverImg = item.images && item.images.length > 0 ? item.images[0] : null;

                return (
                  <div
                    key={item._id}
                    onClick={() => handleSelectItem(item)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex gap-3 ${
                      isSelected
                        ? 'bg-brand/5 border-brand shadow-xs ring-1 ring-brand/20'
                        : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-brand/40 hover:bg-[var(--bg-muted)]/30'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-18 h-18 rounded-lg overflow-hidden bg-[var(--bg-muted)] shrink-0 border border-[var(--border)] flex items-center justify-center">
                      {coverImg ? (
                        <SmoothImage
                          src={coverImg}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          containerClassName="w-full h-full"
                        />
                      ) : (
                        <ImageIcon size={18} className="text-[var(--text-muted)]" />
                      )}
                      <span className="absolute bottom-1 left-1 text-[8px] font-bold px-1 py-0.2 rounded bg-black/70 text-white backdrop-blur-2xs">
                        {item.listingFor}
                      </span>
                    </div>

                    {/* Listing Content */}
                    <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[9.5px] font-mono font-bold text-brand truncate">
                            {item.id}
                          </span>
                          <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                            item.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                            item.status === 'Rejected' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                            'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-[var(--text-primary)] truncate mt-0.5">
                          {item.title}
                        </h4>
                        <p className="text-[10.5px] text-[var(--text-muted)] truncate flex items-center gap-1 mt-0.5">
                          <MapPin size={10} className="shrink-0" />
                          <span>{item.locality ? `${item.locality}, ${item.city}` : item.city}</span>
                        </p>
                      </div>

                      {/* Price & Meta Footer */}
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-[var(--border)]/50 text-[10.5px]">
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          ₹{item.price}
                        </span>
                        <span className="text-[9.5px] text-[var(--text-muted)] truncate max-w-[110px]">
                          By {item.ownerName}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* List Footer Counter */}
          <div className="p-2.5 border-t border-[var(--border)] bg-[var(--bg-muted)]/30 text-[11px] text-[var(--text-muted)] flex items-center justify-between">
            <span>
              Showing <strong>{filteredItems.length}</strong> of {statusFilteredList.length}
              {statusFilter !== 'All' ? ` ${statusFilter.toLowerCase()} (${currentList.length} total in catalog)` : ' listings'}
            </span>
            <span className="text-[10px]">Auto-selects active</span>
          </div>
        </div>

        {/* ─── RIGHT: INSPECTOR DETAIL PANE (Col 8) ─── */}
        <div className="lg:col-span-7 xl:col-span-8 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xs h-[740px] flex flex-col">
          {selectedItem && formData ? (
            <>
              {/* 1. Header Toolbar & Quick Moderate Actions */}
              <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-brand px-2 py-0.5 rounded bg-brand/10 border border-brand/20">
                      {formData.id}
                    </span>
                    <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                      {formData.category} • {formData.subCategory || formData.configuration}
                    </span>
                    <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      formData.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                      formData.status === 'Rejected' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' :
                      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                      {formData.status}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2.5 mt-1.5 flex-wrap">
                    <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] truncate">
                      {formData.title}
                    </h2>
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                      ₹{formData.price}
                    </span>
                    {formData.rating > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        <span>{formData.rating.toFixed(1)}</span>
                        {formData.reviewsCount > 0 && (
                          <span className="text-[9px] text-[var(--text-muted)] font-normal">({formData.reviewsCount})</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Moderate Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                  {formData.status !== 'Approved' && (
                    <button
                      type="button"
                      disabled={isSubmittingAction}
                      onClick={() => {
                        if (formData.itemType === 'property') {
                          openVerificationDiscountModal('verify');
                        } else {
                          updateStatus('Approved');
                        }
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 size={13} />
                      <span>Approve Live</span>
                    </button>
                  )}

                  {formData.itemType === 'property' && (
                    <button
                      type="button"
                      disabled={isSubmittingAction}
                      onClick={() => openVerificationDiscountModal('edit')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                        formData.hasDiscount
                          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30'
                          : 'bg-brand/10 hover:bg-brand/20 text-brand border-brand/20'
                      }`}
                      title="Configure Admin Commission & Buyer Discount"
                    >
                      <BadgePercent size={13} />
                      <span>{formData.hasDiscount ? 'Edit Discount' : 'Set Discount'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isSubmittingAction}
                    onClick={() => openProjectScoreModal(formData)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    title={`Set ${formData.itemType === 'project' ? 'Project' : 'Property'} Investment Score`}
                  >
                    <Sparkles size={13} />
                    <span>Investment Score ({formData.investmentScore?.overall || 0}/10)</span>
                  </button>

                  {formData.status !== 'Rejected' && (
                    <button
                      type="button"
                      disabled={isSubmittingAction}
                      onClick={() => setShowRejectModal(true)}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
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
                      className="p-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded-xl border border-[var(--border)] transition-colors cursor-pointer"
                      title="Reset to Pending Audit"
                    >
                      <RotateCcw size={13} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="p-1.5 text-rose-600 hover:bg-rose-500/10 border border-rose-200 dark:border-rose-900/40 rounded-xl transition-colors cursor-pointer"
                    title="Delete permanently"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* 2. Detail Tabs Strip */}
              <div className="px-4 border-b border-[var(--border)] flex items-center gap-6 text-xs font-semibold bg-[var(--bg-surface)]">
                <button
                  type="button"
                  onClick={() => setActiveDetailTab('specs')}
                  className={`py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeDetailTab === 'specs'
                      ? 'border-brand text-brand font-bold'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Home size={13} />
                  <span>Specifications & Gallery</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDetailTab('docs')}
                  className={`py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeDetailTab === 'docs'
                      ? 'border-brand text-brand font-bold'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <FileText size={13} />
                  <span>Owner & Verification Docs</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveDetailTab('edit');
                    setIsEditing(true);
                  }}
                  className={`py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeDetailTab === 'edit'
                      ? 'border-brand text-brand font-bold'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Edit3 size={13} />
                  <span>Quick Corrections</span>
                </button>
              </div>

              {/* 3. Detail Scroll Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                
                {/* ─── TAB 1: SPECS & GALLERY ─── */}
                {activeDetailTab === 'specs' && (
                  <div className="space-y-4">
                    {/* Media Strip */}
                    <div className="flex items-center gap-3">
                      {formData.images.length > 0 ? (
                        <div
                          onClick={() => openLightbox(0)}
                          className="relative w-44 sm:w-52 aspect-video rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-muted)] shrink-0 group cursor-pointer shadow-xs"
                          title="Click to view full photo gallery"
                        >
                          <SmoothImage
                            src={formData.images[0]}
                            alt="Cover"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            containerClassName="w-full h-full"
                          />
                          <span className="absolute top-1.5 left-1.5 bg-brand text-white text-[8px] font-bold px-1.5 py-0.2 rounded">
                            Cover ({formData.images.length})
                          </span>
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye size={16} />
                          </div>
                        </div>
                      ) : (
                        <div className="w-44 sm:w-52 aspect-video rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-muted)]/40 flex flex-col items-center justify-center gap-1 text-[var(--text-muted)] shrink-0">
                          <ImageIcon size={20} />
                          <span className="text-[10px]">No photos uploaded</span>
                        </div>
                      )}

                      {/* Photo Thumbnails */}
                      {formData.images.length > 0 && (
                        <div className="flex-1 flex items-center gap-2 overflow-x-auto py-1 custom-scrollbar">
                          {formData.images.map((img, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => openLightbox(idx)}
                              className="relative w-22 aspect-video rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg-muted)] shrink-0 hover:border-brand transition-all cursor-pointer"
                            >
                              <SmoothImage
                                src={img}
                                alt={`Thumb ${idx + 1}`}
                                className="w-full h-full object-cover"
                                containerClassName="w-full h-full"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Key Metric Tiles */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)]/30">
                        <span className="text-[9.5px] uppercase font-semibold text-[var(--text-muted)] block">Rate / Sq.Ft</span>
                        <span className="text-xs font-bold text-[var(--text-primary)] block mt-0.5">{formData.pricePerSqFt}</span>
                      </div>
                      <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)]/30">
                        <span className="text-[9.5px] uppercase font-semibold text-[var(--text-muted)] block">Carpet Area</span>
                        <span className="text-xs font-bold text-[var(--text-primary)] block mt-0.5">{formData.carpetArea}</span>
                      </div>
                      <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)]/30">
                        <span className="text-[9.5px] uppercase font-semibold text-[var(--text-muted)] block">Condition</span>
                        <span className="text-xs font-bold text-[var(--text-primary)] block mt-0.5">{formData.condition}</span>
                      </div>
                      <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)]/30">
                        <span className="text-[9.5px] uppercase font-semibold text-[var(--text-muted)] block">Floor & Facing</span>
                        <span className="text-xs font-bold text-[var(--text-primary)] block mt-0.5 truncate">{formData.floorInfo} · {formData.facing}</span>
                      </div>
                    </div>

                    {/* Location & Address Strip */}
                    <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)]/20 flex items-start gap-2.5 text-xs">
                      <MapPin size={15} className="text-brand shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[var(--text-primary)] block">Full Physical Address</span>
                        <p className="text-[var(--text-secondary)] mt-0.5">{formData.location}</p>
                      </div>
                    </div>

                    {/* Description */}
                    {formData.description && (
                      <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-xs space-y-1">
                        <span className="font-bold text-[var(--text-primary)] block">Description & Seller Notes</span>
                        <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line text-[11.5px]">
                          {formData.description}
                        </p>
                      </div>
                    )}

                    {/* Amenities Pill Grid */}
                    {formData.amenities && formData.amenities.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10.5px] font-bold text-[var(--text-primary)] uppercase tracking-wider block">
                          Verified Amenities ({formData.amenities.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {formData.amenities.map((am, i) => (
                            <span key={i} className="text-[10.5px] px-2.5 py-1 rounded-lg bg-[var(--bg-muted)]/60 border border-[var(--border)] text-[var(--text-secondary)] font-medium flex items-center gap-1">
                              <Check size={11} className="text-emerald-500" />
                              <span>{typeof am === 'string' ? am : am.name || am.label}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Official Investment Score Info Card (Properties & Projects) */}
                    <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <Sparkles size={14} />
                          </div>
                          <div>
                            <span className="font-extrabold text-[var(--text-primary)] block text-xs">
                              GharMB Official Investment Score
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              Curated parameters rendered in mobile app for {formData.itemType === 'project' ? 'this project' : 'this property'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                            {formData.investmentScore?.overall || 0} / 10
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {formData.investmentScore?.grade || 'Not Rated'}
                          </span>
                        </div>
                      </div>

                      {/* 5 Metric Progress Bars */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {[
                          { label: 'Connectivity', val: formData.investmentScore?.metrics?.connectivity || 0 },
                          { label: 'Rental Potential', val: formData.investmentScore?.metrics?.rentalPotential || 0 },
                          { label: 'Growth Potential', val: formData.investmentScore?.metrics?.growthPotential || 0 },
                          { label: 'Family Living', val: formData.investmentScore?.metrics?.familyLiving || 0 },
                          { label: 'Future Demand', val: formData.investmentScore?.metrics?.futureDemand || 0 },
                        ].map(({ label, val }) => (
                          <div key={label} className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold">
                              <span className="text-[var(--text-subtle)]">{label}</span>
                              <span className="font-bold text-[var(--text-primary)]">{val}/10</span>
                            </div>
                            <div className="w-full h-1.5 bg-[var(--bg-muted)] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${Math.min(100, (val / 10) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => openProjectScoreModal(formData)}
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Sparkles size={13} /> Edit {formData.itemType === 'project' ? 'Project' : 'Property'} Investment Score
                      </button>
                    </div>

                    {/* Commission & Discount Info Card */}
                    {formData.itemType === 'property' && (
                      <div className="p-3 rounded-xl border border-brand/20 bg-gradient-to-br from-brand/5 to-transparent text-xs space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border)]">
                          <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                            <BadgePercent size={14} className="text-brand" />
                            <span>GharMB Commission Policy</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => openVerificationDiscountModal('edit')}
                            className="text-[11px] font-bold text-brand hover:underline cursor-pointer"
                          >
                            Update Policy
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div>
                            <span className="text-[9.5px] text-[var(--text-muted)] block">Commission Rate</span>
                            <span className="font-bold text-[var(--text-primary)]">
                              {formData.adminCommission?.type === 'percentage' ? `${formData.adminCommission?.rate || 2}%` : 'Fixed'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9.5px] text-[var(--text-muted)] block">Gross Commission</span>
                            <span className="font-bold text-[var(--text-primary)]">
                              ₹{(formData.adminCommission?.amount || 0).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9.5px] text-[var(--text-muted)] block">Buyer Discount</span>
                            <span className="font-bold text-amber-600">
                              {formData.hasDiscount ? `₹${(formData.discountAmount || 0).toLocaleString()}` : 'None'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9.5px] text-[var(--text-muted)] block">Net Commission</span>
                            <span className="font-bold text-emerald-600">
                              ₹{(formData.commissionDiscount?.netCommission || formData.adminCommission?.amount || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── TAB 2: OWNER & VERIFICATION DOCUMENTS ─── */}
                {activeDetailTab === 'docs' && (
                  <div className="space-y-4">
                    {/* Seller Card */}
                    <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)]/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand font-bold flex items-center justify-center shrink-0">
                            {(formData.ownerName || 'O').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[var(--text-primary)] block">
                              {formData.ownerName}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              Role: <strong className="text-brand">{formData.ownerRole}</strong>
                            </span>
                          </div>
                        </div>

                        <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                          formData.ownerVerified
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                          {formData.ownerVerified ? 'Verified Lister' : 'Unverified Lister'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-[var(--border)]/60">
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                          <Phone size={12} className="text-[var(--text-muted)] shrink-0" />
                          <span>{formData.ownerPhone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                          <Mail size={12} className="text-[var(--text-muted)] shrink-0" />
                          <span className="truncate">{formData.ownerEmail}</span>
                        </div>
                      </div>
                    </div>

                    {/* Standard Verification Documents Checklist */}
                    <div className="space-y-2">
                      <span className="text-[10.5px] font-bold text-[var(--text-primary)] uppercase tracking-wider block">
                        Submitted Verification Documents
                      </span>
                      
                      <div className="space-y-1.5 text-xs">
                        {STANDARD_DOCUMENT_TYPES.map((doc) => {
                          const docUrl = formData.propertyDocuments?.[doc.key];
                          return (
                            <div key={doc.key} className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText size={14} className={docUrl ? 'text-brand' : 'text-[var(--text-muted)]'} />
                                <span className={docUrl ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
                                  {doc.label}
                                </span>
                              </div>

                              {docUrl ? (
                                <a
                                  href={docUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] font-bold text-brand hover:underline flex items-center gap-1"
                                >
                                  <span>View Document</span>
                                  <ExternalLink size={10} />
                                </a>
                              ) : (
                                <span className="text-[10px] text-[var(--text-muted)] italic">Not Provided</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── TAB 3: QUICK CORRECTIONS ─── */}
                {activeDetailTab === 'edit' && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                      Edit minor details (title, price, description) directly before approving, without having to reject the listing.
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] block mb-1">Listing Title</label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] font-semibold outline-none focus:border-brand"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] block mb-1">Price (₹)</label>
                          <input
                            type="number"
                            name="priceVal"
                            value={formData.priceVal}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                priceVal: val,
                                price: formatCurrency(val)
                              }));
                            }}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] text-xs font-bold text-emerald-600 outline-none focus:border-brand"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] block mb-1">City</label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] outline-none focus:border-brand"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] block mb-1">Description</label>
                        <textarea
                          rows={4}
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] outline-none focus:border-brand custom-scrollbar"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...selectedItem });
                            setIsEditing(false);
                            setActiveDetailTab('specs');
                          }}
                          className="px-3 py-1.5 border border-[var(--border)] text-[var(--text-secondary)] rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={saveEdits}
                          className="px-4 py-1.5 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-dark transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                        >
                          <Save size={13} />
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Empty Selection State */
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)]">
                <CheckCircle size={28} />
              </div>
              <div className="max-w-xs">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Select a listing to inspect</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Choose any submission from the queue on the left to review photos, specifications, and owner documents.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ─── 04. COMMISSION & DISCOUNT CONFIGURATION MODAL ─── */}
      {showDiscountModal && selectedItem && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowDiscountModal(false); }}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl max-w-md w-full shadow-2xl border border-[var(--border)] p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  {discountModalMode === 'verify' ? 'Approve Listing: Set Commission' : 'Update Commission & Discount'}
                </h3>
                <p className="text-[10.5px] text-[var(--text-muted)]">
                  Listed Price: <strong>₹{selectedItem.price}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Commission Rate */}
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase block mb-1">
                  Admin Commission Rate (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={discountForm.commissionRate}
                    onChange={(e) => setDiscountForm(prev => ({ ...prev, commissionRate: e.target.value }))}
                    className="w-24 px-3 py-1.5 border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] font-bold text-xs"
                  />
                  <span className="text-[11px] text-[var(--text-muted)]">
                    = ₹{Math.round((Number(selectedItem.priceVal || 0) * Number(discountForm.commissionRate || 0)) / 100).toLocaleString('en-IN')} gross
                  </span>
                </div>
              </div>

              {/* Commission-Absorbed Discount Toggle */}
              <div className="p-3 bg-[var(--bg-muted)]/40 border border-[var(--border)] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[11px] block">Offer Buyer Discount</span>
                    <span className="text-[10px] text-[var(--text-muted)]">Funded 100% from GharMB Admin commission</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={discountForm.discountEnabled}
                    onChange={(e) => setDiscountForm(prev => ({ ...prev, discountEnabled: e.target.checked }))}
                    className="w-4 h-4 rounded text-brand cursor-pointer"
                  />
                </div>

                {discountForm.discountEnabled && (
                  <div className="pt-2 border-t border-[var(--border)]/60 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] text-[var(--text-muted)]">Discount:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discountForm.discountValue}
                        onChange={(e) => setDiscountForm(prev => ({ ...prev, discountValue: e.target.value }))}
                        className="w-20 px-2 py-1 border border-[var(--border)] rounded-lg text-xs font-bold"
                        placeholder="e.g. 50"
                      />
                      <span className="text-[10px] text-[var(--text-muted)]">% of commission</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="px-3 py-1.5 border border-[var(--border)] text-[var(--text-secondary)] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprovalWithDiscount}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer shadow-xs"
              >
                Confirm & Publish Live
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 05. REJECTION MODAL ─── */}
      {showRejectModal && selectedItem && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowRejectModal(false); }}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl max-w-md w-full shadow-2xl border border-[var(--border)] p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div>
                <h3 className="text-sm font-bold text-rose-600 flex items-center gap-1.5">
                  <AlertCircle size={15} />
                  <span>Reject Listing: {selectedItem.id}</span>
                </h3>
                <p className="text-[10.5px] text-[var(--text-muted)]">Specify feedback so the lister can fix their submission</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase block">Select Primary Reason</span>
              <div className="space-y-1">
                {QUICK_REJECTION_REASONS.map((r, i) => (
                  <label key={i} className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)]/70 hover:bg-[var(--bg-muted)]/40 cursor-pointer">
                    <input
                      type="radio"
                      name="rejectReason"
                      checked={selectedRejectReason === r}
                      onChange={() => setSelectedRejectReason(r)}
                      className="text-rose-600"
                    />
                    <span className="text-[11.5px] text-[var(--text-primary)]">{r}</span>
                  </label>
                ))}
              </div>

              <div className="pt-2">
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase block mb-1">Additional Note (Optional)</label>
                <textarea
                  rows={2}
                  value={customRejectNote}
                  onChange={(e) => setCustomRejectNote(e.target.value)}
                  placeholder="e.g. Please upload clear copy of electricity bill."
                  className="w-full px-3 py-1.5 border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] text-xs outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 border border-[var(--border)] text-[var(--text-secondary)] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => updateStatus('Rejected', customRejectNote ? `${selectedRejectReason}: ${customRejectNote}` : selectedRejectReason)}
                className="px-4 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all cursor-pointer shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 06. DELETE CONFIRMATION MODAL ─── */}
      {showDeleteModal && selectedItem && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl max-w-sm w-full shadow-2xl border border-[var(--border)] p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Delete Listing?</h3>
                <p className="text-[11px] text-[var(--text-muted)]">This will permanently remove {selectedItem.id} from the database.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-1.5 border border-[var(--border)] text-[var(--text-secondary)] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-4 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 07. FULLSCREEN PHOTO LIGHTBOX ─── */}
      {lightboxOpen && selectedItem && selectedItem.images.length > 0 && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setLightboxOpen(false); }}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="relative max-w-4xl max-h-[80vh] flex items-center justify-center">
            <img
              src={selectedItem.images[activeImageIndex]}
              alt={`Photo ${activeImageIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />

            {selectedItem.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : selectedItem.images.length - 1))}
                  className="absolute -left-12 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev < selectedItem.images.length - 1 ? prev + 1 : 0))}
                  className="absolute -right-12 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          <div className="text-white/80 text-xs mt-3 font-semibold">
            Photo {activeImageIndex + 1} of {selectedItem.images.length}
          </div>
        </div>
      )}

      {/* ─── 08. NON-BLOCKING TOAST ─── */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className={`px-4 py-2.5 rounded-xl shadow-xl border text-xs font-semibold flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-700' :
            toast.type === 'error' ? 'bg-rose-600 text-white border-rose-700' :
            'bg-slate-900 text-white border-slate-800'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 size={14} /> :
             toast.type === 'error' ? <AlertCircle size={14} /> :
             <Info size={14} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* ─── 08. PROJECT INVESTMENT SCORE MODAL ─── */}
      {showProjectScoreModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] max-w-lg w-full rounded-2xl shadow-2xl border border-[var(--border)] p-6 space-y-5 animate-scale-up">
            <div className="flex justify-between items-start border-b border-[var(--border)] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[var(--text-primary)]">
                    Edit {formData.itemType === 'project' ? 'Project' : 'Property'} Investment Score
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {formData.title} ({formData.id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProjectScoreModal(false)}
                className="p-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)]/80 text-[var(--text-muted)] rounded-lg cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Live Overall Preview */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/25 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Calculated Overall Score
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {computedProjectOverall}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] font-bold">/ 10</span>
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                {computedProjectGrade}
              </span>
            </div>

            {/* 5 Metrics Sliders & Numeric Inputs */}
            <div className="space-y-3.5 text-xs">
              {[
                { key: 'connectivity', label: 'Connectivity', desc: 'Metro, highway, railway proximity' },
                { key: 'rentalPotential', label: 'Rental Potential', desc: 'Expected rental yield & tenant demand' },
                { key: 'growthPotential', label: 'Growth Potential', desc: '5-year capital appreciation projection' },
                { key: 'familyLiving', label: 'Family Living', desc: 'Schools, parks, hospitals & safety' },
                { key: 'futureDemand', label: 'Future Demand', desc: 'Upcoming infra, SEZ, commercial hubs' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="p-2.5 bg-[var(--bg-muted)]/60 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-[var(--text-primary)]">{label}</span>
                      <span className="text-[10px] text-[var(--text-muted)] block">{desc}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={projectScoreForm[key]}
                        onChange={(e) => {
                          const val = Math.min(10, Math.max(0, parseFloat(e.target.value) || 0));
                          setProjectScoreForm((prev) => ({ ...prev, [key]: val }));
                        }}
                        className="w-14 px-2 py-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg text-center font-black text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                      />
                      <span className="text-[10px] font-bold text-[var(--text-muted)]">/ 10</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={projectScoreForm[key]}
                    onChange={(e) =>
                      setProjectScoreForm((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))
                    }
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-[var(--border)] rounded-lg"
                  />
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowProjectScoreModal(false)}
                className="flex-1 py-2.5 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-subtle)] rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProjectScore}
                disabled={isSavingScore}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                {isSavingScore ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Check size={14} /> Save Investment Score
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyVerification;