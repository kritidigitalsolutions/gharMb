import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import BlogCard from '../../components/blog/BlogCard';
import { blogArticles, blogCategories } from '../../data/blogs';

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = useMemo(() => {
    return blogArticles.filter((article) => {
      const matchesCategory = activeCategory === 'All' || article.category === activeCategory;
      const matchesSearch = !searchQuery || 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const featuredArticle = filteredArticles[0];
  const remainingArticles = filteredArticles.slice(1);

  return (
    <>
      {/* Hero */}
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

      {/* Filters */}
      <section className="bg-white border-b border-border sticky top-[64px] z-30">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
            {/* Categories */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {blogCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    activeCategory === cat
                      ? 'bg-brand-light text-brand'
                      : 'text-text-muted hover:text-text-primary hover:bg-section-bg'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative shrink-0 w-full sm:w-auto sm:min-w-[240px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="bg-white py-10 sm:py-12 lg:py-16">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-text-muted">No articles found matching your criteria.</p>
            </div>
          ) : (
            <>
              {/* Featured */}
              {featuredArticle && (
                <div className="mb-10 lg:mb-12">
                  <BlogCard article={featuredArticle} featured />
                </div>
              )}

              {/* Grid */}
              {remainingArticles.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                  {remainingArticles.map((article) => (
                    <BlogCard key={article.id} article={article} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-section-bg py-12 sm:py-16">
        <div className="max-w-[600px] mx-auto px-5 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3">Stay informed.</h2>
          <p className="text-sm text-text-secondary mb-6">Get property insights, market updates and expert advice delivered to your inbox.</p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email"
              className="flex-1 px-4 py-3 text-sm border border-border rounded-xl bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"
            />
            <button className="px-5 py-3 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-colors shrink-0">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
