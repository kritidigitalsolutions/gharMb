import React, { useState, useEffect, useRef, useMemo } from 'react';
import AdminLoader from '../components/common/AdminLoader';
import CallContactModal from '../components/common/CallContactModal';
import { useSearchParams } from 'react-router-dom';
import API, { getMediaUrl } from '../api/api';
import {
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Phone,
  Mail,
  MessageCircle,
  FileText,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X,
  RefreshCw,
  AlertTriangle,
  Award,
  MapPin,
  Briefcase,
  ChevronRight,
  Info
} from 'lucide-react';

const AgentManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightedAgentId = searchParams.get('agentId');

  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('All');

  // Selected agent for slide-over drawer
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [callTarget, setCallTarget] = useState(null);

  // Document Lightbox preview
  const [lightboxDoc, setLightboxDoc] = useState(null); // { url, title, type }
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Rejection modal
  const [rejectPrompt, setRejectPrompt] = useState(null);
  const [rejectReason, setRejectReason] = useState('RERA License documents could not be verified in the state registry');
  const [customReasonActive, setCustomReasonActive] = useState(false);
  const [customReasonText, setCustomReasonText] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

  // Toast notification
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const getDocumentUrl = (url) => {
    return getMediaUrl(url);
  };

  const copyToClipboard = (text, label = 'Information') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`, 'info');
  };

  const fetchAgents = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await API.get('/admin/users?role=agent');
      const data = response.data;
      if (data?.status === 'success' && data.data?.users) {
        const mapped = data.data.users.map((u) => {
          let verificationStatus = u.agentVerificationStatus || 'unverified';
          if (!u.agentVerificationStatus && u.isVerified) verificationStatus = 'approved';

          const reraDoc = getDocumentUrl(u.verificationDocs?.reraCertificate);
          const aadhaarDoc = getDocumentUrl(u.verificationDocs?.aadhaarCard);
          const photoDoc = getDocumentUrl(u.verificationDocs?.profilePhoto || u.profilePicture);

          return {
            _id: u._id,
            id: `AGT-${u._id.slice(-4).toUpperCase()}`,
            name: u.name || 'Anonymous Agent',
            email: u.email || 'N/A',
            phone: u.phone || 'N/A',
            cityOfOperation: u.cityOfOperation || 'India',
            experience: u.experience || 'Not specified',
            reraNumber: u.reraNumber || 'Not provided',
            verificationStatus,
            rejectionReason: u.agentRejectionReason || '',
            isVerified: Boolean(u.isVerified || verificationStatus === 'approved'),
            status: u.status || 'Active',
            verificationDocs: {
              reraCertificate: reraDoc,
              aadhaarCard: aadhaarDoc,
              profilePhoto: photoDoc
            },
            hasReraDoc: Boolean(reraDoc),
            hasAadhaarDoc: Boolean(aadhaarDoc),
            hasPhotoDoc: Boolean(photoDoc),
            avatar: photoDoc || u.avatar || '',
            listingsCount: u.listings || 0,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt
          };
        });

        setAgents(mapped);

        // Smart UX tab default:
        // If there's an agentId query param, open it
        if (highlightedAgentId) {
          const target = mapped.find((a) => a._id === highlightedAgentId);
          if (target) {
            setSelectedAgent(target);
            setActiveTab(target.verificationStatus === 'pending' ? 'pending' : 'all');
          }
        } else {
          // If pending agents exist, highlight pending; otherwise default to 'all'
          const pendingCount = mapped.filter((a) => a.verificationStatus === 'pending').length;
          if (pendingCount > 0) {
            setActiveTab('pending');
          } else {
            setActiveTab('all');
          }
        }
      } else {
        showToast(data?.message || 'Failed to fetch agent records.', 'error');
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
      showToast(err?.response?.data?.message || 'Network error while connecting to server.', 'error');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  // Update Agent Verification Status (Approve / Reject)
  const handleUpdateStatus = async (agent, newStatus, reason = '') => {
    setActionInProgress(true);
    try {
      const response = await API.patch(`/admin/users/${agent._id}/verify-agent`, {
        agentVerificationStatus: newStatus,
        status: newStatus,
        rejectReason: reason,
        agentRejectionReason: reason
      });

      const data = response.data;
      if (data?.status === 'success') {
        showToast(
          newStatus === 'approved'
            ? `Agent "${agent.name}" approved successfully.`
            : `Agent application declined.`,
          newStatus === 'approved' ? 'success' : 'info'
        );

        setRejectPrompt(null);
        setCustomReasonText('');
        setCustomReasonActive(false);

        await fetchAgents(true);

        if (selectedAgent && selectedAgent._id === agent._id) {
          setSelectedAgent((prev) => ({
            ...prev,
            verificationStatus: newStatus,
            isVerified: newStatus === 'approved',
            rejectionReason: newStatus === 'rejected' ? reason : ''
          }));
        }
      } else {
        showToast(data?.message || 'Failed to update agent status.', 'error');
      }
    } catch (err) {
      console.error('Error updating agent status:', err);
      showToast(err?.response?.data?.message || 'Network error while updating status.', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  // Distinct cities for filter dropdown
  const citiesList = useMemo(() => {
    const set = new Set();
    agents.forEach((a) => {
      if (a.cityOfOperation && a.cityOfOperation !== 'India') set.add(a.cityOfOperation);
    });
    return ['All', ...Array.from(set).sort()];
  }, [agents]);

  // Aggregate counts
  const counts = useMemo(() => {
    const total = agents.length;
    const pending = agents.filter((a) => a.verificationStatus === 'pending').length;
    const approved = agents.filter((a) => a.verificationStatus === 'approved' || a.isVerified).length;
    const rejected = agents.filter((a) => a.verificationStatus === 'rejected').length;
    return { total, pending, approved, rejected };
  }, [agents]);

  // Filtered list
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      if (activeTab === 'pending' && agent.verificationStatus !== 'pending') return false;
      if (activeTab === 'approved' && agent.verificationStatus !== 'approved' && !agent.isVerified) return false;
      if (activeTab === 'rejected' && agent.verificationStatus !== 'rejected') return false;

      if (cityFilter !== 'All' && agent.cityOfOperation !== cityFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = agent.name?.toLowerCase().includes(q);
        const matchPhone = agent.phone?.toLowerCase().includes(q);
        const matchEmail = agent.email?.toLowerCase().includes(q);
        const matchRera = agent.reraNumber?.toLowerCase().includes(q);
        const matchCity = agent.cityOfOperation?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail && !matchRera && !matchCity) return false;
      }

      return true;
    });
  }, [agents, activeTab, cityFilter, searchQuery]);

  // Navigation tab definitions (Linear/Stripe style)
  const tabs = [
    { id: 'all', label: 'All Agents', count: counts.total },
    { id: 'pending', label: 'Pending Review', count: counts.pending, alert: counts.pending > 0 },
    { id: 'approved', label: 'Verified', count: counts.approved },
    { id: 'rejected', label: 'Declined', count: counts.rejected },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-16 px-4 sm:px-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 py-2.5 px-4 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-medium border bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border)] animate-slide-down">
          {toast.type === 'success' && <CheckCircle size={15} className="text-emerald-500 shrink-0" />}
          {toast.type === 'error' && <AlertTriangle size={15} className="text-rose-500 shrink-0" />}
          {toast.type === 'info' && <Info size={15} className="text-sky-500 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* MINIMAL HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 pb-1">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-[var(--text-primary)] tracking-tight">
            Agent Verification
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Audit submitted RERA certificates, verify broker credentials, and manage authorizations.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fetchAgents()}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-brand' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* CLEAN UNDERLINE TABS BAR */}
      <div className="flex items-center gap-1 border-b border-[var(--border)] overflow-x-auto no-scrollbar pt-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2.5 px-3.5 text-xs font-medium transition-all whitespace-nowrap relative cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'text-[var(--text-primary)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? 'bg-[var(--text-primary)] text-[var(--bg-surface)] font-semibold'
                    : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
                }`}
              >
                {tab.count}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* FILTER & SEARCH ROW */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-0.5">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute top-2.5 left-3 text-[var(--text-muted)]" size={14} />
          <input
            type="text"
            placeholder="Search by agent name, phone, RERA or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-brand placeholder:text-[var(--text-muted)] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute top-2 right-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* City Filter */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded-lg focus:outline-none cursor-pointer font-medium"
          >
            {citiesList.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Cities' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CONTENT AREA: TABLE VIEW ONLY */}
      {isLoading ? (
        <AdminLoader
          card
          text="Loading agent directory..."
          subtext="Fetching registered real estate agents and RERA licenses"
          minHeight="min-h-[260px]"
        />
      ) : filteredAgents.length === 0 ? (
        <div className="py-16 text-center border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] px-4">
          <div className="w-10 h-10 rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)] flex items-center justify-center mx-auto mb-2.5">
            <UserCheck size={18} />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            No agents found
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
            {activeTab === 'pending'
              ? 'No pending verification requests at this moment.'
              : searchQuery || cityFilter !== 'All'
              ? 'No agent records match your search criteria.'
              : 'No agent records in this category.'}
          </p>
          {(activeTab !== 'all' || searchQuery || cityFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('all');
                setSearchQuery('');
                setCityFilter('All');
              }}
              className="mt-3 px-3 py-1.5 text-xs font-medium text-brand hover:underline cursor-pointer"
            >
              View all agents
            </button>
          )}
        </div>
      ) : (
        /* CLEAN TABLE VIEW */
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-muted)]/50 text-[var(--text-muted)] font-medium text-[11px]">
                  <th className="py-2.5 px-3.5">Agent</th>
                  <th className="py-2.5 px-3.5">RERA Number</th>
                  <th className="py-2.5 px-3.5">City / Experience</th>
                  <th className="py-2.5 px-3.5">Submitted Docs</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredAgents.map((agent) => (
                  <tr
                    key={agent._id}
                    onClick={() => setSelectedAgent(agent)}
                    className="hover:bg-[var(--bg-muted)]/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center font-bold text-xs text-[var(--text-primary)] shrink-0 overflow-hidden">
                          {agent.avatar ? (
                            <img src={agent.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span>{agent.name.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-[var(--text-primary)] truncate group-hover:text-brand transition-colors">
                            {agent.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] font-mono">
                            <span>{agent.phone}</span>
                            {agent.phone && agent.phone !== 'N/A' && (
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => setCallTarget(agent)}
                                  className="hover:text-emerald-500 cursor-pointer"
                                  title="Call"
                                >
                                  <Phone size={10} />
                                </button>
                                <a
                                  href={`https://wa.me/${agent.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hover:text-emerald-500"
                                  title="WhatsApp"
                                >
                                  <MessageCircle size={10} />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--bg-muted)]/60 border border-[var(--border)] font-mono text-xs text-[var(--text-primary)]">
                        <span>{agent.reraNumber}</span>
                        {agent.reraNumber && agent.reraNumber !== 'Not provided' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(agent.reraNumber, 'RERA Number');
                            }}
                            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                            title="Copy RERA number"
                          >
                            <Copy size={11} />
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 text-[var(--text-muted)]">
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin size={11} className="text-zinc-400" />
                        <span className="text-[var(--text-primary)] font-medium">{agent.cityOfOperation}</span>
                        <span>•</span>
                        <span>{agent.experience}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span
                          onClick={() => {
                            if (agent.hasReraDoc) {
                              setLightboxDoc({
                                url: agent.verificationDocs.reraCertificate,
                                title: `RERA Certificate - ${agent.name}`,
                                type: 'rera'
                              });
                            }
                          }}
                          className={`px-1.5 py-0.5 rounded border inline-flex items-center gap-0.5 ${
                            agent.hasReraDoc
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 cursor-pointer hover:bg-purple-500/20'
                              : 'bg-zinc-500/5 text-zinc-400 border-zinc-500/10'
                          }`}
                        >
                          <FileText size={9} />
                          <span>RERA</span>
                          <span>{agent.hasReraDoc ? '✓' : '—'}</span>
                        </span>

                        <span
                          onClick={() => {
                            if (agent.hasAadhaarDoc) {
                              setLightboxDoc({
                                url: agent.verificationDocs.aadhaarCard,
                                title: `Aadhaar ID - ${agent.name}`,
                                type: 'aadhaar'
                              });
                            }
                          }}
                          className={`px-1.5 py-0.5 rounded border inline-flex items-center gap-0.5 ${
                            agent.hasAadhaarDoc
                              ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 cursor-pointer hover:bg-sky-500/20'
                              : 'bg-zinc-500/5 text-zinc-400 border-zinc-500/10'
                          }`}
                        >
                          <FileText size={9} />
                          <span>Aadhaar</span>
                          <span>{agent.hasAadhaarDoc ? '✓' : '—'}</span>
                        </span>

                        <span
                          onClick={() => {
                            if (agent.hasPhotoDoc) {
                              setLightboxDoc({
                                url: agent.verificationDocs.profilePhoto,
                                title: `Profile Photo - ${agent.name}`,
                                type: 'photo'
                              });
                            }
                          }}
                          className={`px-1.5 py-0.5 rounded border inline-flex items-center gap-0.5 ${
                            agent.hasPhotoDoc
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20'
                              : 'bg-zinc-500/5 text-zinc-400 border-zinc-500/10'
                          }`}
                        >
                          <Eye size={9} />
                          <span>Photo</span>
                          <span>{agent.hasPhotoDoc ? '✓' : '—'}</span>
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded border inline-block ${
                          agent.verificationStatus === 'approved' || agent.isVerified
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : agent.verificationStatus === 'pending'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : agent.verificationStatus === 'rejected'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                        }`}
                      >
                        {agent.verificationStatus === 'approved' || agent.isVerified
                          ? 'Verified'
                          : agent.verificationStatus === 'pending'
                          ? 'Pending'
                          : agent.verificationStatus === 'rejected'
                          ? 'Declined'
                          : 'Unverified'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {agent.verificationStatus === 'pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(agent, 'approved')}
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectPrompt(agent)}
                              className="px-2 py-1 rounded border border-[var(--border)] text-rose-500 hover:bg-rose-500/10 text-[11px] font-medium cursor-pointer"
                            >
                              Decline
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedAgent(agent)}
                            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                            title="View Details"
                          >
                            <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SLIDE-OVER DETAIL INSPECTOR DRAWER */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
            onClick={() => setSelectedAgent(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
            <div className="w-screen max-w-md bg-[var(--bg-surface)] border-l border-[var(--border)] shadow-2xl flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center font-bold text-xs text-[var(--text-primary)] shrink-0 overflow-hidden">
                    {selectedAgent.avatar ? (
                      <img src={selectedAgent.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{selectedAgent.name.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-[var(--text-primary)] truncate">
                      {selectedAgent.name}
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono">{selectedAgent.id}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedAgent(null)}
                  className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] rounded-lg transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {/* Decision Banner if Pending */}
                {selectedAgent.verificationStatus === 'pending' && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-semibold text-xs">
                      <Clock size={13} />
                      <span>Pending Verification Review</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      Please inspect the submitted RERA license and identity documents below before verifying the broker.
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedAgent, 'approved')}
                        disabled={actionInProgress}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Check size={12} />
                        <span>Verify Agent</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectPrompt(selectedAgent)}
                        disabled={actionInProgress}
                        className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <X size={12} />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Status line if approved/rejected */}
                {selectedAgent.verificationStatus === 'approved' && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5 font-medium">
                      <ShieldCheck size={14} />
                      <span>Verified & Authorized Broker</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setRejectPrompt(selectedAgent)}
                      className="text-[11px] font-medium text-rose-500 hover:underline cursor-pointer"
                    >
                      Revoke
                    </button>
                  </div>
                )}

                {selectedAgent.verificationStatus === 'rejected' && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1.5 text-xs text-rose-700 dark:text-rose-300">
                    <span className="flex items-center gap-1.5 font-medium">
                      <ShieldAlert size={14} />
                      <span>Application Declined</span>
                    </span>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Reason: {selectedAgent.rejectionReason || 'Documents incomplete or mismatched.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedAgent, 'approved')}
                      className="mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Re-approve broker
                    </button>
                  </div>
                )}

                {/* RERA Information */}
                <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      RERA Credentials
                    </span>
                    <a
                      href="https://up-rera.in"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-medium text-brand hover:underline flex items-center gap-1"
                    >
                      <span>State Registry</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>

                  <div className="p-2.5 bg-[var(--bg-muted)]/70 rounded-lg border border-[var(--border)] flex items-center justify-between gap-2 font-mono text-xs">
                    <span className="font-semibold text-[var(--text-primary)] truncate">
                      {selectedAgent.reraNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedAgent.reraNumber, 'RERA Number')}
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                      title="Copy"
                    >
                      <Copy size={12} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--text-muted)] pt-1">
                    <div>
                      <span>City: </span>
                      <span className="font-medium text-[var(--text-primary)]">{selectedAgent.cityOfOperation}</span>
                    </div>
                    <div>
                      <span>Experience: </span>
                      <span className="font-medium text-[var(--text-primary)]">{selectedAgent.experience}</span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-2 text-xs">
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                    Contact Details
                  </span>

                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)] text-[11px]">Phone:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-medium text-[var(--text-primary)]">{selectedAgent.phone}</span>
                      <button
                        type="button"
                        onClick={() => setCallTarget(selectedAgent)}
                        className="p-1 text-[var(--text-muted)] hover:text-emerald-500 cursor-pointer"
                        title="Call"
                      >
                        <Phone size={12} />
                      </button>
                      <a
                        href={`https://wa.me/${selectedAgent.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-[var(--text-muted)] hover:text-emerald-500"
                      >
                        <MessageCircle size={12} />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)] text-[11px]">Email:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-[var(--text-primary)] truncate max-w-[200px]">{selectedAgent.email}</span>
                      <a href={`mailto:${selectedAgent.email}`} className="p-1 text-[var(--text-muted)] hover:text-brand">
                        <Mail size={12} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Submitted Documents Inspection */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                    Submitted Documents
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Doc 1: RERA Certificate */}
                    <div
                      onClick={() => {
                        if (selectedAgent.hasReraDoc) {
                          setLightboxDoc({
                            url: selectedAgent.verificationDocs.reraCertificate,
                            title: `RERA Certificate - ${selectedAgent.name}`,
                            type: 'rera'
                          });
                        }
                      }}
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        selectedAgent.hasReraDoc
                          ? 'border-purple-500/30 bg-purple-500/[0.03] hover:border-purple-500 cursor-pointer'
                          : 'border-dashed border-[var(--border)] opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="aspect-square rounded bg-[var(--bg-muted)] mb-1.5 flex items-center justify-center overflow-hidden">
                        {selectedAgent.hasReraDoc ? (
                          <img
                            src={selectedAgent.verificationDocs.reraCertificate}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <FileText size={16} className="text-zinc-400" />
                        )}
                      </div>
                      <span className="text-[10px] font-medium block truncate text-[var(--text-primary)]">
                        RERA Cert
                      </span>
                      <span className="text-[9px] text-[var(--text-muted)] block">
                        {selectedAgent.hasReraDoc ? 'Click to inspect' : 'Missing'}
                      </span>
                    </div>

                    {/* Doc 2: Aadhaar ID */}
                    <div
                      onClick={() => {
                        if (selectedAgent.hasAadhaarDoc) {
                          setLightboxDoc({
                            url: selectedAgent.verificationDocs.aadhaarCard,
                            title: `Identity / Aadhaar - ${selectedAgent.name}`,
                            type: 'aadhaar'
                          });
                        }
                      }}
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        selectedAgent.hasAadhaarDoc
                          ? 'border-sky-500/30 bg-sky-500/[0.03] hover:border-sky-500 cursor-pointer'
                          : 'border-dashed border-[var(--border)] opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="aspect-square rounded bg-[var(--bg-muted)] mb-1.5 flex items-center justify-center overflow-hidden">
                        {selectedAgent.hasAadhaarDoc ? (
                          <img
                            src={selectedAgent.verificationDocs.aadhaarCard}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <FileText size={16} className="text-zinc-400" />
                        )}
                      </div>
                      <span className="text-[10px] font-medium block truncate text-[var(--text-primary)]">
                        Aadhaar ID
                      </span>
                      <span className="text-[9px] text-[var(--text-muted)] block">
                        {selectedAgent.hasAadhaarDoc ? 'Click to inspect' : 'Missing'}
                      </span>
                    </div>

                    {/* Doc 3: Profile Photo */}
                    <div
                      onClick={() => {
                        if (selectedAgent.hasPhotoDoc) {
                          setLightboxDoc({
                            url: selectedAgent.verificationDocs.profilePhoto,
                            title: `Profile Photo - ${selectedAgent.name}`,
                            type: 'photo'
                          });
                        }
                      }}
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        selectedAgent.hasPhotoDoc
                          ? 'border-emerald-500/30 bg-emerald-500/[0.03] hover:border-emerald-500 cursor-pointer'
                          : 'border-dashed border-[var(--border)] opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="aspect-square rounded bg-[var(--bg-muted)] mb-1.5 flex items-center justify-center overflow-hidden">
                        {selectedAgent.hasPhotoDoc ? (
                          <img
                            src={selectedAgent.verificationDocs.profilePhoto}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Eye size={16} className="text-zinc-400" />
                        )}
                      </div>
                      <span className="text-[10px] font-medium block truncate text-[var(--text-primary)]">
                        Portrait Photo
                      </span>
                      <span className="text-[9px] text-[var(--text-muted)] block">
                        {selectedAgent.hasPhotoDoc ? 'Click to inspect' : 'Missing'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Footer Action */}
              <div className="p-3.5 border-t border-[var(--border)] bg-[var(--bg-surface)] shrink-0 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAgent(null)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-medium cursor-pointer"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  {selectedAgent.verificationStatus !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedAgent, 'approved')}
                      disabled={actionInProgress}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Check size={13} />
                      <span>Approve Agent</span>
                    </button>
                  )}
                  {selectedAgent.verificationStatus !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => setRejectPrompt(selectedAgent)}
                      disabled={actionInProgress}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <X size={13} />
                      <span>Decline</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION MODAL */}
      {rejectPrompt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="w-full max-w-md rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xl p-5 space-y-3.5 animate-slide-down">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <h3 className="font-semibold text-sm text-[var(--text-primary)]">
                Decline Agent Verification
              </h3>
              <button
                type="button"
                onClick={() => setRejectPrompt(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={15} />
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              Select reason to decline <strong className="text-[var(--text-primary)]">{rejectPrompt.name}</strong>. This feedback is sent directly to their notification inbox.
            </p>

            <div className="space-y-1.5">
              {[
                'RERA License documents could not be verified in the state registry',
                'Uploaded RERA certificate is blurry or illegible',
                'Aadhaar / ID name does not match applicant registration name',
                'Incomplete document packet submitted',
              ].map((reason) => (
                <label
                  key={reason}
                  className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer text-xs transition-colors ${
                    !customReasonActive && rejectReason === reason
                      ? 'border-brand/40 bg-brand/[0.03] text-[var(--text-primary)] font-medium'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                  onClick={() => {
                    setCustomReasonActive(false);
                    setRejectReason(reason);
                  }}
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={!customReasonActive && rejectReason === reason}
                    onChange={() => {}}
                    className="mt-0.5 accent-brand"
                  />
                  <span>{reason}</span>
                </label>
              ))}

              <label
                className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer text-xs transition-colors ${
                  customReasonActive
                    ? 'border-brand/40 bg-brand/[0.03] text-[var(--text-primary)] font-medium'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                onClick={() => setCustomReasonActive(true)}
              >
                <input
                  type="radio"
                  name="reason"
                  checked={customReasonActive}
                  onChange={() => {}}
                  className="mt-0.5 accent-brand"
                />
                <span>Custom Specific Note</span>
              </label>

              {customReasonActive && (
                <textarea
                  rows={2}
                  value={customReasonText}
                  onChange={(e) => setCustomReasonText(e.target.value)}
                  placeholder="Type specific missing details or feedback..."
                  className="w-full p-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-brand"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setRejectPrompt(null)}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const finalReason = customReasonActive
                    ? customReasonText.trim() || 'Verification documents declined by administrator'
                    : rejectReason;
                  handleUpdateStatus(rejectPrompt, 'rejected', finalReason);
                }}
                disabled={actionInProgress}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium cursor-pointer"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {lightboxDoc && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-slide-down">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-[var(--border)] bg-[var(--bg-muted)]/70">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={14} className="text-brand shrink-0" />
                <h4 className="font-semibold text-xs text-[var(--text-primary)] truncate max-w-sm">
                  {lightboxDoc.title}
                </h4>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  title="Zoom Out"
                >
                  <ZoomOut size={13} />
                </button>
                <span className="text-[10px] font-mono px-1 text-[var(--text-muted)]">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  title="Zoom In"
                >
                  <ZoomIn size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] ml-1"
                  title="Rotate"
                >
                  <RotateCw size={13} />
                </button>
                <a
                  href={lightboxDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded text-[var(--text-muted)] hover:text-brand ml-1"
                  title="Open original"
                >
                  <ExternalLink size={13} />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setLightboxDoc(null);
                    setZoomLevel(1);
                    setRotation(0);
                  }}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-rose-500 ml-1.5"
                  title="Close"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Preview Canvas */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-zinc-950/20 min-h-[300px]">
              {lightboxDoc.url?.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={lightboxDoc.url}
                  title="Document Preview"
                  className="w-full h-[60vh] rounded border border-[var(--border)]"
                />
              ) : (
                <img
                  src={lightboxDoc.url}
                  alt="Document preview"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    transition: 'transform 0.15s ease-out',
                    maxHeight: '65vh',
                    objectFit: 'contain'
                  }}
                  className="rounded shadow-sm"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML =
                      '<div class="text-center p-6 text-xs text-zinc-400">Preview not available directly. <a href="' +
                      lightboxDoc.url +
                      '" target="_blank" class="text-brand underline block mt-1">Open original file</a></div>';
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
      {/* ─── MODAL: CALL & CONTACT AGENT (CUSTOM UI) ─── */}
      {callTarget && (
        <CallContactModal
          isOpen={Boolean(callTarget)}
          onClose={() => setCallTarget(null)}
          contact={{
            clientName: callTarget.name || callTarget.agencyName,
            clientPhone: callTarget.phone,
            clientEmail: callTarget.email,
            title: callTarget.agencyName || 'Registered Agent',
            code: callTarget.code || callTarget.id || callTarget._id,
            category: 'Broker / Agent Profile',
            status: callTarget.status
          }}
        />
      )}
    </div>
  );
};

export default AgentManagement;
