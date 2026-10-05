import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Save,
  Info,
  Building2,
  Mail,
  Phone,
  MapPin,
  Hash,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Eye,
  Edit3,
  ExternalLink,
  Globe,
  ShieldCheck,
  TrendingUp,
  Check,
  Copy,
  Plus,
  X,
  Target,
  Compass,
  Monitor,
  Smartphone,
  Tablet,
  CheckCheck,
  Layers
} from 'lucide-react';
import API from '../api/api';

const DEFAULT_ABOUT_DATA = {
  platformName: 'GHARMB SaaS',
  tagline: 'Modern Real-Estate Technology Platform & RERA Verification Hub',
  version: '2.4.1',
  releaseTag: 'Production Stable',
  supportEmail: 'support@gharmb.in',
  helpline: '+91 98765 43210',
  headquarters: 'Cyber City, DLF Phase 2, Gurugram, India',
  reraRegistration: 'HRERA-PKL-GGM-1240-2024',
  websiteUrl: 'https://gharmb.com/about',
  headline: 'Making real estate simpler, verified, and more trustworthy.',
  description:
    'GHARMB is a comprehensive SaaS platform designed to streamline real estate operations. It provides tools for property verification, builder RERA tracking, user directory management, and revenue analytics all in one centralized dashboard.\n\nOur mission is to bring transparency and efficiency to the real estate ecosystem by automating compliance checks and providing actionable insights for administrators.',
  mission:
    'To bring 100% transparency and verified trust to the real estate ecosystem by automating compliance checks and empowering stakeholders with actionable property insights.',
  vision:
    'To build India\'s most trusted, unified real estate digital operating system for property buyers, builders, and licensed brokers.',
  values: [
    '100% RERA Verified',
    'Lead & Contact Privacy',
    'Zero Broker Fraud',
    'Direct Developer Rates',
    'Smart Token Escrow',
    '24/7 Dedicated Support'
  ],
  metrics: {
    verifiedProperties: '12,500+',
    registeredBuilders: '850+',
    activeCities: '24+',
    trustScore: '99.4%'
  },
  status: 'published',
  lastUpdated: new Date().toISOString()
};

const TEMPLATE_PRESETS = [
  {
    id: 'proptech',
    label: 'PropTech & Compliance SaaS',
    tagline: 'Unified Real Estate Operating System & RERA Verification Hub',
    headline: 'Making real estate simpler, verified, and transparent.',
    description:
      'GHARMB is a comprehensive SaaS platform designed to streamline real estate operations. It provides tools for property verification, builder RERA tracking, user directory management, and revenue analytics all in one centralized dashboard.\n\nOur mission is to bring transparency and efficiency to the real estate ecosystem by automating compliance checks and providing actionable insights for administrators.',
    mission:
      'To bring 100% transparency and verified trust to the real estate ecosystem by automating compliance checks and empowering stakeholders with actionable property insights.',
    vision:
      'To build India\'s most trusted, unified real estate digital operating system for buyers, developers, and brokers.'
  },
  {
    id: 'consumer',
    label: 'Trust & Buyer Protection',
    tagline: 'India\'s Direct Developer & Verified Property Marketplace',
    headline: 'Finding your dream home without the broker maze and hidden fees.',
    description:
      'Finding a home should never feel like navigating a maze of unverified listings, unreliable middlemen, and opaque pricing. GharMB is built to bring certainty to property buying.\n\nEvery listing on GharMB undergoes strict government RERA validation and physical document verification before it goes live, ensuring complete peace of mind for every family.',
    mission:
      'To eliminate real estate fraud and empower homebuyers with transparent data, direct developer access, and verified documentation.',
    vision:
      'To become the benchmark for honest, stress-free property transactions across India.'
  },
  {
    id: 'enterprise',
    label: 'Enterprise Developer Network',
    tagline: 'Next-Gen PropTech Ecosystem for Builders, Brokers & Investors',
    headline: 'Digital infrastructure powering modern real estate transactions.',
    description:
      'GharMB bridges the gap between premium real estate developers, institutional investors, and licensed channel partners through automated inventory management and digital escrow workflows.\n\nFrom high-rise commercial townships to residential luxury developments, our digital pipeline accelerates property lifecycle sales and investor confidence.',
    mission:
      'To power frictionless commercial and residential transactions with modern fintech and legal compliance tooling.',
    vision:
      'To connect 100,000+ certified developers and property advisors on a unified digital ledger.'
  }
];

const AboutSettings = () => {
  // Main form state
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('gharmb_about');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_ABOUT_DATA,
          ...parsed,
          metrics: { ...DEFAULT_ABOUT_DATA.metrics, ...(parsed.metrics || {}) },
          values: Array.isArray(parsed.values) && parsed.values.length > 0 ? parsed.values : DEFAULT_ABOUT_DATA.values
        };
      } catch (err) {
        console.error('Error parsing gharmb_about:', err);
      }
    }
    return DEFAULT_ABOUT_DATA;
  });

  // Saved baseline to detect unsaved edits
  const [savedData, setSavedData] = useState(() => formData);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState('editor'); // 'editor' | 'preview'
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [newValueInput, setNewValueInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Check if form has unsaved modifications
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(savedData);
  }, [formData, savedData]);

  // Trigger Toast Notification
  const showToastNotification = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    const timer = setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  // Fetch initial content from backend API if available
  useEffect(() => {
    let isMounted = true;
    const fetchRemoteData = async () => {
      try {
        const response = await API.get('/admin/pages/about-us');
        if (response.data?.success && response.data?.data?.pageContent && isMounted) {
          const remote = response.data.data.pageContent;
          setFormData((prev) => {
            const updated = {
              ...prev,
              platformName: remote.title || prev.platformName,
              description: remote.content || prev.description,
              lastUpdated: remote.updatedAt || prev.lastUpdated
            };
            setSavedData(updated);
            return updated;
          });
        }
      } catch {
        // Fallback silently to localStorage if API route is not yet populated or offline
      }
    };
    fetchRemoteData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const updatedData = {
      ...formData,
      lastUpdated: new Date().toISOString()
    };

    // 1. Write to local storage
    localStorage.setItem('gharmb_about', JSON.stringify(updatedData));

    // 2. Attempt sync with backend API
    try {
      await API.put('/admin/pages/about-us', {
        title: updatedData.platformName,
        content: updatedData.description
      });
    } catch {
      // Quietly ignore backend error if running offline/mock mode; local data is preserved
    }

    setTimeout(() => {
      setIsSaving(false);
      setSavedData(updatedData);
      setFormData(updatedData);
      showToastNotification('About page configurations saved successfully!', 'success');
    }, 450);
  }, [formData, showToastNotification]);

  // Keyboard shortcut: Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMetricChange = (metricKey, value) => {
    setFormData((prev) => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        [metricKey]: value
      }
    }));
  };

  const handleAddValue = (e) => {
    e?.preventDefault();
    const trimmed = newValueInput.trim();
    if (!trimmed) return;
    if (formData.values.includes(trimmed)) {
      showToastNotification('This pillar is already added.', 'info');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      values: [...prev.values, trimmed]
    }));
    setNewValueInput('');
  };

  const handleRemoveValue = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      values: prev.values.filter((v) => v !== tagToRemove)
    }));
  };

  const handleApplyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      tagline: preset.tagline,
      headline: preset.headline,
      description: preset.description,
      mission: preset.mission,
      vision: preset.vision
    }));
    showToastNotification(`Applied "${preset.label}" template.`, 'success');
  };

  const handleReset = () => {
    setFormData(savedData);
    showToastNotification('Reverted changes to last saved state.', 'info');
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.origin + '/about');
    setCopiedLink(true);
    showToastNotification('Public About page link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Word and character count computation
  const wordCount = useMemo(() => {
    const text = (formData.description || '').trim();
    return text ? text.split(/\s+/).filter(Boolean).length : 0;
  }, [formData.description]);

  const charCount = (formData.description || '').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[var(--bg-surface)] text-[var(--text-primary)] border border-brand/30 rounded-2xl shadow-xl shadow-brand/10 animate-slide-down">
          <div className="w-7 h-7 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <Info size={16} />}
          </div>
          <div className="text-xs font-medium pr-2">
            <p className="font-bold text-[var(--text-primary)]">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast({ show: false, message: '', type: 'success' })}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Top Header Section: Clean, Minimalist & Aligned ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Breadcrumb Context Pill */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">
              Platform Configuration
            </span>
            <span className="text-[var(--text-muted)]/40 text-xs">•</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
              About & Brand Identity
            </span>
            {hasUnsavedChanges && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Unsaved Edits
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            Edit About Page
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xl">
            Manage platform details, verified metrics, and brand narrative visible to users and clients.
          </p>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[var(--bg-muted)] p-1 rounded-xl border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'editor'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Edit3 size={13} />
              <span>Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Eye size={13} />
              <span>Live Preview</span>
            </button>
          </div>

          {/* Reset / Revert Button */}
          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] border border-[var(--border)] transition-all cursor-pointer"
              title="Discard unsaved changes"
            >
              <RotateCcw size={13} />
              <span>Discard</span>
            </button>
          )}

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md shadow-brand/20 transition-all disabled:opacity-70 cursor-pointer"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save Changes</span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/20 text-white/90">
                  Ctrl+S
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Status & Publication Bar ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl px-5 py-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="font-bold text-[var(--text-primary)] text-xs">
              Live & Publicly Visible
            </span>
          </div>
          <span className="text-[var(--text-muted)]/40 hidden sm:inline">•</span>
          <span className="text-[var(--text-muted)] text-[11px] hidden sm:inline">
            Version <span className="font-semibold text-[var(--text-primary)]">{formData.version}</span> ({formData.releaseTag})
          </span>
          <span className="text-[var(--text-muted)]/40 hidden md:inline">•</span>
          <span className="text-[var(--text-muted)] text-[11px] hidden md:inline">
            Last updated:{' '}
            <span className="font-medium text-[var(--text-subtle)]">
              {new Date(formData.lastUpdated).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-[var(--text-muted)] hover:text-brand bg-[var(--bg-muted)] hover:bg-brand/10 rounded-lg transition-colors cursor-pointer"
            title="Copy public URL"
          >
            {copiedLink ? <CheckCheck size={12} className="text-emerald-500" /> : <Copy size={12} />}
            <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
          </button>
          <a
            href="/about"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-[var(--text-muted)] hover:text-brand bg-[var(--bg-muted)] hover:bg-brand/10 rounded-lg transition-colors"
          >
            <span>Visit Page</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* ── MAIN VIEW: EDITOR MODE ── */}
      {viewMode === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ══════════════════════════════════════════════════════════════════
              LEFT COLUMN: Core Identity, Contact & Impact Stats (4 Cols)
          ══════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-6">
            {/* CARD 1: Core Platform Identity */}
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Platform Identity</h3>
                    <p className="text-[11px] text-[var(--text-muted)]">Core branding and version identification</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Active
                </span>
              </div>

              <div className="space-y-3.5">
                {/* Platform Name */}
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider mb-1.5">
                    Platform Name
                  </label>
                  <div className="relative flex items-center">
                    <Building2 className="absolute left-3 text-[var(--text-muted)] pointer-events-none" size={14} />
                    <input
                      type="text"
                      name="platformName"
                      value={formData.platformName}
                      onChange={handleChange}
                      placeholder="e.g. GHARMB SaaS"
                      className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Tagline / Subtitle */}
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider mb-1.5">
                    Brand Tagline
                  </label>
                  <div className="relative flex items-center">
                    <Sparkles className="absolute left-3 text-[var(--text-muted)] pointer-events-none" size={14} />
                    <input
                      type="text"
                      name="tagline"
                      value={formData.tagline}
                      onChange={handleChange}
                      placeholder="Platform motto or short description..."
                      className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Version & Release Tag */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider mb-1.5">
                      Current Version
                    </label>
                    <div className="relative flex items-center">
                      <Hash className="absolute left-3 text-[var(--text-muted)] pointer-events-none" size={14} />
                      <input
                        type="text"
                        name="version"
                        value={formData.version}
                        onChange={handleChange}
                        placeholder="2.4.1"
                        className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all shadow-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider mb-1.5">
                      Release Tag
                    </label>
                    <div className="relative flex items-center">
                      <Layers className="absolute left-3 text-[var(--text-muted)] pointer-events-none" size={14} />
                      <input
                        type="text"
                        name="releaseTag"
                        value={formData.releaseTag}
                        onChange={handleChange}
                        placeholder="Production Stable"
                        className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Support Email */}
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider mb-1.5">
                    Official Support Email
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3 text-[var(--text-muted)] pointer-events-none" size={14} />
                    <input
                      type="email"
                      name="supportEmail"
                      value={formData.supportEmail}
                      onChange={handleChange}
                      placeholder="support@gharmb.in"
                      className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Helpline & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider mb-1.5">
                      Support Helpline
                    </label>
                    <div className="relative flex items-center">
                      <Phone className="absolute left-3 text-[var(--text-muted)] pointer-events-none" size={14} />
                      <input
                        type="text"
                        name="helpline"
                        value={formData.helpline}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all shadow-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider mb-1.5">
                      Headquarters
                    </label>
                    <div className="relative flex items-center">
                      <MapPin className="absolute left-3 text-[var(--text-muted)] pointer-events-none" size={14} />
                      <input
                        type="text"
                        name="headquarters"
                        value={formData.headquarters}
                        onChange={handleChange}
                        placeholder="Gurugram, India"
                        className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* RERA Authority License */}
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider mb-1.5">
                    Government RERA Registration Authority ID
                  </label>
                  <div className="relative flex items-center">
                    <ShieldCheck className="absolute left-3 text-[var(--text-muted)] pointer-events-none" size={14} />
                    <input
                      type="text"
                      name="reraRegistration"
                      value={formData.reraRegistration || ''}
                      onChange={handleChange}
                      placeholder="HRERA-PKL-GGM-1240-2024"
                      className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all shadow-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: Verified Impact Metrics (Public Stat Counters) */}
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Public Impact Metrics</h3>
                    <p className="text-[11px] text-[var(--text-muted)]">Displayed on public About hero & trust badges</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[var(--bg-muted)]/50 border border-[var(--border)] rounded-xl">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Verified Properties
                  </span>
                  <input
                    type="text"
                    value={formData.metrics.verifiedProperties}
                    onChange={(e) => handleMetricChange('verifiedProperties', e.target.value)}
                    className="w-full py-1 text-sm font-bold text-[var(--text-primary)] bg-transparent border-b border-dashed border-[var(--border)] focus:border-brand focus:outline-none"
                    placeholder="12,500+"
                  />
                </div>

                <div className="p-3 bg-[var(--bg-muted)]/50 border border-[var(--border)] rounded-xl">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    RERA Builders
                  </span>
                  <input
                    type="text"
                    value={formData.metrics.registeredBuilders}
                    onChange={(e) => handleMetricChange('registeredBuilders', e.target.value)}
                    className="w-full py-1 text-sm font-bold text-[var(--text-primary)] bg-transparent border-b border-dashed border-[var(--border)] focus:border-brand focus:outline-none"
                    placeholder="850+"
                  />
                </div>

                <div className="p-3 bg-[var(--bg-muted)]/50 border border-[var(--border)] rounded-xl">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Active Metro Cities
                  </span>
                  <input
                    type="text"
                    value={formData.metrics.activeCities}
                    onChange={(e) => handleMetricChange('activeCities', e.target.value)}
                    className="w-full py-1 text-sm font-bold text-[var(--text-primary)] bg-transparent border-b border-dashed border-[var(--border)] focus:border-brand focus:outline-none"
                    placeholder="24+"
                  />
                </div>

                <div className="p-3 bg-[var(--bg-muted)]/50 border border-[var(--border)] rounded-xl">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Trust Rating
                  </span>
                  <input
                    type="text"
                    value={formData.metrics.trustScore}
                    onChange={(e) => handleMetricChange('trustScore', e.target.value)}
                    className="w-full py-1 text-sm font-bold text-[var(--text-primary)] bg-transparent border-b border-dashed border-[var(--border)] focus:border-brand focus:outline-none"
                    placeholder="99.4%"
                  />
                </div>
              </div>
            </div>

            {/* CARD 3: SEO Google Snippet Preview */}
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-brand" />
                <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  Google Search Snippet Preview
                </h4>
              </div>
              <div className="p-3.5 bg-[var(--bg-muted)]/40 rounded-xl border border-[var(--border)] space-y-1">
                <p className="text-[11px] text-[#1a0dab] dark:text-[#8ab4f8] font-medium truncate">
                  About {formData.platformName} - Real Estate SaaS & Property Hub
                </p>
                <p className="text-[10px] text-[#006621] dark:text-[#5bb974] truncate">
                  https://gharmb.com › about
                </p>
                <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                  {formData.description ? formData.description.slice(0, 140) + '...' : 'Explore GHARMB SaaS platform details.'}
                </p>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              RIGHT COLUMN: Narrative, Mission, Vision & Core Values (7 Cols)
          ══════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 space-y-6">
            {/* CARD 1: Brand Story & Narrative */}
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--border)] gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">About Us Narrative</h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    This content is displayed on the public 'About Us' section of the website.
                  </p>
                </div>

                {/* Templates & Word count bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border)]">
                    {wordCount} words · {charCount} chars
                  </span>
                </div>
              </div>

              {/* Quick Template Presets */}
              <div className="p-3 bg-[var(--bg-muted)]/50 rounded-xl border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <span className="text-[11px] font-bold text-[var(--text-subtle)] flex items-center gap-1.5 shrink-0">
                  <Sparkles size={13} className="text-brand" />
                  Quick Templates:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATE_PRESETS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleApplyPreset(t)}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-[var(--bg-surface)] hover:bg-brand/10 hover:text-brand text-[var(--text-subtle)] border border-[var(--border)] hover:border-brand/30 rounded-lg transition-all cursor-pointer"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Public Headline Input */}
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider mb-1.5">
                  Main Headline / Pitch
                </label>
                <input
                  type="text"
                  name="headline"
                  value={formData.headline}
                  onChange={handleChange}
                  placeholder="e.g. Making real estate simpler, verified, and more trustworthy."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm font-medium bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all shadow-xs"
                />
              </div>

              {/* Story Description Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider">
                    Full Platform Overview & Story
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, description: '' }))}
                    className="text-[10px] text-[var(--text-muted)] hover:text-red-500 transition-colors cursor-pointer"
                  >
                    Clear text
                  </button>
                </div>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={7}
                  className="w-full p-4 text-xs sm:text-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all leading-relaxed custom-scrollbar shadow-xs resize-y"
                  placeholder="Write the comprehensive platform story, compliance mission, and values here..."
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
                  Separate paragraphs with blank lines. Formats seamlessly on public web and mobile client views.
                </p>
              </div>
            </div>

            {/* CARD 2: Mission & Strategic Vision */}
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border)]">
                <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                  <Target size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Mission & Strategic Vision</h3>
                  <p className="text-[11px] text-[var(--text-muted)]">High-level institutional objectives for stakeholders</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Compass size={13} className="text-brand" />
                    <span>Company Mission</span>
                  </label>
                  <textarea
                    name="mission"
                    value={formData.mission}
                    onChange={handleChange}
                    rows={3}
                    placeholder="State the core mission of the platform..."
                    className="w-full p-3 text-xs sm:text-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all leading-relaxed shadow-xs resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Target size={13} className="text-brand" />
                    <span>Strategic Vision</span>
                  </label>
                  <textarea
                    name="vision"
                    value={formData.vision}
                    onChange={handleChange}
                    rows={3}
                    placeholder="State the long-term vision of the platform..."
                    className="w-full p-3 text-xs sm:text-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all leading-relaxed shadow-xs resize-none"
                  />
                </div>
              </div>
            </div>

            {/* CARD 3: Core Value Pillars (Interactive Tags) */}
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Core Value Pillars</h3>
                    <p className="text-[11px] text-[var(--text-muted)]">Guarantees and principles highlighted to buyers & builders</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  {formData.values.length} Pillars
                </span>
              </div>

              {/* Tag Pills List */}
              <div className="flex flex-wrap gap-2">
                {formData.values.map((val) => (
                  <span
                    key={val}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-muted)] text-[var(--text-primary)] text-xs font-semibold border border-[var(--border)] hover:border-brand/40 transition-colors group"
                  >
                    <Check size={12} className="text-brand shrink-0" />
                    <span>{val}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveValue(val)}
                      className="text-[var(--text-muted)] group-hover:text-red-500 rounded-full p-0.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      title="Remove pillar"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add New Tag Input */}
              <form onSubmit={handleAddValue} className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newValueInput}
                    onChange={(e) => setNewValueInput(e.target.value)}
                    placeholder="Add custom value pillar (e.g. AI Automated Valuation)..."
                    className="w-full px-3.5 py-2 text-xs bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all shadow-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newValueInput.trim()}
                  className="flex items-center gap-1 px-3.5 py-2 bg-[var(--bg-muted)] hover:bg-brand hover:text-white text-[var(--text-primary)] text-xs font-bold rounded-xl border border-[var(--border)] hover:border-brand transition-all disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <Plus size={13} />
                  <span>Add</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE PREVIEW MODE: Public Landing Section Simulation ── */}
      {viewMode === 'preview' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Device Viewport Selector */}
          <div className="flex items-center justify-between bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl px-5 py-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-brand" />
              <span className="text-xs font-bold text-[var(--text-primary)]">Public Web Preview</span>
              <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
                (Rendering how public users see the About platform)
              </span>
            </div>

            <div className="flex items-center bg-[var(--bg-muted)] p-1 rounded-xl border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  previewDevice === 'desktop'
                    ? 'bg-[var(--bg-surface)] text-brand shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title="Desktop View"
              >
                <Monitor size={14} />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('tablet')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  previewDevice === 'tablet'
                    ? 'bg-[var(--bg-surface)] text-brand shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title="Tablet View"
              >
                <Tablet size={14} />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  previewDevice === 'mobile'
                    ? 'bg-[var(--bg-surface)] text-brand shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title="Mobile View"
              >
                <Smartphone size={14} />
              </button>
            </div>
          </div>

          {/* Browser Mockup Wrapper */}
          <div
            className={`mx-auto transition-all duration-300 border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden bg-white text-slate-800 ${
              previewDevice === 'mobile'
                ? 'max-w-[390px]'
                : previewDevice === 'tablet'
                ? 'max-w-[768px]'
                : 'max-w-full'
            }`}
          >
            {/* Top Mock Window Bar */}
            <div className="bg-slate-100 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-slate-200 dark:border-zinc-700 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="px-4 py-0.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-[10px] font-mono text-slate-500">
                https://gharmb.com/about
              </div>
              <div className="w-10" />
            </div>

            {/* Public Page Simulated Canvas */}
            <div className="p-6 sm:p-10 lg:p-14 space-y-12 bg-gradient-to-b from-slate-50 to-white">
              {/* Hero */}
              <div className="max-w-3xl space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand/10 text-brand">
                  <Sparkles size={12} />
                  About {formData.platformName}
                </span>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {formData.headline || 'Making real estate simpler and more trustworthy.'}
                </h1>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
                  {formData.tagline}
                </p>
              </div>

              {/* 4 Impact Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <p className="text-2xl sm:text-3xl font-extrabold text-brand">
                    {formData.metrics.verifiedProperties}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Verified Properties</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {formData.metrics.registeredBuilders}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 mt-1">RERA Developers</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {formData.metrics.activeCities}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Metro Cities</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                    {formData.metrics.trustScore}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Trust Rating</p>
                </div>
              </div>

              {/* Story Narrative & Visual Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Our Story & Purpose</h2>
                  <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {formData.description}
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-slate-100">
                  <img
                    src="https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&h=500&fit=crop"
                    alt="Platform Headquarters"
                    className="w-full h-auto object-cover"
                  />
                  <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold">{formData.headquarters}</span>
                    <span className="font-bold text-brand">{formData.version}</span>
                  </div>
                </div>
              </div>

              {/* Mission & Vision Callout Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-2">
                    <Compass size={18} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Our Mission</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {formData.mission}
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-2">
                    <Target size={18} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Our Vision</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {formData.vision}
                  </p>
                </div>
              </div>

              {/* Core Values / Pillars */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">What We Stand For</h3>
                <div className="flex flex-wrap gap-2.5">
                  {formData.values.map((val) => (
                    <div
                      key={val}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 shadow-xs"
                    >
                      <ShieldCheck size={16} className="text-brand" />
                      <span>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Footer Strip */}
              <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white">Have questions or want to verify a project?</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Our compliance and customer success team is available 24/7.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={`mailto:${formData.supportEmail}`}
                    className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-bold transition-colors"
                  >
                    Email Support
                  </a>
                  <span className="text-xs font-mono text-slate-300">
                    {formData.helpline}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AboutSettings;