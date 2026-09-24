import { BadgeCheck, Users, TrendingUp, Wrench } from 'lucide-react';

const items = [
  { icon: BadgeCheck, label: 'Verified Listings', description: 'Every property reviewed before going live' },
  { icon: Users, label: 'Trusted Professionals', description: 'Developers, agents and owners verified' },
  { icon: TrendingUp, label: 'Real Estate Insights', description: 'Market trends and property intelligence' },
  { icon: Wrench, label: 'Smart Property Tools', description: 'Calculators, converters and dashboards' },
];

export default function TrustStrip() {
  return (
    <section className="bg-section-bg border-y border-border-soft">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 py-6 sm:py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {items.map(({ icon: Icon, label, description }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="shrink-0 w-9 h-9 rounded-xl bg-brand-light flex items-center justify-center mt-0.5">
                <Icon size={17} className="text-brand" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary leading-tight">{label}</p>
                <p className="text-xs text-text-muted mt-0.5 leading-snug hidden sm:block">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
