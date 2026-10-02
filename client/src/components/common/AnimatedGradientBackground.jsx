import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useTheme } from "../../contexts/ThemeContexts";

/**
 * AnimatedGradientBackground
 *
 * Renders an animated radial gradient background with a subtle breathing effect,
 * customized strictly to the GharMB 6-color palette (#111111, #444444, #FF5A3C, #888888, #DDDDDD, #DD543C).
 */
const AnimatedGradientBackground = ({
  startingGap = 115,
  Breathing = true,
  forceDark = false,
  gradientColors,
  gradientStops = [25, 42, 56, 70, 82, 92, 100],
  animationSpeed = 0.04,
  breathingRange = 8,
  containerStyle = {},
  topOffset = 0,
  containerClassName = "",
}) => {
  const { theme } = useTheme();
  const isDark = forceDark || theme === "dark";

  // Default colors tuned strictly to the website 6-color scheme for Dark vs Light mode
  const defaultColors = isDark
    ? [
        "#111111", // Deep Onyx center
        "#444444", // Dark Charcoal
        "#DD543C", // Rust / Deep Coral
        "#FF5A3C", // Radiant Brand Coral Flame
        "#DD543C", // Deep Coral contour
        "#444444", // Charcoal ambient fade
        "#111111", // Outer Deep Onyx canvas
      ]
    : [
        "#DDDDDD", // Platinum mist center
        "#888888", // Soft steel contour
        "#DD543C", // Deep Coral
        "#FF5A3C", // Radiant Brand Coral Flame
        "#DD543C", // Deep Coral
        "#888888", // Soft steel transition
        "#DDDDDD", // Platinum mist outer canvas
      ];

  const activeColors = gradientColors || defaultColors;

  // Validation
  if (activeColors.length !== gradientStops.length) {
    console.warn(
      `GradientColors length (${activeColors.length}) must match GradientStops length (${gradientStops.length}). Falling back to matching slices.`
    );
  }

  const containerRef = useRef(null);

  useEffect(() => {
    let animationFrame;
    let width = startingGap;
    let directionWidth = 1;

    const animateGradient = () => {
      if (width >= startingGap + breathingRange) directionWidth = -1;
      if (width <= startingGap - breathingRange) directionWidth = 1;

      if (!Breathing) directionWidth = 0;
      width += directionWidth * animationSpeed;

      const colorsToUse = activeColors.slice(0, gradientStops.length);
      const gradientStopsString = gradientStops
        .map((stop, index) => `${colorsToUse[index] || colorsToUse[0]} ${stop}%`)
        .join(", ");

      const gradient = `radial-gradient(${width}% ${width + topOffset}% at 50% 25%, ${gradientStopsString})`;

      if (containerRef.current) {
        containerRef.current.style.background = gradient;
      }

      animationFrame = requestAnimationFrame(animateGradient);
    };

    animationFrame = requestAnimationFrame(animateGradient);

    return () => cancelAnimationFrame(animationFrame);
  }, [startingGap, Breathing, activeColors, gradientStops, animationSpeed, breathingRange, topOffset]);

  return (
    <motion.div
      key={`animated-gradient-bg-${isDark ? "dark" : "light"}`}
      initial={{
        opacity: 0,
        scale: 1.15,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        transition: {
          duration: 1.2,
          ease: [0.25, 0.1, 0.25, 1],
        },
      }}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${containerClassName}`}
    >
      <div
        ref={containerRef}
        style={containerStyle}
        className="absolute inset-0 transition-opacity duration-700"
      />
    </motion.div>
  );
};

export default AnimatedGradientBackground;
