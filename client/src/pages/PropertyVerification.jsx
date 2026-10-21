import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLoader from '../components/common/AdminLoader';
import SmoothImage from '../components/common/SmoothImage';
import API from '../api/api';
import { Badge } from '../components/ui/Badge';
import {
  Search,
  RefreshCw,
  MapPin,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  Trash2,
  ShieldCheck,
  AlertCircle,
  Home,
  Eye,
  Check,
  ExternalLink,
  Phone,
  Mail,
  Copy,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileText,
  Building,
  RotateCcw,
  Sparkles,
  Tag,
  Calendar,
  Layers,
  ArrowRight,
  Play,
  Film
} from 'lucide-react';

const QUICK_REJECTION_REASONS = [
  'Documents incomplete or missing',
  'Price or area specifications discrepancy',
  'Low quality or misleading photographs',
  'Physical address or location could not be verified',
  'RERA registration missing or unverified',
  'Duplicate property listing'
];

export default function PropertyVerification() {
  const [searchParams] = useSearchParams();

  // --- Pipeline & Data States ---
  const [activePipeline, setActivePipeline] = useState('properties'); // 'properties' | 'projects'
  const [properties, setProperties] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState('Just now');

  // --- Filter & Search States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Pending' | 'Approved' | 'Rejected' | 'Sold'
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // 'ALL' | 'Residential' | 'Commercial' | 'Land'
  // --- Sliding Switch Refs & Geometry States ---
  const pipelineTabRefs = useRef({});
  const [pipelineIndicatorStyle, setPipelineIndicatorStyle] = useState({ left: 4, width: 0, opacity: 0 });

  const statusTabRefs = useRef({});
  const [statusIndicatorStyle, setStatusIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  // --- Drawer & Selection States ---
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState('overview'); // 'overview' | 'docs' | 'gallery'

  // --- Action & Modal States ---
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRejectReason, setSelectedRejectReason] = useState(QUICK_REJECTION_REASONS[0]);
  const [customRejectNote, setCustomRejectNote] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Admin Property Sale Management States (Requirement 15)
  const [showMarkSoldModal, setShowMarkSoldModal] = useState(false);
  const [markSoldDays, setMarkSoldDays] = useState(3);
  const [markSoldNotes, setMarkSoldNotes] = useState('');
  const [showConfirmSaleModal, setShowConfirmSaleModal] = useState(false);
  const [confirmSaleAction, setConfirmSaleAction] = useState('confirm'); // 'confirm' | 'cancel'
  const [confirmSaleNotes, setConfirmSaleNotes] = useState('');

  // --- Lightbox States ---
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(0);

  // --- Toast Notification State ---
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const formatCurrency = (val) => {
    if (!val || isNaN(val)) return '0';
    const num = Number(val);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2).replace(/\.00$/, '')} L`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const copyToClipboard = (text, label) => {
    if (!text || text === 'N/A') return;
    navigator.clipboard?.writeText(text);
    showToast(`${label} copied to clipboard!`, 'info');
  };

  // --- Data Mappers ---
  const isVideoUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    try {
      const decoded = decodeURIComponent(url).toLowerCase();
      const clean = decoded.split('?')[0];
      return (
        /\.(mp4|webm|mov|m4v|mkv|avi|3gp)$/i.test(clean) ||
        decoded.includes('/video/') ||
        decoded.includes('/videos/') ||
        decoded.includes('video/mp4') ||
        decoded.includes('format=mp4') ||
        decoded.includes('contenttype=video') ||
        decoded.includes('uploads%2fvideo') ||
        decoded.includes('uploads/video')
      );
    } catch (_) {
      return /\.(mp4|webm|mov|m4v|mkv|avi|3gp)/i.test(url) || url.toLowerCase().includes('video');
    }
  };

  const mapPropertyToUi = (p) => {
    const rawImages = Array.isArray(p.images) && p.images.length > 0 ? p.images : (Array.isArray(p.photos) ? p.photos : []);
    const rawVideos = Array.isArray(p.videos) ? p.videos : (Array.isArray(p.propertyVideos) ? p.propertyVideos : []);

    const pureImages = rawImages.filter(u => !isVideoUrl(u));
    const allVideos = [...rawVideos, ...rawImages.filter(u => isVideoUrl(u))];
    const gallery = Array.isArray(p.gallery) && p.gallery.length > 0
      ? p.gallery
      : [
          ...pureImages.map(url => ({ url, type: 'image' })),
          ...allVideos.map(url => ({ url, type: 'video' }))
        ];

    const carpet = Number(p.carpetArea) || 0;
    const priceNum = Number(p.price) || 0;
    const pricePerSqFt = carpet > 0 && priceNum > 0
      ? `₹${Math.round(priceNum / carpet).toLocaleString('en-IN')}/sq.ft`
      : null;

    // Multiple BHK Configurations: strictly ONLY BHK and its custom Price
    const bhkConfigurations = Array.isArray(p.bhkConfigurations)
      ? p.bhkConfigurations
          .map((b) => ({
            bhk: b.bhk || b.bhkType || '',
            price: Number(b.price) || 0,
          }))
          .filter((b) => b.bhk && b.price > 0)
      : [];

    let priceDisplay = formatCurrency(p.price);
    if (bhkConfigurations.length > 1) {
      const prices = bhkConfigurations.map((b) => b.price).filter(Boolean);
      if (prices.length > 1) {
        const minP = Math.min(...prices);
        const maxP = Math.max(...prices);
        priceDisplay = `${formatCurrency(minP)} - ${formatCurrency(maxP)}`;
      }
    }

    const bhkDisplay = p.bhkSummary ||
      (bhkConfigurations.length > 0
        ? [...new Set(bhkConfigurations.map((b) => b.bhk))].join(', ')
        : (p.bedrooms ? `${p.bedrooms} BHK` : null));

    const isSoldListing = Boolean(p.isSold || p.saleStatus === 'sold');
    const isPendingSale = p.saleStatus === 'marked_as_sold';

    return {
      _id: p._id,
      id: p.submissionId || `PROP-${p._id.slice(-4).toUpperCase()}`,
      title: p.title || 'Untitled Property',
      category: p.category || 'Residential',
      propertyType: p.propertyType || 'Apartment',
      bhk: bhkDisplay,
      bathrooms: p.bathrooms ? `${p.bathrooms} Bath` : null,
      bhkConfigurations,
      hasMultipleBhk: bhkConfigurations.length > 0,
      listingFor: p.listingFor || 'Sale',
      ownerName: p.owner?.companyName || p.owner?.name || 'Private Owner',
      ownerRole: p.listingAs || (p.owner?.role === 'builder' ? 'Builder' : p.owner?.role === 'agent' ? 'Agent' : 'Owner'),
      ownerPhone: p.owner?.phone || 'N/A',
      ownerEmail: p.owner?.email || 'N/A',
      ownerVerified: Boolean(p.owner?.isVerified),
      location: [p.locality, p.city].filter(Boolean).join(', ') || p.city || 'Gurugram',
      fullAddress: p.fullAddress || '',
      locality: p.locality || '',
      city: p.city || 'Gurugram',
      pincode: p.pincode || '',
      price: priceDisplay,
      priceVal: priceNum,
      pricePerSqFt,
      maintenanceCharges: p.maintenanceCharges > 0 ? `₹${Number(p.maintenanceCharges).toLocaleString('en-IN')}/mo` : null,
      securityDeposit: p.listingFor !== 'Sale' && p.securityDeposit > 0 ? `₹${Number(p.securityDeposit).toLocaleString('en-IN')}` : null,
      area: p.builtUpArea ? `${p.builtUpArea} sq.ft` : (p.carpetArea ? `${p.carpetArea} sq.ft` : 'N/A'),
      carpetArea: p.carpetArea ? `${p.carpetArea} sq.ft` : null,
      furnishing: p.furnishing || 'Unfurnished',
      facing: p.facingDirection ? `${p.facingDirection} Facing` : null,
      floorInfo: p.floorNo ? `Floor ${p.floorNo}${p.totalFloors ? ` of ${p.totalFloors}` : ''}` : null,
      possessionDate: p.availableFrom || p.ageOfProperty || 'Immediate',
      parking: p.parking || null,
      reraNumber: p.propertyDocuments?.reraCertificate || p.reraNumber || '',
      amenities: Array.isArray(p.amenities) ? p.amenities : [],
      status: isSoldListing
        ? 'Sold'
        : isPendingSale
        ? 'Marked as Sold'
        : p.approvalStatus === 'approved'
        ? 'Approved'
        : p.approvalStatus === 'rejected'
        ? 'Rejected'
        : 'Pending',
      approvalStatus: p.approvalStatus || 'pending',
      rejectionReason: p.rejectionReason || '',
      isLive: Boolean(p.isLive),
      isSold: isSoldListing,
      saleStatus: p.saleStatus || 'available',
      saleConfirmationDueDate: p.saleConfirmationDueDate || null,
      isPendingSaleConfirmation: isPendingSale,
      submittedDate: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
      images: pureImages,
      videos: allVideos,
      gallery,
      propertyDocuments: p.propertyDocuments || {},
      documents: Array.isArray(p.documents) ? p.documents : [],
      description: p.description || '',
      itemType: 'property'
    };
  };

  const mapProjectToUi = (p) => {
    const rawPhotos = Array.isArray(p.projectPhotos) && p.projectPhotos.length > 0 ? p.projectPhotos : [];
    const rawVideos = Array.isArray(p.projectVideos) && p.projectVideos.length > 0 ? p.projectVideos : [];

    const pureImages = rawPhotos.filter(u => !isVideoUrl(u));
    const allVideos = [...rawVideos, ...rawPhotos.filter(u => isVideoUrl(u))];
    const gallery = Array.isArray(p.gallery) && p.gallery.length > 0
      ? p.gallery
      : [
          ...pureImages.map(url => ({ url, type: 'image' })),
          ...allVideos.map(url => ({ url, type: 'video' }))
        ];

    const firstBhk = Array.isArray(p.bhkConfigurations) && p.bhkConfigurations.length > 0 ? p.bhkConfigurations[0] : null;
    const priceDisplay = firstBhk?.minPrice > 0
      ? `${formatCurrency(firstBhk.minPrice)} onwards`
      : 'Price on Request';

    return {
      _id: p._id,
      id: p.submissionId || `PRJ-${p._id.slice(-4).toUpperCase()}`,
      title: p.projectName || 'Untitled Project',
      category: p.projectType || 'Residential',
      propertyType: 'RERA Project',
      bhk: p.bhkSummary || (firstBhk?.bhkType ? `${firstBhk.bhkType} BHK` : null),
      listingFor: 'Sale',
      ownerName: p.developerName || p.developer?.companyName || p.developer?.name || 'Developer Company',
      ownerRole: 'Builder / Developer',
      ownerPhone: p.developer?.phone || 'N/A',
      ownerEmail: p.developer?.email || 'N/A',
      ownerVerified: Boolean(p.developer?.isVerified),
      location: [p.location?.locality, p.location?.city].filter(Boolean).join(', ') || p.location?.city || 'Gurugram',
      fullAddress: p.location?.address || '',
      locality: p.location?.locality || '',
      city: p.location?.city || 'Gurugram',
      pincode: p.location?.pincode || '',
      price: priceDisplay,
      priceVal: firstBhk?.minPrice || 0,
      area: p.totalProjectArea || (p.projectArea ? `${p.projectArea} Acres` : 'N/A'),
      reraNumber: p.reraRegistrationNumber || p.reraNumber || '',
      amenities: Array.isArray(p.amenities) ? p.amenities : [],
      status: p.isSold
        ? 'Sold'
        : p.status === 'approved' || p.approvalStatus === 'approved'
        ? 'Approved'
        : p.status === 'rejected' || p.approvalStatus === 'rejected'
        ? 'Rejected'
        : 'Pending',
      approvalStatus: p.status || p.approvalStatus || 'pending',
      rejectionReason: p.rejectionReason || '',
      isLive: Boolean(p.isLive),
      isSold: Boolean(p.isSold),
      saleStatus: p.saleStatus || (p.isSold ? 'sold' : 'available'),
      submittedDate: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
      images: pureImages,
      videos: allVideos,
      gallery,
      description: p.shortDescription || p.description || '',
      itemType: 'project'
    };
  };

  // --- Data Fetching ---
  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const [propRes, projRes] = await Promise.allSettled([
        API.get('/admin/properties', { params: { limit: 1000 } }),
        API.get('/admin/projects', { params: { limit: 1000 } })
      ]);

      if (propRes.status === 'fulfilled' && propRes.value?.data?.status === 'success') {
        const raw = propRes.value.data.data?.properties || [];
        setProperties(raw.map(mapPropertyToUi));
      }

      if (projRes.status === 'fulfilled' && projRes.value?.data?.status === 'success') {
        const raw = projRes.value.data.data?.projects || [];
        setProjects(raw.map(mapProjectToUi));
      }

      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Error fetching property approvals data:', err);
      setError('Could not connect to backend server. Please verify backend is running on port 5001.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle direct navigation via URL params (from notifications/search)
  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q');
    const targetId = searchParams.get('id');

    if (q) setSearchQuery(q);

    if (targetId && properties.length > 0) {
      const found = properties.find(p => p._id === targetId || p.id === targetId);
      if (found) {
        setSelectedItem(found);
        setIsDrawerOpen(true);
      }
    }
  }, [searchParams, properties]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen || !selectedItem) return;
      const gallery = selectedItem.gallery || [];
      if (gallery.length === 0) return;

      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') {
        setActiveLightboxIndex(prev => (prev > 0 ? prev - 1 : gallery.length - 1));
      }
      if (e.key === 'ArrowRight') {
        setActiveLightboxIndex(prev => (prev < gallery.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, selectedItem]);

  // Active list determination
  const activeList = activePipeline === 'properties' ? properties : projects;

  // Real-time metric counts across active pipeline
  const counts = useMemo(() => {
    const pending = activeList.filter(p => p.status === 'Pending').length;
    const approved = activeList.filter(p => p.status === 'Approved').length;
    const rejected = activeList.filter(p => p.status === 'Rejected').length;
    const sold = activeList.filter(p => p.status === 'Sold').length;
    return {
      pending,
      approved,
      rejected,
      sold,
      total: activeList.length
    };
  }, [activeList]);

  // Semantic status tabs specification mapped directly from BADGES_UI_DESIGN_SYSTEM.md
  const statusTabs = useMemo(() => [
    {
      key: 'All',
      label: 'All Listings',
      count: counts.total,
      icon: Layers,
      activeBg: 'bg-[#ffc5bb] dark:bg-[#4f160e]',
      activeText: 'text-[#992211] dark:text-[#ff9b8a]',
      activeCountBg: 'bg-[#992211]/15 text-[#992211] dark:bg-[#ff9b8a]/25 dark:text-[#ff9b8a]'
    },
    {
      key: 'Pending',
      label: 'Needs Audit',
      count: counts.pending,
      icon: Clock,
      activeBg: 'bg-[#fef08a] dark:bg-[#4d3209]',
      activeText: 'text-[#78350f] dark:text-[#fef08a]',
      activeCountBg: 'bg-[#78350f]/15 text-[#78350f] dark:bg-[#fef08a]/25 dark:text-[#fef08a]'
    },
    {
      key: 'Approved',
      label: 'Live & Approved',
      count: counts.approved,
      icon: CheckCircle2,
      activeBg: 'bg-[#52c99b] dark:bg-[#1a4a38]',
      activeText: 'text-[#064e3b] dark:text-[#6ee7b7]',
      activeCountBg: 'bg-[#064e3b]/15 text-[#064e3b] dark:bg-[#6ee7b7]/25 dark:text-[#6ee7b7]'
    },
    {
      key: 'Rejected',
      label: 'Rejected',
      count: counts.rejected,
      icon: XCircle,
      activeBg: 'bg-[#fca5a5] dark:bg-[#521722]',
      activeText: 'text-[#701a2b] dark:text-[#fda4af]',
      activeCountBg: 'bg-[#701a2b]/15 text-[#701a2b] dark:bg-[#fda4af]/25 dark:text-[#fda4af]'
    },
    {
      key: 'Sold',
      label: 'Sold / Off-Market',
      count: counts.sold,
      icon: ShieldCheck,
      activeBg: 'bg-[#c4b5fd] dark:bg-[#3b1968]',
      activeText: 'text-[#4c1d95] dark:text-[#ddd6fe]',
      activeCountBg: 'bg-[#4c1d95]/15 text-[#4c1d95] dark:bg-[#ddd6fe]/25 dark:text-[#ddd6fe]'
    }
  ], [counts]);

  const activeStatusTab = useMemo(() => {
    return statusTabs.find(t => t.key === statusFilter) || statusTabs[0];
  }, [statusTabs, statusFilter]);

  // Update sliding indicator position on status filter change, counts change, or resize
  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = statusTabRefs.current[statusFilter];
      if (activeEl) {
        setStatusIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          opacity: 1
        });
      }
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    const timeout = setTimeout(updateIndicator, 50);
    return () => {
      window.removeEventListener('resize', updateIndicator);
      clearTimeout(timeout);
    };
  }, [statusFilter, statusTabs]);

  // Update pipeline indicator position on activePipeline change or resize
  useEffect(() => {
    const updatePipelineIndicator = () => {
      const activeEl = pipelineTabRefs.current[activePipeline];
      if (activeEl) {
        setPipelineIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          opacity: 1
        });
      }
    };

    updatePipelineIndicator();
    window.addEventListener('resize', updatePipelineIndicator);
    const timeout = setTimeout(updatePipelineIndicator, 50);
    return () => {
      window.removeEventListener('resize', updatePipelineIndicator);
      clearTimeout(timeout);
    };
  }, [activePipeline, properties.length, projects.length]);



  // Filtering Logic
  const filteredList = useMemo(() => {
    return activeList.filter(item => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          item.title.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.city.toLowerCase().includes(q) ||
          item.ownerName.toLowerCase().includes(q) ||
          (item.reraNumber && item.reraNumber.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // 2. Status Filter
      if (statusFilter !== 'All') {
        if (statusFilter === 'Pending' && item.status !== 'Pending') return false;
        if (statusFilter === 'Approved' && item.status !== 'Approved') return false;
        if (statusFilter === 'Rejected' && item.status !== 'Rejected') return false;
        if (statusFilter === 'Sold' && item.status !== 'Sold') return false;
      }

      // 3. Category Filter
      if (categoryFilter !== 'ALL') {
        if (item.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [activeList, searchQuery, statusFilter, categoryFilter]);

  // --- Status Update Actions ---
  const handleUpdateStatus = async (item, newStatus, reason = null) => {
    if (!item) return;
    setIsSubmittingAction(true);

    const apiStatus = newStatus === 'Approved' ? 'approved' : (newStatus === 'Rejected' ? 'rejected' : 'pending');
    const activeRemarks = reason || (newStatus === 'Rejected' ? selectedRejectReason : 'Verified & Approved by Admin');

    try {
      const endpoint = item.itemType === 'project'
        ? `/admin/projects/${item._id}/status`
        : `/admin/properties/${item._id}/status`;

      const res = await API.patch(endpoint, {
        approvalStatus: apiStatus,
        status: apiStatus,
        rejectionReason: activeRemarks
      });

      if (res.data?.status === 'success') {
        setShowRejectModal(false);
        setCustomRejectNote('');

        const statusMsg = newStatus === 'Approved'
          ? 'approved and published live!'
          : (newStatus === 'Rejected' ? 'marked as rejected.' : 'reset to pending.');
        showToast(`Listing ${item.id} ${statusMsg}`, newStatus === 'Approved' ? 'success' : 'info');

        // Immediately update local state
        const updateItem = (prevList) =>
          prevList.map(p => p._id === item._id ? { ...p, status: newStatus, approvalStatus: apiStatus, rejectionReason: activeRemarks } : p);

        if (item.itemType === 'project') setProjects(updateItem);
        else setProperties(updateItem);

        if (selectedItem?._id === item._id) {
          setSelectedItem(prev => ({ ...prev, status: newStatus, approvalStatus: apiStatus, rejectionReason: activeRemarks }));
        }

        // Trigger real-time sync for sidebar counters!
        window.dispatchEvent(new CustomEvent('admin-data-sync'));
      } else {
        showToast(res.data?.message || 'Failed to update status.', 'error');
      }
    } catch (err) {
      console.error('Status update error:', err);
      showToast(err?.response?.data?.message || 'Failed to update status on server.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Permanently Delete Listing
  const handleDeleteListing = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);

    try {
      const endpoint = selectedItem.itemType === 'project'
        ? `/admin/projects/${selectedItem._id}`
        : `/admin/properties/${selectedItem._id}`;

      await API.delete(endpoint);
      showToast(`Listing ${selectedItem.id} deleted successfully.`, 'success');

      if (selectedItem.itemType === 'project') {
        setProjects(prev => prev.filter(p => p._id !== selectedItem._id));
      } else {
        setProperties(prev => prev.filter(p => p._id !== selectedItem._id));
      }

      setShowDeleteModal(false);
      setIsDrawerOpen(false);
      setSelectedItem(null);
      window.dispatchEvent(new CustomEvent('admin-data-sync'));
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || 'Failed to delete listing.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── 🏷️ INSTANT 1-CLICK MARK AS SOLD OUT / RELIST HANDLER ───────────────────────
  const handleToggleSold = async (item, targetSold) => {
    if (!item) return;
    setIsSubmittingAction(true);

    try {
      const endpoint = item.itemType === 'project'
        ? `/admin/projects/${item._id}/toggle-sold`
        : `/admin/properties/${item._id}/toggle-sold`;

      const res = await API.patch(endpoint, {
        isSold: targetSold,
        notes: targetSold ? 'Marked as Sold Out by Admin' : 'Relisted as Available by Admin'
      });

      if (res.data?.status === 'success') {
        const msg = targetSold
          ? `Listing ${item.id} successfully marked as Sold Out!`
          : `Listing ${item.id} successfully relisted as Available!`;
        showToast(msg, 'success');

        const newStatus = targetSold ? 'Sold' : 'Approved';
        const updateItem = (prevList) =>
          prevList.map((p) =>
            p._id === item._id
              ? {
                  ...p,
                  status: newStatus,
                  isSold: targetSold,
                  saleStatus: targetSold ? 'sold' : 'available',
                  isPendingSaleConfirmation: false,
                }
              : p
          );

        if (item.itemType === 'project') setProjects(updateItem);
        else setProperties(updateItem);

        if (selectedItem?._id === item._id) {
          setSelectedItem((prev) => ({
            ...prev,
            status: newStatus,
            isSold: targetSold,
            saleStatus: targetSold ? 'sold' : 'available',
            isPendingSaleConfirmation: false,
          }));
        }

        window.dispatchEvent(new CustomEvent('admin-data-sync'));
      } else {
        showToast(res.data?.message || 'Failed to update sale status.', 'error');
      }
    } catch (err) {
      console.error('Toggle sold error:', err);
      showToast(err?.response?.data?.message || 'Failed to update sale status on server.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // ── 🛡️ REQUIREMENT 15: ADMIN SALE MANAGEMENT HANDLERS ───────────────────────
  // Mark property as sold (triggers 3-day confirmation notification)
  const handleMarkAsSold = async () => {
    if (!selectedItem || selectedItem.itemType !== 'property') return;
    setIsSubmittingAction(true);

    try {
      const res = await API.patch(`/admin/properties/${selectedItem._id}/mark-sold`, {
        notes: markSoldNotes || 'Marked as sold by Admin',
        triggerDays: Number(markSoldDays) || 3,
      });

      if (res.data?.status === 'success') {
        showToast(
          `Listing ${selectedItem.id} marked as sold. Sale confirmation notification triggers in ${markSoldDays} days.`,
          'success'
        );
        setShowMarkSoldModal(false);
        setMarkSoldNotes('');

        const updateItem = (prevList) =>
          prevList.map((p) =>
            p._id === selectedItem._id
              ? {
                  ...p,
                  saleStatus: 'marked_as_sold',
                  status: 'Marked as Sold',
                  isPendingSaleConfirmation: true,
                  saleConfirmationDueDate: res.data?.data?.saleConfirmationDueDate || null,
                }
              : p
          );

        setProperties(updateItem);
        setSelectedItem((prev) => ({
          ...prev,
          saleStatus: 'marked_as_sold',
          status: 'Marked as Sold',
          isPendingSaleConfirmation: true,
          saleConfirmationDueDate: res.data?.data?.saleConfirmationDueDate || null,
        }));

        window.dispatchEvent(new CustomEvent('admin-data-sync'));
      } else {
        showToast(res.data?.message || 'Failed to mark property as sold.', 'error');
      }
    } catch (err) {
      console.error('Mark as sold error:', err);
      showToast(err?.response?.data?.message || 'Failed to mark property as sold.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Confirm or Reject Property Sale
  // - confirmed: true => isSold: true, isLive: false (permanently hidden from app)
  // - confirmed: false => isSold: false, isLive: true (remains active in app)
  const handleConfirmSale = async (confirmed) => {
    if (!selectedItem || selectedItem.itemType !== 'property') return;
    setIsSubmittingAction(true);

    try {
      const res = await API.patch(`/admin/properties/${selectedItem._id}/confirm-sale`, {
        confirmed,
        notes: confirmSaleNotes || (confirmed ? 'Sale officially confirmed' : 'Sale not confirmed; remaining active in app'),
      });

      if (res.data?.status === 'success') {
        setShowConfirmSaleModal(false);
        setConfirmSaleNotes('');

        if (confirmed) {
          showToast(
            `Sale confirmed! ${selectedItem.id} marked as Sold and removed from app display.`,
            'success'
          );
          const updateItem = (prevList) =>
            prevList.map((p) =>
              p._id === selectedItem._id
                ? {
                    ...p,
                    status: 'Sold',
                    isSold: true,
                    isLive: false,
                    saleStatus: 'sold',
                    isPendingSaleConfirmation: false,
                  }
                : p
            );
          setProperties(updateItem);
          setSelectedItem((prev) => ({
            ...prev,
            status: 'Sold',
            isSold: true,
            isLive: false,
            saleStatus: 'sold',
            isPendingSaleConfirmation: false,
          }));
        } else {
          showToast(
            `Sale not confirmed. ${selectedItem.id} remains active and live in the app.`,
            'info'
          );
          const updateItem = (prevList) =>
            prevList.map((p) =>
              p._id === selectedItem._id
                ? {
                    ...p,
                    status: 'Approved',
                    isSold: false,
                    isLive: true,
                    saleStatus: 'available',
                    isPendingSaleConfirmation: false,
                  }
                : p
            );
          setProperties(updateItem);
          setSelectedItem((prev) => ({
            ...prev,
            status: 'Approved',
            isSold: false,
            isLive: true,
            saleStatus: 'available',
            isPendingSaleConfirmation: false,
          }));
        }

        window.dispatchEvent(new CustomEvent('admin-data-sync'));
      } else {
        showToast(res.data?.message || 'Failed to update sale confirmation.', 'error');
      }
    } catch (err) {
      console.error('Confirm sale error:', err);
      showToast(err?.response?.data?.message || 'Failed to update sale status on server.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const openReviewDrawer = (item) => {
    setSelectedItem(item);
    setActiveDrawerTab('overview');
    setIsDrawerOpen(true);
  };

  const getStatusBadge = (status, size = 'xs') => {
    switch (status) {
      case 'Pending':
        return <Badge.Pending size={size}>Needs Audit</Badge.Pending>;
      case 'Approved':
        return <Badge.Approved size={size}>Approved</Badge.Approved>;
      case 'Rejected':
        return <Badge.Rejected size={size}>Rejected</Badge.Rejected>;
      case 'Sold':
        return <Badge.Sold size={size}>Sold</Badge.Sold>;
      case 'Marked as Sold':
        return (
          <Badge color="amber" variant="pastel" size={size} dot pulse icon={<Clock size={size === 'xs' ? 10 : 11} className="shrink-0" />}>
            Marked as Sold
          </Badge>
        );
      default:
        return (
          <Badge color="slate" variant="pastel" size={size}>
            {status || 'Unknown'}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-5 pb-10">
      
      {/* ── Toast Notification ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2.5 backdrop-blur-xl ${
            toast.type === 'success'
              ? 'bg-emerald-500/90 text-white border-emerald-400/40 shadow-emerald-500/20'
              : toast.type === 'error'
              ? 'bg-rose-500/90 text-white border-rose-400/40 shadow-rose-500/20'
              : 'bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border)] shadow-xl'
          }`}>
            {toast.type === 'success' && <CheckCircle2 size={16} />}
            {toast.type === 'error' && <AlertCircle size={16} />}
            {toast.type === 'info' && <Sparkles size={16} className="text-brand" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* ── 01. TOP HEADER & PIPELINE SWITCH ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)]/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Property Approvals
            </h1>
            {counts.pending > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                {counts.pending} Pending
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Review, verify, and moderate property & project listings submitted on GharMB
          </p>
        </div>

        {/* Pipeline Toggle (Properties vs Developer Projects Sliding Switch) */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="relative inline-flex items-center p-1 bg-[var(--bg-muted)]/80 rounded-full border border-[var(--border)] text-xs font-semibold select-none shadow-inner-xs">
            {/* Sliding Pill Indicator */}
            <span
              className={`absolute top-1 bottom-1 rounded-full shadow-xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none ${
                activePipeline === 'properties' ? 'bg-[#52c99b] dark:bg-[#1a4a38]' : 'bg-[#c4b5fd] dark:bg-[#3b1968]'
              }`}
              style={{
                left: `${pipelineIndicatorStyle.left}px`,
                width: `${pipelineIndicatorStyle.width}px`,
                opacity: pipelineIndicatorStyle.opacity
              }}
            />

            <button
              ref={(el) => { pipelineTabRefs.current['properties'] = el; }}
              type="button"
              onClick={() => { setActivePipeline('properties'); setSelectedItem(null); }}
              className={`relative z-10 px-3.5 py-1.5 rounded-full transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activePipeline === 'properties'
                  ? 'text-[#064e3b] dark:text-[#6ee7b7] font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
              }`}
            >
              <Home size={13} className="shrink-0" />
              <span>Properties</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold transition-colors ${
                activePipeline === 'properties'
                  ? 'bg-[#064e3b]/15 text-[#064e3b] dark:bg-[#6ee7b7]/25 dark:text-[#6ee7b7]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border)]'
              }`}>
                {properties.length}
              </span>
            </button>

            <button
              ref={(el) => { pipelineTabRefs.current['projects'] = el; }}
              type="button"
              onClick={() => { setActivePipeline('projects'); setSelectedItem(null); }}
              className={`relative z-10 px-3.5 py-1.5 rounded-full transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activePipeline === 'projects'
                  ? 'text-[#4c1d95] dark:text-[#ddd6fe] font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
              }`}
            >
              <Building2 size={13} className="shrink-0" />
              <span>Developer Projects</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold transition-colors ${
                activePipeline === 'projects'
                  ? 'bg-[#4c1d95]/15 text-[#4c1d95] dark:bg-[#ddd6fe]/25 dark:text-[#ddd6fe]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border)]'
              }`}>
                {projects.length}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={isRefreshing || isLoading}
            className="p-2 border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Refresh listings"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-brand' : ''} />
          </button>
        </div>
      </div>

      {/* ── 02. SLIDING STATUS TOGGLE SWITCH (Design System Pastel Palette) ── */}
      <div className="flex items-center overflow-x-auto scrollbar-none py-1 border-b border-[var(--border)]/60">
        <div className="relative inline-flex items-center p-1 bg-[var(--bg-muted)]/80 rounded-full border border-[var(--border)] text-xs font-semibold select-none shadow-inner-xs">
          {/* Sliding Pill Indicator */}
          <span
            className={`absolute top-1 bottom-1 rounded-full shadow-xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none ${activeStatusTab.activeBg}`}
            style={{
              left: `${statusIndicatorStyle.left}px`,
              width: `${statusIndicatorStyle.width}px`,
              opacity: statusIndicatorStyle.opacity
            }}
          />

          {statusTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = statusFilter === tab.key;

            return (
              <button
                key={tab.key}
                ref={(el) => { statusTabRefs.current[tab.key] = el; }}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`relative z-10 px-3.5 py-1.5 rounded-full transition-colors duration-200 cursor-pointer flex items-center gap-2 whitespace-nowrap text-xs ${
                  isActive
                    ? `${tab.activeText} font-bold`
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
                }`}
              >
                <Icon size={13} className="shrink-0" />
                <span>{tab.label}</span>
                <span className={`min-w-[18px] h-4 px-1.5 rounded-full text-[10px] font-bold inline-flex items-center justify-center transition-colors ${
                  isActive
                    ? tab.activeCountBg
                    : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border)]'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 03. TOOLBAR: SEARCH & CATEGORY PILLS ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border)] shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, title, locality, seller name..."
            className="w-full pl-9 pr-8 py-2 bg-[var(--bg-muted)]/60 hover:bg-[var(--bg-muted)] focus:bg-[var(--bg-surface)] border border-transparent focus:border-brand/40 text-xs font-medium rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {['ALL', 'Residential', 'Commercial', 'Land'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-[var(--text-primary)] text-[var(--bg-surface)] shadow-2xs'
                  : 'bg-[var(--bg-muted)]/70 text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {cat === 'ALL' ? 'All Types' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── 04. LISTING QUEUE (Table or Grid View) ── */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <AdminLoader text="Loading moderation inventory..." />
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-rose-500/10 border border-rose-500/20 rounded-2xl">
          <AlertCircle size={28} className="mx-auto mb-2 text-rose-500" />
          <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400">Connection Error</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => fetchData()}
            className="px-4 py-2 bg-brand text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="p-16 text-center bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)]">
            <CheckCircle2 size={24} className="text-emerald-500" />
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            {statusFilter === 'Pending' ? 'All Caught Up!' : 'No Matching Listings Found'}
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
            {statusFilter === 'Pending'
              ? 'There are no pending listings awaiting audit right now.'
              : 'Try clearing your search query or changing the status filter.'}
          </p>
          {(searchQuery || statusFilter !== 'All' || categoryFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setStatusFilter('All'); setCategoryFilter('ALL'); }}
              className="mt-4 px-4 py-2 bg-brand/10 text-brand hover:bg-brand/15 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        /* ── TABLE VIEW (Full-Fit 100% Zero Horizontal Scroll, Icon-Only Actions) ── */
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-2xs">
          <div className="w-full overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <colgroup>
                <col className="w-[23%]" />
                <col className="w-[15%]" />
                <col className="w-[10%]" />
                <col className="w-[7%]" />
                <col className="w-[14%]" />
                <col className="w-[9%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead className="bg-[var(--bg-muted)]/40 text-[var(--text-muted)] uppercase text-[9.5px] font-semibold tracking-wider border-b border-[var(--border)] select-none">
                <tr>
                  <th className="py-2 px-3">Property</th>
                  <th className="py-2 px-3">Location</th>
                  <th className="py-2 px-3">Price</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Seller / Owner</th>
                  <th className="py-2 px-3">Submitted</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 pl-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60 text-xs">
                {filteredList.map((item) => {
                  const mainImage = item.images?.[0] || item.gallery?.[0]?.url;

                  return (
                    <tr
                      key={item._id}
                      onClick={() => openReviewDrawer(item)}
                      className="hover:bg-[var(--bg-muted)]/35 transition-colors cursor-pointer group"
                    >
                      {/* Property Thumbnail & Info */}
                      <td className="py-1.5 px-3 align-middle overflow-hidden">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative w-8 h-8 rounded-md overflow-hidden bg-[var(--bg-muted)] shrink-0 border border-[var(--border)]">
                            {mainImage ? (
                              <SmoothImage src={mainImage} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                                <Building size={14} />
                              </div>
                            )}
                            {item.gallery?.length > 1 && (
                              <span className="absolute bottom-0.5 right-0.5 bg-black/75 text-white text-[7.5px] font-bold px-0.5 rounded leading-none">
                                {item.gallery.length}
                              </span>
                            )}
                            {item.videos?.length > 0 && (
                              <span className="absolute top-0.5 left-0.5 bg-purple-600/90 text-white text-[7px] font-bold px-1 py-0.2 rounded-xs flex items-center gap-0.5 shadow-2xs leading-none">
                                <Play size={5} className="fill-white" /> Video
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-brand transition-colors truncate" title={item.title}>
                                {item.title}
                              </span>
                              {item.category && (
                                <Badge.Category type={item.category} size="xs" />
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[10.5px] text-[var(--text-muted)] truncate font-mono mt-0.5 leading-tight">
                              <span>{item.id}</span>
                              {[item.bhk, item.area].filter(Boolean).length > 0 && (
                                <>
                                  <span className="text-[var(--border)] font-sans">•</span>
                                  <span className="font-sans truncate">{[item.bhk, item.area].filter(Boolean).join(' · ')}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-1.5 px-3 align-middle overflow-hidden">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 text-xs font-medium text-[var(--text-primary)] truncate">
                            <MapPin size={11} className="text-brand shrink-0 opacity-80" />
                            <span className="truncate">{item.locality || item.city}</span>
                          </div>
                          {item.locality && item.city && (
                            <span className="text-[10px] text-[var(--text-muted)] block pl-3.5 truncate leading-tight mt-0.5 capitalize">
                              {item.city}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-1.5 px-3 align-middle whitespace-nowrap overflow-hidden">
                        <span className="font-semibold text-xs text-[var(--text-primary)] block leading-tight">
                          {item.price}
                        </span>
                      </td>

                      {/* Listing Type (Sale / Rent Badge) */}
                      <td className="py-1.5 px-3 align-middle whitespace-nowrap">
                        {item.listingFor?.toLowerCase() === 'rent' ? (
                          <Badge.ForRent size="xs" variant="pastel">Rent</Badge.ForRent>
                        ) : (
                          <Badge.ForSale size="xs" variant="pastel">Sale</Badge.ForSale>
                        )}
                      </td>

                      {/* Seller Info */}
                      <td className="py-1.5 px-3 align-middle overflow-hidden">
                        <div className="min-w-0">
                          <span className="font-medium text-xs text-[var(--text-primary)] truncate block leading-tight">
                            {item.ownerName}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] block truncate font-mono leading-tight mt-0.5">
                            {item.ownerPhone}
                          </span>
                        </div>
                      </td>

                      {/* Submitted Date */}
                      <td className="py-1.5 px-3 align-middle whitespace-nowrap text-[11px] text-[var(--text-muted)]">
                        {item.submittedDate}
                      </td>

                      {/* Status */}
                      <td className="py-1.5 px-3 align-middle whitespace-nowrap">
                        {getStatusBadge(item.status, 'xs')}
                      </td>

                      {/* Actions (Icon-Only Minimalist Buttons) */}
                      <td className="py-1.5 pl-2 pr-4 align-middle text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => openReviewDrawer(item)}
                            className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--bg-muted)]/70 hover:bg-brand hover:text-white text-[var(--text-secondary)] border border-[var(--border)] transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                            title="Review & Audit Details"
                          >
                            <Eye size={12} />
                          </button>

                          {item.status !== 'Approved' && item.status !== 'Sold' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(item, 'Approved')}
                              disabled={isSubmittingAction}
                              className="w-6 h-6 rounded-md flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-500/20 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 disabled:opacity-50"
                              title="Approve & Publish Live"
                            >
                              <Check size={11} strokeWidth={2.5} />
                            </button>
                          )}

                          {/* Quick 1-Click Sold Out button for approved listings */}
                          {item.status === 'Approved' && !item.isSold && (
                            <button
                              type="button"
                              onClick={() => handleToggleSold(item, true)}
                              disabled={isSubmittingAction}
                              className="w-6 h-6 rounded-md flex items-center justify-center bg-amber-500/10 hover:bg-amber-500 text-amber-700 dark:text-amber-400 hover:text-white border border-amber-500/20 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 disabled:opacity-50"
                              title="Mark as Sold Out (Off-Market)"
                            >
                              <Tag size={11} strokeWidth={2.2} />
                            </button>
                          )}

                          {/* Quick 1-Click Relist button for sold listings */}
                          {(item.status === 'Sold' || item.isSold) && (
                            <button
                              type="button"
                              onClick={() => handleToggleSold(item, false)}
                              disabled={isSubmittingAction}
                              className="w-6 h-6 rounded-md flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-500/20 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 disabled:opacity-50"
                              title="Relist as Available"
                            >
                              <RotateCcw size={11} />
                            </button>
                          )}

                          {item.status !== 'Rejected' && item.status !== 'Sold' && (
                            <button
                              type="button"
                              onClick={() => { setSelectedItem(item); setShowRejectModal(true); }}
                              disabled={isSubmittingAction}
                              className="w-6 h-6 rounded-md flex items-center justify-center bg-rose-500/10 hover:bg-rose-500 text-rose-700 dark:text-rose-400 hover:text-white border border-rose-500/20 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 disabled:opacity-50"
                              title="Reject Listing"
                            >
                              <X size={11} strokeWidth={2.5} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-3.5 py-2 border-t border-[var(--border)] bg-[var(--bg-muted)]/20 flex items-center justify-between text-[11px] text-[var(--text-muted)] select-none">
            <span>Showing <span className="font-semibold text-[var(--text-primary)]">{filteredList.length}</span> of {activeList.length} listings</span>
            <span>{activePipeline === 'properties' ? 'Properties moderation queue' : 'Developer projects queue'}</span>
          </div>
        </div>
      )}

      {/* ── 05. SLIDE-OVER REVIEW DRAWER ("The Review Workspace") ── */}
      {isDrawerOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Window */}
          <div className="relative w-full max-w-2xl bg-[var(--bg-surface)] h-full shadow-2xl flex flex-col z-10 border-l border-[var(--border)] animate-in slide-in-from-right duration-250">
            
            {/* ── Drawer Header ── */}
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--bg-surface)]">
              <div className="flex items-center gap-2 min-w-0">
                <Badge color="brand" variant="soft" size="sm">
                  {selectedItem.id}
                </Badge>
                <h2 className="font-bold text-base text-[var(--text-primary)] truncate">
                  {selectedItem.title}
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedItem.status !== 'Approved' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedItem, 'Approved')}
                    disabled={isSubmittingAction}
                    className="h-7 px-3 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Check size={13} strokeWidth={2.5} />
                    <span>Approve & Publish</span>
                  </button>
                )}

                {selectedItem.status !== 'Rejected' && (
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(true)}
                    disabled={isSubmittingAction}
                    className="h-7 px-3 rounded-full text-xs font-semibold bg-red-500/12 text-red-700 dark:text-red-400 hover:bg-red-500 hover:text-white border border-red-500/25 cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <X size={13} strokeWidth={2.5} />
                    <span>Reject</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* ── Drawer Navigation Tabs ── */}
            <div className="flex items-center gap-4 px-4 border-b border-[var(--border)]/70 text-xs font-bold text-[var(--text-muted)] bg-[var(--bg-muted)]/30 shrink-0">
              <button
                type="button"
                onClick={() => setActiveDrawerTab('overview')}
                className={`py-2.5 border-b-2 transition-colors cursor-pointer ${
                  activeDrawerTab === 'overview' ? 'border-brand text-brand' : 'border-transparent hover:text-[var(--text-primary)]'
                }`}
              >
                Overview & Specs
              </button>
              <button
                type="button"
                onClick={() => setActiveDrawerTab('gallery')}
                className={`py-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1 ${
                  activeDrawerTab === 'gallery' ? 'border-brand text-brand' : 'border-transparent hover:text-[var(--text-primary)]'
                }`}
              >
                <span>Media Gallery</span>
                <span className="px-1.5 rounded-full text-[10px] bg-[var(--bg-muted)]">
                  {selectedItem.gallery?.length || 0}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveDrawerTab('docs')}
                className={`py-2.5 border-b-2 transition-colors cursor-pointer ${
                  activeDrawerTab === 'docs' ? 'border-brand text-brand' : 'border-transparent hover:text-[var(--text-primary)]'
                }`}
              >
                Legal & Verification
              </button>
            </div>

            {/* ── Drawer Scrollable Body ── */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
              
              {/* If Rejected Alert Banner */}
              {selectedItem.status === 'Rejected' && selectedItem.rejectionReason && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Rejection Reason:</strong>
                    <p className="mt-0.5">{selectedItem.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* If Marked as Sold (Pending 3-Day Confirmation) Alert Banner */}
              {selectedItem.saleStatus === 'marked_as_sold' && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs flex flex-col gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <Clock size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Marked as Sold (Confirmation Pending)</strong>
                      <p className="mt-0.5 text-[11px] opacity-90">
                        This property listing is currently pending 3-day sale confirmation. While pending, the listing remains active and visible in the mobile app.
                        {selectedItem.saleConfirmationDueDate && (
                          <span className="block mt-0.5 font-medium">
                            Due date: {new Date(selectedItem.saleConfirmationDueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-amber-500/20">
                    <button
                      type="button"
                      onClick={() => { setConfirmSaleAction('confirm'); setShowConfirmSaleModal(true); }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Check size={12} strokeWidth={2.5} />
                      <span>Confirm Sale (Hide from App)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setConfirmSaleAction('cancel'); setShowConfirmSaleModal(true); }}
                      className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] border border-[var(--border)] font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <X size={12} strokeWidth={2.5} />
                      <span>Sale Not Confirmed (Keep Active)</span>
                    </button>
                  </div>
                </div>
              )}

              {activeDrawerTab === 'overview' && (
                <div className="space-y-5">
                  {/* Price & Summary Header Box */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/50 border border-[var(--border)] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-[var(--text-muted)] font-medium block">
                        Listing Price ({selectedItem.listingFor})
                      </span>
                      <span className="text-2xl font-black text-brand tracking-tight">
                        {selectedItem.price}
                      </span>
                      {selectedItem.pricePerSqFt && (
                        <span className="text-xs text-[var(--text-muted)] font-medium ml-2">
                          ({selectedItem.pricePerSqFt})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedItem.listingFor === 'Rent' ? (
                        <Badge.ForRent size="sm" />
                      ) : (
                        <Badge.ForSale size="sm" />
                      )}
                      {getStatusBadge(selectedItem.status, 'sm')}
                    </div>
                  </div>

                  {/* Multiple BHK Options & Custom Pricing (strictly ONLY BHK and its custom Price) */}
                  {selectedItem.bhkConfigurations?.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          BHK Options & Pricing
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                          {selectedItem.bhkConfigurations.length} Configurations
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {selectedItem.bhkConfigurations.map((bhkItem, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-[var(--bg-muted)]/40 border border-[var(--border)] flex flex-col justify-between"
                          >
                            <span className="text-xs font-extrabold text-[var(--text-primary)] block mb-1">
                              {bhkItem.bhk}
                            </span>
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(bhkItem.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Core Specifications Grid */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2.5">
                      Property Specifications
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-xl bg-[var(--bg-muted)]/30 border border-[var(--border)]/60">
                        <span className="text-[10px] text-[var(--text-muted)] block">Configuration</span>
                        <strong className="text-[var(--text-primary)]">{selectedItem.bhk || 'N/A'}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--bg-muted)]/30 border border-[var(--border)]/60">
                        <span className="text-[10px] text-[var(--text-muted)] block">Carpet Area</span>
                        <strong className="text-[var(--text-primary)]">{selectedItem.carpetArea || selectedItem.area}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--bg-muted)]/30 border border-[var(--border)]/60">
                        <span className="text-[10px] text-[var(--text-muted)] block">Furnishing</span>
                        <strong className="text-[var(--text-primary)]">{selectedItem.furnishing}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--bg-muted)]/30 border border-[var(--border)]/60">
                        <span className="text-[10px] text-[var(--text-muted)] block">Facing</span>
                        <strong className="text-[var(--text-primary)]">{selectedItem.facing || 'N/A'}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--bg-muted)]/30 border border-[var(--border)]/60">
                        <span className="text-[10px] text-[var(--text-muted)] block">Floor</span>
                        <strong className="text-[var(--text-primary)]">{selectedItem.floorInfo || 'N/A'}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--bg-muted)]/30 border border-[var(--border)]/60">
                        <span className="text-[10px] text-[var(--text-muted)] block">Possession</span>
                        <strong className="text-[var(--text-primary)]">{selectedItem.possessionDate || 'Immediate'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Location & Address */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2.5">
                      Location & Address
                    </h3>
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border)]/60 text-xs space-y-1.5">
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-brand shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-[var(--text-primary)] block">
                            {selectedItem.fullAddress || selectedItem.location}
                          </strong>
                          <span className="text-[var(--text-muted)]">
                            {selectedItem.city} {selectedItem.pincode && `• ${selectedItem.pincode}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seller / Contact Info */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2.5">
                      Seller & Contact Information
                    </h3>
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border)]/60 text-xs flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-sm text-[var(--text-primary)]">{selectedItem.ownerName}</strong>
                          <Badge color="brand" variant="pastel" size="xs">
                            {selectedItem.ownerRole}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[var(--text-muted)] mt-1">
                          <span className="flex items-center gap-1">
                            <Phone size={12} /> {selectedItem.ownerPhone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail size={12} /> {selectedItem.ownerEmail}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedItem.ownerPhone, 'Phone number')}
                        className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                        title="Copy phone"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Amenities */}
                  {selectedItem.amenities?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2.5">
                        Amenities & Features
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedItem.amenities.map((am, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-[var(--bg-muted)] text-[var(--text-primary)] border border-[var(--border)]/50">
                            {am}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {selectedItem.description && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2.5">
                        Listing Description
                      </h3>
                      <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border)]/60 text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                        {selectedItem.description}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── GALLERY TAB ── */}
              {activeDrawerTab === 'gallery' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--text-primary)]">
                      All Uploaded Photos & Videos ({selectedItem.gallery?.length || 0})
                    </span>
                    <span className="text-[var(--text-muted)]">Click on any photo to preview full size</span>
                  </div>

                  {selectedItem.gallery?.length === 0 ? (
                    <div className="p-12 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-muted)]/30 rounded-2xl border border-[var(--border)]">
                      No media files uploaded for this listing.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {selectedItem.gallery.map((media, idx) => (
                        <div
                          key={idx}
                          onClick={() => { setActiveLightboxIndex(idx); setLightboxOpen(true); }}
                          className="relative h-28 rounded-xl overflow-hidden bg-[var(--bg-muted)] border border-[var(--border)] cursor-pointer group"
                        >
                          {media.type === 'video' ? (
                            <div className="w-full h-full flex items-center justify-center bg-black/90 text-white relative">
                              <video src={media.url} className="w-full h-full object-cover opacity-60" preload="metadata" muted />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                  <Play size={18} className="fill-white text-white ml-0.5" />
                                </div>
                              </div>
                              <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Film size={10} /> Video
                              </span>
                            </div>
                          ) : (
                            <SmoothImage src={media.url} alt={`Media ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          )}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Maximize2 size={16} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── LEGAL & DOCS TAB ── */}
              {activeDrawerTab === 'docs' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border)]/60 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] font-bold block uppercase">
                        RERA Registration Number
                      </span>
                      <strong className="text-sm text-[var(--text-primary)] font-mono">
                        {selectedItem.reraNumber || 'Not Provided / Exempt'}
                      </strong>
                    </div>
                    {selectedItem.reraNumber && (
                      <Badge color="emerald" variant="pastel" size="xs" icon={<Check size={10} strokeWidth={2.8} className="shrink-0" />}>
                        Provided
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] pt-2">
                    Verification Documents Checklist
                  </h3>

                  <div className="space-y-2 text-xs">
                    {[
                      { key: 'reraCertificate', label: 'RERA Registration Certificate' },
                      { key: 'saleDeed', label: 'Title Deed / Sale Deed' },
                      { key: 'electricityBill', label: 'Utility / Electricity Bill' },
                      { key: 'identityProof', label: 'Owner Identity / PAN Proof' },
                      { key: 'taxReceipt', label: 'Property Tax Receipt' },
                    ].map((doc) => {
                      const docUrl = selectedItem.propertyDocuments?.[doc.key];
                      return (
                        <div
                          key={doc.key}
                          className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <FileText size={16} className={docUrl ? 'text-brand' : 'text-[var(--text-muted)]'} />
                            <span className="font-semibold text-[var(--text-primary)]">{doc.label}</span>
                          </div>
                          {docUrl ? (
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-brand/10 hover:bg-brand/20 text-brand font-bold text-[11px] flex items-center gap-1 transition-colors"
                            >
                              <span>View Doc</span>
                              <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span className="text-[11px] text-[var(--text-muted)]">Not Uploaded</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── Drawer Footer Actions ── */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="h-8 px-3.5 rounded-full text-xs font-semibold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/25 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Trash2 size={13} />
                <span>Delete Listing</span>
              </button>

              <div className="flex items-center gap-2">
                {/* 1-Click Instant Mark as Sold Out */}
                {selectedItem.status === 'Approved' && !selectedItem.isSold && (
                  <button
                    type="button"
                    onClick={() => handleToggleSold(selectedItem, true)}
                    disabled={isSubmittingAction}
                    className="h-8 px-3.5 rounded-full text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                    title="Instantly mark this listing as Sold Out"
                  >
                    <Tag size={13} strokeWidth={2.2} />
                    <span>Mark as Sold Out</span>
                  </button>
                )}

                {/* 1-Click Instant Relist as Available */}
                {(selectedItem.status === 'Sold' || selectedItem.isSold) && (
                  <button
                    type="button"
                    onClick={() => handleToggleSold(selectedItem, false)}
                    disabled={isSubmittingAction}
                    className="h-8 px-3.5 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                    title="Relist listing as available on GharMB"
                  >
                    <RotateCcw size={13} />
                    <span>Relist as Available</span>
                  </button>
                )}

                {selectedItem.status !== 'Approved' && selectedItem.status !== 'Sold' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedItem, 'Approved')}
                    disabled={isSubmittingAction}
                    className="h-8 px-4 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Check size={13} strokeWidth={2.5} />
                    <span>Approve & Publish Live</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 06. QUICK REJECTION MODAL ── */}
      {showRejectModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowRejectModal(false)} />
          <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-5 z-10 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Reject Property Listing</h3>
                <p className="text-xs text-[var(--text-muted)]">{selectedItem.title} ({selectedItem.id})</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-muted)] block">Select Reason for Rejection:</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {QUICK_REJECTION_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                      selectedRejectReason === reason
                        ? 'border-brand bg-brand/5 text-brand font-bold'
                        : 'border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rejectReason"
                      value={reason}
                      checked={selectedRejectReason === reason}
                      onChange={() => setSelectedRejectReason(reason)}
                      className="accent-brand"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-muted)] block">Additional Note (Optional):</label>
              <textarea
                rows={2}
                value={customRejectNote}
                onChange={(e) => setCustomRejectNote(e.target.value)}
                placeholder="Specific instructions for seller..."
                className="w-full px-3 py-2 border border-[var(--border)] rounded-xl bg-[var(--bg-muted)]/40 text-xs text-[var(--text-primary)] outline-none focus:border-brand"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="h-8 px-4 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] rounded-full text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(selectedItem, 'Rejected', customRejectNote ? `${selectedRejectReason}: ${customRejectNote}` : selectedRejectReason)}
                disabled={isSubmittingAction}
                className="h-8 px-4 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 07. DELETE CONFIRMATION MODAL ── */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowDeleteModal(false)} />
          <div className="relative w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-5 z-10 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/12 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={20} />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Permanently Delete Listing?</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Are you sure you want to delete <strong className="text-[var(--text-primary)]">{selectedItem.title}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteListing}
                disabled={isDeleting}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 07B. MARK AS SOLD MODAL (REQUIREMENT 15) ── */}
      {showMarkSoldModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowMarkSoldModal(false)} />
          <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-5 z-10 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Mark Property as Sold</h3>
                <p className="text-xs text-[var(--text-muted)]">{selectedItem.title} ({selectedItem.id})</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMarkSoldModal(false)}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-300">
                <p className="font-semibold">
                  When marked as sold, a sale confirmation notification will be triggered after 3 days.
                </p>
                <p className="mt-1 text-[11px] opacity-90">
                  While confirmation is pending, the listing remains active and visible in the mobile app.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Confirmation Trigger (Days):
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={markSoldDays}
                  onChange={(e) => setMarkSoldDays(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-brand"
                  placeholder="3"
                />
                <span className="text-[10.5px] text-[var(--text-muted)] mt-0.5 block">
                  Default is 3 days (enter 0 for instant test notification).
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Optional Admin Note:
                </label>
                <textarea
                  value={markSoldNotes}
                  onChange={(e) => setMarkSoldNotes(e.target.value)}
                  placeholder="e.g. Buyer token received, pending final registration..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-brand"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowMarkSoldModal(false)}
                className="flex-1 py-2 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMarkAsSold}
                disabled={isSubmittingAction}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingAction ? 'Processing...' : 'Mark as Sold'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 07C. CONFIRM SALE STATUS MODAL (REQUIREMENT 15) ── */}
      {showConfirmSaleModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowConfirmSaleModal(false)} />
          <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-5 z-10 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {confirmSaleAction === 'confirm' ? 'Confirm Property Sale' : 'Sale Not Confirmed'}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">{selectedItem.title} ({selectedItem.id})</p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmSaleModal(false)}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {confirmSaleAction === 'confirm' ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-900 dark:text-emerald-300">
                  <p className="font-semibold">
                    The property will be marked as officially SOLD and permanently hidden from the mobile app.
                  </p>
                  <p className="mt-1 text-[11px] opacity-90">
                    Buyers will no longer see this property in search feeds or listing collections.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-900 dark:text-blue-300">
                  <p className="font-semibold">
                    The sale is NOT confirmed. This property will remain ACTIVE and available in the mobile app.
                  </p>
                  <p className="mt-1 text-[11px] opacity-90">
                    The listing will return to active status and continue receiving buyer enquiries.
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Optional Remarks / Reason:
                </label>
                <textarea
                  value={confirmSaleNotes}
                  onChange={(e) => setConfirmSaleNotes(e.target.value)}
                  placeholder={confirmSaleAction === 'confirm' ? "Sale deed executed, deal closed." : "Deal did not materialize, listing kept live."}
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-brand"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowConfirmSaleModal(false)}
                className="flex-1 py-2 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmSale(confirmSaleAction === 'confirm')}
                disabled={isSubmittingAction}
                className={`flex-1 py-2 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                  confirmSaleAction === 'confirm'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-brand hover:bg-brand/90'
                }`}
              >
                {isSubmittingAction
                  ? 'Processing...'
                  : (confirmSaleAction === 'confirm' ? 'Confirm Sale (Unlist)' : 'Keep Active')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 08. FULLSCREEN LIGHTBOX ── */}
      {lightboxOpen && selectedItem && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col justify-between p-4 select-none">
          <div className="flex items-center justify-between text-white shrink-0">
            <span className="text-xs font-mono font-bold">
              {activeLightboxIndex + 1} / {selectedItem.gallery?.length || 1}
            </span>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center relative min-h-0">
            {selectedItem.gallery?.[activeLightboxIndex]?.type === 'video' ? (
              <video
                src={selectedItem.gallery[activeLightboxIndex].url}
                controls
                autoPlay
                className="max-h-[80vh] max-w-[90vw] object-contain rounded-xl"
              />
            ) : (
              <img
                src={selectedItem.gallery?.[activeLightboxIndex]?.url}
                alt="Preview"
                className="max-h-[80vh] max-w-[90vw] object-contain rounded-xl"
              />
            )}

            {selectedItem.gallery?.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveLightboxIndex(prev => (prev > 0 ? prev - 1 : selectedItem.gallery.length - 1))}
                  className="absolute left-4 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLightboxIndex(prev => (prev < selectedItem.gallery.length - 1 ? prev + 1 : 0))}
                  className="absolute right-4 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors cursor-pointer"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          <div className="text-center text-white/70 text-xs shrink-0">
            Press Esc to close • Use Left / Right arrow keys to navigate
          </div>
        </div>
      )}
    </div>
  );
}