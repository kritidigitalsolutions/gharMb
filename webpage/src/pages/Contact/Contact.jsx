import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function Contact() {
  return (
    <>
      <section className="bg-section-bg pt-12 sm:pt-16 pb-12">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-brand mb-3">
              Contact
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-bold text-text-primary leading-[1.1] tracking-tight mb-4">
              Get in touch.
            </h1>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              Have a question about GharMB? Want to list your property or project? We are here to help.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-16">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <a href="mailto:support@gharmb.com" className="flex items-center gap-3 text-sm text-text-secondary hover:text-brand transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-brand-light flex items-center justify-center shrink-0">
                      <Mail size={16} className="text-brand" />
                    </div>
                    support@gharmb.com
                  </a>
                  <a href="tel:+919876543210" className="flex items-center gap-3 text-sm text-text-secondary hover:text-brand transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-brand-light flex items-center justify-center shrink-0">
                      <Phone size={16} className="text-brand" />
                    </div>
                    +91 98765 43210
                  </a>
                  <div className="flex items-center gap-3 text-sm text-text-secondary">
                    <div className="w-9 h-9 rounded-xl bg-brand-light flex items-center justify-center shrink-0">
                      <MapPin size={16} className="text-brand" />
                    </div>
                    Noida, Uttar Pradesh, India
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              <div className="bg-white border border-border rounded-2xl p-6 sm:p-8">
                <h3 className="text-base font-semibold text-text-primary mb-6">Send us a message</h3>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input type="text" placeholder="Your name" className="w-full px-4 py-3 text-sm border border-border rounded-xl bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors" />
                    <input type="email" placeholder="Your email" className="w-full px-4 py-3 text-sm border border-border rounded-xl bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors" />
                  </div>
                  <select className="w-full px-4 py-3 text-sm border border-border rounded-xl bg-white text-text-muted appearance-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors">
                    <option>What is this about?</option>
                    <option>List my property</option>
                    <option>Developer enquiry</option>
                    <option>Agent registration</option>
                    <option>General question</option>
                    <option>Bug report</option>
                  </select>
                  <textarea rows={4} placeholder="Your message" className="w-full px-4 py-3 text-sm border border-border rounded-xl bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors resize-none" />
                  <button type="submit" className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-all duration-200 hover:shadow-[0_4px_16px_rgba(255,90,60,0.25)] active:scale-[0.98]">
                    <Send size={15} />
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
