/**
 * Seed Banners Script
 * Populates sample promotional banners for the Home Screen & Commercial Spaces section.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Banner = require('../src/models/banner.model');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const sampleBanners = [
  {
    title: 'Find Premium Commercial Spaces',
    subtitle: 'High-footfall shops, modern corporate offices & retail showrooms in prime hubs.',
    description: 'Explore verified commercial listings with high ROI and transparent pricing across Delhi NCR.',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=500&fit=crop&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop&q=80',
    position: 'home_top',
    linkType: 'category',
    linkValue: 'Commercial',
    buttonText: 'Explore Spaces',
    sortOrder: 1,
    isActive: true,
  },
  {
    title: 'Zero Brokerage Homes & Flats',
    subtitle: 'Direct owner contact with verified documentation and instant site visit booking.',
    description: 'Save thousands on brokerage fees with 100% verified properties.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=500&fit=crop&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop&q=80',
    position: 'home_top',
    linkType: 'category',
    linkValue: 'Residential',
    buttonText: 'Browse Homes',
    sortOrder: 2,
    isActive: true,
  },
  {
    title: 'New Luxury Launch Projects',
    subtitle: 'Exclusive launch prices & flexible construction-linked payment plans from top builders.',
    description: 'Explore upcoming premium townships, villas, and high-rise apartments.',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=500&fit=crop&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop&q=80',
    position: 'home_top',
    linkType: 'screen',
    linkValue: 'ProjectsScreen',
    buttonText: 'View Projects',
    sortOrder: 3,
    isActive: true,
  },
  {
    title: 'Looking to Sell or Lease Fast?',
    subtitle: 'List your property or commercial space in 5 easy steps and connect with genuine buyers.',
    description: 'Over 50,000 active seekers searching daily for spaces.',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1000&h=400&fit=crop&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=300&fit=crop&q=80',
    position: 'home_middle',
    linkType: 'screen',
    linkValue: 'PostPropertyScreen',
    buttonText: 'List for Free',
    sortOrder: 1,
    isActive: true,
  },
  {
    title: 'Commercial Hubs: Noida & Gurugram',
    subtitle: 'Retail shops starting from ₹48 Lakhs with assured rental returns.',
    description: 'Ready-to-move and under-construction commercial complexes on expressways.',
    image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1000&h=400&fit=crop&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=600&h=300&fit=crop&q=80',
    position: 'commercial',
    linkType: 'screen',
    linkValue: 'CommercialListingsScreen',
    buttonText: 'View Commercial',
    sortOrder: 1,
    isActive: true,
  },
];

const seedBanners = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGO_URI is missing from environment.');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    for (const b of sampleBanners) {
      const exists = await Banner.findOne({ title: b.title });
      if (!exists) {
        await Banner.create(b);
        console.log(`Created banner: "${b.title}" (${b.position})`);
      } else {
        console.log(`Banner "${b.title}" already exists, skipping.`);
      }
    }

    console.log('Banner seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding banners:', err);
    process.exit(1);
  }
};

seedBanners();
