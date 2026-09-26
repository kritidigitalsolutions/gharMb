import { useState, useEffect } from 'react';
import {
  Save, Bold, Italic, List, Link as LinkIcon, RotateCcw, AlertTriangle, Info, CheckCircle2, Undo, Redo, Heading1, Heading2, ListOrdered
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const LegalSettings = () => {
  const [activeTab, setActiveTab] = useState('terms');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMockMode, setIsMockMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('June 26, 2026');

  // Content states for the two tabs
  const [contents, setContents] = useState({
    terms: '',
    privacy: ''
  });

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
        class: 'w-full min-h-[500px] text-[15px] text-[var(--text-subtle)] leading-[1.8] bg-transparent border-0 focus:ring-0 outline-none custom-scrollbar prose max-w-none prose-h2:text-[26px] prose-h2:text-[#FF5A3C] prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-[20px] prose-h3:mt-6 prose-p:mb-4 prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-5 prose-ol:pl-5 prose-li:mb-1'
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
            if (line.startsWith('•')) {
              if (inOl) { newLines.push('</ol>'); inOl = false; }
              if (!inUl) { newLines.push('<ul>'); inUl = true; }
              newLines.push(`<li>${line.substring(1).trim()}</li>`);
              continue;
            }
            const numMatch = line.match(/^(\d+)\.\s+(.*)/);
            if (numMatch) {
              const currentNum = parseInt(numMatch[1], 10);
              const nextLine = (lines[i+1] || '').trim();
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
      setContents(prev => ({ ...prev, [activeTab]: currentEditor.getHTML() }));
    }
  });

  // Sync TipTap content when tab changes or data loads
  useEffect(() => {
    if (editor && !loading) {
      editor.commands.setContent(contents[activeTab] || '');
    }
  }, [activeTab, loading]);

  const loadMockContent = () => {
    const saved = localStorage.getItem('gharmb_legal_contents');
    const savedDate = localStorage.getItem('gharmb_legal_last_updated');
    if (saved) {
      try {
        setContents(JSON.parse(saved));
        if (savedDate) setLastUpdated(savedDate);
        return;
      } catch (err) {}
    }
    const defaultContents = {
      terms: "<h2>1. Acceptance of Terms</h2><p>By accessing and using the GHARMB admin platform, you accept and agree to be bound by the terms.</p>",
      privacy: "<h2>1. Information We Collect</h2><p>We collect information to provide better services to our users.</p>"
    };
    setContents(defaultContents);
    setLastUpdated('June 26, 2026');
  };

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

      const [responseTerms, responsePrivacy] = await Promise.all([
        fetch(`${API_URL}/admin/legal/terms`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/admin/legal/privacy-policy`, { headers: { 'Authorization': `Bearer ${token}` } })
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

      if (responseTerms.ok || responsePrivacy.ok) {
        setContents({
          terms: termsText || '',
          privacy: privacyText || ''
        });
        setLastUpdated(dateString);
        setIsMockMode(false);
      } else {
        setIsMockMode(true);
        loadMockContent();
      }
    } catch (err) {
      setError('Could not sync legal policies with backend.');
      loadMockContent();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLegalContent();
  }, []);

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
        const updatedContents = { ...contents, [activeTab]: textToSend };
        localStorage.setItem('gharmb_legal_contents', JSON.stringify(updatedContents));
        localStorage.setItem('gharmb_legal_last_updated', today);
        triggerToast(`${docTitle} updated successfully on database!`);
      } else {
        triggerToast(data.message || `Failed to update ${docTitle}.`, 'error');
      }
    } catch (err) {
      triggerToast('Backend connection failed. Could not write to MongoDB.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const addLink = () => {
    const url = window.prompt('URL');
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
            <p className="font-extrabold text-white">{toast.type === 'success' ? 'Changes Saved' : 'Operation Error'}</p>
            <p className="opacity-90">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Legal Documents</h2>
          <p className="text-xs text-[var(--text-subtle)] mt-1">Configure Terms of Service and Privacy Policy contents.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-dark text-white text-xs font-black rounded-xl shadow-lg transition-all disabled:opacity-70 cursor-pointer"
        >
          <Save size={14} />
          {isSaving ? 'Publishing...' : 'Publish Changes'}
        </button>
      </div>

      {/* Error & Sandbox Banners */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} />
            <div>
              <p className="font-extrabold">Database Sync Failed</p>
              <p className="opacity-80 mt-0.5">{error}</p>
            </div>
          </div>
          <button onClick={fetchLegalContent} className="px-4 py-2 bg-rose-500 text-white rounded-xl font-bold">Retry</button>
        </div>
      )}
      {isMockMode && !error && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-2xl flex items-center gap-3 text-xs">
          <Info size={18} />
          <div>
            <p className="font-extrabold">Sandbox Simulation Active</p>
            <p className="opacity-80 mt-0.5">Showing mock legal content in localStorage cache.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[var(--border)]">
        <div className="flex gap-8">
          {['terms', 'privacy'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
                activeTab === tab ? 'text-brand font-black' : 'text-[var(--text-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
              {activeTab === tab && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-t-full"></span>}
            </button>
          ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] shadow-sm flex flex-col overflow-hidden">
        
        {/* Editor Toolbar */}
        <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-muted)]">
          <div className="flex items-center gap-1">
            <button onClick={() => editor?.chain().focus().toggleBold().run()} className={`p-1.5 rounded transition-colors ${editor?.isActive('bold') ? 'bg-brand/10 text-brand' : 'text-[var(--text-subtle)] hover:bg-[var(--border)]'}`}><Bold size={15} /></button>
            <button onClick={() => editor?.chain().focus().toggleItalic().run()} className={`p-1.5 rounded transition-colors ${editor?.isActive('italic') ? 'bg-brand/10 text-brand' : 'text-[var(--text-subtle)] hover:bg-[var(--border)]'}`}><Italic size={15} /></button>
            <div className="w-px h-5 bg-slate-300 mx-1"></div>
            <button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded transition-colors ${editor?.isActive('heading', { level: 2 }) ? 'bg-brand/10 text-brand' : 'text-[var(--text-subtle)] hover:bg-[var(--border)]'}`}><Heading2 size={15} /></button>
            <button onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className={`p-1.5 rounded transition-colors ${editor?.isActive('heading', { level: 3 }) ? 'bg-brand/10 text-brand' : 'text-[var(--text-subtle)] hover:bg-[var(--border)]'}`}><Heading1 size={15} /></button>
            <div className="w-px h-5 bg-slate-300 mx-1"></div>
            <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded transition-colors ${editor?.isActive('bulletList') ? 'bg-brand/10 text-brand' : 'text-[var(--text-subtle)] hover:bg-[var(--border)]'}`}><List size={15} /></button>
            <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded transition-colors ${editor?.isActive('orderedList') ? 'bg-brand/10 text-brand' : 'text-[var(--text-subtle)] hover:bg-[var(--border)]'}`}><ListOrdered size={15} /></button>
            <button onClick={addLink} className={`p-1.5 rounded transition-colors ${editor?.isActive('link') ? 'bg-brand/10 text-brand' : 'text-[var(--text-subtle)] hover:bg-[var(--border)]'}`}><LinkIcon size={15} /></button>
            <div className="w-px h-5 bg-slate-300 mx-1"></div>
            <button onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()} className="p-1.5 text-[var(--text-subtle)] hover:bg-[var(--border)] disabled:opacity-30 rounded transition-colors"><Undo size={15} /></button>
            <button onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()} className="p-1.5 text-[var(--text-subtle)] hover:bg-[var(--border)] disabled:opacity-30 rounded transition-colors"><Redo size={15} /></button>
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