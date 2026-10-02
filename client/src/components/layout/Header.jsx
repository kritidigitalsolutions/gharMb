import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContexts';
import {
  Menu,
  Bell,
  Search,
  CheckSquare,
  Plus,
  Zap,
  ShieldCheck,
  Sun,
  Moon,
  ExternalLink,
  Settings,
  LogOut,
  Crown,
  UserCircle2,
  Building2,
  Scan,
  ScanLine,
  ChevronDown,
  X,
  ArrowRight,
  Sparkles,
  Users
} from 'lucide-react';
import { logOutOfFirebase } from '../../config/firebase';

// ── Helper: read admin user from localStorage ──────────────────────────────
const getAdminUser = () => {
  const raw = localStorage.getItem('adminUser') || localStorage.getItem('admin');
  let user = { name: 'Super Admin', role: 'SaaS Admin', avatar: null };
  if (raw && raw !== 'undefined' && raw !== 'null') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        user = {
          name: parsed.name || (parsed.email ? parsed.email.split('@')[0] : 'Super Admin'),
          role: parsed.role || 'SaaS Admin',
          avatar: parsed.avatar || parsed.photoUrl || parsed.profilePicture || null,
        };
      }
    } catch (_) {}
  }
  return user;
};

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'AD';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const ROUTE_PAGE_NAMES = {
  '/admin': 'Dashboard',
  '/admin/verification': 'Property Verification',
  '/admin/users': 'User Management',
  '/admin/builders': 'Builders & RERA',
  '/admin/leads': 'Leads & Enquiries',
  '/admin/services': 'Services Hub',
  '/admin/tokens': 'Token Bookings',
  '/admin/references': 'Referral Network',
  '/admin/revenue': 'Revenue & Analytics',
  '/admin/reports': 'Reports & Export',
  '/admin/insights': 'Market Insights',
  '/admin/insights/categories': 'Insights Categories',
  '/admin/insights/new': 'Create Article',
  '/admin/faq': 'FAQ Management',
  '/admin/faq/categories': 'FAQ Categories',
  '/admin/testimonials': 'Testimonials',
  '/admin/web-inquiries': 'Web Inquiries',
  '/admin/notifications': 'Notifications',
  '/admin/settings': 'Settings',
  '/admin/legal': 'Legal Policies',
  '/admin/about': 'About Platform',
};

const Header = ({ toggleSidebar, title, isCollapsed = false, toggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = () => {
    if (title) return title;
    const path = location.pathname.replace(/\/$/, '') || '/admin';
    if (ROUTE_PAGE_NAMES[path]) return ROUTE_PAGE_NAMES[path];
    if (path.startsWith('/admin/insights/edit')) return 'Edit Article';
    const segment = path.split('/').filter(Boolean).pop();
    if (segment && segment !== 'admin') {
      return segment.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    }
    return 'Dashboard';
  };

  const pageTitle = getPageTitle();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const profileRef = useRef(null);
  const quickActionsRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  const adminUser = getAdminUser();
  const isAdmin = (adminUser.role || '').toLowerCase().includes('admin') ||
                  (adminUser.name || '').toLowerCase().includes('admin');

  // Quick navigation modules for search command palette
  const searchModules = [
    { title: 'Property Verification', category: 'Compliance', path: '/admin/verification', icon: <Zap size={14} /> },
    { title: 'User Management', category: 'Administration', path: '/admin/users', icon: <Users size={14} /> },
    { title: 'Builders & RERA', category: 'Real Estate', path: '/admin/builders', icon: <Building2 size={14} /> },
    { title: 'Token Bookings & Escrow', category: 'Finance', path: '/admin/tokens', icon: <ShieldCheck size={14} /> },
    { title: 'Services Hub (Loans & Interiors)', category: 'Services', path: '/admin/services', icon: <Plus size={14} /> },
    { title: 'Leads & Enquiries', category: 'CRM', path: '/admin/leads', icon: <CheckSquare size={14} /> },
    { title: 'Revenue & Financials', category: 'Analytics', path: '/admin/revenue', icon: <Zap size={14} /> },
    { title: 'Reports & Export', category: 'Analytics', path: '/admin/reports', icon: <ExternalLink size={14} /> },
    { title: 'Market Insights & Articles', category: 'Content', path: '/admin/insights', icon: <Sparkles size={14} /> },
    { title: 'System Settings', category: 'Configuration', path: '/admin/settings', icon: <Settings size={14} /> },
  ];

  const filteredModules = searchQuery.trim() === ''
    ? searchModules.slice(0, 5)
    : searchModules.filter(m =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const quickActionsList = [
    {
      title: 'Verify Properties',
      subtitle: 'Review & approve pending listings',
      path: '/admin/verification',
      icon: <Zap size={14} />
    },
    {
      title: 'Services Hub',
      subtitle: 'Manage Home Loans & Interiors',
      path: '/admin/services',
      icon: <Plus size={14} />
    },
    {
      title: 'Escrow Token Bookings',
      subtitle: 'Track property token receipts',
      path: '/admin/tokens',
      icon: <ShieldCheck size={14} />
    },
    {
      title: 'Builders & RERA Registry',
      subtitle: 'Audit licenses and projects',
      path: '/admin/builders',
      icon: <Building2 size={14} />
    },
    {
      title: 'Referral Rewards',
      subtitle: 'Process partner commissions',
      path: '/admin/references',
      icon: <ExternalLink size={14} />
    },
  ];

  // Close dropdowns on outside click & handle Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (quickActionsRef.current && !quickActionsRef.current.contains(e.target)) {
        setShowQuickActions(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowSearchResults(true);
      } else if (e.key === 'Escape') {
        setShowSearchResults(false);
        setShowQuickActions(false);
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const formatTime = (dateString) => {
    const diffMs = new Date() - new Date(dateString);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token || token === 'mock_admin_token_2026') {
        const localNotifs = [
          { id: 'notif_1', title: 'New RERA Verification', desc: 'Godrej Woods submitted license docs for approval.', time: '5m ago', isRead: false, type: 'verification' },
          { id: 'notif_2', title: 'Token Escrow Received', desc: 'Token booking of ₹2,50,000 received for PROP-9821.', time: '1h ago', isRead: false, type: 'payment' },
          { id: 'notif_3', title: 'New Site Visit Booking', desc: 'Farhan Merchant requested visit at Oberoi Sky City.', time: '3h ago', isRead: true, type: 'visit_booking' }
        ];
        setNotifications(localNotifs);
        return;
      }

      const response = await fetch('http://localhost:5001/api/admin/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.status === 401) {
        setNotifications([
          { id: 'notif_1', title: 'New RERA Verification', desc: 'Godrej Woods submitted license docs for approval.', time: '5m ago', isRead: false, type: 'verification' },
          { id: 'notif_2', title: 'Token Escrow Received', desc: 'Token booking of ₹2,50,000 received for PROP-9821.', time: '1h ago', isRead: false, type: 'payment' }
        ]);
        return;
      }
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        const mapped = (data.data.notifications || []).map(n => ({
          id: n._id,
          title: n.title,
          desc: n.message,
          time: formatTime(n.createdAt),
          isRead: n.isRead,
          type: n.type
        }));
        setNotifications(mapped.length > 0 ? mapped : [
          { id: 'notif_1', title: 'New RERA Verification', desc: 'Godrej Woods submitted license docs for approval.', time: '5m ago', isRead: false, type: 'verification' },
          { id: 'notif_2', title: 'Token Escrow Received', desc: 'Token booking of ₹2,50,000 received for PROP-9821.', time: '1h ago', isRead: false, type: 'payment' }
        ]);
      }
    } catch {
      // Graceful local fallback on server disconnect
      setNotifications([
        { id: 'notif_1', title: 'New RERA Verification', desc: 'Godrej Woods submitted license docs for approval.', time: '5m ago', isRead: false, type: 'verification' },
        { id: 'notif_2', title: 'Token Escrow Received', desc: 'Token booking of ₹2,50,000 received for PROP-9821.', time: '1h ago', isRead: false, type: 'payment' }
      ]);
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */
  /* eslint-enable react-hooks/set-state-in-effect */

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  const handleNotifClick = async (notif) => {
    setShowNotifications(false);

    if (!notif.isRead) {
      try {
        const token = localStorage.getItem('adminToken');
        if (token && token !== 'mock_admin_token_2026') {
          await fetch(`http://localhost:5001/api/admin/notifications/${notif.id}/read`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }

    if (notif.title.includes('RERA') || notif.type === 'verification') {
      navigate('/admin/builders');
    } else if (notif.title.includes('Escrow') || notif.type === 'payment') {
      navigate('/admin/tokens');
    }
  };

  const handleClearNotifs = async (e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('adminToken');
      if (token && token !== 'mock_admin_token_2026') {
        await fetch('http://localhost:5001/api/admin/notifications/mark-all-read', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const getNotifColor = (type) => {
    switch (type) {
      case 'enquiry':
      case 'visit_booking':
        return 'bg-brand/10 text-brand';
      case 'property_status':
      case 'verification':
        return 'bg-[#DD543C]/10 text-[#DD543C]';
      case 'payment':
        return 'bg-brand/15 text-brand font-bold';
      default:
        return 'bg-[var(--bg-muted)] text-[var(--text-subtle)]';
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'enquiry':
        return <Zap size={14} />;
      case 'payment':
        return <ShieldCheck size={14} />;
      default:
        return <CheckSquare size={14} />;
    }
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
    try { await logOutOfFirebase(); } catch (_) {}
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('admin');
    navigate('/login');
  };

  const handleSettings = () => {
    setShowProfileMenu(false);
    navigate('/admin/settings');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-[var(--bg-surface)]/90 backdrop-blur-md border-b border-[var(--border)] shrink-0 transition-colors duration-250">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] md:hidden transition-all duration-200 active:scale-90 shrink-0 cursor-pointer"
          title="Open navigation"
        >
          <Menu size={18} />
        </button>


        {/* Page Name */}
        <div className="flex items-center min-w-0">
          <h1 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight truncate whitespace-nowrap">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Action triggers */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        
        {/* ── Quick Actions Menu ── */}
        <div className="relative" ref={quickActionsRef}>
          <button
            type="button"
            onClick={() => {
              setShowQuickActions(prev => !prev);
              setShowNotifications(false);
              setShowProfileMenu(false);
              setShowSearchResults(false);
            }}
            className={`group flex items-center gap-1.5 h-9 px-3.5 bg-brand hover:bg-[#DD543C] text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-sm transition-all duration-150 active:scale-[0.97] cursor-pointer shrink-0 border border-brand hover:border-[#DD543C] ${
              showQuickActions ? 'bg-[#DD543C] ring-2 ring-brand/20' : ''
            }`}
            title="Quick Actions"
          >
            <Plus size={13} strokeWidth={2.2} className="transition-transform duration-200 group-hover:rotate-90 shrink-0" />
            <span className="hidden sm:inline tracking-tight">Quick Actions</span>
            <ChevronDown 
              size={12} 
              className={`text-white/80 group-hover:text-white transition-transform duration-200 shrink-0 ${showQuickActions ? 'rotate-180' : ''}`} 
            />
          </button>

          {showQuickActions && (
            <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-64 sm:w-72 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xl z-40 overflow-hidden animate-slide-down origin-top-left">
              {/* Header */}
              <div className="px-3.5 py-2.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-muted)]/40">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={13} className="text-brand" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Quick Actions</span>
                </div>
                <span className="text-[9px] font-bold text-brand bg-brand/10 border border-brand/20 px-1.5 py-0.5 rounded-md">Shortcuts</span>
              </div>

              {/* Actions List */}
              <div className="p-1.5 space-y-1">
                {quickActionsList.map((action, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      navigate(action.path);
                      setShowQuickActions(false);
                    }}
                    className="w-full text-left p-2 hover:bg-[var(--bg-muted)] rounded-xl transition-all duration-150 flex items-center justify-between group/item cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0 group-hover/item:bg-brand group-hover/item:text-white transition-colors duration-200 shadow-2xs">
                        {action.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[var(--text-primary)] truncate group-hover/item:text-brand transition-colors">
                          {action.title}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] truncate">
                          {action.subtitle}
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={13} className="text-[var(--text-muted)] opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Search Bar with Live Command Center ── */}
        <div className="relative hidden md:block" ref={searchContainerRef}>
          <div className="flex items-center h-9 w-48 lg:w-72 bg-[var(--bg-muted)]/70 hover:bg-[var(--bg-muted)] focus-within:bg-[var(--bg-surface)] rounded-xl transition-all duration-150 group border-0 outline-none">
            <Search className="ml-3 text-[var(--text-muted)] group-focus-within:text-brand transition-colors shrink-0" size={14} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search dashboard parameters..."
              className="w-full pl-2.5 pr-3 py-1.5 text-xs font-medium bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none border-none"
            />
            
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="p-1 mr-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-muted)] cursor-pointer transition-colors shrink-0"
                title="Clear"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Search Dropdown Modal / Palette */}
          {showSearchResults && (
            <div className="absolute left-0 mt-2 w-72 lg:w-80 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xl z-40 overflow-hidden animate-slide-down origin-top-left">
              <div className="px-3.5 py-2 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-muted)]/40">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                  {searchQuery.trim() ? 'Matching Modules' : 'Quick Navigation'}
                </span>
                <span className="text-[9px] font-bold text-[var(--text-muted)]">Esc to close</span>
              </div>

              <div className="p-1.5 max-h-72 overflow-y-auto space-y-0.5">
                {filteredModules.length === 0 ? (
                  <div className="p-5 text-center text-xs text-[var(--text-muted)] font-medium">
                    No matching parameters found for <span className="font-bold text-[var(--text-primary)]">"{searchQuery}"</span>
                  </div>
                ) : (
                  filteredModules.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        navigate(item.path);
                        setShowSearchResults(false);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[var(--bg-muted)] rounded-xl transition-all duration-150 flex items-center justify-between group/item cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[var(--bg-muted)] group-hover/item:bg-brand/10 text-[var(--text-muted)] group-hover/item:text-brand flex items-center justify-center shrink-0 transition-colors">
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[var(--text-primary)] truncate group-hover/item:text-brand transition-colors">
                            {item.title}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] truncate">
                            {item.category}
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={12} className="text-[var(--text-muted)] opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowQuickActions(false);
              setShowProfileMenu(false);
            }}
            className="group relative w-8 h-8 flex items-center justify-center text-[var(--text-muted)] rounded-xl hover:bg-[var(--bg-muted)] hover:text-[var(--text-subtle)] transition-all duration-200 active:scale-90 cursor-pointer"
          >
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full border border-[var(--bg-surface)]"></span>
            )}
            <Bell size={16} className="transition-transform group-hover:animate-bell-ring origin-top" />
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)}></div>
              <div className="absolute right-0 mt-2 w-72 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xl z-20 overflow-hidden animate-slide-down origin-top-right">
                <div className="px-4 py-2.5 border-b border-[var(--border-muted)] flex justify-between items-center bg-[var(--bg-muted)]">
                  <span className="font-bold text-xs text-[var(--text-primary)]">Alerts & Logs</span>
                  <div className="flex items-center gap-2.5">
                    {unreadNotificationsCount > 0 && (
                      <button onClick={handleClearNotifs} className="text-[9px] font-bold text-brand hover:underline cursor-pointer">Clear All</button>
                    )}
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/admin/notifications');
                      }}
                      className="p-1 rounded-lg text-[var(--text-muted)] hover:text-brand hover:bg-[var(--bg-surface)] transition-all cursor-pointer flex items-center justify-center"
                      title="View all notifications"
                    >
                      <ExternalLink size={13} />
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-[var(--border-muted)] max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[var(--text-muted)] font-semibold">No notifications pending.</div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className={`p-3 hover:bg-[var(--bg-muted)] transition-colors cursor-pointer flex gap-2.5 ${
                          notif.isRead ? 'opacity-60' : ''
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${getNotifColor(notif.type)}`}>
                          {getNotifIcon(notif.type)}
                        </div>
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex justify-between items-baseline gap-1">
                            <p className={`text-[11px] text-[var(--text-primary)] leading-tight truncate ${notif.isRead ? 'font-medium' : 'font-extrabold'}`}>
                              {notif.title}
                            </p>
                            <span className="text-[8px] text-[var(--text-muted)] font-semibold shrink-0">{notif.time}</span>
                          </div>
                          <p className="text-[10px] text-[var(--text-subtle)] leading-snug line-clamp-2">{notif.desc}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen();
              setIsFullscreen(true);
            } else {
              document.exitFullscreen();
              setIsFullscreen(false);
            }
          }}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] transition-colors duration-150 cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <ScanLine size={16} strokeWidth={2} /> : <Scan size={16} strokeWidth={2} />}
        </button>

        {/* Theme Toggle Switch with Smooth Radial Ripple Trigger */}
        <div className="h-8 flex items-center shrink-0">
          <div
            className="theme-toggle-switch flex items-center cursor-pointer select-none" 
            style={{ transform: 'scale(0.72)', transformOrigin: 'center' }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            onClick={(e) => toggleTheme(e)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleTheme(e);
              }
            }}
          >
            <input
              className="toggle-checkbox"
              type="checkbox"
              checked={theme === 'dark'}
              readOnly
              tabIndex={-1}
            />
            <div className="toggle-slot">
              <div className="sun-icon-wrapper">
                <Sun className="sun-icon" />
              </div>
              <div className="toggle-button" />
              <div className="moon-icon-wrapper">
                <Moon className="moon-icon" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Profile Avatar Dropdown ──────────────────────────────────────── */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            id="profile-menu-trigger"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
              setShowQuickActions(false);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] transition-colors duration-150 cursor-pointer"
            title="Account menu"
          >
            <UserCircle2 size={22} strokeWidth={1.5} />
          </button>

          {/* Dropdown panel — CSS transition for smooth slide */}
          <div
            className={`absolute right-0 mt-2 w-52 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl z-50 overflow-hidden origin-top-right transition-all duration-300 ease-out ${
              showProfileMenu
                ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
            }`}
          >
            {/* User info header */}
            <div className="px-4 pt-3.5 pb-3 bg-[var(--bg-muted)] border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center text-brand shrink-0">
                  {isAdmin ? <Crown size={15} /> : <ShieldCheck size={15} />}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold text-[var(--text-primary)] truncate leading-tight">{adminUser.name}</p>
                  <span className="inline-flex items-center text-[8px] font-extrabold text-brand bg-brand/10 px-1.5 py-0.5 rounded-md mt-0.5">
                    {adminUser.role || 'SaaS Admin'}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1.5">
              <button
                type="button"
                id="profile-menu-settings"
                onClick={handleSettings}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-[var(--text-subtle)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] transition-all duration-150 cursor-pointer group/item"
              >
                <Settings size={14} className="text-[var(--text-muted)] group-hover/item:text-brand transition-all duration-200 group-hover/item:rotate-45" />
                Settings
              </button>

              <div className="mx-3 border-t border-[var(--border)] my-1" />

              <button
                type="button"
                id="profile-menu-logout"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-[var(--text-subtle)] hover:bg-[#DD543C]/10 hover:text-[#DD543C] transition-all duration-150 cursor-pointer group/item"
              >
                <LogOut size={14} className="text-[var(--text-muted)] group-hover/item:text-[#DD543C] transition-all duration-150 group-hover/item:translate-x-0.5" />
                Logout
              </button>
            </div>
          </div>
        </div>
        {/* ── /Profile Avatar Dropdown ─────────────────────────────────────── */}
      </div>
    </header>
  );
};

export default Header;
