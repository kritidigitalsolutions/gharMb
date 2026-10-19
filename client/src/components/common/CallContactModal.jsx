import React, { useState } from 'react';
import {
  Phone,
  PhoneCall,
  MessageCircle,
  Copy,
  Check,
  X,
  Smartphone,
  QrCode,
  ArrowUpRight,
  ExternalLink,
  Clock,
  CheckCircle2,
  Send,
  FileText,
  User,
  ShieldCheck
} from 'lucide-react';

/**
 * CallContactModal
 * Replaces default browser "Open Pick an app?" protocol prompt with a
 * modern, multi-channel calling and contact UI for real estate leads and inquiries.
 */
export default function CallContactModal({
  isOpen,
  onClose,
  contact,
  onUpdateStatus,
  onAddNote,
}) {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [activeTab, setActiveTab] = useState('options'); // 'options' | 'qr'
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(contact?.status || '');

  if (!isOpen || !contact) return null;

  // Normalize contact attributes
  const clientName =
    contact.clientName ||
    contact.client ||
    contact.name ||
    contact.buyerName ||
    contact.userName ||
    'Customer';

  const rawPhone =
    contact.clientPhone ||
    contact.phone ||
    contact.buyerPhone ||
    contact.userPhone ||
    '';

  const clientEmail =
    contact.clientEmail ||
    contact.email ||
    contact.buyerEmail ||
    '';

  const subject =
    contact.title ||
    contact.propertyName ||
    contact.serviceName ||
    contact.subject ||
    'Real Estate Inquiry';

  const leadCode =
    contact.code ||
    contact.leadId ||
    contact.id ||
    '';

  const category =
    contact.categoryLabel ||
    contact.category ||
    contact.channel ||
    'Customer Lead';

  // Format clean phone for WhatsApp and dialer
  const digitsOnly = String(rawPhone).replace(/[^0-9]/g, '');
  const waPhone = digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly;
  const waMessage = encodeURIComponent(
    `Hello ${clientName}, this is regarding your inquiry with GharMB for "${subject}". How can we assist you today?`
  );
  const waUrl = `https://wa.me/${waPhone}?text=${waMessage}`;
  const telUrl = `tel:${rawPhone}`;

  // QR Code URL for instant mobile camera dial
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    telUrl
  )}&margin=2`;

  const handleCopyPhone = () => {
    if (!rawPhone) return;
    navigator.clipboard.writeText(rawPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleCopyEmail = () => {
    if (!clientEmail) return;
    navigator.clipboard.writeText(clientEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleStatusChange = async (newStatus) => {
    if (!onUpdateStatus) return;
    setIsUpdatingStatus(true);
    try {
      await onUpdateStatus(newStatus);
      setSelectedStatus(newStatus);
    } catch (err) {
      console.error('Error updating status from modal:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveNote = async (e) => {
    if (e) e.preventDefault();
    if (!noteText.trim() || !onAddNote) return;

    setIsSavingNote(true);
    try {
      await onAddNote(noteText.trim());
      setNoteSaved(true);
      setNoteText('');
      setTimeout(() => setNoteSaved(false), 2500);
    } catch (err) {
      console.error('Error saving note from modal:', err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleSystemDialerClick = () => {
    // Open system protocol only when deliberately triggered by user
    window.location.href = telUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden z-10 animate-slide-down flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-muted)]/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <PhoneCall size={17} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                Call & Contact Customer
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Choose your preferred communication channel
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto custom-scrollbar">
          {/* Client Card */}
          <div className="p-3 rounded-xl bg-[var(--bg-muted)]/40 border border-[var(--border)] space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand font-bold text-sm flex items-center justify-center shrink-0 border border-brand/20">
                  {clientName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                    {clientName}
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] truncate max-w-[200px]">
                    {subject}
                  </p>
                </div>
              </div>

              {leadCode && (
                <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border)] shrink-0">
                  {leadCode}
                </span>
              )}
            </div>

            {/* Phone Display Box with Quick Copy */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
              <div className="flex items-center gap-2 min-w-0">
                <Phone size={13} className="text-sky-500 shrink-0" />
                <span className="font-mono text-sm font-bold text-[var(--text-primary)] tracking-wide truncate">
                  {rawPhone || 'No phone number available'}
                </span>
              </div>

              {rawPhone && (
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className={`h-7 px-2.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 ${
                    copiedPhone
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-[var(--bg-muted)] text-[var(--text-primary)] hover:bg-slate-200 dark:hover:bg-slate-800 border border-[var(--border)]'
                  }`}
                  title="Copy Phone Number"
                >
                  {copiedPhone ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedPhone ? 'Copied!' : 'Copy'}</span>
                </button>
              )}
            </div>

            {clientEmail && (
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1">
                <span className="truncate max-w-[240px] font-mono text-[11px]">{clientEmail}</span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="text-[11px] text-brand hover:underline cursor-pointer flex items-center gap-1 shrink-0"
                >
                  {copiedEmail ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                  <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>

          {/* View Mode Toggle: Quick Channels vs QR Mobile Scan */}
          <div className="flex rounded-lg bg-[var(--bg-muted)]/80 p-0.5 border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setActiveTab('options')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'options'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <PhoneCall size={12} />
              <span>Direct Calling & WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'qr'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <QrCode size={12} />
              <span>Scan to Call on Mobile</span>
            </button>
          </div>

          {/* Tab 1: Direct Connect Options */}
          {activeTab === 'options' ? (
            <div className="space-y-2.5">
              {/* Option 1: WhatsApp Connect */}
              {rawPhone && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500 transition-all duration-150 cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                        <MessageCircle size={16} />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                          WhatsApp Chat & Call
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                            Recommended
                          </span>
                        </h4>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Connect instantly via WhatsApp Web or Desktop
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight
                      size={15}
                      className="text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                    />
                  </div>
                </a>
              )}

              {/* Option 2: System Dialer (with explicit user trigger) */}
              {rawPhone && (
                <button
                  type="button"
                  onClick={handleSystemDialerClick}
                  className="w-full group p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)]/50 hover:border-sky-400 transition-all duration-150 cursor-pointer text-left shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20 group-hover:scale-105 transition-transform">
                        <Smartphone size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[var(--text-primary)]">
                          Open System Calling App
                        </h4>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Use Windows Phone Link, Skype, or default PC dialer
                        </p>
                      </div>
                    </div>
                    <Phone
                      size={14}
                      className="text-sky-600 dark:text-sky-400 group-hover:translate-x-0.5 transition-transform"
                    />
                  </div>
                </button>
              )}
            </div>
          ) : (
            /* Tab 2: Scan QR to Call from Smartphone */
            <div className="p-4 rounded-xl bg-[var(--bg-muted)]/30 border border-[var(--border)] flex flex-col items-center text-center space-y-3">
              <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                <img
                  src={qrUrl}
                  alt="QR Code to dial phone"
                  className="w-36 h-36 rounded-lg object-contain"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-[var(--text-primary)] flex items-center justify-center gap-1.5">
                  <Smartphone size={13} className="text-brand" />
                  Scan with your smartphone camera
                </p>
                <p className="text-[11px] text-[var(--text-muted)] max-w-xs leading-relaxed">
                  Open your mobile phone camera and point it at the code to dial{' '}
                  <strong className="text-[var(--text-primary)] font-mono">{rawPhone}</strong> instantly without typing.
                </p>
              </div>
            </div>
          )}

          {/* Quick CRM Follow-Up: Update Status */}
          {onUpdateStatus && (
            <div className="pt-2 border-t border-[var(--border)] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Quick Status Update
                </span>
                {isUpdatingStatus && (
                  <span className="text-[10px] text-brand font-medium animate-pulse">
                    Updating...
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: 'contacted', label: 'In Follow-Up', color: 'hover:border-sky-500 hover:text-sky-600' },
                  { key: 'confirmed', label: 'Confirmed', color: 'hover:border-indigo-500 hover:text-indigo-600' },
                  { key: 'resolved', label: 'Completed', color: 'hover:border-emerald-500 hover:text-emerald-600' },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange(st.key)}
                    className={`py-1 px-2 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer text-center truncate ${st.color} ${
                      selectedStatus === st.key
                        ? 'bg-brand/10 border-brand text-brand'
                        : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Call Note */}
          {onAddNote && (
            <div className="pt-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                  <FileText size={11} />
                  Add Call Notes
                </span>
                {noteSaved && (
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 animate-fadeIn">
                    <CheckCircle2 size={11} /> Note Logged
                  </span>
                )}
              </div>
              <form onSubmit={handleSaveNote} className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. Call connected, customer asked for site visit on Sunday..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="flex-1 h-8 px-2.5 bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand placeholder:text-[var(--text-muted)]"
                />
                <button
                  type="submit"
                  disabled={!noteText.trim() || isSavingNote}
                  className="h-8 px-3 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  <Send size={11} />
                  <span>{isSavingNote ? 'Saving' : 'Save'}</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-muted)]/30 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3.5 rounded-lg text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] border border-[var(--border)] transition-all cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
