/**
 * User Refer & Earn Controller
 * Implements full "Invite Friends & Earn ₹250 GharMB Coins" lifecycle:
 * - Real-time Referral Code Validation (before registration on login/detail add page)
 * - Live Referral Dashboard with Stats, Unique Lifetime Code, Share Links
 * - Friends Invited History & Milestone Tracking
 * - Coins Wallet & Transaction History
 */

const mongoose = require('mongoose');
const User = require('../../models/user.model');
const Referral = require('../../models/referral.model');
const CoinTransaction = require('../../models/coin-transaction.model');
const Notification = require('../../models/notification.model');
const {
  validateReferralCode: checkReferralCode,
  generateUniqueReferralCode,
} = require('../../utils/referralCode.helper');

/**
 * Mask phone number for privacy display: +91 98765 43210 -> +91 98*** **210
 */
const maskPhone = (phone) => {
  if (!phone) return '';
  const str = String(phone);
  if (str.length <= 6) return str;
  const start = str.slice(0, 5);
  const end = str.slice(-3);
  return `${start}****${end}`;
};

/**
 * Mask name for privacy: Rahul Sharma -> Rahul S.
 */
const maskName = (name) => {
  if (!name) return 'Friend';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Validate Referral Code (Public endpoint — for signup / detail add page)
// @route   POST /api/user/referrals/validate-code  OR  POST /api/referrals/validate-code
// @access  Public / Optional Auth
// ─────────────────────────────────────────────────────────────────────────────
exports.validateReferralCode = async (req, res, next) => {
  try {
    const rawCode = req.body.referralCode || req.body.code || req.query.code;
    const currentUserId = req.user ? req.user._id : req.body.userId || null;

    if (!rawCode || !rawCode.trim()) {
      return res.status(400).json({
        status: 'fail',
        isValid: false,
        message: 'Please enter a referral code.',
      });
    }

    const cleanCode = rawCode.trim().toUpperCase();
    const result = await checkReferralCode(cleanCode, currentUserId);

    if (!result.isValid) {
      return res.status(400).json({
        status: 'fail',
        isValid: false,
        message: result.message,
      });
    }

    const referrer = result.referrer;

    return res.status(200).json({
      status: 'success',
      isValid: true,
      message: 'Referral code applied successfully!',
      data: {
        referralCode: referrer.referralCode,
        referrerName: referrer.name,
        referrerDisplayName: maskName(referrer.name),
        rewardAmount: 250,
        currency: '₹',
        rewardCoinBonus: '250 GharMB Coins',
        howToUnlock: 'Post your first verified property listing to receive ₹250 coins in your wallet.',
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get Refer & Earn Dashboard (Invite Friends screen as shown in designs)
// @route   GET /api/user/referrals/dashboard  OR  GET /api/user/referrals/my-code
// @access  Private (Authenticated User)
// ─────────────────────────────────────────────────────────────────────────────
exports.getReferralDashboard = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User account not found.',
      });
    }

    // Ensure user has a lifetime unique referral code (auto-assign if legacy user)
    if (!user.referralCode) {
      user.referralCode = await generateUniqueReferralCode(user.name, User);
      await user.save();
    }

    const userReferralCode = user.referralCode;

    // Aggregate referral counts and coins
    const [friendsInvitedCount, recentReferrals] = await Promise.all([
      Referral.countDocuments({
        referrerUser: user._id,
        programType: 'refer_and_earn',
      }),
      Referral.find({
        referrerUser: user._id,
        programType: 'refer_and_earn',
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('refereeUser', 'name phone profilePicture createdAt')
        .populate('linkedProperty', 'title submissionId city'),
    ]);

    const coinsEarned = user.referralCoinsEarned || 0;
    const currentWalletCoins = user.walletCoins || 0;
    const rewardPerReferral = 250;

    // Web & App referral link
    const webDomain = process.env.CLIENT_URL || 'https://gharmb.com';
    const referralLink = `${webDomain}/invite?code=${encodeURIComponent(userReferralCode)}`;
    const appInviteLink = `gharmb://invite?code=${encodeURIComponent(userReferralCode)}`;

    // Share messages tailored for WhatsApp, SMS, Email, and generic share sheet
    const shareText = `Join me on GharMB to find and list verified properties! Use my referral code *${userReferralCode}* to get ₹250 in GharMB coins once you post your first listing: ${referralLink}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    const smsBody = `Download GharMB and use my referral code ${userReferralCode} to get ₹250 GharMB coins: ${referralLink}`;
    const emailSubject = `Join GharMB & Earn ₹250 Coins`;
    const emailBody = `Hi,\n\nI'm inviting you to GharMB, India's trusted property platform. Register using my referral code ${userReferralCode} and get ₹250 in GharMB coins after posting your first listing:\n\n${referralLink}\n\nHappy property searching!`;

    // Format recent invited friends for UI
    const formattedRecentFriends = recentReferrals.map((ref) => {
      let displayStatus = 'Pending Listing';
      if (ref.referralStatus === 'rewarded') {
        displayStatus = 'Reward Credited';
      } else if (ref.referralStatus === 'listing_posted') {
        displayStatus = 'Listing Under Review';
      }

      return {
        id: ref._id,
        friendName: ref.refereeName || ref.refereeUser?.name || 'Friend',
        friendDisplayName: maskName(ref.refereeName || ref.refereeUser?.name || 'Friend'),
        friendPhoneMasked: maskPhone(ref.refereePhone || ref.refereeUser?.phone),
        joinedDate: new Date(ref.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        status: displayStatus,
        coinsEarned: ref.referralStatus === 'rewarded' ? (ref.coinsRewarded || 250) : 0,
        propertyTitle: ref.linkedProperty?.title || ref.propertyTitle || null,
        rewardCreditedAt: ref.rewardCreditedAt || null,
      };
    });

    return res.status(200).json({
      status: 'success',
      data: {
        // Referral Identification
        referralCode: userReferralCode,
        referralLink,
        appInviteLink,

        // KPI Banner Stats matching mobile screen
        stats: {
          friendsInvited: friendsInvitedCount,
          coinsEarned,
          rewardPerReferral,
          walletCoins: currentWalletCoins,
        },

        // Hero Card details
        card: {
          title: `Invite & Earn ₹${rewardPerReferral}`,
          subtitle: `Get ₹${rewardPerReferral} in GharMB coins for every friend who joins and posts a listing`,
          badge: 'Lifetime Referral Code',
          perReferralText: `₹${rewardPerReferral} Per Referral`,
        },

        // Direct Share Channels
        shareVia: {
          whatsapp: {
            title: 'WhatsApp',
            url: whatsappUrl,
            message: shareText,
          },
          sms: {
            title: 'SMS',
            body: smsBody,
          },
          email: {
            title: 'Email',
            subject: emailSubject,
            body: emailBody,
          },
          more: {
            title: 'More',
            shareText,
            url: referralLink,
          },
        },

        // 4 Step "How it works" matching mobile screen
        howItWorks: [
          {
            stepNumber: 1,
            title: 'Share your code',
            description: 'Send your referral code to friends via WhatsApp, SMS or any channel',
            icon: 'share-2',
          },
          {
            stepNumber: 2,
            title: 'Friend signs up',
            description: 'Your friend downloads GharMB and registers using your code',
            icon: 'user-plus',
          },
          {
            stepNumber: 3,
            title: 'They list a property',
            description: 'Once your friend posts their first verified listing, you both earn',
            icon: 'home',
          },
          {
            stepNumber: 4,
            title: 'You both get ₹250',
            description: 'Coins are credited within 48 hours and can be used for premium features',
            icon: 'coins',
          },
        ],

        // Exact Terms & Conditions matching mobile screen
        termsAndConditions: [
          'Referral valid only for new users',
          'Friend must post a verified listing',
          'Coins expire after 6 months',
          'GharMB reserves the right to modify the program',
        ],

        // Recent Activity
        recentFriends: formattedRecentFriends,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get Paginated Referral History (All invited friends & statuses)
// @route   GET /api/user/referrals/history  OR  GET /api/user/referrals/my-friends
// @access  Private (Authenticated User)
// ─────────────────────────────────────────────────────────────────────────────
exports.getReferralHistory = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {
      referrerUser: req.user._id,
      programType: 'refer_and_earn',
    };

    if (req.query.status) {
      query.referralStatus = req.query.status;
    }

    const [referrals, total] = await Promise.all([
      Referral.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('refereeUser', 'name phone profilePicture createdAt')
        .populate('linkedProperty', 'title submissionId city locality'),
      Referral.countDocuments(query),
    ]);

    const formattedList = referrals.map((ref) => {
      let statusLabel = 'Pending Listing';
      if (ref.referralStatus === 'rewarded') {
        statusLabel = 'Reward Credited';
      } else if (ref.referralStatus === 'listing_posted') {
        statusLabel = 'Listing Posted';
      } else if (ref.referralStatus === 'expired') {
        statusLabel = 'Expired';
      }

      return {
        referralId: ref.referralId || `#REF-${ref._id.toString().slice(-6)}`,
        id: ref._id,
        refereeName: ref.refereeName || ref.refereeUser?.name || 'Friend',
        refereeDisplayName: maskName(ref.refereeName || ref.refereeUser?.name || 'Friend'),
        refereePhoneMasked: maskPhone(ref.refereePhone || ref.refereeUser?.phone),
        referralCodeUsed: ref.referralCode,
        status: statusLabel,
        rawStatus: ref.referralStatus,
        propertyListed: ref.propertyListed || false,
        propertyDetails: ref.linkedProperty
          ? {
              id: ref.linkedProperty._id,
              title: ref.linkedProperty.title,
              city: ref.linkedProperty.city,
            }
          : null,
        coinsEarned: ref.referralStatus === 'rewarded' ? (ref.coinsRewarded || 250) : 0,
        rewardCreditedAt: ref.rewardCreditedAt,
        joinedAt: ref.createdAt,
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      status: 'success',
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
      data: {
        friends: formattedList,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Apply Referral Code Post-Signup (for users who missed it at registration)
// @route   POST /api/user/referrals/apply-code
// @access  Private (Authenticated User)
// ─────────────────────────────────────────────────────────────────────────────
exports.applyReferralCode = async (req, res, next) => {
  try {
    const { referralCode } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User account not found.',
      });
    }

    if (user.referredBy) {
      return res.status(400).json({
        status: 'fail',
        message: 'You have already applied a referral code.',
      });
    }

    if (!referralCode || !referralCode.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a referral code to apply.',
      });
    }

    const cleanCode = referralCode.trim().toUpperCase();
    const validation = await checkReferralCode(cleanCode, user._id);

    if (!validation.isValid) {
      return res.status(400).json({
        status: 'fail',
        message: validation.message,
      });
    }

    const referrer = validation.referrer;

    // Check if user has already posted properties
    const Property = require('../../models/property.model');
    const existingPropertiesCount = await Property.countDocuments({ owner: user._id });

    // Link referrer
    user.referredBy = referrer._id;
    user.appliedReferralCode = cleanCode;
    await user.save();

    // Create referral tracking record
    const newReferral = await Referral.create({
      programType: 'refer_and_earn',
      referrerUser: referrer._id,
      referrerName: referrer.name,
      referrerPhone: referrer.phone,
      referrerEmail: referrer.email,
      referralCode: cleanCode,
      refereeUser: user._id,
      refereeName: user.name,
      refereePhone: user.phone,
      refereeEmail: user.email,
      coinsRewarded: 250,
      refereeCoinsRewarded: 250,
      referralStatus: existingPropertiesCount > 0 ? 'listing_posted' : 'pending_listing',
      propertyListed: existingPropertiesCount > 0,
      notes: `Referral code ${cleanCode} applied post-signup by ${user.name}.`,
    });

    // Increment referrer's referralCount
    await User.findByIdAndUpdate(referrer._id, { $inc: { referralCount: 1 } });

    // Send notifications
    await Notification.create({
      recipient: referrer._id,
      title: '🎉 New Friend Joined via Referral!',
      message: `${user.name} has linked your referral code ${cleanCode}. You will both receive ₹250 GharMB coins once their property listing is live!`,
      type: 'system',
    });

    await Notification.create({
      recipient: user._id,
      title: '🎁 Referral Bonus Activated!',
      message: `You applied ${referrer.name}'s referral code! Post your first property listing to unlock ₹250 GharMB coins.`,
      type: 'system',
    });

    // If user already had a property posted, fulfill reward immediately
    if (existingPropertiesCount > 0) {
      const firstProperty = await Property.findOne({ owner: user._id });
      if (firstProperty) {
        const { processFirstListingReferralReward } = require('../../utils/referralCode.helper');
        await processFirstListingReferralReward(user._id, firstProperty._id, firstProperty.title);
      }
    }

    return res.status(200).json({
      status: 'success',
      message: 'Referral code applied successfully! Post a property listing to receive ₹250 coins.',
      data: {
        referredBy: {
          name: referrer.name,
          referralCode: cleanCode,
        },
        rewardCoins: 250,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get Coins Wallet & Transaction History
// @route   GET /api/user/referrals/wallet  OR  GET /api/user/wallet/coins
// @access  Private (Authenticated User)
// ─────────────────────────────────────────────────────────────────────────────
exports.getCoinsWallet = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id).select(
      'name walletCoins referralCoinsEarned referralCount referralCode'
    );

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User account not found.',
      });
    }

    // Query coin transactions for this user
    const [transactions, totalTxns, expiringSoonAgg] = await Promise.all([
      CoinTransaction.find({ user: user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('property', 'title submissionId'),
      CoinTransaction.countDocuments({ user: user._id }),
      // Expiring in next 30 days
      CoinTransaction.aggregate([
        {
          $match: {
            user: user._id,
            type: 'credit',
            status: 'completed',
            expiresAt: {
              $gte: new Date(),
              $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const expiringSoon = expiringSoonAgg.length > 0 ? expiringSoonAgg[0].total : 0;
    const totalPages = Math.ceil(totalTxns / limit) || 1;

    const formattedTransactions = transactions.map((t) => ({
      id: t._id,
      transactionId: t.transactionId,
      amount: t.amount,
      type: t.type,
      source: t.source,
      title: t.title,
      description: t.description,
      balanceAfter: t.balanceAfter,
      expiresAt: t.expiresAt,
      date: new Date(t.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      createdAt: t.createdAt,
    }));

    return res.status(200).json({
      status: 'success',
      data: {
        wallet: {
          currentBalance: user.walletCoins || 0,
          currency: '₹',
          lifetimeEarned: user.referralCoinsEarned || 0,
          expiringSoonIn30Days: expiringSoon,
          referralCount: user.referralCount || 0,
          referralCode: user.referralCode,
          coinValueInRupees: '1 GharMB Coin = ₹1',
          canRedeemFor: [
            'Premium Property Listing Boost',
            'Featured Verified Property Badge',
            'Direct Owner Contact Unlocks',
            'Priority Property Valuation Report',
          ],
        },
        transactions: formattedTransactions,
        pagination: {
          total: totalTxns,
          page,
          limit,
          totalPages,
          hasMore: page < totalPages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Claim Referral Reward / Commission (Notifies Admin to Contact User Out of App)
// @route   POST /api/user/referrals/:id/claim  OR  POST /api/user/referrals/claim
// @access  Private (Authenticated User)
// ─────────────────────────────────────────────────────────────────────────────
exports.claimReferralReward = async (req, res, next) => {
  try {
    const referralIdParam = req.params.id || req.body.referralId || req.body.id;
    const { notes, preferredContactTime, alternatePhone } = req.body;
    const user = req.user;

    if (!referralIdParam) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide referral ID to claim reward.',
      });
    }

    // Look up referral record by MongoDB ID or referralId string
    let referral = null;
    if (mongoose.Types.ObjectId.isValid(referralIdParam)) {
      referral = await Referral.findById(referralIdParam);
    }
    if (!referral) {
      referral = await Referral.findOne({ referralId: referralIdParam });
    }

    if (!referral) {
      return res.status(404).json({
        status: 'fail',
        message: 'Referral record not found.',
      });
    }

    // Authorization: User must be the referrer of this referral record
    const isReferrer = referral.referrerUser && referral.referrerUser.toString() === user._id.toString();
    const isReferee = referral.refereeUser && referral.refereeUser.toString() === user._id.toString();

    if (!isReferrer && !isReferee) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to claim reward for this referral.',
      });
    }

    // Prevent duplicate claim if already paid or currently pending admin payout
    if (referral.payoutStatus === 'Paid' || referral.claimStatus === 'paid') {
      return res.status(400).json({
        status: 'fail',
        message: `This referral reward has already been settled and paid out on ${referral.payoutDate || 'earlier'} (Ref: ${referral.payoutRefId || 'Settled'}).`,
      });
    }

    if (referral.claimStatus === 'pending_admin_payout') {
      return res.status(400).json({
        status: 'fail',
        message: `Your claim is already pending with Admin. Admin will contact you directly on ${user.phone || 'your phone number'} to process the payment.`,
      });
    }

    const cleanAmount = referral.rewardAmount || referral.coinsRewarded || 250;
    const contactPhone = alternatePhone ? String(alternatePhone).trim() : (user.phone || referral.referrerPhone);

    // Update referral with claim submission details
    referral.claimStatus = 'pending_admin_payout';
    referral.payoutStatus = 'Pending Admin Payout';
    referral.claimedAt = new Date();
    referral.claimedBy = user._id;
    referral.claimedAmount = cleanAmount;
    if (notes || preferredContactTime) {
      referral.claimNotes = [
        notes ? `Note: ${notes}` : '',
        preferredContactTime ? `Preferred Time: ${preferredContactTime}` : '',
        alternatePhone ? `Alt Phone: ${alternatePhone}` : '',
      ].filter(Boolean).join(' | ');
    }
    referral.notes = `${referral.notes || ''} | Reward claim of ₹${cleanAmount} submitted by ${user.name} on ${new Date().toLocaleDateString('en-GB')}. Admin to contact on ${contactPhone}`.trim();

    await referral.save();

    // ── 1. Notify Referrer User ───────────────────────────────────────────────
    await Notification.create({
      recipient: user._id,
      title: '🎉 Referral Claim Submitted!',
      message: `Your reward claim for referring ${referral.refereeName || 'friend'} has been received. Admin will contact you directly on ${contactPhone} to process your reward and deal payment out of the app.`,
      type: 'payment',
      metadata: {
        referralId: referral._id,
      },
    });

    // ── 2. Notify Claimed / Referee User ──────────────────────────────────────
    if (referral.refereeUser && referral.refereeUser.toString() !== user._id.toString()) {
      await Notification.create({
        recipient: referral.refereeUser,
        title: '🎉 Referral Reward Claim Submitted!',
        message: `${user.name} has claimed the referral reward for your connection on GharMB. Admin will contact them to complete the process out of the app.`,
        type: 'system',
        metadata: {
          referralId: referral._id,
        },
      });
    }

    // ── 3. Notify Admin(s) with Contact Details to Call User ──────────────────
    try {
      const Admin = require('../../models/admin.model');
      const admins = await Admin.find({ isActive: true }).select('_id');
      if (admins.length > 0) {
        await Notification.insertMany(
          admins.map((admin) => ({
            recipient: admin._id,
            title: '📞 Referral Claim: Contact User for Out-of-App Payment',
            message: `${user.name} (Phone: ${contactPhone}) has claimed referral reward for ${referral.refereeName} (Phone: ${referral.refereePhone || 'N/A'}). Please contact ${user.name} at ${contactPhone} to complete the payment and deal process out of the app.`,
            type: 'payment',
            forAdmin: true,
            metadata: {
              referralId: referral._id,
              referrerName: user.name,
              referrerPhone: contactPhone,
              refereeName: referral.refereeName,
              refereePhone: referral.refereePhone,
              amount: cleanAmount,
            },
          }))
        );
      }
    } catch (adminNotifErr) {
      console.warn('⚠️ Admin claim notification notice:', adminNotifErr.message);
    }

    console.log(`\n==================================================`);
    console.log(`📞 [REFERRAL CLAIM SUBMITTED — ADMIN TO CONTACT USER]`);
    console.log(`   Referrer     : ${user.name} (📞 ${contactPhone})`);
    console.log(`   Referee      : ${referral.refereeName} (📞 ${referral.refereePhone})`);
    console.log(`   Claim Amount : ₹${cleanAmount}`);
    console.log(`   Action       : Sent to Admin to call user & pay out of the app`);
    console.log(`==================================================\n`);

    return res.status(200).json({
      status: 'success',
      message: `Referral claim submitted successfully! Admin will contact you directly on ${contactPhone} to process the payment out of the app.`,
      data: {
        referralId: referral.referralId,
        claimStatus: referral.claimStatus,
        payoutStatus: referral.payoutStatus,
        claimedAmount: referral.claimedAmount,
        contactPhone,
        claimedAt: referral.claimedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get All Claims Submitted by Current User
// @route   GET /api/user/referrals/claims  OR  GET /api/user/referrals/my-claims
// @access  Private (Authenticated User)
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyClaims = async (req, res, next) => {
  try {
    const claims = await Referral.find({
      $or: [
        { referrerUser: req.user._id, claimStatus: { $ne: 'unclaimed' } },
        { claimedBy: req.user._id },
      ],
    })
      .sort({ claimedAt: -1, createdAt: -1 })
      .populate('linkedProperty', 'title city locality submissionId');

    const formattedClaims = claims.map((c) => ({
      id: c._id,
      referralId: c.referralId || `#REF-${c._id.toString().slice(-6)}`,
      refereeName: c.refereeName,
      refereePhoneMasked: maskPhone(c.refereePhone),
      claimedAmount: c.claimedAmount || c.rewardAmount || 250,
      claimStatus: c.claimStatus,
      payoutStatus: c.payoutStatus,
      payoutDate: c.payoutDate || (c.payoutStatus === 'Paid' ? 'Settled' : 'Pending Admin Contact'),
      payoutRefId: c.payoutRefId || '',
      claimedAt: c.claimedAt || c.createdAt,
      adminSettlementNotes: c.adminSettlementNotes || '',
      rejectionReason: c.rejectionReason || null,
      propertyTitle: c.linkedProperty?.title || c.propertyTitle || 'Property Deal',
    }));

    return res.status(200).json({
      status: 'success',
      total: formattedClaims.length,
      data: {
        claims: formattedClaims,
      },
    });
  } catch (error) {
    next(error);
  }
};
