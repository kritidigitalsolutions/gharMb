import { Calculator, ArrowLeftRight, TrendingUp, LayoutDashboard } from 'lucide-react';

const tools = [
  { icon: Calculator, name: 'Loan Calculator', description: 'Estimate monthly EMI, total interest and loan eligibility for any property.' },
  { icon: ArrowLeftRight, name: 'Unit Converter', description: 'Convert between sq ft, sq m, sq yards, acres and hectares instantly.' },
  { icon: TrendingUp, name: 'Market Insights', description: 'Understand property price trends, locality ratings and investment potential.' },
  { icon: LayoutDashboard, name: 'Property Dashboard', description: 'Track your listings, enquiries, token requests and property analytics.' },
];

export default function ToolsSection() {
  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-brand mb-3">
            Tools
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary leading-[1.12] tracking-tight mb-4">
            Make smarter property decisions.
          </h2>
          <p className="text-base text-text-secondary leading-relaxed">
            Free tools designed to help you calculate, compare and understand real estate better.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {tools.map(({ icon: Icon, name, description }) => (
            <div
              key={name}
              className="bg-warm-bg border border-border-soft rounded-2xl p-6 hover:border-brand/20 hover:shadow-[0_4px_20px_rgba(255,90,60,0.04)] transition-all duration-300 cursor-default"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-light flex items-center justify-center mb-4">
                <Icon size={20} className="text-brand" strokeWidth={1.8} />
              </div>
              <h3 className="text-sm font-semibold text-text-primary mb-2">{name}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
