import { API_BASE_URL } from './config';

// In-memory cache for instant switching (short TTL so admin updates show immediately)
const cache = new Map();
const CACHE_TTL = 4 * 1000; // 4 seconds fresh cache

/**
 * Fetch all active blog categories from API (with memory cache)
 */
export async function fetchActiveCategories(forceRefresh = false) {
  const cacheKey = 'categories';
  if (!forceRefresh && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  try {
    const res = await fetch(`${API_BASE_URL}/blogs/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    const data = await res.json();
    const categories = data?.data?.categories || [];
    cache.set(cacheKey, { data: categories, timestamp: Date.now() });
    return categories;
  } catch (err) {
    console.warn('API categories unavailable, falling back:', err);
    return cache.get(cacheKey)?.data || [];
  }
}

/**
 * Fetch published blog articles with search, category slug filter, and pagination
 */
export async function fetchPublishedBlogs({ page = 1, limit = 12, category = '', search = '', forceRefresh = false } = {}) {
  const normalizedCategory = category && category !== 'All' && category !== 'all' ? category : '';
  const normalizedSearch = search.trim();
  const cacheKey = `blogs_${page}_${limit}_${normalizedCategory}_${normalizedSearch}`;

  if (!forceRefresh && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  try {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    if (normalizedCategory) {
      params.set('category', normalizedCategory);
    }
    if (normalizedSearch) {
      params.set('search', normalizedSearch);
    }

    const res = await fetch(`${API_BASE_URL}/blogs?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch blogs');
    const data = await res.json();
    const result = {
      blogs: data?.data?.blogs || [],
      totalCount: data?.totalCount || 0,
      totalPages: data?.totalPages || 1,
      currentPage: data?.currentPage || 1,
    };

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.warn('API blogs unavailable:', err);
    return cache.get(cacheKey)?.data || { blogs: [], totalCount: 0, totalPages: 1, currentPage: 1 };
  }
}

/**
 * Fetch single blog article and related articles by slug
 */
export async function fetchBlogBySlug(slug, forceRefresh = false) {
  const cacheKey = `blog_${slug}`;
  if (!forceRefresh && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  try {
    const res = await fetch(`${API_BASE_URL}/blogs/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error('Failed to fetch blog');
    const data = await res.json();
    const result = {
      blog: data?.data?.blog || null,
      relatedBlogs: data?.data?.relatedBlogs || [],
    };
    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.warn('API blog detail unavailable:', err);
    return cache.get(cacheKey)?.data || { blog: null, relatedBlogs: [] };
  }
}
