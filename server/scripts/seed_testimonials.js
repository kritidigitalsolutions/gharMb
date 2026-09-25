const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Testimonial = require('../src/models/testimonial.model');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedTestimonials = [
  {
    quote: "I finally had a clearer way to understand the information around a property before reaching out. The verification details and property context made the process much easier to navigate.",
    name: "Ananya Sharma",
    role: "First-time Homebuyer",
    location: "Noida, NCR",
    propertyType: "Residential",
    journeyType: "First-time homebuyer",
    stages: ["Discover", "Verify", "Understand", "Decide"],
    activeStageIndex: 1,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&q=80",
    propertyImage: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=640&h=440&fit=crop&q=80",
    isVerified: true,
    isActive: true,
    displayOrder: 1
  },
  {
    quote: "Having the important property information structured in one place made it much easier to compare what actually mattered without cold calls or endless ambiguity.",
    name: "Rahul Mehta",
    role: "Property Professional",
    location: "Delhi NCR",
    propertyType: "Commercial & Luxury",
    journeyType: "Portfolio Advisory",
    stages: ["Discover", "Verify", "Understand", "Decide"],
    activeStageIndex: 2,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80",
    propertyImage: "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=640&h=440&fit=crop&q=80",
    isVerified: true,
    isActive: true,
    displayOrder: 2
  },
  {
    quote: "Instead of jumping between different sources, I could understand the project, location and available information together with transparent regulatory documents.",
    name: "Priya Kapoor",
    role: "Property Seeker",
    location: "Gurugram, NCR",
    propertyType: "High-rise Apartment",
    journeyType: "Relocation & Upgrade",
    stages: ["Discover", "Verify", "Understand", "Decide"],
    activeStageIndex: 3,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&q=80",
    propertyImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=640&h=440&fit=crop&q=80",
    isVerified: true,
    isActive: true,
    displayOrder: 3
  }
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    for (let test of seedTestimonials) {
      const existing = await Testimonial.findOne({ name: test.name });
      if (!existing) {
        await Testimonial.create(test);
        console.log(`Seeded testimonial for ${test.name}`);
      } else {
        console.log(`Testimonial for ${test.name} already exists. Skipping.`);
      }
    }

    console.log('Testimonial seed completed.');
    process.exit();
  } catch (err) {
    console.error('Error seeding testimonials:', err);
    process.exit(1);
  }
};

seedData();
