import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PropertyCard from '../../components/property/PropertyCard';
import { properties } from '../../data/properties';

export default function Properties() {
  return (
    <>
      {/* Hero */}
      <section className="bg-section-bg pt-12 sm:pt-16 pb-12">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-brand mb-3">
              Properties
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-bold text-text-primary leading-[1.1] tracking-tight mb-4">
              Discover verified properties.
            </h1>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              Browse apartments, villas, houses and plots — every listing verified by our team before going live.
            </p>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
          <div className="text-center mt-12">
            <p className="text-sm text-text-muted">More properties coming soon. Download the GharMB app for full access.</p>
          </div>
        </div>
      </section>
    </>
  );
}
