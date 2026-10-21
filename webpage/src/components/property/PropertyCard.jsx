import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, BedDouble, Maximize2, MapPin, ArrowRight, Zap, Star, MessageSquare, ShieldAlert, ShoppingCart, Ban, Building2 } from 'lucide-react';
import TokenRequestModal from './TokenRequestModal';
import PropertyEnquiryModal from './PropertyEnquiryModal';
import PropertyReviewModal from './PropertyReviewModal';
import OwnerActionBlockedModal from '../common/OwnerActionBlockedModal';
import SmoothImage from '../common/SmoothImage';
import { isOwnerOfProperty } from '../../utils/ownership';

export default function PropertyCard({ property }) {
  const { title, location, type, bedrooms, area, priceLabel, status, image, badge, listingType } = property;

  // Modal open states
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Owner action blocked popup modal state
  const [blockedModalState, setBlockedModalState] = useState({
    isOpen: false,
    actionType: 'buy',
    message: '',
  });

  const isRental = listingType === 'rent' || badge?.toLowerCase().includes('rent');
  const ratingValue = Number(property.rating || property.averageRating || 0);
  const reviewsCountValue = Number(property.reviewsCount || property.totalRatings || 0);

  // 🏷️ Check if property is marked Sold Out
  const isSoldOut = Boolean(
    property.isSold ||
    property.saleStatus === 'sold' ||
    status === 'sold' ||
    status === 'Sold' ||
    badge?.toLowerCase().includes('sold')
  );

  // 🛡️ Determine if current visitor is the owner of this property
  const isOwner = isOwnerOfProperty(property);

  // Handler for actions that owners or sold-out status forbid
  const handleProtectedAction = (actionType, e) => {
    if (e) e.preventDefault();

    if (isSoldOut && actionType !== 'review') {
      return;
    }

    if (isOwner) {
      // 🚫 SHOW POPUP ALERT FOR OWNER
      setBlockedModalState({
        isOpen: true,
        actionType,
        message: property.ownerRestrictionMessage || '',
      });
      return;
    }

    // Allowed for genuine buyers / tenants
    if (actionType === 'token' || actionType === 'rent' || actionType === 'buy') {
      setShowTokenModal(true);
    } else if (actionType === 'enquiry') {
      setShowEnquiryModal(true);
    } else if (actionType === 'review') {
      setShowReviewModal(true);
    }
  };

  return (
    <>
      <div className={`group bg-white border ${isOwner ? 'border-amber-300 ring-1 ring-amber-200' : 'border-border'} rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between relative`}>
        <div>
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <SmoothImage
              src={image}
              alt={title}
              className={`w-full h-full object-cover transition-transform duration-500 ease-out ${
                isSoldOut ? 'grayscale-[45%] opacity-90' : 'group-hover:scale-[1.03]'
              }`}
              containerClassName="w-full h-full"
            />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
              {/* SOLD OUT Badge */}
              {isSoldOut && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-extrabold bg-rose-600 text-white shadow-lg border border-rose-700 tracking-wide uppercase animate-in fade-in">
                  <Ban size={12} strokeWidth={2.5} />
                  Sold Out
                </span>
              )}

              {/* Owner Status Tag */}
              {isOwner && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-white shadow-md border border-amber-400">
                  <ShieldAlert size={12} />
                  Your Listing (Owner)
                </span>
              )}

              {/* Developer / Builder Badge */}
              {(property.postedByRole === 'Builder' || property.role === 'builder' || property.isDeveloper) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-brand text-white shadow-md border border-brand-dark">
                  <Building2 size={12} />
                  {property.developerName || 'Direct Developer'}
                </span>
              )}

              {badge && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  status === 'premium'
                    ? 'bg-[#17202A] text-white'
                    : isRental
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white/90 backdrop-blur-sm text-brand'
                }`}>
                  <BadgeCheck size={13} />
                  {badge}
                </span>
              )}
            </div>

            {/* Rating Badge (Clickable to trigger Review) */}
            <button
              type="button"
              onClick={(e) => handleProtectedAction('review', e)}
              title={isOwner ? "Owner self-reviews are disabled" : "Rate & review this property"}
              className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-white/95 backdrop-blur-xs text-amber-600 shadow-xs border border-amber-200/60 hover:bg-amber-50 cursor-pointer transition-colors"
            >
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span>{ratingValue > 0 ? ratingValue.toFixed(1) : 'Rate'}</span>
              {reviewsCountValue > 0 && (
                <span className="text-[10px] text-gray-500 font-normal">({reviewsCountValue})</span>
              )}
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-5">
            <h3 className="text-base font-semibold text-text-primary leading-snug mb-1">
              {title}
            </h3>
            <p className="flex items-center gap-1 text-sm text-text-secondary mb-3">
              <MapPin size={13} className="text-text-muted shrink-0" />
              {location}
            </p>

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-text-muted mb-4">
              <span className="flex items-center gap-1">
                <BedDouble size={13} />
                {bedrooms} BHK
              </span>
              <span className="w-px h-3 bg-border" />
              <span className="flex items-center gap-1">
                <Maximize2 size={12} />
                {area} sq ft
              </span>
              <span className="w-px h-3 bg-border" />
              <span>{type}</span>
            </div>

            {/* Price & Primary Action */}
            <div className="flex items-center justify-between pt-3 border-t border-border-soft">
              <span className="text-lg font-bold text-text-primary">{priceLabel}</span>

              <div className="flex items-center gap-1.5">
                {/* Buy / Rent Direct Trigger */}
                {isSoldOut ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 cursor-not-allowed select-none">
                    <Ban size={11} className="text-rose-600" />
                    <span>Sold Out</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleProtectedAction(isRental ? 'rent' : 'buy', e)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      isOwner
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        : 'bg-brand/10 text-brand hover:bg-brand hover:text-white'
                    }`}
                    title={isOwner ? `Owners cannot ${isRental ? 'rent' : 'buy'} this property` : `${isRental ? 'Rent' : 'Buy'} Property`}
                  >
                    {isOwner && <Ban size={11} className="text-rose-600" />}
                    <span>{isRental ? 'Rent' : 'Buy'}</span>
                  </button>
                )}

                <Link
                  to="/properties"
                  className="inline-flex items-center gap-0.5 text-xs font-medium text-gray-500 hover:text-brand transition-colors p-1"
                >
                  View
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Quick Actions (Inquiry & Review) */}
            <div className="flex items-center gap-2 pt-2.5 mt-2 border-t border-gray-100 text-[11px]">
              {isSoldOut ? (
                <div className="flex-1 py-1.5 px-2 rounded-lg bg-rose-50 text-rose-700 font-bold flex items-center justify-center gap-1 border border-rose-200 select-none">
                  <Ban size={11} className="text-rose-600" />
                  <span>Site Sold Out</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => handleProtectedAction('enquiry', e)}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-brand/10 hover:bg-brand hover:text-white text-brand font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                  title="Send inquiry directly to GharMB Admin"
                >
                  <MessageSquare size={12} />
                  <span>Inquiry Now</span>
                </button>
              )}

              <button
                type="button"
                onClick={(e) => handleProtectedAction('review', e)}
                className="py-1.5 px-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Star size={11} className="text-amber-500" />
                <span>Review</span>
              </button>
            </div>
          </div>
        </div>

        {/* ⚡ 1-Click Token Request CTA */}
        {isRental && !isSoldOut && (
          <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0">
            <div className={`p-2.5 rounded-xl flex items-center justify-between gap-2 border ${
              isOwner
                ? 'bg-rose-50/60 border-rose-200'
                : 'bg-emerald-50/70 border-emerald-100'
            }`}>
              <div>
                <span className="text-[10px] text-gray-500 block leading-tight">Token via Admin</span>
                <span className={`text-xs font-bold ${isOwner ? 'text-gray-700' : 'text-emerald-700'}`}>
                  ₹{(property.tokenAmount || 2000).toLocaleString()}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => handleProtectedAction('token', e)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-xs active:scale-95 cursor-pointer ${
                  isOwner
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-brand hover:bg-brand-dark text-white'
                }`}
              >
                {isOwner ? <Ban size={12} /> : <Zap size={12} />}
                <span>{isOwner ? 'Owner Blocked' : 'Request Token'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ⚡ TOKEN REQUEST MODAL (Non-owners) */}
      <TokenRequestModal
        property={property}
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
      />

      {/* 📩 PROPERTY ENQUIRY MODAL (Non-owners) */}
      <PropertyEnquiryModal
        property={property}
        isOpen={showEnquiryModal}
        onClose={() => setShowEnquiryModal(false)}
      />

      {/* ⭐ PROPERTY REVIEW MODAL (Non-owners) */}
      <PropertyReviewModal
        property={property}
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
      />

      {/* 🛡️ OWNER ACTION RESTRICTION ALERT POPUP MODAL */}
      <OwnerActionBlockedModal
        isOpen={blockedModalState.isOpen}
        onClose={() => setBlockedModalState({ ...blockedModalState, isOpen: false })}
        property={property}
        actionType={blockedModalState.actionType}
        customMessage={blockedModalState.message}
      />
    </>
  );
}
