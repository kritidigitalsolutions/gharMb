import React, { useState, useEffect } from 'react';
import {
  PhoneCall, MessageSquare, FileSpreadsheet, CalendarDays,
  ArrowRight, TrendingUp, Percent, MapPin, ExternalLink,
  Search, Filter, UserCheck, Plus, Trash2, X, XCircle,
  AlertCircle, Activity, Edit, CheckCircle2, Building,
  Building2, Eye, IndianRupee, Home, User, Send, Clock
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Sector
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const LeadsDashboard = () => {
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);

  // Tab: 'leads' or 'buyer_needs'
  const [activeTab, setActiveTab] = useState('leads');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState('All');

  // Modals
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [propertyPreviewModal, setPropertyPreviewModal] = useState(null);
  const [assignModalLead, setAssignModalLead] = useState(null);
  const [selectedAgentToAssign, setSelectedAgentToAssign] = useState('Executive Vikram (Noida/East)');

  // Form states
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadProperty, setNewLeadProperty] = useState('');
  const [newLeadLocation, setNewLeadLocation] = useState('Andheri, Mumbai');
  const [newLeadType, setNewLeadType] = useState('WhatsApp');
  const [noteText, setNoteText] = useState('');

  const [leads, setLeads] = useState([]);

  const isMockMode = !localStorage.getItem('adminToken') || localStorage.getItem('adminToken') === 'mock_admin_token_2026';

  // Available Locations for Location-Wise Lead Routing
  const locationsList = [
    'All',
    'Andheri, Mumbai',
    'Bandra, Mumbai',
    'Sector 43, Noida',
    'Sector 62, Noida',
    'DLF Phase 2, Gurugram',
    'Sohna Road, Gurugram',
    'Whitefield, Bangalore',
    'Koramangala, Bangalore'
  ];

  const areaAgents = [
    { name: 'Executive Vikram', region: 'Noida & NCR East', count: 18 },
    { name: 'Executive Sneha', region: 'Gurugram & Sohna Road', count: 24 },
    { name: 'Agent Priya Sharma', region: 'Andheri & Mumbai Western Suburbs', count: 32 },
    { name: 'Agent Rahul Deshmukh', region: 'Bandra & South Mumbai', count: 15 },
    { name: 'Agent Karthik R.', region: 'Whitefield & Bangalore Tech Corridor', count: 21 }
  ];

  // Property registry reference for quick modal linking
  const propertyCatalog = {
    'PROP-9821': {
      id: 'PROP-9821',
      title: 'Godrej Woods Sector 43',
      location: 'Sector 43, Noida, Uttar Pradesh',
      price: '₹2.45 Cr',
      type: '3 BHK Luxury Apartment',
      builder: 'Godrej Properties Ltd',
      area: '2050 sq.ft',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80',
      status: 'Live on GharMB'
    },
    'PROP-4920': {
      id: 'PROP-4920',
      title: 'Premium 3 BHK Builder Floor DLF',
      location: 'DLF Phase 2, Gurugram, Haryana',
      price: '₹1.85 Cr',
      type: '3 BHK Builder Floor',
      builder: 'Sandeep Sharma (Agent Resale)',
      area: '1500 sq.ft',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
      status: 'Live on GharMB'
    },
    'PROP-7730': {
      id: 'PROP-7730',
      title: 'DLF Cyber City Grade-A Commercial Office',
      location: 'DLF Cyber City, Sector 24, Gurugram',
      price: '₹14.50 Cr',
      type: 'Commercial Office Space (80 Desks)',
      builder: 'DLF Commercial Division',
      area: '6500 sq.ft',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
      status: 'Live on GharMB'
    },
    'PROP-1082': {
      id: 'PROP-1082',
      title: 'Vatika City High-Street Retail Shop',
      location: 'Sohna Road, Sector 49, Gurugram',
      price: '₹3.20 Cr',
      type: 'Ground Floor Commercial Retail',
      builder: 'Amit Varma (Owner)',
      area: '850 sq.ft',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
      status: 'Live on GharMB'
    },
    'PROP-3310': {
      id: 'PROP-3310',
      title: 'Oberoi Sky City Andheri East',
      location: 'Andheri, Mumbai, Maharashtra',
      price: '₹3.80 Cr',
      type: '3 BHK High-rise Luxury',
      builder: 'Oberoi Realty',
      area: '1750 sq.ft',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
      status: 'Live on GharMB'
    },
    'PROP-5501': {
      id: 'PROP-5501',
      title: 'Prestige Shantiniketan Whitefield',
      location: 'Whitefield, Bangalore, Karnataka',
      price: '₹1.95 Cr',
      type: '3 BHK Modern Flat',
      builder: 'Prestige Group',
      area: '1900 sq.ft',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
      status: 'Live on GharMB'
    }
  };

  const initialLeads = [
    {
      id: 'LED-3210',
      _id: 'mock_l1',
      client: 'Ankit Sharma',
      phone: '+91 98765 00112',
      email: 'ankit.sharma@gmail.com',
      propertyId: 'PROP-9821',
      propertyName: 'Godrej Woods Sector 43',
      location: 'Sector 43, Noida',
      type: 'WhatsApp Link Click',
      budget: '₹2.50 Cr',
      date: '18 Jun 2026',
      status: 'Pending',
      assignedTo: 'Executive Vikram',
      rawMsg: 'Looking for 3 BHK park facing flat in Sector 43. When can we schedule site visit?',
      notes: [{ date: '18 Jun 2026', text: 'WhatsApp inquiry received, routed to Noida desk.' }]
    },
    {
      id: 'LED-4921',
      _id: 'mock_l2',
      client: 'Pooja Mehta',
      phone: '+91 98123 45678',
      email: 'pooja.mehta@yahoo.com',
      propertyId: 'PROP-4920',
      propertyName: 'Premium 3 BHK Builder Floor DLF',
      location: 'DLF Phase 2, Gurugram',
      type: 'Call Callback Request',
      budget: '₹1.90 Cr',
      date: '18 Jun 2026',
      status: 'Contacted',
      assignedTo: 'Executive Sneha',
      rawMsg: 'Require immediate possession in DLF Phase 2. Is price negotiable?',
      notes: [{ date: '18 Jun 2026', text: 'Called client. Sent brochure and floor plans on WhatsApp.' }]
    },
    {
      id: 'LED-6612',
      _id: 'mock_l3',
      client: 'Farhan Merchant',
      phone: '+91 98200 44556',
      email: 'farhan.m@merchantcorp.com',
      propertyId: 'PROP-3310',
      propertyName: 'Oberoi Sky City Andheri East',
      location: 'Andheri, Mumbai',
      type: 'Site Visit Scheduled',
      budget: '₹3.80 Cr',
      date: '17 Jun 2026',
      status: 'Contacted',
      assignedTo: 'Agent Priya Sharma',
      rawMsg: 'Site visit confirmed for Saturday 4 PM at Andheri site sales gallery.',
      notes: [{ date: '17 Jun 2026', text: 'Assigned to Area Specialist Priya for VIP physical walkthrough.' }]
    },
    {
      id: 'LED-8802',
      _id: 'mock_l4',
      client: 'Rajesh Malhotra',
      phone: '+91 88990 01122',
      email: 'rajesh.malhotra@tcs.com',
      propertyId: 'PROP-5501',
      propertyName: 'Prestige Shantiniketan Whitefield',
      location: 'Whitefield, Bangalore',
      type: 'Portal Forms Inquiry',
      budget: '₹2.00 Cr',
      date: '16 Jun 2026',
      status: 'Resolved',
      assignedTo: 'Agent Karthik R.',
      rawMsg: 'Need loan assistance as well. Looking for 3 BHK flat ready for occupation.',
      notes: [{ date: '16 Jun 2026', text: 'Token discussion initiated. Client linked with Loan Services desk.' }]
    },
    {
      id: 'LED-9910',
      _id: 'mock_l5',
      client: 'Vikram Joshi (Co-working Tech)',
      phone: '+91 99112 23344',
      email: 'v.joshi@techpulse.io',
      propertyId: 'PROP-7730',
      propertyName: 'DLF Cyber City Grade-A Commercial Office',
      location: 'DLF Phase 2, Gurugram',
      type: 'Portal Forms Inquiry',
      budget: '₹15.00 Cr',
      date: '16 Jun 2026',
      status: 'Pending',
      assignedTo: 'Executive Sneha',
      rawMsg: 'Commercial IT office space required for 80 tech employees with lock-in terms.',
      notes: [{ date: '16 Jun 2026', text: 'Corporate commercial inquiry. Commercial desk review scheduled.' }]
    }
  ];

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const saved = localStorage.getItem('gharmb_leads_master');
      if (saved) {
        setLeads(JSON.parse(saved));
      } else {
        setLeads(initialLeads);
        localStorage.setItem('gharmb_leads_master', JSON.stringify(initialLeads));
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
      setLeads(initialLeads);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const saveLeadsToStorage = (updated) => {
    setLeads(updated);
    localStorage.setItem('gharmb_leads_master', JSON.stringify(updated));
  };

  // --- Handlers ---
  const handleOpenPropertyModal = (propertyId, propertyName) => {
    const prop = propertyCatalog[propertyId] || {
      id: propertyId || 'PROP-GEN',
      title: propertyName || 'Linked Property',
      location: 'Verified Listing Location',
      price: 'Price on Request',
      type: 'Residential/Commercial',
      builder: 'Registered Partner',
      area: '1500 sq.ft',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80',
      status: 'Verified'
    };
    setPropertyPreviewModal(prop);
  };

  const handleAssignLead = (lead) => {
    setAssignModalLead(lead);
    setSelectedAgentToAssign(lead.assignedTo || 'Executive Vikram (Noida/East)');
  };

  const confirmAssignment = () => {
    if (!assignModalLead) return;
    const updated = leads.map(l => l.id === assignModalLead.id ? { 
      ...l, 
      assignedTo: selectedAgentToAssign.split(' (')[0],
      notes: [...(l.notes || []), { date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), text: `Re-assigned to ${selectedAgentToAssign}` }]
    } : l);
    saveLeadsToStorage(updated);
    if (selectedLead?.id === assignModalLead.id) {
      setSelectedLead({ ...selectedLead, assignedTo: selectedAgentToAssign.split(' (')[0] });
    }
    setAssignModalLead(null);
    alert(`Lead ${assignModalLead.id} assigned to ${selectedAgentToAssign}.`);
  };

  const handleAddNote = () => {
    if (!noteText.trim() || !selectedLead) return;
    const newNote = {
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      text: noteText
    };
    const updated = leads.map(l => l.id === selectedLead.id ? {
      ...l,
      notes: [...(l.notes || []), newNote]
    } : l);
    saveLeadsToStorage(updated);
    setSelectedLead({ ...selectedLead, notes: [...(selectedLead.notes || []), newNote] });
    setNoteText('');
  };

  const handleUpdateStatus = (leadId, newStatus) => {
    const updated = leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l);
    saveLeadsToStorage(updated);
    if (selectedLead?.id === leadId) {
      setSelectedLead({ ...selectedLead, status: newStatus });
    }
  };

  // --- Filtered Leads ---
  const filteredLeads = leads.filter(l => {
    const matchesSearch =
      l.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone.includes(searchTerm) ||
      l.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.propertyId && l.propertyId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.location && l.location.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedTypeFilter === 'All' || l.type.includes(selectedTypeFilter);
    const matchesLocation = selectedLocationFilter === 'All' || (l.location && l.location.toLowerCase().includes(selectedLocationFilter.toLowerCase().split(',')[0]));

    return matchesSearch && matchesType && matchesLocation;
  });

  // Source Stats
  const sourceData = [
    { name: 'WhatsApp Link Click', value: leads.filter(l => l.type.includes('WhatsApp')).length || 2, color: '#25D366' },
    { name: 'Call Callback Request', value: leads.filter(l => l.type.includes('Call')).length || 1, color: '#3B82F6' },
    { name: 'Portal Forms Inquiry', value: leads.filter(l => l.type.includes('Portal')).length || 3, color: '#FF5A3C' },
    { name: 'Site Visit Booking', value: leads.filter(l => l.type.includes('Site Visit')).length || 1, color: '#10B981' }
  ];

  return (
    <div className="space-y-6">
      
      {/* ─── TOP KPI SUMMARY & LOCATION FILTER BAR ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Total Enquiries</span>
            <h3 className="text-xl font-black text-[var(--text-primary)]">{leads.length} Active Leads</h3>
            <p className="text-[10px] text-[var(--text-subtle)]">Across all top micro-markets</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-light text-brand flex items-center justify-center font-bold">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Location Filter</span>
            <h3 className="text-sm font-black text-blue-600 truncate max-w-[140px]">{selectedLocationFilter}</h3>
            <p className="text-[10px] text-[var(--text-subtle)]">
              {selectedLocationFilter === 'All' ? 'Showing all regions' : `${filteredLeads.length} leads in this market`}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
            <MapPin size={20} />
          </div>
        </div>

        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Site Visits Booked</span>
            <h3 className="text-xl font-black text-emerald-600">{leads.filter(l => l.type.includes('Site Visit')).length} Visits</h3>
            <p className="text-[10px] text-[var(--text-subtle)]">High purchase intent</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <CalendarDays size={20} />
          </div>
        </div>

        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Area Agents Deployed</span>
            <h3 className="text-xl font-black text-[var(--text-primary)]">{areaAgents.length} Agents</h3>
            <p className="text-[10px] text-[var(--text-subtle)]">Location-routed routing</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
            <UserCheck size={20} />
          </div>
        </div>
      </div>

      {/* ─── LOCATION SELECTION PILLS (REQUIREMENT 5) ─── */}
      <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-brand" />
            <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
              Location-Wise Inquiry Routing (Select Market)
            </span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-bold">
            Filter and assign inquiries to area specialists
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {locationsList.map((loc) => {
            const count = loc === 'All' ? leads.length : leads.filter(l => l.location && l.location.toLowerCase().includes(loc.toLowerCase().split(',')[0])).length;
            return (
              <button
                key={loc}
                onClick={() => setSelectedLocationFilter(loc)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedLocationFilter === loc
                    ? 'bg-brand text-white shadow-sm shadow-brand/25 ring-2 ring-brand/20'
                    : 'bg-[var(--bg-muted)] text-[var(--text-subtle)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <span>{loc}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                  selectedLocationFilter === loc ? 'bg-white/25 text-white' : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── MAIN LEADS & BUYER NEEDS TABLE ─── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-3xl shadow-sm overflow-hidden p-6 space-y-5">
        
        {/* Header & Mode Switcher */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 bg-[var(--bg-muted)] p-1 rounded-2xl border border-[var(--border)]">
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'leads' ? 'bg-brand text-white shadow-xs' : 'text-[var(--text-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              All Inquiries Log ({filteredLeads.length})
            </button>
            <button
              onClick={() => setActiveTab('buyer_needs')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'buyer_needs' ? 'bg-brand text-white shadow-xs' : 'text-[var(--text-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              Buyer Needs & Property Matches
            </button>
          </div>

          {/* Quick Search & Filters */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search by client, property, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand"
              />
            </div>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="p-2 bg-[var(--bg-muted)] text-xs font-bold text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Call">Call Back</option>
              <option value="Site Visit">Site Visit</option>
              <option value="Portal">Portal Form</option>
            </select>
          </div>
        </div>

        {/* ─── TAB 1: ALL INQUIRIES LIST (WITH DIRECT PROPERTY LINKS) ─── */}
        {activeTab === 'leads' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[9px] font-black uppercase tracking-wider bg-[var(--bg-muted)]/60">
                  <th className="py-3.5 px-4 rounded-l-xl">Lead ID</th>
                  <th className="py-3.5 px-4">Client Name</th>
                  <th className="py-3.5 px-4">Contact Phone</th>
                  {/* DIRECT CLICKABLE PROPERTY COLUMN (REQUIREMENT 6) */}
                  <th className="py-3.5 px-4">
                    <span className="flex items-center gap-1 text-brand">
                      Interested Property <ExternalLink size={10} />
                    </span>
                  </th>
                  <th className="py-3.5 px-4">Property Location</th>
                  <th className="py-3.5 px-4">Inquiry Channel</th>
                  <th className="py-3.5 px-4">Assigned Agent</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-muted)] text-xs font-semibold">
                {isLoading ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-[var(--text-muted)] font-semibold">Loading inquiries log...</td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-[var(--text-muted)] font-semibold">No lead inquiries found for the selected filter.</td>
                  </tr>
                ) : (
                  filteredLeads.map((l) => (
                    <tr key={l.id} className="hover:bg-[var(--bg-muted)]/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand">{l.id}</td>
                      <td className="py-3.5 px-4 font-black text-[var(--text-primary)]">{l.client}</td>
                      <td className="py-3.5 px-4 font-mono text-[var(--text-subtle)]">{l.phone}</td>
                      
                      {/* DIRECT CLICKABLE PROPERTY BUTTON / LINK (REQUIREMENT 6) */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleOpenPropertyModal(l.propertyId, l.propertyName)}
                          className="group text-left p-1.5 -m-1.5 rounded-xl hover:bg-brand/10 transition-all cursor-pointer flex items-center gap-1.5 max-w-[220px]"
                          title="Click to inspect linked property details"
                        >
                          <span className="text-[10px] font-black text-brand bg-brand-light dark:bg-brand/20 px-1.5 py-0.5 rounded shrink-0">
                            {l.propertyId || 'PROP'}
                          </span>
                          <span className="font-extrabold text-[var(--text-primary)] group-hover:text-brand truncate">
                            {l.propertyName}
                          </span>
                        </button>
                      </td>

                      {/* Location Badge */}
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold text-[var(--text-subtle)] flex items-center gap-1">
                          <MapPin size={10} className="text-slate-400 shrink-0" /> {l.location}
                        </span>
                      </td>

                      {/* Channel */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full ${
                          l.type.includes('WhatsApp') ? 'bg-green-500/10 text-green-600' :
                          l.type.includes('Call') ? 'bg-blue-500/10 text-blue-600' :
                          l.type.includes('Site Visit') ? 'bg-emerald-500/10 text-emerald-600' : 'bg-orange-500/10 text-brand'
                        }`}>
                          {l.type.split(' ')[0]}
                        </span>
                      </td>

                      {/* Assigned Agent & Route Trigger (REQUIREMENT 5) */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleAssignLead(l)}
                          className="text-[10px] font-bold text-[var(--text-primary)] hover:text-brand flex items-center gap-1 bg-[var(--bg-muted)] px-2 py-1 rounded-lg border border-[var(--border)] cursor-pointer"
                          title="Click to route or re-assign to Area Specialist"
                        >
                          <User size={10} className="text-slate-400" />
                          <span className="truncate max-w-[100px]">{l.assignedTo}</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          l.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-600' :
                          l.status === 'Contacted' ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {l.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLead(l)}
                          className="px-2.5 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-[10px] font-extrabold transition-all cursor-pointer"
                        >
                          Inspect Lead
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* ─── TAB 2: BUYER NEEDS & MATCHED PROPERTIES (REQUIREMENT 6) ─── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leads.map((l) => (
              <div key={l.id} className="p-5 bg-[var(--bg-muted)]/50 rounded-2xl border border-[var(--border)] space-y-3.5">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                  <div>
                    <span className="text-[9px] font-black text-brand uppercase">{l.id} • Buyer Need</span>
                    <h4 className="text-sm font-black text-[var(--text-primary)]">{l.client}</h4>
                  </div>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    Budget: {l.budget}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[var(--text-muted)]">Target Location:</span>
                    <span className="font-bold text-[var(--text-primary)] flex items-center gap-1">
                      <MapPin size={10} className="text-brand" /> {l.location}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[var(--text-muted)]">Client Contact:</span>
                    <span className="font-mono text-[var(--text-subtle)]">{l.phone}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[var(--text-muted)]">Assigned Specialist:</span>
                    <span className="font-bold text-[var(--text-primary)]">{l.assignedTo}</span>
                  </div>
                </div>

                {/* Direct Interested Property Card */}
                <div className="p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] space-y-2">
                  <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider block">
                    Interested Property Listing
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-extrabold text-[var(--text-primary)]">{l.propertyName}</p>
                      <span className="text-[9px] font-mono text-brand">{l.propertyId}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenPropertyModal(l.propertyId, l.propertyName)}
                      className="px-2.5 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-lg text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Eye size={12} /> View Listing
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ─── MODAL 1: DIRECT PROPERTY INSPECTION (REQUIREMENT 6) ─── */}
      {propertyPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-3xl max-w-lg w-full shadow-2xl border border-[var(--border)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header Image Preview */}
            <div className="relative aspect-video w-full overflow-hidden bg-[var(--bg-muted)]">
              <img src={propertyPreviewModal.image} alt={propertyPreviewModal.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-5 text-white">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black bg-brand px-2 py-0.5 rounded uppercase">
                    {propertyPreviewModal.id}
                  </span>
                  <h3 className="text-base font-black text-white">{propertyPreviewModal.title}</h3>
                  <p className="text-xs text-white/80">{propertyPreviewModal.location}</p>
                </div>
              </div>
              <button
                onClick={() => setPropertyPreviewModal(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Property Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[var(--bg-muted)] rounded-xl">
                  <span className="text-[8px] font-extrabold text-[var(--text-muted)] uppercase block">Listed Price</span>
                  <span className="text-sm font-black text-emerald-600 block mt-0.5">{propertyPreviewModal.price}</span>
                </div>
                <div className="p-3 bg-[var(--bg-muted)] rounded-xl">
                  <span className="text-[8px] font-extrabold text-[var(--text-muted)] uppercase block">Property Type</span>
                  <span className="text-xs font-bold text-[var(--text-primary)] block mt-0.5 truncate">{propertyPreviewModal.type}</span>
                </div>
                <div className="p-3 bg-[var(--bg-muted)] rounded-xl">
                  <span className="text-[8px] font-extrabold text-[var(--text-muted)] uppercase block">Super Area</span>
                  <span className="text-xs font-bold text-[var(--text-primary)] block mt-0.5">{propertyPreviewModal.area}</span>
                </div>
                <div className="p-3 bg-[var(--bg-muted)] rounded-xl">
                  <span className="text-[8px] font-extrabold text-[var(--text-muted)] uppercase block">Lister / Builder</span>
                  <span className="text-xs font-bold text-[var(--text-primary)] block mt-0.5 truncate">{propertyPreviewModal.builder}</span>
                </div>
              </div>

              {/* Direct Jump to Verification */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPropertyPreviewModal(null);
                    navigate('/admin/verification');
                  }}
                  className="flex-1 py-3 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-black shadow-md shadow-brand/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink size={14} /> Open Full Property Verification
                </button>
                <button
                  type="button"
                  onClick={() => setPropertyPreviewModal(null)}
                  className="py-3 px-4 bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─── MODAL 2: ASSIGN / ROUTE TO AREA AGENT (REQUIREMENT 5) ─── */}
      {assignModalLead && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-3xl max-w-md w-full shadow-2xl border border-[var(--border)] p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <span className="text-[9px] font-black text-brand uppercase">Location-Wise Routing</span>
                <h3 className="text-sm font-black text-[var(--text-primary)]">Assign Lead: {assignModalLead.client}</h3>
              </div>
              <button onClick={() => setAssignModalLead(null)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={16} />
              </button>
            </div>

            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-xs space-y-1">
              <p className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                <MapPin size={12} /> Target Market: {assignModalLead.location}
              </p>
              <p className="text-[10px] text-[var(--text-subtle)]">
                Select an area specialist agent best suited for this location to handle call visits.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Select Area Agent</label>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {areaAgents.map((agent) => (
                  <button
                    key={agent.name}
                    type="button"
                    onClick={() => setSelectedAgentToAssign(`${agent.name} (${agent.region})`)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      selectedAgentToAssign.startsWith(agent.name)
                        ? 'bg-brand text-white border-brand shadow-xs'
                        : 'bg-[var(--bg-muted)] border-[var(--border)] hover:border-slate-400'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-black">{agent.name}</p>
                      <p className={`text-[9px] ${selectedAgentToAssign.startsWith(agent.name) ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
                        {agent.region}
                      </p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                      selectedAgentToAssign.startsWith(agent.name) ? 'bg-white/20 text-white' : 'bg-[var(--bg-surface)] text-[var(--text-subtle)]'
                    }`}>
                      {agent.count} active
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={confirmAssignment}
                className="flex-1 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-black shadow-md shadow-brand/20 transition-all cursor-pointer"
              >
                Confirm Area Routing
              </button>
              <button
                type="button"
                onClick={() => setAssignModalLead(null)}
                className="py-2.5 px-4 bg-[var(--bg-muted)] rounded-xl text-xs font-bold text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DRAWER: INSPECT LEAD & NOTES ─── */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] h-full max-w-md w-full shadow-2xl border-l border-[var(--border)] p-6 overflow-y-auto flex flex-col justify-between space-y-6">
            <div className="space-y-5 text-left">
              <div className="flex justify-between items-start border-b border-[var(--border)] pb-3">
                <div>
                  <span className="text-[9px] font-black text-brand bg-brand-light px-2 py-0.5 rounded">
                    LEAD PROFILE
                  </span>
                  <h3 className="text-base font-black text-[var(--text-primary)] mt-1">{selectedLead.client}</h3>
                  <p className="text-[10px] font-mono text-[var(--text-muted)]">{selectedLead.id}</p>
                </div>
                <button onClick={() => setSelectedLead(null)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X size={16} />
                </button>
              </div>

              {/* Lead Data Grid */}
              <div className="p-4 bg-[var(--bg-muted)] rounded-2xl space-y-2.5 text-xs font-semibold">
                <div className="flex justify-between border-b border-[var(--border-muted)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Interested Property</span>
                  <button
                    onClick={() => handleOpenPropertyModal(selectedLead.propertyId, selectedLead.propertyName)}
                    className="font-black text-brand hover:underline truncate max-w-[180px] text-right"
                  >
                    {selectedLead.propertyName}
                  </button>
                </div>
                <div className="flex justify-between border-b border-[var(--border-muted)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Location</span>
                  <span className="text-[var(--text-primary)]">{selectedLead.location}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border-muted)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Phone</span>
                  <span className="font-mono text-[var(--text-primary)]">{selectedLead.phone}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border-muted)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Assigned Agent</span>
                  <span className="text-[var(--text-primary)] font-bold">{selectedLead.assignedTo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Status</span>
                  <span className="text-emerald-600 font-bold">{selectedLead.status}</span>
                </div>
              </div>

              {/* Client Query Note */}
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase">Client Message</label>
                <div className="p-3 bg-[var(--bg-muted)] rounded-xl text-xs text-[var(--text-subtle)] italic border-l-2 border-brand">
                  "{selectedLead.rawMsg}"
                </div>
              </div>

              {/* Agent Call Notes Tracker */}
              <div className="space-y-3">
                <label className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase">Agent Follow-up Timeline</label>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {selectedLead.notes && selectedLead.notes.map((n, i) => (
                    <div key={i} className="p-2.5 bg-[var(--bg-muted)] rounded-xl text-xs space-y-1">
                      <div className="flex justify-between text-[9px] font-black text-[var(--text-muted)]">
                        <span>Agent Log</span>
                        <span>{n.date}</span>
                      </div>
                      <p className="text-[var(--text-subtle)]">{n.text}</p>
                    </div>
                  ))}
                </div>

                {/* Add Note Box */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Log call notes, visit feedback..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="flex-1 p-2 bg-[var(--bg-muted)] text-xs font-medium text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={handleAddNote}
                    className="px-3 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-dark transition-all"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Status Buttons */}
            <div className="pt-4 border-t border-[var(--border)] space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedLead.id, 'Contacted')}
                  className="py-2 bg-blue-500/10 text-blue-600 font-bold rounded-xl text-[10px] hover:bg-blue-500/20 transition-all cursor-pointer"
                >
                  Mark Contacted
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedLead.id, 'Resolved')}
                  className="py-2 bg-emerald-500/10 text-emerald-600 font-bold rounded-xl text-[10px] hover:bg-emerald-500/20 transition-all cursor-pointer"
                >
                  Mark Resolved
                </button>
                <button
                  type="button"
                  onClick={() => handleAssignLead(selectedLead)}
                  className="py-2 bg-brand/10 text-brand font-bold rounded-xl text-[10px] hover:bg-brand/20 transition-all cursor-pointer"
                >
                  Re-Route Agent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LeadsDashboard;
