const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Banner = require('../src/models/banner.model');
const Admin = require('../src/models/admin.model');

const HIGH_QUALITY_BANNERS = [
  // ── HOME TOP (Hero Carousel on Mobile App & Web Portal) ──────────────────────
  {
    title: 'Luxury Penthouses & Skyline Living',
    subtitle: 'Explore hand-picked, RERA-approved residences in prime metropolitan locations.',
    description: 'Ultra-luxury high-rise residences with panoramic city views, private elevators, and concierge amenities.',
    position: 'home_top',
    linkType: 'category',
    linkValue: 'Residential',
    buttonText: 'Explore Luxury',
    sortOrder: 1,
    isActive: true,
    viewsCount: 1420,
    clicksCount: 310,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=85',
    mobileImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&h=1000&q=85'
  },
  {
    title: 'Direct Developer Rates — Zero Brokerage',
    subtitle: 'Connect directly with certified Tier-1 builders with guaranteed escrow safety.',
    description: 'Direct builder inventory with pre-launch pricing, verified RERA clearances, and 100% transparent documentation.',
    position: 'home_top',
    linkType: 'project',
    linkValue: 'New Projects',
    buttonText: 'View Projects',
    sortOrder: 2,
    isActive: true,
    viewsCount: 1180,
    clicksCount: 265,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=85',
    mobileImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&h=1000&q=85'
  },
  {
    title: 'Grade-A Commercial Spaces & Tech Parks',
    subtitle: 'Pre-leased offices, retail storefronts, and premium corporate campuses.',
    description: 'Institutional-grade commercial properties situated in prime business corridors with Fortune 500 tenants.',
    position: 'home_top',
    linkType: 'commercial',
    linkValue: 'Commercial',
    buttonText: 'Browse Commercial',
    sortOrder: 3,
    isActive: true,
    viewsCount: 950,
    clicksCount: 198,
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=85',
    mobileImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&h=1000&q=85'
  },

  // ── HOME MIDDLE (Promotional Card / Feature Strip) ───────────────────────────
  {
    title: 'Book VIP Site Visits with GharMB Experts',
    subtitle: 'Free door-to-door cab pickup, expert legal consultation, and guided property tours.',
    description: 'Personalized site visit experience with verified real-estate specialists and independent title verification assistance.',
    position: 'home_middle',
    linkType: 'screen',
    linkValue: 'SiteVisitBookingScreen',
    buttonText: 'Book Free Visit',
    sortOrder: 1,
    isActive: true,
    viewsCount: 840,
    clicksCount: 175,
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1920&q=85',
    mobileImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&h=1000&q=85'
  },

  // ── RESIDENTIAL SECTION BANNER ───────────────────────────────────────────────
  {
    title: 'Ready-to-Move 2 & 3 BHK Family Homes',
    subtitle: 'Near metro corridors, top international schools, and vibrant lifestyle centers.',
    description: 'Immediate possession residential apartments with clubhouses, green parks, and high rental demand.',
    position: 'residential',
    linkType: 'category',
    linkValue: 'Residential',
    buttonText: 'See Ready Homes',
    sortOrder: 1,
    isActive: true,
    viewsCount: 760,
    clicksCount: 154,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1920&q=85',
    mobileImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&h=1000&q=85'
  },

  // ── COMMERCIAL SECTION BANNER ────────────────────────────────────────────────
  {
    title: 'High-Yield Pre-Leased Commercial Assets',
    subtitle: 'Earn up to 8.5% guaranteed rental yield with long-term corporate leases.',
    description: 'Secure, passive rental income from verified commercial spaces, high-street retail, and medical centers.',
    position: 'commercial',
    linkType: 'commercial',
    linkValue: 'Commercial',
    buttonText: 'View High-Yield Assets',
    sortOrder: 1,
    isActive: true,
    viewsCount: 680,
    clicksCount: 132,
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=85',
    mobileImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&h=1000&q=85'
  },

  // ── HOME BOTTOM (Seller / Owner CTA Banner) ──────────────────────────────────
  {
    title: 'Selling or Renting Your Property? List with GharMB',
    subtitle: 'Reach 50,000+ active verified buyers with zero listing fees and fast settlement.',
    description: 'List your property in under 2 minutes. Get dedicated agent support and premium placement on GharMB.',
    position: 'home_bottom',
    linkType: 'screen',
    linkValue: 'AddPropertyScreen',
    buttonText: 'Post Free Property',
    sortOrder: 1,
    isActive: true,
    viewsCount: 1100,
    clicksCount: 220,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=85',
    mobileImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&h=1000&q=85'
  },

  // ── POPUP (App Launch Promotional Modal) ─────────────────────────────────────
  {
    title: 'Festival Exclusive: ₹50,000 Token Cashback',
    subtitle: 'Reserve any verified home this festive season and receive direct coin rewards.',
    description: 'Limited-time festive offer for direct token bookings through the GharMB app.',
    position: 'popup',
    linkType: 'screen',
    linkValue: 'TokenReservationScreen',
    buttonText: 'Claim Festive Offer',
    sortOrder: 1,
    isActive: true,
    viewsCount: 520,
    clicksCount: 95,
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
    mobileImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&h=1000&q=85'
  }
];

async function seedBanners() {
  console.log('🚀 Seeding High-Quality Real Estate Banners for GharMB...\n');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    const admin = await Admin.findOne();
    const adminId = admin ? admin._id : null;

    // Remove existing banners if any
    await Banner.deleteMany({});
    console.log('Cleaned old banner collection.');

    const bannerDocs = HIGH_QUALITY_BANNERS.map(b => ({
      ...b,
      createdBy: adminId
    }));

    const inserted = await Banner.insertMany(bannerDocs);
    console.log(`\n🎉 Successfully inserted ${inserted.length} high-quality banners into MongoDB!`);

    console.log('\n--- Banner Positions Seeded ---');
    inserted.forEach((b, idx) => {
      console.log(`${idx + 1}. [${b.position.padEnd(12)}] "${b.title}" (CTA: ${b.buttonText})`);
    });

    console.log('\n✅ Banners are now LIVE on the API and Admin Panel.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding banners:', error);
    process.exit(1);
  }
}

seedBanners();
