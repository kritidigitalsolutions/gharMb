import React from 'react';
import { motion } from 'framer-motion';

/**
 * Size presets for RippleWaveLoader (sharp, balanced pill bars)
 */
const WAVE_SIZES = {
  xs: { height: 'h-3.5', width: 'w-0.5', gap: 'space-x-0.5' },
  sm: { height: 'h-5', width: 'w-1', gap: 'space-x-1' },
  md: { height: 'h-7', width: 'w-1.5', gap: 'space-x-1' },
  lg: { height: 'h-10', width: 'w-2', gap: 'space-x-1.5' },
  xl: { height: 'h-12', width: 'w-2.5', gap: 'space-x-2' },
};

/**
 * Size presets for PulsatingDots (crisp solid dots)
 */
const DOTS_SIZES = {
  xs: { size: 'h-1.5 w-1.5', gap: 'space-x-1.5' },
  sm: { size: 'h-2 w-2', gap: 'space-x-2' },
  md: { size: 'h-2.5 w-2.5', gap: 'space-x-2' },
  lg: { size: 'h-3.5 w-3.5', gap: 'space-x-2.5' },
  xl: { size: 'h-4 w-4', gap: 'space-x-3' },
};

/**
 * RippleWaveLoader
 * Solid project brand color (#FF5A3C), completely flat without glow or gradients.
 * Engineered with silky sinusoidal wave dynamics.
 */
export function RippleWaveLoader({
  bars = 7,
  size = 'md',
  colorClass = 'bg-[#FF5A3C]',
  className = '',
}) {
  const sizeConfig = WAVE_SIZES[size] || WAVE_SIZES.md;

  return (
    <div
      role="status"
      aria-label="Loading..."
      className={`flex items-center justify-center ${sizeConfig.gap} ${className}`}
    >
      {[...Array(bars)].map((_, index) => (
        <motion.div
          key={index}
          className={`${sizeConfig.height} ${sizeConfig.width} rounded-full ${colorClass}`}
          animate={{
            scaleY: [0.35, 1.4, 0.35],
            opacity: [0.45, 1, 0.45],
            translateY: ['0%', '-14%', '0%'],
          }}
          transition={{
            duration: 0.95,
            repeat: Infinity,
            ease: [0.45, 0.05, 0.55, 0.95],
            delay: index * 0.1,
          }}
        />
      ))}
    </div>
  );
}

/**
 * PulsatingDots
 * Solid project brand color (#FF5A3C), clean, crisp without glow or gradients.
 */
export function PulsatingDots({
  dots = 3,
  size = 'md',
  colorClass = 'bg-[#FF5A3C]',
  className = '',
}) {
  const sizeConfig = DOTS_SIZES[size] || DOTS_SIZES.md;

  return (
    <div
      role="status"
      aria-label="Loading..."
      className={`flex items-center justify-center ${className}`}
    >
      <div className={`flex ${sizeConfig.gap}`}>
        {[...Array(dots)].map((_, index) => (
          <motion.div
            key={index}
            className={`${sizeConfig.size} rounded-full ${colorClass}`}
            animate={{
              scale: [0.85, 1.3, 0.85],
              opacity: [0.35, 1, 0.35],
            }}
            transition={{
              duration: 0.85,
              ease: 'easeInOut',
              repeat: Infinity,
              delay: index * 0.18,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * AdminLoader - Master loader for the whole admin panel
 * Clean, modern, minimalist SaaS aesthetic.
 */
export default function AdminLoader({
  variant = 'wave', // 'wave' | 'dots'
  size = 'md',
  text,
  subtext,
  fullPage = false,
  card = false,
  minHeight = 'min-h-[180px]',
  className = '',
  colorClass = 'bg-[#FF5A3C]',
}) {
  const LoaderComponent = variant === 'dots' ? PulsatingDots : RippleWaveLoader;

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col items-center justify-center gap-3 select-none ${className}`}
    >
      <LoaderComponent size={size} colorClass={colorClass} />

      {(text || subtext) && (
        <div className="flex flex-col items-center text-center gap-0.5 max-w-sm px-4 mt-0.5">
          {text && (
            <p className="text-xs font-semibold text-[var(--text-primary)] tracking-tight">
              {text}
            </p>
          )}
          {subtext && (
            <p className="text-[11px] text-[var(--text-muted)] font-normal leading-relaxed">
              {subtext}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );

  // Full-viewport minimal overlay
  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-main)]/85 backdrop-blur-xs">
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-7 py-6 shadow-sm flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
            <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--text-muted)]">
              GharMB Admin
            </span>
          </div>
          {content}
        </div>
      </div>
    );
  }

  // Card container mode
  if (card) {
    return (
      <div className={`bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 flex items-center justify-center shadow-2xs ${minHeight} ${className}`}>
        {content}
      </div>
    );
  }

  // Section / standard mode
  return (
    <div className={`flex items-center justify-center w-full py-8 ${minHeight}`}>
      {content}
    </div>
  );
}

/**
 * Convenience helper for page-level loading state
 */
export function PageLoader({ text = 'Loading data...', subtext, ...props }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[360px] w-full py-12">
      <AdminLoader text={text} subtext={subtext} size="md" variant="wave" {...props} />
    </div>
  );
}

/**
 * Convenience helper for compact table/drawer state
 */
export function TableLoader({ text = 'Fetching records...', ...props }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 w-full">
      <AdminLoader text={text} size="sm" variant="wave" minHeight="min-h-[120px]" {...props} />
    </div>
  );
}
