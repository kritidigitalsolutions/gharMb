import { useState, useEffect, useCallback, useMemo } from 'react';
import AdminLoader from '../components/common/AdminLoader';
import {
  Save, RotateCcw, CheckCircle2, AlertTriangle, Loader2,
  Phone, Mail, MapPin, MessageSquare, Clock, Globe,
  ExternalLink, Copy, Check, Sparkles, Smartphone, Monitor,
  Columns2, Eye, PenLine, ShieldCheck, Headphones
} from 'lucide-react';
import API from '../api/api';

const EMPTY_FORM = {
  title: '',
  content: '',
  helpline: '',
  tollFree: '',
  whatsapp: '',
  supportEmail: '',
  salesEmail: '',
  workingHours: '',
  responseSLA: '',
  headquartersAddress: '',
  headquartersCity: '',
  headquartersState: '',
  headquartersPincode: '',
  mapsUrl: ''
};

export default function ContactManagement() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saved, setSaved] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('channels'); // 'channels' | 'location' | 'hours' | 'page'
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'editor' | 'preview'
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile'
  const [copiedField, setCopiedField] = useState(null);

  // Toast Feedback
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  }, []);

  // Fetch Contact Page Content
  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get('/admin/pages/contact-us');
        if (res.data?.success && res.data?.data?.pageContent) {
          const pc = res.data.data.pageContent;
          const m = pc.metadata || {};
          const hq = m.headquarters || {};
          const loaded = {
            title: pc.title || 'Get in Touch with GharMB',
            content: pc.content || 'Have questions regarding properties or partnerships? Our team is here to assist.',
            helpline: m.helpline || '+91 98765 43210',
            tollFree: m.tollFree || '1800-120-GHARMB',
            whatsapp: m.whatsapp || '+91 98765 43210',
            supportEmail: m.supportEmail || 'support@gharmb.com',
            salesEmail: m.salesEmail || 'sales@gharmb.com',
            workingHours: m.workingHours || 'Mon – Sat: 9:00 AM – 8:00 PM IST',
            responseSLA: m.responseSLA || 'Replies within 15 minutes',
            headquartersAddress: hq.address || 'Sector 29, Cyber City Phase 2',
            headquartersCity: hq.city || 'Gurugram',
            headquartersState: hq.state || 'Haryana',
            headquartersPincode: hq.pincode || '122002',
            mapsUrl: hq.mapsUrl || 'https://maps.google.com'
          };
          setForm(loaded);
          setSaved(loaded);
        }
      } catch {
        // graceful fallback to defaults
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
    setForm(p => ({ ...p, [name]: value }));
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
    if (!form.content.trim()) { showToast('Page description is required.', 'error'); return; }

    setIsSaving(true);
    try {
      await API.put('/admin/pages/contact-us', {
        title: form.title.trim(),
        content: form.content.trim(),
        metadata: {
          helpline: form.helpline.trim(),
          tollFree: form.tollFree.trim(),
          whatsapp: form.whatsapp.trim(),
          supportEmail: form.supportEmail.trim(),
          salesEmail: form.salesEmail.trim(),
          workingHours: form.workingHours.trim(),
          responseSLA: form.responseSLA.trim(),
          headquarters: {
            address: form.headquartersAddress.trim(),
            city: form.headquartersCity.trim(),
            state: form.headquartersState.trim(),
            pincode: form.headquartersPincode.trim(),
            mapsUrl: form.mapsUrl.trim()
          }
        }
      });
      setSaved({ ...form });
      showToast('Contact operations & channels saved live!', 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to save contact information.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [form, showToast]);

  // Keyboard shortcut Ctrl+S
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

  const cleanWhatsapp = (form.whatsapp || '').replace(/[^0-9]/g, '');
  const waLink = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent('Hi GharMB Team, I need assistance with...')}`;

  if (loading) {
    return (
      <AdminLoader
        card
        text="Loading Contact Information..."
        subtext="Fetching helpdesk numbers, emails, and office coordinates"
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
            <Headphones size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                Contact & Support Operations
              </h1>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
                Live Gateway
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Public calling lines, WhatsApp chat, office location, and response SLA
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
              title="Live Preview Only"
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

      {/* ─── 02. MAIN WORKSPACE (Split Form + Live Interactive Card) ─── */}
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
                { id: 'channels', label: 'Phone & WhatsApp', icon: Phone },
                { id: 'location', label: 'Office & Maps', icon: MapPin },
                { id: 'hours', label: 'Hours & SLA', icon: Clock },
                { id: 'page', label: 'Page Intro', icon: Globe },
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

            {/* TAB CONTENT: Channels & Phone */}
            {activeTab === 'channels' && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3.5 space-y-3 shadow-2xs animate-fadeIn">
                <div className="border-b border-[var(--border)] pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-primary)]">Public Contact Channels</h3>
                    <p className="text-[10.5px] text-[var(--text-muted)]">Direct calling lines, WhatsApp chat, and official email inboxes</p>
                  </div>
                  <span className="text-[10px] font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded">4 Channels</span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-wider flex items-center gap-1">
                      <Phone size={10} className="text-blue-500" /> Primary Calling Helpline *
                    </label>
                    <input
                      name="helpline"
                      value={form.helpline}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/70 text-xs text-[var(--text-primary)] px-2.5 py-1.5 outline-none placeholder:text-[var(--text-muted)]/60 transition-all focus:border-brand focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-brand/30"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-wider flex items-center gap-1">
                      <Phone size={10} className="text-amber-500" /> Toll-Free Number
                    </label>
                    <input
                      name="tollFree"
                      value={form.tollFree}
                      onChange={handleChange}
                      placeholder="1800-120-GHARMB"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/70 text-xs text-[var(--text-primary)] px-2.5 py-1.5 outline-none placeholder:text-[var(--text-muted)]/60 transition-all focus:border-brand focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-brand/30"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-wider flex items-center gap-1">
                      <MessageSquare size={10} className="text-emerald-500" /> WhatsApp Direct Channel
                    </label>
                    <input
                      name="whatsapp"
                      value={form.whatsapp}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/70 text-xs text-[var(--text-primary)] px-2.5 py-1.5 outline-none placeholder:text-[var(--text-muted)]/60 transition-all focus:border-brand focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-brand/30"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-wider flex items-center gap-1">
                        <Mail size={10} className="text-purple-500" /> Customer Support Email
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
                        <Mail size={10} className="text-indigo-500" /> Business / Sales Email
                      </label>
                      <input
                        name="salesEmail"
                        type="email"
                        value={form.salesEmail}
                        onChange={handleChange}
                        placeholder="sales@gharmb.com"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/70 text-xs text-[var(--text-primary)] px-2.5 py-1.5 outline-none placeholder:text-[var(--text-muted)]/60 transition-all focus:border-brand focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-brand/30"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Location & Maps */}
            {activeTab === 'location' && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3.5 space-y-3 shadow-2xs animate-fadeIn">
                <div className="border-b border-[var(--border)] pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-primary)]">Office Address & Maps</h3>
                    <p className="text-[10.5px] text-[var(--text-muted)]">Registered headquarters location and map navigation link</p>
                  </div>
                  <MapPin size={14} className="text-rose-500" />
                </div>

                <div className="space-y-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-wider">
                      Street / Building Address *
                    </label>
                    <input
                      name="headquartersAddress"
                      value={form.headquartersAddress}
                      onChange={handleChange}
                      placeholder="e.g. GHARMB Tower, Sector 29, Cyber City Phase 2"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/70 text-xs text-[var(--text-primary)] px-2.5 py-1.5 outline-none placeholder:text-[var(--text-muted)]/60 transition-all focus:border-brand focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-brand/30"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-wider">City</label>
                      <input
                        name="headquartersCity"
                        value={form.headquartersCity}
                        onChange={handleChange}
                        placeholder="e.g. Gurugram"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/70 text-xs text-[var(--text-primary)] px-2.5 py-1.5 outline-none placeholder:text-[var(--text-muted)]/60 transition-all focus:border-brand focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-brand/30"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-wider">State</label>
                      <input
                        name="headquartersState"
                        value={form.headquartersState}
                        onChange={handleChange}
                        placeholder="e.g. Haryana"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/70 text-xs text-[var(--text-primary)] px-2.5 py-1.5 outline-none placeholder:text-[var(--text-muted)]/60 transition-all focus:border-brand focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-brand/30"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-wider">Postal Pincode</label>
                      <input
                        name="headquartersPincode"
                        value={form.headquartersPincode}
                        onChange={handleChange}
                        placeholder="e.g. 122002"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/70 text-xs text-[var(--text-primary)] px-2.5 py-1.5 outline-none placeholder:text-[var(--text-muted)]/60 transition-all focus:border-brand focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-brand/30"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-wider">
                      Google Maps Navigation URL
                    </label>
                    <input
                      name="mapsUrl"
                      type="url"
                      value={form.mapsUrl}
                      onChange={handleChange}
                      placeholder="https://maps.google.com/..."
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/70 text-xs text-[var(--text-primary)] px-2.5 py-1.5 outline-none placeholder:text-[var(--text-muted)]/60 transition-all focus:border-brand focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-brand/30"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Hours & SLA */}
            {activeTab === 'hours' && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3.5 space-y-3 shadow-2xs animate-fadeIn">
                <div className="border-b border-[var(--border)] pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-primary)]">Working Hours & Commitments</h3>
                    <p className="text-[10.5px] text-[var(--text-muted)]">Helpdesk operating availability and inquiry turnaround SLA</p>
                  </div>
                  <Clock size={14} className="text-amber-500" />
                </div>

                <div className="space-y-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-wider">
                      Operating Schedule / Working Hours
                    </label>
                    <input
                      name="workingHours"
                      value={form.workingHours}
                      onChange={handleChange}
                      placeholder="e.g. Mon–Sat: 9:00 AM – 8:00 PM IST"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/70 text-xs text-[var(--text-primary)] px-2.5 py-1.5 outline-none placeholder:text-[var(--text-muted)]/60 transition-all focus:border-brand focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-brand/30"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-wider">
                      Support Response SLA Promise
                    </label>
                    <input
                      name="responseSLA"
                      value={form.responseSLA}
                      onChange={handleChange}
                      placeholder="e.g. Average reply time under 15 minutes"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/70 text-xs text-[var(--text-primary)] px-2.5 py-1.5 outline-none placeholder:text-[var(--text-muted)]/60 transition-all focus:border-brand focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-brand/30"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Page Intro */}
            {activeTab === 'page' && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3.5 space-y-3 shadow-2xs animate-fadeIn">
                <div className="border-b border-[var(--border)] pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-primary)]">Page Headings & Intro</h3>
                    <p className="text-[10.5px] text-[var(--text-muted)]">Headline and introductory description displayed on the Contact Us web page</p>
                  </div>
                  <Globe size={14} className="text-brand" />
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
                      placeholder="e.g. Get in Touch with GharMB"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/70 text-xs text-[var(--text-primary)] px-2.5 py-1.5 outline-none placeholder:text-[var(--text-muted)]/60 transition-all focus:border-brand focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-brand/30"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-wider">
                      Page Intro Narrative *
                    </label>
                    <textarea
                      name="content"
                      value={form.content}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Brief description shown to visitors on the contact page..."
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/70 text-xs text-[var(--text-primary)] px-2.5 py-1.5 outline-none placeholder:text-[var(--text-muted)]/60 transition-all focus:border-brand focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-brand/30 resize-y"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── RIGHT: LIVE INTERACTIVE PUBLIC PREVIEW CARD ─── */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-5 xl:col-span-6' : 'w-full'} space-y-3 lg:sticky lg:top-4`}>
            
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-2xs">
              {/* Preview Header Bar */}
              <div className="px-3.5 py-2 border-b border-[var(--border)] bg-[var(--bg-muted)]/40 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-[var(--text-primary)]">Live Public Card Preview</span>
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
              <div className="p-4 space-y-3.5 bg-[var(--bg-surface)]">
                
                {/* Hero Title & Intro */}
                <div className="border-b border-[var(--border)] pb-3">
                  <span className="text-[9px] font-bold text-brand uppercase tracking-wider">Official Contact Gateway</span>
                  <h2 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)] mt-0.5 leading-snug">
                    {form.title || 'Get in Touch with GharMB'}
                  </h2>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
                    {form.content || 'Have questions regarding verified properties or partnership onboarding? Our advisory team is here to assist.'}
                  </p>
                </div>

                {/* Interactive Channel Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Helpline */}
                  <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/30 flex items-center justify-between gap-2 group hover:border-brand/40 transition-colors">
                    <div className="min-w-0">
                      <span className="text-[9.5px] font-semibold text-[var(--text-muted)] uppercase block">Helpline</span>
                      <p className="font-bold text-[var(--text-primary)] text-[11.5px] truncate mt-0.5">
                        {form.helpline || '+91 98765 43210'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(form.helpline, 'Helpline')}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-brand hover:bg-[var(--bg-surface)] cursor-pointer shrink-0"
                      title="Copy helpline"
                    >
                      {copiedField === 'Helpline' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                  </div>

                  {/* WhatsApp */}
                  <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] flex items-center justify-between gap-2 group hover:border-emerald-500/40 transition-colors">
                    <div className="min-w-0">
                      <span className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1">
                        <MessageSquare size={10} /> WhatsApp Chat
                      </span>
                      <p className="font-bold text-[var(--text-primary)] text-[11.5px] truncate mt-0.5">
                        {form.whatsapp || '+91 98765 43210'}
                      </p>
                    </div>
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer shrink-0"
                      title="Test WhatsApp chat"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  {/* Support Email */}
                  <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/30 flex items-center justify-between gap-2 group hover:border-brand/40 transition-colors">
                    <div className="min-w-0">
                      <span className="text-[9.5px] font-semibold text-[var(--text-muted)] uppercase block">Support Email</span>
                      <p className="font-bold text-[var(--text-primary)] text-[11.5px] truncate mt-0.5">
                        {form.supportEmail || 'support@gharmb.com'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(form.supportEmail, 'Support Email')}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-brand hover:bg-[var(--bg-surface)] cursor-pointer shrink-0"
                      title="Copy email"
                    >
                      {copiedField === 'Support Email' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                  </div>

                  {/* Toll-Free */}
                  <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/30 flex items-center justify-between gap-2 group hover:border-brand/40 transition-colors">
                    <div className="min-w-0">
                      <span className="text-[9.5px] font-semibold text-[var(--text-muted)] uppercase block">Toll-Free</span>
                      <p className="font-bold text-[var(--text-primary)] text-[11.5px] truncate mt-0.5">
                        {form.tollFree || '1800-120-GHARMB'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(form.tollFree, 'Toll Free')}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-brand hover:bg-[var(--bg-surface)] cursor-pointer shrink-0"
                      title="Copy toll-free"
                    >
                      {copiedField === 'Toll Free' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                {/* Office & Coordinates */}
                <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/20 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[var(--text-subtle)] uppercase flex items-center gap-1">
                      <MapPin size={11} className="text-rose-500" /> Registered Office
                    </span>
                    {form.mapsUrl && (
                      <a
                        href={form.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-brand hover:underline flex items-center gap-1"
                      >
                        <span>Open Map</span>
                        <ExternalLink size={9} />
                      </a>
                    )}
                  </div>
                  <p className="text-[11.5px] font-semibold text-[var(--text-primary)] leading-relaxed">
                    {[
                      form.headquartersAddress,
                      form.headquartersCity,
                      form.headquartersState,
                      form.headquartersPincode ? `- ${form.headquartersPincode}` : ''
                    ].filter(Boolean).join(', ') || 'Headquarters location not configured'}
                  </p>
                </div>

                {/* Hours & Response SLA Banner */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-brand/5 border border-brand/15 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-brand shrink-0" />
                    <span className="font-medium text-[var(--text-primary)] truncate">
                      {form.workingHours || 'Mon–Sat: 9 AM – 8 PM'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded shrink-0">
                    {form.responseSLA || 'Replies in 15 mins'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}