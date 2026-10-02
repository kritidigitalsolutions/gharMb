import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, BarChart3 } from 'lucide-react';

// Smooth Spline / Curve icon SVG
const SplineIcon = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 17c3.5-3.5 6-10 10-10s5 8 8 3" />
  </svg>
);

export function ViewToggle({ value = 'curve', onChange }) {
  return (
    <div className="pointer-events-auto inline-flex items-center rounded-md bg-[var(--bg-muted)]/70 p-0.5 border border-[var(--border)] shadow-2xs">
      <button
        type="button"
        onClick={() => onChange?.('curve')}
        aria-label="Curve View"
        title="Smooth Area Chart"
        className={`flex h-5 w-5 items-center justify-center rounded transition-all cursor-pointer ${
          value === 'curve'
            ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs font-semibold'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
      >
        <SplineIcon size={11} />
      </button>
      <button
        type="button"
        onClick={() => onChange?.('bar')}
        aria-label="Bar View"
        title="Bar Chart"
        className={`flex h-5 w-5 items-center justify-center rounded transition-all cursor-pointer ${
          value === 'bar'
            ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs font-semibold'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
      >
        <BarChart3 size={11} strokeWidth={2.2} />
      </button>
    </div>
  );
}

export function PeriodSelect({ value, options = [], onChange, accentText }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-auto relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer py-0.5 px-2 rounded-md hover:bg-[var(--bg-muted)]/60"
      >
        <span>{value}</span>
        <ChevronDown
          size={11}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[130px] rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-1 shadow-lg backdrop-blur-md animate-in fade-in zoom-in-95">
          {options.map((option) => {
            const isSelected = option.label === value;
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => {
                  onChange?.(option);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[11px] transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--bg-muted)] font-semibold text-[var(--text-primary)]'
                    : 'text-[var(--text-subtle)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>{option.label}</span>
                {isSelected && (
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: accentText || '#FF5A3C' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
