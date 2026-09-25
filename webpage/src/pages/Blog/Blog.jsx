import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, Sparkles, Inbox, RefreshCw } from 'lucide-react';
import BlogCard from '../../components/blog/BlogCard';
import { fetchActiveCategories, fetchPublishedBlogs } from '../../api/blogApi';

const MAX_VISIBLE_CATEGORIES = 6;

// Shimmer Skeleton for smooth initial load
function BlogLoadingSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      {/* Featured Skeleton */}
      <div className="grid md:grid-cols-2 gap-6 lg:gap-10 bg-white border border-border/60 rounded-2xl p-6">
        <div className="aspect-[16/10] bg-slate-100 rounded-xl" />
        <div className="flex flex-col justify-center space-y-4 py-4">
          <div className="w-24 h-4 bg-slate-100 rounded-md" />
          <div className="w-full h-8 bg-slate-100 rounded-lg" />
          <div className="w-3/4 h-8 bg-slate-100 rounded-lg" />
          <div className="w-full h-12 bg-slate-100 rounded-lg" />
          <div className="w-40 h-4 bg-slate-100 rounded-md" />
        </div>
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-white border border-border/60 rounded-2xl overflow-hidden p-4 space-y-4">
            <div className="aspect-[16/10] bg-slate-100 rounded-xl" />
            <div className="w-20 h-4 bg-slate-100 rounded" />
            <div className="w-full h-5 bg-slate-100 rounded" />
            <div className="w-2/3 h-5 bg-slate-100 rounded" />
            <div className="w-full h-10 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Blog() {
  const [categories, setCategories] = useState([]);
  const [activeCategorySlug, setActiveCategorySlug] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreDropdownRef = useRef(null);

  // Articles state
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Close "More" dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Concurrent Instant Fetching of Categories & Articles
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      const categoryParam = activeCategorySlug !== 'all' ? activeCategorySlug : '';

      try {
        // Run category fetch and article fetch in parallel
        const [apiCats, result] = await Promise.all([
          categories.length === 0 ? fetchActiveCategories() : Promise.resolve(categories),
          fetchPublishedBlogs({
            page: currentPage,
            limit: 12,
            category: categoryParam,
            search: debouncedSearch,
          }),
        ]);

        if (!isMounted) return;

        if (categories.length === 0 && Array.isArray(apiCats)) {
          setCategories(apiCats);
        }
        setArticles(result.blogs || []);
        setTotalPages(result.totalPages || 1);
        setTotalCount(result.totalCount || 0);
      } catch (err) {
        console.error('Error loading blog data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [activeCategorySlug, debouncedSearch, currentPage]);

  // Dynamic category slicing
  const visibleCategories = categories.slice(0, MAX_VISIBLE_CATEGORIES);
  const overflowCategories = categories.slice(MAX_VISIBLE_CATEGORIES);
  // Featured article (only when isFeatured is true)
  const featuredArticle = articles.find((a) => Boolean(a.isFeatured));
  const remainingArticles = featuredArticle
    ? articles.filter((a) => (a._id || a.id) !== (featuredArticle._id || featuredArticle.id))
    : articles;

  return (
    <>
      {/* Hero Header */}
      <section className="bg-section-bg pt-12 sm:pt-16 pb-12">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-brand mb-3">
              Blog & Insights
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-bold text-text-primary leading-[1.1] tracking-tight mb-4">
              Real estate, explained simply.
            </h1>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              Property guides, market analysis, home loan advice and practical tips for buyers, owners and investors in India.
            </p>
          </div>
        </div>
      </section>

      {/* Dynamic Filter Tabs & Search Bar */}
      <section className="bg-white border-b border-border sticky top-[64px] z-30 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 py-3.5">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
            {/* Dynamic Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {/* All tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveCategorySlug('all');
                  setCurrentPage(1);
                }}
                className={`shrink-0 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeCategorySlug === 'all'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-text-muted hover:text-text-primary hover:bg-section-bg'
                }`}
              >
                All
              </button>

              {/* Dynamic Visible Categories */}
              {visibleCategories.map((cat) => (
                <button
                  key={cat._id || cat.slug}
                  type="button"
                  onClick={() => {
                    setActiveCategorySlug(cat.slug);
                    setCurrentPage(1);
                  }}
                  className={`shrink-0 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeCategorySlug === cat.slug
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-text-muted hover:text-text-primary hover:bg-section-bg'
                  }`}
                >
                  {cat.name}
                </button>
              ))}

              {/* More dropdown if categories > 6 */}
              {overflowCategories.length > 0 && (
                <div className="relative shrink-0" ref={moreDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsMoreOpen(!isMoreOpen)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      isOverflowActive
                        ? 'bg-brand text-white border-brand'
                        : 'border-border text-text-muted hover:text-text-primary hover:bg-section-bg'
                    }`}
                  >
                    <span>{isOverflowActive ? activeCategoryObj?.name : 'More'}</span>
                    <ChevronDown size={13} className={`transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isMoreOpen && (
                    <div className="absolute left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-border py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      {overflowCategories.map((cat) => (
                        <button
                          key={cat._id || cat.slug}
                          type="button"
                          onClick={() => {
                            setActiveCategorySlug(cat.slug);
                            setCurrentPage(1);
                            setIsMoreOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs font-semibold transition-colors flex items-center justify-between ${
                            activeCategorySlug === cat.slug
                              ? 'bg-brand-light text-brand'
                              : 'text-text-secondary hover:bg-section-bg hover:text-text-primary'
                          }`}
                        >
                          <span>{cat.name}</span>
                          {activeCategorySlug === cat.slug && (
                            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Search Input */}
            <div className="relative shrink-0 w-full md:w-auto md:min-w-[260px]">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-border rounded-xl bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text-primary"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Articles Stream */}
      <section className="bg-white py-10 sm:py-12 lg:py-16">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          {isLoading ? (
            <BlogLoadingSkeleton />
          ) : articles.length === 0 ? (
            /* Clean Empty State when no articles published */
            <div className="text-center py-24 bg-section-bg/50 rounded-2xl border border-dashed border-border px-4 max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-brand-light flex items-center justify-center text-brand mx-auto mb-4">
                <Inbox size={26} />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-1.5">
                {searchQuery || activeCategorySlug !== 'all'
                  ? 'No articles found'
                  : 'No Articles Published Yet'}
              </h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto mb-6 leading-relaxed">
                {searchQuery
                  ? `No published articles matched "${searchQuery}". Try a different keyword or search term.`
                  : activeCategorySlug !== 'all'
                  ? 'There are no published articles in this category yet.'
                  : 'The GharMB editorial team is curating fresh property insights, buyer guides, and market reports. Check back soon!'}
              </p>
              {(searchQuery || activeCategorySlug !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategorySlug('all');
                  }}
                  className="px-4 py-2 text-xs font-bold text-brand bg-brand-light rounded-xl hover:bg-brand hover:text-white transition-colors cursor-pointer"
                >
                  View All Insights
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Featured Hero Article */}
              {featuredArticle && currentPage === 1 && (
                <div className="mb-10 lg:mb-12">
                  <BlogCard article={featuredArticle} featured />
                </div>
              )}

              {/* Remaining Articles Grid */}
              {remainingArticles.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                  {remainingArticles.map((article) => (
                    <BlogCard
                      key={article._id || article.slug}
                      article={article}
                    />
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-12 pt-8 border-t border-border flex items-center justify-between text-xs text-text-muted">
                  <p>
                    Showing page <span className="font-bold text-text-primary">{currentPage}</span> of{' '}
                    <span className="font-bold text-text-primary">{totalPages}</span> ({totalCount} total)
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => {
                        setCurrentPage((p) => Math.max(1, p - 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-3.5 py-2 rounded-xl border border-border disabled:opacity-40 hover:bg-section-bg font-bold transition-all cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => {
                        setCurrentPage((p) => Math.min(totalPages, p + 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-3.5 py-2 rounded-xl border border-border disabled:opacity-40 hover:bg-section-bg font-bold transition-all cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-section-bg py-12 sm:py-16 border-t border-border">
        <div className="max-w-[600px] mx-auto px-5 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3">Stay informed.</h2>
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            Get property insights, market updates and expert advice delivered straight to your inbox.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); alert('Thank you for subscribing to GharMB Insights!'); }} className="flex gap-2.5 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email address"
              required
              className="flex-1 px-4 py-3 text-xs border border-border rounded-xl bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 shadow-sm"
            />
            <button
              type="submit"
              className="px-5 py-3 text-xs font-bold text-white bg-brand rounded-xl hover:bg-brand-dark transition-all shrink-0 shadow-md shadow-brand/20 cursor-pointer"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
