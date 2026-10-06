import { createContext, useContext, useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem("adminTheme") || "light");
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    document.body.classList.remove("theme-dark", "theme-light");
    document.body.classList.add(theme === "light" ? "theme-light" : "theme-dark");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("adminTheme", theme);
  }, [theme]);

  const toggleTheme = (e) => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    // Prevent concurrent/overlapping transitions if user clicks rapidly
    if (isTransitioningRef.current) return;

    // Fallback if View Transitions API is not supported or user prefers reduced motion
    if (
      typeof document === "undefined" ||
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setTheme(nextTheme);
      return;
    }

    isTransitioningRef.current = true;

    // Calculate radial ripple origin from exact element center or mouse click
    let x, y;
    if (e?.currentTarget && typeof e.currentTarget.getBoundingClientRect === "function") {
      const rect = e.currentTarget.getBoundingClientRect();
      x = Math.round(rect.left + rect.width / 2);
      y = Math.round(rect.top + rect.height / 2);
    } else if (e && typeof e.clientX === "number" && (e.clientX !== 0 || e.clientY !== 0)) {
      x = Math.round(e.clientX);
      y = Math.round(e.clientY);
    } else if (e?.target && typeof e.target.getBoundingClientRect === "function") {
      const rect = e.target.getBoundingClientRect();
      x = Math.round(rect.left + rect.width / 2);
      y = Math.round(rect.top + rect.height / 2);
    } else {
      x = Math.round(window.innerWidth - 60);
      y = 32;
    }

    // Exact radius needed to fully encompass all four viewport corners + safety margin
    const endRadius = Math.ceil(
      Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      ) + 20
    );

    // Disable CSS transition delays while taking the new state snapshot to prevent shutter
    document.documentElement.classList.add("theme-transitioning");

    try {
      const transition = document.startViewTransition(() => {
        // flushSync forces React to synchronously render the new theme DOM
        // before the browser captures the ::view-transition-new(root) snapshot
        flushSync(() => {
          setTheme(nextTheme);
          document.body.classList.remove("theme-dark", "theme-light");
          document.body.classList.add(nextTheme === "light" ? "theme-light" : "theme-dark");
          if (nextTheme === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
          localStorage.setItem("adminTheme", nextTheme);
        });
      });

      transition.ready
        .then(() => {
          // Re-enable normal interactive transitions once the snapshot has been captured
          document.documentElement.classList.remove("theme-transitioning");

          const anim = document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`
              ]
            },
            {
              duration: 480,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              pseudoElement: "::view-transition-new(root)"
            }
          );

          return anim.finished;
        })
        .catch((err) => {
          console.warn("View transition animation interrupted:", err);
          document.documentElement.classList.remove("theme-transitioning");
        });

      transition.finished.finally(() => {
        document.documentElement.classList.remove("theme-transitioning");
        isTransitioningRef.current = false;
      });
    } catch (err) {
      console.warn("View transition failed, falling back to direct switch:", err);
      document.documentElement.classList.remove("theme-transitioning");
      isTransitioningRef.current = false;
      setTheme(nextTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};