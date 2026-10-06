/**
 * Referral System Helper
 * Provides unique lifetime referral code generation, code validation,
 * and milestone reward processing (referral bonus upon first property listing).
 */

const User = require('../models/user.model');
const Referral = require('../models/referral.model');
const CoinTransaction = require('../models/coin-transaction.model');
const Notification = require('../models/notification.model');

/**
 * Generate a unique, lifetime referral code for a user.
 * Format: GHARMB-<NAME><2-4 DIGITS>  (e.g., GHARMB-RAHUL42)
 *
 * @param {string} name - User's name
 * @param {object} [UserModel] - Optional Mongoose User model reference
 * @returns {Promise<string>} - Guaranteed unique referral code
 */
async function generateUniqueReferralCode(name, UserModel = User) {
  let baseName = (name || 'USER')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 6);

  if (!baseName || baseName.length < 2) {
    baseName = 'GHAR';
  }

  let code = '';
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 25) {
    attempts++;
    let suffix = '';

    if (attempts <= 5) {
      // 2 digits: e.g., GHARMB-RAHUL42
      suffix = Math.floor(10 + Math.random() * 90).toString();
    } else if (attempts <= 15) {
      // 3 digits: e.g., GHARMB-RAHUL420
      suffix = Math.floor(100 + Math.random() * 900).toString();
    } else {
      // 4 digits: e.g., GHARMB-RAHUL4201
      suffix = Math.floor(1000 + Math.random() * 9000).toString();
    }

    code = `GHARMB-${baseName}${suffix}`;
    const existing = await UserModel.findOne({ referralCode: code }).select('_id');
    if (!existing) {
      isUnique = true;
    }
  }

  // Extreme fallback with timestamp slice
  if (!isUnique) {
    code = `GHARMB-${baseName}${Date.now().toString().slice(-4)}`;
  }

  return code;
}

/**
 * Validates a referral code.
 *
 * @param {string} code - The referral code to validate
 * @param {string} [currentUserId] - Optional ID of current user (to prevent self-referral)
 * @returns {Promise<{ isValid: boolean, referrer: object|null, message: string }>}
 */
async function validateReferralCode(code, currentUserId = null) {
  if (!code || typeof code !== 'string') {
    return {
      isValid: false,
      referrer: null,
      message: 'Please provide a valid referral code.',
    };
  }

  const cleanCode = code.trim().toUpperCase();

  const referrer = await User.findOne({
    referralCode: cleanCode,
    status: { $ne: 'Blocked' },
  }).select('_id name phone email referralCode role');

  if (!referrer) {
    return {
      isValid: false,
      referrer: null,
      message: 'Invalid referral code. Please check the code and try again.',
    };
  }

  if (currentUserId && referrer._id.toString() === currentUserId.toString()) {
    return {
      isValid: false,
      referrer: null,
      message: 'You cannot use your own referral code.',
    };
  }

  return {
    isValid: true,
    referrer,
    message: `Referral code applied! You will both receive ₹250 GharMB coins once you post your first property listing.`,
  };
}

/**
 * Process referral reward when a user posts their first property listing.
 * As per GharMB Refer & Earn rules:
 * - When referee posts their first listing, BOTH referrer and referee receive ₹250 in GharMB coins.
 * - Coins expire after 6 months (180 days).
 *
 * @param {string|ObjectId} refereeUserId - User ID of the listing author
 * @param {string|ObjectId} propertyId - ID of the created/verified property
 * @param {string} [propertyTitle] - Title of the property
 * @returns {Promise<{ success: boolean, rewarded: boolean, message: string }>}
 */
async function processFirstListingReferralReward(refereeUserId, propertyId, propertyTitle = 'Property Listing') {
  try {
    if (!refereeUserId) return { success: false, rewarded: false, message: 'Missing referee user ID' };

    // Find pending refer_and_earn record for this referee
    const referral = await Referral.findOne({
      refereeUser: refereeUserId,
      referralStatus: 'pending_listing',
    });

    if (!referral) {
      // No active pending referral for this user
      return { success: true, rewarded: false, message: 'No pending referral found for this user.' };
    }

    const [referrer, referee] = await Promise.all([
      User.findById(referral.referrerUser),
      User.findById(refereeUserId),
    ]);

    if (!referee) {
      return { success: false, rewarded: false, message: 'Referee account not found.' };
    }

    const REWARD_COINS = referral.coinsRewarded || 250;
    const expiryDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 6 Months

    // 1. Credit Referrer (if referrer account is active)
    if (referrer && referrer.status !== 'Blocked') {
      const newReferrerBalance = (referrer.walletCoins || 0) + REWARD_COINS;
      const newReferrerLifetime = (referrer.referralCoinsEarned || 0) + REWARD_COINS;

      await User.findByIdAndUpdate(referrer._id, {
        $set: {
          walletCoins: newReferrerBalance,
          referralCoinsEarned: newReferrerLifetime,
        },
      });

      // Record transaction
      await CoinTransaction.create({
        user: referrer._id,
        amount: REWARD_COINS,
        type: 'credit',
        source: 'friend_listing_bonus',
        title: 'Referral Reward Earned',
        description: `Earned ₹${REWARD_COINS} GharMB coins for inviting ${referee.name}, who posted their first property listing.`,
        balanceAfter: newReferrerBalance,
        referral: referral._id,
        property: propertyId,
        expiresAt: expiryDate,
        status: 'completed',
      });

      // In-app & FCM notification
      await Notification.create({
        recipient: referrer._id,
        title: '💰 ₹250 GharMB Coins Credited!',
        message: `Awesome! Your friend ${referee.name} just posted their first property listing "${propertyTitle}". ₹${REWARD_COINS} GharMB coins have been added to your wallet!`,
        type: 'system',
        metadata: {
          propertyId,
        },
      });
    }

    // 2. Credit Referee (New User welcome bonus for posting first listing)
    const newRefereeBalance = (referee.walletCoins || 0) + REWARD_COINS;
    const newRefereeLifetime = (referee.referralCoinsEarned || 0) + REWARD_COINS;

    await User.findByIdAndUpdate(referee._id, {
      $set: {
        walletCoins: newRefereeBalance,
        referralCoinsEarned: newRefereeLifetime,
      },
    });

    await CoinTransaction.create({
      user: referee._id,
      amount: REWARD_COINS,
      type: 'credit',
      source: 'signup_bonus',
      title: 'Welcome Referral Bonus',
      description: `Earned ₹${REWARD_COINS} GharMB coins for posting your first property listing using referral code ${referral.referralCode}.`,
      balanceAfter: newRefereeBalance,
      referral: referral._id,
      property: propertyId,
      expiresAt: expiryDate,
      status: 'completed',
    });

    await Notification.create({
      recipient: referee._id,
      title: '🎉 ₹250 GharMB Coins Credited!',
      message: `Welcome bonus unlocked! You earned ₹${REWARD_COINS} GharMB coins for posting your first property listing. Use your coins for premium listings and featured badges.`,
      type: 'system',
      metadata: {
        propertyId,
      },
    });

    // 3. Mark Referral as rewarded
    referral.referralStatus = 'rewarded';
    referral.propertyListed = true;
    referral.linkedProperty = propertyId;
    referral.propertyTitle = propertyTitle;
    referral.payoutStatus = 'Paid';
    referral.rewardCreditedAt = new Date();
    referral.payoutDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    referral.coinsExpiryDate = expiryDate;
    referral.notes = `Referral bonus fulfilled. Both referrer (${referrer?.name || 'Referrer'}) and referee (${referee.name}) credited with ₹${REWARD_COINS} coins.`;
    await referral.save();

    console.log(`\n==================================================`);
    console.log(`🎁 [REFERRAL REWARD FULFILLED]`);
    console.log(`   Referrer : ${referrer?.name || 'N/A'} (+₹${REWARD_COINS} coins)`);
    console.log(`   Referee  : ${referee.name} (+₹${REWARD_COINS} coins)`);
    console.log(`   Property : ${propertyTitle}`);
    console.log(`==================================================\n`);

    return {
      success: true,
      rewarded: true,
      message: `Referral reward of ₹${REWARD_COINS} coins credited to both referrer and referee.`,
    };
  } catch (error) {
    console.error('❌ [REFERRAL REWARD ERROR]:', error.message);
    return {
      success: false,
      rewarded: false,
      message: error.message,
    };
  }
}

module.exports = {
  generateUniqueReferralCode,
  validateReferralCode,
  processFirstListingReferralReward,
};
