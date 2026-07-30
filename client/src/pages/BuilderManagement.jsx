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
    <div className="space-y-6">
      {/* Tab select bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[var(--border)] gap-4">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => { setActiveTab('builders'); setSearchQuery(''); }}
            className={`py-3.5 px-6 text-xs font-bold border-b-2 transition-all cursor-pointer ${
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
            className={`py-3.5 px-6 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'projects'
                ? 'border-brand text-brand'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-subtle)]'
            }`}
          >
            Launches & Projects ({projects.length})
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end pb-2 sm:pb-0">
          {/* Search tool */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute top-2.5 left-3 text-[var(--text-muted)]" size={14} />
            <input
              type="text"
              placeholder={activeTab === 'builders' ? 'Search builders, RERA ID...' : 'Search projects, builder name...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
            />
          </div>
          <button
            type="button"
            onClick={() => activeTab === 'builders' ? setIsAddBuilderOpen(true) : setIsAddProjectOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold shadow-lg shadow-brand/10 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus size={12} /> {activeTab === 'builders' ? 'Add Developer' : 'Add Project'}
          </button>
        </div>
      </div>

      {/* Developers View Grid */}
      {activeTab === 'builders' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBuilders.map((b) => (
            <div key={b.id} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs p-6 space-y-5 hover:shadow-md transition-shadow">
              {/* Header profile */}
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-brand flex items-center justify-center shrink-0">
                    <HardHat size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-primary)]">{b.name}</h3>
                    <p className="text-[9px] text-[var(--text-muted)]">ID: {b.id} | {b.user}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                  b.status === 'Approved' ? 'bg-green-500/10 text-green-700' :
                  b.status === 'Suspended' ? 'bg-red-500/10 text-red-700' : 'bg-yellow-500/10 text-yellow-700'
                }`}>
                  {b.status}
                </span>
              </div>

              {/* KPI stats */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-[var(--border-muted)] text-center">
                <div>
                  <p className="text-[9px] text-[var(--text-muted)] font-semibold uppercase">Experience</p>
                  <p className="text-xs font-extrabold text-[var(--text-subtle)]">{b.exp} Years</p>
                </div>
                <div>
                  <p className="text-[9px] text-[var(--text-muted)] font-semibold uppercase">Completed</p>
                  <p className="text-xs font-extrabold text-[var(--text-subtle)]">{b.delivered} Deliv.</p>
                </div>
                <div>
                  <p className="text-[9px] text-[var(--text-muted)] font-semibold uppercase">Trust quotient</p>
                  <span className={`inline-flex px-1.5 py-0.5 rounded border text-[9px] font-bold mt-1 ${getTrustBadgeClass(b.trust)}`}>
                    {b.trust >= 90 ? 'A-Grade' : b.trust >= 75 ? 'Fair' : 'Critical'} ({b.trust}%)
                  </span>
                </div>
              </div>

              {/* RERA license registry log */}
              <div className="flex items-center gap-2.5 p-3 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl justify-between">
                <div className="flex items-center gap-2">
                  <Award className="text-brand shrink-0" size={16} />
                  <div className="text-[10px]">
                    <p className="font-bold text-[var(--text-subtle)]">RERA License</p>
                    <p className="text-[var(--text-muted)] font-mono">{b.rera}</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-green-700 bg-green-500/10 border border-green-500/25 px-1.5 py-0.5 rounded">RERA Match</span>
              </div>

              {/* Actions panel */}
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedBuilder(b)}
                  className="py-1.5 px-3 bg-[var(--bg-muted)] hover:bg-[var(--border)] rounded-xl text-[10px] font-bold text-[var(--text-subtle)] transition-colors cursor-pointer"
                >
                  Inspect details
                </button>
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
                    className="py-1.5 px-3.5 border border-red-500/25 hover:bg-red-500/100/10 rounded-xl text-[10px] font-extrabold text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Ban size={12} /> Suspend developer
                  </button>
                )}
                {b.status === 'Suspended' && (
                  <button
                    type="button"
                    onClick={() => updateBuilderStatus(b.id, 'Approved')}
                    className="py-1.5 px-3.5 border border-green-500/25 hover:bg-green-500/100/10 rounded-xl text-[10px] font-extrabold text-green-600 transition-colors cursor-pointer"
                  >
                    Activate Profile
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Projects Timeline Table view */}
      {activeTab === 'projects' && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-wider bg-[var(--bg-muted)]">
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
              <tbody className="divide-y divide-[var(--border-muted)] text-xs">
                {filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--bg-muted)] transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-brand flex items-center justify-center shrink-0">
                          <Layers size={15} />
                        </div>
                        <div>
                          <p className="font-bold text-[var(--text-primary)]">{p.title}</p>
                          <p className="text-[9px] text-[var(--text-muted)] font-mono">ID: {p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-bold text-[var(--text-subtle)]">{p.builder}</td>
                    <td className="py-3.5 px-6 text-[var(--text-subtle)] font-medium">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-[var(--text-muted)]" />
                        <span>{p.location}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-bold text-[9px] ${
                        p.score >= 9.0 ? 'bg-green-500/10 text-green-700' :
                        p.score >= 7.5 ? 'bg-yellow-500/10 text-yellow-700' : 'bg-red-500/10 text-red-700'
                      }`}>
                        <TrendingUp size={8} /> {p.score}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-[var(--text-subtle)]">{p.units}</td>
                    <td className="py-3.5 px-6 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                        p.stage === 'Completed' ? 'bg-green-500/10 text-green-700 border border-green-500/25' :
                        p.stage === 'Construction' ? 'bg-yellow-500/10 text-yellow-700 border border-yellow-200' :
                        p.stage === 'Launch' ? 'bg-brand/5 text-brand border border-brand/20' : 'bg-[var(--bg-muted)] text-[var(--text-subtle)]'
                      }`}>
                        {p.stage}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        p.status === 'Published' ? 'bg-green-500/10 text-green-700' :
                        p.status === 'Archived' ? 'bg-[var(--bg-muted)] text-[var(--text-subtle)]' : 'bg-yellow-500/10 text-yellow-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedProject(p)}
                          className="py-1 px-2.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)] text-[var(--text-subtle)] rounded-lg font-bold text-[10px] border border-[var(--border)]/50 transition-colors cursor-pointer"
                        >
                          Inspect details
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

      {/* Add Developer Modal */}
      {isAddBuilderOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[var(--border)] p-6 space-y-4 relative animate-scale-in">
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
                  className="w-full p-2.5 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
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
                  className="w-full p-2.5 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
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
                  className="w-full p-2.5 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Experience (Yrs)</label>
                  <input
                    type="number"
                    value={newBuilder.exp}
                    onChange={(e) => setNewBuilder({ ...newBuilder, exp: e.target.value })}
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Delivered</label>
                  <input
                    type="number"
                    value={newBuilder.delivered}
                    onChange={(e) => setNewBuilder({ ...newBuilder, delivered: e.target.value })}
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
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
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Status</label>
                <select
                  value={newBuilder.status}
                  onChange={(e) => setNewBuilder({ ...newBuilder, status: e.target.value })}
                  className="w-full p-2.5 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40 bg-[var(--bg-surface)]"
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
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[var(--border)] p-6 space-y-4 relative animate-scale-in">
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
                  className="w-full p-2.5 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Developer Group</label>
                <select
                  value={newProject.builder}
                  onChange={(e) => setNewProject({ ...newProject, builder: e.target.value })}
                  className="w-full p-2.5 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40 bg-[var(--bg-surface)]"
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
                  className="w-full p-2.5 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
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
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
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
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Launch Stage</label>
                  <select
                    value={newProject.stage}
                    onChange={(e) => setNewProject({ ...newProject, stage: e.target.value })}
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40 bg-[var(--bg-surface)]"
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
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40 bg-[var(--bg-surface)]"
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
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[var(--border)] p-6 space-y-6 relative animate-scale-in">
            <button
              type="button"
              onClick={() => setSelectedBuilder(null)}
              className="absolute top-4 right-4 p-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-subtle)] transition-colors"
            >
              <XCircle size={18} />
            </button>

            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center font-bold text-lg text-brand animate-bounce-slow">
                <HardHat size={28} />
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
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    selectedBuilder.status === 'Approved'
                      ? 'border border-red-500/25 hover:bg-red-500/100/10 text-red-600'
                      : 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                  }`}
                >
                  {selectedBuilder.status === 'Approved' ? 'Suspend Developer' : 'Approve Credentials'}
                </button>
                <button
                  type="button"
                  onClick={() => deleteBuilder(selectedBuilder.id)}
                  className="py-2.5 px-3 bg-red-500/10 hover:bg-red-500/100/20 text-red-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[var(--border)] p-6 space-y-6 relative animate-scale-in">
            <button
              type="button"
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 p-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-subtle)] transition-colors"
            >
              <XCircle size={18} />
            </button>

            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center font-bold text-lg text-brand animate-bounce-slow">
                <Layers size={28} />
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
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    selectedProject.status === 'Published'
                      ? 'border border-slate-300 hover:bg-[var(--bg-muted)] text-[var(--text-subtle)]'
                      : 'bg-brand hover:bg-brand-dark text-white shadow-lg shadow-brand/10'
                  }`}
                >
                  {selectedProject.status === 'Published' ? 'Archive Project' : 'Publish Project'}
                </button>
                <button
                  type="button"
                  onClick={() => deleteProject(selectedProject.id)}
                  className="py-2.5 px-3 bg-red-500/10 hover:bg-red-500/100/20 text-red-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
