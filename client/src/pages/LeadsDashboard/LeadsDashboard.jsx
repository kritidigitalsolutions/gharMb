import { useState, useEffect } from 'react';
import {
  PhoneCall,
  MessageSquare,
  // FileSpreadsheet,
  // CalendarDays,
  // ArrowRight,
  TrendingUp,
  // Percent,
  // MapPin,
  // ExternalLink,
  // Search,
  // Filter,
  // UserCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  // BarChart,
  // Bar,
  // XAxis,
  // YAxis,
  // CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  // Legend,
  Sector
} from 'recharts';

const LeadsDashboard = () => {
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [hoveredFunnel, setHoveredFunnel] = useState(null);
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);
  // Stats summary
  const summaryStats = [
    { title: 'Daily Leads', value: '184', change: '+14.2%', trend: 'up', color: 'text-orange-600 bg-orange-50', gradient: 'from-white to-orange-50/20' },
    { title: 'Monthly Leads Logged', value: '4,890', change: '+18.6%', trend: 'up', color: 'text-indigo-600 bg-indigo-50', gradient: 'from-white to-indigo-50/20' },
    { title: 'Funnel Conversion Rate', value: '3.82%', change: '+0.5%', trend: 'up', color: 'text-emerald-600 bg-emerald-50', gradient: 'from-white to-emerald-50/20' },
    { title: 'Site Visits', value: '482 Booked', change: '+12.4%', trend: 'up', color: 'text-blue-600 bg-blue-50', gradient: 'from-white to-blue-50/20' }
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
        <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-xl space-y-1 text-xs">
          <p className="font-extrabold text-slate-800">{data.name}</p>
          <div className="flex gap-4 justify-between items-center text-[11px] text-slate-500 font-semibold">
            <span>Leads: <strong className="text-slate-800">{data.value.toLocaleString()}</strong></span>
            <span className="text-brand font-bold">{percent}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Mock Leads listings
  const initialLeads = [
    { id: 'LED-3210', client: 'Ankit Sharma', phone: '+91 98765 00112', property: 'Godrej Woods Phase 2', type: 'WhatsApp', date: '16 Jun 2026', status: 'Pending', assignedTo: 'Executive Vikram' },
    { id: 'LED-4921', client: 'Pooja Mehta', phone: '+91 98123 45678', property: 'DLF Skycourt Penthouse', type: 'Call Request', date: '16 Jun 2026', status: 'Contacted', assignedTo: 'Executive Sneha' },
    { id: 'LED-8802', client: 'Rajesh Malhotra', phone: '+91 88990 01122', property: 'Tata Primanti Luxury Villa', type: 'Site Visit Scheduled', date: '15 Jun 2026', status: 'Approved', assignedTo: 'Executive Vikram' },
    { id: 'LED-1092', client: 'Kunal Sen', phone: '+91 99112 23344', property: 'Commercial Shop Sec 37D', type: 'Brochure Download', date: '14 Jun 2026', status: 'Resolved', assignedTo: 'System Automated' }
  ];

  const [leads, setLeads] = useState(initialLeads);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');

  const reassignLead = (id, newAssignee) => {
    setLeads(leads.map(l => l.id === id ? { ...l, assignedTo: newAssignee } : l));
    alert(`Lead ID ${id} reassigned to ${newAssignee}.`);
  };

  const filteredLeads = selectedTypeFilter === 'All'
    ? leads
    : leads.filter(l => l.type === selectedTypeFilter);

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {summaryStats.map((stat, idx) => (
          <div 
            key={idx} 
            className={`p-5 bg-gradient-to-br ${stat.gradient} border border-slate-100 rounded-2xl shadow-xs flex items-center justify-between hover:shadow-md hover:-translate-y-[3px] transition-all duration-250 ease-out`}
          >
            <div className="space-y-1">
              <span className="text-[9px] font-semibold text-slate-400 block uppercase">{stat.title}</span>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">{stat.value}</h3>
              <div className="flex items-center gap-1 text-[9px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full w-max">
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
        <div className="lg:col-span-2 p-6 bg-gradient-to-b from-white to-slate-50/40 border border-slate-100 rounded-2xl shadow-xs hover:shadow-md hover:-translate-y-[3px] transition-all duration-250 ease-out space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-800">Conversion Funnel Dropoff</h3>
            <p className="text-[10px] text-slate-400">Total conversion rate breakdown from views to sales escrow</p>
          </div>
          <div className="space-y-4">
            {funnelData.map((item, idx) => (
              <div 
                key={idx} 
                className="grid grid-cols-12 items-center gap-4 relative py-1 hover:bg-slate-50/20 rounded-xl px-2 -mx-2 transition-colors duration-250"
                onMouseEnter={() => setHoveredFunnel(idx)}
                onMouseLeave={() => setHoveredFunnel(null)}
              >
                {/* Left: Stage Name */}
                <div className="col-span-3 md:col-span-2">
                  <span className="text-xs font-bold text-slate-700 tracking-tight block">
                    {item.stage}
                  </span>
                </div>

                {/* Center: Rounded Progress Bar Track (with glow background) */}
                <div className="col-span-6 md:col-span-8 relative h-6 flex items-center">
                  {/* Soft orange glow behind active bar */}
                  <div
                    className="absolute h-full bg-brand/12 blur-xs rounded-xl transition-all pointer-events-none"
                    style={{ 
                      left: 0,
                      width: isAnimated ? item.conversion : '0%',
                      opacity: hoveredFunnel === idx ? 1 : 0,
                      transform: 'scaleY(1.25) scaleX(1.01)',
                      transition: 'width 800ms cubic-bezier(0.16, 1, 0.3, 1), opacity 250ms ease'
                    }}
                  />
                  {/* Track container */}
                  <div className="w-full h-full bg-slate-50 border border-slate-100/70 rounded-xl overflow-hidden relative flex items-center z-10">
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
                  <span className="text-xs font-extrabold text-slate-800 block">
                    {item.value.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-bold text-brand block mt-0.5">
                    {item.conversion}
                  </span>
                </div>

                {/* Floating Tooltip with Smooth Translate & Fade */}
                <div 
                  className="absolute left-1/2 bg-white border border-slate-100 rounded-2xl p-3 shadow-xl z-20 pointer-events-none text-[10px] space-y-1 min-w-[140px] text-center transition-all duration-300 ease-out"
                  style={{
                    bottom: hoveredFunnel === idx ? '108%' : '90%',
                    opacity: hoveredFunnel === idx ? 1 : 0,
                    transform: 'translateX(-50%)',
                    visibility: hoveredFunnel === idx ? 'visible' : 'hidden'
                  }}
                >
                  <p className="font-extrabold text-slate-800">{item.stage}</p>
                  <p className="text-slate-500 font-semibold">Leads: <strong className="text-slate-800">{item.value.toLocaleString()}</strong></p>
                  <p className="text-brand font-extrabold">Stage Conversion: {item.conversion}</p>
                  {/* Tooltip Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-r border-b border-slate-100 rotate-45 -mt-1.5"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Sources pie chart */}
        <div className="p-6 bg-gradient-to-b from-white to-slate-50/40 border border-slate-100 rounded-2xl shadow-xs hover:shadow-md hover:-translate-y-[3px] transition-all duration-250 ease-out space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-800">Lead Generation Channels</h3>
            <p className="text-[10px] text-slate-400">Distribution of leads registered</p>
          </div>
          <div className="h-44 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {/* Donut Segment Halo (Background Highlight) */}
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

                {/* Main Pie Chart */}
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
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Total Leads</span>
                  <span className="text-sm font-extrabold text-slate-800 block">{totalLeads.toLocaleString()}</span>
                </div>
              ) : (
                <div className="text-center space-y-0.5 animate-in fade-in zoom-in-95 duration-200">
                  <span 
                    className="text-[8px] font-bold uppercase tracking-wider block truncate max-w-[80px]"
                    style={{ color: sourceData[hoveredIndex].color }}
                  >
                    {getShortName(sourceData[hoveredIndex].name)}
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 block">
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
              <div key={i} className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </span>
                <span className="font-bold text-slate-800">{entry.value} leads</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="p-6 bg-gradient-to-b from-white to-slate-50/40 border border-slate-100 rounded-2xl shadow-xs hover:shadow-md hover:-translate-y-[3px] transition-all duration-250 ease-out space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 className="text-xs font-bold text-slate-800">Lead Registration Log</h3>

          {/* Filters */}
          <div className="flex gap-1.5 overflow-x-auto">
            {['All', 'WhatsApp', 'Call Request', 'Site Visit Scheduled'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedTypeFilter === type
                    ? 'bg-brand text-white shadow-md shadow-brand/10'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[9px] font-bold uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-6">Lead ID</th>
                <th className="py-3 px-6">Client Info</th>
                <th className="py-3 px-6">Property Listing</th>
                <th className="py-3 px-6">Source Channel</th>
                <th className="py-3 px-6">Logged Date</th>
                <th className="py-3 px-6">Executive Assigned</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {filteredLeads.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-slate-500">{l.id}</td>
                  <td className="py-3.5 px-6">
                    <p className="font-bold text-slate-800">{l.client}</p>
                    <p className="text-[10px] text-slate-400">{l.phone}</p>
                  </td>
                  <td className="py-3.5 px-6 font-bold text-slate-700">{l.property}</td>
                  <td className="py-3.5 px-6">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                      l.type === 'WhatsApp' ? 'bg-green-50 text-green-700' :
                      l.type === 'Call Request' ? 'bg-blue-50 text-blue-700' : 'bg-teal-50 text-teal-700'
                    }`}>
                      {l.type === 'WhatsApp' ? <MessageSquare size={10} /> : <PhoneCall size={10} />}
                      {l.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-semibold text-slate-700">{l.date}</td>
                  <td className="py-3.5 px-6 text-slate-600 font-bold">{l.assignedTo}</td>
                  <td className="py-3.5 px-6">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      l.status === 'Approved' || l.status === 'Resolved' ? 'bg-green-50 text-green-700' :
                      l.status === 'Contacted' ? 'bg-blue-50 text-blue-700' : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      type="button"
                      onClick={() => reassignLead(l.id, 'Executive Sneha')}
                      className="py-1 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/50 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Re-Assign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeadsDashboard;
