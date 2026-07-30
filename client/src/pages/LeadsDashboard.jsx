import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  MessageSquare,
  FileSpreadsheet,
  CalendarDays,
  ArrowRight,
  TrendingUp,
  Percent,
  MapPin,
  ExternalLink,
  Search,
  Filter,
  UserCheck,
  Plus,
  Trash2,
  X,
  XCircle,
  AlertCircle,
  Activity,
  Edit,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  Sector
} from 'recharts';

const LeadsDashboard = () => {
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [hoveredFunnel, setHoveredFunnel] = useState(null);
  const [isAnimated, setIsAnimated] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');

  // Modals & Detail state
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);

  // Add Lead Form state
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadProperty, setNewLeadProperty] = useState('');
  const [newLeadType, setNewLeadType] = useState('WhatsApp');
  const [newLeadAssignee, setNewLeadAssignee] = useState('Executive Vikram');
  const [newLeadStatus, setNewLeadStatus] = useState('Pending');

  // Callback note input state
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Stats summary
  const summaryStats = [
    { title: 'Daily Leads', value: '184', change: '+14.2%', trend: 'up', color: 'text-orange-600 bg-orange-500/10', gradient: 'from-[var(--bg-surface)] to-orange-500/10' },
    { title: 'Monthly Leads Logged', value: '4,890', change: '+18.6%', trend: 'up', color: 'text-indigo-600 bg-indigo-500/10', gradient: 'from-[var(--bg-surface)] to-indigo-500/10' },
    { title: 'Funnel Conversion Rate', value: '3.82%', change: '+0.5%', trend: 'up', color: 'text-emerald-600 bg-emerald-500/10', gradient: 'from-[var(--bg-surface)] to-emerald-500/10' },
    { title: 'Site Visits', value: '482 Booked', change: '+12.4%', trend: 'up', color: 'text-blue-600 bg-blue-500/10', gradient: 'from-[var(--bg-surface)] to-blue-500/10' }
  ];

  // Lead Funnel Chart data
  const funnelData = [
    { stage: 'Views', value: 85000, conversion: '100%' },
    { stage: 'Clicks', value: 34000, conversion: '40%' },
    { stage: 'Enquiries', value: 8490, conversion: '25%' },
    { stage: 'Site Visits', value: 1840, conversion: '21%' },
    { stage: 'Escrows', value: 382, conversion: '20%' }
  ];

  // Lead Sources Pie chart data
  const sourceData = [
    { name: 'WhatsApp Link Click', value: 3200, color: '#25D366' },
    { name: 'Call Callback Request', value: 1800, color: '#3B82F6' },
    { name: 'Portal Forms Inquiry', value: 2400, color: '#FF5A3C' },
    { name: 'Brochure Downloads', value: 1100, color: '#F59E0B' }
  ];

  const totalLeads = sourceData.reduce((sum, item) => sum + item.value, 0);

  const onPieEnter = (_, index) => {
    setHoveredIndex(index);
  };

  const onPieLeave = () => {
    setHoveredIndex(-1);
  };

  const getShortName = (fullName) => {
    if (fullName.includes('WhatsApp')) return 'WhatsApp';
    if (fullName.includes('Call')) return 'Callbacks';
    if (fullName.includes('Portal')) return 'Portal';
    if (fullName.includes('Brochure')) return 'Downloads';
    return fullName;
  };

  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="var(--bg-surface)"
        style={{
          filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.08)) brightness(1.05)',
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 300ms ease'
        }}
      />
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percent = ((data.value / totalLeads) * 100).toFixed(1);
      return (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-3 shadow-xl space-y-1 text-xs">
          <p className="font-extrabold text-[var(--text-primary)]">{data.name}</p>
          <div className="flex gap-4 justify-between items-center text-[11px] text-[var(--text-subtle)] font-semibold">
            <span>Leads: <strong className="text-[var(--text-primary)]">{data.value.toLocaleString()}</strong></span>
            <span className="text-brand font-bold">{percent}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Leads list from localStorage
  const [leads, setLeads] = useState(() => {
    const saved = localStorage.getItem('gharmb_leads');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Error parsing gharmb_leads:', err);
      }
    }
    return [
      { id: 'LED-3210', client: 'Ankit Sharma', phone: '+91 98765 00112', property: 'Godrej Woods Phase 2', type: 'WhatsApp', date: '16 Jun 2026', status: 'Pending', assignedTo: 'Executive Vikram', notes: [] },
      { id: 'LED-4921', client: 'Pooja Mehta', phone: '+91 98123 45678', property: 'DLF Skycourt Penthouse', type: 'Call Request', date: '16 Jun 2026', status: 'Contacted', assignedTo: 'Executive Sneha', notes: [{ date: '16 Jun 2026', text: 'Requested brochure and pricing details' }] },
      { id: 'LED-8802', client: 'Rajesh Malhotra', phone: '+91 88990 01122', property: 'Tata Primanti Luxury Villa', type: 'Site Visit Scheduled', date: '15 Jun 2026', status: 'Site Visit Booked', assignedTo: 'Executive Vikram', notes: [] },
      { id: 'LED-1092', client: 'Kunal Sen', phone: '+91 99112 23344', property: 'Commercial Shop Sec 37D', type: 'Brochure Download', date: '14 Jun 2026', status: 'Resolved', assignedTo: 'System Automated', notes: [] }
    ];
  });

  useEffect(() => {
    localStorage.setItem('gharmb_leads', JSON.stringify(leads));
  }, [leads]);

  // Combined search & filter logic
  const filteredLeads = leads.filter(l => {
    const matchesSearch = 
      l.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone.includes(searchTerm) ||
      l.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.id.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesType = selectedTypeFilter === 'All' || l.type === selectedTypeFilter;
    
    return matchesSearch && matchesType;
  });

  // Handlers
  const handleAddLeadSubmit = (e) => {
    e.preventDefault();
    if (!newLeadName.trim() || !newLeadPhone.trim() || !newLeadProperty.trim()) {
      alert('Please fill in all fields.');
      return;
    }
    const newId = `LED-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date();
    const formattedDate = `${today.getDate()} ${today.toLocaleString('default', { month: 'short' })} ${today.getFullYear()}`;
    
    const newLead = {
      id: newId,
      client: newLeadName,
      phone: newLeadPhone,
      property: newLeadProperty,
      type: newLeadType,
      date: formattedDate,
      status: newLeadStatus,
      assignedTo: newLeadAssignee,
      notes: []
    };

    setLeads([newLead, ...leads]);

    // Reset Form fields
    setNewLeadName('');
    setNewLeadPhone('');
    setNewLeadProperty('');
    setNewLeadType('WhatsApp');
    setNewLeadAssignee('Executive Vikram');
    setNewLeadStatus('Pending');
    setIsAddLeadModalOpen(false);
  };

  const updateLeadField = (id, field, value) => {
    setLeads(prevLeads => prevLeads.map(l => {
      if (l.id === id) {
        const updated = { ...l, [field]: value };
        if (selectedLead && selectedLead.id === id) {
          setSelectedLead(updated);
        }
        return updated;
      }
      return l;
    }));
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!noteText.trim() || !selectedLead) return;

    const today = new Date();
    const formattedDate = `${today.getDate()} ${today.toLocaleString('default', { month: 'short' })} ${today.getFullYear()}`;
    const newNote = { date: formattedDate, text: noteText.trim() };

    const updatedLead = {
      ...selectedLead,
      notes: [...(selectedLead.notes || []), newNote]
    };

    setLeads(prevLeads => prevLeads.map(l => l.id === selectedLead.id ? updatedLead : l));
    setSelectedLead(updatedLead);
    setNoteText('');
  };

  const deleteLead = (id) => {
    if (confirm(`Are you sure you want to delete lead ${id}?`)) {
      setLeads(prevLeads => prevLeads.filter(l => l.id !== id));
      setSelectedLead(null);
    }
  };

  const toggleSelectLead = (id) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedLeadIds(prev => [...prev, id]);
    }
  };

  const isAllFilteredSelected = filteredLeads.length > 0 && filteredLeads.every(l => selectedLeadIds.includes(l.id));
  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      const filteredIds = filteredLeads.map(l => l.id);
      setSelectedLeadIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      const filteredIds = filteredLeads.map(l => l.id);
      setSelectedLeadIds(prev => {
        const union = new Set([...prev, ...filteredIds]);
        return Array.from(union);
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {summaryStats.map((stat, idx) => (
          <div 
            key={idx} 
            className={`p-5 bg-gradient-to-br ${stat.gradient} border border-[var(--border)] rounded-2xl shadow-xs flex items-center justify-between hover:shadow-md hover:-translate-y-[3px] transition-all duration-250 ease-out`}
          >
            <div className="space-y-1">
              <span className="text-[9px] font-semibold text-[var(--text-muted)] block uppercase">{stat.title}</span>
              <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">{stat.value}</h3>
              <div className="flex items-center gap-1 text-[9px] font-bold text-green-700 bg-green-500/10 px-1.5 py-0.5 rounded-full w-max">
                <TrendingUp size={10} /> {stat.change}
              </div>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
              <PhoneCall size={18} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel chart */}
        <div className="lg:col-span-2 p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs hover:shadow-md hover:-translate-y-[3px] transition-all duration-250 ease-out space-y-6">
          <div>
            <h3 className="text-xs font-bold text-[var(--text-primary)]">Conversion Funnel Dropoff</h3>
            <p className="text-[10px] text-[var(--text-muted)]">Total conversion rate breakdown from views to sales escrow</p>
          </div>
          <div className="space-y-4">
            {funnelData.map((item, idx) => (
              <div 
                key={idx} 
                className="grid grid-cols-12 items-center gap-4 relative py-1 hover:bg-[var(--bg-muted)]/20 rounded-xl px-2 -mx-2 transition-colors duration-250"
                onMouseEnter={() => setHoveredFunnel(idx)}
                onMouseLeave={() => setHoveredFunnel(null)}
              >
                {/* Left: Stage Name */}
                <div className="col-span-3 md:col-span-2">
                  <span className="text-xs font-bold text-[var(--text-subtle)] tracking-tight block">
                    {item.stage}
                  </span>
                </div>

                {/* Center: Rounded Progress Bar Track */}
                <div className="col-span-6 md:col-span-8 relative h-6 flex items-center">
                  <div
                    className="absolute h-full bg-brand/10 blur-xs rounded-xl transition-all pointer-events-none"
                    style={{ 
                      left: 0,
                      width: isAnimated ? item.conversion : '0%',
                      opacity: hoveredFunnel === idx ? 1 : 0,
                      transform: 'scaleY(1.25) scaleX(1.01)',
                      transition: 'width 800ms cubic-bezier(0.16, 1, 0.3, 1), opacity 250ms ease'
                    }}
                  />
                  <div className="w-full h-full bg-[var(--bg-muted)] border border-[var(--border)]/70 rounded-xl overflow-hidden relative flex items-center z-10">
                    <div
                      className={`h-full bg-gradient-to-r from-orange-400 to-brand rounded-xl transition-all relative ${
                        hoveredFunnel === idx 
                          ? 'brightness-105 shadow-sm shadow-brand/10' 
                          : 'shadow-xs shadow-brand/5'
                      }`}
                      style={{ 
                        width: isAnimated ? item.conversion : '0%',
                        transition: 'width 800ms cubic-bezier(0.16, 1, 0.3, 1), filter 250ms ease, transform 250ms ease, box-shadow 250ms ease'
                      }}
                    />
                  </div>
                </div>

                {/* Right: Count Value & Percentage */}
                <div className="col-span-3 md:col-span-2 text-right z-10">
                  <span className="text-xs font-extrabold text-[var(--text-primary)] block">
                    {item.value.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-bold text-brand block mt-0.5">
                    {item.conversion}
                  </span>
                </div>

                {/* Floating Tooltip */}
                <div 
                  className="absolute left-1/2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-3 shadow-xl z-20 pointer-events-none text-[10px] space-y-1 min-w-[140px] text-center transition-all duration-300 ease-out"
                  style={{
                    bottom: hoveredFunnel === idx ? '108%' : '90%',
                    opacity: hoveredFunnel === idx ? 1 : 0,
                    transform: 'translateX(-50%)',
                    visibility: hoveredFunnel === idx ? 'visible' : 'hidden'
                  }}
                >
                  <p className="font-extrabold text-[var(--text-primary)]">{item.stage}</p>
                  <p className="text-[var(--text-subtle)] font-semibold">Leads: <strong className="text-[var(--text-primary)]">{item.value.toLocaleString()}</strong></p>
                  <p className="text-brand font-extrabold">Stage Conversion: {item.conversion}</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[var(--bg-surface)] border-r border-b border-[var(--border)] rotate-45 -mt-1.5"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Sources pie chart */}
        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs hover:shadow-md hover:-translate-y-[3px] transition-all duration-250 ease-out space-y-4">
          <div>
            <h3 className="text-xs font-bold text-[var(--text-primary)]">Lead Generation Channels</h3>
            <p className="text-[10px] text-[var(--text-muted)]">Distribution of leads registered</p>
          </div>
          <div className="h-44 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                  activeIndex={hoveredIndex}
                  activeShape={(props) => {
                    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                    return (
                      <Sector
                        cx={cx}
                        cy={cy}
                        innerRadius={innerRadius}
                        outerRadius={outerRadius}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        fill={fill}
                        opacity={0.06}
                        style={{
                          filter: 'blur(3px)',
                          outline: 'none',
                          transition: 'all 300ms ease'
                        }}
                      />
                    );
                  }}
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-halo-${index}`} fill="transparent" />
                  ))}
                </Pie>

                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={56}
                  paddingAngle={3}
                  dataKey="value"
                  activeIndex={hoveredIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  stroke="var(--bg-surface)"
                >
                  {sourceData.map((entry, index) => {
                    const isHovered = hoveredIndex === index;
                    const isAnyHovered = hoveredIndex !== -1;
                    const opacity = isAnyHovered ? (isHovered ? 1 : 0.6) : 1;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        style={{
                          transition: 'opacity 300ms ease',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                        opacity={opacity}
                      />
                    );
                  })}
                </Pie>
                <Tooltip 
                  content={<CustomTooltip />} 
                  animationDuration={300}
                  animationEasing="ease-out"
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Content Inside Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              {hoveredIndex === -1 ? (
                <div className="text-center space-y-0.5">
                  <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Total Leads</span>
                  <span className="text-sm font-extrabold text-[var(--text-primary)] block">{totalLeads.toLocaleString()}</span>
                </div>
              ) : (
                <div className="text-center space-y-0.5 animate-in fade-in zoom-in-95 duration-200">
                  <span 
                    className="text-[8px] font-bold uppercase tracking-wider block truncate max-w-[80px]"
                    style={{ color: sourceData[hoveredIndex].color }}
                  >
                    {getShortName(sourceData[hoveredIndex].name)}
                  </span>
                  <span className="text-sm font-extrabold text-[var(--text-primary)] block">
                    {sourceData[hoveredIndex].value.toLocaleString()}
                  </span>
                  <span className="text-[8px] font-extrabold text-brand block">
                    {((sourceData[hoveredIndex].value / totalLeads) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
          {/* Detail List */}
          <div className="space-y-1 text-[10px]">
            {sourceData.map((entry, i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-[var(--border)]/30">
                <span className="font-semibold text-[var(--text-subtle)] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </span>
                <span className="font-bold text-[var(--text-primary)]">{entry.value} leads</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leads Table Section */}
      <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Search bar */}
          <div className="relative max-w-sm w-full">
            <Search className="absolute top-2.5 left-3.5 text-[var(--text-muted)]" size={14} />
            <input
              type="text"
              placeholder="Search client name, phone, property or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border)]/80 rounded-xl text-xs focus:outline-none focus:border-brand/40 bg-transparent text-[var(--text-primary)]"
            />
          </div>

          {/* Filters & Add Lead */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0 justify-between md:justify-end w-full md:w-auto">
            <div className="flex items-center gap-1.5">
              {['All', 'WhatsApp', 'Call Request', 'Site Visit Scheduled'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedTypeFilter === type
                      ? 'bg-brand text-white shadow-md shadow-brand/10'
                      : 'bg-[var(--bg-muted)] text-[var(--text-subtle)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsAddLeadModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-lg text-xs font-bold shadow-lg shadow-brand/10 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus size={12} /> Add Lead
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-wider bg-[var(--bg-muted)]">
                <th className="py-3 px-4 text-center w-12">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    onChange={toggleSelectAllFiltered}
                    className="rounded border-[var(--border)] text-brand focus:ring-brand cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Lead ID</th>
                <th className="py-3 px-6">Client Info</th>
                <th className="py-3 px-6">Property Listing</th>
                <th className="py-3 px-6">Source Channel</th>
                <th className="py-3 px-6">Logged Date</th>
                <th className="py-3 px-6">Executive Assigned</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/50 text-xs">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[var(--text-muted)] font-semibold">
                    No leads match your active filters/search criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((l) => (
                  <tr 
                    key={l.id} 
                    className={`hover:bg-[var(--bg-muted)] transition-colors cursor-pointer ${
                      selectedLeadIds.includes(l.id) ? 'bg-[var(--bg-muted)]/60' : ''
                    }`}
                    onClick={() => setSelectedLead(l)}
                  >
                    <td 
                      className="py-3.5 px-4 text-center w-12"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.includes(l.id)}
                        onChange={() => toggleSelectLead(l.id)}
                        className="rounded border-[var(--border)] text-brand focus:ring-brand cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[var(--text-subtle)]">{l.id}</td>
                    <td className="py-3.5 px-6">
                      <p className="font-bold text-[var(--text-primary)]">{l.client}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{l.phone}</p>
                    </td>
                    <td className="py-3.5 px-6 font-bold text-[var(--text-subtle)]">{l.property}</td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                        l.type === 'WhatsApp' ? 'bg-green-500/10 text-green-700' :
                        l.type === 'Call Request' ? 'bg-blue-500/10 text-blue-700' : 'bg-orange-500/10 text-brand'
                      }`}>
                        {l.type === 'WhatsApp' ? <MessageSquare size={10} /> : <PhoneCall size={10} />}
                        {l.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-[var(--text-subtle)]">{l.date}</td>
                    <td className="py-3.5 px-6 text-[var(--text-subtle)] font-bold">{l.assignedTo}</td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-[9px] font-bold whitespace-nowrap ${
                        l.status === 'Approved' || l.status === 'Resolved' || l.status === 'Closed' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                        l.status === 'Contacted' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                        l.status === 'Site Visit Booked' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                        'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td 
                      className="py-3.5 px-6 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedLead(l)}
                          className="py-1 px-2 bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] text-[var(--text-subtle)] border border-[var(--border)]/50 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Inspect
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteLead(l.id)}
                          className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-655 rounded-lg transition-colors cursor-pointer"
                          title="Delete Lead"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Bulk Operations Toolbar */}
      {selectedLeadIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-white rounded-2xl py-3 px-6 shadow-2xl flex items-center gap-6 z-50 animate-slide-up">
          <div className="text-[11px] font-bold text-slate-300">
            Selected <span className="text-brand font-black text-xs">{selectedLeadIds.length}</span> leads
          </div>
          <div className="h-4 w-px bg-slate-800"></div>
          
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Reassign:</span>
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  setLeads(prevLeads => prevLeads.map(l => 
                    selectedLeadIds.includes(l.id) ? { ...l, assignedTo: val } : l
                  ));
                  setSelectedLeadIds([]);
                  alert(`Assigned selected leads to ${val}.`);
                }
              }}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg text-[10px] px-2 py-1 focus:outline-none cursor-pointer"
              defaultValue=""
            >
              <option value="" disabled>Choose Executive</option>
              <option value="Executive Vikram">Executive Vikram</option>
              <option value="Executive Sneha">Executive Sneha</option>
              <option value="Executive Alok">Executive Alok</option>
              <option value="System Automated">System Automated</option>
            </select>
          </div>
          
          <button
            type="button"
            onClick={() => {
              if (confirm(`Are you sure you want to delete the ${selectedLeadIds.length} selected leads?`)) {
                setLeads(prevLeads => prevLeads.filter(l => !selectedLeadIds.includes(l.id)));
                setSelectedLeadIds([]);
              }
            }}
            className="py-1 px-3 bg-red-650 hover:bg-red-750 text-white rounded-lg text-[10px] font-extrabold transition-all flex items-center gap-1 cursor-pointer"
          >
            <Trash2 size={12} /> Bulk Delete
          </button>
          
          <button
            type="button"
            onClick={() => setSelectedLeadIds([])}
            className="text-[10px] font-extrabold text-slate-400 hover:text-white cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Add Lead Modal */}
      {isAddLeadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-3xl max-w-md w-full shadow-2xl border border-[var(--border)] p-6 space-y-4 relative animate-scale-in">
            <button
              type="button"
              onClick={() => setIsAddLeadModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-subtle)] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
            <div className="space-y-1">
              <h3 className="text-sm font-black tracking-tight">Log New Lead</h3>
              <p className="text-[10px] text-[var(--text-muted)]">Manually register a prospect or client callback request</p>
            </div>

            <form onSubmit={handleAddLeadSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-[var(--text-subtle)] uppercase">Client Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Gupta"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40 bg-transparent text-[var(--text-primary)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-[var(--text-subtle)] uppercase">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 99887 76655"
                  value={newLeadPhone}
                  onChange={(e) => setNewLeadPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40 bg-transparent text-[var(--text-primary)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-[var(--text-subtle)] uppercase">Target Property Listing</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Godrej Woods Phase 2"
                  value={newLeadProperty}
                  onChange={(e) => setNewLeadProperty(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40 bg-transparent text-[var(--text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-[var(--text-subtle)] uppercase">Source Channel</label>
                  <select
                    value={newLeadType}
                    onChange={(e) => setNewLeadType(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40 bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Call Request">Call Request</option>
                    <option value="Site Visit Scheduled">Site Visit Scheduled</option>
                    <option value="Brochure Download">Brochure Download</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-[var(--text-subtle)] uppercase">Initial Status</label>
                  <select
                    value={newLeadStatus}
                    onChange={(e) => setNewLeadStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40 bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Site Visit Booked">Site Visit Booked</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-[var(--text-subtle)] uppercase">Assign Executive</label>
                <select
                  value={newLeadAssignee}
                  onChange={(e) => setNewLeadAssignee(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40 bg-[var(--bg-surface)] text-[var(--text-primary)]"
                >
                  <option value="Executive Vikram">Executive Vikram</option>
                  <option value="Executive Sneha">Executive Sneha</option>
                  <option value="Executive Alok">Executive Alok</option>
                  <option value="System Automated">System Automated</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddLeadModalOpen(false)}
                  className="px-4 py-2 bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] text-[var(--text-subtle)] rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold shadow-lg shadow-brand/10 cursor-pointer"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Lead Inspector Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-3xl max-w-md w-full shadow-2xl border border-[var(--border)] p-6 space-y-5 relative animate-scale-in">
            <button
              type="button"
              onClick={() => setSelectedLead(null)}
              className="absolute top-4 right-4 p-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-subtle)] transition-colors cursor-pointer"
            >
              <XCircle size={18} />
            </button>

            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center font-black text-lg text-brand">
                {selectedLead.client.charAt(0)}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">{selectedLead.client}</h3>
                <p className="text-xs text-[var(--text-muted)]">{selectedLead.phone}</p>
              </div>
              <div className="flex gap-2">
                <span className="text-[9px] font-bold bg-[var(--bg-muted)] text-[var(--text-subtle)] px-2 py-0.5 rounded-md">
                  ID: {selectedLead.id}
                </span>
                <span className="text-[9px] font-bold bg-brand/10 text-brand px-2 py-0.5 rounded-md">
                  {selectedLead.type}
                </span>
                <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold whitespace-nowrap ${
                  selectedLead.status === 'Approved' || selectedLead.status === 'Resolved' || selectedLead.status === 'Closed' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                  selectedLead.status === 'Contacted' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                  selectedLead.status === 'Site Visit Booked' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                  'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                }`}>
                  {selectedLead.status}
                </span>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-[var(--bg-muted)] border border-[var(--border)] rounded-2xl">
              <div className="flex justify-between text-xs border-b border-[var(--border)]/50 pb-2">
                <span className="text-[var(--text-muted)] font-medium">Logged Date</span>
                <span className="font-semibold text-[var(--text-subtle)]">{selectedLead.date}</span>
              </div>
              <div className="flex justify-between text-xs border-b border-[var(--border)]/50 pb-2">
                <span className="text-[var(--text-muted)] font-medium">Property Interest</span>
                <span className="font-semibold text-[var(--text-subtle)]">{selectedLead.property}</span>
              </div>

              {/* Status and Assignee dropdowns */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase">Status</label>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => updateLeadField(selectedLead.id, 'status', e.target.value)}
                    className="w-full px-2 py-1.5 border border-[var(--border)] rounded-lg text-xs bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Site Visit Booked">Site Visit Booked</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase">Assignee</label>
                  <select
                    value={selectedLead.assignedTo}
                    onChange={(e) => updateLeadField(selectedLead.id, 'assignedTo', e.target.value)}
                    className="w-full px-2 py-1.5 border border-[var(--border)] rounded-lg text-xs bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  >
                    <option value="Executive Vikram">Executive Vikram</option>
                    <option value="Executive Sneha">Executive Sneha</option>
                    <option value="Executive Alok">Executive Alok</option>
                    <option value="System Automated">System Automated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Timeline Notes */}
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                <Activity size={12} /> Call log timeline
              </span>
              
              <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1 border-b border-[var(--border)]/30 pb-2">
                {!selectedLead.notes || selectedLead.notes.length === 0 ? (
                  <p className="text-[10px] text-[var(--text-muted)] italic">No comments or timeline notes logged yet.</p>
                ) : (
                  selectedLead.notes.map((n, idx) => (
                    <div key={idx} className="p-2 bg-[var(--bg-muted)] border border-[var(--border)]/50 rounded-xl space-y-0.5">
                      <div className="flex justify-between text-[8px] text-[var(--text-muted)] font-extrabold">
                        <span>System Log</span>
                        <span>{n.date}</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-subtle)] font-medium leading-tight">{n.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Log callback notes..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-[var(--border)] rounded-xl text-xs bg-transparent text-[var(--text-primary)] focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-[10px] font-bold cursor-pointer"
                >
                  Log
                </button>
              </form>
            </div>

            {/* Direct Delete in Drawer */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="px-3 py-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] text-[var(--text-subtle)] rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => deleteLead(selectedLead.id)}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <Trash2 size={12} /> Delete Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsDashboard;
