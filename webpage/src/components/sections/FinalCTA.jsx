import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="bg-[#17202A] py-16 sm:py-20 lg:py-24">
      <div className="max-w-[760px] mx-auto px-5 md:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-[48px] font-bold text-white leading-[1.12] tracking-tight mb-4">
          Your next property starts here.
        </h2>
        <p className="text-base sm:text-lg text-white/50 leading-relaxed mb-8 max-w-md mx-auto">
          Search smarter. Discover better. Make confident property decisions.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 px-6 py-3.5 text-[15px] font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-all duration-200 hover:shadow-[0_4px_16px_rgba(255,90,60,0.3)] active:scale-[0.98]"
          >
            Explore Properties
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3.5 text-[15px] font-medium text-white/80 border border-white/20 rounded-xl hover:bg-white/10 transition-all duration-200 active:scale-[0.98]"
          >
            List Your Property
          </Link>
        </div>
      </div>
    </section>
  );
}
