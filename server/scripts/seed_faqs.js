const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../src/config/db');
const FaqCategory = require('../src/models/faq-category.model');
const Faq = require('../src/models/faq.model');

// Helper to generate slug
const generateSlug = (name) => {
  return name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
};

const categories = [
  'Platform',
  'Properties',
  'Verification',
  'Professionals',
  'Tools'
];

const faqsData = {
  Platform: [
    {
      question: 'What is GharMB?',
      answer: 'GharMB is a comprehensive real-estate technology platform that connects property buyers, developers, and professionals within a verified and transparent ecosystem.'
    },
    {
      question: 'How does GharMB work?',
      answer: 'GharMB provides a centralized platform for property discovery, verification, and connections. Users can search for verified properties, utilize smart tools for valuation, and directly connect with certified agents or developers.'
    }
  ],
  Properties: [
    {
      question: 'How can I discover properties?',
      answer: 'You can discover properties using our advanced search tools, filtering by location, property type, budget, and specific amenities. All listings provide deep insights and structured data.'
    },
    {
      question: 'What property information is available?',
      answer: 'We provide extensive information including carpet area efficiency, legal title status, neighborhood context, RERA verification details, and geo-tagged site survey photos.'
    }
  ],
  Verification: [
    {
      question: 'How are properties verified?',
      answer: 'Properties undergo a multi-layer verification process that includes RERA legal cross-checks, title audits, and direct owner validation to ensure all information is accurate and trustworthy.'
    },
    {
      question: 'What does verification mean?',
      answer: 'Verification means that the property details, ownership, and legal standing have been checked against official records by our team, reducing the risk of fraud and providing peace of mind.'
    }
  ],
  Professionals: [
    {
      question: 'Can developers use GharMB?',
      answer: 'Yes, developers can join our ecosystem to list their projects directly, manage their inventory, and connect with potential buyers and certified agents without intermediaries.'
    },
    {
      question: 'Can agents/professionals join GharMB?',
      answer: 'Absolutely. Certified agents and real estate professionals can join GharMB to access our verified network, manage client relationships, and grow their business using our smart tools.'
    }
  ],
  Tools: [
    {
      question: 'What tools are available on GharMB?',
      answer: 'GharMB offers practical tools such as loan EMI calculators, unit converters, yield estimates, and affordability metrics to help you make informed financial decisions.'
    },
    {
      question: 'Can I compare property information?',
      answer: 'Yes, our platform provides comprehensive analytics and intelligence tools that allow you to compare price trends, amenities, and overall value across different properties and micro-markets.'
    }
  ]
};

const seedFaqs = async () => {
  try {
    await connectDB();
    console.log('Database connected.');

    // Seed Categories
    for (const catName of categories) {
      let category = await FaqCategory.findOne({ name: catName });
      if (!category) {
        category = await FaqCategory.create({
          name: catName,
          slug: generateSlug(catName),
          isActive: true
        });
        console.log(`Created FAQ Category: ${catName}`);
      }

      // Seed FAQs for this category
      if (faqsData[catName]) {
        for (const faqData of faqsData[catName]) {
          const existingFaq = await Faq.findOne({ question: faqData.question });
          if (!existingFaq) {
            await Faq.create({
              question: faqData.question,
              answer: faqData.answer,
              category: category._id,
              isActive: true
            });
            console.log(`  Created FAQ: ${faqData.question}`);
          }
        }
      }
    }

    console.log('FAQ seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding FAQs:', error);
    process.exit(1);
  }
};

seedFaqs();
