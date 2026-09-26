import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
  FileText,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  ArrowUp,
  Scale,
  ListOrdered,
  ChevronDown,
  Mail,
  Info
} from 'lucide-react';
import { fetchLegalContent } from '../../api/legalApi';

export default function LegalPolicy({ type }) {
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toc, setToc] = useState([]);
  const [activeSection, setActiveSection] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const contentRef = useRef(null);

  const isPrivacy = type === 'privacy-policy' || type === 'privacy';
  const isTerms = type === 'terms' || type === 'terms-of-service';

  const info = {
    title: isTerms ? 'Terms of Service' : 'Privacy Policy',
    badge: isTerms ? 'Legal Terms & Conditions' : 'Privacy & Data Protection',
    desc: isTerms
      ? 'Please review these terms carefully. They govern your access and use of the GharMB platform, mobile application, and all real estate services.'
      : 'Learn how GharMB collects, utilizes, safeguards, and manages your personal data across our real estate ecosystem in compliance with applicable law.'
  };

  // ── Data fetching ──
  const loadContent = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchLegalContent(type);
      setContent(data || null);
    } catch (err) {
      console.error(err);
      setError('Unable to load this legal document.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = `${info.title} | GharMB Real Estate`;
    window.scrollTo(0, 0);
    loadContent();
  }, [type]);

  // ── Back to top button ──
  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 450);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Smart Dynamic Content Processing ──
  const getProcessedContent = () => {
    if (!content || !content.content) return '';
    let text = content.content.replace(/\r\n/g, '\n');

    // Replace non-breaking spaces
    text = text.replace(/&nbsp;/g, ' ');

    // 1. Convert all <h1> in content to <h2> for proper semantic hierarchy
    text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (match, inner) => {
      return `<h2>${inner.trim()}</h2>`;
    });

    // 2. Handle patterns like: <p><strong>5. Data Security </strong>● GharMB will take...</p>
    text = text.replace(/<p[^>]*>\s*<strong>\s*(\d+\.\s*[^<]+?)\s*<\/strong>\s*([\s\S]*?)<\/p>/gi, (match, heading, rest) => {
      const hTag = `<h2>${heading.trim()}</h2>`;
      const bodyTag = rest.trim() ? `<p>${rest.trim()}</p>` : '';
      return `${hTag}${bodyTag}`;
    });

    // 3. Convert standalone bold lines that start with numbers (e.g. <p><strong>1. Acceptance</strong></p>) to <h2>
    text = text.replace(/<p[^>]*>\s*<(?:strong|b)>\s*(\d+\.\s*[^<]+?)\s*<\/(?:strong|b)>\s*<\/p>/gi, (match, heading) => {
      return `<h2>${heading.trim()}</h2>`;
    });

    // 4. Convert plain numbered paragraphs (e.g. <p>1. Acceptance</p>) to <h2>
    text = text.replace(/<p[^>]*>\s*(\d+\.\s+[A-Za-z][^<]{2,80}?)\s*<\/p>/gi, (match, heading) => {
      return `<h2>${heading.trim()}</h2>`;
    });

    // 5. Convert bullet paragraphs (e.g. <p>●  Users must...</p>) to proper <ul><li>...</li></ul>
    text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (match, inner) => {
      const trimmed = inner.trim();
      if (trimmed.startsWith('●') || trimmed.startsWith('•') || trimmed.startsWith('●') || trimmed.startsWith('&bull;')) {
        const items = trimmed
          .split(/(?:●|•|&bull;)\s*/)
          .map(s => s.trim())
          .filter(Boolean);
        if (items.length > 0) {
          return `<ul>${items.map(it => `<li>${it}</li>`).join('')}</ul>`;
        }
      }
      return match;
    });

    // Merge consecutive </ul><ul>
    text = text.replace(/<\/ul>\s*<ul>/gi, '');

    return DOMPurify.sanitize(text, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'blockquote',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'hr', 'span', 'div', 'code', 'pre'
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id']
    });
  };

  const processedHTML = getProcessedContent();

  // ── Dynamically Extract TOC from DOM ──
  useEffect(() => {
    if (!isLoading && processedHTML) {
      const timer = setTimeout(() => {
        const el = document.getElementById('legal-content-body');
        if (!el) return;

        // Select all section headings (h2, h3)
        const headingElements = Array.from(el.querySelectorAll('h2, h3'));
        const newToc = [];
        let secCounter = 1;

        headingElements.forEach((h, i) => {
          const rawText = h.textContent.trim();
          if (!rawText || rawText.length < 2) return;

          // Exclude sign-offs or disclaimers if they happen to be in h2
          if (/^(?:thank you|legal note|questions\?|contact us:)/i.test(rawText)) {
            return;
          }

          // Clean title for TOC display (strip leading number like "1. " or "2. ")
          let cleanTitle = rawText.replace(/^\d+[\.\)]\s*/, '').trim();
          if (!cleanTitle) cleanTitle = rawText;

          // Create unique anchor ID
          const slug = cleanTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') || `section-${i}`;

          const uniqueId = `sec-${slug}-${i}`;
          h.id = uniqueId;

          newToc.push({
            id: uniqueId,
            title: cleanTitle,
            rawTitle: rawText,
            number: String(secCounter).padStart(2, '0'),
            level: h.tagName.toLowerCase(),
            index: i
          });
          secCounter++;
        });

        setToc(newToc);
        if (newToc.length > 0) {
          setActiveSection(newToc[0].id);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isLoading, processedHTML]);

  // ── Intersection Observer for active TOC highlight ──
  useEffect(() => {
    if (toc.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(e => e.isIntersecting);
        if (visibleEntries.length > 0) {
          setActiveSection(visibleEntries[0].target.id);
        }
      },
      { rootMargin: '-100px 0px -65% 0px', threshold: 0 }
    );

    toc.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc]);

  const handleScrollTo = useCallback((e, id) => {
    e.preventDefault();
    setMobileTocOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -100;
      const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(id);
    }
  }, []);

  return (
    <>
      <style>{`
        /* ═══════════════════════════════════════════
           LEGAL PAGE – CLEAN LIGHT STYLING
           ═══════════════════════════════════════════ */

        .legal-doc {
          font-family: var(--font-sans, 'Inter', system-ui, -apple-system, sans-serif);
          color: #374151;
        }

        .legal-doc h1, .legal-doc h2 {
          font-size: 22px;
          font-weight: 750;
          color: #17202A;
          margin-top: 42px;
          margin-bottom: 14px;
          padding-top: 20px;
          border-top: 1px solid #F0F0EE;
          letter-spacing: -0.015em;
          line-height: 1.35;
          scroll-margin-top: 110px;
        }

        .legal-doc h2:first-of-type, .legal-doc h1:first-of-type {
          margin-top: 0;
          padding-top: 0;
          border-top: none;
        }

        .legal-doc h3 {
          font-size: 18px;
          font-weight: 700;
          color: #1F2937;
          margin-top: 26px;
          margin-bottom: 10px;
          line-height: 1.4;
          scroll-margin-top: 110px;
        }

        .legal-doc p {
          font-size: 15.5px;
          line-height: 1.8;
          color: #4B5563;
          margin-bottom: 16px;
        }

        .legal-doc p:last-child {
          margin-bottom: 0;
        }

        .legal-doc strong, .legal-doc b {
          font-weight: 650;
          color: #17202A;
        }

        .legal-doc em, .legal-doc i {
          font-style: italic;
          color: #64748B;
        }

        /* Unordered lists */
        .legal-doc ul {
          list-style: none;
          padding-left: 0;
          margin: 0 0 20px 0;
        }

        .legal-doc ul li {
          position: relative;
          padding-left: 22px;
          margin-bottom: 10px;
          font-size: 15.5px;
          line-height: 1.75;
          color: #4B5563;
        }

        .legal-doc ul li::before {
          content: "";
          position: absolute;
          left: 4px;
          top: 11px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #FF5A3C;
        }

        /* Ordered lists */
        .legal-doc ol {
          list-style: decimal;
          padding-left: 24px;
          margin: 0 0 20px 0;
        }

        .legal-doc ol li {
          margin-bottom: 10px;
          font-size: 15.5px;
          line-height: 1.75;
          color: #4B5563;
          padding-left: 4px;
        }

        .legal-doc ol li::marker {
          color: #FF5A3C;
          font-weight: 700;
        }

        /* Links */
        .legal-doc a {
          color: #FF5A3C;
          text-decoration: underline;
          text-underline-offset: 3px;
          text-decoration-color: rgba(255, 90, 60, 0.35);
          font-weight: 500;
          transition: all 0.15s ease;
        }

        .legal-doc a:hover {
          color: #E04F34;
          text-decoration-color: #E04F34;
        }

        /* Blockquotes */
        .legal-doc blockquote {
          border-left: 3px solid #FF5A3C;
          padding: 14px 18px;
          margin: 20px 0;
          background: #FFF9F7;
          border-radius: 0 12px 12px 0;
        }

        .legal-doc blockquote p {
          color: #374151;
          font-size: 15px;
          margin-bottom: 0;
        }

        /* Table of Contents Styling */
        .toc-item-btn {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          width: 100%;
          padding: 8px 10px;
          border-radius: 10px;
          font-size: 13px;
          line-height: 1.45;
          color: #64748B;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
          background-color: transparent;
        }

        .toc-item-btn:hover {
          color: #17202A;
          background-color: #F8F9FA;
          border-color: #F0F0EE;
        }

        .toc-item-btn.is-active {
          color: #E04F34;
          background-color: #FFF0ED;
          border-color: #FFDACF;
          font-weight: 650;
        }

        .toc-item-btn .toc-num-badge {
          font-size: 11px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          padding: 2px 6px;
          border-radius: 6px;
          background-color: #F1F5F9;
          color: #64748B;
          flex-shrink: 0;
          margin-top: 1px;
          transition: all 0.18s ease;
        }

        .toc-item-btn:hover .toc-num-badge {
          background-color: #E2E8F0;
          color: #1E293B;
        }

        .toc-item-btn.is-active .toc-num-badge {
          background-color: #FF5A3C;
          color: #FFFFFF;
          box-shadow: 0 2px 6px rgba(255, 90, 60, 0.25);
        }

        /* Skeleton */
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .skeleton-bar {
          background: linear-gradient(90deg, #F0F0EE 25%, #FAFAFA 50%, #F0F0EE 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 6px;
        }
      `}</style>

      <div className="bg-white min-h-screen">

        {/* ═══════════════════════════════════════════
            LIGHT CLEAN HEADER
            ═══════════════════════════════════════════ */}
        <section className="bg-[#FFFBF9] border-b border-[#F0F0EE] pt-8 pb-8 sm:pt-10 sm:pb-10">
          <div className="max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-12">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-text-secondary font-medium mb-4">
              <Link to="/" className="hover:text-brand transition-colors">Home</Link>
              <ChevronRight size={12} className="text-text-muted" />
              <span className="text-text-muted">Legal</span>
              <ChevronRight size={12} className="text-text-muted" />
              <span className="text-brand font-semibold">{info.title}</span>
            </div>

            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0ED] border border-[#FF5A3C]/20 text-[11px] font-bold text-[#FF5A3C] uppercase tracking-[0.16em] mb-4">
                {isPrivacy ? <ShieldCheck size={13} /> : <Scale size={13} />}
                <span>{info.badge}</span>
              </div>

              <h1 className="text-[30px] sm:text-[38px] lg:text-[44px] font-bold text-[#17202A] leading-[1.1] tracking-[-0.03em] mb-3.5">
                {info.title}
              </h1>

              <p className="text-[15px] sm:text-[16.5px] text-[#667085] leading-[1.65] font-normal max-w-2xl">
                {info.desc}
              </p>
            </div>

            {/* Document Switcher Tabs */}
            <div className="flex items-center gap-2 mt-6 pt-5 border-t border-[#F0EBE7]">
              <Link
                to="/privacy-policy"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  isPrivacy
                    ? 'bg-brand text-white shadow-xs'
                    : 'bg-white border border-border text-text-secondary hover:text-text-primary hover:bg-gray-50'
                }`}
              >
                <ShieldCheck size={16} />
                <span>Privacy Policy</span>
              </Link>

              <Link
                to="/terms-of-service"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  isTerms
                    ? 'bg-brand text-white shadow-xs'
                    : 'bg-white border border-border text-text-secondary hover:text-text-primary hover:bg-gray-50'
                }`}
              >
                <FileText size={16} />
                <span>Terms of Service</span>
              </Link>
            </div>

          </div>
        </section>

        {/* ═══════════════════════════════════════════
            MAIN DOCUMENT CONTENT AREA (OPEN / NON-BOXED)
            ═══════════════════════════════════════════ */}
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-12 py-10 lg:py-14">

          {/* ── Mobile TOC Accordion ── */}
          {toc.length > 0 && (
            <div className="lg:hidden mb-8">
              <button
                onClick={() => setMobileTocOpen(!mobileTocOpen)}
                className="w-full flex items-center justify-between p-4 bg-warm-bg border border-border rounded-xl text-sm font-bold text-text-primary cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ListOrdered size={16} className="text-brand" />
                  <span>Table of Contents ({toc.length} sections)</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-text-secondary transition-transform duration-200 ${
                    mobileTocOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {mobileTocOpen && (
                <div className="mt-2 p-3 bg-white border border-border rounded-xl shadow-sm space-y-1">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(e) => handleScrollTo(e, item.id)}
                      className={`toc-item-btn ${activeSection === item.id ? 'is-active' : ''}`}
                    >
                      <span className="toc-num-badge">{item.number}</span>
                      <span>{item.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── LOADING STATE ── */}
          {isLoading ? (
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
              <div className="hidden lg:block lg:col-span-4 xl:col-span-3">
                <div className="skeleton-bar h-4 w-28 mb-6" />
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="skeleton-bar h-8 w-full rounded-lg" />
                  ))}
                </div>
              </div>
              <div className="lg:col-span-8 xl:col-span-9 space-y-8">
                <div className="space-y-4">
                  <div className="skeleton-bar h-6 w-1/3" />
                  <div className="skeleton-bar h-4 w-full" />
                  <div className="skeleton-bar h-4 w-5/6" />
                  <div className="skeleton-bar h-4 w-4/6" />
                </div>
                <div className="space-y-4 pt-4">
                  <div className="skeleton-bar h-6 w-2/5" />
                  <div className="skeleton-bar h-4 w-full" />
                  <div className="skeleton-bar h-4 w-11/12" />
                  <div className="skeleton-bar h-4 w-3/4" />
                </div>
              </div>
            </div>
          ) : error ? (
            /* ── ERROR STATE ── */
            <div className="flex flex-col items-center justify-center text-center py-20 px-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-5 text-rose-600">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Unable to load document</h3>
              <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                {error} Please check your connection or reload the page.
              </p>
              <button
                onClick={loadContent}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-sm font-bold shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw size={15} />
                <span>Retry</span>
              </button>
            </div>
          ) : !content || !content.content ? (
            /* ── EMPTY STATE ── */
            <div className="flex flex-col items-center justify-center text-center py-20 px-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-border flex items-center justify-center mb-5 text-text-muted">
                <FileText size={32} />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">{info.title} Unavailable</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                This document is being updated. Please check back shortly.
              </p>
            </div>
          ) : (
            /* ── CONTENT LOADED ── */
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">

              {/* ── LEFT SIDEBAR (STICKY TOC) ── */}
              {toc.length > 0 && (
                <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-24">
                  <div className="bg-white border border-[#E7E7E5] rounded-2xl p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F0F0EE]">
                      <div className="flex items-center gap-2">
                        <ListOrdered size={15} className="text-brand" />
                        <span className="text-xs font-extrabold uppercase tracking-wider text-text-primary">
                          Table of Contents
                        </span>
                      </div>
                      <span className="text-xs font-bold text-brand bg-brand-light px-2.5 py-0.5 rounded-full">
                        {toc.length} Sections
                      </span>
                    </div>

                    {/* TOC List with dynamic items and smooth scroll */}
                    <nav className="space-y-1 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                      {toc.map((item) => (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          onClick={(e) => handleScrollTo(e, item.id)}
                          className={`toc-item-btn ${activeSection === item.id ? 'is-active' : ''}`}
                          title={item.rawTitle}
                        >
                          <span className="toc-num-badge">{item.number}</span>
                          <span>{item.title}</span>
                        </a>
                      ))}
                    </nav>

                    {/* Quick Help Box in Sidebar */}
                    <div className="mt-5 pt-4 border-t border-[#F0F0EE]">
                      <div className="flex items-start gap-2.5 text-xs text-text-secondary leading-relaxed">
                        <Info size={15} className="text-brand shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-text-primary mb-0.5">Need clarification?</p>
                          <p className="mb-2">Contact our legal team for any questions.</p>
                          <a
                            href="mailto:support@gharmb.com"
                            className="inline-flex items-center gap-1 font-bold text-brand hover:underline"
                          >
                            <Mail size={12} />
                            <span>support@gharmb.com</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              )}

              {/* ── MAIN LEGAL DOCUMENT BODY ── */}
              <article
                ref={contentRef}
                className={toc.length > 0 ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'}
              >
                {/* Rendered HTML Document */}
                <div
                  id="legal-content-body"
                  className="legal-doc"
                  dangerouslySetInnerHTML={{ __html: processedHTML }}
                />

                {/* Bottom Contact / Grievance Card */}
                <div className="mt-12 pt-8 border-t border-border">
                  <div className="bg-section-bg border border-border rounded-2xl p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div>
                        <h4 className="text-base font-bold text-text-primary mb-1">
                          Have questions or privacy requests?
                        </h4>
                        <p className="text-sm text-text-secondary leading-relaxed max-w-xl">
                          For data deletion requests, grievance redressal, or questions regarding these terms, reach out to our legal department.
                        </p>
                      </div>
                      <a
                        href="mailto:support@gharmb.com"
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-bold shadow-xs transition-colors shrink-0"
                      >
                        <Mail size={16} />
                        <span>Email Legal Team</span>
                      </a>
                    </div>
                  </div>
                </div>

              </article>
            </div>
          )}

        </div>

      </div>

      {/* ── Back to Top Floating Button ── */}
      <button
        className={`fixed bottom-8 right-8 z-40 w-11 h-11 rounded-full bg-brand text-white shadow-lg flex items-center justify-center transition-all duration-300 cursor-pointer hover:bg-brand-dark ${
          showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
      >
        <ArrowUp size={18} />
      </button>
    </>
  );
}
