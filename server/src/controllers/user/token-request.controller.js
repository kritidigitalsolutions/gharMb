/**
 * Token Request Controller
 * Handles token booking workflows for real estate properties:
 * - Buyers can submit 5-step token booking requests (personal, family, occupation, ID proof, token amount)
 * - Returns dynamic token booking configuration set by administrators
 * - Owners / Builders / Agents can view received token requests, accept, or reject them
 * - Updates property counters and triggers in-app notifications
 */

const mongoose = require('mongoose');
const TokenRequest = require('../../models/token-request.model');
const Property = require('../../models/property.model');
const Notification = require('../../models/notification.model');
const TokenSetting = require('../../models/token-setting.model');
const User = require('../../models/user.model');
const { notifyAdmin } = require('../../utils/adminNotification.helper');

// Helper for pagination
const getPagination = (page, limit, defaultLimit = 10) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || defaultLimit);
  const skip = (pageNum - 1) * limitNum;
  return { page: pageNum, limit: limitNum, skip };
};

// @desc    Get Token Booking Configuration (Amounts configured by Admin)
// @route   GET /api/token-requests/config OR GET /api/user/token-requests/config OR GET /api/properties/:id/token-config
// @access  Public / Private
exports.getTokenConfig = async (req, res, next) => {
  try {
    const propertyId = req.query.propertyId || req.params.id || req.params.propertyId || req.body?.propertyId;
    const globalSettings = await TokenSetting.getSettings();

    // Base configuration from Admin Token Settings
    const dynamicAmounts = Array.isArray(globalSettings.tokenAmounts) && globalSettings.tokenAmounts.length > 0
      ? globalSettings.tokenAmounts
      : [200, 2000, 5000, 7000];

    const defAmount = globalSettings.defaultTokenAmount && dynamicAmounts.includes(globalSettings.defaultTokenAmount)
      ? globalSettings.defaultTokenAmount
      : dynamicAmounts[0];

    let config = {
      tokenAmounts: dynamicAmounts,
      defaultTokenAmount: defAmount,
      minTokenAmount: globalSettings.minTokenAmount || 1000,
      maxTokenAmount: globalSettings.maxTokenAmount || 100000,
      allowCustomAmount: globalSettings.allowCustomAmount || false,
      adjustmentNote: globalSettings.adjustmentNote || "Token amount will be adjusted in security deposit or first month's rent",
      allowTokenBooking: true,
      validityDays: globalSettings.validityDays || 7,
      isRentOnly: true,
      property: null,
    };

    if (propertyId && mongoose.Types.ObjectId.isValid(propertyId)) {
      const property = await Property.findById(propertyId)
        .populate('owner', 'name phone email companyName role profilePicture isVerified address');

      if (property) {
        const coverImg = Array.isArray(property.images) && property.images.length > 0 ? property.images[0] : '';
        const propImages = Array.isArray(property.images) && property.images.length > 0 ? property.images : (coverImg ? [coverImg] : []);

        const isRental = property.listingFor === 'Rent' || property.listingFor === 'Lease' || property.listingFor === 'PG';

        config.property = {
          _id: property._id,
          id: property._id,
          title: property.title,
          price: property.price,
          priceDisplay: property.price ? `₹${property.price.toLocaleString('en-IN')}` : 'Price on Request',
          monthlyRent: isRental ? property.price : null,
          category: property.category || 'Residential',
          listingFor: property.listingFor || 'Sale',
          isRental,
          propertyType: property.propertyType || 'Apartment',
          city: property.city || '',
          locality: property.locality || '',
          fullAddress: property.fullAddress || `${property.locality || ''}, ${property.city || ''}`,
          address: property.fullAddress || `${property.locality || ''}, ${property.city || ''}`,
          pincode: property.pincode || '',
          bedrooms: property.bedrooms || '2',
          bhk: property.bedrooms ? `${property.bedrooms} BHK` : '2 BHK',
          bathrooms: property.bathrooms || '2',
          carpetArea: property.carpetArea || 0,
          builtUpArea: property.builtUpArea || property.carpetArea || 0,
          area: property.builtUpArea || property.carpetArea || 0,
          floorNo: property.floorNo || '',
          totalFloors: property.totalFloors || '',
          furnishing: property.furnishing || 'Semi-furnished',
          facingDirection: property.facingDirection || '',
          parking: property.parking || '',
          amenities: Array.isArray(property.amenities) ? property.amenities : [],
          availableFrom: property.availableFrom || 'Immediate',
          possession: property.availableFrom || 'Immediate',
          images: propImages,
          photos: propImages,
          coverImage: coverImg,
          image: coverImg,
          description: property.description || '',
          submissionId: property.submissionId || '',
          listingTier: property.listingTier || 'Standard',
          securityDeposit: property.securityDeposit || 0,
          allowInstallments: Boolean(property.allowInstallments),
          installmentDetails: property.installmentDetails || null,
          allowTokenBooking: isRental && property.allowTokenBooking !== false,
          owner: property.owner ? {
            _id: property.owner._id,
            id: property.owner._id,
            name: property.owner.name || 'Owner',
            phone: property.owner.phone || '',
            email: property.owner.email || '',
            companyName: property.owner.companyName || '',
            role: property.owner.role || 'owner',
            profilePicture: property.owner.profilePicture || '',
            isVerified: Boolean(property.owner.isVerified),
          } : null,
        };

        // Token amount is strictly available for rental properties only
        if (!isRental) {
          config.allowTokenBooking = true; // Same API supports booking for both rent and non-rent
          config.isTokenApplicable = false;
          config.isRental = false;
          config.defaultTokenAmount = 0;
          config.tokenAmounts = [];
          config.rentNotice = 'Booking is available without token amount. GharMB Admin will coordinate with you directly.';
        } else {
          config.allowTokenBooking = property.allowTokenBooking !== false;
          config.isTokenApplicable = true;
          config.isRental = true;
        }

        // If property has specific custom token amounts configured by admin/owner
        if (isRental && Array.isArray(property.tokenAmounts) && property.tokenAmounts.length > 0) {
          config.tokenAmounts = property.tokenAmounts;
        }

        if (isRental && property.tokenAmount && !isNaN(Number(property.tokenAmount))) {
          config.defaultTokenAmount = Number(property.tokenAmount);
        }

        if (property.tokenAdjustmentNote && property.tokenAdjustmentNote.trim()) {
          config.adjustmentNote = property.tokenAdjustmentNote.trim();
        }

        const currentUserId = req.user?._id?.toString() || req.query.userId || req.query.currentUserId;
        const isCurrentOwner = Boolean(
          property.owner &&
          currentUserId &&
          (property.owner._id ? property.owner._id.toString() : property.owner.toString()) === currentUserId
        );
        config.isOwner = isCurrentOwner;
        if (isCurrentOwner) {
          config.canBook = false;
          config.bookingDisabledReason = 'You are the owner of this property listing. Self-booking is not allowed.';
        }
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Token booking configuration retrieved successfully.',
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a new Token Booking Request for a property (1-Click or Guided Rental Workflow)
// @route   POST /api/user/token-requests OR POST /api/properties/:id/token-request
// @access  Public / Private (Authenticated user or Guest with contact info)
exports.createTokenRequest = async (req, res, next) => {
  try {
    const propertyId = req.params.id || req.body.property || req.body.propertyId;
    const {
      tokenAmount,
      message,
      paymentPlanType,
      installmentPlan,
      personalDetails,
      familyDetails,
      occupationDetails,
      idProof,
      monthlyRent,
      totalAgreedPrice,
      requestSource,
    } = req.body;

    if (!propertyId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Property ID is required to submit a token request.',
      });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'Property not found.',
      });
    }

    // Determine whether property is rental or sale/non-rental
    const isRental = property.listingFor === 'Rent' || property.listingFor === 'Lease' || property.listingFor === 'PG';

    // Owner cannot send token request to their own property
    const isOwner = property.owner && req.user && property.owner.toString() === req.user._id.toString();
    if (isOwner) {
      return res.status(400).json({
        status: 'fail',
        message: 'You cannot submit a booking or token request for your own property listing.',
      });
    }

    const applicantUserId = req.user?._id?.toString() || req.body.userId || req.body.buyerId;
    if (property.owner && applicantUserId && property.owner.toString() === applicantUserId.toString()) {
      return res.status(400).json({
        status: 'fail',
        message: 'You cannot submit a booking or token request for your own property listing.',
      });
    }

    // Check if bookings are allowed for this property
    if (property.allowTokenBooking === false) {
      return res.status(400).json({
        status: 'fail',
        message: 'Booking is temporarily unavailable for this property listing.',
      });
    }

    // Retrieve global settings for defaults
    const globalSettings = await TokenSetting.getSettings();

    // Determine token amount:
    // If rental: use passed tokenAmount or default from property/global settings
    // If NOT rental (Sale / non-rent): Token amount is NOT passed / not applicable (0)
    let numericAmount = 0;
    if (isRental) {
      numericAmount = Number(tokenAmount);
      if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
        numericAmount = property.tokenAmount || globalSettings.defaultTokenAmount || 2000;
      }
    } else {
      // Non-rental property (Sale): Token amount is not passed / 0 token
      numericAmount = 0;
    }

    // 1-Click contact details parsing (extracts from body, personalDetails object, or logged-in user)
    const parsedPersonal = typeof personalDetails === 'string' ? JSON.parse(personalDetails || '{}') : (personalDetails || {});

    const clientName = (
      req.body.name ||
      req.body.fullName ||
      req.body.clientName ||
      parsedPersonal.fullName ||
      parsedPersonal.name ||
      req.user?.name ||
      ''
    ).trim();

    const clientPhone = (
      req.body.phone ||
      req.body.contactNumber ||
      req.body.mobileNumber ||
      parsedPersonal.mobileNumber ||
      parsedPersonal.phone ||
      req.user?.phone ||
      ''
    ).trim();

    const clientEmail = (
      req.body.email ||
      parsedPersonal.email ||
      req.user?.email ||
      ''
    ).trim();

    // Cross-check: Ensure applicant contact info does not match the property owner
    if (property.owner) {
      const ownerUser = await User.findById(property.owner).select('phone email');
      if (ownerUser) {
        const ownerPhone = (ownerUser.phone || '').trim();
        const ownerEmail = (ownerUser.email || '').trim().toLowerCase();

        const inputPhone = (clientPhone || '').trim();
        const inputEmail = (clientEmail || '').trim().toLowerCase();

        if (
          (inputPhone && ownerPhone && inputPhone === ownerPhone) ||
          (inputEmail && ownerEmail && inputEmail === ownerEmail)
        ) {
          return res.status(400).json({
            status: 'fail',
            message: 'You cannot submit a booking or token request for your own property listing.',
          });
        }
      }
    }

    const clientCity = (
      req.body.currentCity ||
      req.body.city ||
      parsedPersonal.currentCity ||
      parsedPersonal.city ||
      req.user?.address?.city ||
      ''
    ).trim();

    if (!clientPhone) {
      return res.status(400).json({
        status: 'fail',
        message: 'A contact phone number is required so our admin team can reach you regarding the token amount.',
      });
    }

    const finalPersonalDetails = {
      fullName: clientName || 'Prospective Tenant',
      mobileNumber: clientPhone,
      email: clientEmail,
      currentCity: clientCity,
    };

    const finalClientDetails = {
      name: clientName || 'Prospective Tenant',
      phone: clientPhone,
      email: clientEmail,
      currentCity: clientCity,
    };

    // Family Details (Optional - default to single member for 1-click)
    const parsedFamily = typeof familyDetails === 'string' ? JSON.parse(familyDetails || '{}') : (familyDetails || {});
    const finalFamilyDetails = {
      numberOfFamilyMembers: String(parsedFamily.numberOfFamilyMembers || parsedFamily.members || '1'),
      adults: String(parsedFamily.adults || '1'),
      children: String(parsedFamily.children || '0'),
      maritalStatus: String(parsedFamily.maritalStatus || 'Single'),
    };

    // Occupation Details (Optional)
    const parsedOccupation = typeof occupationDetails === 'string' ? JSON.parse(occupationDetails || '{}') : (occupationDetails || {});
    const finalOccupationDetails = {
      profession: String(parsedOccupation.profession || 'Professional'),
      companyName: String(parsedOccupation.companyName || parsedOccupation.company || ''),
      monthlyIncome: String(parsedOccupation.monthlyIncome || parsedOccupation.income || ''),
    };

    // ID Proof Details (Optional - handles file upload if passed in multipart form)
    const parsedIdProof = typeof idProof === 'string' ? JSON.parse(idProof || '{}') : (idProof || {});
    let idProofDocUrl = parsedIdProof.documentUrl || '';
    let idProofOrigName = parsedIdProof.documentOriginalName || '';

    if (req.file) {
      idProofDocUrl = `/uploads/${req.file.filename}`;
      idProofOrigName = req.file.originalname;
    } else if (req.files && req.files.length > 0) {
      idProofDocUrl = `/uploads/${req.files[0].filename}`;
      idProofOrigName = req.files[0].originalname;
    }

    const finalIdProof = {
      idProofType: parsedIdProof.idProofType || 'Aadhaar',
      documentUrl: idProofDocUrl,
      documentOriginalName: idProofOrigName,
    };

    const selectedPlan = (paymentPlanType || 'full_payment').toLowerCase();
    const defaultAdj = isRental
      ? (property.tokenAdjustmentNote || globalSettings.adjustmentNote || "Token amount will be adjusted in security deposit or first month's rent")
      : 'Direct property booking request with zero token amount. Handled directly by GharMB Admin.';
    const finalAdjustmentNote = property.tokenAdjustmentNote || defaultAdj;
    const detectedSource = requestSource || (idProofDocUrl || occupationDetails ? 'form' : 'one_click');

    // Check if client already has a pending token request for this property
    const existingFilter = {
      property: propertyId,
      status: { $in: ['pending', 'contacted'] },
    };
    if (req.user?._id) {
      existingFilter.client = req.user._id;
    } else {
      existingFilter['clientDetails.phone'] = clientPhone;
    }

    const existingPending = await TokenRequest.findOne(existingFilter);

    if (existingPending) {
      // Update existing pending request gracefully so user can revise or re-click
      existingPending.tokenAmount = numericAmount;
      existingPending.isTokenApplicable = isRental;
      existingPending.isRental = isRental;
      existingPending.personalDetails = finalPersonalDetails;
      existingPending.clientDetails = finalClientDetails;
      existingPending.familyDetails = finalFamilyDetails;
      existingPending.occupationDetails = finalOccupationDetails;
      if (idProofDocUrl) existingPending.idProof = finalIdProof;
      existingPending.monthlyRent = isRental ? (Number(monthlyRent) || property.price || 0) : 0;
      existingPending.totalAgreedPrice = totalAgreedPrice || (property.price ? `₹${property.price.toLocaleString('en-IN')}${isRental ? '/mo' : ''}` : '');
      existingPending.adjustmentNote = finalAdjustmentNote;
      existingPending.message = message || existingPending.message || (isRental ? '1-Click Token Request for Rental Site' : 'Booking Request for Property (No Token Amount)');
      existingPending.requestSource = detectedSource;
      existingPending.handledByAdmin = true;
      existingPending.expiresAt = new Date(Date.now() + (globalSettings.validityDays || 7) * 24 * 60 * 60 * 1000);
      await existingPending.save();

      const populatedToken = await TokenRequest.findById(existingPending._id)
        .populate('property', 'title locality city price listingFor category images photos submissionId')
        .populate('owner', 'name phone email companyName');

      return res.status(200).json({
        status: 'success',
        message: isRental
          ? 'Token amount request updated! GharMB Admin has received your request and will contact you directly out of the app via Call/WhatsApp.'
          : 'Property booking request updated! GharMB Admin has received your request and will contact you directly out of the app via Call/WhatsApp.',
        data: {
          tokenRequest: populatedToken,
        },
      });
    }

    const tokenRequest = await TokenRequest.create({
      property: propertyId,
      client: req.user?._id || undefined,
      owner: property.owner,
      personalDetails: finalPersonalDetails,
      clientDetails: finalClientDetails,
      familyDetails: finalFamilyDetails,
      occupationDetails: finalOccupationDetails,
      idProof: finalIdProof,
      monthlyRent: isRental ? (Number(monthlyRent) || property.price || 0) : 0,
      totalAgreedPrice: totalAgreedPrice || (property.price ? `₹${property.price.toLocaleString('en-IN')}${isRental ? '/mo' : ''}` : (isRental ? '₹25,000/mo' : '₹50,00,000')),
      tokenAmount: numericAmount,
      isTokenApplicable: isRental,
      isRental: isRental,
      adjustmentNote: finalAdjustmentNote,
      paymentPlanType: selectedPlan,
      message: message || (isRental ? '1-Click Token Amount Request (Rental Site)' : 'Property Booking Request (Sale Property - No Token Amount)'),
      requestSource: detectedSource,
      handledByAdmin: true,
      outOfAppStatus: 'pending_contact',
      status: 'pending',
      expiresAt: new Date(Date.now() + (globalSettings.validityDays || 7) * 24 * 60 * 60 * 1000),
    });

    // ⚡ DIRECT TO ADMIN NOTIFICATION: Admin receives request directly to handle out of the app
    try {
      const notifTitle = isRental
        ? '⚡ New Rental Token Request'
        : '⚡ New Property Booking Request (No Token Amount)';
      const notifMessage = isRental
        ? `${finalPersonalDetails.fullName || 'Prospective Tenant'} (${finalPersonalDetails.mobileNumber}) requested a token booking (₹${numericAmount.toLocaleString('en-IN')}) for rental property "${property.title}". Please contact user out of the app to handle token deposit.`
        : `${finalPersonalDetails.fullName || 'Prospective Buyer'} (${finalPersonalDetails.mobileNumber}) requested to book sale property "${property.title}" (No Token Amount). Please contact user out of the app to coordinate next steps.`;

      await notifyAdmin({
        title: notifTitle,
        message: notifMessage,
        type: 'token_request',
        senderId: req.user?._id,
        metadata: {
          propertyId: property._id,
          tokenRequestId: tokenRequest._id,
          listingFor: property.listingFor,
          isRental,
          tokenAmount: numericAmount,
          clientDetails: {
            name: finalPersonalDetails.fullName,
            phone: finalPersonalDetails.mobileNumber,
            email: finalPersonalDetails.email,
          },
        },
      });
    } catch (adminNotifErr) {
      console.error('Failed to notify admins of token request:', adminNotifErr.message);
    }

    // Also notify property owner as an informational update
    if (property.owner) {
      try {
        await Notification.create({
          recipient: property.owner,
          title: isRental
            ? 'Rental Token Request Received (Handled by Admin)'
            : 'Property Booking Request Received (Handled by Admin)',
          message: isRental
            ? `A client requested a token reservation for rental listing "${property.title}". GharMB Admin is coordinating directly with the tenant out of the app.`
            : `A client requested booking for listing "${property.title}". GharMB Admin is coordinating directly out of the app.`,
          type: 'token_request',
          metadata: {
            propertyId: property._id,
            tokenRequestId: tokenRequest._id,
            listingFor: property.listingFor,
            isRental,
          },
        });
      } catch (ownerNotifErr) {
        console.error('Failed to notify owner:', ownerNotifErr.message);
      }
    }

    // Increment inquiry/token counter on property
    await Property.findByIdAndUpdate(propertyId, {
      $inc: { inquiriesCount: 1 }
    }).catch(() => {});

    const populatedNewToken = await TokenRequest.findById(tokenRequest._id)
      .populate('property', 'title locality city price listingFor category images photos submissionId')
      .populate('owner', 'name phone email companyName');

    const successMsg = isRental
      ? 'Token amount request submitted directly to GharMB Admin! Our team will contact you out of the app via Call/WhatsApp shortly to coordinate the token booking.'
      : 'Property booking request submitted directly to GharMB Admin! Our team will contact you out of the app via Call/WhatsApp shortly to coordinate next steps.';

    res.status(201).json({
      status: 'success',
      message: successMsg,
      data: {
        tokenRequest: populatedNewToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all token requests received by the logged-in owner/builder
// @route   GET /api/user/token-requests OR GET /api/user/properties/token-requests
// @access  Private (Owner / Builder / Agent)
exports.getReceivedTokenRequests = async (req, res, next) => {
  try {
    const ownerId = req.user._id;
    const { status, propertyId, page = 1, limit = 10 } = req.query;
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit, 10);

    const filter = { owner: ownerId };
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (propertyId) {
      filter.property = propertyId;
    }

    // Counts by status
    const [pendingCount, acceptedCount, rejectedCount, totalCount] = await Promise.all([
      TokenRequest.countDocuments({ owner: ownerId, status: 'pending' }),
      TokenRequest.countDocuments({ owner: ownerId, status: 'accepted' }),
      TokenRequest.countDocuments({ owner: ownerId, status: 'rejected' }),
      TokenRequest.countDocuments({ owner: ownerId }),
    ]);

    const totalFiltered = await TokenRequest.countDocuments(filter);
    const tokenRequests = await TokenRequest.find(filter)
      .populate('property', 'title locality city price propertyType photos images submissionId approvalStatus')
      .populate('client', 'name phone email profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(totalFiltered / limitNum) || 1;

    res.status(200).json({
      status: 'success',
      data: {
        tokenRequests,
        counts: {
          pending: pendingCount,
          accepted: acceptedCount,
          rejected: rejectedCount,
          total: totalCount,
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalFiltered,
          totalPages,
          hasMore: pageNum < totalPages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get token requests submitted by the logged-in client / buyer
// @route   GET /api/user/token-requests/my-requests
// @access  Private (Buyer / Client)
exports.getSentTokenRequests = async (req, res, next) => {
  try {
    const clientId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit, 10);

    const filter = { client: clientId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const total = await TokenRequest.countDocuments(filter);
    const tokenRequests = await TokenRequest.find(filter)
      .populate('property', 'title locality city price propertyType photos images submissionId')
      .populate('owner', 'name phone email companyName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      status: 'success',
      data: {
        tokenRequests,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasMore: pageNum < totalPages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single token request by ID
// @route   GET /api/user/token-requests/:id
// @access  Private
exports.getTokenRequestById = async (req, res, next) => {
  try {
    const tokenRequest = await TokenRequest.findById(req.params.id)
      .populate('property')
      .populate('client', 'name phone email profilePicture')
      .populate('owner', 'name phone email companyName');

    if (!tokenRequest) {
      return res.status(404).json({
        status: 'fail',
        message: 'Token request not found.',
      });
    }

    // Access control: only owner, client, or admin can view
    const isOwner = tokenRequest.owner?._id?.toString() === req.user._id.toString();
    const isClient = tokenRequest.client?._id?.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'superadmin'].includes((req.user.role || '').toLowerCase());

    if (!isOwner && !isClient && !isAdmin) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to view this token request.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        tokenRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept a token request
// @route   PATCH /api/user/token-requests/:id/accept
// @access  Private (Owner / Builder / Agent)
exports.acceptTokenRequest = async (req, res, next) => {
  try {
    const tokenRequest = await TokenRequest.findById(req.params.id).populate('property', 'title owner');

    if (!tokenRequest) {
      return res.status(404).json({
        status: 'fail',
        message: 'Token request not found.',
      });
    }

    if (tokenRequest.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can only accept token requests for your own properties.',
      });
    }

    if (tokenRequest.status === 'accepted') {
      return res.status(400).json({
        status: 'fail',
        message: 'This token request is already accepted.',
        data: { tokenRequest },
      });
    }

    tokenRequest.status = 'accepted';
    tokenRequest.decisionDate = new Date();
    await tokenRequest.save();

    // Increment tokensCount on Property
    await Property.findByIdAndUpdate(tokenRequest.property._id, {
      $inc: { tokensCount: 1 },
    });

    // Notify client
    try {
      await Notification.create({
        recipient: tokenRequest.client,
        title: 'Token Request Accepted! 🎉',
        message: `Your token booking request for "${tokenRequest.property.title}" has been accepted by the owner!`,
        type: 'token_request',
        metadata: {
          propertyId: tokenRequest.property._id,
          tokenRequestId: tokenRequest._id,
        },
      });
    } catch (notifErr) {
      console.error('Failed to notify client on accept:', notifErr.message);
    }

    res.status(200).json({
      status: 'success',
      message: 'Token request accepted successfully.',
      data: {
        tokenRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a token request
// @route   PATCH /api/user/token-requests/:id/reject
// @access  Private (Owner / Builder / Agent)
exports.rejectTokenRequest = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const tokenRequest = await TokenRequest.findById(req.params.id).populate('property', 'title owner');

    if (!tokenRequest) {
      return res.status(404).json({
        status: 'fail',
        message: 'Token request not found.',
      });
    }

    if (tokenRequest.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can only reject token requests for your own properties.',
      });
    }

    tokenRequest.status = 'rejected';
    tokenRequest.rejectionReason = reason || 'Not accepted by owner';
    tokenRequest.decisionDate = new Date();
    await tokenRequest.save();

    // Notify client
    try {
      await Notification.create({
        recipient: tokenRequest.client,
        title: 'Token Request Update',
        message: `Your token request for "${tokenRequest.property.title}" was not accepted: ${tokenRequest.rejectionReason}.`,
        type: 'token_request',
        metadata: {
          propertyId: tokenRequest.property._id,
          tokenRequestId: tokenRequest._id,
        },
      });
    } catch (notifErr) {
      console.error('Failed to notify client on reject:', notifErr.message);
    }

    res.status(200).json({
      status: 'success',
      message: 'Token request rejected.',
      data: {
        tokenRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a pending token request by the buyer
// @route   PATCH /api/user/token-requests/:id/cancel
// @access  Private (Buyer / Client)
exports.cancelTokenRequest = async (req, res, next) => {
  try {
    const tokenRequest = await TokenRequest.findById(req.params.id);

    if (!tokenRequest) {
      return res.status(404).json({
        status: 'fail',
        message: 'Token request not found.',
      });
    }

    if (tokenRequest.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can only cancel your own token booking requests.',
      });
    }

    if (tokenRequest.status !== 'pending') {
      return res.status(400).json({
        status: 'fail',
        message: `Cannot cancel a token request that is already ${tokenRequest.status}.`,
      });
    }

    tokenRequest.status = 'cancelled';
    await tokenRequest.save();

    res.status(200).json({
      status: 'success',
      message: 'Token booking request cancelled successfully.',
      data: {
        tokenRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};
