import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Mail } from 'lucide-react';

const navLinks = [
  { label: 'Platform', href: '#platform' },
  { label: 'Ecosystem', href: '#ecosystem' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Insights', href: '/insights', isRoute: true },
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

          {/* Right Action: Highlighted Contact Us Button */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="#contact"
              onClick={(e) => handleNavClick(e, '#contact')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[13.5px] font-bold text-brand bg-brand-light hover:bg-brand hover:text-white border border-brand/25 rounded-xl transition-all duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <Mail size={15} />
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

        {/* Drawer Action Button */}
        <div className="p-4 border-t border-border-soft bg-white">
          <a
            href="#contact"
            onClick={(e) => handleNavClick(e, '#contact')}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-bold text-brand bg-brand-light border border-brand/25 hover:bg-brand hover:text-white rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            <Mail size={16} />
            <span>Contact Us</span>
          </a>
        </div>
      </div>
    </>
  );
}
