import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';

const navLinks = [
  { label: 'Platform', href: '#platform' },
  { label: 'Ecosystem', href: '#ecosystem' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Insights', href: '/blog', isRoute: true },
  { label: 'About', href: '#about' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
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
    if (href.startsWith('#') && isHome) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setMobileOpen(false);
      }
    } else if (href.startsWith('#') && !isHome) {
      // Navigate to home then scroll
      e.preventDefault();
      window.location.href = '/' + href;
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-border/60 shadow-xs'
            : 'bg-white/85 backdrop-blur-sm'
        }`}
        style={{ height: scrolled ? 68 : 78 }}
      >
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 shrink-0 group" aria-label="GharMB Home">
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0 p-0.5">
              <img
                src="/gharmb logo.png"
                alt="GharMB Logo"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <span className="text-[21px] sm:text-[25px] font-black text-text-primary tracking-tight">
              Ghar<span className="text-brand">MB</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-3.5 py-2 text-[14px] font-medium rounded-lg transition-colors duration-200 ${
                    location.pathname.startsWith(link.href)
                      ? 'text-brand font-semibold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="px-3.5 py-2 text-[14px] font-medium text-text-secondary hover:text-text-primary rounded-lg transition-colors duration-200"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <a
              href="#professionals"
              onClick={(e) => handleNavClick(e, '#professionals')}
              className="px-4 py-2 text-[13.5px] font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              For Professionals
            </a>
            <a
              href="#hero"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-5 py-2.5 text-[13.5px] font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-all duration-200 shadow-2xs hover:shadow-xs"
            >
              Get Started
            </a>
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -mr-2 text-text-primary cursor-pointer"
            aria-label="Open menu"
          >
            <Menu size={24} strokeWidth={1.8} />
          </button>
        </div>
      </header>

      <div style={{ height: 78 }} />

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[110] w-[300px] max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <div className="flex items-center justify-between p-5 border-b border-border-soft">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 p-0.5 flex items-center justify-center shrink-0">
              <img src="/gharmb logo.png" alt="GharMB Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-[18px] font-black text-text-primary tracking-tight">
              Ghar<span className="text-brand">MB</span>
            </span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-section-bg" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="p-4 space-y-0.5">
          {navLinks.map((link) =>
            link.isRoute ? (
              <Link
                key={link.href}
                to={link.href}
                className="flex items-center px-4 py-3 text-[15px] font-medium text-text-secondary hover:text-text-primary hover:bg-section-bg rounded-xl transition-colors"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="flex items-center px-4 py-3 text-[15px] font-medium text-text-secondary hover:text-text-primary hover:bg-section-bg rounded-xl transition-colors"
              >
                {link.label}
              </a>
            )
          )}
        </nav>

        <div className="p-4 pt-2 space-y-2.5 border-t border-border-soft mx-4 mt-2">
          <a
            href="#professionals"
            onClick={(e) => handleNavClick(e, '#professionals')}
            className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-text-secondary border border-border rounded-xl hover:bg-section-bg transition-colors"
          >
            For Professionals
          </a>
          <button
            onClick={() => { setMobileOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-colors"
          >
            Get Started
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </>
  );
}
