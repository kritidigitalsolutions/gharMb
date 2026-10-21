import { Link } from 'react-router-dom';
import { ArrowRight, Building2 } from 'lucide-react';
import DeveloperCard from '../../components/property/DeveloperCard';
import { developers } from '../../data/properties';

export default function Developers() {
  return (
    <>
      <section className="bg-section-bg pt-12 sm:pt-16 pb-12">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-brand mb-3">
              Developers & New Projects
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-bold text-text-primary leading-[1.1] tracking-tight mb-4">
              Trusted builders and projects.
            </h1>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-6">
              Explore new launches, under-construction and ready-to-move projects from verified developers with transparent commission structures and admin-qualified enquiry coordination.
            </p>
            <Link
              to="/new-projects"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-xs sm:text-sm font-bold hover:bg-brand-dark transition-all shadow-xs"
            >
              <Building2 size={16} />
              <span>Explore All Direct Builder Inventory</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {developers.map((dev) => (
              <DeveloperCard key={dev.id} developer={dev} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
