/**
 * Admin Banner Controller
 * Comprehensive Banner management for administrators:
 * Create, Update, Delete, Reorder, Toggle Status, and Filter by Position.
 */

const Banner = require('../../models/banner.model');

// @desc    Get all banners (Admin - includes inactive & expired)
// @route   GET /api/admin/banners
// @access  Private (Admin)
exports.getAllBanners = async (req, res, next) => {
  try {
    const { position, isActive, search, page, limit } = req.query;
    const filter = {};

    if (position) {
      filter.position = position;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { subtitle: searchRegex },
        { description: searchRegex },
        { linkValue: searchRegex },
      ];
    }

    let query = Banner.find(filter).sort({ sortOrder: 1, createdAt: -1 });

    if (page && limit) {
      const skip = (Number(page) - 1) * Number(limit);
      query = query.skip(skip).limit(Number(limit));
    }

    const [banners, totalCount] = await Promise.all([
      query,
      Banner.countDocuments(filter),
    ]);

    res.status(200).json({
      status: 'success',
      results: banners.length,
      totalCount,
      data: {
        banners,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single banner by ID
// @route   GET /api/admin/banners/:id
// @access  Private (Admin)
exports.getBannerById = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        status: 'fail',
        message: 'Banner not found.',
      });
    }

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

// @desc    Create a new banner
// @route   POST /api/admin/banners
// @access  Private (Admin)
exports.createBanner = async (req, res, next) => {
  try {
    const bannerData = { ...req.body };

    // Process file uploads if passed through multer
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        bannerData.image = `${req.protocol}://${req.get('host')}/uploads/${req.files.image[0].filename}`;
      }
      if (req.files.mobileImage && req.files.mobileImage[0]) {
        bannerData.mobileImage = `${req.protocol}://${req.get('host')}/uploads/${req.files.mobileImage[0].filename}`;
      }
    } else if (req.file) {
      bannerData.image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    if (!bannerData.image) {
      return res.status(400).json({
        status: 'fail',
        message: 'Banner image (file upload or URL) is required.',
      });
    }

    if (req.user && req.user._id) {
      bannerData.createdBy = req.user._id;
    }

    // Parse boolean and numeric fields
    if (bannerData.isActive !== undefined) {
      bannerData.isActive = bannerData.isActive === 'true' || bannerData.isActive === true;
    }
    if (bannerData.sortOrder !== undefined) {
      bannerData.sortOrder = Number(bannerData.sortOrder) || 0;
    }

    const banner = await Banner.create(bannerData);

    res.status(201).json({
      status: 'success',
      message: 'Banner created successfully.',
      data: {
        banner,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a banner
// @route   PUT /api/admin/banners/:id
// @access  Private (Admin)
exports.updateBanner = async (req, res, next) => {
  try {
    const bannerData = { ...req.body };

    // Process file uploads if passed
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        bannerData.image = `${req.protocol}://${req.get('host')}/uploads/${req.files.image[0].filename}`;
      }
      if (req.files.mobileImage && req.files.mobileImage[0]) {
        bannerData.mobileImage = `${req.protocol}://${req.get('host')}/uploads/${req.files.mobileImage[0].filename}`;
      }
    } else if (req.file) {
      bannerData.image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    // Support removing mobileImage if specified
    if (bannerData.removeMobileImage === 'true' || bannerData.removeMobileImage === true) {
      bannerData.mobileImage = '';
    }

    if (bannerData.isActive !== undefined) {
      bannerData.isActive = bannerData.isActive === 'true' || bannerData.isActive === true;
    }
    if (bannerData.sortOrder !== undefined) {
      bannerData.sortOrder = Number(bannerData.sortOrder) || 0;
    }

    const banner = await Banner.findByIdAndUpdate(req.params.id, bannerData, {
      new: true,
      runValidators: true,
    });

    if (!banner) {
      return res.status(404).json({
        status: 'fail',
        message: 'Banner not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Banner updated successfully.',
      data: {
        banner,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle banner active status
// @route   PATCH /api/admin/banners/:id/status
// @access  Private (Admin)
exports.toggleBannerStatus = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        status: 'fail',
        message: 'Banner not found.',
      });
    }

    const newStatus = req.body.isActive !== undefined
      ? (req.body.isActive === true || req.body.isActive === 'true')
      : !banner.isActive;

    banner.isActive = newStatus;
    await banner.save();

    res.status(200).json({
      status: 'success',
      message: `Banner status set to ${newStatus ? 'Active' : 'Inactive'}.`,
      data: {
        bannerId: banner._id,
        isActive: banner.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder banners (bulk sort update)
// @route   PUT /api/admin/banners/reorder
// @access  Private (Admin)
exports.reorderBanners = async (req, res, next) => {
  try {
    const { items } = req.body; // Array of { id, sortOrder }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'An array of items with { id, sortOrder } is required.',
      });
    }

    const updateOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { sortOrder: Number(item.sortOrder) || 0 } },
      },
    }));

    await Banner.bulkWrite(updateOps);

    res.status(200).json({
      status: 'success',
      message: 'Banner display orders updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a banner
// @route   DELETE /api/admin/banners/:id
// @access  Private (Admin)
exports.deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);

    if (!banner) {
      return res.status(404).json({
        status: 'fail',
        message: 'Banner not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Banner deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk delete banners
// @route   POST /api/admin/banners/bulk-delete
// @access  Private (Admin)
exports.bulkDeleteBanners = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'An array of banner IDs is required.',
      });
    }

    const result = await Banner.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      status: 'success',
      message: `${result.deletedCount} banners deleted successfully.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};
