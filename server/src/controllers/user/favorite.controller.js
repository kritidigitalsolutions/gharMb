/**
 * App Favorite Controller
 * Handles toggling listing bookmarks and fetching a user's bookmarked feed.
 */

const Favorite = require('../../models/favorite.model');
const Property = require('../../models/property.model');

// @desc    Toggle property favorite bookmark (add or remove)
// @route   POST /api/user/favorites/toggle
// @access  Private (Buyer/Tenant only)
exports.toggleFavorite = async (req, res, next) => {
  try {
    const { propertyId } = req.body;

    const property = await Property.findById(propertyId);
    if (!property || property.status !== 'approved') {
      return res.status(404).json({
        status: 'fail',
        message: 'Property listing not found or unavailable.',
      });
    }

    const existingFavorite = await Favorite.findOne({
      user: req.user._id,
      property: propertyId,
    });

    if (existingFavorite) {
      // Already favorited, so remove it (toggle off)
      await Favorite.findByIdAndDelete(existingFavorite._id);
      return res.status(200).json({
        status: 'success',
        isFavorited: false,
        message: 'Property removed from favorites.',
      });
    } else {
      // Not favorited, so create it (toggle on)
      const favorite = await Favorite.create({
        user: req.user._id,
        property: propertyId,
      });
      return res.status(201).json({
        status: 'success',
        isFavorited: true,
        data: {
          favorite,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookmarked properties feed
// @route   GET /api/user/favorites
// @access  Private (Buyer/Tenant only)
exports.getMyFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .populate({
        path: 'property',
        match: { status: 'approved' }, // Ensure we only load active approved listings
        populate: {
          path: 'owner',
          select: 'name profilePicture isVerified',
        },
      })
      .sort({ createdAt: -1 });

    // Filter out null property entries (in case any favorited property was deleted or status revoked)
    const filteredFavorites = favorites.filter((fav) => fav.property !== null);

    res.status(200).json({
      status: 'success',
      results: filteredFavorites.length,
      data: {
        favorites: filteredFavorites,
      },
    });
  } catch (error) {
    next(error);
  }
};
