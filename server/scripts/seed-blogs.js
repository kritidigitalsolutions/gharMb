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
  "Commercial",
  "Home & Living",
];

const mockArticles = [
  {
    slug: "rera-explained",
    title: "RERA Explained: What Every Property Buyer Should Know",
    excerpt: "Understand the basics of RERA, what verification means and which details property seekers should pay attention to before investing in any project.",
    categoryName: "Market Trends",
    author: "GharMB Editorial",
    publishedAt: new Date("2025-04-22"),
    readTime: 6,
    isFeatured: true,
    bannerImage: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=750&fit=crop",
    tags: ["RERA", "Buyer Protection", "Legal", "Market Trends"],
    content: `
      <p>The Real Estate (Regulation and Development) Act, commonly known as RERA, was enacted to bring transparency, accountability, and efficiency to India's real estate sector. For property seekers, it serves as the foundational regulatory safeguard against delays, deviations, and fraudulent practices.</p>
      <h2>01 Overview of RERA</h2>
      <p>RERA mandates that every commercial and residential real estate project (where land exceeds 500 sq meters or comprises more than 8 apartments) must be registered with the respective state authority before advertising or accepting token bookings.</p>
      <blockquote>RERA transitioned real estate from an opaque seller's market into a regulated, buyer-centric framework where commitments carry legal force.</blockquote>
      <h2>02 Why Verification Matters</h2>
      <p>A registered project is assigned a unique RERA registration number. This number gives buyers direct access to approved floor layouts, sanctioned building plans, developer track record, quarterly construction progress, and legal encumbrance certificates on the official state portal.</p>
      <div style="background:#FFF5F2; border-left:4px solid #FF5A3C; padding:16px; border-radius:12px; margin:20px 0;">
        <strong>Important:</strong> Never transfer token amounts or sign booking documents for an under-construction project without verifying its active RERA registration on the official state authority website.
      </div>
      <h2>03 Key Buyer Safeguards</h2>
      <p>Under Section 4(2)(l)(D) of RERA, developers must deposit 70% of buyer realizations into a dedicated escrow bank account. These funds can only be withdrawn for construction and land costs, audited periodically by a chartered engineer and chartered accountant.</p>
      <h2>04 What to Check on the RERA Portal</h2>
      <p>When inspecting a project's RERA filing, examine: (1) Declared possession completion date, (2) Encumbrance status on the land title, (3) Sanctioned number of floors vs offered unit floor, (4) Past litigation history of the developer.</p>
      <h2>05 Summary & Next Steps</h2>
      <p>Understanding RERA safeguards gives you confidence during site visits and negotiation meetings. GharMB integrates RERA verification signals directly on property listings so you can review compliance instantly.</p>
    `,
    seo: {
      metaTitle: "RERA Explained: Complete Guide for Property Buyers",
      metaDescription: "Understand the basics of RERA, verification, and what buyers must check before investing.",
      focusKeyword: "RERA verification",
    }
  },
  {
    slug: "first-home-buying-guide-india-2025",
    title: "A Practical Guide to Buying Your First Home",
    excerpt: "Everything first-time buyers need to know — from budgeting and loans to document verification and closing the deal with clarity.",
    categoryName: "Buying Guides",
    author: "GharMB Advisory",
    publishedAt: new Date("2025-03-15"),
    readTime: 6,
    isFeatured: false,
    bannerImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&h=600&fit=crop",
    tags: ["First Home", "Home Loan", "Budgeting", "Checklist"],
    content: `
      <p>Buying your first home is both an emotional milestone and the most significant financial decision of your life. Navigating this process with a structured checklist prevents costly surprises.</p>
      <h2>01 Defining Your Real Budget</h2>
      <p>Your purchase budget is more than just the base property cost. Factor in 5–7% stamp duty, 1% registration fees, GST on under-construction units, advance maintenance deposits, and furnishing expenses.</p>
      <h2>02 The 40% EMI Rule</h2>
      <p>Financial planners recommend that your total monthly debt obligations (including your new home loan EMI) should not exceed 40% to 45% of net household take-home income.</p>
      <div style="background:#FFF5F2; border-left:4px solid #FF5A3C; padding:16px; border-radius:12px; margin:20px 0;">
        <strong>Tip:</strong> Obtain a home loan pre-approval before shortlisting properties to understand your exact borrowing ceiling and negotiate with confidence.
      </div>
      <h2>03 Evaluating Location & Infrastructure</h2>
      <p>Prioritize commute convenience, water supply reliability, upcoming metro and arterial connectivity, and proximity to quality schools and healthcare facilities.</p>
    `,
    seo: {
      metaTitle: "First-Time Home Buyer Guide India",
      metaDescription: "Step-by-step practical guide to purchasing your first residential property in India.",
      focusKeyword: "first home buying guide",
    }
  },
  {
    slug: "how-to-read-a-property-listing-properly",
    title: "How to Read a Property Listing Properly",
    excerpt: "Decipher floor plans, carpet vs super built-up claims, hidden maintenance terms, and project handover timelines like a professional.",
    categoryName: "Property Insights",
    author: "GharMB Intelligence",
    publishedAt: new Date("2025-04-18"),
    readTime: 5,
    isFeatured: false,
    bannerImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1000&h=600&fit=crop",
    tags: ["Listing", "Carpet Area", "Due Diligence", "Floor Plans"],
    content: `
      <p>A real-estate listing is designed to market a property, but smart buyers know how to look past the marketing shine and extract the critical operational and legal parameters.</p>
      <h2>01 Carpet Area vs Super Built-up Claims</h2>
      <p>Always verify the net usable carpet area inside inner walls. Compare the carpet area to the quote price to determine the true effective rate per square foot.</p>
      <h2>02 Handover and Grace Periods</h2>
      <p>Review the exact completion clause. Check whether the delivery timeline mentions RERA possession date or marketing handover date, including any unilateral grace periods.</p>
    `,
    seo: {
      metaTitle: "How to Read Real Estate Property Listings",
      metaDescription: "Learn how to analyze floor plans, super built-up loading, and delivery dates.",
      focusKeyword: "property listings analysis",
    }
  },
  {
    slug: "property-documents-what-should-you-check",
    title: "Property Documents: What Should You Check?",
    excerpt: "A comprehensive checklist of title deeds, encumbrance certificates, occupancy certificates, and municipal clearances before signing.",
    categoryName: "Legal & RERA",
    author: "GharMB Legal",
    publishedAt: new Date("2025-05-02"),
    readTime: 7,
    isFeatured: false,
    bannerImage: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1000&h=600&fit=crop",
    tags: ["Title Deed", "Encumbrance", "OC", "Legal Checklist"],
    content: `
      <p>A legally sound property transaction requires verifying the chain of title, municipal sanctions, and statutory completion certificates.</p>
      <h2>01 Mother Deed and Chain of Title</h2>
      <p>The mother deed traces the historical ownership flow of the land parcel across a minimum 30-year period to confirm clean, marketable, dispute-free title.</p>
      <h2>02 Encumbrance Certificate (EC)</h2>
      <p>Form 15 Encumbrance Certificate proves whether there are active mortgages, legal charges, or court attachments registered on the property.</p>
      <div style="background:#FFF5F2; border-left:4px solid #FF5A3C; padding:16px; border-radius:12px; margin:20px 0;">
        <strong>Important:</strong> Never occupy a ready unit without an official Occupancy Certificate (OC) issued by local municipal authorities.
      </div>
    `,
    seo: {
      metaTitle: "Essential Property Documents Checklist in India",
      metaDescription: "Title deeds, encumbrance certificates, OC and CC verification guide.",
      focusKeyword: "property documents checklist",
    }
  },
  {
    slug: "home-loan-interest-rates-comparison",
    title: "How Interest Rates Can Affect Property Decisions",
    excerpt: "Understand how macroeconomic shifts, repo rate revisions, fixed vs floating loans, and tenure modifications impact your long-term cost.",
    categoryName: "Market Trends",
    author: "GharMB Financial Research",
    publishedAt: new Date("2025-06-01"),
    readTime: 7,
    isFeatured: false,
    bannerImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1000&h=600&fit=crop",
    tags: ["Interest Rates", "Home Loan", "EMI", "Economy"],
    content: `
      <p>Interest rate cycles have a dramatic compounding effect on real-estate acquisition. A 50 bps movement in home loan rates can shift the total interest outflow over a 20-year term by several lakhs.</p>
      <h2>01 Repo Rate Transmission</h2>
      <p>External Benchmark Lending Rate (EBLR) models mean changes in central bank policy rates translate directly to floating-rate borrower EMIs within one billing cycle.</p>
      <h2>02 Prepayment Strategies</h2>
      <p>Making just one additional EMI payment every calendar year or stepping up EMI by 5% annually reduces your loan tenure by nearly 4 to 6 years.</p>
    `,
    seo: {
      metaTitle: "Home Loan Interest Rates & Property Market Impact",
      metaDescription: "How repo rates and EMI structures impact your real estate purchase affordability.",
      focusKeyword: "home loan interest rates",
    }
  },
  {
    slug: "understanding-carpet-area-builtup-super-builtup",
    title: "Understanding Carpet Area, Built-up Area and Super Built-up",
    excerpt: "Demystifying square footage terms, common loading ratios, and how to evaluate what you are truly paying for.",
    categoryName: "Property Insights",
    author: "GharMB Editorial",
    publishedAt: new Date("2025-06-15"),
    readTime: 5,
    isFeatured: false,
    bannerImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1000&h=600&fit=crop",
    tags: ["Carpet Area", "Loading Factor", "Square Feet", "Terminology"],
    content: `
      <p>One of the most confusing aspects of purchasing Indian residential property is the discrepancy between carpet area, built-up area, and super built-up area.</p>
      <h2>01 Carpet Area (Usable Space)</h2>
      <p>The net usable floor area bounded by internal walls. Think of it as the area where you can physically lay down a carpet.</p>
      <h2>02 Built-Up Area</h2>
      <p>Carpet area + the thickness of internal and external walls + private utility balconies.</p>
      <h2>03 Super Built-Up Area (Saleable Area)</h2>
      <p>Built-up area + proportionate share of common amenities like stairs, lobbies, elevator shafts, and clubhouses.</p>
    `,
    seo: {
      metaTitle: "Carpet Area vs Built-up vs Super Built-up Explained",
      metaDescription: "Clear definitions and calculation formulas for carpet area and loading factor.",
      focusKeyword: "carpet area vs super built up",
    }
  },
  {
    slug: "simple-guide-rera-registration",
    title: "A Simple Guide to RERA Registration for Buyers",
    excerpt: "A step-by-step walkthrough of what builders submit for RERA compliance and how buyers can verify filings online.",
    categoryName: "Legal & RERA",
    author: "GharMB Compliance",
    publishedAt: new Date("2025-07-04"),
    readTime: 6,
    isFeatured: false,
    bannerImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&h=600&fit=crop",
    tags: ["RERA", "Registration", "Legal", "Due Diligence"],
    content: `
      <p>RERA registration is the digital identity card for any modern real-estate development project in India.</p>
      <h2>01 Mandatory Disclosures</h2>
      <p>Developers must upload encumbrance certificates, layout plans, commencement certificates, proforma agreement for sale, and bank account details.</p>
      <h2>02 How to Search State RERA Portals</h2>
      <p>Navigate to your state authority website (e.g. MahaRERA, UP RERA, HRERA, Karnataka RERA) and search by the project registration number or promoter name.</p>
    `,
    seo: {
      metaTitle: "Step-by-Step Guide to RERA Registration Search",
      metaDescription: "How to check project registration documents on official state RERA portals.",
      focusKeyword: "RERA registration guide",
    }
  },
  {
    slug: "commercial-real-estate-vs-residential-yields",
    title: "Commercial Real Estate vs Residential: Risk & Return",
    excerpt: "Analyzing rental yields, lease lock-ins, capital expenditure requirements, and tenant retention across asset classes.",
    categoryName: "Commercial",
    author: "GharMB Commercial Advisory",
    publishedAt: new Date("2025-07-28"),
    readTime: 8,
    isFeatured: false,
    bannerImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1000&h=600&fit=crop",
    tags: ["Commercial", "Rental Yields", "Office Spaces", "Investment"],
    content: `
      <p>While residential real estate typically offers rental yields of 2% to 3.5%, Grade-A commercial office and retail assets frequently generate 7% to 9% yields with 3–9 year lease locks.</p>
      <h2>01 Yield Differentials</h2>
      <p>Commercial lease structures commonly incorporate 15% rent escalations every 3 years, providing natural inflation protection.</p>
      <h2>02 Capital Requirements & REITs</h2>
      <p>Individual retail investors can also participate in institutional commercial portfolios through listed Real Estate Investment Trusts (REITs) starting with minimal ticket sizes.</p>
    `,
    seo: {
      metaTitle: "Commercial vs Residential Real Estate Investment Returns",
      metaDescription: "Compare rental yields, capital growth, and tenant lease structures.",
      focusKeyword: "commercial vs residential yields",
    }
  },
  {
    slug: "small-apartment-interior-design-tips",
    title: "12 Interior Design Principles for Compact Modern Homes",
    excerpt: "Make the most of compact living spaces with smart furniture selection, vertical storage, lighting, and layout principles.",
    categoryName: "Home & Living",
    author: "GharMB Design Studio",
    publishedAt: new Date("2025-08-05"),
    readTime: 5,
    isFeatured: false,
    bannerImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1000&h=600&fit=crop",
    tags: ["Interior Design", "Compact Living", "Aesthetics", "Home & Living"],
    content: `
      <p>Living in a compact urban home does not mean compromising on style or functionality. Strategic design choices can make a 600–900 sq ft flat feel spacious and elegant.</p>
      <h2>01 Maximize Natural Light</h2>
      <p>Sheer curtains, mirror placements opposite windows, and open sightlines reflect daylight deeply into living areas.</p>
      <h2>02 Multi-Functional Furniture</h2>
      <p>Select hydraulic storage beds, wall-mounted folding desks, and modular sofa beds to maintain clean floor spaces without clutter.</p>
    `,
    seo: {
      metaTitle: "Small Apartment Interior Design Principles",
      metaDescription: "Practical space-saving and modern interior design ideas for compact Indian homes.",
      focusKeyword: "compact apartment design",
    }
  },
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

    // 1. Seed / Upsert Categories
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

    // 2. Seed / Upsert Articles
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

      const existingBlog = await Blog.findOne({ slug: article.slug });
      if (!existingBlog) {
        await Blog.create(blogDoc);
        console.log(`Created article: "${article.title}"`);
      } else {
        await Blog.findByIdAndUpdate(existingBlog._id, blogDoc);
        console.log(`Updated article: "${article.title}"`);
      }
    }

    console.log('\n✅ All mock articles and categories successfully imported into MongoDB database!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  }
}

seed();
