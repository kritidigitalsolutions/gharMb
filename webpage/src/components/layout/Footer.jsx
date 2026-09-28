import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, ArrowUpRight } from 'lucide-react';
import { PLAY_STORE_URL } from '../../api/config';
import { fetchPublicPolicies } from '../../api/legalApi';

function AndroidIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.52 15.34c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1m-11.04 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1m11.4-6.02l2-3.46c.16-.27.06-.62-.21-.77-.27-.16-.62-.06-.77.21l-2.02 3.5c-1.39-.64-2.94-.99-4.58-.99s-3.18.36-4.58.99L5.7 5.3c-.16-.27-.5-.37-.77-.21-.27.16-.36.5-.21.77l2 3.46C3.77 10.58 1.5 13.92 1.5 17.85h21c0-3.93-2.27-7.26-4.62-8.53" />
    </svg>
  );
}

export default function Footer() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  const [legalLinks, setLegalLinks] = useState([
    { id: 'privacy', label: 'Privacy Policy', href: '/privacy-policy', order: 1 },
    { id: 'terms', label: 'Terms of Service', href: '/terms-of-service', order: 2 },
    { id: 'delete', label: 'Delete Profile', href: '/delete-profile', order: 99 }
  ]);

  useEffect(() => {
    let isMounted = true;
    const loadLegalLinks = async () => {
      try {
        const policies = await fetchPublicPolicies(true);
        if (isMounted && Array.isArray(policies) && policies.length > 0) {
          const dynamicItems = policies.map((p) => {
            const slug = (p.slug || p.type || '').toLowerCase();
            let href = `/${slug}`;
            if (slug === 'terms' || slug === 'terms-of-service') href = '/terms-of-service';
            if (slug === 'privacy' || slug === 'privacy-policy') href = '/privacy-policy';
            return {
              id: p._id || slug,
              label: p.title,
              href,
              order: typeof p.displayOrder === 'number' ? p.displayOrder : 10
            };
          });

          // Ensure standard links exist
          if (!dynamicItems.some((it) => it.href === '/privacy-policy')) {
            dynamicItems.unshift({ id: 'privacy', label: 'Privacy Policy', href: '/privacy-policy', order: 1 });
          }
          if (!dynamicItems.some((it) => it.href === '/terms-of-service')) {
            dynamicItems.push({ id: 'terms', label: 'Terms of Service', href: '/terms-of-service', order: 2 });
          }
          if (!dynamicItems.some((it) => it.href === '/delete-profile')) {
            dynamicItems.push({ id: 'delete', label: 'Delete Profile', href: '/delete-profile', order: 99 });
          }

          dynamicItems.sort((a, b) => (a.order || 0) - (b.order || 0));
          setLegalLinks(dynamicItems);
        }
      } catch (err) {
        console.warn('Could not load dynamic footer legal links:', err);
      }
    };

    loadLegalLinks();
    return () => { isMounted = false; };
  }, []);

  const handleAnchorClick = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault();
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
    }
  };

  return (
    <footer className="bg-[#FF5A3C] text-white relative overflow-hidden">
      {/* Decorative Oversized Watermark */}
      <div className="absolute right-[-20px] bottom-[-30px] select-none pointer-events-none text-white/[0.18] font-black text-[140px] sm:text-[200px] lg:text-[260px] leading-none tracking-tighter">
        GharMB
      </div>

      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 pt-12 sm:pt-14 pb-8 sm:pb-10 relative z-10 text-left">
        {/* Top Footer 5-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 items-start text-left">
          
          {/* Brand Info (4 cols) */}
          <div className="lg:col-span-4 space-y-3.5 text-left">
            <Link
              to="/"
              className="inline-flex items-center gap-3 bg-white/10 hover:bg-white/15 p-2 pr-5 rounded-full backdrop-blur-sm border border-white/20 transition-all shadow-xs group"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white p-1 shadow-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <img
                  src="/gharmb logo.png"
                  alt="GharMB Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[20px] sm:text-[22px] font-black text-white tracking-tight">
                GharMB
              </span>
            </Link>

            <p className="text-[13.5px] text-white/85 leading-relaxed max-w-sm text-left">
              A modern real-estate technology platform connecting properties, professionals, insights and useful tools.
            </p>

            <div className="pt-2">
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="relative group overflow-hidden inline-flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] font-bold text-white bg-white/12 hover:bg-white/20 border border-white/25 hover:border-white/40 rounded-xl backdrop-blur-xs shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all duration-250 ease-out hover:-translate-y-[2px] active:scale-[0.98] cursor-pointer"
                title="Get GHARMB Android App on Google Play"
              >
                {/* Subtle light sweep across button on hover */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out pointer-events-none" />

                {/* Android Icon in clean white */}
                <span className="shrink-0 text-white fill-white group-hover:-translate-y-0.5 group-hover:scale-105 transition-transform duration-250 flex items-center justify-center">
                  <AndroidIcon className="w-5 h-5 fill-white" />
                </span>

                {/* Button text */}
                <span className="tracking-tight text-white">
                  Get <span className="font-extrabold text-white">GHARMB</span> App
                </span>

                {/* Subtle directional download/open indicator */}
                <span className="text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all duration-250 flex items-center">
                  <ArrowUpRight size={15} strokeWidth={2.2} />
                </span>
              </a>
            </div>

            <div className="pt-1">
              <a
                href="mailto:support@gharmb.com"
                className="inline-flex items-center gap-2 text-[13px] text-white/85 hover:text-white transition-colors"
              >
                <Mail size={14} className="opacity-90" />
                <span>support@gharmb.com</span>
              </a>
            </div>
          </div>

          {/* Navigation Columns (8 cols -> 4 cols of 2) */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-left">
            {/* PLATFORM */}
            <div className="text-left">
              <h4 className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-white/90 mb-3.5 text-left">
                PLATFORM
              </h4>
              <ul className="space-y-2.5 text-left">
                {[
                  { label: 'Platform Overview', href: '#platform' },
                  { label: 'Ecosystem', href: '#ecosystem' },
                  { label: 'RERA Verification', href: '#verification' },
                  { label: 'Smart Tools', href: '#tools' },
                  { label: 'How It Works', href: '#how-it-works' }
                ].map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      onClick={(e) => handleAnchorClick(e, item.href)}
                      className="text-[13px] text-white/80 hover:text-white transition-all hover:translate-x-1 inline-block cursor-pointer"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* ECOSYSTEM */}
            <div className="text-left">
              <h4 className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-white/90 mb-3.5 text-left">
                ECOSYSTEM
              </h4>
              <ul className="space-y-2.5 text-left">
                {[
                  { label: 'For Professionals', href: '#professionals' },
                  { label: 'Market Insights', href: '#insights' },
                  { label: 'About GharMB', href: '#about' },
                  { label: 'Contact Us', href: '#contact' }
                ].map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      onClick={(e) => handleAnchorClick(e, item.href)}
                      className="text-[13px] text-white/80 hover:text-white transition-all hover:translate-x-1 inline-block cursor-pointer"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* COMPANY */}
            <div className="text-left">
              <h4 className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-white/90 mb-3.5 text-left">
                QUICK LINKS
              </h4>
              <ul className="space-y-2.5 text-left">
                {[
                  { label: 'Home', href: '#hero' },
                  { label: 'About Us', href: '#about' },
                  { label: 'Insights', href: '#insights' },
                  { label: 'Get GHARMB App', href: PLAY_STORE_URL, isExternal: true },
                  { label: 'Get in Touch', href: '#contact' }
                ].map((item) => (
                  <li key={item.label}>
                    {item.isExternal ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] text-white/80 hover:text-white transition-all hover:translate-x-1 inline-block"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <a
                        href={item.href}
                        onClick={(e) => handleAnchorClick(e, item.href)}
                        className="text-[13px] text-white/80 hover:text-white transition-all hover:translate-x-1 inline-block cursor-pointer"
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* LEGAL */}
            <div className="text-left">
              <h4 className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-white/90 mb-3.5 text-left">
                LEGAL
              </h4>
              <ul className="space-y-2.5 text-left">
                {legalLinks.map((item) => (
                  <li key={item.id || item.href}>
                    <Link
                      to={item.href}
                      className="text-[13px] text-white/80 hover:text-white transition-all hover:translate-x-1 inline-block"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-5 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <p className="text-[12px] text-white/75 text-left">
            © {new Date().getFullYear()} GharMB. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            {[
              { name: 'LinkedIn', href: 'https://linkedin.com' },
              { name: 'Instagram', href: 'https://instagram.com' },
              { name: 'X', href: 'https://x.com' }
            ].map((soc) => (
              <a
                key={soc.name}
                href={soc.href}
                target="_blank"
                rel="noreferrer"
                className="text-[12px] font-medium text-white/75 hover:text-white transition-all hover:scale-105"
              >
                {soc.name}
              </a>
            ))}
          </div>

        </div>
      </div>
    </footer>
  );
}
