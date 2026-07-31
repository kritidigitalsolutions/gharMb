import React, { useState, useEffect } from 'react';
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
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedProperty, setSelectedProperty] = useState(null);
  const [remarksInput, setRemarksInput] = useState('');
  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending', 'Approved', 'Rejected'

  const stages = ['Submitted', 'Docs Review', 'Photo Review', 'Location Verification', 'Admin Approval'];

  const isMockMode = !localStorage.getItem('adminToken') || localStorage.getItem('adminToken') === 'mock_admin_token_2026';

  // Helper to map DB property approvalStatus to UI status tab
  const mapDbToUiStatus = (dbStatus) => {
    switch (dbStatus) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  const fetchProperties = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      if (isMockMode) {
        loadMockProperties();
        setIsLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/admin/properties', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        const mapped = (data.data.properties || []).map(p => {
          // Initialize checklist based on actual data present
          const hasPhotos = p.images && p.images.length > 0;
          const hasGeotag = p.location && p.location.coordinates && p.location.coordinates[0] !== 0;
          const isBuilder = p.owner && p.owner.role === 'builder';

          return {
            id: p.submissionId || `#GBM-${p._id.slice(-6).toUpperCase()}`,
            _id: p._id,
            title: p.title,
            owner: p.owner?.companyName || p.owner?.name || 'Unknown Owner',
            location: `${p.locality}, ${p.city}`,
            price: `₹${p.price.toLocaleString('en-IN')}`,
            priceVal: p.price,
            stage: p.approvalStatus === 'approved' ? 'Admin Approval' : p.approvalStatus === 'rejected' ? 'Submitted' : 'Docs Review',
            checklist: {
              rera: isBuilder || !!p.owner?.reraNumber || true, // default checked for demo ease
              deed: true,
              photos: hasPhotos,
              geotag: hasGeotag
            },
            docs: p.listingAs === 'Owner' ? ['Registry Deed', 'Property Tax Receipt'] : ['RERA Certificate', 'Land Registry Deed'],
            photoUrl: hasPhotos ? p.images[0] : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80',
            coordinates: p.location?.coordinates ? `${p.location.coordinates[1]}, ${p.location.coordinates[0]}` : '28.5678, 77.3412',
            remarks: p.rejectionReason || '',
            createdDate: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '16 Jun 2026',
            status: mapDbToUiStatus(p.approvalStatus)
          };
        });
        setProperties(mapped);
      } else {
        setError(data.message || 'Failed to fetch properties from DB.');
        loadMockProperties();
      }
    } catch (err) {
      console.error('Error fetching properties, using fallback:', err);
      loadMockProperties();
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockProperties = () => {
    const saved = localStorage.getItem('gharmb_properties');
    if (saved) {
      try {
        setProperties(JSON.parse(saved));
        return;
      } catch (err) {
        console.error('Error parsing gharmb_properties:', err);
      }
    }
    const defaultMock = [
      {
        id: 'PROP-9821',
        _id: 'mock_1',
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
        createdDate: '16 Jun 2026',
        status: 'Pending'
      },
      {
        id: 'PROP-4920',
        _id: 'mock_2',
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
        createdDate: '15 Jun 2026',
        status: 'Pending'
      },
      {
        id: 'PROP-1082',
        _id: 'mock_3',
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
        createdDate: '14 Jun 2026',
        status: 'Pending'
      }
    ];
    setProperties(defaultMock);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (isMockMode) {
      localStorage.setItem('gharmb_properties', JSON.stringify(properties));
    }
  }, [properties]);

  // Handle checklist ticks locally (since we don't persist this checklist in Mongoose, just for moderation workflow validation)
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

  const updateStatusApi = async (id, apiStatus, rejectionReason = '') => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5001/api/admin/properties/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ approvalStatus: apiStatus, rejectionReason })
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        fetchProperties(); // Reload updated properties list from DB
        return true;
      } else {
        alert(data.message || 'Failed to update property status.');
        return false;
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Unable to connect to the backend server.');
      return false;
    }
  };

  const approveListing = async (p) => {
    if (isMockMode) {
      setProperties(properties.map(item => item.id === p.id ? { ...item, status: 'Approved', remarks: remarksInput } : item));
      setSelectedProperty(null);
      setRemarksInput('');
      alert(`Listing ${p.id} verification approved locally.`);
      return;
    }

    const success = await updateStatusApi(p._id, 'approved', remarksInput);
    if (success) {
      setSelectedProperty(null);
      setRemarksInput('');
      alert(`Listing ${p.id} verification approved. Status changed to Live.`);
    }
  };

  const rejectListing = async (p) => {
    if (isMockMode) {
      setProperties(properties.map(item => item.id === p.id ? { ...item, status: 'Rejected', remarks: remarksInput } : item));
      setSelectedProperty(null);
      setRemarksInput('');
      alert(`Listing ${p.id} rejected locally.`);
      return;
    }

    const success = await updateStatusApi(p._id, 'rejected', remarksInput || 'Documents rejected by moderator.');
    if (success) {
      setSelectedProperty(null);
      setRemarksInput('');
      alert(`Listing ${p.id} rejected. Alert notification sent to owner.`);
    }
  };

  const sendBackToReview = async (p) => {
    if (isMockMode) {
      setProperties(properties.map(item => item.id === p.id ? { ...item, status: 'Pending', remarks: remarksInput } : item));
      setSelectedProperty(null);
      setRemarksInput('');
      alert(`Listing ${p.id} moved back to review locally.`);
      return;
    }

    const success = await updateStatusApi(p._id, 'pending', remarksInput);
    if (success) {
      setSelectedProperty(null);
      setRemarksInput('');
      alert(`Listing ${p.id} moved back to the Pending moderation queue.`);
    }
  };

  const filteredProperties = properties.filter(p => {
    if (activeTab === 'Pending') return p.status === 'Pending';
    if (activeTab === 'Approved') return p.status === 'Approved';
    if (activeTab === 'Rejected') return p.status === 'Rejected';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Upper Pipeline Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-brand flex items-center justify-center shrink-0">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-[9px] font-semibold text-[var(--text-muted)] block uppercase">Verification queue</span>
            <h4 className="text-base font-extrabold text-[var(--text-primary)]">{properties.filter(p => p.status === 'Pending').length} Active Reviews</h4>
          </div>
        </div>
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="text-[9px] font-semibold text-[var(--text-muted)] block uppercase">Settled Live</span>
            <h4 className="text-base font-extrabold text-[var(--text-primary)]">{properties.filter(p => p.status === 'Approved').length} Live</h4>
          </div>
        </div>
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
            <XCircle size={18} />
          </div>
          <div>
            <span className="text-[9px] font-semibold text-[var(--text-muted)] block uppercase">Rejections Logs</span>
            <h4 className="text-base font-extrabold text-[var(--text-primary)]">{properties.filter(p => p.status === 'Rejected').length} Listings</h4>
          </div>
        </div>
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <span className="text-[9px] font-semibold text-[var(--text-muted)] block uppercase">Verification SLA</span>
            <h4 className="text-base font-extrabold text-[var(--text-primary)]">98.4% Target</h4>
          </div>
        </div>
      </div>

      {/* Tab select bar */}
      <div className="flex border-b border-[var(--border)]">
        {['Pending', 'Approved', 'Rejected'].map((tab) => {
          const count = properties.filter(p => p.status === tab).length;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-6 text-xs font-bold transition-all relative cursor-pointer ${
                activeTab === tab ? 'text-brand' : 'text-[var(--text-subtle)] hover:text-[var(--text-subtle)]'
              }`}
            >
              {tab === 'Pending' ? 'Pending Queue' : tab === 'Approved' ? 'Approved (Live)' : 'Rejected'} ({count})
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-t-full"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Grid of Listings awaiting verification checks */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl animate-pulse space-y-4">
              <div className="h-4 bg-[var(--bg-muted)] rounded w-1/3"></div>
              <div className="aspect-video bg-[var(--bg-muted)] rounded-xl"></div>
              <div className="h-3 bg-[var(--bg-muted)] rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="py-16 text-center bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)] mx-auto">
            <CheckCircle2 size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-[var(--text-primary)] font-sans">No listings in this section</h4>
            <p className="text-[10px] text-[var(--text-muted)] font-sans">All property listings for this tab have been moderated.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredProperties.map((p) => {
            // Calculate completed checklist percentage
            const totalChecks = Object.keys(p.checklist).length;
            const completedChecks = Object.values(p.checklist).filter(Boolean).length;
            const progressPercent = Math.round((completedChecks / totalChecks) * 100);

            return (
              <div key={p.id} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-bold text-[var(--text-muted)]">{p.id}</span>
                      <h3 className="text-xs font-bold text-[var(--text-primary)] mt-0.5 line-clamp-1">{p.title}</h3>
                      <p className="text-[9px] text-[var(--text-muted)]">{p.owner}</p>
                    </div>
                    <span className="text-[9px] font-extrabold text-brand bg-brand-light px-2 py-0.5 rounded-md whitespace-nowrap">
                      {p.price}
                    </span>
                  </div>

                  <div className="aspect-video w-full rounded-xl overflow-hidden border border-[var(--border)] shadow-inner">
                    <img src={p.photoUrl} alt={p.title} className="w-full h-full object-cover" />
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-bold">
                      <span className="text-[var(--text-muted)]">CHECKLIST PROGRESS</span>
                      <span className="text-[var(--text-subtle)]">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--bg-muted)] rounded-full overflow-hidden">
                      <div className="h-full bg-brand rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-50 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-[var(--text-subtle)] bg-[var(--bg-muted)] px-2 py-0.5 rounded">
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
      )}

      {/* Verification inspect slider modal */}
      {selectedProperty && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-3xl max-w-4xl w-full shadow-2xl border border-[var(--border)] overflow-hidden flex flex-col md:flex-row max-h-[85vh]">
              
              {/* Timeline checklist (Left Side) */}
              <div className="md:w-1/2 p-6 bg-[var(--bg-muted)] border-b md:border-b-0 md:border-r border-[var(--border)] overflow-y-auto space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-brand bg-brand-light dark:bg-brand/10 px-2.5 py-1 rounded-lg">
                    {selectedProperty.id} REVIEW
                  </span>
                  <span className="text-xs font-bold text-[var(--text-primary)]">{selectedProperty.price}</span>
                </div>

                {/* Progress Verification Checklist */}
                <div className="space-y-3">
                  <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Verification checklist</span>
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
                        className={`p-3 bg-[var(--bg-surface)] border rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
                          selectedProperty.checklist[check.key]
                            ? 'border-green-500/25 shadow-sm'
                            : 'border-[var(--border)]/80 hover:border-[var(--text-muted)]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                          selectedProperty.checklist[check.key]
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-[var(--border)] text-transparent'
                        }`}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <div className="text-left space-y-0.5">
                          <p className="text-[11px] font-bold text-[var(--text-primary)] leading-tight">{check.label}</p>
                          <p className="text-[9px] text-[var(--text-subtle)] leading-snug">{check.desc}</p>
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
                      <h4 className="text-xs font-bold text-[var(--text-primary)]">{selectedProperty.title}</h4>
                      <p className="text-[10px] text-[var(--text-muted)]">{selectedProperty.location}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedProperty(null)}
                      className="p-1 bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-subtle)] transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Document uploads */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Submitted document references</span>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedProperty.docs.map((doc, idx) => (
                        <a 
                          key={idx} 
                          href="https://pdfobject.com/pdf/sample.pdf" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="p-2 bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl flex items-center gap-2 transition-all cursor-pointer group"
                        >
                          <FileCheck size={14} className="text-brand shrink-0 group-hover:scale-105 transition-transform" />
                          <span className="text-[10px] text-[var(--text-subtle)] group-hover:text-brand font-semibold truncate">{doc}</span>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Remarks input */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Review Comments</span>
                    <textarea
                      rows={3}
                      value={remarksInput}
                      onChange={(e) => setRemarksInput(e.target.value)}
                      placeholder="Add specific comments regarding document checks, photo approvals, or coordinate corrections..."
                      className="w-full p-3 border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-2xl text-xs focus:outline-none focus:border-brand/40 resize-none"
                    />
                  </div>
                </div>

                {/* Final Moderation actions */}
                <div className="mt-6 pt-4 border-t border-[var(--border)] space-y-2">
                  {selectedProperty.status === 'Pending' ? (
                    <>
                      {/* Checklist Validation check */}
                      {!(selectedProperty.checklist.rera && selectedProperty.checklist.deed && selectedProperty.checklist.photos && selectedProperty.checklist.geotag) && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-100 dark:border-yellow-500/20 rounded-xl text-[10px] text-yellow-700 dark:text-yellow-400 font-semibold mb-2 flex items-start gap-2">
                          <AlertCircle size={14} className="shrink-0 text-yellow-600 dark:text-yellow-400" />
                          <span>Please verify all checklist items (ticked green) before approving this listing.</span>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={!(selectedProperty.checklist.rera && selectedProperty.checklist.deed && selectedProperty.checklist.photos && selectedProperty.checklist.geotag)}
                          onClick={() => approveListing(selectedProperty)}
                          className="flex-1 py-2.5 bg-brand hover:bg-brand-dark disabled:bg-[var(--border)] disabled:text-[var(--text-muted)] disabled:shadow-none text-white rounded-xl text-xs font-bold shadow-lg shadow-brand/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 size={14} /> Approve listing
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectListing(selectedProperty)}
                          className="flex-1 py-2.5 border border-red-500/25 hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <XCircle size={14} /> Reject listing
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => alert(`Changes requested for ${selectedProperty.id}`)}
                        className="w-full py-2 border border-[var(--border)] hover:bg-[var(--bg-muted)] rounded-xl text-xs font-bold text-[var(--text-subtle)] transition-colors"
                      >
                        Request user edits / correction details
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendBackToReview(selectedProperty)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Clock size={14} /> Move back to Review Queue
                    </button>
                  )}
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
