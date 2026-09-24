import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Store, Presentation, Warehouse, Users, Factory } from 'lucide-react';

const icons = { Building2, Store, Presentation, Warehouse, Users, Factory };
const categories = [
  { name: 'Office Space', icon: 'Building2' },
  { name: 'Retail Shop', icon: 'Store' },
  { name: 'Showroom', icon: 'Presentation' },
  { name: 'Warehouse', icon: 'Warehouse' },
  { name: 'Co-working', icon: 'Users' },
  { name: 'Industrial', icon: 'Factory' },
];

export default function CommercialSection() {
  return (
    <section className="bg-section-bg py-16 sm:py-20 lg:py-24">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left — Content */}
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-brand mb-3">
              Commercial
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-text-primary leading-[1.12] tracking-tight mb-4">
              Spaces built for business.
            </h2>
            <p className="text-base text-text-secondary leading-relaxed mb-8 max-w-md">
              Discover commercial properties — from premium office spaces and retail shops to warehouses and co-working hubs.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {categories.map(({ name, icon }) => {
                const Icon = icons[icon];
                return (
                  <div
                    key={name}
                    className="flex items-center gap-2.5 px-4 py-3 bg-white border border-border rounded-xl hover:border-brand/30 transition-colors cursor-default"
                  >
                    <Icon size={16} className="text-text-muted shrink-0" strokeWidth={1.8} />
                    <span className="text-sm font-medium text-text-primary">{name}</span>
                  </div>
                );
              })}
            </div>

            <Link
              to="/commercial"
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-all duration-200 hover:shadow-[0_4px_16px_rgba(255,90,60,0.25)] active:scale-[0.98]"
            >
              Explore Commercial Spaces
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Right — Image */}
          <div className="relative rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
            <img
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&h=440&fit=crop"
              alt="Modern commercial office space with glass walls"
              loading="lazy"
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
