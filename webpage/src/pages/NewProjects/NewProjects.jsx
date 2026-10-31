import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ShieldCheck, Sparkles, CheckCircle2, ArrowRight, Filter, Search, Award, Flame } from 'lucide-react';
import PropertyCard from '../../components/property/PropertyCard';
import DeveloperCard from '../../components/property/DeveloperCard';
import { properties as fallbackProperties, developers as fallbackDevelopers } from '../../data/properties';
import { API_BASE_URL } from '../../api/config';

export default function NewProjects() {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'residential' | 'commercial'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Under Construction' | 'Ready to Move' | 'New Launch'
  const [availabilityFilter, setAvailabilityFilter] = useState('available'); // 'available' | 'all' | 'sold'
  const [searchQuery, setSearchQuery] = useState('');
  const [developerProperties, setDeveloperProperties] = useState([]);
  const [developerProjects, setDeveloperProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch verified developer properties and projects from backend API
  useEffect(() => {
    let isMounted = true;

    async function fetchDeveloperData() {
      setIsLoading(true);
      try {
        // 1. Fetch developer properties from /api/properties/new-projects (strictly for Sale only)
        const propRes = await fetch(`${API_BASE_URL}/properties/new-projects?limit=50&includeSold=true&listingFor=Sale`).catch(() => null);
        let liveProps = [];
        if (propRes && propRes.ok) {
          const propData = await propRes.json();
          if (propData?.status === 'success' && Array.isArray(propData.data?.properties)) {
            liveProps = propData.data.properties
              .filter(p => {
                const lf = String(p.listingFor || '').toLowerCase();
                return lf !== 'rent' && lf !== 'lease' && lf !== 'pg';
              })
              .map(p => ({
                id: p._id || p.id,
                title: p.title,
                location: p.location || `${p.locality ? p.locality + ', ' : ''}${p.city}`,
                type: p.propertyType || p.category,
                bedrooms: p.bedrooms || 2,
                area: p.carpetArea || p.builtUpArea || 1200,
                price: p.price,
                priceLabel: p.formattedPrice || (p.price ? `₹${p.price.toLocaleString('en-IN')}` : 'Price on Request'),
                status: p.isFeatured ? 'premium' : 'verified',
                image: (p.photos && p.photos.length > 0) ? p.photos[0] : (p.thumbnail || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop'),
                badge: p.postedByRole === 'Builder' ? 'Direct Developer' : 'Builder Direct',
                furnishing: p.furnishingStatus || 'Unfurnished',
                listingFor: p.listingFor || 'Sale',
                listingType: p.listingFor?.toLowerCase() === 'sale' ? 'buy' : (p.listingFor?.toLowerCase() || 'buy'),
                rating: p.rating || 4.9,
                reviewsCount: p.reviewsCount || 4,
                allowTokenBooking: p.allowTokenBooking ?? true,
                tokenAmount: p.tokenAmount || 100000,
                postedByRole: 'Builder',
                role: 'builder',
                userRole: 'builder',
                developerName: p.postedBy?.companyName || p.companyName || 'Developer Partner',
                isDeveloper: true,
                isSold: Boolean(p.isSold),
                saleStatus: p.saleStatus || (p.isSold ? 'sold' : 'available'),
                possessionDate: p.possessionDate ? String(p.possessionDate).trim() : '',
                reraNumbers: Array.isArray(p.reraNumbers) ? p.reraNumbers : (p.reraNumber ? [{ name: 'Phase 1', reraNumber: p.reraNumber }] : []),
                reraNumber: typeof p.reraNumber === 'string' ? p.reraNumber : (p.reraNumbers?.[0]?.reraNumber || (typeof p.reraNumbers?.[0] === 'string' ? p.reraNumbers[0] : '')),
              }));
          }
        }

        // 2. Fetch developer projects from /api/projects (including sold for client filter)
        const projRes = await fetch(`${API_BASE_URL}/projects?limit=50&includeSold=true`).catch(() => null);
        let liveProjects = [];
        if (projRes && projRes.ok) {
          const projData = await projRes.json();
          if (projData?.status === 'success' && Array.isArray(projData.data?.projects)) {
            liveProjects = projData.data.projects.map(p => ({
              id: p._id || p.id,
              name: p.developerName || p.developer?.companyName || p.developer?.name || 'Verified Developer',
              projectName: p.projectName,
              location: `${p.locality ? p.locality + ', ' : ''}${p.city}`,
              projectType: p.projectType || 'Residential',
              priceRange: p.priceRange || (p.minPrice ? `₹${(p.minPrice / 10000000).toFixed(2)} Cr onwards` : 'Price on Request'),
              status: p.isSold ? 'Sold' : (p.projectStatus || 'Under Construction'),
              image: (p.projectPhotos && p.projectPhotos.length > 0) ? p.projectPhotos[0] : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop',
              units: p.totalUnits || 120,
              videos: p.projectVideos || [],
              isSold: Boolean(p.isSold),
              saleStatus: p.saleStatus || (p.isSold ? 'sold' : 'available'),
              possessionDate: p.possessionDate ? String(p.possessionDate).trim() : '',
              reraNumbers: Array.isArray(p.reraNumbers) ? p.reraNumbers : (p.reraProjectNumber ? [{ name: 'Phase 1', reraNumber: p.reraProjectNumber }] : []),
              reraNumber: typeof p.reraProjectNumber === 'string' ? p.reraProjectNumber : (p.reraNumbers?.[0]?.reraNumber || (typeof p.reraNumbers?.[0] === 'string' ? p.reraNumbers[0] : '')),
            }));
          }
        }

        if (isMounted) {
          // If backend returned live items, use them; otherwise fallback to curated developer data
          if (liveProps.length > 0) {
            setDeveloperProperties(liveProps);
          } else {
            // Strictly filter fallback properties to ONLY developer / builder properties for SALE
            const curatedDeveloperProps = fallbackProperties
              .filter(p => {
                const isBuilder = p.role === 'builder' || p.postedByRole === 'Builder' || p.isDeveloper || [1, 6, 8].includes(p.id);
                const isNotRent = p.listingType !== 'rent' && p.listingFor !== 'Rent' && p.listingFor !== 'Lease' && p.listingFor !== 'PG';
                return isBuilder && isNotRent;
              })
              .map(p => ({
                ...p,
                postedByRole: 'Builder',
                role: 'builder',
                isDeveloper: true,
                badge: p.badge || 'Developer Direct'
              }));
            setDeveloperProperties(curatedDeveloperProps);
          }

          if (liveProjects.length > 0) {
            setDeveloperProjects(liveProjects);
          } else {
            setDeveloperProjects(fallbackDevelopers);
          }
        }
      } catch (err) {
        if (isMounted) {
          const curatedDeveloperProps = fallbackProperties
            .filter(p => {
              const isBuilder = p.role === 'builder' || p.postedByRole === 'Builder' || p.isDeveloper || [1, 6, 8].includes(p.id);
              const isNotRent = p.listingType !== 'rent' && p.listingFor !== 'Rent' && p.listingFor !== 'Lease' && p.listingFor !== 'PG';
              return isBuilder && isNotRent;
            })
            .map(p => ({
              ...p,
              postedByRole: 'Builder',
              role: 'builder',
              isDeveloper: true,
              badge: p.badge || 'Developer Direct'
            }));
          setDeveloperProperties(curatedDeveloperProps);
          setDeveloperProjects(fallbackDevelopers);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchDeveloperData();

    return () => { isMounted = false; };
  }, []);

  // Filter developer properties based on active tab, availability & search
  const filteredProperties = developerProperties.filter(property => {
    // 🛡️ NEW PROJECTS RULE: Exclude any rent, lease, or PG listing
    if (
      property.listingFor?.toLowerCase() === 'rent' ||
      property.listingFor?.toLowerCase() === 'lease' ||
      property.listingFor?.toLowerCase() === 'pg' ||
      property.listingType?.toLowerCase() === 'rent'
    ) {
      return false;
    }

    const isSoldProp = Boolean(property.isSold || property.saleStatus === 'sold' || property.status === 'sold');
    if (availabilityFilter === 'available' && isSoldProp) return false;
    if (availabilityFilter === 'sold' && !isSoldProp) return false;

    if (activeTab === 'residential' && property.type?.toLowerCase().includes('office') && property.type?.toLowerCase().includes('commercial')) {
      return false;
    }
    if (activeTab === 'commercial' && !property.type?.toLowerCase().includes('office') && !property.type?.toLowerCase().includes('commercial') && !property.type?.toLowerCase().includes('showroom')) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = property.title?.toLowerCase().includes(q);
      const matchLoc = property.location?.toLowerCase().includes(q);
      const matchDev = property.developerName?.toLowerCase().includes(q);
      return matchTitle || matchLoc || matchDev;
    }
    return true;
  });

  // Filter developer projects based on status, availability and search
  const filteredProjects = developerProjects.filter(project => {
    const isSoldPrj = Boolean(project.isSold || project.saleStatus === 'sold' || project.status === 'Sold' || project.status === 'sold');
    if (availabilityFilter === 'available' && isSoldPrj) return false;
    if (availabilityFilter === 'sold' && !isSoldPrj) return false;

    if (activeTab === 'residential' && project.projectType?.toLowerCase() !== 'residential') {
      return false;
    }
    if (activeTab === 'commercial' && project.projectType?.toLowerCase() !== 'commercial') {
      return false;
    }
    if (statusFilter !== 'all' && project.status?.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = project.projectName?.toLowerCase().includes(q);
      const matchName = project.name?.toLowerCase().includes(q);
      const matchLoc = project.location?.toLowerCase().includes(q);
      return matchTitle || matchName || matchLoc;
    }
    return true;
  });

  const totalListings = filteredProperties.length + filteredProjects.length;

  return (
    <>
      {/* Hero Banner Section */}
      <section className="bg-gradient-to-b from-[#FFF5F3] via-section-bg to-white pt-12 sm:pt-16 pb-12 border-b border-border/60">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-light text-brand text-xs font-bold uppercase tracking-wider mb-4 border border-brand/20">
                <Building2 size={13} className="text-brand" />
                <span>Developer & Builder Inventory</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-text-primary leading-[1.15] tracking-tight mb-4">
                New Projects & Developer Launches.
              </h1>
              <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
                Discover verified new launches, under-construction towers, and ready-to-move projects directly from certified Tier-1 builders. Enjoy <strong className="text-text-primary font-semibold">0% platform commission</strong>, transparent RERA clearances, and direct developer pricing.
              </p>

              {/* Value Badges */}
              <div className="flex flex-wrap items-center gap-3 mt-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-border text-xs font-semibold text-text-primary shadow-2xs">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  100% RERA Registered
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-border text-xs font-semibold text-text-primary shadow-2xs">
                  <CheckCircle2 size={14} className="text-brand" />
                  0% Brokerage & No Hidden Fees
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-border text-xs font-semibold text-text-primary shadow-2xs">
                  <Award size={14} className="text-amber-500" />
                  Direct Builder Inventory
                </span>
              </div>
            </div>

            {/* Quick Stat Pill */}
            <div className="shrink-0 p-5 rounded-2xl bg-white border border-border shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center text-brand font-black text-xl">
                <Flame size={22} />
              </div>
              <div>
                <span className="block text-2xl font-black text-text-primary tracking-tight">
                  {totalListings} Listings
                </span>
                <span className="text-xs text-text-muted font-medium">
                  Verified Builder Developments
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Tab Bar */}
      <section className="bg-white border-b border-border/60 sticky top-[68px] sm:top-[78px] z-20 backdrop-blur-md bg-white/95">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 py-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
              {[
                { id: 'all', label: 'All Projects' },
                { id: 'residential', label: 'Residential' },
                { id: 'commercial', label: 'Commercial Hubs' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-brand text-white shadow-xs'
                      : 'bg-gray-100/80 text-text-secondary hover:text-text-primary hover:bg-gray-200/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Stage / Status Filters & Search */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search project or builder..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-border bg-gray-50/50 focus:bg-white focus:outline-none focus:border-brand transition-colors"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs sm:text-sm rounded-xl border border-border bg-gray-50/50 text-text-primary font-medium focus:outline-none focus:border-brand cursor-pointer"
              >
                <option value="all">All Stages</option>
                <option value="Under Construction">Under Construction</option>
                <option value="Ready to Move">Ready to Move</option>
                <option value="New Launch">New Launch</option>
              </select>

              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="px-3 py-1.5 text-xs sm:text-sm rounded-xl border border-border bg-gray-50/50 text-text-primary font-medium focus:outline-none focus:border-brand cursor-pointer"
                title="Filter site availability"
              >
                <option value="available">🟢 Available Only</option>
                <option value="all">All Sites (Show Sold)</option>
                <option value="sold">🔴 Sold Out Sites</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Main Listings Display */}
      <section className="bg-white py-10 sm:py-14 lg:py-16">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          {/* Section 1: Developer Mega-Projects & Townships */}
          {filteredProjects.length > 0 && (
            <div className="mb-14">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                    Featured Developer Projects & Townships
                  </h2>
                  <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                    Flagship master-planned complexes with comprehensive amenities and direct site visits.
                  </p>
                </div>
                <span className="text-xs font-semibold text-text-muted bg-gray-100 px-2.5 py-1 rounded-lg">
                  {filteredProjects.length} Projects
                </span>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                {filteredProjects.map((dev) => (
                  <DeveloperCard key={dev.id} developer={dev} />
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Direct Builder Property Inventory */}
          {filteredProperties.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                    Direct Builder Units & Configurations
                  </h2>
                  <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                    Individual apartments, penthouses, and commercial units uploaded directly by verified developers.
                  </p>
                </div>
                <span className="text-xs font-semibold text-text-muted bg-gray-100 px-2.5 py-1 rounded-lg">
                  {filteredProperties.length} Units
                </span>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
                {filteredProperties.map((prop) => (
                  <PropertyCard key={prop.id} property={prop} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {totalListings === 0 && !isLoading && (
            <div className="text-center py-16 px-4 bg-gray-50/50 rounded-3xl border border-dashed border-border">
              <Building2 size={40} className="mx-auto text-text-muted mb-3" />
              <h3 className="text-lg font-bold text-text-primary mb-1">No developer properties found</h3>
              <p className="text-sm text-text-secondary max-w-md mx-auto mb-5">
                We couldn't find any developer or builder properties matching your current filters. Try resetting the filters to explore all projects.
              </p>
              <button
                onClick={() => { setActiveTab('all'); setStatusFilter('all'); setSearchQuery(''); }}
                className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-dark transition-all cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Bottom Trust Banner */}
          <div className="mt-16 p-6 sm:p-8 rounded-3xl bg-[#FAF9F7] border border-border flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-brand text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles size={14} />
                <span>GharMB Developer Guarantee</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight mb-2">
                Are you a licensed builder or developer?
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Showcase your residential and commercial developments on GharMB to 50,000+ verified home buyers. Direct escrow safety, zero brokerage fees, and qualified inquiry management.
              </p>
            </div>

            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/#contact';
              }}
              className="px-6 py-3 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand-dark transition-all shadow-sm shrink-0 cursor-pointer"
            >
              Partner as a Developer
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
