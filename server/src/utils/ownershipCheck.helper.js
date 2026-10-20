/**
 * Ownership Validation Helper
 * Protects platform integrity by preventing property owners and developers from:
 * - Buying or Renting their own properties
 * - Submitting Token Booking requests on their own properties
 * - Submitting enquiries to their own listings
 * - Submitting ratings or reviews to their own listings or profiles
 * - Scheduling site visits for their own listings
 */

function cleanPhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/[^0-9]/g, '').slice(-10);
}

function cleanEmail(email) {
  if (!email) return '';
  return String(email).trim().toLowerCase();
}

/**
 * Checks if a user / guest applicant is the owner of a property.
 * Checks:
 * 1. Authenticated User ID (req.user._id vs property.owner)
 * 2. Passed User ID (payload.userId, buyerId, etc.)
 * 3. Phone number match (user phone or form phone vs owner phone)
 * 4. Email address match (user email or form email vs owner email)
 *
 * @param {Object} property - Property document or object
 * @param {Object} user - Authenticated user (req.user)
 * @param {Object} payload - Request body or query parameters
 * @returns {{ isOwner: boolean, message?: string }}
 */
function checkPropertyOwnership(property, user = null, payload = {}) {
  if (!property) {
    return { isOwner: false };
  }

  const owner = property.owner;
  const ownerId = owner?._id ? owner._id.toString() : (owner ? owner.toString() : null);

  // 1. Authenticated User ID check
  if (user && user._id && ownerId) {
    if (ownerId === user._id.toString()) {
      return {
        isOwner: true,
        message: 'Action not allowed: You are the owner of this property listing. Owners cannot buy, rent, book tokens, send enquiries, or review their own properties.',
      };
    }
  }

  // 2. Caller-passed User ID check
  const candidateUserId = payload.userId || payload.buyerId || payload.applicantId || payload.client;
  if (candidateUserId && ownerId) {
    if (ownerId === candidateUserId.toString()) {
      return {
        isOwner: true,
        message: 'Action not allowed: You are the owner of this property listing. Owners cannot buy, rent, book tokens, send enquiries, or review their own properties.',
      };
    }
  }

  // 3. Contact Phone & Email checks (against populated owner or property contact)
  const callerPhone = cleanPhone(user?.phone || payload.phone || payload.personalDetails?.phone);
  const callerEmail = cleanEmail(user?.email || payload.email || payload.personalDetails?.email);

  const ownerPhone = cleanPhone(owner?.phone || property.contactPhone || property.phone);
  const ownerEmail = cleanEmail(owner?.email || property.contactEmail || property.email);

  if (callerPhone && ownerPhone && callerPhone === ownerPhone) {
    return {
      isOwner: true,
      message: 'Action not allowed: The phone number provided matches the owner of this property. Owners cannot buy, rent, book tokens, send enquiries, or review their own properties.',
    };
  }

  if (callerEmail && ownerEmail && callerEmail === ownerEmail) {
    return {
      isOwner: true,
      message: 'Action not allowed: The email address provided matches the owner of this property. Owners cannot buy, rent, book tokens, send enquiries, or review their own properties.',
    };
  }

  return { isOwner: false };
}

/**
 * Checks if caller is the developer/builder of a developer profile.
 *
 * @param {Object} developer - Developer document or User object
 * @param {Object} user - Authenticated user (req.user)
 * @param {Object} payload - Request body or query parameters
 * @returns {{ isOwner: boolean, message?: string }}
 */
function checkDeveloperOwnership(developer, user = null, payload = {}) {
  if (!developer) return { isOwner: false };

  const devId = developer._id ? developer._id.toString() : developer.toString();
  if (user && user._id && devId === user._id.toString()) {
    return {
      isOwner: true,
      message: 'Action not allowed: You cannot perform this action on your own developer profile.',
    };
  }

  const callerPhone = cleanPhone(user?.phone || payload.phone);
  const callerEmail = cleanEmail(user?.email || payload.email);
  const devPhone = cleanPhone(developer.phone);
  const devEmail = cleanEmail(developer.email);

  if (callerPhone && devPhone && callerPhone === devPhone) {
    return {
      isOwner: true,
      message: 'Action not allowed: Your phone number matches this developer profile.',
    };
  }

  if (callerEmail && devEmail && callerEmail === devEmail) {
    return {
      isOwner: true,
      message: 'Action not allowed: Your email address matches this developer profile.',
    };
  }

  return { isOwner: false };
}

module.exports = {
  checkPropertyOwnership,
  checkDeveloperOwnership,
  cleanPhone,
  cleanEmail,
};
