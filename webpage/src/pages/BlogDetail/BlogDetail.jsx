import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, Calendar, Clock, User, Share2, X, List, ArrowLeft } from 'lucide-react';
import { blogArticles } from '../../data/blogs';
import BlogCard from '../../components/blog/BlogCard';

function TableOfContents({ headings, onClose }) {
  return (
    <div>
      {onClose && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-soft">
          <span className="text-sm font-semibold text-text-primary">Contents</span>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-section-bg" aria-label="Close">
            <X size={16} />
          </button>
        </div>
      )}
      <nav aria-label="Table of contents">
        <ul className="space-y-2">
          {headings.map((heading, i) => (
            <li key={i}>
              <a
                href={`#heading-${i}`}
                onClick={onClose}
                className="text-sm text-text-secondary hover:text-brand transition-colors leading-snug block py-0.5"
              >
                {heading}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function ArticleContent({ content }) {
  let headingIndex = 0;

  return (
    <div className="prose-gharmb">
      {content.map((block, i) => {
        switch (block.type) {
          case 'paragraph':
            return <p key={i} className="text-[17px] text-text-secondary leading-[1.75] mb-6">{block.text}</p>;

          case 'heading': {
            const currentIndex = headingIndex++;
            if (block.level === 2) {
              return (
                <h2 key={i} id={`heading-${currentIndex}`} className="text-xl sm:text-2xl font-bold text-text-primary mt-10 mb-4 scroll-mt-24">
                  {block.text}
                </h2>
              );
            }
            return (
              <h3 key={i} id={`heading-${currentIndex}`} className="text-lg font-semibold text-text-primary mt-8 mb-3 scroll-mt-24">
                {block.text}
              </h3>
            );
          }

          case 'quote':
            return (
              <blockquote key={i} className="border-l-3 border-brand pl-5 py-1 my-6">
                <p className="text-[17px] text-text-secondary leading-[1.7] italic">{block.text}</p>
              </blockquote>
            );

          case 'callout':
            return (
              <div key={i} className="bg-brand-light/50 border border-brand/10 rounded-xl p-5 my-6">
                <p className="text-sm text-text-primary leading-relaxed">{block.text}</p>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

export default function BlogDetail() {
  const { slug } = useParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const article = blogArticles.find((a) => a.slug === slug);

  // Lock scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  // Escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setDrawerOpen(false);
  }, []);

  useEffect(() => {
    if (drawerOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [drawerOpen, handleKeyDown]);

  if (!article) {
    return (
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 py-24 text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Article not found</h1>
        <Link to="/blog" className="text-brand hover:text-brand-dark text-sm font-medium">
          ← Back to Blog
        </Link>
      </div>
    );
  }

  const headings = article.content
    .filter((b) => b.type === 'heading')
    .map((b) => b.text);

  const relatedArticles = blogArticles
    .filter((a) => a.id !== article.id)
    .slice(0, 3);

  const formattedDate = new Date(article.publishedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      {/* Article Header */}
      <section className="bg-section-bg pt-8 sm:pt-12 pb-10 sm:pb-14">
        <div className="max-w-[760px] mx-auto px-5 md:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-text-muted mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-text-primary transition-colors">Home</Link>
            <ChevronRight size={12} />
            <Link to="/blog" className="hover:text-text-primary transition-colors">Blog</Link>
            <ChevronRight size={12} />
            <span className="text-text-secondary truncate max-w-[200px]">{article.title}</span>
          </nav>

          <span className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-brand mb-3">
            {article.category}
          </span>

          <h1 className="text-2xl sm:text-3xl lg:text-[40px] font-bold text-text-primary leading-[1.15] tracking-tight mb-4">
            {article.title}
          </h1>

          <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-6 max-w-xl">
            {article.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
            <span className="flex items-center gap-1.5">
              <User size={14} />
              {article.author.name}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {article.readingTime}
            </span>
          </div>
        </div>
      </section>

      {/* Cover Image */}
      <section className="bg-white">
        <div className="max-w-[960px] mx-auto px-5 md:px-8 -mt-2">
          <div className="rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-auto aspect-[2/1] object-cover"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white py-10 sm:py-14 lg:py-16">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="grid lg:grid-cols-[1fr_240px] gap-12 lg:gap-16">
            {/* Main Article */}
            <article className="max-w-[720px]">
              <ArticleContent content={article.content} />

              {/* Tags */}
              <div className="mt-12 pt-6 border-t border-border-soft">
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs font-medium text-text-muted bg-section-bg rounded-lg"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-8">
                {headings.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">Contents</h4>
                    <TableOfContents headings={headings} />
                  </div>
                )}

                {relatedArticles.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">Related</h4>
                    <div className="space-y-3">
                      {relatedArticles.map((ra) => (
                        <Link
                          key={ra.id}
                          to={`/blog/${ra.slug}`}
                          className="block text-sm text-text-secondary hover:text-brand transition-colors leading-snug py-1"
                        >
                          {ra.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Related Articles Grid */}
      <section className="bg-section-bg py-12 sm:py-16">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          <h3 className="text-xl font-bold text-text-primary mb-6">More to read</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {relatedArticles.map((ra) => (
              <BlogCard key={ra.id} article={ra} />
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Contents Button */}
      {headings.length > 0 && (
        <button
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-[#17202A] text-white text-sm font-medium rounded-xl shadow-lg hover:bg-[#243045] transition-colors"
          aria-label="Open table of contents"
        >
          <List size={16} />
          Contents
        </button>
      )}

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[110] bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out lg:hidden max-h-[70vh] overflow-y-auto ${
          drawerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Article contents"
      >
        <div className="p-5 sm:p-6">
          <TableOfContents
            headings={headings}
            onClose={() => setDrawerOpen(false)}
          />

          {relatedArticles.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border-soft">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Related Articles</h4>
              <div className="space-y-2">
                {relatedArticles.map((ra) => (
                  <Link
                    key={ra.id}
                    to={`/blog/${ra.slug}`}
                    onClick={() => setDrawerOpen(false)}
                    className="block text-sm text-text-secondary hover:text-brand transition-colors py-1"
                  >
                    {ra.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
