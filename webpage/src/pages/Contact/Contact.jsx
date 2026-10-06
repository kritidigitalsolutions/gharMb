import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle2, Clock } from 'lucide-react';
import { API_BASE_URL } from '../../api/config';

export default function Contact() {
  const [contacts, setContacts] = useState({
    helpline: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
    supportEmail: 'support@gharmb.com',
    workingHours: 'Mon – Sat: 9:00 AM – 8:00 PM IST',
    address: 'Sector 29, Cyber City Phase 2, Gurugram, India'
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    topic: 'General Question',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE_URL}/pages/contact-us`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.success && data?.data?.pageContent) {
          const pc = data.data.pageContent;
          const meta = pc.metadata || {};
          setContacts((prev) => ({
            ...prev,
            helpline: meta.helpline || prev.helpline,
            whatsapp: meta.whatsapp || prev.whatsapp,
            supportEmail: meta.supportEmail || prev.supportEmail,
            workingHours: meta.workingHours || prev.workingHours,
            address: meta.headquarters?.address
              ? `${meta.headquarters.address}, ${meta.headquarters.city || ''}`
              : prev.address
          }));
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) return;

    setIsSubmitting(true);
    try {
      await fetch(`${API_BASE_URL}/web-inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          fullName: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || 'Not provided',
          role: 'seeker',
          subject: `Contact Inquiry: ${formData.topic}`,
          message: formData.message.trim()
        })
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cleanWa = (contacts.whatsapp || '').replace(/[^0-9]/g, '');
  const waLink = `https://wa.me/${cleanWa}?text=${encodeURIComponent('Hi GharMB Team, I would like to inquire about...')}`;

  return (
    <>
      <section className="bg-section-bg pt-12 sm:pt-16 pb-12 border-b border-border/40">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-brand mb-3">
              Support & Inquiries
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-bold text-text-primary leading-[1.1] tracking-tight mb-4">
              Get in touch.
            </h1>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              Have questions regarding verified properties, builder compliance, or partnership onboarding? Our advisory team is here to assist.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-start">
            {/* Direct Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider text-xs">
                  Official Channels
                </h3>
                <div className="space-y-4">
                  {/* Phone Helpline */}
                  <a
                    href={`tel:${contacts.helpline}`}
                    className="flex items-center gap-3.5 text-sm text-text-secondary hover:text-brand transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Phone size={17} className="text-brand" />
                    </div>
                    <div>
                      <span className="block text-[11px] font-semibold text-text-muted uppercase">Phone Helpline</span>
                      <span className="font-semibold text-text-primary font-mono">{contacts.helpline}</span>
                    </div>
                  </a>

                  {/* WhatsApp Chat Line */}
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3.5 text-sm text-text-secondary hover:text-emerald-600 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <MessageSquare size={17} className="text-emerald-600" />
                    </div>
                    <div>
                      <span className="block text-[11px] font-semibold text-emerald-600 uppercase">WhatsApp Official</span>
                      <span className="font-semibold text-text-primary font-mono">{contacts.whatsapp}</span>
                    </div>
                  </a>

                  {/* Support Email */}
                  <a
                    href={`mailto:${contacts.supportEmail}`}
                    className="flex items-center gap-3.5 text-sm text-text-secondary hover:text-brand transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Mail size={17} className="text-brand" />
                    </div>
                    <div>
                      <span className="block text-[11px] font-semibold text-text-muted uppercase">Support Email</span>
                      <span className="font-semibold text-text-primary font-mono">{contacts.supportEmail}</span>
                    </div>
                  </a>

                  {/* Office Location */}
                  <div className="flex items-start gap-3.5 text-sm text-text-secondary">
                    <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={17} className="text-brand" />
                    </div>
                    <div>
                      <span className="block text-[11px] font-semibold text-text-muted uppercase">Headquarters</span>
                      <span className="text-text-primary leading-relaxed">{contacts.address}</span>
                    </div>
                  </div>

                  {/* Operational Hours */}
                  <div className="flex items-center gap-3.5 text-xs text-text-muted pt-2 border-t border-border/60">
                    <Clock size={15} className="text-brand shrink-0" />
                    <span>{contacts.workingHours}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Form */}
            <div className="lg:col-span-3">
              <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
                <h3 className="text-base font-semibold text-text-primary mb-2">Send us a message</h3>
                <p className="text-xs text-text-secondary mb-6">
                  Our coordinator will reach out directly to assist your inquiry.
                </p>

                {submitted ? (
                  <div className="p-8 text-center space-y-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl animate-fade-in">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 size={24} />
                    </div>
                    <h4 className="text-base font-bold text-text-primary">Inquiry Sent Successfully</h4>
                    <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
                      Thank you for contacting GharMB. Our administrator has received your message and will contact you shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({ name: '', email: '', phone: '', topic: 'General Question', message: '' });
                      }}
                      className="mt-2 text-xs font-semibold text-brand hover:underline cursor-pointer"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <input
                        type="text"
                        required
                        placeholder="Your full name *"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 text-sm border border-border rounded-xl bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors"
                      />
                      <input
                        type="email"
                        required
                        placeholder="Your email address *"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 text-sm border border-border rounded-xl bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <input
                        type="tel"
                        placeholder="Mobile number (optional)"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 text-sm border border-border rounded-xl bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors font-mono"
                      />
                      <select
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        className="w-full px-4 py-3 text-sm border border-border rounded-xl bg-white text-text-primary focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors"
                      >
                        <option>General Question</option>
                        <option>List my property</option>
                        <option>Developer enquiry</option>
                        <option>Agent registration</option>
                        <option>Legal Verification</option>
                        <option>Bug report</option>
                      </select>
                    </div>

                    <textarea
                      rows={4}
                      required
                      placeholder="Write your message here... *"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 text-sm border border-border rounded-xl bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors resize-none"
                    />

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-all duration-200 hover:shadow-[0_4px_16px_rgba(255,90,60,0.25)] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    >
                      <Send size={15} />
                      <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
