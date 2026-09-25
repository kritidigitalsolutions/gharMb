import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SectionHeader from '../common/SectionHeader';
import BlogCard from '../blog/BlogCard';
import { fetchPublishedBlogs } from '../../api/blogApi';

export default function InsightsSection() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadRecentInsights() {
      setIsLoading(true);
      const res = await fetchPublishedBlogs({ page: 1, limit: 3 });
      if (isMounted) {
        setArticles(res.blogs || []);
        setIsLoading(false);
      }
    }
    loadRecentInsights();
    return () => { isMounted = false; };
  }, []);

  // If loading, show 3 skeleton cards
  if (isLoading) {
    return (
      <section className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 lg:mb-12">
            <SectionHeader
              eyebrow="Insights"
              title="Real estate, explained simply."
              subtitle="Property guides, market analysis and practical advice for buyers, owners and investors."
            />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-border/60 rounded-2xl p-4 space-y-4">
                <div className="aspect-[16/10] bg-slate-100 rounded-xl" />
                <div className="w-20 h-4 bg-slate-100 rounded" />
                <div className="w-full h-5 bg-slate-100 rounded" />
                <div className="w-3/4 h-4 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // If no articles published in DB, return null or don't render
  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 lg:mb-12">
          <SectionHeader
            eyebrow="Insights"
            title="Real estate, explained simply."
            subtitle="Property guides, market analysis and practical advice for buyers, owners and investors."
          />
          <Link
            to="/insights"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark transition-colors shrink-0 group"
          >
            View all insights
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {articles.map((article) => (
            <BlogCard
              key={article._id || article.slug}
              article={article}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
