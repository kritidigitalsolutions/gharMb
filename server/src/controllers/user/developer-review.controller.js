/**
 * Developer Review Controller
 * Handles submitting and retrieving buyer/tenant reviews for builders/developers.
 */

const DeveloperReview = require('../../models/developer-review.model');
const User = require('../../models/user.model');

// @desc    Submit a review for a developer/builder
// @route   POST /api/users/developers/:id/reviews
// @access  Private (Buyer/Tenant only)
exports.createDeveloperReview = async (req, res, next) => {
  try {
    const developerId = req.params.id;
    const reviewerId = req.user._id;
    const { rating, comment, tag } = req.body;

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(developerId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid developer ID format.',
      });
    }

    if (!rating || !comment) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide both rating and review comment.',
      });
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        status: 'fail',
        message: 'Rating must be a number between 1 and 5.',
      });
    }

    // 1. Verify developer exists and has 'builder' role
    const developer = await User.findOne({ _id: developerId, role: 'builder' });
    if (!developer) {
      return res.status(404).json({
        status: 'fail',
        message: 'Developer profile not found.',
      });
    }

    // 2. Prevent self-reviewing
    if (developerId.toString() === reviewerId.toString()) {
      return res.status(400).json({
        status: 'fail',
        message: 'You cannot submit a review for your own profile.',
      });
    }

    // 3. Check for existing review
    const existingReview = await DeveloperReview.findOne({
      developer: developerId,
      reviewer: reviewerId,
    });
    if (existingReview) {
      return res.status(400).json({
        status: 'fail',
        message: 'You have already submitted a review for this developer.',
      });
    }

    // 4. Create the review
    const review = await DeveloperReview.create({
      developer: developerId,
      reviewer: reviewerId,
      rating: ratingNum,
      comment,
      tag: tag || '',
    });

    // 5. Aggregate average rating & review count for the developer
    const stats = await DeveloperReview.aggregate([
      { $match: { developer: developer._id } },
      {
        $group: {
          _id: '$developer',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    let newAvgRating = ratingNum;
    let newReviewCount = 1;

    if (stats.length > 0) {
      newAvgRating = Math.round(stats[0].avgRating * 10) / 10; // Round to 1 decimal place
      newReviewCount = stats[0].totalReviews;
    }

    // 6. Update Developer's profile metrics
    developer.rating = newAvgRating;
    developer.reviewCount = newReviewCount;
    await developer.save({ validateBeforeSave: false });

    res.status(201).json({
      status: 'success',
      message: 'Review submitted successfully!',
      data: {
        review,
        developerRating: newAvgRating,
        developerReviewCount: newReviewCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews and aggregate stats for a developer
// @route   GET /api/users/developers/:id/reviews
// @access  Public
exports.getDeveloperReviews = async (req, res, next) => {
  try {
    const developerId = req.params.id;

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(developerId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid developer ID format.',
      });
    }

    // Verify developer exists
    const developer = await User.findOne({ _id: developerId, role: 'builder' });
    if (!developer) {
      return res.status(404).json({
        status: 'fail',
        message: 'Developer profile not found.',
      });
    }

    // 1. Get query options for pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 2. Fetch reviews
    const reviews = await DeveloperReview.find({ developer: developerId })
      .populate('reviewer', 'name profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 3. Aggregate reviews counts for each star (breakdown stats)
    const breakdownAggregate = await DeveloperReview.aggregate([
      { $match: { developer: developer._id } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
    ]);

    // Initialize 1-5 stars to 0 count
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    breakdownAggregate.forEach((item) => {
      if (breakdown[item._id] !== undefined) {
        breakdown[item._id] = item.count;
      }
    });

    res.status(200).json({
      status: 'success',
      results: reviews.length,
      stats: {
        averageRating: developer.rating,
        totalReviews: developer.reviewCount,
        breakdown,
      },
      data: {
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};
