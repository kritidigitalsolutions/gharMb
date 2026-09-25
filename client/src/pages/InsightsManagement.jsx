import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles, Plus, Search, Filter, Edit, Trash2, Eye,
  CheckCircle2, XCircle, Clock, Folder, ExternalLink,
  Calendar, User, AlertCircle, RefreshCw, Layers, CheckSquare,
  Square, X, Check, ArrowUpDown
} from 'lucide-react';
import API from '../api/api';

const WEBPAGE_URL = 'http://localhost:5174';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    views: 0
  });

  // Single Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    blogId: null,
    title: '',
    isDeleting: false
  });

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Fetch categories for filter dropdown
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

  // Fetch blogs
  const fetchBlogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: 10,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;

      const res = await API.get('/admin/blogs', { params });
      if (res.data?.data?.blogs) {
        setBlogs(res.data.data.blogs);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.totalCount || 0);
      }

      if (res.data) {
        const publishedCount = res.data.data.blogs.filter(b => b.isPublished).length;
        const draftCount = res.data.data.blogs.filter(b => !b.isPublished).length;
        const totalViews = res.data.data.blogs.reduce((acc, b) => acc + (b.views || 0), 0);
        setStats({
          total: res.data.totalCount || res.data.data.blogs.length,
          published: publishedCount,
          draft: draftCount,
          views: totalViews
        });
      }
    } catch (err) {
      console.error('Error fetching blogs:', err);
      setError('Failed to load articles. Please check server connection.');
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
  }, [currentPage, selectedCategory, selectedStatus]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      setSelectedBlogIds([]);
      fetchBlogs();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

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
      triggerToast(res.data?.message || `${selectedBlogIds.length} articles updated to ${targetStatus}.`);
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
      triggerToast(`Article ${action === 'publish' ? 'published' : 'unpublished'} successfully!`);
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

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200 ${
          toast.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
              Insights & Blog CMS
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-md bg-brand-light text-brand tracking-wider">
              Editorial
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">
            Manage real estate insights, research articles, market updates, and editorial categories.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/admin/insights/categories"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] transition-all shadow-sm cursor-pointer"
          >
            <Layers size={15} className="text-[var(--text-muted)]" />
            Categories ({categories.length})
          </Link>

          <Link
            to="/admin/insights/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-brand hover:bg-brand-dark text-white transition-all shadow-md shadow-brand/20 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            New Article
          </Link>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-sm">
          <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Articles</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-[var(--text-primary)]">{totalCount}</span>
            <span className="text-xs font-semibold text-brand">Total in DB</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-sm">
          <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Published</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-600">{stats.published}</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Live</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-sm">
          <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Drafts</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-600">{stats.draft}</span>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">In Progress</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-sm">
          <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Views</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-[var(--text-primary)]">{stats.views}</span>
            <span className="text-xs font-semibold text-[var(--text-muted)]">All time</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, excerpt, tags..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[var(--bg-muted)] border border-transparent focus:border-brand focus:bg-[var(--bg-surface)] text-[var(--text-primary)] transition-all outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl bg-[var(--bg-muted)] border border-transparent focus:border-brand text-[var(--text-primary)] outline-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl bg-[var(--bg-muted)] border border-transparent focus:border-brand text-[var(--text-primary)] outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          <button
            onClick={fetchBlogs}
            title="Refresh"
            className="p-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-muted)] transition-all cursor-pointer"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Floating Bulk Action Bar when items are selected */}
      {selectedBlogIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-white border border-[var(--border)] shadow-sm flex items-center justify-between flex-wrap gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-xs font-black shadow-sm">
              {selectedBlogIds.length}
            </span>
            <span className="text-xs font-bold text-[var(--text-primary)]">
              {selectedBlogIds.length} article{selectedBlogIds.length === 1 ? '' : 's'} selected
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={isBulkUpdatingStatus}
              onClick={() => handleBulkStatusUpdate('published')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 size={14} /> Publish Selected
            </button>

            <button
              type="button"
              disabled={isBulkUpdatingStatus}
              onClick={() => handleBulkStatusUpdate('draft')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-all cursor-pointer disabled:opacity-50"
            >
              <Clock size={14} /> Move to Drafts
            </button>

            <button
              type="button"
              disabled={isBulkDeleting}
              onClick={() => setShowBulkDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-md shadow-red-600/20 cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={14} /> Delete Selected ({selectedBlogIds.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedBlogIds([])}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--text-primary)] hover:bg-slate-100 transition-colors cursor-pointer"
              title="Deselect All"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main Articles Table */}
      <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[var(--text-muted)]">
            <RefreshCw size={28} className="animate-spin text-brand mb-3" />
            <p className="text-xs font-semibold">Loading articles...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-xs text-red-600 font-semibold">{error}</p>
            <button
              onClick={fetchBlogs}
              className="mt-3 px-4 py-1.5 rounded-lg text-xs font-bold bg-brand text-white"
            >
              Try Again
            </button>
          </div>
        ) : blogs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-light flex items-center justify-center text-brand mb-4">
              <Sparkles size={28} />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">No articles found</h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mt-1">
              {search || selectedCategory || selectedStatus
                ? 'Try adjusting your search query or filter settings.'
                : 'Get started by creating your very first GharMB insight article.'}
            </p>
            <Link
              to="/admin/insights/new"
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-brand text-white shadow-md shadow-brand/20 hover:scale-105 transition-all"
            >
              <Plus size={16} /> Create Article
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-muted)] text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">
                  {/* Select All Checkbox */}
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={input => {
                        if (input) input.indeterminate = isSomeSelected;
                      }}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded accent-brand cursor-pointer"
                      title="Select all on this page"
                    />
                  </th>
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Author & Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-4">Published Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {blogs.map((blog) => {
                  const isSelected = selectedBlogIds.includes(blog._id);
                  return (
                    <tr
                      key={blog._id}
                      className={`transition-colors duration-150 group ${
                        isSelected ? 'bg-orange-50/40 dark:bg-orange-950/20' : 'hover:bg-[var(--bg-muted)]/50'
                      }`}
                    >
                      {/* Individual Checkbox */}
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(blog._id)}
                          className="w-4 h-4 rounded accent-brand cursor-pointer"
                        />
                      </td>

                      {/* Article title & thumbnail */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-10 rounded-lg overflow-hidden bg-slate-100 border border-[var(--border)] shrink-0">
                            {blog.bannerImage ? (
                              <img
                                src={blog.bannerImage}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Sparkles size={16} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/admin/insights/edit/${blog._id}`}
                              className="font-bold text-[var(--text-primary)] hover:text-brand line-clamp-1 transition-colors"
                            >
                              {blog.title}
                            </Link>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[var(--text-muted)]">
                              <span className="font-mono truncate max-w-[140px]">/{blog.slug}</span>
                              {blog.isFeatured && (
                                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold rounded text-[9px]">
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          <Folder size={12} className="text-slate-400" />
                          {blog.category?.name || 'Uncategorized'}
                        </span>
                      </td>

                      {/* Author & Read time */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[var(--text-muted)]">
                        <p className="font-semibold text-[var(--text-primary)] flex items-center gap-1">
                          <User size={12} /> {blog.author || 'GharMB'}
                        </p>
                        <p className="text-[10px] flex items-center gap-1 mt-0.5">
                          <Clock size={11} /> {blog.readTime || 5} min read
                        </p>
                      </td>

                      {/* Status badge with click-to-toggle */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleTogglePublish(blog)}
                          title="Click to toggle publish status"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                            blog.isPublished
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${blog.isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {blog.isPublished ? 'Published' : 'Draft'}
                        </button>
                      </td>

                      {/* Views */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-[var(--text-primary)]">
                        {blog.views || 0}
                      </td>

                      {/* Published Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-[var(--text-muted)]">
                        {blog.publishedAt
                          ? new Date(blog.publishedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : 'Not published'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {blog.isPublished && (
                            <a
                              href={`${WEBPAGE_URL}/insights/${blog.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-brand hover:bg-brand-light transition-all"
                              title="View on Public Website"
                            >
                              <ExternalLink size={15} />
                            </a>
                          )}

                          <Link
                            to={`/admin/insights/edit/${blog._id}`}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-all"
                            title="Edit Article"
                          >
                            <Edit size={15} />
                          </Link>

                          <button
                            onClick={() => setDeleteModal({
                              open: true,
                              blogId: blog._id,
                              title: blog.title,
                              isDeleting: false
                            })}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                            title="Delete Article"
                          >
                            <Trash2 size={15} />
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

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
            <p>
              Showing page <span className="font-bold text-[var(--text-primary)]">{currentPage}</span> of{' '}
              <span className="font-bold text-[var(--text-primary)]">{totalPages}</span> ({totalCount} total)
            </p>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] disabled:opacity-40 hover:bg-[var(--bg-muted)] transition-all cursor-pointer font-semibold"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] disabled:opacity-40 hover:bg-[var(--bg-muted)] transition-all cursor-pointer font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Single Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <Trash2 size={24} />
            </div>

            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Delete Article?</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-[var(--text-primary)]">"{deleteModal.title}"</span>? This action cannot be undone and will immediately remove the article from the live website.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deleteModal.isDeleting}
                onClick={() => setDeleteModal({ open: false, blogId: null, title: '', isDeleting: false })}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border)] hover:bg-[var(--bg-muted)] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteModal.isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-md shadow-red-600/20 cursor-pointer disabled:opacity-50"
              >
                {deleteModal.isDeleting ? 'Deleting...' : 'Delete Article'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <Trash2 size={24} />
            </div>

            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Delete {selectedBlogIds.length} Articles?
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-[var(--text-primary)]">{selectedBlogIds.length}</strong> selected articles? This action cannot be undone and will immediately remove them from the database and public site.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border)] hover:bg-[var(--bg-muted)] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={handleBulkDeleteConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-md shadow-red-600/20 cursor-pointer disabled:opacity-50"
              >
                {isBulkDeleting ? 'Deleting Selected...' : `Delete ${selectedBlogIds.length} Articles`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightsManagement;
