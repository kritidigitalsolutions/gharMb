/**
 * Verification Helper Utility
 * Computes standardized verification status, badges, messages, and details
 * for Agents, Builders/Developers, Owners, Buyers, Tenants, and General Users.
 */

const computeVerificationDetails = (user) => {
  if (!user) return null;
  const role = (user.role || '').toLowerCase();

  let isVerified = Boolean(user.isVerified);
  let verificationStatus = 'unverified';
  let hasSubmittedDetails = false;
  let isPending = false;
  let isApproved = false;
  let isRejected = false;
  let rejectionReason = null;
  let badge = 'Unverified';
  let message = '';
  let actionRequired = 'submit_details';
  let canPostListings = false;
  let submittedDetails = {};

  if (role === 'agent') {
    const rawStatus = user.agentVerificationStatus || (user.isVerified ? 'approved' : 'unverified');
    verificationStatus = rawStatus;
    isApproved = rawStatus === 'approved';
    isVerified = isApproved;
    isPending = rawStatus === 'pending';
    isRejected = rawStatus === 'rejected';
    rejectionReason = user.agentRejectionReason || null;

    // Check if agent submitted details
    const hasDocs = Boolean(
      user.verificationDocs &&
      (user.verificationDocs.reraCertificate || user.verificationDocs.aadhaarCard || user.verificationDocs.profilePhoto)
    );
    hasSubmittedDetails = Boolean(user.reraNumber || hasDocs || isPending || isApproved || isRejected);

    if (isApproved) {
      badge = 'Verified';
      message = 'Your Agent profile and RERA credentials have been verified and approved by admin. You can now post and manage property listings.';
      actionRequired = 'none';
      canPostListings = true;
    } else if (isPending) {
      badge = 'Pending Verification';
      message = 'Your Agent registration and RERA documents have been submitted and are currently under review by admin. Approval typically takes 24-48 hours.';
      actionRequired = 'wait_for_admin_approval';
      canPostListings = false;
    } else if (isRejected) {
      badge = 'Rejected';
      message = `Your Agent verification was rejected by admin: ${rejectionReason || 'Please review your documents and resubmit.'}`;
      actionRequired = 'resubmit_details';
      canPostListings = false;
    } else {
      badge = 'Unverified';
      message = 'You have not submitted Agent verification details yet. Please register your RERA number and upload credentials.';
      actionRequired = 'submit_details';
      canPostListings = false;
    }

    submittedDetails = {
      role: 'agent',
      reraNumber: user.reraNumber || null,
      experience: user.experience || null,
      cityOfOperation: user.cityOfOperation || null,
      verificationDocs: user.verificationDocs || {},
      agentVerificationStatus: verificationStatus,
      agentRejectionReason: rejectionReason,
    };
  } else if (role === 'builder') {
    const rawStatus = user.builderVerificationStatus || (user.isVerified ? 'approved' : 'unverified');
    verificationStatus = rawStatus;
    isApproved = rawStatus === 'approved';
    isVerified = isApproved;
    isPending = rawStatus === 'pending';
    isRejected = rawStatus === 'rejected';
    rejectionReason = user.builderRejectionReason || null;

    // Check if builder submitted details
    const hasDocs = Boolean(
      user.builderDocs &&
      (user.builderDocs.reraCertificate || user.builderDocs.panCard || user.builderDocs.companyLogo)
    );
    hasSubmittedDetails = Boolean(user.companyName || user.reraNumber || hasDocs || isPending || isApproved || isRejected);

    if (isApproved) {
      badge = 'Verified';
      message = 'Your Builder profile and company credentials have been verified and approved by admin. You can now publish projects and listings.';
      actionRequired = 'none';
      canPostListings = true;
    } else if (isPending) {
      badge = 'Pending Verification';
      message = 'Your Builder company details and documents have been submitted and are currently under review by admin. Approval typically takes 24-48 hours.';
      actionRequired = 'wait_for_admin_approval';
      canPostListings = false;
    } else if (isRejected) {
      badge = 'Rejected';
      message = `Your Builder verification was rejected by admin: ${rejectionReason || 'Please review your company documents and resubmit.'}`;
      actionRequired = 'resubmit_details';
      canPostListings = false;
    } else {
      badge = 'Unverified';
      message = 'You have not submitted Builder verification details yet. Please submit your company details, RERA, and PAN documents.';
      actionRequired = 'submit_details';
      canPostListings = false;
    }

    submittedDetails = {
      role: 'builder',
      companyName: user.companyName || null,
      reraNumber: user.reraNumber || null,
      gstNumber: user.gstNumber || null,
      yearsInBusiness: user.yearsInBusiness || null,
      cityOfOperation: user.cityOfOperation || null,
      isIsoCertified: Boolean(user.isIsoCertified),
      unitsDelivered: user.unitsDelivered || '0',
      bio: user.bio || null,
      builderDocs: user.builderDocs || {},
      builderVerificationStatus: verificationStatus,
      builderRejectionReason: rejectionReason,
    };
  } else {
    // Other roles: owner, buyer, tenant, or general user
    isApproved = Boolean(user.isVerified);
    isVerified = isApproved;

    // Check if basic info or details have been submitted
    const hasAddress = Boolean(user.address?.formattedAddress || user.address?.city || user.address?.street);
    const hasBasicDetails = Boolean(user.isBasicInfoCompleted || (user.name && user.phone && hasAddress));
    hasSubmittedDetails = hasBasicDetails;

    if (isApproved) {
      verificationStatus = 'approved';
      badge = 'Verified';
      message = 'Your account is verified.';
      actionRequired = 'none';
    } else if (hasSubmittedDetails && role === 'owner') {
      verificationStatus = 'pending';
      badge = 'Pending Verification';
      isPending = true;
      message = 'Your profile details have been submitted and are pending verification by admin.';
      actionRequired = 'wait_for_admin_approval';
    } else {
      verificationStatus = 'unverified';
      badge = 'Unverified';
      message = 'Your account is not verified yet. Please complete your profile details.';
      actionRequired = hasSubmittedDetails ? 'wait_for_admin_approval' : 'submit_details';
    }

    canPostListings = role === 'owner' || isApproved;

    submittedDetails = {
      role: user.role || 'user',
      name: user.name || null,
      email: user.email || null,
      phone: user.phone || null,
      address: user.address || {},
      isBasicInfoCompleted: Boolean(user.isBasicInfoCompleted),
      isOnboardingCompleted: Boolean(user.isOnboardingCompleted),
    };
  }

  return {
    isVerified,
    verificationStatus,
    role: user.role || 'user',
    hasSubmittedDetails,
    isPending,
    isApproved,
    isRejected,
    rejectionReason,
    badge,
    message,
    actionRequired,
    canPostListings,
    submittedDetails,
  };
};

module.exports = {
  computeVerificationDetails,
};
