import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { faqItems } from '../../data/properties';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-section-bg py-16 sm:py-20 lg:py-24">
      <div className="max-w-[760px] mx-auto px-5 md:px-8">
        <div className="text-center mb-10 lg:mb-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-brand mb-3">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary leading-[1.12] tracking-tight mb-4">
            Common questions, clear answers.
          </h2>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className="bg-white border border-border rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between px-5 sm:px-6 py-4 text-left hover:bg-section-bg/50 transition-colors"
                aria-expanded={openIndex === index}
              >
                <span className="text-[15px] font-medium text-text-primary pr-4">{item.question}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-text-muted transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  openIndex === index ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="px-5 sm:px-6 pb-5 text-sm text-text-secondary leading-relaxed">
                  {item.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
