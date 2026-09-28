import { API_BASE_URL } from './config';

const cache = new Map();
const CACHE_TTL = 4 * 1000;

export async function fetchLegalContent(typeOrSlug, forceRefresh = false) {
  if (!typeOrSlug) return null;
  const normalized = typeOrSlug.toString().toLowerCase().trim();
  const cacheKey = `legal_${normalized}`;

  if (!forceRefresh && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  try {
    const res = await fetch(`${API_BASE_URL}/legal/${encodeURIComponent(normalized)}?platform=web`);
    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch ${normalized} (status: ${res.status})`);
    }
    const data = await res.json();
    const result = data?.data?.legalContent || null;
    if (result) {
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
    }
    return result;
  } catch (err) {
    console.warn(`API legal content (${normalized}) unavailable:`, err);
    return cache.get(cacheKey)?.data || null;
  }
}

export async function fetchPublicPolicies(footerOnly = false, forceRefresh = false) {
  const cacheKey = `policies_list_footer_${Boolean(footerOnly)}_web`;

  if (!forceRefresh && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  try {
    const res = await fetch(`${API_BASE_URL}/legal/policies?footer=${Boolean(footerOnly)}&platform=web`);
    if (!res.ok) throw new Error(`Failed to fetch public policies (status: ${res.status})`);
    const data = await res.json();
    const result = data?.data?.policies || [];
    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.warn('API public policies list unavailable:', err);
    return cache.get(cacheKey)?.data || [];
  }
}

