import React, { useState, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';

/**
 * SmoothImage Component (Webpage / Public Site)
 * High-performance, progressive image loader designed for smooth scrolling and instant feel.
 * - Hardware-accelerated decoding ("async")
 * - Smart native lazy loading ("lazy")
 * - Shimmer skeleton placeholder during loading
 * - Smooth opacity fade-in transition
 * - Graceful fallback on broken image URLs
 */
export default function SmoothImage({
  src,
  alt = '',
  className = 'w-full h-full object-cover',
  containerClassName = '',
  loading = 'lazy',
  priority = false,
  fallback = null,
  onClick,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(!src);

  useEffect(() => {
    if (!src) {
      setHasError(true);
      setIsLoaded(false);
      return;
    }
    setHasError(false);
    setIsLoaded(false);

    // Instant check for memory-cached images
    const img = new Image();
    img.src = src;
    if (img.complete && img.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src]);

  return (
    <div
      className={`relative overflow-hidden ${containerClassName}`}
      onClick={onClick}
    >
      {/* 1. Shimmer Skeleton Placeholder while loading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center z-0">
          <ImageIcon className="w-6 h-6 text-slate-300 opacity-60 animate-pulse" />
        </div>
      )}

      {/* 2. Error Fallback state */}
      {hasError ? (
        fallback || (
          <div className="w-full h-full min-h-[60px] bg-slate-50 flex flex-col items-center justify-center p-3 text-slate-400">
            <ImageIcon className="w-6 h-6 mb-1 opacity-40" />
            <span className="text-[11px] font-medium text-slate-400 truncate max-w-full">
              Image unavailable
            </span>
          </div>
        )
      ) : (
        /* 3. Smooth Hardware-Accelerated Image */
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : loading}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`${className} transition-opacity duration-300 ease-out ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      )}
    </div>
  );
}
