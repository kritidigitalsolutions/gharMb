import { Link } from 'react-router-dom';
import { Building2, Store, Presentation, Warehouse, Users, Factory, ArrowRight } from 'lucide-react';

const categories = [
  { name: 'Office Space', description: 'Professional workspaces in prime locations.', icon: Building2, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop' },
  { name: 'Retail Shop', description: 'High-visibility retail spaces for your business.', icon: Store, image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop' },
  { name: 'Showroom', description: 'Large display spaces on main roads.', icon: Presentation, image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
  { name: 'Warehouse', description: 'Storage and logistics spaces.', icon: Warehouse, image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop' },
  { name: 'Co-working', description: 'Flexible shared workspaces.', icon: Users, image: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=400&h=300&fit=crop' },
  { name: 'Industrial', description: 'Manufacturing and production spaces.', icon: Factory, image: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400&h=300&fit=crop' },
];

export default function Commercial() {
  return (
    <>
      <section className="bg-section-bg pt-12 sm:pt-16 pb-12">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-brand mb-3">
              Commercial Real Estate
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-bold text-text-primary leading-[1.1] tracking-tight mb-4">
              Spaces built for business.
            </h1>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              Discover verified commercial properties — offices, retail, warehouses and more.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {categories.map(({ name, description, icon: Icon, image }) => (
              <div key={name} className="group bg-white border border-border rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={image} alt={name} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={18} className="text-brand" strokeWidth={1.8} />
                    <h3 className="text-base font-semibold text-text-primary">{name}</h3>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
