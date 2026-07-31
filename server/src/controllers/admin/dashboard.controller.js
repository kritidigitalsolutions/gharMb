/**
 * Admin Dashboard Controller
 * Compiles system-wide analytics, metrics, KPI counts, leads, and revenue reports.
 * Optimized with concurrent database operations to resolve latency and speed issues.
 */

const User = require('../../models/user.model');
const Property = require('../../models/property.model');
const Project = require('../../models/project.model');
const PropertyEnquiry = require('../../models/property-enquiry.model');
const DeveloperEnquiry = require('../../models/developer-enquiry.model');
const Notification = require('../../models/notification.model');

// @desc    Get aggregate platform metrics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin only)
exports.getDashboardStats = async (req, res, next) => {
  try {
    // 1. Core metric counts (Optimized with Promise.all for concurrency)
    const [
      totalUsers,
      activeUsers,
      totalProperties,
      liveProperties,
      pendingProperties,
      rejectedProperties,
      totalBuilders,
      activeProjects,
      propEnquiriesCount,
      devEnquiriesCount,
      siteVisits,
      propertyTokensResult,
      featuredCount,
      premiumCount,
      pendingProps,
      recentNotifs
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'Active' }),
      Property.countDocuments(),
      Property.countDocuments({ isLive: true }),
      Property.countDocuments({ approvalStatus: 'pending' }),
      Property.countDocuments({ approvalStatus: 'rejected' }),
      User.countDocuments({ role: 'builder' }),
      Project.countDocuments({ isLive: true }),
      PropertyEnquiry.countDocuments(),
      DeveloperEnquiry.countDocuments(),
      PropertyEnquiry.countDocuments({ visitPreferredDate: { $ne: null } }),
      Property.aggregate([{ $group: { _id: null, total: { $sum: '$tokensCount' } } }]),
      Property.countDocuments({ listingTier: 'Featured' }),
      Property.countDocuments({ listingTier: 'Premium' }),
      Property.find({ approvalStatus: 'pending' }).populate('owner', 'name companyName').limit(5),
      Notification.find().sort({ createdAt: -1 }).limit(5)
    ]);

    const totalEnquiries = propEnquiriesCount + devEnquiriesCount;
    const tokenRequests = propertyTokensResult[0]?.total || 0;
    const revenueGenerated = (featuredCount * 5000) + (premiumCount * 10000) + (tokenRequests * 50000);

    // 2. Dynamic Chart Data (Last 6 Months parallelized queries)
    const chartQueries = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      
      chartQueries.push((async () => {
        const [mPropEnq, mDevEnq, mFeatured, mPremium, mProperties] = await Promise.all([
          PropertyEnquiry.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
          DeveloperEnquiry.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
          Property.countDocuments({ listingTier: 'Featured', createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
          Property.countDocuments({ listingTier: 'Premium', createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
          Property.find({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }).select('tokensCount')
        ]);
        
        const mTokens = mProperties.reduce((sum, p) => sum + (p.tokensCount || 0), 0);
        const mRevenue = (mFeatured * 5000) + (mPremium * 10000) + (mTokens * 50000);

        return {
          name: months[d.getMonth()],
          revenue: mRevenue || 0,
          enquiries: (mPropEnq + mDevEnq) || 0
        };
      })());
    }

    const chartData = await Promise.all(chartQueries);

    // 3. Verification Alerts Mapping
    const verificationAlerts = pendingProps.map(p => ({
      id: p._id,
      title: p.listingAs === 'Developer / Builder' ? 'RERA License Check' : 'Registry Deed Check',
      subtitle: p.owner?.companyName || p.owner?.name || 'Tata Value Homes',
      propertyId: p._id
    }));

    // 4. Audit Logs Mapping
    const auditLogs = recentNotifs.map(n => {
      let logType = 'system';
      if (n.type === 'enquiry') logType = 'enquiry';
      else if (n.type === 'payment') logType = 'payment';
      else if (n.type === 'verification') logType = 'verification';

      return {
        id: n._id,
        title: n.title,
        message: n.message,
        time: n.createdAt,
        type: logType
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalUsers,
          activeUsers,
          totalProperties,
          liveProperties,
          pendingProperties,
          rejectedProperties,
          totalBuilders,
          activeProjects,
          totalEnquiries,
          siteVisits,
          tokenRequests,
          revenueGenerated
        },
        chartData,
        verificationAlerts,
        auditLogs
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all enquiries / customer leads
// @route   GET /api/admin/dashboard/enquiries
// @access  Private (Admin only)
exports.getAllEnquiries = async (req, res, next) => {
  try {
    const [propEnquiries, devEnquiries] = await Promise.all([
      PropertyEnquiry.find()
        .populate('property', 'title price locality city carpetArea')
        .populate('client', 'name email phone')
        .sort({ createdAt: -1 }),
      DeveloperEnquiry.find()
        .populate('developer', 'name companyName email phone')
        .populate('client', 'name email phone')
        .sort({ createdAt: -1 })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        propertyEnquiries: propEnquiries,
        developerEnquiries: devEnquiries
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update status or notes of an enquiry
// @route   PATCH /api/admin/dashboard/enquiries/:id
// @access  Private (Admin only)
exports.updateEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    let enquiry = await PropertyEnquiry.findById(id);
    let type = 'property';

    if (!enquiry) {
      enquiry = await DeveloperEnquiry.findById(id);
      type = 'developer';
    }

    if (!enquiry) {
      return res.status(404).json({
        status: 'fail',
        message: 'No enquiry found with that ID.'
      });
    }

    if (type === 'property') {
      if (status) enquiry.status = status;
      if (notes !== undefined) enquiry.agentNotes = notes;
    } else {
      if (status) enquiry.status = status;
      if (notes !== undefined) enquiry.developerNotes = notes;
    }

    await enquiry.save();

    res.status(200).json({
      status: 'success',
      message: 'Enquiry updated successfully.',
      data: {
        enquiry
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an enquiry / customer lead
// @route   DELETE /api/admin/dashboard/enquiries/:id
// @access  Private (Admin only)
exports.deleteEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;

    let enquiry = await PropertyEnquiry.findByIdAndDelete(id);
    if (!enquiry) {
      enquiry = await DeveloperEnquiry.findByIdAndDelete(id);
    }

    if (!enquiry) {
      return res.status(404).json({
        status: 'fail',
        message: 'No enquiry found with that ID.'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Enquiry deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get revenue stats and token transactions
// @route   GET /api/admin/dashboard/revenue
// @access  Private (Admin only)
exports.getRevenueStats = async (req, res, next) => {
  try {
    // Aggregates for revenue statistics cards (Parallelized queries)
    const [
      propertyTokensResult,
      featuredCount,
      premiumCount,
      enquiriesWithToken
    ] = await Promise.all([
      Property.aggregate([{ $group: { _id: null, total: { $sum: '$tokensCount' } } }]),
      Property.countDocuments({ listingTier: 'Featured' }),
      Property.countDocuments({ listingTier: 'Premium' }),
      PropertyEnquiry.find({ visitPreferredDate: { $ne: null } })
        .populate('property', 'title owner price')
        .populate('client', 'name')
        .sort({ createdAt: -1 })
    ]);

    const tokenRequests = propertyTokensResult[0]?.total || 0;
    const featuredRev = featuredCount * 5000;
    const premiumRev = premiumCount * 10000;
    const boostRev = 180000; // Simulated flat boost packages
    const escrowCommission = tokenRequests * 50000;

    // Monthly billing growth trend (last 6 months parallelized queries)
    const trendQueries = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      trendQueries.push((async () => {
        const [mFeatured, mPremium, mProperties] = await Promise.all([
          Property.countDocuments({ listingTier: 'Featured', createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
          Property.countDocuments({ listingTier: 'Premium', createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
          Property.find({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }).select('tokensCount')
        ]);

        const mTokens = mProperties.reduce((sum, p) => sum + (p.tokensCount || 0), 0);

        return {
          month: months[d.getMonth()],
          featured: mFeatured * 5000 || 0,
          premium: mPremium * 10000 || 0,
          boost: 30000, // flat monthly simulation
          escrow: mTokens * 50000 || 0
        };
      })());
    }

    const revenueTrend = await Promise.all(trendQueries);

    // Build real list of Token Escrow Transactions
    const tokenTransactions = await Promise.all(
      enquiriesWithToken.map(async (eq) => {
        const ownerUser = await User.findById(eq.property?.owner).select('name companyName');
        const sellerName = ownerUser?.companyName || ownerUser?.name || 'Unknown Seller';
        
        let status = 'Pending';
        if (eq.status === 'resolved') status = 'Approved';
        else if (eq.status === 'cancelled') status = 'Refunded';

        return {
          id: `TKN-${eq._id.toString().slice(-4).toUpperCase()}`,
          enquiryId: eq._id,
          buyer: eq.client?.name || 'Buyer',
          seller: sellerName,
          property: eq.property?.title || 'Property',
          amount: '₹50,000',
          status,
          date: eq.createdAt ? new Date(eq.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown'
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          featuredRev,
          premiumRev,
          boostRev,
          escrowCommission
        },
        revenueTrend,
        tokenTransactions
      }
    });
  } catch (error) {
    next(error);
  }
};
