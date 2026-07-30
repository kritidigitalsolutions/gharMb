import React, { useState, useEffect } from 'react';
import {
  HardHat,
  Award,
  Bookmark,
  ShieldCheck,
  Ban,
  Activity,
  Layers,
  MapPin,
  TrendingUp,
  FileCheck,
  Search,
  Plus,
  ArrowRight,
  ShieldAlert,
  Percent,
  CheckCircle,
  X,
  XCircle,
  Eye,
  Trash2
} from 'lucide-react';

const BuilderManagement = () => {
  const [builders, setBuilders] = useState(() => {
    const saved = localStorage.getItem('gharmb_builders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Error parsing gharmb_builders:', err);
      }
    }
    return [
      { id: 'BLD-4011', name: 'DLF Limited', rera: 'RERA-HR-2022-0091', exp: 40, delivered: 120, trust: 98, status: 'Approved', user: 'dlf.admin@dlf.in' },
      { id: 'BLD-9812', name: 'Godrej Properties', rera: 'RERA-UP-2023-0104', exp: 12, delivered: 42, trust: 95, status: 'Approved', user: 'estate@godrej.com' },
      { id: 'BLD-0922', name: 'Supertech Group', rera: 'RERA-HR-2019-0012', exp: 25, delivered: 78, trust: 45, status: 'Suspended', user: 'contact@supertech.in' },
      { id: 'BLD-3319', name: 'Tata Value Homes', rera: 'RERA-MH-2024-1182', exp: 18, delivered: 35, trust: 85, status: 'Pending', user: 'tatahousings@tata.com' }
    ];
  });

  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('gharmb_projects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Error parsing gharmb_projects:', err);
      }
    }
    return [
      { id: 'PRJ-1082', title: 'Tata Primanti', builder: 'Tata Value Homes', location: 'Sector 72, Gurugram', score: 9.2, status: 'Published', units: '3/4 BHK Villas', stage: 'Launch' },
      { id: 'PRJ-4902', title: 'Godrej Woods Phase 2', builder: 'Godrej Properties', location: 'Sector 43, Noida', score: 8.8, status: 'Published', units: '2/3 BHK Apartments', stage: 'Construction' },
      { id: 'PRJ-0021', title: 'DLF Skycourt', builder: 'DLF Limited', location: 'Sector 86, Gurugram', score: 9.5, status: 'Published', units: '3 BHK Apartments', stage: 'Completed' },
      { id: 'PRJ-8812', title: 'Supertech Hues', builder: 'Supertech Group', location: 'Sector 68, Gurugram', score: 4.2, status: 'Archived', units: '2/3 BHK Apartments', stage: 'Planning' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('gharmb_builders', JSON.stringify(builders));
  }, [builders]);

  useEffect(() => {
    localStorage.setItem('gharmb_projects', JSON.stringify(projects));
  }, [projects]);

  const [activeTab, setActiveTab] = useState('builders'); // 'builders' or 'projects'
  const [searchQuery, setSearchQuery] = useState('');

  // Modal & Drawer states
  const [isAddBuilderOpen, setIsAddBuilderOpen] = useState(false);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [selectedBuilder, setSelectedBuilder] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // Form states
  const [newBuilder, setNewBuilder] = useState({
    name: '',
    rera: '',
    exp: 5,
    delivered: 10,
    trust: 85,
    status: 'Approved',
    user: ''
  });

  const [newProject, setNewProject] = useState({
    title: '',
    builder: '',
    location: '',
    score: 8.5,
    status: 'Published',
    units: '',
    stage: 'Launch'
  });

  // Builder actions
  const updateBuilderStatus = (id, newStatus) => {
    setBuilders(builders.map(b => {
      if (b.id === id) {
        let trustModifier = b.trust;
        if (newStatus === 'Suspended') trustModifier = Math.max(10, b.trust - 30);
        if (newStatus === 'Approved' && b.status === 'Pending') trustModifier = 90;
        const updated = { ...b, status: newStatus, trust: trustModifier };
        if (selectedBuilder && selectedBuilder.id === id) {
          setSelectedBuilder(updated);
        }
        return updated;
      }
      return b;
    }));
  };

  const handleAddBuilderSubmit = (e) => {
    e.preventDefault();
    if (!newBuilder.name || !newBuilder.rera || !newBuilder.user) {
      alert('Please fill in all required fields.');
      return;
    }
    const newId = `BLD-${Math.floor(1000 + Math.random() * 9000)}`;
    const builderRecord = {
      id: newId,
      name: newBuilder.name,
      rera: newBuilder.rera,
      user: newBuilder.user,
      exp: Number(newBuilder.exp),
      delivered: Number(newBuilder.delivered),
      trust: Number(newBuilder.trust),
      status: newBuilder.status
    };
    setBuilders([...builders, builderRecord]);
    setIsAddBuilderOpen(false);
    setNewBuilder({
      name: '',
      rera: '',
      exp: 5,
      delivered: 10,
      trust: 85,
      status: 'Approved',
      user: ''
    });
  };

  const handleAddProjectSubmit = (e) => {
    e.preventDefault();
    const builderName = newProject.builder || (builders[0] ? builders[0].name : '');
    if (!newProject.title || !builderName || !newProject.location) {
      alert('Please fill in all required fields.');
      return;
    }
    const newId = `PRJ-${Math.floor(1000 + Math.random() * 9000)}`;
    const projectRecord = {
      id: newId,
      title: newProject.title,
      builder: builderName,
      location: newProject.location,
      score: Number(newProject.score),
      status: newProject.status,
      units: newProject.units || '2/3 BHK Apartments',
      stage: newProject.stage
    };
    setProjects([...projects, projectRecord]);
    setIsAddProjectOpen(false);
    setNewProject({
      title: '',
      builder: '',
      location: '',
      score: 8.5,
      status: 'Published',
      units: '',
      stage: 'Launch'
    });
  };

  const deleteBuilder = (id) => {
    setBuilders(builders.filter(b => b.id !== id));
    setSelectedBuilder(null);
  };

  const deleteProject = (id) => {
    setProjects(projects.filter(p => p.id !== id));
    setSelectedProject(null);
  };

  const updateProjectStatus = (id, newStatus) => {
    setProjects(projects.map(p => {
      if (p.id === id) {
        const updated = { ...p, status: newStatus };
        if (selectedProject && selectedProject.id === id) {
          setSelectedProject(updated);
        }
        return updated;
      }
      return p;
    }));
  };

  const getTrustBadgeClass = (score) => {
    if (score >= 90) return 'bg-green-500/10 text-green-700 border-green-500/25';
    if (score >= 75) return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    return 'bg-red-500/10 text-red-700 border-red-500/25';
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
    <div className="space-y-6 text-left">
      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs transition-all hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 border border-blue-500/5">
            <Layers size={18} />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Builders</p>
            <p className="text-xl font-extrabold text-[var(--text-primary)] mt-0.5">{builders.length}</p>
          </div>
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs transition-all hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/5">
            <CheckCircle size={18} />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Approved Groups</p>
            <p className="text-xl font-extrabold text-[var(--text-primary)] mt-0.5">{builders.filter(b => b.status === 'Approved').length}</p>
          </div>
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs transition-all hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/5">
            <ShieldAlert size={18} />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Pending RERA</p>
            <p className="text-xl font-extrabold text-[var(--text-primary)] mt-0.5">{builders.filter(b => b.status === 'Pending').length}</p>
          </div>
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs transition-all hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 border border-rose-500/5">
            <Ban size={18} />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Suspended</p>
            <p className="text-xl font-extrabold text-[var(--text-primary)] mt-0.5">{builders.filter(b => b.status === 'Suspended').length}</p>
          </div>
        </div>
      </div>

      {/* Tab select bar & Search/Add Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-[var(--border)] gap-4 pb-1">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setActiveTab('builders'); setSearchQuery(''); }}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
              activeTab === 'builders'
                ? 'border-brand text-brand'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-subtle)]'
            }`}
          >
            Developer Directory ({builders.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('projects'); setSearchQuery(''); }}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
              activeTab === 'projects'
                ? 'border-brand text-brand'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-subtle)]'
            }`}
          >
            Launches & Projects ({projects.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end pb-3 lg:pb-0">
          {/* Search tool */}
          <div className="relative max-w-xs w-full sm:w-64">
            <Search className="absolute top-2.5 left-3 text-[var(--text-muted)]" size={13} />
            <input
              type="text"
              placeholder={activeTab === 'builders' ? 'Search builders, RERA ID...' : 'Search projects, builder name...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40 placeholder:text-[var(--text-muted)]"
            />
          </div>
          <button
            type="button"
            onClick={() => activeTab === 'builders' ? setIsAddBuilderOpen(true) : setIsAddProjectOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-extrabold shadow-lg shadow-brand/10 transition-all hover:scale-105 active:scale-95 duration-150 cursor-pointer whitespace-nowrap"
          >
            <Plus size={13} /> {activeTab === 'builders' ? 'Add Developer' : 'Add Project'}
          </button>
        </div>
      </div>

      {/* Developers View Grid */}
      {activeTab === 'builders' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredBuilders.map((b) => (
            <div key={b.id} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs p-5 space-y-4.5 hover:shadow-lg hover:border-brand/20 hover:-translate-y-1 transition-all duration-300">
              {/* Header profile */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-brand-light dark:bg-brand/10 text-brand flex items-center justify-center shrink-0 border border-brand/5">
                    <HardHat size={20} />
                  </div>
                  <div className="text-left min-w-0">
                    <h3 className="text-sm font-extrabold text-[var(--text-primary)] leading-tight truncate">{b.name}</h3>
                    <p className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5 truncate">ID: <span className="font-mono">{b.id}</span> | {b.user}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold shrink-0 ${
                  b.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                  b.status === 'Suspended' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400' :
                  'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    b.status === 'Approved' ? 'bg-emerald-500 animate-pulse' :
                    b.status === 'Suspended' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
                  }`} />
                  {b.status}
                </span>
              </div>

              {/* KPI stats with visual trust quotient */}
              <div className="grid grid-cols-3 gap-4 py-3 border-y border-[var(--border-muted)] text-left items-center">
                <div>
                  <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Experience</p>
                  <p className="text-xs font-black text-[var(--text-primary)] mt-1">{b.exp} Years</p>
                </div>
                <div>
                  <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Completed</p>
                  <p className="text-xs font-black text-[var(--text-primary)] mt-1">{b.delivered} Deliveries</p>
                </div>
                <div>
                  <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Trust quotient</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-full h-1.5 bg-[var(--bg-muted)] rounded-full overflow-hidden border border-[var(--border)]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          b.trust >= 90 ? 'bg-emerald-500' : b.trust >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${b.trust}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-extrabold text-[var(--text-subtle)] shrink-0">{b.trust}%</span>
                  </div>
                </div>
              </div>

              {/* RERA license registry log */}
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-brand-light/30 to-orange-50/5 dark:from-brand/5 dark:to-transparent border border-brand/10 rounded-2xl justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-brand-light dark:bg-brand/10 text-brand flex items-center justify-center shrink-0">
                    <Award size={16} />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[10px] font-black text-[var(--text-primary)] tracking-tight">RERA Registered ID</p>
                    <p className="text-[9px] text-[var(--text-muted)] font-mono truncate tracking-tight">{b.rera}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/10 shrink-0">
                  <ShieldCheck size={10} /> Verified RERA
                </span>
              </div>

              {/* Actions panel */}
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedBuilder(b)}
                  className="py-1.5 px-3 bg-[var(--bg-muted)] hover:bg-[var(--border)] rounded-xl text-[10px] font-extrabold text-[var(--text-subtle)] flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Eye size={12} /> Inspect Details
                </button>
                {b.status === 'Pending' && (
                  <button
                    type="button"
                    onClick={() => updateBuilderStatus(b.id, 'Approved')}
                    className="py-1.5 px-3.5 bg-brand hover:bg-brand-dark rounded-xl text-[10px] font-extrabold text-white shadow-lg shadow-brand/10 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck size={12} /> Approve Credentials
                  </button>
                )}
                {b.status === 'Approved' && (
                  <button
                    type="button"
                    onClick={() => updateBuilderStatus(b.id, 'Suspended')}
                    className="py-1.5 px-3.5 border border-red-500/25 hover:bg-red-500/10 rounded-xl text-[10px] font-extrabold text-red-600 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Ban size={12} /> Suspend Developer
                  </button>
                )}
                {b.status === 'Suspended' && (
                  <button
                    type="button"
                    onClick={() => updateBuilderStatus(b.id, 'Approved')}
                    className="py-1.5 px-3.5 border border-green-500/25 hover:bg-green-500/10 rounded-xl text-[10px] font-extrabold text-green-600 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle size={12} /> Activate Profile
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Projects Timeline Table view */}
      {activeTab === 'projects' && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-wider bg-[var(--bg-muted)]">
                  <th className="py-3.5 px-6">Launch Details</th>
                  <th className="py-3.5 px-6">Developer Group</th>
                  <th className="py-3.5 px-6">Location</th>
                  <th className="py-3.5 px-6 text-center">Inv. Score</th>
                  <th className="py-3.5 px-6">BHK Config</th>
                  <th className="py-3.5 px-6">Construction Stage</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-muted)] text-xs">
                {filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--bg-muted)]/50 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-brand-light dark:bg-brand/10 text-brand flex items-center justify-center shrink-0 border border-brand/5">
                          <Layers size={14} />
                        </div>
                        <div className="text-left">
                          <p className="font-extrabold text-[var(--text-primary)] leading-tight">{p.title}</p>
                          <p className="text-[9px] text-[var(--text-muted)] font-mono mt-0.5">ID: {p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-extrabold text-[var(--text-subtle)] text-left">{p.builder}</td>
                    <td className="py-3.5 px-6 text-[var(--text-subtle)] font-medium text-left">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-[var(--text-muted)]" />
                        <span>{p.location}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full font-extrabold text-[9px] ${
                        p.score >= 9.0 ? 'bg-emerald-500/10 text-emerald-700' :
                        p.score >= 7.5 ? 'bg-amber-500/10 text-amber-700' : 'bg-rose-500/10 text-rose-700'
                      }`}>
                        ★ {p.score}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex px-2 py-0.5 bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--text-subtle)] font-bold text-[9px] rounded-lg">
                        {p.units}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex flex-col gap-1 min-w-[90px] text-left">
                        <span className={`text-[9px] font-extrabold w-max ${
                          p.stage === 'Completed' ? 'text-emerald-700 dark:text-emerald-400' :
                          p.stage === 'Construction' ? 'text-amber-700 dark:text-amber-400' :
                          p.stage === 'Launch' ? 'text-brand' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {p.stage}
                        </span>
                        <div className="w-16 h-1 bg-[var(--border)] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${
                            p.stage === 'Completed' ? 'bg-emerald-500' :
                            p.stage === 'Construction' ? 'bg-amber-500' :
                            p.stage === 'Launch' ? 'bg-brand' : 'bg-slate-400'
                          }`} style={{
                            width: p.stage === 'Completed' ? '100%' :
                                   p.stage === 'Construction' ? '60%' :
                                   p.stage === 'Launch' ? '25%' : '10%'
                          }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                        p.status === 'Published' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-slate-500/10 text-slate-500'
                      }`}>
                        <span className={`w-1.2 h-1.2 rounded-full ${p.status === 'Published' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedProject(p)}
                        className="py-1 px-2.5 bg-[var(--bg-muted)] hover:bg-[var(--border)] text-[var(--text-subtle)] rounded-lg font-extrabold text-[10px] border border-[var(--border)]/50 transition-all hover:scale-105 active:scale-95 flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Eye size={10} /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Developer Modal */}
      {isAddBuilderOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-3xl max-w-md w-full shadow-2xl border border-[var(--border)] p-6 space-y-4 relative animate-scale-in">
            <button
              type="button"
              onClick={() => setIsAddBuilderOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-subtle)] transition-colors"
            >
              <X size={16} />
            </button>

            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Add Developer Group</h3>
              <p className="text-[10px] text-[var(--text-muted)]">Register a new builder RERA certification profile</p>
            </div>

            <form onSubmit={handleAddBuilderSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Developer Name</label>
                <input
                  type="text"
                  required
                  value={newBuilder.name}
                  onChange={(e) => setNewBuilder({ ...newBuilder, name: e.target.value })}
                  placeholder="e.g. DLF Limited"
                  className="w-full p-2.5 border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">RERA Certificate ID</label>
                <input
                  type="text"
                  required
                  value={newBuilder.rera}
                  onChange={(e) => setNewBuilder({ ...newBuilder, rera: e.target.value })}
                  placeholder="e.g. RERA-HR-2022-0091"
                  className="w-full p-2.5 border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Admin Account Email</label>
                <input
                  type="email"
                  required
                  value={newBuilder.user}
                  onChange={(e) => setNewBuilder({ ...newBuilder, user: e.target.value })}
                  placeholder="e.g. contact@builder.com"
                  className="w-full p-2.5 border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Experience (Yrs)</label>
                  <input
                    type="number"
                    value={newBuilder.exp}
                    onChange={(e) => setNewBuilder({ ...newBuilder, exp: e.target.value })}
                    className="w-full p-2.5 border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Delivered</label>
                  <input
                    type="number"
                    value={newBuilder.delivered}
                    onChange={(e) => setNewBuilder({ ...newBuilder, delivered: e.target.value })}
                    className="w-full p-2.5 border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Trust Score (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={newBuilder.trust}
                    onChange={(e) => setNewBuilder({ ...newBuilder, trust: e.target.value })}
                    className="w-full p-2.5 border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Status</label>
                <select
                  value={newBuilder.status}
                  onChange={(e) => setNewBuilder({ ...newBuilder, status: e.target.value })}
                  className="w-full p-2.5 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40 bg-[var(--bg-muted)] text-[var(--text-primary)]"
                >
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBuilderOpen(false)}
                  className="flex-1 py-2.5 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-subtle)] rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold shadow-lg shadow-brand/10 transition-all"
                >
                  Save Developer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {isAddProjectOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-3xl max-w-md w-full shadow-2xl border border-[var(--border)] p-6 space-y-4 relative animate-scale-in">
            <button
              type="button"
              onClick={() => setIsAddProjectOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-subtle)] transition-colors"
            >
              <X size={16} />
            </button>

            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Add Project Launch</h3>
              <p className="text-[10px] text-[var(--text-muted)]">Register a new residential or commercial project launch</p>
            </div>

            <form onSubmit={handleAddProjectSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Project Title</label>
                <input
                  type="text"
                  required
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  placeholder="e.g. Godrej Woods Phase 2"
                  className="w-full p-2.5 border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Developer Group</label>
                <select
                  value={newProject.builder}
                  onChange={(e) => setNewProject({ ...newProject, builder: e.target.value })}
                  className="w-full p-2.5 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40 bg-[var(--bg-muted)] text-[var(--text-primary)]"
                >
                  <option value="">Select Developer Group...</option>
                  {builders.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Location (City, Sector)</label>
                <input
                  type="text"
                  required
                  value={newProject.location}
                  onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                  placeholder="e.g. Noida, Sector 43"
                  className="w-full p-2.5 border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">BHK Configurations</label>
                  <input
                    type="text"
                    value={newProject.units}
                    onChange={(e) => setNewProject({ ...newProject, units: e.target.value })}
                    placeholder="e.g. 2/3 BHK Apartments"
                    className="w-full p-2.5 border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Quality Score (10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={newProject.score}
                    onChange={(e) => setNewProject({ ...newProject, score: e.target.value })}
                    className="w-full p-2.5 border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Launch Stage</label>
                  <select
                    value={newProject.stage}
                    onChange={(e) => setNewProject({ ...newProject, stage: e.target.value })}
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40 bg-[var(--bg-muted)] text-[var(--text-primary)]"
                  >
                    <option value="Launch">Launch</option>
                    <option value="Construction">Construction</option>
                    <option value="Completed">Completed</option>
                    <option value="Planning">Planning</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Status</label>
                  <select
                    value={newProject.status}
                    onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40 bg-[var(--bg-muted)] text-[var(--text-primary)]"
                  >
                    <option value="Published">Published</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddProjectOpen(false)}
                  className="flex-1 py-2.5 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-subtle)] rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold shadow-lg shadow-brand/10 transition-all"
                >
                  Publish Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Developer Details Drawer */}
      {selectedBuilder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-3xl max-w-md w-full shadow-2xl border border-[var(--border)] p-6 space-y-6 relative animate-scale-in">
            <button
              type="button"
              onClick={() => setSelectedBuilder(null)}
              className="absolute top-4 right-4 p-1.5 bg-[var(--bg-muted)] hover:bg-[var(--border)] rounded-xl text-[var(--text-muted)] hover:text-red-500 hover:rotate-90 transition-all duration-200 cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-dark via-brand to-orange-400 p-[2px] shadow-md">
                <div className="w-full h-full rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-brand font-black">
                  <HardHat size={28} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">{selectedBuilder.name}</h3>
                <p className="text-xs text-[var(--text-muted)]">{selectedBuilder.user}</p>
              </div>
              <div className="flex gap-2">
                <span className="text-[9px] font-bold bg-[var(--bg-muted)] text-[var(--text-subtle)] px-2 py-0.5 rounded-md">
                  ID: {selectedBuilder.id}
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                  selectedBuilder.status === 'Approved' ? 'bg-green-500/10 text-green-700' :
                  selectedBuilder.status === 'Suspended' ? 'bg-red-500/10 text-red-700' : 'bg-yellow-500/10 text-yellow-700'
                }`}>
                  {selectedBuilder.status}
                </span>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-[var(--bg-muted)] border border-[var(--border)] rounded-2xl">
              <div className="flex justify-between text-xs border-b border-[var(--border)]/50 pb-2">
                <span className="text-[var(--text-muted)] font-medium">RERA Registration ID</span>
                <span className="font-semibold text-[var(--text-subtle)] font-mono">{selectedBuilder.rera}</span>
              </div>
              <div className="flex justify-between text-xs border-b border-[var(--border)]/50 pb-2">
                <span className="text-[var(--text-muted)] font-medium">Industry Experience</span>
                <span className="font-semibold text-[var(--text-subtle)]">{selectedBuilder.exp} Years</span>
              </div>
              <div className="flex justify-between text-xs border-b border-[var(--border)]/50 pb-2">
                <span className="text-[var(--text-muted)] font-medium">Delivered Projects</span>
                <span className="font-semibold text-[var(--text-subtle)]">{selectedBuilder.delivered} Projects</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)] font-medium">Trust Score Grade</span>
                <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] border ${getTrustBadgeClass(selectedBuilder.trust)}`}>
                  {selectedBuilder.trust}% Rating
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Developer Operations</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { updateBuilderStatus(selectedBuilder.id, selectedBuilder.status === 'Approved' ? 'Suspended' : 'Approved'); }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                    selectedBuilder.status === 'Approved'
                      ? 'border border-red-500/25 hover:bg-red-500/10 text-red-600 dark:text-red-400 bg-transparent'
                      : 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                  }`}
                >
                  {selectedBuilder.status === 'Approved' ? 'Suspend Developer' : 'Approve Credentials'}
                </button>
                <button
                  type="button"
                  onClick={() => deleteBuilder(selectedBuilder.id)}
                  className="py-2.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} /> Delete Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Details Drawer */}
      {selectedProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-3xl max-w-md w-full shadow-2xl border border-[var(--border)] p-6 space-y-6 relative animate-scale-in">
            <button
              type="button"
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 p-1.5 bg-[var(--bg-muted)] hover:bg-[var(--border)] rounded-xl text-[var(--text-muted)] hover:text-red-500 hover:rotate-90 transition-all duration-200 cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-dark via-brand to-orange-400 p-[2px] shadow-md">
                <div className="w-full h-full rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-brand font-black">
                  <Layers size={28} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">{selectedProject.title}</h3>
                <p className="text-xs text-[var(--text-muted)]">by {selectedProject.builder}</p>
              </div>
              <div className="flex gap-2">
                <span className="text-[9px] font-bold bg-[var(--bg-muted)] text-[var(--text-subtle)] px-2 py-0.5 rounded-md">
                  ID: {selectedProject.id}
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                  selectedProject.status === 'Published' ? 'bg-green-500/10 text-green-700' : 'bg-[var(--bg-muted)] text-[var(--text-subtle)]'
                }`}>
                  {selectedProject.status}
                </span>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-[var(--bg-muted)] border border-[var(--border)] rounded-2xl">
              <div className="flex justify-between text-xs border-b border-[var(--border)]/50 pb-2">
                <span className="text-[var(--text-muted)] font-medium">Physical Location</span>
                <span className="font-semibold text-[var(--text-subtle)]">{selectedProject.location}</span>
              </div>
              <div className="flex justify-between text-xs border-b border-[var(--border)]/50 pb-2">
                <span className="text-[var(--text-muted)] font-medium">Investment Score</span>
                <span className="font-bold text-[var(--text-subtle)]">{selectedProject.score} / 10</span>
              </div>
              <div className="flex justify-between text-xs border-b border-[var(--border)]/50 pb-2">
                <span className="text-[var(--text-muted)] font-medium">Configuration Units</span>
                <span className="font-semibold text-[var(--text-subtle)]">{selectedProject.units}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)] font-medium">Construction Stage</span>
                <span className="font-bold text-[var(--text-subtle)]">{selectedProject.stage}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Project Operations</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { updateProjectStatus(selectedProject.id, selectedProject.status === 'Published' ? 'Archived' : 'Published'); }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                    selectedProject.status === 'Published'
                      ? 'border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-subtle)] bg-transparent'
                      : 'bg-brand hover:bg-brand-dark text-white shadow-lg shadow-brand/10'
                  }`}
                >
                  {selectedProject.status === 'Published' ? 'Archive Project' : 'Publish Project'}
                </button>
                <button
                  type="button"
                  onClick={() => deleteProject(selectedProject.id)}
                  className="py-2.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} /> Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuilderManagement;
