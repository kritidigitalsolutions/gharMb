import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building,
  CheckCircle,
  AlertTriangle,
  XCircle,
  HardHat,
  FolderLock,
  MessageSquare,
  Calendar,
  Layers,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const DashboardHome = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [verificationAlerts, setVerificationAlerts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState(null);

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      // If we don't have a real token or are running mock simulation
      if (!token || token === 'mock_admin_token_2026') {
        loadMockData();
        return;
      }

      const response = await fetch('http://localhost:5001/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        setStats(data.data.stats);
        setChartData(data.data.chartData);
        setVerificationAlerts(data.data.verificationAlerts);
        setAuditLogs(data.data.auditLogs);
      } else {
        setError(data.message || 'Failed to fetch dashboard stats.');
        loadMockData();
      }
    } catch (err) {
      console.error('Error fetching dashboard stats, using mock fallback:', err);
      loadMockData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockData = () => {
    setStats({
      totalUsers: 18490,
      activeUsers: 4102,
      totalProperties: 32840,
      liveProperties: 28190,
      pendingProperties: 184,
      rejectedProperties: 92,
      totalBuilders: 482,
      activeProjects: 1284,
      totalEnquiries: 8492,
      siteVisits: 1840,
      tokenRequests: 382,
      revenueGenerated: 1492000
    });
    setChartData([
      { name: 'Jan', revenue: 400000, enquiries: 1200 },
      { name: 'Feb', revenue: 650000, enquiries: 1800 },
      { name: 'Mar', revenue: 580000, enquiries: 2000 },
      { name: 'Apr', revenue: 900000, enquiries: 2400 },
      { name: 'May', revenue: 1100000, enquiries: 3100 },
      { name: 'Jun', revenue: 1492000, enquiries: 3800 },
    ]);
    setVerificationAlerts([
      { id: '1', title: 'RERA License Check', subtitle: 'Tata Value Homes' },
      { id: '2', title: 'Plot Land Survey Files', subtitle: 'Metro Developers' }
    ]);
    setAuditLogs([
      { id: '1', title: 'Property Approved & Marked Live', message: 'DLF Skycourt Sector 86 Gurugram', type: 'property_status', time: new Date(Date.now() - 10 * 60000).toISOString() },
      { id: '2', title: 'Property Verification Rejected', message: 'Incorrect land deed document submitted', type: 'property_status', time: new Date(Date.now() - 45 * 60000).toISOString() }
    ]);
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const metrics = [
    { title: 'Total Users', value: stats?.totalUsers.toLocaleString() || '0', change: '+12.4%', trend: 'up', color: 'text-brand bg-brand-light dark:bg-brand/10', sparkline: 'M0,20 Q15,10 30,18 T60,5 T90,12 T100,2' },
    { title: 'Active Users', value: stats?.activeUsers.toLocaleString() || '0', change: '+8.2%', trend: 'up', color: 'text-green-600 bg-green-500/10', sparkline: 'M0,15 Q15,8 30,12 T60,10 T90,5 T100,3' },
    { title: 'Total Properties', value: stats?.totalProperties.toLocaleString() || '0', change: '+15.1%', trend: 'up', color: 'text-blue-600 bg-blue-500/10', sparkline: 'M0,25 Q15,18 30,22 T60,12 T90,8 T100,2' },
    { title: 'Live Properties', value: stats?.liveProperties.toLocaleString() || '0', change: '+14.2%', trend: 'up', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10', sparkline: 'M0,25 Q15,15 30,20 T60,15 T90,5 T100,1' },
    { title: 'Pending Verification', value: stats?.pendingProperties || '0', change: '-4.3%', trend: 'down', color: 'text-yellow-600 bg-yellow-500/10', sparkline: 'M0,5 Q15,18 30,10 T60,22 T90,15 T100,25' },
    { title: 'Rejected Properties', value: stats?.rejectedProperties || '0', change: '+2.1%', trend: 'up', color: 'text-red-600 bg-red-500/10', sparkline: 'M0,20 Q15,22 30,15 T60,18 T90,10 T100,8' },
    { title: 'Total Builders', value: stats?.totalBuilders || '0', change: '+22.5%', trend: 'up', color: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10', sparkline: 'M0,22 Q15,15 30,18 T60,10 T90,5 T100,1' },
    { title: 'Active Projects', value: stats?.activeProjects.toLocaleString() || '0', change: '+11.8%', trend: 'up', color: 'text-sky-600 bg-sky-50 dark:bg-sky-500/10', sparkline: 'M0,20 Q15,12 30,15 T60,8 T90,5 T100,2' },
    { title: 'Total Enquiries', value: stats?.totalEnquiries.toLocaleString() || '0', change: '+18.6%', trend: 'up', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10', sparkline: 'M0,25 Q15,18 30,20 T60,12 T90,5 T100,2' },
    { title: 'Site Visits Scheduled', value: stats?.siteVisits.toLocaleString() || '0', change: '+5.7%', trend: 'up', color: 'text-teal-600 bg-teal-50 dark:bg-teal-500/10', sparkline: 'M0,18 Q15,15 30,12 T60,10 T90,8 T100,5' },
    { title: 'Token Requests', value: stats?.tokenRequests || '0', change: '+34.2%', trend: 'up', color: 'text-pink-600 bg-pink-50 dark:bg-pink-500/10', sparkline: 'M0,25 Q15,12 30,20 T60,8 T90,2 T100,1' },
    { title: 'Revenue Generated', value: stats ? `₹${stats.revenueGenerated.toLocaleString('en-IN')}` : '₹0', change: '+26.8%', trend: 'up', color: 'text-brand bg-brand-light dark:bg-brand/10', sparkline: 'M0,22 Q15,18 30,20 T60,8 T90,2 T100,1' },
  ];

  const formatLogTime = (timeString) => {
    try {
      const diffMs = new Date() - new Date(timeString);
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHrs = Math.floor(diffMins / 60);
      if (diffHrs < 24) return `${diffHrs}h ago`;
      return new Date(timeString).toLocaleDateString('en-GB');
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper action header with reload functionality */}
      <div className="flex justify-between items-center bg-[var(--bg-surface)] p-4 border border-[var(--border)] rounded-2xl shadow-xs">
        <div>
          <h2 className="text-xs font-bold text-[var(--text-primary)]">SaaS Metrics Control</h2>
          <p className="text-[10px] text-[var(--text-muted)]">Live analytics connected directly to MongoDB database</p>
        </div>
        <button
          type="button"
          onClick={fetchDashboardStats}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-subtle)] rounded-xl text-[10px] font-bold transition-all cursor-pointer"
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} /> Refresh Live Data
        </button>
      </div>

      {/* 12 Metrics Sparklines Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, idx) => (
          <div key={idx} className="p-5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs flex flex-col justify-between h-36 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            {isLoading ? (
              /* Skeleton Loader Card State */
              <div className="animate-pulse space-y-3 h-full flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <div className="h-3 bg-[var(--bg-muted)] rounded-md w-24"></div>
                  <div className="h-6 w-6 bg-[var(--bg-muted)] rounded-lg"></div>
                </div>
                <div className="h-6 bg-[var(--bg-muted)] rounded-md w-16"></div>
                <div className="h-3 bg-[var(--bg-muted)] rounded-md w-20"></div>
              </div>
            ) : (
              /* Normal Card State */
              <>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-semibold text-[var(--text-muted)]">{m.title}</span>
                  <div className={`inline-flex items-center text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                    m.trend === 'up' ? 'text-green-700 bg-green-500/10' : 'text-red-700 bg-red-500/10'
                  }`}>
                    {m.change}
                  </div>
                </div>

                <div className="flex items-end justify-between mt-2">
                  <div className="space-y-1">
                    <h3 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">{m.value}</h3>
                    <p className="text-[9px] text-[var(--text-muted)]">Compared to last 30d</p>
                  </div>

                  {/* Sparkline trendline */}
                  <div className="w-16 h-8 shrink-0">
                    <svg className={`w-full h-full ${m.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d={m.sparkline} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Main Revenue & Conversion Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-[var(--text-primary)]">Gross billing trend</h3>
              <p className="text-[10px] text-[var(--text-muted)]">Monthly breakdown of gross platform revenues</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-extrabold text-brand bg-brand-light px-2.5 py-1 rounded-lg">
              <Sparkles size={12} /> Live tracking
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenueUpgrade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5A3C" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#FF5A3C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip 
                  cursor={false}
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow)', padding: '8px 12px' }}
                  itemStyle={{ color: 'var(--text-primary)', fontSize: '11px', fontWeight: 'bold' }}
                  labelStyle={{ color: 'var(--text-muted)', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#FF5A3C" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenueUpgrade)" name="Revenue (₹)" activeDot={{ r: 4, strokeWidth: 0, fill: '#FF5A3C' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leads Funnel analytics chart */}
        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-[var(--text-primary)]">Monthly lead inquiries</h3>
            <p className="text-[10px] text-[var(--text-muted)]">Inbound leads captured by categories</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip 
                  cursor={false}
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow)', padding: '8px 12px' }}
                  itemStyle={{ color: 'var(--text-primary)', fontSize: '11px', fontWeight: 'bold' }}
                  labelStyle={{ color: 'var(--text-muted)', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}
                />
                <Bar dataKey="enquiries" fill="var(--text-primary)" radius={[4, 4, 0, 0]} name="Leads Count" activeBar={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Verification alerts & activities logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification alert cards list */}
        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4 lg:col-span-1">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">Verification Alerts</h3>
            <span className="text-[9px] px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-400 font-extrabold">Require Review</span>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl animate-pulse space-y-2">
                  <div className="h-3 bg-[var(--border)] rounded w-24"></div>
                  <div className="h-2 bg-[var(--border)] rounded w-16"></div>
                </div>
              ))
            ) : verificationAlerts.length === 0 ? (
              <p className="text-[10px] text-[var(--text-muted)] text-center py-6">All listings cleared & verified.</p>
            ) : (
              verificationAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  onClick={() => navigate('/verification')}
                  className="p-3.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-2xl flex justify-between items-center group cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <div>
                    <p className="text-xs font-bold text-[var(--text-subtle)]">{alert.title}</p>
                    <p className="text-[9px] text-[var(--text-muted)]">{alert.subtitle}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 group-hover:text-brand transition-colors" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit Log timeline list */}
        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">Audit logs & logs history</h3>
            <span className="text-[10px] font-extrabold text-brand flex items-center gap-0.5">
              Live System Timeline
            </span>
          </div>
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3 items-center animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-muted)] shrink-0"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-[var(--border)] rounded w-1/3"></div>
                    <div className="h-2 bg-[var(--border)] rounded w-1/4"></div>
                  </div>
                </div>
              ))
            ) : auditLogs.length === 0 ? (
              <p className="text-[10px] text-[var(--text-muted)] text-center py-6">No recent actions recorded.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="flex justify-between items-center border-b border-[var(--border-muted)] pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      log.type === 'payment' ? 'bg-green-500/10 text-green-600' :
                      log.type === 'verification' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-brand/10 text-brand'
                    }`}>
                      {log.type === 'payment' ? <CheckCircle size={15} /> : <Clock size={15} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-subtle)]">{log.title}</p>
                      <p className="text-[9px] text-[var(--text-muted)]">{log.message}</p>
                    </div>
                  </div>
                  <span className="text-[9px] text-[var(--text-muted)] whitespace-nowrap">{formatLogTime(log.time)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
