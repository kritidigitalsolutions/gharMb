/**
 * Admin Dashboard Controller
 * Compiles system-wide analytics, metrics, and KPI counts.
 */

const User = require('../../models/user.model');
const Property = require('../../models/property.model');
const PropertyEnquiry = require('../../models/property-enquiry.model');

// @desc    Get aggregate platform metrics
// @route   GET /api/v1/admin/dashboard/stats
// @access  Private (Admin only)
exports.getDashboardStats = async (req, res, next) => {
  try {
    // 1. Get total users count by role
    const userRoleCounts = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    // 2. Get properties status breakdown
    const propertyStatusCounts = await Property.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // 3. Get total enquiries count
    const totalEnquiries = await PropertyEnquiry.countDocuments();

    // 4. Retrieve recent listings (last 5)
    const recentProperties = await Property.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('owner', 'name email phone');

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          usersBreakdown: userRoleCounts,
          propertiesBreakdown: propertyStatusCounts,
          totalEnquiries,
        },
        recentProperties,
      },
    });
  } catch (error) {
    next(error);
  }
};
