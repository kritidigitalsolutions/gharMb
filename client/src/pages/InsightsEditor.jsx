import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  ArrowLeft, Save, Sparkles, UploadCloud, Image as ImageIcon,
  Tag, Globe, Clock, User, Folder, CheckCircle2, AlertCircle,
  ExternalLink, Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Heading1, Heading2, Heading3, Quote, Link2,
  Minus, RemoveFormatting, Code, Eye, RefreshCw, X, Plus,
  ChevronDown, ChevronUp, Check, Copy, AlertTriangle, FileText,
  AlignLeft, AlignCenter, AlignRight, Maximize2, ShieldCheck, Share2
} from 'lucide-react';
import API from '../api/api';

const WEBPAGE_URL = 'http://localhost:5174';

const InsightsEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id && id !== 'new');

  // References
  const bannerFileInputRef = useRef(null);
  const inlineImageFileInputRef = useRef(null);

  // Loading & Submission States
  const [isPageLoading, setIsPageLoading] = useState(isEditMode);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingInline, setIsUploadingInline] = useState(false);

  // View States
  const [showHtmlSource, setShowHtmlSource] = useState(false);
  const [isSeoOpen, setIsSeoOpen] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // Categories & Quick Add Modal
  const [categories, setCategories] = useState([]);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [catError, setCatError] = useState('');

  // Image Insert Modal (for Body Content)
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalTab, setImageModalTab] = useState('upload'); // 'upload' | 'url'
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [modalImageAlt, setModalImageAlt] = useState('');
  const [modalImageCaption, setModalImageCaption] = useState('');

  // Link Insert Modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkOpenInNewTab, setLinkOpenInNewTab] = useState(true);

  // Unsaved Changes & Navigation Guard
  const [isDirty, setIsDirty] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [pendingNavigationPath, setPendingNavigationPath] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: '',
    excerpt: '',
    content: '',
    bannerImage: '',
    author: 'GharMB',
    readTime: 5,
    isFeatured: false,
    status: 'draft',
    tags: [],
    seo: {
      metaTitle: '',
      metaDescription: '',
      ogImage: '',
      canonicalUrl: '',
      focusKeyword: '',
    },
  });

  // Metadata timestamps for display
  const [metaTimestamps, setMetaTimestamps] = useState({
    createdAt: null,
    updatedAt: null,
    publishedAt: null,
  });

  // Tag Input text buffer
  const [tagInputText, setTagInputText] = useState('');

  // Validation Errors
  const [errors, setErrors] = useState({});

  // Toast Notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Helper: Slug Generator
  const generateSlug = (text) => {
    return (text || '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  // TipTap WYSIWYG Editor Instance
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        dropcursor: {
          color: '#FF5A3C',
          width: 2,
        },
      }),
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'text-[#FF5A3C] underline font-semibold hover:text-[#E04F34] transition-colors',
        },
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: 'rounded-2xl max-w-full my-4 shadow-sm mx-auto block',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your article content here...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'min-h-[500px] outline-none focus:outline-none focus:ring-0 select-text prose max-w-none text-[#344054] text-base leading-relaxed',
        style: 'color: #344054; font-family: Inter, sans-serif; font-size: 16px; line-height: 1.7;',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      const text = currentEditor.getText();
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const minutes = Math.max(1, Math.ceil(words / 200));

      setFormData(prev => ({
        ...prev,
        content: html,
        readTime: minutes,
      }));
      setIsDirty(true);
    },
  });

  // Calculate live word count and reading time
  const getLiveStats = () => {
    if (editor && !showHtmlSource) {
      const text = editor.getText();
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const minutes = Math.max(1, Math.ceil(words / 200));
      return { words, minutes };
    }
    const cleanText = (formData.content || '').replace(/<[^>]*>/g, ' ');
    const words = cleanText.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { words, minutes };
  };

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await API.get('/admin/blog-categories');
      if (res.data?.data?.categories) {
        setCategories(res.data.data.categories);
        if (!formData.category && res.data.data.categories.length > 0) {
          setFormData(prev => ({
            ...prev,
            category: prev.category || res.data.data.categories[0]._id
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const isFetchingRef = useRef(false);

  // Fetch Blog for Edit Mode
  const fetchBlog = async () => {
    if (!id || id === 'new') return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsPageLoading(true);
    try {
      const res = await API.get(`/admin/blogs/${id}`);
      if (res.data?.data?.blog) {
        const b = res.data.data.blog;
        const loadedData = {
          title: b.title || '',
          slug: b.slug || '',
          category: b.category?._id || b.category || '',
          excerpt: b.excerpt || '',
          content: b.content || '',
          bannerImage: b.bannerImage || '',
          author: b.author || 'GharMB Editorial',
          readTime: b.readTime || 5,
          isFeatured: Boolean(b.isFeatured),
          status: b.status || (b.isPublished ? 'published' : 'draft'),
          tags: Array.isArray(b.tags) ? b.tags : [],
          seo: {
            metaTitle: b.seo?.metaTitle || '',
            metaDescription: b.seo?.metaDescription || '',
            ogImage: b.seo?.ogImage || '',
            canonicalUrl: b.seo?.canonicalUrl || '',
            focusKeyword: b.seo?.focusKeyword || '',
          },
        };

        setFormData(loadedData);
        setMetaTimestamps({
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
          publishedAt: b.publishedAt,
        });

        // Populate TipTap editor content safely
        try {
          if (editor && !editor.isDestroyed) {
            editor.commands.setContent(b.content || '');
          }
        } catch (editorErr) {
          console.warn('TipTap setContent deferred:', editorErr);
        }
      }
    } catch (err) {
      console.error('Error fetching blog:', err);
      if (err.response?.status === 404) {
        triggerToast('Article not found in database.', 'error');
      } else if (err.name !== 'CanceledError') {
        triggerToast('Failed to load article.', 'error');
      }
    } finally {
      setIsPageLoading(false);
      setIsDirty(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchCategories();
    if (isEditMode && id && id !== 'new') {
      fetchBlog();
    }
  }, [id]);

  // Sync initial content once editor is ready if data arrived before editor mounted
  useEffect(() => {
    if (editor && formData.content && !editor.getText()) {
      editor.commands.setContent(formData.content);
    }
  }, [editor, formData.content]);

  // Handle Browser BeforeUnload for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Field change handler that marks dirty
  const updateFormField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // SEO field change handler
  const updateSeoField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      seo: { ...prev.seo, [field]: value }
    }));
    setIsDirty(true);
  };

  // Title change (updates Title and default SEO meta title)
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      title: val,
      slug: !isEditMode && !prev.slug ? generateSlug(val) : prev.slug,
      seo: {
        ...prev.seo,
        metaTitle: prev.seo.metaTitle === prev.title || !prev.seo.metaTitle ? val : prev.seo.metaTitle
      }
    }));
    setIsDirty(true);
    if (errors.title) setErrors(prev => ({ ...prev, title: null }));
  };

  // Manual Generate Slug action
  const handleGenerateSlugClick = () => {
    if (!formData.title.trim()) {
      triggerToast('Please enter an article title first.', 'error');
      return;
    }
    const newSlug = generateSlug(formData.title);
    updateFormField('slug', newSlug);
    triggerToast('Slug generated from title!');
  };

  // Open Link Modal
  const handleOpenLinkModal = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href || '';
    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      ' '
    );

    setLinkUrl(previousUrl);
    setLinkText(selectedText);
    setLinkOpenInNewTab(true);
    setShowLinkModal(true);
  };

  // Apply Link in Editor
  const handleApplyLink = (e) => {
    e.preventDefault();
    if (!editor || !linkUrl.trim()) return;

    let finalUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith('/') && !finalUrl.startsWith('#')) {
      finalUrl = 'https://' + finalUrl;
    }

    if (linkText.trim() && editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${finalUrl}" target="_blank" rel="noopener noreferrer">${linkText.trim()}</a>`)
        .run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: finalUrl, target: '_blank' })
        .run();
    }

    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
    triggerToast('Link applied!');
  };

  // Open Image Modal
  const handleOpenImageModal = () => {
    setModalImageUrl('');
    setModalImageAlt('');
    setModalImageCaption('');
    setImageModalTab('upload');
    setShowImageModal(true);
  };

  // Upload file for inline image insertion
  const handleInlineImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingInline(true);
    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const res = await API.post('/admin/blogs/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.data?.url) {
        setModalImageUrl(res.data.data.url);
        triggerToast('Image uploaded! You can now configure alt text.');
      }
    } catch (err) {
      console.error('Error uploading inline image:', err);
      triggerToast('Failed to upload image.', 'error');
    } finally {
      setIsUploadingInline(false);
      if (inlineImageFileInputRef.current) inlineImageFileInputRef.current.value = '';
    }
  };

  // Insert image into TipTap editor
  const handleInsertImageIntoEditor = (e) => {
    e.preventDefault();
    if (!editor || !modalImageUrl.trim()) {
      triggerToast('Please upload or enter an image URL.', 'error');
      return;
    }

    editor
      .chain()
      .focus()
      .setImage({
        src: modalImageUrl.trim(),
        alt: modalImageAlt.trim() || 'Article illustration',
        title: modalImageCaption.trim() || '',
      })
      .run();

    setShowImageModal(false);
    triggerToast('Image inserted into article!');
  };

  // Banner File Upload
  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const res = await API.post('/admin/blogs/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.data?.url) {
        updateFormField('bannerImage', res.data.data.url);
        if (!formData.seo.ogImage) {
          updateSeoField('ogImage', res.data.data.url);
        }
        triggerToast('Featured banner image uploaded!');
      }
    } catch (err) {
      console.error('Error uploading banner:', err);
      triggerToast('Failed to upload banner image.', 'error');
    } finally {
      setIsUploadingBanner(false);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
    }
  };

  // Toggle HTML Source Mode with zero data loss
  const handleToggleHtmlSource = () => {
    if (showHtmlSource) {
      // Switching from Raw HTML textarea back to Visual WYSIWYG
      setShowHtmlSource(false);
      if (editor) {
        editor.commands.setContent(formData.content || '');
      }
    } else {
      // Switching from Visual Editor to Raw HTML textarea
      const currentHtml = editor ? editor.getHTML() : formData.content;
      setFormData(prev => ({ ...prev, content: currentHtml }));
      setShowHtmlSource(true);
    }
  };

  // Tag Input Handlers
  const handleAddTag = (rawTag) => {
    const clean = rawTag.trim().replace(/^#/, '');
    if (!clean) return;
    if (!formData.tags.includes(clean)) {
      const updated = [...formData.tags, clean];
      updateFormField('tags', updated);
    }
    setTagInputText('');
  };

  const handleRemoveTag = (indexToRemove) => {
    const updated = formData.tags.filter((_, idx) => idx !== indexToRemove);
    updateFormField('tags', updated);
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInputText);
    } else if (e.key === 'Backspace' && !tagInputText && formData.tags.length > 0) {
      handleRemoveTag(formData.tags.length - 1);
    }
  };

  // Quick Add Category Modal Submission
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setCatError('Category name is required.');
      return;
    }
    setIsAddingCat(true);
    setCatError('');
    try {
      const res = await API.post('/admin/blog-categories', { name: newCatName.trim() });
      if (res.data?.data?.category) {
        const created = res.data.data.category;
        setCategories(prev => [created, ...prev]);
        updateFormField('category', created._id);
        setNewCatName('');
        setShowAddCategoryModal(false);
        triggerToast(`Category "${created.name}" created!`);
      }
    } catch (err) {
      console.error('Error creating category:', err);
      setCatError(err.response?.data?.message || 'Failed to create category.');
    } finally {
      setIsAddingCat(false);
    }
  };

  // Copy public URL
  const handleCopyPublicUrl = () => {
    const url = `${WEBPAGE_URL}/insights/${formData.slug || id}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    triggerToast('Public article link copied to clipboard!');
    setTimeout(() => setCopiedUrl(false), 3000);
  };

  // Save Blog (Draft or Publish)
  const handleSave = async (targetStatus) => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Article title is required.';
    }
    if (!formData.category) {
      newErrors.category = 'Please select a category.';
    }
    if (!formData.excerpt.trim()) {
      newErrors.excerpt = 'Article summary / excerpt is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      triggerToast('Please complete all required fields highlighted in red.', 'error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (targetStatus === 'published') {
      setIsPublishing(true);
    } else {
      setIsSavingDraft(true);
    }

    // Capture the latest HTML from TipTap editor instance or raw textarea
    const currentHtmlContent = showHtmlSource
      ? formData.content
      : (editor ? editor.getHTML() : formData.content);

    const payload = {
      title: formData.title.trim(),
      slug: formData.slug.trim() || generateSlug(formData.title),
      category: formData.category,
      excerpt: formData.excerpt.trim(),
      content: currentHtmlContent,
      bannerImage: formData.bannerImage.trim(),
      author: formData.author.trim() || 'GharMB Editorial',
      readTime: Number(formData.readTime) || 5,
      status: targetStatus,
      isFeatured: Boolean(formData.isFeatured),
      tags: formData.tags,
      seo: {
        metaTitle: formData.seo.metaTitle.trim(),
        metaDescription: formData.seo.metaDescription.trim(),
        ogImage: formData.seo.ogImage.trim() || formData.bannerImage.trim(),
        canonicalUrl: formData.seo.canonicalUrl.trim(),
        focusKeyword: formData.seo.focusKeyword.trim(),
      },
    };

    try {
      let savedBlog;
      if (isEditMode) {
        const res = await API.put(`/admin/blogs/${id}`, payload);
        savedBlog = res.data?.data?.blog;
        triggerToast(`Article updated as ${targetStatus}!`);
      } else {
        const res = await API.post('/admin/blogs', payload);
        savedBlog = res.data?.data?.blog;
        triggerToast(`Article successfully created and ${targetStatus === 'published' ? 'published' : 'saved as draft'}!`);
        if (savedBlog?._id) {
          navigate(`/admin/insights/edit/${savedBlog._id}`, { replace: true });
        }
      }

      setFormData(prev => ({ ...prev, status: targetStatus, content: currentHtmlContent }));
      setIsDirty(false);
      setLastSavedTime(new Date());

      if (savedBlog) {
        setMetaTimestamps({
          createdAt: savedBlog.createdAt,
          updatedAt: savedBlog.updatedAt,
          publishedAt: savedBlog.publishedAt,
        });
      }
    } catch (err) {
      console.error('Error saving article:', err);
      triggerToast(err.response?.data?.message || 'Failed to save article.', 'error');
    } finally {
      setIsSavingDraft(false);
      setIsPublishing(false);
    }
  };

  // Safe navigation with dirty-state confirmation
  const handleSafeNavigation = (targetPath) => {
    if (isDirty) {
      setPendingNavigationPath(targetPath);
      setShowExitConfirmModal(true);
    } else {
      navigate(targetPath);
    }
  };

  if (isPageLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-[#718096]">
        <RefreshCw size={36} className="animate-spin text-[#FF5A3C] mb-4" />
        <p className="text-sm font-semibold text-[#17212B]">Loading article editor...</p>
        <p className="text-xs text-[#718096] mt-1">Preparing editorial workspace</p>
      </div>
    );
  }

  const liveStats = getLiveStats();
  const isSaving = isSavingDraft || isPublishing;

  return (
    <div className="min-h-screen bg-[#F6F8FA] pb-24 text-[#17212B] font-sans antialiased">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2.5 transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* STICKY PAGE HEADER & ACTIONS                                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5E9EF] -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-3.5 mb-6 transition-all shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Left Title & Status Area */}
          <div className="flex items-center gap-3.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleSafeNavigation('/admin/insights')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#718096] hover:text-[#FF5A3C] transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-[#F6F8FA]"
            >
              <ArrowLeft size={15} /> Back to Articles
            </button>

            <div className="h-4 w-[1px] bg-[#E5E9EF] hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-extrabold text-[#17212B] tracking-tight">
                {isEditMode ? 'Edit Insight Article' : 'Create Insight Article'}
              </h1>

              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${
                  formData.status === 'published'
                    ? 'bg-emerald-50 text-[#16A36A] border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${formData.status === 'published' ? 'bg-[#16A36A]' : 'bg-amber-500'}`} />
                {formData.status === 'published' ? 'Published' : 'Draft'}
              </span>

              {/* Unsaved Changes vs Saved Just Now Indicator */}
              {isDirty ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 text-[11px] font-semibold border border-amber-500/20 animate-pulse">
                  ● Unsaved changes
                </span>
              ) : lastSavedTime ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[#16A36A] text-[11px] font-semibold border border-emerald-200">
                  <Check size={11} /> Saved just now
                </span>
              ) : null}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap self-end md:self-auto">
            {/* Live Preview Button */}
            {isEditMode && (
              <a
                href={`${WEBPAGE_URL}/insights/${formData.slug || id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-[#E5E9EF] bg-white hover:bg-[#F6F8FA] text-[#17212B] transition-all shadow-sm cursor-pointer hover:border-slate-300"
                title="View live public article in new tab"
              >
                <ExternalLink size={14} className="text-[#718096]" /> Preview
              </a>
            )}

            {/* Save Draft Button (Secondary) */}
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave('draft')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-[#E5E9EF] bg-white hover:bg-[#F6F8FA] text-[#17212B] transition-all shadow-sm cursor-pointer disabled:opacity-50 hover:border-slate-300"
            >
              <Save size={14} className="text-[#718096]" />
              {isSavingDraft ? 'Saving...' : 'Save Draft'}
            </button>

            {/* Update / Publish Button (Primary Orange) */}
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave('published')}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-[#FF5A3C] hover:bg-[#E04F34] text-white transition-all shadow-sm hover:shadow hover:scale-[1.01] active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={14} />
              {isPublishing
                ? formData.status === 'published'
                  ? 'Updating...'
                  : 'Publishing...'
                : formData.status === 'published'
                ? 'Update Published'
                : 'Publish Article'}
            </button>
          </div>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MAIN LAYOUT: 70% Single Unified Card / 30% Sidebar             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================ */}
        {/* LEFT COLUMN: ONE SINGLE UNIFIED EDITORIAL CARD (70%)         */}
        {/* ============================================================ */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl border border-[#E5E9EF] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] overflow-hidden">
            {/* 1. ARTICLE TITLE & SLUG SECTION */}
            <div className="p-6 sm:p-7 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-black uppercase text-[#17212B] tracking-wider">
                    ARTICLE TITLE <span className="text-[#FF5A3C]">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-semibold ${
                      formData.title.length > 120 ? 'text-red-500 font-bold' : 'text-[#718096]'
                    }`}
                  >
                    {formData.title.length} / 120
                  </span>
                </div>

                <input
                  type="text"
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="e.g. Navi Mumbai Airport Impact: Property Price Trends & Growth Corridors"
                  className={`w-full px-4 py-3 text-base font-bold rounded-xl bg-white border ${
                    errors.title ? 'border-red-500 ring-1 ring-red-500' : 'border-[#E5E9EF]'
                  } focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/20 text-[#17212B] placeholder:text-[#94A3B8] transition-all outline-none`}
                />
                {errors.title && (
                  <p className="text-xs text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                    <AlertCircle size={13} /> {errors.title}
                  </p>
                )}
              </div>

              {/* Slug Configuration */}
              <div className="pt-3 border-t border-[#E5E9EF]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center flex-1 min-w-0 bg-[#F6F8FA] border border-[#E5E9EF] rounded-xl px-3 py-1.5 focus-within:border-[#FF5A3C] focus-within:bg-white transition-all">
                    <span className="text-xs font-semibold text-[#718096] select-none pr-1">
                      gharmb.com/insights/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => updateFormField('slug', generateSlug(e.target.value))}
                      placeholder="article-slug"
                      className="flex-1 text-xs font-mono text-[#17212B] bg-transparent outline-none border-none py-0.5"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateSlugClick}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-[#718096] hover:text-[#FF5A3C] bg-[#F6F8FA] hover:bg-orange-50 border border-[#E5E9EF] hover:border-[#FF5A3C]/30 transition-all cursor-pointer whitespace-nowrap"
                    title="Generate URL slug from current title"
                  >
                    <Sparkles size={12} className="text-[#FF5A3C]" /> Generate slug
                  </button>
                </div>
              </div>
            </div>

            {/* Section Divider */}
            <div className="h-[1px] bg-[#E5E9EF]" />

            {/* 2. ARTICLE EXCERPT SECTION */}
            <div className="p-6 sm:p-7 space-y-2 bg-[#FAFBFD]/60">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-black uppercase text-[#17212B] tracking-wider">
                  ARTICLE EXCERPT <span className="text-[#FF5A3C]">*</span>
                </label>
                <span
                  className={`text-[11px] font-semibold ${
                    formData.excerpt.length > 280 ? 'text-red-500 font-bold' : 'text-[#718096]'
                  }`}
                >
                  {formData.excerpt.length} / 280 characters
                </span>
              </div>

              <textarea
                rows={3}
                value={formData.excerpt}
                onChange={(e) => updateFormField('excerpt', e.target.value)}
                placeholder="Provide a compelling 2-line summary for insight cards, search results, and social sharing previews..."
                className={`w-full px-4 py-3 text-xs leading-relaxed rounded-xl bg-white border ${
                  errors.excerpt ? 'border-red-500 ring-1 ring-red-500' : 'border-[#E5E9EF]'
                } focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/20 text-[#344054] placeholder:text-[#94A3B8] transition-all outline-none resize-none`}
              />

              {errors.excerpt ? (
                <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle size={13} /> {errors.excerpt}
                </p>
              ) : (
                <p className="text-[11px] text-[#718096]">
                  Used as the article summary across insight cards and search previews.
                </p>
              )}
            </div>

            {/* Section Divider */}
            <div className="h-[1px] bg-[#E5E9EF]" />

            {/* 3. MAIN WYSIWYG CONTENT EDITOR SECTION */}
            <div>
              {/* Toolbar - sticky on scroll */}
              <div className="p-3 border-b border-[#E5E9EF] bg-[#F6F8FA]/90 flex items-center justify-between flex-wrap gap-2 sticky top-[68px] z-10 backdrop-blur-md">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Text Formatting: [B] [I] [U] [S] */}
                  <div className="flex items-center bg-white border border-[#E5E9EF] rounded-xl p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      className={`p-2 rounded-lg text-xs transition-all cursor-pointer ${
                        editor?.isActive('bold')
                          ? 'bg-[#FF5A3C] text-white font-bold shadow-2xs'
                          : 'text-[#17212B] hover:bg-[#F6F8FA] hover:text-[#FF5A3C]'
                      }`}
                      title="Bold (Ctrl+B)"
                      aria-label="Bold"
                    >
                      <Bold size={15} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                      className={`p-2 rounded-lg text-xs transition-all cursor-pointer ${
                        editor?.isActive('italic')
                          ? 'bg-[#FF5A3C] text-white font-bold shadow-2xs'
                          : 'text-[#17212B] hover:bg-[#F6F8FA] hover:text-[#FF5A3C]'
                      }`}
                      title="Italic (Ctrl+I)"
                      aria-label="Italic"
                    >
                      <Italic size={15} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => editor?.chain().focus().toggleUnderline().run()}
                      className={`p-2 rounded-lg text-xs transition-all cursor-pointer ${
                        editor?.isActive('underline')
                          ? 'bg-[#FF5A3C] text-white font-bold shadow-2xs'
                          : 'text-[#17212B] hover:bg-[#F6F8FA] hover:text-[#FF5A3C]'
                      }`}
                      title="Underline (Ctrl+U)"
                      aria-label="Underline"
                    >
                      <UnderlineIcon size={15} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => editor?.chain().focus().toggleStrike().run()}
                      className={`p-2 rounded-lg text-xs transition-all cursor-pointer ${
                        editor?.isActive('strike')
                          ? 'bg-[#FF5A3C] text-white font-bold shadow-2xs'
                          : 'text-[#17212B] hover:bg-[#F6F8FA] hover:text-[#FF5A3C]'
                      }`}
                      title="Strikethrough"
                      aria-label="Strikethrough"
                    >
                      <Strikethrough size={15} />
                    </button>
                  </div>

                  <div className="w-[1px] h-5 bg-[#E5E9EF]" />

                  {/* Headings: [H1] [H2] [H3] [P] */}
                  <div className="flex items-center bg-white border border-[#E5E9EF] rounded-xl p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        editor?.isActive('heading', { level: 1 })
                          ? 'bg-[#FF5A3C] text-white shadow-2xs'
                          : 'text-[#17212B] hover:bg-[#F6F8FA] hover:text-[#FF5A3C]'
                      }`}
                      title="Main Heading (H1)"
                      aria-label="Heading 1"
                    >
                      H1
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        editor?.isActive('heading', { level: 2 })
                          ? 'bg-[#FF5A3C] text-white shadow-2xs'
                          : 'text-[#17212B] hover:bg-[#F6F8FA] hover:text-[#FF5A3C]'
                      }`}
                      title="Section Heading (H2)"
                      aria-label="Heading 2"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        editor?.isActive('heading', { level: 3 })
                          ? 'bg-[#FF5A3C] text-white shadow-2xs'
                          : 'text-[#17212B] hover:bg-[#F6F8FA] hover:text-[#FF5A3C]'
                      }`}
                      title="Sub-heading (H3)"
                      aria-label="Heading 3"
                    >
                      H3
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => editor?.chain().focus().setParagraph().run()}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        editor?.isActive('paragraph')
                          ? 'bg-[#FF5A3C] text-white shadow-2xs'
                          : 'text-[#17212B] hover:bg-[#F6F8FA] hover:text-[#FF5A3C]'
                      }`}
                      title="Normal Paragraph (P)"
                      aria-label="Paragraph"
                    >
                      P
                    </button>
                  </div>

                  <div className="w-[1px] h-5 bg-[#E5E9EF]" />

                  {/* Lists & Quote: [•] [1.] [Quote] */}
                  <div className="flex items-center bg-white border border-[#E5E9EF] rounded-xl p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => editor?.chain().focus().toggleBulletList().run()}
                      className={`p-2 rounded-lg text-xs transition-all cursor-pointer ${
                        editor?.isActive('bulletList')
                          ? 'bg-[#FF5A3C] text-white font-bold shadow-2xs'
                          : 'text-[#17212B] hover:bg-[#F6F8FA] hover:text-[#FF5A3C]'
                      }`}
                      title="Bullet List"
                      aria-label="Bullet List"
                    >
                      <List size={15} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                      className={`p-2 rounded-lg text-xs transition-all cursor-pointer ${
                        editor?.isActive('orderedList')
                          ? 'bg-[#FF5A3C] text-white font-bold shadow-2xs'
                          : 'text-[#17212B] hover:bg-[#F6F8FA] hover:text-[#FF5A3C]'
                      }`}
                      title="Numbered List"
                      aria-label="Numbered List"
                    >
                      <ListOrdered size={15} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                      className={`p-2 rounded-lg text-xs transition-all cursor-pointer ${
                        editor?.isActive('blockquote')
                          ? 'bg-[#FF5A3C] text-white font-bold shadow-2xs'
                          : 'text-[#17212B] hover:bg-[#F6F8FA] hover:text-[#FF5A3C]'
                      }`}
                      title="Editorial Blockquote"
                      aria-label="Blockquote"
                    >
                      <Quote size={15} />
                    </button>
                  </div>

                  <div className="w-[1px] h-5 bg-[#E5E9EF]" />

                  {/* Media & Actions: [Link] [Image] [Divider] */}
                  <div className="flex items-center bg-white border border-[#E5E9EF] rounded-xl p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleOpenLinkModal}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        editor?.isActive('link')
                          ? 'bg-[#FF5A3C] text-white'
                          : 'text-[#17212B] hover:bg-[#F6F8FA] hover:text-[#FF5A3C]'
                      }`}
                      title="Insert or Edit Hyperlink"
                      aria-label="Insert Link"
                    >
                      <Link2 size={15} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleOpenImageModal}
                      className="p-2 rounded-lg text-[#17212B] hover:bg-[#F6F8FA] hover:text-[#FF5A3C] transition-colors cursor-pointer"
                      title="Insert Body Image (Upload or URL with caption)"
                      aria-label="Insert Image"
                    >
                      <ImageIcon size={15} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                      className="p-2 rounded-lg text-[#17212B] hover:bg-[#F6F8FA] hover:text-[#FF5A3C] transition-colors cursor-pointer"
                      title="Horizontal Divider"
                      aria-label="Horizontal Divider"
                    >
                      <Minus size={15} />
                    </button>
                  </div>

                  <div className="w-[1px] h-5 bg-[#E5E9EF]" />

                  {/* Clear Formatting: [Clear] */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
                    className="p-2 rounded-xl bg-white border border-[#E5E9EF] text-[#718096] hover:bg-[#F6F8FA] hover:text-red-500 transition-colors cursor-pointer shadow-2xs"
                    title="Clear Formatting"
                    aria-label="Clear Formatting"
                  >
                    <RemoveFormatting size={15} />
                  </button>
                </div>

                {/* HTML Source Toggle */}
                <button
                  type="button"
                  onClick={handleToggleHtmlSource}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    showHtmlSource
                      ? 'bg-[#17212B] text-white shadow-sm'
                      : 'bg-white border border-[#E5E9EF] text-[#718096] hover:text-[#17212B] hover:bg-[#F6F8FA]'
                  }`}
                  title="Toggle HTML Source Code View"
                >
                  <Code size={13} /> {showHtmlSource ? 'Visual Editor' : 'HTML Source'}
                </button>
              </div>

              {/* Editable Content Workspace */}
              <div
                className="p-7 sm:p-8 cursor-text bg-white"
                onClick={() => {
                  if (!showHtmlSource && editor && !editor.isFocused) {
                    editor.chain().focus().run();
                  }
                }}
              >
                {showHtmlSource ? (
                  <textarea
                    rows={22}
                    value={formData.content}
                    onChange={(e) => updateFormField('content', e.target.value)}
                    className="w-full p-5 font-mono text-xs leading-relaxed rounded-xl bg-slate-900 text-emerald-400 outline-none resize-y border border-slate-700 font-medium"
                    placeholder="<p>Write raw semantic HTML here...</p>"
                  />
                ) : (
                  <EditorContent editor={editor} className="outline-none" />
                )}
              </div>

              {/* Editor Footer Bar (Word Count & Reading Time) */}
              <div className="px-6 py-3 border-t border-[#E5E9EF] bg-[#F6F8FA]/60 flex items-center justify-between text-xs text-[#718096]">
                <div className="flex items-center gap-4">
                  <span>
                    Words: <strong className="text-[#17212B] font-bold">{liveStats.words.toLocaleString()}</strong>
                  </span>
                  <span>
                    Est. Read Time: <strong className="text-[#17212B] font-bold">{liveStats.minutes} min</strong>
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-[#718096]">
                  {showHtmlSource ? 'Raw HTML Mode' : 'WYSIWYG Editorial Mode (TipTap Engine)'}
                </span>
              </div>
            </div>

            {/* Section Divider */}
            <div className="h-[1px] bg-[#E5E9EF]" />

            {/* 4. TAGS & KEYWORDS SECTION */}
            <div className="p-6 sm:p-7 space-y-3 bg-[#FAFBFD]/60">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase text-[#17212B] tracking-wider flex items-center gap-1.5">
                  <Tag size={14} className="text-[#FF5A3C]" /> TAGS & KEYWORDS
                </label>
                <span className="text-[11px] text-[#718096]">{formData.tags.length} tags</span>
              </div>

              <div className="min-h-[50px] p-2.5 rounded-xl border border-[#E5E9EF] bg-white focus-within:border-[#FF5A3C] focus-within:ring-2 focus-within:ring-[#FF5A3C]/20 transition-all flex flex-wrap items-center gap-2">
                {formData.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F6F8FA] border border-[#E5E9EF] text-xs font-bold text-[#17212B] shadow-2xs group hover:border-[#FF5A3C]/40 transition-colors"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(idx)}
                      className="p-0.5 rounded text-[#718096] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title={`Remove tag ${tag}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}

                <input
                  type="text"
                  value={tagInputText}
                  onChange={(e) => setTagInputText(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => {
                    if (tagInputText.trim()) handleAddTag(tagInputText);
                  }}
                  placeholder={formData.tags.length === 0 ? "Type tag name & press Enter (e.g. Interior Design, Investment)..." : "Add another tag..."}
                  className="flex-1 min-w-[180px] bg-transparent text-xs font-medium text-[#17212B] outline-none border-none py-1 px-1 placeholder:text-[#94A3B8]"
                />
              </div>
              <p className="text-[11px] text-[#718096]">
                Press <kbd className="px-1.5 py-0.5 rounded bg-[#E5E9EF] text-[#17212B] font-mono text-[10px]">Enter</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-[#E5E9EF] text-[#17212B] font-mono text-[10px]">,</kbd> to create a tag chip.
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: SIDEBAR (30%)                                  */}
        {/* ============================================================ */}
        <div className="lg:col-span-4 space-y-6">
          {/* ARTICLE SETTINGS CARD */}
          <section className="bg-white rounded-2xl border border-[#E5E9EF] p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E9EF] pb-3">
              <h3 className="text-xs font-black uppercase text-[#17212B] tracking-wider flex items-center gap-1.5">
                <Folder size={14} className="text-[#FF5A3C]" /> ARTICLE SETTINGS
              </h3>
            </div>

            {/* Category Select */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#17212B]">
                  Category <span className="text-[#FF5A3C]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(true)}
                  className="text-xs text-[#FF5A3C] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} /> Add New
                </button>
              </div>

              <select
                value={formData.category}
                onChange={(e) => updateFormField('category', e.target.value)}
                className={`w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-[#F6F8FA] border ${
                  errors.category ? 'border-red-500' : 'border-[#E5E9EF]'
                } focus:border-[#FF5A3C] focus:bg-white text-[#17212B] transition-all outline-none cursor-pointer`}
              >
                <option value="">-- Select Category --</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.category}
                </p>
              )}
            </div>

            {/* Author Name */}
            <div>
              <label className="block text-xs font-bold text-[#17212B] mb-1.5 flex items-center gap-1">
                <User size={13} className="text-[#718096]" /> Author
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => updateFormField('author', e.target.value)}
                placeholder="e.g. GharMB Editorial or Author Name"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F6F8FA] border border-[#E5E9EF] focus:border-[#FF5A3C] focus:bg-white text-[#17212B] transition-all outline-none"
              />
            </div>

            {/* Read Time */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#17212B] flex items-center gap-1">
                  <Clock size={13} className="text-[#718096]" /> Estimated Read Time
                </label>
                <span className="text-[11px] text-[#718096]">Auto-calculated</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={formData.readTime}
                  onChange={(e) => updateFormField('readTime', Number(e.target.value))}
                  className="w-24 px-3.5 py-2 text-xs rounded-xl bg-[#F6F8FA] border border-[#E5E9EF] focus:border-[#FF5A3C] focus:bg-white text-[#17212B] transition-all outline-none"
                />
                <span className="text-xs font-bold text-[#718096]">minutes</span>
              </div>
            </div>

            {/* Featured Article Switch */}
            <div className="pt-3 border-t border-[#E5E9EF] flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[#17212B]">Featured Hero Article</p>
                <p className="text-[11px] text-[#718096] mt-0.5 leading-snug">
                  Highlights in top hero carousel on the public Insights page.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => updateFormField('isFeatured', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#E5E9EF] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E5E9EF] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF5A3C]"></div>
              </label>
            </div>
          </section>

          {/* FEATURED BANNER IMAGE CARD */}
          <section className="bg-white rounded-2xl border border-[#E5E9EF] p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E9EF] pb-3">
              <h3 className="text-xs font-black uppercase text-[#17212B] tracking-wider flex items-center gap-1.5">
                <ImageIcon size={14} className="text-[#FF5A3C]" /> FEATURED IMAGE
              </h3>
            </div>

            {/* Preview or Empty Area */}
            {formData.bannerImage ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-[#E5E9EF] group aspect-video bg-[#F6F8FA]">
                  <img
                    src={formData.bannerImage}
                    alt="Featured article banner preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => bannerFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-white text-[#17212B] text-xs font-bold shadow-md hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => updateFormField('bannerImage', '')}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold shadow-md hover:bg-red-700 transition-all cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#718096]">
                  <span>1200 × 630 px (16:9)</span>
                  <button
                    type="button"
                    onClick={() => updateFormField('bannerImage', '')}
                    className="text-red-500 font-semibold hover:underline cursor-pointer"
                  >
                    Remove image
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => bannerFileInputRef.current?.click()}
                className="rounded-xl border-2 border-dashed border-[#E5E9EF] hover:border-[#FF5A3C] bg-[#F6F8FA] hover:bg-orange-50/20 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
              >
                <UploadCloud size={32} className="text-[#94A3B8] group-hover:text-[#FF5A3C] mb-2 transition-colors" />
                <p className="text-xs font-bold text-[#17212B]">Click to upload banner</p>
                <p className="text-[10px] text-[#718096] mt-0.5">PNG, JPG, WebP up to 5MB</p>
              </div>
            )}

            {/* Hidden File Input */}
            <input
              type="file"
              ref={bannerFileInputRef}
              onChange={handleBannerUpload}
              accept="image/*"
              className="hidden"
            />

            {!formData.bannerImage && (
              <button
                type="button"
                onClick={() => bannerFileInputRef.current?.click()}
                disabled={isUploadingBanner}
                className="w-full py-2.5 px-3 rounded-xl border border-[#E5E9EF] bg-[#F6F8FA] hover:bg-white text-xs font-bold text-[#17212B] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <UploadCloud size={14} className={isUploadingBanner ? 'animate-spin text-[#FF5A3C]' : 'text-[#718096]'} />
                {isUploadingBanner ? 'Uploading Banner...' : 'Upload Image File'}
              </button>
            )}

            {/* Direct Image URL input */}
            <div>
              <label className="block text-[11px] font-bold text-[#718096] mb-1">
                Or paste image URL:
              </label>
              <input
                type="url"
                value={formData.bannerImage}
                onChange={(e) => updateFormField('bannerImage', e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F6F8FA] border border-[#E5E9EF] focus:border-[#FF5A3C] focus:bg-white text-[#17212B] outline-none"
              />
            </div>

            <p className="text-[10px] text-[#718096]">
              Recommended: 1200 × 630px for social sharing & hero banner.
            </p>
          </section>

          {/* SEO & SOCIAL META (Collapsible) */}
          <section className="bg-white rounded-2xl border border-[#E5E9EF] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] overflow-hidden">
            <button
              type="button"
              onClick={() => setIsSeoOpen(!isSeoOpen)}
              className="w-full p-6 pb-4 flex items-center justify-between text-left cursor-pointer bg-white"
            >
              <h3 className="text-xs font-black uppercase text-[#17212B] tracking-wider flex items-center gap-1.5">
                <Globe size={14} className="text-[#FF5A3C]" /> SEO & SOCIAL META
              </h3>
              <span className="text-[#718096] p-1 rounded-lg hover:bg-[#F6F8FA]">
                {isSeoOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>

            {isSeoOpen && (
              <div className="px-6 pb-6 space-y-4 pt-1 border-t border-[#E5E9EF]">
                {/* Google-Style Live Search Preview Snippet */}
                <div className="p-3.5 rounded-xl bg-[#F6F8FA] border border-[#E5E9EF] space-y-1">
                  <span className="text-[10px] font-black uppercase text-[#718096] tracking-wider block mb-1">
                    Google Search Preview
                  </span>
                  <p className="text-[11px] text-[#16A36A] font-medium truncate font-mono">
                    gharmb.com/insights/{formData.slug || 'article-slug'}
                  </p>
                  <p className="text-sm font-semibold text-[#1a0dab] hover:underline cursor-pointer line-clamp-1">
                    {formData.seo.metaTitle || formData.title || 'GharMB | Article Title'}
                  </p>
                  <p className="text-xs text-[#545454] line-clamp-2 leading-relaxed">
                    {formData.seo.metaDescription || formData.excerpt || 'Short description preview will appear here in search engine rankings...'}
                  </p>
                </div>

                {/* SEO Title */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-[#17212B]">
                      SEO Title
                    </label>
                    <span
                      className={`text-[10px] font-semibold ${
                        formData.seo.metaTitle.length > 60 ? 'text-red-500 font-bold' : 'text-[#718096]'
                      }`}
                    >
                      {formData.seo.metaTitle.length} / 60
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.seo.metaTitle}
                    onChange={(e) => updateSeoField('metaTitle', e.target.value)}
                    placeholder={formData.title || 'SEO Title for search engines'}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#F6F8FA] border border-[#E5E9EF] focus:border-[#FF5A3C] focus:bg-white text-[#17212B] outline-none"
                  />
                </div>

                {/* SEO Description */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-[#17212B]">
                      SEO Description
                    </label>
                    <span
                      className={`text-[10px] font-semibold ${
                        formData.seo.metaDescription.length > 160 ? 'text-red-500 font-bold' : 'text-[#718096]'
                      }`}
                    >
                      {formData.seo.metaDescription.length} / 160
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.seo.metaDescription}
                    onChange={(e) => updateSeoField('metaDescription', e.target.value)}
                    placeholder={formData.excerpt || 'Meta description for Google snippets (150-160 chars)...'}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#F6F8FA] border border-[#E5E9EF] focus:border-[#FF5A3C] focus:bg-white text-[#17212B] outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Focus Keyword */}
                <div>
                  <label className="block text-[11px] font-bold text-[#17212B] mb-1">
                    Focus Keyword
                  </label>
                  <input
                    type="text"
                    value={formData.seo.focusKeyword}
                    onChange={(e) => updateSeoField('focusKeyword', e.target.value)}
                    placeholder="e.g. Navi Mumbai real estate"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#F6F8FA] border border-[#E5E9EF] focus:border-[#FF5A3C] focus:bg-white text-[#17212B] outline-none"
                  />
                </div>

                {/* Canonical URL */}
                <div>
                  <label className="block text-[11px] font-bold text-[#17212B] mb-1">
                    Canonical URL
                  </label>
                  <input
                    type="url"
                    value={formData.seo.canonicalUrl}
                    onChange={(e) => updateSeoField('canonicalUrl', e.target.value)}
                    placeholder="https://gharmb.com/insights/..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#F6F8FA] border border-[#E5E9EF] focus:border-[#FF5A3C] focus:bg-white text-[#17212B] outline-none"
                  />
                </div>
              </div>
            )}
          </section>

          {/* PUBLISHING & METADATA CARD */}
          {isEditMode && (
            <section className="bg-white rounded-2xl border border-[#E5E9EF] p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] space-y-3">
              <h3 className="text-xs font-black uppercase text-[#17212B] tracking-wider border-b border-[#E5E9EF] pb-2.5 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#16A36A]" /> PUBLISHING STATUS
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#718096]">Current Status:</span>
                  <span
                    className={`font-bold capitalize ${
                      formData.status === 'published' ? 'text-[#16A36A]' : 'text-amber-600'
                    }`}
                  >
                    {formData.status}
                  </span>
                </div>

                {metaTimestamps.publishedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#718096]">Published Date:</span>
                    <span className="font-semibold text-[#17212B]">
                      {new Date(metaTimestamps.publishedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}

                {metaTimestamps.updatedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#718096]">Last Updated:</span>
                    <span className="font-semibold text-[#17212B]">
                      {new Date(metaTimestamps.updatedAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </div>

              {formData.status === 'published' && (
                <div className="pt-2 border-t border-[#E5E9EF]">
                  <button
                    type="button"
                    onClick={handleCopyPublicUrl}
                    className="w-full py-2 px-3 rounded-xl border border-[#E5E9EF] bg-[#F6F8FA] hover:bg-white text-xs font-bold text-[#17212B] flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {copiedUrl ? (
                      <>
                        <Check size={13} className="text-[#16A36A]" /> Copied to Clipboard
                      </>
                    ) : (
                      <>
                        <Copy size={13} className="text-[#718096]" /> Copy Article URL
                      </>
                    )}
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: ADD CATEGORY IN-PAGE (NO REDIRECT)                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E9EF] p-6 max-w-md w-full shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 border-b border-[#E5E9EF] pb-3">
              <h3 className="text-sm font-black text-[#17212B] flex items-center gap-2">
                <Folder size={16} className="text-[#FF5A3C]" /> Add New Category
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="p-1 rounded-lg text-[#718096] hover:bg-[#F6F8FA] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#17212B] mb-1.5">
                  Category Name <span className="text-[#FF5A3C]">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newCatName}
                  onChange={(e) => {
                    setNewCatName(e.target.value);
                    if (catError) setCatError('');
                  }}
                  placeholder="e.g. Real Estate Tech, Market Analysis..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E5E9EF] focus:border-[#FF5A3C] outline-none text-[#17212B]"
                />
                {catError && (
                  <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {catError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E9EF]">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-[#E5E9EF] text-[#718096] hover:bg-[#F6F8FA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingCat || !newCatName.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#FF5A3C] hover:bg-[#E04F34] text-white cursor-pointer disabled:opacity-50"
                >
                  {isAddingCat ? 'Adding...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: INSERT / UPLOAD IMAGE INTO ARTICLE BODY                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E9EF] p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 border-b border-[#E5E9EF] pb-3">
              <h3 className="text-sm font-black text-[#17212B] flex items-center gap-2">
                <ImageIcon size={16} className="text-[#FF5A3C]" /> Insert Image into Article
              </h3>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="p-1 rounded-lg text-[#718096] hover:bg-[#F6F8FA] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tab Switches */}
            <div className="flex rounded-xl bg-[#F6F8FA] p-1 mb-4 border border-[#E5E9EF]">
              <button
                type="button"
                onClick={() => setImageModalTab('upload')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  imageModalTab === 'upload'
                    ? 'bg-white text-[#17212B] shadow-2xs'
                    : 'text-[#718096] hover:text-[#17212B]'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setImageModalTab('url')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  imageModalTab === 'url'
                    ? 'bg-white text-[#17212B] shadow-2xs'
                    : 'text-[#718096] hover:text-[#17212B]'
                }`}
              >
                Image URL
              </button>
            </div>

            <form onSubmit={handleInsertImageIntoEditor} className="space-y-4">
              {imageModalTab === 'upload' ? (
                <div>
                  <input
                    type="file"
                    ref={inlineImageFileInputRef}
                    onChange={handleInlineImageFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <div
                    onClick={() => inlineImageFileInputRef.current?.click()}
                    className="rounded-xl border-2 border-dashed border-[#E5E9EF] hover:border-[#FF5A3C] bg-[#F6F8FA] hover:bg-orange-50/20 p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                  >
                    <UploadCloud size={28} className="text-[#94A3B8] mb-1.5" />
                    <p className="text-xs font-bold text-[#17212B]">
                      {isUploadingInline ? 'Uploading...' : 'Click to select image file'}
                    </p>
                    <p className="text-[10px] text-[#718096]">JPG, PNG, WebP up to 5MB</p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-[#17212B] mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={modalImageUrl}
                    onChange={(e) => setModalImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E9EF] focus:border-[#FF5A3C] outline-none"
                  />
                </div>
              )}

              {/* Preview if image URL exists */}
              {modalImageUrl && (
                <div className="relative rounded-xl overflow-hidden border border-[#E5E9EF] max-h-48 bg-[#F6F8FA]">
                  <img
                    src={modalImageUrl}
                    alt="Preview"
                    className="w-full h-36 object-cover"
                  />
                </div>
              )}

              {/* Alt Text & Caption */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#17212B] mb-1">
                    Alt Text (Accessibility & SEO)
                  </label>
                  <input
                    type="text"
                    value={modalImageAlt}
                    onChange={(e) => setModalImageAlt(e.target.value)}
                    placeholder="Describe image..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E9EF] focus:border-[#FF5A3C] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#17212B] mb-1">
                    Caption / Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={modalImageCaption}
                    onChange={(e) => setModalImageCaption(e.target.value)}
                    placeholder="Photo credits or caption..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E9EF] focus:border-[#FF5A3C] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E9EF]">
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-[#E5E9EF] text-[#718096] hover:bg-[#F6F8FA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!modalImageUrl.trim() || isUploadingInline}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#FF5A3C] hover:bg-[#E04F34] text-white cursor-pointer disabled:opacity-50"
                >
                  Insert Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: INSERT / EDIT LINK                                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E9EF] p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 border-b border-[#E5E9EF] pb-3">
              <h3 className="text-sm font-black text-[#17212B] flex items-center gap-2">
                <Link2 size={16} className="text-[#FF5A3C]" /> Insert Hyperlink
              </h3>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="p-1 rounded-lg text-[#718096] hover:bg-[#F6F8FA] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleApplyLink} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#17212B] mb-1">
                  Destination URL <span className="text-[#FF5A3C]">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://gharmb.com/properties or https://..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E5E9EF] focus:border-[#FF5A3C] outline-none text-[#17212B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17212B] mb-1">
                  Display Text (Optional if text selected)
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Text to display..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E5E9EF] focus:border-[#FF5A3C] outline-none text-[#17212B]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="linkNewTab"
                  checked={linkOpenInNewTab}
                  onChange={(e) => setLinkOpenInNewTab(e.target.checked)}
                  className="w-4 h-4 text-[#FF5A3C] rounded accent-[#FF5A3C] cursor-pointer"
                />
                <label htmlFor="linkNewTab" className="text-xs font-semibold text-[#17212B] cursor-pointer select-none">
                  Open link in new tab (target="_blank")
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E9EF]">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-[#E5E9EF] text-[#718096] hover:bg-[#F6F8FA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!linkUrl.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#FF5A3C] hover:bg-[#E04F34] text-white cursor-pointer disabled:opacity-50"
                >
                  Apply Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: UNSAVED CHANGES EXIT CONFIRMATION                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showExitConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E9EF] p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-3 text-amber-600">
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-base font-extrabold text-[#17212B]">
                Unsaved Changes
              </h3>
            </div>

            <p className="text-xs text-[#718096] leading-relaxed mb-6">
              You have unsaved changes in this article. If you leave now, your recent edits will be lost.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowExitConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-[#E5E9EF] text-[#17212B] hover:bg-[#F6F8FA] cursor-pointer"
              >
                Stay & Continue Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDirty(false);
                  setShowExitConfirmModal(false);
                  if (pendingNavigationPath) {
                    navigate(pendingNavigationPath);
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-sm"
              >
                Leave without saving
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightsEditor;
