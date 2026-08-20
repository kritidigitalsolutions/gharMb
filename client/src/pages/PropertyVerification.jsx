import React, { useState, useEffect } from 'react';
import {
  Search, RefreshCw, MapPin, Building, Building2,
  Clock, CheckCircle2, XCircle, ChevronRight, ChevronLeft,
  Edit3, Save, X, Trash2, Image as ImageIcon,
  ShieldCheck, AlertCircle, IndianRupee, User,
  Maximize, Home, Sparkles, Filter, Eye, Check,
  ExternalLink, Layers, FileText, Phone, Mail,
  Calendar, Award, CheckSquare, Compass, ShieldAlert,
  ArrowRight
} from 'lucide-react';

const PropertyVerification = () => {
  // --- States ---
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters & Category
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL'); // ALL, Residential, Commercial, Industrial, Land
  const [statusFilter, setStatusFilter] = useState('All'); // All, Pending, Approved, Rejected
  const [conditionFilter, setConditionFilter] = useState('All');
  
  // Selection & Editing
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('Documents incomplete');

  // Lightbox Modal state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Review checklist state for the currently inspected property
  const [reviewChecklist, setReviewChecklist] = useState({
    priceValid: false,
    photosApproved: false,
    addressVerified: false,
    reraChecked: false,
    amenitiesConfirmed: false
  });

  const isMockMode = !localStorage.getItem('adminToken') || localStorage.getItem('adminToken') === 'mock_admin_token_2026';

  // --- Initial Mock & API Data ---
  const initialProperties = [
    {
      id: 'PROP-9821',
      _id: 'p_9821',
      title: 'Godrej Woods Sector 43',
      category: 'Residential',
      subCategory: 'Apartment',
      configuration: '3 BHK Luxury Flat',
      ownerName: 'Godrej Properties Ltd',
      ownerRole: 'Builder',
      ownerPhone: '+91 98111 22334',
      ownerEmail: 'sales@godrejproperties.com',
      location: 'Sector 43, Noida, Uttar Pradesh',
      locality: 'Sector 43',
      city: 'Noida',
      pincode: '201301',
      price: '2.45 Cr',
      priceVal: 24500000,
      pricePerSqFt: '₹11,950/sq.ft',
      maintenanceCharges: '₹6,500/month',
      tokenAmount: '₹2,50,000',
      area: '2050 sq.ft',
      carpetArea: '1680 sq.ft',
      condition: 'Under Construction',
      possessionDate: 'Dec 2026',
      floorInfo: '14th of 28 Floors',
      facing: 'North-East (Park Facing)',
      furnishing: 'Semi-Furnished',
      reraNumber: 'UPRERAPRJ123456',
      reraStatus: 'Verified',
      amenities: ['Swimming Pool', 'Clubhouse', 'Gymnasium', '24/7 Security', 'Power Backup', 'Covered Parking', 'Jogging Track', 'EV Charging Station'],
      status: 'Pending',
      submittedDate: '18 Jun 2026',
      images: [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80'
      ],
      documents: ['RERA Certificate', 'Building Plan Approval', 'Land Deed'],
      description: 'Ultra luxury 3 BHK apartment in Godrej Woods with forest-themed landscaped greens, modular kitchen, and smart automation.'
    },
    {
      id: 'PROP-4920',
      _id: 'p_4920',
      title: 'Premium 3 BHK Builder Floor DLF',
      category: 'Residential',
      subCategory: 'Builder Floor',
      configuration: '3 BHK Independent Floor',
      ownerName: 'Sandeep Sharma',
      ownerRole: 'Agent',
      ownerPhone: '+91 98123 45678',
      ownerEmail: 'sandeep.realty@gmail.com',
      location: 'DLF Phase 2, Gurugram, Haryana',
      locality: 'DLF Phase 2',
      city: 'Gurugram',
      pincode: '122002',
      price: '1.85 Cr',
      priceVal: 18500000,
      pricePerSqFt: '₹12,333/sq.ft',
      maintenanceCharges: '₹2,000/month',
      tokenAmount: '₹1,00,000',
      area: '1500 sq.ft',
      carpetArea: '1350 sq.ft',
      condition: 'Ready to Move',
      possessionDate: 'Immediate',
      floorInfo: '2nd Floor (with Stilt Lift)',
      facing: 'East Facing (Vastu Compliant)',
      furnishing: 'Fully Furnished',
      reraNumber: '', // Not required for Agent Resale
      reraStatus: 'Exempted (Resale)',
      amenities: ['Dedicated Lift', '2 Car Stilt Parking', 'Terrace Garden', 'CCTV Surveillance', '100% Power Backup'],
      status: 'Pending',
      submittedDate: '17 Jun 2026',
      images: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&auto=format&fit=crop&q=80'
      ],
      documents: ['Sale Deed Registry', 'Electricity Bill NOC'],
      description: 'Tastefully furnished 3 BHK builder floor in prime DLF Phase 2 near Cyber Hub, Italian marble flooring and modular kitchen.'
    },
    {
      id: 'PROP-7730',
      _id: 'p_7730',
      title: 'DLF Cyber City Grade-A Commercial Office',
      category: 'Commercial',
      subCategory: 'Office Space',
      configuration: 'Furnished Commercial Office (80 Workstations)',
      ownerName: 'DLF Commercial Division',
      ownerRole: 'Builder',
      ownerPhone: '+91 99000 11223',
      ownerEmail: 'leasing@dlf.in',
      location: 'DLF Cyber City, Sector 24, Gurugram, Haryana',
      locality: 'Cyber City',
      city: 'Gurugram',
      pincode: '122002',
      price: '14.50 Cr',
      priceVal: 145000000,
      pricePerSqFt: '₹22,300/sq.ft',
      maintenanceCharges: '₹18/sq.ft/month',
      tokenAmount: '₹10,00,000',
      area: '6500 sq.ft',
      carpetArea: '5200 sq.ft',
      condition: 'Ready to Move',
      possessionDate: 'Immediate',
      floorInfo: '8th Floor',
      facing: 'North Facing',
      furnishing: 'Fully Furnished (IT Compliant)',
      reraNumber: 'HARERAGGM789012',
      reraStatus: 'Verified',
      commercialTerms: {
        lockInPeriod: '3 Years',
        securityDeposit: '6 Months Rent',
        powerLoad: '120 kVA',
        parkingRatio: '1:1000 sq.ft (7 Dedicated Slots)',
        acType: 'Central Chiller HVAC',
        zoning: 'Commercial IT/ITES Approved'
      },
      amenities: ['Central Air Conditioning', 'High Speed Fibre Internet', 'Food Court & Cafeteria', '6 High Speed Elevators', '24/7 Power Backup', 'Fire Safety NOC', 'Reception Lobby'],
      status: 'Pending',
      submittedDate: '16 Jun 2026',
      images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&auto=format&fit=crop&q=80'
      ],
      documents: ['RERA Commercial License', 'Fire NOC', 'Occupancy Certificate (OC)'],
      description: 'Grade-A corporate office in DLF Cyber City with 80 workstations, 4 executive cabins, 2 conference rooms with VC equipment.'
    },
    {
      id: 'PROP-1082',
      _id: 'p_1082',
      title: 'Vatika City High-Street Retail Shop',
      category: 'Commercial',
      subCategory: 'Retail Shop',
      configuration: 'Ground Floor Front Facing Shop',
      ownerName: 'Amit Varma',
      ownerRole: 'Owner',
      ownerPhone: '+91 98450 99881',
      ownerEmail: 'amit.varma@gmail.com',
      location: 'Sohna Road, Sector 49, Gurugram',
      locality: 'Sohna Road',
      city: 'Gurugram',
      pincode: '122018',
      price: '3.20 Cr',
      priceVal: 32000000,
      pricePerSqFt: '₹37,647/sq.ft',
      maintenanceCharges: '₹12,000/month',
      tokenAmount: '₹3,00,000',
      area: '850 sq.ft',
      carpetArea: '680 sq.ft',
      condition: 'Ready to Move (Resale)',
      possessionDate: 'Immediate',
      floorInfo: 'Ground Floor',
      facing: 'Main Road Frontage',
      furnishing: 'Bare Shell',
      reraNumber: '', // Owner Resale
      reraStatus: 'Exempted (Resale)',
      commercialTerms: {
        lockInPeriod: '2 Years',
        securityDeposit: '3 Months',
        powerLoad: '15 kVA',
        parkingRatio: 'Ample Surface Visitor Parking',
        acType: 'Provision for Split/VRV AC',
        zoning: 'Commercial Retail'
      },
      amenities: ['Main Road Facing', 'Double Height Ceiling', 'Private Washroom', 'Water Connection', 'CCTV Covered Galleria'],
      status: 'Approved',
      submittedDate: '15 Jun 2026',
      images: [
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1567449303078-57ad995bd302?w=1200&auto=format&fit=crop&q=80'
      ],
      documents: ['Registry Deed', 'Society Mutation Certificate'],
      description: 'Prime double-height high-street retail shop on Sohna Road with heavy footfall, suitable for pharmacy, cafe or boutique store.'
    }
  ];

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const saved = localStorage.getItem('gharmb_verified_properties');
      if (saved) {
        setProperties(JSON.parse(saved));
      } else {
        setProperties(initialProperties);
        localStorage.setItem('gharmb_verified_properties', JSON.stringify(initialProperties));
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
      setProperties(initialProperties);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const saveToStorage = (updatedList) => {
    setProperties(updatedList);
    localStorage.setItem('gharmb_verified_properties', JSON.stringify(updatedList));
  };

  // --- Handlers ---
  const handleSelectProperty = (prop) => {
    setSelectedProperty(prop);
    setFormData({ ...prop });
    setIsEditing(false);
    setRemarks('');
    setReviewChecklist({
      priceValid: prop.status === 'Approved',
      photosApproved: prop.status === 'Approved',
      addressVerified: prop.status === 'Approved',
      reraChecked: prop.status === 'Approved',
      amenitiesConfirmed: prop.status === 'Approved'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCommercialChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      commercialTerms: {
        ...prev.commercialTerms,
        [name]: value
      }
    }));
  };

  const saveEdits = () => {
    if (!formData.title || !formData.price || !formData.location) {
      alert('Please ensure Title, Price, and Location are filled in.');
      return;
    }
    const updated = properties.map(p => p.id === formData.id ? { ...formData } : p);
    saveToStorage(updated);
    setSelectedProperty(formData);
    setIsEditing(false);
    alert(`Corrections saved for ${formData.id}. The updated information will appear in the approved listing.`);
  };

  const updateStatus = (newStatus) => {
    if (isEditing) {
      alert("Please save your corrections before taking moderation action.");
      return;
    }

    // Check RERA rule: If Builder or New Project, RERA is required!
    const isBuilderOrNew = formData.ownerRole === 'Builder' || formData.condition === 'Under Construction';
    if (newStatus === 'Approved' && isBuilderOrNew && (!formData.reraNumber || formData.reraNumber.trim() === '')) {
      alert("RERA Registration Number is strictly required for Builder / New Project properties before approval.");
      return;
    }

    const updatedProperty = {
      ...formData,
      status: newStatus,
      adminRemarks: remarks || (newStatus === 'Rejected' ? rejectionReason : 'Verified & Approved by Admin'),
      verifiedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    const updated = properties.map(p => p.id === selectedProperty.id ? updatedProperty : p);
    saveToStorage(updated);
    setSelectedProperty(updatedProperty);
    setFormData(updatedProperty);
    setRemarks('');
    alert(`Listing ${selectedProperty.id} has been marked as ${newStatus}.`);
  };

  const deleteProperty = () => {
    if (window.confirm(`Are you sure you want to permanently delete listing ${selectedProperty.id}?`)) {
      const updated = properties.filter(p => p.id !== selectedProperty.id);
      saveToStorage(updated);
      setSelectedProperty(null);
      setFormData(null);
    }
  };

  const openLightbox = (index) => {
    setActiveImageIndex(index);
    setLightboxOpen(true);
  };

  // --- Filtering Logic ---
  const filteredProperties = properties.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === 'ALL' || p.category === activeCategory;
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesCondition = conditionFilter === 'All' || p.condition.toLowerCase().includes(conditionFilter.toLowerCase());

    return matchesSearch && matchesCategory && matchesStatus && matchesCondition;
  });

  const categories = ['ALL', 'Residential', 'Commercial', 'Industrial', 'Land'];

  const isCurrentBuilderOrNew = formData && (formData.ownerRole === 'Builder' || formData.condition === 'Under Construction');

  return (
    <div className="space-y-6">
      
      {/* ─── HEADER KPI CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Pending Review</span>
            <h3 className="text-xl font-black text-amber-500">{properties.filter(p => p.status === 'Pending').length} Listings</h3>
            <p className="text-[10px] text-[var(--text-subtle)]">Requires admin audit</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
        </div>

        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Live & Approved</span>
            <h3 className="text-xl font-black text-emerald-500">{properties.filter(p => p.status === 'Approved').length} Live</h3>
            <p className="text-[10px] text-[var(--text-subtle)]">Published on GharMB</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Commercial Listings</span>
            <h3 className="text-xl font-black text-blue-500">{properties.filter(p => p.category === 'Commercial').length} Spaces</h3>
            <p className="text-[10px] text-[var(--text-subtle)]">Office & Retail pipeline</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
            <Building2 size={20} />
          </div>
        </div>

        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">RERA Verified</span>
            <h3 className="text-xl font-black text-brand">{properties.filter(p => p.reraNumber && p.reraStatus === 'Verified').length} Projects</h3>
            <p className="text-[10px] text-[var(--text-subtle)]">100% Compliance</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-light text-brand flex items-center justify-center font-bold">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* ─── MAIN VERIFICATION WORKFLOW CONTAINER ─── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-3xl shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[750px]">
        
        {/* ─── LEFT PANEL: PROPERTY PIPELINE & SEARCH ─── */}
        <div className="w-full lg:w-[42%] xl:w-[38%] border-b lg:border-b-0 lg:border-r border-[var(--border)] flex flex-col bg-[var(--bg-muted)]/40">
          
          {/* Top Search & Filter Bar */}
          <div className="p-4 sm:p-5 border-b border-[var(--border)] space-y-4 bg-[var(--bg-surface)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[var(--text-primary)]">Property Pipeline</h2>
                <p className="text-[11px] text-[var(--text-muted)]">Select listing to inspect full details & photos</p>
              </div>
              <button 
                onClick={fetchProperties}
                className="p-2 rounded-xl text-[var(--text-muted)] hover:text-brand hover:bg-[var(--bg-muted)] transition-all cursor-pointer"
                title="Refresh Pipeline"
              >
                <RefreshCw size={15} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search by ID, Title, Builder, City..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand transition-all"
              />
            </div>

            {/* Category Pills (Residential vs Commercial vs ALL) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {categories.map((cat) => {
                const count = cat === 'ALL' ? properties.length : properties.filter(p => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeCategory === cat
                        ? 'bg-brand text-white shadow-xs shadow-brand/20'
                        : 'bg-[var(--bg-muted)] text-[var(--text-subtle)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                      activeCategory === cat ? 'bg-white/25 text-white' : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Status & Condition Dropdown Selectors */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider block mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending Review</option>
                  <option value="Approved">Approved (Live)</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider block mb-1">Condition</label>
                <select
                  value={conditionFilter}
                  onChange={(e) => setConditionFilter(e.target.value)}
                  className="w-full p-2 bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand cursor-pointer"
                >
                  <option value="All">All Types</option>
                  <option value="Under Construction">Under Construction</option>
                  <option value="Ready to Move">Ready to Move</option>
                  <option value="Resale">Resale</option>
                </select>
              </div>
            </div>
          </div>

          {/* Property List Cards */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 max-h-[600px] lg:max-h-none">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] font-semibold">Loading verification pipeline...</div>
            ) : filteredProperties.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] font-semibold">
                No property listings match the selected filters.
              </div>
            ) : (
              filteredProperties.map((p) => {
                const isSelected = selectedProperty?.id === p.id;
                const isCommercial = p.category === 'Commercial';

                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProperty(p)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-[var(--bg-surface)] border-brand shadow-md shadow-brand/10 ring-2 ring-brand/15'
                        : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Image Thumbnail */}
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-[var(--border)] bg-[var(--bg-muted)]">
                        <img 
                          src={p.images[0]} 
                          alt={p.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        />
                        <span className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-white text-[8px] font-bold px-1 rounded flex items-center gap-0.5">
                          <ImageIcon size={8} /> {p.images.length}
                        </span>
                      </div>

                      {/* Content Overview */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-black text-brand tracking-tight">{p.id}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            p.status === 'Approved'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : p.status === 'Rejected'
                              ? 'bg-red-500/10 text-red-500'
                              : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            {p.status}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">{p.title}</h4>
                        
                        <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 truncate">
                          <MapPin size={10} className="text-slate-400 shrink-0" />
                          <span className="truncate">{p.location}</span>
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-[var(--border-muted)]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[var(--bg-muted)] text-[var(--text-subtle)]">
                              {p.configuration.split(' ')[0]} {p.category}
                            </span>
                            {isCommercial && (
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600">
                                Commercial
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-extrabold text-[var(--text-primary)]">
                            ₹{p.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ─── RIGHT PANEL: COMPLETE LISTING INSPECTION & ADMIN EDIT ─── */}
        <div className="flex-1 flex flex-col bg-[var(--bg-surface)] overflow-y-auto">
          {!selectedProperty ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)]">
                <Building size={32} />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-base font-extrabold text-[var(--text-primary)]">Select Property for Complete Inspection</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Review complete listing details, examine all high-resolution photos, edit data corrections, and approve or reject properties.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-5 sm:p-6 lg:p-8 space-y-6">
              
              {/* ─── ACTION HEADER ─── */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-[var(--border)]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-brand bg-brand-light px-2.5 py-1 rounded-lg">
                      {formData.id}
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                      formData.status === 'Approved'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : formData.status === 'Rejected'
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      Status: {formData.status}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--text-muted)]">
                      Submitted on {formData.submittedDate}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-[var(--text-primary)] tracking-tight">
                    {formData.title}
                  </h2>
                </div>

                {/* Edit & Quick Action Buttons */}
                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  {isEditing ? (
                    <button
                      onClick={saveEdits}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <Save size={14} /> Save Corrections
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-xs font-extrabold transition-all cursor-pointer"
                    >
                      <Edit3 size={14} className="text-brand" /> Edit Listing
                    </button>
                  )}
                  <button
                    onClick={deleteProperty}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Delete Listing"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* ─── PHOTOS & MEDIA GALLERY (LIGHTBOX TRIGGER) ─── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={16} className="text-brand" />
                    <h3 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider">
                      Uploaded Photos & Media ({formData.images.length})
                    </h3>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] font-bold">Click photo to view high-res full lightbox</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {formData.images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => openLightbox(idx)}
                      className="group relative aspect-video rounded-2xl overflow-hidden border border-[var(--border)] cursor-pointer shadow-xs hover:shadow-md transition-all"
                    >
                      <img src={imgUrl} alt={`Property ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Eye size={18} />
                      </div>
                      {idx === 0 && (
                        <span className="absolute top-2 left-2 bg-brand text-white text-[8px] font-black px-2 py-0.5 rounded-md shadow-xs">
                          Cover Photo
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ─── SECTION 1: CORE SPECIFICATIONS (VIEW / EDIT FORM) ─── */}
              <div className="p-5 bg-[var(--bg-muted)]/60 rounded-2xl border border-[var(--border)] space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <h3 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                    <Home size={14} className="text-brand" /> Property Specifications
                  </h3>
                  {isEditing && (
                    <span className="text-[10px] font-extrabold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      Admin Edit Mode Active
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Property Title */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Listing Title</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="title" 
                        value={formData.title} 
                        onChange={handleInputChange} 
                        className="w-full p-2.5 bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] border border-[var(--border)] rounded-xl focus:border-brand focus:outline-none" 
                      />
                    ) : (
                      <p className="text-xs font-bold text-[var(--text-primary)]">{formData.title}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Property Category</label>
                    {isEditing ? (
                      <select 
                        name="category" 
                        value={formData.category} 
                        onChange={handleInputChange} 
                        className="w-full p-2.5 bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] border border-[var(--border)] rounded-xl focus:border-brand focus:outline-none"
                      >
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Industrial">Industrial</option>
                        <option value="Land">Plots / Land</option>
                      </select>
                    ) : (
                      <p className="text-xs font-bold text-[var(--text-primary)]">{formData.category} ({formData.subCategory})</p>
                    )}
                  </div>

                  {/* Configuration */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Configuration</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="configuration" 
                        value={formData.configuration} 
                        onChange={handleInputChange} 
                        className="w-full p-2.5 bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] border border-[var(--border)] rounded-xl focus:border-brand focus:outline-none" 
                      />
                    ) : (
                      <p className="text-xs font-bold text-[var(--text-primary)]">{formData.configuration}</p>
                    )}
                  </div>

                  {/* Super Area */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Super Built-up Area</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="area" 
                        value={formData.area} 
                        onChange={handleInputChange} 
                        className="w-full p-2.5 bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] border border-[var(--border)] rounded-xl focus:border-brand focus:outline-none" 
                      />
                    ) : (
                      <p className="text-xs font-bold text-[var(--text-primary)]">{formData.area} (Carpet: {formData.carpetArea})</p>
                    )}
                  </div>

                  {/* Condition */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Construction Condition</label>
                    {isEditing ? (
                      <select 
                        name="condition" 
                        value={formData.condition} 
                        onChange={handleInputChange} 
                        className="w-full p-2.5 bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] border border-[var(--border)] rounded-xl focus:border-brand focus:outline-none"
                      >
                        <option value="Under Construction">Under Construction</option>
                        <option value="Ready to Move">Ready to Move</option>
                        <option value="Resale">Resale</option>
                      </select>
                    ) : (
                      <p className="text-xs font-bold text-[var(--text-primary)]">{formData.condition}</p>
                    )}
                  </div>

                  {/* Floor & Facing */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Floor & Facing</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="floorInfo" 
                        value={formData.floorInfo} 
                        onChange={handleInputChange} 
                        className="w-full p-2.5 bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] border border-[var(--border)] rounded-xl focus:border-brand focus:outline-none" 
                      />
                    ) : (
                      <p className="text-xs font-bold text-[var(--text-primary)]">{formData.floorInfo} • {formData.facing}</p>
                    )}
                  </div>

                  {/* Furnishing */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Furnishing Status</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="furnishing" 
                        value={formData.furnishing} 
                        onChange={handleInputChange} 
                        className="w-full p-2.5 bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] border border-[var(--border)] rounded-xl focus:border-brand focus:outline-none" 
                      />
                    ) : (
                      <p className="text-xs font-bold text-[var(--text-primary)]">{formData.furnishing}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── SECTION 2: PRICING & FINANCIAL AUDIT ─── */}
              <div className="p-5 bg-[var(--bg-muted)]/60 rounded-2xl border border-[var(--border)] space-y-4">
                <h3 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5 border-b border-[var(--border)] pb-3">
                  <IndianRupee size={14} className="text-emerald-500" /> Pricing & Financial Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Total Listed Price</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="price" 
                        value={formData.price} 
                        onChange={handleInputChange} 
                        className="w-full p-2.5 bg-[var(--bg-surface)] text-sm font-black text-emerald-600 border border-[var(--border)] rounded-xl focus:border-brand focus:outline-none" 
                      />
                    ) : (
                      <p className="text-base font-black text-emerald-600">₹{formData.price}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Rate per Sq.Ft</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="pricePerSqFt" 
                        value={formData.pricePerSqFt} 
                        onChange={handleInputChange} 
                        className="w-full p-2.5 bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] border border-[var(--border)] rounded-xl focus:border-brand focus:outline-none" 
                      />
                    ) : (
                      <p className="text-xs font-bold text-[var(--text-primary)]">{formData.pricePerSqFt}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Maintenance Charges</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="maintenanceCharges" 
                        value={formData.maintenanceCharges} 
                        onChange={handleInputChange} 
                        className="w-full p-2.5 bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] border border-[var(--border)] rounded-xl focus:border-brand focus:outline-none" 
                      />
                    ) : (
                      <p className="text-xs font-bold text-[var(--text-primary)]">{formData.maintenanceCharges}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Booking Token Amount</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="tokenAmount" 
                        value={formData.tokenAmount} 
                        onChange={handleInputChange} 
                        className="w-full p-2.5 bg-[var(--bg-surface)] text-xs font-bold text-brand border border-[var(--border)] rounded-xl focus:border-brand focus:outline-none" 
                      />
                    ) : (
                      <p className="text-xs font-bold text-brand">{formData.tokenAmount}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── SECTION 3: COMMERCIAL-SPECIFIC AUDIT (If Commercial Property) ─── */}
              {formData.category === 'Commercial' && (
                <div className="p-5 bg-blue-500/5 rounded-2xl border border-blue-500/20 space-y-4">
                  <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
                    <h3 className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 size={14} /> Commercial Lease & Technical Parameters
                    </h3>
                    <span className="text-[9px] font-black bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full">
                      Commercial Specific Workflow
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Lock-in Period</label>
                      {isEditing ? (
                        <input 
                          type="text" 
                          name="lockInPeriod" 
                          value={formData.commercialTerms?.lockInPeriod || ''} 
                          onChange={handleCommercialChange} 
                          className="w-full p-2.5 bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] border border-[var(--border)] rounded-xl focus:border-brand focus:outline-none" 
                        />
                      ) : (
                        <p className="text-xs font-bold text-[var(--text-primary)]">{formData.commercialTerms?.lockInPeriod || 'N/A'}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Power Load & Backup</label>
                      {isEditing ? (
                        <input 
                          type="text" 
                          name="powerLoad" 
                          value={formData.commercialTerms?.powerLoad || ''} 
                          onChange={handleCommercialChange} 
                          className="w-full p-2.5 bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] border border-[var(--border)] rounded-xl focus:border-brand focus:outline-none" 
                        />
                      ) : (
                        <p className="text-xs font-bold text-[var(--text-primary)]">{formData.commercialTerms?.powerLoad || 'N/A'}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Zoning Approval</label>
                      {isEditing ? (
                        <input 
                          type="text" 
                          name="zoning" 
                          value={formData.commercialTerms?.zoning || ''} 
                          onChange={handleCommercialChange} 
                          className="w-full p-2.5 bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] border border-[var(--border)] rounded-xl focus:border-brand focus:outline-none" 
                        />
                      ) : (
                        <p className="text-xs font-bold text-[var(--text-primary)]">{formData.commercialTerms?.zoning || 'Commercial Approved'}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ─── SECTION 4: LOCATION & ADDRESS DETAILS ─── */}
              <div className="p-5 bg-[var(--bg-muted)]/60 rounded-2xl border border-[var(--border)] space-y-4">
                <h3 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5 border-b border-[var(--border)] pb-3">
                  <MapPin size={14} className="text-brand" /> Complete Location & Address
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Physical Address</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="location" 
                        value={formData.location} 
                        onChange={handleInputChange} 
                        className="w-full p-2.5 bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] border border-[var(--border)] rounded-xl focus:border-brand focus:outline-none" 
                      />
                    ) : (
                      <p className="text-xs font-bold text-[var(--text-primary)]">{formData.location}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">City & Pincode</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="city" 
                        value={formData.city} 
                        onChange={handleInputChange} 
                        className="w-full p-2.5 bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] border border-[var(--border)] rounded-xl focus:border-brand focus:outline-none" 
                      />
                    ) : (
                      <p className="text-xs font-bold text-[var(--text-primary)]">{formData.city} - {formData.pincode}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── SECTION 5: RERA COMPLIANCE & LISTED BY (CONDITIONAL RULES) ─── */}
              <div className={`p-5 rounded-2xl border space-y-4 ${
                isCurrentBuilderOrNew ? 'bg-blue-500/5 border-blue-500/20' : 'bg-slate-500/5 border-[var(--border)]'
              }`}>
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className={isCurrentBuilderOrNew ? 'text-blue-500' : 'text-slate-400'} />
                    <h3 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider">
                      Lister Identity & RERA Compliance
                    </h3>
                  </div>
                  {isCurrentBuilderOrNew ? (
                    <span className="text-[9px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-md uppercase">
                      RERA Mandatory for Builder / New Project
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold bg-slate-200 dark:bg-slate-800 text-[var(--text-subtle)] px-2 py-0.5 rounded-md">
                      RERA Not Required for {formData.ownerRole} Resale
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Listed By</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-[var(--text-primary)]">{formData.ownerName}</span>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border)] text-brand">
                        {formData.ownerRole}
                      </span>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)]">{formData.ownerPhone} • {formData.ownerEmail}</p>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">RERA Registration Number</label>
                    {isCurrentBuilderOrNew ? (
                      isEditing ? (
                        <input 
                          type="text" 
                          name="reraNumber" 
                          value={formData.reraNumber || ''} 
                          onChange={handleInputChange} 
                          placeholder="Enter Builder RERA Reg. No."
                          className="w-full p-2.5 bg-[var(--bg-surface)] text-xs font-bold text-blue-600 border border-blue-300 rounded-xl focus:border-blue-500 focus:outline-none" 
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-mono font-black text-blue-600 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">
                            {formData.reraNumber || 'MISSING RERA NUMBER'}
                          </p>
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 size={12} /> {formData.reraStatus}
                          </span>
                        </div>
                      )
                    ) : (
                      <p className="text-xs text-[var(--text-muted)] italic pt-1">
                        Exempted: RERA is not specifically required for Individual Owner or Agent Resale listings.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── SECTION 6: AMENITIES & FEATURES ─── */}
              <div className="p-5 bg-[var(--bg-muted)]/60 rounded-2xl border border-[var(--border)] space-y-3">
                <h3 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-brand" /> Confirmed Amenities & Features ({formData.amenities.length})
                </h3>
                <div className="flex flex-wrap gap-2 pt-1">
                  {formData.amenities.map((amenity, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1 bg-[var(--bg-surface)] text-[11px] font-bold text-[var(--text-subtle)] rounded-xl border border-[var(--border)] shadow-2xs flex items-center gap-1.5"
                    >
                      <Check size={11} className="text-emerald-500" /> {amenity}
                    </span>
                  ))}
                </div>
              </div>

              {/* ─── SECTION 7: ADMIN REVIEW CHECKLIST & FINAL DECISION ─── */}
              <div className="p-6 bg-[var(--bg-surface)] rounded-3xl border-2 border-brand/20 shadow-md space-y-5">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-brand" />
                    <div>
                      <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
                        Admin Moderation Review & Approval Decision
                      </h3>
                      <p className="text-[10px] text-[var(--text-muted)]">Verify essential parameters prior to approving the listing</p>
                    </div>
                  </div>
                </div>

                {/* Interactive Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'priceValid', label: 'Price & Area Validated' },
                    { key: 'photosApproved', label: 'All Photos Authenticated' },
                    { key: 'addressVerified', label: 'Physical Location Verified' },
                    { key: 'reraChecked', label: isCurrentBuilderOrNew ? 'Builder RERA Checked' : 'Resale Ownership Deed Checked' },
                    { key: 'amenitiesConfirmed', label: 'Amenities & Specs Confirmed' }
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setReviewChecklist(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        reviewChecklist[item.key]
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold'
                          : 'bg-[var(--bg-muted)] border-[var(--border)] text-[var(--text-muted)]'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                        reviewChecklist[item.key] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-400'
                      }`}>
                        {reviewChecklist[item.key] && <Check size={10} strokeWidth={3} />}
                      </div>
                      <span className="text-[10px]">{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Rejection / Remarks Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Admin Review Notes / Rejection Reason</label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter review remarks or specific feedback for the lister..."
                    className="w-full p-3 bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-2xl border border-[var(--border)] focus:outline-none focus:border-brand resize-none"
                  />
                </div>

                {/* Final Decision Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => updateStatus('Approved')}
                    className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <CheckCircle2 size={16} /> Approve & Publish Listing (Go Live)
                  </button>

                  <button
                    type="button"
                    onClick={() => updateStatus('Rejected')}
                    className="w-full sm:w-auto py-3 px-6 bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <XCircle size={16} /> Reject Listing
                  </button>

                  {formData.status !== 'Pending' && (
                    <button
                      type="button"
                      onClick={() => updateStatus('Pending')}
                      className="w-full sm:w-auto py-3 px-4 bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-xl text-xs font-extrabold transition-all cursor-pointer"
                    >
                      Move to Pending Queue
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* ─── FULL LIGHTBOX IMAGE GALLERY MODAL ─── */}
      {lightboxOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-8 animate-in fade-in duration-200">
          {/* Top Bar */}
          <div className="w-full flex items-center justify-between text-white max-w-5xl">
            <div className="space-y-0.5">
              <span className="text-xs font-black text-brand tracking-wide">{selectedProperty.id} - PHOTO GALLERY</span>
              <p className="text-sm font-extrabold">{selectedProperty.title} ({activeImageIndex + 1} of {selectedProperty.images.length})</p>
            </div>
            <button
              onClick={() => setLightboxOpen(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Main Photo View */}
          <div className="relative w-full max-w-5xl flex-1 flex items-center justify-center p-4">
            <button
              onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : selectedProperty.images.length - 1))}
              className="absolute left-2 sm:left-6 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all cursor-pointer z-10"
            >
              <ChevronLeft size={24} />
            </button>

            <img
              src={selectedProperty.images[activeImageIndex]}
              alt={`Property Large ${activeImageIndex + 1}`}
              className="max-h-[68vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
            />

            <button
              onClick={() => setActiveImageIndex((prev) => (prev < selectedProperty.images.length - 1 ? prev + 1 : 0))}
              className="absolute right-2 sm:right-6 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all cursor-pointer z-10"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Thumbnail Bar */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-2xl p-2 bg-white/10 rounded-2xl backdrop-blur-md">
            {selectedProperty.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImageIndex(i)}
                className={`w-16 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                  activeImageIndex === i ? 'border-brand scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt="thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default PropertyVerification;