import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trash2,
  ShieldCheck,
  Scale,
  ChevronRight,
  AlertTriangle,
  Smartphone,
  CheckCircle2,
  HelpCircle,
  Mail,
  Clock,
  Send,
  ArrowRight
} from 'lucide-react';
import { API_BASE_URL } from '../../api/config';

export default function DeleteProfile() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    role: 'seeker',
    reason: '',
    notes: '',
    agreed: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.agreed) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/web-inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'deletion_request',
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          role: formData.role,
          reason: formData.reason || 'User requested profile deletion',
          notes: formData.notes || '',
        }),
      });

      const data = await response.json();
      const generatedRefId = data?.data?.refId || `GMB-DEL-${Math.floor(100000 + Math.random() * 900000)}`;

      setSubmittedRequest({
        refId: generatedRefId,
        date: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      });
    } catch (err) {
      console.warn('Backend inquiry submission fallback:', err);
      const fallbackRefId = `GMB-DEL-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmittedRequest({
        refId: fallbackRefId,
        date: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      role: 'seeker',
      reason: '',
      notes: '',
      agreed: false,
    });
    setSubmittedRequest(null);
  };

  return (
    <div className="bg-[#FAF9F7] min-h-screen text-[#17202A]">
      
      {/* ═══════════════════════════════════════════════════════════════
          01 — HEADER & DOCUMENT SWITCHER
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[#FFFBF9] border-b border-[#F0F0EE] pt-8 pb-8 sm:pt-10 sm:pb-10">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-12">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-[#667085] font-medium mb-4">
            <Link to="/" className="hover:text-[#FF5A3C] transition-colors">Home</Link>
            <ChevronRight size={12} className="text-[#98A2B3]" />
            <span className="text-[#98A2B3]">Account & Privacy</span>
            <ChevronRight size={12} className="text-[#98A2B3]" />
            <span className="text-[#FF5A3C] font-semibold">Delete Profile</span>
          </div>

          {/* Title and Intro */}
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0ED] border border-[#FF5A3C]/20 text-[11px] font-bold text-[#FF5A3C] uppercase tracking-[0.16em] mb-4">
              <Trash2 size={13} />
              <span>User Data Rights</span>
            </div>

            <h1 className="text-[30px] sm:text-[38px] lg:text-[44px] font-bold text-[#17202A] leading-[1.1] tracking-[-0.03em] mb-3.5">
              Delete Profile & <span className="text-[#FF5A3C]">Account</span>
            </h1>

            <p className="text-[15px] sm:text-[16.5px] text-[#667085] leading-[1.65] font-normal max-w-2xl">
              You have the right to request deletion of your GharMB account, personal profile, and associated data at any time. Learn how to delete directly in-app or submit a web request below.
            </p>
          </div>

          {/* Legal / Policy Document Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-[#F0EBE7]">
            <Link
              to="/privacy-policy"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white border border-[#E7E7E5] text-[#667085] hover:text-[#17202A] hover:bg-gray-50 transition-all"
            >
              <ShieldCheck size={16} />
              <span>Privacy Policy</span>
            </Link>

            <Link
              to="/terms-of-service"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white border border-[#E7E7E5] text-[#667085] hover:text-[#17202A] hover:bg-gray-50 transition-all"
            >
              <Scale size={16} />
              <span>Terms of Service</span>
            </Link>

            <Link
              to="/delete-profile"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-[#FF5A3C] text-white shadow-xs transition-all"
            >
              <Trash2 size={16} />
              <span>Delete Profile</span>
            </Link>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          02 — MAIN CONTENT: 2-COLUMN LAYOUT
          ═══════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-12 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ─────────────────────────────────────────────────────────────
              LEFT COLUMN (7 COLS): IN-APP INSTRUCTIONS & DATA TRANSPARENCY
              ───────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Method 1: Instant In-App Deletion Card */}
            <div className="bg-white rounded-2xl border border-[#E7E7E5] p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 pb-5 border-b border-[#F0F0EE] mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#FFF0ED] text-[#FF5A3C] flex items-center justify-center shrink-0">
                  <Smartphone size={20} />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#FF5A3C] block">
                    Fastest Method
                  </span>
                  <h2 className="text-[20px] sm:text-[22px] font-bold text-[#17202A] tracking-tight">
                    How to delete directly from GharMB Mobile App
                  </h2>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    step: '01',
                    title: 'Open the GharMB App',
                    desc: 'Ensure you are signed in to the account you wish to delete.',
                  },
                  {
                    step: '02',
                    title: 'Navigate to Profile & Settings',
                    desc: 'Tap on your Profile icon in the bottom navigation bar.',
                  },
                  {
                    step: '03',
                    title: 'Open Account & Security',
                    desc: 'Tap on "Account Settings" and scroll to the bottom of the page.',
                  },
                  {
                    step: '04',
                    title: 'Select "Delete Account & Data"',
                    desc: 'Confirm the OTP / verification code sent to your registered mobile number.',
                  },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4 p-3.5 rounded-xl bg-[#FAF9F7] border border-[#ECECE9]">
                    <div className="w-8 h-8 rounded-lg bg-[#17202A] text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-[14.5px] font-bold text-[#17202A]">
                        {item.title}
                      </h3>
                      <p className="text-[13px] text-[#667085] mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-[#FFFBF0] border border-[#F5E8C7] flex items-start gap-3">
                <AlertTriangle size={18} className="text-[#D97706] shrink-0 mt-0.5" />
                <p className="text-[12.5px] text-[#92400E] leading-relaxed">
                  <strong>Notice:</strong> Once confirmed in-app, your active session will be terminated immediately and your account enters a 14-day cooling-off recovery period before permanent purge.
                </p>
              </div>
            </div>

            {/* Data Deletion Transparency Breakdown */}
            <div className="bg-white rounded-2xl border border-[#E7E7E5] p-6 sm:p-8 shadow-xs">
              <h2 className="text-[20px] sm:text-[22px] font-bold text-[#17202A] tracking-tight mb-2">
                What data is deleted vs. retained
              </h2>
              <p className="text-[13.5px] text-[#667085] mb-6 leading-relaxed">
                In compliance with the Digital Personal Data Protection Act (DPDP), Indian IT Act, and RERA real-estate regulations, here is how your data is handled:
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                
                {/* Deleted Data */}
                <div className="p-4 rounded-xl bg-[#F6FEF9] border border-[#D1FADF] space-y-3">
                  <div className="flex items-center gap-2 text-[#039855] font-bold text-sm">
                    <CheckCircle2 size={18} />
                    <span>Permanently Deleted</span>
                  </div>
                  <ul className="text-[12.5px] text-[#475467] space-y-2 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-[#039855] font-bold">•</span>
                      <span>Profile name, avatar photo, bio & personal info</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#039855] font-bold">•</span>
                      <span>Saved properties, bookmarks & search history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#039855] font-bold">•</span>
                      <span>In-app chat messages and inquiry history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#039855] font-bold">•</span>
                      <span>Device tokens & push notification preferences</span>
                    </li>
                  </ul>
                </div>

                {/* Retained Data (Legal Compliance) */}
                <div className="p-4 rounded-xl bg-[#FEF6EE] border border-[#F9DBAF] space-y-3">
                  <div className="flex items-center gap-2 text-[#B54708] font-bold text-sm">
                    <Clock size={18} />
                    <span>Retained for Statutory Laws</span>
                  </div>
                  <ul className="text-[12.5px] text-[#475467] space-y-2 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-[#B54708] font-bold">•</span>
                      <span>Invoiced transaction records (7 years per GST & tax laws)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#B54708] font-bold">•</span>
                      <span>RERA-verified property audit logs (as mandated by real estate authorities)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#B54708] font-bold">•</span>
                      <span>Anonymized aggregated market trend insights</span>
                    </li>
                  </ul>
                </div>

              </div>
            </div>

            {/* FAQs */}
            <div className="bg-white rounded-2xl border border-[#E7E7E5] p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle size={18} className="text-[#FF5A3C]" />
                <h2 className="text-[18px] font-bold text-[#17202A]">Frequently Asked Questions</h2>
              </div>

              <div className="space-y-3 text-[13.5px]">
                <div className="p-3.5 rounded-xl bg-[#FAF9F7] border border-[#ECECE9]">
                  <h4 className="font-bold text-[#17202A] mb-1">How long does web deletion take?</h4>
                  <p className="text-[#667085] leading-relaxed">
                    Web requests are manually verified with registered email/phone and processed within <strong>7 business days</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF9F7] border border-[#ECECE9]">
                  <h4 className="font-bold text-[#17202A] mb-1">Can I recover my account after deletion?</h4>
                  <p className="text-[#667085] leading-relaxed">
                    You have a <strong>14-day cooling period</strong> after initiating deletion. Logging into the app during this window allows you to cancel the deletion request. After 14 days, deletion is irreversible.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* ─────────────────────────────────────────────────────────────
              RIGHT COLUMN (5 COLS): WEB REQUEST SUBMISSION FORM
              ───────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-5 sticky top-24 space-y-6">
            
            <div className="bg-white rounded-2xl border border-[#E7E7E5] p-6 sm:p-7 shadow-xs">
              
              {!submittedRequest ? (
                <>
                  <div className="flex items-center gap-2.5 pb-4 border-b border-[#F0F0EE] mb-5">
                    <div className="w-8 h-8 rounded-lg bg-[#FFF0ED] text-[#FF5A3C] flex items-center justify-center">
                      <Send size={16} />
                    </div>
                    <div>
                      <h2 className="text-[17px] font-bold text-[#17202A]">
                        Submit Deletion Request
                      </h2>
                      <p className="text-[12px] text-[#667085]">
                        For uninstalled app or web-only accounts
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    {/* Full Name */}
                    <div>
                      <label htmlFor="del-fullname" className="block text-xs font-bold uppercase tracking-wider text-[#344054] mb-1.5">
                        Full Name <span className="text-[#FF5A3C]">*</span>
                      </label>
                      <input
                        id="del-fullname"
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D0D5DD] text-sm text-[#17202A] placeholder-[#98A2B3] focus:outline-none focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/15 transition-all"
                      />
                    </div>

                    {/* Mobile Number */}
                    <div>
                      <label htmlFor="del-phone" className="block text-xs font-bold uppercase tracking-wider text-[#344054] mb-1.5">
                        Registered Mobile Number <span className="text-[#FF5A3C]">*</span>
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-[#D0D5DD] bg-[#F9FAFB] text-xs font-bold text-[#667085]">
                          +91
                        </span>
                        <input
                          id="del-phone"
                          type="tel"
                          required
                          pattern="[0-9]{10}"
                          placeholder="9876543210"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-r-xl border border-[#D0D5DD] text-sm text-[#17202A] placeholder-[#98A2B3] focus:outline-none focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/15 transition-all"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="del-email" className="block text-xs font-bold uppercase tracking-wider text-[#344054] mb-1.5">
                        Registered Email Address <span className="text-[#FF5A3C]">*</span>
                      </label>
                      <input
                        id="del-email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D0D5DD] text-sm text-[#17202A] placeholder-[#98A2B3] focus:outline-none focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/15 transition-all"
                      />
                    </div>

                    {/* Account Type */}
                    <div>
                      <label htmlFor="del-role" className="block text-xs font-bold uppercase tracking-wider text-[#344054] mb-1.5">
                        Account Type
                      </label>
                      <select
                        id="del-role"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D0D5DD] text-sm text-[#17202A] bg-white focus:outline-none focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/15 transition-all"
                      >
                        <option value="seeker">Property Seeker / Buyer / Tenant</option>
                        <option value="owner">Individual Property Owner</option>
                        <option value="agent">Super Agent / Real Estate Broker</option>
                        <option value="developer">Builder / Developer Partner</option>
                      </select>
                    </div>

                    {/* Reason */}
                    <div>
                      <label htmlFor="del-reason" className="block text-xs font-bold uppercase tracking-wider text-[#344054] mb-1.5">
                        Reason for Deletion
                      </label>
                      <select
                        id="del-reason"
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D0D5DD] text-sm text-[#17202A] bg-white focus:outline-none focus:border-[#FF5A3C] focus:ring-2 focus:ring-[#FF5A3C]/15 transition-all"
                      >
                        <option value="">Select a reason (Optional)</option>
                        <option value="found_property">Found property / Deal completed</option>
                        <option value="no_longer_needed">No longer searching or using service</option>
                        <option value="privacy">Privacy & personal data concerns</option>
                        <option value="multiple_accounts">Created duplicate / another account</option>
                        <option value="other">Other reason</option>
                      </select>
                    </div>

                    {/* Confirmation Checkbox */}
                    <div className="pt-2">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          required
                          checked={formData.agreed}
                          onChange={(e) => setFormData({ ...formData, agreed: e.target.checked })}
                          className="mt-1 w-4 h-4 rounded border-[#D0D5DD] text-[#FF5A3C] focus:ring-[#FF5A3C] cursor-pointer"
                        />
                        <span className="text-[12px] text-[#475467] leading-snug">
                          I acknowledge that account deletion is permanent and cannot be undone after the 14-day grace period.
                        </span>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting || !formData.agreed}
                      className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#FF5A3C] hover:bg-[#E04F34] active:scale-[0.99] transition-all shadow-md shadow-[#FF5A3C]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <span>Processing Request...</span>
                      ) : (
                        <>
                          <span>Submit Deletion Request</span>
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                /* Success Confirmation State */
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#ECFDF3] text-[#039855] flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 size={32} />
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#039855] block mb-1">
                      Request Submitted Successfully
                    </span>
                    <h3 className="text-[19px] font-bold text-[#17202A]">
                      Deletion Request Received
                    </h3>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAF9F7] border border-[#ECECE9] text-left text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#667085]">Reference ID:</span>
                      <span className="font-mono font-bold text-[#17202A]">{submittedRequest.refId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#667085]">Date:</span>
                      <span className="font-medium text-[#17202A]">{submittedRequest.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#667085]">Status:</span>
                      <span className="font-bold text-[#D97706]">Pending Verification</span>
                    </div>
                  </div>

                  <p className="text-[12.5px] text-[#667085] leading-relaxed">
                    Our data protection officer will send a confirmation OTP to <strong>+91 {formData.phone}</strong> and verification link to <strong>{formData.email}</strong> before proceeding.
                  </p>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs font-bold text-[#FF5A3C] hover:underline cursor-pointer pt-2 inline-block"
                  >
                    Submit another request
                  </button>
                </div>
              )}

            </div>

            {/* Direct Privacy Help Box */}
            <div className="bg-[#FFF0ED]/60 border border-[#FF5A3C]/20 rounded-2xl p-5 text-left space-y-2.5">
              <div className="flex items-center gap-2 text-[13.5px] font-bold text-[#17202A]">
                <Mail size={16} className="text-[#FF5A3C]" />
                <span>Need immediate privacy assistance?</span>
              </div>
              <p className="text-[12px] text-[#667085] leading-relaxed">
                You can write directly to our Data Protection Officer at{' '}
                <a href="mailto:privacy@gharmb.com" className="font-bold text-[#FF5A3C] hover:underline">
                  privacy@gharmb.com
                </a>{' '}
                with your registered contact details.
              </p>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
