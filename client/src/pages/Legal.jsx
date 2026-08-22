import { useState, useEffect, useRef } from 'react';
import {
  Save,
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  RotateCcw,
  AlertTriangle,
  Info,
  CheckCircle2,
  Undo,
  Redo
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const LegalSettings = () => {
  const [activeTab, setActiveTab] = useState('terms');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMockMode, setIsMockMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('June 26, 2026');
  const textareaRef = useRef(null);

  // Content states
  const [contents, setContents] = useState({
    terms: '',
    privacy: ''
  });

  // History stack for custom Undo/Redo
  const [history, setHistory] = useState({
    terms: { past: [], future: [] },
    privacy: { past: [], future: [] }
  });

  // Toast feedback
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  // Helper to commit to history stack
  const updateContentsWithHistory = (newText) => {
    const currentText = contents[activeTab];
    if (currentText === newText) return;

    setHistory(prev => {
      const tabHistory = prev[activeTab];
      const newPast = [...tabHistory.past, currentText].slice(-100);
      return {
        ...prev,
        [activeTab]: {
          past: newPast,
          future: [] // Reset redo future stack on new actions
        }
      };
    });

    setContents(prev => ({
      ...prev,
      [activeTab]: newText
    }));
  };

  const applyFormat = (formatType) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let replacement;
    let selectionOffsetStart = 0;
    let selectionOffsetEnd = 0;

    switch (formatType) {
      case 'bold':
        replacement = `**${selectedText || 'bold text'}**`;
        selectionOffsetStart = 2;
        selectionOffsetEnd = selectedText ? replacement.length - 2 : replacement.length - 2;
        break;
      case 'italic':
        replacement = `*${selectedText || 'italic text'}*`;
        selectionOffsetStart = 1;
        selectionOffsetEnd = selectedText ? replacement.length - 1 : replacement.length - 1;
        break;
      case 'list':
        replacement = `\n- ${selectedText || 'list item'}`;
        selectionOffsetStart = 3;
        selectionOffsetEnd = replacement.length;
        break;
      case 'link': {
        const url = prompt('Enter URL:', 'https://');
        if (url === null) return; // User cancelled
        replacement = `[${selectedText || 'link text'}](${url})`;
        selectionOffsetStart = 1;
        selectionOffsetEnd = selectedText ? selectedText.length + 1 : 10;
        break;
      }
      default:
        return;
    }

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    updateContentsWithHistory(newContent);

    // Focus and select the replacement text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + selectionOffsetStart, start + selectionOffsetEnd);
    }, 0);
  };

  const handleUndo = () => {
    const tabHistory = history[activeTab];
    if (tabHistory.past.length === 0) return;

    const currentText = contents[activeTab];
    const previousText = tabHistory.past[tabHistory.past.length - 1];
    const newPast = tabHistory.past.slice(0, -1);
    const newFuture = [currentText, ...tabHistory.future];

    setHistory(prev => ({
      ...prev,
      [activeTab]: {
        past: newPast,
        future: newFuture
      }
    }));

    setContents(prev => ({
      ...prev,
      [activeTab]: previousText
    }));
  };

  const handleRedo = () => {
    const tabHistory = history[activeTab];
    if (tabHistory.future.length === 0) return;

    const currentText = contents[activeTab];
    const nextText = tabHistory.future[0];
    const newPast = [...tabHistory.past, currentText];
    const newFuture = tabHistory.future.slice(1);

    setHistory(prev => ({
      ...prev,
      [activeTab]: {
        past: newPast,
        future: newFuture
      }
    }));

    setContents(prev => ({
      ...prev,
      [activeTab]: nextText
    }));
  };

  const handleKeyDown = (e) => {
    const isCtrl = e.ctrlKey || e.metaKey;
    
    if (isCtrl && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
    } else if (isCtrl && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      handleRedo();
    }
  };

  const handleBlur = () => {
    const currentText = contents[activeTab];
    setHistory(prev => {
      const tabHistory = prev[activeTab];
      const lastSaved = tabHistory.past[tabHistory.past.length - 1];
      if (lastSaved === currentText) return prev;
      return {
        ...prev,
        [activeTab]: {
          past: [...tabHistory.past, currentText].slice(-100),
          future: []
        }
      };
    });
  };

  // 1. Load mock data fallback
  const loadMockContent = () => {
    const saved = localStorage.getItem('gharmb_legal_contents');
    const savedDate = localStorage.getItem('gharmb_legal_last_updated');
    if (saved) {
      try {
        setContents(JSON.parse(saved));
        if (savedDate) setLastUpdated(savedDate);
        return;
      } catch (err) {
        console.error('Error parsing mock legal contents:', err);
      }
    }
    
    // Default initial contents
    const defaultContents = {
      terms: "1. Acceptance of Terms\nBy accessing and using the GHARMB admin platform, you accept and agree to be bound by the terms and provision of this agreement.\n\n2. Administrator Responsibilities\nAs an authorized administrator, you are responsible for maintaining the confidentiality of your account credentials. All actions performed under your account, including property verification approvals and builder suspensions, are logged and audited.\n\n3. Data Usage & Modification\nThe platform aggregates sensitive real estate data. You agree not to reproduce, duplicate, copy, sell, or exploit any portion of the Service without express written permission.",
      privacy: "Information Collection\nWe collect information to provide better services to our users. For administrative users, this includes login logs, IP addresses, action history, and performance metrics to ensure platform security.\n\nHow We Use Information\nThe data collected on the GHARMB platform is utilized strictly for providing, maintaining, and improving our services, developing new features, and protecting GHARMB.\n\nData Security\nWe work hard to protect GHARMB and our users from unauthorized access to or unauthorized alteration, disclosure, or destruction of information we hold. We use robust encryption protocols for all database communications."
    };
    setContents(defaultContents);
    setLastUpdated('June 26, 2026');
  };

  // 2. Fetch legal content from MongoDB API
  const fetchLegalContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token || token === 'mock_admin_token_2026') {
        setIsMockMode(true);
        loadMockContent();
        setLoading(false);
        return;
      }

      // Fetch both terms and privacy policies in parallel
      const [responseTerms, responsePrivacy] = await Promise.all([
        fetch(`${API_URL}/admin/legal/terms`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/admin/legal/privacy-policy`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      let termsText = '';
      let privacyText = '';
      let latestUpdatedTime = 0;
      let dateString = lastUpdated;

      if (responseTerms.ok) {
        const termsData = await responseTerms.json();
        if (termsData.data && termsData.data.legalContent) {
          termsText = termsData.data.legalContent.content;
          const termsDate = new Date(termsData.data.legalContent.updatedAt);
          if (termsDate.getTime() > latestUpdatedTime) {
            latestUpdatedTime = termsDate.getTime();
            dateString = termsDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          }
        }
      }

      if (responsePrivacy.ok) {
        const privacyData = await responsePrivacy.json();
        if (privacyData.data && privacyData.data.legalContent) {
          privacyText = privacyData.data.legalContent.content;
          const privacyDate = new Date(privacyData.data.legalContent.updatedAt);
          if (privacyDate.getTime() > latestUpdatedTime) {
            latestUpdatedTime = privacyDate.getTime();
            dateString = privacyDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          }
        }
      }

      // If at least one call worked, populate states
      if (responseTerms.ok || responsePrivacy.ok) {
        setContents({
          terms: termsText || contents.terms,
          privacy: privacyText || contents.privacy
        });
        setLastUpdated(dateString);
        setIsMockMode(false);
        setHistory({
          terms: { past: [], future: [] },
          privacy: { past: [], future: [] }
        });
      } else {
        // Both requests failed (e.g. 404 or DB empty, but server responsive)
        setIsMockMode(true);
        loadMockContent();
      }
    } catch (err) {
      console.warn('API logs fetch failed. Using local storage logs.', err);
      setError('Could not sync legal policies with backend. Make sure the server is running on port 5001.');
      loadMockContent();
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchLegalContent();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleContentChange = (e) => {
    setContents({ ...contents, [activeTab]: e.target.value });
  };

  // 3. Save Legal Content changes back to MongoDB
  const handleSave = async () => {
    if (!contents[activeTab] || !contents[activeTab].trim()) {
      triggerToast('Document content cannot be empty.', 'error');
      return;
    }

    setIsSaving(true);
    const apiType = activeTab === 'terms' ? 'terms' : 'privacy-policy';
    const docTitle = activeTab === 'terms' ? 'Terms of Service' : 'Privacy Policy';
    const textToSend = contents[activeTab];

    try {
      const token = localStorage.getItem('adminToken');
      if (!token || token === 'mock_admin_token_2026') {
        // Fallback local save
        setTimeout(() => {
          const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          setLastUpdated(today);
          const updatedContents = { ...contents, [activeTab]: textToSend };
          localStorage.setItem('gharmb_legal_contents', JSON.stringify(updatedContents));
          localStorage.setItem('gharmb_legal_last_updated', today);
          setIsSaving(false);
          triggerToast(`${docTitle} published successfully (Sandbox Mode)!`);
        }, 800);
        return;
      }

      const response = await fetch(`${API_URL}/admin/legal/${apiType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: docTitle,
          content: textToSend
        })
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        setLastUpdated(today);
        // Sync local storage copy
        const updatedContents = { ...contents, [activeTab]: textToSend };
        localStorage.setItem('gharmb_legal_contents', JSON.stringify(updatedContents));
        localStorage.setItem('gharmb_legal_last_updated', today);
        triggerToast(`${docTitle} updated successfully on database!`);
      } else {
        triggerToast(data.message || `Failed to update ${docTitle} on database.`, 'error');
      }
    } catch (err) {
      console.error('Error saving legal content:', err);
      triggerToast('Backend connection failed. Could not write to MongoDB.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Popup */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 py-3.5 px-6 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up border ${
          toast.type === 'success' 
            ? 'bg-emerald-950 border-emerald-800 text-emerald-300' 
            : 'bg-rose-950 border-rose-800 text-rose-300'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="text-emerald-400 shrink-0" size={18} />
          ) : (
            <AlertTriangle className="text-rose-400 shrink-0" size={18} />
          )}
          <div className="text-xs">
            <p className="font-extrabold text-white">{toast.type === 'success' ? 'Changes Saved' : 'Operation Error'}</p>
            <p className={`text-[10px] ${toast.type === 'success' ? 'text-emerald-400/90' : 'text-rose-400/90'}`}>{toast.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Legal Documents</h2>
          <p className="text-xs text-[var(--text-subtle)] mt-1">Configure Terms of Service and Privacy Policy contents dynamically saved to database.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-dark text-white text-xs font-black rounded-xl shadow-lg shadow-brand/10 transition-all disabled:opacity-70 cursor-pointer"
        >
          <Save size={14} />
          {isSaving ? 'Publishing...' : 'Publish Changes'}
        </button>
      </div>

      {/* Error & Sandbox Banners */}
      {error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="shrink-0 text-rose-500" size={18} />
            <div>
              <p className="font-extrabold text-[var(--text-primary)]">Legal Database Sync Failed</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{error}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={fetchLegalContent}
            className="w-full sm:w-auto px-4 py-2 bg-rose-500 text-white hover:bg-rose-600 rounded-xl font-bold transition-all text-[10px] cursor-pointer shadow-md shadow-rose-500/10"
          >
            Retry Sync
          </button>
        </div>
      ) : isMockMode ? (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center gap-3 text-xs animate-fade-in">
          <Info className="shrink-0 text-amber-500" size={18} />
          <div>
            <p className="font-extrabold text-[var(--text-primary)]">Sandbox Simulation Active</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Showing mock legal content in localStorage cache. Please sign in with a real administrator account to write to MongoDB.</p>
          </div>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="border-b border-[var(--border)]">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('terms')}
            className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
              activeTab === 'terms' ? 'text-brand font-black' : 'text-[var(--text-subtle)] hover:text-[var(--text-primary)]'
            }`}
          >
            Terms of Service
            {activeTab === 'terms' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-t-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
              activeTab === 'privacy' ? 'text-brand font-black' : 'text-[var(--text-subtle)] hover:text-[var(--text-primary)]'
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
        
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-muted)]">
          <div className="flex items-center gap-1">
            <button 
              type="button" 
              onClick={() => applyFormat('bold')} 
              className="p-1.5 text-[var(--text-subtle)] hover:bg-[var(--border)] rounded transition-colors cursor-pointer" 
              title="Bold"
            >
              <Bold size={15} />
            </button>
            <button 
              type="button" 
              onClick={() => applyFormat('italic')} 
              className="p-1.5 text-[var(--text-subtle)] hover:bg-[var(--border)] rounded transition-colors cursor-pointer" 
              title="Italic"
            >
              <Italic size={15} />
            </button>
            <div className="w-px h-5 bg-slate-300 mx-1"></div>
            <button 
              type="button" 
              onClick={() => applyFormat('list')} 
              className="p-1.5 text-[var(--text-subtle)] hover:bg-[var(--border)] rounded transition-colors cursor-pointer" 
              title="Bullet List"
            >
              <List size={15} />
            </button>
            <button 
              type="button" 
              onClick={() => applyFormat('link')} 
              className="p-1.5 text-[var(--text-subtle)] hover:bg-[var(--border)] rounded transition-colors cursor-pointer" 
              title="Add Link"
            >
              <LinkIcon size={15} />
            </button>
            <div className="w-px h-5 bg-slate-300 mx-1"></div>
            <button 
              type="button" 
              onClick={handleUndo} 
              disabled={history[activeTab].past.length === 0}
              className="p-1.5 text-[var(--text-subtle)] hover:bg-[var(--border)] disabled:opacity-30 rounded transition-colors cursor-pointer" 
              title="Undo (Ctrl+Z)"
            >
              <Undo size={15} />
            </button>
            <button 
              type="button" 
              onClick={handleRedo} 
              disabled={history[activeTab].future.length === 0}
              className="p-1.5 text-[var(--text-subtle)] hover:bg-[var(--border)] disabled:opacity-30 rounded transition-colors cursor-pointer" 
              title="Redo (Ctrl+Y)"
            >
              <Redo size={15} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] flex items-center gap-1">
              <RotateCcw size={10} /> Last updated: {lastUpdated}
            </span>
          </div>
        </div>

        {/* Text Area */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-brand/20 border-t-brand animate-spin"></div>
              <p className="text-xs text-[var(--text-subtle)]">Loading document details from database...</p>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={contents[activeTab]}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder={`Enter your ${activeTab === 'terms' ? 'Terms of Service' : 'Privacy Policy'} content here...`}
              className="w-full min-h-[400px] text-sm text-[var(--text-subtle)] leading-relaxed bg-transparent border-0 focus:ring-0 resize-none outline-none custom-scrollbar"
            />
          )}
        </div>

      </div>
    </div>
  );
};

export default LegalSettings;