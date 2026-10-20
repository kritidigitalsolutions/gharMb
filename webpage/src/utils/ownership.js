/**
 * Frontend Property Ownership Utility
 * Detects whether the active visitor or stored credentials match the property owner,
 * and formats user-friendly restriction messages for prohibited actions.
 */

export function cleanPhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/[^0-9]/g, '').slice(-10);
}

export function cleanEmail(email) {
  if (!email) return '';
  return String(email).trim().toLowerCase();
}

/**
 * Retrieves the currently active user info from localStorage
 */
export function getStoredUserInfo() {
  try {
    const rawUser = localStorage.getItem('user') || localStorage.getItem('gharmb_user') || localStorage.getItem('adminUser');
    let parsedUser = null;
    if (rawUser) {
      try {
        parsedUser = JSON.parse(rawUser);
      } catch (e) {
        parsedUser = null;
      }
    }

    return {
      id: parsedUser?._id || parsedUser?.id || localStorage.getItem('gharmb_user_id') || null,
      name: parsedUser?.name || parsedUser?.fullName || localStorage.getItem('gharmb_user_name') || '',
      phone: parsedUser?.phone || parsedUser?.mobileNumber || localStorage.getItem('gharmb_user_phone') || '',
      email: parsedUser?.email || localStorage.getItem('gharmb_user_email') || '',
      role: parsedUser?.role || localStorage.getItem('gharmb_user_role') || '',
    };
  } catch (err) {
    return { id: null, name: '', phone: '', email: '', role: '' };
  }
}

/**
 * Checks whether a given property belongs to the candidate user / stored visitor
 *
 * @param {Object} property
 * @param {Object} candidate - optional user object or form input
 * @returns {boolean}
 */
export function isOwnerOfProperty(property, candidate = null) {
  if (!property) return false;

  // 1. Direct server-provided flag
  if (property.isOwner === true) return true;
  if (property.canBuyOrRent === false && property.ownerRestrictionMessage) return true;

  const user = candidate || getStoredUserInfo();
  const owner = property.owner || property.postedBy || {};
  const ownerId = owner._id || owner.id || (typeof property.owner === 'string' ? property.owner : null);

  // 2. ID match
  if (user?.id && ownerId && String(user.id) === String(ownerId)) {
    return true;
  }

  // 3. Phone match
  const userPhone = cleanPhone(user?.phone);
  const ownerPhone = cleanPhone(owner?.phone || property.contactPhone || property.phone);
  if (userPhone && ownerPhone && userPhone === ownerPhone) {
    return true;
  }

  // 4. Email match
  const userEmail = cleanEmail(user?.email);
  const ownerEmail = cleanEmail(owner?.email || property.contactEmail || property.email);
  if (userEmail && ownerEmail && userEmail === ownerEmail) {
    return true;
  }

  return false;
}

/**
 * Action metadata & messages for owner restrictions
 */
export const OWNER_RESTRICTION_CONFIG = {
  buy: {
    actionName: 'Buy Property',
    badge: 'Buy Not Allowed',
    heading: 'Owners Cannot Buy Their Own Property',
    description: 'You are registered as the owner of this property listing. Platform and regulatory guidelines strictly prohibit owners from purchasing their own properties.',
  },
  rent: {
    actionName: 'Rent Property',
    badge: 'Rent Not Allowed',
    heading: 'Owners Cannot Rent Their Own Property',
    description: 'You are registered as the owner/landlord of this property listing. You cannot apply as a tenant or rent your own property.',
  },
  token: {
    actionName: 'Request Token',
    badge: 'Token Booking Blocked',
    heading: 'Owners Cannot Request Booking Tokens',
    description: 'Token booking is reserved for genuine prospective buyers and tenants. As the owner of this property, you cannot deposit or submit token requests to yourself.',
  },
  enquiry: {
    actionName: 'Send Enquiry',
    badge: 'Enquiry Blocked',
    heading: 'Owners Cannot Enquire On Their Own Listing',
    description: 'Enquiries are designed for buyers and tenants seeking information from admin. You cannot generate lead enquiries on your own property.',
  },
  review: {
    actionName: 'Submit Review',
    badge: 'Self-Review Prohibited',
    heading: 'Owners Cannot Review Their Own Listing',
    description: 'To maintain platform credibility and authentic reviews, property owners and developers are not permitted to rate or write reviews for their own listings.',
  },
  visit: {
    actionName: 'Schedule Visit',
    badge: 'Site Visit Blocked',
    heading: 'Owners Cannot Schedule Visits On Own Property',
    description: 'Site visits are arranged by admin for prospective buyers and tenants. Owners cannot schedule visits for their own properties.',
  },
};
