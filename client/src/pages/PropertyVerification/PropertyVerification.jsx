import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck,
  MapPin,
  Image as ImageIcon,
  AlertCircle,
  ChevronRight,
  Eye,
  Check,
  X,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

const PropertyVerification = () => {
  const initialProperties = [
    {
      id: 'PROP-9821',
      title: 'Godrej Woods Sector 43',
      owner: 'Godrej Properties (Builder)',
      location: 'Noida, Sector 43',
      price: '₹2.45 Cr',
      stage: 'Submitted',
      checklist: { rera: true, deed: true, photos: false, geotag: false },
      docs: ['RERA Certificate', 'Land Registry Deed'],
      photoUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80',
      coordinates: '28.5678, 77.3412',
      remarks: '',
      createdDate: '16 Jun 2026'
    },
    {
      id: 'PROP-4920',
      title: 'Premium 3 BHK Builder Floor',
      owner: 'Sandeep Sharma (Agent)',
      location: 'DLF Phase 2, Gurugram',
      price: '₹1.85 Cr',
      stage: 'Docs Review',
      checklist: { rera: true, deed: true, photos: true, geotag: false },
      docs: ['Aadhaar Card', 'Property Tax Receipt'],
      photoUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80',
      coordinates: '28.4712, 77.0811',
      remarks: 'Registry document verified',
      createdDate: '15 Jun 2026'
    },
    {
      id: 'PROP-1082',
      title: 'Vatika City Penthouse',
      owner: 'Amit Varma (Owner)',
      location: 'Sohna Road, Gurugram',
      price: '₹3.20 Cr',
      stage: 'Photo Review',
      checklist: { rera: true, deed: true, photos: true, geotag: true },
      docs: ['Registry Deed', 'Society NOC'],
      photoUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
      coordinates: '28.4021, 77.0392',
      remarks: 'Floorplan maps match description',
      createdDate: '14 Jun 2026'
    }
  ];

  const [properties, setProperties] = useState(initialProperties);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [remarksInput, setRemarksInput] = useState('');

  const stages = ['Submitted', 'Docs Review', 'Photo Review', 'Location Verification', 'Admin Approval'];

  // Handle checklist ticks
  const toggleChecklistItem = (id, itemKey) => {
    setProperties(properties.map(p => {
      if (p.id === id) {
        const updatedChecklist = { ...p.checklist, [itemKey]: !p.checklist[itemKey] };
        if (selectedProperty && selectedProperty.id === id) {
          setSelectedProperty({ ...selectedProperty, checklist: updatedChecklist });
        }
        return { ...p, checklist: updatedChecklist };
      }
      return p;
    }));
  };

  const approveListing = (id) => {
    setProperties(properties.filter(p => p.id !== id));
    setSelectedProperty(null);
    alert(`Listing ${id} verification approved. Status changed to Live.`);
  };

  const rejectListing = (id) => {
    setProperties(properties.filter(p => p.id !== id));
    setSelectedProperty(null);
    alert(`Listing ${id} rejected. Alert notification sent to owner.`);
  };

  return (
    <div className="space-y-6">
      {/* Upper Pipeline Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-brand flex items-center justify-center shrink-0">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-[9px] font-semibold text-slate-400 block uppercase">Verification queue</span>
            <h4 className="text-base font-extrabold text-slate-800">{properties.length} Active Reviews</h4>
          </div>
        </div>
        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="text-[9px] font-semibold text-slate-400 block uppercase">Settled Today</span>
            <h4 className="text-base font-extrabold text-slate-800">14 Live</h4>
          </div>
        </div>
        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <XCircle size={18} />
          </div>
          <div>
            <span className="text-[9px] font-semibold text-slate-400 block uppercase">Rejections Logs</span>
            <h4 className="text-base font-extrabold text-slate-800">2 Listings</h4>
          </div>
        </div>
        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <span className="text-[9px] font-semibold text-slate-400 block uppercase">Verification SLA</span>
            <h4 className="text-base font-extrabold text-slate-800">98.4% Target</h4>
          </div>
        </div>
      </div>

      {/* Grid of Listings awaiting verification checks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {properties.map((p) => {
          // Calculate completed checklist percentage
          const totalChecks = Object.keys(p.checklist).length;
          const completedChecks = Object.values(p.checklist).filter(Boolean).length;
          const progressPercent = Math.round((completedChecks / totalChecks) * 100);

          return (
            <div key={p.id} className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400">{p.id}</span>
                    <h3 className="text-xs font-bold text-slate-800 mt-0.5 line-clamp-1">{p.title}</h3>
                    <p className="text-[9px] text-slate-400">{p.owner}</p>
                  </div>
                  <span className="text-[9px] font-extrabold text-brand bg-brand-light px-2 py-0.5 rounded-md">
                    {p.price}
                  </span>
                </div>

                <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-100 shadow-inner">
                  <img src={p.photoUrl} alt={p.title} className="w-full h-full object-cover" />
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-bold">
                    <span className="text-slate-400">CHECKLIST PROGRESS</span>
                    <span className="text-slate-700">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-50">
                <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                  {p.stage}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProperty(p);
                    setRemarksInput(p.remarks);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-[10px] font-bold shadow-lg shadow-brand/10 transition-all cursor-pointer"
                >
                  Inspect Listing <ChevronRight size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Verification inspect slider modal */}
      {selectedProperty && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row max-h-[85vh]">
              
              {/* Timeline list / verification checklist (Left Side) */}
              <div className="md:w-1/2 p-6 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 overflow-y-auto space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-brand bg-brand-light px-2.5 py-1 rounded-lg">
                    {selectedProperty.id} REVIEW
                  </span>
                  <span className="text-xs font-bold text-slate-800">{selectedProperty.price}</span>
                </div>

                {/* Progress Verification Checklist */}
                <div className="space-y-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Verification checklist</span>
                  <div className="space-y-2">
                    {[
                      { key: 'rera', label: 'Verify RERA registration status', desc: 'Cross check builder license with State RERA index log.' },
                      { key: 'deed', label: 'Land deed registry certificates verification', desc: 'Audit uploaded deeds for signatures and ownership seals.' },
                      { key: 'photos', label: 'Authenticate uploaded listing photographs', desc: 'Run analysis check for copyrights and metadata.' },
                      { key: 'geotag', label: 'Geotagged GPS locations check', desc: 'Compare mapped marker with physical plot borders.' }
                    ].map((check) => (
                      <div
                        key={check.key}
                        onClick={() => toggleChecklistItem(selectedProperty.id, check.key)}
                        className={`p-3 bg-white border rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
                          selectedProperty.checklist[check.key]
                            ? 'border-green-200 shadow-sm'
                            : 'border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                          selectedProperty.checklist[check.key]
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-slate-300 text-transparent'
                        }`}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <div className="text-left space-y-0.5">
                          <p className="text-[11px] font-bold text-slate-800 leading-tight">{check.label}</p>
                          <p className="text-[9px] text-slate-500 leading-snug">{check.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Review Panel details (Right Side) */}
              <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{selectedProperty.title}</h4>
                      <p className="text-[10px] text-slate-400">{selectedProperty.location}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedProperty(null)}
                      className="p-1 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Document uploads */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Submitted document references</span>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedProperty.docs.map((doc, idx) => (
                        <div key={idx} className="p-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2">
                          <FileCheck size={14} className="text-brand shrink-0" />
                          <span className="text-[10px] text-slate-600 font-semibold truncate">{doc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Remarks input */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Review Comments</span>
                    <textarea
                      rows={3}
                      value={remarksInput}
                      onChange={(e) => setRemarksInput(e.target.value)}
                      placeholder="Add specific comments regarding document checks, photo approvals, or coordinate corrections..."
                      className="w-full p-3 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-brand/40 resize-none"
                    />
                  </div>
                </div>

                {/* Final Moderation actions */}
                <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => approveListing(selectedProperty.id)}
                      className="flex-1 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold shadow-lg shadow-brand/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 size={14} /> Approve listing
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectListing(selectedProperty.id)}
                      className="flex-1 py-2.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <XCircle size={14} /> Reject listing
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert(`Changes requested for ${selectedProperty.id}`)}
                    className="w-full py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors"
                  >
                    Request user edits / correction details
                  </button>
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PropertyVerification;
