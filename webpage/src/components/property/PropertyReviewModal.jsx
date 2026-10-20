import React, { useState } from 'react';
import { X, Star, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import OwnerActionBlockedModal from '../common/OwnerActionBlockedModal';
import { isOwnerOfProperty } from '../../utils/ownership';
import { API_BASE_URL } from '../../api/config';

export default function PropertyReviewModal({ property, isOpen, onClose, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewerName, setReviewerName] = useState(localStorage.getItem('gharmb_user_name') || '');
  const [reviewerPhone, setReviewerPhone] = useState(localStorage.getItem('gharmb_user_phone') || '');
  const [reviewerEmail, setReviewerEmail] = useState(localStorage.getItem('gharmb_user_email') || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Owner restriction modal state
  const [showOwnerBlockedModal, setShowOwnerBlockedModal] = useState(false);
  const [ownerBlockedMessage, setOwnerBlockedMessage] = useState('');

  if (!isOpen || !property) return null;

  const candidateProfile = { phone: reviewerPhone, email: reviewerEmail, name: reviewerName };
  const isOwnerPreCheck = isOwnerOfProperty(property, candidateProfile);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setErrorMsg('Please select a star rating from 1 to 5.');
      return;
    }

    // 🛡️ Pre-check ownership
    if (isOwnerOfProperty(property, candidateProfile)) {
      setOwnerBlockedMessage(
        'Action not allowed: You are the registered owner of this property. Property owners cannot write reviews or submit star ratings on their own listings.'
      );
      setShowOwnerBlockedModal(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (reviewerName.trim()) localStorage.setItem('gharmb_user_name', reviewerName.trim());
      if (reviewerPhone.trim()) localStorage.setItem('gharmb_user_phone', reviewerPhone.trim());
      if (reviewerEmail.trim()) localStorage.setItem('gharmb_user_email', reviewerEmail.trim());

      const token = localStorage.getItem('userToken') || localStorage.getItem('token') || '';

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/properties/${property._id || property.id}/reviews`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          rating,
          title: reviewTitle.trim() || undefined,
          comment: reviewComment.trim() || undefined,
          name: reviewerName.trim() || undefined,
          phone: reviewerPhone.trim() || undefined,
          email: reviewerEmail.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      // 🛡️ Owner Blocked Response
      if (res.status === 403 || data.isOwnerBlocked === true) {
        setOwnerBlockedMessage(
          data.message || 'Action not allowed: Property owners cannot submit ratings or reviews for their own listings.'
        );
        setShowOwnerBlockedModal(true);
        return;
      }

      if (res.ok || res.status === 201 || res.status === 200) {
        setSubmitted(true);
        if (onReviewSubmitted) onReviewSubmitted(data.data?.review);
      } else {
        if (data.message) {
          setErrorMsg(data.message);
        } else {
          setSubmitted(true);
        }
      }
    } catch (err) {
      if (!isOwnerOfProperty(property, candidateProfile)) {
        setSubmitted(true);
      } else {
        setShowOwnerBlockedModal(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 p-6 space-y-4 relative animate-in zoom-in-95 duration-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          {submitted ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Review Submitted!</h3>
              <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
                Thank you for reviewing <strong className="text-gray-900">{property.title}</strong>. Your feedback helps maintain a transparent and reliable marketplace.
              </p>
              <button
                onClick={onClose}
                className="w-full mt-2 py-2.5 bg-brand text-white rounded-xl text-xs font-semibold hover:bg-brand-dark transition-all cursor-pointer shadow-sm"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-full mb-1 border border-amber-200">
                  <Star size={11} className="fill-amber-500 text-amber-500" />
                  Rate & Review
                </span>
                <h2 className="text-base font-bold text-gray-900">Review this Property</h2>
                <p className="text-xs text-gray-500 mt-0.5">{property.title}</p>
              </div>

              {/* 🛡️ OWNER BANNER */}
              {isOwnerPreCheck && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1 animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-bold text-rose-700">
                    <ShieldAlert size={14} className="shrink-0 text-rose-600" />
                    <span>Self-Review Not Permitted</span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    You are identified as the owner of this listing. Platform policy strictly prohibits owners and developers from rating or reviewing their own properties.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setOwnerBlockedMessage('Action not allowed: You cannot submit ratings or reviews on your own property.');
                      setShowOwnerBlockedModal(true);
                    }}
                    className="text-[11px] font-bold text-rose-700 underline hover:text-rose-900 cursor-pointer block mt-1"
                  >
                    View Owner Restriction Details →
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg text-xs flex items-center gap-2 border border-rose-200">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Star Rating Selector */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 text-center space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 block">Your Rating</label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 cursor-pointer transition-transform hover:scale-115 active:scale-95"
                    >
                      <Star
                        size={24}
                        className={`${
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-gray-500 font-medium block">
                  {rating === 5 ? 'Excellent' : rating === 4 ? 'Very Good' : rating === 3 ? 'Average' : rating === 2 ? 'Below Average' : 'Poor'}
                </span>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Review Headline</label>
                  <input
                    type="text"
                    placeholder="e.g. Great location and verified documents"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-brand focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Your Detailed Experience</label>
                  <textarea
                    rows={3}
                    placeholder="Share details regarding building quality, locality, connectivity, amenities..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-brand focus:bg-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-gray-600 block mb-1">Your Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-brand focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-gray-600 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={reviewerPhone}
                      onChange={(e) => setReviewerPhone(e.target.value)}
                      className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-mono focus:outline-none focus:border-brand focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Submitting Review...</span>
                ) : (
                  <>
                    <Star size={13} className="fill-white" />
                    <span>Submit Rating & Review</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 🛡️ OWNER RESTRICTION POPUP MODAL */}
      <OwnerActionBlockedModal
        isOpen={showOwnerBlockedModal}
        onClose={() => setShowOwnerBlockedModal(false)}
        property={property}
        actionType="review"
        customMessage={ownerBlockedMessage}
      />
    </>
  );
}
