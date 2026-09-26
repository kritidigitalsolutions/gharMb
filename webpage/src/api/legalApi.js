import { API_BASE_URL } from './config';

const cache = new Map();
const CACHE_TTL = 4 * 1000;

export async function fetchLegalContent(type, forceRefresh = false) {
  const cacheKey = `legal_${type}`;
  if (!forceRefresh && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  try {
    const res = await fetch(`${API_BASE_URL}/legal/${encodeURIComponent(type)}`);
    if (!res.ok) throw new Error(`Failed to fetch ${type}`);
    const data = await res.json();
    const result = data?.data?.legalContent || null;
    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.warn(`API legal content (${type}) unavailable:`, err);
    return cache.get(cacheKey)?.data || null;
  }
}
