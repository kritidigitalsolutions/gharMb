import { Link } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';

export default function BlogCard({ article, featured = false }) {
  const { slug, title, excerpt, category, publishedAt, readingTime, coverImage } = article;

  const formattedDate = new Date(publishedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (featured) {
    return (
      <Link to={`/blog/${slug}`} className="group block">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-10 bg-white border border-border rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
          <div className="aspect-[16/10] md:aspect-auto overflow-hidden">
            <img
              src={coverImage}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
          </div>
          <div className="flex flex-col justify-center p-5 md:p-0 md:pr-8 md:py-8">
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-brand mb-3">
              {category}
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-text-primary leading-snug mb-3">
              {title}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-4 line-clamp-3">
              {excerpt}
            </p>
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span>{formattedDate}</span>
              <span className="w-px h-3 bg-border" />
              <span>{readingTime}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/blog/${slug}`} className="group block">
      <div className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 h-full flex flex-col">
        <div className="aspect-[16/10] overflow-hidden">
          <img
            src={coverImage}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        </div>
        <div className="p-4 sm:p-5 flex flex-col flex-1">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-brand mb-2">
            {category}
          </span>
          <h3 className="text-base font-semibold text-text-primary leading-snug mb-2 group-hover:text-brand transition-colors line-clamp-2">
            {title}
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed mb-4 line-clamp-2 flex-1">
            {excerpt}
          </p>
          <div className="flex items-center justify-between pt-3 border-t border-border-soft">
            <span className="text-xs text-text-muted">{formattedDate}</span>
            <span className="text-xs text-text-muted">{readingTime}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
