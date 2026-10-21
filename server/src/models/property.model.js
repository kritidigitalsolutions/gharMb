/**
 * Property Model
 * Comprehensive Schema supporting 5-Step Residential & Commercial Listing Workflows,
 * Pricing, Specs, Rental terms, Submission IDs, and Admin Moderation.
 */

const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    // Submission Tracker
    submissionId: {
      type: String,
      unique: true,
      index: true,
    },

    // Step 0: User Category & Seller Role (Builder, Agent, Owner)
    listingAs: {
      type: String,
      enum: [
        'Owner',
        'Agent / Broker',
        'Developer / Builder',
        'Builder',
        'Agent',
        'Developer',
        'owner',
        'agent',
        'builder',
      ],
      default: 'Owner',
      index: true,
    },
    userRole: {
      type: String,
      enum: ['owner', 'agent', 'builder', 'buyer', 'tenant'],
      default: 'owner',
      index: true,
    },
    postedByRole: {
      type: String,
      default: 'Owner',
      index: true,
    },

    // Step 1: Basic Details
    category: {
      type: String,
      enum: ['Residential', 'Commercial'],
      required: [true, 'Property category (Residential/Commercial) is required.'],
      default: 'Residential',
    },
    listingFor: {
      type: String,
      enum: ['Sale', 'Rent', 'Lease', 'PG'],
      required: [true, 'Specify if listing is for Sale, Rent, Lease, or PG.'],
    },
    propertyType: {
      type: String,
      required: [true, 'Property type is required.'],
      // Apartment, Villa, House, Studio, Plot (Residential)
      // Shop / Retail, Office space, Showroom, Warehouse, Co-working, Industrial plot (Commercial)
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Property listing title is required.'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters.'],
    },
    city: {
      type: String,
      required: [true, 'City is required.'],
      trim: true,
    },
    locality: {
      type: String,
      required: [true, 'Locality/area is required.'],
      trim: true,
    },
    fullAddress: {
      type: String,
      required: [true, 'Full address is required.'],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required.'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    // Step 2: Property Specs (Residential & Commercial)
    bedrooms: {
      type: String, // '1', '2', '3', '4+'
      default: '1',
    },
    bathrooms: {
      type: String, // '1', '2', '3', '4+'
      default: '1',
    },
    carpetArea: {
      type: Number,
      required: [
        function () {
          return !this.bhkConfigurations || this.bhkConfigurations.length === 0;
        },
        'Carpet area in sqft is required.',
      ],
    },
    builtUpArea: {
      type: Number,
    },
    // Multiple BHK Configurations: ONLY BHK and its Price
    bhkConfigurations: [
      {
        _id: false,
        bhk: { type: String, trim: true }, // e.g. '1 BHK', '2 BHK', '3 BHK', '4 BHK'
        price: { type: Number, required: true }, // Custom price for this BHK configuration
        bhkType: { type: String, trim: true }, // alias for backward compatibility
      },
    ],
    floorNo: {
      type: String,
      trim: true,
    },
    totalFloors: {
      type: String,
      trim: true,
    },
    // Commercial Specs
    frontage: {
      type: Number, // Width of shop/office in feet
    },
    ceilingHeight: {
      type: String, // '< 10 ft', '10–14 ft', '14–18 ft', '18+ ft'
    },
    powerLoad: {
      type: Number, // kW
    },
    ageOfProperty: {
      type: String, // '0–3 yrs', '3–7 yrs', '7–15 yrs', '15+ yrs'
    },
    furnishing: {
      type: String, // 'Unfurnished', 'Semi-furnished', 'Fully-furnished'
    },
    facingDirection: {
      type: String, // 'East', 'West', 'North', 'South', 'NE', 'NW', 'SE', 'SW'
    },
    parking: {
      type: String, // 'None', '1 covered', '2 covered', 'Open', '1 reserved', '2+ reserved', 'Visitor'
    },
    amenities: [
      {
        type: String,
        trim: true,
      },
    ],

    // Rental Terms (If Rent/Lease/PG)
    preferredTenants: [
      {
        type: String, // 'Family', 'Bachelors', 'Working professionals', 'Female', 'Male', 'Anyone'
      },
    ],
    petsAllowed: {
      type: Boolean,
      default: false,
    },
    smokingAllowed: {
      type: Boolean,
      default: false,
    },
    noticePeriod: {
      type: String, // '15 days', '1 month', '2 months', '3 months'
    },
    lockInPeriod: {
      type: String, // 'None', '6 months', '1 year', '2 years', '3 years', '4+ years'
    },
    camIncluded: {
      type: String, // 'Yes', 'No', 'Partially'
    },
    rentEscalationPercentage: {
      type: Number, // e.g. 5 for 5% yearly
    },
    brokerageFree: {
      type: Boolean,
      default: false,
    },
    rentNegotiable: {
      type: Boolean,
      default: false,
    },
    availableFrom: {
      type: String, // 'Immediate', 'Within 1 Month', 'Within 3 Months', 'Custom Date'
    },

    // Step 3: Photos & Short Videos Upload (Walkthroughs, reels, tours)
    images: [
      {
        type: String,
      },
    ],
    videos: [
      {
        type: String,
      },
    ],
    propertyVideos: [
      {
        type: String,
      },
    ],

    // Step 4: Pricing & Preferences
    price: {
      type: Number,
      required: [
        function () {
          return !this.bhkConfigurations || this.bhkConfigurations.length === 0;
        },
        'Property price or monthly rent is required.',
      ],
    },
    securityDeposit: {
      type: Number,
      default: 0,
    },
    securityDepositDuration: {
      type: String,
    },
    maintenanceCharges: {
      type: Number,
      default: 0,
    },
    maintenanceIncludedInRent: {
      type: Boolean,
      default: false,
    },
    brokerageFee: {
      type: Number,
      default: 0,
    },
    otherCharges: {
      type: Number,
      default: 0,
    },

    // Step 4: Admin Commission & Commission Discount (Discount strictly on Admin Commission, never on property price)
    adminCommission: {
      type: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage',
      },
      rate: {
        type: Number,
        default: 2, // 2% platform commission default
      },
      amount: {
        type: Number,
        default: 0,
      },
    },
    commissionDiscount: {
      enabled: {
        type: Boolean,
        default: false,
      },
      discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage',
      },
      discountValue: {
        type: Number,
        default: 0,
      },
      discountAmount: {
        type: Number,
        default: 0,
      },
      netCommission: {
        type: Number,
        default: 0,
      },
      discountOnCommissionOnly: {
        type: Boolean,
        default: true,
      },
      appliedAt: {
        type: Date,
      },
      notes: {
        type: String,
        default: '',
        trim: true,
      },
    },

    // Step 4: Token Booking Configuration (Set by Admin or Owner)
    allowTokenBooking: {
      type: Boolean,
      default: true,
      index: true,
    },
    tokenAmount: {
      type: Number,
      default: undefined,
    },
    tokenAmounts: {
      type: [Number],
      default: undefined,
    },
    tokenAdjustmentNote: {
      type: String,
      default: undefined,
    },

    // Step 4: Installment / EMI Options (Toggle for Direct Full Payment vs Installments)
    allowInstallments: {
      type: Boolean,
      default: false,
      index: true,
    },
    installmentDetails: {
      downPaymentAmount: {
        type: Number,
        default: 0,
      },
      downPaymentPercentage: {
        type: Number,
        default: 0,
      },
      numberOfInstallments: {
        type: Number,
        default: 0,
      },
      installmentFrequency: {
        type: String,
        enum: ['Monthly', 'Quarterly', 'Bi-annual', 'Yearly', 'Milestone-based', 'Custom'],
        default: 'Monthly',
      },
      installmentAmount: {
        type: Number,
        default: 0,
      },
      interestRate: {
        type: Number,
        default: 0, // 0 for interest-free
      },
      installmentDurationMonths: {
        type: Number,
        default: 0,
      },
      gracePeriodDays: {
        type: Number,
        default: 0,
      },
      termsAndConditions: {
        type: String,
        trim: true,
      },
      milestones: [
        {
          name: { type: String, trim: true },
          percentage: { type: Number },
          amount: { type: Number },
          dueDate: { type: Date },
          description: { type: String, trim: true },
        },
      ],
    },

    // Buyer & Property Preferences
    vastuCompliant: {
      type: Boolean,
      default: false,
    },
    keyHandover: {
      type: Boolean,
      default: false,
      index: true,
    },
    openToAllBuyers: {
      type: Boolean,
      default: true,
    },
    loanAssistanceNeeded: {
      type: Boolean,
      default: false,
    },

    // Property Documents (Title deed, tax receipt, electricity bill, khata, etc.)
    propertyDocuments: {
      titleDeed: { type: String, trim: true },
      electricityBill: { type: String, trim: true },
      taxReceipt: { type: String, trim: true },
      khataExtract: { type: String, trim: true },
      otherDoc: { type: String, trim: true },
    },
    documents: [
      {
        name: { type: String, trim: true },
        url: { type: String, trim: true },
        docType: { type: String, trim: true },
      },
    ],

    // Plan Selection
    listingTier: {
      type: String,
      enum: ['Standard', 'Featured', 'Premium'],
      default: 'Standard',
    },

    // Map Coordinates (GeoJSON)
    location: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [72.8561, 19.2812],
      },
    },

    // Owner / Creator Reference
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Property listing must belong to a user.'],
    },

    // Moderation & Approval Status
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    isLive: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Performance Analytics
    viewsCount: {
      type: Number,
      default: 0,
    },
    shortlistedCount: {
      type: Number,
      default: 0,
    },
    inquiriesCount: {
      type: Number,
      default: 0,
    },
    tokensCount: {
      type: Number,
      default: 0,
    },

    // Admin Property Sale Management
    isSold: {
      type: Boolean,
      default: false,
      index: true,
    },
    saleStatus: {
      type: String,
      enum: ['available', 'marked_as_sold', 'sold', 'sale_cancelled'],
      default: 'available',
      index: true,
    },
    soldMarkedAt: {
      type: Date,
    },
    saleConfirmationDueDate: {
      type: Date,
    },
    saleNotificationSent: {
      type: Boolean,
      default: false,
      index: true,
    },
    saleConfirmedAt: {
      type: Date,
    },
    saleCancelledAt: {
      type: Date,
    },
    soldByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    saleNotes: {
      type: String,
      trim: true,
      default: '',
    },

    // Rating & Reviews Summary
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Investment Score (Admin Curated)
    investmentScore: {
      overall: {
        type: Number,
        default: 0,
        min: 0,
        max: 10,
      },
      grade: {
        type: String,
        trim: true,
        default: 'Not Rated',
      },
      metrics: {
        connectivity: { type: Number, default: 0, min: 0, max: 10 },
        rentalPotential: { type: Number, default: 0, min: 0, max: 10 },
        growthPotential: { type: Number, default: 0, min: 0, max: 10 },
        familyLiving: { type: Number, default: 0, min: 0, max: 10 },
        futureDemand: { type: Number, default: 0, min: 0, max: 10 },
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-validate hook to calculate defaults from multiple BHK configurations and omit security deposit for sale
propertySchema.pre('validate', function () {
  // If listing is for Sale, remove / clear Security Deposit and Duration
  const isForSale = String(this.listingFor || '').trim().toLowerCase() === 'sale';
  if (isForSale) {
    this.securityDeposit = undefined;
    this.securityDepositDuration = undefined;
  }

  // If multiple BHK configurations are provided, normalize and populate baseline price
  if (Array.isArray(this.bhkConfigurations) && this.bhkConfigurations.length > 0) {
    this.bhkConfigurations = this.bhkConfigurations.map(item => {
      const bhkVal = item.bhk || item.bhkType || '';
      return {
        bhk: bhkVal,
        bhkType: bhkVal,
        price: Number(item.price) || 0
      };
    });

    const validPrices = this.bhkConfigurations
      .map((b) => Number(b.price || 0))
      .filter((p) => p > 0);

    if (validPrices.length > 0 && (!this.price || Number(this.price) === 0)) {
      this.price = Math.min(...validPrices);
    }

    const firstBhk = this.bhkConfigurations[0];
    if (!this.bedrooms && (firstBhk.bhk || firstBhk.bhkType)) {
      this.bedrooms = firstBhk.bhk || firstBhk.bhkType;
    }
  }
});

// Auto-generate Submission ID & normalize seller role before saving
propertySchema.pre('save', function () {
  if (!this.submissionId) {
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.submissionId = `#GBM-${dateStr}-${randomNum}`;
  }

  // Ensure security deposit & duration are undefined for sale listings
  const isForSale = String(this.listingFor || '').trim().toLowerCase() === 'sale';
  if (isForSale) {
    this.securityDeposit = undefined;
    this.securityDepositDuration = undefined;
  }

  // Normalize listingAs, userRole, and postedByRole (Builder, Agent, Owner)
  const raw = (this.listingAs || '').toLowerCase();
  const role = (this.userRole || '').toLowerCase();
  const isBuilder = raw.includes('builder') || raw.includes('developer') || role === 'builder';
  const isAgent = raw.includes('agent') || raw.includes('broker') || role === 'agent';

  if (isBuilder) {
    this.listingAs = 'Developer / Builder';
    this.userRole = 'builder';
    this.postedByRole = 'Builder';
  } else if (isAgent) {
    this.listingAs = 'Agent / Broker';
    this.userRole = 'agent';
    this.postedByRole = 'Agent';
  } else {
    this.listingAs = 'Owner';
    this.userRole = 'owner';
    this.postedByRole = 'Owner';
  }

  // ── 🛡️ MEDIA CLEANUP & SEPARATION (Images & Videos) ─────────────────────
  // Automatically separate photos from short videos (walkthroughs, reels, tours)
  const isVideoCheck = (url) => {
    if (!url || typeof url !== 'string') return false;
    try {
      const decoded = decodeURIComponent(url).toLowerCase();
      const cleanPath = decoded.split('?')[0];
      return (
        /\.(mp4|webm|mov|m4v|mkv|avi|3gp)$/i.test(cleanPath) ||
        decoded.includes('/video/') ||
        decoded.includes('/videos/') ||
        decoded.includes('video/mp4') ||
        decoded.includes('format=mp4') ||
        decoded.includes('contenttype=video') ||
        decoded.includes('uploads%2fvideo') ||
        decoded.includes('uploads/video')
      );
    } catch (_) {
      return /\.(mp4|webm|mov|m4v|mkv|avi|3gp)/i.test(url) || url.toLowerCase().includes('video');
    }
  };

  const rawImages = Array.isArray(this.images) ? this.images : [];
  const rawVideos = Array.isArray(this.videos) && this.videos.length > 0
    ? this.videos
    : (Array.isArray(this.propertyVideos) ? this.propertyVideos : []);

  const combinedMedia = [...rawImages, ...rawVideos].filter(Boolean);
  const cleanImages = [];
  const cleanVideos = [];

  for (const m of combinedMedia) {
    if (typeof m !== 'string' || !m.trim()) continue;
    const trimmed = m.trim();
    if (isVideoCheck(trimmed)) {
      if (!cleanVideos.includes(trimmed)) cleanVideos.push(trimmed);
    } else {
      if (!cleanImages.includes(trimmed)) cleanImages.push(trimmed);
    }
  }

  this.images = cleanImages;
  this.videos = cleanVideos;
  this.propertyVideos = cleanVideos;

  // Ensure Multiple BHK configurations baseline pricing & auto-computed summary
  if (Array.isArray(this.bhkConfigurations) && this.bhkConfigurations.length > 0) {
    const validPrices = this.bhkConfigurations
      .map((b) => Number(b.price || b.minPrice || 0))
      .filter((p) => p > 0);

    if (validPrices.length > 0 && (!this.price || Number(this.price) === 0)) {
      this.price = Math.min(...validPrices);
    }
  }

  // Admin Sale Confirmation logic:
  // If property sale is confirmed, property is unlisted / no longer displayed in app
  if (this.saleStatus === 'sold') {
    this.isSold = true;
    this.isLive = false;
    if (!this.saleConfirmedAt) this.saleConfirmedAt = new Date();
  } else if (this.saleStatus === 'available' || this.saleStatus === 'sale_cancelled') {
    this.isSold = false;
    // Remains available in app
    if (this.approvalStatus === 'approved') {
      this.isLive = true;
    }
  }

  // Calculate & normalize Admin Commission and Commission Discount
  // DEVELOPER RULE: Commission will NOT be included in property listings created by developers/builders
  const propPrice = Number(this.price) || 0;
  if (isBuilder) {
    this.adminCommission = {
      type: 'percentage',
      rate: 0,
      amount: 0,
    };
    this.commissionDiscount = {
      enabled: false,
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      netCommission: 0,
      discountOnCommissionOnly: true,
      notes: 'Developer / Builder listings carry 0% platform commission.',
    };
  } else {
    if (!this.adminCommission) {
      this.adminCommission = { type: 'percentage', rate: 2, amount: Math.round((propPrice * 2) / 100) };
    } else {
      const cType = this.adminCommission.type === 'fixed' ? 'fixed' : 'percentage';
      const cRate = cType === 'percentage' ? (Number(this.adminCommission.rate) >= 0 ? Number(this.adminCommission.rate) : 2) : 0;
      const cAmount = cType === 'percentage' ? Math.round((propPrice * cRate) / 100) : Math.round(Number(this.adminCommission.amount || 0));
      this.adminCommission.type = cType;
      this.adminCommission.rate = cRate;
      this.adminCommission.amount = cAmount;
    }

    const grossCommission = Number(this.adminCommission.amount) || 0;
    if (!this.commissionDiscount) {
      this.commissionDiscount = {
        enabled: false,
        discountType: 'percentage',
        discountValue: 0,
        discountAmount: 0,
        netCommission: grossCommission,
        discountOnCommissionOnly: true,
        notes: '',
      };
    } else {
      const isEnabled = Boolean(this.commissionDiscount.enabled);
      const dType = this.commissionDiscount.discountType === 'fixed' ? 'fixed' : 'percentage';
      const dVal = Number(this.commissionDiscount.discountValue) || 0;
      let dAmount = 0;

      if (isEnabled && dVal > 0) {
        if (dType === 'percentage') {
          dAmount = Math.round((grossCommission * Math.min(100, Math.max(0, dVal))) / 100);
        } else {
          dAmount = Math.round(Math.min(grossCommission, Math.max(0, dVal)));
        }
      }

      this.commissionDiscount.enabled = isEnabled;
      this.commissionDiscount.discountType = dType;
      this.commissionDiscount.discountValue = dVal;
      this.commissionDiscount.discountAmount = dAmount;
      this.commissionDiscount.netCommission = Math.max(0, grossCommission - dAmount);
      this.commissionDiscount.discountOnCommissionOnly = true;
    }
  }
});

// Virtual for verification badge (matches mobile UI badge)
propertySchema.virtual('isVerified').get(function () {
  return this.approvalStatus === 'approved';
});

// Virtuals for seller role badges and mobile listing cards
propertySchema.virtual('role').get(function () {
  if (this.userRole) return this.userRole;
  const l = (this.listingAs || '').toLowerCase();
  if (l.includes('builder') || l.includes('developer')) return 'builder';
  if (l.includes('agent') || l.includes('broker')) return 'agent';
  return 'owner';
});

propertySchema.virtual('roleTitle').get(function () {
  const r = this.role;
  if (r === 'builder') return 'Builder Profile';
  if (r === 'agent') return 'Agent Profile';
  return 'Owner Profile';
});

propertySchema.virtual('listedBy').get(function () {
  if (this.postedByRole) return this.postedByRole;
  const l = (this.listingAs || '').toLowerCase();
  if (l.includes('builder') || l.includes('developer')) return 'Builder';
  if (l.includes('agent') || l.includes('broker')) return 'Agent';
  return 'Owner';
});

propertySchema.virtual('sellerRole').get(function () {
  return this.listedBy;
});

// Virtuals for commission-absorbed discount pricing
propertySchema.virtual('effectiveBuyerPrice').get(function () {
  const p = Number(this.price) || 0;
  const d = (this.commissionDiscount?.enabled) ? Number(this.commissionDiscount?.discountAmount || 0) : 0;
  return Math.max(0, p - d);
});

propertySchema.virtual('hasDiscount').get(function () {
  return Boolean(this.commissionDiscount?.enabled && this.commissionDiscount?.discountAmount > 0);
});

// Virtuals for Ratings & Reviews
propertySchema.virtual('averageRating').get(function () {
  return Number(this.rating) || 0;
});

propertySchema.virtual('totalRatings').get(function () {
  return Number(this.reviewsCount) || 0;
});

// Virtuals for multiple BHK configurations
propertySchema.virtual('hasMultipleBhk').get(function () {
  return Array.isArray(this.bhkConfigurations) && this.bhkConfigurations.length > 0;
});

propertySchema.virtual('bhkSummary').get(function () {
  if (Array.isArray(this.bhkConfigurations) && this.bhkConfigurations.length > 0) {
    const types = this.bhkConfigurations
      .map((b) => b.bhk || b.bhkType)
      .filter(Boolean);
    return [...new Set(types)].join(', ');
  }
  return this.bedrooms ? `${this.bedrooms} BHK` : '';
});

// Virtual for Admin Sale Confirmation status
propertySchema.virtual('isPendingSaleConfirmation').get(function () {
  return this.saleStatus === 'marked_as_sold';
});

// Virtual for unified Property Gallery (photos and short videos with type tags)
propertySchema.virtual('gallery').get(function () {
  const isVideoCheck = (url) => {
    if (!url || typeof url !== 'string') return false;
    try {
      const decoded = decodeURIComponent(url).toLowerCase();
      const cleanPath = decoded.split('?')[0];
      return (
        /\.(mp4|webm|mov|m4v|mkv|avi|3gp)$/i.test(cleanPath) ||
        decoded.includes('/video/') ||
        decoded.includes('/videos/') ||
        decoded.includes('video/mp4') ||
        decoded.includes('format=mp4') ||
        decoded.includes('contenttype=video') ||
        decoded.includes('uploads%2fvideo') ||
        decoded.includes('uploads/video')
      );
    } catch (_) {
      return /\.(mp4|webm|mov|m4v|mkv|avi|3gp)/i.test(url) || url.toLowerCase().includes('video');
    }
  };

  const photos = (this.images || []).map((url) => ({
    url,
    type: isVideoCheck(url) ? 'video' : 'image',
  }));
  const vids = (this.videos || this.propertyVideos || []).map((url) => ({
    url,
    type: 'video',
  }));

  const seen = new Set();
  const result = [];
  for (const item of [...photos, ...vids]) {
    if (item.url && !seen.has(item.url)) {
      seen.add(item.url);
      result.push(item);
    }
  }
  return result;
});

// Virtual aliases for photos and primary video
propertySchema.virtual('photos').get(function () {
  return this.images || [];
});

propertySchema.virtual('video').get(function () {
  return (this.videos && this.videos[0]) || (this.propertyVideos && this.propertyVideos[0]) || null;
});

propertySchema.virtual('videoUrl').get(function () {
  return (this.videos && this.videos[0]) || (this.propertyVideos && this.propertyVideos[0]) || null;
});

// Indexes for fast searching & filtering
propertySchema.index({ category: 1, listingFor: 1, isLive: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ location: '2dsphere' });
propertySchema.index({ title: 'text', city: 'text', locality: 'text' });

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
