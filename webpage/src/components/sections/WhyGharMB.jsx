import { BadgeCheck, Users, BarChart3, Layers } from 'lucide-react';

const benefits = [
  {
    icon: BadgeCheck,
    title: 'Verified Properties',
    text: 'Every listing is reviewed by our admin team for documents, photos and ownership before going live. You see only genuine properties.',
  },
  {
    icon: Users,
    title: 'Trusted Professionals',
    text: 'Connect with verified developers, registered agents and direct property owners — each vetted for credibility.',
  },
  {
    icon: BarChart3,
    title: 'Smarter Decisions',
    text: 'Use our loan calculator, market insights and property tools to understand what you can afford and where to invest.',
  },
];

export default function WhyGharMB() {
  return (
    <section className="bg-section-bg py-16 sm:py-20 lg:py-24">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Left — Statement */}
          <div className="lg:col-span-2">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-brand mb-3">
              Why GharMB
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-text-primary leading-[1.12] tracking-tight mb-5">
              Real estate should feel simpler.
            </h2>
            <p className="text-base text-text-secondary leading-relaxed max-w-sm">
              GharMB brings together verified properties, trusted professionals and useful tools — 
              so you can focus on finding the right home, not navigating a broken process.
            </p>
          </div>

          {/* Right — Benefits */}
          <div className="lg:col-span-3 space-y-6">
            {benefits.map(({ icon: Icon, title, text }, index) => (
              <div
                key={title}
                className="bg-white border border-border rounded-2xl p-6 sm:p-7 flex gap-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-shadow duration-300"
              >
                <div className="shrink-0 w-11 h-11 rounded-xl bg-brand-light flex items-center justify-center">
                  <Icon size={20} className="text-brand" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-text-primary mb-1.5">{title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
