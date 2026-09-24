import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative bg-white overflow-hidden">
      {/* Very subtle warm wash */}
      <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-[#FFF8F5] to-transparent pointer-events-none" />

      <div className="relative max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 py-16 sm:py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Copy */}
          <div className="max-w-xl">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.14em] text-brand mb-4">
              Real Estate, Made Simpler
            </span>
            <h1 className="text-[40px] sm:text-[52px] lg:text-[60px] font-bold text-text-primary leading-[1.08] tracking-tight mb-6">
              Find a place that{' '}
              <span className="relative">
                feels like home
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 8C50 3 100 2 150 4C200 6 250 5 298 2" stroke="#FF5A3C" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
                </svg>
              </span>
            </h1>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-8 max-w-md">
              Discover verified properties, trusted developers and smarter real-estate tools — all in one place.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/properties"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-[15px] font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-all duration-200 hover:shadow-[0_4px_16px_rgba(255,90,60,0.25)] active:scale-[0.98]"
              >
                Explore Properties
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-[15px] font-medium text-text-primary bg-white border border-border rounded-xl hover:bg-section-bg transition-all duration-200 active:scale-[0.98]"
              >
                List Your Property
              </Link>
            </div>

            {/* Micro trust */}
            <div className="flex items-center gap-4 mt-8 pt-6 border-t border-border-soft">
              <div className="flex -space-x-2">
                {[
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
                  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=face',
                ].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <p className="text-sm text-text-muted">
                Trusted by <span className="text-text-primary font-medium">2,000+</span> property seekers
              </p>
            </div>
          </div>

          {/* Right — Image */}
          <div className="relative">
            <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)]">
              <img
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=700&h=500&fit=crop"
                alt="Modern residential property with contemporary architecture"
                className="w-full h-auto"
                loading="eager"
              />

              {/* Property Info Overlay */}
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg max-w-[240px]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <BadgeCheck size={14} className="text-brand" />
                    <span className="text-xs font-semibold text-brand">Verified Property</span>
                  </div>
                  <h4 className="text-sm font-semibold text-text-primary mb-0.5">Skyline Heights</h4>
                  <p className="text-xs text-text-muted mb-2">Sector 62, Noida</p>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span>3 BHK</span>
                    <span className="text-text-muted">·</span>
                    <span>1480 sq ft</span>
                    <span className="text-text-muted">·</span>
                    <span className="font-semibold text-text-primary">₹85 Lakh</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
