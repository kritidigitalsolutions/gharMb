import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Calendar } from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

export default function BlogCard({ article, featured = false }) {
  if (!article) return null;

  const slug = article.slug;
  const title = article.title;
  const excerpt = article.excerpt;
  const categoryName = typeof article.category === 'object' && article.category !== null
    ? article.category.name
    : (article.category || 'Insights');

  const rawDate = article.publishedAt || article.createdAt;
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  const displayReadTime = article.readTime
    ? `${article.readTime} min read`
    : (article.readingTime || '5 min read');

  const imageSrc = article.bannerImage || article.coverImage || FALLBACK_IMAGE;

  if (featured) {
    return (
      <Link to={`/insights/${slug}`} className="group block min-w-0 w-full">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-10 bg-white border border-[#E7EAED] hover:border-[#FF5A3C]/40 rounded-[24px] overflow-hidden hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-all duration-400">
          <div className="aspect-[16/10] md:aspect-auto overflow-hidden bg-slate-100 min-w-0 w-full relative">
            <img
              src={imageSrc}
              alt={title}
              loading="lazy"
              onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-600 ease-out"
            />
          </div>
          <div className="flex flex-col justify-center p-6 md:p-0 md:pr-8 md:py-8 min-w-0 w-full">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block text-[11px] font-bold uppercase tracking-[0.14em] text-[#FF5A3C]">
                {categoryName}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF0ED] text-[#FF5A3C]">
                Featured
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#17212B] leading-snug mb-3.5 group-hover:text-[#FF5A3C] transition-colors break-words [overflow-wrap:anywhere]">
              {title}
            </h3>
            <p className="text-[14px] text-[#607086] leading-relaxed mb-5 line-clamp-3 break-words [overflow-wrap:anywhere]">
              {excerpt}
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-[#E7EAED] text-xs text-[#607086]">
              <div className="flex items-center gap-3">
                <span>{formattedDate}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>{displayReadTime}</span>
              </div>
              <span className="inline-flex items-center gap-1 font-semibold text-[#FF5A3C] group-hover:translate-x-1 transition-transform duration-200 shrink-0">
                Read <ArrowRight size={14} />
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/insights/${slug}`} className="group block h-full min-w-0 w-full">
      <div className="bg-white border border-[#E7EAED] hover:border-[#FF5A3C]/40 rounded-[20px] overflow-hidden hover:shadow-[0_12px_36px_rgba(0,0,0,0.05)] transition-all duration-400 h-full flex flex-col min-w-0">
        {/* 16:10 Ratio Cover Image */}
        <div className="aspect-[16/10] overflow-hidden bg-slate-100 relative min-w-0 w-full">
          <img
            src={imageSrc}
            alt={title}
            loading="lazy"
            onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-600 ease-out"
          />
        </div>

        {/* Card Body */}
        <div className="p-5 sm:p-6 flex flex-col flex-1 min-w-0">
          <span className="inline-block text-[11px] font-bold uppercase tracking-[0.14em] text-[#FF5A3C] mb-2.5">
            {categoryName}
          </span>
          <h3 className="text-[17px] sm:text-[18px] font-bold text-[#17212B] leading-snug mb-2.5 group-hover:text-[#FF5A3C] transition-colors line-clamp-2 break-words [overflow-wrap:anywhere]">
            {title}
          </h3>
          <p className="text-[13.5px] text-[#607086] leading-[1.6] mb-5 line-clamp-2 flex-1 break-words [overflow-wrap:anywhere]">
            {excerpt}
          </p>

          <div className="flex items-center justify-between pt-3.5 border-t border-[#E7EAED] text-xs text-[#607086]">
            <span>{formattedDate}</span>
            <div className="flex items-center gap-1 font-medium text-[#17212B] group-hover:text-[#FF5A3C] transition-colors shrink-0">
              <span>{displayReadTime}</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-200 text-[#FF5A3C]" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
