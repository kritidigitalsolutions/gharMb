import { useState, useEffect, useCallback } from 'react';
import {
  Save, RotateCcw, CheckCircle2, AlertTriangle, Loader2,
  Mail, ShieldCheck, FileText, Target, Building2
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

const AboutSettings = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saved, setSaved] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get('/admin/pages/about-us');
        if (res.data?.success && res.data?.data?.pageContent) {
          const pc = res.data.data.pageContent;
          const meta = pc.metadata || {};
          const loaded = {
            title: pc.title || '',
            content: pc.content || '',
            tagline: meta.tagline || '',
            mission: meta.mission || '',
            vision: meta.vision || '',
            supportEmail: meta.supportEmail || '',
            helpline: meta.helpline || '',
            headquarters: meta.headquarters || '',
            reraRegistration: meta.reraRegistration || '',
            websiteUrl: meta.websiteUrl || ''
          };
          setForm(loaded);
          setSaved(loaded);
        }
      } catch {
        // silently fallback
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const hasChanges = JSON.stringify(form) !== JSON.stringify(saved);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = useCallback(async () => {
    if (!form.title.trim()) { showToast('Title is required.', 'error'); return; }
    if (!form.content.trim()) { showToast('Content is required.', 'error'); return; }
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
      showToast('About page details saved successfully!', 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to save.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [form, showToast]);

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

  const inputCls = `w-full rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] text-[13px] text-[var(--text-primary)] px-3.5 py-2.5 outline-none placeholder:text-[var(--text-muted)] transition-all focus:border-brand focus:shadow-[0_0_0_3px_rgba(255,90,60,0.1)]`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-10">

      {/* Toast Feedback */}
      {toast.show && (
        <div className={`fixed bottom-5 right-5 z-50 py-2.5 px-4 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold border backdrop-blur-md animate-slide-up ${
          toast.type === 'success'
            ? 'bg-emerald-950/95 border-emerald-700/60 text-emerald-200'
            : 'bg-rose-950/95 border-rose-700/60 text-rose-200'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 size={15} className="text-emerald-400" />
            : <AlertTriangle size={15} className="text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Full-Width Header Banner */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center border border-brand/20 shadow-xs shrink-0">
            <Building2 size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">About Platform & Brand Identity</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Brand Core
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Manage your public platform mission, vision, corporate registration details, and brand narrative
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
          {hasChanges && (
            <button
              onClick={() => { setForm(saved); showToast('Changes reverted.', 'info'); }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border)] text-[var(--text-muted)] text-xs font-semibold hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Revert</span>
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #FF6B4A, #FF5A3C, #E84528)',
              boxShadow: hasChanges ? '0 4px 14px rgba(255,90,60,0.35)' : 'none'
            }}
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* 2-Column Responsive Workspace (Full Width) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Main Narrative & Core Mission */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">

          {/* Section: Main Content */}
          <Section icon={<FileText size={16} />} title="Main Platform Narrative" subtitle="Headline, introductory story, and brand tagline">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Page Title *</label>
              <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. GHARMB SaaS" className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Content / Platform Description *</label>
              <textarea name="content" value={form.content} onChange={handleChange} rows={5} placeholder="Write your platform description, story and purpose..." className={`${inputCls} resize-y min-h-[120px]`} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Tagline</label>
              <input name="tagline" value={form.tagline} onChange={handleChange} placeholder="e.g. Modern Real-Estate Technology Platform" className={inputCls} />
            </div>
          </Section>

          {/* Section: Mission & Vision */}
          <Section icon={<Target size={16} />} title="Mission & Vision Statements" subtitle="Platform mission and forward-looking strategic vision">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Mission Statement</label>
                <textarea name="mission" value={form.mission} onChange={handleChange} rows={3} placeholder="Company mission statement..." className={`${inputCls} resize-y`} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Vision Statement</label>
                <textarea name="vision" value={form.vision} onChange={handleChange} rows={3} placeholder="Company vision statement..." className={`${inputCls} resize-y`} />
              </div>
            </div>
          </Section>

        </div>

        {/* RIGHT COLUMN: Identity Metadata & Real-Time Preview */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-4">

          {/* Section: Corporate & Regulatory Identity */}
          <Section icon={<ShieldCheck size={16} />} title="Corporate & Regulatory Details" subtitle="Official registration and registered premises">
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>RERA Registration ID</label>
                <input name="reraRegistration" value={form.reraRegistration} onChange={handleChange} placeholder="e.g. HRERA-PKL-GGM-1240-2024" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Headquarters Location</label>
                <input name="headquarters" value={form.headquarters} onChange={handleChange} placeholder="e.g. Cyber City, Gurugram, India" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Official Website URL</label>
                <input name="websiteUrl" value={form.websiteUrl} onChange={handleChange} placeholder="https://gharmb.com/about" type="url" className={inputCls} />
              </div>
            </div>
          </Section>

          {/* Section: Support & Channels */}
          <Section icon={<Mail size={16} />} title="Support Channels" subtitle="Official contact routes">
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Official Support Email</label>
                <input name="supportEmail" value={form.supportEmail} onChange={handleChange} placeholder="support@gharmb.com" type="email" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Public Helpline</label>
                <input name="helpline" value={form.helpline} onChange={handleChange} placeholder="+91 98765 43210" className={inputCls} />
              </div>
            </div>
          </Section>
        </div>

      </div>

      {/* Sticky Unsaved Notice Bar */}
      {hasChanges && (
        <div className="sticky bottom-4 flex items-center justify-between bg-[var(--bg-surface)]/95 backdrop-blur-md border border-brand/30 rounded-2xl px-5 py-3.5 shadow-xl animate-slide-up">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <p className="text-xs font-semibold text-[var(--text-primary)]">You have unsaved changes in about configuration</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setForm(saved)}
              className="px-3.5 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] text-xs font-semibold hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50 cursor-pointer shadow-md active:scale-95"
              style={{ background: 'linear-gradient(135deg, #FF6B4A, #FF5A3C, #E84528)' }}
            >
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const labelCls = `text-[11px] font-semibold text-[var(--text-subtle)] uppercase tracking-wider`;

const Section = ({ icon, title, subtitle, children }) => (
  <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xs">
    <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">{title}</p>
        {subtitle && <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className="p-5 flex flex-col gap-4">{children}</div>
  </div>
);

export default AboutSettings;
