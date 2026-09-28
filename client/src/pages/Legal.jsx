import { useState, useEffect } from 'react';
import {
  Save, Bold, Italic, List, Link as LinkIcon, RotateCcw, AlertTriangle, Info,
  CheckCircle2, Undo, Redo, Heading1, Heading2, ListOrdered, Plus, Trash2,
  FileText, Globe, Eye, EyeOff, Sparkles, ExternalLink, RefreshCw
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import API from '../api/api';

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

const LegalSettings = () => {
  const [policies, setPolicies] = useState([]);
  const [activeSlug, setActiveSlug] = useState('terms');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form states for current editing policy
  const [policyForm, setPolicyForm] = useState({
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');

  // Toast feedback
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => { setToast({ show: false, message: '', type: 'success' }); }, 4000);
  };

  // TipTap WYSIWYG Editor Instance
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }
      }),
      Underline,
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start typing or paste your legal content here...' })
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'w-full min-h-[450px] text-[15px] text-[var(--text-subtle)] leading-[1.8] bg-transparent border-0 focus:ring-0 outline-none custom-scrollbar prose max-w-none prose-h2:text-[24px] prose-h2:text-[#FF5A3C] prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-[19px] prose-h3:mt-6 prose-p:mb-4 prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-5 prose-ol:pl-5 prose-li:mb-1'
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
            if (inUl) { newLines.push('</ul>'); inUl = false; }
            if (inOl) { newLines.push('</ol>'); inOl = false; }
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
      setPolicyForm(prev => ({ ...prev, content: currentEditor.getHTML() }));
    }
  });

  const fetchPolicies = async (targetSlug = null) => {
    setLoading(true);
    let loadedPolicies = [];
    let fetchError = null;

    try {
      const res = await API.get('/admin/legal/policies');
      loadedPolicies = res.data?.data?.policies || [];
    } catch (err) {
      console.error('Error fetching policies from server:', err);
      if (err.message === 'Admin session expired' || err.response?.status === 401) {
        // Handled centrally by API interceptor
        setLoading(false);
        return;
      }
      if (err.response?.status === 403) {
        fetchError = 'You do not have permission to manage legal policies.';
      } else if (err.response?.status >= 500) {
        fetchError = 'Legal policy service is temporarily unavailable. Please try again.';
      } else if (err.code === 'ERR_NETWORK' || (!err.response && !err.message?.includes('status'))) {
        fetchError = 'Unable to connect to the server. Please check your network connection.';
      } else {
        fetchError = err.response?.data?.message || 'Unable to sync legal policies with server.';
      }
    }

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return;
    }

    // Safely update state outside network try/catch
    if (loadedPolicies.length > 0) {
      setError(null);
      setPolicies(loadedPolicies);
      selectPolicyBySlug(targetSlug || activeSlug || 'terms', loadedPolicies);
    } else {
      setError('No legal policies found on server.');
    }
    setLoading(false);
  };

  const selectPolicyBySlug = (slugToSelect, policyList = policies) => {
    const list = policyList && policyList.length > 0 ? policyList : policies;
    const found = list.find(p => p.slug === slugToSelect || p.type === slugToSelect) || list[0];
    if (found) {
      setIsCreatingNew(false);
      setActiveSlug(found.slug || found.type);
      const newFormData = {
        _id: found._id,
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
      setPolicyForm(newFormData);
      const d = found.updatedAt ? new Date(found.updatedAt) : new Date();
      setLastUpdated(d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
      if (editor && !editor.isDestroyed) {
        try {
          editor.commands.setContent(found.content || '');
        } catch (e) {
          console.warn('TipTap editor sync notice:', e);
        }
      }
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  // Update TipTap editor when active policy changes or when editor is ready
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
  }, [editor, activeSlug, isCreatingNew, loading]);

  const handleStartAddNew = () => {
    setIsCreatingNew(true);
    setActiveSlug('new-policy');
    const nextOrder = policies.length + 1;
    setPolicyForm({
      title: '',
      slug: '',
      shortDescription: '',
      status: 'published',
      platform: 'both',
      showInFooter: true,
      displayOrder: nextOrder,
      content: '<h2>1. Policy Overview</h2><p>Provide detailed terms and policy clauses here.</p>',
      isSystem: false
    });
    setLastUpdated('Drafting new policy');
    if (editor) {
      editor.commands.setContent('<h2>1. Policy Overview</h2><p>Provide detailed terms and policy clauses here.</p>');
    }
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setPolicyForm(prev => {
      const updated = { ...prev, title: newTitle };
      if (!prev.isSystem && (isCreatingNew || !prev.slug || prev.slug === slugify(prev.title))) {
        updated.slug = slugify(newTitle);
      }
      return updated;
    });
  };

  const handleSave = async (overrideStatus = null) => {
    const currentStatus = overrideStatus || policyForm.status || 'published';
    const contentToSave = editor ? editor.getHTML() : policyForm.content;

    if (!policyForm.title.trim()) {
      triggerToast('Policy title is required.', 'error');
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
      triggerToast('A valid URL slug is required.', 'error');
      return;
    }

    setIsSaving(true);

    const payload = {
      title: policyForm.title.trim(),
      slug: finalSlug,
      shortDescription: policyForm.shortDescription.trim(),
      content: contentToSave,
      status: currentStatus,
      platform: policyForm.platform || 'both',
      showInFooter: Boolean(policyForm.showInFooter),
      displayOrder: Number(policyForm.displayOrder) || 1,
      isSystem: Boolean(policyForm.isSystem)
    };

    try {
      let res;
      if (isCreatingNew) {
        res = await API.post('/admin/legal/policies', payload);
      } else {
        const targetTypeOrSlug = policyForm.slug || activeSlug;
        res = await API.put(`/admin/legal/${targetTypeOrSlug}`, payload);
      }

      if (res.status === 200 || res.status === 201) {
        triggerToast(`${payload.title} ${currentStatus === 'draft' ? 'saved as draft' : 'published'} successfully!`);
        setIsCreatingNew(false);
        await fetchPolicies(finalSlug);
      } else {
        triggerToast(res.data?.message || 'Failed to save policy.', 'error');
      }
    } catch (err) {
      console.error('Save policy error:', err);
      const errMsg = err.response?.data?.message || (err.code === 'ERR_NETWORK' ? 'Network error. Server unreachable.' : 'Failed to save policy to server.');
      triggerToast(errMsg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePolicy = async () => {
    if (policyForm.isSystem) {
      triggerToast('System policies (Terms of Service / Privacy Policy) cannot be deleted.', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${policyForm.title}"? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const targetId = policyForm._id || activeSlug;
      const res = await API.delete(`/admin/legal/policies/${targetId}`);

      if (res.status === 200) {
        triggerToast(`Policy deleted successfully.`);
        await fetchPolicies('terms');
      } else {
        triggerToast(res.data?.message || 'Failed to delete policy.', 'error');
      }
    } catch (err) {
      console.error('Delete policy error:', err);
      const errMsg = err.response?.data?.message || 'Failed to delete policy from server.';
      triggerToast(errMsg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const addLink = () => {
    const url = window.prompt('Enter link URL (e.g. https://... or /contact):');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 py-3.5 px-6 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up border ${
          toast.type === 'success' ? 'bg-emerald-950 border-emerald-800 text-emerald-300' : 'bg-rose-950 border-rose-800 text-rose-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <div className="text-xs">
            <p className="font-extrabold text-white">{toast.type === 'success' ? 'Success' : 'Notice'}</p>
            <p className="opacity-90">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Legal Documents & Policies</h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
              {policies.length} {policies.length === 1 ? 'Policy' : 'Policies'}
            </span>
          </div>
          <p className="text-xs text-[var(--text-subtle)] mt-1">
            Manage Terms of Service, Privacy Policy, and create dynamic legal policies that publish to Web, Mobile App, or Both.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleStartAddNew}
            disabled={isSaving || loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer hover:border-brand/40"
          >
            <Plus size={15} className="text-brand" />
            <span>Add Policy</span>
          </button>

          <button
            onClick={() => handleSave('draft')}
            disabled={isSaving || loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save size={13} />
            <span>Save Draft</span>
          </button>

          <button
            onClick={() => handleSave('published')}
            disabled={isSaving || loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-dark text-white text-xs font-black rounded-xl shadow-lg transition-all disabled:opacity-70 cursor-pointer"
          >
            <Sparkles size={14} />
            {isSaving ? 'Publishing...' : 'Publish Changes'}
          </button>
        </div>
      </div>

      {/* Error Banner with Intelligent Retry */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="shrink-0" />
            <div>
              <p className="font-extrabold">Service Connection Notice</p>
              <p className="opacity-90 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchPolicies()}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-colors cursor-pointer shrink-0 disabled:opacity-70"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Connecting...' : 'Retry Connection'}</span>
          </button>
        </div>
      )}

      {/* Tabs Row */}
      <div className="border-b border-[var(--border)] overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-2 min-w-max pb-px">
          {policies.map(p => {
            const isSelected = !isCreatingNew && (activeSlug === p.slug || activeSlug === p.type);
            const isDraft = p.status === 'draft';
            const platform = p.platform || 'both';
            return (
              <button
                key={p._id || p.slug}
                onClick={() => selectPolicyBySlug(p.slug || p.type)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all relative rounded-t-xl cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--bg-surface)] text-brand border-t-2 border-t-brand border-x border-[var(--border)] font-black'
                    : 'text-[var(--text-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]/50'
                }`}
              >
                <FileText size={13} className={isSelected ? 'text-brand' : 'opacity-60'} />
                <span>{p.title}</span>
                {isDraft && (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    Draft
                  </span>
                )}
                {platform === 'web' && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-500 border border-sky-500/20">
                    Web
                  </span>
                )}
                {platform === 'app' && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    App
                  </span>
                )}
                {p.showInFooter && (
                  <span title="Visible in website footer" className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                )}
              </button>
            );
          })}

          {isCreatingNew && (
            <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-black bg-[var(--bg-surface)] text-brand border-t-2 border-t-brand border-x border-[var(--border)] rounded-t-xl">
              <Plus size={13} />
              <span>New Policy (Drafting)</span>
            </div>
          )}
        </div>
      </div>

      {/* Policy Configuration Card */}
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-black">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
                {isCreatingNew ? 'Create New Legal Policy' : `Editing: ${policyForm.title || 'Policy'}`}
              </h3>
              <p className="text-[11px] text-[var(--text-subtle)]">
                Configure policy URL slug, target platform (Web/App/Both), footer placement, status, and contents.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreatingNew && !policyForm.isSystem && (
              <button
                onClick={handleDeletePolicy}
                disabled={isDeleting || isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                title="Delete this custom policy"
              >
                <Trash2 size={13} />
                <span>Delete Policy</span>
              </button>
            )}
            {!isCreatingNew && (
              <a
                href={`/${policyForm.slug || activeSlug}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-[var(--text-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] rounded-lg transition-colors"
                title="Preview public page"
              >
                <span>View Live</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>

        {/* Metadata Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Policy Title */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider mb-1.5">
              Policy Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={policyForm.title}
              onChange={handleTitleChange}
              placeholder="e.g. Refund Policy"
              className="w-full px-3.5 py-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-semibold focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          {/* URL Slug */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider mb-1.5">
              URL Slug <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs text-[var(--text-subtle)] font-mono">/</span>
              <input
                type="text"
                value={policyForm.slug}
                disabled={policyForm.isSystem}
                onChange={(e) => setPolicyForm(prev => ({ ...prev, slug: slugify(e.target.value) }))}
                placeholder="refund-policy"
                className={`w-full pl-6 pr-3.5 py-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-brand transition-colors ${
                  policyForm.isSystem ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900 text-[var(--text-subtle)]' : 'text-[var(--text-primary)]'
                }`}
              />
            </div>
            {policyForm.isSystem && (
              <span className="text-[10px] text-amber-500 mt-1 block">Fixed system slug</span>
            )}
          </div>

          {/* Target Platform */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider mb-1.5">
              Target Platform
            </label>
            <select
              value={policyForm.platform || 'both'}
              onChange={(e) => setPolicyForm(prev => ({ ...prev, platform: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-semibold focus:outline-none focus:border-brand transition-colors cursor-pointer"
            >
              <option value="both">Both (Web & App)</option>
              <option value="web">Web Only</option>
              <option value="app">App / Mobile Only</option>
            </select>
          </div>

          {/* Publication Status */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              value={policyForm.status}
              onChange={(e) => setPolicyForm(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-semibold focus:outline-none focus:border-brand transition-colors cursor-pointer"
            >
              <option value="published">Published (Live)</option>
              <option value="draft">Draft (Hidden)</option>
            </select>
          </div>

          {/* Footer Visibility & Display Order */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider mb-1.5">
                Footer Link
              </label>
              <select
                value={policyForm.showInFooter ? 'yes' : 'no'}
                onChange={(e) => setPolicyForm(prev => ({ ...prev, showInFooter: e.target.value === 'yes' }))}
                className="w-full px-3 py-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-semibold focus:outline-none focus:border-brand transition-colors cursor-pointer"
              >
                <option value="yes">Show</option>
                <option value="no">Hide</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider mb-1.5">
                Order
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={policyForm.displayOrder}
                onChange={(e) => setPolicyForm(prev => ({ ...prev, displayOrder: parseInt(e.target.value, 10) || 1 }))}
                className="w-full px-3 py-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-semibold focus:outline-none focus:border-brand transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Short Description */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider mb-1.5">
            Short Description (SEO & Page Subtitle)
          </label>
          <input
            type="text"
            value={policyForm.shortDescription}
            onChange={(e) => setPolicyForm(prev => ({ ...prev, shortDescription: e.target.value }))}
            placeholder="Brief summary shown at the top of the policy page and in SEO meta tags..."
            className="w-full px-3.5 py-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-medium focus:outline-none focus:border-brand transition-colors"
          />
        </div>
      </div>

      {/* Editor Container */}
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] shadow-sm flex flex-col overflow-hidden">
        {/* Editor Toolbar */}
        <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-muted)] gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded transition-colors ${editor?.isActive('bold') ? 'bg-brand/10 text-brand font-bold' : 'text-[var(--text-subtle)] hover:bg-[var(--border)]'}`}
              title="Bold"
            >
              <Bold size={15} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded transition-colors ${editor?.isActive('italic') ? 'bg-brand/10 text-brand' : 'text-[var(--text-subtle)] hover:bg-[var(--border)]'}`}
              title="Italic"
            >
              <Italic size={15} />
            </button>
            <div className="w-px h-5 bg-slate-300 mx-1"></div>
            <button
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-1.5 rounded transition-colors ${editor?.isActive('heading', { level: 2 }) ? 'bg-brand/10 text-brand font-bold' : 'text-[var(--text-subtle)] hover:bg-[var(--border)]'}`}
              title="Section Heading (H2 - Automatically adds to Table of Contents)"
            >
              <Heading2 size={15} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-1.5 rounded transition-colors ${editor?.isActive('heading', { level: 3 }) ? 'bg-brand/10 text-brand font-bold' : 'text-[var(--text-subtle)] hover:bg-[var(--border)]'}`}
              title="Sub-heading (H3)"
            >
              <Heading1 size={15} />
            </button>
            <div className="w-px h-5 bg-slate-300 mx-1"></div>
            <button
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded transition-colors ${editor?.isActive('bulletList') ? 'bg-brand/10 text-brand' : 'text-[var(--text-subtle)] hover:bg-[var(--border)]'}`}
              title="Bullet List"
            >
              <List size={15} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={`p-1.5 rounded transition-colors ${editor?.isActive('orderedList') ? 'bg-brand/10 text-brand' : 'text-[var(--text-subtle)] hover:bg-[var(--border)]'}`}
              title="Numbered List"
            >
              <ListOrdered size={15} />
            </button>
            <button
              onClick={addLink}
              className={`p-1.5 rounded transition-colors ${editor?.isActive('link') ? 'bg-brand/10 text-brand' : 'text-[var(--text-subtle)] hover:bg-[var(--border)]'}`}
              title="Insert Link"
            >
              <LinkIcon size={15} />
            </button>
            <div className="w-px h-5 bg-slate-300 mx-1"></div>
            <button
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={!editor?.can().undo()}
              className="p-1.5 text-[var(--text-subtle)] hover:bg-[var(--border)] disabled:opacity-30 rounded transition-colors"
              title="Undo"
            >
              <Undo size={15} />
            </button>
            <button
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={!editor?.can().redo()}
              className="p-1.5 text-[var(--text-subtle)] hover:bg-[var(--border)] disabled:opacity-30 rounded transition-colors"
              title="Redo"
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
        <div className="p-6 md:p-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-brand/20 border-t-brand animate-spin"></div>
              <p className="text-xs text-[var(--text-subtle)]">Loading document...</p>
            </div>
          ) : (
            <div className="editor-container">
              <EditorContent editor={editor} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalSettings;