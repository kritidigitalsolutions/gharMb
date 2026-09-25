import { BadgeCheck, Users, Building2, Shield, Target, Heart } from 'lucide-react';

const values = [
  { icon: BadgeCheck, title: 'Transparency', text: 'Every listing is verified. Every developer is reviewed. We believe in complete transparency.' },
  { icon: Shield, title: 'Trust', text: 'We verify documents, ownership and identity so you can browse and transact with confidence.' },
  { icon: Target, title: 'Simplicity', text: 'Real estate is complex enough. Our platform makes discovery, comparison and decision-making straightforward.' },
  { icon: Heart, title: 'People First', text: 'Behind every property search is a family, a dream, or a business goal. We build for real people.' },
];

export default function About() {
  return (
    <>
      {/* Hero */}
      <section className="bg-section-bg pt-12 sm:pt-16 pb-12">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-brand mb-3">
              About GharMB
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-bold text-text-primary leading-[1.1] tracking-tight mb-4">
              Making real estate simpler and more trustworthy.
            </h1>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              GharMB is a modern real-estate technology platform that connects home buyers, property owners, developers and agents through verified listings, useful tools and transparent processes.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-4">Our story</h2>
              <div className="space-y-4 text-base text-text-secondary leading-relaxed">
                <p>
                  Finding a home in India should not feel like navigating a maze of unverified listings, unreliable agents and opaque pricing. Yet for most people, that is exactly what the experience looks like.
                </p>
                <p>
                  GharMB was built to change this. We created a platform where every property is verified before going live, every developer is reviewed for credibility, and every tool is designed to help buyers and owners make informed decisions.
                </p>
                <p>
                  From residential apartments and villas to commercial offices and developer projects — GharMB brings the entire property ecosystem under one roof, with trust at the center.
                </p>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
              <img
                src="https://images.unsplash.com/photo-1577495508048-b635879837f1?w=600&h=420&fit=crop"
                alt="Modern apartment building exterior"
                loading="lazy"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-section-bg py-12 sm:py-16 lg:py-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-8 lg:mb-10">What we stand for</h2>
          <div className="grid sm:grid-cols-2 gap-5 lg:gap-6">
            {values.map(({ icon: Icon, title, text }) => (
              <div key={title} className="bg-white border border-border rounded-2xl p-6 sm:p-7">
                <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center mb-4">
                  <Icon size={20} className="text-brand" strokeWidth={1.8} />
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-2">{title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
