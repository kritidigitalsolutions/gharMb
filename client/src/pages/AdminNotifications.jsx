import { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Info,
  Layers,
  CheckSquare,
  Zap,
  ShieldCheck,
  User,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

const AdminNotifications = () => {
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'broadcast'
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isMockMode, setIsMockMode] = useState(false);
  
  // Filtering & Searching
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');

  // Form State
  const [formData, setFormData] = useState({
    recipientType: 'all', // 'all' | 'specific'
    recipientId: '',
    title: '',
    message: '',
    type: 'system' // 'system' | 'verification' | 'payment' | 'enquiry' | 'property_status'
  });

  // Toast feedback
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  // Helper: Format Time Difference
  const formatTime = (dateString) => {
    if (!dateString) return 'Just now';
    const diffMs = new Date() - new Date(dateString);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  // 1. Fetch Users (for target recipient list)
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token || token === 'mock_admin_token_2026') {
        setIsMockMode(true);
        loadMockUsers();
        return;
      }

      const response = await fetch('http://localhost:5001/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        setUsers(data.data.users || []);
        setIsMockMode(false);
      } else {
        setError(data.message || 'Failed to fetch platform users from database.');
      }
    } catch (err) {
      console.warn('API connection failed. Falling back to mock users.', err);
      setIsMockMode(true);
      loadMockUsers();
    }
  };

  const loadMockUsers = () => {
    // Attempt to load from user management dashboard state
    const saved = localStorage.getItem('gharmb_users');
    if (saved) {
      try {
        setUsers(JSON.parse(saved));
        return;
      } catch (err) {
        console.error('Error parsing mock users:', err);
      }
    }
    // Static fallback
    setUsers([
      { id: 'USR-8902', name: 'Alok Mishra', email: 'alok.mishra@gmail.com', role: 'Buyer' },
      { id: 'USR-3120', name: 'Simran Jeet', email: 'simran.jeet@outlook.com', role: 'Seller' },
      { id: 'USR-4811', name: 'Vikram Developers', email: 'info@vikramdev.com', role: 'Builder' },
      { id: 'USR-0922', name: 'Deepak Estates', email: 'deepak.estates@gmail.com', role: 'Agent' },
      { id: 'USR-7731', name: 'Sanjay Aggarwal', email: 'sanjay.ag@gmail.com', role: 'Buyer' }
    ]);
  };

  // 2. Fetch Notification History Logs
  const fetchNotificationLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token || token === 'mock_admin_token_2026') {
        setIsMockMode(true);
        loadMockNotifications();
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/admin/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        setNotifications(data.data.notifications || []);
        setIsMockMode(false);
      } else {
        setError(data.message || 'Failed to fetch database notification logs.');
      }
    } catch (err) {
      console.warn('API logs fetch failed. Using local storage logs.', err);
      setError('Could not connect to database. Make sure the backend server is running on port 5001.');
    } finally {
      setLoading(false);
    }
  };

  const loadMockNotifications = () => {
    const saved = localStorage.getItem('gharmb_admin_notifications');
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
        return;
      } catch (err) {
        console.error('Error loading mock notifications:', err);
      }
    }

    const defaultLogs = [
      {
        _id: 'notif_1',
        title: 'Documents Pending RERA Check',
        message: 'Builder Vikram Developers submitted new license credentials for validation check.',
        type: 'verification',
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
        recipient: { name: 'Vikram Developers', email: 'info@vikramdev.com' },
        isRead: false
      },
      {
        _id: 'notif_2',
        title: 'Escrow Account Credited',
        message: 'Token booking payment of ₹50,000 received for Property Reference ID #GH-9092.',
        type: 'payment',
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hrs ago
        recipient: { name: 'Alok Mishra', email: 'alok.mishra@gmail.com' },
        isRead: true
      },
      {
        _id: 'notif_3',
        title: 'New Lead Enquiry Received',
        message: 'Sanjay Aggarwal requested a callback regarding Imperial Heights apartments.',
        type: 'enquiry',
        createdAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(), // 12 hrs ago
        recipient: { name: 'Sanjay Aggarwal', email: 'sanjay.ag@gmail.com' },
        isRead: true
      },
      {
        _id: 'notif_4',
        title: 'System Announcement: Holiday Hours',
        message: 'Broadcast alert regarding customer support availability updates during festive weekend.',
        type: 'system',
        createdAt: new Date(Date.now() - 1000 * 60 * 1440 * 2).toISOString(), // 2 days ago
        recipient: { name: 'All Users', email: 'broadcast' },
        isRead: true
      }
    ];

    setNotifications(defaultLogs);
    localStorage.setItem('gharmb_admin_notifications', JSON.stringify(defaultLogs));
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchUsers();
    fetchNotificationLogs();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */
  /* eslint-enable react-hooks/set-state-in-effect */

  // 3. Post Notification / Broadcast
  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      triggerToast('Please provide both notification title and message body.', 'error');
      return;
    }
    if (formData.recipientType === 'specific' && !formData.recipientId) {
      triggerToast('Please select a specific recipient user.', 'error');
      return;
    }

    setSubmitting(true);
    const payload = {
      title: formData.title,
      message: formData.message,
      type: formData.type,
      recipientId: formData.recipientType === 'specific' ? formData.recipientId : undefined
    };

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        // Handle mock mode dispatch
        handleMockBroadcastSubmit(payload);
        return;
      }

      const response = await fetch('http://localhost:5001/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        triggerToast('Notification dispatched successfully!');
        setFormData({
          recipientType: 'all',
          recipientId: '',
          title: '',
          message: '',
          type: 'system'
        });
        fetchNotificationLogs(); // Reload logs
        setActiveTab('history');
      } else {
        // Try fallback if API fails
        handleMockBroadcastSubmit(payload);
      }
    } catch (err) {
      console.warn('API dispatch failed. Saving locally.', err);
      handleMockBroadcastSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMockBroadcastSubmit = (payload) => {
    // Generate mock entry
    let targetRecipient = { name: 'All Users', email: 'broadcast' };
    if (payload.recipientId) {
      const foundUser = users.find(u => u._id === payload.recipientId || u.id === payload.recipientId);
      if (foundUser) {
        targetRecipient = { name: foundUser.name, email: foundUser.email };
      } else {
        targetRecipient = { name: 'Target User', email: 'specific' };
      }
    }

    const newNotif = {
      _id: 'notif_' + Date.now(),
      title: payload.title,
      message: payload.message,
      type: payload.type,
      createdAt: new Date().toISOString(),
      recipient: targetRecipient,
      isRead: false
    };

    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    localStorage.setItem('gharmb_admin_notifications', JSON.stringify(updated));

    triggerToast('Notification dispatched successfully (Saved Locally)!');
    setFormData({
      recipientType: 'all',
      recipientId: '',
      title: '',
      message: '',
      type: 'system'
    });
    setSubmitting(false);
    setActiveTab('history');
  };

  // Helper color tags for Notification Types
  const getNotifColor = (type) => {
    switch (type) {
      case 'enquiry':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
      case 'verification':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20';
      case 'payment':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'system':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';
      case 'property_status':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border border-slate-500/20';
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'enquiry':
        return <Zap size={14} />;
      case 'verification':
        return <CheckSquare size={14} />;
      case 'payment':
        return <ShieldCheck size={14} />;
      case 'system':
        return <Bell size={14} />;
      case 'property_status':
        return <Layers size={14} />;
      default:
        return <Info size={14} />;
    }
  };

  // Calculate statistics for top widgets
  const statsTotalLogs = notifications.length;
  const statsUnread = notifications.filter(n => !n.isRead).length;
  const statsSystem = notifications.filter(n => n.type === 'system').length;
  const statsEnquiries = notifications.filter(n => n.type === 'enquiry').length;

  // Filter and search computation
  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = 
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (notif.recipient && notif.recipient.name && notif.recipient.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (notif.recipient && notif.recipient.email && notif.recipient.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === 'All' || notif.type === filterType.toLowerCase();

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification Popup */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 py-3.5 px-6 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up border ${
          toast.type === 'success' 
            ? 'bg-emerald-950 border-emerald-800 text-emerald-300' 
            : 'bg-rose-950 border-rose-800 text-rose-300'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="text-emerald-400 shrink-0" size={18} />
          ) : (
            <AlertTriangle className="text-rose-400 shrink-0" size={18} />
          )}
          <div className="text-xs">
            <p className="font-extrabold text-white">{toast.type === 'success' ? 'Action Completed' : 'Operation Error'}</p>
            <p className={`text-[10px] ${toast.type === 'success' ? 'text-emerald-400/90' : 'text-rose-400/90'}`}>{toast.message}</p>
          </div>
        </div>
      )}

      {/* Sync State Banner */}
      {error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="shrink-0 text-rose-500" size={18} />
            <div>
              <p className="font-extrabold text-[var(--text-primary)]">Database Synchronization Failed</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{error}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => { setError(null); fetchUsers(); fetchNotificationLogs(); }}
            className="w-full sm:w-auto px-4 py-2 bg-rose-500 text-white hover:bg-rose-600 rounded-xl font-bold transition-all text-[10px] cursor-pointer shadow-md shadow-rose-500/10"
          >
            Retry Database Connection
          </button>
        </div>
      ) : isMockMode ? (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center gap-3 text-xs">
          <Info className="shrink-0 text-amber-500" size={18} />
          <div>
            <p className="font-extrabold text-[var(--text-primary)]">Sandbox Simulation Active</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Showing mock/demo dataset from LocalStorage. To query the real database, please log in with a valid admin account.</p>
          </div>
        </div>
      ) : null}

      {/* Top statistics summary widget widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Dispatch */}
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <Send size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Dispatches</p>
            <h4 className="text-lg font-black text-[var(--text-primary)] mt-0.5">{statsTotalLogs}</h4>
          </div>
        </div>

        {/* Card 2: Unread Alerts */}
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Bell size={18} className="animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Unread Alerts</p>
            <h4 className="text-lg font-black text-[var(--text-primary)] mt-0.5">{statsUnread}</h4>
          </div>
        </div>

        {/* Card 3: Broadcast Alerts */}
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Broadcast Bulletins</p>
            <h4 className="text-lg font-black text-[var(--text-primary)] mt-0.5">{statsSystem}</h4>
          </div>
        </div>

        {/* Card 4: Enquiry Alerts */}
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <MessageSquare size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Customer Enquiries</p>
            <h4 className="text-lg font-black text-[var(--text-primary)] mt-0.5">{statsEnquiries}</h4>
          </div>
        </div>
      </div>

      {/* Tabs Control and Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[var(--border)] pb-0.5 gap-4">
        {/* Tabs */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-4 text-xs font-bold transition-all relative border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'border-brand text-brand'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Layers size={14} />
            <span>Notification Logs</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
              activeTab === 'history' ? 'bg-brand/10 text-brand' : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
            }`}>
              {filteredNotifications.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`pb-3 px-4 text-xs font-bold transition-all relative border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'broadcast'
                ? 'border-brand text-brand'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Send size={14} />
            <span>Broadcast Console</span>
          </button>
        </div>

        {/* Sync Button */}
        <button
          onClick={fetchNotificationLogs}
          disabled={loading}
          className="py-1.5 px-3 bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl text-[10px] font-bold flex items-center gap-1.5 text-[var(--text-primary)] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Fetching...' : 'Reload Logs'}
        </button>
      </div>

      {/* Main Contents Panel */}
      <div className="min-h-[400px]">
        {activeTab === 'history' ? (
          <div className="space-y-4">
            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute top-3 left-3 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search logs by recipient, email, details or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-brand/40 placeholder:text-[var(--text-muted)]"
                />
              </div>

              {/* Type Category Filter */}
              <div className="relative shrink-0 flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-3 py-1.5">
                <Filter size={12} className="text-[var(--text-muted)]" />
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Type:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[var(--text-primary)] focus:outline-none cursor-pointer pr-4"
                >
                  <option value="All">All Categories</option>
                  <option value="System">System Bulletin</option>
                  <option value="Verification">RERA Verification</option>
                  <option value="Payment">Payment Gateway</option>
                  <option value="Enquiry">Enquiry / Visit</option>
                </select>
              </div>
            </div>

            {/* Logs List Container */}
            {loading ? (
              <div className="p-16 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl flex flex-col items-center justify-center gap-3">
                <RefreshCw size={24} className="animate-spin text-brand" />
                <p className="text-xs text-[var(--text-muted)] font-medium">Synchronizing notification database logs...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-16 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)]">
                  <Bell size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">No Records Found</h4>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1 max-w-xs">No dispatch logs match your current search query or category filters.</p>
                </div>
              </div>
            ) : (
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm divide-y divide-[var(--border-muted)]">
                {filteredNotifications.map((notif) => (
                  <div key={notif._id} className="p-4 hover:bg-[var(--bg-muted)]/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Type Icon & Body */}
                    <div className="flex gap-3.5 items-start min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${getNotifColor(notif.type)}`}>
                        {getNotifIcon(notif.type)}
                      </div>
                      <div className="space-y-1 min-w-0 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-xs font-bold text-[var(--text-primary)] leading-tight">{notif.title}</h5>
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${getNotifColor(notif.type)}`}>
                            {notif.type}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-subtle)] leading-relaxed">{notif.message}</p>
                        
                        {/* Meta/Links if applicable */}
                        {notif.metadata && (notif.metadata.propertyId || notif.metadata.enquiryId || notif.metadata.customLink) && (
                          <div className="flex items-center gap-3 pt-1 text-[9px] font-semibold text-brand">
                            {notif.metadata.propertyId && (
                              <span className="flex items-center gap-1">
                                <ExternalLink size={10} /> Property Action: {notif.metadata.propertyId}
                              </span>
                            )}
                            {notif.metadata.enquiryId && (
                              <span className="flex items-center gap-1">
                                <ExternalLink size={10} /> Lead Ref: {notif.metadata.enquiryId}
                              </span>
                            )}
                            {notif.metadata.customLink && (
                              <span className="flex items-center gap-1">
                                <ExternalLink size={10} /> Redirect: {notif.metadata.customLink}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Recipient, Read status & Date */}
                    <div className="flex md:flex-col items-center md:items-end justify-between shrink-0 pl-11 md:pl-0 border-t md:border-t-0 border-[var(--border-muted)] pt-3 md:pt-0 gap-2">
                      {/* Recipient User Badge */}
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                        <User size={12} className="text-slate-400" />
                        <div className="text-left md:text-right">
                          <p className="font-bold text-[var(--text-primary)] line-clamp-1">
                            {notif.recipient ? notif.recipient.name : 'Unknown User'}
                          </p>
                          <p className="text-[8px] mt-0.5 line-clamp-1">
                            {notif.recipient ? notif.recipient.email : ''}
                          </p>
                        </div>
                      </div>
                      
                      {/* Read status & Timestamp */}
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full ${
                          notif.isRead 
                            ? 'bg-slate-500/10 text-[var(--text-muted)] border border-slate-500/10' 
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {notif.isRead ? 'Read' : 'Unread'}
                        </span>
                        <span className="text-[9px] text-[var(--text-muted)] font-semibold">{formatTime(notif.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* TAB: BROADCAST CONSOLE FORM */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Compose Form Column */}
            <div className="lg:col-span-2 p-5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4">
              <div>
                <h4 className="font-bold text-[var(--text-primary)] text-xs uppercase tracking-wider flex items-center gap-2 border-b border-[var(--border-muted)] pb-2.5">
                  <Send size={15} className="text-brand" />
                  <span>Compose Platform Notification</span>
                </h4>
                <p className="text-[10px] text-[var(--text-muted)] mt-1.5">Dispatch real-time in-app alerts and notifications to system clients.</p>
              </div>

              <form onSubmit={handleBroadcastSubmit} className="space-y-4 text-xs">
                {/* Recipient Scope Selector */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Scope of Delivery</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, recipientType: 'all', recipientId: '' })}
                      className={`p-3 rounded-xl border font-bold text-center flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                        formData.recipientType === 'all'
                          ? 'border-brand bg-brand/5 text-brand shadow-sm'
                          : 'border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Users size={16} />
                      <div>
                        <p className="text-[10px] font-black leading-none">Broadcast Bulletin</p>
                        <span className="text-[8px] font-medium opacity-80 mt-1 block">Sends to all registered users</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, recipientType: 'specific' })}
                      className={`p-3 rounded-xl border font-bold text-center flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                        formData.recipientType === 'specific'
                          ? 'border-brand bg-brand/5 text-brand shadow-sm'
                          : 'border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <User size={16} />
                      <div>
                        <p className="text-[10px] font-black leading-none">Targeted Message</p>
                        <span className="text-[8px] font-medium opacity-80 mt-1 block">Deliver to a single recipient</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Specific User Dropdown selector */}
                {formData.recipientType === 'specific' && (
                  <div className="space-y-1 text-left animate-fade-in">
                    <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase">Select Recipient User</label>
                    <select
                      required
                      value={formData.recipientId}
                      onChange={(e) => setFormData({ ...formData, recipientId: e.target.value })}
                      className="w-full p-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-brand/40 text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
                    >
                      <option value="">-- Choose User Profile --</option>
                      {users.map((u) => (
                        <option key={u._id || u.id || u.email} value={u._id || u.id}>
                          {u.name} ({u.email}) - {u.role}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Grid Title & Notification Type */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase">Notification Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Identity Verified successfully"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full p-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-brand/40 placeholder:text-[var(--text-muted)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase">Notification Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full p-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-brand/40 cursor-pointer"
                    >
                      <option value="system">System bulletin</option>
                      <option value="verification">RERA Verification</option>
                      <option value="payment">Payment Alert</option>
                      <option value="enquiry">Lead Enquiry</option>
                      <option value="property_status">Property Status</option>
                    </select>
                  </div>
                </div>

                {/* Message Body */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase">Alert Message Body</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide description text explaining details of the notification. Will display in client tray..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full p-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-brand/40 placeholder:text-[var(--text-muted)] resize-none"
                  ></textarea>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/10 cursor-pointer"
                >
                  <Send size={13} />
                  <span>{submitting ? 'Dispatching Payload...' : 'Send Notification Message'}</span>
                </button>
              </form>
            </div>

            {/* Right: Informational Column */}
            <div className="space-y-4">
              {/* Box 1: Rules & Policies */}
              <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm text-xs space-y-3">
                <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Info size={14} className="text-brand shrink-0" />
                  <span>Delivery Directives</span>
                </h4>
                <div className="text-[10px] text-[var(--text-subtle)] space-y-2.5 leading-relaxed">
                  <p>All dispatched messages are delivered instantly via the internal in-app alerts router. Users will see a badge update upon logging in.</p>
                  <div className="p-2.5 bg-[var(--bg-muted)] rounded-lg text-slate-500 border border-[var(--border-muted)]">
                    <p className="font-bold text-[var(--text-primary)] mb-1">Standard Templates:</p>
                    <ul className="list-disc pl-3.5 space-y-1">
                      <li><strong>Verification:</strong> Triggered when RERA documents or Builder licenses are verified.</li>
                      <li><strong>Payment:</strong> Related to escrow tokens, refunds or payouts.</li>
                      <li><strong>Enquiry:</strong> New buy/sell property visits.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Box 2: Quick tips */}
              <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm text-xs space-y-3">
                <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-brand shrink-0" />
                  <span>Quality Checklist</span>
                </h4>
                <ul className="list-decimal pl-4 text-[9px] text-[var(--text-subtle)] space-y-2 leading-relaxed">
                  <li>Verify title is concise (under 50 characters).</li>
                  <li>Ensure links or references match property/lead ID exactly.</li>
                  <li>Verify recipient details before executing targeted scopes.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
