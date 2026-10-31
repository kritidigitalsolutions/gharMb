import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Filter, Search, CheckCircle2 } from 'lucide-react';
import PropertyCard from '../../components/property/PropertyCard';
import { properties as fallbackProperties } from '../../data/properties';
import { API_BASE_URL } from '../../api/config';

export default function Properties() {
  const [propertiesList, setPropertiesList] = useState([]);
  const [availabilityFilter, setAvailabilityFilter] = useState('available'); // 'available' | 'all' | 'sold'
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchProperties() {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/properties?limit=60&includeSold=true`).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          if (data?.status === 'success' && Array.isArray(data.data?.properties) && data.data.properties.length > 0) {
            const mapped = data.data.properties.map((p) => ({
              id: p._id || p.id,
              title: p.title,
              location: p.location || `${p.locality ? p.locality + ', ' : ''}${p.city}`,
              type: p.propertyType || p.category,
              bedrooms: p.bedrooms || 2,
              area: p.carpetArea || p.builtUpArea || 1200,
              price: p.price,
              priceLabel: p.formattedPrice || (p.price ? `₹${p.price.toLocaleString('en-IN')}` : 'Price on Request'),
              status: p.isSold ? 'sold' : (p.isFeatured ? 'premium' : 'verified'),
              image: (p.photos && p.photos.length > 0) ? p.photos[0] : (p.thumbnail || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop'),
              badge: p.isSold ? 'Sold Out' : (p.listingFor === 'Rent' ? 'Rent' : 'Verified'),
              listingType: p.listingFor?.toLowerCase() || 'buy',
              rating: p.rating || 4.9,
              reviewsCount: p.reviewsCount || 4,
              allowTokenBooking: p.allowTokenBooking ?? true,
              tokenAmount: p.tokenAmount || 100000,
              isSold: Boolean(p.isSold),
              saleStatus: p.saleStatus || (p.isSold ? 'sold' : 'available'),
              possessionDate: p.possessionDate ? String(p.possessionDate).trim() : '',
            }));
            if (isMounted) setPropertiesList(mapped);
            return;
          }
        }
        if (isMounted) setPropertiesList(fallbackProperties);
      } catch (_) {
        if (isMounted) setPropertiesList(fallbackProperties);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchProperties();
    return () => { isMounted = false; };
  }, []);

  // Filter listings by availability and search
  const filteredProperties = propertiesList.filter((prop) => {
    const isSold = Boolean(prop.isSold || prop.saleStatus === 'sold' || prop.status === 'sold');
    if (availabilityFilter === 'available' && isSold) return false;
    if (availabilityFilter === 'sold' && !isSold) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = (prop.title || '').toLowerCase().includes(q);
      const matchLoc = (prop.location || '').toLowerCase().includes(q);
      const matchType = (prop.type || '').toLowerCase().includes(q);
      return matchTitle || matchLoc || matchType;
    }
    return true;
  });

  return (
    <>
      {/* Hero */}
      <section className="bg-section-bg pt-12 sm:pt-16 pb-12 border-b border-border/50">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-brand mb-3">
                Properties
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-bold text-text-primary leading-[1.1] tracking-tight mb-4">
                Discover verified properties.
              </h1>
              <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
                Browse apartments, villas, houses, and plots — verified by our team before going live.
              </p>
            </div>

            {/* Availability Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search city, locality, type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-border bg-white focus:outline-none focus:border-brand shadow-2xs"
                />
              </div>

              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-border bg-white text-text-primary font-semibold focus:outline-none focus:border-brand cursor-pointer shadow-2xs"
                title="Filter site availability"
              >
                <option value="available">🟢 Available Sites Only</option>
                <option value="all">All Sites (Include Sold)</option>
                <option value="sold">🔴 Sold Out Sites</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          {filteredProperties.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50/60 rounded-2xl border border-dashed border-gray-200">
              <p className="text-base font-semibold text-text-primary mb-1">No matching listings found</p>
              <p className="text-xs text-text-muted mb-4">Try adjusting your availability filter or search keyword.</p>
              <button
                type="button"
                onClick={() => { setAvailabilityFilter('all'); setSearchQuery(''); }}
                className="px-4 py-1.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-dark transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}

          <div className="text-center mt-12">
            <p className="text-sm text-text-muted">
              Showing <strong className="text-text-primary font-semibold">{filteredProperties.length}</strong> listings. Download the GharMB app for real-time site visit bookings.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
