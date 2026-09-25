import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar, Clock, User, Share2, X, List,
  ArrowLeft, ArrowRight, Eye, Tag, Sparkles, Check,
  Link as LinkIcon, Compass, BookOpen, Send
} from 'lucide-react';
import BlogCard from '../../components/blog/BlogCard';
import { fetchBlogBySlug, fetchPublishedBlogs } from '../../api/blogApi';

// Clean SVG for LinkedIn
function LinkedInIcon({ size = 14, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.59 1.59 0 1 0 0 3.18 1.59 1.59 0 0 0 0-3.18z" />
    </svg>
  );
}

// Clean SVG for X / Twitter
function TwitterXIcon({ size = 13, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// Top Reading Progress Bar
function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] z-[999] bg-transparent">
      <div
        className="h-full bg-[#FF5A3C] transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// Shimmer Skeleton for Smooth Initial Load
function BlogDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Skeleton */}
      <div className="pt-12 sm:pt-16 pb-12 border-b border-[#E7EAED]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 space-y-6 animate-pulse">
          <div className="w-44 h-4 bg-slate-100 rounded" />
          <div className="w-28 h-4 bg-slate-100 rounded-full" />
          <div className="w-full max-w-3xl h-14 bg-slate-100 rounded-xl" />
          <div className="w-2/3 h-14 bg-slate-100 rounded-xl" />
          <div className="w-full max-w-2xl h-8 bg-slate-100 rounded-lg" />
          <div className="w-72 h-4 bg-slate-100 rounded" />
        </div>
      </div>

      {/* Hero Image Skeleton */}
      <div className="max-w-[1200px] mx-auto px-5 md:px-8 -mt-6">
        <div className="w-full h-[460px] sm:h-[560px] bg-slate-100 rounded-[24px] animate-pulse" />
      </div>
    </div>
  );
}

export default function BlogDetail() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSectionId, setActiveSectionId] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const sliderRef = useRef(null);
  const isClickScrollingRef = useRef(false);
  const clickScrollTimeoutRef = useRef(null);

  const scrollSlider = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = 360;
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const scrollToHeading = (id) => {
    setActiveSectionId(id);
    isClickScrollingRef.current = true;
    if (clickScrollTimeoutRef.current) {
      clearTimeout(clickScrollTimeoutRef.current);
    }

    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    clickScrollTimeoutRef.current = setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 1200);
  };

  // Fetch article data by slug
  useEffect(() => {
    let isMounted = true;
    async function loadArticle() {
      setIsLoading(true);
      window.scrollTo({ top: 0, behavior: 'instant' });
      const res = await fetchBlogBySlug(slug, true);

      if (!isMounted) return;

      if (res.blog) {
        setBlog(res.blog);
        let related = res.relatedBlogs || [];

        // If fewer than 4 related articles, fetch more dynamically across categories
        if (related.length < 4) {
          try {
            const catSlug = typeof res.blog.category === 'object' ? res.blog.category?.slug : '';
            if (catSlug) {
              const moreRes = await fetchPublishedBlogs({ limit: 8, category: catSlug, forceRefresh: true });
              const filteredMore = (moreRes.blogs || []).filter(
                (b) => b._id !== res.blog._id && b.slug !== res.blog.slug && !related.some((r) => (r._id || r.id) === (b._id || b.id))
              );
              related = [...related, ...filteredMore];
            }

            if (related.length < 4) {
              const allRes = await fetchPublishedBlogs({ limit: 8, forceRefresh: true });
              const extraBlogs = (allRes.blogs || []).filter(
                (b) => b._id !== res.blog._id && b.slug !== res.blog.slug && !related.some((r) => (r._id || r.id) === (b._id || b.id))
              );
              related = [...related, ...extraBlogs];
            }
          } catch (e) {
            console.warn('Could not fetch extra suggestions:', e);
          }
        }
        setRelatedArticles(related);

        // Dynamic Document Title for SEO
        document.title = res.blog.seo?.metaTitle || `${res.blog.title} — GharMB Insights`;
      } else {
        setBlog(null);
        setRelatedArticles([]);
        document.title = 'Article Not Found — GharMB Insights';
      }
      setIsLoading(false);
    }

    loadArticle();
    return () => { isMounted = false; };
  }, [slug]);

  // Lock body scroll when mobile TOC drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  // Escape key closes mobile drawer
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setDrawerOpen(false);
  }, []);

  useEffect(() => {
    if (drawerOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [drawerOpen, handleKeyDown]);

  // Parse HTML content to extract Headings for Table of Contents and inject IDs
  const { processedHtml, headings } = useMemo(() => {
    if (!blog) return { processedHtml: '', headings: [] };

    const htmlString = blog.content || '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const headerNodes = doc.querySelectorAll('h1, h2, h3, h4');
    const extractedHeadings = [];

    headerNodes.forEach((node, index) => {
      const id = `section-${index + 1}`;
      node.setAttribute('id', id);
      node.setAttribute('style', 'scroll-margin-top: 100px;');
      const tag = node.tagName.toLowerCase();
      extractedHeadings.push({
        num: String(index + 1).padStart(2, '0'),
        text: (node.textContent || '').trim(),
        id,
        level: tag === 'h3' || tag === 'h4' ? 3 : 2,
      });
    });

    return {
      processedHtml: doc.body.innerHTML,
      headings: extractedHeadings,
    };
  }, [blog]);

  // Scroll Spy for Table of Contents
  useEffect(() => {
    if (!headings || headings.length === 0) return;

    const handleScroll = () => {
      if (isClickScrollingRef.current) return;

      const scrollPosition = window.scrollY;
      const isBottom = window.innerHeight + scrollPosition >= document.documentElement.scrollHeight - 80;

      let currentActive = headings[0].id;
      const triggerPoint = window.innerHeight * 0.35;

      for (let i = 0; i < headings.length; i++) {
        const el = document.getElementById(headings[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= triggerPoint) {
            currentActive = headings[i].id;
          }
        }
      }

      if (isBottom && headings.length > 0) {
        for (let i = headings.length - 1; i >= 0; i--) {
          const el = document.getElementById(headings[i].id);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
              currentActive = headings[i].id;
              break;
            }
          }
        }
      }

      setActiveSectionId(currentActive);
    };

    const handleManualUserScroll = () => {
      isClickScrollingRef.current = false;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', handleManualUserScroll, { passive: true });
    window.addEventListener('touchmove', handleManualUserScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleManualUserScroll);
      window.removeEventListener('touchmove', handleManualUserScroll);
      if (clickScrollTimeoutRef.current) clearTimeout(clickScrollTimeoutRef.current);
    };
  }, [headings, processedHtml]);

  // Social Share Handlers
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = blog?.title || 'GharMB Real Estate Insights';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 3000);
  };

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(currentUrl)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  const handleShareLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
    window.open(linkedInUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  // Loading state
  if (isLoading) {
    return <BlogDetailSkeleton />;
  }

  // Not found state
  if (!blog) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-white px-5">
        <div className="max-w-md text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF0ED] text-[#FF5A3C] flex items-center justify-center mx-auto mb-5 shadow-xs">
            <Sparkles size={30} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#17212B] mb-2 tracking-tight">
            Article Not Found
          </h1>
          <p className="text-[15px] text-[#607086] mb-8 leading-relaxed">
            The article you are looking for has either been moved, updated, or is not yet published.
          </p>
          <Link
            to="/insights"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-[#FF5A3C] text-white hover:bg-[#E04F34] transition-all shadow-md shadow-[#FF5A3C]/20 cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to All Insights
          </Link>
        </div>
      </div>
    );
  }

  const categoryName = typeof blog.category === 'object' && blog.category !== null
    ? blog.category.name
    : (blog.category || 'Real Estate Insights');

  const rawDate = blog.publishedAt || blog.createdAt;
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const displayReadTime = blog.readTime
    ? `${blog.readTime} min read`
    : (blog.readingTime || '5 min read');

  const authorName = typeof blog.author === 'object'
    ? blog.author?.name
    : (blog.author || 'GharMB Editorial');

  const bannerImage = blog.bannerImage || blog.coverImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85';
  const tagsList = blog.tags || [];

  return (
    <div className="bg-white min-h-screen text-[#17212B]">
      {/* Top Reading Progress Bar */}
      <ReadingProgress />

      {/* Copy Link Feedback Toast */}
      {copyToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#17212B] text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check size={14} className="text-[#FF5A3C]" />
          <span>Article link copied to clipboard</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          02 — BLOG HERO (Editorial Magazine Header)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white pt-10 sm:pt-14 pb-8 sm:pb-12 border-b border-[#E7EAED]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[13px] text-[#607086] mb-6 flex-wrap" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-[#17212B] transition-colors">Home</Link>
            <span className="text-[#98A2B3]">/</span>
            <Link to="/insights" className="hover:text-[#17212B] transition-colors">Insights</Link>
            <span className="text-[#98A2B3]">/</span>
            <span className="text-[#17212B] font-medium truncate max-w-[200px] sm:max-w-none">{categoryName}</span>
          </nav>

          {/* Category Eyebrow */}
          <div className="mb-4">
            <span className="inline-block text-[11.5px] sm:text-[12px] font-bold uppercase tracking-[0.16em] text-[#FF5A3C]">
              {categoryName}
            </span>
          </div>

          {/* Editorial Headline */}
          <h1 className="text-[32px] sm:text-[44px] lg:text-[54px] xl:text-[58px] font-bold text-[#17212B] leading-[1.08] tracking-[-0.025em] mb-6 max-w-[940px] break-words [overflow-wrap:anywhere]">
            {blog.title}
          </h1>

          {/* Excerpt / Lead Paragraph */}
          {blog.excerpt && (
            <p className="text-[17px] sm:text-[19px] lg:text-[20px] text-[#607086] leading-[1.55] max-w-[820px] font-normal mb-8 break-words [overflow-wrap:anywhere]">
              {blog.excerpt}
            </p>
          )}

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-[#E7EAED] text-[13px] text-[#607086]">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {/* Author */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#FFF0ED] text-[#FF5A3C] font-bold text-[11px] flex items-center justify-center uppercase border border-[#FF5A3C]/20">
                  {authorName.slice(0, 2)}
                </div>
                <span className="font-semibold text-[#17212B]">{authorName}</span>
              </div>

              <span className="text-[#98A2B3]">•</span>

              {/* Date */}
              <span>{formattedDate}</span>

              <span className="text-[#98A2B3]">•</span>

              {/* Read time */}
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-[#98A2B3]" />
                {displayReadTime}
              </span>

              {blog.views !== undefined && blog.views > 0 && (
                <>
                  <span className="text-[#98A2B3]">•</span>
                  <span className="flex items-center gap-1.5">
                    <Eye size={13} className="text-[#98A2B3]" />
                    {blog.views} views
                  </span>
                </>
              )}
            </div>

            {/* Quick Share Buttons (Desktop Header) */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mr-1">Share:</span>
              <button
                type="button"
                onClick={handleShareLinkedIn}
                className="w-8 h-8 rounded-full border border-[#E7EAED] bg-white hover:bg-[#F7F8F8] hover:text-[#0077b5] text-[#607086] flex items-center justify-center transition-all cursor-pointer"
                title="Share on LinkedIn"
              >
                <LinkedInIcon size={14} />
              </button>
              <button
                type="button"
                onClick={handleShareTwitter}
                className="w-8 h-8 rounded-full border border-[#E7EAED] bg-white hover:bg-[#F7F8F8] hover:text-[#17212B] text-[#607086] flex items-center justify-center transition-all cursor-pointer"
                title="Share on X"
              >
                <TwitterXIcon size={13} />
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-8 h-8 rounded-full border border-[#E7EAED] bg-white hover:bg-[#F7F8F8] hover:text-[#FF5A3C] text-[#607086] flex items-center justify-center transition-all cursor-pointer"
                title="Copy Link"
              >
                <LinkIcon size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          03 — HERO IMAGE (Magazine Cover Anchor)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white pt-8 sm:pt-10">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <div className="relative w-full h-[380px] sm:h-[500px] lg:h-[580px] rounded-[18px] sm:rounded-[24px] overflow-hidden bg-slate-100 border border-[#E7EAED] shadow-[0_16px_50px_rgba(0,0,0,0.06)] group">
            <img
              src={bannerImage}
              alt={blog.title}
              loading="eager"
              className="w-full h-full object-cover group-hover:scale-[1.015] transition-transform duration-700 ease-out"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85';
              }}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          04 & 05 & 06 — READING LAYOUT & ARTICLE TYPOGRAPHY
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-12 lg:gap-16">
            
            {/* ── Main Article Reading Column ── */}
            <article className="max-w-[760px] w-full text-left min-w-0">
              {/* WYSIWYG Article Content with Editorial Drop-Cap on 1st paragraph */}
              <div
                dangerouslySetInnerHTML={{ __html: processedHtml }}
                className="article-editorial-content text-[#536273] text-[18px] sm:text-[18.5px] leading-[1.85] font-normal break-words [overflow-wrap:anywhere] min-w-0
                  [&>p:first-of-type]:first-letter:text-[52px]
                  [&>p:first-of-type]:first-letter:font-bold
                  [&>p:first-of-type]:first-letter:text-[#FF5A3C]
                  [&>p:first-of-type]:first-letter:float-left
                  [&>p:first-of-type]:first-letter:mr-3.5
                  [&>p:first-of-type]:first-letter:leading-none
                  [&>p:first-of-type]:first-letter:pt-1
                  [&_p]:mb-7 [&_p]:break-words
                  [&_h1]:scroll-mt-28 [&_h2]:scroll-mt-28 [&_h3]:scroll-mt-28 [&_h4]:scroll-mt-28
                  [&_h2]:text-[28px] sm:[&_h2]:text-[34px] [&_h2]:font-bold [&_h2]:text-[#17212B] [&_h2]:leading-[1.2] [&_h2]:mt-12 [&_h2]:mb-5 [&_h2]:tracking-[-0.015em] [&_h2]:break-words
                  [&_h3]:text-[22px] sm:[&_h3]:text-[25px] [&_h3]:font-bold [&_h3]:text-[#17212B] [&_h3]:leading-snug [&_h3]:mt-9 [&_h3]:mb-4 [&_h3]:break-words
                  [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2.5 [&_ul]:mb-7 [&_ul]:text-[#536273] [&_ul]:break-words
                  [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2.5 [&_ol]:mb-7 [&_ol]:text-[#536273] [&_ol]:break-words
                  [&_li]:leading-[1.75] [&_li]:break-words
                  [&_blockquote]:border-l-[3.5px] [&_blockquote]:border-[#FF5A3C] [&_blockquote]:pl-6 [&_blockquote]:py-3.5 [&_blockquote]:my-8 [&_blockquote]:italic [&_blockquote]:text-[19px] sm:[&_blockquote]:text-[20px] [&_blockquote]:text-[#17212B] [&_blockquote]:font-medium [&_blockquote]:leading-[1.65] [&_blockquote]:bg-[#F7F8F8] [&_blockquote]:rounded-r-2xl [&_blockquote]:break-words
                  [&_img]:rounded-2xl [&_img]:my-8 [&_img]:shadow-md [&_img]:max-w-full [&_img]:w-full [&_img]:h-auto [&_img]:object-cover
                  [&_a]:text-[#FF5A3C] [&_a]:underline [&_a]:underline-offset-4 [&_a]:font-medium hover:[&_a]:text-[#E04F34] [&_a]:break-all
                  [&_strong]:text-[#17212B] [&_strong]:font-bold
                  [&_hr]:my-10 [&_hr]:border-[#E7EAED]
                "
              />

              {/* ── 12 TAGS ── */}
              {tagsList.length > 0 && (
                <div className="mt-14 pt-8 border-t border-[#E7EAED]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#98A2B3] mr-1">
                      Topics:
                    </span>
                    {tagsList.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3.5 py-1.5 text-xs font-medium text-[#607086] bg-[#F7F8F8] hover:bg-[#FFF0ED] hover:text-[#FF5A3C] rounded-full border border-[#E7EAED] transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 10 MOBILE SHARE ROW ── */}
              <div className="sm:hidden mt-8 pt-6 border-t border-[#E7EAED] flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#607086]">Share Article:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShareLinkedIn}
                    className="p-2 rounded-full border border-[#E7EAED] bg-white text-[#607086]"
                  >
                    <LinkedInIcon size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={handleShareTwitter}
                    className="p-2 rounded-full border border-[#E7EAED] bg-white text-[#607086]"
                  >
                    <TwitterXIcon size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="p-2 rounded-full border border-[#E7EAED] bg-white text-[#607086]"
                  >
                    <LinkIcon size={15} />
                  </button>
                </div>
              </div>

              {/* ── 15 BACK TO ALL INSIGHTS LINK ── */}
              <div className="mt-12 pt-8 border-t border-[#E7EAED]">
                <Link
                  to="/insights"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#FF5A3C] hover:text-[#E04F34] transition-colors group"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-200" />
                  <span>Back to all insights</span>
                </Link>
              </div>
            </article>

            {/* ── 08 & 10 RIGHT STICKY SIDEBAR ── */}
            <aside className="hidden lg:block w-full">
              <div className="sticky top-28 space-y-6">
                {/* Table of Contents (if headings exist) or Quick Info */}
                {headings.length > 0 ? (
                  <div className="p-6 rounded-[24px] bg-[#F7F8F8] border border-[#E7EAED]">
                    <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#E7EAED]">
                      <h4 className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#607086] flex items-center gap-2">
                        <BookOpen size={14} className="text-[#FF5A3C]" />
                        IN THIS ARTICLE
                      </h4>
                      <span className="text-[10.5px] font-bold text-[#98A2B3] bg-white px-2 py-0.5 rounded-full border border-[#E7EAED]">
                        {headings.length}
                      </span>
                    </div>

                    <nav className="space-y-0.5 text-xs max-h-[calc(100vh-320px)] overflow-y-auto no-scrollbar pr-1">
                      {headings.map((item) => {
                        const isActive = activeSectionId === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => scrollToHeading(item.id)}
                            className={`w-full text-left group flex items-start gap-2.5 py-1.5 px-2.5 rounded-lg transition-colors duration-150 leading-snug cursor-pointer ${
                              item.level === 3 ? 'pl-5 text-[12px]' : 'text-[13px]'
                            } ${
                              isActive
                                ? 'text-[#FF5A3C] font-semibold bg-[#FFF0ED]/80'
                                : 'text-[#607086] hover:text-[#FF5A3C] hover:bg-[#FFF0ED]/30 font-normal'
                            }`}
                          >
                            <span className={`font-mono text-[10.5px] pt-0.5 shrink-0 transition-colors ${
                              isActive ? 'text-[#FF5A3C] font-bold' : 'text-[#98A2B3] group-hover:text-[#FF5A3C]'
                            }`}>
                              {item.num}
                            </span>
                            <span className="line-clamp-2">{item.text}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                ) : (
                  <div className="p-5 rounded-[24px] bg-[#F7F8F8] border border-[#E7EAED] space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#FF5A3C] block">
                      QUICK OVERVIEW
                    </span>
                    <div className="space-y-2 text-xs text-[#607086]">
                      <div className="flex items-center justify-between py-1 border-b border-[#E7EAED]/60">
                        <span>Category</span>
                        <span className="font-semibold text-[#17212B]">{categoryName}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-[#E7EAED]/60">
                        <span>Read Time</span>
                        <span className="font-semibold text-[#17212B]">{displayReadTime}</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span>Published</span>
                        <span className="font-semibold text-[#17212B]">{formattedDate}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sidebar Share Box */}
                <div className="p-5 rounded-[24px] bg-white border border-[#E7EAED] space-y-3 shadow-xs">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#98A2B3]">
                    SHARE THIS ARTICLE
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleShareLinkedIn}
                      className="flex-1 py-2 px-2.5 rounded-xl border border-[#E7EAED] bg-[#F7F8F8] hover:bg-[#0077b5] hover:text-white text-[#17212B] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <LinkedInIcon size={13} /> LinkedIn
                    </button>
                    <button
                      type="button"
                      onClick={handleShareTwitter}
                      className="flex-1 py-2 px-2.5 rounded-xl border border-[#E7EAED] bg-[#F7F8F8] hover:bg-[#17212B] hover:text-white text-[#17212B] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <TwitterXIcon size={13} /> X
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full py-2 px-3 rounded-xl border border-[#E7EAED] bg-white hover:bg-[#FFF0ED] hover:border-[#FF5A3C]/30 text-[#17212B] hover:text-[#FF5A3C] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <LinkIcon size={13} /> Copy Link
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          11 — DYNAMIC RELATED CATEGORY SUGGESTIONS SLIDER (FULL WEBSITE CONTAINER WIDTH)
          ═══════════════════════════════════════════════════════════════ */}
      {relatedArticles.length > 0 && (
        <section className="bg-[#F7F8F8] py-14 sm:py-18 border-t border-[#E7EAED]">
          <div className="max-w-[1200px] mx-auto px-5 md:px-8">
            {/* Slider Header */}
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF5A3C]" />
                  <span className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#FF5A3C]">
                    MORE IN {categoryName.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#17212B] tracking-tight">
                  Related Suggestions & Insights
                </h3>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => scrollSlider('left')}
                  className="w-10 h-10 rounded-xl border border-[#E7EAED] bg-white hover:bg-[#FFF0ED] active:bg-[#FFE5E0] text-[#17212B] hover:text-[#FF5A3C] hover:border-[#FF5A3C]/40 flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95"
                  aria-label="Previous suggestions"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollSlider('right')}
                  className="w-10 h-10 rounded-xl border border-[#E7EAED] bg-white hover:bg-[#FFF0ED] active:bg-[#FFE5E0] text-[#17212B] hover:text-[#FF5A3C] hover:border-[#FF5A3C]/40 flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95"
                  aria-label="Next suggestions"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Horizontal Scrollable Slider Carousel */}
            <div
              ref={sliderRef}
              className="flex items-stretch gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {relatedArticles.map((item) => {
                const itemCatName = typeof item.category === 'object' && item.category !== null
                  ? item.category.name
                  : (item.category || categoryName);
                const itemImg = item.bannerImage || item.coverImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
                const itemReadTime = item.readTime ? `${item.readTime} min read` : (item.readingTime || '4 min read');
                const itemDate = (item.publishedAt || item.createdAt)
                  ? new Date(item.publishedAt || item.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })
                  : '';

                return (
                  <Link
                    key={item._id || item.slug}
                    to={`/insights/${item.slug}`}
                    className="group shrink-0 w-[290px] sm:w-[330px] md:w-[360px] snap-start flex flex-col justify-between bg-white hover:bg-white rounded-2xl border border-[#E7EAED] hover:border-[#FF5A3C]/35 hover:shadow-xl hover:shadow-black/5 transition-all duration-300 overflow-hidden min-w-0"
                  >
                    <div className="min-w-0">
                      {/* Thumbnail with category pill */}
                      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 min-w-0 w-full">
                        <img
                          src={itemImg}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold bg-white/95 backdrop-blur-xs text-[#FF5A3C] shadow-xs border border-white/50 truncate max-w-[80%]">
                          {itemCatName}
                        </span>
                      </div>

                      {/* Card Details */}
                      <div className="p-5 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-[#98A2B3] mb-2 font-medium">
                          {itemDate && <span>{itemDate}</span>}
                          {itemDate && <span>•</span>}
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {itemReadTime}
                          </span>
                        </div>

                        <h4 className="text-[15px] sm:text-[16px] font-bold text-[#17212B] group-hover:text-[#FF5A3C] line-clamp-2 leading-snug transition-colors break-words [overflow-wrap:anywhere]">
                          {item.title}
                        </h4>

                        {item.excerpt && (
                          <p className="text-[13px] text-[#607086] line-clamp-2 mt-2 leading-relaxed break-words [overflow-wrap:anywhere]">
                            {item.excerpt}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer CTA */}
                    <div className="px-5 pb-4 pt-3 flex items-center justify-between text-xs font-bold text-[#FF5A3C] border-t border-[#E7EAED]/60 mt-2">
                      <span>Read article</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          16 — WIDE DARK EDITORIAL CTA BANNER
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-12 sm:py-16">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <div className="relative rounded-[28px] overflow-hidden bg-[#17212B] text-white p-8 sm:p-12 lg:p-16 shadow-2xl border border-slate-800">
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#FF5A3C]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl space-y-4">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.16em] text-[#FF5A3C]">
                GHARMB PLATFORM
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-white leading-[1.12] tracking-tight">
                Understand real estate with more clarity.
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                Explore GharMB insights, verified developer projects and intelligent market tools designed for buyers, owners and investors.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <Link
                  to="/properties"
                  className="px-7 py-3.5 rounded-xl text-sm font-bold bg-[#FF5A3C] hover:bg-[#E04F34] text-white transition-all shadow-lg shadow-[#FF5A3C]/25 hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  Explore GharMB
                </Link>
                <Link
                  to="/insights"
                  className="px-7 py-3.5 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/15 text-white border border-white/20 transition-all cursor-pointer"
                >
                  View All Insights
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          MOBILE FLOATING TABLE OF CONTENTS BUTTON & DRAWER
          ═══════════════════════════════════════════════════════════════ */}
      {headings.length > 0 && (
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-[#17212B] text-white text-xs font-bold rounded-full shadow-2xl hover:bg-[#243045] transition-all cursor-pointer border border-slate-700"
          aria-label="Open Table of Contents"
        >
          <List size={16} className="text-[#FF5A3C]" />
          <span>Contents</span>
        </button>
      )}

      {/* Mobile Backdrop Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs lg:hidden animate-in fade-in"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Bottom Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[110] bg-white rounded-t-[24px] shadow-2xl transform transition-transform duration-300 ease-out lg:hidden max-h-[75vh] overflow-y-auto ${
          drawerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Article Table of Contents"
      >
        <div className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E7EAED]">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#607086] flex items-center gap-2">
              <BookOpen size={14} className="text-[#FF5A3C]" />
              IN THIS ARTICLE
            </span>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 rounded-full hover:bg-[#F7F8F8] text-[#607086]"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          <nav className="space-y-1 py-4 text-xs">
            {headings.map((item) => {
              const isActive = activeSectionId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    scrollToHeading(item.id);
                  }}
                  className={`w-full text-left flex items-start gap-2.5 py-2 px-3 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-[#FFF0ED] text-[#FF5A3C] font-semibold'
                      : 'text-[#607086] hover:text-[#FF5A3C] hover:bg-[#FFF0ED]/30 font-normal'
                  }`}
                >
                  <span className={`font-mono text-xs pt-0.5 transition-colors ${isActive ? 'text-[#FF5A3C] font-bold' : 'text-[#98A2B3]'}`}>
                    {item.num}
                  </span>
                  <span className="line-clamp-2">{item.text}</span>
                </button>
              );
            })}
          </nav>

          {/* Mobile Share Box */}
          <div className="pt-4 border-t border-[#E7EAED] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#607086]">Share article:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareLinkedIn}
                className="p-2 rounded-full border border-[#E7EAED] bg-[#F7F8F8] text-[#607086]"
              >
                <LinkedInIcon size={15} />
              </button>
              <button
                type="button"
                onClick={handleShareTwitter}
                className="p-2 rounded-full border border-[#E7EAED] bg-[#F7F8F8] text-[#607086]"
              >
                <TwitterXIcon size={14} />
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-2 rounded-full border border-[#E7EAED] bg-[#F7F8F8] text-[#607086]"
              >
                <LinkIcon size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
