import React from 'react';
import { Check, X, Clock, CheckCircle2, XCircle, ShieldCheck, Star } from 'lucide-react';

/**
 * Universal Badges UI Component
 * 
 * Inspired by modern, high-contrast, soft-tint & solid-pastel design systems.
 * Features exact pastel color themes from real-time status indicators (Active/Offline),
 * categories (sports/news/entertainment), subscription plans (No Plan/Basic/Premium),
 * and pass models (Series 10 Pass / Series 4 Pass).
 *
 * @param {'emerald'|'mint'|'red'|'coral'|'amber'|'yellow'|'purple'|'lavender'|'peach'|'orange'|'sky'|'blue'|'slate'|'gray'|'gold'|'brand'|'active'|'offline'|'sports'|'news'|'entertainment'|'basic'|'premium'|'noplan'|'pass10'|'pass4'} color - Semantic color theme
 * @param {'pastel'|'soft'|'solid'|'outline'|'glass'} variant - Visual surface style (defaults to 'pastel')
 * @param {'xs'|'sm'|'md'|'lg'} size - Dimension scaling
 * @param {boolean} dot - Shows status indicator circle
 * @param {boolean} pulse - Adds radar pulse ping animation to the dot
 * @param {boolean} shine - Adds metallic hover shimmer effect
 * @param {React.ReactNode} icon - Optional icon to prefix
 * @param {React.ReactNode} children - Badge label text
 * @param {Function} onRemove - If provided, renders an interactive dismiss cross
 * @param {string} className - Extra Tailwind classes
 */
export const Badge = ({
  children,
  color = 'slate',
  variant = 'pastel',
  size = 'sm',
  dot = false,
  pulse = false,
  shine = false,
  icon = null,
  onRemove = null,
  className = '',
  ...props
}) => {
  // Size specifications
  const sizeStyles = {
    '2xs': 'h-[18px] px-1.5 text-[9px] gap-0.5 font-medium',
    xs: 'h-[19px] px-2 text-[9.5px] gap-1 font-medium',
    sm: 'h-[24px] px-2.5 text-[11px] gap-1.5 font-medium',
    md: 'h-[28px] px-3 text-xs gap-1.5 font-medium',
    lg: 'h-[32px] px-3.5 text-sm gap-2 font-semibold',
  };

  // Color & Variant styles
  const colorStyles = {
    // 🟢 Green / Mint / Sports / Active
    emerald: {
      pastel: 'bg-[#52c99b] text-[#064e3b] border-transparent dark:bg-[#1a4a38] dark:text-[#6ee7b7]',
      soft: 'bg-emerald-500/12 text-emerald-700 border-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
      solid: 'bg-emerald-500 text-emerald-950 font-semibold border-transparent shadow-2xs',
      outline: 'bg-transparent text-emerald-700 border-emerald-300 dark:text-emerald-400 dark:border-emerald-500/40',
      glass: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] backdrop-blur-sm',
      dot: 'bg-[#064e3b] dark:bg-[#6ee7b7]',
    },
    // 🔴 Red / Coral / Offline / Danger
    red: {
      pastel: 'bg-[#fca5a5] text-[#701a2b] border-transparent dark:bg-[#521722] dark:text-[#fda4af]',
      soft: 'bg-red-500/12 text-red-700 border-red-500/25 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30',
      solid: 'bg-red-600 text-white font-semibold border-transparent shadow-2xs',
      outline: 'bg-transparent text-red-700 border-red-300 dark:text-red-400 dark:border-red-500/40',
      glass: 'bg-red-950/40 text-red-300 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.15)] backdrop-blur-sm',
      dot: 'bg-[#701a2b] dark:bg-[#fda4af]',
    },
    // 🟡 Yellow / Amber / News / Basic
    amber: {
      pastel: 'bg-[#fef08a] text-[#78350f] border-transparent dark:bg-[#4d3209] dark:text-[#fef08a]',
      soft: 'bg-amber-500/12 text-amber-800 border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
      solid: 'bg-amber-500 text-amber-950 font-semibold border-transparent shadow-2xs',
      outline: 'bg-transparent text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-500/40',
      glass: 'bg-amber-950/40 text-amber-300 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)] backdrop-blur-sm',
      dot: 'bg-[#78350f] dark:bg-[#fde047]',
    },
    // 🟣 Purple / Lavender / Entertainment / Premium / Pass 10
    purple: {
      pastel: 'bg-[#c4b5fd] text-[#4c1d95] border-transparent dark:bg-[#3b1968] dark:text-[#ddd6fe]',
      soft: 'bg-purple-500/12 text-purple-800 border-purple-500/25 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30',
      solid: 'bg-purple-600 text-white font-semibold border-transparent shadow-2xs',
      outline: 'bg-transparent text-purple-700 border-purple-300 dark:text-purple-300 dark:border-purple-500/40',
      glass: 'bg-purple-950/40 text-purple-200 border-purple-500/30 shadow-[0_0_12px_rgba(139,92,246,0.15)] backdrop-blur-sm',
      dot: 'bg-[#4c1d95] dark:bg-[#c4b5fd]',
    },
    // 🟠 Peach / Orange / Pass 4
    peach: {
      pastel: 'bg-[#fed7aa] text-[#9a3412] border-transparent dark:bg-[#52220d] dark:text-[#fed7aa]',
      soft: 'bg-orange-500/12 text-orange-800 border-orange-500/25 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30',
      solid: 'bg-orange-500 text-white font-semibold border-transparent shadow-2xs',
      outline: 'bg-transparent text-orange-700 border-orange-300 dark:text-orange-400 dark:border-orange-500/40',
      glass: 'bg-orange-950/40 text-orange-300 border-orange-500/30 shadow-[0_0_12px_rgba(249,115,22,0.15)] backdrop-blur-sm',
      dot: 'bg-[#9a3412] dark:bg-[#fdba74]',
    },
    // 🔵 Sky / Blue / Info / For Sale
    sky: {
      pastel: 'bg-[#bae6fd] text-[#075985] border-transparent dark:bg-[#113c54] dark:text-[#7dd3fc]',
      soft: 'bg-sky-500/12 text-sky-800 border-sky-500/25 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/25',
      solid: 'bg-sky-600 text-white font-semibold border-transparent shadow-2xs',
      outline: 'bg-transparent text-sky-700 border-sky-300 dark:text-sky-400 dark:border-sky-500/40',
      glass: 'bg-sky-950/40 text-sky-300 border-sky-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)] backdrop-blur-sm',
      dot: 'bg-[#075985] dark:bg-[#38bdf8]',
    },
    // ⚪ Slate / Gray / No Plan / Neutral
    slate: {
      pastel: 'bg-[#e2e8f0] text-[#334155] border-transparent dark:bg-[#273244] dark:text-[#cbd5e1]',
      soft: 'bg-slate-500/10 text-slate-700 border-slate-300 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
      solid: 'bg-slate-700 text-slate-100 dark:bg-slate-800 dark:text-slate-200 font-medium border-transparent shadow-2xs',
      outline: 'bg-transparent text-slate-600 border-slate-300 dark:text-slate-400 dark:border-slate-700',
      glass: 'bg-slate-900/40 text-slate-300 border-slate-700/50 backdrop-blur-sm',
      dot: 'bg-[#334155] dark:bg-[#94a3b8]',
    },
    // ✨ Gold / Signature / Featured
    gold: {
      pastel: 'bg-[#fde68a] text-[#854d0e] border-transparent dark:bg-[#422d08] dark:text-[#fde047]',
      soft: 'bg-amber-100/90 text-amber-900 border-amber-300/80 dark:bg-[#E5A93C]/15 dark:text-[#F5C467] dark:border-[#E5A93C]/35 shadow-[0_0_12px_rgba(229,169,60,0.15)]',
      solid: 'bg-[#E5A93C] text-[#1A1305] font-bold border-transparent shadow-2xs',
      outline: 'bg-transparent text-amber-800 border-amber-300 dark:text-[#F5C467] dark:border-[#E5A93C]/50',
      glass: 'bg-[#10141E]/90 text-[#F5C467] border-[#E5A93C]/40 shadow-[0_0_15px_-3px_rgba(229,169,60,0.35)] backdrop-blur-md',
      dot: 'bg-[#854d0e] dark:bg-[#fde047]',
    },
    // 🌟 GharMB Brand Coral
    brand: {
      pastel: 'bg-[#ffc5bb] text-[#992211] border-transparent dark:bg-[#4f160e] dark:text-[#ff9b8a]',
      soft: 'bg-[#FF5A3C]/10 text-[#DD543C] border-[#FF5A3C]/20 dark:bg-[#FF5A3C]/15 dark:text-[#FF7A60] dark:border-[#FF5A3C]/30',
      solid: 'bg-[#FF5A3C] text-white font-semibold border-transparent shadow-2xs',
      outline: 'bg-transparent text-[#FF5A3C] border-[#FF5A3C]/40',
      glass: 'bg-[#FF5A3C]/15 text-[#FF7A60] border-[#FF5A3C]/30 shadow-[0_0_12px_rgba(255,90,60,0.2)] backdrop-blur-sm',
      dot: 'bg-[#992211] dark:bg-[#ff7a60]',
    },
  };

  // Color alias normalization
  const normalizedColor =
    color === 'mint' || color === 'sports' || color === 'active' || color === 'green' ? 'emerald' :
    color === 'rose' || color === 'crimson' || color === 'coral' || color === 'offline' ? 'red' :
    color === 'blue' || color === 'cyan' ? 'sky' :
    color === 'yellow' || color === 'news' || color === 'basic' ? 'amber' :
    color === 'violet' || color === 'lavender' || color === 'entertainment' || color === 'premium' || color === 'pass10' ? 'purple' :
    color === 'orange' || color === 'pass4' || color === 'tan' ? 'peach' :
    color === 'gray' || color === 'zinc' || color === 'neutral' || color === 'noplan' || color === 'no-plan' ? 'slate' :
    color;

  const selectedColor = colorStyles[normalizedColor] || colorStyles.slate;
  const selectedVariant = selectedColor[variant] || selectedColor.pastel || selectedColor.soft;

  // Auto-inject default iconography for active & offline if icon is not explicitly overridden
  const effectiveIcon =
    icon !== null ? icon :
    color === 'active' ? <Check size={11} strokeWidth={2.8} className="shrink-0" /> :
    color === 'offline' ? <X size={11} strokeWidth={2.8} className="shrink-0" /> :
    null;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border leading-none shrink-0 transition-all duration-200 select-none ${sizeStyles[size] || sizeStyles.sm} ${selectedVariant} ${shine ? 'badge-shine' : ''} ${className}`}
      {...props}
    >
      {/* Optional Status Dot */}
      {dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${selectedColor.dot}`}
            />
          )}
          <span
            className={`relative inline-flex rounded-full h-1.5 w-1.5 ${selectedColor.dot}`}
          />
        </span>
      )}

      {/* Leading Icon */}
      {effectiveIcon && <span className="shrink-0 flex items-center">{effectiveIcon}</span>}

      {/* Label Content */}
      <span className="truncate">{children}</span>

      {/* Optional Dismiss Action */}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 -mr-1 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors cursor-pointer"
        >
          <span className="text-[11px] leading-none">×</span>
          <span className="sr-only">Remove tag</span>
        </button>
      )}
    </span>
  );
};

// ─── 1. Status Indicator Badges (Image 1 Reference) ──────────────────────────
Badge.Active = ({ children = 'Active', icon, ...props }) => (
  <Badge
    color="emerald"
    variant="pastel"
    icon={icon !== undefined ? icon : <Check size={11} strokeWidth={2.8} className="shrink-0" />}
    {...props}
  >
    {children}
  </Badge>
);

Badge.Offline = ({ children = 'Offline', icon, ...props }) => (
  <Badge
    color="red"
    variant="pastel"
    icon={icon !== undefined ? icon : <X size={11} strokeWidth={2.8} className="shrink-0" />}
    {...props}
  >
    {children}
  </Badge>
);

// ─── 2. Category Pill Badges (Image 2 Reference) ─────────────────────────────
Badge.Sports = ({ children = 'sports', ...props }) => (
  <Badge color="emerald" variant="pastel" {...props}>{children}</Badge>
);

Badge.News = ({ children = 'news', ...props }) => (
  <Badge color="amber" variant="pastel" {...props}>{children}</Badge>
);

Badge.Entertainment = ({ children = 'entertainment', ...props }) => (
  <Badge color="purple" variant="pastel" {...props}>{children}</Badge>
);

// ─── 3. Subscription & Plan Badges (Image 3 Reference) ───────────────────────
Badge.NoPlan = ({ children = 'No Plan', ...props }) => (
  <Badge color="slate" variant="pastel" {...props}>{children}</Badge>
);

Badge.Basic = ({ children = 'Flix9 Basic', ...props }) => (
  <Badge color="amber" variant="pastel" {...props}>{children}</Badge>
);

Badge.Premium = ({ children = 'Flix9 Premium', ...props }) => (
  <Badge color="purple" variant="pastel" {...props}>{children}</Badge>
);

// ─── 4. Pass Model Badges (Image 4 Reference) ────────────────────────────────
Badge.Pass10 = ({ children = 'Series 10 Pass', ...props }) => (
  <Badge color="purple" variant="pastel" {...props}>{children}</Badge>
);

Badge.Pass4 = ({ children = 'Series 4 Pass', ...props }) => (
  <Badge color="peach" variant="pastel" {...props}>{children}</Badge>
);

// ─── 5. GharMB Domain-Specific Helper Badges ─────────────────────────────────
Badge.ForSale = ({ children = 'For Sale', ...props }) => (
  <Badge color="sky" variant="pastel" {...props}>{children}</Badge>
);

Badge.ForRent = ({ children = 'For Rent', ...props }) => (
  <Badge color="emerald" variant="pastel" {...props}>{children}</Badge>
);

Badge.Pending = ({ children = 'Needs Audit', pulse = false, dot = false, icon, ...props }) => (
  <Badge
    color="amber"
    variant="pastel"
    dot={dot}
    pulse={pulse}
    icon={icon !== undefined ? icon : <Clock size={props.size === 'xs' || props.size === '2xs' ? 9.5 : 11} className="shrink-0" />}
    {...props}
  >
    {children}
  </Badge>
);

Badge.Approved = ({ children = 'Approved', icon, ...props }) => (
  <Badge
    color="emerald"
    variant="pastel"
    icon={icon !== undefined ? icon : <CheckCircle2 size={props.size === 'xs' || props.size === '2xs' ? 9.5 : 11} className="shrink-0" />}
    {...props}
  >
    {children}
  </Badge>
);

Badge.Rejected = ({ children = 'Rejected', icon, ...props }) => (
  <Badge
    color="red"
    variant="pastel"
    icon={icon !== undefined ? icon : <XCircle size={props.size === 'xs' || props.size === '2xs' ? 9.5 : 11} className="shrink-0" />}
    {...props}
  >
    {children}
  </Badge>
);

Badge.Sold = ({ children = 'Sold', icon, ...props }) => (
  <Badge
    color="purple"
    variant="pastel"
    icon={icon !== undefined ? icon : <ShieldCheck size={props.size === 'xs' || props.size === '2xs' ? 9.5 : 11} className="shrink-0" />}
    {...props}
  >
    {children}
  </Badge>
);

Badge.Verified = ({ children = 'RERA Verified', icon, ...props }) => (
  <Badge
    color="emerald"
    variant="pastel"
    icon={icon !== undefined ? icon : <Check size={11} strokeWidth={2.8} className="shrink-0" />}
    {...props}
  >
    {children}
  </Badge>
);

Badge.Featured = ({ children = 'Featured', ...props }) => (
  <Badge color="gold" variant="pastel" shine icon={<Star size={10} className="shrink-0 fill-current" />} {...props}>{children}</Badge>
);

Badge.Brand = ({ children = 'GharMB Direct', ...props }) => (
  <Badge color="brand" variant="pastel" {...props}>{children}</Badge>
);

// ─── 6. Category Pill Helpers (BADGES_UI_DESIGN_SYSTEM.md Spec) ───────────────
Badge.Residential = ({ children = 'Residential', ...props }) => (
  <Badge color="slate" variant="pastel" {...props}>{children}</Badge>
);

Badge.Commercial = ({ children = 'Commercial', ...props }) => (
  <Badge color="purple" variant="pastel" {...props}>{children}</Badge>
);

Badge.Land = ({ children = 'Land', ...props }) => (
  <Badge color="peach" variant="pastel" {...props}>{children}</Badge>
);

Badge.Category = ({ type = 'Residential', children, ...props }) => {
  const label = children || type;
  const str = String(label).toLowerCase();
  const color = 
    str.includes('comm') ? 'purple' :
    str.includes('land') || str.includes('plot') ? 'peach' :
    str.includes('villa') || str.includes('lux') ? 'gold' :
    str.includes('indus') || str.includes('agri') ? 'sky' :
    'slate';
  return (
    <Badge color={color} variant="pastel" {...props}>
      {label}
    </Badge>
  );
};

export default Badge;
