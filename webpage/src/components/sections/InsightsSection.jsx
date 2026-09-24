import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SectionHeader from '../common/SectionHeader';
import BlogCard from '../blog/BlogCard';
import { blogArticles } from '../../data/blogs';

export default function InsightsSection() {
  const previewArticles = blogArticles.slice(0, 3);

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
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark transition-colors shrink-0 group"
          >
            View all insights
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {previewArticles.map((article) => (
            <BlogCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}
