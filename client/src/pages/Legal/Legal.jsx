import React, { useState, useEffect } from 'react';
import { Save, Bold, Italic, List, Link as LinkIcon, RotateCcw } from 'lucide-react';

const LegalSettings = () => {
  const [activeTab, setActiveTab] = useState('terms');
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => {
    return localStorage.getItem('gharmb_legal_last_updated') || 'June 26, 2026';
  });

  // Admin editable states
  const [contents, setContents] = useState(() => {
    const saved = localStorage.getItem('gharmb_legal_contents');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Error parsing gharmb_legal_contents:', err);
      }
    }
    return {
      terms: "1. Acceptance of Terms\nBy accessing and using the GHARMB admin platform, you accept and agree to be bound by the terms and provision of this agreement.\n\n2. Administrator Responsibilities\nAs an authorized administrator, you are responsible for maintaining the confidentiality of your account credentials. All actions performed under your account, including property verification approvals and builder suspensions, are logged and audited.\n\n3. Data Usage & Modification\nThe platform aggregates sensitive real estate data. You agree not to reproduce, duplicate, copy, sell, or exploit any portion of the Service without express written permission.",
      privacy: "Information Collection\nWe collect information to provide better services to our users. For administrative users, this includes login logs, IP addresses, action history, and performance metrics to ensure platform security.\n\nHow We Use Information\nThe data collected on the GHARMB platform is utilized strictly for providing, maintaining, and improving our services, developing new features, and protecting GHARMB.\n\nData Security\nWe work hard to protect GHARMB and our users from unauthorized access to or unauthorized alteration, disclosure, or destruction of information we hold. We use robust encryption protocols for all database communications."
    };
  });

  const handleContentChange = (e) => {
    setContents({ ...contents, [activeTab]: e.target.value });
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      setLastUpdated(today);
      localStorage.setItem('gharmb_legal_contents', JSON.stringify(contents));
      localStorage.setItem('gharmb_legal_last_updated', today);
      alert(`${activeTab === 'terms' ? 'Terms of Service' : 'Privacy Policy'} updated successfully!`);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Legal Documents</h2>
          <p className="text-xs text-[var(--text-subtle)] mt-1">Update Terms of Service and Privacy Policy content.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white text-xs font-bold rounded-xl shadow-md shadow-brand/20 transition-all disabled:opacity-70"
        >
          <Save size={14} />
          {isSaving ? 'Publishing...' : 'Publish Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--border)]">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('terms')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'terms' ? 'text-brand' : 'text-[var(--text-subtle)] hover:text-[var(--text-subtle)]'
            }`}
          >
            Terms of Service
            {activeTab === 'terms' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-t-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'privacy' ? 'text-brand' : 'text-[var(--text-subtle)] hover:text-[var(--text-subtle)]'
            }`}
          >
            Privacy Policy
            {activeTab === 'privacy' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-t-full"></span>
            )}
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] shadow-sm flex flex-col overflow-hidden">
        
        {/* Editor Toolbar (Simulated) */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-muted)]">
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-[var(--text-subtle)] hover:bg-[var(--border)] rounded transition-colors" title="Bold"><Bold size={16} /></button>
            <button className="p-1.5 text-[var(--text-subtle)] hover:bg-[var(--border)] rounded transition-colors" title="Italic"><Italic size={16} /></button>
            <div className="w-px h-5 bg-slate-300 mx-1"></div>
            <button className="p-1.5 text-[var(--text-subtle)] hover:bg-[var(--border)] rounded transition-colors" title="Bullet List"><List size={16} /></button>
            <button className="p-1.5 text-[var(--text-subtle)] hover:bg-[var(--border)] rounded transition-colors" title="Add Link"><LinkIcon size={16} /></button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] flex items-center gap-1">
              <RotateCcw size={10} /> Last updated: {lastUpdated}
            </span>
          </div>
        </div>

        {/* Text Area */}
        <div className="p-6">
          <textarea
            value={contents[activeTab]}
            onChange={handleContentChange}
            placeholder={`Enter your ${activeTab === 'terms' ? 'Terms of Service' : 'Privacy Policy'} content here...`}
            className="w-full min-h-[400px] text-sm text-[var(--text-subtle)] leading-relaxed bg-transparent border-0 focus:ring-0 resize-none outline-none custom-scrollbar"
          />
        </div>

      </div>
    </div>
  );
};

export default LegalSettings;