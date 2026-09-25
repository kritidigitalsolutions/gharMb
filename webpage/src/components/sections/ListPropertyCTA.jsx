import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function ListPropertyCTA() {
  return (
    <section className="bg-section-bg py-16 sm:py-20 lg:py-24">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Image */}
          <div className="relative rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.08)] order-2 lg:order-1">
            <img
              src="https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=640&h=420&fit=crop"
              alt="Property owner reviewing documents at home"
              loading="lazy"
              className="w-full h-auto"
            />
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-brand mb-3">
              For Property Owners
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-text-primary leading-[1.12] tracking-tight mb-4">
              Have a property to sell or rent?
            </h2>
            <p className="text-base text-text-secondary leading-relaxed mb-8 max-w-md">
              List your property on GharMB and reach people actively looking for their next home or investment. Every listing is verified by our team before going live.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-[15px] font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-all duration-200 hover:shadow-[0_4px_16px_rgba(255,90,60,0.25)] active:scale-[0.98]"
              >
                List Your Property
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-[15px] font-medium text-text-primary bg-white border border-border rounded-xl hover:bg-white/80 transition-all duration-200 active:scale-[0.98]"
              >
                Learn How It Works
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
