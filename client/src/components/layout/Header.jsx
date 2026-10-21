import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContexts';
import API from '../../api/api';
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
  Building2,
  Scan,
  ScanLine,
  X,
  User,
  Sparkles,
  Users,
  Inbox,
  LayoutDashboard,
  BarChart3,
  IndianRupee,
  UserCheck,
  FileCheck,
  Briefcase,
  PackageCheck,
  Gift,
  MailCheck,
  Radio,
  Layers,
  FileText,
  PhoneCall,
  Info,
  MessageSquareQuote,
  CheckCheck,
  Check,
  Coins,
  Calendar,
  MessageSquare,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { logOutOfFirebase } from '../../config/firebase';

// ── Helper: read admin user from localStorage ──────────────────────────────
const getAdminUser = () => {
  const raw = localStorage.getItem('adminUser') || localStorage.getItem('admin');
  let user = { name: 'Admin', role: 'Super Admin', email: 'admin@gharmb.com' };
  if (raw && raw !== 'undefined' && raw !== 'null') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const cleanName = (parsed.name && parsed.name.toLowerCase() !== 'angel') ? parsed.name : 'Admin';
        user = {
          name: cleanName,
          role: parsed.role || 'Super Admin',
          email: parsed.email || 'admin@gharmb.com',
        };
      }
    } catch (_) {}
  }
  return user;
};

const ROUTE_PAGE_NAMES = {
  '/admin': 'Dashboard Overview',
  '/admin/verification': 'Property Verification',
  '/admin/users': 'User Accounts',
  '/admin/builders': 'Builders & Projects',
  '/admin/agents': 'Agents & Brokers',
  '/admin/enquiries': 'Property Enquiries',
  '/admin/leads': 'Leads Pipeline',
  '/admin/services': 'Services Hub',
  '/admin/services-catalog': 'Service Catalog',
  '/admin/tokens': 'Token Bookings',
  '/admin/references': 'Referral Network',
  '/admin/revenue': 'Revenue & Finance',
  '/admin/reports': 'Reports & Export',
  '/admin/insights': 'Market Insights',
  '/admin/insights/categories': 'Insight Categories',
  '/admin/insights/new': 'Create Article',
  '/admin/faq': 'Help & FAQs',
  '/admin/faq/categories': 'FAQ Categories',
  '/admin/testimonials': 'Client Reviews',
  '/admin/web-inquiries': 'Website Enquiries',
  '/admin/notifications': 'System Notifications',
  '/admin/broadcasts': 'Push Broadcasts',
  '/admin/settings': 'Platform Settings',
  '/admin/legal': 'Legal Policies',
  '/admin/about': 'About Platform',
  '/admin/contact': 'Contact Details',
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const profileRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const mobileSearchContainerRef = useRef(null);
  const mobileInputRef = useRef(null);
  const resultsListRef = useRef(null);

  const [adminUser, setAdminUser] = useState(getAdminUser);

  useEffect(() => {
    const syncAdminUser = () => setAdminUser(getAdminUser());
    window.addEventListener('storage', syncAdminUser);
    return () => window.removeEventListener('storage', syncAdminUser);
  }, []);

  const isAdmin = (adminUser.role || '').toLowerCase().includes('admin') ||
                  (adminUser.name || '').toLowerCase().includes('admin');

  const handleLogout = async () => {
    setShowProfileMenu(false);
    try { await logOutOfFirebase(); } catch (_) {}
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('admin');
    navigate('/login');
  };

  const allModules = useMemo(() => [
    // Real Estate
    { title: 'Property Verification', category: 'Real Estate', path: '/admin/verification', icon: CheckSquare, desc: 'Review & verify submitted property listings', keywords: 'verify property approve listings compliance kyc' },
    { title: 'Builders & Projects', category: 'Real Estate', path: '/admin/builders', icon: Building2, desc: 'Real estate developers and RERA projects', keywords: 'builders rera projects developers housing flats' },
    { title: 'Token Bookings', category: 'Real Estate', path: '/admin/tokens', icon: FileCheck, desc: 'Advance token payments & receipts', keywords: 'tokens payments escrow booking deposit advance' },

    // CRM
    { title: 'Agents & Brokers', category: 'CRM', path: '/admin/agents', icon: UserCheck, desc: 'Agent directory & broker verifications', keywords: 'agents brokers realtors partners approvals' },
    { title: 'Property Enquiries', category: 'CRM', path: '/admin/enquiries', icon: Inbox, desc: 'Property purchase & site visit inquiries', keywords: 'enquiries inquiries visits property leads clients' },
    { title: 'Leads Pipeline', category: 'CRM', path: '/admin/leads', icon: Users, desc: 'Sales CRM pipeline & client follow-ups', keywords: 'leads crm sales deals prospects pipeline' },

    // Overview & Finance
    { title: 'Dashboard Overview', category: 'Overview', path: '/admin', icon: LayoutDashboard, desc: 'System overview & live metrics', keywords: 'dashboard home analytics metrics overview stats' },
    { title: 'Reports & Export', category: 'Finance', path: '/admin/reports', icon: BarChart3, desc: 'Exportable CSV, Excel & performance reports', keywords: 'reports export csv excel analytics download' },
    { title: 'Revenue & Finance', category: 'Finance', path: '/admin/revenue', icon: IndianRupee, desc: 'Platform revenues, token fees & escrow', keywords: 'revenue money finance payments earnings payouts' },

    // Services
    { title: 'Services Hub', category: 'Services', path: '/admin/services', icon: Briefcase, desc: 'Home loans, interior design & legal services', keywords: 'services loans interiors legal assistance hub' },
    { title: 'Service Catalog', category: 'Services', path: '/admin/services-catalog', icon: PackageCheck, desc: 'Service packages, plans & pricing catalog', keywords: 'catalog services plans packages pricing tiers' },
    { title: 'Referral Network', category: 'Services', path: '/admin/references', icon: Gift, desc: 'Partner network & referral commissions', keywords: 'referrals partners network commission rewards' },

    // Communications
    { title: 'System Notifications', category: 'Communications', path: '/admin/notifications', icon: Bell, desc: 'Admin notifications, logs & alert logs', keywords: 'notifications alerts system logs activity' },
    { title: 'Website Enquiries', category: 'Communications', path: '/admin/web-inquiries', icon: MailCheck, desc: 'Contact messages from public website', keywords: 'website inquiries contact form messages emails' },
    { title: 'Push Broadcasts', category: 'Communications', path: '/admin/broadcasts', icon: Radio, desc: 'Send push messages & announcements', keywords: 'broadcasts push messages notifications announcements' },

    // Content
    { title: 'App Banners', category: 'Content', path: '/admin/banners', icon: Layers, desc: 'Home sliders & promotional app banners', keywords: 'banners hero sliders app promotions advertising' },
    { title: 'Market Insights', category: 'Content', path: '/admin/insights', icon: Sparkles, desc: 'Real estate articles, blogs & guides', keywords: 'insights blogs articles posts news editor' },
    { title: 'Help & FAQs', category: 'Content', path: '/admin/faq', icon: Info, desc: 'Frequently asked questions management', keywords: 'faq questions help answers support' },
    { title: 'Client Reviews', category: 'Content', path: '/admin/testimonials', icon: MessageSquareQuote, desc: 'Customer testimonials & rating reviews', keywords: 'testimonials reviews feedback ratings clients' },

    // System
    { title: 'User Accounts', category: 'System', path: '/admin/users', icon: Users, desc: 'Registered clients, agents & admins', keywords: 'users accounts profiles clients customers directory' },
    { title: 'Platform Settings', category: 'System', path: '/admin/settings', icon: Settings, desc: 'Configurations, API keys & preferences', keywords: 'settings platform system configuration options' },
    { title: 'Legal Policies', category: 'System', path: '/admin/legal', icon: FileText, desc: 'Terms of service & privacy policies', keywords: 'legal privacy terms policy compliance' },
    { title: 'About Platform', category: 'System', path: '/admin/about', icon: Info, desc: 'Company mission & platform details', keywords: 'about company gharmb version info' },
    { title: 'Contact Details', category: 'System', path: '/admin/contact', icon: PhoneCall, desc: 'Office address, support phone & email', keywords: 'contact support phone email address' },

    // Actions
    { title: 'Create New Article', category: 'Actions', path: '/admin/insights/new', icon: Plus, desc: 'Write and publish a new market blog post', keywords: 'new create article write publish blog' },
    { title: 'Compose Push Broadcast', category: 'Actions', path: '/admin/broadcasts?tab=compose', icon: Radio, desc: 'Draft and send a live push message', keywords: 'compose broadcast message announcement send' },
    { title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`, category: 'Actions', action: toggleTheme, icon: theme === 'dark' ? Sun : Moon, desc: 'Toggle dashboard appearance', keywords: 'theme light dark mode appearance toggle' },
    { title: 'Sign Out Admin', category: 'Actions', action: handleLogout, icon: LogOut, desc: 'Securely logout from admin console', keywords: 'logout exit signout log off' },
  ], [theme, toggleTheme]);

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return allModules.slice(0, 7);
    }
    return allModules.filter(item => (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.desc && item.desc.toLowerCase().includes(q)) ||
      (item.keywords && item.keywords.toLowerCase().includes(q))
    ));
  }, [allModules, searchQuery]);

  const executeCommand = (item) => {
    setShowSearchResults(false);
    setShowMobileSearch(false);
    setSearchQuery('');
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [showSearchResults, searchQuery]);

  useEffect(() => {
    if (resultsListRef.current) {
      const activeEl = resultsListRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Global keydown: Cmd+K / Ctrl+K and arrow navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (window.innerWidth < 768) {
          setShowMobileSearch(true);
          setShowSearchResults(true);
          setTimeout(() => mobileInputRef.current?.focus(), 50);
        } else {
          setShowSearchResults(true);
          setTimeout(() => searchInputRef.current?.focus(), 50);
        }
        return;
      }

      if (!showSearchResults && !showMobileSearch) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSearchResults(false);
        setShowMobileSearch(false);
        searchInputRef.current?.blur();
        mobileInputRef.current?.blur();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredModules.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + (filteredModules.length || 1)) % (filteredModules.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredModules[selectedIndex]) {
          executeCommand(filteredModules[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearchResults, showMobileSearch, filteredModules, selectedIndex]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
      if (mobileSearchContainerRef.current && !mobileSearchContainerRef.current.contains(e.target)) {
        setShowMobileSearch(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const renderSearchResults = () => (
    <div className="overflow-hidden">
      <div className="px-3.5 py-2 border-b border-[var(--border)]/60 flex items-center justify-between text-[11px] font-semibold text-[var(--text-muted)] bg-[var(--bg-muted)]/30">
        <span>{searchQuery.trim() ? `${filteredModules.length} results` : 'Suggested Pages'}</span>
        {searchQuery.trim() && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              if (window.innerWidth < 768) {
                mobileInputRef.current?.focus();
              } else {
                searchInputRef.current?.focus();
              }
            }}
            className="text-[10px] text-brand hover:underline cursor-pointer font-bold"
          >
            Clear
          </button>
        )}
      </div>

      <div
        ref={resultsListRef}
        className="max-h-80 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar"
      >
        {filteredModules.length === 0 ? (
          <div className="py-7 px-4 text-center">
            <div className="w-8 h-8 mx-auto mb-2 rounded-xl bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)]">
              <Search size={15} />
            </div>
            <div className="text-xs font-semibold text-[var(--text-primary)]">
              No results found
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Try searching for properties, leads, builders, or settings
            </div>
          </div>
        ) : (
          filteredModules.map((item, idx) => {
            const isSelected = selectedIndex === idx;
            const ItemIcon = item.icon;

            return (
              <div
                key={item.title}
                data-selected={isSelected}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => executeCommand(item)}
                className={`w-full px-2.5 py-2 rounded-xl transition-all duration-150 flex items-center justify-between cursor-pointer group ${
                  isSelected
                    ? 'bg-brand/10 text-brand'
                    : 'hover:bg-[var(--bg-muted)] text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-brand text-white shadow-2xs'
                        : 'bg-[var(--bg-muted)] text-[var(--text-muted)] group-hover:text-brand group-hover:bg-brand/10'
                    }`}
                  >
                    <ItemIcon size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold truncate">
                        {item.title}
                      </span>
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-md uppercase tracking-wider shrink-0 ${
                          isSelected
                            ? 'bg-brand/20 text-brand'
                            : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
                        }`}
                      >
                        {item.category}
                      </span>
                    </div>
                    {item.desc && (
                      <p className="text-[10.5px] text-[var(--text-muted)] truncate leading-tight mt-0.5">
                        {item.desc}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

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
      const response = await API.get('/admin/notifications');
      const data = response.data;
      if (data && data.status === 'success') {
        const mapped = (data.data.notifications || []).map(n => ({
          id: n._id,
          title: n.title,
          desc: n.message,
          time: formatTime(n.createdAt),
          createdAt: n.createdAt,
          isRead: n.isRead,
          type: n.type,
          metadata: n.metadata || {}
        }));
        setNotifications(mapped);
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
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

  // Resolve target route and visual metadata for any notification
  const resolveNotificationMeta = (notif) => {
    const meta = notif.metadata || {};
    const title = (notif.title || '').trim();
    const desc = (notif.desc || notif.message || '').trim();
    const fullText = `${title} ${desc}`.toLowerCase();
    const type = (notif.type || '').toLowerCase();

    // Helper to extract double quoted or single quoted name/title (e.g. "isndnn", "fhf")
    const extractQuoted = (str) => {
      if (!str) return '';
      const match = str.match(/"([^"]+)"/) || str.match(/'([^']+)'/);
      return match ? match[1] : '';
    };

    // Helper to extract submission id (#GBM-...)
    const extractSubmissionId = (str) => {
      if (!str) return '';
      const match = str.match(/#?GBM-[\w-]+/i);
      return match ? match[0].replace('#', '') : '';
    };

    // 1. Direct custom link
    if (meta.customLink) {
      return {
        target: meta.customLink,
        pageName: 'Custom Link',
        categoryName: 'Link',
        categoryKey: 'custom',
        actionHint: 'Open Link',
        colorClass: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
        badgeClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        icon: <ExternalLink size={14} className="text-indigo-500" />
      };
    }

    // 2. Token Booking / Rental Token Request
    const isToken =
      type === 'token_request' ||
      type === 'payment' ||
      meta.tokenRequestId ||
      fullText.includes('token') ||
      fullText.includes('rental token') ||
      fullText.includes('escrow') ||
      fullText.includes('token deposit') ||
      fullText.includes('token booking');

    if (isToken) {
      const tokenId = meta.tokenRequestId?._id || meta.tokenRequestId;
      const quoted = extractQuoted(desc) || extractQuoted(title);
      const clientName = meta.clientDetails?.name;
      const clientNameMatch = desc.match(/^([A-Za-z\s]+)\s*\(\+/);
      const matchedName = clientNameMatch ? clientNameMatch[1].trim() : '';

      let query = '';
      if (tokenId && typeof tokenId === 'string') {
        query = `?id=${tokenId}`;
      } else if (quoted) {
        query = `?search=${encodeURIComponent(quoted)}`;
      } else if (clientName) {
        query = `?search=${encodeURIComponent(clientName)}`;
      } else if (matchedName) {
        query = `?search=${encodeURIComponent(matchedName)}`;
      }

      return {
        target: `/admin/tokens${query}`,
        pageName: 'Token Bookings',
        categoryName: 'Rental Token',
        categoryKey: 'token',
        actionHint: 'Open in Token Bookings',
        colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        icon: <Coins size={14} className="text-amber-500" />
      };
    }

    // 3. Agent / Broker Verification
    const isAgent =
      meta.agentId ||
      fullText.includes('agent') ||
      fullText.includes('broker') ||
      (type === 'verification' && (fullText.includes('rera certificate') || fullText.includes('agent')));

    if (isAgent) {
      const agentId = meta.agentId?._id || meta.agentId;
      const quoted = extractQuoted(desc) || extractQuoted(title);
      let query = '';
      if (agentId && typeof agentId === 'string') {
        query = `?agentId=${agentId}`;
      } else if (quoted) {
        query = `?search=${encodeURIComponent(quoted)}`;
      }

      return {
        target: `/admin/agents${query}`,
        pageName: 'Agents & Brokers',
        categoryName: 'Agent KYC',
        categoryKey: 'agent',
        actionHint: 'Open in Agents',
        colorClass: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
        badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
        icon: <UserCheck size={14} className="text-purple-500" />
      };
    }

    // 4. Builder / Project Verification
    const isBuilder =
      meta.projectId ||
      fullText.includes('builder') ||
      fullText.includes('developer') ||
      fullText.includes('rera project');

    if (isBuilder) {
      const quoted = extractQuoted(desc) || extractQuoted(title);
      return {
        target: quoted ? `/admin/builders?search=${encodeURIComponent(quoted)}` : '/admin/builders',
        pageName: 'Builders & Projects',
        categoryName: 'Builder Project',
        categoryKey: 'builder',
        actionHint: 'Open in Builders',
        colorClass: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
        badgeClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        icon: <Layers size={14} className="text-indigo-500" />
      };
    }

    // 5. Property Verification / Listing approval / Live listing
    const isProperty =
      type === 'verification' ||
      type === 'property_status' ||
      meta.propertyId ||
      fullText.includes('property') ||
      fullText.includes('listing') ||
      fullText.includes('commercial space') ||
      fullText.includes('commercial listing');

    if (isProperty) {
      const propId = meta.propertyId?._id || meta.propertyId;
      const submissionId = extractSubmissionId(desc) || extractSubmissionId(title);
      const quoted = extractQuoted(desc) || extractQuoted(title);

      let query = '';
      if (propId && typeof propId === 'string') {
        query = `?id=${propId}`;
      } else if (submissionId) {
        query = `?search=${encodeURIComponent(submissionId)}`;
      } else if (quoted) {
        query = `?search=${encodeURIComponent(quoted)}`;
      }

      return {
        target: `/admin/verification${query}`,
        pageName: 'Property Verification',
        categoryName: 'Listing',
        categoryKey: 'property',
        actionHint: 'Open in Verification',
        colorClass: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
        icon: <Building2 size={14} className="text-blue-500" />
      };
    }

    // 6. Site Visit Booking
    const isVisit =
      type === 'visit_booking' ||
      meta.visitRequestId ||
      fullText.includes('visit') ||
      fullText.includes('schedule');

    if (isVisit) {
      const clientName = meta.clientDetails?.name || extractQuoted(desc);
      const query = clientName ? `?tab=visit&search=${encodeURIComponent(clientName)}` : `?tab=visit`;
      return {
        target: `/admin/enquiries${query}`,
        pageName: 'Site Visits',
        categoryName: 'Site Visit',
        categoryKey: 'visit',
        actionHint: 'Open in Enquiries',
        colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        icon: <Calendar size={14} className="text-emerald-500" />
      };
    }

    // 7. Client Enquiry
    const isEnquiry =
      type === 'enquiry' ||
      meta.enquiryId ||
      fullText.includes('enquiry') ||
      fullText.includes('inquiry') ||
      fullText.includes('lead');

    if (isEnquiry) {
      const clientName = meta.clientDetails?.name || extractQuoted(desc);
      const query = clientName ? `?tab=property&search=${encodeURIComponent(clientName)}` : `?tab=property`;
      return {
        target: `/admin/enquiries${query}`,
        pageName: 'Enquiries',
        categoryName: 'Enquiry',
        categoryKey: 'enquiry',
        actionHint: 'Open in Enquiries',
        colorClass: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
        badgeClass: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
        icon: <MessageSquare size={14} className="text-sky-500" />
      };
    }

    // 8. Services Hub
    const isService =
      type === 'service_enquiry' ||
      meta.serviceRequestId ||
      fullText.includes('service');

    if (isService) {
      return {
        target: `/admin/services`,
        pageName: 'Services Hub',
        categoryName: 'Services',
        categoryKey: 'service',
        actionHint: 'Open in Services',
        colorClass: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
        badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        icon: <Briefcase size={14} className="text-rose-500" />
      };
    }

    // 9. Users
    const isUser = type === 'user' || fullText.includes('user account') || fullText.includes('registered user');
    if (isUser) {
      return {
        target: `/admin/users`,
        pageName: 'User Accounts',
        categoryName: 'Users',
        categoryKey: 'user',
        actionHint: 'Open in Users',
        colorClass: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
        badgeClass: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
        icon: <User size={14} className="text-teal-500" />
      };
    }

    // Fallback to system notifications
    return {
      target: `/admin/notifications${notif.id ? `?id=${notif.id}` : ''}`,
      pageName: 'Alerts & Logs',
      categoryName: 'Alert',
      categoryKey: 'system',
      actionHint: 'View in Logs',
      colorClass: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
      badgeClass: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
      icon: <Bell size={14} className="text-slate-500" />
    };
  };

  const handleNotifClick = async (notif) => {
    setShowNotifications(false);
    const meta = resolveNotificationMeta(notif);

    if (!notif.isRead) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      try {
        API.patch(`/admin/notifications/${notif.id}/read`, { isRead: true }).catch(() => {});
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }

    if (meta.target) {
      navigate(meta.target);
    }
  };

  const handleClearNotifs = async (e) => {
    if (e) e.stopPropagation();
    try {
      await API.post('/admin/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const displayName = (adminUser.name && adminUser.name.toLowerCase() !== 'angel')
    ? adminUser.name.split(' ')[0]
    : 'Admin';

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-[68px] px-4 md:px-6 bg-white/90 dark:bg-[#141916]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-white/5 shrink-0 relative transition-colors duration-200">
        <div className="flex items-center gap-3 shrink-0">
          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="w-10 h-10 rounded-full bg-white dark:bg-[#1a211c] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white md:hidden transition-all duration-200 active:scale-95 shrink-0 cursor-pointer flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.02)]"
            title="Open navigation"
          >
            <Menu size={18} />
          </button>

          {/* Page Name */}
          <div className="flex items-center shrink-0">
            <h1 className="text-base sm:text-lg font-black text-[#133527] dark:text-white tracking-tight whitespace-nowrap">
              {pageTitle}
            </h1>
          </div>

          {/* Quick Navigation Hub Pills */}
          <div className="hidden 2xl:flex items-center gap-1 p-1 bg-white dark:bg-[#1a211c] rounded-full border border-slate-200/80 dark:border-white/10 shadow-[0_2px_6px_rgba(0,0,0,0.02)] ml-2">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                location.pathname === '/admin'
                  ? 'bg-[#133527] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/enquiries')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                location.pathname.startsWith('/admin/enquiries')
                  ? 'bg-[#133527] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              Enquiries
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/verification')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                location.pathname.startsWith('/admin/verification')
                  ? 'bg-[#133527] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              Properties
            </button>
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Desktop Pill Search Bar with Attached Dropdown */}
          <div ref={searchContainerRef} className="relative hidden md:block">
            <div
              className={`flex items-center h-10 w-44 lg:w-56 xl:w-68 bg-white dark:bg-[#1a211c] border rounded-full px-3.5 text-xs transition-all duration-200 shadow-[0_2px_6px_rgba(0,0,0,0.02)] ${
                showSearchResults
                  ? 'border-[#133527] dark:border-emerald-500 ring-2 ring-[#133527]/15 dark:ring-emerald-500/20'
                  : 'border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
              }`}
            >
              <Search
                size={14}
                className="shrink-0 text-slate-400 dark:text-slate-500"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!showSearchResults) setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Search anything..."
                className="w-full bg-transparent px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Dropdown directly under the search bar */}
            {showSearchResults && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-[360px] sm:w-[420px] max-w-[calc(100vw-48px)] bg-white dark:bg-[#1a211c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden animate-slide-down origin-top">
                {renderSearchResults()}
              </div>
            )}
          </div>

          {/* Mobile Search Trigger Icon */}
          <button
            type="button"
            onClick={() => {
              setShowMobileSearch(true);
              setShowSearchResults(true);
              setTimeout(() => mobileInputRef.current?.focus(), 50);
            }}
            className="flex md:hidden w-10 h-10 rounded-full bg-white dark:bg-[#1a211c] border border-slate-200/80 dark:border-white/10 items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-[0_2px_6px_rgba(0,0,0,0.02)] transition-all cursor-pointer"
            title="Search"
          >
            <Search size={16} />
          </button>

          {/* Mobile In-Header Search Bar Overlay with Attached Dropdown */}
          {showMobileSearch && (
            <div
              ref={mobileSearchContainerRef}
              className="absolute inset-x-3 top-3 bottom-3 z-40 bg-white dark:bg-[#1a211c] border border-slate-200 dark:border-white/10 rounded-full flex items-center px-4 gap-2 md:hidden shadow-lg animate-in fade-in duration-150"
            >
              <Search size={15} className="text-slate-400 shrink-0" />
              <input
                ref={mobileInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anything..."
                className="w-full bg-transparent text-xs font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setShowMobileSearch(false);
                  setShowSearchResults(false);
                  setSearchQuery('');
                }}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full cursor-pointer shrink-0"
                title="Close search"
              >
                <X size={15} />
              </button>

              {/* Dropdown directly under mobile search bar */}
              <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white dark:bg-[#1a211c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden animate-slide-down origin-top">
                {renderSearchResults()}
              </div>
            </div>
          )}

          {/* ── Notification Bell Button with Dark Round Badge (Matching Image 1) ── */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className={`w-10 h-10 rounded-full bg-white dark:bg-[#1a211c] border border-slate-200/80 dark:border-white/10 shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-[#133527] dark:hover:text-emerald-400 hover:shadow-md transition-all active:scale-95 cursor-pointer relative group ${
                showNotifications ? 'ring-2 ring-[#133527]/20 border-[#133527] dark:border-emerald-500' : ''
              }`}
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={17} strokeWidth={2} className="transition-transform group-hover:animate-bell-ring" />
              {/* Solid dark round badge matching Image 1 */}
              <span className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 rounded-full bg-[#133527] dark:bg-emerald-600 text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-[#141916]">
                {unreadNotificationsCount > 0 ? unreadNotificationsCount : 1}
              </span>
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)}></div>
                <div className="absolute right-0 mt-2.5 w-80 sm:w-88 bg-white dark:bg-[#1a211c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-20 overflow-hidden animate-slide-down origin-top-right">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/70 dark:bg-white/5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-800 dark:text-white">Alerts & Logs</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#133527] text-white">
                        {unreadNotificationsCount || 1} new
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadNotificationsCount > 0 && (
                        <button onClick={handleClearNotifs} className="text-[10px] font-bold text-[#133527] dark:text-emerald-400 hover:underline cursor-pointer">
                          Clear All
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/admin/notifications');
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center"
                        title="View all notifications"
                      >
                        <ExternalLink size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-84 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-7 text-center">
                        <div className="w-9 h-9 mx-auto mb-2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <CheckCheck size={18} />
                        </div>
                        <div className="text-xs font-bold text-slate-800 dark:text-white">All caught up!</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">No notifications pending.</div>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const meta = resolveNotificationMeta(notif);
                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleNotifClick(notif)}
                            className={`p-3.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer flex gap-3 ${
                              notif.isRead ? 'opacity-60' : 'bg-emerald-50/20 dark:bg-emerald-950/10'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${meta.colorClass}`}>
                              {meta.icon}
                            </div>
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <div className="flex justify-between items-baseline gap-1">
                                <p className={`text-[11.5px] text-slate-800 dark:text-slate-100 leading-tight truncate ${notif.isRead ? 'font-medium' : 'font-extrabold'}`}>
                                  {notif.title}
                                </p>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold shrink-0">{notif.time}</span>
                              </div>
                              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">{notif.desc}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Theme Toggle Circular Button ── */}
          <button
            type="button"
            onClick={(e) => toggleTheme(e)}
            className="w-10 h-10 rounded-full bg-white dark:bg-[#1a211c] border border-slate-200/80 dark:border-white/10 shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex items-center justify-center text-slate-700 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 hover:shadow-md transition-all active:scale-95 cursor-pointer group"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle dark/light theme"
          >
            {theme === 'dark' ? (
              <Sun size={17} strokeWidth={2} className="transition-transform duration-300 group-hover:rotate-45" />
            ) : (
              <Moon size={17} strokeWidth={2} className="transition-transform duration-300 group-hover:-rotate-12" />
            )}
          </button>

          {/* ── Fullscreen Toggle Circular Button ── */}
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
            className="w-10 h-10 rounded-full bg-white dark:bg-[#1a211c] border border-slate-200/80 dark:border-white/10 shadow-[0_2px_6px_rgba(0,0,0,0.02)] hidden lg:flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#133527] dark:hover:text-white hover:shadow-md transition-all active:scale-95 cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <ScanLine size={16} strokeWidth={2} /> : <Scan size={16} strokeWidth={2} />}
          </button>

          {/* ── User Profile Avatar Icon Button (Minimal simple clean icon design) ── */}
          <div className="relative ml-0.5 sm:ml-1" ref={profileRef}>
            <button
              type="button"
              id="profile-menu-trigger"
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer select-none border ${
                showProfileMenu
                  ? 'bg-[#133527]/10 dark:bg-emerald-500/15 border-[#133527]/30 dark:border-emerald-500/30 text-[#133527] dark:text-emerald-400 ring-2 ring-[#133527]/20 dark:ring-emerald-500/20 shadow-sm'
                  : 'bg-white dark:bg-[#1a211c] border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-[#133527] dark:hover:text-emerald-400 hover:border-slate-300 dark:hover:border-white/20 shadow-[0_2px_6px_rgba(0,0,0,0.02)] hover:shadow-md'
              } active:scale-95 group`}
              title="Admin profile menu"
              aria-label="Admin profile menu"
            >
              <User size={18} strokeWidth={2} className="transition-transform duration-200 group-hover:scale-105" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#141916]" />
            </button>

            {/* Profile Dropdown Panel */}
            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute right-0 mt-2.5 w-68 bg-white dark:bg-[#1a211c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-20 overflow-hidden animate-slide-down origin-top-right">
                  {/* User Profile Header */}
                  <div className="p-4 bg-slate-50/70 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-[#133527]/10 dark:bg-emerald-500/15 border border-[#133527]/20 dark:border-emerald-500/25 flex items-center justify-center text-[#133527] dark:text-emerald-400 shadow-xs">
                          <User size={18} strokeWidth={2} />
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#141916]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-800 dark:text-white truncate leading-tight">
                            {displayName}
                          </p>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {adminUser.email || 'admin@gharmb.com'}
                        </p>
                      </div>
                    </div>

                    {/* Status info strip */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">Role</span>
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/10 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-white/10 uppercase">
                        <ShieldCheck size={11} className="text-[#133527] dark:text-emerald-400" />
                        {adminUser.role || 'Admin'}
                      </span>
                    </div>
                  </div>

                  {/* Navigation Actions - Platform Settings only */}
                  <div className="p-2">
                    <button
                      type="button"
                      id="profile-menu-settings"
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/admin/settings');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                    >
                      <Settings size={14} className="text-slate-400" />
                      <span>Platform Settings</span>
                    </button>
                  </div>

                  {/* Logout Action */}
                  <div className="p-2 border-t border-slate-100 dark:border-white/5">
                    <button
                      type="button"
                      id="profile-menu-logout"
                      onClick={handleLogout}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all duration-150 cursor-pointer group/logout"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-rose-500/10 group-hover/logout:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors">
                          <LogOut size={13} strokeWidth={2.2} />
                        </div>
                        <span>Log Out</span>
                      </div>
                      <span className="text-[10px] text-slate-400 group-hover/logout:text-rose-500/80 font-normal">
                        End session
                      </span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
