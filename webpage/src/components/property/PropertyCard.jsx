import { Link } from 'react-router-dom';
import { BadgeCheck, BedDouble, Maximize2, MapPin, ArrowRight } from 'lucide-react';

export default function PropertyCard({ property }) {
  const { title, location, type, bedrooms, area, priceLabel, status, image, badge } = property;

  return (
    <div className="group bg-white border border-border rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
        />
        {/* Badge */}
        {badge && (
          <span className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
            status === 'premium'
              ? 'bg-[#17202A] text-white'
              : 'bg-white/90 backdrop-blur-sm text-brand'
          }`}>
            <BadgeCheck size={13} />
            {badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        <h3 className="text-base font-semibold text-text-primary leading-snug mb-1">
          {title}
        </h3>
        <p className="flex items-center gap-1 text-sm text-text-secondary mb-3">
          <MapPin size={13} className="text-text-muted shrink-0" />
          {location}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-text-muted mb-4">
          <span className="flex items-center gap-1">
            <BedDouble size={13} />
            {bedrooms} BHK
          </span>
          <span className="w-px h-3 bg-border" />
          <span className="flex items-center gap-1">
            <Maximize2 size={12} />
            {area} sq ft
          </span>
          <span className="w-px h-3 bg-border" />
          <span>{type}</span>
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-border-soft">
          <span className="text-lg font-bold text-text-primary">{priceLabel}</span>
          <Link
            to="/properties"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark transition-colors group/link"
          >
            View
            <ArrowRight size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
