import React, { useEffect } from 'react';
import { ShieldAlert, X, Ban, AlertTriangle, Check, ArrowRight, Home } from 'lucide-react';
import { OWNER_RESTRICTION_CONFIG } from '../../utils/ownership';

/**
 * OwnerActionBlockedModal
 * Displays a high-fidelity popup alert when a property owner attempts to:
 * - Buy their own property
 * - Rent their own property
 * - Submit a token booking request
 * - Submit a lead enquiry
 * - Post a rating or review
 * - Schedule a site visit
 */
export default function OwnerActionBlockedModal({
  isOpen,
  onClose,
  property = null,
  actionType = 'buy', // 'buy' | 'rent' | 'token' | 'enquiry' | 'review' | 'visit'
  customMessage = '',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const config = OWNER_RESTRICTION_CONFIG[actionType] || OWNER_RESTRICTION_CONFIG.buy;
  const propertyTitle = property?.title || 'Selected Property';
  const propertyLocation = property?.location || property?.city || '';
  const priceLabel = property?.priceLabel || (property?.price ? `₹${Number(property.price).toLocaleString()}` : '');

  const rulesList = [
    { title: 'Buy & Rent', desc: 'Owners cannot purchase or rent their own listings', blocked: actionType === 'buy' || actionType === 'rent' },
    { title: 'Token Booking', desc: 'No token deposits allowed on owned properties', blocked: actionType === 'token' },
    { title: 'Lead Enquiries', desc: 'Cannot submit customer leads or enquiries to yourself', blocked: actionType === 'enquiry' },
    { title: 'Ratings & Reviews', desc: 'Self-reviews and self-ratings are strictly blocked', blocked: actionType === 'review' },
    { title: 'Site Visits', desc: 'Buyer visit appointments cannot be booked by the owner', blocked: actionType === 'visit' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-rose-100 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="owner-blocked-title"
      >
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="p-5 sm:p-7 space-y-5">
          {/* Header Icon & Badges */}
          <div className="flex items-start gap-4">
            <div className="w-13 h-13 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert size={28} className="animate-pulse" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-100/80 text-rose-800 border border-rose-200">
                <Ban size={11} className="text-rose-600" />
                <span>{config.badge}</span>
              </div>
              <h3 id="owner-blocked-title" className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
                {config.heading}
              </h3>
            </div>
          </div>

          {/* Property Context Snippet */}
          {property && (
            <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/80 flex items-center justify-between text-xs">
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-1 text-gray-500 text-[11px]">
                  <Home size={12} className="shrink-0" />
                  <span>Target Listing:</span>
                </div>
                <p className="font-semibold text-gray-900 truncate">{propertyTitle}</p>
                {propertyLocation && <p className="text-[11px] text-gray-500 truncate">{propertyLocation}</p>}
              </div>
              {priceLabel && (
                <span className="font-bold text-gray-800 shrink-0 px-2.5 py-1 bg-white rounded-lg border border-gray-200 shadow-2xs">
                  {priceLabel}
                </span>
              )}
            </div>
          )}

          {/* Description */}
          <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200/70 text-xs sm:text-[13px] text-rose-950 leading-relaxed space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
              <p>
                {customMessage || config.description}
              </p>
            </div>
            <p className="text-[11px] text-rose-700 pl-6 font-medium">
              GharMB verifies ownership by User ID, phone number, and email. You are identified as the owner/creator of this listing.
            </p>
          </div>

          {/* Disallowed Rules Summary */}
          <div className="space-y-2">
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-gray-500">
              Platform Rules for Property Owners:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {rulesList.map((rule, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg border flex items-start gap-2 ${
                    rule.blocked
                      ? 'bg-rose-50/70 border-rose-300 text-rose-900 font-semibold'
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  <Ban size={13} className={rule.blocked ? 'text-rose-600 shrink-0 mt-0.5' : 'text-gray-400 shrink-0 mt-0.5'} />
                  <div>
                    <span className="block leading-tight">{rule.title}</span>
                    <span className="text-[10px] text-gray-500 leading-tight block">{rule.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guidance Note */}
          <div className="text-[11.5px] text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-200/80 leading-relaxed">
            💡 <strong>Need to manage this listing?</strong> You can view inquiries, manage token requests, or edit property information directly in your Owner Dashboard.
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-900 hover:bg-black text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md active:scale-[0.99] cursor-pointer text-center"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
