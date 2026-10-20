import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import AdminLoader from '../components/common/AdminLoader';
import API, { getMediaUrl } from '../api/api';
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
  ChevronRight,
  Phone,
  Mail,
  AlertCircle,
  FileText,
  Eye,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Building2,
  Clock,
  Sparkles,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

const BuilderManagement = () => {
  const [builders, setBuilders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoadingBuilders, setIsLoadingBuilders] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname.includes('/projects') || searchParams.get('tab') === 'projects') {
      return 'projects';
    }
    return 'builders';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Pending', 'Approved', 'Suspended'

  // Drawer & Modal states
  const [selectedBuilder, setSelectedBuilder] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // Document Lightbox Preview
  const [lightboxDoc, setLightboxDoc] = useState(null); // { url, title, type }
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Rejection modal
  const [rejectPrompt, setRejectPrompt] = useState(null); // { item, type: 'builder' | 'project' }
  const [rejectReason, setRejectReason] = useState('RERA License documents verification incomplete or mismatch');
  const [customReasonActive, setCustomReasonActive] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { item, type: 'builder' | 'project' }

  // Investment Score Modal state
  const [editingScoreProject, setEditingScoreProject] = useState(null);
  const [scoreForm, setScoreForm] = useState({
    connectivity: 9.0,
    rentalPotential: 8.5,
    growthPotential: 9.0,
    familyLiving: 8.8,
    futureDemand: 9.0,
  });
  const [isSavingScore, setIsSavingScore] = useState(false);

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
    if (computedOverall >= 8.0) return 'Excellent';
    if (computedOverall >= 6.5) return 'Good';
    if (computedOverall >= 5.0) return 'Average';
    return 'Below Average';
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
        if (selectedProject && selectedProject._id === editingScoreProject._id) {
          setSelectedProject((prev) => ({
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
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, 'info');
  };

  const getDocumentUrl = (url) => {
    return getMediaUrl(url);
  };

  // Relative time helper
  const getRelativeTime = (dateString) => {
    if (!dateString) return 'Recent';
    try {
      const diffMs = new Date() - new Date(dateString);
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

  const fetchBuilders = async () => {
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
            exp: parseInt(u.yearsInBusiness) || 0,
            yearsInBusinessText: u.yearsInBusiness ? `${u.yearsInBusiness}` : 'Not specified',
            delivered: parseInt(u.unitsDelivered) || 0,
            trust: u.builderVerificationStatus === 'approved' ? (u.rating ? Math.round(u.rating * 20) : 100) : u.builderVerificationStatus === 'pending' ? 50 : 0,
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
  };

  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const response = await API.get('/admin/projects');
      const data = response.data;
      if (data?.status === 'success' && data.data?.projects) {
        const mapped = data.data.projects.map((p) => {
          let status = 'Draft';
          if (p.approvalStatus === 'approved') status = 'Published';
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

          return {
            id: p.submissionId || `PRJ-${p._id.slice(-4).toUpperCase()}`,
            _id: p._id,
            title: p.projectName,
            builder: p.developerName || p.developer?.companyName || p.developer?.name || 'Developer',
            location: `${p.locality ? p.locality + ', ' : ''}${p.city}`,
            score: invScore.overall || (p.approvalStatus === 'approved' ? 9.2 : 7.0),
            investmentScore: invScore,
            status,
            units: `${p.totalUnits || 0} Units`,
            stage: p.projectStatus || 'Under construction',
            reraNumber: p.reraProjectNumber || 'Pending',
            possessionDate: p.possessionDate || 'Dec 2026',
            description: p.shortDescription || 'Residential/Commercial developer project.'
          };
        });
        setProjects(mapped);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchBuilders();
    fetchProjects();
  }, []);

  // Builder actions
  const updateBuilderStatus = async (builder, newStatus, reason = '') => {
    try {
      let bodyStatus = newStatus === 'Approved' ? 'approved' : 'rejected';
      const response = await API.patch(`/admin/users/${builder._id}/verify-developer`, {
        builderVerificationStatus: bodyStatus,
        rejectReason: reason || (newStatus === 'Approved' ? 'Verified by Admin' : 'Application rejected by Admin')
      });
      const data = response.data;
      if (data?.status === 'success') {
        await fetchBuilders();
        if (selectedBuilder && selectedBuilder._id === builder._id) {
          setSelectedBuilder((prev) => ({
            ...prev,
            status: newStatus,
            builderVerificationStatus: bodyStatus,
            trust: newStatus === 'Approved' ? 95 : 45
          }));
        }
        setRejectPrompt(null);
        showToast(
          newStatus === 'Approved'
            ? `🎉 Builder "${builder.companyName}" verified & authorized successfully!`
            : `Builder application status updated to ${newStatus}.`,
          'success'
        );
      } else {
        showToast(data?.message || 'Failed to update builder status.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || 'Connection error updating builder status.', 'error');
    }
  };

  const deleteBuilder = async (builder) => {
    try {
      await API.delete(`/admin/users/${builder._id}`);
      fetchBuilders();
      setSelectedBuilder(null);
      setDeleteConfirm(null);
      showToast('Builder deactivated successfully.', 'info');
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || 'Error connecting to server.', 'error');
    }
  };

  // Project actions
  const updateProjectStatus = async (project, newStatus, reason = '') => {
    try {
      let apiStatus = 'pending';
      if (newStatus === 'Published') apiStatus = 'approved';
      else if (newStatus === 'Archived') apiStatus = 'rejected';

      const response = await API.patch(`/admin/projects/${project._id}/status`, {
        approvalStatus: apiStatus,
        rejectionReason: reason
      });
      const data = response.data;
      if (data?.status === 'success') {
        fetchProjects();
        if (selectedProject && selectedProject._id === project._id) {
          setSelectedProject((prev) => ({ ...prev, status: newStatus }));
        }
        setRejectPrompt(null);
        showToast(`Project status updated to ${newStatus}.`, 'success');
      } else {
        showToast(data?.message || 'Failed to update project status.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || 'Connection error updating project status.', 'error');
    }
  };

  const deleteProject = async (project) => {
    try {
      await API.delete(`/admin/projects/${project._id}`);
      fetchProjects();
      setSelectedProject(null);
      setDeleteConfirm(null);
      showToast('Project deleted successfully.', 'info');
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || 'Error connecting to server.', 'error');
    }
  };

  const getTrustBadgeClass = (score) => {
    if (score >= 90) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25';
    if (score >= 70) return 'bg-amber-500/10 text-amber-500 border-amber-500/25';
    return 'bg-rose-500/10 text-rose-500 border-rose-500/25';
  };

  // Computed counters
  const pendingBuilders = useMemo(() => builders.filter((b) => b.status === 'Pending'), [builders]);
  const approvedBuilders = useMemo(() => builders.filter((b) => b.status === 'Approved'), [builders]);
  const suspendedBuilders = useMemo(() => builders.filter((b) => b.status === 'Suspended' || b.status === 'Rejected'), [builders]);

  // Filter logic
  const filteredBuilders = useMemo(() => {
    return builders.filter((b) => {
      if (statusFilter !== 'All') {
        if (statusFilter === 'Suspended') {
          if (b.status !== 'Suspended' && b.status !== 'Rejected') return false;
        } else if (b.status !== statusFilter) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.name?.toLowerCase().includes(q) ||
          b.rera?.toLowerCase().includes(q) ||
          b.user?.toLowerCase().includes(q) ||
          b.id?.toLowerCase().includes(q) ||
          b.cityOfOperation?.toLowerCase().includes(q) ||
          b.gstin?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [builders, statusFilter, searchQuery]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== 'All') {
        if (statusFilter === 'Pending' && p.status !== 'Draft' && p.status !== 'Pending') return false;
        if (statusFilter === 'Approved' && p.status !== 'Published' && p.status !== 'Approved') return false;
        if (statusFilter === 'Suspended' && p.status !== 'Archived' && p.status !== 'Suspended') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.title?.toLowerCase().includes(q) ||
          p.builder?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          p.id?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [projects, statusFilter, searchQuery]);

  const openDocumentPreview = (url, title = 'Document Preview') => {
    if (!url) {
      showToast('Document not uploaded by builder.', 'error');
      return;
    }
    setZoomLevel(1);
    setRotation(0);
    setLightboxDoc({ url, title });
  };

  const presetRejectReasons = [
    'RERA License documents verification incomplete, expired, or mismatch with state authority',
    'Company PAN card name does not match registered commercial entity name',
    'GSTIN validation failed or invalid corporate registration proof',
    'Uploaded documents are illegible or blurry — please re-upload clear color scans',
    'Corporate office verification and director authorization pending'
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] animate-slide-down">
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

      {/* 4 Overview Stats Cards (Standardized Top-Accent KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            key: 'builders_all',
            title: 'Total Builders',
            value: builders.length,
            subtitle: 'Registered developers',
            tag: 'Entities',
            icon: HardHat,
            accent: 'border-brand/40 hover:border-brand',
            iconColor: 'text-brand bg-brand/10',
            isActive: activeTab === 'builders' && statusFilter === 'All',
            activeAccent: 'border-brand ring-2 ring-brand/20 shadow-xs border-t-2 border-t-brand',
            onClick: () => {
              setActiveTab('builders');
              setStatusFilter('All');
            }
          },
          {
            key: 'builders_pending',
            title: 'Pending Audit',
            value: pendingBuilders.length,
            subtitle: 'Awaiting verification',
            tag: pendingBuilders.length > 0 ? `${pendingBuilders.length} Awaiting` : 'All Clear',
            icon: ShieldAlert,
            accent: 'border-brand/40 hover:border-brand',
            iconColor: 'text-brand bg-brand/10',
            pulse: pendingBuilders.length > 0,
            isActive: activeTab === 'builders' && statusFilter === 'Pending',
            activeAccent: 'border-brand ring-2 ring-brand/20 shadow-xs border-t-2 border-t-brand',
            onClick: () => {
              setActiveTab('builders');
              setStatusFilter('Pending');
            }
          },
          {
            key: 'builders_approved',
            title: 'RERA Verified',
            value: builders.filter(b => b.isReraVerified || b.status === 'Approved').length,
            subtitle: 'Statutory compliance',
            tag: 'Compliant',
            icon: Award,
            accent: 'border-brand/40 hover:border-brand',
            iconColor: 'text-brand bg-brand/10',
            isActive: activeTab === 'builders' && statusFilter === 'Approved',
            activeAccent: 'border-brand ring-2 ring-brand/20 shadow-xs border-t-2 border-t-brand',
            onClick: () => {
              setActiveTab('builders');
              setStatusFilter('Approved');
            }
          },
          {
            key: 'projects_all',
            title: 'Active Projects',
            value: projects.length,
            subtitle: 'Builder developments',
            tag: 'Developments',
            icon: Layers,
            accent: 'border-brand/40 hover:border-brand',
            iconColor: 'text-brand bg-brand/10',
            isActive: activeTab === 'projects',
            activeAccent: 'border-brand ring-2 ring-brand/20 shadow-xs border-t-2 border-t-brand',
            onClick: () => {
              setActiveTab('projects');
              setStatusFilter('All');
            }
          }
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              onClick={card.onClick}
              className="group bg-[var(--bg-surface)] rounded-xl p-3.5 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden flex flex-col justify-between border border-[var(--border)] border-t-2 border-t-brand/40 hover:border-t-brand text-left cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block flex items-center gap-1.5">
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

      {/* High-Visibility Pending Approvals Banner */}
      {pendingBuilders.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
              <ShieldAlert size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-[var(--text-primary)]">
                  {pendingBuilders.length} Builder Authorization Request{pendingBuilders.length > 1 ? 's' : ''} Awaiting Review
                </h4>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  Priority Action
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1 max-w-2xl leading-relaxed">
                New builders have submitted company registration documents (RERA license & PAN card). Verification is required before they can publish live projects and commercial listings.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('builders');
                setStatusFilter('Pending');
              }}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldAlert size={14} /> Filter Pending ({pendingBuilders.length})
            </button>
            {pendingBuilders[0] && (
              <button
                type="button"
                onClick={() => setSelectedBuilder(pendingBuilders[0])}
                className="px-3.5 py-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                Review Latest <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Tabs, Quick Status Pills & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
          {/* Main Module Tabs */}
          <div className="flex gap-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('builders');
                setStatusFilter('All');
                setSearchQuery('');
              }}
              className={`pb-2 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
                activeTab === 'builders' ? 'text-brand font-black' : 'text-[var(--text-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              <HardHat size={15} />
              <span>Builders Management</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'builders' ? 'bg-brand/10 text-brand font-extrabold' : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
              }`}>
                {builders.length}
              </span>
              {activeTab === 'builders' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-t-full"></span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('projects');
                setStatusFilter('All');
                setSearchQuery('');
              }}
              className={`pb-2 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
                activeTab === 'projects' ? 'text-brand font-black' : 'text-[var(--text-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Layers size={15} />
              <span>Builder Projects</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'projects' ? 'bg-brand/10 text-brand font-extrabold' : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
              }`}>
                {projects.length}
              </span>
              {activeTab === 'projects' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-t-full"></span>
              )}
            </button>
          </div>

          {/* Search, Refresh and Dropdown Controls */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-2.5 text-[var(--text-muted)]" size={14} />
              <input
                type="text"
                placeholder={`Search ${activeTab === 'builders' ? 'by company, RERA, email, city...' : 'projects by name, location...'}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-7 py-2 border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-brand/40 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Quick Refresh Button */}
            <button
              type="button"
              onClick={() => {
                fetchBuilders();
                fetchProjects();
                showToast('Refreshed data from server.', 'info');
              }}
              className="p-2 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-subtle)] hover:text-[var(--text-primary)] rounded-xl transition-all cursor-pointer shrink-0"
              title="Refresh"
            >
              <RefreshCw size={14} className={isLoadingBuilders || isLoadingProjects ? 'animate-spin text-brand' : ''} />
            </button>
          </div>
        </div>

        {/* Quick Filter Pills (1-Click Filtering) */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mr-1">
            Status:
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'All'
                ? 'bg-brand text-white shadow-xs'
                : 'bg-[var(--bg-surface)] text-[var(--text-subtle)] border border-[var(--border)] hover:bg-[var(--bg-muted)]'
            }`}
          >
            All {activeTab === 'builders' ? `Builders (${builders.length})` : `Projects (${projects.length})`}
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'Pending'
                ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/25'
                : pendingBuilders.length > 0 && activeTab === 'builders'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-[var(--bg-surface)] text-[var(--text-subtle)] border border-[var(--border)] hover:bg-[var(--bg-muted)]'
            }`}
          >
            <ShieldAlert size={12} />
            <span>{activeTab === 'builders' ? 'Pending Approval' : 'Draft'}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              statusFilter === 'Pending' ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
            }`}>
              {activeTab === 'builders' ? pendingBuilders.length : projects.filter((p) => p.status === 'Draft').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'Approved'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'bg-[var(--bg-surface)] text-[var(--text-subtle)] border border-[var(--border)] hover:bg-[var(--bg-muted)]'
            }`}
          >
            <ShieldCheck size={12} />
            <span>{activeTab === 'builders' ? 'Approved & Live' : 'Published'}</span>
            <span className="text-[10px] opacity-75">
              ({activeTab === 'builders' ? approvedBuilders.length : projects.filter((p) => p.status === 'Published').length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Suspended')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'Suspended'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-[var(--bg-surface)] text-[var(--text-subtle)] border border-[var(--border)] hover:bg-[var(--bg-muted)]'
            }`}
          >
            <Ban size={12} />
            <span>{activeTab === 'builders' ? 'Suspended / Rejected' : 'Archived'}</span>
            <span className="text-[10px] opacity-75">
              ({activeTab === 'builders' ? suspendedBuilders.length : projects.filter((p) => p.status === 'Archived').length})
            </span>
          </button>
        </div>
      </div>

      {/* Tab Contents: Builders Management vs Builder Projects */}
      {activeTab === 'builders' ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-wider bg-[var(--bg-muted)]">
                  <th className="py-3 px-5">Company / Legal Entity</th>
                  <th className="py-3 px-5">RERA License</th>
                  <th className="py-3 px-5">Documents</th>
                  <th className="py-3 px-5">Experience</th>
                  <th className="py-3 px-5 text-center">Delivered</th>
                  <th className="py-3 px-5 text-center">Trust Rating</th>
                  <th className="py-3 px-5">Account Admin</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-muted)] text-xs">
                {isLoadingBuilders ? (
                  <tr>
                    <td colSpan="9" className="py-14 text-center">
                      <AdminLoader
                        text="Loading builder profiles..."
                        subtext="Fetching registered developers and RERA certifications"
                        minHeight="min-h-[180px]"
                      />
                    </td>
                  </tr>
                ) : filteredBuilders.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-16 text-center">
                      <div className="max-w-xs mx-auto space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--bg-muted)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                          <HardHat size={24} />
                        </div>
                        <h4 className="text-sm font-bold text-[var(--text-primary)]">
                          {searchQuery ? 'No matching builders found' : 'No builders in this view'}
                        </h4>
                        <p className="text-xs text-[var(--text-muted)]">
                          {searchQuery
                            ? `Try clearing your search query "${searchQuery}"`
                            : statusFilter !== 'All'
                            ? `There are currently no builders with status "${statusFilter}".`
                            : 'Registered builders will appear here.'}
                        </p>
                        {statusFilter !== 'All' && (
                          <button
                            type="button"
                            onClick={() => setStatusFilter('All')}
                            className="mt-2 px-3 py-1.5 bg-brand text-white rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            View All Builders
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBuilders.map((b) => (
                    <tr
                      key={b.id}
                      className={`hover:bg-[var(--bg-muted)]/60 transition-colors ${
                        b.status === 'Pending' ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      {/* Column 1: Company / Legal Entity */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          {b.builderDocs?.companyLogo ? (
                            <img
                              src={b.builderDocs.companyLogo}
                              alt={b.name}
                              className="w-10 h-10 rounded-xl object-cover border border-[var(--border)] shrink-0 bg-[var(--bg-muted)] shadow-xs"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextSibling) {
                                  e.currentTarget.nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br from-brand/20 to-orange-500/20 text-brand font-black text-sm flex items-center justify-center shrink-0 border border-brand/30 shadow-xs ${
                              b.builderDocs?.companyLogo ? 'hidden' : 'flex'
                            }`}
                          >
                            {b.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-extrabold text-[var(--text-primary)] truncate max-w-[170px]" title={b.name}>
                                {b.name}
                              </p>
                              {b.isIsoCertified && (
                                <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
                                  ISO
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[var(--text-muted)]">
                              <span className="font-mono font-bold text-brand bg-brand/10 px-1.5 py-0.2 rounded">
                                {b.id}
                              </span>
                              <span className="truncate max-w-[120px] flex items-center gap-0.5">
                                <MapPin size={10} className="shrink-0" /> {b.cityOfOperation}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: RERA Certification */}
                      <td className="py-3.5 px-5">
                        <div>
                          <div className="flex items-center gap-1.5 font-bold font-mono text-[var(--text-primary)] text-xs">
                            <span className="truncate max-w-[130px]">{b.rera}</span>
                            {b.rera && b.rera !== 'Pending Check' && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(b.rera, 'RERA Number')}
                                className="text-[var(--text-muted)] hover:text-brand cursor-pointer p-0.5"
                                title="Copy RERA ID"
                              >
                                <Copy size={11} />
                              </button>
                            )}
                          </div>
                          <div className="mt-1">
                            {b.hasReraDoc ? (
                              <button
                                type="button"
                                onClick={() => openDocumentPreview(b.builderDocs.reraCertificate, `RERA Certificate - ${b.name}`)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/25 transition-all cursor-pointer"
                              >
                                <FileCheck size={11} /> View Cert
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">
                                <AlertTriangle size={9} /> No Cert
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Verification Documents */}
                      <td className="py-3.5 px-5">
                        <div className="flex flex-col gap-1">
                          {b.hasPanDoc ? (
                            <button
                              type="button"
                              onClick={() => openDocumentPreview(b.builderDocs.panCard, `PAN Card - ${b.name}`)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded-lg border border-blue-500/25 transition-all cursor-pointer w-fit"
                            >
                              <FileText size={10} /> PAN Card
                            </button>
                          ) : (
                            <span className="text-[9px] text-[var(--text-muted)] italic">No PAN uploaded</span>
                          )}
                          <span className="text-[9px] text-[var(--text-muted)] font-mono">
                            GST: {b.gstin !== 'Pending Submission' ? b.gstin : 'None'}
                          </span>
                        </div>
                      </td>

                      {/* Column 4: Experience */}
                      <td className="py-3.5 px-5 text-[var(--text-subtle)] font-semibold">
                        {b.yearsInBusinessText}
                      </td>

                      {/* Column 5: Delivered Projects */}
                      <td className="py-3.5 px-5 text-center font-bold text-[var(--text-primary)]">
                        {b.delivered} <span className="text-[10px] font-normal text-[var(--text-muted)]">Units</span>
                      </td>

                      {/* Column 6: Trust Rating */}
                      <td className="py-3.5 px-5 text-center">
                        <span className={`inline-flex px-2 py-0.5 border rounded-full text-[10px] font-black ${getTrustBadgeClass(b.trust)}`}>
                          {b.trust}%
                        </span>
                        <span className="block text-[8px] font-bold text-[var(--text-muted)] mt-0.5">
                          {b.status === 'Approved' ? 'Verified' : 'Audit Tier'}
                        </span>
                      </td>

                      {/* Column 7: Account Admin */}
                      <td className="py-3.5 px-5">
                        <div className="min-w-0 max-w-[150px]">
                          <p className="font-semibold text-[var(--text-primary)] truncate text-[11px]">
                            {b.applicantName}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)] font-mono truncate" title={b.email}>
                            {b.email}
                          </p>
                          {b.phone !== 'N/A' && (
                            <p className="text-[10px] text-[var(--text-muted)] font-mono truncate">
                              {b.phone}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Column 8: Status Badge */}
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            b.status === 'Approved'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : b.status === 'Pending'
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-xs'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              b.status === 'Approved'
                                ? 'bg-emerald-500'
                                : b.status === 'Pending'
                                ? 'bg-amber-500 animate-pulse'
                                : 'bg-rose-500'
                            }`}
                          ></span>
                          {b.status === 'Pending' ? 'Awaiting Approval' : b.status}
                        </span>
                        <span className="block text-[9px] text-[var(--text-muted)] mt-1">
                          {getRelativeTime(b.createdAt)}
                        </span>
                      </td>

                      {/* Column 9: Action Buttons */}
                      <td className="py-3.5 px-5 text-right">
                        {b.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Primary Review Action */}
                            <button
                              type="button"
                              onClick={() => setSelectedBuilder(b)}
                              className="px-3 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-[11px] font-bold shadow-xs shadow-brand/20 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <ShieldCheck size={13} />
                              <span>Review Application</span>
                            </button>

                            {/* Quick Direct Approve */}
                            <button
                              type="button"
                              onClick={() => updateBuilderStatus(b, 'Approved')}
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 rounded-xl transition-all cursor-pointer border border-emerald-500/20"
                              title="Quick Approve Builder"
                            >
                              <Check size={14} />
                            </button>

                            {/* Quick Direct Reject */}
                            <button
                              type="button"
                              onClick={() => setRejectPrompt({ item: b, type: 'builder' })}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600 dark:text-rose-400 rounded-xl transition-all cursor-pointer border border-rose-500/20"
                              title="Reject Application"
                            >
                              <Ban size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedBuilder(b)}
                              className="px-3 py-1.5 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                            >
                              Details & Audit
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Builder Projects Tab View */
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-wider bg-[var(--bg-muted)]">
                  <th className="py-3 px-6">Project Title / ID</th>
                  <th className="py-3 px-6">Developer</th>
                  <th className="py-3 px-6">Location</th>
                  <th className="py-3 px-6">Total Units</th>
                  <th className="py-3 px-6">Stage</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-muted)] text-xs">
                {isLoadingProjects ? (
                  <tr>
                    <td colSpan="7" className="py-14 text-center">
                      <AdminLoader
                        text="Loading developer projects..."
                        subtext="Fetching project inventories, units, and construction stages"
                        minHeight="min-h-[180px]"
                      />
                    </td>
                  </tr>
                ) : filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-[var(--text-muted)] font-semibold">
                      {searchQuery ? 'No matching projects found for your search.' : 'No builder projects found.'}
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--bg-muted)] transition-colors">
                      <td className="py-3.5 px-6">
                        <div>
                          <p className="font-extrabold text-[var(--text-primary)]">{p.title}</p>
                          <p className="text-[9px] text-[var(--text-muted)] font-mono">{p.id}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 font-bold text-[var(--text-subtle)]">{p.builder}</td>
                      <td className="py-3.5 px-6 font-semibold text-[var(--text-subtle)] flex items-center gap-1 mt-1">
                        <MapPin size={12} className="text-[var(--text-muted)] shrink-0" /> {p.location}
                      </td>
                      <td className="py-3.5 px-6 text-[var(--text-subtle)] font-medium">{p.units}</td>
                      <td className="py-3.5 px-6">
                        <span className="px-2 py-0.5 rounded bg-[var(--bg-muted)] text-[var(--text-subtle)] font-semibold text-[9px]">
                          {p.stage}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            p.status === 'Published'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : p.status === 'Draft'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-rose-500/10 text-rose-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.status === 'Published'
                                ? 'bg-emerald-500'
                                : p.status === 'Draft'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          ></span>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openScoreModal(p)}
                          className="px-2.5 py-1.5 border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 mr-1.5"
                          title="Set Investment Score"
                        >
                          <Sparkles size={11} /> Score ({p.score || 0})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedProject(p)}
                          className="px-2.5 py-1.5 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-subtle)] rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Moderate
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Builder Details & Verification Drawer Slider */}
      {selectedBuilder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-end">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] h-full max-w-xl w-full shadow-2xl border-l border-[var(--border)] p-6 overflow-y-auto flex flex-col justify-between animate-slide-left">
            <div className="space-y-6 text-left">
              {/* Drawer Header */}
              <div className="flex justify-between items-start border-b border-[var(--border)] pb-4">
                <div className="flex items-start gap-3.5">
                  {selectedBuilder.builderDocs?.companyLogo ? (
                    <img
                      src={selectedBuilder.builderDocs.companyLogo}
                      alt={selectedBuilder.companyName}
                      className="w-12 h-12 rounded-2xl object-cover border border-[var(--border)] shrink-0 bg-[var(--bg-muted)] shadow-xs"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand/20 to-orange-500/20 text-brand font-black text-base flex items-center justify-center shrink-0 border border-brand/30 shadow-xs">
                      {selectedBuilder.companyName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold text-brand bg-brand/10 px-2 py-0.5 rounded font-mono">
                        {selectedBuilder.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          selectedBuilder.status === 'Approved'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25'
                            : selectedBuilder.status === 'Pending'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/25'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            selectedBuilder.status === 'Approved'
                              ? 'bg-emerald-500'
                              : selectedBuilder.status === 'Pending'
                              ? 'bg-amber-500 animate-pulse'
                              : 'bg-rose-500'
                          }`}
                        ></span>
                        {selectedBuilder.status === 'Pending' ? 'Application Awaiting Approval' : selectedBuilder.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-[var(--text-primary)] mt-1">
                      {selectedBuilder.companyName}
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                      <MapPin size={12} /> {selectedBuilder.cityOfOperation} • Applied {getRelativeTime(selectedBuilder.createdAt)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedBuilder(null)}
                  className="p-2 bg-[var(--bg-muted)] hover:bg-[var(--border)] rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Status Alert for Pending Applications */}
              {selectedBuilder.status === 'Pending' && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                  <ShieldAlert size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-extrabold text-amber-700 dark:text-amber-300">
                      Builder Verification Application Pending
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                      Please examine the uploaded RERA Certificate and PAN card below. Confirm the legal entity name and license validity before authorizing builder privileges.
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION 1: CRITICAL DOCUMENTS AUDIT (RERA & PAN) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck size={14} className="text-brand" /> Uploaded Government Documents
                  </span>
                  <span className="text-[9px] font-bold text-[var(--text-muted)]">
                    Audit Verification Proofs
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Document 1: RERA Certificate */}
                  <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)]/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-[var(--text-primary)] flex items-center gap-1.5">
                        <FileCheck size={13} className="text-emerald-500" /> RERA License
                      </span>
                      {selectedBuilder.hasReraDoc ? (
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                          Uploaded
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">
                          Not Provided
                        </span>
                      )}
                    </div>

                    <div className="p-2 bg-[var(--bg-surface)] rounded-lg border border-[var(--border)]">
                      <span className="text-[9px] text-[var(--text-muted)] uppercase block font-semibold">
                        RERA Number
                      </span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="font-mono font-bold text-xs text-[var(--text-primary)] truncate">
                          {selectedBuilder.rera}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedBuilder.rera, 'RERA Number')}
                          className="text-[var(--text-muted)] hover:text-brand cursor-pointer p-0.5"
                          title="Copy"
                        >
                          <Copy size={11} />
                        </button>
                      </div>
                    </div>

                    {selectedBuilder.hasReraDoc ? (
                      <div className="space-y-2">
                        {/* Thumbnail image if available */}
                        <div
                          onClick={() => openDocumentPreview(selectedBuilder.builderDocs.reraCertificate, `RERA Certificate - ${selectedBuilder.companyName}`)}
                          className="relative h-24 rounded-lg overflow-hidden border border-[var(--border)] bg-black/5 dark:bg-black/30 group cursor-pointer"
                        >
                          <img
                            src={selectedBuilder.builderDocs.reraCertificate}
                            alt="RERA Certificate"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextSibling) {
                                e.currentTarget.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                          <div className="w-full h-full hidden items-center justify-center text-[var(--text-muted)] text-[10px] font-semibold">
                            <FileText size={20} className="text-brand mr-1" /> PDF / Document Preview
                          </div>
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                            <Eye size={14} /> Click to Inspect
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openDocumentPreview(selectedBuilder.builderDocs.reraCertificate, `RERA Certificate - ${selectedBuilder.companyName}`)}
                            className="flex-1 py-1.5 px-2 bg-brand/10 hover:bg-brand/20 text-brand rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Eye size={12} /> Inspect
                          </button>
                          <a
                            href={selectedBuilder.builderDocs.reraCertificate}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-1.5 px-2 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-subtle)] rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                            title="Open original in new tab"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                        No RERA certificate file uploaded by builder.
                      </p>
                    )}
                  </div>

                  {/* Document 2: Company PAN Card */}
                  <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)]/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-[var(--text-primary)] flex items-center gap-1.5">
                        <FileText size={13} className="text-blue-500" /> PAN Card
                      </span>
                      {selectedBuilder.hasPanDoc ? (
                        <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded">
                          Uploaded
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">
                          Not Provided
                        </span>
                      )}
                    </div>

                    <div className="p-2 bg-[var(--bg-surface)] rounded-lg border border-[var(--border)]">
                      <span className="text-[9px] text-[var(--text-muted)] uppercase block font-semibold">
                        GSTIN Registration
                      </span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="font-mono font-bold text-xs text-[var(--text-primary)] truncate">
                          {selectedBuilder.gstin}
                        </span>
                        {selectedBuilder.gstin && selectedBuilder.gstin !== 'Pending Submission' && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(selectedBuilder.gstin, 'GSTIN')}
                            className="text-[var(--text-muted)] hover:text-brand cursor-pointer p-0.5"
                            title="Copy"
                          >
                            <Copy size={11} />
                          </button>
                        )}
                      </div>
                    </div>

                    {selectedBuilder.hasPanDoc ? (
                      <div className="space-y-2">
                        {/* Thumbnail image if available */}
                        <div
                          onClick={() => openDocumentPreview(selectedBuilder.builderDocs.panCard, `PAN Card - ${selectedBuilder.companyName}`)}
                          className="relative h-24 rounded-lg overflow-hidden border border-[var(--border)] bg-black/5 dark:bg-black/30 group cursor-pointer"
                        >
                          <img
                            src={selectedBuilder.builderDocs.panCard}
                            alt="PAN Card"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextSibling) {
                                e.currentTarget.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                          <div className="w-full h-full hidden items-center justify-center text-[var(--text-muted)] text-[10px] font-semibold">
                            <FileText size={20} className="text-blue-500 mr-1" /> PDF / Document Preview
                          </div>
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                            <Eye size={14} /> Click to Inspect
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openDocumentPreview(selectedBuilder.builderDocs.panCard, `PAN Card - ${selectedBuilder.companyName}`)}
                            className="flex-1 py-1.5 px-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Eye size={12} /> Inspect
                          </button>
                          <a
                            href={selectedBuilder.builderDocs.panCard}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-1.5 px-2 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-subtle)] rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                            title="Open original in new tab"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                        No PAN card uploaded by builder.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: LEGAL & CORPORATE PROFILE */}
              <div className="p-4 bg-[var(--bg-muted)]/50 rounded-2xl border border-[var(--border)] space-y-3">
                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider block">
                  Corporate & Business Credentials
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)]">
                    <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase block">Years Active</span>
                    <span className="text-xs font-bold text-[var(--text-primary)] mt-0.5 block">
                      {selectedBuilder.yearsInBusinessText}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)]">
                    <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase block">Units Delivered</span>
                    <span className="text-xs font-bold text-[var(--text-primary)] mt-0.5 block">
                      {selectedBuilder.delivered} Projects
                    </span>
                  </div>
                  <div className="p-2.5 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)]">
                    <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase block">ISO Certified</span>
                    <span className={`text-xs font-bold mt-0.5 block ${selectedBuilder.isIsoCertified ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>
                      {selectedBuilder.isIsoCertified ? '✓ Certified' : 'No'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)]">
                    <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase block">Risk Rating</span>
                    <span className="text-xs font-bold text-emerald-500 mt-0.5 block">
                      {selectedBuilder.internalRiskRating}
                    </span>
                  </div>
                </div>

                {/* Corporate Address */}
                <div>
                  <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase block">
                    Corporate Office Address
                  </label>
                  <p className="text-[11px] font-medium text-[var(--text-primary)] mt-0.5 bg-[var(--bg-surface)] p-2.5 rounded-xl border border-[var(--border)]">
                    {selectedBuilder.corporateAddress}
                  </p>
                </div>

                {/* Company Bio */}
                {selectedBuilder.bio && (
                  <div>
                    <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase block">
                      Company Overview / Bio
                    </label>
                    <p className="text-[11px] text-[var(--text-subtle)] mt-0.5 bg-[var(--bg-surface)] p-2.5 rounded-xl border border-[var(--border)] leading-relaxed">
                      {selectedBuilder.bio}
                    </p>
                  </div>
                )}
              </div>

              {/* SECTION 3: KEY EXECUTIVE & CONTACT DETAILS */}
              <div className="p-4 bg-[var(--bg-muted)]/50 rounded-2xl border border-[var(--border)] space-y-3">
                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider block">
                  Legal Representative / Account Contact
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)]">
                    <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase block">Applicant Name</span>
                    <span className="font-bold text-[var(--text-primary)] mt-0.5 block">
                      {selectedBuilder.applicantName}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)]">
                    <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase block">Email Address</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <a
                        href={`mailto:${selectedBuilder.email}`}
                        className="font-mono text-brand hover:underline truncate text-[11px]"
                      >
                        {selectedBuilder.email}
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedBuilder.email, 'Email')}
                        className="text-[var(--text-muted)] hover:text-brand cursor-pointer p-0.5"
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  </div>
                  {selectedBuilder.phone !== 'N/A' && (
                    <div className="p-2.5 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] sm:col-span-2">
                      <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase block">Contact Phone</span>
                      <div className="flex items-center justify-between mt-0.5">
                        <a
                          href={`tel:${selectedBuilder.phone}`}
                          className="font-mono font-bold text-[var(--text-primary)] hover:text-brand"
                        >
                          {selectedBuilder.phone}
                        </a>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedBuilder.phone, 'Phone')}
                          className="text-[var(--text-muted)] hover:text-brand cursor-pointer p-0.5"
                        >
                          <Copy size={11} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Audit History / Past Notes if any */}
              {selectedBuilder.internalNotes && (
                <div className="p-3 bg-[var(--bg-muted)] rounded-xl border border-[var(--border)] text-xs">
                  <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase block">
                    Audit Log / Previous Remarks
                  </span>
                  <p className="text-[11px] text-[var(--text-subtle)] mt-0.5 italic">
                    {selectedBuilder.internalNotes}
                  </p>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="pt-5 border-t border-[var(--border)] space-y-2.5 mt-6">
              {selectedBuilder.status === 'Pending' ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => updateBuilderStatus(selectedBuilder, 'Approved')}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 size={16} /> Approve & Authorize Builder License
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRejectPrompt({ item: selectedBuilder, type: 'builder' })}
                      className="flex-1 py-2.5 border border-rose-500/30 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Ban size={14} /> Reject Application
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedBuilder(null)}
                      className="py-2.5 px-4 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-subtle)] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : selectedBuilder.status === 'Approved' ? (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
                    <CheckCircle size={15} /> Builder is Authorized & Verified Live
                  </div>
                  <button
                    type="button"
                    onClick={() => setRejectPrompt({ item: selectedBuilder, type: 'builder' })}
                    className="w-full py-2.5 border border-rose-500/25 hover:bg-rose-500/10 text-rose-500 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Ban size={14} /> Suspend Builder License
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => updateBuilderStatus(selectedBuilder, 'Approved')}
                  className="w-full py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold shadow-md shadow-brand/20 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ShieldCheck size={14} /> Re-verify & Reactivate Credentials
                </button>
              )}

              <button
                type="button"
                onClick={() => setDeleteConfirm({ item: selectedBuilder, type: 'builder' })}
                className="w-full py-2 text-[var(--text-muted)] hover:text-rose-500 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Trash2 size={12} /> Deactivate Builder Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Moderation Drawer Slider */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-end">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] h-full max-w-md w-full shadow-2xl border-l border-[var(--border)] p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6 text-left">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-extrabold text-brand bg-brand/10 px-2 py-0.5 rounded font-mono">
                    PROJECT DETAILS
                  </span>
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)] mt-1.5">
                    {selectedProject.title}
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">{selectedProject.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="p-1 bg-[var(--bg-muted)] rounded-lg text-[var(--text-muted)] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 text-xs font-semibold">
                <div className="p-3.5 bg-[var(--bg-muted)] rounded-xl flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Builder</span>
                    <span className="text-[var(--text-primary)]">{selectedProject.builder}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Location</span>
                    <span className="text-[var(--text-primary)]">{selectedProject.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Inventory</span>
                    <span className="text-[var(--text-primary)]">{selectedProject.units}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Project Stage</span>
                    <span className="text-[var(--text-primary)]">{selectedProject.stage}</span>
                  </div>
                </div>

                {/* Investment Score Card */}
                <div className="p-3.5 border border-emerald-500/30 bg-emerald-500/5 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-emerald-500" />
                      <span className="text-xs font-black text-[var(--text-primary)]">GharMB Investment Score</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {selectedProject.investmentScore?.overall || selectedProject.score || 0} / 10
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {selectedProject.investmentScore?.grade || 'Good'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px] text-[var(--text-subtle)] pt-1">
                    <div>Connectivity: <strong className="text-[var(--text-primary)]">{selectedProject.investmentScore?.metrics?.connectivity ?? 0}/10</strong></div>
                    <div>Rental Potential: <strong className="text-[var(--text-primary)]">{selectedProject.investmentScore?.metrics?.rentalPotential ?? 0}/10</strong></div>
                    <div>Growth Potential: <strong className="text-[var(--text-primary)]">{selectedProject.investmentScore?.metrics?.growthPotential ?? 0}/10</strong></div>
                    <div>Family Living: <strong className="text-[var(--text-primary)]">{selectedProject.investmentScore?.metrics?.familyLiving ?? 0}/10</strong></div>
                    <div className="col-span-2">Future Demand: <strong className="text-[var(--text-primary)]">{selectedProject.investmentScore?.metrics?.futureDemand ?? 0}/10</strong></div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openScoreModal(selectedProject)}
                    className="w-full mt-2 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Sparkles size={11} /> Edit Investment Score
                  </button>
                </div>

                <div className="p-3 border border-[var(--border)] rounded-xl space-y-1.5 bg-[var(--bg-surface)]">
                  <div className="flex justify-between items-center text-[10px] font-bold text-[var(--text-muted)] uppercase">
                    <span>Audit Checklist</span>
                    <span className="text-emerald-500">Passed</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-subtle)] space-y-1">
                    <p className="flex items-center gap-1.5">
                      <Check size={12} className="text-emerald-500" /> RERA ID cross checked in Government register
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Check size={12} className="text-emerald-500" /> Site map blueprints validation
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Check size={12} className="text-emerald-500" /> Elevation structural plan approvals verified
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border)] space-y-2">
              {selectedProject.status !== 'Published' ? (
                <button
                  type="button"
                  onClick={() => updateProjectStatus(selectedProject, 'Published')}
                  className="w-full py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold shadow-md shadow-brand/20 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckCircle size={14} /> Publish Project Live
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setRejectPrompt({ item: selectedProject, type: 'project' })}
                  className="w-full py-2.5 border border-rose-500/25 hover:bg-rose-500/10 text-rose-500 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Ban size={14} /> Suspend/Archive Listing
                </button>
              )}

              <button
                type="button"
                onClick={() => setDeleteConfirm({ item: selectedProject, type: 'project' })}
                className="w-full py-2.5 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-rose-500 hover:text-rose-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} /> Permanently Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal (With Common Presets) */}
      {rejectPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-2.5 text-rose-500">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <Ban size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)]">
                  {rejectPrompt.type === 'builder'
                    ? rejectPrompt.item.status === 'Pending'
                      ? 'Decline Builder Application'
                      : 'Suspend Builder Account'
                    : 'Suspend Project Listing'}
                </h4>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {rejectPrompt.item.companyName || rejectPrompt.item.title}
                </p>
              </div>
            </div>

            {rejectPrompt.type === 'builder' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">
                  Select Pre-Configured Reason
                </label>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {presetRejectReasons.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setRejectReason(preset);
                        setCustomReasonActive(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl text-[11px] font-medium transition-all border ${
                        rejectReason === preset && !customReasonActive
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold'
                          : 'bg-[var(--bg-muted)] text-[var(--text-subtle)] border-transparent hover:border-[var(--border)]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5 text-xs">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">
                Official Feedback / Reason Sent to Applicant
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  setCustomReasonActive(true);
                }}
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
                  if (rejectPrompt.type === 'builder') {
                    updateBuilderStatus(rejectPrompt.item, 'Rejected', rejectReason);
                  } else {
                    updateProjectStatus(rejectPrompt.item, 'Archived', rejectReason);
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
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
                ? This action removes their access.
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

      {/* IN-APP DOCUMENT LIGHTBOX / PREVIEW MODAL */}
      {lightboxDoc && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[60] flex flex-col items-center justify-between p-4 sm:p-6 animate-fade-in">
          {/* Lightbox Topbar */}
          <div className="w-full max-w-5xl flex items-center justify-between text-white pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <FileCheck size={18} className="text-brand" />
              <div>
                <h4 className="text-sm font-bold truncate max-w-md">{lightboxDoc.title}</h4>
                <span className="text-[10px] text-white/60">Government Verification Document</span>
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
            <span>Use Zoom & Rotate to audit license registration numbers, seals, and dates</span>
            <span className="font-mono">URL: {lightboxDoc.url}</span>
          </div>
        </div>
      )}
      {/* Investment Score Modal */}
      {editingScoreProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
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

            {/* Live Overall Preview */}
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

export default BuilderManagement;
