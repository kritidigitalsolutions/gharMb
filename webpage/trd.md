# GharMB Real Estate — Technical Requirements Document

## 1. Project Overview

Build a production-ready, fully responsive marketing website for "GharMB", a modern real-estate technology platform.

GharMB already has a mobile real-estate application whose UI/UX is provided through the attached reference screenshots.

The existing app supports:

- Property discovery
- Verified properties
- Buy / Rent / Lease
- Residential properties
- Commercial spaces
- Property developers
- Property owners
- Agents / brokers
- Property listing
- Property verification
- Token requests
- Token booking
- Property dashboards
- Real-estate news
- Real-estate insights
- Loan calculator
- Unit converter
- Location/map discovery
- Property recommendations
- User preferences
- Notifications
- Property management
- Developer discovery
- Commercial property discovery

The new website is NOT supposed to replicate the mobile app screen-by-screen.

It should represent GharMB as a premium, trustworthy and modern real-estate platform.

The website must feel like a real established product, not an AI-generated landing page or generic SaaS template.

---

# 2. Technology

Use:

- React
- Vite
- TypeScript if project supports it
- Tailwind CSS
- Modern React component architecture
- React Router
- Lucide React or another lightweight icon library
- Remix Icon may be used where appropriate
- Google Fonts / locally loaded fonts where appropriate
- Framer Motion only for subtle animations
- shadcn/ui or Radix-based primitives where useful

Do NOT overuse component-library defaults.

Every important visual component should be customized to match GharMB branding.

---

# 3. Architecture

Use a scalable structure:

src/
  assets/
  components/
    common/
    layout/
    navigation/
    property/
    blog/
    sections/
    ui/
  pages/
    Home/
    Blog/
    BlogDetail/
    About/
    Properties/
    Developers/
    Contact/
  data/
  hooks/
  lib/
  routes/
  styles/
  types/

Use reusable components.

Avoid creating one huge Home.jsx/Home.tsx file.

---

# 4. Routing

Create routes for:

/
 /properties
 /developers
 /commercial
 /about
 /blog
 /blog/:slug
 /contact

Future-ready routes can include:

 /property/:slug
 /developer/:slug
 /search

The Blog detail page must have its own dedicated layout.

---

# 5. Responsive Requirements

The website must work properly on:

- 320px mobile
- 375px mobile
- 390px mobile
- 430px mobile
- 768px tablet
- 1024px laptop
- 1280px desktop
- 1440px desktop
- 1920px large desktop

Do not simply shrink desktop layouts.

Mobile must have intentionally designed layouts.

Navigation should transform into a mobile drawer.

Cards should become stacked layouts.

Grids should reduce intelligently.

Typography must scale responsively.

Hero sections must remain visually strong on mobile.

---

# 6. Branding

Primary brand:

Flame Coral:
#FF5A3C

Primary Light:
#FFF0ED

Primary Dark:
#E04F34

Brand Accent:
#FF7A63

Use the existing GharMB logo and visual identity from the provided screenshots.

Landing page should be LIGHT MODE only.

Do NOT create a dark landing page.

Do NOT introduce random purple, blue, neon gradients or SaaS colors.

Suggested neutral palette:

Background:
#FFFFFF

Soft background:
#FAFAF9

Warm surface:
#FFF8F6

Text primary:
#17202A

Text secondary:
#667085

Border:
#E8E8E8

Muted:
#98A2B3

Success:
#16A36A

Warning:
#F59E0B

Error:
#E5484D

---

# 7. Performance

Optimize for:

- Lighthouse performance
- Fast first contentful paint
- Lazy-loaded images
- WebP/AVIF images where possible
- Responsive image sizes
- Minimal JavaScript
- Avoid unnecessary animation libraries
- Avoid huge background images
- Avoid layout shift

Animations should never block page rendering.

---

# 8. Accessibility

Implement:

- semantic HTML
- keyboard navigation
- visible focus states
- accessible buttons
- aria labels where needed
- proper heading hierarchy
- readable contrast
- alt text for images
- accessible mobile drawer
- Escape key support for dialogs/drawers

---

# 9. SEO

Every page must support:

- unique title
- meta description
- canonical URL
- Open Graph metadata
- Twitter metadata
- semantic headings
- descriptive image alt text

Blog detail pages should have:

- Article schema
- Breadcrumb schema
- Author information
- Published date
- Updated date
- Reading time

---

# 10. Components

Create reusable:

Navbar
MobileDrawer
Button
Badge
SectionHeading
PropertyCard
DeveloperCard
NewsCard
BlogCard
StatCard
FeatureCard
TestimonialCard
CTASection
Footer
Breadcrumb
ShareButtons
TableOfContents
RelatedArticles
SearchInput
CategoryPills
PropertySearchBar
LogoCloud
TrustBadge

---

# 11. Interactions

Implement:

- smooth scrolling
- navbar state change on scroll
- mobile drawer
- dropdown navigation
- blog category filtering
- blog search UI
- share buttons
- FAQ accordion
- hover states
- subtle card interactions
- animated counters where useful
- image hover transitions

Do not create excessive motion.

---

# 12. Data

For initial development use structured local mock data.

Do not hardcode repeated content directly inside JSX.

Use:

src/data/properties.ts
src/data/blogs.ts
src/data/developers.ts
src/data/testimonials.ts

This makes future API integration easy.

---

# 13. Important Technical Principle

The website should be API-ready.

Do not tightly couple UI components with mock data.

Example:

<PropertyCard property={property} />

rather than hardcoded property information inside the component.

The same architecture should later support:

REST APIs
GraphQL
CMS
Headless CMS
Real-estate backend APIs

---

# 14. Final Technical Goal

The final implementation should look and behave like a professionally engineered real-estate product website.

It must NOT look like:

- AI-generated website
- generic Tailwind template
- generic SaaS landing page
- excessive glassmorphism
- excessive gradients
- random floating cards
- excessive rounded containers
- excessive shadows
- Dribbble-only concept design

Prioritize:

clarity
trust
property imagery
real estate context
premium typography
strong spacing
real content hierarchy
responsive behavior
performance
maintainability