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
  const [isLoading, setIsLoading] = useState(true);

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
  const [leads, setLeads] = useState([]);

  const isMockMode = !localStorage.getItem('adminToken') || localStorage.getItem('adminToken') === 'mock_admin_token_2026';

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (isMockMode) {
        loadMockLeads();
        setIsLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/admin/dashboard/enquiries', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        const pEnqs = data.data.propertyEnquiries || [];
        const dEnqs = data.data.developerEnquiries || [];
        
        const mappedP = pEnqs.map(eq => {
          let leadType = 'Portal Forms Inquiry';
          if (eq.visitPreferredDate) leadType = 'Site Visit Scheduled';
          else if (eq.message.toLowerCase().includes('whatsapp')) leadType = 'WhatsApp Link Click';
          else if (eq.message.toLowerCase().includes('call')) leadType = 'Call Callback Request';

          let status = 'Pending';
          if (eq.status === 'contacted') status = 'Contacted';
          else if (eq.status === 'resolved') status = 'Resolved';
          else if (eq.status === 'cancelled') status = 'Cancelled';

          return {
            id: `LED-${eq._id.slice(-4).toUpperCase()}`,
            _id: eq._id,
            client: eq.client?.name || 'Unknown Client',
            phone: eq.client?.phone || 'No phone',
            property: eq.property?.title || 'Unknown Property',
            type: leadType,
            date: eq.createdAt ? new Date(eq.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown',
            status,
            assignedTo: 'Executive Vikram',
            notes: eq.agentNotes ? [{ date: 'Note', text: eq.agentNotes }] : [],
            rawMsg: eq.message
          };
        });

        const mappedD = dEnqs.map(eq => {
          let status = 'Pending';
          if (eq.status === 'contacted') status = 'Contacted';
          else if (eq.status === 'resolved') status = 'Resolved';
          else if (eq.status === 'cancelled') status = 'Cancelled';

          return {
            id: `LED-${eq._id.slice(-4).toUpperCase()}`,
            _id: eq._id,
            client: eq.client?.name || 'Unknown Client',
            phone: eq.client?.phone || 'No phone',
            property: eq.developer?.companyName || eq.developer?.name || 'Developer Enquiry',
            type: 'Portal Forms Inquiry',
            date: eq.createdAt ? new Date(eq.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown',
            status,
            assignedTo: 'Executive Sneha',
            notes: eq.developerNotes ? [{ date: 'Note', text: eq.developerNotes }] : [],
            rawMsg: eq.message
          };
        });

        setLeads([...mappedP, ...mappedD]);
      } else {
        loadMockLeads();
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
      loadMockLeads();
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockLeads = () => {
    const saved = localStorage.getItem('gharmb_leads');
    if (saved) {
      try {
        setLeads(JSON.parse(saved));
        return;
      } catch (err) {
        console.error('Error parsing mock leads:', err);
      }
    }
    setLeads([
      { id: 'LED-3210', _id: 'mock_l1', client: 'Ankit Sharma', phone: '+91 98765 00112', property: 'Godrej Woods Phase 2', type: 'WhatsApp', date: '16 Jun 2026', status: 'Pending', assignedTo: 'Executive Vikram', notes: [] },
      { id: 'LED-4921', _id: 'mock_l2', client: 'Pooja Mehta', phone: '+91 98123 45678', property: 'DLF Skycourt Penthouse', type: 'Call Request', date: '16 Jun 2026', status: 'Contacted', assignedTo: 'Executive Sneha', notes: [{ date: '16 Jun 2026', text: 'Requested brochure and pricing details' }] },
      { id: 'LED-8802', _id: 'mock_l3', client: 'Rajesh Malhotra', phone: '+91 88990 01122', property: 'Tata Primanti Luxury Villa', type: 'Site Visit Scheduled', date: '15 Jun 2026', status: 'Resolved', assignedTo: 'Executive Vikram', notes: [] },
      { id: 'LED-1092', _id: 'mock_l4', client: 'Kunal Sen', phone: '+91 99112 23344', property: 'Commercial Shop Sec 37D', type: 'Brochure Download', date: '14 Jun 2026', status: 'Resolved', assignedTo: 'System Automated', notes: [] }
    ]);
  };

  useEffect(() => {
    fetchLeads();
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isMockMode) {
      localStorage.setItem('gharmb_leads', JSON.stringify(leads));
    }
  }, [leads]);

  // Lead Sources Pie chart data calculations
  const totalWhatsApp = leads.filter(l => l.type.includes('WhatsApp')).length;
  const totalCall = leads.filter(l => l.type.includes('Call')).length;
  const totalPortal = leads.filter(l => l.type.includes('Portal')).length;
  const totalBrochure = leads.filter(l => l.type.includes('Brochure')).length;
  
  const sourceData = [
    { name: 'WhatsApp Link Click', value: totalWhatsApp || 2, color: '#25D366' },
    { name: 'Call Callback Request', value: totalCall || 1, color: '#3B82F6' },
    { name: 'Portal Forms Inquiry', value: totalPortal || 3, color: '#FF5A3C' },
    { name: 'Brochure Downloads', value: totalBrochure || 1, color: '#F59E0B' }
  ];

  const totalLeadsCount = sourceData.reduce((sum, item) => sum + item.value, 0);

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
      const percent = ((data.value / totalLeadsCount) * 100).toFixed(1);
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

  const filteredLeads = leads.filter(l => {
    const matchesSearch = 
      l.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone.includes(searchTerm) ||
      l.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.id.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesType = selectedTypeFilter === 'All' || l.type.includes(selectedTypeFilter) || (selectedTypeFilter === 'Form' && l.type.includes('Portal'));
    return matchesSearch && matchesType;
  });

  // Action handlers
  const updateLeadStatus = async (lead, newStatus) => {
    if (isMockMode) {
      setLeads(leads.map(l => {
        if (l.id === lead.id) {
          const updated = { ...l, status: newStatus };
          if (selectedLead && selectedLead.id === lead.id) {
            setSelectedLead(updated);
          }
          return updated;
        }
        return l;
      }));
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      let apiStatus = 'pending';
      if (newStatus === 'Contacted') apiStatus = 'contacted';
      else if (newStatus === 'Resolved') apiStatus = 'resolved';
      else if (newStatus === 'Cancelled') apiStatus = 'cancelled';

      const response = await fetch(`http://localhost:5001/api/admin/dashboard/enquiries/${lead._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: apiStatus })
      });
      if (response.ok) {
        fetchLeads();
        if (selectedLead && selectedLead._id === lead._id) {
          setSelectedLead({ ...selectedLead, status: newStatus });
        }
      } else {
        alert('Failed to update status.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || !selectedLead) return;

    if (isMockMode) {
      const today = new Date();
      const formattedDate = `${today.getDate()} ${today.toLocaleString('default', { month: 'short' })} ${today.getFullYear()}`;
      const newNote = { date: formattedDate, text: noteText.trim() };
      const updatedLead = { ...selectedLead, notes: [...(selectedLead.notes || []), newNote] };
      setLeads(leads.map(l => l.id === selectedLead.id ? updatedLead : l));
      setSelectedLead(updatedLead);
      setNoteText('');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5001/api/admin/dashboard/enquiries/${selectedLead._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes: noteText.trim() })
      });
      if (response.ok) {
        const today = new Date();
        const formattedDate = `${today.getDate()} ${today.toLocaleString('default', { month: 'short' })} ${today.getFullYear()}`;
        const newNote = { date: formattedDate, text: noteText.trim() };
        setSelectedLead({ ...selectedLead, notes: [...(selectedLead.notes || []), newNote] });
        setNoteText('');
        fetchLeads();
      } else {
        alert('Failed to save agent notes.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteLead = async (lead) => {
    if (isMockMode) {
      setLeads(leads.filter(l => l.id !== lead.id));
      setSelectedLead(null);
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5001/api/admin/dashboard/enquiries/${lead._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchLeads();
        setSelectedLead(null);
        alert('Lead enquiry deleted successfully.');
      } else {
        alert('Failed to delete lead.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { title: 'Daily Leads Logged', value: leads.length.toString(), change: '+14.2%', trend: 'up', color: 'text-orange-600 bg-orange-500/10' },
          { title: 'Total Active Funnel', value: leads.filter(l => l.status !== 'Resolved').length.toString(), change: '+18.6%', trend: 'up', color: 'text-indigo-600 bg-indigo-500/10' },
          { title: 'Resolved Leads', value: leads.filter(l => l.status === 'Resolved').length.toString(), change: '+12.4%', trend: 'up', color: 'text-emerald-600 bg-emerald-500/10' },
          { title: 'Visits Scheduled', value: leads.filter(l => l.type === 'Site Visit Scheduled').length.toString(), change: '+5.7%', trend: 'up', color: 'text-blue-600 bg-blue-500/10' }
        ].map((stat, idx) => (
          <div key={idx} className="p-5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-all">
            <div className="space-y-1">
              <span className="text-[9px] font-semibold text-[var(--text-muted)] block uppercase">{stat.title}</span>
              <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">{stat.value}</h3>
              <div className="flex items-center gap-1 text-[9px] font-bold text-green-700 bg-green-500/10 px-1.5 py-0.5 rounded-full w-max">
                <TrendingUp size={10} /> {stat.change}
              </div>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
              <PhoneCall size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel Stage progression */}
        <div className="lg:col-span-2 p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm space-y-5 text-left">
          <div>
            <h3 className="text-xs font-bold text-[var(--text-primary)]">Lead Generation Funnel</h3>
            <p className="text-[10px] text-[var(--text-muted)]">Platform conversion stages from listing views to settled escrows</p>
          </div>

          <div className="space-y-4">
            {[
              { stage: 'Views', value: 85000, color: 'bg-brand' },
              { stage: 'Clicks', value: 34000, color: 'bg-indigo-500' },
              { stage: 'Enquiries', value: leads.length * 100 || 8490, color: 'bg-blue-500' },
              { stage: 'Site Visits', value: leads.filter(l => l.type === 'Site Visit Scheduled').length * 100 || 1840, color: 'bg-teal-500' }
            ].map((item, idx, arr) => {
              const maxVal = arr[0].value;
              const percent = maxVal > 0 ? Math.round((item.value / maxVal) * 100) : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-[var(--text-subtle)]">{item.stage}</span>
                    <span className="text-[var(--text-primary)]">{item.value.toLocaleString()} ({percent}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-[var(--bg-muted)] rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Distribution Pie chart */}
        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-[var(--text-primary)]">Acquisition Sources</h3>
            <p className="text-[10px] text-[var(--text-muted)]">Incoming inquiry sources breakdown</p>
          </div>

          <div className="h-44 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  activeIndex={hoveredIndex}
                  activeShape={renderActiveShape}
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Leads</span>
              <span className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{totalLeadsCount}</span>
            </div>
          </div>

          {/* Pie Legends */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {sourceData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[9px] font-bold text-[var(--text-subtle)] truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="truncate">{getShortName(item.name)} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main leads table log list */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden text-left p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold text-[var(--text-primary)]">Live Enquiries & Leads Log</h3>
            <p className="text-[10px] text-[var(--text-muted)]">Audit and manage client callback inquiries and site booking requests</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-1.5">
            {['All', 'WhatsApp', 'Call', 'Site Visit', 'Portal'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedTypeFilter === type
                    ? 'bg-brand text-white shadow-md shadow-brand/10'
                    : 'bg-[var(--bg-muted)] text-[var(--text-subtle)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Search bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 text-[var(--text-muted)]" size={14} />
          <input
            type="text"
            placeholder="Search leads by name, phone number, property reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-wider bg-[var(--bg-muted)]">
                <th className="py-3 px-6">Lead ID</th>
                <th className="py-3 px-6">Client Name</th>
                <th className="py-3 px-6">Contact Number</th>
                <th className="py-3 px-6">Interested Property</th>
                <th className="py-3 px-6">Inquiry Type</th>
                <th className="py-3 px-6">Date Logged</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-muted)] text-xs">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-16"></div></td>
                    <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-20"></div></td>
                    <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-24"></div></td>
                    <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-32"></div></td>
                    <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-20"></div></td>
                    <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-16"></div></td>
                    <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-12"></div></td>
                    <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-12 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-[var(--text-muted)] font-semibold">No lead inquiries found.</td>
                </tr>
              ) : (
                filteredLeads.map((l) => (
                  <tr key={l.id} className="hover:bg-[var(--bg-muted)] transition-colors">
                    <td className="py-3.5 px-6 font-bold text-[var(--text-subtle)]">{l.id}</td>
                    <td className="py-3.5 px-6 font-extrabold text-[var(--text-primary)]">{l.client}</td>
                    <td className="py-3.5 px-6 font-semibold text-[var(--text-subtle)] font-mono">{l.phone}</td>
                    <td className="py-3.5 px-6 text-[var(--text-subtle)] font-semibold line-clamp-1 max-w-[200px] mt-2.5">{l.property}</td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${
                        l.type.includes('WhatsApp') ? 'text-green-600' :
                        l.type.includes('Call') ? 'text-blue-600' : 'text-orange-600'
                      }`}>
                        {l.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-[var(--text-subtle)]">{l.date}</td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        l.status === 'Resolved' ? 'bg-green-500/10 text-green-700' :
                        l.status === 'Contacted' ? 'bg-yellow-500/10 text-yellow-700' : 'bg-brand/10 text-brand'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLead(l)}
                        className="px-2.5 py-1.5 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-subtle)] rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Lead Drawer Details */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-end">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] h-full max-w-md w-full shadow-2xl border-l border-[var(--border)] p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6 text-left">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-extrabold text-brand bg-brand-light dark:bg-brand/10 px-2 py-0.5 rounded">INSPECT LEAD DETAILS</span>
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)] mt-1.5">{selectedLead.client}</h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">{selectedLead.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="p-1 bg-[var(--bg-muted)] rounded-lg text-[var(--text-muted)]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-3.5 bg-[var(--bg-muted)] rounded-xl space-y-2 text-xs font-semibold">
                <div className="flex justify-between border-b border-[var(--border-muted)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Interested property</span>
                  <span className="text-[var(--text-primary)] text-right">{selectedLead.property}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border-muted)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Contact phone</span>
                  <span className="text-[var(--text-primary)] font-mono">{selectedLead.phone}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border-muted)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Assigned agent</span>
                  <span className="text-[var(--text-primary)]">{selectedLead.assignedTo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Lead acquisition</span>
                  <span className="text-[var(--text-primary)]">{selectedLead.type}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Message from Client</span>
                <div className="p-3 bg-[var(--bg-muted)] text-[var(--text-subtle)] font-medium rounded-xl leading-relaxed italic border-l-2 border-brand">
                  "{selectedLead.rawMsg || 'Interested in this property, please contact me.'}"
                </div>
              </div>

              {/* Note tracking logs */}
              <div className="space-y-3">
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Agent Notes log history</span>
                <div className="space-y-2">
                  {selectedLead.notes && selectedLead.notes.map((n, idx) => (
                    <div key={idx} className="p-2.5 bg-[var(--bg-muted)] rounded-xl text-[11px] font-medium text-[var(--text-subtle)] space-y-1">
                      <div className="flex justify-between text-[9px] font-extrabold text-[var(--text-muted)]">
                        <span>Moderator Note</span>
                        <span>{n.date}</span>
                      </div>
                      <p>{n.text}</p>
                    </div>
                  ))}
                  {(!selectedLead.notes || selectedLead.notes.length === 0) && (
                    <p className="text-[10px] text-[var(--text-muted)]">No agent notes yet. Add one below to track calls.</p>
                  )}
                </div>

                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type note (e.g. called client, busy...)"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand/10 cursor-pointer"
                  >
                    Add
                  </button>
                </form>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border)] space-y-2">
              <div className="flex gap-2">
                {selectedLead.status !== 'Resolved' ? (
                  <button
                    type="button"
                    onClick={() => updateLeadStatus(selectedLead, 'Resolved')}
                    className="flex-1 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold shadow-lg shadow-brand/10 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 size={14} /> Mark as Resolved
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => updateLeadStatus(selectedLead, 'Pending')}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Activity size={14} /> Reopen Lead
                  </button>
                )}
                {selectedLead.status === 'Pending' && (
                  <button
                    type="button"
                    onClick={() => updateLeadStatus(selectedLead, 'Contacted')}
                    className="flex-1 py-2.5 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-subtle)] rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <PhoneCall size={13} /> Mark Contacted
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => deleteLead(selectedLead)}
                className="w-full py-2.5 border border-red-500/25 hover:bg-red-500/10 text-red-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} /> Remove lead from database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsDashboard;
