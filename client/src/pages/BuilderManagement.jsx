import React, { useState, useEffect, useRef } from 'react';
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
  X,
  XCircle,
  Trash2,
  Check,
  Copy,
  ExternalLink,
  ChevronRight,
  Phone,
  Mail,
  AlertCircle
} from 'lucide-react';

const BuilderManagement = () => {
  const [builders, setBuilders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoadingBuilders, setIsLoadingBuilders] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  const [activeTab, setActiveTab] = useState('builders'); // 'builders' or 'projects'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Approved', 'Pending', 'Suspended'

  // Drawer states
  const [selectedBuilder, setSelectedBuilder] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // Reject / Reason state
  const [rejectPrompt, setRejectPrompt] = useState(null); // { item, type: 'builder' | 'project' }
  const [rejectReason, setRejectReason] = useState('License documents verification incomplete or mismatch');

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { item, type: 'builder' | 'project' }

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

  const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const API_BASE = RAW_API_URL.replace(/\/+api\/?$/i, '').replace(/\/+$/, '');
  const API_URL = `${API_BASE}/api`;

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchBuilders = async () => {
    setIsLoadingBuilders(true);
    try {
      const response = await fetch(`${API_URL}/admin/users?role=builder`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (response.ok && data.status === 'success' && data.data?.users) {
        const mapped = data.data.users.map((u) => {
          let status = 'Pending';
          if (u.builderVerificationStatus === 'approved') status = 'Approved';
          else if (u.builderVerificationStatus === 'rejected') status = 'Suspended';
          else if (u.status === 'Blocked') status = 'Suspended';

          return {
            id: `BLD-${u._id.slice(-4).toUpperCase()}`,
            _id: u._id,
            name: u.companyName || u.name,
            companyName: u.companyName || u.name,
            rera: u.reraNumber || u.gstNumber || 'Pending Check',
            exp: parseInt(u.yearsInBusiness) || 5,
            delivered: parseInt(u.unitsDelivered) || 10,
            trust: u.builderVerificationStatus === 'approved' ? 95 : u.builderVerificationStatus === 'pending' ? 70 : 45,
            status,
            user: u.email || u.phone || 'N/A',
            phone: u.phone || 'N/A',
            cityOfOperation: u.cityOfOperation || (u.address?.city) || 'India',
            corporateAddress: u.address?.formattedAddress || `${u.cityOfOperation || 'India'}`,
            cin: u.cin || u.gstNumber || 'CIN-REGISTERED',
            executiveContact: `${u.name} • ${u.phone || ''} • ${u.email || ''}`,
            gstin: u.gstNumber || 'N/A',
            pan: u.builderDocs?.panCard ? 'PAN Uploaded' : 'N/A',
            builderDocs: u.builderDocs || {},
            bio: u.bio || '',
            isIsoCertified: u.isIsoCertified || false,
            internalRiskRating: u.builderVerificationStatus === 'approved' ? 'Tier-1 A+ (Verified)' : u.builderVerificationStatus === 'pending' ? 'Tier-2 (Under Audit)' : 'High Watchlist',
            accountManager: 'Executive Admin',
            internalNotes: u.builderRejectionReason ? `Audit Note: ${u.builderRejectionReason}` : 'Company profile submitted for platform verification.'
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
      const response = await fetch(`${API_URL}/admin/projects`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (response.ok && data.status === 'success' && data.data?.projects) {
        const mapped = data.data.projects.map((p) => {
          let status = 'Draft';
          if (p.approvalStatus === 'approved') status = 'Published';
          else if (p.approvalStatus === 'rejected') status = 'Archived';

          return {
            id: p.submissionId || `PRJ-${p._id.slice(-4).toUpperCase()}`,
            _id: p._id,
            title: p.projectName,
            builder: p.developerName || p.developer?.companyName || p.developer?.name || 'Developer',
            location: `${p.locality ? p.locality + ', ' : ''}${p.city}`,
            score: p.approvalStatus === 'approved' ? 9.2 : 7.0,
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
      const response = await fetch(`${API_URL}/admin/users/${builder._id}/verify-developer`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          builderVerificationStatus: bodyStatus,
          rejectReason: reason || (newStatus === 'Approved' ? 'Verified by Admin' : 'Suspended by Admin')
        })
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        fetchBuilders();
        if (selectedBuilder && selectedBuilder._id === builder._id) {
          setSelectedBuilder((prev) => ({
            ...prev,
            status: newStatus,
            trust: newStatus === 'Approved' ? 95 : 45
          }));
        }
        setRejectPrompt(null);
        showToast(`Builder status changed to ${newStatus}.`, 'success');
      } else {
        showToast(data.message || 'Failed to update builder status.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error updating builder status.', 'error');
    }
  };

  const deleteBuilder = async (builder) => {
    try {
      const response = await fetch(`${API_URL}/admin/users/${builder._id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        fetchBuilders();
        setSelectedBuilder(null);
        setDeleteConfirm(null);
        showToast('Builder deactivated successfully.', 'info');
      } else {
        showToast(data.message || 'Failed to delete builder.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to server.', 'error');
    }
  };

  // Project actions
  const updateProjectStatus = async (project, newStatus, reason = '') => {
    try {
      let apiStatus = 'pending';
      if (newStatus === 'Published') apiStatus = 'approved';
      else if (newStatus === 'Archived') apiStatus = 'rejected';

      const response = await fetch(`${API_URL}/admin/projects/${project._id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ approvalStatus: apiStatus, rejectionReason: reason })
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        fetchProjects();
        if (selectedProject && selectedProject._id === project._id) {
          setSelectedProject((prev) => ({ ...prev, status: newStatus }));
        }
        setRejectPrompt(null);
        showToast(`Project status updated to ${newStatus}.`, 'success');
      } else {
        showToast(data.message || 'Failed to update project status.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error updating project status.', 'error');
    }
  };

  const deleteProject = async (project) => {
    try {
      const response = await fetch(`${API_URL}/admin/projects/${project._id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        fetchProjects();
        setSelectedProject(null);
        setDeleteConfirm(null);
        showToast('Project deleted successfully.', 'info');
      } else {
        showToast(data.message || 'Failed to delete project.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to server.', 'error');
    }
  };

  const getTrustBadgeClass = (score) => {
    if (score >= 90) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25';
    if (score >= 70) return 'bg-amber-500/10 text-amber-500 border-amber-500/25';
    return 'bg-rose-500/10 text-rose-500 border-rose-500/25';
  };

  // Filter logic
  const filteredBuilders = builders.filter((b) => {
    if (statusFilter !== 'All' && b.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.name?.toLowerCase().includes(q) ||
        b.rera?.toLowerCase().includes(q) ||
        b.user?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredProjects = projects.filter((p) => {
    if (statusFilter !== 'All' && p.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.title?.toLowerCase().includes(q) ||
        p.builder?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] animate-slide-down">
          {toast.type === 'success' && <CheckCircle size={16} className="text-emerald-500 shrink-0" />}
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

      {/* 4 Upper Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Registered Builders */}
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm flex items-center gap-4 transition-all">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 border border-orange-500/20">
            <HardHat size={18} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-[var(--text-muted)] block uppercase tracking-wider">
              Registered Builders
            </span>
            <h4 className="text-base font-extrabold text-[var(--text-primary)] mt-0.5">
              {builders.length} Builders
            </h4>
          </div>
        </div>

        {/* Card 2: Developer Projects */}
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm flex items-center gap-4 transition-all">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/20">
            <Layers size={18} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-[var(--text-muted)] block uppercase tracking-wider">
              Developer Projects
            </span>
            <h4 className="text-base font-extrabold text-[var(--text-primary)] mt-0.5">
              {projects.length} Total Projects
            </h4>
          </div>
        </div>

        {/* Card 3: Pending Certs */}
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm flex items-center gap-4 transition-all">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
            <ShieldAlert size={18} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-[var(--text-muted)] block uppercase tracking-wider">
              Pending Certs
            </span>
            <h4 className="text-base font-extrabold text-[var(--text-primary)] mt-0.5">
              {builders.filter((b) => b.status === 'Pending').length} RERA Audits
            </h4>
          </div>
        </div>

        {/* Card 4: Avg Trust Score */}
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm flex items-center gap-4 transition-all">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <Award size={18} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-[var(--text-muted)] block uppercase tracking-wider">
              Avg Trust Score
            </span>
            <h4 className="text-base font-extrabold text-[var(--text-primary)] mt-0.5">
              {builders.length > 0
                ? Math.round(builders.reduce((sum, b) => sum + b.trust, 0) / builders.length)
                : 0}% Rating
            </h4>
          </div>
        </div>
      </div>

      {/* Tabs & Search controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-2">
        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('builders');
              setStatusFilter('All');
            }}
            className={`pb-2.5 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'builders' ? 'text-brand' : 'text-[var(--text-subtle)] hover:text-[var(--text-primary)]'
            }`}
          >
            Builders Management ({builders.length})
            {activeTab === 'builders' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-t-full"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('projects');
              setStatusFilter('All');
            }}
            className={`pb-2.5 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'projects' ? 'text-brand' : 'text-[var(--text-subtle)] hover:text-[var(--text-primary)]'
            }`}
          >
            Builder Projects ({projects.length})
            {activeTab === 'projects' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-t-full"></span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 max-w-md w-full sm:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl text-xs font-medium focus:outline-none focus:border-brand/40 cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Approved">{activeTab === 'builders' ? 'Approved' : 'Published'}</option>
            <option value="Pending">{activeTab === 'builders' ? 'Pending' : 'Draft'}</option>
            <option value="Suspended">{activeTab === 'builders' ? 'Suspended' : 'Archived'}</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 text-[var(--text-muted)]" size={14} />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'builders' ? 'builders' : 'projects'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-7 py-1.5 border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-brand/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Contents: Builders Management vs Builder Projects */}
      {activeTab === 'builders' ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-wider bg-[var(--bg-muted)]">
                  <th className="py-3 px-6">Company / ID</th>
                  <th className="py-3 px-6">RERA Certification</th>
                  <th className="py-3 px-6">Experience</th>
                  <th className="py-3 px-6 text-center">Delivered</th>
                  <th className="py-3 px-6 text-center">Trust Index</th>
                  <th className="py-3 px-6">Account Admin</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-muted)] text-xs">
                {isLoadingBuilders ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-24"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-24"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-12"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-8 mx-auto"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-8 mx-auto"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-24"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-16"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-12 ml-auto"></div></td>
                    </tr>
                  ))
                ) : filteredBuilders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-[var(--text-muted)] font-semibold">
                      {searchQuery ? 'No matching builders found for your search.' : 'No builders found.'}
                    </td>
                  </tr>
                ) : (
                  filteredBuilders.map((b) => (
                    <tr key={b.id} className="hover:bg-[var(--bg-muted)] transition-colors">
                      <td className="py-3.5 px-6">
                        <div>
                          <p className="font-extrabold text-[var(--text-primary)]">{b.name}</p>
                          <p className="text-[9px] text-[var(--text-muted)] font-mono">{b.id}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-1.5 font-semibold text-[var(--text-subtle)] font-mono">
                          <span>{b.rera}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(b.rera, 'RERA Number')}
                            className="text-[var(--text-muted)] hover:text-brand cursor-pointer p-0.5"
                            title="Copy RERA"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-[var(--text-subtle)] font-semibold">{b.exp} Years</td>
                      <td className="py-3.5 px-6 text-center font-semibold text-[var(--text-subtle)]">
                        {b.delivered} Projects
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span className={`inline-flex px-2 py-0.5 border rounded-full text-[9px] font-bold ${getTrustBadgeClass(b.trust)}`}>
                          {b.trust}%
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-[var(--text-subtle)] font-mono text-[11px] truncate max-w-[150px]">
                        {b.user}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            b.status === 'Approved'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : b.status === 'Pending'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-rose-500/10 text-rose-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              b.status === 'Approved'
                                ? 'bg-emerald-500'
                                : b.status === 'Pending'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          ></span>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedBuilder(b)}
                          className="px-2.5 py-1.5 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-subtle)] rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Details
                        </button>
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
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-24"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-20"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-24"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-12"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-16"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-16"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-12 ml-auto"></div></td>
                    </tr>
                  ))
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
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
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
                      <td className="py-3.5 px-6 text-right">
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

      {/* Builder Details Drawer Slider */}
      {selectedBuilder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-end">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] h-full max-w-lg w-full shadow-2xl border-l border-[var(--border)] p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-5 text-left">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-[var(--border)] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-extrabold text-brand bg-brand/10 px-2 py-0.5 rounded font-mono">
                      {selectedBuilder.id}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        selectedBuilder.status === 'Approved'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : selectedBuilder.status === 'Pending'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}
                    >
                      {selectedBuilder.status}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-[var(--text-primary)] mt-1.5">
                    {selectedBuilder.name}
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">{selectedBuilder.user}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBuilder(null)}
                  className="p-1.5 bg-[var(--bg-muted)] rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* SECTION A: CONFIDENTIAL - ADMIN INTERNAL ONLY */}
              <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert size={14} className="text-amber-500" /> Admin Internal Information (Confidential)
                  </span>
                  <span className="text-[8px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded">
                    Not Displayed Publicly
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* Corporate Office Address */}
                  <div>
                    <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase block">
                      Corporate Office Address
                    </label>
                    <p className="text-[11px] font-semibold text-[var(--text-primary)] mt-0.5 bg-[var(--bg-surface)] p-2 rounded-xl border border-[var(--border)]">
                      {selectedBuilder.corporateAddress || 'Suite 800, DLF Cyber City, Gurugram, Haryana - 122002'}
                    </p>
                  </div>

                  {/* Corporate CIN & Risk Rating */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase block">
                        Corporate CIN
                      </label>
                      <p className="text-[10px] font-mono font-bold text-[var(--text-primary)] mt-0.5 bg-[var(--bg-surface)] p-1.5 rounded-lg border border-[var(--border)] truncate">
                        {selectedBuilder.cin || 'U70109HR2010PTC041289'}
                      </p>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase block">
                        Risk Rating
                      </label>
                      <p className="text-[10px] font-bold text-emerald-500 mt-0.5 bg-[var(--bg-surface)] p-1.5 rounded-lg border border-[var(--border)] truncate">
                        {selectedBuilder.internalRiskRating || 'Tier-1 A+'}
                      </p>
                    </div>
                  </div>

                  {/* Key Executive Contact */}
                  <div>
                    <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase block">
                      Key Executive / Director Contact
                    </label>
                    <p className="text-[10px] font-medium text-[var(--text-subtle)] mt-0.5 bg-[var(--bg-surface)] p-2 rounded-xl border border-[var(--border)]">
                      {selectedBuilder.executiveContact || 'Director of Sales • +91 98110 22334'}
                    </p>
                  </div>

                  {/* GSTIN & PAN */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase block">GSTIN</label>
                      <p className="text-[10px] font-mono text-[var(--text-primary)] bg-[var(--bg-surface)] p-1.5 rounded-lg border border-[var(--border)]">
                        {selectedBuilder.gstin || '06AAACD1234F1Z8'}
                      </p>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase block">PAN Card</label>
                      <p className="text-[10px] font-mono text-[var(--text-primary)] bg-[var(--bg-surface)] p-1.5 rounded-lg border border-[var(--border)]">
                        {selectedBuilder.pan || 'AAACD1234F'}
                      </p>
                    </div>
                  </div>

                  {/* Internal Notes */}
                  <div>
                    <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase block">
                      Internal Admin Notes
                    </label>
                    <p className="text-[10px] text-[var(--text-subtle)] mt-0.5 bg-[var(--bg-surface)] p-2 rounded-xl border border-[var(--border)] italic">
                      {selectedBuilder.internalNotes || 'Verified developer profile. Escrow account compliant.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION B: PUBLIC PROFILE INFORMATION */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-wider block">
                  Public Profile Information (User Visible)
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[var(--bg-muted)] rounded-xl">
                    <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase block">RERA License</span>
                    <span className="text-[10px] font-bold text-[var(--text-primary)] font-mono block mt-0.5 truncate">
                      {selectedBuilder.rera}
                    </span>
                  </div>
                  <div className="p-3 bg-[var(--bg-muted)] rounded-xl">
                    <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase block">Years Active</span>
                    <span className="text-[10px] font-bold text-[var(--text-primary)] block mt-0.5">
                      {selectedBuilder.exp} Years
                    </span>
                  </div>
                  <div className="p-3 bg-[var(--bg-muted)] rounded-xl">
                    <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase block">Delivered Count</span>
                    <span className="text-[10px] font-bold text-[var(--text-primary)] block mt-0.5">
                      {selectedBuilder.delivered} Projects
                    </span>
                  </div>
                  <div className="p-3 bg-[var(--bg-muted)] rounded-xl">
                    <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase block">Public Trust Rating</span>
                    <span className="text-[10px] font-bold text-emerald-500 block mt-0.5">
                      {selectedBuilder.trust}% Rating
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                    Credentials Document Checks
                  </span>
                  <div className="p-3 border border-[var(--border)] rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[var(--text-subtle)] flex items-center gap-1.5">
                        <FileCheck size={14} className="text-emerald-500" /> Corporate Registration Deed
                      </span>
                      <span className="text-emerald-500 font-bold text-[10px]">Verified</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[var(--text-subtle)] flex items-center gap-1.5">
                        <FileCheck size={14} className="text-emerald-500" /> RERA License Certificate
                      </span>
                      <span className="text-emerald-500 font-bold text-[10px]">Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-4 border-t border-[var(--border)] space-y-2.5">
              {selectedBuilder.status === 'Pending' ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateBuilderStatus(selectedBuilder, 'Approved')}
                    className="flex-1 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold shadow-md shadow-brand/20 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ShieldCheck size={14} /> Approve Credentials
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectPrompt({ item: selectedBuilder, type: 'builder' })}
                    className="flex-1 py-2.5 border border-rose-500/25 hover:bg-rose-500/10 text-rose-500 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Ban size={14} /> Reject
                  </button>
                </div>
              ) : selectedBuilder.status === 'Approved' ? (
                <button
                  type="button"
                  onClick={() => setRejectPrompt({ item: selectedBuilder, type: 'builder' })}
                  className="w-full py-2.5 border border-rose-500/25 hover:bg-rose-500/10 text-rose-500 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Ban size={14} /> Suspend Builder License
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => updateBuilderStatus(selectedBuilder, 'Approved')}
                  className="w-full py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold shadow-md shadow-brand/20 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ShieldCheck size={14} /> Re-verify & Activate Credentials
                </button>
              )}

              <button
                type="button"
                onClick={() => setDeleteConfirm({ item: selectedBuilder, type: 'builder' })}
                className="w-full py-2.5 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-rose-500 hover:text-rose-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} /> Deactivate Builder Account
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

      {/* Reject Reason Modal */}
      {rejectPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-500">
              <Ban size={18} />
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                {rejectPrompt.type === 'builder' ? 'Suspend Builder' : 'Suspend Project'}
              </h4>
            </div>
            <div className="space-y-1.5 text-xs">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">
                Specify Reason
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter audit/suspension reason..."
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
                    updateBuilderStatus(rejectPrompt.item, 'Suspended', rejectReason);
                  } else {
                    updateProjectStatus(rejectPrompt.item, 'Archived', rejectReason);
                  }
                }}
                className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Confirm
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
                Permanently Delete?
              </h4>
              <p className="text-xs text-[var(--text-muted)]">
                Are you sure you want to delete{' '}
                <strong className="text-[var(--text-primary)]">
                  {deleteConfirm.item.name || deleteConfirm.item.title}
                </strong>
                ? This action cannot be undone.
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuilderManagement;
