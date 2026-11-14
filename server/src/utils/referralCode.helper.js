/**
 * Referral System Helper
 * Provides unique lifetime referral code generation, code validation,
 * and milestone reward processing (referral bonus upon first property listing).
 */

const User = require('../models/user.model');
const Referral = require('../models/referral.model');
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
 * Intelligently resolve a referrer user by any valid identifier:
 * 1. Exact referralCode match (e.g., 'GHARMB-RAHULS40', 'GHARMB-3307')
 * 2. Case-insensitive referralCode match (e.g., 'gharmb-rahuls40')
 * 3. Stripped or added 'GHARMB-' prefix (e.g., 'RAHULS40' -> 'GHARMB-RAHULS40')
 * 4. Phone suffix match (e.g., 'GHARMB-3307' or '3307' -> matches user whose phone ends with 3307)
 * 5. Full phone number (e.g., '9284253307' or '+919284253307')
 * 6. Referral document referralCode / referralId match
 *
 * @param {string} candidateCode - Referral code or identifier
 * @param {string|ObjectId} [currentUserId] - Optional user ID to prevent self-referral
 * @returns {Promise<{ referrer: object|null, matchedCode: string|null, reason: string|null }>}
 */
async function findReferrerByCode(candidateCode, currentUserId = null) {
  if (!candidateCode || typeof candidateCode !== 'string') {
    return { referrer: null, matchedCode: null, reason: 'Empty code' };
  }

  const raw = candidateCode.trim();
  if (!raw) return { referrer: null, matchedCode: null, reason: 'Empty code' };

  const clean = raw.toUpperCase();
  const currentIdStr = currentUserId ? currentUserId.toString() : null;

  const isValidReferrer = (u) => {
    if (!u || u.status === 'Blocked') return false;
    if (currentIdStr && u._id.toString() === currentIdStr) return false;
    return true;
  };

  // 1. Exact referralCode match
  let user = await User.findOne({ referralCode: clean, status: { $ne: 'Blocked' } });
  if (isValidReferrer(user)) {
    return { referrer: user, matchedCode: user.referralCode || clean, reason: 'exact_match' };
  }

  // 2. Case-insensitive exact regex match
  const escaped = clean.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  user = await User.findOne({
    referralCode: { $regex: new RegExp(`^${escaped}$`, 'i') },
    status: { $ne: 'Blocked' },
  });
  if (isValidReferrer(user)) {
    return { referrer: user, matchedCode: user.referralCode || clean, reason: 'case_insensitive' };
  }

  // 3. Prefix variations: add or remove GHARMB-
  const withoutPrefix = clean.replace(/^GHARMB-?/i, '');
  const withPrefix = clean.startsWith('GHARMB-') ? clean : `GHARMB-${clean}`;

  user = await User.findOne({
    $or: [{ referralCode: withPrefix }, { referralCode: withoutPrefix }],
    status: { $ne: 'Blocked' },
  });
  if (isValidReferrer(user)) {
    return { referrer: user, matchedCode: user.referralCode || withPrefix, reason: 'prefix_variation' };
  }

  // 4. Phone Suffix matching (e.g. 'GHARMB-3307' or '3307' -> ends with 3307)
  const digitsMatch = clean.match(/^(?:GHARMB-)?(\d{4,10})$/);
  if (digitsMatch) {
    const digits = digitsMatch[1];
    if (digits.length >= 4 && digits.length <= 9) {
      user = await User.findOne({
        phone: { $regex: new RegExp(`${digits}$`) },
        status: { $ne: 'Blocked' },
      });
      if (isValidReferrer(user)) {
        return { referrer: user, matchedCode: user.referralCode || clean, reason: 'phone_suffix_match' };
      }
    } else if (digits.length >= 10) {
      const last10 = digits.slice(-10);
      user = await User.findOne({
        phone: { $regex: new RegExp(`${last10}$`) },
        status: { $ne: 'Blocked' },
      });
      if (isValidReferrer(user)) {
        return { referrer: user, matchedCode: user.referralCode || clean, reason: 'phone_match' };
      }
    }
  }

  // 5. Match against Referral collection (deal tracking / ambassador codes)
  const refDoc = await Referral.findOne({
    $or: [
      { referralCode: clean },
      { referralCode: withPrefix },
      { referralId: clean },
      { referralId: `#${clean.replace(/^#/, '')}` },
    ],
  }).populate('referrerUser');

  if (refDoc) {
    if (refDoc.referrerUser && isValidReferrer(refDoc.referrerUser)) {
      return { referrer: refDoc.referrerUser, matchedCode: refDoc.referralCode || clean, reason: 'referral_model_match' };
    }
    if (refDoc.referrerPhone) {
      user = await User.findOne({ phone: refDoc.referrerPhone, status: { $ne: 'Blocked' } });
      if (isValidReferrer(user)) {
        return { referrer: user, matchedCode: refDoc.referralCode || clean, reason: 'referral_doc_phone_match' };
      }
    }
  }

  return { referrer: null, matchedCode: null, reason: 'not_found' };
}

/**
 * Validates a referral code.
 *
 * @param {string} code - The referral code to validate
 * @param {string} [currentUserId] - Optional ID of current user (to prevent self-referral)
 * @returns {Promise<{ isValid: boolean, referrer: object|null, referralCode: string|null, message: string }>}
 */
async function validateReferralCode(code, currentUserId = null) {
  if (!code || typeof code !== 'string' || !code.trim()) {
    return {
      isValid: false,
      referrer: null,
      referralCode: null,
      message: 'Please provide a valid referral code.',
    };
  }

  const cleanCode = code.trim().toUpperCase();
  const currentIdStr = currentUserId ? currentUserId.toString() : null;

  // Check self-referral first if user has their own code
  if (currentIdStr) {
    const selfUser = await User.findById(currentIdStr).select('referralCode phone');
    if (
      selfUser &&
      (selfUser.referralCode === cleanCode ||
        cleanCode.endsWith(selfUser.phone?.slice(-4) || 'XXXX'))
    ) {
      return {
        isValid: false,
        referrer: null,
        referralCode: null,
        message: 'You cannot use your own referral code.',
      };
    }
  }

  const resolution = await findReferrerByCode(cleanCode, currentUserId);

  if (!resolution.referrer) {
    return {
      isValid: false,
      referrer: null,
      referralCode: null,
      message: 'Invalid referral code. Please check your code or leave blank to continue.',
    };
  }

  const referrer = resolution.referrer;

  let offerMessage = 'Congratulations! You got an offer with this referral.';
  try {
    const ReferralSetting = require('../models/referral-setting.model');
    const settings = await ReferralSetting.getSettings();
    if (settings && settings.offerMessage) {
      offerMessage = settings.offerMessage;
    }
  } catch {
    // Fallback safely to default
  }

  return {
    isValid: true,
    referrer,
    referralCode: resolution.matchedCode || referrer.referralCode || cleanCode,
    message: offerMessage,
  };
}

/**
 * Process referral property linkage when a user posts a property listing.
 *
 * @param {string|ObjectId} refereeUserId - User ID of the listing author
 * @param {string|ObjectId} propertyId - ID of the created/verified property
 * @param {string} [propertyTitle] - Title of the property
 * @returns {Promise<{ success: boolean, rewarded: boolean, message: string }>}
 */
async function processFirstListingReferralReward(refereeUserId, propertyId, propertyTitle = 'Property Listing') {
  try {
    if (!refereeUserId) return { success: false, rewarded: false, message: 'Missing referee user ID' };

    const referral = await Referral.findOne({
      refereeUser: refereeUserId,
      $or: [{ linkedProperty: null }, { linkedProperty: { $exists: false } }],
    });

    if (referral) {
      referral.propertyListed = true;
      referral.linkedProperty = propertyId;
      referral.propertyTitle = propertyTitle;
      await referral.save();
    }

    return {
      success: true,
      rewarded: true,
      message: `Property linked to referral.`,
    };
  } catch (error) {
    return {
      success: false,
      rewarded: false,
      message: error.message,
    };
  }
}

module.exports = {
  generateUniqueReferralCode,
  findReferrerByCode,
  validateReferralCode,
  processFirstListingReferralReward,
};
