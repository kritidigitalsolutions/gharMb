import React, { useState, useEffect } from 'react';
import {
  CreditCard, Home, Truck, Scale, Search, Filter, Plus,
  CheckCircle2, XCircle, Clock, ChevronRight, Phone,
  Mail, MapPin, IndianRupee, FileText, UserCheck,
  Building, Calendar, Send, Edit, Trash2, X, Eye,
  Sparkles, ShieldCheck, ArrowRight, Layers
} from 'lucide-react';

const ServicesManagement = () => {
  const [activeService, setActiveService] = useState('ALL'); // ALL, Loan, Interior, Movers, Legal
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [partnerAssignModal, setPartnerAssignModal] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [newQuotationAmount, setNewQuotationAmount] = useState('');
  const [adminNote, setAdminNote] = useState('');

  // Initial Service Inquiries Dataset
  const initialEnquiries = [
    {
      id: 'SRV-LN-101',
      serviceType: 'Loan',
      serviceName: 'Home Loan Assistance',
      clientName: 'Rajesh Kumar Malhotra',
      clientPhone: '+91 98111 22334',
      clientEmail: 'rajesh.malhotra@tcs.com',
      location: 'Sector 43, Noida',
      propertyRef: 'PROP-9821 (Godrej Woods)',
      propertyValue: '₹2.45 Cr',
      loanRequired: '₹1.80 Cr',
      employmentType: 'Salaried (IT Sector)',
      monthlyIncome: '₹2,80,000/mo',
      cibilScore: '785 (Excellent)',
      preferredBank: 'HDFC Bank / SBI',
      assignedPartner: 'HDFC Home Loans (Officer Amit)',
      quotation: 'Interest Rate 8.40% p.a. (Sanctioned)',
      date: '18 Jun 2026',
      status: 'In Progress',
      timeline: [
        { stage: 'Request Logged', date: '18 Jun 2026', status: 'done' },
        { stage: 'KYC & Salary Slips Collected', date: '18 Jun 2026', status: 'done' },
        { stage: 'Bank Processing & Verification', date: '19 Jun 2026', status: 'active' },
        { stage: 'Sanction & Disbursement', date: 'Pending', status: 'pending' }
      ],
      notes: 'Income documents authenticated. HDFC file login completed.'
    },
    {
      id: 'SRV-INT-204',
      serviceType: 'Interior',
      serviceName: 'Full Home Interior & Modular Kitchen',
      clientName: 'Pooja & Vikram Sharma',
      clientPhone: '+91 98200 88771',
      clientEmail: 'pooja.sharma@gmail.com',
      location: 'DLF Phase 2, Gurugram',
      propertyRef: 'PROP-4920 (3 BHK Floor)',
      propertyValue: '₹1.85 Cr',
      propertySize: '3 BHK (1500 sq.ft)',
      budgetRange: '₹12 Lakhs - ₹18 Lakhs',
      designStyle: 'Contemporary Minimalist with Italian Marble accents',
      scope: ['Modular Kitchen (Acrylic)', 'Wardrobes with profile lights', 'False Ceiling & Ambient Lighting', 'Living Room TV Unit'],
      assignedPartner: 'Studio Luxe Interiors (Designer Sneha)',
      quotation: '₹14,50,000 (3D Model Approved)',
      date: '17 Jun 2026',
      status: 'Quotation Sent',
      timeline: [
        { stage: 'Consultation Booked', date: '17 Jun 2026', status: 'done' },
        { stage: 'Site Measurement Done', date: '17 Jun 2026', status: 'done' },
        { stage: '3D Concept & BOQ Shared', date: '18 Jun 2026', status: 'active' },
        { stage: 'Execution & Handover', date: 'Pending', status: 'pending' }
      ],
      notes: 'Site visit completed by Sneha. Client requested VR walkthrough.'
    },
    {
      id: 'SRV-MOV-309',
      serviceType: 'Movers',
      serviceName: 'Intercity Relocation (Mumbai to Noida)',
      clientName: 'Dr. Alok Verma',
      clientPhone: '+91 99000 33445',
      clientEmail: 'dralok.verma@aiims.edu',
      location: 'Andheri East, Mumbai -> Sector 62, Noida',
      moveType: 'Intercity Relocation (3 BHK Household + 1 Car)',
      shiftingDate: '28 Jun 2026',
      packingQuality: 'Premium Multi-Layer Foam Packing',
      insuranceRequired: 'Yes (Goods value ₹25 Lakhs)',
      assignedPartner: 'Agarwal Premium Shifting Hub',
      quotation: '₹58,000 (All Inclusive + Transit Insurance)',
      date: '16 Jun 2026',
      status: 'Confirmed',
      timeline: [
        { stage: 'Moving Quote Requested', date: '16 Jun 2026', status: 'done' },
        { stage: 'Video Survey Done', date: '16 Jun 2026', status: 'done' },
        { stage: 'Advance Token Received', date: '17 Jun 2026', status: 'done' },
        { stage: 'Packing & Dispatch', date: 'Scheduled 28 Jun', status: 'pending' }
      ],
      notes: 'Fragile medical equipment included. Dedicated container truck assigned.'
    },
    {
      id: 'SRV-LEG-402',
      serviceType: 'Legal',
      serviceName: 'Title Verification & Sale Deed Registration',
      clientName: 'Farhan Merchant',
      clientPhone: '+91 98450 11223',
      clientEmail: 'farhan@merchantrealty.in',
      location: 'Andheri West, Mumbai',
      propertyRef: 'PROP-3310 (Oberoi Sky City)',
      propertyValue: '₹3.80 Cr',
      legalServiceScope: '30-Year Title Search Report, Society NOC & Deed Drafting',
      courtJurisdiction: 'Bombay High Court / Sub-Registrar Andheri',
      assignedPartner: 'Adv. M.K. Shinde (Senior Property Counsel)',
      quotation: '₹35,000 + Registry Stamp Duty Guidance',
      date: '15 Jun 2026',
      status: 'In Progress',
      timeline: [
        { stage: 'Case File Created', date: '15 Jun 2026', status: 'done' },
        { stage: 'Revenue Records & Encumbrance Audit', date: '16 Jun 2026', status: 'done' },
        { stage: 'Legal Title Opinion Drafted', date: '17 Jun 2026', status: 'active' },
        { stage: 'Sub-Registrar Slot Booking', date: 'Pending', status: 'pending' }
      ],
      notes: 'Clear marketable title verified for last 30 years without encumbrances.'
    }
  ];

  const [enquiries, setEnquiries] = useState(initialEnquiries);

  const partnersCatalog = {
    Loan: ['HDFC Bank Home Loans', 'State Bank of India (SBI)', 'ICICI Bank Home Finance', 'Axis Bank Loan Desk', 'Bajaj Housing Finance'],
    Interior: ['Studio Luxe Interiors', 'Livspace Certified Partner', 'HomeLane Studio', 'Urban Woodcrafts Delhi/NCR', 'DecorSpace Mumbai'],
    Movers: ['Agarwal Premium Shifting Hub', 'Gati Relocations', 'Porter Enterprise', 'SafeX Packers & Movers', 'UrbanMove Intercity'],
    Legal: ['Adv. M.K. Shinde (High Court Counsel)', 'LawDesk Property Advisors', 'LexJuris Legal Associates', 'Chambers of R.N. Joshi']
  };

  const handleAssignPartner = () => {
    if (!partnerAssignModal || !selectedPartner) return;
    const updated = enquiries.map(item => item.id === partnerAssignModal.id ? {
      ...item,
      assignedPartner: selectedPartner,
      quotation: newQuotationAmount ? `₹${newQuotationAmount}` : item.quotation,
      status: item.status === 'New' ? 'In Progress' : item.status
    } : item);
    setEnquiries(updated);
    if (selectedEnquiry?.id === partnerAssignModal.id) {
      setSelectedEnquiry({ ...selectedEnquiry, assignedPartner: selectedPartner, quotation: newQuotationAmount ? `₹${newQuotationAmount}` : selectedEnquiry.quotation });
    }
    setPartnerAssignModal(null);
    setSelectedPartner('');
    setNewQuotationAmount('');
    alert(`Service partner ${selectedPartner} assigned successfully.`);
  };

  const handleUpdateStatus = (id, newStatus) => {
    const updated = enquiries.map(e => e.id === id ? { ...e, status: newStatus } : e);
    setEnquiries(updated);
    if (selectedEnquiry?.id === id) {
      setSelectedEnquiry({ ...selectedEnquiry, status: newStatus });
    }
  };

  const filteredEnquiries = enquiries.filter(item => {
    const matchesService = activeService === 'ALL' || item.serviceType === activeService;
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesSearch = 
      item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.serviceName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesService && matchesStatus && matchesSearch;
  });

  const getServiceBadgeColor = (type) => {
    switch (type) {
      case 'Loan': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'Interior': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'Movers': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'Legal': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  const getServiceIcon = (type) => {
    switch (type) {
      case 'Loan': return <CreditCard size={14} className="text-blue-500" />;
      case 'Interior': return <Home size={14} className="text-purple-500" />;
      case 'Movers': return <Truck size={14} className="text-amber-500" />;
      case 'Legal': return <Scale size={14} className="text-emerald-500" />;
      default: return <Layers size={14} className="text-brand" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ─── HEADER & KPI METRICS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Loan Services Card */}
        <div 
          onClick={() => setActiveService('Loan')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeService === 'Loan' ? 'bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/20' : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Loan Services</span>
              <h3 className="text-xl font-black text-blue-600">
                {enquiries.filter(e => e.serviceType === 'Loan').length} Inquiries
              </h3>
              <p className="text-[10px] text-[var(--text-subtle)]">Home Loans & LAP</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <CreditCard size={20} />
            </div>
          </div>
        </div>

        {/* Home Interior Card */}
        <div 
          onClick={() => setActiveService('Interior')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeService === 'Interior' ? 'bg-purple-500/10 border-purple-500 ring-2 ring-purple-500/20' : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Home Interior</span>
              <h3 className="text-xl font-black text-purple-600">
                {enquiries.filter(e => e.serviceType === 'Interior').length} Projects
              </h3>
              <p className="text-[10px] text-[var(--text-subtle)]">Design & Modular Fitouts</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <Home size={20} />
            </div>
          </div>
        </div>

        {/* Packers & Movers Card */}
        <div 
          onClick={() => setActiveService('Movers')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeService === 'Movers' ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20' : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Packers & Movers</span>
              <h3 className="text-xl font-black text-amber-600">
                {enquiries.filter(e => e.serviceType === 'Movers').length} Moves
              </h3>
              <p className="text-[10px] text-[var(--text-subtle)]">Local & Intercity Relocation</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Truck size={20} />
            </div>
          </div>
        </div>

        {/* Legal Services Card */}
        <div 
          onClick={() => setActiveService('Legal')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeService === 'Legal' ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20' : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Legal Services</span>
              <h3 className="text-xl font-black text-emerald-600">
                {enquiries.filter(e => e.serviceType === 'Legal').length} Cases
              </h3>
              <p className="text-[10px] text-[var(--text-subtle)]">Title Search & Registry</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Scale size={20} />
            </div>
          </div>
        </div>

      </div>

      {/* ─── MAIN SERVICES PIPELINE & MANAGEMENT ─── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-3xl shadow-sm overflow-hidden p-6 space-y-5">
        
        {/* Filter Navigation Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          {/* Service Switcher Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {['ALL', 'Loan', 'Interior', 'Movers', 'Legal'].map((svc) => (
              <button
                key={svc}
                onClick={() => setActiveService(svc)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeService === svc
                    ? 'bg-brand text-white shadow-xs shadow-brand/20'
                    : 'bg-[var(--bg-muted)] text-[var(--text-subtle)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {svc === 'ALL' ? 'All Services' : svc === 'Loan' ? 'Home Loans' : svc === 'Interior' ? 'Home Interior' : svc === 'Movers' ? 'Packers & Movers' : 'Legal Services'}
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                  activeService === svc ? 'bg-white/25 text-white' : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                }`}>
                  {svc === 'ALL' ? enquiries.length : enquiries.filter(e => e.serviceType === svc).length}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Status Filter */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search by client, ID, service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 bg-[var(--bg-muted)] text-xs font-bold text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Quotation Sent">Quotation Sent</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Services Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[9px] font-black uppercase tracking-wider bg-[var(--bg-muted)]/60">
                <th className="py-3.5 px-4 rounded-l-xl">Service ID</th>
                <th className="py-3.5 px-4">Service Category</th>
                <th className="py-3.5 px-4">Client Name</th>
                <th className="py-3.5 px-4">Contact Phone</th>
                <th className="py-3.5 px-4">Target Location</th>
                <th className="py-3.5 px-4">Assigned Partner / Vendor</th>
                <th className="py-3.5 px-4">Quotation / Value</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-muted)] text-xs font-semibold">
              {filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-[var(--text-muted)] font-semibold">
                    No service inquiries match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredEnquiries.map((e) => (
                  <tr key={e.id} className="hover:bg-[var(--bg-muted)]/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand">{e.id}</td>
                    
                    {/* Service Type Tag */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {getServiceIcon(e.serviceType)}
                        <span className="font-extrabold text-[var(--text-primary)]">{e.serviceName}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-black text-[var(--text-primary)]">{e.clientName}</td>
                    <td className="py-3.5 px-4 font-mono text-[var(--text-subtle)]">{e.clientPhone}</td>
                    
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold text-[var(--text-subtle)] flex items-center gap-1">
                        <MapPin size={10} className="text-slate-400 shrink-0" /> {e.location}
                      </span>
                    </td>

                    {/* Assigned Partner */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => {
                          setPartnerAssignModal(e);
                          setSelectedPartner(e.assignedPartner || partnersCatalog[e.serviceType][0]);
                        }}
                        className="text-[10px] font-bold text-brand hover:underline flex items-center gap-1 bg-[var(--bg-muted)] px-2 py-1 rounded-lg border border-[var(--border)] cursor-pointer"
                        title="Click to assign / change partner"
                      >
                        <UserCheck size={10} />
                        <span className="truncate max-w-[140px]">{e.assignedPartner || 'Assign Partner'}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-emerald-600 font-bold">{e.quotation || 'Under Review'}</td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        e.status === 'Confirmed' || e.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600' :
                        e.status === 'Quotation Sent' ? 'bg-purple-500/10 text-purple-600' : 'bg-blue-500/10 text-blue-600'
                      }`}>
                        {e.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedEnquiry(e)}
                        className="px-2.5 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-[10px] font-extrabold transition-all cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ─── MODAL: ASSIGN SERVICE PARTNER / VENDOR ─── */}
      {partnerAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-3xl max-w-md w-full shadow-2xl border border-[var(--border)] p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <span className="text-[9px] font-black text-brand uppercase">Vendor Assignment</span>
                <h3 className="text-sm font-black text-[var(--text-primary)]">Assign: {partnerAssignModal.serviceName}</h3>
              </div>
              <button onClick={() => setPartnerAssignModal(null)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Select Approved Service Partner</label>
                <select
                  value={selectedPartner}
                  onChange={(e) => setSelectedPartner(e.target.value)}
                  className="w-full p-2.5 bg-[var(--bg-muted)] text-xs font-bold text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand cursor-pointer"
                >
                  {(partnersCatalog[partnerAssignModal.serviceType] || []).map((p, i) => (
                    <option key={i} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Quotation / Contract Amount (₹)</label>
                <input
                  type="text"
                  placeholder="e.g. 14,50,000"
                  value={newQuotationAmount}
                  onChange={(e) => setNewQuotationAmount(e.target.value)}
                  className="w-full p-2.5 bg-[var(--bg-muted)] text-xs font-bold text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleAssignPartner}
                className="flex-1 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-black shadow-md shadow-brand/20 transition-all cursor-pointer"
              >
                Confirm Partner & Quote
              </button>
              <button
                type="button"
                onClick={() => setPartnerAssignModal(null)}
                className="py-2.5 px-4 bg-[var(--bg-muted)] rounded-xl text-xs font-bold text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DRAWER: SERVICE INQUIRY INSPECTION ─── */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] h-full max-w-lg w-full shadow-2xl border-l border-[var(--border)] p-6 overflow-y-auto flex flex-col justify-between space-y-6">
            <div className="space-y-5 text-left">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-[var(--border)] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-brand bg-brand-light px-2 py-0.5 rounded">
                      {selectedEnquiry.id}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 uppercase">
                      {selectedEnquiry.serviceType} Service
                    </span>
                  </div>
                  <h3 className="text-base font-black text-[var(--text-primary)] mt-1">{selectedEnquiry.serviceName}</h3>
                  <p className="text-[10px] text-[var(--text-muted)]">{selectedEnquiry.clientName} • {selectedEnquiry.clientPhone}</p>
                </div>
                <button onClick={() => setSelectedEnquiry(null)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X size={16} />
                </button>
              </div>

              {/* Service Specifications Grid */}
              <div className="p-4 bg-[var(--bg-muted)] rounded-2xl space-y-2.5 text-xs font-semibold">
                <div className="flex justify-between border-b border-[var(--border-muted)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Location / Route</span>
                  <span className="text-[var(--text-primary)] font-bold">{selectedEnquiry.location}</span>
                </div>
                {selectedEnquiry.propertyRef && (
                  <div className="flex justify-between border-b border-[var(--border-muted)] pb-1.5">
                    <span className="text-[var(--text-muted)]">Linked Property</span>
                    <span className="text-brand font-bold">{selectedEnquiry.propertyRef}</span>
                  </div>
                )}
                {selectedEnquiry.loanRequired && (
                  <div className="flex justify-between border-b border-[var(--border-muted)] pb-1.5">
                    <span className="text-[var(--text-muted)]">Loan Required</span>
                    <span className="text-emerald-600 font-bold">{selectedEnquiry.loanRequired}</span>
                  </div>
                )}
                {selectedEnquiry.budgetRange && (
                  <div className="flex justify-between border-b border-[var(--border-muted)] pb-1.5">
                    <span className="text-[var(--text-muted)]">Interior Budget</span>
                    <span className="text-purple-600 font-bold">{selectedEnquiry.budgetRange}</span>
                  </div>
                )}
                {selectedEnquiry.shiftingDate && (
                  <div className="flex justify-between border-b border-[var(--border-muted)] pb-1.5">
                    <span className="text-[var(--text-muted)]">Shifting Date</span>
                    <span className="text-[var(--text-primary)] font-bold">{selectedEnquiry.shiftingDate}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-[var(--border-muted)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Assigned Partner</span>
                  <span className="text-[var(--text-primary)] font-bold">{selectedEnquiry.assignedPartner || 'Not assigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Quotation / Deal Value</span>
                  <span className="text-emerald-600 font-black">{selectedEnquiry.quotation || 'Pending'}</span>
                </div>
              </div>

              {/* Service Workflow Stages Timeline */}
              <div className="space-y-3">
                <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider block">
                  Service Execution Stages
                </label>
                <div className="space-y-2">
                  {selectedEnquiry.timeline && selectedEnquiry.timeline.map((step, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-[var(--bg-muted)] rounded-xl text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${step.status === 'done' ? 'bg-emerald-500' : step.status === 'active' ? 'bg-blue-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                        <span className={`font-bold ${step.status === 'active' ? 'text-brand' : 'text-[var(--text-primary)]'}`}>
                          {step.stage}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)]">{step.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Service Notes</label>
                <p className="text-xs p-3 bg-[var(--bg-muted)] text-[var(--text-subtle)] rounded-xl italic border-l-2 border-brand">
                  "{selectedEnquiry.notes || 'Inquiry registered. Initial contact made.'}"
                </p>
              </div>

            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[var(--border)] space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPartnerAssignModal(selectedEnquiry);
                    setSelectedPartner(selectedEnquiry.assignedPartner || partnersCatalog[selectedEnquiry.serviceType][0]);
                  }}
                  className="py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  Update Partner / Quote
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedEnquiry.id, 'Completed')}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  Mark Completed
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ServicesManagement;
