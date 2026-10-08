import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const InteractiveHoverButton = React.forwardRef(
  ({ text = "Button", loading = false, loadingText = "Signing in...", className, children, ...props }, ref) => {
    const displayText = children || text;

    return (
      <button
        ref={ref}
        className={cn(
          "group relative inline-flex items-center justify-center cursor-pointer overflow-hidden rounded-full border-0 bg-white p-2 text-center font-bold text-black transition-all duration-300 active:scale-[0.985] disabled:opacity-60 disabled:pointer-events-none select-none",
          className
        )}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <div className="relative z-20 flex h-full w-full items-center justify-center gap-2 text-black font-bold">
            <Loader2 size={16} className="animate-spin text-black" />
            <span className="text-xs sm:text-sm font-semibold">{loadingText}</span>
          </div>
        ) : (
          <>
            {/* Base Layer: Crisp Black Text on White Background */}
            <span className="relative z-10 inline-flex items-center justify-center font-bold text-black">
              {displayText}
            </span>

            {/* Ripple Layer: Expanding Orange Mask with Perfectly Aligned White Text */}
            <span
              aria-hidden="true"
              className="absolute inset-0 z-20 flex items-center justify-center bg-[#FF5A3C] [clip-path:circle(0%_at_50%_50%)] group-hover:[clip-path:circle(115%_at_50%_50%)] transition-[clip-path] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none will-change-[clip-path]"
            >
              <span className="inline-flex items-center justify-center font-bold text-white">
                {displayText}
              </span>
            </span>
          </>
        )}
      </button>
    );
  }
);

InteractiveHoverButton.displayName = "InteractiveHoverButton";

export { InteractiveHoverButton };
