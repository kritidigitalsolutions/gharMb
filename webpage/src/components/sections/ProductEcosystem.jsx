import { Search, ListPlus, BadgeCheck, Building2, Store, Ticket, Newspaper, Calculator } from 'lucide-react';

const features = [
  { icon: Search, label: 'Property Discovery', description: 'Search and filter verified properties' },
  { icon: ListPlus, label: 'Property Listing', description: 'List as owner, agent or developer' },
  { icon: BadgeCheck, label: 'Verified Properties', description: 'Admin-reviewed before going live' },
  { icon: Building2, label: 'Developer Projects', description: 'New launches and project details' },
  { icon: Store, label: 'Commercial Spaces', description: 'Office, retail, warehouse and more' },
  { icon: Ticket, label: 'Token Booking', description: 'Secure properties with token payments' },
  { icon: Newspaper, label: 'Real Estate News', description: 'Market trends and property insights' },
  { icon: Calculator, label: 'Smart Tools', description: 'Loan calculator, unit converter, dashboard' },
];

export default function ProductEcosystem() {
  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-12 lg:mb-16">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-brand mb-3">
            Platform
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-text-primary leading-[1.12] tracking-tight mb-4">
            More than listings.
          </h2>
          <p className="text-base text-text-secondary leading-relaxed">
            GharMB connects every part of the property journey — from discovery and verification to booking and market intelligence.
          </p>
        </div>

        {/* Ecosystem Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
          {features.map(({ icon: Icon, label, description }) => (
            <div
              key={label}
              className="group relative bg-white border border-border rounded-2xl p-5 sm:p-6 hover:border-brand/30 hover:shadow-[0_4px_20px_rgba(255,90,60,0.06)] transition-all duration-300 cursor-default"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center mb-4 group-hover:bg-brand group-hover:text-white transition-colors duration-300">
                <Icon size={20} className="text-brand group-hover:text-white transition-colors duration-300" strokeWidth={1.8} />
              </div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">{label}</h3>
              <p className="text-xs text-text-muted leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
