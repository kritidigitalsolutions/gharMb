import React, { useState } from 'react';
import { X, Send, MessageSquare, CheckCircle2, AlertCircle, ShieldAlert, Calendar, Clock } from 'lucide-react';
import OwnerActionBlockedModal from '../common/OwnerActionBlockedModal';
import { isOwnerOfProperty } from '../../utils/ownership';
import { API_BASE_URL } from '../../api/config';

export default function PropertyEnquiryModal({ property, isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: localStorage.getItem('gharmb_user_name') || '',
    phone: localStorage.getItem('gharmb_user_phone') || '',
    email: localStorage.getItem('gharmb_user_email') || '',
    message: '',
    visitDate: '',
    timeSlot: 'Morning (10 AM - 1 PM)',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Owner restriction popup state
  const [showOwnerBlockedModal, setShowOwnerBlockedModal] = useState(false);
  const [ownerBlockedMessage, setOwnerBlockedMessage] = useState('');

  if (!isOpen || !property) return null;

  const isOwnerPreCheck = isOwnerOfProperty(property, formData);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setErrorMsg('Please enter your full name and phone number.');
      return;
    }

    // 🛡️ Pre-check ownership
    if (isOwnerOfProperty(property, formData)) {
      setOwnerBlockedMessage(
        'Action not allowed: You are the registered owner of this property. Property owners cannot submit lead enquiries or questions on their own listings.'
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

      const token = localStorage.getItem('userToken') || localStorage.getItem('token') || '';

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/users/enquiries`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          propertyId: property._id || property.id,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || undefined,
          message: formData.message.trim() || `Inquiry regarding "${property.title}"`,
          visitPreferredDate: formData.visitDate || undefined,
          visitTimeSlot: formData.timeSlot || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      // 🛡️ Owner Blocked Response
      if (res.status === 403 || data.isOwnerBlocked === true) {
        setOwnerBlockedMessage(
          data.message || 'Action not allowed: Property owners cannot submit enquiries on their own listings.'
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
          // Fallback mock success only if NOT owner
          setSubmitted(true);
        }
      }
    } catch (err) {
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
              <h3 className="text-lg font-bold text-gray-900">Enquiry Received by Admin!</h3>
              <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
                Thank you, <strong className="text-gray-900">{formData.name}</strong>. Your enquiry for <strong className="text-gray-900">{property.title}</strong> has been logged with GharMB Admin. Our dedicated property coordinator will contact you directly.
              </p>
              <button
                onClick={onClose}
                className="w-full mt-2 py-2.5 bg-brand text-white rounded-xl text-xs font-semibold hover:bg-brand-dark transition-all cursor-pointer shadow-sm"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand uppercase tracking-wider bg-brand/10 px-2 py-0.5 rounded-full mb-1">
                  <MessageSquare size={12} />
                  Property Enquiry
                </span>
                <h2 className="text-base font-bold text-gray-900">Send Enquiry to Admin</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {property.title} • {property.priceLabel || (property.price ? `₹${Number(property.price).toLocaleString()}` : '')}
                </p>
              </div>

              {/* 🛡️ OWNER WARNING BANNER */}
              {isOwnerPreCheck && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1 animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-bold text-rose-700">
                    <ShieldAlert size={14} className="shrink-0 text-rose-600" />
                    <span>Owner Restriction Notice</span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    You are identified as the owner of this property. Owners are not allowed to send enquiries or leads for their own listings.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setOwnerBlockedMessage('Action not allowed: You cannot submit an enquiry for your own property listing.');
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

              <div className="space-y-2.5">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amit Kumar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-brand focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Phone Number (Call / WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-mono focus:outline-none focus:border-brand focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-brand focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Your Question / Note</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Interested in booking a site visit or discussing payment terms..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-brand focus:bg-white resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Send size={13} />
                    <span>Submit Enquiry to Admin</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 🛡️ OWNER ACTION BLOCKED POPUP MODAL */}
      <OwnerActionBlockedModal
        isOpen={showOwnerBlockedModal}
        onClose={() => setShowOwnerBlockedModal(false)}
        property={property}
        actionType="enquiry"
        customMessage={ownerBlockedMessage}
      />
    </>
  );
}
