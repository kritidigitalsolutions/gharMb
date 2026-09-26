import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';

export default function Footer() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

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
      <div className="absolute right-[-20px] bottom-[-30px] select-none pointer-events-none text-white/[0.07] font-black text-[140px] sm:text-[200px] lg:text-[260px] leading-none tracking-tighter">
        GharMB
      </div>

      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 pt-16 sm:pt-20 pb-10 sm:pb-12 relative z-10 text-left">
        {/* Top Footer 5-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 items-start text-left">
          
          {/* Brand Info (4 cols) */}
          <div className="lg:col-span-4 space-y-4 text-left">
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

            <div className="pt-1 text-left">
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
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8 text-left">
            {/* PLATFORM */}
            <div className="text-left">
              <h4 className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-white/90 mb-4 text-left">
                PLATFORM
              </h4>
              <ul className="space-y-2.5 text-left">
                {[
                  { label: 'Platform Overview', href: '#platform' },
                  { label: 'Ecosystem', href: '#ecosystem' },
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
              <h4 className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-white/90 mb-4 text-left">
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
              <h4 className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-white/90 mb-4 text-left">
                QUICK LINKS
              </h4>
              <ul className="space-y-2.5 text-left">
                {[
                  { label: 'Home', href: '#hero' },
                  { label: 'About Us', href: '#about' },
                  { label: 'Insights', href: '#insights' },
                  { label: 'Get in Touch', href: '#contact' }
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

            {/* LEGAL */}
            <div className="text-left">
              <h4 className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-white/90 mb-4 text-left">
                LEGAL
              </h4>
              <ul className="space-y-2.5 text-left">
                {[
                  { label: 'Privacy Policy', href: '/privacy-policy' },
                  { label: 'Terms of Service', href: '/terms-of-service' },
                ].map((item) => (
                  <li key={item.label}>
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
        <div className="mt-14 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
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
