import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Mail, ArrowUpRight } from 'lucide-react';
import { PLAY_STORE_URL } from '../../api/config';

function AndroidIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.52 15.34c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1m-11.04 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1m11.4-6.02l2-3.46c.16-.27.06-.62-.21-.77-.27-.16-.62-.06-.77.21l-2.02 3.5c-1.39-.64-2.94-.99-4.58-.99s-3.18.36-4.58.99L5.7 5.3c-.16-.27-.5-.37-.77-.21-.27.16-.36.5-.21.77l2 3.46C3.77 10.58 1.5 13.92 1.5 17.85h21c0-3.93-2.27-7.26-4.62-8.53" />
    </svg>
  );
}

const navLinks = [
  { label: 'Platform', href: '#platform' },
  { label: 'Ecosystem', href: '#ecosystem' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Insights', href: '/insights', isRoute: true },
  { label: 'RERA', href: '#verification' },
  { label: 'About', href: '#about' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setMobileOpen(false);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [mobileOpen, handleKeyDown]);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMobileOpen(false);

    if (isHome) {
      const target = document.querySelector(href);
      if (target) {
        const yOffset = -75;
        const y = target.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      navigate('/' + href);
      setTimeout(() => {
        const target = document.querySelector(href);
        if (target) {
          const yOffset = -75;
          const y = target.getBoundingClientRect().top + window.scrollY + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 150);
    }
  };

  const isInsightsActive = location.pathname.startsWith('/insights') || location.pathname.startsWith('/blog');

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-border/60 shadow-xs'
            : 'bg-white/90 backdrop-blur-sm border-b border-transparent'
        }`}
        style={{ height: scrolled ? 68 : 78 }}
      >
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 h-full flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group" aria-label="GharMB Home">
            <div className="w-11 h-11 sm:w-13 sm:h-13 flex items-center justify-center shrink-0 p-0.5">
              <img
                src="/gharmb logo.png"
                alt="GharMB Logo"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <span className="text-[21px] sm:text-[24px] font-black text-text-primary tracking-tight">
              Ghar<span className="text-brand">MB</span>
            </span>
          </Link>

          {/* Main Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5" aria-label="Main navigation">
            {navLinks.map((link) => {
              if (link.isRoute) {
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`px-4 py-2 text-[14px] font-medium rounded-xl transition-all duration-200 ${
                      isInsightsActive
                        ? 'text-brand font-bold bg-brand-light'
                        : 'text-text-secondary hover:text-text-primary hover:bg-gray-100/70'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              }
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="px-4 py-2 text-[14px] font-medium text-text-secondary hover:text-text-primary hover:bg-gray-100/70 rounded-xl transition-all duration-200 cursor-pointer"
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Right Action: Get GHARMB App + Contact Us Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="relative group overflow-hidden inline-flex items-center gap-2.5 px-4 py-2 text-[13px] font-bold text-[#0F172A] bg-white hover:bg-white border border-[#E2E8F0] hover:border-[#FF5A45]/35 rounded-xl shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-[2px] active:scale-[0.97] cursor-pointer"
              title="Get GHARMB Android App on Google Play"
            >
              {/* Subtle light sweep across button on hover */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-slate-100/60 to-transparent transition-transform duration-700 pointer-events-none" />

              {/* Android Icon */}
              <span className="shrink-0 text-[#22C55E] group-hover:-translate-y-0.5 transition-transform duration-200 flex items-center justify-center">
                <AndroidIcon className="w-6 h-6 fill-[#22C55E]" />
              </span>

              {/* Button text */}
              <span className="tracking-tight text-[#0F172A]">
                Get <span className="font-extrabold text-[#0F172A]">GHARMB</span> App
              </span>

              {/* Subtle directional download/open indicator */}
              <span className="text-[#94A3B8] group-hover:text-[#FF5A45] group-hover:translate-x-0.5 transition-all duration-200 flex items-center">
                <ArrowUpRight size={14} strokeWidth={2.2} />
              </span>
            </a>

            <a
              href="#contact"
              onClick={(e) => handleNavClick(e, '#contact')}
              className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-bold text-brand bg-brand-light hover:bg-brand hover:text-white border border-brand/25 rounded-xl transition-all duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <Mail size={14} />
              <span>Contact Us</span>
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -mr-2 text-text-primary cursor-pointer rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={24} strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* Header Offset Spacer */}
      <div style={{ height: 78 }} />

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[110] w-[300px] max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-out lg:hidden flex flex-col ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-soft">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 p-0.5 flex items-center justify-center shrink-0">
              <img src="/gharmb logo.png" alt="GharMB Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-[18px] font-black text-text-primary tracking-tight">
              Ghar<span className="text-brand">MB</span>
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-text-secondary hover:bg-section-bg transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Links */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navLinks.map((link) => {
            if (link.isRoute) {
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center px-4 py-3 text-[15px] font-semibold rounded-xl transition-all ${
                    isInsightsActive
                      ? 'text-brand bg-brand-light font-bold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-section-bg'
                  }`}
                >
                  {link.label}
                </Link>
              );
            }
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="flex items-center px-4 py-3 text-[15px] font-semibold text-text-secondary hover:text-text-primary hover:bg-section-bg rounded-xl transition-all cursor-pointer"
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Drawer Action Buttons */}
        <div className="p-4 border-t border-border-soft bg-white space-y-2.5">
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="relative group overflow-hidden flex items-center justify-center gap-2.5 w-full px-4 py-2.5 text-sm font-bold text-[#0F172A] bg-white border border-[#E2E8F0] hover:border-[#FF5A45]/40 rounded-xl shadow-2xs transition-all duration-200 active:scale-[0.97]"
            title="Get GHARMB Android App on Google Play"
          >
            {/* Subtle light sweep across button on hover */}
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-slate-100/70 to-transparent transition-transform duration-700 ease-in-out pointer-events-none" />

            {/* Android Icon */}
            <span className="shrink-0 text-[#22C55E] group-hover:-translate-y-0.5 transition-transform duration-200 flex items-center justify-center">
              <AndroidIcon className="w-6 h-6 fill-[#22C55E]" />
            </span>

            {/* Button text */}
            <span className="tracking-tight text-[#0F172A]">
              Get <span className="font-extrabold text-[#0F172A]">GHARMB</span> App
            </span>

            {/* Subtle directional download/open indicator */}
            <span className="text-[#94A3B8] group-hover:text-[#FF5A45] group-hover:translate-x-0.5 transition-all duration-200 flex items-center">
              <ArrowUpRight size={15} strokeWidth={2.2} />
            </span>
          </a>

          <a
            href="#contact"
            onClick={(e) => handleNavClick(e, '#contact')}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-bold text-brand bg-brand-light border border-brand/25 hover:bg-brand hover:text-white rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            <Mail size={16} />
            <span>Contact Us</span>
          </a>
        </div>
      </div>
    </>
  );
}
