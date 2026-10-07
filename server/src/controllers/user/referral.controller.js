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
      message: 'Referral code applied! You and your friend both win ₹250 reward upon signup.',
      data: {
        referralCode: result.referralCode || referrer.referralCode,
        referrerName: referrer.name,
        referrerDisplayName: maskName(referrer.name),
        rewardAmount: 250,
        currency: '₹',
        rewardDescription: '₹250 cash reward won upon signup. GharMB Admin will contact both users directly to deliver payment out of the app.',
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

    // Aggregate referral counts and rewards
    const [friendsInvitedCount, recentReferrals, pendingContactCount, settledCount] = await Promise.all([
      Referral.countDocuments({
        referrerUser: user._id,
        programType: 'refer_and_earn',
      }),
      Referral.find({
        referrerUser: user._id,
        programType: 'refer_and_earn',
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('refereeUser', 'name phone profilePicture createdAt'),
      Referral.countDocuments({
        referrerUser: user._id,
        programType: 'refer_and_earn',
        payoutStatus: { $ne: 'Paid' },
      }),
      Referral.countDocuments({
        referrerUser: user._id,
        programType: 'refer_and_earn',
        payoutStatus: 'Paid',
      }),
    ]);

    const rewardPerReferral = 250;
    const totalRewardEarned = user.referralRewardEarned || (friendsInvitedCount * rewardPerReferral);

    // Web & App referral link
    const webDomain = process.env.CLIENT_URL || 'https://gharmb.com';
    const referralLink = `${webDomain}/invite?code=${encodeURIComponent(userReferralCode)}`;
    const appInviteLink = `gharmb://invite?code=${encodeURIComponent(userReferralCode)}`;

    // Share messages tailored for WhatsApp, SMS, Email, and generic share sheet
    const shareText = `Join me on GharMB to find and list verified properties! Use my referral code *${userReferralCode}* to get ₹250 reward upon signup. GharMB Admin will contact you to deliver payment out of the app: ${referralLink}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    const smsBody = `Download GharMB and use my referral code ${userReferralCode} to get ₹250 reward: ${referralLink}`;
    const emailSubject = `Join GharMB & Earn ₹250 Reward`;
    const emailBody = `Hi,\n\nI'm inviting you to GharMB, India's trusted property platform. Register using my referral code ${userReferralCode} and we both win ₹250 reward. GharMB Admin will contact you to deliver your reward out of the app:\n\n${referralLink}\n\nHappy property searching!`;

    // Format recent invited friends for UI
    const formattedRecentFriends = recentReferrals.map((ref) => {
      let displayStatus = 'Admin Will Contact Soon';
      if (ref.payoutStatus === 'Paid' || ref.claimStatus === 'paid') {
        displayStatus = 'Reward Delivered';
      } else if (ref.claimStatus === 'rejected') {
        displayStatus = 'Rejected';
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
        payoutStatus: ref.payoutStatus || 'Pending Admin Contact',
        rewardAmount: ref.rewardAmount || rewardPerReferral,
        currency: '₹',
        adminNotes: ref.adminSettlementNotes || '',
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
          totalRewardEarned,
          rewardPerReferral,
          currency: '₹',
          pendingContactCount,
          settledCount,
          walletCoins: 0,
          coinsEarned: 0,
        },

        // Hero Card details
        card: {
          title: `Invite & Earn ₹${rewardPerReferral}`,
          subtitle: `Get ₹${rewardPerReferral} reward for every friend who joins GharMB using your code. Admin contacts you directly to deliver your reward!`,
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

        // 4 Step "How it works"
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
            description: 'Your friend registers on GharMB using your referral code',
            icon: 'user-plus',
          },
          {
            stepNumber: 3,
            title: 'Both win ₹250',
            description: 'Both you and your friend win ₹250 reward immediately upon signup',
            icon: 'gift',
          },
          {
            stepNumber: 4,
            title: 'Admin contacts you',
            description: 'GharMB Admin gets notified and calls both users directly to deliver payments out of the app',
            icon: 'phone-call',
          },
        ],

        // Exact Terms & Conditions
        termsAndConditions: [
          'Referral valid for new user signups',
          'Both referrer and new user win ₹250 reward upon signup',
          'Users do not need to contact admin; GharMB Admin contacts you directly',
          'Reward payment is delivered out of the app (UPI, Cash, or Direct Transfer)',
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
      let statusLabel = 'Admin Will Contact Soon';
      if (ref.payoutStatus === 'Paid' || ref.claimStatus === 'paid') {
        statusLabel = 'Reward Delivered';
      } else if (ref.claimStatus === 'rejected') {
        statusLabel = 'Rejected';
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
        payoutStatus: ref.payoutStatus || 'Pending Admin Contact',
        rewardAmount: ref.rewardAmount || 250,
        currency: '₹',
        rewardCreditedAt: ref.rewardCreditedAt || ref.createdAt,
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

    // Link referrer
    user.referredBy = referrer._id;
    user.appliedReferralCode = cleanCode;
    user.referralRewardEarned = (user.referralRewardEarned || 0) + 250;
    await user.save();

    // Create referral tracking record (instant ₹250 reward for both users)
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
      rewardAmount: 250,
      claimedAmount: 250,
      referralStatus: 'rewarded',
      claimStatus: 'pending_admin_payout',
      payoutStatus: 'Pending Admin Contact',
      notes: `Referral code ${cleanCode} applied post-signup by ${user.name}. Both users won ₹250 reward. Admin notified to contact users to deliver reward out of app.`,
    });

    // Increment referrer's referralCount & referralRewardEarned
    await User.findByIdAndUpdate(referrer._id, {
      $inc: { referralCount: 1, referralRewardEarned: 250 },
    });

    // ── 1. Notify Referrer ────────────────────────────────────────────────────
    await Notification.create({
      recipient: referrer._id,
      title: '🎉 You Won ₹250 Referral Reward!',
      message: `Your friend ${user.name} applied your referral code (${cleanCode})! Both of you have won ₹250 reward. GharMB Admin will contact you on ${referrer.phone} to deliver your payment out of the app.`,
      type: 'payment',
      metadata: {
        referralId: newReferral._id,
        friendName: user.name,
        rewardAmount: 250,
      },
    });

    // ── 2. Notify Referee (Current User) ──────────────────────────────────────
    await Notification.create({
      recipient: user._id,
      title: '🎉 You Won ₹250 Referral Reward!',
      message: `You applied ${referrer.name}'s referral code and won ₹250 reward! GharMB Admin will contact you on ${user.phone} to deliver your payment out of the app.`,
      type: 'payment',
      metadata: {
        referralId: newReferral._id,
        referrerName: referrer.name,
        rewardAmount: 250,
      },
    });

    // ── 3. Notify Admin(s) immediately so Admin contacts users directly ───────
    try {
      const Admin = require('../../models/admin.model');
      const admins = await Admin.find({ isActive: true }).select('_id');
      if (admins.length > 0) {
        await Notification.insertMany(
          admins.map((admin) => ({
            recipient: admin._id,
            title: '📞 Referral Reward Won! Contact Users to Pay',
            message: `${user.name} (📞 ${user.phone}) applied ${referrer.name}'s (📞 ${referrer.phone}) referral code. Both users won ₹250 reward! Please contact both users directly to deliver payment out of the app.`,
            type: 'payment',
            forAdmin: true,
            metadata: {
              referralId: newReferral._id,
              referrerId: referrer._id,
              referrerName: referrer.name,
              referrerPhone: referrer.phone,
              refereeId: user._id,
              refereeName: user.name,
              refereePhone: user.phone,
              rewardAmount: 250,
            },
          }))
        );
      }
    } catch (adminErr) {
      console.warn('⚠️ [Admin Referral Notification Error]:', adminErr.message);
    }

    console.log(`\n==================================================`);
    console.log(`🎁 [REFERRAL CODE APPLIED — BOTH USERS REWARDED ₹250]`);
    console.log(`   Referrer : ${referrer.name} (📞 ${referrer.phone})`);
    console.log(`   Referee  : ${user.name} (📞 ${user.phone})`);
    console.log(`   Reward   : ₹250 each`);
    console.log(`   Action   : Admin notified to contact users & pay out of app`);
    console.log(`==================================================\n`);

    return res.status(200).json({
      status: 'success',
      message: 'Referral code applied successfully! Both you and your friend have won ₹250 reward. GharMB Admin will contact you directly to deliver your reward out of the app.',
      data: {
        referredBy: {
          name: referrer.name,
          referralCode: cleanCode,
        },
        rewardAmount: 250,
        currency: '₹',
        payoutStatus: 'Pending Admin Contact',
        note: 'GharMB Admin will contact you directly on your phone to deliver your payment out of the app.',
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get Rewards Wallet Summary (Zero coins, pure cash rewards settled out of app)
// @route   GET /api/user/referrals/wallet  OR  GET /api/user/wallet/coins
// @access  Private (Authenticated User)
// ─────────────────────────────────────────────────────────────────────────────
exports.getCoinsWallet = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      'name phone email referralRewardEarned referralCount referralCode'
    );

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User account not found.',
      });
    }

    // Fetch user's referral rewards
    const referrals = await Referral.find({
      $or: [{ referrerUser: user._id }, { refereeUser: user._id }],
    }).sort({ createdAt: -1 });

    const rewardsList = referrals.map((r) => {
      const isReferrer = r.referrerUser && r.referrerUser.toString() === user._id.toString();
      return {
        id: r._id,
        referralId: r.referralId || `#REF-${r._id.toString().slice(-6)}`,
        connectionName: isReferrer ? r.refereeName : r.referrerName,
        connectionRole: isReferrer ? 'Referee (Invited Friend)' : 'Referrer',
        rewardAmount: r.rewardAmount || 250,
        currency: '₹',
        payoutStatus: r.payoutStatus || 'Pending Admin Contact',
        claimStatus: r.claimStatus,
        date: new Date(r.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        createdAt: r.createdAt,
        settlementNote: r.payoutStatus === 'Paid'
          ? `Settled by Admin via ${r.payoutMethod || 'Direct Payment'} (Ref: ${r.payoutRefId || 'Settled'})`
          : 'GharMB Admin will contact you directly on your phone to deliver payment out of the app.',
      };
    });

    return res.status(200).json({
      status: 'success',
      data: {
        wallet: {
          totalRewardEarned: user.referralRewardEarned || 0,
          currency: '₹',
          currentBalance: user.referralRewardEarned || 0,
          referralCount: user.referralCount || 0,
          referralCode: user.referralCode,
          payoutProcess: 'Admin contacts both users directly to deliver cash/UPI reward out of the app.',
          walletCoins: 0,
        },
        rewards: rewardsList,
        transactions: [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Check / Confirm Referral Reward Status
// @route   POST /api/user/referrals/:id/claim  OR  POST /api/user/referrals/claim
// @access  Private (Authenticated User)
// ─────────────────────────────────────────────────────────────────────────────
exports.claimReferralReward = async (req, res, next) => {
  try {
    const referralIdParam = req.params.id || req.body.referralId || req.body.id;
    const { alternatePhone } = req.body;
    const user = req.user;

    if (!referralIdParam) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide referral ID to check reward status.',
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

    // Authorization: User must be the referrer or referee
    const isReferrer = referral.referrerUser && referral.referrerUser.toString() === user._id.toString();
    const isReferee = referral.refereeUser && referral.refereeUser.toString() === user._id.toString();

    if (!isReferrer && !isReferee) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized for this referral record.',
      });
    }

    // If already paid out
    if (referral.payoutStatus === 'Paid' || referral.claimStatus === 'paid') {
      return res.status(200).json({
        status: 'success',
        message: `This referral reward of ₹${referral.rewardAmount || 250} has been paid and settled by Admin on ${referral.payoutDate || 'earlier'} (Ref: ${referral.payoutRefId || 'Settled'}).`,
        data: {
          referralId: referral.referralId,
          payoutStatus: referral.payoutStatus,
          payoutDate: referral.payoutDate,
          payoutRefId: referral.payoutRefId,
          rewardAmount: referral.rewardAmount || 250,
          currency: '₹',
        },
      });
    }

    const contactPhone = alternatePhone ? String(alternatePhone).trim() : (user.phone || referral.referrerPhone);

    return res.status(200).json({
      status: 'success',
      message: `Your referral reward of ₹${referral.rewardAmount || 250} is confirmed! GharMB Admin has been notified and will contact you directly on ${contactPhone} to deliver your payment out of the app. You do not need to do anything.`,
      data: {
        referralId: referral.referralId,
        rewardAmount: referral.rewardAmount || 250,
        currency: '₹',
        payoutStatus: referral.payoutStatus || 'Pending Admin Contact',
        contactPhone,
        nextStep: 'Admin will call you directly to deliver your reward out of the app.',
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
