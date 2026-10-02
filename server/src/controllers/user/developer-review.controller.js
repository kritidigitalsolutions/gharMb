/**
 * Developer Review Controller
 * Handles submitting, updating, and retrieving user ratings, comments, and aspects for developers/builders.
 */

const mongoose = require('mongoose');
const DeveloperReview = require('../../models/developer-review.model');
const User = require('../../models/user.model');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Submit or update a review for a developer/builder
// @route   POST /api/developers/:id/reviews or POST /api/user/developers/:id/reviews or POST /api/reviews
// @access  Private (All authenticated users)
exports.createDeveloperReview = async (req, res, next) => {
  try {
    const developerId =
      req.params.id ||
      req.params.developerId ||
      req.body.developerId ||
      req.body.developer ||
      req.body.id;

    const reviewerId = req.user._id;

    const rawRating = req.body.rating;
    const comment =
      req.body.comment ||
      req.body.review ||
      req.body.message ||
      req.body.experience ||
      req.body.feedback ||
      req.body.description;

    // Normalizing rating aspects / tags (e.g. Quality, Timely Delivery, Support, Value for Money)
    const rawTags =
      req.body.tags ||
      req.body.tag ||
      req.body.aspects ||
      req.body.aspect ||
      req.body.categories ||
      req.body.whatAreYouRating;

    let tags = [];
    let tag = '';

    if (Array.isArray(rawTags)) {
      tags = rawTags.map((t) => String(t).trim()).filter(Boolean);
      tag = tags.join(', ');
    } else if (typeof rawTags === 'string' && rawTags.trim().length > 0) {
      tag = rawTags.trim();
      tags = tag.split(',').map((t) => t.trim()).filter(Boolean);
    }

    if (!developerId || !isValidId(developerId)) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'Please provide a valid developer ID.',
      });
    }

    if (rawRating === undefined || rawRating === null || !comment) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'Please provide both rating (1-5) and review comment.',
      });
    }

    const ratingNum = Number(rawRating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'Rating must be a number between 1 and 5.',
      });
    }

    // 1. Verify developer exists
    let developer = await User.findById(developerId);
    if (!developer) {
      return res.status(404).json({
        status: 'fail',
        success: false,
        message: 'Developer profile not found.',
      });
    }

    // 2. Prevent self-reviewing
    if (developerId.toString() === reviewerId.toString()) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'You cannot submit a review for your own profile.',
      });
    }

    // 3. Check for existing review (Allow update if already submitted)
    let review = await DeveloperReview.findOne({
      developer: developerId,
      reviewer: reviewerId,
    });

    let isUpdate = false;

    if (review) {
      isUpdate = true;
      review.rating = ratingNum;
      review.comment = comment.trim();
      review.tag = tag;
      review.tags = tags;
      await review.save();
    } else {
      review = await DeveloperReview.create({
        developer: developerId,
        reviewer: reviewerId,
        rating: ratingNum,
        comment: comment.trim(),
        tag,
        tags,
      });
    }

    // 4. Aggregate average rating & review count for the developer
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

    // 5. Update Developer's profile metrics
    developer.rating = newAvgRating;
    developer.reviewCount = newReviewCount;
    await developer.save({ validateBeforeSave: false });

    // 6. Aggregate star breakdown (for buyer reviews chart)
    const breakdownAggregate = await DeveloperReview.aggregate([
      { $match: { developer: developer._id } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
    ]);

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    breakdownAggregate.forEach((item) => {
      const roundedRating = Math.round(item._id);
      if (breakdown[roundedRating] !== undefined) {
        breakdown[roundedRating] += item.count;
      }
    });

    // Populate reviewer info
    const populatedReview = await DeveloperReview.findById(review._id).populate(
      'reviewer',
      'name profilePicture'
    );

    res.status(isUpdate ? 200 : 201).json({
      status: 'success',
      success: true,
      message: isUpdate
        ? 'Your review has been updated successfully!'
        : 'Review submitted successfully!',
      data: {
        review: populatedReview,
        developerRating: newAvgRating,
        developerReviewCount: newReviewCount,
        stats: {
          averageRating: newAvgRating,
          totalReviews: newReviewCount,
          breakdown,
        },
      },
      review: populatedReview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews and aggregate stats for a developer
// @route   GET /api/developers/:id/reviews or GET /api/user/developers/:id/reviews
// @access  Public
exports.getDeveloperReviews = async (req, res, next) => {
  try {
    const developerId = req.params.id || req.params.developerId;

    if (!developerId || !isValidId(developerId)) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'Invalid developer ID format.',
      });
    }

    const developer = await User.findById(developerId);
    if (!developer) {
      return res.status(404).json({
        status: 'fail',
        success: false,
        message: 'Developer profile not found.',
      });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const totalReviews = await DeveloperReview.countDocuments({ developer: developerId });

    const reviews = await DeveloperReview.find({ developer: developerId })
      .populate('reviewer', 'name profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Aggregate breakdown for ratings (1-5 stars)
    const breakdownAggregate = await DeveloperReview.aggregate([
      { $match: { developer: developer._id } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
    ]);

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    breakdownAggregate.forEach((item) => {
      const roundedRating = Math.round(item._id);
      if (breakdown[roundedRating] !== undefined) {
        breakdown[roundedRating] += item.count;
      }
    });

    const averageRating = developer.rating !== undefined ? developer.rating : 4.5;
    const reviewCount = developer.reviewCount !== undefined ? developer.reviewCount : totalReviews;

    const stats = {
      averageRating,
      totalReviews: reviewCount,
      breakdown,
    };

    res.status(200).json({
      status: 'success',
      success: true,
      results: reviews.length,
      count: reviews.length,
      total: totalReviews,
      stats,
      data: {
        reviews,
        stats,
      },
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's review for a developer (if already reviewed)
// @route   GET /api/developers/:id/my-review
// @access  Private (All authenticated users)
exports.getMyDeveloperReview = async (req, res, next) => {
  try {
    const developerId = req.params.id || req.params.developerId;

    if (!developerId || !isValidId(developerId)) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'Invalid developer ID format.',
      });
    }

    const review = await DeveloperReview.findOne({
      developer: developerId,
      reviewer: req.user._id,
    }).populate('reviewer', 'name profilePicture');

    res.status(200).json({
      status: 'success',
      success: true,
      hasReviewed: !!review,
      data: {
        review: review || null,
        hasReviewed: !!review,
      },
      review: review || null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a review
// @route   DELETE /api/developers/:id/reviews or DELETE /api/reviews/:reviewId
// @access  Private
exports.deleteDeveloperReview = async (req, res, next) => {
  try {
    const developerId = req.params.id || req.params.developerId;
    const reviewId = req.params.reviewId;

    let query = { reviewer: req.user._id };
    if (reviewId && isValidId(reviewId)) {
      query._id = reviewId;
    } else if (developerId && isValidId(developerId)) {
      query.developer = developerId;
    } else {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'Please provide valid review ID or developer ID.',
      });
    }

    const review = await DeveloperReview.findOne(query);
    if (!review) {
      return res.status(404).json({
        status: 'fail',
        success: false,
        message: 'Review not found or not authored by you.',
      });
    }

    const devId = review.developer;
    await DeveloperReview.findByIdAndDelete(review._id);

    // Recalculate stats for the developer
    const stats = await DeveloperReview.aggregate([
      { $match: { developer: devId } },
      {
        $group: {
          _id: '$developer',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const newAvgRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
    const newReviewCount = stats.length > 0 ? stats[0].totalReviews : 0;

    await User.findByIdAndUpdate(devId, {
      rating: newAvgRating,
      reviewCount: newReviewCount,
    });

    res.status(200).json({
      status: 'success',
      success: true,
      message: 'Review deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
