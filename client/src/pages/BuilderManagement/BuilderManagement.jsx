import { useState } from 'react';
import {
  HardHat,
  Award,
  // Bookmark,
  ShieldCheck,
  Ban,
  // Activity,
  Layers,
  MapPin,
  TrendingUp,
  // FileCheck,
  Search,
  // Plus,
  // ArrowRight,
  // ShieldAlert,
  // Percent,
  // CheckCircle
} from 'lucide-react';

const BuilderManagement = () => {
  // Mock Builders data
  const initialBuilders = [
    { id: 'BLD-4011', name: 'DLF Limited', rera: 'RERA-HR-2022-0091', exp: 40, delivered: 120, trust: 98, status: 'Approved', user: 'dlf.admin@dlf.in' },
    { id: 'BLD-9812', name: 'Godrej Properties', rera: 'RERA-UP-2023-0104', exp: 12, delivered: 42, trust: 95, status: 'Approved', user: 'estate@godrej.com' },
    { id: 'BLD-0922', name: 'Supertech Group', rera: 'RERA-HR-2019-0012', exp: 25, delivered: 78, trust: 45, status: 'Suspended', user: 'contact@supertech.in' },
    { id: 'BLD-3319', name: 'Tata Value Homes', rera: 'RERA-MH-2024-1182', exp: 18, delivered: 35, trust: 85, status: 'Pending', user: 'tatahousings@tata.com' }
  ];

  // Mock Projects data
  const initialProjects = [
    { id: 'PRJ-1082', title: 'Tata Primanti', builder: 'Tata Value Homes', location: 'Sector 72, Gurugram', score: 9.2, status: 'Published', units: '3/4 BHK Villas', stage: 'Launch' },
    { id: 'PRJ-4902', title: 'Godrej Woods Phase 2', builder: 'Godrej Properties', location: 'Sector 43, Noida', score: 8.8, status: 'Published', units: '2/3 BHK Apartments', stage: 'Construction' },
    { id: 'PRJ-0021', title: 'DLF Skycourt', builder: 'DLF Limited', location: 'Sector 86, Gurugram', score: 9.5, status: 'Published', units: '3 BHK Apartments', stage: 'Completed' },
    { id: 'PRJ-8812', title: 'Supertech Hues', builder: 'Supertech Group', location: 'Sector 68, Gurugram', score: 4.2, status: 'Archived', units: '2/3 BHK Apartments', stage: 'Planning' }
  ];

  const [builders, setBuilders] = useState(initialBuilders);
  const [projects, setProjects] = useState(initialProjects);
  const [activeTab, setActiveTab] = useState('builders'); // 'builders' or 'projects'
  const [searchQuery, setSearchQuery] = useState('');

  // Builder actions
  const updateBuilderStatus = (id, newStatus) => {
    setBuilders(builders.map(b => {
      if (b.id === id) {
        let trustModifier = b.trust;
        if (newStatus === 'Suspended') trustModifier = Math.max(10, b.trust - 30);
        if (newStatus === 'Approved' && b.status === 'Pending') trustModifier = 90;
        return { ...b, status: newStatus, trust: trustModifier };
      }
      return b;
    }));
  };

  const getTrustBadgeClass = (score) => {
    if (score >= 90) return 'bg-green-50 text-green-700 border-green-200';
    if (score >= 75) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const filteredBuilders = builders.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.rera.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.builder.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Tab select bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 gap-4">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => { setActiveTab('builders'); setSearchQuery(''); }}
            className={`py-3.5 px-6 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'builders'
                ? 'border-brand text-brand'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Developer Directory ({builders.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('projects'); setSearchQuery(''); }}
            className={`py-3.5 px-6 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'projects'
                ? 'border-brand text-brand'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Launches & Projects ({projects.length})
          </button>
        </div>

        {/* Search tool */}
        <div className="relative max-w-xs w-full pb-2 md:pb-0">
          <Search className="absolute top-2.5 left-3 text-slate-400" size={14} />
          <input
            type="text"
            placeholder={activeTab === 'builders' ? 'Search builders, RERA ID...' : 'Search projects, builder name...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand/40"
          />
        </div>
      </div>

      {/* Developers View Grid */}
      {activeTab === 'builders' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBuilders.map((b) => (
            <div key={b.id} className="bg-white border border-slate-100/80 rounded-2xl shadow-xs p-6 space-y-5 hover:shadow-md transition-shadow">
              {/* Header profile */}
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-brand flex items-center justify-center shrink-0">
                    <HardHat size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">{b.name}</h3>
                    <p className="text-[9px] text-slate-400">ID: {b.id} | {b.user}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                  b.status === 'Approved' ? 'bg-green-50 text-green-700' :
                  b.status === 'Suspended' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                }`}>
                  {b.status}
                </span>
              </div>

              {/* KPI stats */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-50 text-center">
                <div>
                  <p className="text-[9px] text-slate-400 font-semibold uppercase">Experience</p>
                  <p className="text-xs font-extrabold text-slate-700">{b.exp} Years</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-semibold uppercase">Completed</p>
                  <p className="text-xs font-extrabold text-slate-700">{b.delivered} Deliv.</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-semibold uppercase">Trust quotient</p>
                  <span className={`inline-flex px-1.5 py-0.5 rounded border text-[9px] font-bold mt-1 ${getTrustBadgeClass(b.trust)}`}>
                    {b.trust >= 90 ? 'A-Grade' : b.trust >= 75 ? 'Fair' : 'Critical'} ({b.trust}%)
                  </span>
                </div>
              </div>

              {/* RERA license registry log */}
              <div className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl justify-between">
                <div className="flex items-center gap-2">
                  <Award className="text-brand shrink-0" size={16} />
                  <div className="text-[10px]">
                    <p className="font-bold text-slate-700">RERA License</p>
                    <p className="text-slate-400 font-mono">{b.rera}</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">RERA Match</span>
              </div>

              {/* Actions panel */}
              <div className="flex gap-2 justify-end pt-1">
                {b.status === 'Pending' && (
                  <button
                    type="button"
                    onClick={() => updateBuilderStatus(b.id, 'Approved')}
                    className="py-1.5 px-3.5 bg-brand hover:bg-brand-dark rounded-xl text-[10px] font-extrabold text-white shadow-lg shadow-brand/10 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <ShieldCheck size={12} /> Approve Credentials
                  </button>
                )}
                {b.status === 'Approved' && (
                  <button
                    type="button"
                    onClick={() => updateBuilderStatus(b.id, 'Suspended')}
                    className="py-1.5 px-3.5 border border-red-200 hover:bg-red-50 rounded-xl text-[10px] font-extrabold text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Ban size={12} /> Suspend developer
                  </button>
                )}
                {b.status === 'Suspended' && (
                  <button
                    type="button"
                    onClick={() => updateBuilderStatus(b.id, 'Approved')}
                    className="py-1.5 px-3.5 border border-green-200 hover:bg-green-50 rounded-xl text-[10px] font-extrabold text-green-600 transition-colors cursor-pointer"
                  >
                    Activate Profile
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => alert(`Reviewing PDF certificate documents for ${b.name}`)}
                  className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Verify Papers
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Projects Timeline Table view */}
      {activeTab === 'projects' && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[9px] font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-6">Launch Details</th>
                  <th className="py-3 px-6">Developer Group</th>
                  <th className="py-3 px-6">Location</th>
                  <th className="py-3 px-6 text-center">Inv. Score (10)</th>
                  <th className="py-3 px-6">BHK Config</th>
                  <th className="py-3 px-6 text-center">Construction Stage</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-brand flex items-center justify-center shrink-0">
                          <Layers size={15} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{p.title}</p>
                          <p className="text-[9px] text-slate-400 font-mono">ID: {p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-700">{p.builder}</td>
                    <td className="py-3.5 px-6 text-slate-500 font-medium">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400" />
                        <span>{p.location}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-bold text-[9px] ${
                        p.score >= 9.0 ? 'bg-green-50 text-green-700' :
                        p.score >= 7.5 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                      }`}>
                        <TrendingUp size={8} /> {p.score}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-600">{p.units}</td>
                    <td className="py-3.5 px-6 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                        p.stage === 'Completed' ? 'bg-green-50 text-green-700 border border-green-200' :
                        p.stage === 'Construction' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                        p.stage === 'Launch' ? 'bg-brand/5 text-brand border border-brand/20' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {p.stage}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        p.status === 'Published' ? 'bg-green-50 text-green-700' :
                        p.status === 'Archived' ? 'bg-slate-100 text-slate-600' : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => alert(`Modifying properties config for project ${p.title}`)}
                          className="py-1 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-bold text-[10px] border border-slate-200/50 transition-colors cursor-pointer"
                        >
                          Modify Plans
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuilderManagement;
