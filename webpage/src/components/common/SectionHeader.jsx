export default function SectionHeader({ eyebrow, title, subtitle, align = 'left', className = '' }) {
  return (
    <div className={`${align === 'center' ? 'text-center mx-auto' : ''} max-w-2xl ${className}`}>
      {eyebrow && (
        <span className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-brand mb-3">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-text-primary leading-[1.15] tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base sm:text-lg text-text-secondary leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
