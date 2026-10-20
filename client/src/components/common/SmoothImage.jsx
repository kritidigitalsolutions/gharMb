import React, { useState, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';

/**
 * SmoothImage Component
 * Production-ready, buttery-smooth image loader with:
 * - Off-thread asynchronous decoding (decoding="async")
 * - Smart native lazy loading (loading="lazy" by default, configurable to "eager")
 * - Elegant skeleton shimmer placeholder during download (prevents layout shift)
 * - Hardware-accelerated CSS fade-in on load (no harsh visual pop)
 * - Safe error fallback placeholder on network drop or broken URL
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

  // Reset state whenever src changes
  useEffect(() => {
    if (!src) {
      setHasError(true);
      setIsLoaded(false);
      return;
    }
    setHasError(false);
    setIsLoaded(false);

    // If image is already cached in browser memory, show instantly
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
        <div className="absolute inset-0 bg-slate-200/70 dark:bg-zinc-800/60 animate-pulse flex items-center justify-center z-0">
          <ImageIcon className="w-5 h-5 text-slate-400 dark:text-zinc-600 opacity-40 animate-pulse" />
        </div>
      )}

      {/* 2. Error Fallback state */}
      {hasError ? (
        fallback || (
          <div className="w-full h-full min-h-[40px] bg-slate-100 dark:bg-zinc-800/80 flex flex-col items-center justify-center p-2 text-slate-400 dark:text-zinc-500">
            <ImageIcon className="w-5 h-5 mb-1 opacity-50" />
            <span className="text-[10px] font-medium opacity-60 truncate max-w-full">
              No image
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
