import { Link } from 'react-router-dom';
import { MapPin, Building2, ArrowRight } from 'lucide-react';

export default function DeveloperCard({ developer }) {
  const { name, projectName, location, projectType, priceRange, status, image, units } = developer;

  const statusColor = {
    'Under Construction': 'bg-amber-50 text-amber-700 border-amber-200',
    'Ready to Move': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'New Launch': 'bg-brand-light text-brand border-brand/20',
  };

  return (
    <div className="group bg-white border border-border rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={image}
          alt={projectName}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
        />
        <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusColor[status] || 'bg-white text-text-primary border-border'}`}>
          {status}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">{name}</p>
        <h3 className="text-base font-semibold text-text-primary leading-snug mb-1.5">{projectName}</h3>
        <p className="flex items-center gap-1 text-sm text-text-secondary mb-3">
          <MapPin size={13} className="text-text-muted shrink-0" />
          {location}
        </p>

        <div className="flex items-center gap-3 text-xs text-text-muted mb-4">
          <span>{projectType}</span>
          <span className="w-px h-3 bg-border" />
          <span>{units} units</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border-soft">
          <span className="text-sm font-semibold text-text-primary">{priceRange}</span>
          <Link
            to="/developers"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark transition-colors group/link"
          >
            Details
            <ArrowRight size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
