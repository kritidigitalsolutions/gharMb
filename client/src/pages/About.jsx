import { useState, useEffect, useCallback, useMemo } from 'react';
import AdminLoader from '../components/common/AdminLoader';
import {
  Save, RotateCcw, CheckCircle2, AlertTriangle, Loader2,
  Building2, Target, Eye, ShieldCheck, Mail, Phone,
  Globe, Sparkles, Columns2, PenLine, Monitor, Smartphone,
  Copy, Check, ExternalLink, Heart, Award
} from 'lucide-react';
import API from '../api/api';

const EMPTY_FORM = {
  title: '',
  content: '',
  tagline: '',
  mission: '',
  vision: '',
  supportEmail: '',
  helpline: '',
  headquarters: '',
  reraRegistration: '',
  websiteUrl: ''
};

export default function AboutSettings() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saved, setSaved] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('narrative'); // 'narrative' | 'mission' | 'legal' | 'support'
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'editor' | 'preview'
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile'
  const [copiedField, setCopiedField] = useState(null);

  // Toast feedback
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  }, []);

  // Fetch About Page Content
  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get('/admin/pages/about-us');
        if (res.data?.success && res.data?.data?.pageContent) {
          const pc = res.data.data.pageContent;
          const meta = pc.metadata || {};
          const loaded = {
            title: pc.title || 'About GharMB',
            content: pc.content || 'GharMB is a modern real-estate technology platform connecting home buyers, property owners, and certified agents through verified listings.',
            tagline: meta.tagline || 'Making real estate simpler and more trustworthy.',
            mission: meta.mission || 'To eliminate unverified listings and deliver a transparent property discovery ecosystem.',
            vision: meta.vision || 'To become India’s most trusted real-estate marketplace for buyers and developers.',
            supportEmail: meta.supportEmail || 'support@gharmb.com',
            helpline: meta.helpline || '+91 98765 43210',
            headquarters: meta.headquarters || 'Cyber City, Gurugram, Haryana, India',
            reraRegistration: meta.reraRegistration || 'HRERA-PKL-GGM-1240-2024',
            websiteUrl: meta.websiteUrl || 'https://gharmb.com'
          };
          setForm(loaded);
          setSaved(loaded);
        }
      } catch {
        // graceful fallback
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const hasChanges = useMemo(() => {
    return JSON.stringify(form) !== JSON.stringify(saved);
  }, [form, saved]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    showToast(`${fieldName} copied to clipboard!`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = useCallback(async () => {
    if (!form.title.trim()) { showToast('Page title is required.', 'error'); return; }
    if (!form.content.trim()) { showToast('Content description is required.', 'error'); return; }

    setIsSaving(true);
    try {
      await API.put('/admin/pages/about-us', {
        title: form.title.trim(),
        content: form.content.trim(),
        metadata: {
          tagline: form.tagline.trim(),
          mission: form.mission.trim(),
          vision: form.vision.trim(),
          supportEmail: form.supportEmail.trim(),
          helpline: form.helpline.trim(),
          headquarters: form.headquarters.trim(),
          reraRegistration: form.reraRegistration.trim(),
          websiteUrl: form.websiteUrl.trim()
        }
      });
      setSaved({ ...form });
      showToast('About platform identity & details saved live!', 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to save about details.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [form, showToast]);

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSave]);

  if (loading) {
    return (
      <AdminLoader
        card
        text="Loading About Us configuration..."
        subtext="Fetching platform mission, brand tagline, and RERA credentials"
        minHeight="min-h-[220px]"
      />
    );
  }

  return (
    <div className="w-full space-y-3 pb-8 select-none animate-fadeIn">
      {/* Toast Feedback */}
      {toast.show && (
        <div className={`fixed bottom-5 right-5 z-50 py-2 px-3.5 rounded-lg shadow-md flex items-center gap-2 text-xs font-semibold border backdrop-blur-md animate-slide-up ${
          toast.type === 'error'
            ? 'bg-rose-950/90 text-rose-200 border-rose-800'
            : 'bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 border-zinc-800'
        }`}>
          {toast.type === 'error' ? (
            <AlertTriangle size={14} className="text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ─── 01. CLEAN MINIMAL HEADER ─── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center border border-brand/20 shadow-2xs shrink-0">
            <Building2 size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                About Platform & Brand Identity
              </h1>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase">
                Brand Core
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Public story narrative, mission & vision statements, and RERA credentials
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {/* View Mode Toggle */}
          <div className="inline-flex items-center p-0.5 bg-[var(--bg-muted)] rounded-lg border border-[var(--border)] text-xs">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`w-6 h-6 flex items-center justify-center rounded-md transition-all cursor-pointer ${
                viewMode === 'split' ? 'bg-[var(--bg-surface)] text-brand shadow-2xs font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Split View (Side by Side)"
            >
              <Columns2 size={12} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`w-6 h-6 flex items-center justify-center rounded-md transition-all cursor-pointer ${
                viewMode === 'editor' ? 'bg-[var(--bg-surface)] text-brand shadow-2xs font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Form Editor Only"
            >
              <PenLine size={12} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`w-6 h-6 flex items-center justify-center rounded-md transition-all cursor-pointer ${
                viewMode === 'preview' ? 'bg-[var(--bg-surface)] text-brand shadow-2xs font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Live Brand Preview Only"
            >
              <Eye size={12} />
            </button>
          </div>

          {/* Revert if changes exist */}
          {hasChanges && (
            <button
              type="button"
              onClick={() => { setForm(saved); showToast('Unsaved changes discarded.', 'info'); }}
              className="h-7.5 flex items-center gap-1 px-2.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] text-[11px] font-semibold hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Revert</span>
            </button>
          )}

          {/* Save Live Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="h-7.5 flex items-center gap-1.5 px-3.5 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-2xs active:scale-95 bg-brand hover:bg-brand-dark"
          >
            {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            <span>{isSaving ? 'Saving...' : 'Save Live'}</span>
          </button>
        </div>
      </div>

      {/* ─── 02. MAIN WORKSPACE (Split Form + Live Brand Showcase) ─── */}
      <div className={`grid gap-3 items-start overflow-hidden ${
        viewMode === 'split'
          ? 'grid-cols-1 lg:grid-cols-12'
          : 'grid-cols-1'
      }`}>

        {/* ─── LEFT: CLEAN GROUPED EDITOR ─── */}
        {(viewMode === 'split' || viewMode === 'editor') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-7 xl:col-span-6' : 'w-full'} space-y-3`}>
            
            {/* Category Segmented Navigation Pills */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-1 flex items-center gap-1 overflow-x-auto shadow-2xs">
              {[
                { id: 'narrative', label: 'Story & Tagline', icon: Building2 },
                { id: 'mission', label: 'Mission & Vision', icon: Target },
                { id: 'legal', label: 'RERA & Office', icon: ShieldCheck },
                { id: 'support', label: 'Official Channels', icon: Mail },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`h-7 px-2.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-brand/10 text-brand font-bold border border-brand/20 shadow-2xs'
                        : 'text-[var(--text-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] border border-transparent'
                    }`}
                  >
                    <Icon size={11} className={isActive ? 'text-brand' : 'opacity-60'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT: Narrative & Tagline */}
            {activeTab === 'narrative' && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3.5 space-y-3 shadow-2xs animate-fadeIn">
                <div className="border-b border-[var(--border)] pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-primary)]">Platform Narrative & Tagline</h3>
                    <p className="text-[10.5px] text-[var(--text-muted)]">Core brand identity and intro story presented on the About Us page</p>
                  </div>
                  <Sparkles size={14} className="text-brand" />
                </div>

                <div className="space-y-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-wider">
                      Page Title *
                    </label>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="e.g. About GharMB"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/70 text-xs text-[var(--text-primary)] px-2.5 py-1.5 outline-none placeholder:text-[var(--text-muted)]/60 transition-all focus:border-brand focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-brand/30"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-wider">
                      Brand Tagline
                    </label>
                    <input
                      name="tagline"
                      value={form.tagline}
                      onChange={handleChange}
                      placeholder="e.g. Making real estate simpler and more trustworthy."
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/70 text-xs text-[var(--text-primary)] px-2.5 py-1.5 outline-none placeholder:text-[var(--text-muted)]/60 transition-all focus:border-brand focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-brand/30"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-wider">
                      Full Brand Narrative / Story *
                    </label>
                    <textarea
                      name="content"
                      value={form.content}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Write your company story, origins, and platform philosophy..."
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/70 text-xs text-[var(--text-primary)] px-2.5 py-1.5 outline-none placeholder:text-[var(--text-muted)]/60 transition-all focus:border-brand focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-brand/30 resize-y min-h-[90px]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Mission & Vision */}
            {activeTab === 'mission' && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3.5 space-y-3 shadow-2xs animate-fadeIn">
                <div className="border-b border-[var(--border)] pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-primary)]">Mission & Vision Statements</h3>
                    <p className="text-[10.5px] text-[var(--text-muted)]">Core company mission commitments and forward-looking strategic vision</p>
                  </div>
                  <Target size={14} className="text-emerald-500" />
                </div>

                <div className="space-y-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-wider flex items-center gap-1">
                      <Target size={10} className="text-brand" /> Company Mission Statement
                    </label>
                    <textarea
                      name="mission"
                      value={form.mission}
                      onChange={handleChange}
                      rows={3}
                      placeholder="To eliminate unverified listings and deliver a transparent property discovery ecosystem..."
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/70 text-xs text-[var(--text-primary)] px-2.5 py-1.5 outline-none placeholder:text-[var(--text-muted)]/60 transition-all focus:border-brand focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-brand/30 resize-y"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-wider flex items-center gap-1">
                      <Eye size={10} className="text-blue-500" /> Company Strategic Vision
                    </label>
                    <textarea
                      name="vision"
                      value={form.vision}
                      onChange={handleChange}
                      rows={3}
                      placeholder="To become India’s most trusted real-estate marketplace for buyers and developers..."
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/70 text-xs text-[var(--text-primary)] px-2.5 py-1.5 outline-none placeholder:text-[var(--text-muted)]/60 transition-all focus:border-brand focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-brand/30 resize-y"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Legal & RERA Credentials */}
            {activeTab === 'legal' && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3.5 space-y-3 shadow-2xs animate-fadeIn">
                <div className="border-b border-[var(--border)] pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-primary)]">Corporate & Legal Compliance</h3>
                    <p className="text-[10.5px] text-[var(--text-muted)]">Official government registration IDs and registered office</p>
                  </div>
                  <ShieldCheck size={14} className="text-purple-500" />
                </div>

                <div className="space-y-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-wider">
                      RERA Registration ID
                    </label>
                    <input
                      name="reraRegistration"
                      value={form.reraRegistration}
                      onChange={handleChange}
                      placeholder="e.g. HRERA-PKL-GGM-1240-2024"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/70 text-xs text-[var(--text-primary)] px-2.5 py-1.5 outline-none placeholder:text-[var(--text-muted)]/60 transition-all focus:border-brand focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-brand/30"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-wider">
                      Headquarters Corporate Location
                    </label>
                    <input
                      name="headquarters"
                      value={form.headquarters}
                      onChange={handleChange}
                      placeholder="e.g. Cyber City, Gurugram, India"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/70 text-xs text-[var(--text-primary)] px-2.5 py-1.5 outline-none placeholder:text-[var(--text-muted)]/60 transition-all focus:border-brand focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-brand/30"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-wider">
                      Official Website Domain URL
                    </label>
                    <input
                      name="websiteUrl"
                      type="url"
                      value={form.websiteUrl}
                      onChange={handleChange}
                      placeholder="https://gharmb.com"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/70 text-xs text-[var(--text-primary)] px-2.5 py-1.5 outline-none placeholder:text-[var(--text-muted)]/60 transition-all focus:border-brand focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-brand/30"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Support Channels */}
            {activeTab === 'support' && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3.5 space-y-3 shadow-2xs animate-fadeIn">
                <div className="border-b border-[var(--border)] pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-primary)]">Public Support Routes</h3>
                    <p className="text-[10.5px] text-[var(--text-muted)]">Official support email and consumer helpline</p>
                  </div>
                  <Mail size={14} className="text-brand" />
                </div>

                <div className="space-y-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-wider flex items-center gap-1">
                      <Mail size={10} className="text-purple-500" /> Official Support Email
                    </label>
                    <input
                      name="supportEmail"
                      type="email"
                      value={form.supportEmail}
                      onChange={handleChange}
                      placeholder="support@gharmb.com"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/70 text-xs text-[var(--text-primary)] px-2.5 py-1.5 outline-none placeholder:text-[var(--text-muted)]/60 transition-all focus:border-brand focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-brand/30"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-wider flex items-center gap-1">
                      <Phone size={10} className="text-blue-500" /> Public Helpline Phone
                    </label>
                    <input
                      name="helpline"
                      value={form.helpline}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/70 text-xs text-[var(--text-primary)] px-2.5 py-1.5 outline-none placeholder:text-[var(--text-muted)]/60 transition-all focus:border-brand focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-brand/30"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── RIGHT: LIVE BRAND SHOWCASE PREVIEW ─── */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-5 xl:col-span-6' : 'w-full'} space-y-3 lg:sticky lg:top-4`}>
            
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-2xs">
              {/* Preview Header Bar */}
              <div className="px-3.5 py-2 border-b border-[var(--border)] bg-[var(--bg-muted)]/40 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-[var(--text-primary)]">Live Brand Card Preview</span>
                </div>

                <div className="flex items-center gap-1 bg-[var(--bg-surface)] p-0.5 rounded-md border border-[var(--border)] text-[10px]">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-all ${
                      previewDevice === 'desktop' ? 'bg-brand/10 text-brand font-bold' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    <Monitor size={10} />
                    <span>Web</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-all ${
                      previewDevice === 'mobile' ? 'bg-brand/10 text-brand font-bold' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    <Smartphone size={10} />
                    <span>App</span>
                  </button>
                </div>
              </div>

              {/* Preview Card Body */}
              <div className="p-4 space-y-3 bg-[var(--bg-surface)]">
                
                {/* Hero Brand Header */}
                <div className="border-b border-[var(--border)] pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-bold text-brand uppercase tracking-wider">Brand Showcase</span>
                    {form.reraRegistration && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded-full">
                        <ShieldCheck size={9} />
                        <span>RERA Verified</span>
                      </span>
                    )}
                  </div>

                  <h2 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)] mt-1 leading-snug">
                    {form.title || 'About GharMB'}
                  </h2>

                  {form.tagline && (
                    <p className="text-[11.5px] font-medium text-brand mt-0.5">
                      "{form.tagline}"
                    </p>
                  )}

                  <p className="text-[11px] text-[var(--text-muted)] mt-1.5 leading-relaxed line-clamp-3">
                    {form.content || 'GharMB is a modern real-estate technology platform connecting home buyers, property owners, and certified agents.'}
                  </p>
                </div>

                {/* Mission & Vision Accent Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Mission Card */}
                  <div className="p-2.5 rounded-lg border border-[var(--border)] bg-brand/[0.03] space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-brand uppercase tracking-wide">
                      <Target size={11} />
                      <span>Our Mission</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-subtle)] leading-relaxed">
                      {form.mission || 'To eliminate unverified listings and deliver a transparent property discovery ecosystem.'}
                    </p>
                  </div>

                  {/* Vision Card */}
                  <div className="p-2.5 rounded-lg border border-[var(--border)] bg-blue-500/[0.03] space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                      <Eye size={11} />
                      <span>Our Vision</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-subtle)] leading-relaxed">
                      {form.vision || 'To become India’s most trusted real-estate marketplace for buyers and developers.'}
                    </p>
                  </div>
                </div>

                {/* Compliance & Credentials Strip */}
                <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/20 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="text-[9.5px] font-semibold text-[var(--text-muted)] uppercase">RERA ID</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-bold text-[var(--text-primary)]">
                        {form.reraRegistration || 'Not specified'}
                      </span>
                      {form.reraRegistration && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(form.reraRegistration, 'RERA ID')}
                          className="p-0.5 rounded text-[var(--text-muted)] hover:text-brand cursor-pointer"
                        >
                          {copiedField === 'RERA ID' ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10.5px] border-t border-[var(--border)]/40 pt-1">
                    <span className="text-[9.5px] font-semibold text-[var(--text-muted)] uppercase">Headquarters</span>
                    <span className="font-medium text-[var(--text-primary)] truncate max-w-[200px]">
                      {form.headquarters || 'Cyber City, Gurugram'}
                    </span>
                  </div>

                  {form.websiteUrl && (
                    <div className="flex items-center justify-between text-[10.5px] border-t border-[var(--border)]/40 pt-1">
                      <span className="text-[9.5px] font-semibold text-[var(--text-muted)] uppercase">Domain</span>
                      <a
                        href={form.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-brand hover:underline flex items-center gap-0.5"
                      >
                        <span>{form.websiteUrl}</span>
                        <ExternalLink size={9} />
                      </a>
                    </div>
                  )}
                </div>

                {/* Channels pill */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-muted)]/30 border border-[var(--border)] text-[10.5px]">
                  <div className="flex items-center gap-1 text-[var(--text-muted)] truncate">
                    <Mail size={11} className="shrink-0 text-brand" />
                    <span className="truncate">{form.supportEmail || 'support@gharmb.com'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[var(--text-muted)] shrink-0">
                    <Phone size={11} className="shrink-0 text-brand" />
                    <span>{form.helpline || '+91 98765 43210'}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
