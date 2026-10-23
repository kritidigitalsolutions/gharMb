import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import AdminLoader from '../components/common/AdminLoader';
import {
  Bold, Italic, List, Link as LinkIcon, AlertTriangle,
  CheckCircle2, Undo, Redo, Heading2, Heading3, ListOrdered, Plus, Trash2,
  FileText, Eye, Sparkles, RefreshCw, Loader2,
  Columns2, Settings, Lock,
  Quote, PenLine, Smartphone
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import API from '../api/api';
import Badge from '../components/ui/Badge';

const slugify = (text) => {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// Helper to convert rich HTML into clean formatted plain text for mobile apps (removes raw HTML tags)
const htmlToCleanPlainText = (html) => {
  if (!html) return '';
  return html
    .replace(/<h[1-2][^>]*>(.*?)<\/h[1-2]>/gi, '\n\n$1\n\n')
    .replace(/<h[3-6][^>]*>(.*?)<\/h[3-6]>/gi, '\n\n$1\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*[/]?>/gi, '\n')
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '\n> $1\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

// Global in-memory cache for instant switching
let globalPoliciesCache = null;

const LegalSettings = () => {
  const [policies, setPolicies] = useState(() => globalPoliciesCache || []);
  const [activeSlug, setActiveSlug] = useState('terms');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // View mode: 'split' (side-by-side) | 'editor' | 'preview'
  const [viewMode, setViewMode] = useState('split');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Form state
  const [policyForm, setPolicyForm] = useState({
    _id: null,
    title: '',
    slug: '',
    shortDescription: '',
    status: 'published',
    platform: 'both',
    showInFooter: true,
    displayOrder: 1,
    content: '',
    isSystem: false
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(() => !globalPoliciesCache);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');

  // Toast feedback
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const toastTimeoutRef = useRef(null);

  // Custom link input modal
  const [linkModal, setLinkModal] = useState({ open: false, value: '' });
  const linkModalInputRef = useRef(null);

  const triggerToast = useCallback((message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  }, []);

  const abortControllerRef = useRef(null);

  // TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }
      }),
      Underline,
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Draft your terms, privacy policy, or legal guidelines here...' })
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'w-full min-h-full text-xs text-[var(--text-primary)] leading-[1.55] bg-transparent border-0 focus:ring-0 outline-none max-w-none'
      },
      handlePaste: (view, event) => {
        const text = event.clipboardData.getData('text/plain');
        const htmlData = event.clipboardData.getData('text/html');
        if (htmlData) return false;

        if (text) {
          const lines = text.split('\n');
          let inUl = false;
          let inOl = false;
          let newLines = [];

          for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) {
              if (inUl) { newLines.push('</ul>'); inUl = false; }
              if (inOl) { newLines.push('</ol>'); inOl = false; }
              newLines.push('');
              continue;
            }
            if (line.startsWith('•') || line.startsWith('-')) {
              if (inOl) { newLines.push('</ol>'); inOl = false; }
              if (!inUl) { newLines.push('<ul>'); inUl = true; }
              newLines.push(`<li>${line.substring(1).trim()}</li>`);
              continue;
            }
            const numMatch = line.match(/^(\d+)\.\s+(.*)/);
            if (numMatch) {
              const currentNum = parseInt(numMatch[1], 10);
              const nextLine = (lines[i + 1] || '').trim();
              const nextNumMatch = nextLine.match(/^(\d+)\.\s+/);
              if (nextNumMatch && parseInt(nextNumMatch[1], 10) === currentNum + 1) {
                if (inUl) { newLines.push('</ul>'); inUl = false; }
                if (!inOl) { newLines.push('<ol>'); inOl = true; }
                newLines.push(`<li>${numMatch[2].trim()}</li>`);
                continue;
              } else if (inOl && currentNum > 1) {
                newLines.push(`<li>${numMatch[2].trim()}</li>`);
                continue;
              } else {
                if (inUl) { newLines.push('</ul>'); inUl = false; }
                if (inOl) { newLines.push('</ol>'); inOl = false; }
                newLines.push(`<h2>${line}</h2>`);
                continue;
              }
            }
            if (inUl) newLines.push('</ul>');
            if (inOl) newLines.push('</ol>');
            newLines.push(line);
          }
          if (inUl) newLines.push('</ul>');
          if (inOl) newLines.push('</ol>');

          const paragraphs = newLines.join('\n').split(/\n{2,}/).map(p => {
            const t = p.trim();
            if (!t) return '';
            if (t.startsWith('<ul') || t.startsWith('<ol') || t.startsWith('<h')) return t;
            return `<p>${t.replace(/\n/g, '<br>')}</p>`;
          }).join('');

          setTimeout(() => {
            view.state.tr.insertText('');
            editor.commands.insertContent(paragraphs);
          }, 0);
          event.preventDefault();
          return true;
        }
        return false;
      }
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      setPolicyForm(prev => ({ ...prev, content: html }));
    }
  });

  // Switch policy
  const selectPolicyBySlug = useCallback((slugToSelect, policyList = policies) => {
    const list = (policyList && policyList.length > 0) ? policyList : policies;
    if (!list || list.length === 0) return;

    const found = list.find(p => p.slug === slugToSelect || p.type === slugToSelect) || list[0];
    if (found) {
      setIsCreatingNew(false);
      const activeTypeOrSlug = found.slug || found.type || 'terms';
      setActiveSlug(activeTypeOrSlug);

      const newForm = {
        _id: found._id || null,
        title: found.title || '',
        slug: found.slug || found.type || '',
        shortDescription: found.shortDescription || '',
        status: found.status || 'published',
        platform: found.platform || 'both',
        showInFooter: found.showInFooter !== false,
        displayOrder: found.displayOrder || 1,
        content: found.content || '',
        isSystem: Boolean(found.isSystem || found.type === 'terms' || found.type === 'privacy-policy')
      };
      setPolicyForm(newForm);

      const d = found.updatedAt ? new Date(found.updatedAt) : new Date();
      setLastUpdated(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));

      if (editor && !editor.isDestroyed) {
        try {
          if (editor.getHTML() !== (found.content || '')) {
            editor.commands.setContent(found.content || '');
          }
        } catch (e) {
          console.warn('Editor sync notice:', e);
        }
      }
    }
  }, [policies, editor]);

  // Fetch policies
  const fetchPolicies = useCallback(async (targetSlug = null, silent = false) => {
    if (!silent && !globalPoliciesCache) {
      setLoading(true);
    } else {
      setIsRevalidating(true);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    let loadedPolicies = [];
    let fetchError = null;

    try {
      const res = await API.get('/admin/legal/policies', {
        signal: abortControllerRef.current.signal
      });
      loadedPolicies = res.data?.data?.policies || [];
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      if (err.message === 'Admin session expired' || err.response?.status === 401) {
        setLoading(false);
        setIsRevalidating(false);
        return;
      }
      fetchError = err.response?.data?.message || 'Unable to sync policies.';
    }

    if (fetchError) {
      if (!globalPoliciesCache) setError(fetchError);
      setLoading(false);
      setIsRevalidating(false);
      return;
    }

    if (loadedPolicies.length > 0) {
      setError(null);
      globalPoliciesCache = loadedPolicies;
      setPolicies(loadedPolicies);
      selectPolicyBySlug(targetSlug || activeSlug || 'terms', loadedPolicies);
    }

    setLoading(false);
    setIsRevalidating(false);
  }, [activeSlug, selectPolicyBySlug]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchPolicies(activeSlug, Boolean(globalPoliciesCache));
    }, 0);
    return () => {
      clearTimeout(t);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editor && !editor.isDestroyed && !loading && policyForm.content) {
      try {
        if (editor.getHTML() !== policyForm.content) {
          editor.commands.setContent(policyForm.content || '');
        }
      } catch (e) {
        console.warn('Editor sync notice:', e);
      }
    }
  }, [editor, activeSlug, isCreatingNew, loading, policyForm.content]);

  // Start new policy
  const handleStartAddNew = () => {
    setIsCreatingNew(true);
    setActiveSlug('new-policy');
    const newDraftForm = {
      _id: null,
      title: 'New Policy',
      slug: 'new-policy',
      shortDescription: '',
      status: 'draft',
      platform: 'both',
      showInFooter: true,
      displayOrder: policies.length + 1,
      content: '<h2>1. Introduction</h2><p>State policy terms and rules here.</p>',
      isSystem: false
    };
    setPolicyForm(newDraftForm);
    setLastUpdated('Draft');
    setShowSettingsModal(true);
    if (editor && !editor.isDestroyed) {
      editor.commands.setContent(newDraftForm.content);
      editor.commands.focus();
    }
  };

  // Save / Publish
  const handleSave = useCallback(async (overrideStatus = null) => {
    const currentStatus = overrideStatus || policyForm.status || 'published';
    const contentToSave = editor ? editor.getHTML() : policyForm.content;

    if (!policyForm.title.trim()) {
      triggerToast('Title is required.', 'error');
      return;
    }

    if (!contentToSave || !contentToSave.trim() || contentToSave === '<p></p>') {
      triggerToast('Document content cannot be empty.', 'error');
      return;
    }

    const finalSlug = policyForm.isSystem
      ? policyForm.slug
      : (policyForm.slug.trim() ? slugify(policyForm.slug) : slugify(policyForm.title));

    if (!finalSlug) {
      triggerToast('A valid slug is required.', 'error');
      return;
    }

    // Auto-clean plain text for mobile app
    const cleanPlainText = htmlToCleanPlainText(contentToSave);

    const previousPoliciesSnapshot = [...policies];
    const previousFormSnapshot = { ...policyForm };

    const payload = {
      title: policyForm.title.trim(),
      slug: finalSlug,
      shortDescription: policyForm.shortDescription.trim(),
      content: contentToSave,
      plainText: cleanPlainText, // Dedicated field for mobile app
      status: currentStatus,
      platform: policyForm.platform || 'both',
      showInFooter: Boolean(policyForm.showInFooter),
      displayOrder: Number(policyForm.displayOrder) || 1,
      isSystem: Boolean(policyForm.isSystem),
      updatedAt: new Date().toISOString()
    };

    setIsSaving(true);
    const optimisticPolicies = isCreatingNew
      ? [...policies, { ...payload, _id: 'temp_' + Date.now() }]
      : policies.map(p => (p.slug === finalSlug || p.slug === activeSlug || p.type === activeSlug ? { ...p, ...payload } : p));

    if (isCreatingNew) {
      const newOptimisticItem = optimisticPolicies[optimisticPolicies.length - 1];
      setPolicies(optimisticPolicies);
      setIsCreatingNew(false);
      setActiveSlug(finalSlug);
      setPolicyForm(newOptimisticItem);
    } else {
      setPolicies(optimisticPolicies);
      setPolicyForm(prev => ({ ...prev, ...payload }));
    }

    globalPoliciesCache = optimisticPolicies;
    setLastUpdated('Just now');
    setShowSettingsModal(false);
    triggerToast(`${payload.title} ${currentStatus === 'draft' ? 'saved as draft' : 'published live'}!`, 'success');

    try {
      let res;
      if (previousFormSnapshot._id && !previousFormSnapshot._id.toString().startsWith('temp_')) {
        const targetTypeOrSlug = previousFormSnapshot.slug || activeSlug;
        res = await API.put(`/admin/legal/${targetTypeOrSlug}`, payload);
      } else {
        res = await API.post('/admin/legal/policies', payload);
      }

      if (res.status === 200 || res.status === 201) {
        const savedDoc = res.data?.data?.policy || res.data?.data?.legalContent;
        if (savedDoc) {
          setPolicies(prev => prev.map(p => (p.slug === finalSlug ? { ...p, ...savedDoc } : p)));
          setPolicyForm(prev => (prev.slug === finalSlug ? { ...prev, ...savedDoc } : prev));
          globalPoliciesCache = optimisticPolicies;
        }
      }
    } catch (err) {
      console.error('Save policy error:', err);
      setPolicies(previousPoliciesSnapshot);
      setPolicyForm(previousFormSnapshot);
      globalPoliciesCache = previousPoliciesSnapshot;
      triggerToast('Failed to save to server.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [editor, policyForm, policies, isCreatingNew, activeSlug, triggerToast]);

  // Delete policy
  const handleDeletePolicy = async () => {
    if (policyForm.isSystem || policyForm.slug === 'terms' || policyForm.slug === 'privacy-policy') {
      triggerToast('System policies cannot be deleted.', 'error');
      return;
    }

    if (!window.confirm(`Delete "${policyForm.title}"?`)) return;

    const targetId = policyForm._id || policyForm.slug || activeSlug;
    const targetSlug = policyForm.slug || activeSlug;
    const remaining = policies.filter(p => p.slug !== targetSlug && p._id !== targetId);

    setPolicies(remaining);
    globalPoliciesCache = remaining;
    if (remaining.length > 0) {
      selectPolicyBySlug(remaining[0].slug, remaining);
    } else {
      handleStartAddNew();
    }
    setShowSettingsModal(false);
    triggerToast('Policy deleted.', 'success');

    try {
      setIsDeleting(true);
      await API.delete(`/admin/legal/policies/${targetId}`);
    } catch (e) {
      console.error('Delete error:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave(e.shiftKey ? 'published' : 'draft');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const addLink = () => {
    const existing = editor?.getAttributes('link').href || '';
    setLinkModal({ open: true, value: existing });
    setTimeout(() => linkModalInputRef.current?.focus(), 50);
  };

  const confirmLink = () => {
    const url = linkModal.value.trim();
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setLinkModal({ open: false, value: '' });
  };

  // Word count & read time
  const stats = useMemo(() => {
    if (!policyForm.content) return { words: 0, readTime: 1 };
    const clean = policyForm.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = clean ? clean.split(/\s+/).length : 0;
    return { words, readTime: Math.max(1, Math.ceil(words / 200)) };
  }, [policyForm.content]);

  return (
    <div className="h-[calc(100vh-126px)] max-h-[calc(100vh-126px)] flex flex-col gap-2 w-full overflow-hidden">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-5 right-5 z-50 py-2.5 px-4 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold border backdrop-blur-md ${
          toast.type === 'success' ? 'bg-emerald-950/95 border-emerald-700/60 text-emerald-200' : 'bg-rose-950/95 border-rose-700/60 text-rose-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={15} className="text-emerald-400" /> : <AlertTriangle size={15} className="text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Custom Link URL Modal ── */}
      {linkModal.open && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
          onClick={() => setLinkModal({ open: false, value: '' })}
        >
          <div
            className="w-[400px] max-w-[92vw] rounded-2xl border border-[var(--border)] overflow-hidden"
            style={{
              background: 'var(--bg-surface)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.2)',
              animation: 'linkModalIn 0.2s cubic-bezier(.34,1.56,.64,1)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Top accent bar */}
            <div style={{ height: 3, background: 'linear-gradient(90deg, #FF5A3C, #FF8C6B)' }} />

            {/* Header */}
            <div className="px-5 pt-4 pb-3 flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,90,60,0.12)', border: '1px solid rgba(255,90,60,0.25)' }}
              >
                <LinkIcon size={14} style={{ color: '#FF5A3C' }} />
              </div>
              <div>
                <p className="text-[13.5px] font-bold text-[var(--text-primary)] leading-tight">Insert Link</p>
                <p className="text-[11px] text-[var(--text-muted)] leading-tight mt-0.5">Enter a URL or relative path</p>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-5 h-px bg-[var(--border)]" />

            {/* Body */}
            <div className="px-5 py-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">URL</label>
                <div className="relative">
                  <input
                    ref={linkModalInputRef}
                    type="text"
                    value={linkModal.value}
                    onChange={e => setLinkModal(p => ({ ...p, value: e.target.value }))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') confirmLink();
                      if (e.key === 'Escape') setLinkModal({ open: false, value: '' });
                    }}
                    placeholder="https://example.com or /contact"
                    className="w-full rounded-xl text-[13px] text-[var(--text-primary)] pl-3 pr-3 py-2.5 outline-none placeholder:text-[var(--text-muted)] transition-all"
                    style={{
                      background: 'var(--bg-muted)',
                      border: '1.5px solid var(--border)',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#FF5A3C'; e.target.style.boxShadow = '0 0 0 3px rgba(255,90,60,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              {linkModal.value && (
                <button
                  type="button"
                  onClick={() => {
                    editor?.chain().focus().extendMarkRange('link').unsetLink().run();
                    setLinkModal({ open: false, value: '' });
                  }}
                  className="text-[11px] font-medium flex items-center gap-1.5 self-start transition-colors"
                  style={{ color: '#FF5A3C' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <span className="text-[10px]">✕</span> Remove existing link
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-4 pt-1 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setLinkModal({ open: false, value: '' })}
                className="px-4 py-2 rounded-xl text-[12.5px] font-semibold border border-[var(--border)] text-[var(--text-muted)] transition-all"
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLink}
                className="px-4 py-2 rounded-xl text-[12.5px] font-bold text-white transition-all active:scale-95 flex items-center gap-1.5"
                style={{ background: 'linear-gradient(135deg, #FF6B4A 0%, #FF5A3C 60%, #E84528 100%)', boxShadow: '0 2px 8px rgba(255,90,60,0.35)' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,90,60,0.5)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(255,90,60,0.35)'}
              >
                <LinkIcon size={12} />
                Apply Link
              </button>
            </div>
          </div>
          <style>{`@keyframes linkModalIn { from { opacity:0; transform:scale(0.9) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        </div>
      )}

      {/* ── 1. MINIMAL HEADER BAR ── */}
      <div className="shrink-0 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        {/* Left: Title & Tabs */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">Legal Policies</h1>
            <Badge color="sky" variant="pastel" size="xs">Web & App</Badge>
            {isRevalidating && <Loader2 size={11} className="animate-spin text-brand" />}
          </div>

          <div className="h-3.5 w-px bg-[var(--border)] hidden sm:block"></div>

          {/* Segmented Pills */}
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
            {policies.map(p => {
              const isSelected = !isCreatingNew && (activeSlug === p.slug || activeSlug === p.type);
              return (
                <button
                  key={p._id || p.slug || p.type}
                  type="button"
                  onClick={() => selectPolicyBySlug(p.slug || p.type)}
                  className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-brand/10 text-brand font-bold border border-brand/20'
                      : 'text-[var(--text-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] border border-transparent'
                  }`}
                >
                  <FileText size={11} className={isSelected ? 'text-brand' : 'opacity-50'} />
                  <span>{p.title}</span>
                  {p.status === 'draft' ? (
                    <Badge.Pending size="2xs">Draft</Badge.Pending>
                  ) : (
                    <Badge.Active size="2xs">Live</Badge.Active>
                  )}
                </button>
              );
            })}

            {isCreatingNew && (
              <span className="h-7 px-2.5 rounded-lg text-[11px] font-bold bg-brand/15 text-brand border border-brand/30 flex items-center">
                New Policy
              </span>
            )}

            <button
              type="button"
              onClick={handleStartAddNew}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-brand hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
              title="Add Policy"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* View toggle */}
          <div className="inline-flex items-center p-0.5 bg-[var(--bg-muted)] rounded-lg border border-[var(--border)] text-xs">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`w-6 h-6 flex items-center justify-center rounded-md transition-all cursor-pointer ${viewMode === 'split' ? 'bg-[var(--bg-surface)] text-brand shadow-2xs font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              title="Split View (Side by Side)"
            >
              <Columns2 size={12} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`w-6 h-6 flex items-center justify-center rounded-md transition-all cursor-pointer ${viewMode === 'editor' ? 'bg-[var(--bg-surface)] text-brand shadow-2xs font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              title="Editor Only"
            >
              <PenLine size={12} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`w-6 h-6 flex items-center justify-center rounded-md transition-all cursor-pointer ${viewMode === 'preview' ? 'bg-[var(--bg-surface)] text-brand shadow-2xs font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              title="Preview Only"
            >
              <Eye size={12} />
            </button>
          </div>

          {/* Settings / Edit Details */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-brand hover:bg-[var(--bg-muted)] transition-colors cursor-pointer border border-[var(--border)]"
            title="Policy Settings & Details"
          >
            <Settings size={12} />
          </button>

          <button
            type="button"
            onClick={() => handleSave('draft')}
            disabled={isSaving}
            className="h-7 px-2.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-subtle)] text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => handleSave('published')}
            disabled={isSaving}
            className="h-7 flex items-center gap-1.5 px-3 bg-brand hover:bg-brand-dark text-white text-[11px] font-bold rounded-lg transition-all shadow-2xs cursor-pointer"
          >
            <Sparkles size={11} />
            <span>{isSaving ? 'Publishing...' : 'Publish'}</span>
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="shrink-0 p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl flex items-center justify-between text-xs font-semibold">
          <span>{error}</span>
          <button onClick={() => fetchPolicies()} className="flex items-center gap-1 underline cursor-pointer">
            <RefreshCw size={11} /> Retry
          </button>
        </div>
      )}

      {/* ── 2. WORKSPACE: COMPACT EDITOR + ONE CLEAN PREVIEW ── */}
      <div className={`flex-1 min-h-0 grid gap-2.5 overflow-hidden ${
        viewMode === 'split'
          ? 'grid-cols-1 lg:grid-cols-2 grid-rows-1 items-stretch'
          : 'grid-cols-1 grid-rows-1 w-full'
      }`}>
        {/* ─── LEFT: COMPACT EDITOR ─── */}
        {(viewMode === 'split' || viewMode === 'editor') && (
          <div className="h-full min-h-0 flex flex-col bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] shadow-2xs overflow-hidden">
            {/* Toolbar - Compact & Neat */}
            <div className="shrink-0 px-2.5 py-1 border-b border-[var(--border)] bg-[var(--bg-muted)]/50 flex flex-wrap items-center justify-between gap-1 text-xs">
              <div className="flex items-center gap-0.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`w-6 h-6 flex items-center justify-center rounded transition-colors cursor-pointer ${editor?.isActive('bold') ? 'bg-brand/15 text-brand font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                  title="Bold"
                >
                  <Bold size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`w-6 h-6 flex items-center justify-center rounded transition-colors cursor-pointer ${editor?.isActive('italic') ? 'bg-brand/15 text-brand' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                  title="Italic"
                >
                  <Italic size={12} />
                </button>
                <div className="w-px h-3 bg-[var(--border)] mx-0.5"></div>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`w-6 h-6 flex items-center justify-center rounded transition-colors cursor-pointer ${editor?.isActive('heading', { level: 2 }) ? 'bg-brand/15 text-brand font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                  title="Heading 2"
                >
                  <Heading2 size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={`w-6 h-6 flex items-center justify-center rounded transition-colors cursor-pointer ${editor?.isActive('heading', { level: 3 }) ? 'bg-brand/15 text-brand font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                  title="Heading 3"
                >
                  <Heading3 size={12} />
                </button>
                <div className="w-px h-3 bg-[var(--border)] mx-0.5"></div>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={`w-6 h-6 flex items-center justify-center rounded transition-colors cursor-pointer ${editor?.isActive('bulletList') ? 'bg-brand/15 text-brand' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                  title="Bullet List"
                >
                  <List size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  className={`w-6 h-6 flex items-center justify-center rounded transition-colors cursor-pointer ${editor?.isActive('orderedList') ? 'bg-brand/15 text-brand' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                  title="Numbered List"
                >
                  <ListOrdered size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                  className={`w-6 h-6 flex items-center justify-center rounded transition-colors cursor-pointer ${editor?.isActive('blockquote') ? 'bg-brand/15 text-brand' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                  title="Quote"
                >
                  <Quote size={12} />
                </button>
                <button
                  type="button"
                  onClick={addLink}
                  className={`w-6 h-6 flex items-center justify-center rounded transition-colors cursor-pointer ${editor?.isActive('link') ? 'bg-brand/15 text-brand' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                  title="Insert Link"
                >
                  <LinkIcon size={12} />
                </button>
                <div className="w-px h-3 bg-[var(--border)] mx-0.5"></div>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().undo().run()}
                  disabled={!editor?.can().undo()}
                  className="w-6 h-6 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer"
                  title="Undo"
                >
                  <Undo size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().redo().run()}
                  disabled={!editor?.can().redo()}
                  className="w-6 h-6 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer"
                  title="Redo"
                >
                  <Redo size={12} />
                </button>
              </div>

              <span className="text-[9.5px] text-[var(--text-muted)] font-mono">
                {stats.words} words · ~{stats.readTime} min
              </span>
            </div>

            {/* Document Title input - Compact */}
            <div className="shrink-0 px-3.5 py-1.5 border-b border-[var(--border)] bg-[var(--bg-surface)]">
              <input
                type="text"
                value={policyForm.title}
                onChange={(e) => setPolicyForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Policy Title..."
                className="w-full text-sm sm:text-base font-bold text-[var(--text-primary)] bg-transparent border-0 outline-none p-0 focus:ring-0 placeholder-[var(--text-muted)]/50 tracking-tight"
              />
            </div>

            {/* Editor Canvas (Scrollable matching Preview) */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3.5 sm:p-4 legal-editor-wrap">
              {loading ? (
                <AdminLoader
                  size="sm"
                  text="Loading document..."
                  minHeight="min-h-[160px]"
                />
              ) : (
                <EditorContent editor={editor} />
              )}
            </div>
          </div>
        )}

        {/* ─── RIGHT: ONE SINGLE LIVE PREVIEW - Compact Typography ─── */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className="h-full min-h-0 flex flex-col bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] shadow-2xs overflow-hidden">
            {/* Header */}
            <div className="shrink-0 px-3.5 py-1.5 border-b border-[var(--border)] bg-[var(--bg-muted)]/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Badge.Active size="xs">Live Document Preview</Badge.Active>
              </div>
              <span className="text-[10.5px] text-[var(--text-muted)] font-medium">
                Updated {lastUpdated}
              </span>
            </div>

            {/* Clean Document View */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3.5 sm:p-4 space-y-2.5">
              <div>
                <span className="text-[9px] font-bold uppercase text-brand tracking-wider">GHARMB OFFICIAL POLICY</span>
                <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] mt-0.5 tracking-tight">
                  {policyForm.title || 'Legal Document'}
                </h2>
                {policyForm.shortDescription && (
                  <p className="text-[11px] text-[var(--text-subtle)] mt-0.5 leading-relaxed">
                    {policyForm.shortDescription}
                  </p>
                )}
                <div className="w-full h-px bg-[var(--border)] mt-2"></div>
              </div>

              {/* Formatted body */}
              <div
                className="legal-preview-content text-xs leading-relaxed text-[var(--text-subtle)]"
                dangerouslySetInnerHTML={{
                  __html: policyForm.content || '<p class="text-slate-400 italic">No content drafted.</p>'
                }}
              />

              {/* Minimal note box at bottom */}
              <div className="mt-4 pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-[10.5px] text-[var(--text-muted)]">
                <span>Mira-Bhayandar, Maharashtra</span>
                <span>legal@gharmb.in</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. CLEAN SETTINGS MODAL ── */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-sm font-extrabold text-[var(--text-primary)]">Policy Configuration</h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-subtle)] mb-1">Policy Title</label>
                <input
                  type="text"
                  value={policyForm.title}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPolicyForm(prev => ({
                      ...prev,
                      title: val,
                      slug: !prev.isSystem && (isCreatingNew || !prev.slug || prev.slug === slugify(prev.title)) ? slugify(val) : prev.slug
                    }));
                  }}
                  className="w-full px-3 py-2 bg-[var(--bg-muted)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] font-medium focus:outline-none focus:border-brand"
                />
              </div>

              {/* URL Slug */}
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-subtle)] mb-1">URL Slug</label>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-xs text-[var(--text-muted)]">/</span>
                  <input
                    type="text"
                    value={policyForm.slug}
                    disabled={policyForm.isSystem}
                    onChange={(e) => setPolicyForm(prev => ({ ...prev, slug: slugify(e.target.value) }))}
                    className={`w-full pl-5 pr-3 py-2 bg-[var(--bg-muted)] border border-[var(--border)] rounded-lg text-xs font-mono font-medium focus:outline-none focus:border-brand ${
                      policyForm.isSystem ? 'opacity-60 cursor-not-allowed text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
                    }`}
                  />
                  {policyForm.isSystem && <Lock size={12} className="absolute right-2.5 text-amber-500" />}
                </div>
              </div>

              {/* Platform & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-subtle)] mb-1">Target Platform</label>
                  <select
                    value={policyForm.platform || 'both'}
                    onChange={(e) => setPolicyForm(prev => ({ ...prev, platform: e.target.value }))}
                    className="w-full px-2.5 py-2 bg-[var(--bg-muted)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="both">Both (Web & App)</option>
                    <option value="web">Web Only</option>
                    <option value="app">App Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-subtle)] mb-1">Status</label>
                  <select
                    value={policyForm.status}
                    onChange={(e) => setPolicyForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-2.5 py-2 bg-[var(--bg-muted)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Footer Visibility & Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-subtle)] mb-1">Footer Link</label>
                  <select
                    value={policyForm.showInFooter ? 'yes' : 'no'}
                    onChange={(e) => setPolicyForm(prev => ({ ...prev, showInFooter: e.target.value === 'yes' }))}
                    className="w-full px-2.5 py-2 bg-[var(--bg-muted)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="yes">Visible</option>
                    <option value="no">Hidden</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-subtle)] mb-1">Display Order</label>
                  <input
                    type="number"
                    value={policyForm.displayOrder}
                    onChange={(e) => setPolicyForm(prev => ({ ...prev, displayOrder: parseInt(e.target.value, 10) || 1 }))}
                    className="w-full px-2.5 py-2 bg-[var(--bg-muted)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-subtle)] mb-1">Short Description (SEO)</label>
                <input
                  type="text"
                  value={policyForm.shortDescription}
                  onChange={(e) => setPolicyForm(prev => ({ ...prev, shortDescription: e.target.value }))}
                  placeholder="Summary shown on search results & document header..."
                  className="w-full px-3 py-2 bg-[var(--bg-muted)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] font-medium focus:outline-none"
                />
              </div>

              {/* App Formatting Notice */}
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-700 dark:text-emerald-300">
                <p className="font-bold flex items-center gap-1">
                  <Smartphone size={12} /> Mobile App Optimization
                </p>
                <p className="text-[10px] opacity-90 mt-0.5">
                  Content is automatically formatted into clean text without HTML tags for mobile app displays.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
              {!isCreatingNew && !policyForm.isSystem ? (
                <button
                  type="button"
                  onClick={handleDeletePolicy}
                  disabled={isDeleting}
                  className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={12} /> Delete Policy
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-3 py-1.5 text-xs text-[var(--text-subtle)] hover:bg-[var(--bg-muted)] rounded-lg transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scoped CSS for Clean Document Editor & Preview */}
      <style>{`
        .legal-editor-wrap .tiptap {
          min-height: 100% !important;
          font-size: 12px !important;
          line-height: 1.55 !important;
          color: var(--text-primary) !important;
          outline: none !important;
        }
        .legal-editor-wrap .tiptap h1,
        .legal-preview-content h1 {
          font-size: 1.05rem !important;
          font-weight: 750 !important;
          color: var(--text-primary) !important;
          margin-top: 0.75rem !important;
          margin-bottom: 0.25rem !important;
          line-height: 1.3 !important;
        }
        .legal-editor-wrap .tiptap h2,
        .legal-preview-content h2 {
          font-size: 0.92rem !important;
          font-weight: 700 !important;
          color: #FF5A3C !important;
          margin-top: 0.7rem !important;
          margin-bottom: 0.2rem !important;
          border-bottom: 1px solid var(--border, #e2e8f0) !important;
          padding-bottom: 0.15rem !important;
          line-height: 1.35 !important;
        }
        .legal-editor-wrap .tiptap h3,
        .legal-preview-content h3 {
          font-size: 0.84rem !important;
          font-weight: 650 !important;
          color: var(--text-primary) !important;
          margin-top: 0.6rem !important;
          margin-bottom: 0.2rem !important;
          line-height: 1.35 !important;
        }
        .legal-editor-wrap .tiptap p,
        .legal-preview-content p {
          margin-bottom: 0.4rem !important;
          line-height: 1.55 !important;
          font-size: 12px !important;
        }
        .legal-editor-wrap .tiptap ul,
        .legal-preview-content ul {
          list-style-type: disc !important;
          padding-left: 1rem !important;
          margin-bottom: 0.4rem !important;
        }
        .legal-editor-wrap .tiptap ol,
        .legal-preview-content ol {
          list-style-type: decimal !important;
          padding-left: 1rem !important;
          margin-bottom: 0.4rem !important;
        }
        .legal-editor-wrap .tiptap li,
        .legal-preview-content li {
          margin-bottom: 0.1rem !important;
          line-height: 1.5 !important;
          font-size: 12px !important;
        }
        .legal-editor-wrap .tiptap blockquote,
        .legal-preview-content blockquote {
          border-left: 2.5px solid #FF5A3C !important;
          padding: 0.25rem 0.5rem !important;
          margin: 0.4rem 0 !important;
          background: rgba(255, 90, 60, 0.05) !important;
          border-radius: 0 0.3rem 0.3rem 0 !important;
          font-style: italic !important;
          font-size: 12px !important;
        }
        .legal-editor-wrap .tiptap a,
        .legal-preview-content a {
          color: #FF5A3C !important;
          text-decoration: underline !important;
          font-size: 12px !important;
        }
      `}</style>
    </div>
  );
};

export default LegalSettings;