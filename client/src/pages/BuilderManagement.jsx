import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import AdminLoader from '../components/common/AdminLoader';
import SmoothImage from '../components/common/SmoothImage';
import API, { getMediaUrl } from '../api/api';
import Badge from '../components/ui/Badge';
import {
  HardHat,
  Award,
  Layers,
  MapPin,
  FileCheck,
  Search,
  ShieldAlert,
  ShieldCheck,
  Ban,
  CheckCircle,
  CheckCircle2,
  X,
  XCircle,
  Trash2,
  Check,
  Copy,
  ExternalLink,
  Phone,
  Mail,
  AlertCircle,
  FileText,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Building2,
  Building,
  Clock,
  Sparkles,
  Tag,
  RefreshCw,
  AlertTriangle,
  Play,
  Film,
  List,
  LayoutGrid,
  ChevronRight,
  SlidersHorizontal,
  Home,
  CheckCheck
} from 'lucide-react';

const PRESET_REJECT_REASONS = [
  'RERA License documents verification incomplete, expired, or mismatch with state authority',
  'Company PAN card name does not match registered commercial entity name',
  'GSTIN validation failed or invalid corporate registration proof',
  'Uploaded documents are illegible or blurry — please re-upload clear color scans',
  'Corporate office verification and director authorization pending',
  'Blueprint structural plans or environmental clearance not attached'
];

export default function BuilderManagement() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // ── 01. Module Pipeline State ('builders' | 'projects') ───────────────────
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname.includes('/projects') || searchParams.get('tab') === 'projects') {
      return 'projects';
    }
    return 'builders';
  });

  // ── 02. Data States ───────────────────────────────────────────────────────
  const [builders, setBuilders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoadingBuilders, setIsLoadingBuilders] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Just now');
  const lastSyncTimestampRef = useRef(Date.now());

  // ── 03. Filter & View States ──────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Pending' | 'Approved' | 'Suspended'
  const [secondaryFilter, setSecondaryFilter] = useState('ALL'); // Builders: 'ALL'|'RERA_DOC'|'ISO'|'HIGH_TRUST' ; Projects: 'ALL'|'RESIDENTIAL'|'COMMERCIAL'|'READY'|'UNDER_CONST'
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('builders_projects_view') || 'table';
    } catch {
      return 'table';
    }
  });

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('builders_projects_view', mode);
    } catch {
      // ignore
    }
  };

  // ── 04. Sliding Switch Refs & Geometries ──────────────────────────────────
  const moduleTabRefs = useRef({});
  const [moduleIndicatorStyle, setModuleIndicatorStyle] = useState({ left: 4, width: 0, opacity: 0 });

  const statusTabRefs = useRef({});
  const [statusIndicatorStyle, setStatusIndicatorStyle] = useState({ left: 4, width: 0, opacity: 0 });

  const viewModeRefs = useRef({});
  const [viewModeIndicatorStyle, setViewModeIndicatorStyle] = useState({ left: 4, width: 0, opacity: 0 });

  // ── 05. Drawer & Selection States ─────────────────────────────────────────
  const [selectedBuilder, setSelectedBuilder] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [builderDrawerTab, setBuilderDrawerTab] = useState('overview'); // 'overview' | 'docs' | 'credentials'
  const [projectDrawerTab, setProjectDrawerTab] = useState('overview'); // 'overview' | 'gallery' | 'investment'

  // ── 06. Modal States ──────────────────────────────────────────────────────
  const [rejectPrompt, setRejectPrompt] = useState(null); // { item, type: 'builder' | 'project' }
  const [selectedRejectReason, setSelectedRejectReason] = useState(PRESET_REJECT_REASONS[0]);
  const [customRejectNote, setCustomRejectNote] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { item, type: 'builder' | 'project' }
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Investment Score Modal
  const [editingScoreProject, setEditingScoreProject] = useState(null);
  const [scoreForm, setScoreForm] = useState({
    connectivity: 9.0,
    rentalPotential: 8.5,
    growthPotential: 9.0,
    familyLiving: 8.8,
    futureDemand: 9.0,
  });
  const [isSavingScore, setIsSavingScore] = useState(false);

  // Document & Video Lightbox
  const [lightboxDoc, setLightboxDoc] = useState(null); // { url, title, type }
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Toast feedback
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const copyToClipboard = (text, label = 'Text') => {
    if (!text || text === 'N/A') return;
    navigator.clipboard?.writeText(text);
    showToast(`${label} copied to clipboard!`, 'info');
  };

  const getDocumentUrl = (url) => getMediaUrl(url);

  const getRelativeTime = (dateString) => {
    if (!dateString) return 'Recent';
    try {
      const diffMs = Date.now() - new Date(dateString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (_) {
      return 'Recent';
    }
  };

  // ── 07. Data Fetching ─────────────────────────────────────────────────────
  const fetchBuilders = useCallback(async () => {
    setIsLoadingBuilders(true);
    try {
      const response = await API.get('/admin/users?role=builder');
      const data = response.data;
      if (data?.status === 'success' && data.data?.users) {
        const mapped = data.data.users.map((u) => {
          let status = 'Pending';
          if (u.builderVerificationStatus === 'approved') status = 'Approved';
          else if (u.builderVerificationStatus === 'rejected') status = 'Rejected';
          else if (u.builderVerificationStatus === 'unverified') status = 'Pending';
          else if (u.status === 'Blocked') status = 'Suspended';

          const reraDoc = getDocumentUrl(u.builderDocs?.reraCertificate);
          const panDoc = getDocumentUrl(u.builderDocs?.panCard);
          const logoDoc = getDocumentUrl(u.builderDocs?.companyLogo || u.profilePicture);

          return {
            id: `BLD-${u._id.slice(-4).toUpperCase()}`,
            _id: u._id,
            name: u.companyName || u.name,
            companyName: u.companyName || u.name,
            applicantName: u.name,
            rera: u.reraNumber || 'Pending Check',
            exp: parseInt(u.yearsInBusiness, 10) || 0,
            yearsInBusinessText: u.yearsInBusiness
              ? (String(u.yearsInBusiness).toLowerCase().includes('yr') ? String(u.yearsInBusiness) : `${u.yearsInBusiness} yrs`)
              : 'Not specified',
            delivered: parseInt(u.unitsDelivered, 10) || 0,
            trust: u.builderVerificationStatus === 'approved' ? (u.rating ? Math.round(u.rating * 20) : 100) : u.builderVerificationStatus === 'pending' ? 55 : 30,
            status,
            builderVerificationStatus: u.builderVerificationStatus || 'pending',
            user: u.email || u.phone || 'N/A',
            email: u.email || 'N/A',
            phone: u.phone || 'N/A',
            cityOfOperation: u.cityOfOperation || (u.address?.city) || 'India',
            corporateAddress: u.address?.formattedAddress || (u.cityOfOperation ? `${u.cityOfOperation}, India` : 'Registered Address'),
            cin: u.cin || 'Not provided',
            gstin: u.gstNumber || 'Pending Submission',
            pan: panDoc ? 'PAN Uploaded' : 'N/A',
            builderDocs: {
              reraCertificate: reraDoc,
              panCard: panDoc,
              companyLogo: logoDoc
            },
            hasReraDoc: Boolean(reraDoc),
            hasPanDoc: Boolean(panDoc),
            bio: u.bio || '',
            isIsoCertified: Boolean(u.isIsoCertified),
            internalRiskRating: u.builderVerificationStatus === 'approved' ? 'Tier-1 A+ (Verified)' : u.builderVerificationStatus === 'pending' ? 'Tier-2 (Under Audit)' : 'High Watchlist',
            accountManager: 'Executive Admin',
            internalNotes: u.builderRejectionReason ? `Audit Note: ${u.builderRejectionReason}` : 'Company profile submitted for platform verification.',
            createdAt: u.createdAt,
            updatedAt: u.updatedAt
          };
        });
        setBuilders(mapped);
      }
    } catch (err) {
      console.error('Error fetching builders:', err);
    } finally {
      setIsLoadingBuilders(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    try {
      const response = await API.get('/admin/projects');
      const data = response.data;
      if (data?.status === 'success' && data.data?.projects) {
        const mapped = data.data.projects.map((p) => {
          let status = 'Draft';
          if (p.isSold) status = 'Sold';
          else if (p.approvalStatus === 'approved') status = 'Published';
          else if (p.approvalStatus === 'rejected') status = 'Archived';

          const invScore = p.investmentScore || {
            overall: 0,
            grade: 'Not Rated',
            metrics: {
              connectivity: 0,
              rentalPotential: 0,
              growthPotential: 0,
              familyLiving: 0,
              futureDemand: 0,
            },
          };

          const rawPhotos = Array.isArray(p.projectPhotos) ? p.projectPhotos : [];
          const rawVideos = Array.isArray(p.projectVideos) ? p.projectVideos : [];
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
                decoded.includes('contenttype=video')
              );
            } catch (_) {
              return /\.(mp4|webm|mov|m4v|mkv|avi|3gp)/i.test(url) || url.toLowerCase().includes('video');
            }
          };
          const photos = rawPhotos.filter(u => !isVideoUrl(u));
          const videos = [...rawVideos, ...rawPhotos.filter(u => isVideoUrl(u))];
          const gallery = Array.isArray(p.gallery) && p.gallery.length > 0
            ? p.gallery
            : [
                ...photos.map(url => ({ url: getDocumentUrl(url), type: 'image' })),
                ...videos.map(url => ({ url: getDocumentUrl(url), type: 'video' })),
              ];

          return {
            id: p.submissionId || `PRJ-${p._id.slice(-4).toUpperCase()}`,
            _id: p._id,
            title: p.projectName || 'Untitled Project',
            builder: p.developerName || p.developer?.companyName || p.developer?.name || 'Developer Entity',
            developerEmail: p.developer?.email || '',
            location: `${p.locality ? p.locality + ', ' : ''}${p.city || 'India'}`,
            city: p.city || 'India',
            score: invScore.overall || (p.approvalStatus === 'approved' ? 9.2 : 7.0),
            investmentScore: invScore,
            status,
            approvalStatus: p.approvalStatus || 'pending',
            units: `${p.totalUnits || 0} Units`,
            totalUnits: p.totalUnits || 0,
            stage: p.projectStatus || 'Under construction',
            category: p.projectType || 'Residential',
            reraNumbers: Array.isArray(p.reraNumbers) && p.reraNumbers.length > 0
              ? p.reraNumbers.map((r, idx) => {
                  if (typeof r === 'string') return { name: `Phase ${idx + 1}`, reraNumber: r };
                  return { name: r.name || `Phase ${idx + 1}`, reraNumber: r.reraNumber || '' };
                }).filter(r => r.reraNumber)
              : (p.reraProjectNumber ? [{ name: 'Phase 1', reraNumber: p.reraProjectNumber }] : []),
            reraNumber: (Array.isArray(p.reraNumbers) && p.reraNumbers[0]?.reraNumber) || (typeof p.reraNumbers?.[0] === 'string' ? p.reraNumbers[0] : '') || p.reraProjectNumber || 'Pending',
            possessionDate: p.possessionDate || 'Dec 2026',
            description: p.shortDescription || p.description || 'Residential/Commercial developer project development.',
            photos: photos.map(getDocumentUrl),
            videos: videos.map(getDocumentUrl),
            gallery,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            rejectionReason: p.rejectionReason || '',
            isSold: Boolean(p.isSold),
            saleStatus: p.saleStatus || (p.isSold ? 'sold' : 'available'),
          };
        });
        setProjects(mapped);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchBuilders(), fetchProjects()]);
    lastSyncTimestampRef.current = Date.now();
    setLastSyncTime('Just now');
    setIsRefreshing(false);
    showToast('Inventory & builder records synchronized!', 'info');
  }, [fetchBuilders, fetchProjects]);

  useEffect(() => {
    fetchBuilders();
    fetchProjects();

    const interval = setInterval(() => {
      const diffSecs = Math.floor((Date.now() - lastSyncTimestampRef.current) / 1000);
      if (diffSecs < 60) setLastSyncTime('Just now');
      else setLastSyncTime(`${Math.floor(diffSecs / 60)}m ago`);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchBuilders, fetchProjects]);

  // ── 08. Counts & Computed Metrics ─────────────────────────────────────────
  const builderCounts = useMemo(() => {
    const total = builders.length;
    const pending = builders.filter(b => b.status === 'Pending').length;
    const approved = builders.filter(b => b.status === 'Approved').length;
    const suspended = builders.filter(b => b.status === 'Suspended' || b.status === 'Rejected').length;
    return { total, pending, approved, suspended };
  }, [builders]);

  const projectCounts = useMemo(() => {
    const total = projects.length;
    const pending = projects.filter(p => p.status === 'Draft' || p.status === 'Pending').length;
    const approved = projects.filter(p => p.status === 'Published' || p.status === 'Approved').length;
    const suspended = projects.filter(p => p.status === 'Archived' || p.status === 'Suspended' || p.status === 'Rejected').length;
    return { total, pending, approved, suspended };
  }, [projects]);

  const currentCounts = activeTab === 'builders' ? builderCounts : projectCounts;

  // ── 09. Sliding Status Tabs Specification (BADGES_UI_DESIGN_SYSTEM.md Tokens) ─
  const statusTabs = useMemo(() => {
    if (activeTab === 'builders') {
      return [
        {
          key: 'All',
          label: 'All Builders',
          count: builderCounts.total,
          icon: Building2,
          activeBg: 'bg-[#ffc5bb] dark:bg-[#4f160e]',
          activeText: 'text-[#992211] dark:text-[#ff9b8a]',
          activeCountBg: 'bg-[#992211]/15 text-[#992211] dark:bg-[#ff9b8a]/25 dark:text-[#ff9b8a]'
        },
        {
          key: 'Pending',
          label: 'Needs Audit',
          count: builderCounts.pending,
          icon: Clock,
          activeBg: 'bg-[#fef08a] dark:bg-[#4d3209]',
          activeText: 'text-[#78350f] dark:text-[#fef08a]',
          activeCountBg: 'bg-[#78350f]/15 text-[#78350f] dark:bg-[#fef08a]/25 dark:text-[#fef08a]'
        },
        {
          key: 'Approved',
          label: 'RERA Verified & Live',
          count: builderCounts.approved,
          icon: CheckCircle2,
          activeBg: 'bg-[#52c99b] dark:bg-[#1a4a38]',
          activeText: 'text-[#064e3b] dark:text-[#6ee7b7]',
          activeCountBg: 'bg-[#064e3b]/15 text-[#064e3b] dark:bg-[#6ee7b7]/25 dark:text-[#6ee7b7]'
        },
        {
          key: 'Suspended',
          label: 'Suspended / Rejected',
          count: builderCounts.suspended,
          icon: XCircle,
          activeBg: 'bg-[#fca5a5] dark:bg-[#521722]',
          activeText: 'text-[#701a2b] dark:text-[#fda4af]',
          activeCountBg: 'bg-[#701a2b]/15 text-[#701a2b] dark:bg-[#fda4af]/25 dark:text-[#fda4af]'
        }
      ];
    }
    return [
      {
        key: 'All',
        label: 'All Projects',
        count: projectCounts.total,
        icon: Layers,
        activeBg: 'bg-[#ffc5bb] dark:bg-[#4f160e]',
        activeText: 'text-[#992211] dark:text-[#ff9b8a]',
        activeCountBg: 'bg-[#992211]/15 text-[#992211] dark:bg-[#ff9b8a]/25 dark:text-[#ff9b8a]'
      },
      {
        key: 'Pending',
        label: 'Draft / In Audit',
        count: projectCounts.pending,
        icon: Clock,
        activeBg: 'bg-[#fef08a] dark:bg-[#4d3209]',
        activeText: 'text-[#78350f] dark:text-[#fef08a]',
        activeCountBg: 'bg-[#78350f]/15 text-[#78350f] dark:bg-[#fef08a]/25 dark:text-[#fef08a]'
      },
      {
        key: 'Approved',
        label: 'Published Live',
        count: projectCounts.approved,
        icon: CheckCircle2,
        activeBg: 'bg-[#52c99b] dark:bg-[#1a4a38]',
        activeText: 'text-[#064e3b] dark:text-[#6ee7b7]',
        activeCountBg: 'bg-[#064e3b]/15 text-[#064e3b] dark:bg-[#6ee7b7]/25 dark:text-[#6ee7b7]'
      },
      {
        key: 'Suspended',
        label: 'Archived',
        count: projectCounts.suspended,
        icon: XCircle,
        activeBg: 'bg-[#fca5a5] dark:bg-[#521722]',
        activeText: 'text-[#701a2b] dark:text-[#fda4af]',
        activeCountBg: 'bg-[#701a2b]/15 text-[#701a2b] dark:bg-[#fda4af]/25 dark:text-[#fda4af]'
      }
    ];
  }, [activeTab, builderCounts, projectCounts]);

  const activeStatusTab = useMemo(() => {
    return statusTabs.find(t => t.key === statusFilter) || statusTabs[0];
  }, [statusTabs, statusFilter]);

  // ── 10. Geometry Calculators for Sliding Switch Indicators ─────────────────
  useEffect(() => {
    const updateModuleIndicator = () => {
      const el = moduleTabRefs.current[activeTab];
      if (el) {
        setModuleIndicatorStyle({
          left: el.offsetLeft,
          width: el.offsetWidth,
          opacity: 1
        });
      }
    };
    updateModuleIndicator();
    window.addEventListener('resize', updateModuleIndicator);
    const t = setTimeout(updateModuleIndicator, 50);
    return () => {
      window.removeEventListener('resize', updateModuleIndicator);
      clearTimeout(t);
    };
  }, [activeTab, builders.length, projects.length]);

  useEffect(() => {
    const updateStatusIndicator = () => {
      const el = statusTabRefs.current[statusFilter];
      if (el) {
        setStatusIndicatorStyle({
          left: el.offsetLeft,
          width: el.offsetWidth,
          opacity: 1
        });
      }
    };
    updateStatusIndicator();
    window.addEventListener('resize', updateStatusIndicator);
    const t = setTimeout(updateStatusIndicator, 50);
    return () => {
      window.removeEventListener('resize', updateStatusIndicator);
      clearTimeout(t);
    };
  }, [statusFilter, statusTabs, activeTab]);

  useEffect(() => {
    const updateViewIndicator = () => {
      const el = viewModeRefs.current[viewMode];
      if (el) {
        setViewModeIndicatorStyle({
          left: el.offsetLeft,
          width: el.offsetWidth,
          opacity: 1
        });
      }
    };
    updateViewIndicator();
    window.addEventListener('resize', updateViewIndicator);
    const t = setTimeout(updateViewIndicator, 50);
    return () => {
      window.removeEventListener('resize', updateViewIndicator);
      clearTimeout(t);
    };
  }, [viewMode]);

  // ── 11. Filtering Logic ───────────────────────────────────────────────────
  const filteredBuilders = useMemo(() => {
    return builders.filter((b) => {
      if (statusFilter !== 'All') {
        if (statusFilter === 'Suspended') {
          if (b.status !== 'Suspended' && b.status !== 'Rejected') return false;
        } else if (b.status !== statusFilter) {
          return false;
        }
      }

      if (secondaryFilter !== 'ALL') {
        if (secondaryFilter === 'RERA_DOC' && !b.hasReraDoc) return false;
        if (secondaryFilter === 'ISO' && !b.isIsoCertified) return false;
        if (secondaryFilter === 'HIGH_TRUST' && b.trust < 80) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          b.name?.toLowerCase().includes(q) ||
          b.rera?.toLowerCase().includes(q) ||
          b.user?.toLowerCase().includes(q) ||
          b.id?.toLowerCase().includes(q) ||
          b.cityOfOperation?.toLowerCase().includes(q) ||
          b.gstin?.toLowerCase().includes(q) ||
          b.applicantName?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [builders, statusFilter, secondaryFilter, searchQuery]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== 'All') {
        if (statusFilter === 'Pending' && p.status !== 'Draft' && p.status !== 'Pending') return false;
        if (statusFilter === 'Approved' && p.status !== 'Published' && p.status !== 'Approved') return false;
        if (statusFilter === 'Suspended' && p.status !== 'Archived' && p.status !== 'Suspended') return false;
      }

      if (secondaryFilter !== 'ALL') {
        if (secondaryFilter === 'RESIDENTIAL' && !p.category?.toLowerCase().includes('res')) return false;
        if (secondaryFilter === 'COMMERCIAL' && !p.category?.toLowerCase().includes('comm')) return false;
        if (secondaryFilter === 'READY' && !p.stage?.toLowerCase().includes('ready')) return false;
        if (secondaryFilter === 'UNDER_CONST' && !p.stage?.toLowerCase().includes('under')) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          p.title?.toLowerCase().includes(q) ||
          p.builder?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          p.id?.toLowerCase().includes(q) ||
          p.reraNumber?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [projects, statusFilter, secondaryFilter, searchQuery]);

  // ── 12. Actions (Builder & Project Statuses) ───────────────────────────────
  const updateBuilderStatus = async (builder, newStatus, reason = '') => {
    if (!builder) return;
    setIsSubmittingAction(true);
    try {
      const bodyStatus = newStatus === 'Approved' ? 'approved' : 'rejected';
      const response = await API.patch(`/admin/users/${builder._id}/verify-developer`, {
        builderVerificationStatus: bodyStatus,
        rejectReason: reason || (newStatus === 'Approved' ? 'Verified and Approved by Admin' : selectedRejectReason)
      });
      const data = response.data;
      if (data?.status === 'success') {
        setBuilders(prev =>
          prev.map(b => b._id === builder._id ? {
            ...b,
            status: newStatus,
            builderVerificationStatus: bodyStatus,
            trust: newStatus === 'Approved' ? 95 : 35
          } : b)
        );

        if (selectedBuilder?._id === builder._id) {
          setSelectedBuilder(prev => ({
            ...prev,
            status: newStatus,
            builderVerificationStatus: bodyStatus,
            trust: newStatus === 'Approved' ? 95 : 35
          }));
        }

        setRejectPrompt(null);
        setCustomRejectNote('');
        showToast(
          newStatus === 'Approved'
            ? `🎉 Builder "${builder.companyName}" verified & authorized successfully!`
            : `Builder application updated to ${newStatus}.`,
          newStatus === 'Approved' ? 'success' : 'info'
        );
      } else {
        showToast(data?.message || 'Failed to update builder verification.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || 'Connection error updating builder status.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const deleteBuilder = async (builder) => {
    if (!builder) return;
    setIsSubmittingAction(true);
    try {
      await API.delete(`/admin/users/${builder._id}`);
      setBuilders(prev => prev.filter(b => b._id !== builder._id));
      setSelectedBuilder(null);
      setDeleteConfirm(null);
      showToast('Builder account deactivated successfully.', 'info');
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || 'Error deleting builder account.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const updateProjectStatus = async (project, newStatus, reason = '') => {
    if (!project) return;
    setIsSubmittingAction(true);
    try {
      let apiStatus = 'pending';
      if (newStatus === 'Published' || newStatus === 'Approved') apiStatus = 'approved';
      else if (newStatus === 'Archived' || newStatus === 'Rejected') apiStatus = 'rejected';

      const response = await API.patch(`/admin/projects/${project._id}/status`, {
        approvalStatus: apiStatus,
        rejectionReason: reason || (newStatus === 'Published' ? 'Approved & Published by Admin' : selectedRejectReason)
      });
      const data = response.data;
      if (data?.status === 'success') {
        setProjects(prev =>
          prev.map(p => p._id === project._id ? { ...p, status: newStatus, approvalStatus: apiStatus } : p)
        );

        if (selectedProject?._id === project._id) {
          setSelectedProject(prev => ({ ...prev, status: newStatus, approvalStatus: apiStatus }));
        }

        setRejectPrompt(null);
        setCustomRejectNote('');
        showToast(`Project status updated to ${newStatus}.`, 'success');
      } else {
        showToast(data?.message || 'Failed to update project status.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || 'Connection error updating project status.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const toggleProjectSoldStatus = async (project, targetSold) => {
    if (!project) return;
    setIsSubmittingAction(true);
    try {
      const response = await API.patch(`/admin/projects/${project._id}/toggle-sold`, {
        isSold: targetSold,
        notes: targetSold ? 'Project marked as Sold Out by Admin' : 'Project relisted as Available by Admin'
      });
      if (response.data?.status === 'success') {
        const newStatus = targetSold ? 'Sold' : 'Published';
        setProjects(prev =>
          prev.map(p => p._id === project._id ? { ...p, status: newStatus, isSold: targetSold, saleStatus: targetSold ? 'sold' : 'available' } : p)
        );
        if (selectedProject?._id === project._id) {
          setSelectedProject(prev => ({ ...prev, status: newStatus, isSold: targetSold, saleStatus: targetSold ? 'sold' : 'available' }));
        }
        showToast(targetSold ? `Project "${project.projectName || project.name || project.title}" marked as Sold Out!` : `Project relisted as Available!`, 'success');
      } else {
        showToast(response.data?.message || 'Failed to update sold status.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || 'Error updating project sale status.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const deleteProject = async (project) => {
    if (!project) return;
    setIsSubmittingAction(true);
    try {
      await API.delete(`/admin/projects/${project._id}`);
      setProjects(prev => prev.filter(p => p._id !== project._id));
      setSelectedProject(null);
      setDeleteConfirm(null);
      showToast('Project deleted successfully.', 'info');
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || 'Error connecting to server.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // ── 13. Investment Score Form Handlers ────────────────────────────────────
  const openScoreModal = (project) => {
    const cur = project.investmentScore?.metrics || {};
    setScoreForm({
      connectivity: cur.connectivity ?? 9.0,
      rentalPotential: cur.rentalPotential ?? 8.5,
      growthPotential: cur.growthPotential ?? 9.0,
      familyLiving: cur.familyLiving ?? 8.8,
      futureDemand: cur.futureDemand ?? 9.0,
    });
    setEditingScoreProject(project);
  };

  const computedOverall = useMemo(() => {
    const vals = [
      Number(scoreForm.connectivity) || 0,
      Number(scoreForm.rentalPotential) || 0,
      Number(scoreForm.growthPotential) || 0,
      Number(scoreForm.familyLiving) || 0,
      Number(scoreForm.futureDemand) || 0,
    ];
    const sum = vals.reduce((a, b) => a + b, 0);
    return Math.round((sum / vals.length) * 10) / 10;
  }, [scoreForm]);

  const computedGrade = useMemo(() => {
    if (computedOverall >= 8.5) return 'Excellent';
    if (computedOverall >= 7.0) return 'Very Good';
    if (computedOverall >= 5.5) return 'Good';
    return 'Average';
  }, [computedOverall]);

  const handleSaveScore = async () => {
    if (!editingScoreProject) return;
    setIsSavingScore(true);
    try {
      const payload = {
        connectivity: Number(scoreForm.connectivity),
        rentalPotential: Number(scoreForm.rentalPotential),
        growthPotential: Number(scoreForm.growthPotential),
        familyLiving: Number(scoreForm.familyLiving),
        futureDemand: Number(scoreForm.futureDemand),
      };
      const res = await API.put(`/admin/projects/${editingScoreProject._id}/investment-score`, payload);
      if (res.data?.status === 'success') {
        showToast('Project investment score updated successfully!', 'success');
        fetchProjects();
        if (selectedProject?._id === editingScoreProject._id) {
          setSelectedProject(prev => ({
            ...prev,
            investmentScore: res.data.data.investmentScore,
            score: res.data.data.investmentScore.overall,
          }));
        }
        setEditingScoreProject(null);
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update investment score.', 'error');
    } finally {
      setIsSavingScore(false);
    }
  };

  // ── 14. Document & Lightbox Trigger ───────────────────────────────────────
  const openDocumentPreview = (url, title = 'Document Preview', type = 'image') => {
    if (!url) {
      showToast('Document not uploaded by builder.', 'error');
      return;
    }
    setZoomLevel(1);
    setRotation(0);
    setLightboxDoc({ url, title, type });
  };

  // ── 15. Semantic Badge Helpers (BADGES_UI_DESIGN_SYSTEM.md Spec) ───────────
  const getBuilderStatusBadge = (status, size = 'xs') => {
    switch (status) {
      case 'Approved':
        return <Badge.Active size={size}>Approved</Badge.Active>;
      case 'Pending':
        return <Badge.Pending size={size} pulse>Needs Audit</Badge.Pending>;
      case 'Suspended':
      case 'Rejected':
        return <Badge.Offline size={size}>Suspended</Badge.Offline>;
      default:
        return <Badge color="slate" variant="pastel" size={size}>{status || 'Unknown'}</Badge>;
    }
  };

  const getProjectStatusBadge = (status, size = 'xs') => {
    switch (status) {
      case 'Sold':
        return <Badge.Sold size={size}>Sold Out</Badge.Sold>;
      case 'Published':
      case 'Approved':
        return <Badge.Approved size={size}>Published</Badge.Approved>;
      case 'Draft':
      case 'Pending':
        return <Badge.Pending size={size} pulse>Draft</Badge.Pending>;
      case 'Archived':
      case 'Rejected':
        return <Badge.Rejected size={size}>Archived</Badge.Rejected>;
      default:
        return <Badge color="slate" variant="pastel" size={size}>{status || 'Unknown'}</Badge>;
    }
  };

  const getTrustBadge = (score, size = 'xs') => {
    if (score >= 90) {
      return <Badge color="emerald" variant="pastel" size={size} icon={<ShieldCheck size={10} className="shrink-0" />}>{score}% A+</Badge>;
    }
    if (score >= 70) {
      return <Badge color="amber" variant="pastel" size={size} icon={<ShieldAlert size={10} className="shrink-0" />}>{score}% Tier-2</Badge>;
    }
    return <Badge color="red" variant="pastel" size={size} icon={<AlertTriangle size={10} className="shrink-0" />}>{score}% Watch</Badge>;
  };

  return (
    <div className="space-y-5 pb-12">
      {/* ── 01. TOAST NOTIFICATION ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[80] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] animate-slide-down">
          {toast.type === 'success' && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
          {toast.type === 'error' && <XCircle size={16} className="text-rose-500 shrink-0" />}
          {toast.type === 'info' && <Check size={16} className="text-brand shrink-0" />}
          <span className="text-xs font-semibold">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer ml-2"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── 02. TOP HEADER & PIPELINE SLIDING SWITCH ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-2 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Builders & Projects
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#52c99b]/15 text-[#064e3b] dark:bg-[#1a4a38]/40 dark:text-[#6ee7b7] border border-[#52c99b]/25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync • {lastSyncTime}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Audit builder credentials, RERA licenses, and moderate real estate developments on GharMB
          </p>
        </div>

        {/* Pipeline Toggle (Builders vs Builder Projects Sliding Switch) */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="relative inline-flex items-center p-1 bg-[var(--bg-muted)]/80 rounded-full border border-[var(--border)] text-xs font-semibold select-none shadow-inner-xs">
            {/* Sliding Pill Indicator */}
            <span
              className={`absolute top-1 bottom-1 rounded-full shadow-xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none ${
                activeTab === 'builders' ? 'bg-[#52c99b] dark:bg-[#1a4a38]' : 'bg-[#c4b5fd] dark:bg-[#3b1968]'
              }`}
              style={{
                left: `${moduleIndicatorStyle.left}px`,
                width: `${moduleIndicatorStyle.width}px`,
                opacity: moduleIndicatorStyle.opacity
              }}
            />

            <button
              ref={(el) => { moduleTabRefs.current['builders'] = el; }}
              type="button"
              onClick={() => {
                setActiveTab('builders');
                setStatusFilter('All');
                setSecondaryFilter('ALL');
                setSelectedBuilder(null);
                setSelectedProject(null);
              }}
              className={`relative z-10 px-3.5 py-1.5 rounded-full transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === 'builders'
                  ? 'text-[#064e3b] dark:text-[#6ee7b7] font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
              }`}
            >
              <HardHat size={13} className="shrink-0" />
              <span>Builders</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold transition-colors ${
                activeTab === 'builders'
                  ? 'bg-[#064e3b]/15 text-[#064e3b] dark:bg-[#6ee7b7]/25 dark:text-[#6ee7b7]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border)]'
              }`}>
                {builders.length}
              </span>
            </button>

            <button
              ref={(el) => { moduleTabRefs.current['projects'] = el; }}
              type="button"
              onClick={() => {
                setActiveTab('projects');
                setStatusFilter('All');
                setSecondaryFilter('ALL');
                setSelectedBuilder(null);
                setSelectedProject(null);
              }}
              className={`relative z-10 px-3.5 py-1.5 rounded-full transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === 'projects'
                  ? 'text-[#4c1d95] dark:text-[#ddd6fe] font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
              }`}
            >
              <Layers size={13} className="shrink-0" />
              <span>Builder Projects</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold transition-colors ${
                activeTab === 'projects'
                  ? 'bg-[#4c1d95]/15 text-[#4c1d95] dark:bg-[#ddd6fe]/25 dark:text-[#ddd6fe]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border)]'
              }`}>
                {projects.length}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={refreshAllData}
            disabled={isRefreshing || isLoadingBuilders || isLoadingProjects}
            className="p-2 border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Refresh listings & builders"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-brand' : ''} />
          </button>
        </div>
      </div>

      {/* ── 03. 4 STANDARDIZED TOP-ACCENT KPI METRICS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            key: 'kpi_total',
            title: activeTab === 'builders' ? 'Total Builders' : 'Total Projects',
            value: currentCounts.total,
            subtitle: activeTab === 'builders' ? 'Registered entities' : 'Active developments',
            tag: 'Entities',
            icon: activeTab === 'builders' ? Building2 : Layers,
            isActive: statusFilter === 'All',
            activeAccent: 'border-t-2 border-t-brand ring-1 ring-brand/30',
            onClick: () => setStatusFilter('All')
          },
          {
            key: 'kpi_pending',
            title: 'Needs Audit',
            value: currentCounts.pending,
            subtitle: activeTab === 'builders' ? 'Awaiting verification' : 'Draft / Moderation',
            tag: currentCounts.pending > 0 ? `${currentCounts.pending} Pending` : 'All Clear',
            icon: Clock,
            pulse: currentCounts.pending > 0,
            isActive: statusFilter === 'Pending',
            activeAccent: 'border-t-2 border-t-amber-500 ring-1 ring-amber-500/30',
            onClick: () => setStatusFilter('Pending')
          },
          {
            key: 'kpi_approved',
            title: activeTab === 'builders' ? 'RERA Verified' : 'Published Live',
            value: currentCounts.approved,
            subtitle: activeTab === 'builders' ? 'Compliant & active' : 'Live on platform',
            tag: 'Live',
            icon: CheckCircle2,
            isActive: statusFilter === 'Approved',
            activeAccent: 'border-t-2 border-t-emerald-500 ring-1 ring-emerald-500/30',
            onClick: () => setStatusFilter('Approved')
          },
          {
            key: 'kpi_suspended',
            title: activeTab === 'builders' ? 'Suspended / Rejected' : 'Archived',
            value: currentCounts.suspended,
            subtitle: 'Offline / Restricted',
            tag: 'Off-Market',
            icon: XCircle,
            isActive: statusFilter === 'Suspended',
            activeAccent: 'border-t-2 border-t-rose-500 ring-1 ring-rose-500/30',
            onClick: () => setStatusFilter('Suspended')
          }
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              onClick={card.onClick}
              className={`group bg-[var(--bg-surface)] rounded-xl p-3.5 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden flex flex-col justify-between border border-[var(--border)] text-left cursor-pointer ${
                card.isActive ? card.activeAccent : 'border-t-2 border-t-[var(--border)] hover:border-t-brand'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                    {card.title}
                    {card.pulse && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                      {card.value}
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 text-brand bg-brand/10">
                  <Icon size={16} strokeWidth={2} />
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)] truncate">{card.subtitle}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-[var(--text-muted)]">
                  {card.tag}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 04. HIGH-VISIBILITY PENDING AUDIT PRIORITY BANNER ── */}
      {currentCounts.pending > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-[var(--text-primary)]">
                  {currentCounts.pending} {activeTab === 'builders' ? 'Builder Authorization' : 'Project Moderation'} Request{currentCounts.pending > 1 ? 's' : ''} Awaiting Review
                </h4>
                <Badge.Pending size="xs" pulse>Priority Action</Badge.Pending>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
                {activeTab === 'builders'
                  ? 'Verify state RERA license certificates, corporate PAN numbers, and company registration before granting live publishing credentials.'
                  : 'Examine blueprint approvals, investment score parameters, and RERA registration proofs before publishing project inventory.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('Pending')}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Clock size={13} /> Filter Pending ({currentCounts.pending})
            </button>
            {activeTab === 'builders' && builders.find(b => b.status === 'Pending') && (
              <button
                type="button"
                onClick={() => setSelectedBuilder(builders.find(b => b.status === 'Pending'))}
                className="px-3 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                Review First <ChevronRight size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── 05. SLIDING STATUS TOGGLE SWITCH (BADGES DESIGN SYSTEM TOKENS) ── */}
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

      {/* ── 06. TOOLBAR: SEARCH, CATEGORY PILLS & VIEW SWITCHER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border)] shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'builders' ? 'Search by company, RERA, applicant, city...' : 'Search by project name, developer, locality...'}
            className="w-full pl-9 pr-8 py-2 bg-[var(--bg-muted)]/60 hover:bg-[var(--bg-muted)] focus:bg-[var(--bg-surface)] border border-transparent focus:border-brand/40 text-xs font-medium rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Secondary Category Filters & View Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {activeTab === 'builders' ? (
            [
              { key: 'ALL', label: 'All Builders' },
              { key: 'RERA_DOC', label: 'With RERA Doc' },
              { key: 'ISO', label: 'ISO Certified' },
              { key: 'HIGH_TRUST', label: 'Top Trust (80%+)' },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setSecondaryFilter(f.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  secondaryFilter === f.key
                    ? 'bg-[var(--text-primary)] text-[var(--bg-surface)] shadow-2xs'
                    : 'bg-[var(--bg-muted)]/70 text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {f.label}
              </button>
            ))
          ) : (
            [
              { key: 'ALL', label: 'All Types' },
              { key: 'RESIDENTIAL', label: 'Residential' },
              { key: 'COMMERCIAL', label: 'Commercial' },
              { key: 'UNDER_CONST', label: 'Under Construction' },
              { key: 'READY', label: 'Ready to Move' },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setSecondaryFilter(f.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  secondaryFilter === f.key
                    ? 'bg-[var(--text-primary)] text-[var(--bg-surface)] shadow-2xs'
                    : 'bg-[var(--bg-muted)]/70 text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {f.label}
              </button>
            ))
          )}

          <div className="h-5 w-[1px] bg-[var(--border)] mx-1" />

          {/* View Switcher: List vs Grid Sliding Switch */}
          <div className="relative inline-flex items-center p-1 bg-[var(--bg-muted)]/80 rounded-full border border-[var(--border)] text-xs font-semibold select-none shadow-inner-xs">
            <span
              className="absolute top-1 bottom-1 rounded-full shadow-xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none bg-[#bae6fd] dark:bg-[#113c54]"
              style={{
                left: `${viewModeIndicatorStyle.left}px`,
                width: `${viewModeIndicatorStyle.width}px`,
                opacity: viewModeIndicatorStyle.opacity
              }}
            />
            <button
              ref={(el) => { viewModeRefs.current['table'] = el; }}
              type="button"
              onClick={() => handleSetViewMode('table')}
              className={`relative z-10 px-3 py-1 rounded-full transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
                viewMode === 'table'
                  ? 'text-[#075985] dark:text-[#7dd3fc] font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
              }`}
              title="Table view"
            >
              <List size={13} />
              <span>List</span>
            </button>
            <button
              ref={(el) => { viewModeRefs.current['grid'] = el; }}
              type="button"
              onClick={() => handleSetViewMode('grid')}
              className={`relative z-10 px-3 py-1 rounded-full transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
                viewMode === 'grid'
                  ? 'text-[#075985] dark:text-[#7dd3fc] font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
              }`}
              title="Grid view"
            >
              <LayoutGrid size={13} />
              <span>Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 07. MAIN INVENTORY DISPLAY (TABLE OR GRID) ── */}
      {activeTab === 'builders' ? (
        /* ======================== BUILDERS VIEW ======================== */
        isLoadingBuilders ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <AdminLoader text="Loading registered builder credentials..." />
          </div>
        ) : filteredBuilders.length === 0 ? (
          <div className="p-16 text-center bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)]">
              <CheckCircle2 size={24} className="text-emerald-500" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              {statusFilter === 'Pending' ? 'All Builder Applications Reviewed!' : 'No Matching Builders Found'}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
              {statusFilter === 'Pending'
                ? 'There are currently no builder applications awaiting verification.'
                : 'Try adjusting your search criteria or resetting filters.'}
            </p>
            {(searchQuery || statusFilter !== 'All' || secondaryFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setStatusFilter('All'); setSecondaryFilter('ALL'); }}
                className="mt-4 px-4 py-2 bg-brand/10 text-brand hover:bg-brand/15 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* Table View: Full-Fit 100% Zero Horizontal Scroll */
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-2xs">
            <div className="w-full overflow-hidden">
              <table className="w-full text-left border-collapse table-fixed">
                <colgroup>
                  <col className="w-[28%]" />
                  <col className="w-[17%]" />
                  <col className="w-[15%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                  <col className="w-[8%]" />
                </colgroup>
                <thead className="bg-[var(--bg-muted)]/40 text-[var(--text-muted)] uppercase text-[9.5px] font-semibold tracking-wider border-b border-[var(--border)] select-none">
                  <tr>
                    <th className="py-2 px-3">Company / Legal Entity</th>
                    <th className="py-2 px-3">RERA License</th>
                    <th className="py-2 px-3">Verification Proofs</th>
                    <th className="py-2 px-3">Experience</th>
                    <th className="py-2 px-3 text-center">Trust Rating</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 pl-2 pr-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/60 text-xs">
                  {filteredBuilders.map((b) => (
                    <tr
                      key={b._id}
                      onClick={() => { setSelectedBuilder(b); setBuilderDrawerTab('overview'); }}
                      className="hover:bg-[var(--bg-muted)]/35 transition-colors cursor-pointer group"
                    >
                      {/* Column 1: Company Logo / Name */}
                      <td className="py-1.5 px-3 align-middle overflow-hidden">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-[var(--bg-muted)] shrink-0 border border-[var(--border)] flex items-center justify-center">
                            {b.builderDocs?.companyLogo ? (
                              <SmoothImage src={b.builderDocs.companyLogo} alt={b.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-brand/20 to-orange-500/20 text-brand font-black text-xs flex items-center justify-center">
                                {b.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-brand transition-colors truncate" title={b.name}>
                                {b.name}
                              </span>
                              {b.isIsoCertified && (
                                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 shrink-0">
                                  ISO
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10.5px] text-[var(--text-muted)] truncate font-mono mt-0.5 leading-tight">
                              <span className="text-brand font-semibold">{b.id}</span>
                              <span className="text-[var(--border)] font-sans">•</span>
                              <span className="font-sans truncate flex items-center gap-0.5">
                                <MapPin size={10} className="shrink-0 text-[var(--text-muted)]" /> {b.cityOfOperation}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: RERA License */}
                      <td className="py-1.5 px-3 align-middle overflow-hidden">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 font-mono font-semibold text-xs text-[var(--text-primary)] truncate">
                            <span className="truncate">{b.rera}</span>
                            {b.rera && b.rera !== 'Pending Check' && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); copyToClipboard(b.rera, 'RERA Number'); }}
                                className="text-[var(--text-muted)] hover:text-brand p-0.5 cursor-pointer shrink-0"
                                title="Copy RERA"
                              >
                                <Copy size={10} />
                              </button>
                            )}
                          </div>
                          <div className="mt-0.5">
                            {b.hasReraDoc ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDocumentPreview(b.builderDocs.reraCertificate, `RERA Certificate - ${b.name}`);
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-[#52c99b]/20 hover:bg-[#52c99b]/35 px-1.5 py-0.2 rounded transition-all cursor-pointer"
                              >
                                <FileCheck size={10} /> View Cert
                              </button>
                            ) : (
                              <span className="text-[9.5px] font-medium text-amber-700 dark:text-amber-400">
                                No Cert File
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Verification Proofs */}
                      <td className="py-1.5 px-3 align-middle overflow-hidden">
                        <div className="min-w-0 flex flex-col gap-0.5">
                          {b.hasPanDoc ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDocumentPreview(b.builderDocs.panCard, `PAN Card - ${b.name}`);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-[#075985] dark:text-[#7dd3fc] bg-[#bae6fd]/30 hover:bg-[#bae6fd]/50 px-1.5 py-0.2 rounded transition-all cursor-pointer w-fit"
                            >
                              <FileText size={10} /> PAN Card
                            </button>
                          ) : (
                            <span className="text-[9.5px] text-[var(--text-muted)] italic">No PAN Upload</span>
                          )}
                          <span className="text-[9.5px] text-[var(--text-muted)] font-mono truncate">
                            GST: {b.gstin !== 'Pending Submission' ? b.gstin : 'None'}
                          </span>
                        </div>
                      </td>

                      {/* Column 4: Experience */}
                      <td className="py-1.5 px-3 align-middle whitespace-nowrap overflow-hidden">
                        <span className="font-semibold text-xs text-[var(--text-primary)] block leading-tight">
                          {b.yearsInBusinessText}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                          {b.delivered} units built
                        </span>
                      </td>

                      {/* Column 5: Trust Rating */}
                      <td className="py-1.5 px-3 align-middle text-center whitespace-nowrap">
                        {getTrustBadge(b.trust, 'xs')}
                      </td>

                      {/* Column 6: Status */}
                      <td className="py-1.5 px-3 align-middle whitespace-nowrap">
                        {getBuilderStatusBadge(b.status, 'xs')}
                      </td>

                      {/* Column 7: Actions */}
                      <td className="py-1.5 pl-2 pr-3.5 align-middle text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => { setSelectedBuilder(b); setBuilderDrawerTab('overview'); }}
                            className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--bg-muted)]/70 hover:bg-brand hover:text-white text-[var(--text-secondary)] border border-[var(--border)] transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                            title="Inspect & Review Details"
                          >
                            <Eye size={12} />
                          </button>

                          {b.status !== 'Approved' && (
                            <button
                              type="button"
                              onClick={() => updateBuilderStatus(b, 'Approved')}
                              disabled={isSubmittingAction}
                              className="w-6 h-6 rounded-md flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-500/20 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 disabled:opacity-50"
                              title="Approve & Authorize License"
                            >
                              <Check size={11} strokeWidth={2.5} />
                            </button>
                          )}

                          {b.status !== 'Suspended' && b.status !== 'Rejected' && (
                            <button
                              type="button"
                              onClick={() => setRejectPrompt({ item: b, type: 'builder' })}
                              disabled={isSubmittingAction}
                              className="w-6 h-6 rounded-md flex items-center justify-center bg-rose-500/10 hover:bg-rose-500 text-rose-700 dark:text-rose-400 hover:text-white border border-rose-500/20 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 disabled:opacity-50"
                              title="Reject or Suspend Builder"
                            >
                              <Ban size={11} strokeWidth={2.5} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-3.5 py-2 border-t border-[var(--border)] bg-[var(--bg-muted)]/20 flex items-center justify-between text-[11px] text-[var(--text-muted)] select-none">
              <span>Showing <span className="font-semibold text-[var(--text-primary)]">{filteredBuilders.length}</span> of {builders.length} registered builders</span>
              <span>Developer verification queue</span>
            </div>
          </div>
        ) : (
          /* Grid View: Clean, Interactive Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5">
            {filteredBuilders.map((b) => (
              <div
                key={b._id}
                onClick={() => { setSelectedBuilder(b); setBuilderDrawerTab('overview'); }}
                className="bg-[var(--bg-surface)] border border-[var(--border)] hover:border-brand/40 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-[var(--bg-muted)] shrink-0 border border-[var(--border)] flex items-center justify-center">
                      {b.builderDocs?.companyLogo ? (
                        <SmoothImage src={b.builderDocs.companyLogo} alt={b.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-brand/20 to-orange-500/20 text-brand font-black text-sm flex items-center justify-center">
                          {b.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {getBuilderStatusBadge(b.status, 'xs')}
                  </div>

                  {/* Company Info */}
                  <div className="mt-3">
                    <h3 className="font-bold text-xs text-[var(--text-primary)] group-hover:text-brand transition-colors truncate" title={b.name}>
                      {b.name}
                    </h3>
                    <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{b.id}</p>
                    <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-1 truncate">
                      <MapPin size={11} className="shrink-0 text-brand" /> {b.cityOfOperation}
                    </p>
                  </div>

                  {/* Key Metrics Matrix */}
                  <div className="grid grid-cols-2 gap-1.5 mt-3 pt-3 border-t border-[var(--border)]/60 text-[10px]">
                    <div className="p-2 rounded-xl bg-[var(--bg-muted)]/50">
                      <span className="text-[var(--text-muted)] block text-[9px] uppercase">Experience</span>
                      <strong className="text-[var(--text-primary)]">{b.yearsInBusinessText}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-[var(--bg-muted)]/50">
                      <span className="text-[var(--text-muted)] block text-[9px] uppercase">Delivered</span>
                      <strong className="text-[var(--text-primary)]">{b.delivered} units</strong>
                    </div>
                  </div>

                  {/* Proofs & Trust */}
                  <div className="flex items-center justify-between gap-1 mt-2.5">
                    {b.hasReraDoc ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-[#52c99b]/20 px-2 py-0.5 rounded-full">
                        <FileCheck size={10} /> RERA Cert
                      </span>
                    ) : (
                      <span className="text-[9.5px] text-amber-700 dark:text-amber-400">No RERA File</span>
                    )}
                    {getTrustBadge(b.trust, 'xs')}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => { setSelectedBuilder(b); setBuilderDrawerTab('overview'); }}
                    className="flex-1 py-1.5 px-2 bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)]/80 text-[var(--text-primary)] rounded-xl text-[11px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye size={12} /> Inspect
                  </button>
                  {b.status === 'Pending' && (
                    <button
                      type="button"
                      onClick={() => updateBuilderStatus(b, 'Approved')}
                      disabled={isSubmittingAction}
                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <Check size={12} strokeWidth={2.5} /> Approve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ======================== PROJECTS VIEW ======================== */
        isLoadingProjects ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <AdminLoader text="Loading real estate developer projects..." />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-16 text-center bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)]">
              <Layers size={24} className="text-brand" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              {statusFilter === 'Pending' ? 'No Draft Projects Pending Moderation' : 'No Projects Found'}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
              {statusFilter === 'Pending'
                ? 'All submitted developer projects have been moderated and published.'
                : 'Try clearing your search query or switching filters.'}
            </p>
            {(searchQuery || statusFilter !== 'All' || secondaryFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setStatusFilter('All'); setSecondaryFilter('ALL'); }}
                className="mt-4 px-4 py-2 bg-brand/10 text-brand hover:bg-brand/15 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* Projects Table View: Full-Fit 100% Zero Horizontal Scroll */
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-2xs">
            <div className="w-full overflow-hidden">
              <table className="w-full text-left border-collapse table-fixed">
                <colgroup>
                  <col className="w-[28%]" />
                  <col className="w-[18%]" />
                  <col className="w-[14%]" />
                  <col className="w-[18%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead className="bg-[var(--bg-muted)]/40 text-[var(--text-muted)] uppercase text-[9.5px] font-semibold tracking-wider border-b border-[var(--border)] select-none">
                  <tr>
                    <th className="py-2 px-3">Project Title / ID</th>
                    <th className="py-2 px-3">Location</th>
                    <th className="py-2 px-3">Inventory & Stage</th>
                    <th className="py-2 px-3">Investment Score</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 pl-2 pr-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/60 text-xs">
                  {filteredProjects.map((p) => {
                    const heroImage = p.photos?.[0] || p.gallery?.[0]?.url;

                    return (
                      <tr
                        key={p._id}
                        onClick={() => { setSelectedProject(p); setProjectDrawerTab('overview'); }}
                        className="hover:bg-[var(--bg-muted)]/35 transition-colors cursor-pointer group"
                      >
                        {/* Column 1: Thumbnail & Project Info */}
                        <td className="py-1.5 px-3 align-middle overflow-hidden">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-[var(--bg-muted)] shrink-0 border border-[var(--border)]">
                              {heroImage ? (
                                <SmoothImage src={heroImage} alt={p.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                                  <Building size={14} />
                                </div>
                              )}
                              {p.videos?.length > 0 && (
                                <span className="absolute top-0.5 left-0.5 bg-purple-600/90 text-white text-[7px] font-bold px-1 py-0.2 rounded-xs flex items-center gap-0.5 shadow-2xs leading-none">
                                  <Play size={5} className="fill-white" />
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-brand transition-colors truncate" title={p.title}>
                                  {p.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10.5px] text-[var(--text-muted)] truncate font-mono mt-0.5 leading-tight">
                                <span className="text-brand font-semibold">{p.id}</span>
                                <span className="text-[var(--border)] font-sans">•</span>
                                <span className="font-sans truncate text-[var(--text-muted)]">{p.builder}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Location */}
                        <td className="py-1.5 px-3 align-middle overflow-hidden">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 text-xs font-medium text-[var(--text-primary)] truncate">
                              <MapPin size={11} className="text-brand shrink-0 opacity-80" />
                              <span className="truncate">{p.location}</span>
                            </div>
                            <span className="text-[10px] text-[var(--text-muted)] block pl-3.5 truncate leading-tight mt-0.5 font-mono">
                              RERA: {p.reraNumber}
                            </span>
                          </div>
                        </td>

                        {/* Column 3: Inventory & Stage */}
                        <td className="py-1.5 px-3 align-middle whitespace-nowrap overflow-hidden">
                          <span className="font-semibold text-xs text-[var(--text-primary)] block leading-tight">
                            {p.units}
                          </span>
                          <span className="text-[9.5px] font-medium text-[var(--text-muted)] block mt-0.5">
                            {p.stage}
                          </span>
                        </td>

                        {/* Column 4: Investment Score */}
                        <td className="py-1.5 px-3 align-middle whitespace-nowrap overflow-hidden">
                          <div
                            onClick={(e) => { e.stopPropagation(); openScoreModal(p); }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#52c99b]/20 text-[#064e3b] dark:bg-[#1a4a38] dark:text-[#6ee7b7] border border-[#52c99b]/30 hover:scale-105 transition-transform cursor-pointer"
                            title="Click to adjust investment score metrics"
                          >
                            <Sparkles size={10} className="shrink-0" />
                            <span>{p.score || 0} / 10</span>
                            <span className="text-[9px] opacity-75 font-normal ml-0.5">({p.investmentScore?.grade || 'Good'})</span>
                          </div>
                        </td>

                        {/* Column 5: Status */}
                        <td className="py-1.5 px-3 align-middle whitespace-nowrap">
                          {getProjectStatusBadge(p.status, 'xs')}
                        </td>

                        {/* Column 6: Actions */}
                        <td className="py-1.5 pl-2 pr-3.5 align-middle text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => { setSelectedProject(p); setProjectDrawerTab('overview'); }}
                              className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--bg-muted)]/70 hover:bg-brand hover:text-white text-[var(--text-secondary)] border border-[var(--border)] transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                              title="Inspect Project"
                            >
                              <Eye size={12} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openScoreModal(p)}
                              className="w-6 h-6 rounded-md flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-500/20 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                              title="Edit Investment Score"
                            >
                              <Sparkles size={11} />
                            </button>

                            {/* Sold Out / Relist Actions */}
                            {p.status === 'Published' && !p.isSold && (
                              <button
                                type="button"
                                onClick={() => toggleProjectSoldStatus(p, true)}
                                disabled={isSubmittingAction}
                                className="w-6 h-6 rounded-md flex items-center justify-center bg-amber-500/10 hover:bg-amber-500 text-amber-700 dark:text-amber-400 hover:text-white border border-amber-500/20 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 disabled:opacity-50"
                                title="Mark Project as Sold Out"
                              >
                                <Tag size={11} strokeWidth={2.2} />
                              </button>
                            )}

                            {(p.status === 'Sold' || p.isSold) && (
                              <button
                                type="button"
                                onClick={() => toggleProjectSoldStatus(p, false)}
                                disabled={isSubmittingAction}
                                className="w-6 h-6 rounded-md flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-500/20 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 disabled:opacity-50"
                                title="Relist Project as Available"
                              >
                                <RotateCcw size={11} />
                              </button>
                            )}

                            {p.status !== 'Published' && p.status !== 'Sold' && (
                              <button
                                type="button"
                                onClick={() => updateProjectStatus(p, 'Published')}
                                disabled={isSubmittingAction}
                                className="w-6 h-6 rounded-md flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-500/20 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 disabled:opacity-50"
                                title="Publish Project Live"
                              >
                                <Check size={11} strokeWidth={2.5} />
                              </button>
                            )}

                            {p.status !== 'Archived' && (
                              <button
                                type="button"
                                onClick={() => setRejectPrompt({ item: p, type: 'project' })}
                                disabled={isSubmittingAction}
                                className="w-6 h-6 rounded-md flex items-center justify-center bg-rose-500/10 hover:bg-rose-500 text-rose-700 dark:text-rose-400 hover:text-white border border-rose-500/20 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 disabled:opacity-50"
                                title="Suspend or Archive Project"
                              >
                                <Ban size={11} strokeWidth={2.5} />
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
              <span>Showing <span className="font-semibold text-[var(--text-primary)]">{filteredProjects.length}</span> of {projects.length} developer projects</span>
              <span>Project moderation inventory</span>
            </div>
          </div>
        ) : (
          /* Projects Grid View: Modern Responsive Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5">
            {filteredProjects.map((p) => {
              const heroImage = p.photos?.[0] || p.gallery?.[0]?.url;

              return (
                <div
                  key={p._id}
                  onClick={() => { setSelectedProject(p); setProjectDrawerTab('overview'); }}
                  className="bg-[var(--bg-surface)] border border-[var(--border)] hover:border-brand/40 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Media Thumbnail */}
                    <div className="relative h-32 w-full bg-[var(--bg-muted)] overflow-hidden">
                      {heroImage ? (
                        <SmoothImage src={heroImage} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                          <Building size={24} />
                        </div>
                      )}

                      {/* Status Badge Overlay */}
                      <div className="absolute top-2 right-2">
                        {getProjectStatusBadge(p.status, 'xs')}
                      </div>

                      {/* Video Count Overlay */}
                      {p.videos?.length > 0 && (
                        <span className="absolute bottom-2 left-2 bg-purple-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                          <Play size={8} className="fill-white" /> {p.videos.length} Videos
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3.5">
                      <h3 className="font-bold text-xs text-[var(--text-primary)] group-hover:text-brand transition-colors truncate" title={p.title}>
                        {p.title}
                      </h3>
                      <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{p.id} • {p.builder}</p>

                      <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-1.5 truncate">
                        <MapPin size={11} className="shrink-0 text-brand" /> {p.location}
                      </p>

                      <div className="flex items-center justify-between gap-1 mt-3 pt-2.5 border-t border-[var(--border)]/60 text-[10px]">
                        <span className="font-semibold text-[var(--text-primary)]">{p.units}</span>
                        <span className="text-[var(--text-muted)]">{p.stage}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-3 bg-[var(--bg-muted)]/30 border-t border-[var(--border)] flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => openScoreModal(p)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 transition-colors cursor-pointer"
                    >
                      <Sparkles size={11} /> Score ({p.score})
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedProject(p); setProjectDrawerTab('overview'); }}
                      className="px-2.5 py-1 bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer"
                    >
                      Moderate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── 08. BUILDER REVIEW & AUDIT DRAWER (Slide-Over Panel) ── */}
      {selectedBuilder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-end">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] h-full max-w-xl w-full shadow-2xl border-l border-[var(--border)] flex flex-col justify-between animate-slide-left">
            {/* Drawer Top Header */}
            <div className="p-5 border-b border-[var(--border)] flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-[var(--bg-muted)] shrink-0 border border-[var(--border)] flex items-center justify-center">
                  {selectedBuilder.builderDocs?.companyLogo ? (
                    <img src={selectedBuilder.builderDocs.companyLogo} alt={selectedBuilder.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand/20 to-orange-500/20 text-brand font-black text-sm flex items-center justify-center">
                      {selectedBuilder.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand">{selectedBuilder.id}</span>
                    {getBuilderStatusBadge(selectedBuilder.status, 'xs')}
                  </div>
                  <h2 className="text-base font-bold text-[var(--text-primary)] mt-0.5">
                    {selectedBuilder.companyName}
                  </h2>
                  <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                    <MapPin size={11} className="text-brand" /> {selectedBuilder.cityOfOperation} • Applied {getRelativeTime(selectedBuilder.createdAt)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBuilder(null)}
                className="p-1.5 rounded-xl bg-[var(--bg-muted)] hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                title="Close Drawer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Tabs */}
            <div className="flex items-center gap-6 px-5 border-b border-[var(--border)] text-xs font-bold select-none">
              {[
                { key: 'overview', label: 'Company Overview' },
                { key: 'docs', label: 'RERA & Verification Proofs' },
                { key: 'credentials', label: 'Contact & Account Admin' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setBuilderDrawerTab(tab.key)}
                  className={`py-2.5 border-b-2 transition-all cursor-pointer ${
                    builderDrawerTab === tab.key
                      ? 'border-brand text-brand'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Pending Action Banner in Drawer */}
              {selectedBuilder.status === 'Pending' && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
                  <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">Developer Application Under Audit</strong>
                    <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                      Cross check the uploaded RERA certificate and company PAN card against the legal entity name before authorizing developer privileges.
                    </p>
                  </div>
                </div>
              )}

              {builderDrawerTab === 'overview' && (
                <div className="space-y-4">
                  {/* Credentials Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-[var(--bg-muted)]/40 border border-[var(--border)]">
                      <span className="text-[9px] text-[var(--text-muted)] uppercase block">Experience</span>
                      <strong className="text-xs text-[var(--text-primary)] mt-0.5 block">{selectedBuilder.yearsInBusinessText}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[var(--bg-muted)]/40 border border-[var(--border)]">
                      <span className="text-[9px] text-[var(--text-muted)] uppercase block">Delivered</span>
                      <strong className="text-xs text-[var(--text-primary)] mt-0.5 block">{selectedBuilder.delivered} Projects</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[var(--bg-muted)]/40 border border-[var(--border)]">
                      <span className="text-[9px] text-[var(--text-muted)] uppercase block">ISO Certified</span>
                      <strong className={`text-xs mt-0.5 block ${selectedBuilder.isIsoCertified ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                        {selectedBuilder.isIsoCertified ? '✓ Certified' : 'No'}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[var(--bg-muted)]/40 border border-[var(--border)]">
                      <span className="text-[9px] text-[var(--text-muted)] uppercase block">Risk Rating</span>
                      <strong className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 block">{selectedBuilder.internalRiskRating}</strong>
                    </div>
                  </div>

                  {/* Corporate Address */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border)] text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Registered Corporate Office</span>
                    <p className="text-xs font-medium text-[var(--text-primary)] leading-relaxed">
                      {selectedBuilder.corporateAddress}
                    </p>
                  </div>

                  {/* Bio */}
                  {selectedBuilder.bio && (
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border)] text-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Company Overview</span>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        {selectedBuilder.bio}
                      </p>
                    </div>
                  )}

                  {/* Trust Rating Bar */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border)] text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Trust Score Assessment</span>
                      <span className="font-bold text-xs text-[var(--text-primary)]">{selectedBuilder.trust}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--border)] overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${selectedBuilder.trust}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {builderDrawerTab === 'docs' && (
                <div className="space-y-4">
                  {/* RERA License Audit Box */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/40 border border-[var(--border)] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCheck size={16} className="text-emerald-500" />
                        <span className="text-xs font-bold text-[var(--text-primary)]">RERA License Registration</span>
                      </div>
                      {selectedBuilder.hasReraDoc ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#52c99b]/20 text-[#064e3b] dark:text-[#6ee7b7]">
                          Proof Attached
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                          Missing Document
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-between">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] block">RERA Number</span>
                        <span className="font-mono font-bold text-xs text-[var(--text-primary)]">{selectedBuilder.rera}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedBuilder.rera, 'RERA Number')}
                        className="p-1 text-[var(--text-muted)] hover:text-brand cursor-pointer"
                        title="Copy"
                      >
                        <Copy size={12} />
                      </button>
                    </div>

                    {selectedBuilder.hasReraDoc && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openDocumentPreview(selectedBuilder.builderDocs.reraCertificate, `RERA Certificate - ${selectedBuilder.companyName}`)}
                          className="flex-1 py-2 px-3 bg-brand/10 hover:bg-brand/20 text-brand rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Eye size={13} /> Full Screen Preview
                        </button>
                        <a
                          href={selectedBuilder.builderDocs.reraCertificate}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                          title="Open Original"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* PAN Card Audit Box */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/40 border border-[var(--border)] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-blue-500" />
                        <span className="text-xs font-bold text-[var(--text-primary)]">Company PAN Card & GSTIN</span>
                      </div>
                      {selectedBuilder.hasPanDoc ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300">
                          Proof Attached
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                          Missing Document
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-between">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] block">GSTIN Registration</span>
                        <span className="font-mono font-bold text-xs text-[var(--text-primary)]">{selectedBuilder.gstin}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedBuilder.gstin, 'GSTIN')}
                        className="p-1 text-[var(--text-muted)] hover:text-brand cursor-pointer"
                        title="Copy"
                      >
                        <Copy size={12} />
                      </button>
                    </div>

                    {selectedBuilder.hasPanDoc && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openDocumentPreview(selectedBuilder.builderDocs.panCard, `PAN Card - ${selectedBuilder.companyName}`)}
                          className="flex-1 py-2 px-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Eye size={13} /> Full Screen Preview
                        </button>
                        <a
                          href={selectedBuilder.builderDocs.panCard}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                          title="Open Original"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {builderDrawerTab === 'credentials' && (
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border)] space-y-2.5">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Authorized Applicant</span>
                    <div className="flex items-center justify-between">
                      <strong className="text-sm text-[var(--text-primary)]">{selectedBuilder.applicantName}</strong>
                      <span className="text-[10px] text-[var(--text-muted)]">Primary Director</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                      <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                        <Mail size={12} /> {selectedBuilder.email}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedBuilder.email, 'Email')}
                        className="p-1 text-[var(--text-muted)] hover:text-brand"
                      >
                        <Copy size={12} />
                      </button>
                    </div>

                    {selectedBuilder.phone !== 'N/A' && (
                      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                        <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                          <Phone size={12} /> {selectedBuilder.phone}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedBuilder.phone, 'Phone')}
                          className="p-1 text-[var(--text-muted)] hover:text-brand"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {selectedBuilder.internalNotes && (
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border)]">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Internal Audit Note</span>
                      <p className="text-xs text-[var(--text-secondary)] italic mt-1 leading-relaxed">
                        {selectedBuilder.internalNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-muted)]/20 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ item: selectedBuilder, type: 'builder' })}
                className="h-8 px-3 rounded-full text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/25 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={13} /> Deactivate
              </button>

              <div className="flex items-center gap-2">
                {selectedBuilder.status === 'Pending' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setRejectPrompt({ item: selectedBuilder, type: 'builder' })}
                      disabled={isSubmittingAction}
                      className="h-8 px-3.5 rounded-full text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/25 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Ban size={13} /> Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => updateBuilderStatus(selectedBuilder, 'Approved')}
                      disabled={isSubmittingAction}
                      className="h-8 px-4 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <Check size={13} strokeWidth={2.5} /> Authorize & Approve
                    </button>
                  </>
                ) : selectedBuilder.status === 'Approved' ? (
                  <button
                    type="button"
                    onClick={() => setRejectPrompt({ item: selectedBuilder, type: 'builder' })}
                    disabled={isSubmittingAction}
                    className="h-8 px-3.5 rounded-full text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/25 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Ban size={13} /> Suspend License
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => updateBuilderStatus(selectedBuilder, 'Approved')}
                    disabled={isSubmittingAction}
                    className="h-8 px-4 rounded-full text-xs font-semibold bg-brand hover:bg-brand-dark text-white shadow-xs cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 size={13} /> Re-verify Builder
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 09. PROJECT REVIEW & MODERATION DRAWER (Slide-Over Panel) ── */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-end">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] h-full max-w-xl w-full shadow-2xl border-l border-[var(--border)] flex flex-col justify-between animate-slide-left">
            {/* Drawer Top Header */}
            <div className="p-5 border-b border-[var(--border)] flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brand">{selectedProject.id}</span>
                  {getProjectStatusBadge(selectedProject.status, 'xs')}
                </div>
                <h2 className="text-base font-bold text-[var(--text-primary)] mt-0.5">
                  {selectedProject.title}
                </h2>
                <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                  <Building2 size={11} className="text-brand" /> {selectedProject.builder} • {selectedProject.location}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="p-1.5 rounded-xl bg-[var(--bg-muted)] hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                title="Close Drawer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Tabs */}
            <div className="flex items-center gap-6 px-5 border-b border-[var(--border)] text-xs font-bold select-none">
              {[
                { key: 'overview', label: 'Project Overview' },
                { key: 'gallery', label: `Gallery (${selectedProject.gallery?.length || 0})` },
                { key: 'investment', label: 'Investment Score' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setProjectDrawerTab(tab.key)}
                  className={`py-2.5 border-b-2 transition-all cursor-pointer ${
                    projectDrawerTab === tab.key
                      ? 'border-brand text-brand'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {projectDrawerTab === 'overview' && (
                <div className="space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-[var(--bg-muted)]/40 border border-[var(--border)]">
                      <span className="text-[9px] text-[var(--text-muted)] uppercase block">Total Units</span>
                      <strong className="text-xs text-[var(--text-primary)] mt-0.5 block">{selectedProject.units}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[var(--bg-muted)]/40 border border-[var(--border)]">
                      <span className="text-[9px] text-[var(--text-muted)] uppercase block">Stage</span>
                      <strong className="text-xs text-[var(--text-primary)] mt-0.5 block">{selectedProject.stage}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[var(--bg-muted)]/40 border border-[var(--border)]">
                      <span className="text-[9px] text-[var(--text-muted)] uppercase block">Possession</span>
                      <strong className="text-xs text-[var(--text-primary)] mt-0.5 block">{selectedProject.possessionDate}</strong>
                    </div>
                  </div>

                  {/* Location & RERA */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border)] text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-brand shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-[var(--text-primary)] block">{selectedProject.location}</strong>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">City: {selectedProject.city}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-[var(--border)]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">RERA Registrations</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {selectedProject.reraNumbers?.length || 1} RERA ID{(selectedProject.reraNumbers?.length || 1) > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedProject.reraNumbers?.length > 0 ? selectedProject.reraNumbers : [{ name: 'Phase 1', reraNumber: selectedProject.reraNumber }]).map((rItem, idx) => {
                          const reraVal = typeof rItem === 'string' ? rItem : (rItem?.reraNumber || '');
                          const nameVal = typeof rItem === 'string' ? `Phase ${idx + 1}` : (rItem?.name || '');
                          return (
                            <div key={idx} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-bold text-[var(--text-primary)]">
                              {nameVal && (
                                <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded text-[10px]">
                                  {nameVal}
                                </span>
                              )}
                              <span className="font-mono">{reraVal}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(reraVal, nameVal || `RERA #${idx + 1}`)}
                                className="text-[var(--text-muted)] hover:text-brand transition-colors cursor-pointer"
                                title="Copy RERA"
                              >
                                <Copy size={10} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedProject.description && (
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border)] text-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Project Description</span>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                        {selectedProject.description}
                      </p>
                    </div>
                  )}

                  {/* Audit Checklist */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border)] text-xs space-y-2">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Moderation Checklist</span>
                    <div className="space-y-1.5 text-[11px] text-[var(--text-secondary)]">
                      <p className="flex items-center gap-2">
                        <Check size={13} className="text-emerald-500" /> RERA registration number validated
                      </p>
                      <p className="flex items-center gap-2">
                        <Check size={13} className="text-emerald-500" /> Blueprint and master structural layout checked
                      </p>
                      <p className="flex items-center gap-2">
                        <Check size={13} className="text-emerald-500" /> High-definition photo and video tours inspected
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {projectDrawerTab === 'gallery' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--text-primary)]">
                      Media Gallery ({selectedProject.gallery?.length || 0})
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">Click on item to preview</span>
                  </div>

                  {selectedProject.gallery?.length === 0 ? (
                    <div className="p-8 text-center bg-[var(--bg-muted)]/30 rounded-xl text-xs text-[var(--text-muted)]">
                      No media files uploaded for this project yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {selectedProject.gallery.map((media, idx) => (
                        <div
                          key={idx}
                          onClick={() => setLightboxDoc({
                            url: media.url,
                            title: `${selectedProject.title} - ${media.type === 'video' ? 'Video Tour' : 'Photo'}`,
                            type: media.type
                          })}
                          className="relative aspect-video rounded-xl overflow-hidden border border-[var(--border)] bg-black/10 hover:border-brand cursor-pointer group shadow-2xs"
                        >
                          {media.type === 'video' ? (
                            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                              <video src={media.url} className="w-full h-full object-cover opacity-70" preload="metadata" muted />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10">
                                <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs">
                                  <Play size={11} className="fill-white ml-0.5" />
                                </div>
                              </div>
                              <span className="absolute bottom-1 left-1 bg-purple-600 text-white text-[8px] font-bold px-1.5 py-0.2 rounded">
                                VIDEO
                              </span>
                            </div>
                          ) : (
                            <img src={media.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {projectDrawerTab === 'investment' && (
                <div className="space-y-4">
                  {/* Score Ribbon */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/25 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                        GharMB Investment Rating
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                          {selectedProject.investmentScore?.overall || selectedProject.score || 0}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] font-bold">/ 10</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      {selectedProject.investmentScore?.grade || 'Good'}
                    </span>
                  </div>

                  {/* Metric Breakdown */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border)] text-xs space-y-2">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Parameter Breakdown</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Connectivity:</span>
                        <strong className="text-[var(--text-primary)]">{selectedProject.investmentScore?.metrics?.connectivity ?? 0} / 10</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Rental Potential:</span>
                        <strong className="text-[var(--text-primary)]">{selectedProject.investmentScore?.metrics?.rentalPotential ?? 0} / 10</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Growth Potential:</span>
                        <strong className="text-[var(--text-primary)]">{selectedProject.investmentScore?.metrics?.growthPotential ?? 0} / 10</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Family Living:</span>
                        <strong className="text-[var(--text-primary)]">{selectedProject.investmentScore?.metrics?.familyLiving ?? 0} / 10</strong>
                      </div>
                      <div className="flex justify-between col-span-2">
                        <span className="text-[var(--text-muted)]">Future Demand:</span>
                        <strong className="text-[var(--text-primary)]">{selectedProject.investmentScore?.metrics?.futureDemand ?? 0} / 10</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openScoreModal(selectedProject)}
                      className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Sparkles size={12} /> Edit Investment Score Parameters
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-muted)]/20 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ item: selectedProject, type: 'project' })}
                className="h-8 px-3 rounded-full text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/25 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={13} /> Delete
              </button>

              <div className="flex items-center gap-2">
                {selectedProject.status === 'Published' && !selectedProject.isSold && (
                  <button
                    type="button"
                    onClick={() => toggleProjectSoldStatus(selectedProject, true)}
                    disabled={isSubmittingAction}
                    className="h-8 px-3.5 rounded-full text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-50"
                    title="Mark this project as Sold Out"
                  >
                    <Tag size={13} strokeWidth={2.2} /> Mark as Sold Out
                  </button>
                )}

                {(selectedProject.status === 'Sold' || selectedProject.isSold) && (
                  <button
                    type="button"
                    onClick={() => toggleProjectSoldStatus(selectedProject, false)}
                    disabled={isSubmittingAction}
                    className="h-8 px-3.5 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-50"
                    title="Relist this project as Available"
                  >
                    <RotateCcw size={13} /> Relist as Available
                  </button>
                )}

                {selectedProject.status !== 'Published' && selectedProject.status !== 'Sold' && (
                  <button
                    type="button"
                    onClick={() => updateProjectStatus(selectedProject, 'Published')}
                    disabled={isSubmittingAction}
                    className="h-8 px-4 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <Check size={13} strokeWidth={2.5} /> Publish Project Live
                  </button>
                )}

                {selectedProject.status === 'Published' && !selectedProject.isSold && (
                  <button
                    type="button"
                    onClick={() => setRejectPrompt({ item: selectedProject, type: 'project' })}
                    disabled={isSubmittingAction}
                    className="h-8 px-3.5 rounded-full text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/25 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Ban size={13} /> Suspend / Archive
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 10. REJECTION / SUSPENSION MODAL ── */}
      {rejectPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[70] flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-2.5 text-rose-500">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <Ban size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)]">
                  {rejectPrompt.type === 'builder'
                    ? rejectPrompt.item.status === 'Pending' ? 'Decline Builder Application' : 'Suspend Builder License'
                    : 'Suspend Project Listing'}
                </h4>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {rejectPrompt.item.companyName || rejectPrompt.item.title}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">
                Select Standard Reason
              </label>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {PRESET_REJECT_REASONS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setSelectedRejectReason(preset); setCustomRejectNote(preset); }}
                    className={`w-full text-left p-2 rounded-xl text-[11px] font-medium transition-all border ${
                      selectedRejectReason === preset
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold'
                        : 'bg-[var(--bg-muted)] text-[var(--text-subtle)] border-transparent hover:border-[var(--border)]'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">
                Official Feedback Sent to Applicant
              </label>
              <textarea
                rows={3}
                value={customRejectNote || selectedRejectReason}
                onChange={(e) => setCustomRejectNote(e.target.value)}
                placeholder="Enter audit/rejection feedback explaining what needs to be corrected..."
                className="w-full p-2.5 border border-[var(--border)] bg-[var(--bg-muted)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-brand"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRejectPrompt(null)}
                className="flex-1 py-2 border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text-subtle)] hover:bg-[var(--bg-muted)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const finalReason = customRejectNote || selectedRejectReason;
                  if (rejectPrompt.type === 'builder') {
                    updateBuilderStatus(rejectPrompt.item, 'Rejected', finalReason);
                  } else {
                    updateProjectStatus(rejectPrompt.item, 'Archived', finalReason);
                  }
                }}
                className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 11. DELETION CONFIRMATION MODAL ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[70] flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                Permanently Deactivate?
              </h4>
              <p className="text-xs text-[var(--text-muted)]">
                Are you sure you want to deactivate{' '}
                <strong className="text-[var(--text-primary)]">
                  {deleteConfirm.item.name || deleteConfirm.item.companyName || deleteConfirm.item.title}
                </strong>
                ? This action removes their access from GharMB.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text-subtle)] hover:bg-[var(--bg-muted)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirm.type === 'builder') {
                    deleteBuilder(deleteConfirm.item);
                  } else {
                    deleteProject(deleteConfirm.item);
                  }
                }}
                className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 12. INVESTMENT SCORE METRICS MODAL ── */}
      {editingScoreProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[70] flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] max-w-lg w-full rounded-2xl shadow-2xl border border-[var(--border)] p-6 space-y-5 animate-scale-up">
            <div className="flex justify-between items-start border-b border-[var(--border)] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[var(--text-primary)]">
                    Edit Investment Score
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {editingScoreProject.title} ({editingScoreProject.id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingScoreProject(null)}
                className="p-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)]/80 text-[var(--text-muted)] rounded-lg cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Calculated Overall Preview */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/25 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Calculated Overall Score
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {computedOverall}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] font-bold">/ 10</span>
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                {computedGrade}
              </span>
            </div>

            {/* 5 Parameters Sliders */}
            <div className="space-y-3 text-xs">
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
                        value={scoreForm[key]}
                        onChange={(e) => {
                          const val = Math.min(10, Math.max(0, parseFloat(e.target.value) || 0));
                          setScoreForm((prev) => ({ ...prev, [key]: val }));
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
                    value={scoreForm[key]}
                    onChange={(e) =>
                      setScoreForm((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))
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
                onClick={() => setEditingScoreProject(null)}
                className="flex-1 py-2.5 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-subtle)] rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveScore}
                disabled={isSavingScore}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                {isSavingScore ? (
                  <span>Saving...</span>
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

      {/* ── 13. IN-APP DOCUMENT & VIDEO LIGHTBOX PREVIEW MODAL ── */}
      {lightboxDoc && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[90] flex flex-col items-center justify-between p-4 sm:p-6 animate-fade-in">
          {/* Lightbox Topbar */}
          <div className="w-full max-w-5xl flex items-center justify-between text-white pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <FileCheck size={18} className="text-brand" />
              <div>
                <h4 className="text-sm font-bold truncate max-w-md">{lightboxDoc.title}</h4>
                <span className="text-[10px] text-white/60">Government Verification Document & Media</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-xs font-mono font-bold px-1.5">{Math.round(zoomLevel * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer ml-1"
                title="Rotate 90deg"
              >
                <RotateCw size={16} />
              </button>
              <a
                href={lightboxDoc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer ml-1"
                title="Open in New Tab"
              >
                <ExternalLink size={16} />
              </a>
              <button
                type="button"
                onClick={() => setLightboxDoc(null)}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-rose-500 text-white transition-all cursor-pointer ml-2"
                title="Close Lightbox"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Lightbox Center Document View */}
          <div className="flex-1 w-full max-w-5xl flex items-center justify-center overflow-auto p-4">
            <div
              className="transition-transform duration-200 ease-out origin-center max-w-full max-h-[75vh]"
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
              }}
            >
              {(lightboxDoc.type === 'video' || (typeof lightboxDoc.url === 'string' && /\.(mp4|webm|mov|m4v|mkv|avi|3gp)$/i.test(lightboxDoc.url.split('?')[0]))) ? (
                <video
                  src={lightboxDoc.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[75vh] w-auto max-w-full rounded-lg shadow-2xl object-contain border border-white/20 bg-black"
                />
              ) : (
                <img
                  src={lightboxDoc.url}
                  alt={lightboxDoc.title}
                  className="max-h-[75vh] w-auto max-w-full rounded-lg shadow-2xl object-contain border border-white/20 bg-white"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling) {
                      e.currentTarget.nextSibling.style.display = 'flex';
                    }
                  }}
                />
              )}
              <div className="hidden flex-col items-center justify-center p-8 bg-zinc-900 border border-white/20 rounded-2xl text-center space-y-3">
                <FileText size={48} className="text-brand" />
                <p className="text-white text-sm font-semibold">PDF or External Document</p>
                <a
                  href={lightboxDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-brand text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <ExternalLink size={14} /> Open in Dedicated Document Viewer
                </a>
              </div>
            </div>
          </div>

          {/* Lightbox Footer */}
          <div className="w-full max-w-5xl text-center text-[11px] text-white/50 pt-2 border-t border-white/10 flex items-center justify-between">
            <span>Use Zoom & Rotate to audit license numbers, registration dates, and statutory seals</span>
            <span className="font-mono truncate max-w-xs">{lightboxDoc.title}</span>
          </div>
        </div>
      )}
    </div>
  );
}
