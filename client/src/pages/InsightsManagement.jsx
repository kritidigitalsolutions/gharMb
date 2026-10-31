import React, { useState, useEffect } from 'react';
import AdminLoader from '../components/common/AdminLoader';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus, Search, Edit, Trash2, Eye,
  CheckCircle2, Clock, Folder, ExternalLink,
  Calendar, User, AlertCircle, RefreshCw, Layers, CheckSquare,
  Square, X, Check, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, FileText, BookOpen, SlidersHorizontal,
  RotateCcw, Sparkles
} from 'lucide-react';
import API from '../api/api';
import Badge from '../components/ui/Badge';

const WEBPAGE_URL = import.meta.env.VITE_WEBSITE_URL || 'http://localhost:5174';

const InsightsManagement = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selection & Bulk Operations
  const [selectedBlogIds, setSelectedBlogIds] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkUpdatingStatus, setIsBulkUpdatingStatus] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Image load error tracking per blog ID (avoids fake mock fallback images)
  const [failedImages, setFailedImages] = useState({});

  // Real Database Stats
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    views: 0,
  });

  // Single Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    blogId: null,
    title: '',
    isDeleting: false,
  });

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Fetch real categories from database
  const fetchCategories = async () => {
    try {
      const res = await API.get('/admin/blog-categories');
      if (res.data?.data?.categories) {
        setCategories(res.data.data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Fetch real blogs & aggregate database stats
  const fetchBlogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;
      params.sort = sortDirection;

      const res = await API.get('/admin/blogs', { params });
      if (res.data?.data?.blogs) {
        setBlogs(res.data.data.blogs);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.totalCount || 0);
      }

      // Use real aggregated stats from the database
      if (res.data?.stats) {
        setStats(res.data.stats);
      } else if (res.data) {
        // Safe fallback only if backend hasn't provided global stats
        const publishedCount = res.data.data.blogs.filter(b => b.isPublished).length;
        const draftCount = res.data.data.blogs.filter(b => !b.isPublished).length;
        const totalViews = res.data.data.blogs.reduce((acc, b) => acc + (b.views || 0), 0);
        setStats({
          total: res.data.totalCount || res.data.data.blogs.length,
          published: publishedCount,
          draft: draftCount,
          views: totalViews,
        });
      }
    } catch (err) {
      console.error('Error fetching blogs:', err);
      setError('Failed to load articles. Please verify database connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setSelectedBlogIds([]);
    fetchBlogs();
  }, [currentPage, pageSize, selectedCategory, selectedStatus, sortDirection]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      setSelectedBlogIds([]);
      fetchBlogs();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Check active filter state
  const hasActiveFilters = Boolean(search.trim() || selectedCategory || selectedStatus);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  // Select All / Deselect All
  const isAllSelected = blogs.length > 0 && selectedBlogIds.length === blogs.length;
  const isSomeSelected = selectedBlogIds.length > 0 && selectedBlogIds.length < blogs.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedBlogIds([]);
    } else {
      setSelectedBlogIds(blogs.map(b => b._id));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedBlogIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Bulk Delete Execution
  const handleBulkDeleteConfirm = async () => {
    if (selectedBlogIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const res = await API.post('/admin/blogs/bulk-delete', { ids: selectedBlogIds });
      triggerToast(res.data?.message || `${selectedBlogIds.length} articles deleted successfully.`);
      setSelectedBlogIds([]);
      setShowBulkDeleteModal(false);
      fetchBlogs();
    } catch (err) {
      console.error('Error bulk deleting blogs:', err);
      triggerToast(err.response?.data?.message || 'Failed to delete selected articles.', 'error');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Bulk Status Update (Publish / Draft)
  const handleBulkStatusUpdate = async (targetStatus) => {
    if (selectedBlogIds.length === 0) return;
    setIsBulkUpdatingStatus(true);
    try {
      const res = await API.patch('/admin/blogs/bulk-status', {
        ids: selectedBlogIds,
        status: targetStatus,
      });
      triggerToast(res.data?.message || `${selectedBlogIds.length} articles marked as ${targetStatus}.`);
      setSelectedBlogIds([]);
      fetchBlogs();
    } catch (err) {
      console.error('Error updating bulk status:', err);
      triggerToast(err.response?.data?.message || 'Failed to update selected articles.', 'error');
    } finally {
      setIsBulkUpdatingStatus(false);
    }
  };

  // Toggle publish / unpublish for single item
  const handleTogglePublish = async (blog) => {
    try {
      const action = blog.isPublished ? 'unpublish' : 'publish';
      await API.patch(`/admin/blogs/${blog._id}/${action}`);
      triggerToast(`Article ${action === 'publish' ? 'published' : 'moved to draft'} successfully!`);
      fetchBlogs();
    } catch (err) {
      console.error('Error updating status:', err);
      triggerToast(err.response?.data?.message || 'Failed to update article status.', 'error');
    }
  };

  // Single Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!deleteModal.blogId) return;
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      await API.delete(`/admin/blogs/${deleteModal.blogId}`);
      triggerToast('Article deleted successfully.');
      setDeleteModal({ open: false, blogId: null, title: '', isDeleting: false });
      fetchBlogs();
    } catch (err) {
      console.error('Error deleting blog:', err);
      triggerToast(err.response?.data?.message || 'Failed to delete article.', 'error');
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Format real dates cleanly
  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg border text-xs font-semibold flex items-center gap-2.5 transition-all animate-in fade-in slide-in-from-top-3 ${
            toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/60 dark:border-red-900 dark:text-red-300'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-900 dark:text-emerald-300'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Clean Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
              Insights & Articles
            </h1>
            <Badge color="slate" variant="pastel" size="xs">
              {stats.total} total
            </Badge>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Manage real estate research, buyer guides, market updates, and editorial categories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/insights/categories"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] transition-colors shadow-xs"
          >
            <Layers size={14} className="text-slate-500" />
            Categories ({categories.length})
          </Link>

          <Link
            to="/admin/insights/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand hover:bg-brand-dark text-white transition-all shadow-xs hover:shadow-sm active:scale-98"
          >
            <Plus size={15} />
            New Article
          </Link>
        </div>
      </div>

      {/* Minimal Filter & Search Toolbar */}
      <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xs flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, excerpt, tag..."
            className="w-full pl-9 pr-8 h-8 text-xs rounded-lg bg-[var(--bg-muted)]/50 border border-[var(--border)] focus:bg-[var(--bg-surface)] focus:border-brand text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter pills */}
          <div className="flex items-center p-0.5 bg-[var(--bg-muted)]/60 rounded-lg border border-[var(--border)] text-xs">
            <button
              type="button"
              onClick={() => {
                setSelectedStatus('all');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                selectedStatus === 'all'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedStatus('published');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                selectedStatus === 'published'
                  ? 'bg-[var(--bg-surface)] text-emerald-600 dark:text-emerald-400 shadow-2xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Published ({stats.published})
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedStatus('draft');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                selectedStatus === 'draft'
                  ? 'bg-[var(--bg-surface)] text-amber-600 dark:text-amber-400 shadow-2xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Drafts ({stats.draft})
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8 px-2.5 text-xs rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] outline-none cursor-pointer hover:bg-[var(--bg-muted)] transition-colors"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name} {cat.articleCount !== undefined ? `(${cat.articleCount})` : ''}
              </option>
            ))}
          </select>

          {/* Sort Direction Toggle */}
          <button
            onClick={() => setSortDirection(prev => (prev === 'desc' ? 'asc' : 'desc'))}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] transition-colors cursor-pointer"
            title={`Sorting ${sortDirection === 'desc' ? 'Newest first' : 'Oldest first'}`}
          >
            <ArrowUpDown size={13} className="text-slate-500" />
            <span>{sortDirection === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={fetchBlogs}
            title="Refresh articles"
            className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedBlogIds.length > 0 && (
        <div className="sticky top-4 z-30 p-2.5 px-4 rounded-xl bg-slate-900 text-white shadow-xl flex items-center justify-between flex-wrap gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px] font-bold">
              {selectedBlogIds.length}
            </span>
            <span className="text-xs font-medium">
              {selectedBlogIds.length} article{selectedBlogIds.length === 1 ? '' : 's'} selected
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={isBulkUpdatingStatus}
              onClick={() => handleBulkStatusUpdate('published')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 size={13} /> Publish
            </button>

            <button
              type="button"
              disabled={isBulkUpdatingStatus}
              onClick={() => handleBulkStatusUpdate('draft')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-700 hover:bg-slate-600 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <Clock size={13} /> Move to Draft
            </button>

            <button
              type="button"
              disabled={isBulkDeleting}
              onClick={() => setShowBulkDeleteModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={13} /> Delete
            </button>

            <button
              type="button"
              onClick={() => setSelectedBlogIds([])}
              className="p-1 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
              title="Clear selection"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xs overflow-hidden">
        {isLoading ? (
          <AdminLoader
            text="Loading insights articles..."
            subtext="Fetching articles, categories, and reader metrics"
            minHeight="min-h-[260px]"
          />
        ) : error ? (
          <div className="py-16 text-center px-4">
            <AlertCircle size={28} className="mx-auto text-red-500 mb-2" />
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
            <button
              onClick={fetchBlogs}
              className="mt-3 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand text-white cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : blogs.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <BookOpen size={22} />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">No articles found</h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mt-1">
              {hasActiveFilters
                ? 'No articles match your current search and filter criteria.'
                : 'Get started by creating your first insight article.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {hasActiveFilters ? (
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              ) : (
                <Link
                  to="/admin/insights/new"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand text-white shadow-xs"
                >
                  <Plus size={14} /> Create Article
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
              <colgroup>
                <col className="w-[3.5%]" />
                <col className="w-[3.5%]" />
                <col className="w-[30%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[6%]" />
                <col className="w-[10%]" />
                <col className="w-[13%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-muted)]/50 text-[11px] font-semibold text-[var(--text-muted)]">
                  <th className="py-2 px-2 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={handleToggleSelectAll}
                      className="w-3.5 h-3.5 rounded accent-brand cursor-pointer"
                      title="Select all on this page"
                    />
                  </th>
                  <th className="py-2 px-2 text-center font-mono align-middle">#</th>
                  <th className="py-2 px-3 align-middle">Article</th>
                  <th className="py-2 px-3 align-middle">Category</th>
                  <th className="py-2 px-3 align-middle">Author</th>
                  <th className="py-2 px-3 align-middle">Status</th>
                  <th className="py-2 px-3 text-right align-middle">Views</th>
                  <th className="py-2 px-3 align-middle">Published</th>
                  <th className="py-2 pl-2 pr-4 text-right align-middle">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {blogs.map((blog, index) => {
                  const isSelected = selectedBlogIds.includes(blog._id);
                  const pubDate = formatDate(blog.publishedAt || blog.createdAt);
                  const hasImage = Boolean(blog.bannerImage && !failedImages[blog._id]);

                  return (
                    <tr
                      key={blog._id}
                      className={`transition-colors duration-100 ${
                        isSelected
                          ? 'bg-brand/5 dark:bg-brand/10'
                          : 'hover:bg-[var(--bg-muted)]/40'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-1.5 px-2 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(blog._id)}
                          className="w-3.5 h-3.5 rounded accent-brand cursor-pointer"
                        />
                      </td>

                      {/* S.No */}
                      <td className="py-1.5 px-2 text-center font-mono text-[11px] text-[var(--text-muted)] align-middle">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      {/* Article Details */}
                      <td className="py-1.5 px-3 align-middle min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Banner thumbnail */}
                          <div className="w-10 h-7 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 border border-[var(--border)] shrink-0 flex items-center justify-center">
                            {hasImage ? (
                              <img
                                src={blog.bannerImage}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={() =>
                                  setFailedImages(prev => ({ ...prev, [blog._id]: true }))
                                }
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800/80">
                                <BookOpen size={12} className="opacity-60" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 truncate">
                            <Link
                              to={`/admin/insights/edit/${blog._id}`}
                              className="font-medium text-xs text-[var(--text-primary)] hover:text-brand truncate block transition-colors"
                              title={blog.title}
                            >
                              {blog.title}
                            </Link>
                            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] truncate">
                              <span className="font-mono text-slate-400 truncate">
                                /{blog.slug}
                              </span>
                              {blog.isFeatured && (
                                <Badge.Featured size="xs">
                                  Featured
                                </Badge.Featured>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-1.5 px-3 align-middle whitespace-nowrap min-w-0">
                        <Badge color="purple" variant="pastel" size="xs" icon={<Folder size={10} className="shrink-0" />}>
                          {blog.category?.name || 'Uncategorized'}
                        </Badge>
                      </td>

                      {/* Author & Read Time */}
                      <td className="py-1.5 px-3 align-middle whitespace-nowrap min-w-0 text-[11px]">
                        <div className="flex items-center gap-1 text-[var(--text-primary)] font-medium truncate">
                          <User size={10} className="text-slate-400 shrink-0" />
                          <span className="truncate">{blog.author || 'Admin'}</span>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                          <Clock size={9} />
                          <span>{blog.readTime || 5}m</span>
                        </div>
                      </td>

                      {/* Status toggle pill */}
                      <td className="py-1.5 px-3 align-middle whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(blog)}
                          title="Click to toggle publish status"
                          className="inline-flex cursor-pointer transition-transform active:scale-95"
                        >
                          {blog.isPublished ? (
                            <Badge.Active size="xs">Published</Badge.Active>
                          ) : (
                            <Badge color="amber" variant="pastel" size="xs" dot icon={<Clock size={10} className="shrink-0" />}>
                              Draft
                            </Badge>
                          )}
                        </button>
                      </td>

                      {/* Views */}
                      <td className="py-1.5 px-3 align-middle whitespace-nowrap text-right font-mono text-[11px] font-semibold text-[var(--text-primary)]">
                        {Number(blog.views || 0).toLocaleString()}
                      </td>

                      {/* Date */}
                      <td className="py-1.5 px-3 align-middle whitespace-nowrap text-[10px] text-[var(--text-muted)]">
                        {pubDate ? (
                          <span className="truncate block">{pubDate}</span>
                        ) : (
                          <span className="text-slate-400 italic">Draft</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-1.5 pl-2 pr-4 text-right align-middle whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1 shrink-0">
                          {blog.isPublished && (
                            <a
                              href={`${WEBPAGE_URL}/insights/${blog.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-brand hover:border-brand/40 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                              title="View on live website"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}

                          <Link
                            to={`/admin/insights/edit/${blog._id}`}
                            className="w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-brand hover:border-brand/40 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                            title="Edit article"
                          >
                            <Edit size={12} />
                          </Link>

                          <button
                            onClick={() =>
                              setDeleteModal({
                                open: true,
                                blogId: blog._id,
                                title: blog.title,
                                isDeleting: false,
                              })
                            }
                            className="w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-900/50 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                            title="Delete article"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Minimal Footer with Pagination */}
        <div className="p-3 px-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              Showing{' '}
              <strong className="text-[var(--text-primary)]">
                {blogs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
              </strong>
              –
              <strong className="text-[var(--text-primary)]">
                {Math.min(currentPage * pageSize, totalCount)}
              </strong>{' '}
              of <strong className="text-[var(--text-primary)]">{totalCount}</strong> articles
            </span>

            {/* Per-page selector */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-0.5 text-xs rounded bg-[var(--bg-muted)] border border-[var(--border)] text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium cursor-pointer"
              >
                Previous
              </button>

              <span className="px-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Single Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] max-w-sm w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Delete Article</h3>
                <p className="text-xs text-[var(--text-muted)]">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-[var(--text-primary)]">"{deleteModal.title}"</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                disabled={deleteModal.isDeleting}
                onClick={() =>
                  setDeleteModal({ open: false, blogId: null, title: '', isDeleting: false })
                }
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteModal.isDeleting}
                onClick={handleDeleteConfirm}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleteModal.isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] max-w-sm w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Delete {selectedBlogIds.length} Articles
                </h3>
                <p className="text-xs text-[var(--text-muted)]">Permanent removal from database</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-[var(--text-primary)]">{selectedBlogIds.length}</strong> selected articles?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={handleBulkDeleteConfirm}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {isBulkDeleting ? 'Deleting...' : `Delete ${selectedBlogIds.length} Articles`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightsManagement;
