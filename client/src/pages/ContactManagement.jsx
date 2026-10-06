import { useState, useEffect, useCallback } from 'react';
import {
  Save, RotateCcw, CheckCircle2, AlertTriangle, Loader2,
  Phone, Mail, MapPin, MessageSquare, Clock, Globe
} from 'lucide-react';
import API from '../api/api';

const EMPTY = {
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

const ContactManagement = () => {
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(EMPTY);
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
        const res = await API.get('/admin/pages/contact-us');
        if (res.data?.success && res.data?.data?.pageContent) {
          const pc = res.data.data.pageContent;
          const m = pc.metadata || {};
          const hq = m.headquarters || {};
          const loaded = {
            title: pc.title || '',
            content: pc.content || '',
            helpline: m.helpline || '',
            tollFree: m.tollFree || '',
            whatsapp: m.whatsapp || '',
            supportEmail: m.supportEmail || '',
            salesEmail: m.salesEmail || '',
            workingHours: m.workingHours || '',
            responseSLA: m.responseSLA || '',
            headquartersAddress: hq.address || '',
            headquartersCity: hq.city || '',
            headquartersState: hq.state || '',
            headquartersPincode: hq.pincode || '',
            mapsUrl: hq.mapsUrl || ''
          };
          setForm(loaded);
          setSaved(loaded);
        }
      } catch {
        // silent fallback
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const hasChanges = JSON.stringify(form) !== JSON.stringify(saved);

  const handle = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleSave = useCallback(async () => {
    if (!form.title.trim()) { showToast('Title is required.', 'error'); return; }
    if (!form.content.trim()) { showToast('Content is required.', 'error'); return; }
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
      showToast('Contact page details saved successfully!', 'success');
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
            <Phone size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Contact Details & Operations</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Public Gateway
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Configure your public customer support lines, headquarters address, and operating response hours
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
        
        {/* LEFT COLUMN: Main Content, Headquarters & Operations */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">

          {/* Section: Page Content */}
          <Section icon={<Globe size={16} />} title="Page Content & Headings" subtitle="Required — Headline & introductory description displayed on the Contact Us page">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Page Title *</label>
              <input name="title" value={form.title} onChange={handle} placeholder="e.g. Get in Touch with GharMB" className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Page Description / Intro *</label>
              <textarea name="content" value={form.content} onChange={handle} rows={3} placeholder="Brief description shown on the contact page..." className={`${inputCls} resize-y`} />
            </div>
          </Section>

          {/* Section: Headquarters & Physical Office */}
          <Section icon={<MapPin size={16} />} title="Headquarters & Physical Office" subtitle="Official registered location and map navigation link">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className={labelCls}>Street / Building Address</label>
                <input name="headquartersAddress" value={form.headquartersAddress} onChange={handle} placeholder="e.g. GHARMB Tower, Sector 29, Cyber City Phase 2" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>City</label>
                <input name="headquartersCity" value={form.headquartersCity} onChange={handle} placeholder="e.g. Gurugram" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>State</label>
                <input name="headquartersState" value={form.headquartersState} onChange={handle} placeholder="e.g. Haryana" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Postal Pincode</label>
                <input name="headquartersPincode" value={form.headquartersPincode} onChange={handle} placeholder="e.g. 122002" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Google Maps Embed / Place URL</label>
                <input name="mapsUrl" value={form.mapsUrl} onChange={handle} placeholder="https://maps.google.com/..." type="url" className={inputCls} />
              </div>
            </div>
          </Section>

          {/* Section: Working Hours & Response SLA */}
          <Section icon={<Clock size={16} />} title="Business Hours & Response Commitments" subtitle="Availability times and average inquiry turnaround speed">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Working Hours</label>
                <input name="workingHours" value={form.workingHours} onChange={handle} placeholder="e.g. Mon–Sat: 9:00 AM – 8:00 PM IST" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Support Response SLA</label>
                <input name="responseSLA" value={form.responseSLA} onChange={handle} placeholder="e.g. Replies in under 15 mins" className={inputCls} />
              </div>
            </div>
          </Section>

        </div>

        {/* RIGHT COLUMN: Contact Channels & Live Preview */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-4">

          {/* Section: Direct Phone & Messaging */}
          <Section icon={<Phone size={16} />} title="Direct Lines & Messaging" subtitle="Direct customer calling and instant chat numbers">
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Primary Helpline</label>
                <input name="helpline" value={form.helpline} onChange={handle} placeholder="+91 98765 43210" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Toll-Free Number</label>
                <input name="tollFree" value={form.tollFree} onChange={handle} placeholder="1800-120-GHARMB" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}><MessageSquare size={11} className="inline mr-1 text-emerald-500" />WhatsApp Direct Channel</label>
                <input name="whatsapp" value={form.whatsapp} onChange={handle} placeholder="+91 98765 43210" className={inputCls} />
              </div>
            </div>
          </Section>

          {/* Section: Email Inboxes */}
          <Section icon={<Mail size={16} />} title="Official Email Inboxes" subtitle="Inquiry routing addresses">
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Customer Support Email</label>
                <input name="supportEmail" value={form.supportEmail} onChange={handle} placeholder="support@gharmb.com" type="email" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Business & Sales Inquiries</label>
                <input name="salesEmail" value={form.salesEmail} onChange={handle} placeholder="sales@gharmb.com" type="email" className={inputCls} />
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
            <p className="text-xs font-semibold text-[var(--text-primary)]">You have unsaved changes in contact configuration</p>
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

export default ContactManagement;