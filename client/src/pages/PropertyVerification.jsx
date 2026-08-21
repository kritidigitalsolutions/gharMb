import React, { useState, useEffect } from 'react';
import {
  Search, RefreshCw, MapPin, Building, Building2,
  Clock, CheckCircle2, XCircle, ChevronRight, ChevronLeft,
  Edit3, Save, X, Trash2, Image as ImageIcon,
  ShieldCheck, AlertCircle, IndianRupee, User,
  Maximize, Home, Sparkles, Filter, Eye, Check,
  ExternalLink, Layers, FileText, Phone, Mail,
  Calendar, Award, CheckSquare, Compass, ShieldAlert,
  ArrowRight, Download, FileCheck, HardHat
} from 'lucide-react';

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const API_BASE = RAW_API_URL.replace(/\/+api\/?$/i, '').replace(/\/+$/, '');
const API_URL = `${API_BASE}/api`;

const PropertyVerification = () => {
  // --- States ---
  const [activePipeline, setActivePipeline] = useState('properties'); // 'properties' or 'projects'
  const [properties, setProperties] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters & Category
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL'); // ALL, Residential, Commercial, Industrial, Land
  const [statusFilter, setStatusFilter] = useState('All'); // All, Pending, Approved, Rejected
  const [conditionFilter, setConditionFilter] = useState('All');
  
  // Selection & Editing
  const [selectedItem, setSelectedItem] = useState(null); // Property or Project
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('Documents incomplete');

  // Lightbox Modal state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Review checklist state
  const [reviewChecklist, setReviewChecklist] = useState({
    priceValid: false,
    photosApproved: false,
    addressVerified: false,
    reraChecked: false,
    amenitiesConfirmed: false
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // Helper to format currency
  const formatCurrency = (val) => {
    if (!val || isNaN(val)) return '0';
    const num = Number(val);
    if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(2)} L`;
    return num.toLocaleString('en-IN');
  };

  // Map Backend Property to UI model
  const mapPropertyToUi = (p) => {
    const images = Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80'];

    const carpet = Number(p.carpetArea) || 0;
    const priceNum = Number(p.price) || 0;
    const pricePerSqFt = carpet > 0 && priceNum > 0
      ? `₹${Math.round(priceNum / carpet).toLocaleString('en-IN')}/sq.ft`
      : 'N/A';

    return {
      _id: p._id,
      id: p.submissionId || `PROP-${p._id.slice(-4).toUpperCase()}`,
      title: p.title || 'Untitled Property',
      category: p.category || 'Residential',
      subCategory: p.propertyType || 'Apartment',
      configuration: `${p.bedrooms ? p.bedrooms + ' BHK ' : ''}${p.propertyType || 'Property'}`,
      ownerName: p.owner?.companyName || p.owner?.name || 'Property Lister',
      ownerRole: p.listingAs || (p.owner?.role === 'builder' ? 'Builder' : p.owner?.role === 'agent' ? 'Agent' : 'Owner'),
      ownerPhone: p.owner?.phone || 'N/A',
      ownerEmail: p.owner?.email || 'N/A',
      location: `${p.fullAddress || ''} ${p.locality ? p.locality + ', ' : ''}${p.city || ''}${p.pincode ? ' - ' + p.pincode : ''}`.trim() || 'Location not specified',
      locality: p.locality || '',
      city: p.city || '',
      pincode: p.pincode || '',
      price: formatCurrency(p.price),
      priceVal: priceNum,
      pricePerSqFt,
      maintenanceCharges: p.maintenanceCharges ? `₹${Number(p.maintenanceCharges).toLocaleString('en-IN')}/month` : 'N/A',
      tokenAmount: p.securityDeposit ? `₹${Number(p.securityDeposit).toLocaleString('en-IN')}` : '₹1,00,000',
      area: `${p.builtUpArea || p.carpetArea || 0} sq.ft`,
      carpetArea: `${p.carpetArea || 0} sq.ft`,
      condition: p.ageOfProperty || 'Ready to Move',
      possessionDate: p.ageOfProperty || 'Immediate',
      floorInfo: p.floorNo ? `${p.floorNo} of ${p.totalFloors || 'N/A'} Floors` : 'N/A',
      facing: p.facingDirection ? `${p.facingDirection} Facing` : 'East Facing',
      furnishing: p.furnishing || 'Unfurnished',
      reraNumber: p.propertyDocuments?.reraCertificate || '',
      reraStatus: p.approvalStatus === 'approved' ? 'Verified' : 'Pending Verification',
      amenities: Array.isArray(p.amenities) && p.amenities.length > 0 ? p.amenities : ['24/7 Security', 'Power Backup'],
      status: p.approvalStatus === 'approved' ? 'Approved' : p.approvalStatus === 'rejected' ? 'Rejected' : 'Pending',
      approvalStatus: p.approvalStatus || 'pending',
      isLive: p.isLive || false,
      submittedDate: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
      images,
      propertyDocuments: p.propertyDocuments || {},
      documents: Array.isArray(p.documents) ? p.documents : [],
      description: p.description || '',
      commercialTerms: {
        lockInPeriod: p.lockInPeriod || 'N/A',
        securityDeposit: p.securityDeposit ? `₹${Number(p.securityDeposit).toLocaleString('en-IN')}` : 'N/A',
        powerLoad: p.powerLoad ? `${p.powerLoad} kVA` : 'N/A',
        parkingRatio: 'Dedicated Slots Available',
        acType: 'Central Chiller / Split',
        zoning: 'Commercial Approved'
      },
      itemType: 'property'
    };
  };

  // Map Backend Project to UI model
  const mapProjectToUi = (p) => {
    const images = Array.isArray(p.projectPhotos) && p.projectPhotos.length > 0
      ? p.projectPhotos
      : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80'];

    return {
      _id: p._id,
      id: p.submissionId || `PRJ-${p._id.slice(-4).toUpperCase()}`,
      title: p.projectName || 'Developer Project',
      category: 'Residential',
      subCategory: p.projectType || 'Project',
      configuration: `${p.towers ? p.towers + ' Towers • ' : ''}${p.totalUnits ? p.totalUnits + ' Total Units' : 'Gated Township'}`,
      ownerName: p.developerName || p.developer?.companyName || p.developer?.name || 'Developer',
      ownerRole: 'Builder',
      ownerPhone: p.developer?.phone || 'N/A',
      ownerEmail: p.developer?.email || 'N/A',
      location: `${p.fullAddress || ''} ${p.locality ? p.locality + ', ' : ''}${p.city || ''}${p.pincode ? ' - ' + p.pincode : ''}`.trim() || 'Location not specified',
      locality: p.locality || '',
      city: p.city || '',
      pincode: p.pincode || '',
      price: p.bhkConfigurations?.[0] ? formatCurrency(p.bhkConfigurations[0].minPrice) + ' onw.' : 'Price on Request',
      priceVal: p.bhkConfigurations?.[0]?.minPrice || 0,
      pricePerSqFt: 'N/A',
      maintenanceCharges: 'N/A',
      tokenAmount: '₹2,50,000',
      area: `${p.openSpacePercentage || 70}% Open Green Area`,
      carpetArea: `${p.bhkConfigurations?.[0]?.carpetArea || 0} sq.ft onw.`,
      condition: p.projectStatus || 'Under construction',
      possessionDate: p.possessionDate || 'Dec 2026',
      floorInfo: p.floors || 'G + 14 Floors',
      facing: 'Vastu Compliant Layout',
      furnishing: 'Bare Shell / Semi-Furnished',
      reraNumber: p.reraProjectNumber || 'Pending RERA',
      reraStatus: p.approvalStatus === 'approved' ? 'Verified' : 'Pending Verification',
      amenities: Array.isArray(p.amenities) && p.amenities.length > 0 ? p.amenities : ['Clubhouse', 'Swimming Pool', 'Gym', '24/7 Security'],
      status: p.approvalStatus === 'approved' ? 'Approved' : p.approvalStatus === 'rejected' ? 'Rejected' : 'Pending',
      approvalStatus: p.approvalStatus || 'pending',
      isLive: p.isLive || false,
      submittedDate: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
      images,
      bhkConfigurations: Array.isArray(p.bhkConfigurations) ? p.bhkConfigurations : [],
      masterPlanUrl: p.masterPlanUrl,
      floorPlanUrl: p.floorPlanUrl,
      brochureUrl: p.brochureUrl,
      projectWebsite: p.projectWebsite,
      projectTagline: p.projectTagline,
      description: p.shortDescription || '',
      itemType: 'project'
    };
  };

  // --- Fetch All Data from Backend ---
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch Properties
      const propRes = await fetch(`${API_URL}/admin/properties`, {
        headers: getAuthHeaders()
      });
      const propData = await propRes.json();
      if (propRes.ok && propData.status === 'success') {
        const mapped = (propData.data?.properties || []).map(mapPropertyToUi);
        setProperties(mapped);
      }

      // 2. Fetch Projects
      const projRes = await fetch(`${API_URL}/admin/projects`, {
        headers: getAuthHeaders()
      });
      const projData = await projRes.json();
      if (projRes.ok && projData.status === 'success') {
        const mappedProj = (projData.data?.projects || []).map(mapProjectToUi);
        setProjects(mappedProj);
      }
    } catch (err) {
      console.error('Error fetching admin moderation data:', err);
      setError('Could not connect to backend server. Please verify backend is running on port 5001.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Handlers ---
  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setFormData({ ...item });
    setIsEditing(false);
    setRemarks('');
    setReviewChecklist({
      priceValid: item.status === 'Approved',
      photosApproved: item.status === 'Approved',
      addressVerified: item.status === 'Approved',
      reraChecked: item.status === 'Approved',
      amenitiesConfirmed: item.status === 'Approved'
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

  // Save Edits to backend
  const saveEdits = async () => {
    if (!formData.title || !formData.price || !formData.location) {
      alert('Please ensure Title, Price, and Location are filled in.');
      return;
    }

    try {
      const endpoint = formData.itemType === 'project'
        ? `${API_URL}/projects/${formData._id}`
        : `${API_URL}/properties/${formData._id}`;

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: formData.title,
          price: formData.priceVal || formData.price,
          fullAddress: formData.location,
          city: formData.city,
          locality: formData.locality,
          category: formData.category,
          condition: formData.condition,
          reraNumber: formData.reraNumber
        })
      });

      if (res.ok) {
        alert(`Corrections successfully saved for ${formData.id}.`);
        setIsEditing(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to save edits to server.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while saving edits.');
    }
  };

  // Real-time Update Status (Approve / Reject) in MongoDB
  const updateStatus = async (newStatus) => {
    if (!selectedItem) return;

    if (isEditing) {
      alert("Please save your corrections before taking moderation action.");
      return;
    }

    const apiStatus = newStatus === 'Approved' ? 'approved' : newStatus === 'Rejected' ? 'rejected' : 'pending';
    const activeRemarks = remarks || (newStatus === 'Rejected' ? rejectionReason : 'Verified & Approved by Admin');

    try {
      const endpoint = selectedItem.itemType === 'project'
        ? `${API_URL}/admin/projects/${selectedItem._id}/status`
        : `${API_URL}/admin/properties/${selectedItem._id}/status`;

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          approvalStatus: apiStatus,
          rejectionReason: activeRemarks
        })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        alert(`Listing ${selectedItem.id} marked as ${newStatus} (${newStatus === 'Approved' ? 'LIVE on platform' : 'Hidden from public'}).`);
        setRemarks('');
        await fetchData();

        // Update active selection view
        if (selectedItem.itemType === 'project') {
          const updated = (data.data?.project) ? mapProjectToUi(data.data.project) : null;
          if (updated) {
            setSelectedItem(updated);
            setFormData(updated);
          }
        } else {
          const updated = (data.data?.property) ? mapPropertyToUi(data.data.property) : null;
          if (updated) {
            setSelectedItem(updated);
            setFormData(updated);
          }
        }
      } else {
        alert(data.message || 'Failed to update approval status.');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Connection error while updating status.');
    }
  };

  // Permanently Delete from DB
  const deleteItem = async () => {
    if (!selectedItem) return;

    if (!window.confirm(`Are you sure you want to permanently delete listing ${selectedItem.id} from the database?`)) {
      return;
    }

    try {
      const endpoint = selectedItem.itemType === 'project'
        ? `${API_URL}/admin/projects/${selectedItem._id}`
        : `${API_URL}/admin/properties/${selectedItem._id}`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (res.ok) {
        alert(`Listing ${selectedItem.id} permanently deleted.`);
        setSelectedItem(null);
        setFormData(null);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete listing.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server.');
    }
  };

  const openLightbox = (index) => {
    setActiveImageIndex(index);
    setLightboxOpen(true);
  };

  // Determine active item list
  const currentList = activePipeline === 'properties' ? properties : projects;

  // Filtering Logic
  const filteredItems = currentList.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === 'ALL' || p.category === activeCategory;
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesCondition = conditionFilter === 'All' || p.condition.toLowerCase().includes(conditionFilter.toLowerCase());

    return matchesSearch && matchesCategory && matchesStatus && matchesCondition;
  });

  const categories = ['ALL', 'Residential', 'Commercial', 'Industrial', 'Land'];
  const isCurrentBuilderOrNew = formData && (formData.ownerRole === 'Builder' || formData.condition === 'Under Construction' || formData.itemType === 'project');

  return (
    <div className="space-y-6">
      
      {/* ─── HEADER KPI CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Pending Moderation</span>
            <h3 className="text-xl font-black text-amber-500">
              {properties.filter(p => p.status === 'Pending').length + projects.filter(p => p.status === 'Pending').length} Listings
            </h3>
            <p className="text-[10px] text-[var(--text-subtle)]">Requires admin audit</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
        </div>

        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Live & Approved</span>
            <h3 className="text-xl font-black text-emerald-500">
              {properties.filter(p => p.status === 'Approved').length + projects.filter(p => p.status === 'Approved').length} Live
            </h3>
            <p className="text-[10px] text-[var(--text-subtle)]">Published on GharMB</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Developer Projects</span>
            <h3 className="text-xl font-black text-blue-500">{projects.length} Projects</h3>
            <p className="text-[10px] text-[var(--text-subtle)]">Builder townships & towers</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
            <Building2 size={20} />
          </div>
        </div>

        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Total in Database</span>
            <h3 className="text-xl font-black text-brand">{properties.length + projects.length} Listings</h3>
            <p className="text-[10px] text-[var(--text-subtle)]">Live MongoDB records</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-light text-brand flex items-center justify-center font-bold">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* ─── MAIN VERIFICATION WORKFLOW CONTAINER ─── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-3xl shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[750px]">
        
        {/* ─── LEFT PANEL: PIPELINE & SEARCH ─── */}
        <div className="w-full lg:w-[42%] xl:w-[38%] border-b lg:border-b-0 lg:border-r border-[var(--border)] flex flex-col bg-[var(--bg-muted)]/40">
          
          {/* Top Pipeline Switcher & Search Bar */}
          <div className="p-4 sm:p-5 border-b border-[var(--border)] space-y-4 bg-[var(--bg-surface)]">
            
            {/* Pipeline Switcher: Properties vs Developer Projects */}
            <div className="flex items-center gap-2 p-1 bg-[var(--bg-muted)] rounded-2xl border border-[var(--border)]">
              <button
                onClick={() => {
                  setActivePipeline('properties');
                  setSelectedItem(null);
                }}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activePipeline === 'properties'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Home size={14} /> Properties ({properties.length})
              </button>

              <button
                onClick={() => {
                  setActivePipeline('projects');
                  setSelectedItem(null);
                }}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activePipeline === 'projects'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Building2 size={14} /> Projects ({projects.length})
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[var(--text-primary)]">
                  {activePipeline === 'properties' ? 'Property Moderation Pipeline' : 'Developer Projects Pipeline'}
                </h2>
                <p className="text-[11px] text-[var(--text-muted)]">Select listing to inspect full details, photos & documents</p>
              </div>
              <button 
                onClick={fetchData}
                className="p-2 rounded-xl text-[var(--text-muted)] hover:text-brand hover:bg-[var(--bg-muted)] transition-all cursor-pointer"
                title="Refresh Live Data"
              >
                <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search by ID, Title, City, Owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand transition-all"
              />
            </div>

            {/* Category Pills (Residential vs Commercial vs ALL) */}
            {activePipeline === 'properties' && (
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
            )}

            {/* Status & Condition Dropdowns */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider block mb-1">Approval Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand cursor-pointer"
                >
                  <option value="All">All ({currentList.length})</option>
                  <option value="Pending">Pending Review ({currentList.filter(p => p.status === 'Pending').length})</option>
                  <option value="Approved">Approved / Live ({currentList.filter(p => p.status === 'Approved').length})</option>
                  <option value="Rejected">Rejected ({currentList.filter(p => p.status === 'Rejected').length})</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider block mb-1">Stage / Condition</label>
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

          {/* Listing Cards Feed */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 max-h-[600px] lg:max-h-none">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] font-semibold flex flex-col items-center gap-2">
                <RefreshCw size={20} className="animate-spin text-brand" />
                Loading live database records...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] font-semibold">
                No {activePipeline} match the selected filters.
              </div>
            ) : (
              filteredItems.map((p) => {
                const isSelected = selectedItem?._id === p._id;
                const isCommercial = p.category === 'Commercial';

                return (
                  <div
                    key={p._id}
                    onClick={() => handleSelectItem(p)}
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
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400';
                          }}
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
                              {p.ownerRole}
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

        {/* ─── RIGHT PANEL: COMPLETE LISTING INSPECTION & ADMIN ACTIONS ─── */}
        <div className="flex-1 flex flex-col bg-[var(--bg-surface)] overflow-y-auto">
          {!selectedItem ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)]">
                {activePipeline === 'properties' ? <Building size={32} /> : <Building2 size={32} />}
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-base font-extrabold text-[var(--text-primary)]">Select Item for Complete Moderation</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Review complete listing details, inspect photos & verification documents uploaded via Postman/Web, edit fields, and approve or reject listings.
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
                      Status: {formData.status} {formData.isLive ? '(Live)' : '(Hidden)'}
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
                      <Edit3 size={14} className="text-brand" /> Edit Details
                    </button>
                  )}
                  <button
                    onClick={deleteItem}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Permanently Delete Listing"
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
                      className="group relative aspect-video rounded-2xl overflow-hidden border border-[var(--border)] cursor-pointer shadow-xs hover:shadow-md transition-all bg-[var(--bg-muted)]"
                    >
                      <img 
                        src={imgUrl} 
                        alt={`Photo ${idx + 1}`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400';
                        }}
                      />
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

              {/* ─── SECTION 1: CORE SPECIFICATIONS ─── */}
              <div className="p-5 bg-[var(--bg-muted)]/60 rounded-2xl border border-[var(--border)] space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <h3 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                    <Home size={14} className="text-brand" /> Specifications & Configuration
                  </h3>
                  {isEditing && (
                    <span className="text-[10px] font-extrabold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      Admin Edit Mode Active
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Title */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Title</label>
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
                    <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Category / Type</label>
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
                    <p className="text-xs font-bold text-[var(--text-primary)]">{formData.configuration}</p>
                  </div>

                  {/* Area */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Carpet & Built-up Area</label>
                    <p className="text-xs font-bold text-[var(--text-primary)]">{formData.area} (Carpet: {formData.carpetArea})</p>
                  </div>

                  {/* Condition / Stage */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Condition / Stage</label>
                    <p className="text-xs font-bold text-[var(--text-primary)]">{formData.condition}</p>
                  </div>

                  {/* Floor & Facing */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Floor & Facing</label>
                    <p className="text-xs font-bold text-[var(--text-primary)]">{formData.floorInfo} • {formData.facing}</p>
                  </div>

                  {/* Furnishing */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Furnishing</label>
                    <p className="text-xs font-bold text-[var(--text-primary)]">{formData.furnishing}</p>
                  </div>

                  {/* Price */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Price</label>
                    <p className="text-sm font-black text-emerald-600">₹{formData.price}</p>
                  </div>
                </div>
              </div>

              {/* ─── SECTION 2: DEVELOPER PROJECT BHK PLANS (IF PROJECT) ─── */}
              {formData.itemType === 'project' && Array.isArray(formData.bhkConfigurations) && formData.bhkConfigurations.length > 0 && (
                <div className="p-5 bg-blue-500/5 rounded-2xl border border-blue-500/20 space-y-4">
                  <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={14} /> BHK Unit Configurations & Price Ranges ({formData.bhkConfigurations.length} Unit Types)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {formData.bhkConfigurations.map((bhk, idx) => (
                      <div key={idx} className="p-3.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-brand">{bhk.bhkType}</span>
                          <span className="text-[10px] font-bold text-[var(--text-muted)]">{bhk.carpetArea} sq.ft</span>
                        </div>
                        <p className="text-xs font-extrabold text-emerald-600">{bhk.priceRangeText || `₹${formatCurrency(bhk.minPrice)} - ₹${formatCurrency(bhk.maxPrice)}`}</p>
                        {bhk.availableUnits && (
                          <span className="text-[9px] text-[var(--text-muted)]">{bhk.availableUnits} units available</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── SECTION 3: DOCUMENTS & VERIFICATION ATTACHMENTS ─── */}
              <div className="p-5 bg-amber-500/5 rounded-2xl border border-amber-500/20 space-y-4">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                  <h3 className="text-xs font-extrabold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={14} /> Uploaded Property Documents & Plans
                  </h3>
                  <span className="text-[9px] font-bold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full">
                    Auto-attached via Upload API
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Property Documents */}
                  {formData.propertyDocuments && Object.entries(formData.propertyDocuments).map(([docKey, docUrl]) => {
                    if (!docUrl) return null;
                    return (
                      <a
                        key={docKey}
                        href={docUrl.startsWith('http') ? docUrl : `${API_BASE}/${docUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 bg-[var(--bg-surface)] border border-[var(--border)] hover:border-brand rounded-xl flex items-center justify-between transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileCheck size={16} className="text-emerald-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[var(--text-primary)] capitalize truncate">{docKey.replace(/([A-Z])/g, ' $1')}</p>
                            <span className="text-[9px] text-[var(--text-muted)]">Click to open document</span>
                          </div>
                        </div>
                        <ExternalLink size={14} className="text-slate-400 group-hover:text-brand transition-colors shrink-0" />
                      </a>
                    );
                  })}

                  {/* Project Plans & Brochure */}
                  {formData.masterPlanUrl && (
                    <a
                      href={formData.masterPlanUrl.startsWith('http') ? formData.masterPlanUrl : `${API_BASE}/${formData.masterPlanUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-[var(--bg-surface)] border border-[var(--border)] hover:border-brand rounded-xl flex items-center justify-between transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Compass size={16} className="text-blue-500 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-[var(--text-primary)]">Master Plan</p>
                          <span className="text-[9px] text-[var(--text-muted)]">View master layout</span>
                        </div>
                      </div>
                      <ExternalLink size={14} className="text-slate-400 group-hover:text-brand" />
                    </a>
                  )}

                  {formData.floorPlanUrl && (
                    <a
                      href={formData.floorPlanUrl.startsWith('http') ? formData.floorPlanUrl : `${API_BASE}/${formData.floorPlanUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-[var(--bg-surface)] border border-[var(--border)] hover:border-brand rounded-xl flex items-center justify-between transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Layers size={16} className="text-indigo-500 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-[var(--text-primary)]">Floor Plan</p>
                          <span className="text-[9px] text-[var(--text-muted)]">View floor blueprint</span>
                        </div>
                      </div>
                      <ExternalLink size={14} className="text-slate-400 group-hover:text-brand" />
                    </a>
                  )}

                  {formData.brochureUrl && (
                    <a
                      href={formData.brochureUrl.startsWith('http') ? formData.brochureUrl : `${API_BASE}/${formData.brochureUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-[var(--bg-surface)] border border-[var(--border)] hover:border-brand rounded-xl flex items-center justify-between transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Download size={16} className="text-purple-500 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-[var(--text-primary)]">Project Brochure</p>
                          <span className="text-[9px] text-[var(--text-muted)]">Download PDF</span>
                        </div>
                      </div>
                      <ExternalLink size={14} className="text-slate-400 group-hover:text-brand" />
                    </a>
                  )}
                </div>
              </div>

              {/* ─── SECTION 4: LOCATION & ADDRESS ─── */}
              <div className="p-5 bg-[var(--bg-muted)]/60 rounded-2xl border border-[var(--border)] space-y-3">
                <h3 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={14} className="text-brand" /> Physical Location & Address
                </h3>
                <p className="text-xs font-bold text-[var(--text-primary)]">{formData.location}</p>
              </div>

              {/* ─── SECTION 5: LISTER IDENTITY & RERA ─── */}
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
                      RERA Checked for Builder / Project
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold bg-slate-200 dark:bg-slate-800 text-[var(--text-subtle)] px-2 py-0.5 rounded-md">
                      {formData.ownerRole} Resale
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
                    <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">RERA Registration</label>
                    <p className="text-xs font-mono font-black text-blue-600 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20 inline-block">
                      {formData.reraNumber || 'EXEMPTED / NOT APPLICABLE'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ─── SECTION 6: AMENITIES ─── */}
              <div className="p-5 bg-[var(--bg-muted)]/60 rounded-2xl border border-[var(--border)] space-y-3">
                <h3 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-brand" /> Confirmed Amenities ({formData.amenities.length})
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

              {/* ─── SECTION 7: ADMIN REVIEW & APPROVAL DECISION ─── */}
              <div className="p-6 bg-[var(--bg-surface)] rounded-3xl border-2 border-brand/20 shadow-md space-y-5">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-brand" />
                    <div>
                      <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
                        Admin Moderation Review & Approval Decision
                      </h3>
                      <p className="text-[10px] text-[var(--text-muted)]">Verify parameters prior to approving the listing to live public feed</p>
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
                    placeholder="Enter review remarks or reason for rejection if declining..."
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
      {lightboxOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="w-full flex items-center justify-between text-white max-w-5xl">
            <div className="space-y-0.5">
              <span className="text-xs font-black text-brand tracking-wide">{selectedItem.id} - PHOTO GALLERY</span>
              <p className="text-sm font-extrabold">{selectedItem.title} ({activeImageIndex + 1} of {selectedItem.images.length})</p>
            </div>
            <button
              onClick={() => setLightboxOpen(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative w-full max-w-5xl flex-1 flex items-center justify-center p-4">
            <button
              onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : selectedItem.images.length - 1))}
              className="absolute left-2 sm:left-6 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all cursor-pointer z-10"
            >
              <ChevronLeft size={24} />
            </button>

            <img
              src={selectedItem.images[activeImageIndex]}
              alt={`Photo ${activeImageIndex + 1}`}
              className="max-h-[68vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800';
              }}
            />

            <button
              onClick={() => setActiveImageIndex((prev) => (prev < selectedItem.images.length - 1 ? prev + 1 : 0))}
              className="absolute right-2 sm:right-6 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all cursor-pointer z-10"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto max-w-2xl p-2 bg-white/10 rounded-2xl backdrop-blur-md">
            {selectedItem.images.map((img, i) => (
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