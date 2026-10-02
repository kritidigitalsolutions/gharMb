/**
 * App Favorite / Wishlist Controller
 * Comprehensive controller for managing user saved properties & projects.
 * Supports toggle, listing, add, remove, status check, and ID lookup.
 */

const mongoose = require('mongoose');
const Favorite = require('../../models/favorite.model');
const Property = require('../../models/property.model');
const Project = require('../../models/project.model');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Get user's bookmarked properties & projects (Wishlist feed)
// @route   GET /api/wishlist or GET /api/favorites
// @access  Private (All authenticated users)
exports.getMyFavorites = async (req, res, next) => {
  try {
    const { type, page, limit } = req.query;

    const query = { user: req.user._id };
    if (type === 'property' || type === 'properties') {
      query.itemType = 'Property';
    } else if (type === 'project' || type === 'projects') {
      query.itemType = 'Project';
    }

    let favQuery = Favorite.find(query)
      .populate({
        path: 'property',
        populate: {
          path: 'owner',
          select: 'name email phone profilePicture isVerified companyName role',
        },
      })
      .populate({
        path: 'project',
        populate: {
          path: 'developer',
          select: 'name email phone profilePicture isVerified companyName role',
        },
      })
      .sort({ createdAt: -1 });

    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 20;
      const skip = (pageNum - 1) * limitNum;
      favQuery = favQuery.skip(skip).limit(limitNum);
    }

    const favorites = await favQuery.exec();

    // Filter out items where the referenced listing was hard-deleted from DB
    const filteredFavorites = favorites.filter(
      (fav) => fav.property !== null && fav.property !== undefined || fav.project !== null && fav.project !== undefined
    );

    // Format formatted wishlist items
    const formattedWishlist = filteredFavorites.map((fav) => {
      const itemObj = fav.toObject ? fav.toObject() : { ...fav };
      return {
        ...itemObj,
        isFavorited: true,
        isWishlisted: true,
        propertyId: itemObj.property?._id || null,
        projectId: itemObj.project?._id || null,
      };
    });

    // Format properties list (for Flutter models binding directly to Property list)
    const propertiesList = filteredFavorites
      .filter((fav) => fav.property)
      .map((fav) => {
        const prop = fav.property.toObject ? fav.property.toObject() : { ...fav.property };
        return {
          ...prop,
          favoriteId: fav._id,
          wishlistId: fav._id,
          isFavorited: true,
          isWishlisted: true,
        };
      });

    // Format projects list
    const projectsList = filteredFavorites
      .filter((fav) => fav.project)
      .map((fav) => {
        const proj = fav.project.toObject ? fav.project.toObject() : { ...fav.project };
        return {
          ...proj,
          favoriteId: fav._id,
          wishlistId: fav._id,
          isFavorited: true,
          isWishlisted: true,
        };
      });

    res.status(200).json({
      status: 'success',
      success: true,
      message: 'Wishlist retrieved successfully.',
      count: filteredFavorites.length,
      total: filteredFavorites.length,
      results: filteredFavorites.length,
      data: {
        wishlist: formattedWishlist,
        favorites: formattedWishlist,
        items: formattedWishlist,
        properties: propertiesList,
        projects: projectsList,
      },
      // Root-level convenience helpers for mobile frameworks
      wishlist: formattedWishlist,
      favorites: formattedWishlist,
      properties: propertiesList,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle property or project in wishlist (Add if not present, Remove if present)
// @route   POST /api/wishlist/toggle or POST /api/favorites/toggle
// @access  Private (All authenticated users)
exports.toggleFavorite = async (req, res, next) => {
  try {
    const propertyId = req.body.propertyId || req.body.property || (!req.body.projectId && req.body.id);
    const projectId = req.body.projectId || req.body.project;

    if (!propertyId && !projectId) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'Please provide propertyId or projectId to toggle wishlist item.',
      });
    }

    if (propertyId) {
      if (!isValidId(propertyId)) {
        return res.status(400).json({
          status: 'fail',
          success: false,
          message: 'Invalid property ID format.',
        });
      }

      const property = await Property.findById(propertyId);
      if (!property) {
        return res.status(404).json({
          status: 'fail',
          success: false,
          message: 'Property listing not found or unavailable.',
        });
      }

      const existingFavorite = await Favorite.findOne({
        user: req.user._id,
        property: propertyId,
      });

      if (existingFavorite) {
        // Already wishlisted: Remove (toggle off)
        await Favorite.findByIdAndDelete(existingFavorite._id);

        // Decrement shortlistedCount on property
        await Property.findByIdAndUpdate(propertyId, {
          $inc: { shortlistedCount: -1 },
        }).catch(() => {});

        return res.status(200).json({
          status: 'success',
          success: true,
          isFavorited: false,
          isWishlisted: false,
          message: 'Property removed from wishlist.',
          data: null,
        });
      } else {
        // Not wishlisted: Create (toggle on)
        const favorite = await Favorite.create({
          user: req.user._id,
          property: propertyId,
          itemType: 'Property',
        });

        // Increment shortlistedCount on property
        await Property.findByIdAndUpdate(propertyId, {
          $inc: { shortlistedCount: 1 },
        }).catch(() => {});

        return res.status(201).json({
          status: 'success',
          success: true,
          isFavorited: true,
          isWishlisted: true,
          message: 'Property added to wishlist.',
          data: {
            favorite,
            wishlist: favorite,
          },
        });
      }
    }

    if (projectId) {
      if (!isValidId(projectId)) {
        return res.status(400).json({
          status: 'fail',
          success: false,
          message: 'Invalid project ID format.',
        });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          status: 'fail',
          success: false,
          message: 'Project not found or unavailable.',
        });
      }

      const existingFavorite = await Favorite.findOne({
        user: req.user._id,
        project: projectId,
      });

      if (existingFavorite) {
        await Favorite.findByIdAndDelete(existingFavorite._id);

        return res.status(200).json({
          status: 'success',
          success: true,
          isFavorited: false,
          isWishlisted: false,
          message: 'Project removed from wishlist.',
          data: null,
        });
      } else {
        const favorite = await Favorite.create({
          user: req.user._id,
          project: projectId,
          itemType: 'Project',
        });

        return res.status(201).json({
          status: 'success',
          success: true,
          isFavorited: true,
          isWishlisted: true,
          message: 'Project added to wishlist.',
          data: {
            favorite,
            wishlist: favorite,
          },
        });
      }
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Explicitly add item to wishlist (REST POST)
// @route   POST /api/wishlist or POST /api/favorites
// @access  Private (All authenticated users)
exports.addToFavorites = async (req, res, next) => {
  try {
    const propertyId = req.body.propertyId || req.body.property || (!req.body.projectId && req.body.id);
    const projectId = req.body.projectId || req.body.project;

    if (!propertyId && !projectId) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'Please provide propertyId or projectId.',
      });
    }

    if (propertyId) {
      if (!isValidId(propertyId)) {
        return res.status(400).json({
          status: 'fail',
          success: false,
          message: 'Invalid property ID format.',
        });
      }

      const property = await Property.findById(propertyId);
      if (!property) {
        return res.status(404).json({
          status: 'fail',
          success: false,
          message: 'Property listing not found.',
        });
      }

      const existingFavorite = await Favorite.findOne({
        user: req.user._id,
        property: propertyId,
      });

      if (existingFavorite) {
        return res.status(200).json({
          status: 'success',
          success: true,
          isFavorited: true,
          isWishlisted: true,
          message: 'Property is already in your wishlist.',
          data: {
            favorite: existingFavorite,
            wishlist: existingFavorite,
          },
        });
      }

      const favorite = await Favorite.create({
        user: req.user._id,
        property: propertyId,
        itemType: 'Property',
      });

      await Property.findByIdAndUpdate(propertyId, {
        $inc: { shortlistedCount: 1 },
      }).catch(() => {});

      return res.status(201).json({
        status: 'success',
        success: true,
        isFavorited: true,
        isWishlisted: true,
        message: 'Property added to wishlist.',
        data: {
          favorite,
          wishlist: favorite,
        },
      });
    }

    if (projectId) {
      if (!isValidId(projectId)) {
        return res.status(400).json({
          status: 'fail',
          success: false,
          message: 'Invalid project ID format.',
        });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          status: 'fail',
          success: false,
          message: 'Project not found.',
        });
      }

      const existingFavorite = await Favorite.findOne({
        user: req.user._id,
        project: projectId,
      });

      if (existingFavorite) {
        return res.status(200).json({
          status: 'success',
          success: true,
          isFavorited: true,
          isWishlisted: true,
          message: 'Project is already in your wishlist.',
          data: {
            favorite: existingFavorite,
            wishlist: existingFavorite,
          },
        });
      }

      const favorite = await Favorite.create({
        user: req.user._id,
        project: projectId,
        itemType: 'Project',
      });

      return res.status(201).json({
        status: 'success',
        success: true,
        isFavorited: true,
        isWishlisted: true,
        message: 'Project added to wishlist.',
        data: {
          favorite,
          wishlist: favorite,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Remove an item from wishlist (Supports removing by Favorite ID, Property ID, or Project ID)
// @route   DELETE /api/wishlist/:id or DELETE /api/favorites/:id
// @access  Private (All authenticated users)
exports.removeFavorite = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'Invalid ID format provided.',
      });
    }

    // Match by favorite _id OR by referenced property OR by referenced project
    const favorite = await Favorite.findOne({
      user: req.user._id,
      $or: [
        { _id: id },
        { property: id },
        { project: id },
      ],
    });

    if (!favorite) {
      return res.status(404).json({
        status: 'fail',
        success: false,
        message: 'Wishlist item not found.',
      });
    }

    if (favorite.property) {
      await Property.findByIdAndUpdate(favorite.property, {
        $inc: { shortlistedCount: -1 },
      }).catch(() => {});
    }

    await Favorite.findByIdAndDelete(favorite._id);

    res.status(200).json({
      status: 'success',
      success: true,
      isFavorited: false,
      isWishlisted: false,
      message: 'Item removed from wishlist successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check whether a property or project is in the user's wishlist
// @route   GET /api/wishlist/check/:id or GET /api/favorites/check/:id
// @access  Private (All authenticated users)
exports.checkFavorite = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'Invalid ID format provided.',
      });
    }

    const favorite = await Favorite.findOne({
      user: req.user._id,
      $or: [
        { property: id },
        { project: id },
        { _id: id },
      ],
    });

    const isSaved = !!favorite;

    res.status(200).json({
      status: 'success',
      success: true,
      isFavorited: isSaved,
      isWishlisted: isSaved,
      data: {
        isFavorited: isSaved,
        isWishlisted: isSaved,
        favoriteId: favorite?._id || null,
        wishlistId: favorite?._id || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get quick list of wishlisted IDs (for instant UI state resolution on feeds)
// @route   GET /api/wishlist/ids or GET /api/favorites/ids
// @access  Private (All authenticated users)
exports.getFavoriteIds = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id }).select('property project itemType');

    const propertyIds = favorites
      .filter((f) => f.property)
      .map((f) => f.property.toString());

    const projectIds = favorites
      .filter((f) => f.project)
      .map((f) => f.project.toString());

    const allIds = [...propertyIds, ...projectIds];

    res.status(200).json({
      status: 'success',
      success: true,
      count: allIds.length,
      propertyIds,
      projectIds,
      ids: allIds,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all items in user's wishlist
// @route   DELETE /api/wishlist/clear or DELETE /api/favorites/clear
// @access  Private (All authenticated users)
exports.clearFavorites = async (req, res, next) => {
  try {
    const result = await Favorite.deleteMany({ user: req.user._id });

    res.status(200).json({
      status: 'success',
      success: true,
      message: 'Wishlist cleared successfully.',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

// Aliases for seamless naming symmetry
exports.getMyWishlist = exports.getMyFavorites;
exports.toggleWishlist = exports.toggleFavorite;
exports.addToWishlist = exports.addToFavorites;
exports.removeFromWishlist = exports.removeFavorite;
exports.checkWishlist = exports.checkFavorite;
exports.getWishlistIds = exports.getFavoriteIds;
exports.clearWishlist = exports.clearFavorites;
