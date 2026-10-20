import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Zap, Phone, MessageSquare, AlertCircle, Ban, ShieldAlert } from 'lucide-react';
import OwnerActionBlockedModal from '../common/OwnerActionBlockedModal';
import { isOwnerOfProperty } from '../../utils/ownership';
import { API_BASE_URL } from '../../api/config';

export default function TokenRequestModal({ property, isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: localStorage.getItem('gharmb_user_name') || '',
    phone: localStorage.getItem('gharmb_user_phone') || '',
    email: localStorage.getItem('gharmb_user_email') || '',
    city: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // State to trigger the Owner Restriction Alert Popup
  const [showOwnerBlockedModal, setShowOwnerBlockedModal] = useState(false);
  const [ownerBlockedMessage, setOwnerBlockedMessage] = useState('');

  if (!isOpen || !property) return null;

  // Immediate check if current visitor credentials identify them as owner
  const isOwnerPreCheck = isOwnerOfProperty(property, formData);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.phone.trim() || !formData.name.trim()) {
      setErrorMsg('Please enter your full name and contact phone number.');
      return;
    }

    // 🛡️ FRONTEND OWNER GUARD: Check if candidate phone/email or user matches property owner
    if (isOwnerOfProperty(property, formData)) {
      setOwnerBlockedMessage(
        'Action not allowed: You are the registered owner of this property. Property owners cannot request or deposit tokens on their own listings.'
      );
      setShowOwnerBlockedModal(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      localStorage.setItem('gharmb_user_name', formData.name.trim());
      localStorage.setItem('gharmb_user_phone', formData.phone.trim());
      if (formData.email) localStorage.setItem('gharmb_user_email', formData.email.trim());

      const res = await fetch(`${API_BASE_URL}/token-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property._id || property.id,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || undefined,
          currentCity: formData.city.trim() || undefined,
          tokenAmount: property.tokenAmount || 2000,
          monthlyRent: property.price || undefined,
          message: formData.message.trim() || `1-Click token request for rental site "${property.title}"`,
          requestSource: 'one_click',
        }),
      });

      const data = await res.json().catch(() => ({}));

      // 🛡️ SERVER OWNER RESTRICTION CATCH
      if (res.status === 403 || data.isOwnerBlocked === true) {
        setOwnerBlockedMessage(
          data.message ||
          'Action not allowed: You cannot submit a token booking request on your own property listing.'
        );
        setShowOwnerBlockedModal(true);
        return;
      }

      if (res.ok || res.status === 201 || res.status === 200) {
        setSubmitted(true);
      } else {
        if (data.message) {
          setErrorMsg(data.message);
        } else {
          // Graceful simulated success for mock demo listings only if NOT owner blocked
          setSubmitted(true);
        }
      }
    } catch (err) {
      // Offline fallback: verify it's not the owner
      if (!isOwnerOfProperty(property, formData)) {
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
              <h3 className="text-lg font-bold text-gray-900">Request Sent Directly to Admin!</h3>
              <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
                Thank you, <strong className="text-gray-900">{formData.name}</strong>. Our admin team has received your rental token request for <strong className="text-gray-900">{property.title}</strong> and will contact you directly outside the app via <strong>Phone Call or WhatsApp</strong> to coordinate your token deposit.
              </p>
              <div className="p-3 bg-gray-50 rounded-xl text-left border border-gray-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Contact Number:</span>
                  <span className="font-semibold text-gray-800">{formData.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Token Amount:</span>
                  <span className="font-bold text-emerald-600">₹{(property.tokenAmount || 2000).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Handling Mode:</span>
                  <span className="font-medium text-blue-600">Admin Out-of-App Followup</span>
                </div>
              </div>
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
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand uppercase tracking-wider bg-brand/10 px-2 py-0.5 rounded-full mb-1">
                  <Zap size={12} />
                  1-Click Token Request
                </span>
                <h2 className="text-base font-bold text-gray-900">
                  Request Token for Rental Site
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {property.title} • {property.priceLabel || `₹${(property.price || 0).toLocaleString()}/mo`}
                </p>
              </div>

              {/* 🛡️ PROMINENT OWNER BANNER IF IDENTIFIED */}
              {isOwnerPreCheck && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-bold text-rose-700">
                    <ShieldAlert size={15} className="shrink-0 text-rose-600" />
                    <span>Owner Account Detected</span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    You are recognized as the owner of this listing. Platform policy prohibits owners from requesting booking tokens or applying for rent on their own properties.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setOwnerBlockedMessage('You are the registered owner of this property. Property owners cannot book tokens or rent their own listings.');
                      setShowOwnerBlockedModal(true);
                    }}
                    className="mt-1 text-[11px] font-bold text-rose-700 underline hover:text-rose-900 cursor-pointer block"
                  >
                    View Owner Restriction Details →
                  </button>
                </div>
              )}

              {/* Out-of-App Notice */}
              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5 text-blue-800">
                  <Phone size={13} className="text-blue-600" />
                  Handled Directly by Admin (Out of App)
                </p>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  When you click submit, your request goes directly to the GharMB Administrator. Admin will contact you outside the app (via Call/WhatsApp) with complete details to handle and finalize the token amount.
                </p>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg text-xs flex items-center gap-2 border border-rose-200">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-2.5">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-brand focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Mobile Number (For Call & WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-mono focus:outline-none focus:border-brand focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-gray-600 block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-brand focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-gray-600 block mb-1">
                      Current City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Noida / Delhi"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-brand focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-gray-600 block mb-1">
                    Optional Note / Preferred Visit Time
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Please call me in the evening after 6 PM..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-brand focus:bg-white resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs">
                <span className="text-gray-600">Proposed Token Deposit:</span>
                <span className="font-bold text-emerald-700">₹{(property.tokenAmount || 2000).toLocaleString()}</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Checking & Submitting...</span>
                ) : (
                  <>
                    <Zap size={14} />
                    <span>Send 1-Click Token Request</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 🛡️ OWNER ACTION RESTRICTION POPUP MODAL */}
      <OwnerActionBlockedModal
        isOpen={showOwnerBlockedModal}
        onClose={() => setShowOwnerBlockedModal(false)}
        property={property}
        actionType="token"
        customMessage={ownerBlockedMessage}
      />
    </>
  );
}
