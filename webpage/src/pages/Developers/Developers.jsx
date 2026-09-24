import DeveloperCard from '../../components/property/DeveloperCard';
import { developers } from '../../data/properties';

export default function Developers() {
  return (
    <>
      <section className="bg-section-bg pt-12 sm:pt-16 pb-12">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-brand mb-3">
              Developers
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-bold text-text-primary leading-[1.1] tracking-tight mb-4">
              Trusted builders and projects.
            </h1>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              Explore new launches, under-construction and ready-to-move projects from verified developers.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {developers.map((dev) => (
              <DeveloperCard key={dev.id} developer={dev} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
