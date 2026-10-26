import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Building2, ArrowRight, Play, MessageSquare } from 'lucide-react';
import SmoothImage from '../common/SmoothImage';
import PropertyEnquiryModal from './PropertyEnquiryModal';

// Helper to format possession date to Month & Year only
const formatMonthYear = (val) => {
  if (!val || typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (!trimmed) return '';
  if (/^(ready\s*to\s*move|immediate|under\s*construction)$/i.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900) {
    const hasDay = /\b\d{1,2}\s+[A-Za-z]+\s+\d{4}\b|\b[A-Za-z]+\s+\d{1,2},?\s+\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/.test(trimmed);
    if (hasDay) return parsed.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }
  return trimmed;
};

export default function DeveloperCard({ developer }) {
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const { name, projectName, location, projectType, priceRange, status, image, units, videos } = developer;

  // 🏷️ Check if project is marked Sold Out
  const isSoldOut = Boolean(
    developer.isSold ||
    developer.saleStatus === 'sold' ||
    status === 'Sold' ||
    status === 'sold'
  );

  const statusColor = {
    'Under Construction': 'bg-amber-50 text-amber-700 border-amber-200',
    'Ready to Move': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'New Launch': 'bg-brand-light text-brand border-brand/20',
  };

  return (
    <>
      <div className="group bg-white border border-border rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between">
        <div>
          <div className="relative aspect-[16/10] overflow-hidden">
            <SmoothImage
              src={image}
              alt={projectName}
              className={`w-full h-full object-cover transition-transform duration-500 ease-out ${
                isSoldOut ? 'grayscale-[45%] opacity-90' : 'group-hover:scale-[1.03]'
              }`}
              containerClassName="w-full h-full"
            />
            {isSoldOut ? (
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-600 text-white shadow-md border border-rose-700 uppercase tracking-wide">
                Sold Out
              </span>
            ) : (
              <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusColor[status] || 'bg-white text-text-primary border-border'}`}>
                {status}
              </span>
            )}
            {videos && videos.length > 0 && (
              <span className="absolute top-3 right-3 px-2 py-1 rounded-lg text-[11px] font-bold bg-purple-600/90 hover:bg-purple-600 text-white flex items-center gap-1 shadow-md backdrop-blur-xs transition-colors">
                <Play size={10} className="fill-white" /> Video Tour
              </span>
            )}
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">{name}</p>
            <h3 className="text-base font-semibold text-text-primary leading-snug mb-1.5">{projectName}</h3>
            <p className="flex items-center gap-1 text-sm text-text-secondary mb-3">
              <MapPin size={13} className="text-text-muted shrink-0" />
              {location}
            </p>

            <div className="flex items-center gap-3 text-xs text-text-muted mb-4">
              <span>{projectType}</span>
              <span className="w-px h-3 bg-border" />
              <span>{units} units</span>
            </div>

            {developer.possessionDate && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 mb-3 w-fit">
                <span>Expected Possession: <strong>{formatMonthYear(developer.possessionDate)}</strong></span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5 pt-0">
          <div className="flex items-center justify-between pt-3 border-t border-border-soft">
            <span className="text-sm font-semibold text-text-primary">{priceRange}</span>
            <div className="flex items-center gap-2">
              {isSoldOut ? (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-50 text-rose-700 border border-rose-200 select-none">
                  Sold Out
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowEnquiryModal(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-brand text-white hover:bg-brand-dark transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Send inquiry directly to GharMB Admin"
                >
                  <MessageSquare size={12} />
                  <span>Inquiry Now</span>
                </button>
              )}
              <Link
                to="/developers"
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-text-muted hover:text-brand transition-colors group/link p-1"
              >
                Details
                <ArrowRight size={13} className="group-hover/link:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 📩 DEVELOPER PROJECT INQUIRY MODAL */}
      <PropertyEnquiryModal
        property={{
          ...developer,
          isProject: true,
          projectName: developer.projectName,
          developerName: developer.name,
          title: developer.projectName,
          priceRange: developer.priceRange,
        }}
        isOpen={showEnquiryModal}
        onClose={() => setShowEnquiryModal(false)}
      />
    </>
  );
}
