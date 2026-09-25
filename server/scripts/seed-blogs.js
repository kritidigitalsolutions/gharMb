const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const BlogCategory = require('../src/models/blog-category.model');
const Blog = require('../src/models/blog.model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gharmb';

const mockCategories = [
  "Buying Guides",
  "Market Trends",
  "Property Insights",
  "Legal & RERA",
  "Home & Living",
];

const mockArticles = [
  // Buying Guides
  {
    slug: "first-home-buying-guide",
    title: "A Practical Guide to Buying Your First Home",
    excerpt: "Everything first-time buyers need to know — from budgeting and loans to document verification.",
    categoryName: "Buying Guides",
    author: "GharMB Advisory",
    publishedAt: new Date("2025-03-15"),
    readTime: 6,
    isFeatured: true,
    bannerImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&h=600&fit=crop",
    tags: ["First Home", "Home Loan", "Budgeting", "Checklist"],
    content: "<p>Buying your first home is both an emotional milestone and the most significant financial decision of your life. Navigating this process with a structured checklist prevents costly surprises.</p><h2>01 Defining Your Real Budget</h2><p>Your purchase budget is more than just the base property cost. Factor in 5–7% stamp duty, 1% registration fees, GST on under-construction units, advance maintenance deposits, and furnishing expenses.</p>",
    seo: { metaTitle: "First-Time Home Buyer Guide India", metaDescription: "Step-by-step practical guide to purchasing your first residential property in India.", focusKeyword: "first home buying guide" }
  },
  {
    slug: "luxury-property-buying",
    title: "What to Look for When Buying Luxury Real Estate",
    excerpt: "A premium buyer's guide to evaluating amenities, builder reputation, and exclusive neighborhoods.",
    categoryName: "Buying Guides",
    author: "GharMB Editorial",
    publishedAt: new Date("2025-04-10"),
    readTime: 7,
    isFeatured: false,
    bannerImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000&h=600&fit=crop",
    tags: ["Luxury", "Premium", "Checklist"],
    content: "<p>Luxury real estate requires a different approach to evaluation. Focus on low-density living, floor-to-ceiling heights, imported fittings, and concierge services.</p>",
    seo: { metaTitle: "Luxury Property Buying Guide", metaDescription: "Guide to buying luxury properties.", focusKeyword: "luxury real estate" }
  },
  {
    slug: "real-estate-investment-beginners",
    title: "Real Estate Investment for Beginners",
    excerpt: "How to start investing in real estate with limited capital and maximize your returns.",
    categoryName: "Buying Guides",
    author: "GharMB Research",
    publishedAt: new Date("2025-05-20"),
    readTime: 5,
    isFeatured: false,
    bannerImage: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1000&h=600&fit=crop",
    tags: ["Investment", "ROI", "Beginners"],
    content: "<p>Real estate investment offers both capital appreciation and rental yield. Learn how to identify emerging corridors before prices peak.</p>",
    seo: { metaTitle: "Real Estate Investment Beginners", metaDescription: "Real estate investment guide.", focusKeyword: "real estate investment" }
  },

  // Market Trends
  {
    slug: "real-estate-trends-2025",
    title: "Real Estate Market Trends to Watch in 2025",
    excerpt: "The latest insights into property pricing, demand shifts, and upcoming infrastructure projects.",
    categoryName: "Market Trends",
    author: "GharMB Intelligence",
    publishedAt: new Date("2025-01-10"),
    readTime: 6,
    isFeatured: true,
    bannerImage: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1000&h=600&fit=crop",
    tags: ["Market Trends", "Forecast 2025", "Pricing"],
    content: "<p>2025 is set to witness a surge in demand for larger homes and eco-friendly projects. Let's analyze the macroeconomic factors driving these changes.</p>",
    seo: { metaTitle: "Real Estate Trends 2025", metaDescription: "2025 property market trends.", focusKeyword: "2025 real estate trends" }
  },
  {
    slug: "impact-of-interest-rates",
    title: "How Interest Rates Shape the Housing Market",
    excerpt: "Understand how repo rate revisions and macroeconomic shifts impact your long-term EMI costs.",
    categoryName: "Market Trends",
    author: "GharMB Financial Research",
    publishedAt: new Date("2025-06-01"),
    readTime: 7,
    isFeatured: false,
    bannerImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1000&h=600&fit=crop",
    tags: ["Interest Rates", "Home Loan", "Economy"],
    content: "<p>Interest rate cycles have a dramatic compounding effect on real-estate acquisition. A 50 bps movement in home loan rates can shift the total interest outflow over a 20-year term by several lakhs.</p>",
    seo: { metaTitle: "Home Loan Interest Rates", metaDescription: "How repo rates impact property.", focusKeyword: "home loan interest rates" }
  },
  {
    slug: "emerging-micro-markets",
    title: "Top Emerging Micro-Markets in Tier 1 Cities",
    excerpt: "Discover the peripheral areas offering the highest capital appreciation potential.",
    categoryName: "Market Trends",
    author: "GharMB Data Desk",
    publishedAt: new Date("2025-07-15"),
    readTime: 5,
    isFeatured: false,
    bannerImage: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1000&h=600&fit=crop",
    tags: ["Micro-markets", "Investment", "Growth"],
    content: "<p>Peripheral locations connected by upcoming metro lines are becoming hotspots for both end-users and investors. Here are the top 5 emerging micro-markets.</p>",
    seo: { metaTitle: "Emerging Micro-Markets", metaDescription: "Top emerging property markets.", focusKeyword: "emerging micro markets" }
  },

  // Property Insights
  {
    slug: "how-to-read-a-property-listing-properly",
    title: "How to Read a Property Listing Properly",
    excerpt: "Decipher floor plans, carpet vs super built-up claims, and project handover timelines.",
    categoryName: "Property Insights",
    author: "GharMB Intelligence",
    publishedAt: new Date("2025-04-18"),
    readTime: 5,
    isFeatured: false,
    bannerImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1000&h=600&fit=crop",
    tags: ["Listing", "Due Diligence", "Floor Plans"],
    content: "<p>A real-estate listing is designed to market a property, but smart buyers know how to look past the marketing shine and extract the critical operational and legal parameters.</p>",
    seo: { metaTitle: "Read Real Estate Property Listings", metaDescription: "Learn how to analyze floor plans.", focusKeyword: "property listings analysis" }
  },
  {
    slug: "understanding-carpet-area",
    title: "Understanding Carpet Area vs Super Built-up",
    excerpt: "Demystifying square footage terms, common loading ratios, and evaluating actual space.",
    categoryName: "Property Insights",
    author: "GharMB Editorial",
    publishedAt: new Date("2025-06-15"),
    readTime: 5,
    isFeatured: true,
    bannerImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1000&h=600&fit=crop",
    tags: ["Carpet Area", "Loading Factor", "Terminology"],
    content: "<p>One of the most confusing aspects of purchasing Indian residential property is the discrepancy between carpet area, built-up area, and super built-up area.</p>",
    seo: { metaTitle: "Carpet Area vs Super Built-up Explained", metaDescription: "Clear definitions for carpet area.", focusKeyword: "carpet area vs super built up" }
  },
  {
    slug: "developer-reputation-check",
    title: "How to Perform a Developer Reputation Check",
    excerpt: "A guide to checking past project deliveries, construction quality, and financial stability.",
    categoryName: "Property Insights",
    author: "GharMB Compliance",
    publishedAt: new Date("2025-08-10"),
    readTime: 6,
    isFeatured: false,
    bannerImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1000&h=600&fit=crop",
    tags: ["Developer", "Due Diligence", "Trust"],
    content: "<p>Never buy based on brochures alone. Visit completed projects by the same developer to inspect maintenance quality and speak to resident welfare associations (RWAs).</p>",
    seo: { metaTitle: "Developer Reputation Check", metaDescription: "How to check builder background.", focusKeyword: "developer reputation" }
  },

  // Legal & RERA
  {
    slug: "rera-explained",
    title: "RERA Explained: What Every Property Buyer Should Know",
    excerpt: "Understand the basics of RERA, what verification means and what details to check.",
    categoryName: "Legal & RERA",
    author: "GharMB Editorial",
    publishedAt: new Date("2025-04-22"),
    readTime: 6,
    isFeatured: true,
    bannerImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&h=600&fit=crop",
    tags: ["RERA", "Buyer Protection", "Legal"],
    content: "<p>RERA transitioned real estate from an opaque seller's market into a regulated, buyer-centric framework where commitments carry legal force.</p>",
    seo: { metaTitle: "RERA Explained", metaDescription: "Understand RERA basics.", focusKeyword: "RERA verification" }
  },
  {
    slug: "property-documents-checklist",
    title: "Property Documents: What Should You Check?",
    excerpt: "A comprehensive checklist of title deeds, encumbrance certificates, and OC.",
    categoryName: "Legal & RERA",
    author: "GharMB Legal",
    publishedAt: new Date("2025-05-02"),
    readTime: 7,
    isFeatured: false,
    bannerImage: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1000&h=600&fit=crop",
    tags: ["Title Deed", "Encumbrance", "OC"],
    content: "<p>A legally sound property transaction requires verifying the chain of title, municipal sanctions, and statutory completion certificates.</p>",
    seo: { metaTitle: "Property Documents Checklist", metaDescription: "Title deeds and OC verification.", focusKeyword: "property documents checklist" }
  },
  {
    slug: "property-registration-process",
    title: "The Complete Property Registration Process",
    excerpt: "Learn how stamp duty, registration fees, and sub-registrar appointments work.",
    categoryName: "Legal & RERA",
    author: "GharMB Legal",
    publishedAt: new Date("2025-09-01"),
    readTime: 5,
    isFeatured: false,
    bannerImage: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1000&h=600&fit=crop",
    tags: ["Registration", "Stamp Duty", "Legal"],
    content: "<p>Property registration finalizes your ownership in the eyes of the law. You must pay stamp duty and register the sale deed at the local sub-registrar office.</p>",
    seo: { metaTitle: "Property Registration Process", metaDescription: "How to register property.", focusKeyword: "property registration" }
  },

  // Home & Living
  {
    slug: "compact-apartment-design",
    title: "12 Interior Design Principles for Compact Homes",
    excerpt: "Make the most of compact living spaces with smart furniture selection and layout principles.",
    categoryName: "Home & Living",
    author: "GharMB Design Studio",
    publishedAt: new Date("2025-08-05"),
    readTime: 5,
    isFeatured: false,
    bannerImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1000&h=600&fit=crop",
    tags: ["Interior Design", "Compact Living", "Aesthetics"],
    content: "<p>Living in a compact urban home does not mean compromising on style or functionality. Strategic design choices can make a small flat feel spacious and elegant.</p>",
    seo: { metaTitle: "Compact Apartment Design", metaDescription: "Interior design for small homes.", focusKeyword: "compact apartment design" }
  },
  {
    slug: "vastu-tips-new-home",
    title: "Essential Vastu Shastra Tips for Your New Home",
    excerpt: "Traditional principles to ensure positive energy and harmony in your new property.",
    categoryName: "Home & Living",
    author: "GharMB Lifestyle",
    publishedAt: new Date("2025-10-12"),
    readTime: 4,
    isFeatured: true,
    bannerImage: "https://images.unsplash.com/photo-1510627489930-0c1b0bfb6785?w=1000&h=600&fit=crop",
    tags: ["Vastu", "Energy", "Lifestyle"],
    content: "<p>Vastu Shastra offers ancient guidelines for home orientation, room placement, and entrance direction to foster well-being.</p>",
    seo: { metaTitle: "Vastu Tips for New Home", metaDescription: "Vastu Shastra guidelines.", focusKeyword: "vastu for home" }
  },
  {
    slug: "sustainable-living-spaces",
    title: "Creating a Sustainable and Eco-Friendly Home",
    excerpt: "How to integrate energy efficiency, solar power, and water harvesting into your residence.",
    categoryName: "Home & Living",
    author: "GharMB Green Living",
    publishedAt: new Date("2025-11-20"),
    readTime: 5,
    isFeatured: false,
    bannerImage: "https://images.unsplash.com/photo-1505843513577-22bb7abd501c?w=1000&h=600&fit=crop",
    tags: ["Sustainability", "Eco-friendly", "Green Living"],
    content: "<p>Eco-friendly homes reduce long-term maintenance costs while contributing to environmental conservation. Start with LED lighting, low-flow fixtures, and native landscaping.</p>",
    seo: { metaTitle: "Sustainable Living Spaces", metaDescription: "Eco-friendly home guide.", focusKeyword: "eco friendly home" }
  }
];

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

async function seed() {
  try {
    console.log('Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully!');

    // 1. Clear existing blogs to ensure exactly 15
    await Blog.deleteMany({});
    console.log('Cleared existing blogs.');

    // 2. Seed / Upsert Categories
    const categoryMap = {};
    for (const catName of mockCategories) {
      const slug = generateSlug(catName);
      let cat = await BlogCategory.findOne({ slug });
      if (!cat) {
        cat = await BlogCategory.create({
          name: catName,
          slug,
          isActive: true,
        });
        console.log(`Created category: ${catName} (${cat._id})`);
      } else {
        console.log(`Category exists: ${catName} (${cat._id})`);
      }
      categoryMap[catName] = cat._id;
    }

    // 3. Seed Articles
    for (const article of mockArticles) {
      const catId = categoryMap[article.categoryName];
      if (!catId) {
        console.warn(`Category not found for article: ${article.title}`);
        continue;
      }

      const blogDoc = {
        title: article.title,
        slug: article.slug,
        category: catId,
        excerpt: article.excerpt,
        content: article.content.trim(),
        bannerImage: article.bannerImage,
        author: article.author,
        readTime: article.readTime,
        status: 'published',
        isPublished: true,
        isFeatured: article.isFeatured || false,
        publishedAt: article.publishedAt,
        views: Math.floor(Math.random() * 250) + 20, // initial organic views
        tags: article.tags,
        seo: article.seo,
      };

      await Blog.create(blogDoc);
      console.log(`Created article: "${article.title}"`);
    }

    console.log('\n✅ 15 mock articles (3 per 5 categories) successfully imported into MongoDB database!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  }
}

seed();
