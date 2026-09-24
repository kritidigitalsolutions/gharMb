import { useState } from 'react';
import { Search, MapPin, Home, IndianRupee, BedDouble } from 'lucide-react';

const tabs = ['Buy', 'Rent', 'Commercial'];

export default function PropertySearch() {
  const [activeTab, setActiveTab] = useState('Buy');

  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Image */}
          <div className="relative rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.08)] order-2 lg:order-1">
            <img
              src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=640&h=440&fit=crop"
              alt="Modern apartment interior with natural light"
              loading="lazy"
              className="w-full h-auto"
            />
          </div>

          {/* Right — Search */}
          <div className="order-1 lg:order-2">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-brand mb-3">
              Property Discovery
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-text-primary leading-[1.12] tracking-tight mb-4">
              Find the right property, without the noise.
            </h2>
            <p className="text-base text-text-secondary leading-relaxed mb-8 max-w-md">
              Search verified residential and commercial properties across locations. Filter by type, budget, size and more.
            </p>

            {/* Search Card */}
            <div className="bg-white border border-border rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
              {/* Tabs */}
              <div className="flex gap-1 mb-5 bg-section-bg rounded-xl p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === tab
                        ? 'bg-white text-text-primary shadow-sm'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Fields */}
              <div className="space-y-3">
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Location — city, sector, locality"
                    className="w-full pl-10 pr-4 py-3 text-sm border border-border rounded-xl bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Home size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    <select className="w-full pl-10 pr-4 py-3 text-sm border border-border rounded-xl bg-white text-text-muted appearance-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors">
                      <option>Property type</option>
                      <option>Apartment</option>
                      <option>Villa</option>
                      <option>House</option>
                      <option>Plot</option>
                    </select>
                  </div>
                  <div className="relative">
                    <IndianRupee size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    <select className="w-full pl-10 pr-4 py-3 text-sm border border-border rounded-xl bg-white text-text-muted appearance-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors">
                      <option>Budget</option>
                      <option>Under ₹30 Lakh</option>
                      <option>₹30–60 Lakh</option>
                      <option>₹60 Lakh–1 Cr</option>
                      <option>₹1–2 Cr</option>
                      <option>Above ₹2 Cr</option>
                    </select>
                  </div>
                </div>

                <button className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-all duration-200 hover:shadow-[0_4px_16px_rgba(255,90,60,0.25)] active:scale-[0.98]">
                  <Search size={16} />
                  Search Properties
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
