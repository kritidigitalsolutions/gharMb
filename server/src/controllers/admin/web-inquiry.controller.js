/**
 * Admin Web Inquiry Controller
 * Manages Website Contact Forms & Delete Profile Requests on Dashboard
 */

const WebInquiry = require('../../models/web-inquiry.model');

// @desc    Get all web inquiries (with pagination, search, filter)
// @route   GET /api/admin/web-inquiries
// @access  Private (Admin only)
exports.getAllWebInquiries = async (req, res, next) => {
  try {
    const {
      type, // 'contact', 'deletion_request', or undefined/all
      status, // 'new', 'in_progress', 'resolved', 'rejected', or undefined/all
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (type && type !== 'all') {
      query.type = type;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { refId: searchRegex },
        { message: searchRegex },
        { reason: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [inquiries, total] = await Promise.all([
      WebInquiry.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      WebInquiry.countDocuments(query),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        inquiries,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get summary statistics for web inquiries
// @route   GET /api/admin/web-inquiries/stats
// @access  Private (Admin only)
exports.getWebInquiryStats = async (req, res, next) => {
  try {
    const [total, newInquiries, contactTotal, deletionTotal, resolvedTotal] =
      await Promise.all([
        WebInquiry.countDocuments(),
        WebInquiry.countDocuments({ status: 'new' }),
        WebInquiry.countDocuments({ type: 'contact' }),
        WebInquiry.countDocuments({ type: 'deletion_request' }),
        WebInquiry.countDocuments({ status: 'resolved' }),
      ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          total,
          newInquiries,
          contactTotal,
          deletionTotal,
          resolvedTotal,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single inquiry details
// @route   GET /api/admin/web-inquiries/:id
// @access  Private (Admin only)
exports.getWebInquiryById = async (req, res, next) => {
  try {
    const inquiry = await WebInquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        status: 'fail',
        message: 'Inquiry not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: { inquiry },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update inquiry status & admin notes
// @route   PATCH /api/admin/web-inquiries/:id
// @access  Private (Admin only)
exports.updateWebInquiry = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;

    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === 'resolved') {
        updateData.resolvedAt = new Date();
      }
    }
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    const inquiry = await WebInquiry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!inquiry) {
      return res.status(404).json({
        status: 'fail',
        message: 'Inquiry not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Inquiry updated successfully.',
      data: { inquiry },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a web inquiry
// @route   DELETE /api/admin/web-inquiries/:id
// @access  Private (Admin only)
exports.deleteWebInquiry = async (req, res, next) => {
  try {
    const inquiry = await WebInquiry.findByIdAndDelete(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        status: 'fail',
        message: 'Inquiry not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Inquiry deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk delete inquiries
// @route   POST /api/admin/web-inquiries/bulk-delete
// @access  Private (Admin only)
exports.bulkDeleteWebInquiries = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide an array of inquiry IDs.',
      });
    }

    await WebInquiry.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      status: 'success',
      message: `${ids.length} inquiries deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};
