const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const Blog = require('../src/models/blog.model');

dotenv.config({ path: path.join(__dirname, '../.env') });
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gharmb';

const detailedContents = {
  "first-home-buying-guide": `
    <p>Buying your first home is both an emotional milestone and the most significant financial decision of your life. Navigating this process with a structured checklist prevents costly surprises.</p>
    <h2>01 Defining Your Real Budget</h2>
    <p>Your purchase budget is more than just the base property cost. Factor in 5–7% stamp duty, 1% registration fees, GST on under-construction units, advance maintenance deposits, and furnishing expenses.</p>
    <ul>
      <li><strong>Base Cost:</strong> The actual property price.</li>
      <li><strong>Taxes:</strong> GST, Stamp Duty, and Registration.</li>
      <li><strong>Hidden Fees:</strong> Legal verification fees, loan processing fees.</li>
    </ul>
    <h2>02 Location is Everything</h2>
    <p>Always prioritize location over the exact specifications of the house. You can change the interiors, but you cannot change the neighborhood. Look for areas with upcoming infrastructure projects like metro lines or new highways.</p>
    <blockquote>"A good location will always appreciate faster than a large house in a bad location."</blockquote>
    <h2>03 Home Loan Eligibility</h2>
    <p>Financial planners recommend that your total monthly debt obligations (including your new home loan EMI) should not exceed 40% to 45% of net household take-home income. Getting a pre-approved loan gives you immense bargaining power.</p>
  `,
  "luxury-property-buying": `
    <p>Luxury real estate requires a different approach to evaluation. Focus on low-density living, floor-to-ceiling heights, imported fittings, and concierge services.</p>
    <h2>01 Exclusivity and Density</h2>
    <p>A true luxury project is defined by its density. Look for projects that offer fewer apartments per acre. High density implies crowded amenities and less exclusivity.</p>
    <h2>02 The Importance of Ceiling Height</h2>
    <p>Standard apartments offer a 9 to 10 feet ceiling height. Luxury properties should ideally offer a floor-to-ceiling height of 11 to 12 feet, creating a grand sense of volume and space.</p>
    <h2>03 Amenities that Matter</h2>
    <ul>
      <li>Private elevators opening directly into the apartment.</li>
      <li>Temperature-controlled swimming pools.</li>
      <li>24/7 dedicated concierge and valet services.</li>
      <li>State-of-the-art smart home automation systems.</li>
    </ul>
    <blockquote>Luxury is not just about expensive materials; it is about the lifestyle and convenience it provides.</blockquote>
  `,
  "real-estate-investment-beginners": `
    <p>Real estate investment offers both capital appreciation and rental yield. Learn how to identify emerging corridors before prices peak.</p>
    <h2>01 Start Small, Think Big</h2>
    <p>If you don't have the capital for a luxury apartment, consider investing in smaller 1BHKs in upcoming areas or commercial office spaces which often provide better rental yields.</p>
    <h2>02 Rental Yield vs Capital Appreciation</h2>
    <p>Understand your investment goal. Are you looking for monthly income (Rental Yield) or long-term growth (Capital Appreciation)?</p>
    <ul>
      <li><strong>Residential:</strong> Lower rental yield (2-3%) but stable capital appreciation.</li>
      <li><strong>Commercial:</strong> Higher rental yield (6-8%) but higher entry cost.</li>
    </ul>
    <h2>03 The Power of REITs</h2>
    <p>Real Estate Investment Trusts (REITs) allow you to invest in commercial real estate just like mutual funds, without needing massive capital. They are a great starting point for beginners.</p>
  `,
  "real-estate-trends-2025": `
    <p>2025 is set to witness a surge in demand for larger homes and eco-friendly projects. Let's analyze the macroeconomic factors driving these changes.</p>
    <h2>01 The Rise of 'Glocal' Living</h2>
    <p>Buyers are increasingly looking for global standards of living combined with local cultural aesthetics. This means world-class amenities blended with Vastu-compliant architecture.</p>
    <h2>02 Sustainability is Non-Negotiable</h2>
    <p>Developers are prioritizing green building certifications. Expect to see more solar panels, rainwater harvesting systems, and EV charging stations as standard offerings.</p>
    <h2>03 Tech-Enabled Homes</h2>
    <p>Smart homes are no longer a luxury but an expectation. From biometric locks to AI-controlled lighting and temperature, 2025 is the year of the truly connected home.</p>
    <ul>
      <li>Voice-controlled environments.</li>
      <li>Automated energy management.</li>
      <li>Enhanced digital security systems.</li>
    </ul>
  `,
  "impact-of-interest-rates": `
    <p>Interest rate cycles have a dramatic compounding effect on real-estate acquisition. A 50 bps movement in home loan rates can shift the total interest outflow over a 20-year term by several lakhs.</p>
    <h2>01 How the Repo Rate Works</h2>
    <p>The Repo Rate is the rate at which the central bank lends to commercial banks. When the repo rate goes up, your home loan EMI usually goes up.</p>
    <h2>02 Fixed vs Floating Rates</h2>
    <p>Most home loans in India are floating. This means your interest rate will fluctuate based on the market. Fixed rates are rare and usually higher.</p>
    <blockquote>Always negotiate the 'spread' or 'margin' with your bank when taking a floating rate loan.</blockquote>
    <h2>03 Strategies to Reduce Interest Burden</h2>
    <ul>
      <li>Pay an extra EMI every year.</li>
      <li>Increase your EMI by 5% annually.</li>
      <li>Make part-payments whenever you receive an annual bonus.</li>
    </ul>
  `,
  "emerging-micro-markets": `
    <p>Peripheral locations connected by upcoming metro lines are becoming hotspots for both end-users and investors. Here are the top emerging micro-markets.</p>
    <h2>01 The Importance of Infrastructure</h2>
    <p>Infrastructure development is the biggest driver of real estate appreciation. Look for areas where new highways, airports, or metro lines are scheduled for completion in the next 3-5 years.</p>
    <h2>02 Case Study: The Airport Effect</h2>
    <p>Historically, property prices within a 20km radius of a new airport have seen a 30-50% appreciation within the first 5 years of the airport's announcement.</p>
    <h2>03 Risk vs Reward</h2>
    <p>Investing in emerging markets carries risk. Projects may get delayed. Always ensure you are investing with a Grade-A developer who has a proven track record of delivering in new geographies.</p>
  `,
  "how-to-read-a-property-listing-properly": `
    <p>A real-estate listing is designed to market a property, but smart buyers know how to look past the marketing shine and extract the critical operational and legal parameters.</p>
    <h2>01 Deciphering Area Metrics</h2>
    <p>Do not be fooled by 'Super Built-Up Area'. Always ask for the RERA Carpet Area. The carpet area is the actual usable space inside the apartment walls.</p>
    <h2>02 Understanding 'Amenities'</h2>
    <p>Not all amenities are free. Clarify which amenities are included in your maintenance charges and which ones require a 'pay-per-use' membership (like the clubhouse or spa).</p>
    <h2>03 Possession Timelines</h2>
    <ul>
      <li><strong>RERA Date:</strong> The legally binding date by which the builder must deliver.</li>
      <li><strong>Target Date:</strong> The marketing date the builder promises verbally (often earlier than RERA date).</li>
    </ul>
    <blockquote>Always base your financial planning on the RERA possession date, not the marketing date.</blockquote>
  `,
  "understanding-carpet-area": `
    <p>One of the most confusing aspects of purchasing Indian residential property is the discrepancy between carpet area, built-up area, and super built-up area.</p>
    <h2>01 What is Carpet Area?</h2>
    <p>As per RERA, carpet area is the net usable floor area of an apartment, excluding the area covered by the external walls, areas under services shafts, exclusive balcony or verandah area and exclusive open terrace area, but includes the area covered by the internal partition walls of the apartment.</p>
    <h2>02 What is Built-Up Area?</h2>
    <p>Built-up area includes the carpet area plus the thickness of the outer walls and the balcony area.</p>
    <h2>03 What is Super Built-Up Area?</h2>
    <p>This is the built-up area plus a proportionate share of common areas such as the lobby, lifts, staircases, etc. The difference between super built-up area and carpet area is called the 'loading factor', which can be anywhere from 25% to 40%.</p>
  `,
  "developer-reputation-check": `
    <p>Never buy based on brochures alone. Visit completed projects by the same developer to inspect maintenance quality and speak to resident welfare associations (RWAs).</p>
    <h2>01 Check Past Delivery Records</h2>
    <p>How many projects has the developer delivered on time? A delay of 6-12 months is common, but delays of 3+ years are a major red flag.</p>
    <h2>02 Inspect Quality of Construction</h2>
    <p>Visit a project that the developer completed 5 years ago. Look for cracks in the walls, seepage issues, and the condition of the clubhouse. This will tell you how well their buildings age.</p>
    <h2>03 RERA Default List</h2>
    <ul>
      <li>Check the state RERA website for any complaints registered against the developer.</li>
      <li>Look for any insolvency proceedings (NCLT) against the builder's parent company.</li>
    </ul>
  `,
  "rera-explained": `
    <p>RERA transitioned real estate from an opaque seller's market into a regulated, buyer-centric framework where commitments carry legal force.</p>
    <h2>01 Mandatory Registration</h2>
    <p>No promoter shall advertise, market, book, sell or offer for sale, or invite persons to purchase in any manner any plot, apartment or building, without registering the real estate project with the RERA authority.</p>
    <h2>02 Escrow Account Safeguard</h2>
    <p>Under RERA, developers must deposit 70% of the funds collected from buyers into a separate escrow bank account. This prevents builders from diverting your money to other projects.</p>
    <h2>03 Transparency in Area</h2>
    <p>RERA mandates that developers sell properties based only on 'Carpet Area' and not on ambiguously defined 'Super Built-Up Area'.</p>
    <blockquote>RERA has empowered buyers to demand accountability, ensuring that what is promised is what is delivered.</blockquote>
  `,
  "property-documents-checklist": `
    <p>A legally sound property transaction requires verifying the chain of title, municipal sanctions, and statutory completion certificates.</p>
    <h2>01 The Mother Deed</h2>
    <p>This is the most important document. It traces the origin of the property and its ownership across multiple previous owners.</p>
    <h2>02 Encumbrance Certificate (EC)</h2>
    <p>The EC ensures that the property is free from any monetary or legal liabilities such as a mortgage or uncleared loan.</p>
    <h2>03 Occupancy Certificate (OC)</h2>
    <p>An OC is issued by the local municipal authority confirming that the building has been constructed according to the approved plans and is safe for occupation. Never move in without an OC.</p>
    <ul>
      <li>Building Plan Approval.</li>
      <li>No Objection Certificates (NOCs) from Fire and Water departments.</li>
      <li>Latest Property Tax Receipts.</li>
    </ul>
  `,
  "property-registration-process": `
    <p>Property registration finalizes your ownership in the eyes of the law. You must pay stamp duty and register the sale deed at the local sub-registrar office.</p>
    <h2>01 Stamp Duty Calculation</h2>
    <p>Stamp duty varies from state to state (typically between 4% to 7% of the property value). Many states offer a 1% concession for female owners, making it financially wise to register the property jointly with a spouse.</p>
    <h2>02 The Registration Process</h2>
    <p>Both the buyer and seller (or their authorized representatives with Power of Attorney) must be present at the Sub-Registrar of Assurances office, along with two witnesses.</p>
    <h2>03 Documents Required</h2>
    <ul>
      <li>Original Sale Deed.</li>
      <li>ID and Address Proof of buyer, seller, and witnesses.</li>
      <li>Demand Draft or proof of payment for stamp duty and registration fees.</li>
      <li>NOC from the housing society (if applicable).</li>
    </ul>
  `,
  "compact-apartment-design": `
    <p>Living in a compact urban home does not mean compromising on style or functionality. Strategic design choices can make a small flat feel spacious and elegant.</p>
    <h2>01 Utilize Vertical Space</h2>
    <p>When floor space is limited, look up. Install floor-to-ceiling cabinets. They not only provide massive storage but also draw the eye upward, making the ceilings look higher.</p>
    <h2>02 The Magic of Mirrors</h2>
    <p>Placing a large mirror opposite a window reflects natural light and instantly doubles the visual space of a room.</p>
    <h2>03 Multi-Functional Furniture</h2>
    <ul>
      <li>Sofa cum beds for guest rooms.</li>
      <li>Nesting tables instead of a bulky coffee table.</li>
      <li>Beds with hydraulic storage underneath.</li>
    </ul>
    <blockquote>In a small apartment, every piece of furniture must earn its keep by serving at least two purposes.</blockquote>
  `,
  "vastu-tips-new-home": `
    <p>Vastu Shastra offers ancient guidelines for home orientation, room placement, and entrance direction to foster well-being.</p>
    <h2>01 The Entrance</h2>
    <p>The main entrance should ideally face North, East, or North-East. It should be well-lit and clutter-free to invite positive energy into the home.</p>
    <h2>02 The Kitchen Placement</h2>
    <p>According to Vastu, the South-East corner is the best place for the kitchen as it is associated with the fire element. If that's not possible, the North-West is the second best alternative.</p>
    <h2>03 Master Bedroom</h2>
    <p>The master bedroom should be located in the South-West corner of the house. Sleep with your head pointing towards the South or East for better health and prosperity.</p>
  `,
  "sustainable-living-spaces": `
    <p>Eco-friendly homes reduce long-term maintenance costs while contributing to environmental conservation. Start with LED lighting, low-flow fixtures, and native landscaping.</p>
    <h2>01 Energy Efficiency</h2>
    <p>Switching to 100% LED lighting and using energy-efficient 5-star rated appliances can reduce your electricity bill by up to 30%.</p>
    <h2>02 Water Conservation</h2>
    <p>Install aerators on all taps and dual-flush systems in toilets. If you live in a villa or an independent house, rainwater harvesting is a must.</p>
    <h2>03 Indoor Air Quality</h2>
    <ul>
      <li>Use low-VOC (Volatile Organic Compounds) paints.</li>
      <li>Keep indoor plants like Snake Plant and Peace Lily which naturally purify the air.</li>
      <li>Ensure cross-ventilation in all rooms.</li>
    </ul>
    <blockquote>A sustainable home is not just good for the planet; it is significantly cheaper to operate and healthier to live in.</blockquote>
  `
};

async function updateBlogs() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    
    for (const [slug, content] of Object.entries(detailedContents)) {
      const updated = await Blog.findOneAndUpdate(
        { slug: slug },
        { content: content },
        { new: true }
      );
      if (updated) {
        console.log("Updated content for: " + slug);
      } else {
        console.log("Blog not found: " + slug);
      }
    }
    
    console.log('Finished updating blogs.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateBlogs();
