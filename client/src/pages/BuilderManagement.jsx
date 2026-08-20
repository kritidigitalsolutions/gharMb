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
  const [builders, setBuilders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoadingBuilders, setIsLoadingBuilders] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [error, setError] = useState(null);

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

  const isMockMode = !localStorage.getItem('adminToken') || localStorage.getItem('adminToken') === 'mock_admin_token_2026';

  const fetchBuilders = async () => {
    setIsLoadingBuilders(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (isMockMode) {
        loadMockBuilders();
        setIsLoadingBuilders(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/admin/users?role=Builder', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        const mapped = (data.data.users || []).map(u => {
          let status = 'Pending';
          if (u.builderVerificationStatus === 'approved') status = 'Approved';
          else if (u.builderVerificationStatus === 'rejected') status = 'Suspended';
          else if (u.status === 'Blocked') status = 'Suspended';

          return {
            id: `BLD-${u._id.slice(-4).toUpperCase()}`,
            _id: u._id,
            name: u.companyName || u.name,
            rera: u.reraNumber || u.gstNumber || 'Pending Check',
            exp: parseInt(u.yearsInBusiness) || 10,
            delivered: parseInt(u.unitsDelivered) || 20,
            trust: Math.round((u.rating || 4.5) * 20),
            status,
            user: u.email
          };
        });
        setBuilders(mapped);
      } else {
        loadMockBuilders();
      }
    } catch (err) {
      console.error('Error fetching builders:', err);
      loadMockBuilders();
    } finally {
      setIsLoadingBuilders(false);
    }
  };

  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (isMockMode) {
        loadMockProjects();
        setIsLoadingProjects(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/admin/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        const mapped = (data.data.projects || []).map(p => {
          let status = 'Draft';
          if (p.approvalStatus === 'approved') status = 'Published';
          else if (p.approvalStatus === 'rejected') status = 'Archived';

          return {
            id: `PRJ-${p._id.slice(-4).toUpperCase()}`,
            _id: p._id,
            title: p.projectName,
            builder: p.developerName || p.developer?.companyName || 'Developer',
            location: `${p.locality}, ${p.city}`,
            score: 8.5,
            status,
            units: `${p.totalUnits || 0} Units`,
            stage: p.projectStatus
          };
        });
        setProjects(mapped);
      } else {
        loadMockProjects();
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      loadMockProjects();
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const loadMockBuilders = () => {
    const saved = localStorage.getItem('gharmb_builders');
    if (saved) {
      try {
        setBuilders(JSON.parse(saved));
        return;
      } catch (err) {
        console.error('Error parsing mock builders:', err);
      }
    }
    setBuilders([
      { 
        id: 'BLD-4011', 
        _id: 'mock_b1', 
        name: 'DLF Limited', 
        rera: 'RERA-HR-2022-0091', 
        exp: 40, 
        delivered: 120, 
        trust: 98, 
        status: 'Approved', 
        user: 'dlf.admin@dlf.in',
        corporateAddress: 'DLF Gateway Tower, 10th Floor, DLF City Phase 2, Gurugram, Haryana - 122002',
        cin: 'L70101HR1963PLC002484',
        executiveContact: 'Mr. Ashok Kumar (Director of Sales) • +91 98110 22334 • ashok@dlf.in',
        gstin: '06AAACD1234F1Z8',
        pan: 'AAACD1234F',
        internalRiskRating: 'Tier-1 A+ (Zero Default History)',
        accountManager: 'Executive Vikram Malhotra',
        internalNotes: 'All corporate audits, land clearances, and escrow compliance verified. Top performing developer partner.'
      },
      { 
        id: 'BLD-9812', 
        _id: 'mock_b2', 
        name: 'Godrej Properties', 
        rera: 'RERA-UP-2023-0104', 
        exp: 12, 
        delivered: 42, 
        trust: 95, 
        status: 'Approved', 
        user: 'estate@godrej.com',
        corporateAddress: 'Godrej One, 5th Floor, Pirojshanagar, Eastern Express Highway, Vikhroli East, Mumbai - 400079',
        cin: 'L74120MH1990PLC049876',
        executiveContact: 'Mr. Pirojsha Godrej • +91 98200 99881 • corporate@godrejproperties.com',
        gstin: '27AAACG1234F1Z5',
        pan: 'AAACG1234F',
        internalRiskRating: 'Tier-1 A+ (High Liquidity)',
        accountManager: 'Executive Sneha Verma',
        internalNotes: 'Forest-theme projects validated. Digital customer onboarding integration complete.'
      },
      { 
        id: 'BLD-0922', 
        _id: 'mock_b3', 
        name: 'Supertech Group', 
        rera: 'RERA-HR-2019-0012', 
        exp: 25, 
        delivered: 78, 
        trust: 45, 
        status: 'Suspended', 
        user: 'contact@supertech.in',
        corporateAddress: 'Supertech Supernova, Sector 94, Noida, Uttar Pradesh - 201301',
        cin: 'U70100DL1995PLC074122',
        executiveContact: 'Mr. R.K. Arora • +91 98100 11223 • contact@supertech.in',
        gstin: '09AAACS9876D1Z2',
        pan: 'AAACS9876D',
        internalRiskRating: 'High Risk (Litigation Pending)',
        accountManager: 'Executive Vikram Malhotra',
        internalNotes: 'CAUTION: RERA compliance default flagged in 2025. Escrow withdrawals locked pending legal review.'
      },
      { 
        id: 'BLD-3319', 
        _id: 'mock_b4', 
        name: 'Tata Value Homes', 
        rera: 'RERA-MH-2024-1182', 
        exp: 18, 
        delivered: 35, 
        trust: 85, 
        status: 'Pending', 
        user: 'tatahousings@tata.com',
        corporateAddress: 'Bombay House, 24 Homi Mody Street, Fort, Mumbai - 400001',
        cin: 'U45200MH2009PLC195551',
        executiveContact: 'Mr. Sanjay Dutt • +91 98330 44556 • sanjay.dutt@tatarealty.com',
        gstin: '27AAACT4455K1Z1',
        pan: 'AAACT4455K',
        internalRiskRating: 'Tier-1 A (Institutional)',
        accountManager: 'Executive Sneha Verma',
        internalNotes: 'Onboarding application under final document scrutiny. Awaiting PAN verification seal.'
      }
    ]);
  };

  const loadMockProjects = () => {
    const saved = localStorage.getItem('gharmb_projects');
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
        return;
      } catch (err) {
        console.error('Error parsing mock projects:', err);
      }
    }
    setProjects([
      { id: 'PRJ-1082', _id: 'mock_p1', title: 'Tata Primanti', builder: 'Tata Value Homes', location: 'Sector 72, Gurugram', score: 9.2, status: 'Published', units: '3/4 BHK Villas', stage: 'Launch' },
      { id: 'PRJ-4902', _id: 'mock_p2', title: 'Godrej Woods Phase 2', builder: 'Godrej Properties', location: 'Sector 43, Noida', score: 8.8, status: 'Published', units: '2/3 BHK Apartments', stage: 'Construction' },
      { id: 'PRJ-0021', _id: 'mock_p3', title: 'DLF Skycourt', builder: 'DLF Limited', location: 'Sector 86, Gurugram', score: 9.5, status: 'Published', units: '3 BHK Apartments', stage: 'Completed' },
      { id: 'PRJ-8812', _id: 'mock_p4', title: 'Supertech Hues', builder: 'Supertech Group', location: 'Sector 68, Gurugram', score: 4.2, status: 'Archived', units: '2/3 BHK Apartments', stage: 'Planning' }
    ]);
  };

  useEffect(() => {
    fetchBuilders();
    fetchProjects();
  }, []);

  useEffect(() => {
    if (isMockMode) {
      localStorage.setItem('gharmb_builders', JSON.stringify(builders));
    }
  }, [builders]);

  useEffect(() => {
    if (isMockMode) {
      localStorage.setItem('gharmb_projects', JSON.stringify(projects));
    }
  }, [projects]);

  // Builder actions
  const updateBuilderStatus = async (builder, newStatus) => {
    if (isMockMode) {
      setBuilders(builders.map(b => {
        if (b.id === builder.id) {
          let trustModifier = b.trust;
          if (newStatus === 'Suspended') trustModifier = Math.max(10, b.trust - 30);
          if (newStatus === 'Approved' && b.status === 'Pending') trustModifier = 90;
          const updated = { ...b, status: newStatus, trust: trustModifier };
          if (selectedBuilder && selectedBuilder.id === builder.id) {
            setSelectedBuilder(updated);
          }
          return updated;
        }
        return b;
      }));
      alert(`Builder status updated locally.`);
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      let url = `http://localhost:5001/api/admin/users/${builder._id}/verify-developer`;
      let bodyStatus = newStatus === 'Approved' ? 'approved' : 'rejected';
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: bodyStatus, rejectReason: 'Suspended by admin' })
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        fetchBuilders();
        setSelectedBuilder(null);
        alert(`Builder status changed to ${newStatus}.`);
      } else {
        alert(data.message || 'Failed to update builder status.');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error.');
    }
  };

  const deleteBuilder = async (builder) => {
    if (isMockMode) {
      setBuilders(builders.filter(b => b.id !== builder.id));
      setSelectedBuilder(null);
      alert('Builder deleted locally.');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5001/api/admin/users/${builder._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        fetchBuilders();
        setSelectedBuilder(null);
        alert('Builder deactivated/suspended successfully.');
      } else {
        alert(data.message || 'Failed to delete builder.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server.');
    }
  };

  // Project actions
  const updateProjectStatus = async (project, newStatus) => {
    if (isMockMode) {
      setProjects(projects.map(p => {
        if (p.id === project.id) {
          const updated = { ...p, status: newStatus };
          if (selectedProject && selectedProject.id === project.id) {
            setSelectedProject(updated);
          }
          return updated;
        }
        return p;
      }));
      alert('Project status updated locally.');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      let apiStatus = 'pending';
      if (newStatus === 'Published') apiStatus = 'approved';
      else if (newStatus === 'Archived') apiStatus = 'rejected';

      const response = await fetch(`http://localhost:5001/api/admin/projects/${project._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ approvalStatus: apiStatus })
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        fetchProjects();
        setSelectedProject(null);
        alert(`Project status updated successfully to ${newStatus}.`);
      } else {
        alert(data.message || 'Failed to update project status.');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error.');
    }
  };

  const deleteProject = async (project) => {
    if (isMockMode) {
      setProjects(projects.filter(p => p.id !== project.id));
      setSelectedProject(null);
      alert('Project deleted locally.');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5001/api/admin/projects/${project._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        fetchProjects();
        setSelectedProject(null);
        alert('Project permanently deleted from DB.');
      } else {
        alert(data.message || 'Failed to delete project.');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error.');
    }
  };

  const getTrustBadgeClass = (score) => {
    if (score >= 90) return 'bg-green-500/10 text-green-700 border-green-500/25';
    if (score >= 70) return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/25';
    return 'bg-red-500/10 text-red-700 border-red-500/25';
  };

  // Filter logic
  const filteredBuilders = builders.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.rera.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.user.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.builder.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Upper overview counts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-brand flex items-center justify-center shrink-0">
            <HardHat size={18} />
          </div>
          <div>
            <span className="text-[9px] font-semibold text-[var(--text-muted)] block uppercase">Registered Builders</span>
            <h4 className="text-base font-extrabold text-[var(--text-primary)]">{builders.length} Builders</h4>
          </div>
        </div>
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers size={18} />
          </div>
          <div>
            <span className="text-[9px] font-semibold text-[var(--text-muted)] block uppercase">Developer Projects</span>
            <h4 className="text-base font-extrabold text-[var(--text-primary)]">{projects.length} Total Projects</h4>
          </div>
        </div>
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center shrink-0">
            <ShieldAlert size={18} />
          </div>
          <div>
            <span className="text-[9px] font-semibold text-[var(--text-muted)] block uppercase">Pending Certs</span>
            <h4 className="text-base font-extrabold text-[var(--text-primary)]">{builders.filter(b => b.status === 'Pending').length} RERA Audits</h4>
          </div>
        </div>
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <Award size={18} />
          </div>
          <div>
            <span className="text-[9px] font-semibold text-[var(--text-muted)] block uppercase">Avg Trust Score</span>
            <h4 className="text-base font-extrabold text-[var(--text-primary)]">
              {builders.length > 0 ? Math.round(builders.reduce((sum, b) => sum + b.trust, 0) / builders.length) : 0}% Rating
            </h4>
          </div>
        </div>
      </div>

      {/* Tabs & Search controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-1">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('builders')}
            className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'builders' ? 'text-brand' : 'text-[var(--text-subtle)]'
            }`}
          >
            Builders Management ({builders.length})
            {activeTab === 'builders' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-t-full"></span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'projects' ? 'text-brand' : 'text-[var(--text-subtle)]'
            }`}
          >
            Builder Projects ({projects.length})
            {activeTab === 'projects' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-t-full"></span>
            )}
          </button>
        </div>

        <div className="flex gap-3 max-w-sm w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-[var(--text-muted)]" size={14} />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[var(--border)] bg-[var(--bg-surface)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
            />
          </div>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'builders' ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-wider bg-[var(--bg-muted)]">
                  <th className="py-3 px-6">Company / ID</th>
                  <th className="py-3 px-6">RERA Certification</th>
                  <th className="py-3 px-6">Experience</th>
                  <th className="py-3 px-6 text-center">Delivered</th>
                  <th className="py-3 px-6 text-center">Trust Index</th>
                  <th className="py-3 px-6">Account Admin</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-muted)] text-xs">
                {isLoadingBuilders ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-20"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-24"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-12"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-8 mx-auto"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-8 mx-auto"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-24"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-16"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-12 ml-auto"></div></td>
                    </tr>
                  ))
                ) : filteredBuilders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-[var(--text-muted)] font-semibold">No builders found.</td>
                  </tr>
                ) : (
                  filteredBuilders.map((b) => (
                    <tr key={b.id} className="hover:bg-[var(--bg-muted)] transition-colors">
                      <td className="py-3.5 px-6">
                        <div>
                          <p className="font-extrabold text-[var(--text-primary)]">{b.name}</p>
                          <p className="text-[9px] text-[var(--text-muted)]">{b.id}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-[var(--text-subtle)] font-mono">{b.rera}</td>
                      <td className="py-3.5 px-6 text-[var(--text-subtle)] font-semibold">{b.exp} Years</td>
                      <td className="py-3.5 px-6 text-center font-semibold text-[var(--text-subtle)]">{b.delivered} Projects</td>
                      <td className="py-3.5 px-6 text-center">
                        <span className={`inline-flex px-2 py-0.5 border rounded-full text-[9px] font-bold ${getTrustBadgeClass(b.trust)}`}>
                          {b.trust}%
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-[var(--text-subtle)]">{b.user}</td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          b.status === 'Approved' ? 'bg-green-500/10 text-green-700' :
                          b.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-700' : 'bg-red-500/10 text-red-700'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedBuilder(b)}
                          className="px-2.5 py-1.5 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-subtle)] rounded-lg text-[10px] font-bold transition-all cursor-pointer"
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
      ) : (
        /* Projects Tab View */
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-wider bg-[var(--bg-muted)]">
                  <th className="py-3 px-6">Project Title / ID</th>
                  <th className="py-3 px-6">Developer</th>
                  <th className="py-3 px-6">Location</th>
                  <th className="py-3 px-6">Total Units</th>
                  <th className="py-3 px-6">Stage</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-muted)] text-xs">
                {isLoadingProjects ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-24"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-20"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-24"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-12"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-16"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-16"></div></td>
                      <td className="py-4 px-6"><div className="h-3 bg-[var(--bg-muted)] rounded w-12 ml-auto"></div></td>
                    </tr>
                  ))
                ) : filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-[var(--text-muted)] font-semibold">No builder projects found.</td>
                  </tr>
                ) : (
                  filteredProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--bg-muted)] transition-colors">
                      <td className="py-3.5 px-6">
                        <div>
                          <p className="font-extrabold text-[var(--text-primary)]">{p.title}</p>
                          <p className="text-[9px] text-[var(--text-muted)]">{p.id}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 font-bold text-[var(--text-subtle)]">{p.builder}</td>
                      <td className="py-3.5 px-6 font-semibold text-[var(--text-subtle)] flex items-center gap-1 mt-1">
                        <MapPin size={12} className="text-slate-400" /> {p.location}
                      </td>
                      <td className="py-3.5 px-6 text-[var(--text-subtle)] font-medium">{p.units}</td>
                      <td className="py-3.5 px-6">
                        <span className="px-2 py-0.5 rounded bg-[var(--bg-muted)] text-[var(--text-subtle)] font-semibold text-[9px]">
                          {p.stage}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          p.status === 'Published' ? 'bg-green-500/10 text-green-700' :
                          p.status === 'Draft' ? 'bg-yellow-500/10 text-yellow-700' : 'bg-red-500/10 text-red-700'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedProject(p)}
                          className="px-2.5 py-1.5 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-subtle)] rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Moderate
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Builder Details Drawer Slider */}
      {selectedBuilder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-end">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] h-full max-w-lg w-full shadow-2xl border-l border-[var(--border)] p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-5 text-left">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-[var(--border)] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-extrabold text-brand bg-brand-light dark:bg-brand/10 px-2 py-0.5 rounded">
                      {selectedBuilder.id}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      selectedBuilder.status === 'Approved' ? 'bg-green-500/10 text-green-700' :
                      selectedBuilder.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-700' : 'bg-red-500/10 text-red-700'
                    }`}>
                      {selectedBuilder.status}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-[var(--text-primary)] mt-1.5">{selectedBuilder.name}</h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">{selectedBuilder.user}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBuilder(null)}
                  className="p-1.5 bg-[var(--bg-muted)] rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* ─── SECTION A: CONFIDENTIAL - ADMIN INTERNAL ONLY ─── */}
              <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert size={14} className="text-amber-600" /> Admin Internal Information (Confidential)
                  </span>
                  <span className="text-[8px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded">
                    Not Displayed Publicly
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* Corporate Office Address */}
                  <div>
                    <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase block">Corporate Office Address</label>
                    <p className="text-[11px] font-bold text-[var(--text-primary)] mt-0.5 bg-[var(--bg-surface)] p-2 rounded-xl border border-[var(--border)]">
                      {selectedBuilder.corporateAddress || 'Suite 800, DLF Cyber City, Gurugram, Haryana - 122002'}
                    </p>
                  </div>

                  {/* Corporate CIN & Key Executive */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase block">Corporate CIN</label>
                      <p className="text-[10px] font-mono font-bold text-[var(--text-primary)] mt-0.5 bg-[var(--bg-surface)] p-1.5 rounded-lg border border-[var(--border)] truncate">
                        {selectedBuilder.cin || 'U70109HR2010PTC041289'}
                      </p>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase block">Risk Rating</label>
                      <p className="text-[10px] font-bold text-emerald-600 mt-0.5 bg-[var(--bg-surface)] p-1.5 rounded-lg border border-[var(--border)] truncate">
                        {selectedBuilder.internalRiskRating || 'Tier-1 A+'}
                      </p>
                    </div>
                  </div>

                  {/* Key Executive Contact */}
                  <div>
                    <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase block">Key Executive / Director Contact</label>
                    <p className="text-[10px] font-medium text-[var(--text-subtle)] mt-0.5 bg-[var(--bg-surface)] p-2 rounded-xl border border-[var(--border)]">
                      {selectedBuilder.executiveContact || 'Director of Sales • +91 98110 22334'}
                    </p>
                  </div>

                  {/* GSTIN & PAN */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase block">GSTIN</label>
                      <p className="text-[10px] font-mono text-[var(--text-primary)] bg-[var(--bg-surface)] p-1.5 rounded-lg border border-[var(--border)]">
                        {selectedBuilder.gstin || '06AAACD1234F1Z8'}
                      </p>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase block">PAN Card</label>
                      <p className="text-[10px] font-mono text-[var(--text-primary)] bg-[var(--bg-surface)] p-1.5 rounded-lg border border-[var(--border)]">
                        {selectedBuilder.pan || 'AAACD1234F'}
                      </p>
                    </div>
                  </div>

                  {/* Internal Notes */}
                  <div>
                    <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase block">Internal Admin Notes</label>
                    <p className="text-[10px] text-[var(--text-subtle)] mt-0.5 bg-[var(--bg-surface)] p-2 rounded-xl border border-[var(--border)] italic">
                      {selectedBuilder.internalNotes || 'Verified developer profile. Escrow account compliant.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ─── SECTION B: PUBLIC PROFILE INFORMATION ─── */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-wider block">
                  Public Profile Information (User Visible)
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[var(--bg-muted)] rounded-xl">
                    <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase block">RERA License</span>
                    <span className="text-[10px] font-bold text-[var(--text-primary)] font-mono block mt-0.5 truncate">{selectedBuilder.rera}</span>
                  </div>
                  <div className="p-3 bg-[var(--bg-muted)] rounded-xl">
                    <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase block">Years Active</span>
                    <span className="text-[10px] font-bold text-[var(--text-primary)] block mt-0.5">{selectedBuilder.exp} Years</span>
                  </div>
                  <div className="p-3 bg-[var(--bg-muted)] rounded-xl">
                    <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase block">Delivered Count</span>
                    <span className="text-[10px] font-bold text-[var(--text-primary)] block mt-0.5">{selectedBuilder.delivered} Projects</span>
                  </div>
                  <div className="p-3 bg-[var(--bg-muted)] rounded-xl">
                    <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase block">Public Trust Rating</span>
                    <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">{selectedBuilder.trust}% Rating</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Credentials Document checks</span>
                  <div className="p-3 border border-[var(--border)] rounded-xl space-y-2">
                    <a 
                      href="https://pdfobject.com/pdf/sample.pdf" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center justify-between text-xs font-semibold hover:text-brand transition-colors cursor-pointer group"
                    >
                      <span className="text-[var(--text-subtle)] group-hover:text-brand flex items-center gap-1.5"><FileCheck size={14} className="text-green-600 group-hover:scale-105 transition-transform" /> Corporate Registration Deed</span>
                      <span className="text-green-600 font-bold text-[10px]">Verified</span>
                    </a>
                    <a 
                      href="https://pdfobject.com/pdf/sample.pdf" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center justify-between text-xs font-semibold hover:text-brand transition-colors cursor-pointer group"
                    >
                      <span className="text-[var(--text-subtle)] group-hover:text-brand flex items-center gap-1.5"><FileCheck size={14} className="text-green-600 group-hover:scale-105 transition-transform" /> RERA License Certificate</span>
                      <span className="text-green-600 font-bold text-[10px]">Verified</span>
                    </a>
                  </div>
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-[var(--border)] space-y-2.5">
              {selectedBuilder.status === 'Pending' ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateBuilderStatus(selectedBuilder, 'Approved')}
                    className="flex-1 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold shadow-lg shadow-brand/10 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ShieldCheck size={14} /> Approve credentials
                  </button>
                  <button
                    type="button"
                    onClick={() => updateBuilderStatus(selectedBuilder, 'Suspended')}
                    className="flex-1 py-2.5 border border-red-500/25 hover:bg-red-500/10 text-red-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Ban size={14} /> Reject
                  </button>
                </div>
              ) : selectedBuilder.status === 'Approved' ? (
                <button
                  type="button"
                  onClick={() => updateBuilderStatus(selectedBuilder, 'Suspended')}
                  className="w-full py-2.5 border border-red-500/25 hover:bg-red-500/10 text-red-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Ban size={14} /> Suspend builder license
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => updateBuilderStatus(selectedBuilder, 'Approved')}
                  className="w-full py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold shadow-lg shadow-brand/10 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ShieldCheck size={14} /> Re-verify & activate credentials
                </button>
              )}
              <button
                type="button"
                onClick={() => deleteBuilder(selectedBuilder)}
                className="w-full py-2.5 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-red-500 hover:text-red-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} /> Deactivate builder Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Moderation Drawer Slider */}
      {selectedProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-end">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] h-full max-w-md w-full shadow-2xl border-l border-[var(--border)] p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6 text-left">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-extrabold text-brand bg-brand-light dark:bg-brand/10 px-2 py-0.5 rounded">PROJECT DETAILS</span>
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)] mt-1.5">{selectedProject.title}</h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">{selectedProject.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="p-1 bg-[var(--bg-muted)] rounded-lg text-[var(--text-muted)]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 text-xs font-semibold">
                <div className="p-3.5 bg-[var(--bg-muted)] rounded-xl flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Builder</span>
                    <span className="text-[var(--text-primary)]">{selectedProject.builder}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Location</span>
                    <span className="text-[var(--text-primary)]">{selectedProject.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Inventory</span>
                    <span className="text-[var(--text-primary)]">{selectedProject.units}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Project Stage</span>
                    <span className="text-[var(--text-primary)]">{selectedProject.stage}</span>
                  </div>
                </div>

                <div className="p-3 border border-[var(--border)] rounded-xl space-y-1.5 bg-[var(--bg-surface)]">
                  <div className="flex justify-between items-center text-[10px] font-bold text-[var(--text-muted)] uppercase">
                    <span>Audit checklist</span>
                    <span className="text-green-600">Passed</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-subtle)] space-y-1">
                    <p className="flex items-center gap-1.5"><Check size={12} className="text-green-600" /> RERA ID cross checked in Government register</p>
                    <p className="flex items-center gap-1.5"><Check size={12} className="text-green-600" /> Site map blueprints validation</p>
                    <p className="flex items-center gap-1.5"><Check size={12} className="text-green-600" /> Elevation structural plan approvals verified</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border)] space-y-2">
              {selectedProject.status !== 'Published' ? (
                <button
                  type="button"
                  onClick={() => updateProjectStatus(selectedProject, 'Published')}
                  className="w-full py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold shadow-lg shadow-brand/10 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckCircle size={14} /> Publish Project Live
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => updateProjectStatus(selectedProject, 'Archived')}
                  className="w-full py-2.5 border border-red-500/25 hover:bg-red-500/10 text-red-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Ban size={14} /> Suspend/Archive Listing
                </button>
              )}
              <button
                type="button"
                onClick={() => deleteProject(selectedProject)}
                className="w-full py-2.5 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-red-500 hover:text-red-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} /> Permanently delete project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuilderManagement;
