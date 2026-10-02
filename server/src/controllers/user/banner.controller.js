/**
 * User Banner Controller
 * Retrieves active banners for the Home Screen & sections,
 * and tracks impressions and clicks.
 */

const Banner = require('../../models/banner.model');

// Helper to build active date range query
const buildDateFilter = () => {
  const now = new Date();
  return {
    isActive: true,
    $and: [
      {
        $or: [
          { startDate: null },
          { startDate: { $lte: now } },
        ],
      },
      {
        $or: [
          { endDate: null },
          { endDate: { $gte: now } },
        ],
      },
    ],
  };
};

// @desc    Get all active banners (optionally filtered by position)
// @route   GET /api/banners or GET /api/user/banners
// @access  Public
exports.getActiveBanners = async (req, res, next) => {
  try {
    const { position, limit } = req.query;
    const query = buildDateFilter();

    if (position) {
      // Support comma-separated positions, e.g. "home_top,home_middle"
      if (position.includes(',')) {
        query.position = { $in: position.split(',').map((p) => p.trim()) };
      } else {
        query.position = position;
      }
    }

    let bannerQuery = Banner.find(query).sort({ sortOrder: 1, createdAt: -1 });

    if (limit && !isNaN(Number(limit))) {
      bannerQuery = bannerQuery.limit(Number(limit));
    }

    const banners = await bannerQuery;

    // Increment impressions/viewsCount asynchronously
    if (banners.length > 0) {
      const bannerIds = banners.map((b) => b._id);
      Banner.updateMany({ _id: { $in: bannerIds } }, { $inc: { viewsCount: 1 } }).exec();
    }

    res.status(200).json({
      status: 'success',
      results: banners.length,
      data: {
        banners,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get organized Home Page banners (Hero carousel, middle promo, commercial promos)
// @route   GET /api/banners/home or GET /api/user/banners/home
// @access  Public
exports.getHomeBanners = async (req, res, next) => {
  try {
    const baseQuery = buildDateFilter();

    const [heroBanners, middleBanners, bottomBanners, commercialBanners] = await Promise.all([
      // 1. Home Top Hero Carousel
      Banner.find({ ...baseQuery, position: 'home_top' }).sort({ sortOrder: 1, createdAt: -1 }),
      // 2. Middle Promo Cards
      Banner.find({ ...baseQuery, position: 'home_middle' }).sort({ sortOrder: 1, createdAt: -1 }),
      // 3. Bottom CTA Banner
      Banner.find({ ...baseQuery, position: 'home_bottom' }).sort({ sortOrder: 1, createdAt: -1 }),
      // 4. Commercial Space Specific Promo
      Banner.find({ ...baseQuery, position: 'commercial' }).sort({ sortOrder: 1, createdAt: -1 }),
    ]);

    // Increment view counts
    const allFetched = [
      ...heroBanners,
      ...middleBanners,
      ...bottomBanners,
      ...commercialBanners,
    ];
    if (allFetched.length > 0) {
      const allIds = allFetched.map((b) => b._id);
      Banner.updateMany({ _id: { $in: allIds } }, { $inc: { viewsCount: 1 } }).exec();
    }

    res.status(200).json({
      status: 'success',
      data: {
        heroBanners,
        middleBanners,
        bottomBanners,
        commercialBanners,
        allHomeBanners: [...heroBanners, ...middleBanners, ...bottomBanners],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single banner details
// @route   GET /api/banners/:id
// @access  Public
exports.getBannerById = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner || !banner.isActive) {
      return res.status(404).json({
        status: 'fail',
        message: 'Banner not found or inactive.',
      });
    }

    // Increment view count
    await Banner.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } });

    res.status(200).json({
      status: 'success',
      data: {
        banner,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Track banner click
// @route   POST or PATCH /api/banners/:id/click
// @access  Public
exports.trackBannerClick = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      { $inc: { clicksCount: 1 } },
      { new: true }
    );

    if (!banner) {
      return res.status(404).json({
        status: 'fail',
        message: 'Banner not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Banner click tracked successfully.',
      data: {
        bannerId: banner._id,
        clicksCount: banner.clicksCount,
        linkType: banner.linkType,
        linkValue: banner.linkValue,
      },
    });
  } catch (error) {
    next(error);
  }
};
