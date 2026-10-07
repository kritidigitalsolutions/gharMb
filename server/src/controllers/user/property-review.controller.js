/**
 * Property Review Controller
 * Handles submitting, updating, retrieving, and aggregating ratings & reviews for properties,
 * and aggregating overall ratings for the property owner.
 */

const mongoose = require('mongoose');
const PropertyReview = require('../../models/property-review.model');
const Property = require('../../models/property.model');
const User = require('../../models/user.model');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Helper to recalculate and sync aggregate rating metrics for both the property and its owner
 */
async function syncPropertyAndOwnerRatings(propertyId, ownerId) {
  // 1. Recalculate property-level stats
  const propStats = await PropertyReview.aggregate([
    { $match: { property: new mongoose.Types.ObjectId(propertyId) } },
    {
      $group: {
        _id: '$property',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const propertyRating = propStats.length > 0 ? Math.round(propStats[0].avgRating * 10) / 10 : 0;
  const propertyReviewsCount = propStats.length > 0 ? propStats[0].totalReviews : 0;

  await Property.findByIdAndUpdate(
    propertyId,
    { rating: propertyRating, reviewsCount: propertyReviewsCount },
    { runValidators: false }
  );

  // 2. Recalculate owner-level stats (across all properties owned by this user)
  if (ownerId) {
    const ownerStats = await PropertyReview.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(ownerId) } },
      {
        $group: {
          _id: '$owner',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const ownerRating = ownerStats.length > 0 ? Math.round(ownerStats[0].avgRating * 10) / 10 : 0;
    const ownerReviewsCount = ownerStats.length > 0 ? ownerStats[0].totalReviews : 0;

    await User.findByIdAndUpdate(
      ownerId,
      { rating: ownerRating, reviewCount: ownerReviewsCount },
      { runValidators: false }
    );
  }

  return { propertyRating, propertyReviewsCount };
}

// @desc    Submit or update a rating & review for a property
// @route   POST /api/properties/:id/reviews or POST /api/user/properties/:id/reviews or POST /api/reviews/property
// @access  Private (Authenticated users)
exports.createPropertyReview = async (req, res, next) => {
  try {
    const propertyId =
      req.params.id ||
      req.params.propertyId ||
      req.body.propertyId ||
      req.body.property ||
      req.body.id;

    const reviewerId = req.user._id;

    const rawRating = req.body.rating;
    const comment =
      req.body.comment ||
      req.body.review ||
      req.body.message ||
      req.body.experience ||
      req.body.feedback;

    // Normalizing tags (e.g. Accurate Photos, Cleanliness, Great Location, Responsive Owner)
    const rawTags =
      req.body.tags ||
      req.body.tag ||
      req.body.aspects ||
      req.body.aspect ||
      req.body.categories;

    let tags = [];
    let tag = '';

    if (Array.isArray(rawTags)) {
      tags = rawTags.map((t) => String(t).trim()).filter(Boolean);
      tag = tags.join(', ');
    } else if (typeof rawTags === 'string' && rawTags.trim().length > 0) {
      tag = rawTags.trim();
      tags = tag.split(',').map((t) => t.trim()).filter(Boolean);
    }

    if (!propertyId || !isValidId(propertyId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid property ID.',
      });
    }

    if (rawRating === undefined || rawRating === null || !comment || !comment.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide both a star rating (1-5) and review comment.',
      });
    }

    const ratingNum = Number(rawRating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        status: 'fail',
        message: 'Rating must be a valid number between 1 and 5.',
      });
    }

    // 1. Verify property exists
    const property = await Property.findById(propertyId).populate('owner', 'name email role');
    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'Property listing not found.',
      });
    }

    const ownerId = property.owner?._id || property.owner;

    // 2. Prevent property owner from rating their own property
    if (ownerId && ownerId.toString() === reviewerId.toString()) {
      return res.status(400).json({
        status: 'fail',
        message: 'You cannot submit a rating for your own property.',
      });
    }

    const reviewerName = req.user.name || 'GharMB Verified User';
    const reviewerPhone = req.user.phone || '';
    const reviewerRole = req.user.role || 'user';

    // 3. Check for existing review (allow updating if already submitted)
    let review = await PropertyReview.findOne({
      property: property._id,
      reviewer: reviewerId,
    });

    let isUpdate = false;

    if (review) {
      isUpdate = true;
      review.rating = ratingNum;
      review.comment = comment.trim();
      review.tag = tag;
      review.tags = tags;
      review.reviewerName = reviewerName;
      review.reviewerPhone = reviewerPhone;
      review.reviewerRole = reviewerRole;
      await review.save();
    } else {
      review = await PropertyReview.create({
        property: property._id,
        owner: ownerId,
        reviewer: reviewerId,
        rating: ratingNum,
        comment: comment.trim(),
        tag,
        tags,
        reviewerName,
        reviewerPhone,
        reviewerRole,
      });
    }

    // 4. Synchronize aggregate ratings for property and owner
    const { propertyRating, propertyReviewsCount } = await syncPropertyAndOwnerRatings(
      property._id,
      ownerId
    );

    // 5. Star breakdown for the property
    const breakdownAggregate = await PropertyReview.aggregate([
      { $match: { property: property._id } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
    ]);

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    breakdownAggregate.forEach((item) => {
      const starKey = Math.round(item._id);
      if (breakdown[starKey] !== undefined) {
        breakdown[starKey] = item.count;
      }
    });

    res.status(200).json({
      status: 'success',
      message: isUpdate
        ? 'Your property review has been updated successfully.'
        : 'Thank you! Your rating and review have been submitted successfully.',
      data: {
        review,
        propertyRating,
        propertyReviewsCount,
        breakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews and ratings for a property
// @route   GET /api/properties/:id/reviews or GET /api/user/properties/:id/reviews
// @access  Public
exports.getPropertyReviews = async (req, res, next) => {
  try {
    const propertyId = req.params.id || req.params.propertyId;

    if (!propertyId || !isValidId(propertyId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid property ID.',
      });
    }

    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const property = await Property.findById(propertyId).select('title rating reviewsCount owner');
    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'Property listing not found.',
      });
    }

    const [reviews, totalReviews, breakdownAggregate] = await Promise.all([
      PropertyReview.find({ property: propertyId })
        .populate('reviewer', 'name profilePicture phone role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      PropertyReview.countDocuments({ property: propertyId }),
      PropertyReview.aggregate([
        { $match: { property: new mongoose.Types.ObjectId(propertyId) } },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let ratingSum = 0;

    breakdownAggregate.forEach((item) => {
      const star = Math.round(item._id);
      if (breakdown[star] !== undefined) {
        breakdown[star] = item.count;
      }
      ratingSum += Number(item._id) * item.count;
    });

    const averageRating = totalReviews > 0 ? Math.round((ratingSum / totalReviews) * 10) / 10 : 0;
    const totalPages = Math.ceil(totalReviews / limitNum) || 1;

    res.status(200).json({
      status: 'success',
      data: {
        averageRating,
        totalReviews,
        rating: averageRating,
        reviewsCount: totalReviews,
        breakdown,
        reviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages,
          totalReviews,
          hasMore: pageNum < totalPages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's submitted review for a property
// @route   GET /api/properties/:id/my-review or GET /api/user/properties/:id/my-review
// @access  Private (Authenticated users)
exports.getMyPropertyReview = async (req, res, next) => {
  try {
    const propertyId = req.params.id || req.params.propertyId;

    if (!propertyId || !isValidId(propertyId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid property ID.',
      });
    }

    const review = await PropertyReview.findOne({
      property: propertyId,
      reviewer: req.user._id,
    });

    res.status(200).json({
      status: 'success',
      data: {
        hasReviewed: Boolean(review),
        review: review || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a property review
// @route   DELETE /api/properties/:id/reviews/:reviewId or DELETE /api/properties/reviews/:reviewId
// @access  Private (Review author or Admin)
exports.deletePropertyReview = async (req, res, next) => {
  try {
    const reviewId = req.params.reviewId || req.params.id;

    if (!reviewId || !isValidId(reviewId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid review ID.',
      });
    }

    const review = await PropertyReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        status: 'fail',
        message: 'Review not found.',
      });
    }

    // Check ownership or admin role
    const isAuthor = review.reviewer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to delete this review.',
      });
    }

    const propertyId = review.property;
    const ownerId = review.owner;

    await PropertyReview.findByIdAndDelete(reviewId);

    // Synchronize aggregate ratings
    await syncPropertyAndOwnerRatings(propertyId, ownerId);

    res.status(200).json({
      status: 'success',
      message: 'Property review removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews received on properties owned by the authenticated owner
// @route   GET /api/users/me/ratings or GET /api/user/users/me/ratings or GET /api/properties/my-ratings
// @access  Private
exports.getMyOwnerReviews = async (req, res, next) => {
  try {
    const ownerId = req.user._id;

    const reviews = await PropertyReview.find({ owner: ownerId })
      .populate('reviewer', 'name profilePicture phone role')
      .populate('property', 'title propertyType city locality price photos submissionId')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    let sumRating = 0;
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviews.forEach((r) => {
      const star = Math.round(Number(r.rating) || 0);
      if (breakdown[star] !== undefined) {
        breakdown[star]++;
      }
      sumRating += Number(r.rating) || 0;
    });

    const averageRating = totalReviews > 0 ? Math.round((sumRating / totalReviews) * 10) / 10 : 0;

    res.status(200).json({
      status: 'success',
      data: {
        averageRating,
        totalReviews,
        rating: averageRating,
        reviewsCount: totalReviews,
        breakdown,
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get ratings and reviews received by a specific property owner by user ID (public or admin)
// @route   GET /api/users/:id/ratings or GET /api/admin/users/:id/ratings
// @access  Public / Admin
exports.getOwnerReviewsById = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (!userId || !isValidId(userId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid user ID.',
      });
    }

    const user = await User.findById(userId).select('name role rating reviewCount companyName profilePicture');
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User profile not found.',
      });
    }

    const reviews = await PropertyReview.find({ owner: userId })
      .populate('reviewer', 'name profilePicture phone role')
      .populate('property', 'title propertyType city locality price photos submissionId')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    let sumRating = 0;
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviews.forEach((r) => {
      const star = Math.round(Number(r.rating) || 0);
      if (breakdown[star] !== undefined) {
        breakdown[star]++;
      }
      sumRating += Number(r.rating) || 0;
    });

    const averageRating = totalReviews > 0 ? Math.round((sumRating / totalReviews) * 10) / 10 : 0;

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
          companyName: user.companyName,
          profilePicture: user.profilePicture,
        },
        averageRating,
        totalReviews,
        rating: averageRating,
        reviewsCount: totalReviews,
        breakdown,
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};
