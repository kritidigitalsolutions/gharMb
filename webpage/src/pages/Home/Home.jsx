import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, BadgeCheck, Search, Building2, Users, Store,
  Shield, ShieldCheck, Ticket, Newspaper, Calculator, ArrowLeftRight,
  TrendingUp, LayoutDashboard, ChevronDown, MapPin, Eye,
  CheckCircle2, ChevronRight, ChevronLeft, ArrowUpRight,
  Briefcase, Home as HomeIcon, UserCheck, Presentation,
  Warehouse, Factory, Sparkles, Lock, Award, Check, Percent,
  SlidersHorizontal, Activity, FileText, Star, MessageSquare, Calendar,
  BookOpen, Clock, X, Info, Compass, ArrowDownRight, Layers,
  Plus, Minus, Quote, Mail, Phone
} from 'lucide-react';
import { fetchActiveCategories, fetchPublishedBlogs } from '../../api/blogApi';
import { API_BASE_URL } from '../../api/config';

/* ─────────── Animation Helpers ─────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] } }),
};
const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({ opacity: 1, transition: { duration: 0.5, delay: i * 0.12 } }),
};

function Section({ children, className = '', id, bg = 'bg-white' }) {
  return (
    <section id={id} className={`${bg} ${className}`}>
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
        {children}
      </div>
    </section>
  );
}

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={fadeUp}
      custom={delay}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   01 — PREMIUM REAL ESTATE IMAGE HERO BANNER
   ═══════════════════════════════════════════════════════════════ */
const heroSlides = [
  {
    id: '01',
    category: 'SMARTER REAL ESTATE',
    headline: 'One connected ecosystem for modern real estate.',
    description: 'GharMB brings properties, professionals, developers and intelligent tools together.',
    ctaText: 'Explore GharMB',
    ctaLink: '#platform',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&h=1000&fit=crop&q=85',
    microCard: {
      badge: 'Verified Property',
      title: 'Skyline Heights',
      location: 'Sector 62, Noida',
      details: '3 BHK · 1,480 sq ft · ₹1.2 Cr',
    },
  },
  {
    id: '02',
    category: 'VERIFIED ECOSYSTEM',
    headline: 'More clarity behind every property decision.',
    description: 'Structured property information, verification signals and trusted professionals.',
    ctaText: 'Discover GharMB',
    ctaLink: '#platform',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&h=1000&fit=crop&q=85',
    microCard: {
      badge: 'Verified Property',
      title: 'The Grand Reserve',
      location: 'Golf Course Road, Gurgaon',
      details: '4 BHK · 2,600 sq ft · ₹2.8 Cr',
    },
  },
  {
    id: '03',
    category: 'DEVELOPER NETWORK',
    headline: 'Discover projects with better context.',
    description: 'Explore developer projects, project details and real-estate information in one place.',
    ctaText: 'Explore Platform',
    ctaLink: '#platform',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&h=1000&fit=crop&q=85',
    microCard: {
      badge: 'Developer Project',
      title: 'Apex Horizon Tower',
      location: 'BKC Financial Center, Mumbai',
      details: 'Grade-A Commercial Suites',
    },
  },
  {
    id: '04',
    category: 'SMART PROPERTY TOOLS',
    headline: 'Better tools for better property decisions.',
    description: 'From property insights to useful calculators and intelligent tools.',
    ctaText: 'Explore Tools',
    ctaLink: '#tools',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&h=1000&fit=crop&q=85',
    microCard: {
      badge: 'Smart Valuation',
      title: 'Property Calculator',
      location: 'EMI & Area Intelligence',
      details: 'Instant Estimates & Reports',
    },
  },
  {
    id: '05',
    category: 'REAL ESTATE INSIGHTS',
    headline: 'Understand the market, not just the property.',
    description: 'News, trends, guides and useful real-estate information.',
    ctaText: 'Explore Insights',
    ctaLink: '/blog',
    isRoute: true,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&h=1000&fit=crop&q=85',
    microCard: {
      badge: 'Market Intelligence',
      title: 'Real Estate Outlook',
      location: 'Prime Urban Growth Zones',
      details: 'Quarterly Price Trends',
    },
  },
];

function Hero() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const duration = 5500; // 5.5s per slide
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    if (isPaused) return;
    const interval = 40;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrent((c) => (c + 1) % heroSlides.length);
          return 0;
        }
        return prev + (interval / duration) * 100;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, current]);

  const handleNext = () => {
    setCurrent((c) => (c + 1) % heroSlides.length);
    setProgress(0);
  };

  const handlePrev = () => {
    setCurrent((c) => (c - 1 + heroSlides.length) % heroSlides.length);
    setProgress(0);
  };

  const handleSelect = (idx) => {
    setCurrent(idx);
    setProgress(0);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
  };

  const slide = heroSlides[current];

  return (
    <section id="hero" className="relative w-full h-[640px] sm:h-[700px] lg:h-[calc(100vh-72px)] min-h-[620px] max-h-[880px] overflow-hidden group bg-[#080C12]">
      {/* Background Image Carousel with Scale/Fade Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.75, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0"
        >
          <img
            src={slide.image}
            alt={slide.headline}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </motion.div>
      </AnimatePresence>

      {/* Multi-stop Editorial Gradient Scrim for 100% Typography Readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(8,12,18,0.92) 0%, rgba(8,12,18,0.72) 38%, rgba(8,12,18,0.28) 72%, rgba(8,12,18,0.06) 100%), linear-gradient(to top, rgba(8,12,18,0.85) 0%, transparent 42%), linear-gradient(to bottom, rgba(8,12,18,0.45) 0%, transparent 22%)',
        }}
      />

      {/* Content Layout Inside Full-Width Banner */}
      <div
        className="relative max-w-[1440px] w-full h-full mx-auto px-6 sm:px-10 lg:px-16 py-8 sm:py-10 lg:py-12 flex flex-col justify-between z-10"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top Row: Category Tag + Micro Property Card */}
        <div className="flex items-start justify-between gap-4 pt-1 sm:pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white uppercase tracking-[0.16em] shadow-md">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            <span>{slide.category}</span>
          </div>

          {/* Glass Property Micro Card (Safely Positioned) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.45 }}
              className="hidden sm:block"
            >
              <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-[0_16px_40px_rgba(0,0,0,0.35)] min-w-[220px] max-w-[260px]">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-4 h-4 rounded-full bg-success flex items-center justify-center shrink-0">
                    <CheckCircle2 size={10} className="text-white" />
                  </div>
                  <span className="text-[11px] font-bold text-white tracking-wide uppercase">
                    {slide.microCard.badge}
                  </span>
                </div>
                <p className="text-[14px] font-bold text-white leading-tight">
                  {slide.microCard.title}
                </p>
                <p className="text-[11px] text-white/75 mt-0.5">
                  {slide.microCard.location}
                </p>
                <div className="mt-2 pt-2 border-t border-white/15 text-[11px] font-medium text-white/95">
                  {slide.microCard.details}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Row: Editorial Typography & Actions (Left) + Thumbnails & Controls (Right) */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-3 sm:pb-4">
          {/* Main Editorial Headline & CTAs (Clean, No heavy clunky box) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-full lg:max-w-[620px]"
            >
              <span className="inline-block text-[12px] font-bold uppercase tracking-[0.18em] text-[#FF8E75] mb-2.5">
                Real Estate, Reimagined
              </span>
              <h1 className="text-[32px] sm:text-[44px] lg:text-[50px] font-extrabold text-white leading-[1.08] tracking-[-0.03em] mb-4 drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
                {slide.headline}
              </h1>
              <p className="text-[15px] sm:text-[17px] text-white/85 leading-relaxed mb-7 max-w-xl font-normal drop-shadow">
                {slide.description}
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5">
                {slide.isRoute ? (
                  <Link
                    to={slide.ctaLink}
                    className="inline-flex items-center justify-center gap-2 h-[50px] px-7 text-[14px] font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-all duration-200 shadow-[0_8px_24px_rgba(255,90,60,0.38)] hover:shadow-[0_12px_28px_rgba(255,90,60,0.48)] active:scale-[0.98]"
                  >
                    {slide.ctaText}
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <a
                    href={slide.ctaLink}
                    className="inline-flex items-center justify-center gap-2 h-[50px] px-7 text-[14px] font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-all duration-200 shadow-[0_8px_24px_rgba(255,90,60,0.38)] hover:shadow-[0_12px_28px_rgba(255,90,60,0.48)] active:scale-[0.98]"
                  >
                    {slide.ctaText}
                    <ArrowRight size={16} />
                  </a>
                )}
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 h-[50px] px-6 text-[14px] font-medium text-white bg-white/12 hover:bg-white/20 border border-white/25 rounded-xl transition-all duration-200 backdrop-blur-md active:scale-[0.98]"
                >
                  How It Works
                </a>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation & Thumbnail Strip (Right) */}
          <div className="flex flex-col items-start lg:items-end gap-3.5 shrink-0">
            {/* Thumbnails (Desktop/Tablet) */}
            <div className="hidden sm:flex items-center gap-2.5">
              {heroSlides.map((s, idx) => {
                const isActive = idx === current;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelect(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`relative w-15 h-10 lg:w-16 lg:h-11 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                      isActive
                        ? 'ring-2 ring-brand ring-offset-2 ring-offset-black/60 scale-105 shadow-xl opacity-100'
                        : 'opacity-50 hover:opacity-85 ring-1 ring-white/30'
                    }`}
                  >
                    <img
                      src={s.image}
                      alt={s.category}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/25" />
                    <span className="absolute bottom-1 right-1.5 text-[9px] font-mono font-bold text-white drop-shadow">
                      {s.id}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Glass Control Capsule */}
            <div className="bg-black/45 backdrop-blur-xl border border-white/25 rounded-full px-4 py-2 flex items-center gap-3.5 shadow-xl">
              <span className="text-[12px] font-mono font-bold text-white tracking-wider">
                0{current + 1} <span className="text-white/40">/ 0{heroSlides.length}</span>
              </span>

              <div className="h-3.5 w-[1px] bg-white/25" />

              {/* Prev / Next Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous slide"
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-brand hover:text-white text-white flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next slide"
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-brand hover:text-white text-white flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thin Animated Progress Bar Along Bottom Edge of Full Width */}
      <div className="absolute bottom-0 inset-x-0 h-[3.5px] bg-white/20 z-20 overflow-hidden">
        <div
          className="h-full bg-brand transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   02 — BRAND MARQUEE (GHARMB CAPABILITY RAIL)
   ═══════════════════════════════════════════════════════════════ */
function BrandMarquee() {
  const capabilities = [
    { icon: Search, label: 'Property Discovery', badge: 'Verified Search' },
    { icon: ShieldCheck, label: 'Verified Listings', badge: 'Title & RERA Checked' },
    { icon: Building2, label: 'Developer Projects', badge: 'Direct Inventory' },
    { icon: Users, label: 'Agent & Broker Network', badge: 'Certified Partners' },
    { icon: Store, label: 'Commercial Real Estate', badge: 'Grade-A Spaces' },
    { icon: Calculator, label: 'Smart Valuation & EMI', badge: 'Instant Analytics' },
    { icon: TrendingUp, label: 'Market Intelligence', badge: 'Price Trends' },
    { icon: Ticket, label: 'Token Booking Platform', badge: 'Escrow Protected' },
    { icon: LayoutDashboard, label: 'Property Dashboard', badge: 'Real-Time Sync' },
  ];

  return (
    <section className="relative bg-[#F8F8F7] border-y border-[#ECECE9] py-3 sm:py-3.5 flex items-center overflow-hidden">
      {/* Left and Right Edge Fade Masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 sm:w-44 bg-gradient-to-r from-[#F8F8F7] via-[#F8F8F7]/80 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 sm:w-44 bg-gradient-to-l from-[#F8F8F7] via-[#F8F8F7]/80 to-transparent z-10" />

      {/* Infinite Scrolling Track */}
      <div className="marquee-track flex items-center gap-2">
        {[...capabilities, ...capabilities, ...capabilities].map((cap, i) => {
          const Icon = cap.icon;
          return (
            <div
              key={i}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#E7E7E5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-brand/40 hover:shadow-sm transition-all duration-200 shrink-0 mx-1.5"
            >
              <div className="w-6 h-6 rounded-lg bg-brand-light flex items-center justify-center text-brand shrink-0">
                <Icon size={13} />
              </div>
              <span className="text-[13px] font-semibold text-text-primary tracking-tight whitespace-nowrap">
                {cap.label}
              </span>
              <span className="text-[10px] font-medium text-text-secondary bg-[#F2F2F0] px-2 py-0.5 rounded-md whitespace-nowrap">
                {cap.badge}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TOP BUILDERS & DEVELOPERS (INFINITE SMOOTH SLIDER)
   ═══════════════════════════════════════════════════════════════ */
const builderLogos = [
  { id: 'jp-infra', name: 'JP Infra', logo: '/builder logo/JP infra.png' },
  { id: 'kalpataru', name: 'Kalpataru', logo: '/builder logo/Kalpa Taru.png' },
  { id: 'sunteck', name: 'Sunteck Realty', logo: '/builder logo/sunteck.png' },
  { id: 'micl', name: 'MICL Group', logo: '/builder logo/micl.png' },
  { id: 'sanghavi', name: 'Sanghavi Group', logo: '/builder logo/sanghavi.png' },
  { id: 'chheda-group', name: 'Chheda Group', logo: '/builder logo/chheda group.png' },
];

function TopBuildersSection() {
  return (
    <section id="developers" className="relative py-20 sm:py-28 bg-[#FAF9F7] border-y border-[#ECECE9] overflow-hidden">
      {/* Section Header */}
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 mb-12 sm:mb-14 text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0ED] border border-[#FF5A3C]/20 text-[11px] font-bold text-[#FF5A3C] uppercase tracking-[0.16em] mb-4">
            <Building2 size={13} />
            <span>Builder & Developer Network</span>
          </div>
        </Reveal>

        <Reveal delay={1}>
          <h2 className="text-[30px] sm:text-[38px] lg:text-[44px] font-bold text-[#17202A] leading-[1.1] tracking-[-0.03em] mb-3.5 max-w-3xl mx-auto">
            Trusted by Leading{' '}
            <span className="text-[#FF5A3C]">Builders & Developers</span>
          </h2>
        </Reveal>

        <Reveal delay={2}>
          <p className="text-[15px] sm:text-[16.5px] text-[#667085] leading-[1.65] font-normal max-w-[640px] mx-auto">
            Direct inventory and verified project collaborations with reputable real-estate developers across Mira-Bhayandar and Mumbai MMR.
          </p>
        </Reveal>
      </div>

      {/* Infinite Smooth Scrolling Slider Track */}
      <div className="relative w-full overflow-hidden py-3">
        {/* Left & Right Gradient Fade Masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 sm:w-48 bg-gradient-to-r from-[#FAF9F7] via-[#FAF9F7]/90 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 sm:w-48 bg-gradient-to-l from-[#FAF9F7] via-[#FAF9F7]/90 to-transparent z-10" />

        {/* Marquee Track with Smooth Continuous Looping */}
        <div className="marquee-track flex items-center">
          {[...builderLogos, ...builderLogos, ...builderLogos, ...builderLogos].map((builder, idx) => (
            <div
              key={`${builder.id}-${idx}`}
              className="w-[200px] sm:w-[230px] h-[96px] sm:h-[106px] bg-white rounded-2xl border border-[#E7E7E5] p-5 flex items-center justify-center shrink-0 mx-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-brand/40 transition-all duration-300 group cursor-pointer"
            >
              <img
                src={builder.logo}
                alt={builder.name}
                className="max-h-[52px] sm:max-h-[58px] max-w-[150px] sm:max-w-[170px] object-contain filter grayscale-[15%] opacity-90 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Trust Indicators */}
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 mt-12 pt-6 border-t border-[#ECECE9]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#667085]">
          <div className="flex items-center gap-2 font-semibold text-[#17202A]">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>100% RERA verified developer projects listed on GharMB</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-text-muted">
            <span>Direct Developer Pricing</span>
            <span>•</span>
            <span>Zero Brokerage on New Launches</span>
            <span>•</span>
            <span>Priority Site Visits</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   03 — ABOUT GHARMB (UNIFIED BRAND STORY & PHILOSOPHY)
   ═══════════════════════════════════════════════════════════════ */

const aboutPrinciples = [
  {
    num: '01',
    label: 'DISCOVER',
    title: 'Discover what matters.',
    description:
      'Find properties, projects, commercial spaces and relevant micro-market information in one connected experience.',
    icon: Search,
    tag: 'Precision Search',
  },
  {
    num: '02',
    label: 'UNDERSTAND',
    title: 'Understand the context.',
    description:
      'Use structured property specifications, multi-layer verification signals, insights and practical tools to understand the bigger picture.',
    icon: ShieldCheck,
    tag: 'Verified Intelligence',
  },
  {
    num: '03',
    label: 'CONNECT',
    title: 'Connect with clarity.',
    description:
      'Connect directly with developers, certified agents and audited professionals who are part of the real-estate ecosystem.',
    icon: Users,
    tag: 'Direct Network',
  },
];

const approachPillars = [
  {
    num: '01',
    title: 'Clear Information',
    description: 'Structured specs, carpet area efficiency, legal title and neighborhood context.',
    icon: Building2,
  },
  {
    num: '02',
    title: 'Visible Verification',
    description: 'RERA legal cross-check, geo-tagged site survey photos and direct owner validation.',
    icon: ShieldCheck,
  },
  {
    num: '03',
    title: 'Useful Tools',
    description: 'Practical loan EMI calculations, unit converters, yield estimates and affordability metrics.',
    icon: Calculator,
  },
  {
    num: '04',
    title: 'Meaningful Connections',
    description: 'Direct communication with verified developers, super agents and professionals with zero spam.',
    icon: Users,
  },
];

function AboutGharMB() {
  const [activePrinciple, setActivePrinciple] = useState(0);

  return (
    <section
      id="about"
      className="relative py-20 sm:py-28 lg:py-32 overflow-hidden select-auto"
      style={{
        background:
          'radial-gradient(circle at 65% 20%, rgba(255,90,60,0.035) 0%, transparent 45%), radial-gradient(circle at 25% 80%, rgba(22,163,106,0.025) 0%, transparent 45%), #FCFCFB',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 space-y-20 sm:space-y-28 lg:space-y-32">
        
        {/* ─────────────────────────────────────────────────────────────
           BLOCK 1: HERO OPENING WITH SOPHISTICATED REAL-ESTATE IMAGE
           ───────────────────────────────────────────────────────────── */}
        <div>
          <div className="max-w-3xl mb-10 sm:mb-14">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0ED] border border-[#FF5A3C]/20 text-[11px] font-bold text-[#FF5A3C] uppercase tracking-[0.16em] mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
                <span>About GharMB</span>
              </div>
            </Reveal>

            <Reveal delay={1}>
              <h2 className="text-[30px] sm:text-[38px] lg:text-[44px] font-bold text-[#17202A] leading-[1.1] tracking-[-0.03em] mb-3.5">
                Real estate should feel{' '}
                <span className="text-[#FF5A3C]">more connected.</span>
              </h2>
            </Reveal>

            <Reveal delay={2}>
              <p className="text-[15px] sm:text-[16.5px] text-[#667085] leading-[1.65] font-normal max-w-[680px]">
                GharMB brings property information, verified signals, professionals, developers and practical tools into one connected real-estate ecosystem.
              </p>
            </Reveal>
          </div>

          {/* Architectural Real-Estate Hero Image with 3 Floating UI Badges */}
          <Reveal delay={2}>
            <div className="relative">
              <div className="relative rounded-[24px] sm:rounded-[32px] overflow-hidden border border-[#E7E7E5] shadow-[0_24px_70px_rgba(20,30,40,0.08)] bg-[#F5F5F3] aspect-[16/10] sm:aspect-[21/10] lg:aspect-[2.35/1]">
                <img
                  src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&h=800&fit=crop&q=85"
                  alt="Modern architectural home representing connected real estate"
                  className="w-full h-full object-cover"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* 3 Floating Badges (Desktop) */}
              <div className="hidden sm:flex absolute -top-4 sm:-top-5 left-6 lg:left-12 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-[#E7E7E5] p-3.5 sm:p-4 shadow-[0_16px_40px_rgba(20,30,40,0.10)] items-center gap-3 max-w-[290px]">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Verified</span>
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-[#667085] font-mono">Title Audited</span>
                  </div>
                  <span className="text-[13px] font-bold text-[#17202A] block leading-tight mt-0.5">
                    Property info reviewed
                  </span>
                </div>
              </div>

              <div className="hidden sm:flex absolute -bottom-5 sm:-bottom-6 left-6 lg:left-10 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-[#E7E7E5] p-3.5 sm:p-4 shadow-[0_20px_50px_rgba(20,30,40,0.12)] items-center gap-3.5 max-w-[340px]">
                <div className="w-10 h-10 rounded-xl bg-[#FFF0ED] text-[#FF5A3C] flex items-center justify-center shrink-0">
                  <Building2 size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF5A3C] block">
                    Property Insights
                  </span>
                  <span className="text-[13.5px] font-bold text-[#17202A] block leading-tight">
                    Skyline Heights · 3 BHK
                  </span>
                  <span className="text-[11px] text-[#667085] mt-0.5 block">
                    1,480 sq ft · Sector 62, Noida · ₹1.45 Cr
                  </span>
                </div>
              </div>

              <div className="hidden sm:flex absolute -bottom-5 sm:-bottom-6 right-6 lg:right-10 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-[#E7E7E5] p-3.5 sm:p-4 shadow-[0_20px_50px_rgba(20,30,40,0.12)] items-center gap-3.5 max-w-[340px]">
                <div className="w-10 h-10 rounded-xl bg-[#F4F4F6] text-[#17202A] flex items-center justify-center shrink-0">
                  <Users size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Connected</span>
                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200">
                      Direct Network
                    </span>
                  </div>
                  <span className="text-[13px] font-bold text-[#17202A] block leading-tight">
                    Developers · Agents · Owners
                  </span>
                  <span className="text-[11px] text-[#667085] mt-0.5 block">
                    Zero brokerage & verified profiles
                  </span>
                </div>
              </div>

              {/* Mobile Fallback: 3 Clean Compact Pills (< sm) */}
              <div className="sm:hidden grid grid-cols-1 gap-2.5 mt-3.5">
                <div className="bg-white rounded-xl border border-[#E7E7E5] p-3 flex items-center gap-3 shadow-xs">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <ShieldCheck size={14} />
                  </div>
                  <div className="text-[12px]">
                    <span className="font-bold text-[#17202A] block">Verified Information</span>
                    <span className="text-[#667085] text-[11px]">Title & RERA checked</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-[#E7E7E5] p-3 flex items-center gap-3 shadow-xs">
                  <div className="w-7 h-7 rounded-lg bg-[#FFF0ED] text-[#FF5A3C] flex items-center justify-center shrink-0">
                    <Building2 size={14} />
                  </div>
                  <div className="text-[12px]">
                    <span className="font-bold text-[#17202A] block">Property Insights</span>
                    <span className="text-[#667085] text-[11px]">1,480 sq ft · 3 BHK · Sector 62</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-[#E7E7E5] p-3 flex items-center gap-3 shadow-xs">
                  <div className="w-7 h-7 rounded-lg bg-[#F4F4F6] text-[#17202A] flex items-center justify-center shrink-0">
                    <Users size={14} />
                  </div>
                  <div className="text-[12px]">
                    <span className="font-bold text-[#17202A] block">Connected Ecosystem</span>
                    <span className="text-[#667085] text-[11px]">Builders, Super Agents & Owners</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ─────────────────────────────────────────────────────────────
           BLOCK 2: BRAND PHILOSOPHY (WHY GHARMB — 3 CORE PRINCIPLES)
           ───────────────────────────────────────────────────────────── */}
        <div className="pt-4 sm:pt-8 border-t border-border-soft">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-20 items-start mb-10 sm:mb-12">
            
            {/* Left Narrative */}
            <div className="lg:col-span-5 space-y-4">
              <Reveal>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0ED] border border-[#FF5A3C]/20 text-[11px] font-bold text-[#FF5A3C] uppercase tracking-[0.16em] mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
                  <span>Why GharMB</span>
                </div>
              </Reveal>

              <Reveal delay={1}>
                <h3 className="text-[30px] sm:text-[38px] lg:text-[44px] font-bold text-[#17202A] leading-[1.1] tracking-[-0.03em] mb-3.5">
                  Real estate is{' '}
                  <span className="text-[#FF5A3C]">more than a listing.</span>
                </h3>
              </Reveal>

              <Reveal delay={2}>
                <p className="text-[15px] sm:text-[16.5px] text-[#667085] leading-[1.65] font-normal">
                  Finding a property is only one part of the journey. Understanding the information around it, connecting with the right people and making informed decisions are equally important.
                </p>
              </Reveal>

              <Reveal delay={3}>
                <div className="border-l-2 border-[#FF5A3C] pl-4 py-1 mt-2">
                  <p className="text-[15.5px] sm:text-[17px] font-bold text-[#17202A] leading-snug">
                    That&apos;s what GharMB is designed around.
                  </p>
                </div>
              </Reveal>
            </div>

            {/* Right: Journey Pipeline Banner */}
            <div className="lg:col-span-7">
              <Reveal delay={2}>
                <div className="bg-white rounded-2xl border border-[#E7E7E5] p-5 sm:p-6 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#F0F0EE]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF5A3C]">
                      From Listing to Decision
                    </span>
                    <span className="text-[11px] font-semibold text-[#667085]">
                      The Complete Journey
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11.5px] font-bold">
                    <span className="bg-[#FAFAF9] border border-[#E7E7E5] text-[#98A2B3] px-3 py-1.5 rounded-xl">
                      Listing
                    </span>
                    <span className="text-[#D0D0CE]">→</span>
                    <span className="bg-[#FFF0ED] border border-[#FF5A3C]/30 text-[#FF5A3C] px-3 py-1.5 rounded-xl">
                      01 Discover
                    </span>
                    <span className="text-[#D0D0CE]">→</span>
                    <span className="bg-[#FFF0ED] border border-[#FF5A3C]/30 text-[#FF5A3C] px-3 py-1.5 rounded-xl">
                      02 Understand
                    </span>
                    <span className="text-[#D0D0CE]">→</span>
                    <span className="bg-[#FFF0ED] border border-[#FF5A3C]/30 text-[#FF5A3C] px-3 py-1.5 rounded-xl">
                      03 Connect
                    </span>
                    <span className="text-[#D0D0CE]">→</span>
                    <span className="bg-[#17202A] text-white px-3 py-1.5 rounded-xl shadow-xs">
                      Decide
                    </span>
                  </div>

                  <p className="text-[13px] text-[#667085] leading-relaxed pt-1">
                    GharMB expands beyond static portals by offering structured property intelligence, transparent verification, and direct verified networks.
                  </p>
                </div>
              </Reveal>
            </div>

          </div>

          {/* 3 Core Interactive Principle Cards */}
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {aboutPrinciples.map((item, idx) => {
              const Icon = item.icon;
              const isActive = activePrinciple === idx;

              return (
                <motion.div
                  key={item.num}
                  onMouseEnter={() => setActivePrinciple(idx)}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className={`p-6 rounded-2xl border transition-all duration-200 cursor-pointer text-left relative overflow-hidden ${
                    isActive
                      ? 'bg-white border-[#FF5A3C]/40 shadow-[0_16px_40px_rgba(255,90,60,0.08)]'
                      : 'bg-white border-[#E7E7E5] hover:border-[#D8D8D5] shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-[#FF5A3C] text-white shadow-xs'
                          : 'bg-[#FAFAF9] text-[#667085] border border-[#E7E7E5]'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-[#98A2B3]">
                      {item.num}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF5A3C] block">
                      {item.tag}
                    </span>
                    <h4 className="text-[18px] font-bold text-[#17202A] tracking-tight leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-[13.5px] text-[#667085] leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {isActive && (
                    <motion.div
                      layoutId="unifiedPrincipleUnderline"
                      className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#FF5A3C]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
           BLOCK 3: OUR APPROACH (4 VALUE PILLARS + EDITORIAL SHOWCASE)
           ───────────────────────────────────────────────────────────── */}
        <div className="pt-4 sm:pt-8 border-t border-border-soft">
          <div className="text-left max-w-3xl mb-10 sm:mb-14">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0ED] border border-[#FF5A3C]/20 text-[11px] font-bold text-[#FF5A3C] uppercase tracking-[0.16em] mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
                <span>Our Approach</span>
              </div>
            </Reveal>

            <Reveal delay={1}>
              <h3 className="text-[30px] sm:text-[38px] lg:text-[44px] font-bold text-[#17202A] leading-[1.1] tracking-[-0.03em] mb-3.5">
                Better real-estate decisions start with{' '}
                <span className="text-[#FF5A3C]">better information.</span>
              </h3>
            </Reveal>

            <Reveal delay={2}>
              <div className="flex flex-wrap items-center justify-start gap-2 sm:gap-3 text-[12px] sm:text-[13px] font-semibold text-[#667085] mb-3">
                <span>Clear information</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
                <span>Visible verification</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
                <span>Useful tools</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
                <span>Meaningful connections</span>
              </div>
              <p className="text-[15px] sm:text-[16px] text-[#667085] leading-[1.65] font-normal max-w-[680px]">
                GharMB brings information, verification, tools and trusted connections together so every property decision starts with more clarity.
              </p>
            </Reveal>
          </div>

          {/* 2-Column Showcase: 4 Value Pillars (Left) + Human Architecture Photo (Right) */}
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left: 4 Structured Value Cards */}
            <div className="lg:col-span-6 grid sm:grid-cols-2 gap-3.5">
              {approachPillars.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <Reveal key={p.num} delay={idx * 0.1}>
                    <div className="bg-white rounded-2xl border border-[#E7E7E5] p-5 shadow-xs hover:border-[#FF5A3C]/30 hover:shadow-sm transition-all duration-200 h-full flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-9 h-9 rounded-xl bg-[#FFF0ED] text-[#FF5A3C] flex items-center justify-center">
                            <Icon size={16} />
                          </div>
                          <span className="text-[10.5px] font-mono font-bold text-[#98A2B3]">
                            {p.num}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-[15px] font-bold text-[#17202A] leading-snug">
                            {p.title}
                          </h4>
                          <p className="text-[12.5px] text-[#667085] leading-relaxed mt-1">
                            {p.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            {/* Right: Human / Architectural Consultation Photo Showcase */}
            <div className="lg:col-span-6 relative">
              <Reveal delay={2}>
                <div className="relative rounded-[24px] sm:rounded-[28px] overflow-hidden border border-[#E7E7E5] shadow-[0_20px_50px_rgba(20,30,40,0.08)] aspect-[4/3] sm:aspect-[16/11]">
                  <img
                    src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1000&h=750&fit=crop&q=85"
                    alt="Professional reviewing architectural property plans"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Floating Minimal Status Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-auto z-10">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/90 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.18)] sm:min-w-[280px]">
                      <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-[#F0F0EE]">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF5A3C]">
                          GharMB Framework
                        </span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <div className="space-y-1 text-[12px] font-semibold text-[#17202A]">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
                          <span>Information + Verification</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Tools + Direct Connections</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   04 — ECOSYSTEM (INTERACTIVE RADIAL OPERATING MAP)
   ═══════════════════════════════════════════════════════════════ */
const ecosystemNodes = [
  {
    id: 'discovery',
    icon: Search,
    label: 'Property Discovery',
    shortLabel: 'Discovery',
    category: 'DISCOVERY ENGINE',
    title: 'Find more context around every property.',
    description:
      'GharMB brings structured property information, locations and discovery tools together into one connected experience.',
    capabilities: [
      'Structured property specifications & verified metadata',
      'Micro-market locality score & neighborhood insights',
      'Residential, luxury, commercial & plotted land discovery',
    ],
    previewType: 'discovery',
    angle: -90, // Top
  },
  {
    id: 'developers',
    icon: Building2,
    label: 'Developer Projects',
    shortLabel: 'Developers',
    category: 'DEVELOPER NETWORK',
    title: 'Direct builder projects & inventory.',
    description:
      'Connect directly with verified builders, new launch developments, and under-construction inventory without intermediaries.',
    capabilities: [
      'RERA-registered developer project showcases',
      'Direct-from-builder inventory & architectural floor plans',
      'Milestone construction updates & phased delivery tracking',
    ],
    previewType: 'developers',
    angle: -45, // Top-Right
  },
  {
    id: 'professionals',
    icon: Users,
    label: 'Agents & Professionals',
    shortLabel: 'Professionals',
    category: 'VERIFIED PROFESSIONALS',
    title: 'Certified agents you can actually trust.',
    description:
      'Connect with high-reputation brokers, legal counsels, and property advisors with audited track records.',
    capabilities: [
      'RERA certified Super Agents with 98%+ satisfaction score',
      'Assisted on-site property inspection & documentation visits',
      'Transparent advisory without cold calls or spam',
    ],
    previewType: 'professionals',
    angle: 0, // Right
  },
  {
    id: 'owners',
    icon: UserCheck,
    label: 'Property Owners',
    shortLabel: 'Property Owners',
    category: 'OWNER PLATFORM',
    title: 'Simplified owner listing & management.',
    description:
      'Direct property listing, digital title verification, and guided lead management for individual property owners.',
    capabilities: [
      'Zero brokerage direct owner listings',
      'Instant title deed verification & trusted seller badge',
      'Direct visit scheduling & digital inquiry dashboard',
    ],
    previewType: 'owners',
    angle: 45, // Bottom-Right
  },
  {
    id: 'commercial',
    icon: Store,
    label: 'Commercial Spaces',
    shortLabel: 'Commercial',
    category: 'COMMERCIAL REAL ESTATE',
    title: 'Grade-A offices, retail & warehouses.',
    description:
      'Specialized commercial search with lease yield analysis, floor plate specs, and industrial logistics zones.',
    capabilities: [
      'Grade-A corporate office suites & managed workspaces',
      'High-street retail storefronts & prime commercial showrooms',
      'Logistics hubs, industrial parks & warehousing specs',
    ],
    previewType: 'commercial',
    angle: 90, // Bottom
  },
  {
    id: 'verification',
    icon: ShieldCheck,
    label: 'Verification System',
    shortLabel: 'Verification',
    category: 'TRUST & INTEGRITY',
    title: 'Multi-stage property & title verification.',
    description:
      'Document authentication, legal encumbrance checks, and RERA compliance before any listing goes live.',
    capabilities: [
      'RERA compliance & government approvals audit',
      'Digital encumbrance certificate & ownership title search',
      'Physical on-site inspection & geocoded photo validation',
    ],
    previewType: 'verification',
    angle: 135, // Bottom-Left
  },
  {
    id: 'insights',
    icon: TrendingUp,
    label: 'Market Insights',
    shortLabel: 'Market Insights',
    category: 'MARKET INTELLIGENCE',
    title: 'Real estate data, trends & analytics.',
    description:
      'Quarterly price indexes, locality appreciation rates, and investment forecasting powered by verified market data.',
    capabilities: [
      'Locality price trends & 5-year CAGR capital growth',
      'Rental yield benchmarks & appreciation forecast models',
      'Micro-market inventory absorption & buyer demand index',
    ],
    previewType: 'insights',
    angle: 180, // Left
  },
  {
    id: 'tools',
    icon: Calculator,
    label: 'Smart Tools',
    shortLabel: 'Smart Tools',
    category: 'INTELLIGENT TOOLS',
    title: 'Calculators, valuations & estimators.',
    description:
      'Smart EMI calculators, stamp duty estimators, unit converters, and decision tools for property transactions.',
    capabilities: [
      'Smart EMI & loan amortization schedule model',
      'Instant algorithmic property valuation estimator',
      'Stamp duty, registration charges & area unit converters',
    ],
    previewType: 'tools',
    angle: 225, // Top-Left
  },
];

function Ecosystem() {
  const [activeNode, setActiveNode] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-Story mode: cycle through nodes every 2.5s when idle
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveNode((prev) => (prev + 1) % ecosystemNodes.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const active = ecosystemNodes[activeNode];
  const ActiveIcon = active.icon;

  // Center coordinate is (270, 270) in 540x540 canvas, radius = 195
  const cx = 270;
  const cy = 270;
  const radius = 195;

  return (
    <section
      id="ecosystem"
      className="relative py-24 sm:py-28 lg:py-36 overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 50% 45%, rgba(255,90,60,0.045) 0%, transparent 46%), #FCFCFB',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="max-w-2xl mb-12 sm:mb-16">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0ED] border border-[#FF5A3C]/20 text-[11px] font-bold text-[#FF5A3C] uppercase tracking-[0.16em] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
              <span>The GharMB Ecosystem</span>
            </div>
          </Reveal>

          <Reveal delay={1}>
            <h2 className="text-[30px] sm:text-[38px] lg:text-[44px] font-bold text-[#17202A] leading-[1.1] tracking-[-0.03em] mb-3.5">
              One platform,{' '}
              <span className="text-[#FF5A3C]">every connection.</span>
            </h2>
          </Reveal>

          <Reveal delay={2}>
            <p className="text-[15px] sm:text-[16.5px] text-[#667085] leading-[1.65] max-w-[620px] font-normal">
              GharMB brings property seekers, owners, developers, professionals, insights and intelligent tools into one connected real-estate ecosystem.
            </p>
          </Reveal>
        </div>

        {/* ───────── MOBILE / TABLET VIEW (< lg) ───────── */}
        <div className="lg:hidden">
          {/* Horizontal Scrolling Pill Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6">
            {ecosystemNodes.map((node, i) => {
              const Icon = node.icon;
              const isActive = activeNode === i;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setActiveNode(i)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-brand text-white shadow-sm shadow-brand/30'
                      : 'bg-white text-text-secondary border border-[#E7E7E5] hover:border-brand/40'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-white' : 'text-brand'} />
                  <span>{node.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Information Card */}
          <div className="bg-white rounded-[24px] border border-[#E7E7E5] shadow-[0_16px_40px_rgba(23,32,42,0.06)] p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
                {active.category}
              </span>
              <span className="text-[11px] font-mono text-text-muted">0{activeNode + 1} / 08</span>
            </div>
            <h3 className="text-[20px] font-bold text-text-primary leading-tight mb-2">
              {active.title}
            </h3>
            <p className="text-[14px] text-text-secondary leading-relaxed mb-5">
              {active.description}
            </p>

            {/* Capabilities List */}
            <div className="space-y-2.5 pt-4 border-t border-border-soft">
              {active.capabilities.map((cap, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[13px] text-text-primary">
                  <CheckCircle2 size={16} className="text-brand shrink-0 mt-0.5" />
                  <span>{cap}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ───────── DESKTOP RADIAL ECOSYSTEM VIEW (>= lg) ───────── */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-10 xl:gap-14 items-center">
          
          {/* LEFT: 540x540 Radial Ecosystem Map */}
          <div className="lg:col-span-6 xl:col-span-7 flex justify-center">
            <div className="relative w-[540px] h-[540px]">
              
              {/* Radial Orbit Guide Rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[390px] h-[390px] rounded-full border border-dashed border-[#E7E7E5]/90" />
                <div className="absolute w-[240px] h-[240px] rounded-full border border-[#ECECE9]/60" />
              </div>

              {/* SVG Connecting Lines to 8 Radial Nodes */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 540 540">
                {ecosystemNodes.map((node, i) => {
                  const rad = (node.angle * Math.PI) / 180;
                  const nx = cx + radius * Math.cos(rad);
                  const ny = cy + radius * Math.sin(rad);
                  const isActive = activeNode === i;

                  return (
                    <g key={node.id}>
                      <line
                        x1={cx}
                        y1={cy}
                        x2={nx}
                        y2={ny}
                        stroke={isActive ? '#FF5A3C' : '#E7E7E5'}
                        strokeWidth={isActive ? 2 : 1.2}
                        strokeDasharray={isActive ? 'none' : '4 4'}
                        className="transition-all duration-300"
                        opacity={isActive ? 1 : 0.65}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Central GharMB Core Hub */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="w-28 h-28 rounded-[28px] bg-white border border-[#E7E7E5] shadow-[0_20px_50px_rgba(23,32,42,0.09)] flex flex-col items-center justify-center p-3 text-center transition-all duration-300">
                  <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white font-bold text-base shadow-sm mb-1.5">
                    G
                  </div>
                  <span className="text-[12px] font-bold text-text-primary tracking-tight">GharMB</span>
                  <span className="text-[9px] font-bold text-brand uppercase tracking-wider">Core Hub</span>
                </div>
              </div>

              {/* 8 Satellite Nodes Positioned Along Radius */}
              {ecosystemNodes.map((node, i) => {
                const Icon = node.icon;
                const isActive = activeNode === i;
                const rad = (node.angle * Math.PI) / 180;
                const nx = cx + radius * Math.cos(rad);
                const ny = cy + radius * Math.sin(rad);

                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setActiveNode(i)}
                    aria-label={`Select ${node.label}`}
                    style={{
                      position: 'absolute',
                      left: `${nx}px`,
                      top: `${ny}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`group z-20 flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                      isActive ? 'scale-105' : 'hover:scale-102'
                    }`}
                  >
                    {/* Node Circular Capsule */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? 'bg-brand text-white shadow-[0_10px_25px_rgba(255,90,60,0.38)] border-2 border-brand'
                          : 'bg-white text-text-secondary border border-[#E7E7E5] group-hover:border-brand/40 group-hover:text-text-primary shadow-sm'
                      }`}
                    >
                      <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />
                    </div>

                    {/* Node Compact Text Pill */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight whitespace-nowrap transition-all duration-200 ${
                        isActive
                          ? 'bg-brand-light text-brand border border-brand/20 shadow-xs'
                          : 'bg-white/90 text-text-secondary border border-border-soft group-hover:text-text-primary group-hover:border-border'
                      }`}
                    >
                      {node.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Dynamic High-Fidelity Information & Preview Panel */}
          <div className="lg:col-span-6 xl:col-span-5">
            <div className="bg-white rounded-[28px] border border-[#E7E7E5] shadow-[0_20px_55px_rgba(23,32,42,0.07)] p-7 sm:p-9 min-h-[530px] flex flex-col justify-between relative overflow-hidden">
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeNode}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                  className="flex-1 flex flex-col justify-between"
                >
                  {/* Top Category & Counter Row */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-brand-light flex items-center justify-center text-brand">
                          <ActiveIcon size={14} />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
                          {active.category}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-medium text-text-muted">
                        0{activeNode + 1} / 08
                      </span>
                    </div>

                    <h3 className="text-[24px] sm:text-[26px] font-bold text-text-primary leading-tight mb-2.5">
                      {active.title}
                    </h3>
                    <p className="text-[14px] sm:text-[15px] text-text-secondary leading-relaxed mb-5">
                      {active.description}
                    </p>

                    {/* 3 Structured Capability Points */}
                    <div className="space-y-2 mb-6">
                      {active.capabilities.map((point, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-[13px] text-text-primary font-medium">
                          <CheckCircle2 size={16} className="text-brand shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Product UI Miniature Preview Component */}
                  <div className="my-2 p-3.5 bg-[#FAF9F8] border border-[#EAEAE8] rounded-2xl">
                    {/* Discovery Mini Preview */}
                    {active.previewType === 'discovery' && (
                      <div className="flex items-center justify-between gap-3 text-[12px]">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-border">
                            <img
                              src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=160&h=160&fit=crop&q=80"
                              alt="Property"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-text-primary block leading-tight">The Grand Reserve</span>
                            <span className="text-[11px] text-text-secondary">4 BHK · Golf Course Road</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[13px] font-bold text-brand block">₹2.80 Cr</span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">Verified ✓</span>
                        </div>
                      </div>
                    )}

                    {/* Developers Mini Preview */}
                    {active.previewType === 'developers' && (
                      <div className="flex items-center justify-between gap-3 text-[12px]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-brand font-bold">
                            <Building2 size={18} />
                          </div>
                          <div>
                            <span className="font-bold text-text-primary block">Godrej & Prestige Projects</span>
                            <span className="text-[11px] text-text-secondary">RERA Direct · 18 Active Sites</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-text-primary bg-white border border-border px-2.5 py-1 rounded-lg">
                          Direct Inventory
                        </span>
                      </div>
                    )}

                    {/* Professionals Mini Preview */}
                    {active.previewType === 'professionals' && (
                      <div className="flex items-center justify-between gap-3 text-[12px]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                            <Award size={18} />
                          </div>
                          <div>
                            <span className="font-bold text-text-primary block">Aarav Sharma · Super Agent</span>
                            <span className="text-[11px] text-text-secondary">RERA #8912 · 99% Satisfaction</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                          ★ 4.9 Super Agent
                        </span>
                      </div>
                    )}

                    {/* Owners Mini Preview */}
                    {active.previewType === 'owners' && (
                      <div className="flex items-center justify-between gap-3 text-[12px]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
                            <UserCheck size={18} />
                          </div>
                          <div>
                            <span className="font-bold text-text-primary block">Owner Listing Console</span>
                            <span className="text-[11px] text-text-secondary">Title Deed Verified · Direct Leads</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                          0% Brokerage
                        </span>
                      </div>
                    )}

                    {/* Commercial Mini Preview */}
                    {active.previewType === 'commercial' && (
                      <div className="flex items-center justify-between gap-3 text-[12px]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 font-bold">
                            <Store size={18} />
                          </div>
                          <div>
                            <span className="font-bold text-text-primary block">Apex Horizon Tower</span>
                            <span className="text-[11px] text-text-secondary">BKC Mumbai · 4,200 sq ft Office</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg">
                          Lease Yield 7.8%
                        </span>
                      </div>
                    )}

                    {/* Verification Mini Preview */}
                    {active.previewType === 'verification' && (
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                          <CheckCircle2 size={15} className="text-emerald-600" />
                          <span>RERA Verified</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                          <CheckCircle2 size={15} className="text-emerald-600" />
                          <span>Title Search OK</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                          <CheckCircle2 size={15} className="text-emerald-600" />
                          <span>Site Audited</span>
                        </div>
                      </div>
                    )}

                    {/* Insights Mini Preview */}
                    {active.previewType === 'insights' && (
                      <div className="flex items-center justify-between gap-3 text-[12px]">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={16} className="text-emerald-600" />
                          <span className="font-bold text-text-primary">Gurgaon Locality Index</span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                          +14.8% Capital Growth YoY
                        </span>
                      </div>
                    )}

                    {/* Tools Mini Preview */}
                    {active.previewType === 'tools' && (
                      <div className="flex items-center justify-between gap-3 text-[12px]">
                        <div className="flex items-center gap-2">
                          <Calculator size={16} className="text-brand" />
                          <span className="font-bold text-text-primary">Instant EMI: ₹1,72,270 / mo</span>
                        </div>
                        <span className="text-[11px] font-bold text-text-secondary bg-white border border-border px-2 py-0.5 rounded">
                          @ 8.4% · 20 Yrs
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Status & Indicators */}
                  <div className="pt-4 border-t border-border-soft flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-text-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                      GharMB Connected Ecosystem
                    </span>

                    {/* Segment Indicator Dots */}
                    <div className="flex items-center gap-1.5">
                      {ecosystemNodes.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveNode(idx)}
                          aria-label={`Switch to node ${idx + 1}`}
                          className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                            idx === activeNode ? 'w-5 bg-brand' : 'w-1.5 bg-[#E7E7E5] hover:bg-brand/40'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   05 — THE PLATFORM (INTERACTIVE PROPERTY JOURNEY)
   ═══════════════════════════════════════════════════════════════ */
const platformJourneyStages = [
  {
    id: '01',
    label: 'Discover',
    icon: Search,
    shortDesc: 'Explore properties and projects',
    eyebrow: 'PROPERTY DISCOVERY',
    title: 'Find the right property with context.',
    description:
      'Explore residential, commercial and developer projects with structured information, high-resolution imagery, location context and verification signals.',
    capabilities: [
      'Structured property information & verified metadata',
      'Residential, commercial & plotted land discovery',
      'Locality score & micro-market infrastructure context',
    ],
    ctaText: 'Explore discovery',
    ctaLink: '#hero',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&h=650&fit=crop&q=85',
    overlay: {
      badge: 'Verified Property · Title Audited',
      title: 'Skyline Heights Residences',
      location: 'Sector 62, Noida',
      specs: '3 BHK · 1,480 sq ft · ₹1.25 Cr',
      tag: 'RERA Direct Builder Inventory',
    },
  },
  {
    id: '02',
    label: 'Verify',
    icon: ShieldCheck,
    shortDesc: 'Understand property information',
    eyebrow: 'PROPERTY VERIFICATION',
    title: "Know what you're looking at.",
    description:
      'Bring verification signals, title documentation and government approvals together into one clear view before moving forward.',
    capabilities: [
      '100% RERA compliance & title audit',
      'Encumbrance-free verification report',
      'Physical on-site inspection & photo audit',
    ],
    ctaText: 'Understand verification',
    ctaLink: '#verification',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=900&h=650&fit=crop&q=85',
    overlay: {
      badge: '4-Stage Legal Verification Passed',
      title: 'The Grand Reserve Luxury Suites',
      location: 'Golf Course Road, Gurgaon',
      specs: '4 BHK · 2,600 sq ft · Encumbrance Free',
      tag: 'Document & Physical Audit Approved',
    },
  },
  {
    id: '03',
    label: 'Connect',
    icon: Users,
    shortDesc: 'Connect with relevant professionals',
    eyebrow: 'PROFESSIONAL NETWORK',
    title: 'Connect with the right people.',
    description:
      'Find developers, agents, direct owners and legal professionals relevant to your property journey without unsolicited calls or spam.',
    capabilities: [
      'Direct connection with verified builders',
      'RERA Super Agents with 98%+ trust rating',
      'Direct property owners with zero brokerage',
    ],
    ctaText: 'Explore ecosystem',
    ctaLink: '#ecosystem',
    image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=900&h=650&fit=crop&q=85',
    overlay: {
      badge: 'Verified Professional Network',
      title: 'Aarav Sharma & Prestige Partners',
      location: 'BKC & Gurgaon Hub Coordinators',
      specs: 'Super Agent #8912 · 4.9 ★ Rating',
      tag: 'Direct Escorted Site Visits',
    },
  },
  {
    id: '04',
    label: 'Manage',
    icon: LayoutDashboard,
    shortDesc: 'Keep property activity organized',
    eyebrow: 'PROPERTY MANAGEMENT',
    title: 'Keep your property journey organized.',
    description:
      'Track listings, shortlists, scheduled visits, token requests and legal paperwork from one synchronized workspace.',
    capabilities: [
      'Centralized saved properties & visit schedule',
      'Token payment status & escrow protection',
      'Real-time property activity & inquiry manager',
    ],
    ctaText: 'Explore management',
    ctaLink: '/contact',
    isRoute: true,
    image: 'https://images.unsplash.com/photo-1502005229762-ee152da915ba?w=900&h=650&fit=crop&q=85',
    overlay: {
      badge: 'Unified Property Console',
      title: 'My GharMB Portfolio Console',
      location: 'Active Transactions & Shortlists',
      specs: '3 Active Listings · 1 Escrow In Progress',
      tag: 'Real-Time Status & Document Vault',
    },
  },
];

function ProductShowcase() {
  const [activeTab, setActiveTab] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const duration = 6000; // 6s per slide

  useEffect(() => {
    if (isPaused) return;
    const interval = 50;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveTab((c) => (c + 1) % platformJourneyStages.length);
          return 0;
        }
        return prev + (interval / duration) * 100;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, activeTab]);

  const handleSelectTab = (idx) => {
    setActiveTab(idx);
    setProgress(0);
  };

  const active = platformJourneyStages[activeTab];

  return (
    <section
      id="platform-journey"
      className="relative py-24 sm:py-28 lg:py-36 overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 70% 50%, rgba(255,90,60,0.045) 0%, transparent 45%), #FCFCFB',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0ED] border border-[#FF5A3C]/20 text-[11px] font-bold text-[#FF5A3C] uppercase tracking-[0.16em] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
              <span>The Platform</span>
            </div>
          </Reveal>

          <Reveal delay={1}>
            <h2 className="text-[30px] sm:text-[38px] lg:text-[44px] font-bold text-[#17202A] leading-[1.1] tracking-[-0.03em] mb-3.5">
              Everything around a property,{' '}
              <span className="text-[#FF5A3C]">connected in one place.</span>
            </h2>
          </Reveal>

          <Reveal delay={2}>
            <p className="text-[15px] sm:text-[16.5px] text-[#667085] leading-[1.65] max-w-[680px] font-normal">
              From discovering properties to understanding details, connecting with professionals and managing property activity, GharMB brings the experience together in one platform.
            </p>
          </Reveal>
        </div>

        {/* ───────── MOBILE VIEW (< lg) ───────── */}
        <div className="lg:hidden">
          {/* Horizontal Scrolling Journey Selector */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6">
            {platformJourneyStages.map((stage, idx) => {
              const Icon = stage.icon;
              const isActive = idx === activeTab;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => handleSelectTab(idx)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-brand text-white shadow-sm shadow-brand/30'
                      : 'bg-white text-text-secondary border border-[#E7E7E5] hover:border-brand/40'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-white' : 'text-brand'} />
                  <span>{stage.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Product Visual Frame */}
          <div className="relative rounded-[22px] overflow-hidden border border-[#E7E7E5] bg-white shadow-md mb-6">
            <div className="relative h-[340px] overflow-hidden">
              <img
                src={active.image}
                alt={active.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30" />

              {/* Top Glass Badge */}
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md border border-white/80 rounded-lg px-2.5 py-1 text-[11px] font-bold text-text-primary shadow-sm flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span>{active.overlay.badge}</span>
              </div>

              {/* Bottom Metadata */}
              <div className="absolute bottom-3 inset-x-3 text-white">
                <h4 className="text-[17px] font-bold leading-tight drop-shadow">{active.overlay.title}</h4>
                <p className="text-[12px] text-white/85 mt-0.5">{active.overlay.location}</p>
                <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between text-[11px] font-medium text-white/90">
                  <span>{active.overlay.specs}</span>
                  <span className="text-[#FF9E8C] font-semibold">{active.overlay.tag}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Details */}
          <div className="bg-white rounded-2xl border border-[#E7E7E5] p-6 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand block mb-2">
              {active.eyebrow}
            </span>
            <h3 className="text-[20px] font-bold text-text-primary leading-tight mb-2">
              {active.title}
            </h3>
            <p className="text-[14px] text-text-secondary leading-relaxed mb-5">
              {active.description}
            </p>
            <div className="space-y-2 mb-6 pt-4 border-t border-border-soft">
              {active.capabilities.map((cap, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[13px] text-text-primary">
                  <CheckCircle2 size={15} className="text-brand shrink-0 mt-0.5" />
                  <span>{cap}</span>
                </div>
              ))}
            </div>

            {active.isRoute ? (
              <Link
                to={active.ctaLink}
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-brand text-white text-[13px] font-bold hover:bg-brand-dark transition-colors shadow-sm"
              >
                <span>{active.ctaText}</span>
                <ArrowRight size={15} />
              </Link>
            ) : (
              <a
                href={active.ctaLink}
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-brand text-white text-[13px] font-bold hover:bg-brand-dark transition-colors shadow-sm"
              >
                <span>{active.ctaText}</span>
                <ArrowRight size={15} />
              </a>
            )}
          </div>
        </div>

        {/* ───────── DESKTOP 3-COLUMN COMPOSITION (>= lg) ───────── */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8 xl:gap-10 items-center">
          
          {/* 1. LEFT: Journey Navigation (22% / col-span-3) */}
          <div className="lg:col-span-3 flex flex-col gap-3 relative">
            {platformJourneyStages.map((stage, idx) => {
              const Icon = stage.icon;
              const isActive = idx === activeTab;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => handleSelectTab(idx)}
                  className={`group relative text-left p-4 rounded-2xl transition-all duration-200 cursor-pointer border ${
                    isActive
                      ? 'bg-brand-light/90 border-brand/25 shadow-sm'
                      : 'bg-transparent border-transparent hover:bg-[#F6F6F4] hover:border-[#ECECE9]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200 ${
                        isActive
                          ? 'bg-brand text-white shadow-xs'
                          : 'bg-white border border-[#E7E7E5] text-text-secondary group-hover:border-brand/30 group-hover:text-text-primary'
                      }`}
                    >
                      <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[15px] font-bold tracking-tight transition-colors ${
                            isActive ? 'text-brand' : 'text-text-primary'
                          }`}
                        >
                          {stage.label}
                        </span>
                        <span className="text-[11px] font-mono font-medium text-text-muted">
                          {stage.id}
                        </span>
                      </div>
                      <p className="text-[12px] text-text-secondary mt-0.5 leading-snug truncate">
                        {stage.shortDesc}
                      </p>
                    </div>
                  </div>

                  {/* Active Indicator Left Accent */}
                  {isActive && (
                    <motion.div
                      layoutId="activeJourneyIndicator"
                      className="absolute left-0 top-3 bottom-3 w-1 bg-brand rounded-r-full"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* 2. CENTER: Large Product Visual Application Frame (48% / col-span-5 xl:col-span-6) */}
          <div className="lg:col-span-5 xl:col-span-6">
            <div className="bg-white rounded-[26px] border border-[#E7E7E5] shadow-[0_24px_65px_rgba(20,30,40,0.09)] overflow-hidden relative group">
              
              {/* Top Application Frame Chrome */}
              <div className="bg-[#FAF9F8] border-b border-[#ECECE9] px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] shadow-2xs" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] shadow-2xs" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] shadow-2xs" />
                </div>
                <span className="text-[11px] font-semibold text-text-secondary tracking-tight">
                  GharMB Platform · {active.label} Experience
                </span>
                <span className="text-[11px] font-mono font-bold text-text-muted">
                  0{activeTab + 1} / 04
                </span>
              </div>

              {/* Product Visual Container with Image & Overlays */}
              <div className="relative h-[380px] sm:h-[420px] xl:h-[440px] overflow-hidden bg-dark">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                    className="absolute inset-0"
                  >
                    <img
                      src={active.image}
                      alt={active.title}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Subtle Multi-Stop Gradient Protection */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(12,18,25,0.85) 0%, rgba(12,18,25,0.40) 38%, transparent 70%), linear-gradient(to bottom, rgba(12,18,25,0.50) 0%, transparent 30%)',
                  }}
                />

                {/* Top-Left Floating Glass Badge */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                    className="absolute top-4 left-4 z-10"
                  >
                    <div className="bg-white/85 backdrop-blur-md border border-white/80 rounded-xl px-3 py-1.5 shadow-md flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 text-white">
                        <Check size={10} strokeWidth={3} />
                      </div>
                      <span className="text-[12px] font-bold text-text-primary tracking-tight">
                        {active.overlay.badge}
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Bottom-Left Glass Property Info Card */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 14 }}
                    transition={{ duration: 0.4 }}
                    className="absolute bottom-4 inset-x-4 z-10"
                  >
                    <div className="bg-white/88 backdrop-blur-xl border border-white/90 rounded-2xl p-4 sm:p-4.5 shadow-[0_12px_36px_rgba(0,0,0,0.18)]">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-[16px] sm:text-[17px] font-bold text-text-primary leading-tight">
                          {active.overlay.title}
                        </h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand bg-brand-light px-2 py-0.5 rounded-md shrink-0">
                          Verified
                        </span>
                      </div>
                      <p className="text-[12px] text-text-secondary">
                        {active.overlay.location}
                      </p>
                      <div className="mt-2.5 pt-2.5 border-t border-border-soft flex items-center justify-between text-[11px] font-semibold text-text-primary">
                        <span>{active.overlay.specs}</span>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {active.overlay.tag}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Bottom Edge Animated Time Progress Line */}
                <div className="absolute bottom-0 inset-x-0 h-[3px] bg-white/25 z-20 overflow-hidden">
                  <div
                    className="h-full bg-brand transition-all duration-75 ease-linear"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. RIGHT: Editorial Information Panel (30% / col-span-4 xl:col-span-3) */}
          <div className="lg:col-span-4 xl:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex flex-col justify-between"
              >
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand block mb-2.5">
                    {active.eyebrow}
                  </span>
                  <h3 className="text-[22px] sm:text-[24px] font-bold text-text-primary leading-tight mb-3">
                    {active.title}
                  </h3>
                  <p className="text-[14px] text-text-secondary leading-relaxed mb-6">
                    {active.description}
                  </p>

                  {/* 3 Capabilities */}
                  <div className="space-y-2.5 mb-8">
                    {active.capabilities.map((cap, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-[13px] text-text-primary font-medium">
                        <CheckCircle2 size={16} className="text-brand shrink-0 mt-0.5" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action CTA */}
                {active.isRoute ? (
                  <Link
                    to={active.ctaLink}
                    className="inline-flex items-center gap-2 text-[14px] font-bold text-brand hover:text-brand-dark transition-colors group/link"
                  >
                    <span>{active.ctaText}</span>
                    <ArrowRight size={15} className="transition-transform duration-200 group-hover/link:translate-x-1" />
                  </Link>
                ) : (
                  <a
                    href={active.ctaLink}
                    className="inline-flex items-center gap-2 text-[14px] font-bold text-brand hover:text-brand-dark transition-colors group/link"
                  >
                    <span>{active.ctaText}</span>
                    <ArrowRight size={15} className="transition-transform duration-200 group-hover/link:translate-x-1" />
                  </a>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Subtle Bottom Transition Marker */}
        <div className="mt-16 sm:mt-20 pt-8 border-t border-border-soft flex items-center justify-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted text-center">
            Built Around The Complete Real Estate Journey
          </span>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   06 — VERIFICATION (INTERACTIVE TRUST & VERIFICATION WORKFLOW)
   ═══════════════════════════════════════════════════════════════ */
const verificationItems = [
  {
    id: 'docs',
    icon: ShieldCheck,
    label: 'Documents',
    status: 'Title Deed & RERA Audited',
    summary: 'Property title deed, encumbrance certificate, and RERA registrations authenticated.',
  },
  {
    id: 'photos',
    icon: Eye,
    label: 'Property Photos',
    status: 'Geo-Tagged Photos Verified',
    summary: 'High-resolution photographs matched with physical site layout and actual construction status.',
  },
  {
    id: 'ownership',
    icon: UserCheck,
    label: 'Ownership',
    status: 'Direct Owner Identity Checked',
    summary: 'Registered property owner identity and legal authority to transact verified.',
  },
  {
    id: 'location',
    icon: MapPin,
    label: 'Location',
    status: 'Coordinates & Locality Verified',
    summary: 'Physical coordinates, access roads, and infrastructure connectivity confirmed on-ground.',
  },
];

function Verification() {
  const [activeStep, setActiveStep] = useState(2); // 0: Submitted, 1: Reviewing, 2: Verified
  const [selectedItem, setSelectedItem] = useState(null);
  const [hasScanned, setHasScanned] = useState(false);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  // Scan line animation trigger when entering viewport
  useEffect(() => {
    if (isInView && !hasScanned) {
      const timer = setTimeout(() => {
        setHasScanned(true);
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [isInView, hasScanned]);

  const progressSteps = [
    { num: '01', title: 'Submitted', desc: 'Property details & documents uploaded' },
    { num: '02', title: 'Reviewing', desc: '4-point verification & audit underway' },
    { num: '03', title: 'Verified', desc: 'Signals approved & public badge live' },
  ];

  return (
    <section
      id="verification"
      ref={sectionRef}
      className="relative py-24 sm:py-28 lg:py-36 overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 75% 45%, rgba(22,163,106,0.035) 0%, transparent 45%), #FCFCFB',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid lg:grid-cols-12 lg:gap-12 xl:gap-16 items-center">
          
          {/* ───────── LEFT: VERIFICATION STORY (45% / col-span-5) ───────── */}
          <div className="lg:col-span-5 mb-12 lg:mb-0">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 uppercase tracking-[0.16em] mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>Verification</span>
              </div>
            </Reveal>

            <Reveal delay={1}>
              <h2 className="text-[30px] sm:text-[38px] lg:text-[44px] font-bold text-[#17202A] leading-[1.1] tracking-[-0.03em] mb-3.5">
                Trust should be{' '}
                <span className="text-emerald-600">visible.</span>
              </h2>
            </Reveal>

            <Reveal delay={2}>
              <p className="text-[15px] sm:text-[16.5px] text-[#667085] leading-[1.65] max-w-[520px] mb-8 font-normal">
                GharMB brings verification signals and structured property information closer to every real-estate decision. Documents, photos, ownership and location are checked before verification.
              </p>
            </Reveal>

            {/* Hybrid Verification Progress Timeline */}
            <Reveal delay={3}>
              <div className="bg-white rounded-2xl border border-[#E7E7E5] p-5 shadow-sm max-w-[480px]">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted block mb-3.5">
                  Verification Lifecycle
                </span>

                <div className="grid grid-cols-3 gap-2 relative">
                  {progressSteps.map((s, idx) => {
                    const isPassed = idx <= activeStep;
                    const isCurrent = idx === activeStep;
                    return (
                      <button
                        key={s.num}
                        type="button"
                        onClick={() => setActiveStep(idx)}
                        className="text-left group cursor-pointer focus:outline-none"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold transition-all duration-300 ${
                              isCurrent
                                ? idx === 2
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-brand text-white shadow-xs'
                                : isPassed
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-[#F2F2F0] text-text-muted'
                            }`}
                          >
                            {idx === 2 && isPassed ? <Check size={11} strokeWidth={3} /> : s.num}
                          </div>
                          {idx < progressSteps.length - 1 && (
                            <div
                              className={`flex-1 h-[2px] transition-colors duration-300 ${
                                idx < activeStep ? 'bg-emerald-500' : 'bg-[#E7E7E5]'
                              }`}
                            />
                          )}
                        </div>
                        <span
                          className={`text-[13px] font-bold block transition-colors ${
                            isCurrent
                              ? idx === 2
                                ? 'text-emerald-700'
                                : 'text-brand'
                              : 'text-text-primary'
                          }`}
                        >
                          {s.title}
                        </span>
                        <p className="text-[11px] text-text-secondary leading-tight mt-0.5 hidden sm:block">
                          {s.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Reveal>

            {/* Subtle Contextual Link */}
            <div className="mt-6 pt-4">
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors group"
              >
                <span>See how verification works</span>
                <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          {/* ───────── RIGHT: INTERACTIVE VERIFICATION PRODUCT INTERFACE (55% / col-span-7) ───────── */}
          <div className="lg:col-span-7 relative">
            
            {/* Desktop Floating Glass Badges */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="hidden sm:block absolute -top-4 -right-2 z-20"
            >
              <div className="bg-white/85 backdrop-blur-md border border-white/90 rounded-xl px-3 py-1.5 shadow-[0_10px_30px_rgba(20,30,40,0.08)] flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span className="text-[11px] font-bold text-text-primary">Documents Reviewed · 100% Legit</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="hidden sm:block absolute -bottom-4 -left-3 z-20"
            >
              <div className="bg-white/85 backdrop-blur-md border border-white/90 rounded-xl px-3 py-1.5 shadow-[0_10px_30px_rgba(20,30,40,0.08)] flex items-center gap-2">
                <MapPin size={13} className="text-brand" />
                <span className="text-[11px] font-bold text-text-primary">Location Coordinates Checked</span>
              </div>
            </motion.div>

            {/* Main Verification Card */}
            <div className="bg-white rounded-[26px] border border-[#E7E7E5] shadow-[0_28px_70px_rgba(20,30,40,0.08)] p-6 sm:p-8 relative overflow-hidden">
              
              {/* Subtle Scanning Line Animation */}
              {!hasScanned && (
                <motion.div
                  initial={{ top: '0%' }}
                  animate={{ top: '100%' }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                  className="absolute inset-x-0 h-[2.5px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent z-30 pointer-events-none opacity-80"
                />
              )}

              {/* Top Property Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-border-soft">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-border shadow-xs">
                    <img
                      src="https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=160&h=160&fit=crop&q=80"
                      alt="Skyline Heights"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-[16px] sm:text-[17px] font-bold text-text-primary leading-tight">
                        Skyline Heights Residences
                      </h4>
                      <span className="hidden sm:inline-block text-[10px] font-mono text-text-muted bg-[#F2F2F0] px-1.5 py-0.5 rounded">
                        #GBM-2409-V8812
                      </span>
                    </div>
                    <p className="text-[12px] text-text-secondary mt-0.5">
                      Sector 62, Noida · Expressway Corridor
                    </p>
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-text-primary mt-1">
                      <span>3 BHK</span>
                      <span>·</span>
                      <span>1,480 sq ft</span>
                      <span>·</span>
                      <span className="text-brand font-bold">₹1.25 Cr</span>
                    </div>
                  </div>
                </div>

                {/* Verified Property Status Pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-xs">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Verified Property
                  </span>
                </div>
              </div>

              {/* 4 Interactive Verification Rows */}
              <div className="py-5 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1 px-1">
                  <span>Audit Parameter</span>
                  <span>Validation Status</span>
                </div>

                {verificationItems.map((item) => {
                  const Icon = item.icon;
                  const isExpanded = selectedItem === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(isExpanded ? null : item.id)}
                      className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                        isExpanded
                          ? 'bg-emerald-50/60 border-emerald-300 shadow-xs'
                          : 'bg-[#FAFAF9] border-[#EAEAE8] hover:bg-white hover:border-emerald-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-white border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 shadow-xs">
                            <Icon size={16} strokeWidth={2} />
                          </div>
                          <div>
                            <span className="text-[13px] font-bold text-text-primary block leading-tight">
                              {item.label}
                            </span>
                            <span className="text-[11px] text-text-secondary">
                              {item.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0">
                          <Check size={12} strokeWidth={3} />
                          <span>Passed</span>
                        </div>
                      </div>

                      {/* Expandable Explanation Popover Row */}
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2.5 pt-2.5 border-t border-emerald-200/60 text-[12px] text-emerald-950 font-normal leading-relaxed"
                        >
                          {item.summary}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Micro Document Preview & Final Confirmation */}
              <div className="pt-4 border-t border-border-soft flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                  <div className="w-6 h-6 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                    <ShieldCheck size={13} />
                  </div>
                  <span className="font-semibold text-text-primary">Title Deed Certificate</span>
                  <span className="text-text-muted">· Registered #DL-0982</span>
                </div>

                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  Verification Complete
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   07 — PROFESSIONALS (Interactive Role-Based Ecosystem)
   ═══════════════════════════════════════════════════════════════ */

const professionalRoles = [
  {
    id: 'owners',
    num: '01',
    icon: HomeIcon,
    title: 'Property Owners',
    descriptor: 'Manage listings and enquiries',
    tagline: 'Manage your property journey.',
    description:
      'List your property with structured guidance, monitor real-time visitor interest, manage buyer enquiries, and approve secured token bookings directly from your owner dashboard.',
    capabilities: [
      'Guided listing workflow',
      'Property activity',
      'Enquiries & token requests',
    ],
    ctaText: 'Explore for Property Owners',
    ctaLink: '#platform',
  },
  {
    id: 'agents',
    num: '02',
    icon: Briefcase,
    title: 'Agents & Brokers',
    descriptor: 'Work with clients and listings',
    tagline: 'Work smarter across your listings.',
    description:
      'Manage verified client mandates, coordinate on-ground property viewings, access pre-screened buyer requests, and collaborate across an authorized broker network.',
    capabilities: [
      'Client management',
      'Property discovery',
      'Enquiry tracking',
    ],
    ctaText: 'Explore for Agents & Brokers',
    ctaLink: '/agents',
  },
  {
    id: 'developers',
    num: '03',
    icon: Building2,
    title: 'Developers',
    descriptor: 'Showcase projects and inventory',
    tagline: 'Bring projects into one connected platform.',
    description:
      'Present residential and commercial developments with verified RERA documentation, live unit inventory context, architectural media, and seamless channel partner alignment.',
    capabilities: [
      'Project presentation',
      'Inventory context',
      'Professional connections',
    ],
    ctaText: 'Explore for Developers',
    ctaLink: '/developers',
  },
  {
    id: 'professionals',
    num: '04',
    icon: UserCheck,
    title: 'Professionals',
    descriptor: 'Build your real-estate network',
    tagline: 'Build stronger real-estate connections.',
    description:
      'Connect with homeowners, developers, and brokers seeking specialized advisory in property law, structural architecture, real-estate valuation, and interior design.',
    capabilities: [
      'Professional profile',
      'Network discovery',
      'Relevant opportunities',
    ],
    ctaText: 'Explore for Professionals',
    ctaLink: '/contact',
  },
];

/* ─── Role 01 UI: Property Owner Console ─── */
function OwnerShowcaseUI() {
  return (
    <div className="space-y-4">
      {/* Top Console Status */}
      <div className="flex items-center justify-between pb-3.5 border-b border-border-soft">
        <div>
          <h4 className="text-[15px] sm:text-[16px] font-bold text-[#17202A] leading-tight">
            My Properties
          </h4>
          <p className="text-[11px] sm:text-[12px] text-[#667085]">
            1 Active Listing · Managed Directly
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] sm:text-[11px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          Live & Verified
        </span>
      </div>

      {/* Property Showcase Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="p-3 sm:p-4 rounded-2xl bg-[#FAFAF9] border border-[#E7E7E5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border border-border">
            <img
              src="https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=200&h=200&fit=crop&q=80"
              alt="Skyline Heights"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] sm:text-[15px] font-bold text-[#17202A]">
                Skyline Heights
              </span>
              <span className="text-[10px] font-mono text-[#667085] bg-white border border-[#E7E7E5] px-1.5 py-0.5 rounded">
                Unit 402
              </span>
            </div>
            <p className="text-[12px] text-[#667085] mt-0.5">
              Sector 62, Noida · Expressway Corridor
            </p>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#17202A] mt-1">
              <span>3 BHK</span>
              <span>·</span>
              <span>1,480 sq ft</span>
              <span>·</span>
              <span className="text-[#FF5A3C] font-bold">₹1.25 Cr</span>
            </div>
          </div>
        </div>

        <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-border-soft">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#667085]">Status</span>
          <span className="text-[12px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            Active on Feed
          </span>
        </div>
      </motion.div>

      {/* Performance Metrics Row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12 }}
        className="grid grid-cols-3 gap-2.5"
      >
        <div className="p-3 rounded-xl bg-white border border-[#E7E7E5] shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-[#667085]">Views</span>
            <Eye size={12} className="text-[#FF5A3C]" />
          </div>
          <span className="text-[16px] sm:text-[18px] font-bold text-[#17202A] block leading-none">
            1,420
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
            +18% this week
          </span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-[#E7E7E5] shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-[#667085]">Shortlisted</span>
            <Sparkles size={12} className="text-amber-500" />
          </div>
          <span className="text-[16px] sm:text-[18px] font-bold text-[#17202A] block leading-none">
            84
          </span>
          <span className="text-[10px] text-[#667085] font-medium mt-1 block">
            High interest
          </span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-[#E7E7E5] shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-[#667085]">Enquiries</span>
            <MessageSquare size={12} className="text-brand" />
          </div>
          <span className="text-[16px] sm:text-[18px] font-bold text-[#17202A] block leading-none">
            18
          </span>
          <span className="text-[10px] text-[#FF5A3C] font-semibold mt-1 block">
            3 pending review
          </span>
        </div>
      </motion.div>

      {/* Token Requests & Activity */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.18 }}
        className="p-3.5 rounded-2xl bg-white border border-[#E7E7E5] space-y-2.5"
      >
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#667085]">
          <span>Recent Token & Inquiry Activity</span>
          <span className="text-[10px] text-[#FF5A3C] font-semibold">Live Feed</span>
        </div>

        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#FFF0ED]/40 border border-[#FF5A3C]/15">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#FF5A3C] text-white flex items-center justify-center shrink-0">
              <Ticket size={13} />
            </div>
            <div className="min-w-0">
              <span className="text-[12px] font-bold text-[#17202A] block truncate leading-tight">
                Token Request · ₹50,000 Escrow Initiated
              </span>
              <span className="text-[10px] text-[#667085]">
                Buyer: Rahul S. · Unit 402 · 14m ago
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-[#FF5A3C] bg-white px-2 py-1 rounded-md border border-[#FF5A3C]/20 shrink-0">
            Review Request
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#FAFAF9] border border-[#E7E7E5]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-white border border-[#E7E7E5] text-[#17202A] flex items-center justify-center shrink-0">
              <CheckCircle2 size={13} className="text-emerald-600" />
            </div>
            <div className="min-w-0">
              <span className="text-[12px] font-semibold text-[#17202A] block truncate leading-tight">
                Site Inspection Confirmed · Sunday 11:00 AM
              </span>
              <span className="text-[10px] text-[#667085]">
                Verified Buyer with Pre-approved Loan
              </span>
            </div>
          </div>
          <span className="text-[10px] font-medium text-[#667085] shrink-0">1h ago</span>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Role 02 UI: Agent Workspace ─── */
function AgentShowcaseUI() {
  return (
    <div className="space-y-4">
      {/* Top Workspace Status */}
      <div className="flex items-center justify-between pb-3.5 border-b border-border-soft">
        <div>
          <h4 className="text-[15px] sm:text-[16px] font-bold text-[#17202A] leading-tight">
            Agent Workspace
          </h4>
          <p className="text-[11px] sm:text-[12px] text-[#667085]">
            Authorized Broker Network · RERA #UP-AG-8821
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF0ED] border border-[#FF5A3C]/20 text-[#FF5A3C] text-[10px] sm:text-[11px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C] animate-pulse" />
          Active Brokerage
        </span>
      </div>

      {/* Summary Chips */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="grid grid-cols-3 gap-2.5"
      >
        <div className="p-3 rounded-xl bg-[#FAFAF9] border border-[#E7E7E5]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
            Active Listings
          </span>
          <span className="text-[16px] sm:text-[18px] font-bold text-[#17202A]">12</span>
        </div>
        <div className="p-3 rounded-xl bg-[#FAFAF9] border border-[#E7E7E5]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
            Client Requests
          </span>
          <span className="text-[16px] sm:text-[18px] font-bold text-[#FF5A3C]">5 Pending</span>
        </div>
        <div className="p-3 rounded-xl bg-[#FAFAF9] border border-[#E7E7E5]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
            Site Visits
          </span>
          <span className="text-[16px] sm:text-[18px] font-bold text-emerald-700">3 Today</span>
        </div>
      </motion.div>

      {/* Client Request Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12 }}
        className="p-4 rounded-2xl bg-white border border-[#E7E7E5] shadow-xs space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#17202A] text-white flex items-center justify-center font-bold text-[12px]">
              PS
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-bold text-[#17202A]">Priya Sharma</span>
                <BadgeCheck size={13} className="text-emerald-600" />
              </div>
              <span className="text-[10px] text-[#667085]">Verified Buyer Mandate</span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            Budget: ₹1.5 – 1.8 Cr
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#FAFAF9] border border-[#EAEAE8] text-[12px] text-[#17202A] leading-relaxed">
          <p className="font-medium text-[#17202A]">
            Requirement: 3 BHK Apartment in Sector 150 / 62 Noida
          </p>
          <span className="text-[11px] text-[#667085] block mt-0.5">
            Matches 3 verified listings currently in your portfolio.
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-[#667085]">Received 22m ago</span>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#FF5A3C] hover:text-[#e04529] transition-colors"
          >
            <span>View client request</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </motion.div>

      {/* Operational Lead Row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.18 }}
        className="p-3 rounded-xl bg-[#FAFAF9] border border-[#E7E7E5] flex items-center justify-between text-[11px]"
      >
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-[#FF5A3C]" />
          <span className="font-semibold text-[#17202A]">Site Visit: The Grand Reserve, Gurgaon</span>
        </div>
        <span className="font-bold text-[#667085]">Tomorrow 11:30 AM</span>
      </motion.div>
    </div>
  );
}

/* ─── Role 03 UI: Developer Enterprise Hub ─── */
function DeveloperShowcaseUI() {
  return (
    <div className="space-y-4">
      {/* Top Console Status */}
      <div className="flex items-center justify-between pb-3.5 border-b border-border-soft">
        <div>
          <h4 className="text-[15px] sm:text-[16px] font-bold text-[#17202A] leading-tight">
            Developer Projects
          </h4>
          <p className="text-[11px] sm:text-[12px] text-[#667085]">
            Emerald Heights · Phase 1 Showcase
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] sm:text-[11px] font-bold">
          <ShieldCheck size={12} className="text-emerald-600" />
          RERA Approved
        </span>
      </div>

      {/* Project Card with Architectural Image */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="rounded-2xl bg-white border border-[#E7E7E5] overflow-hidden shadow-xs"
      >
        <div className="relative h-28 sm:h-32 w-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=600&h=240&fit=crop&q=80"
            alt="Emerald Heights"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between text-white">
            <div>
              <h5 className="text-[15px] font-bold leading-tight">Emerald Heights</h5>
              <p className="text-[11px] text-white/80">Sector 150 Expressway, Noida</p>
            </div>
            <span className="text-[10px] font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded border border-white/30 text-white">
              Possession Q4 2026
            </span>
          </div>
        </div>

        {/* Project Highlights & Inventory Breakdown */}
        <div className="p-3.5 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-[#FAFAF9] border border-[#EAEAE8]">
              <span className="text-[10px] text-[#667085] block">Total Units</span>
              <span className="text-[13px] font-bold text-[#17202A]">240 Units</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-[10px] text-emerald-800 font-medium block">Sold / Booked</span>
              <span className="text-[13px] font-bold text-emerald-900">184 (76%)</span>
            </div>
            <div className="p-2 rounded-xl bg-[#FFF0ED] border border-[#FF5A3C]/20">
              <span className="text-[10px] text-[#FF5A3C] font-semibold block">Available</span>
              <span className="text-[13px] font-bold text-[#FF5A3C]">56 Units</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border-soft text-[#667085]">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#17202A]">RERA #UP-PRJ-90412</span>
              <span>·</span>
              <span>4.5 Acre Township</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Construction: On Schedule
            </span>
          </div>
        </div>
      </motion.div>

      {/* Partner & Buyer Enquiries Row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="p-3 rounded-xl bg-[#FAFAF9] border border-[#E7E7E5] flex items-center justify-between text-[11px]"
      >
        <div className="flex items-center gap-2">
          <Users size={13} className="text-[#FF5A3C]" />
          <span className="font-medium text-[#17202A]">
            <strong className="font-bold">24 Authorized Channel Partners</strong> actively showcasing project
          </span>
        </div>
        <span className="text-[10px] font-bold text-[#FF5A3C] shrink-0">680 Downloads</span>
      </motion.div>
    </div>
  );
}

/* ─── Role 04 UI: Professional Network Hub ─── */
function ProfessionalShowcaseUI() {
  return (
    <div className="space-y-4">
      {/* Top Workspace Status */}
      <div className="flex items-center justify-between pb-3.5 border-b border-border-soft">
        <div>
          <h4 className="text-[15px] sm:text-[16px] font-bold text-[#17202A] leading-tight">
            Professional Network
          </h4>
          <p className="text-[11px] sm:text-[12px] text-[#667085]">
            Legal, Valuation & Architectural Ecosystem
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] sm:text-[11px] font-bold">
          <BadgeCheck size={13} className="text-emerald-600" />
          Verified Advisor
        </span>
      </div>

      {/* Professional Profile Dossier */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="p-4 rounded-2xl bg-[#FAFAF9] border border-[#E7E7E5] space-y-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#17202A] text-white flex items-center justify-center font-bold text-[14px] shadow-xs">
              VM
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-bold text-[#17202A]">
                  Ar. Vikram Mehta & Associates
                </span>
              </div>
              <p className="text-[12px] text-[#FF5A3C] font-semibold">
                Architecture & Structural Auditing
              </p>
              <p className="text-[11px] text-[#667085] mt-0.5">
                Delhi NCR · 14+ Yrs Professional Practice
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-bold text-amber-800">
              <Star size={11} className="fill-amber-500 text-amber-500" />
              <span>4.9 / 5.0</span>
            </div>
            <span className="text-[10px] text-[#667085] block mt-1">68 Consultations</span>
          </div>
        </div>

        <div className="pt-2 border-t border-border-soft flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E7E7E5] text-[10px] font-semibold text-[#17202A]">
            RERA Accredited
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E7E7E5] text-[10px] font-semibold text-[#17202A]">
            Structural Due Diligence
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E7E7E5] text-[10px] font-semibold text-[#17202A]">
            Title Clearance Review
          </span>
        </div>
      </motion.div>

      {/* Connected Opportunities & Inquiries */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12 }}
        className="p-3.5 rounded-2xl bg-white border border-[#E7E7E5] space-y-2.5"
      >
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#667085]">
          <span>Recent Advisory Inquiries</span>
          <span className="text-[10px] text-emerald-700 font-semibold">2 Active</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#FAFAF9] border border-[#EAEAE8] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[12px] font-bold text-[#17202A] block truncate">
              Structural Feasibility Audit · Horizon Tower
            </span>
            <span className="text-[10px] text-[#667085]">
              Requested by Prestige Developers · Commercial High-Rise
            </span>
          </div>
          <span className="text-[10px] font-bold text-[#FF5A3C] bg-[#FFF0ED] px-2 py-1 rounded-md shrink-0">
            Accept Project
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#FAFAF9] border border-[#EAEAE8] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[12px] font-semibold text-[#17202A] block truncate">
              Title Deed Audit · Sector 128 Villa
            </span>
            <span className="text-[10px] text-[#667085]">
              Direct Homeowner Consultation · Scheduled Tomorrow
            </span>
          </div>
          <span className="text-[10px] font-medium text-emerald-700 shrink-0">Confirmed</span>
        </div>
      </motion.div>
    </div>
  );
}

function Professionals() {
  const [activeTab, setActiveTab] = useState(0);
  const currentRole = professionalRoles[activeTab];

  // Keyboard accessibility support
  const handleKeyDown = (e, index) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (index + 1) % professionalRoles.length;
      setActiveTab(next);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (index - 1 + professionalRoles.length) % professionalRoles.length;
      setActiveTab(prev);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveTab(index);
    }
  };

  return (
    <section
      id="professionals"
      className="relative py-20 sm:py-24 lg:py-32 overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 65% 50%, rgba(255,90,60,0.045), transparent 45%), #FCFCFB',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
        {/* ───────── MOBILE-ONLY INTRO & TAB RAIL (< lg) ───────── */}
        <div className="lg:hidden mb-8">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0ED] border border-[#FF5A3C]/20 text-[11px] font-bold text-[#FF5A3C] uppercase tracking-[0.16em] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
              <span>For Professionals</span>
            </div>
          </Reveal>

          <Reveal delay={1}>
            <h2 className="text-[30px] sm:text-[38px] lg:text-[44px] font-bold text-[#17202A] leading-[1.1] tracking-[-0.03em] mb-3.5">
              Built for everyone who{' '}
              <span className="text-[#FF5A3C]">moves real estate</span> forward.
            </h2>
          </Reveal>

          <Reveal delay={2}>
            <p className="text-[15px] sm:text-[16.5px] text-[#667085] leading-[1.65] font-normal mb-6">
              Whether you own a property, represent clients, develop projects, or work across the
              real-estate ecosystem — GharMB gives you the tools and connections to move work forward.
            </p>
          </Reveal>

          {/* Mobile Horizontal Scrolling Tabs */}
          <div
            role="tablist"
            aria-label="Professional Roles"
            className="flex items-center gap-2 overflow-x-auto pb-2 -mx-5 px-5 sm:mx-0 sm:px-0 no-scrollbar"
          >
            {professionalRoles.map((role, idx) => {
              const Icon = role.icon;
              const isActive = activeTab === idx;
              return (
                <button
                  key={role.id}
                  role="tab"
                  id={`role-tab-m-${role.id}`}
                  aria-selected={isActive}
                  aria-controls={`role-panel-${role.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveTab(idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#FFF0ED] border border-[#FF5A3C]/30 text-[#17202A] shadow-xs'
                      : 'bg-white border border-[#E7E7E5] text-[#667085] hover:bg-[#FAFAF9]'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-[#FF5A3C] text-white' : 'bg-[#F2F2F0] text-[#667085]'
                    }`}
                  >
                    <Icon size={13} />
                  </div>
                  <span>{role.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ───────── MAIN TWO-COLUMN LAYOUT (Desktop: 40% / 60%) ───────── */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-start">
          
          {/* ────── LEFT COLUMN: INTRO + ROLE SELECTOR + CAPABILITIES (Desktop: col-span-5) ────── */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Desktop Section Intro */}
            <div className="hidden lg:block space-y-3">
              <Reveal>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0ED] border border-[#FF5A3C]/20 text-[11px] font-bold text-[#FF5A3C] uppercase tracking-[0.16em] mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
                  <span>For Professionals</span>
                </div>
              </Reveal>

              <Reveal delay={1}>
                <h2 className="text-[30px] sm:text-[38px] lg:text-[44px] font-bold text-[#17202A] leading-[1.1] tracking-[-0.03em] mb-3.5">
                  Built for everyone who{' '}
                  <span className="text-[#FF5A3C]">moves real estate</span> forward.
                </h2>
              </Reveal>

              <Reveal delay={2}>
                <p className="text-[15px] sm:text-[16.5px] text-[#667085] leading-[1.65] font-normal">
                  Whether you own a property, represent clients, develop projects, or work across the
                  real-estate ecosystem — GharMB gives you the tools and connections to move work forward.
                </p>
              </Reveal>
            </div>

            {/* Desktop Vertical Tab Navigation */}
            <div
              role="tablist"
              aria-label="GharMB Ecosystem Roles"
              className="hidden lg:flex flex-col space-y-3 relative"
            >
              {professionalRoles.map((role, idx) => {
                const Icon = role.icon;
                const isActive = activeTab === idx;

                return (
                  <button
                    key={role.id}
                    role="tab"
                    id={`role-tab-${role.id}`}
                    aria-selected={isActive}
                    aria-controls={`role-panel-${role.id}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => setActiveTab(idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    className={`w-full text-left p-4 sm:p-4.5 rounded-[20px] transition-all duration-200 cursor-pointer relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A3C] ${
                      isActive
                        ? 'bg-[#FFF0ED] border-2 border-[#FF5A3C]/40 shadow-[0_8px_24px_rgba(255,90,60,0.12)]'
                        : 'bg-white border border-[#E7E7E5] shadow-[0_2px_10px_rgba(20,30,40,0.03)] hover:border-[#FF5A3C]/35 hover:shadow-[0_6px_20px_rgba(20,30,40,0.06)] hover:bg-[#FAFAF9]'
                    }`}
                  >
                    {/* Animated Coral Indicator Bar */}
                    {isActive && (
                      <motion.div
                        layoutId="roleActiveIndicator"
                        className="absolute left-0 top-3.5 bottom-3.5 w-1.5 bg-[#FF5A3C] rounded-r-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}

                    <div className="flex items-center gap-3.5 pl-1">
                      {/* Icon */}
                      <div
                        className={`w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 transition-all duration-200 ${
                          isActive
                            ? 'bg-[#FF5A3C] text-white shadow-[0_4px_14px_rgba(255,90,60,0.35)]'
                            : 'bg-[#F5F5F3] border border-[#EAEAEC] text-[#667085] group-hover:bg-[#FFF0ED] group-hover:text-[#FF5A3C] group-hover:border-[#FF5A3C]/20'
                        }`}
                      >
                        <Icon size={18} strokeWidth={2} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span
                            className={`text-[15.5px] font-bold transition-colors leading-tight ${
                              isActive ? 'text-[#17202A]' : 'text-[#27272A] group-hover:text-[#17202A]'
                            }`}
                          >
                            {role.title}
                          </span>
                          <span
                            className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                              isActive
                                ? 'bg-white border border-[#FF5A3C]/25 text-[#FF5A3C] shadow-xs'
                                : 'bg-[#F2F2F0] border border-[#E7E7E5] text-[#667085] group-hover:text-[#17202A]'
                            }`}
                          >
                            {role.num}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#667085] leading-normal">
                          {role.descriptor}
                        </p>
                      </div>

                      {/* Right Chevron Indicator */}
                      <div className="shrink-0 text-[#D0D0CE] group-hover:text-[#FF5A3C] transition-colors">
                        <ChevronRight
                          size={16}
                          className={`transition-transform duration-200 ${
                            isActive ? 'text-[#FF5A3C] translate-x-0.5' : 'group-hover:translate-x-1'
                          }`}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ────── RIGHT COLUMN: PRODUCT SHOWCASE (Desktop: col-span-7 / 62%) ────── */}
          <div className="lg:col-span-7 relative lg:pt-14 xl:pt-16">
            
            {/* Desktop Floating Glass Badge 1 (Top Right) */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="hidden sm:block absolute -top-3.5 -right-2 z-20"
            >
              <div
                className="px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-[0_12px_30px_rgba(20,30,40,0.08)]"
                style={{
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.9)',
                }}
              >
                <ShieldCheck size={14} className="text-emerald-600" />
                <span className="text-[11px] font-bold text-[#17202A]">
                  Profile verified · GharMB Trust Signal
                </span>
              </div>
            </motion.div>

            {/* Desktop Floating Glass Badge 2 (Bottom Left) */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="hidden sm:block absolute -bottom-3.5 -left-3 z-20"
            >
              <div
                className="px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-[0_12px_30px_rgba(20,30,40,0.08)]"
                style={{
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.9)',
                }}
              >
                <span className="w-2 h-2 rounded-full bg-[#FF5A3C] animate-pulse" />
                <span className="text-[11px] font-bold text-[#17202A]">
                  Listing activity · Real-Time Updates
                </span>
              </div>
            </motion.div>

            {/* Main Application Showcase Frame */}
            <div
              id={`role-panel-${currentRole.id}`}
              role="tabpanel"
              aria-labelledby={`role-tab-${currentRole.id}`}
              className="bg-white rounded-[26px] border border-[#E7E7E5] shadow-[0_30px_80px_rgba(20,30,40,0.10)] overflow-hidden relative"
            >
              {/* Minimal Top Product Header Bar */}
              <div className="bg-[#FAFAF9] px-5 sm:px-6 py-3.5 border-b border-[#E7E7E5] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A3C]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="h-3 w-px bg-border mx-1" />
                  <span className="text-[12px] font-bold text-[#17202A] tracking-tight">
                    GharMB Workspace
                  </span>
                  <span className="text-[11px] text-[#667085] hidden sm:inline">
                    · {currentRole.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-mono text-[#667085] font-semibold">
                    CONNECTED
                  </span>
                </div>
              </div>

              {/* Dynamic Interactive Role UI Workspace */}
              <div className="p-5 sm:p-7 min-h-[420px] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentRole.id}
                    initial={{ opacity: 0, scale: 0.98, x: 16 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.98, x: -16 }}
                    transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    {activeTab === 0 && <OwnerShowcaseUI />}
                    {activeTab === 1 && <AgentShowcaseUI />}
                    {activeTab === 2 && <DeveloperShowcaseUI />}
                    {activeTab === 3 && <ProfessionalShowcaseUI />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* ───────── WIDE ROLE CONTEXT & CAPABILITIES CARD (Full-width se thoda kam) ───────── */}
        <div className="mt-8 lg:mt-10 max-w-[1180px] mx-auto bg-white rounded-2xl border border-[#E7E7E5] p-6 sm:p-7 shadow-xs">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRole.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-center"
            >
              <div className="lg:col-span-7">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF5A3C] block mb-1.5">
                  {currentRole.num} · {currentRole.title}
                </span>
                <h3 className="text-[20px] sm:text-[22px] font-bold text-[#17202A] leading-snug">
                  {currentRole.tagline}
                </h3>
                <p className="text-[13.5px] sm:text-[14px] text-[#667085] leading-relaxed mt-2 font-normal">
                  {currentRole.description}
                </p>
              </div>

              {/* 3 Key Capabilities */}
              <div className="lg:col-span-5 lg:border-l lg:border-[#EAEAE8] lg:pl-8 space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-2">
                  Key Capabilities
                </span>
                <div className="space-y-2">
                  {currentRole.capabilities.map((cap, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-[13.5px] font-semibold text-[#17202A]">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   08 — COMMERCIAL (Interactive Commercial Space Discovery)
   ═══════════════════════════════════════════════════════════════ */

const commercialCategories = [
  {
    id: 'office',
    num: '01',
    label: 'Office',
    descriptor: 'Professional workplaces',
    title: 'Professional workplaces.',
    description:
      'Explore modern office spaces designed for teams, businesses and growing companies.',
    icon: Building2,
    image:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop&q=85',
    imageAlt: 'Modern premium commercial office interior with floor-to-ceiling glass windows',
    cardTag: 'Commercial Space',
    cardType: 'Office',
    cardTitle: 'Premium Workspace',
    location: 'Sector 62, Noida',
    area: '1,850 sq ft',
    spaceType: 'Ready space',
    mapArea: 'Sector 62 · Express Highway Hub',
    meta: {
      type: 'Grade-A Office',
      location: 'Sector 62, Noida',
      area: '1,850 sq ft',
      status: 'Ready to Move',
    },
  },
  {
    id: 'retail',
    num: '02',
    label: 'Retail',
    descriptor: 'Customer-facing spaces',
    title: 'Retail that gets noticed.',
    description:
      'Discover customer-facing spaces for brands, stores and growing retail businesses.',
    icon: Store,
    image:
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=800&fit=crop&q=85',
    imageAlt: 'High-end modern luxury retail storefront interior',
    cardTag: 'Commercial Space',
    cardType: 'Retail',
    cardTitle: 'High-Street Retail Store',
    location: 'Golf Course Road, Gurgaon',
    area: '2,400 sq ft',
    spaceType: 'High visibility',
    mapArea: 'Sector 54 · Prime High-Street',
    meta: {
      type: 'Prime Retail Front',
      location: 'Golf Course Rd, Gurgaon',
      area: '2,400 sq ft',
      status: 'High Footfall Corridor',
    },
  },
  {
    id: 'shop',
    num: '03',
    label: 'Shop',
    descriptor: 'Spaces built for business',
    title: 'Spaces built for business.',
    description:
      'Explore compact commercial spaces suited for local businesses and independent operators.',
    icon: Store,
    image:
      'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=1200&h=800&fit=crop&q=85',
    imageAlt: 'Street-facing modern boutique shop in commercial arcade',
    cardTag: 'Commercial Space',
    cardType: 'Shop',
    cardTitle: 'Commercial Arcade Shop',
    location: 'Sector 18 Central Market, Noida',
    area: '850 sq ft',
    spaceType: 'Street access',
    mapArea: 'Sector 18 · Central Market',
    meta: {
      type: 'Commercial Boutique',
      location: 'Sector 18, Noida',
      area: '850 sq ft',
      status: 'Ground Floor Frontage',
    },
  },
  {
    id: 'showroom',
    num: '04',
    label: 'Showroom',
    descriptor: 'Brand & product spaces',
    title: 'Make your space part of the experience.',
    description:
      'Find flexible spaces for product displays, brand experiences and customer interactions.',
    icon: Presentation,
    image:
      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1200&h=800&fit=crop&q=85',
    imageAlt: 'Spacious high-ceiling luxury brand experience showroom',
    cardTag: 'Commercial Space',
    cardType: 'Showroom',
    cardTitle: 'Experience Showroom',
    location: 'MG Road Corridor, Gurgaon',
    area: '3,200 sq ft',
    spaceType: 'Prime frontage',
    mapArea: 'MG Road · Prime Frontage',
    meta: {
      type: 'Experience Showroom',
      location: 'MG Road, Gurgaon',
      area: '3,200 sq ft',
      status: 'Double-Height Glass Facade',
    },
  },
  {
    id: 'coworking',
    num: '05',
    label: 'Co-working',
    descriptor: 'Workspaces built around people',
    title: 'Workspaces built around people.',
    description:
      'Explore flexible work environments for teams, freelancers and modern businesses.',
    icon: Users,
    image:
      'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=1200&h=800&fit=crop&q=85',
    imageAlt: 'Vibrant modern co-working space with collaborative workstations and hot desks',
    cardTag: 'Commercial Space',
    cardType: 'Co-working',
    cardTitle: 'Collaborative Flex Hub',
    location: 'Cyber City Phase 2, Gurgaon',
    area: '120 seats',
    spaceType: 'Flexible plans',
    mapArea: 'Cyber City · Tech Hub',
    meta: {
      type: 'Managed Flex Office',
      location: 'Cyber City, Gurgaon',
      area: '120 seats',
      status: 'Flexible plans',
    },
  },
  {
    id: 'warehouse',
    num: '06',
    label: 'Warehouse',
    descriptor: 'Space that keeps business moving',
    title: 'Space that keeps business moving.',
    description:
      'Explore commercial storage and operational spaces for logistics, distribution and business needs.',
    icon: Warehouse,
    image:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=800&fit=crop&q=85',
    imageAlt: 'Modern high-bay industrial warehouse and logistics distribution center',
    cardTag: 'Commercial Space',
    cardType: 'Warehouse',
    cardTitle: 'Grade-A Logistics Facility',
    location: 'Eastern Peripheral Expressway',
    area: '8,500 sq ft',
    spaceType: 'Loading access',
    mapArea: 'Expressway Logistics Zone',
    meta: {
      type: 'Modern Logistics Hub',
      location: 'Greater Noida Expressway',
      area: '8,500 sq ft',
      status: '4 Dedicated Loading Docks',
    },
  },
];

function Commercial() {
  const [activeIdx, setActiveIdx] = useState(0);
  const current = commercialCategories[activeIdx];
  const CurrentIcon = current.icon;

  // Keyboard accessibility
  const handleKeyDown = (e, index) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((index + 1) % commercialCategories.length);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((index - 1 + commercialCategories.length) % commercialCategories.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveIdx(index);
    }
  };

  return (
    <section
      id="commercial"
      className="relative py-24 sm:py-28 lg:py-36 overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 70% 45%, rgba(255,90,60,0.035) 0%, transparent 45%), #FCFCFB',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
        {/* ───────── MOBILE-ONLY INTRO & CATEGORY RAIL (< lg) ───────── */}
        <div className="lg:hidden mb-8">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0ED] border border-[#FF5A3C]/20 text-[11px] font-bold text-[#FF5A3C] uppercase tracking-[0.16em] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
              <span>Commercial</span>
            </div>
          </Reveal>

          <Reveal delay={1}>
            <h2 className="text-[30px] sm:text-[38px] lg:text-[44px] font-bold text-[#17202A] leading-[1.1] tracking-[-0.03em] mb-3.5">
              Real estate beyond the <span className="text-[#FF5A3C]">home.</span>
            </h2>
          </Reveal>

          <Reveal delay={2}>
            <p className="text-[15px] sm:text-[16.5px] text-[#667085] leading-[1.65] font-normal mb-6">
              Explore offices, retail spaces, showrooms, co-working environments and other
              commercial spaces through one connected real-estate ecosystem.
            </p>
          </Reveal>

          {/* Mobile Horizontal Scrolling Tabs */}
          <div
            role="tablist"
            aria-label="Commercial Space Categories"
            className="flex items-center gap-2 overflow-x-auto pb-2 -mx-5 px-5 sm:mx-0 sm:px-0 no-scrollbar"
          >
            {commercialCategories.map((cat, idx) => {
              const Icon = cat.icon;
              const isActive = activeIdx === idx;
              return (
                <button
                  key={cat.id}
                  role="tab"
                  id={`comm-tab-m-${cat.id}`}
                  aria-selected={isActive}
                  aria-controls={`comm-panel-${cat.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveIdx(idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#FFF0ED] border border-[#FF5A3C]/30 text-[#17202A] shadow-xs'
                      : 'bg-white border border-[#E7E7E5] text-[#667085] hover:bg-[#FAFAF9]'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-[#FF5A3C] text-white' : 'bg-[#F2F2F0] text-[#667085]'
                    }`}
                  >
                    <Icon size={13} />
                  </div>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ───────── MAIN TWO-COLUMN LAYOUT (Desktop: 42% / 58%) ───────── */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-start">
          
          {/* ────── LEFT COLUMN: INTRO + CATEGORY SELECTION + INSIGHTS (col-span-5) ────── */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Desktop Section Intro */}
            <div className="hidden lg:block space-y-3">
              <Reveal>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0ED] border border-[#FF5A3C]/20 text-[11px] font-bold text-[#FF5A3C] uppercase tracking-[0.16em] mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
                  <span>Commercial</span>
                </div>
              </Reveal>

              <Reveal delay={1}>
                <h2 className="text-[30px] sm:text-[38px] lg:text-[44px] font-bold text-[#17202A] leading-[1.1] tracking-[-0.03em] mb-3.5">
                  Real estate beyond the <span className="text-[#FF5A3C]">home.</span>
                </h2>
              </Reveal>

              <Reveal delay={2}>
                <p className="text-[15px] sm:text-[16.5px] text-[#667085] leading-[1.65] font-normal">
                  Explore offices, retail spaces, showrooms, co-working environments and other
                  commercial spaces through one connected real-estate ecosystem.
                </p>
              </Reveal>

              {/* Ecosystem Connection Nodes */}
              <Reveal delay={3}>
                <div className="pt-1">
                  <div className="inline-flex flex-wrap items-center gap-2 text-[12px] font-semibold text-[#17202A] bg-white border border-[#E7E7E5] px-3.5 py-2 rounded-xl shadow-xs">
                    <span className="text-[#FF5A3C]">Discovery</span>
                    <span className="text-[#667085]">→</span>
                    <span>Info</span>
                    <span className="text-[#667085]">→</span>
                    <span>Brokers</span>
                    <span className="text-[#667085]">→</span>
                    <span className="text-emerald-700">Decision</span>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Desktop 2-Column Category Grid Selector */}
            <div
              role="tablist"
              aria-label="Commercial Categories"
              className="hidden lg:grid grid-cols-2 gap-2.5"
            >
              {commercialCategories.map((cat, idx) => {
                const Icon = cat.icon;
                const isActive = activeIdx === idx;

                return (
                  <button
                    key={cat.id}
                    role="tab"
                    id={`comm-tab-${cat.id}`}
                    aria-selected={isActive}
                    aria-controls={`comm-panel-${cat.id}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => setActiveIdx(idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    className={`text-left p-3.5 rounded-2xl transition-all duration-200 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A3C] ${
                      isActive
                        ? 'bg-[#FFF0ED] border border-[#FF5A3C]/30 shadow-xs'
                        : 'bg-white border border-[#E7E7E5] hover:bg-[#FAFAF9] hover:border-[#D8D8D5]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                          isActive
                            ? 'bg-[#FF5A3C] text-white shadow-xs'
                            : 'bg-[#F2F2F0] text-[#667085] group-hover:text-[#17202A] group-hover:scale-105'
                        }`}
                      >
                        <Icon size={15} strokeWidth={2} />
                      </div>
                      <span
                        className={`text-[11px] font-mono font-bold ${
                          isActive ? 'text-[#FF5A3C]' : 'text-[#667085]'
                        }`}
                      >
                        {cat.num}
                      </span>
                    </div>

                    <h4
                      className={`text-[14px] font-bold block transition-colors leading-tight ${
                        isActive ? 'text-[#17202A]' : 'text-[#27272A]'
                      }`}
                    >
                      {cat.label}
                    </h4>
                    <p className="text-[11px] text-[#667085] leading-tight mt-1 line-clamp-1">
                      {cat.descriptor}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ────── RIGHT COLUMN: LARGE INTERACTIVE COMMERCIAL SHOWCASE (58% / col-span-7) ────── */}
          <div className="lg:col-span-7 relative lg:pt-14 xl:pt-16">
            
            {/* Main Visual Showcase Panel */}
            <div
              id={`comm-panel-${current.id}`}
              role="tabpanel"
              aria-labelledby={`comm-tab-${current.id}`}
              className="rounded-[28px] overflow-hidden bg-[#F5F5F3] border border-[#E7E7E5] shadow-[0_30px_80px_rgba(20,30,40,0.10)] relative min-h-[480px] sm:min-h-[540px] lg:min-h-[580px] flex flex-col justify-between p-5 sm:p-7"
            >
              {/* Background Image with Cinematic Crossfade */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                  className="absolute inset-0 z-0"
                >
                  <img
                    src={current.image}
                    alt={current.imageAlt}
                    className="w-full h-full object-cover"
                  />
                  {/* Dark to Transparent Vignette Gradient for Contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/35 pointer-events-none" />
                </motion.div>
              </AnimatePresence>

              {/* Top Glass Badges Bar */}
              <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-white shadow-xs">
                  <span className="font-mono text-[11px] font-bold text-[#FF5A3C]">
                    {current.num}
                  </span>
                  <span className="text-[12px] font-semibold">{current.label} Space</span>
                </div>

                <div
                  className="px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-xs"
                  style={{
                    background: 'rgba(255,255,255,0.88)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.95)',
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-[#FF5A3C] animate-pulse" />
                  <span className="text-[11px] font-bold text-[#17202A]">
                    Commercial space
                  </span>
                </div>
              </div>

              {/* Bottom Overlays: Floating Glass Property Card + Abstract Mini-Map */}
              <div className="relative z-10 pt-20 flex flex-col sm:flex-row items-end justify-between gap-4">
                
                {/* Floating Glass Property Card */}
                <motion.div
                  key={`card-${current.id}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.1 }}
                  className="w-full sm:max-w-[340px] rounded-2xl p-4 sm:p-5 shadow-[0_15px_40px_rgba(20,30,40,0.15)] space-y-3"
                  style={{
                    background: 'rgba(255,255,255,0.88)',
                    backdropFilter: 'blur(18px)',
                    border: '1px solid rgba(255,255,255,0.95)',
                  }}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#EAEAE8]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#FFF0ED] text-[#FF5A3C] flex items-center justify-center">
                        <CurrentIcon size={13} />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">
                        {current.cardTag}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {current.spaceType}
                    </span>
                  </div>

                  <div>
                    <h5 className="text-[16px] font-bold text-[#17202A] leading-tight">
                      {current.cardTitle}
                    </h5>
                    <p className="text-[12px] text-[#667085] mt-0.5">
                      {current.location}
                    </p>
                  </div>

                  {/* Compact Icon Spec Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-semibold text-[#17202A]">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-[#FF5A3C] shrink-0" />
                      <span className="truncate">{current.location.split(',')[0]}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <SlidersHorizontal size={12} className="text-[#FF5A3C] shrink-0" />
                      <span>{current.area}</span>
                    </div>
                  </div>
                </motion.div>

                {/* Abstract Mini-Map Visual Element (Desktop) */}
                <motion.div
                  key={`map-${current.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.45, delay: 0.15 }}
                  className="hidden md:flex flex-col items-start p-3 rounded-2xl shadow-[0_12px_30px_rgba(20,30,40,0.12)] w-44 shrink-0"
                  style={{
                    background: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.9)',
                  }}
                >
                  <div className="w-full h-16 rounded-xl bg-[#F0EFEB] relative overflow-hidden mb-2 border border-[#E7E7E5]">
                    {/* Abstract Stylized Road Network */}
                    <svg className="w-full h-full opacity-60" viewBox="0 0 160 64" fill="none">
                      <path d="M-10 32 H170" stroke="#D1D0CA" strokeWidth="6" />
                      <path d="M80 -10 V74" stroke="#D1D0CA" strokeWidth="5" />
                      <path d="M20 -10 L140 74" stroke="#D1D0CA" strokeWidth="4" />
                      <circle cx="80" cy="32" r="14" fill="#FF5A3C" fillOpacity="0.15" />
                      <circle cx="80" cy="32" r="5" fill="#FF5A3C" />
                    </svg>
                    <div className="absolute top-1 right-1.5 bg-black/50 text-[9px] font-mono text-white px-1.5 py-0.5 rounded backdrop-blur-xs">
                      LOC
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#17202A] truncate w-full block">
                    {current.mapArea}
                  </span>
                  <span className="text-[9px] text-[#667085] block">
                    Verified Commercial Zone
                  </span>
                </motion.div>

              </div>
            </div>
          </div>
        </div>

        {/* ───────── WIDE COMMERCIAL SPACE DOSSIER CARD (Full-width se thoda kam) ───────── */}
        <div className="mt-8 lg:mt-10 max-w-[1180px] mx-auto bg-white rounded-2xl border border-[#E7E7E5] p-6 sm:p-7 shadow-xs">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-center"
            >
              <div className="lg:col-span-7">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF5A3C] block mb-1.5">
                  {current.num} · {current.label} Space
                </span>
                <h3 className="text-[20px] sm:text-[22px] font-bold text-[#17202A] leading-snug">
                  {current.title}
                </h3>
                <p className="text-[13.5px] sm:text-[14px] text-[#667085] leading-relaxed mt-2 font-normal">
                  {current.description}
                </p>
              </div>

              {/* Specs & Commercial Insights Column */}
              <div className="lg:col-span-5 lg:border-l lg:border-[#EAEAE8] lg:pl-8 space-y-3">
                {/* Metadata Specs Row */}
                <div className="grid grid-cols-2 gap-2.5 text-[12px]">
                  <div className="p-2.5 rounded-xl bg-[#FAFAF9] border border-[#EAEAE8]">
                    <span className="text-[10px] text-[#667085] block font-medium">Property Category</span>
                    <span className="font-bold text-[#17202A] truncate block mt-0.5">{current.meta.type}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAFAF9] border border-[#EAEAE8]">
                    <span className="text-[10px] text-[#667085] block font-medium">Space Specification</span>
                    <span className="font-bold text-[#17202A] truncate block mt-0.5">{current.meta.status}</span>
                  </div>
                </div>

                {/* Informational Context Pills */}
                <div className="flex flex-wrap gap-2 text-[11px] font-medium text-[#667085]">
                  <span className="px-2.5 py-1 rounded-lg bg-[#FAFAF9] border border-[#EAEAE8]">
                    01 Workspaces
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#FAFAF9] border border-[#EAEAE8]">
                    02 Retail & Showrooms
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#FAFAF9] border border-[#EAEAE8]">
                    03 Industrial & Logistics
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   09 — SMART TOOLS (Property Decision Toolkit)
   ═══════════════════════════════════════════════════════════════ */

const decisionTools = [
  {
    id: 'loan',
    num: '01',
    title: 'Loan Calculator',
    description: 'Estimate EMI and repayment scenarios.',
    tagline: 'Estimate your monthly repayment.',
    icon: Calculator,
    footerNote: 'Designed to help you explore — not replace professional financial advice.',
  },
  {
    id: 'converter',
    num: '02',
    title: 'Unit Converter',
    description: 'Convert property measurements quickly.',
    tagline: 'Convert property measurements in seconds.',
    icon: ArrowLeftRight,
    footerNote: 'Conversions use standard real-estate metrics and regional Indian land measurements.',
  },
  {
    id: 'insights',
    num: '03',
    title: 'Market Insights',
    description: 'Understand market indicators and trends.',
    tagline: 'Understand the signals around property markets.',
    icon: TrendingUp,
    footerNote: 'Sample market view · Illustrative metrics for property exploration.',
  },
  {
    id: 'dashboard',
    num: '04',
    title: 'Property Dashboard',
    description: 'Organize property information and activity.',
    tagline: 'Keep important property information in one place.',
    icon: LayoutDashboard,
    footerNote: 'GharMB interactive workspace demo · Data is illustrative.',
  },
];

/* ─── TOOL 01: REAL INTERACTIVE LOAN CALCULATOR ─── */
function LoanCalculatorView() {
  const [amount, setAmount] = useState(6000000); // 60 Lakhs
  const [interestRate, setInterestRate] = useState(8.5); // 8.5%
  const [tenureYears, setTenureYears] = useState(20); // 20 years

  // Real EMI Calculation
  const P = amount;
  const r = interestRate / 12 / 100;
  const n = tenureYears * 12;
  const emi =
    r > 0 && n > 0
      ? Math.round((P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1))
      : 0;
  const totalPayment = emi * n;
  const totalInterest = Math.max(0, totalPayment - P);
  const principalPercent = totalPayment > 0 ? Math.round((P / totalPayment) * 100) : 50;
  const interestPercent = 100 - principalPercent;

  const formatLakhs = (val) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(val / 100000).toFixed(1)} Lakhs`;
  };

  return (
    <div className="space-y-6">
      {/* 3 Interactive Range Sliders */}
      <div className="space-y-4">
        {/* Loan Amount */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-semibold text-[#17202A]">Loan Amount</span>
            <span className="font-mono font-bold text-[#FF5A3C] bg-[#FFF0ED] px-2.5 py-0.5 rounded-md border border-[#FF5A3C]/20">
              ₹{amount.toLocaleString('en-IN')} ({formatLakhs(amount)})
            </span>
          </div>
          <input
            type="range"
            min="1000000"
            max="25000000"
            step="500000"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            aria-label="Loan Amount Slider"
            className="w-full h-2 bg-[#F2F2F0] rounded-lg appearance-none cursor-pointer accent-[#FF5A3C]"
          />
          <div className="flex justify-between text-[10px] text-[#667085]">
            <span>₹10 Lakhs</span>
            <span>₹1.25 Cr</span>
            <span>₹2.5 Cr</span>
          </div>
        </div>

        {/* Interest Rate */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-semibold text-[#17202A]">Interest Rate</span>
            <span className="font-mono font-bold text-[#17202A] bg-[#FAFAF9] px-2.5 py-0.5 rounded-md border border-[#E7E7E5]">
              {interestRate.toFixed(1)}% p.a.
            </span>
          </div>
          <input
            type="range"
            min="6.5"
            max="14.0"
            step="0.1"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            aria-label="Interest Rate Slider"
            className="w-full h-2 bg-[#F2F2F0] rounded-lg appearance-none cursor-pointer accent-[#FF5A3C]"
          />
          <div className="flex justify-between text-[10px] text-[#667085]">
            <span>6.5%</span>
            <span>10.0%</span>
            <span>14.0%</span>
          </div>
        </div>

        {/* Loan Tenure */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-semibold text-[#17202A]">Loan Tenure</span>
            <span className="font-mono font-bold text-[#17202A] bg-[#FAFAF9] px-2.5 py-0.5 rounded-md border border-[#E7E7E5]">
              {tenureYears} Years ({tenureYears * 12} Mos)
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="30"
            step="1"
            value={tenureYears}
            onChange={(e) => setTenureYears(Number(e.target.value))}
            aria-label="Loan Tenure Slider"
            className="w-full h-2 bg-[#F2F2F0] rounded-lg appearance-none cursor-pointer accent-[#FF5A3C]"
          />
          <div className="flex justify-between text-[10px] text-[#667085]">
            <span>5 Yrs</span>
            <span>15 Yrs</span>
            <span>30 Yrs</span>
          </div>
        </div>
      </div>

      {/* EMI Result Card & Breakdown */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFAF9] border border-[#E7E7E5] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#EAEAE8]">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">
              Estimated Monthly EMI
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-[26px] sm:text-[30px] font-bold text-[#17202A] tracking-tight">
                ₹{emi.toLocaleString('en-IN')}
              </span>
              <span className="text-[13px] text-[#667085] font-medium">/ month</span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] font-semibold text-[#667085] block">
              Total Amount Payable
            </span>
            <span className="text-[15px] font-bold text-[#17202A]">
              ₹{totalPayment.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Visual Ratio Bar */}
        <div className="space-y-1.5">
          <div className="h-2.5 w-full bg-[#EAEAE8] rounded-full overflow-hidden flex">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${principalPercent}%` }}
              title={`Principal: ${principalPercent}%`}
            />
            <div
              className="h-full bg-[#FF5A3C] transition-all duration-300"
              style={{ width: `${interestPercent}%` }}
              title={`Interest: ${interestPercent}%`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
              <span className="text-[#17202A]">Principal: ₹{P.toLocaleString('en-IN')} ({principalPercent}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A3C] shrink-0" />
              <span className="text-[#17202A]">Interest: ₹{totalInterest.toLocaleString('en-IN')} ({interestPercent}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── TOOL 02: REAL INTERACTIVE UNIT CONVERTER ─── */
function UnitConverterView() {
  const [val, setVal] = useState(1000);
  const [category, setCategory] = useState('area');
  const [fromUnit, setFromUnit] = useState('sqft');

  // Real-Estate Area Unit definitions relative to Sq Feet
  const areaUnits = [
    { key: 'sqft', label: 'Sq Feet', factor: 1 },
    { key: 'sqm', label: 'Sq Meter', factor: 0.092903 },
    { key: 'sqyd', label: 'Sq Yard (Gaj)', factor: 0.111111 },
    { key: 'acre', label: 'Acre', factor: 0.0000229568 },
    { key: 'hectare', label: 'Hectare', factor: 0.0000092903 },
    { key: 'bigha', label: 'Bigha', factor: 0.00003673 },
  ];

  const currentUnit = areaUnits.find((u) => u.key === fromUnit) || areaUnits[0];
  const baseInSqFt = (Number(val) || 0) / currentUnit.factor;

  return (
    <div className="space-y-5">
      {/* Category Pills */}
      <div className="flex items-center gap-1.5 pb-2 border-b border-[#EAEAE8]">
        {['area', 'length', 'volume', 'weight'].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`px-3 py-1 rounded-lg text-[12px] font-bold capitalize transition-colors ${
              category === cat
                ? 'bg-[#FFF0ED] text-[#FF5A3C] border border-[#FF5A3C]/20'
                : 'text-[#667085] hover:bg-[#FAFAF9]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Input Controls */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-[#667085]">Enter Value</label>
          <input
            type="number"
            min="1"
            value={val}
            onChange={(e) => setVal(Math.max(0, Number(e.target.value)))}
            aria-label="Measurement Value Input"
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E7E7E5] text-[15px] font-bold text-[#17202A] focus:outline-none focus:border-[#FF5A3C]"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-[#667085]">Select Unit</label>
          <select
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            aria-label="From Unit Dropdown"
            className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E7E5] text-[13px] font-semibold text-[#17202A] focus:outline-none focus:border-[#FF5A3C]"
          >
            {areaUnits.map((u) => (
              <option key={u.key} value={u.key}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary Highlight Result */}
      <div className="p-4 rounded-2xl bg-[#FFF0ED]/50 border border-[#FF5A3C]/20 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF5A3C]">
            Standard Metric Equivalent
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-[24px] sm:text-[28px] font-bold text-[#17202A]">
              {(baseInSqFt * 0.092903).toFixed(2)}
            </span>
            <span className="text-[13px] font-bold text-[#FF5A3C]">Square Meters</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#FF5A3C] text-white flex items-center justify-center font-bold">
          <ArrowLeftRight size={18} />
        </div>
      </div>

      {/* Instant Equivalent Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {areaUnits
          .filter((u) => u.key !== fromUnit && u.key !== 'sqm')
          .slice(0, 4)
          .map((u) => {
            const converted = (baseInSqFt * u.factor).toFixed(
              u.key === 'acre' || u.key === 'hectare' || u.key === 'bigha' ? 4 : 2
            );
            return (
              <div key={u.key} className="p-3 rounded-xl bg-[#FAFAF9] border border-[#E7E7E5]">
                <span className="text-[10px] font-medium text-[#667085] block truncate">
                  {u.label}
                </span>
                <span className="text-[15px] font-bold text-[#17202A] block mt-0.5">
                  {converted}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

/* ─── TOOL 03: INFORMATIONAL MARKET INSIGHTS ─── */
function MarketInsightsView() {
  return (
    <div className="space-y-4">
      {/* Top Header Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-[#EAEAE8]">
        <div>
          <span className="text-[14px] font-bold text-[#17202A] block">
            Expressway & Noida Corridor Dynamics
          </span>
          <span className="text-[11px] text-[#667085]">
            Sample market view · Illustrative trend
          </span>
        </div>
        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
          ↗ Moderate (+6.8% YoY)
        </span>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid sm:grid-cols-3 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-[#FAFAF9] border border-[#E7E7E5] space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-[#667085]">
            <span>Price Trend</span>
            <TrendingUp size={13} className="text-[#FF5A3C]" />
          </div>
          <span className="text-[18px] font-bold text-[#17202A] block leading-none">
            ₹7,850 <span className="text-[11px] font-normal text-[#667085]">/ sq ft</span>
          </span>
          <div className="h-1.5 w-full bg-[#EAEAE8] rounded-full overflow-hidden mt-1">
            <div className="h-full bg-[#FF5A3C] w-[75%]" />
          </div>
          <span className="text-[10px] text-[#667085] block">Up from ₹7,350 in Q1</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FAFAF9] border border-[#E7E7E5] space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-[#667085]">
            <span>Demand Level</span>
            <Activity size={13} className="text-emerald-600" />
          </div>
          <span className="text-[18px] font-bold text-emerald-700 block leading-none">
            High Intent
          </span>
          <div className="h-1.5 w-full bg-[#EAEAE8] rounded-full overflow-hidden mt-1">
            <div className="h-full bg-emerald-600 w-[85%]" />
          </div>
          <span className="text-[10px] text-[#667085] block">42 Days avg to token</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FAFAF9] border border-[#E7E7E5] space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-[#667085]">
            <span>Active Listings</span>
            <Building2 size={13} className="text-[#FF5A3C]" />
          </div>
          <span className="text-[18px] font-bold text-[#17202A] block leading-none">
            184 Units
          </span>
          <div className="h-1.5 w-full bg-[#EAEAE8] rounded-full overflow-hidden mt-1">
            <div className="h-full bg-amber-500 w-[60%]" />
          </div>
          <span className="text-[10px] text-[#667085] block">Across 6 Sectors</span>
        </div>
      </div>

      {/* Locality Growth Corridor */}
      <div className="p-3.5 rounded-2xl bg-white border border-[#E7E7E5] space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block">
          Key Growth Corridors (Sample View)
        </span>
        <div className="grid sm:grid-cols-2 gap-2 text-[12px]">
          <div className="p-2 rounded-xl bg-[#FAFAF9] border border-[#EAEAE8] flex items-center justify-between">
            <span className="font-semibold text-[#17202A]">Sector 150 (Expressway)</span>
            <span className="text-[10px] font-bold text-[#FF5A3C]">High Activity</span>
          </div>
          <div className="p-2 rounded-xl bg-[#FAFAF9] border border-[#EAEAE8] flex items-center justify-between">
            <span className="font-semibold text-[#17202A]">Sector 62 (Corporate Hub)</span>
            <span className="text-[10px] font-bold text-emerald-700">Stable Yield</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── TOOL 04: PROPERTY DASHBOARD CONSOLE ─── */
function PropertyDashboardView() {
  return (
    <div className="space-y-4">
      {/* Property Dossier Card */}
      <div className="p-3.5 rounded-2xl bg-[#FAFAF9] border border-[#E7E7E5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-border shadow-xs">
            <img
              src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=200&h=200&fit=crop&q=80"
              alt="Skyline Heights"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-[#17202A]">Skyline Heights</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Verified
              </span>
            </div>
            <p className="text-[12px] text-[#667085]">Sector 62, Noida · Expressway</p>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#17202A] mt-0.5">
              <span>3 BHK</span>
              <span>·</span>
              <span>1,480 sq ft</span>
              <span>·</span>
              <span className="text-[#FF5A3C] font-bold">₹1.25 Cr</span>
            </div>
          </div>
        </div>

        <span className="text-[10px] font-mono text-[#667085] bg-white border border-[#E7E7E5] px-2 py-1 rounded">
          #GBM-CONSOLE-DEMO
        </span>
      </div>

      {/* Engagement Activity Row */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-xl bg-white border border-[#E7E7E5] shadow-xs">
          <span className="text-[10px] font-semibold text-[#667085] block">Views</span>
          <span className="text-[18px] font-bold text-[#17202A]">156</span>
          <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">+24 today</span>
        </div>
        <div className="p-3 rounded-xl bg-white border border-[#E7E7E5] shadow-xs">
          <span className="text-[10px] font-semibold text-[#667085] block">Shortlisted</span>
          <span className="text-[18px] font-bold text-[#FF5A3C]">23</span>
          <span className="text-[10px] text-[#667085] block mt-0.5">High Intent</span>
        </div>
        <div className="p-3 rounded-xl bg-white border border-[#E7E7E5] shadow-xs">
          <span className="text-[10px] font-semibold text-[#667085] block">Enquiries</span>
          <span className="text-[18px] font-bold text-emerald-700">12</span>
          <span className="text-[10px] text-[#667085] block mt-0.5">3 Token Req</span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="p-3 rounded-2xl bg-white border border-[#E7E7E5] space-y-2 text-[12px]">
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAFAF9] border border-[#EAEAE8]">
          <span className="font-semibold text-[#17202A]">Token Escrow Verification Request</span>
          <span className="text-[10px] font-bold text-[#FF5A3C] bg-[#FFF0ED] px-2 py-0.5 rounded">
            Action Needed
          </span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAFAF9] border border-[#EAEAE8]">
          <span className="font-semibold text-[#17202A]">Property Title & RERA Clearance Dossier</span>
          <span className="text-[10px] font-bold text-emerald-700">Audit Complete</span>
        </div>
      </div>
    </div>
  );
}

function SmartTools() {
  const [activeTool, setActiveTool] = useState(0);
  const current = decisionTools[activeTool];

  // Keyboard navigation for accessibility
  const handleKeyDown = (e, idx) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveTool((idx + 1) % decisionTools.length);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveTool((idx - 1 + decisionTools.length) % decisionTools.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveTool(idx);
    }
  };

  return (
    <section
      id="tools"
      className="relative py-24 sm:py-28 lg:py-36 overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 35% 50%, rgba(255,90,60,0.035) 0%, transparent 45%), #FCFCFB',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
        {/* ───────── MOBILE-ONLY INTRO & TOOL RAIL (< lg) ───────── */}
        <div className="lg:hidden mb-8">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0ED] border border-[#FF5A3C]/20 text-[11px] font-bold text-[#FF5A3C] uppercase tracking-[0.16em] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
              <span>Tools</span>
            </div>
          </Reveal>

          <Reveal delay={1}>
            <h2 className="text-[30px] sm:text-[38px] lg:text-[44px] font-bold text-[#17202A] leading-[1.1] tracking-[-0.03em] mb-3.5">
              Tools that make property decisions <span className="text-[#FF5A3C]">clearer.</span>
            </h2>
          </Reveal>

          <Reveal delay={2}>
            <p className="text-[15px] sm:text-[16.5px] text-[#667085] leading-[1.65] font-normal mb-6">
              Simple, useful tools designed to help you calculate, compare and understand
              real estate with more clarity.
            </p>
          </Reveal>

          {/* Mobile Horizontal Scrolling Tabs */}
          <div
            role="tablist"
            aria-label="Property Decision Tools"
            className="flex items-center gap-2 overflow-x-auto pb-2 -mx-5 px-5 sm:mx-0 sm:px-0 no-scrollbar"
          >
            {decisionTools.map((tool, idx) => {
              const Icon = tool.icon;
              const isActive = activeTool === idx;
              return (
                <button
                  key={tool.id}
                  role="tab"
                  id={`tool-tab-m-${tool.id}`}
                  aria-selected={isActive}
                  aria-controls={`tool-panel-${tool.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveTool(idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#FFF0ED] border border-[#FF5A3C]/30 text-[#17202A] shadow-xs'
                      : 'bg-white border border-[#E7E7E5] text-[#667085] hover:bg-[#FAFAF9]'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-[#FF5A3C] text-white' : 'bg-[#F2F2F0] text-[#667085]'
                    }`}
                  >
                    <Icon size={13} />
                  </div>
                  <span>{tool.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ───────── MAIN TWO-COLUMN LAYOUT (Desktop: 40% / 60%) ───────── */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-start">
          
          {/* ────── LEFT COLUMN: INTRO + VERTICAL TOOL SELECTOR (col-span-5) ────── */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Desktop Section Intro */}
            <div className="hidden lg:block space-y-3">
              <Reveal>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0ED] border border-[#FF5A3C]/20 text-[11px] font-bold text-[#FF5A3C] uppercase tracking-[0.16em] mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
                  <span>Tools</span>
                </div>
              </Reveal>

              <Reveal delay={1}>
                <h2 className="text-[30px] sm:text-[38px] lg:text-[44px] font-bold text-[#17202A] leading-[1.1] tracking-[-0.03em] mb-3.5">
                  Tools that make property decisions <span className="text-[#FF5A3C]">clearer.</span>
                </h2>
              </Reveal>

              <Reveal delay={2}>
                <p className="text-[15px] sm:text-[16.5px] text-[#667085] leading-[1.65] font-normal">
                  Simple, useful tools designed to help you calculate, compare and understand
                  real estate with more clarity.
                </p>
              </Reveal>
            </div>

            {/* Desktop Vertical Tab Navigation */}
            <div
              role="tablist"
              aria-label="Decision Toolkit Navigation"
              className="hidden lg:flex flex-col space-y-3 relative"
            >
              {decisionTools.map((tool, idx) => {
                const Icon = tool.icon;
                const isActive = activeTool === idx;

                return (
                  <button
                    key={tool.id}
                    role="tab"
                    id={`tool-tab-${tool.id}`}
                    aria-selected={isActive}
                    aria-controls={`tool-panel-${tool.id}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => setActiveTool(idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    className={`w-full text-left p-4 sm:p-4.5 rounded-[20px] transition-all duration-200 cursor-pointer relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A3C] ${
                      isActive
                        ? 'bg-[#FFF0ED] border-2 border-[#FF5A3C]/40 shadow-[0_8px_24px_rgba(255,90,60,0.12)]'
                        : 'bg-white border border-[#E7E7E5] shadow-[0_2px_10px_rgba(20,30,40,0.03)] hover:border-[#FF5A3C]/35 hover:shadow-[0_6px_20px_rgba(20,30,40,0.06)] hover:bg-[#FAFAF9]'
                    }`}
                  >
                    {/* Animated Coral Indicator Bar on Left */}
                    {isActive && (
                      <motion.div
                        layoutId="toolActiveIndicator"
                        className="absolute left-0 top-3.5 bottom-3.5 w-1.5 bg-[#FF5A3C] rounded-r-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}

                    <div className="flex items-center gap-3.5 pl-1">
                      {/* Rich Icon Container */}
                      <div
                        className={`w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 transition-all duration-200 ${
                          isActive
                            ? 'bg-[#FF5A3C] text-white shadow-[0_4px_14px_rgba(255,90,60,0.35)]'
                            : 'bg-[#F5F5F3] border border-[#EAEAEC] text-[#667085] group-hover:bg-[#FFF0ED] group-hover:text-[#FF5A3C] group-hover:border-[#FF5A3C]/20'
                        }`}
                      >
                        <Icon size={18} strokeWidth={2} />
                      </div>

                      {/* Title & Description */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span
                            className={`text-[15.5px] font-bold transition-colors leading-tight ${
                              isActive ? 'text-[#17202A]' : 'text-[#27272A] group-hover:text-[#17202A]'
                            }`}
                          >
                            {tool.title}
                          </span>
                          <span
                            className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                              isActive
                                ? 'bg-white border border-[#FF5A3C]/25 text-[#FF5A3C] shadow-xs'
                                : 'bg-[#F2F2F0] border border-[#E7E7E5] text-[#667085] group-hover:text-[#17202A]'
                            }`}
                          >
                            {tool.num}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#667085] leading-normal">
                          {tool.description}
                        </p>
                      </div>

                      {/* Right Chevron Indicator */}
                      <div className="shrink-0 text-[#D0D0CE] group-hover:text-[#FF5A3C] transition-colors">
                        <ChevronRight
                          size={16}
                          className={`transition-transform duration-200 ${
                            isActive ? 'text-[#FF5A3C] translate-x-0.5' : 'group-hover:translate-x-1'
                          }`}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ────── RIGHT COLUMN: INTERACTIVE TOOL WORKSPACE (65% / col-span-7) ────── */}
          <div className="lg:col-span-7 relative lg:pt-14 xl:pt-16">
            
            {/* Desktop Floating Glass Accent Badge */}
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="hidden sm:block absolute -top-3.5 -right-2 z-20"
            >
              <div
                className="px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-[0_12px_30px_rgba(20,30,40,0.08)]"
                style={{
                  background: 'rgba(255,255,255,0.88)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.95)',
                }}
              >
                <Sparkles size={13} className="text-[#FF5A3C]" />
                <span className="text-[11px] font-bold text-[#17202A]">
                  Property-Ready Toolkit
                </span>
              </div>
            </motion.div>

            {/* Main Application Workspace Card */}
            <div
              id={`tool-panel-${current.id}`}
              role="tabpanel"
              aria-labelledby={`tool-tab-${current.id}`}
              className="bg-white rounded-[28px] border border-[#E7E7E5] shadow-[0_30px_80px_rgba(20,30,40,0.08)] p-6 sm:p-8 lg:p-9 relative"
            >
              {/* Workspace Top Header */}
              <div className="flex items-start justify-between gap-3 pb-4 mb-6 border-b border-[#EAEAE8]">
                <div>
                  <h3 className="text-[18px] sm:text-[20px] font-bold text-[#17202A] leading-tight">
                    {current.title}
                  </h3>
                  <p className="text-[12px] sm:text-[13px] text-[#667085] mt-0.5">
                    {current.tagline}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] sm:text-[11px] font-bold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Tool ready
                </span>
              </div>

              {/* Dynamic Interactive Tool Content Area */}
              <div className="min-h-[300px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.id}
                    initial={{ opacity: 0, scale: 0.98, x: 12 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.98, x: -12 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  >
                    {activeTool === 0 && <LoanCalculatorView />}
                    {activeTool === 1 && <UnitConverterView />}
                    {activeTool === 2 && <MarketInsightsView />}
                    {activeTool === 3 && <PropertyDashboardView />}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Workspace Bottom Footer Note */}
              <div className="mt-6 pt-4 border-t border-border-soft flex items-center justify-between text-[11px] text-[#667085]">
                <span>{current.footerNote}</span>
                <span className="hidden sm:inline-block font-mono text-[10px] text-[#667085]/70">
                  GHARMB-CALC-v2
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   10 — INSIGHTS (Editorial Knowledge Hub)
   ═══════════════════════════════════════════════════════════════ */

function InsightImage({ src, alt, className = "", aspectClass = "" }) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div className={`w-full h-full min-h-[180px] flex flex-col items-center justify-center bg-[#F8F8F6] border border-[#E7E7E5] text-[#667085] p-6 text-center ${aspectClass}`}>
        <div className="w-10 h-10 rounded-full bg-[#FFF0ED] text-[#FF5A3C] flex items-center justify-center mb-2.5 shadow-xs">
          <BookOpen size={18} />
        </div>
        <span className="text-[12px] font-semibold text-[#17202A] tracking-tight">GharMB</span>
        <span className="text-[11px] text-[#667085] mt-0.5">Image preview unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}

function Insights() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [categories, setCategories] = useState([{ name: "All", slug: "" }]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return "Recent";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Load categories from API
  useEffect(() => {
    async function loadCats() {
      const apiCats = await fetchActiveCategories();
      if (apiCats && apiCats.length > 0) {
        setCategories([{ name: "All", slug: "" }, ...apiCats]);
      }
    }
    loadCats();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch articles from API
  useEffect(() => {
    let isMounted = true;
    async function loadArticles() {
      setIsLoading(true);
      const activeCatObj = categories.find(c => c.name === activeCategory);
      const catParam = activeCatObj && activeCatObj.slug ? activeCatObj.slug : "";
      const res = await fetchPublishedBlogs({ limit: 12, category: catParam, search: debouncedSearch });
      if (isMounted) {
        setArticles(res.blogs || []);
        setIsLoading(false);
      }
    }
    loadArticles();
    return () => { isMounted = false; };
  }, [activeCategory, debouncedSearch]);

  // Only treat as featured if explicitly marked isFeatured: true
  const featuredArticle = articles.find((a) => Boolean(a.isFeatured));
  const cardArticles = featuredArticle
    ? articles.filter((a) => (a._id || a.id) !== (featuredArticle._id || featuredArticle.id)).slice(0, 3)
    : articles.slice(0, 3);

  const getCategoryName = (cat) => {
    if (typeof cat === 'object' && cat !== null) return cat.name;
    return cat || 'Insights';
  };

  const getReadTime = (art) => {
    if (art?.readTime) return `${art.readTime} min read`;
    return art?.readingTime || '5 min read';
  };

  const getImageSrc = (art) => {
    return art?.bannerImage || art?.coverImage || art?.image || 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1000&h=600&fit=crop';
  };

  return (
    <Section id="insights" className="py-20 sm:py-24 lg:py-32" bg="bg-[#FCFCFB]">
      {/* ── 04 SECTION HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10 lg:mb-12">
        <div className="max-w-2xl">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0ED] border border-[#FF5A3C]/20 text-[11px] font-bold text-[#FF5A3C] uppercase tracking-[0.16em] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
              <span>Insights</span>
            </div>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="text-[30px] sm:text-[38px] lg:text-[44px] font-bold text-[#17202A] leading-[1.1] tracking-[-0.03em] mb-3.5">
              Real estate, <span className="text-[#FF5A3C]">explained simply.</span>
            </h2>
          </Reveal>
          <Reveal delay={2}>
            <p className="text-[15px] sm:text-[16.5px] text-[#667085] leading-[1.65] font-normal">
              Practical guides, market explainers and useful perspectives to help you understand real estate with more clarity.
            </p>
          </Reveal>
        </div>

        <Reveal delay={2}>
          <Link
            to="/insights"
            className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#FF5A3C] hover:text-[#E04F34] transition-colors group shrink-0 self-start lg:self-end pb-1 border-b border-transparent hover:border-[#FF5A3C]"
          >
            <span>View all insights</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </Reveal>
      </div>

      {/* ── 05 CATEGORY NAVIGATION & 16 INSIGHT SEARCH ── */}
      <Reveal delay={3}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 lg:mb-12 pb-5 border-b border-[#E7E7E5]">
          {/* Horizontal Category Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none no-scrollbar -mx-5 px-5 md:mx-0 md:px-0">
            {categories.map((cat, idx) => {
              const isActive = activeCategory === cat.name;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-[#FFF0ED] text-[#FF5A3C] border border-[#FF5A3C]/30 shadow-xs font-semibold"
                      : "bg-white text-[#667085] border border-[#E7E7E5] hover:text-[#17202A] hover:border-[#17202A]/20"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Compact Search Control */}
          <div className="relative w-full md:w-64 lg:w-72 shrink-0">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#667085] pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search insights"
              className="w-full pl-9 pr-8 py-2 bg-white border border-[#E7E7E5] rounded-full text-[13px] text-[#17202A] placeholder:text-[#667085] focus:outline-none focus:border-[#FF5A3C] focus:ring-1 focus:ring-[#FF5A3C]/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#17202A] p-0.5"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </Reveal>

      {/* ── ARTICLE CONTENT CONTAINER (Animated on Filter Change) ── */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div key="loading" className="py-16 grid md:grid-cols-2 gap-6 lg:gap-10 animate-pulse bg-white border border-[#E7E7E5] rounded-[24px] p-6">
            <div className="aspect-[16/10] bg-slate-100 rounded-[18px]" />
            <div className="space-y-4 py-2">
              <div className="w-24 h-4 bg-slate-100 rounded" />
              <div className="w-full h-8 bg-slate-100 rounded" />
              <div className="w-full h-12 bg-slate-100 rounded" />
            </div>
          </div>
        ) : articles.length === 0 ? (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="py-16 text-center bg-[#F8F8F6] border border-[#E7E7E5] rounded-3xl p-8 mb-16"
          >
            <div className="w-12 h-12 rounded-full bg-[#FFF0ED] text-[#FF5A3C] flex items-center justify-center mx-auto mb-3">
              <Search size={20} />
            </div>
            <h3 className="text-lg font-bold text-[#17202A] mb-1">No insights found</h3>
            <p className="text-sm text-[#667085] mb-5 max-w-sm mx-auto">
              {searchQuery
                ? `We couldn't find any articles matching "${searchQuery}".`
                : "No articles published yet. Check back soon!"}
            </p>
            {(searchQuery || activeCategory !== "All") && (
              <button
                onClick={() => {
                  setActiveCategory("All");
                  setSearchQuery("");
                }}
                className="px-4 py-2 text-xs font-semibold text-[#FF5A3C] bg-white border border-[#E7E7E5] hover:border-[#FF5A3C]/40 rounded-full transition-colors cursor-pointer"
              >
                Reset filters & search
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key={`${activeCategory}-${debouncedSearch}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-14 lg:space-y-16"
          >
            {/* ── 06 & 07 & 08 FEATURED INSIGHT (Only when isFeatured is true) ── */}
            {featuredArticle && (
              <div>
                <Link
                  to={`/insights/${featuredArticle.slug}`}
                  className="group block bg-white border border-[#E7E7E5] hover:border-[#FF5A3C]/35 rounded-[24px] p-4 sm:p-6 lg:p-7 transition-all duration-300 shadow-xs hover:shadow-md min-w-0 w-full"
                >
                  <div className="grid lg:grid-cols-[1.38fr_1fr] gap-6 lg:gap-10 items-center min-w-0">
                    {/* Left: Large Editorial Image (16:10 aspect ratio) */}
                    <div className="aspect-[16/10] sm:aspect-[16/10] w-full min-w-0 rounded-[18px] sm:rounded-[20px] overflow-hidden bg-[#F8F8F6] relative">
                      <InsightImage
                        src={getImageSrc(featuredArticle)}
                        alt={featuredArticle.title}
                        className="w-full h-full object-cover group-hover:scale-[1.025] transition-transform duration-500 ease-out"
                        aspectClass="aspect-[16/10]"
                      />
                    </div>

                    {/* Right: Article Information */}
                    <div className="flex flex-col justify-center py-1 sm:py-2 min-w-0 w-full">
                      <div className="flex items-center gap-2.5 mb-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FFF0ED] text-[#FF5A3C] border border-[#FF5A3C]/20">
                          FEATURED
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#667085]">
                          {getCategoryName(featuredArticle.category)}
                        </span>
                      </div>

                      <h3 className="text-[22px] sm:text-[28px] lg:text-[32px] font-bold text-[#17202A] leading-[1.2] tracking-[-0.02em] group-hover:text-[#FF5A3C] transition-colors mb-3 line-clamp-3 break-words [overflow-wrap:anywhere]">
                        {featuredArticle.title}
                      </h3>

                      <p className="text-[14px] sm:text-[15px] text-[#667085] leading-[1.65] line-clamp-3 mb-6 break-words [overflow-wrap:anywhere]">
                        {featuredArticle.excerpt}
                      </p>

                      <div className="flex items-center gap-3 text-[12px] text-[#667085] mb-6 pt-4 border-t border-[#E7E7E5] flex-wrap">
                        <span className="font-semibold text-[#17202A] uppercase tracking-wider text-[11px]">
                          {getCategoryName(featuredArticle.category)}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-[#667085]/40" />
                        <span>{getReadTime(featuredArticle)}</span>
                        <span className="w-1 h-1 rounded-full bg-[#667085]/40" />
                        <span>{formatDate(featuredArticle.publishedAt || featuredArticle.createdAt)}</span>
                      </div>

                      <div className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#FF5A3C] group-hover:text-[#E04F34] transition-colors">
                        <span>Read article</span>
                        <ArrowRight
                          size={16}
                          className="group-hover:translate-x-[5px] transition-transform duration-300 ease-out"
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* ── 10 & 11 EDITORIAL ARTICLE ROW ("More from GharMB") ── */}
            {cardArticles.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <div>
                    <h3 className="text-[18px] sm:text-[20px] font-bold text-[#17202A] tracking-[-0.01em]">
                      {featuredArticle ? 'More from GharMB' : 'Latest Insights & Perspectives'}
                    </h3>
                    <p className="text-[13px] text-[#667085] mt-0.5">
                      Essential perspectives for buyers, owners and investors
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
                  {cardArticles.map((article) => (
                    <Link
                      key={article._id || article.id || article.slug}
                      to={`/insights/${article.slug}`}
                      className="group flex flex-col bg-white rounded-[18px] border border-[#E7E7E5] overflow-hidden hover:border-[#FF5A3C]/45 hover:shadow-sm transition-all duration-300 min-w-0 w-full"
                    >
                      {/* Image: 16:9 Aspect Ratio */}
                      <div className="aspect-[16/9] w-full min-w-0 overflow-hidden bg-[#F8F8F6] relative border-b border-[#E7E7E5]/70">
                        <InsightImage
                          src={getImageSrc(article)}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-[1.025] transition-transform duration-500 ease-out"
                          aspectClass="aspect-[16/9]"
                        />
                      </div>

                      {/* Card Content */}
                      <div className="p-5 sm:p-6 flex flex-col flex-1 min-w-0">
                        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#FF5A3C] mb-2 block">
                          {getCategoryName(article.category)}
                        </span>

                        <h4 className="text-[17px] sm:text-[18px] font-bold text-[#17202A] leading-snug group-hover:text-[#FF5A3C] transition-colors mb-2.5 line-clamp-2 break-words [overflow-wrap:anywhere]">
                          {article.title}
                        </h4>

                        <p className="text-[13.5px] text-[#667085] leading-[1.6] line-clamp-2 mb-5 flex-1 break-words [overflow-wrap:anywhere]">
                          {article.excerpt}
                        </p>

                        <div className="flex items-center justify-between pt-3.5 border-t border-[#E7E7E5] text-[12px] text-[#667085]">
                          <span>{getReadTime(article)}</span>
                          <span className="inline-flex items-center gap-1 text-[13px] font-medium text-[#FF5A3C] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200">
                            Read <ArrowRight size={13} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FINAL SECTION CTA ── */}
      <div className="mt-14 sm:mt-16 bg-white border border-[#E7E7E5] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
        <div>
          <h4 className="text-[17px] sm:text-[19px] font-bold text-[#17202A]">
            Understand real estate with more clarity.
          </h4>
          <p className="text-[13.5px] text-[#667085] mt-0.5">
            Read comprehensive guides, regulatory analysis, and market intelligence reports.
          </p>
        </div>

        <Link
          to="/insights"
          className="inline-flex items-center justify-center gap-2 bg-[#FF5A3C] hover:bg-[#E04F34] text-white text-[13.5px] font-semibold px-6 py-2.5 rounded-xl transition-all shadow-xs hover:shadow-sm shrink-0"
        >
          <span>Explore all insights</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    </Section>
  );
}


/* ═══════════════════════════════════════════════════════════════
   11 — HOW IT WORKS (Interactive Journey, Testimonials & FAQ)
   ═══════════════════════════════════════════════════════════════ */

const journeyStages = [
  {
    num: "01",
    id: "discover",
    title: "Discover",
    subtitle: "Find the right information before making a decision.",
    description: "Explore verified properties, projects and commercial spaces with structured information that makes comparison easier and eliminates duplicate or fake listings.",
    features: [
      "Structured property information",
      "Precise location & micro-market data",
      "Master project blueprints & specifications",
      "High-precision search & budget filters"
    ],
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&h=800&fit=crop",
    floatingBadges: [
      {
        pos: "top-left",
        icon: "check",
        title: "Skyline Heights · Sector 62, Noida",
        subtitle: "Verified Listing · Ready for Handover"
      },
      {
        pos: "bottom-right",
        icon: "info",
        title: "3 BHK Luxury Flat · 1,480 sq ft",
        subtitle: "₹1.25 Cr · 84% Carpet Efficiency"
      }
    ]
  },
  {
    num: "02",
    id: "explore",
    title: "Explore",
    subtitle: "Understand the space inside out.",
    description: "Dive deep into verified floor plans, unit dimensions, carpet area ratios, and neighborhood growth trends before investing time in physical site visits.",
    features: [
      "Carpet vs Super Built-up transparency",
      "Interactive high-res floor plans",
      "Locality price indices & 5-year growth",
      "Developer delivery track record"
    ],
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&h=800&fit=crop",
    floatingBadges: [
      {
        pos: "top-right",
        icon: "layers",
        title: "Floor Plan Intelligence",
        subtitle: "100% Usable Space Breakdown"
      },
      {
        pos: "bottom-left",
        icon: "trend",
        title: "Micro-Market Index: +8.4% YoY",
        subtitle: "High Rental Demand Corridor"
      }
    ]
  },
  {
    num: "03",
    id: "verify",
    title: "Verify",
    subtitle: "Check the legal and regulatory foundation.",
    description: "Review RERA certificates, sanctioned municipal building plans, land encumbrance statuses, and escrow compliance in one transparent dashboard.",
    features: [
      "State RERA registration validation",
      "Sanctioned building layout checklist",
      "Title deed & encumbrance review",
      "Dedicated project escrow monitoring"
    ],
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=800&fit=crop",
    floatingBadges: [
      {
        pos: "top-left",
        icon: "shield",
        title: "RERA: UPRERAPRJ12345",
        subtitle: "State Approved & Escrow Active"
      },
      {
        pos: "bottom-right",
        icon: "check",
        title: "Legal Due Diligence",
        subtitle: "7/7 Compliance Checks Cleared"
      }
    ]
  },
  {
    num: "04",
    id: "connect",
    title: "Connect",
    subtitle: "Direct, transparent professional access.",
    description: "Connect directly with authorized builders, vetted neighborhood specialists, and genuine owners without spam calls or unwanted middlemen.",
    features: [
      "Direct developer sales desks",
      "Vetted, certified area specialists",
      "Zero spam direct enquiry channels",
      "Instant site visit appointment scheduling"
    ],
    image: "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&h=800&fit=crop",
    floatingBadges: [
      {
        pos: "top-right",
        icon: "users",
        title: "Authorized Developer Desk",
        subtitle: "Direct Pricing · No Brokerage"
      },
      {
        pos: "bottom-left",
        icon: "calendar",
        title: "Site Visit Scheduled",
        subtitle: "Tomorrow at 11:00 AM"
      }
    ]
  },
  {
    num: "05",
    id: "decide",
    title: "Decide",
    subtitle: "Make your move with total confidence.",
    description: "Leverage unit-to-unit comparison tables, total cost loan estimators, and structured negotiation assistance to close your purchase with peace of mind.",
    features: [
      "Side-by-side unit comparison matrix",
      "Total cost & stamp duty calculator",
      "Digital token & documentation assistance",
      "Complete post-booking milestone tracker"
    ],
    image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&h=800&fit=crop",
    floatingBadges: [
      {
        pos: "top-left",
        icon: "check",
        title: "Decision Matrix: 96% Match",
        subtitle: "Fits Budget, Location & Timeline"
      },
      {
        pos: "bottom-right",
        icon: "calculator",
        title: "Total Cost Verified",
        subtitle: "Stamp Duty & Registration Included"
      }
    ]
  }
];


function HowItWorks() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeFaqCategory, setActiveFaqCategory] = useState("All");
  const [openFaq, setOpenFaq] = useState(null);
  const [faqQuery, setFaqQuery] = useState("");
  const [isTestimonialHovered, setIsTestimonialHovered] = useState(false);
  
  // Dynamic FAQ State
  const [faqCategories, setFaqCategories] = useState(["All"]);
  const [faqData, setFaqData] = useState([]);
  const [isFaqLoading, setIsFaqLoading] = useState(true);

  // Dynamic Testimonial State
  const [testimonials, setTestimonials] = useState([]);
  const [isTestimonialsLoading, setIsTestimonialsLoading] = useState(true);
  const [testimonialsError, setTestimonialsError] = useState(false);

  // Fetch FAQ & Testimonials Data
  useEffect(() => {
    const fetchData = async () => {
      setIsFaqLoading(true);
      setIsTestimonialsLoading(true);
      setTestimonialsError(false);
      try {
        const [catRes, faqRes, testRes] = await Promise.all([
          fetch(`${API_BASE_URL}/faqs/categories`).then(res => res.json()).catch(() => ({})),
          fetch(`${API_BASE_URL}/faqs`).then(res => res.json()).catch(() => ({})),
          fetch(`${API_BASE_URL}/testimonials`).then(res => res.json()).catch(() => ({ error: true }))
        ]);

        if (catRes.status === 'success' && catRes.data?.categories) {
          const fetchedCategories = ["All", ...catRes.data.categories.map(c => c.name)];
          setFaqCategories(fetchedCategories);
        }

        if (faqRes.status === 'success' && faqRes.data?.faqs) {
          // Map backend format to frontend format
          const formattedFaqs = faqRes.data.faqs.map((faq, index) => ({
            id: String(index + 1).padStart(2, '0'),
            dbId: faq._id,
            category: faq.category?.name || "Uncategorized",
            question: faq.question,
            answer: faq.answer
          }));
          setFaqData(formattedFaqs);
          if (formattedFaqs.length > 0) {
            setOpenFaq(formattedFaqs[0].id); // Open first by default
          }
        }
        
        if (testRes.status === 'success' && testRes.data?.testimonials) {
          setTestimonials(testRes.data.testimonials);
        } else if (testRes.error) {
          setTestimonialsError(true);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setTestimonialsError(true);
      } finally {
        setIsFaqLoading(false);
        setIsTestimonialsLoading(false);
      }
    };

    fetchData();
  }, []);

  const currentStep = journeyStages[activeStepIndex];

  // Auto-advance testimonials (6s autoplay, paused on hover/interaction)
  useEffect(() => {
    if (isTestimonialHovered || testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isTestimonialHovered, testimonials.length]);

  const filteredFaqs = faqData.filter((item) => {
    const matchesCategory = activeFaqCategory === "All" || item.category === activeFaqCategory;
    if (!faqQuery.trim()) return matchesCategory;
    const q = faqQuery.toLowerCase();
    const matchesSearch =
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <Section id="how-it-works" className="py-20 sm:py-24 lg:py-32" bg="bg-[#FCFCFB]">
      {/* ── 01 SECTION HEADER (LEFT ALIGNED) ── */}
      <div className="mb-10 lg:mb-12 text-left max-w-2xl">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0ED] border border-[#FF5A3C]/20 text-[11px] font-bold text-[#FF5A3C] uppercase tracking-[0.16em] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
            <span>How It Works</span>
          </div>
        </Reveal>
        <Reveal delay={1}>
          <h2 className="text-[30px] sm:text-[38px] lg:text-[44px] font-bold text-[#17202A] leading-[1.1] tracking-[-0.03em] mb-3.5 text-left">
            From discovery to <span className="text-[#FF5A3C]">confident decisions.</span>
          </h2>
        </Reveal>
        <Reveal delay={2}>
          <p className="text-[15px] sm:text-[16.5px] text-[#667085] leading-[1.65] font-normal text-left">
            Five connected stages designed to make the property journey transparent, structured and easier to understand.
          </p>
        </Reveal>
      </div>

      {/* ── 02 INTERACTIVE JOURNEY STEPPER & CARD ── */}
      <div className="mb-14 sm:mb-18 text-left">
        {/* Stepper Navigation (Left Aligned) */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-3 scrollbar-none no-scrollbar justify-start -mx-5 px-5 md:mx-0 md:px-0 mb-6 sm:mb-8">
          {journeyStages.map((stage, idx) => {
            const isActive = activeStepIndex === idx;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStepIndex(idx)}
                className={`flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-[13px] sm:text-[14px] font-medium transition-all duration-200 shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-white text-[#17202A] border-2 border-[#FF5A3C] shadow-xs font-semibold"
                    : "bg-white text-[#64748B] border border-[#E7E7E5] hover:text-[#17202A] hover:border-[#17202A]/20"
                }`}
              >
                <span
                  className={`font-mono text-[12px] font-bold ${
                    isActive ? "text-[#FF5A3C]" : "text-[#64748B]"
                  }`}
                >
                  {stage.num}
                </span>
                <span>{stage.title}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Split-Screen Step Experience */}
        <div className="bg-white border border-[#E7E7E5] rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 lg:p-10 shadow-xs overflow-hidden text-left">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="grid lg:grid-cols-[0.88fr_1.12fr] gap-8 lg:gap-12 items-center text-left"
            >
              {/* Left Column: Content */}
              <div className="space-y-5 text-left">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-[#FFF1ED] text-[#FF5A3C] font-mono font-bold text-[13px] flex items-center justify-center border border-[#FF5A3C]/20">
                    {currentStep.num}
                  </span>
                  <span className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#FF5A3C]">
                    STAGE {currentStep.num} · {currentStep.title.toUpperCase()}
                  </span>
                </div>

                <h4 className="text-[22px] sm:text-[26px] lg:text-[28px] font-bold text-[#17202A] leading-[1.25] tracking-tight text-left">
                  &ldquo;{currentStep.subtitle}&rdquo;
                </h4>

                <p className="text-[14px] sm:text-[15px] text-[#64748B] leading-[1.65] text-left">
                  {currentStep.description}
                </p>

                {/* Feature List */}
                <div className="pt-2 space-y-2.5 text-left">
                  {currentStep.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-[13.5px] text-[#17202A]">
                      <div className="w-4.5 h-4.5 rounded-full bg-[#16A66A]/10 text-[#16A66A] flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span className="font-medium text-left">{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Navigation controls */}
                <div className="pt-3 flex items-center gap-3">
                  <button
                    onClick={() =>
                      setActiveStepIndex((prev) =>
                        prev === 0 ? journeyStages.length - 1 : prev - 1
                      )
                    }
                    className="px-3.5 py-1.5 rounded-xl bg-[#F8F8F6] border border-[#E7E7E5] text-[12.5px] font-semibold text-[#17202A] hover:border-[#FF5A3C]/40 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={() =>
                      setActiveStepIndex((prev) =>
                        prev === journeyStages.length - 1 ? 0 : prev + 1
                      )
                    }
                    className="px-3.5 py-1.5 rounded-xl bg-[#FF5A3C] text-white text-[12.5px] font-semibold hover:bg-[#E04F34] transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>Next: {journeyStages[(activeStepIndex + 1) % journeyStages.length].title}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Right Column: Visual Panel with Floating UI */}
              <div className="relative aspect-[4/3] sm:aspect-[16/10] rounded-[20px] overflow-hidden border border-[#E7E7E5] bg-[#F8F8F6]">
                <motion.img
                  key={currentStep.image}
                  src={currentStep.image}
                  alt={currentStep.title}
                  initial={{ scale: 0.98, opacity: 0.85 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full object-cover"
                />

                {/* Subtle Gradient Veil */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

                {/* Floating UI Elements */}
                {currentStep.floatingBadges.map((badge, bIdx) => {
                  const isTop = badge.pos.includes("top");
                  const isLeft = badge.pos.includes("left");
                  return (
                    <motion.div
                      key={bIdx}
                      initial={{ opacity: 0, y: isTop ? -8 : 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 + bIdx * 0.08, duration: 0.3 }}
                      className={`absolute ${
                        isTop ? "top-3 sm:top-5" : "bottom-3 sm:bottom-5"
                      } ${
                        isLeft ? "left-3 sm:left-5" : "right-3 sm:right-5"
                      } bg-white/94 backdrop-blur-md border border-white/70 p-2.5 sm:p-3.5 rounded-xl shadow-md max-w-[220px] sm:max-w-[260px] text-left`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#FFF1ED] text-[#FF5A3C] flex items-center justify-center shrink-0 border border-[#FF5A3C]/20">
                          <CheckCircle2 size={14} />
                        </div>
                        <div className="min-w-0 text-left">
                          <h5 className="text-[12px] sm:text-[12.5px] font-bold text-[#17202A] truncate text-left">
                            {badge.title}
                          </h5>
                          <p className="text-[10.5px] sm:text-[11px] text-[#64748B] truncate text-left">
                            {badge.subtitle}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── 03 THE GHARMB STANDARD (LEFT ALIGNED) ── */}
      <div className="mb-14 sm:mb-18 text-left">
        <div className="mb-6 sm:mb-8 text-left">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#FF5A3C] mb-1.5 block text-left">
            THE GHARMB STANDARD
          </span>
          <h3 className="text-[24px] sm:text-[28px] font-bold text-[#17202A] tracking-tight text-left">
            More clarity at every step.
          </h3>
          <p className="text-[14px] text-[#64748B] mt-1 text-left">
            Built-in transparency, verification and structured intelligence for every transaction.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              num: "01",
              icon: ShieldCheck,
              title: "Verified information",
              desc: "Clear legal documentation, validated RERA numbers, and genuine project timelines with zero false claims."
            },
            {
              num: "02",
              icon: Users,
              title: "Connected professionals",
              desc: "Direct access to authenticated developers, vetted neighborhood specialists, and genuine property owners."
            },
            {
              num: "03",
              icon: Calculator,
              title: "Useful property tools",
              desc: "EMI loan calculators, unit area converters, stamp duty estimators, and side-by-side comparison tables."
            },
            {
              num: "04",
              icon: BookOpen,
              title: "Real-world insights",
              desc: "Editorial buying guides, micro-market trends, legal explainers, and real estate terminology without jargon."
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group bg-white rounded-2xl border border-[#E7E7E5] hover:border-[#FF5A3C]/40 p-5 sm:p-6 transition-all duration-250 hover:shadow-xs flex flex-col justify-between text-left"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-9 h-9 rounded-xl bg-[#FFF1ED] text-[#FF5A3C] group-hover:bg-[#FF5A3C] group-hover:text-white flex items-center justify-center transition-all duration-250 group-hover:-translate-y-0.5">
                      <Icon size={17} />
                    </div>
                    <span className="font-mono text-[12px] font-bold text-[#64748B] group-hover:text-[#FF5A3C] transition-colors">
                      {item.num}
                    </span>
                  </div>
                  <h4 className="text-[16px] font-bold text-[#17202A] mb-1.5 group-hover:text-[#FF5A3C] transition-colors text-left">
                    {item.title}
                  </h4>
                  <p className="text-[13px] text-[#64748B] leading-relaxed text-left">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 04 EDITORIAL VISUAL BREAK BANNER (Contained + Rounded + Left-Aligned Typography) ── */}
      <div className="mb-14 sm:mb-18">
        <div className="relative rounded-[24px] sm:rounded-[28px] overflow-hidden aspect-[21/9] sm:aspect-[2.8/1] min-h-[220px] sm:min-h-[260px] flex items-center shadow-xs border border-[#E7E7E5] text-left">
          {/* Background Image */}
          <img
            src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1600&h=800&fit=crop&q=80"
            alt="Modern Architecture"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Dark Gradient Layer designed for left-aligned reading */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/30" />

          {/* Clean Minimal Typography Overlay (Left Aligned) */}
          <div className="relative z-10 px-6 sm:px-10 lg:px-12 py-8 max-w-2xl text-left">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#FF5A3C] mb-2 block text-left">
              CONNECTED REAL ESTATE
            </span>
            <h3 className="text-[20px] sm:text-[26px] lg:text-[30px] font-bold text-white tracking-tight leading-[1.25] mb-3 text-left">
              Real estate is easier when information is connected.
            </h3>
            <div className="flex flex-wrap items-center justify-start gap-2 sm:gap-3 text-[12px] sm:text-[13px] font-medium tracking-wide text-white/80">
              <span className="text-[#FF5A3C] font-semibold">01 Discover</span>
              <span className="text-white/30">•</span>
              <span>02 Explore</span>
              <span className="text-white/30">•</span>
              <span>03 Verify</span>
              <span className="text-white/30">•</span>
              <span>04 Connect</span>
              <span className="text-white/30">•</span>
              <span>05 Decide</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 05 REAL STORIES / TESTIMONIALS (EDITORIAL 2-COLUMN EXPERIENCE) ── */}
      <div
        className="mb-14 sm:mb-20 text-left"
        onMouseEnter={() => setIsTestimonialHovered(true)}
        onMouseLeave={() => setIsTestimonialHovered(false)}
      >
        {/* Section Intro Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10 text-left">
          <div className="max-w-2xl text-left">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#FF5A3C] mb-2 block text-left">
              REAL STORIES
            </span>
            <h3 className="text-[26px] sm:text-[34px] lg:text-[40px] font-bold text-[#17202A] leading-[1.18] tracking-[-0.02em] text-left">
              People navigating real estate <br className="hidden sm:inline" />
              with <span className="text-[#FF5A3C]">more clarity.</span>
            </h3>
            <p className="text-[14px] sm:text-[15px] text-[#64748B] mt-2 leading-relaxed text-left">
              See how a more connected property experience can make information easier to understand and decisions easier to navigate.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {!isTestimonialsLoading && testimonials.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-mono font-bold tracking-wider text-[#17202A] bg-white border border-[#E8E5E1] shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
                {testimonials.length < 10 ? `0${testimonials.length}` : testimonials.length} {testimonials.length === 1 ? 'STORY' : 'STORIES'}
              </span>
            )}
          </div>
        </div>

        {/* Main Testimonial Editorial Composition (Warm Off-White #FAF9F7) */}
        {isTestimonialsLoading ? (
          <div className="bg-[#FAF9F7] border border-[#E8E5E1] rounded-[24px] sm:rounded-[28px] p-6 sm:p-12 shadow-xs flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center justify-center gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-full border-2 border-[#E8E5E1] border-t-[#FF5A3C] animate-spin" />
              <p className="text-[13px] font-semibold text-[#64748B]">Loading stories...</p>
            </div>
          </div>
        ) : testimonialsError ? (
          <div className="bg-[#FAF9F7] border border-[#E8E5E1] rounded-[24px] sm:rounded-[28px] p-6 sm:p-12 shadow-xs flex flex-col items-center justify-center min-h-[300px]">
             <AlertCircle size={28} className="text-[#94A3B8] mb-3" />
             <p className="text-[14.5px] font-medium text-[#17202A]">Unable to load stories right now.</p>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="bg-[#FAF9F7] border border-[#E8E5E1] rounded-[24px] sm:rounded-[28px] p-6 sm:p-12 shadow-xs flex flex-col items-center justify-center min-h-[300px]">
             <Quote size={28} className="text-[#94A3B8] mb-3" />
             <p className="text-[14.5px] font-medium text-[#17202A]">No stories available yet.</p>
          </div>
        ) : (
          <div className="bg-[#FAF9F7] border border-[#E8E5E1] rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 lg:p-10 shadow-xs overflow-hidden">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            
            {/* ── LEFT COLUMN (55% width ~ 7 cols): TESTIMONIAL QUOTE & PERSON ── */}
            <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={testimonials[activeTestimonial]._id || testimonials[activeTestimonial].id}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
                  className="space-y-6 text-left"
                >
                  {/* Small coral quote accent line & text */}
                  <div className="relative pl-5 sm:pl-6 border-l-2 border-[#FF5A3C] text-left">
                    <Quote size={20} className="text-[#FF5A3C] mb-2.5 opacity-90" />
                    <p className="text-[20px] sm:text-[24px] lg:text-[27px] font-medium text-[#17202A] leading-[1.28] tracking-tight max-w-[620px] text-left">
                      &ldquo;{testimonials[activeTestimonial].quote}&rdquo;
                    </p>
                  </div>

                  {/* Person Profile Row */}
                  <div className="flex items-center gap-3.5 pt-2 text-left">
                    {testimonials[activeTestimonial].avatar ? (
                      <motion.img
                        src={testimonials[activeTestimonial].avatar}
                        alt={testimonials[activeTestimonial].name}
                        initial={{ scale: 0.94, opacity: 0.8 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="w-14 h-14 rounded-full object-cover border border-[#E8E5E1] shadow-2xs shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#E8E5E1] flex items-center justify-center border border-[#D1D5DB] shadow-2xs shrink-0 text-[#64748B] font-bold">
                        {testimonials[activeTestimonial].name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-[15.5px] font-bold text-[#17202A] text-left">
                          {testimonials[activeTestimonial].name}
                        </h4>
                        {testimonials[activeTestimonial].isVerified !== false && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A66A] bg-[#16A66A]/10 px-2 py-0.5 rounded-full">
                            <Check size={11} strokeWidth={3} />
                            Verified experience
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-[#64748B] text-left mt-0.5">
                        {testimonials[activeTestimonial].role} {testimonials[activeTestimonial].location ? `· ${testimonials[activeTestimonial].location}` : ''}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── RIGHT COLUMN (45% width ~ 5 cols): PROPERTY CONTEXT & IMAGE ── */}
            <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-[#E8E5E1] pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-between text-left">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`context-${testimonials[activeTestimonial]._id || testimonials[activeTestimonial].id}`}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
                  className="space-y-4 text-left"
                >
                  {/* Title */}
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#64748B] block text-left">
                    PROPERTY JOURNEY
                  </span>

                  {/* Stage Flow */}
                  <div className="flex items-center gap-1.5 text-[12px] font-medium flex-wrap text-left">
                    {testimonials[activeTestimonial].stages?.map((stg, sIdx) => {
                      const isActive = sIdx === testimonials[activeTestimonial].activeStageIndex;
                      return (
                        <div key={stg} className="flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-1 rounded-md transition-colors ${
                              isActive
                                ? "bg-[#FFF1ED] text-[#FF5A3C] font-bold border border-[#FF5A3C]/30"
                                : "bg-white text-[#64748B] border border-[#E8E5E1]"
                            }`}
                          >
                            {stg}
                          </span>
                          {sIdx < testimonials[activeTestimonial].stages.length - 1 && (
                            <span className="text-[#64748B]/50 font-mono text-[11px]">→</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-2 text-left">
                    <div className="bg-white/80 border border-[#E8E5E1] p-2.5 rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                        PROPERTY
                      </span>
                      <span className="text-[12px] font-semibold text-[#17202A] block truncate mt-0.5">
                        {testimonials[activeTestimonial].propertyType || '-'}
                      </span>
                    </div>
                    <div className="bg-white/80 border border-[#E8E5E1] p-2.5 rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                        LOCATION
                      </span>
                      <span className="text-[12px] font-semibold text-[#17202A] block truncate mt-0.5">
                        {testimonials[activeTestimonial].location || '-'}
                      </span>
                    </div>
                    <div className="bg-white/80 border border-[#E8E5E1] p-2.5 rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                        JOURNEY
                      </span>
                      <span className="text-[12px] font-semibold text-[#17202A] block truncate mt-0.5">
                        {testimonials[activeTestimonial].journeyType || '-'}
                      </span>
                    </div>
                  </div>

                  {/* Architectural Property Image */}
                  <div className="relative rounded-[16px] overflow-hidden aspect-[16/10] max-w-[340px] border border-[#E8E5E1] bg-white group cursor-pointer mt-3">
                    {testimonials[activeTestimonial].propertyImage ? (
                      <motion.img
                        src={testimonials[activeTestimonial].propertyImage}
                        alt={testimonials[activeTestimonial].name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#E8E5E1] flex items-center justify-center text-[#94A3B8]">
                        No property image available
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 pointer-events-none" />
                    {testimonials[activeTestimonial].isVerified !== false && (
                      <div className="absolute bottom-2.5 left-2.5 bg-white/94 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/70 text-[11px] font-semibold text-[#17202A] flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 size={13} className="text-[#16A66A]" />
                        <span>Verified information</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ── MINIMAL NAVIGATION BAR ── */}
          {testimonials.length > 1 && (
            <div className="mt-8 pt-6 border-t border-[#E8E5E1] flex items-center justify-between gap-4">
              {/* Previous Button */}
              <button
                onClick={() =>
                  setActiveTestimonial((prev) =>
                    prev === 0 ? testimonials.length - 1 : prev - 1
                  )
                }
                aria-label="Previous testimonial"
                className="px-3.5 sm:px-4 py-2 rounded-xl border border-[#E8E5E1] bg-white hover:bg-[#FAF9F7] text-[13px] font-semibold text-[#17202A] transition-all inline-flex items-center gap-2 group cursor-pointer shadow-2xs"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                <span>Previous</span>
              </button>

              {/* Center Counter with Active Coral Line Indicator */}
              <div className="flex items-center gap-3">
                <span className="font-mono text-[12px] font-bold text-[#64748B]">
                  {activeTestimonial + 1 < 10 ? `0${activeTestimonial + 1}` : activeTestimonial + 1}
                </span>
                <div className="flex items-center gap-1.5">
                  {testimonials.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTestimonial(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        activeTestimonial === idx
                          ? "w-8 bg-[#FF5A3C]"
                          : "w-2.5 bg-[#E8E5E1] hover:bg-[#64748B]/40"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-mono text-[12px] font-bold text-[#64748B]">
                  {testimonials.length < 10 ? `0${testimonials.length}` : testimonials.length}
                </span>
              </div>

              {/* Next Button */}
              <button
                onClick={() =>
                  setActiveTestimonial((prev) =>
                    prev === testimonials.length - 1 ? 0 : prev + 1
                  )
                }
                aria-label="Next testimonial"
                className="px-3.5 sm:px-4 py-2 rounded-xl border border-[#E8E5E1] bg-white hover:bg-[#FAF9F7] text-[13px] font-semibold text-[#17202A] transition-all inline-flex items-center gap-2 group cursor-pointer shadow-2xs"
              >
                <span>Next</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}
        </div>
        )}
      </div>

      {/* ── 06 EDITORIAL FREQUENTLY ASKED QUESTIONS SECTION ── */}
      <div className="mb-14 sm:mb-20 text-left">
        {/* Section Header: 2 Columns */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 sm:mb-10 text-left">
          <div className="max-w-2xl text-left">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#FF5A3C] mb-2 block text-left">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h3 className="text-[26px] sm:text-[34px] lg:text-[40px] font-bold text-[#17202A] leading-[1.18] tracking-[-0.02em] text-left">
              Everything you want to know <br className="hidden sm:inline" />
              about <span className="text-[#FF5A3C]">GharMB.</span>
            </h3>
            <p className="text-[14px] sm:text-[15px] text-[#64748B] mt-2 leading-relaxed text-left">
              Quick answers about the platform, property information, verification, professionals and the tools available through GharMB.
            </p>
          </div>

          {/* Right Header: Section Counter Badge & Search Component */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-mono font-bold tracking-wider text-[#17202A] bg-white border border-[#E7E7E5] shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
              FAQ / 08
            </span>

            {/* Compact Search Input */}
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
              <input
                type="text"
                value={faqQuery}
                onChange={(e) => setFaqQuery(e.target.value)}
                placeholder="Search questions..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-[#E7E7E5] rounded-[14px] text-[13px] text-[#17202A] placeholder:text-[#64748B] focus:outline-none focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/15 transition-all text-left shadow-2xs"
              />
              {faqQuery && (
                <button
                  onClick={() => setFaqQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#17202A] p-0.5 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar -mx-5 px-5 md:mx-0 md:px-0 mb-8 sm:mb-10 text-left">
          {faqCategories.map((category) => {
            const isActive = activeFaqCategory === category;
            return (
              <button
                key={category}
                onClick={() => setActiveFaqCategory(category)}
                className={`px-3.5 py-1.5 rounded-full text-[12.5px] sm:text-[13px] transition-all duration-200 shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-white text-[#17202A] border border-[#E7E7E5] font-semibold shadow-2xs"
                    : "text-[#64748B] hover:text-[#17202A] hover:bg-black/[0.02]"
                }`}
              >
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />}
                <span>{category}</span>
              </button>
            );
          })}
        </div>

        {/* 2-Column Editorial FAQ Composition (Left: 30% / Right: 70%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start text-left">
          
          {/* Left Column (30% ~ 4 cols): Sticky Info Panel */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6 text-left">
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#64748B] block text-left">
                FAQ
              </span>
              <h4 className="text-[20px] sm:text-[22px] font-bold text-[#17202A] tracking-tight text-left">
                {faqData.length < 10 ? `0${faqData.length}` : faqData.length} QUESTIONS
              </h4>
              <div className="border-l-2 border-[#FF5A3C] pl-3 py-1">
                <p className="text-[13px] text-[#64748B] leading-relaxed text-left">
                  {faqQuery
                    ? `${filteredFaqs.length} ${filteredFaqs.length === 1 ? "question" : "questions"} matching &ldquo;${faqQuery}&rdquo;`
                    : "Clear answers on platform architecture, verification, data standards, and professional tools."}
                </p>
              </div>
            </div>

            {/* Can't find the answer? */}
            <div className="bg-[#FAF9F7] border border-[#E8E5E1] rounded-2xl p-5 space-y-2 text-left">
              <span className="text-[13px] font-semibold text-[#17202A] block text-left">
                Can&apos;t find the answer?
              </span>
              <p className="text-[12.5px] text-[#64748B] leading-relaxed text-left">
                Our support and verification team is always ready to assist you.
              </p>
              <Link
                to="/about"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#FF5A3C] hover:text-[#E04F34] transition-colors pt-1 group"
              >
                <span>Contact GharMB</span>
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Column (70% ~ 8 cols): Editorial Accordion Rows */}
          <div className="lg:col-span-8 text-left">
            {isFaqLoading ? (
              <div className="py-12 px-6 text-left border border-dashed border-[#E7E7E5] rounded-2xl bg-[#F8F8F7] space-y-4 animate-pulse">
                <div className="h-6 bg-[#E7E7E5] rounded-full w-1/4"></div>
                <div className="h-4 bg-[#E7E7E5] rounded-full w-1/2"></div>
                <div className="h-4 bg-[#E7E7E5] rounded-full w-1/3"></div>
              </div>
            ) : filteredFaqs.length === 0 ? (
              <div className="py-12 px-6 text-left border border-dashed border-[#E7E7E5] rounded-2xl bg-white space-y-2">
                <h4 className="text-[16px] font-bold text-[#17202A]">No questions found</h4>
                <p className="text-[13.5px] text-[#64748B]">
                  We couldn&apos;t find any questions matching &ldquo;{faqQuery}&rdquo; in {activeFaqCategory}.
                </p>
                <button
                  onClick={() => {
                    setFaqQuery("");
                    setActiveFaqCategory("All");
                  }}
                  className="mt-2 text-xs font-semibold text-[#FF5A3C] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Clear search & reset filters</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#E7E7E5] border-t border-[#E7E7E5] text-left">
                {filteredFaqs.map((faq) => {
                  const isOpen = openFaq === faq.id;

                  return (
                    <div
                      key={faq.id}
                      className="transition-colors text-left"
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                        className="w-full flex items-center justify-between text-left py-5 sm:py-6 gap-4 cursor-pointer group"
                        aria-expanded={isOpen}
                      >
                        <div className="flex items-start gap-3.5 sm:gap-4 text-left">
                          <span
                            className={`font-mono text-[12px] font-bold uppercase transition-colors pt-0.5 shrink-0 ${
                              isOpen ? "text-[#FF5A3C]" : "text-[#64748B]"
                            }`}
                          >
                            {faq.id}
                          </span>
                          <h4
                            className={`text-[17px] sm:text-[19px] lg:text-[20px] font-[550] leading-snug transition-colors text-left ${
                              isOpen
                                ? "text-[#FF5A3C]"
                                : "text-[#17202A] group-hover:text-[#FF5A3C]"
                            }`}
                          >
                            {faq.question}
                          </h4>
                        </div>

                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 duration-300 ${
                            isOpen
                              ? "bg-[#FFF1ED] text-[#FF5A3C] rotate-45"
                              : "bg-[#F8F8F6] text-[#64748B] group-hover:text-[#17202A]"
                          }`}
                        >
                          <Plus size={15} />
                        </div>
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0, y: -8 }}
                            animate={{ height: "auto", opacity: 1, y: 0 }}
                            exit={{ height: 0, opacity: 0, y: -8 }}
                            transition={{ duration: 0.28, ease: "easeInOut" }}
                            className="overflow-hidden text-left"
                          >
                            <div className="pl-7 sm:pl-9 pr-4 pb-6 text-left">
                              <div className="border-l-2 border-[#FF5A3C] pl-4 sm:pl-5 py-1 text-left whitespace-pre-wrap">
                                <p className="text-[14.5px] sm:text-[15.5px] text-[#64748B] leading-[1.68] max-w-[650px] text-left">
                                  {faq.answer}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Contact Panel / CTA inside FAQ */}
            <div className="mt-10 sm:mt-12 pt-8 border-t border-[#E7E7E5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
              <div>
                <h5 className="text-[16px] font-bold text-[#17202A] text-left">
                  Still have questions?
                </h5>
                <p className="text-[13px] text-[#64748B] mt-0.5 text-left">
                  Explore GharMB or speak with the team to understand how the platform works.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                <a
                  href="#hero"
                  onClick={(e) => {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-semibold text-white bg-[#FF5A3C] hover:bg-[#E04F34] rounded-xl transition-all shadow-2xs cursor-pointer"
                >
                  <span>Explore GharMB</span>
                  <ArrowRight size={13} />
                </a>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-semibold text-[#17202A] bg-white border border-[#E7E7E5] hover:bg-[#FAF9F7] rounded-xl transition-all"
                >
                  <span>Contact us</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 07 PREMIUM IMAGE CTA BANNER ── */}
      <div className="mt-14 sm:mt-20">
        <div className="relative max-w-[1200px] mx-auto min-h-[500px] sm:min-h-[540px] rounded-[28px] overflow-hidden flex flex-col justify-between p-7 sm:p-12 lg:p-14 shadow-lg border border-[#E7E7E5] text-left">
          {/* Background Image with subtle zoom */}
          <motion.img
            src="https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1600&h=1000&fit=crop&q=85"
            alt="Luxury Architecture"
            initial={{ scale: 1.04 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Subtle Dark Overlay (rgba(10,18,28,0.45) - not too dark) */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A121C]/85 via-[#0A121C]/55 to-[#0A121C]/35" />

          {/* Content Container (Left Side) */}
          <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center h-full my-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="lg:col-span-7 max-w-xl text-left"
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF5A3C] mb-3 block text-left">
                READY TO EXPLORE?
              </span>
              <h3 className="text-[28px] sm:text-[36px] lg:text-[44px] font-bold text-white leading-[1.15] tracking-tight mb-3 text-left">
                Make your next property decision <br className="hidden sm:inline" />
                with <span className="text-[#FF5A3C]">more clarity.</span>
              </h3>
              <p className="text-[14.5px] sm:text-[16px] text-white/80 leading-relaxed mb-8 max-w-lg text-left">
                Explore a more connected way to discover property information, understand your options and connect with the right people.
              </p>

              <div className="flex flex-wrap items-center justify-start gap-3.5">
                <a
                  href="#hero"
                  onClick={(e) => {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-[13.5px] sm:text-[14px] font-semibold text-white bg-[#FF5A3C] hover:bg-[#E04F34] rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Explore GharMB</span>
                  <ArrowRight size={15} />
                </a>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-[13.5px] sm:text-[14px] font-semibold text-white border border-white/40 hover:border-white hover:bg-white/10 rounded-xl transition-all hover:-translate-y-0.5"
                >
                  <span>Learn about the ecosystem</span>
                </Link>
              </div>
            </motion.div>

            {/* Floating Glass Information Card (Right Side) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="lg:col-span-5 flex justify-start lg:justify-end"
            >
              <div className="w-full max-w-[290px] bg-white/[0.12] backdrop-blur-[18px] border border-white/25 rounded-[20px] p-5 sm:p-6 text-white shadow-2xl text-left">
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/15">
                  <div className="w-5 h-5 rounded-full bg-[#16A66A]/20 text-[#16A66A] flex items-center justify-center">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className="text-[12.5px] font-bold tracking-wide">Connected ecosystem</span>
                </div>

                <div className="space-y-2 text-[12.5px] text-white/85 font-medium mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
                    <span>Property information</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
                    <span>Professional network</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
                    <span>Useful property tools</span>
                  </div>
                </div>

                <Link
                  to="/properties"
                  className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#FF5A3C] hover:text-white transition-colors group"
                >
                  <span>GharMB Ecosystem</span>
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   12 — GET STARTED / CONTACT SECTION (#FAF9F7)
   ═══════════════════════════════════════════════════════════════ */
function ContactSection() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    interest: 'Property Discovery',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full Name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email Address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (formData.phone && !/^[0-9+\s-]{7,15}$/.test(formData.phone)) {
      errs.phone = 'Please enter a valid phone number';
    }
    if (!formData.message.trim()) errs.message = 'Message is required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1200);
  };

  return (
    <section id="contact-section" className="bg-[#FAF9F7] py-20 sm:py-24 lg:py-28 border-t border-[#E8E5E1]">
      <div className="max-w-[1200px] mx-auto px-5 md:px-8 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start text-left">
          
          {/* Left Column (45% ~ 5 cols) */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0ED] border border-[#FF5A3C]/20 text-[11px] font-bold text-[#FF5A3C] uppercase tracking-[0.16em] mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
                <span>Contact Us</span>
              </div>
              <h2 className="text-[30px] sm:text-[38px] lg:text-[44px] font-bold text-[#17202A] leading-[1.1] tracking-[-0.03em] mb-3.5 text-left">
                Have a question? <br />
                <span className="text-[#FF5A3C]">Let&apos;s talk.</span>
              </h2>
              <p className="text-[15px] sm:text-[16.5px] text-[#667085] leading-[1.65] font-normal text-left">
                Whether you&apos;re exploring the platform, representing a property or looking to understand the GharMB ecosystem, we&apos;re here to help.
              </p>
            </Reveal>

            {/* Trust Points */}
            <div className="pt-2 space-y-3 text-left">
              {[
                "Quick response within 24 hours",
                "Real-estate focused expert support",
                "Transparent & clear communication"
              ].map((point, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-[13.5px] font-medium text-[#17202A]">
                  <div className="w-5 h-5 rounded-full bg-[#16A66A]/10 text-[#16A66A] flex items-center justify-center shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>{point}</span>
                </div>
              ))}
            </div>

            {/* Direct Contact */}
            <div className="pt-6 border-t border-[#E8E5E1] space-y-3">
              <a
                href="mailto:support@gharmb.com"
                className="inline-flex items-center gap-2.5 text-[13.5px] text-[#64748B] hover:text-[#FF5A3C] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-[#E8E5E1] flex items-center justify-center text-[#17202A]">
                  <Mail size={14} />
                </div>
                <span>support@gharmb.com</span>
              </a>
            </div>
          </div>

          {/* Right Column (55% ~ 7 cols): Premium Contact Form Card */}
          <div className="lg:col-span-7 text-left">
            <div className="bg-white border border-[#E7E7E5] rounded-[20px] p-6 sm:p-8 lg:p-10 shadow-xs text-left">
              <AnimatePresence mode="wait">
                {isSubmitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="py-12 text-center space-y-4"
                  >
                    <div className="w-14 h-14 rounded-full bg-[#16A66A]/10 text-[#16A66A] flex items-center justify-center mx-auto border border-[#16A66A]/20">
                      <CheckCircle2 size={28} />
                    </div>
                    <h4 className="text-[20px] font-bold text-[#17202A]">
                      Message sent successfully!
                    </h4>
                    <p className="text-[14px] text-[#64748B] max-w-md mx-auto">
                      Thank you for reaching out. A GharMB real-estate specialist will get in touch with you shortly.
                    </p>
                    <button
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData({ fullName: '', email: '', phone: '', interest: 'Property Discovery', message: '' });
                      }}
                      className="mt-2 px-5 py-2 rounded-xl text-xs font-semibold text-[#FF5A3C] bg-[#FFF1ED] hover:bg-[#FFE6DF] transition-colors cursor-pointer"
                    >
                      Send another enquiry
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4 text-left"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div>
                        <label className="block text-[12.5px] font-semibold text-[#17202A] mb-1.5 text-left">
                          Full Name <span className="text-[#FF5A3C]">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="e.g. Rahul Sharma"
                          className={`w-full h-[50px] px-4 rounded-xl border ${
                            errors.fullName ? 'border-red-500' : 'border-[#E2E4E7]'
                          } text-[13.5px] text-[#17202A] placeholder:text-[#64748B]/60 focus:outline-none focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/15 transition-all text-left`}
                        />
                        {errors.fullName && <p className="text-red-500 text-[11.5px] mt-1 text-left">{errors.fullName}</p>}
                      </div>

                      {/* Email Address */}
                      <div>
                        <label className="block text-[12.5px] font-semibold text-[#17202A] mb-1.5 text-left">
                          Email Address <span className="text-[#FF5A3C]">*</span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="rahul@example.com"
                          className={`w-full h-[50px] px-4 rounded-xl border ${
                            errors.email ? 'border-red-500' : 'border-[#E2E4E7]'
                          } text-[13.5px] text-[#17202A] placeholder:text-[#64748B]/60 focus:outline-none focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/15 transition-all text-left`}
                        />
                        {errors.email && <p className="text-red-500 text-[11.5px] mt-1 text-left">{errors.email}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Phone Number */}
                      <div>
                        <label className="block text-[12.5px] font-semibold text-[#17202A] mb-1.5 text-left">
                          Phone Number <span className="text-[#64748B] text-xs font-normal">(Optional)</span>
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className={`w-full h-[50px] px-4 rounded-xl border ${
                            errors.phone ? 'border-red-500' : 'border-[#E2E4E7]'
                          } text-[13.5px] text-[#17202A] placeholder:text-[#64748B]/60 focus:outline-none focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/15 transition-all text-left`}
                        />
                        {errors.phone && <p className="text-red-500 text-[11.5px] mt-1 text-left">{errors.phone}</p>}
                      </div>

                      {/* Interest Category */}
                      <div>
                        <label className="block text-[12.5px] font-semibold text-[#17202A] mb-1.5 text-left">
                          I am interested in
                        </label>
                        <select
                          value={formData.interest}
                          onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                          className="w-full h-[50px] px-4 rounded-xl border border-[#E2E4E7] text-[13.5px] text-[#17202A] bg-white focus:outline-none focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/15 transition-all cursor-pointer text-left"
                        >
                          <option value="Property Discovery">Property Discovery</option>
                          <option value="Developer Projects">Developer Projects</option>
                          <option value="Professional Network">Professional Network</option>
                          <option value="Commercial Spaces">Commercial Spaces</option>
                          <option value="General Enquiry">General Enquiry</option>
                        </select>
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-[12.5px] font-semibold text-[#17202A] mb-1.5 text-left">
                        Message <span className="text-[#FF5A3C]">*</span>
                      </label>
                      <textarea
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Tell us about your requirements or questions..."
                        className={`w-full p-4 rounded-xl border ${
                          errors.message ? 'border-red-500' : 'border-[#E2E4E7]'
                        } text-[13.5px] text-[#17202A] placeholder:text-[#64748B]/60 focus:outline-none focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/15 transition-all resize-none text-left`}
                      />
                      {errors.message && <p className="text-red-500 text-[11.5px] mt-1 text-left">{errors.message}</p>}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-[52px] bg-[#FF5A3C] hover:bg-[#E04F34] text-white font-semibold text-[14px] rounded-[12px] transition-all duration-200 flex items-center justify-center gap-2 shadow-xs hover:shadow-sm cursor-pointer disabled:opacity-70 mt-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Enquiry</span>
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      <div id="hero"><Hero /></div>
      <BrandMarquee />
      <div id="about"><AboutGharMB /></div>
      <div id="developers"><TopBuildersSection /></div>
      <div id="ecosystem"><Ecosystem /></div>
      <div id="platform"><ProductShowcase /></div>
      <Verification />
      <div id="professionals"><Professionals /></div>
      <Commercial />
      <div id="tools"><SmartTools /></div>
      <div id="insights"><Insights /></div>
      <div id="how-it-works"><HowItWorks /></div>
      <div id="contact"><ContactSection /></div>
    </div>
  );
}

