# 🏷️ Badges UI Design System & Color Tokens Specification

A unified, production-ready Badges UI Design System designed for modern web applications, admin dashboards, streaming platforms, and real estate portals (GharMB).

---

## 📑 Table of Contents
1. [Core Design Philosophy](#1-core-design-philosophy)
2. [Reference Pastel Pill Specification (Direct Mappings)](#2-reference-pastel-pill-specification-direct-mappings)
3. [Master Color Palette & Semantic Tokens](#3-master-color-palette--semantic-tokens)
4. [Badge Dimensions & Typography Matrix](#4-badge-dimensions--typography-matrix)
5. [Visual Variants](#5-visual-variants)
6. [Pre-Built Convenience Helper Badges](#6-pre-built-convenience-helper-badges)
7. [Ready-to-Use Tailwind CSS Snippets](#7-ready-to-use-tailwind-css-snippets)
8. [Reusable React Component (`<Badge />`)](#8-reusable-react-component-badge-)
9. [Pure Vanilla CSS Stylesheet](#9-pure-vanilla-css-stylesheet)
10. [Accessibility & Best Practices](#10-accessibility--best-practices)

---

## 1. Core Design Philosophy

- **High-Contrast Soft Pastel Tones**: Solid, rich pastel background fills with high-contrast, deeply saturated text of the exact same color family.
- **Flawless Optical Balance**: Fully rounded pills (`rounded-full`) with zero harsh borders (`border-transparent`), comfortable micro-padding (`px-2.5 py-0.5`), and optical vertical centering.
- **Status Iconography**: Status pills pair with minimal crisp icons (e.g. checkmark `✓` for active/verified, cross `✕` for offline/declined, radar clock for pending/audit).
- **Legibility**: Exceeds WCAG AA (minimum 4.5:1) color contrast in both Light and Dark themes.

---

## 2. Reference Pastel Pill Specification (Direct Mappings)

This design system directly matches the following 4 reference design styles:

### 🟢 1. Status Indicator Badges (Image 1 Reference)
- **Active Badge**:
  - Background: `#52c99b` (Soft Mint Green)
  - Text & Icon: `#064e3b` (Deep Forest Teal)
  - Icon: `✓` checkmark (`<Check size={11} strokeWidth={2.8} />`)
  - Usage: `<Badge.Active />` or `<Badge color="emerald" variant="pastel" icon={<Check .../>}>Active</Badge>`
- **Offline Badge**:
  - Background: `#fca5a5` (Soft Coral Salmon)
  - Text & Icon: `#701a2b` (Deep Burgundy / Wine Red)
  - Icon: `✕` cross (`<X size={11} strokeWidth={2.8} />`)
  - Usage: `<Badge.Offline />` or `<Badge color="red" variant="pastel" icon={<X .../>}>Offline</Badge>`

### 🏷️ 2. Content Category Badges (Image 2 Reference)
- **sports**:
  - Background: `#52c99b` / `#86efac` (Mint)
  - Text: `#064e3b` (Dark Teal)
  - Usage: `<Badge.Sports />` or `<Badge color="sports">sports</Badge>`
- **news**:
  - Background: `#fef08a` / `#fde68a` (Warm Butter Yellow)
  - Text: `#78350f` (Dark Warm Brown)
  - Usage: `<Badge.News />` or `<Badge color="news">news</Badge>`
- **entertainment**:
  - Background: `#c4b5fd` / `#d8b4fe` (Pastel Lavender Lilac)
  - Text: `#4c1d95` (Deep Royal Purple)
  - Usage: `<Badge.Entertainment />` or `<Badge color="entertainment">entertainment</Badge>`

### 💳 3. Subscription & Plan Badges (Image 3 Reference)
- **No Plan**:
  - Background: `#e2e8f0` (Cool Slate Gray)
  - Text: `#334155` (Dark Slate Navy)
  - Usage: `<Badge.NoPlan />` or `<Badge color="noplan">No Plan</Badge>`
- **Flix9 Basic / Basic Plan**:
  - Background: `#fef08a` (Warm Butter Amber)
  - Text: `#78350f` (Dark Amber)
  - Usage: `<Badge.Basic />` or `<Badge color="basic">Flix9 Basic</Badge>`
- **Flix9 Premium / Premium Plan**:
  - Background: `#c4b5fd` (Pastel Lavender)
  - Text: `#4c1d95` (Deep Purple)
  - Usage: `<Badge.Premium />` or `<Badge color="premium">Flix9 Premium</Badge>`

### 🎟️ 4. Pass Model Badges (Image 4 Reference)
- **Series 10 Pass**:
  - Background: `#c4b5fd` (Pastel Lavender)
  - Text: `#4c1d95` (Deep Purple)
  - Usage: `<Badge.Pass10 />` or `<Badge color="pass10">Series 10 Pass</Badge>`
- **Series 4 Pass**:
  - Background: `#fed7aa` (Soft Peach / Apricot)
  - Text: `#9a3412` (Dark Rust / Terracotta)
  - Usage: `<Badge.Pass4 />` or `<Badge color="pass4">Series 4 Pass</Badge>`

---

## 3. Master Color Palette & Semantic Tokens

| Palette Key | Semantic Role | Light BG | Light Text | Dark BG | Dark Text | Tailwind Utilities |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Emerald / Mint** | Active, Sports, Verified, Approved | `#52c99b` | `#064e3b` | `#1a4a38` | `#6ee7b7` | `bg-[#52c99b] text-[#064e3b] dark:bg-[#1a4a38] dark:text-[#6ee7b7]` |
| **Red / Coral** | Offline, Inactive, Declined, Terminated | `#fca5a5` | `#701a2b` | `#521722` | `#fda4af` | `bg-[#fca5a5] text-[#701a2b] dark:bg-[#521722] dark:text-[#fda4af]` |
| **Amber / Yellow** | News, Basic Plan, Needs Audit | `#fef08a` | `#78350f` | `#4d3209` | `#fef08a` | `bg-[#fef08a] text-[#78350f] dark:bg-[#4d3209] dark:text-[#fef08a]` |
| **Purple / Lavender** | Entertainment, Premium, Series 10, Sold | `#c4b5fd` | `#4c1d95` | `#3b1968` | `#ddd6fe` | `bg-[#c4b5fd] text-[#4c1d95] dark:bg-[#3b1968] dark:text-[#ddd6fe]` |
| **Peach / Orange** | Series 4 Pass, Special Editions | `#fed7aa` | `#9a3412` | `#52220d` | `#fed7aa` | `bg-[#fed7aa] text-[#9a3412] dark:bg-[#52220d] dark:text-[#fed7aa]` |
| **Sky / Blue** | For Sale, Info, Scheduled | `#bae6fd` | `#075985` | `#113c54` | `#7dd3fc` | `bg-[#bae6fd] text-[#075985] dark:bg-[#113c54] dark:text-[#7dd3fc]` |
| **Slate / Gray** | No Plan, Draft, Neutral, Default | `#e2e8f0` | `#334155` | `#273244` | `#cbd5e1` | `bg-[#e2e8f0] text-[#334155] dark:bg-[#273244] dark:text-[#cbd5e1]` |
| **Gold / Luxury** | Featured, Signature, VIP | `#fde68a` | `#854d0e` | `#422d08` | `#fde047` | `bg-[#fde68a] text-[#854d0e] dark:bg-[#422d08] dark:text-[#fde047]` |
| **GharMB Brand** | Primary Market, Platform Verified | `#ffc5bb` | `#992211` | `#4f160e` | `#ff9b8a` | `bg-[#ffc5bb] text-[#992211] dark:bg-[#4f160e] dark:text-[#ff9b8a]` |

---

## 4. Badge Dimensions & Typography Matrix

| Size Tier | Height | Font Size | Weight | Padding (X / Y) | Icon Size | Typical Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **XS (Micro)** | `20px` | `10px` | `font-semibold` | `px-2 py-0` | `10px` | Dense data tables, card badges, status in compact rows |
| **SM (Compact)**| `24px` | `11px` | `font-medium` | `px-2.5 py-0.5` | `11px` | Standard dashboard tables, filter tags, list items |
| **MD (Standard)**| `28px` | `12px` | `font-medium` | `px-3 py-1` | `12px` | Detail modal headers, navigation bar pills, stats cards |
| **LG (Hero)** | `32px` | `13px` | `font-semibold` | `px-3.5 py-1.5` | `14px` | Landing page banner badges, pricing cards, verification seals |

---

## 5. Visual Variants

- **`variant="pastel"` (Default / Recommended)**: Opaque soft pastel background, seamless borderless edge, saturated dark contrast text. Matches all reference images.
- **`variant="soft"`**: Subtle 12% translucent background with hairline alpha border.
- **`variant="solid"`**: Bold, fully opaque saturated tone with high-contrast text.
- **`variant="outline"`**: Transparent background with crisp 1px colored border.
- **`variant="glass"`**: Dark translucent backdrop with ambient colored drop shadow and blur.

---

## 6. Pre-Built Convenience Helper Badges

```jsx
import Badge from '@/components/ui/Badge';

// 1. Live Status Indicators
<Badge.Active />          // Renders '✓ Active' in mint pastel
<Badge.Offline />         // Renders '✕ Offline' in coral pastel

// 2. Categories
<Badge.Sports />          // Renders 'sports' in mint
<Badge.News />            // Renders 'news' in butter yellow
<Badge.Entertainment />   // Renders 'entertainment' in lavender purple

// 3. Subscription Plans
<Badge.NoPlan />          // Renders 'No Plan' in cool slate
<Badge.Basic />           // Renders 'Flix9 Basic' in warm amber
<Badge.Premium />         // Renders 'Flix9 Premium' in lavender purple

// 4. Pass Models
<Badge.Pass10 />          // Renders 'Series 10 Pass' in lavender
<Badge.Pass4 />           // Renders 'Series 4 Pass' in soft peach

// 5. Real Estate & Platform Entities
<Badge.Approved />        // Renders 'Approved' with checkmark
<Badge.Pending />         // Renders 'Needs Audit' with pulsing beacon
<Badge.Rejected />        // Renders 'Rejected' with cross
<Badge.Sold />            // Renders 'Sold' with shield
<Badge.ForSale />         // Renders 'For Sale' in sky blue
<Badge.ForRent />         // Renders 'For Rent' in emerald
<Badge.Verified />        // Renders 'RERA Verified'
<Badge.Featured />        // Renders 'Featured' with gold metallic shine
<Badge.Brand />           // Renders 'GharMB Direct'
```

---

## 7. Ready-to-Use Tailwind CSS Snippets

```html
<!-- 1. Active Status Pill -->
<span class="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium bg-[#52c99b] text-[#064e3b] dark:bg-[#1a4a38] dark:text-[#6ee7b7] select-none">
  <svg class="w-3 h-3 stroke-[2.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
  Active
</span>

<!-- 2. Offline Status Pill -->
<span class="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium bg-[#fca5a5] text-[#701a2b] dark:bg-[#521722] dark:text-[#fda4af] select-none">
  <svg class="w-3 h-3 stroke-[2.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
  Offline
</span>

<!-- 3. Category: sports -->
<span class="inline-flex items-center justify-center h-6 px-2.5 rounded-full text-[11px] font-medium bg-[#52c99b] text-[#064e3b] dark:bg-[#1a4a38] dark:text-[#6ee7b7] select-none">
  sports
</span>

<!-- 4. Category: news -->
<span class="inline-flex items-center justify-center h-6 px-2.5 rounded-full text-[11px] font-medium bg-[#fef08a] text-[#78350f] dark:bg-[#4d3209] dark:text-[#fef08a] select-none">
  news
</span>

<!-- 5. Category: entertainment -->
<span class="inline-flex items-center justify-center h-6 px-2.5 rounded-full text-[11px] font-medium bg-[#c4b5fd] text-[#4c1d95] dark:bg-[#3b1968] dark:text-[#ddd6fe] select-none">
  entertainment
</span>

<!-- 6. Plan: No Plan -->
<span class="inline-flex items-center justify-center h-6 px-2.5 rounded-full text-[11px] font-medium bg-[#e2e8f0] text-[#334155] dark:bg-[#273244] dark:text-[#cbd5e1] select-none">
  No Plan
</span>

<!-- 7. Pass: Series 4 Pass -->
<span class="inline-flex items-center justify-center h-6 px-2.5 rounded-full text-[11px] font-medium bg-[#fed7aa] text-[#9a3412] dark:bg-[#52220d] dark:text-[#fed7aa] select-none">
  Series 4 Pass
</span>
```

---

## 8. Pure Vanilla CSS Stylesheet

```css
/* Base Pill */
.ui-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border-width: 1px;
  border-style: solid;
  font-family: inherit;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  vertical-align: middle;
  transition: all 0.2s ease;
  user-select: none;
}

/* Size Variants */
.ui-badge-xs { height: 20px; padding: 0 8px; font-size: 10px; gap: 4px; font-weight: 600; }
.ui-badge-sm { height: 24px; padding: 0 10px; font-size: 11px; gap: 6px; }
.ui-badge-md { height: 28px; padding: 0 12px; font-size: 12px; gap: 6px; }
.ui-badge-lg { height: 32px; padding: 0 14px; font-size: 14px; gap: 8px; font-weight: 600; }

/* Pastel Themes */
.ui-badge-pastel-emerald { background-color: #52c99b; color: #064e3b; border-color: transparent; }
.ui-badge-pastel-red     { background-color: #fca5a5; color: #701a2b; border-color: transparent; }
.ui-badge-pastel-amber   { background-color: #fef08a; color: #78350f; border-color: transparent; }
.ui-badge-pastel-purple  { background-color: #c4b5fd; color: #4c1d95; border-color: transparent; }
.ui-badge-pastel-peach   { background-color: #fed7aa; color: #9a3412; border-color: transparent; }
.ui-badge-pastel-sky     { background-color: #bae6fd; color: #075985; border-color: transparent; }
.ui-badge-pastel-slate   { background-color: #e2e8f0; color: #334155; border-color: transparent; }

/* Dark Mode Overrides */
.dark .ui-badge-pastel-emerald { background-color: #1a4a38; color: #6ee7b7; }
.dark .ui-badge-pastel-red     { background-color: #521722; color: #fda4af; }
.dark .ui-badge-pastel-amber   { background-color: #4d3209; color: #fef08a; }
.dark .ui-badge-pastel-purple  { background-color: #3b1968; color: #ddd6fe; }
.dark .ui-badge-pastel-peach   { background-color: #52220d; color: #fed7aa; }
.dark .ui-badge-pastel-sky     { background-color: #113c54; color: #7dd3fc; }
.dark .ui-badge-pastel-slate   { background-color: #273244; color: #cbd5e1; }
```

---

## 9. Accessibility & Best Practices

1. **Never Depend Exclusively on Color**: Always pair color with an informative text label and/or an icon (e.g. `✓` for active, `✕` for offline).
2. **Accessible Status Announcements**: For dynamic status changes, include `role="status"` or `aria-label`.
3. **Screen-Reader Dismiss Buttons**: For dismissible filter tags, provide `<span className="sr-only">Remove {tag}</span>`.
4. **Touch Target Size**: If a badge is interactive (filter chip, remove action), provide an interactive touch area of at least `28px × 28px`.
