/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContexts';
import API from '../../api/api';
import {
  LayoutDashboard,
  BarChart3,
  IndianRupee,
  Building2,
  Users,
  Inbox,
  MailCheck,
  UserCheck,
  Briefcase,
  PackageCheck,
  Gift,
  Sparkles,
  Layers,
  MessageSquareQuote,
  HelpCircle,
  Bell,
  Radio,
  Settings,
  FileText,
  Info,
  PhoneCall,
  ChevronLeft,
  X,
  Coins,
  TrendingUp,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

const Sidebar = ({
  isOpen = false,
  toggleSidebar,
  isCollapsed,
  setIsCollapsed,
  collapsed,
  setCollapsed,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();

  // Collapsed state support
  const collapsedState = isCollapsed !== undefined ? isCollapsed : (collapsed !== undefined ? collapsed : false);
  const toggleCollapse = useCallback(() => {
    if (setIsCollapsed) setIsCollapsed(!collapsedState);
    else if (setCollapsed) setCollapsed(!collapsedState);
  }, [collapsedState, setIsCollapsed, setCollapsed]);

  // ── Real-Time Live Dynamic Badge Counts ──────────────────────────────────
  const [badgeCounts, setBadgeCounts] = useState({
    pendingVerifications: 0,
    pendingAgents: 0,
    unreadNotifications: 0,
    pendingEnquiries: 0,
    newWebInquiries: 0,
    pendingTokens: 0,
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState('Just now');
  const lastSyncTimestampRef = useRef(0);
  const isFetchingRef = useRef(false);

  // Floating tooltip for collapsed view
  const [hoveredTooltip, setHoveredTooltip] = useState(null);


  // ── Core Real-Time Data Sync Fetcher ──────────────────────────────────────
  const fetchRealtimeBadgeCounts = useCallback(async (manual = false) => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (manual) setIsSyncing(true);

    try {
      const [
        pendingAgentsRes,
        notificationsRes,
        enquiriesRes,
        statsRes,
        webInquiriesRes,
        tokensRes,
      ] = await Promise.allSettled([
        API.get('/admin/users/pending-agents'),
        API.get('/admin/notifications'),
        API.get('/admin/dashboard/enquiries'),
        API.get('/admin/dashboard/stats'),
        API.get('/admin/web-inquiries/stats'),
        API.get('/admin/tokens'),
      ]);

      let pendingAgents = 0;
      let unreadNotifications = 0;
      let pendingEnquiries = 0;
      let pendingVerifications = 0;
      let newWebInquiries = 0;
      let pendingTokens = 0;

      if (pendingAgentsRes.status === 'fulfilled' && pendingAgentsRes.value?.data?.status === 'success') {
        const d = pendingAgentsRes.value.data;
        pendingAgents = d.results || d.data?.agents?.length || 0;
      }

      if (notificationsRes.status === 'fulfilled' && notificationsRes.value?.data?.status === 'success') {
        const d = notificationsRes.value.data;
        unreadNotifications = d.counts?.unread || 0;
      }

      if (enquiriesRes.status === 'fulfilled' && enquiriesRes.value?.data?.status === 'success' && enquiriesRes.value.data.data) {
        const d = enquiriesRes.value.data.data;
        const pCount = (d.propertyEnquiries || []).filter(e =>
          ['pending', 'new', 'open'].includes((e.status || '').toLowerCase())
        ).length;
        const dCount = (d.developerEnquiries || []).filter(e =>
          ['pending', 'new', 'open'].includes((e.status || '').toLowerCase())
        ).length;
        const vCount = (d.visitRequests || []).filter(e =>
          ['pending', 'new', 'open'].includes((e.status || '').toLowerCase())
        ).length;
        pendingEnquiries = pCount + dCount + vCount;
      }

      if (statsRes.status === 'fulfilled' && statsRes.value?.data?.status === 'success' && statsRes.value.data.data?.stats) {
        pendingVerifications = statsRes.value.data.data.stats.pendingProperties || 0;
      }

      if (webInquiriesRes.status === 'fulfilled' && webInquiriesRes.value?.data?.status === 'success' && webInquiriesRes.value.data.data?.stats) {
        newWebInquiries = webInquiriesRes.value.data.data.stats.newInquiries || 0;
      }

      if (tokensRes.status === 'fulfilled' && tokensRes.value?.data?.status === 'success' && tokensRes.value.data.data) {
        const stats = tokensRes.value.data.data.stats;
        pendingTokens = stats?.pendingCount || 0;
      }

      setBadgeCounts(prev => {
        if (
          prev.pendingAgents === pendingAgents &&
          prev.unreadNotifications === unreadNotifications &&
          prev.pendingEnquiries === pendingEnquiries &&
          prev.pendingVerifications === pendingVerifications &&
          prev.newWebInquiries === newWebInquiries &&
          prev.pendingTokens === pendingTokens
        ) {
          return prev;
        }
        return {
          pendingAgents,
          unreadNotifications,
          pendingEnquiries,
          pendingVerifications,
          newWebInquiries,
          pendingTokens,
        };
      });

      lastSyncTimestampRef.current = Date.now();
      setLastSyncedTime('Just now');
    } catch {
      // Silent error catching to ensure UI resilience
    } finally {
      isFetchingRef.current = false;
      if (manual) {
        setTimeout(() => setIsSyncing(false), 500);
      }
    }
  }, []);

  useEffect(() => {
    fetchRealtimeBadgeCounts();
    const intervalTimer = setInterval(() => {
      if (!document.hidden) {
        fetchRealtimeBadgeCounts();
      }
    }, 30000);

    const clockTimer = setInterval(() => {
      const diffSec = Math.floor((Date.now() - lastSyncTimestampRef.current) / 1000);
      if (diffSec < 30) setLastSyncedTime('Just now');
      else if (diffSec < 60) setLastSyncedTime('30s ago');
      else {
        const mins = Math.floor(diffSec / 60);
        setLastSyncedTime(`${mins}m ago`);
      }
    }, 15000);

    return () => {
      clearInterval(intervalTimer);
      clearInterval(clockTimer);
    };
  }, [fetchRealtimeBadgeCounts]);

  useEffect(() => {
    const handleSyncEvent = () => fetchRealtimeBadgeCounts();
    window.addEventListener('admin-data-sync', handleSyncEvent);
    window.addEventListener('admin-notifications-updated', handleSyncEvent);
    window.addEventListener('focus', handleSyncEvent);
    window.addEventListener('storage', handleSyncEvent);

    return () => {
      window.removeEventListener('admin-data-sync', handleSyncEvent);
      window.removeEventListener('admin-notifications-updated', handleSyncEvent);
      window.removeEventListener('focus', handleSyncEvent);
      window.removeEventListener('storage', handleSyncEvent);
    };
  }, [fetchRealtimeBadgeCounts]);



  // ── Complete Uncollapsed Navigation Hierarchy (Short, Simple, Clean Titles) ──
  const navGroups = useMemo(() => [
    {
      id: 'overview',
      group: 'Overview',
      items: [
        {
          name: 'Dashboard',
          path: '/admin',
          icon: LayoutDashboard,
          hint: 'Platform KPIs & Summary',
          aliases: ['dashboard', 'home', 'kpi', 'stats', 'analytics', 'overview'],
        },
        {
          name: 'Revenue',
          path: '/admin/revenue',
          icon: IndianRupee,
          hint: 'Earnings, Tokens & Escrow',
          aliases: ['revenue', 'finance', 'money', 'earnings', 'payments', 'escrow', 'wallet'],
        },
        {
          name: 'Reports',
          path: '/admin/reports',
          icon: BarChart3,
          hint: 'Export CSV & Excel Data',
          aliases: ['reports', 'export', 'csv', 'excel', 'download', 'audit', 'performance'],
        },
      ],
    },
    {
      id: 'properties',
      group: 'Properties',
      items: [
        {
          name: 'Approvals',
          path: '/admin/verification',
          icon: ShieldCheck,
          hint: 'Review & Verify Listings',
          badge: badgeCounts.pendingVerifications > 0 ? String(badgeCounts.pendingVerifications) : null,
          badgeColor: 'bg-amber-500 text-white',
          aliases: ['approvals', 'verification', 'property verification', 'approve property', 'kyc', 'listings', 'verify', 'compliance'],
        },
        {
          name: 'Builders',
          path: '/admin/builders',
          icon: Building2,
          hint: 'Developers & RERA Projects',
          aliases: ['builders', 'projects', 'developers', 'rera', 'apartments', 'towers', 'housing'],
        },
        {
          name: 'Tokens',
          path: '/admin/tokens',
          icon: Coins,
          hint: 'Token Deposits & Receipts',
          badge: badgeCounts.pendingTokens > 0 ? String(badgeCounts.pendingTokens) : null,
          badgeColor: 'bg-emerald-600 text-white',
          aliases: ['tokens', 'token booking', 'advance payment', 'deposit', 'booking token', 'rental token'],
        },
      ],
    },
    {
      id: 'crm',
      group: 'CRM & Leads',
      items: [
        {
          name: 'Enquiries',
          path: '/admin/enquiries',
          icon: Inbox,
          hint: 'Property Leads & Site Visits',
          badge: badgeCounts.pendingEnquiries > 0 ? String(badgeCounts.pendingEnquiries) : null,
          badgeColor: 'bg-rose-500 text-white',
          aliases: ['enquiries', 'inquiries', 'property enquiries', 'site visits', 'visits', 'client interest', 'leads'],
        },
        {
          name: 'Leads',
          path: '/admin/leads',
          icon: TrendingUp,
          hint: 'Sales Pipeline & Follow-ups',
          aliases: ['leads', 'leads pipeline', 'crm', 'sales', 'deals', 'buyer needs', 'follow ups'],
        },
        {
          name: 'Web Forms',
          path: '/admin/web-inquiries',
          icon: MailCheck,
          hint: 'Public Contact & Requests',
          badge: badgeCounts.newWebInquiries > 0 ? String(badgeCounts.newWebInquiries) : null,
          badgeColor: 'bg-blue-600 text-white',
          aliases: ['web forms', 'web inquiries', 'website enquiries', 'contact form', 'deletion requests', 'messages', 'inbox'],
        },
        {
          name: 'Agents',
          path: '/admin/agents',
          icon: UserCheck,
          hint: 'Agent Directory & KYC',
          badge: badgeCounts.pendingAgents > 0 ? String(badgeCounts.pendingAgents) : null,
          badgeColor: 'bg-purple-600 text-white',
          aliases: ['agents', 'brokers', 'agent verification', 'realtors', 'partners', 'channel partners'],
        },
        {
          name: 'Users',
          path: '/admin/users',
          icon: Users,
          hint: 'Buyers, Owners & Admins',
          aliases: ['users', 'registered users', 'user accounts', 'clients', 'owners', 'tenants', 'accounts', 'customers'],
        },
      ],
    },
    {
      id: 'services',
      group: 'Services',
      items: [
        {
          name: 'Services',
          path: '/admin/services',
          icon: Briefcase,
          hint: 'Loans, Interiors & Legal',
          aliases: ['services', 'home services', 'services hub', 'home loans', 'interior design', 'movers', 'packers', 'legal assistance'],
        },
        {
          name: 'Plans',
          path: '/admin/services-catalog',
          icon: PackageCheck,
          hint: 'Package Catalog & Pricing',
          aliases: ['plans', 'pricing', 'service plans', 'service catalog', 'services-catalog', 'packages', 'vendors', 'offerings'],
        },
        {
          name: 'Referrals',
          path: '/admin/references',
          icon: Gift,
          hint: 'Referral Deals & Payouts',
          aliases: ['referrals', 'references', 'referral network', 'refer & earn', 'rewards', 'commissions', 'payouts'],
        },
      ],
    },
    {
      id: 'content',
      group: 'Content',
      items: [
        {
          name: 'Banners',
          path: '/admin/banners',
          icon: Layers,
          hint: 'Hero Promotions & Ads',
          aliases: ['banners', 'app banners', 'sliders', 'promotions', 'hero slider', 'advertisements'],
        },
        {
          name: 'Insights',
          path: '/admin/insights',
          icon: Sparkles,
          hint: 'Articles, News & Editor',
          aliases: ['insights', 'market insights', 'blogs', 'articles', 'news', 'editor', 'posts'],
        },
        {
          name: 'Reviews',
          path: '/admin/testimonials',
          icon: MessageSquareQuote,
          hint: 'Client Feedback & Ratings',
          aliases: ['reviews', 'testimonials', 'ratings', 'feedback', 'client reviews', 'comments'],
        },
        {
          name: 'FAQs',
          path: '/admin/faq',
          icon: HelpCircle,
          hint: 'Frequently Asked Questions',
          aliases: ['faq', 'faqs', 'help', 'questions', 'support', 'help center', 'knowledge base'],
        },
      ],
    },
    {
      id: 'system',
      group: 'System',
      items: [
        {
          name: 'Notifications',
          path: '/admin/notifications',
          icon: Bell,
          hint: 'Admin Alerts & Audit Trail',
          badge: badgeCounts.unreadNotifications > 0 ? String(badgeCounts.unreadNotifications) : null,
          badgeColor: 'bg-rose-600 text-white',
          aliases: ['notifications', 'alerts', 'system alerts', 'logs', 'audit', 'activity'],
        },
        {
          name: 'Broadcasts',
          path: '/admin/broadcasts',
          icon: Radio,
          hint: 'Broadcast Live Mobile Push',
          aliases: ['broadcasts', 'push broadcasts', 'push notifications', 'announcements', 'broadcast message'],
        },
        {
          name: 'Settings',
          path: '/admin/settings',
          icon: Settings,
          hint: 'API Keys & System Config',
          aliases: ['settings', 'platform settings', 'configuration', 'api keys', 'preferences', 'security'],
        },
        {
          name: 'Legal',
          path: '/admin/legal',
          icon: FileText,
          hint: 'Legal Terms & Policies',
          aliases: ['legal', 'terms', 'privacy policy', 'terms of service', 'disclaimer'],
        },
        {
          name: 'About',
          path: '/admin/about',
          icon: Info,
          hint: 'Company Info & Version',
          aliases: ['about', 'about platform', 'company', 'gharmb info', 'version'],
        },
        {
          name: 'Contact',
          path: '/admin/contact',
          icon: PhoneCall,
          hint: 'Support Phone & Address',
          aliases: ['contact', 'contact details', 'office', 'phone', 'email', 'support address', 'help desk'],
        },
      ],
    },
  ], [badgeCounts]);

  return (
    <>
      {/* ── Sidebar Container with Clean White Aesthetic ────────────────── */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen select-none flex flex-col transition-[width,transform] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-[width] bg-white dark:bg-[#141916] border-r border-slate-200/80 dark:border-[#222a24] shadow-[1px_0_12px_rgba(0,0,0,0.02)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${collapsedState ? 'w-[200px] md:w-[68px]' : 'w-[200px]'}`}
      >
        {/* ── Desktop Edge Collapse Toggle ── */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="hidden md:flex absolute top-5 -right-3.5 w-7 h-7 bg-white dark:bg-[#1f2621] border border-slate-200/80 dark:border-[#2b382f] text-slate-500 hover:text-[#133527] dark:hover:text-emerald-400 rounded-full items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer z-50 group"
          title={collapsedState ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          aria-label="Toggle sidebar collapse"
        >
          <ChevronLeft
            size={14}
            strokeWidth={2.5}
            className={`transition-transform duration-300 ${
              collapsedState ? 'rotate-180 text-[#133527] dark:text-emerald-400' : 'rotate-0'
            }`}
          />
        </button>

        {/* ── Brand Header ── */}
        <div className={`flex items-center ${collapsedState ? 'justify-center px-0' : 'justify-between px-3.5'} border-b border-slate-200/80 dark:border-white/5 shrink-0 h-[64px] overflow-hidden`}>
          <div
            onClick={() => navigate('/admin')}
            className={`flex items-center ${collapsedState ? 'justify-center w-full' : 'gap-2.5'} overflow-hidden cursor-pointer group min-w-0`}
          >
            {/* Clean Brand Logo */}
            <div className="relative flex items-center justify-center w-[36px] h-[36px] shrink-0 transition-transform duration-200 group-hover:scale-105">
              <img
                src={isDark ? '/logo-icon-dark.png' : '/logo-icon.png'}
                alt="GHARMB Logo"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Brand Title (hidden when collapsed) */}
            {!collapsedState && (
              <div className="flex flex-col whitespace-nowrap overflow-hidden max-w-[145px]">
                <span className="font-black text-sm text-[#133527] dark:text-white tracking-tight leading-tight">
                  GHARMB
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-tight leading-tight">
                  Real Estate Console
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          {!collapsedState && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 text-slate-500 hover:text-slate-800 md:hidden rounded-xl cursor-pointer"
              title="Close navigation"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* ── Main Scrollable Navigation Area ── */}
        <nav className={`flex-1 py-3 overflow-y-auto overflow-x-hidden sidebar-scrollbar ${collapsedState ? 'px-0 space-y-2' : 'px-2 space-y-3'}`}>
          {navGroups.map((group, groupIdx) => (
            <div key={group.id} className={collapsedState ? 'space-y-1.5' : 'space-y-0.5'}>
              {/* Category Header Label (Expanded only) */}
              {!collapsedState && (
                <div className="max-h-7 opacity-100 px-1.5 pt-1 pb-0.5">
                  <div className="flex items-center select-none">
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
                      {group.group}
                    </span>
                    <span className="h-[1px] flex-1 bg-slate-200/80 dark:bg-white/5 ml-2" />
                  </div>
                </div>
              )}

              {/* Collapsed Mode Divider */}
              {collapsedState && groupIdx > 0 && (
                <div className="my-2 mx-auto w-6 border-t border-slate-200/80 dark:border-white/10" />
              )}

              {/* Menu Items */}
              <div className={collapsedState ? 'space-y-1.5 flex flex-col items-center' : 'space-y-0.5'}>
                {group.items.map((item) => {
                  const Icon = item.icon;

                  if (collapsedState) {
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/admin'}
                        onClick={() => {
                          if (window.innerWidth < 768 && toggleSidebar) toggleSidebar();
                        }}
                        onMouseEnter={(e) => {
                          if (window.innerWidth < 768) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredTooltip({
                            name: item.name,
                            group: group.group,
                            hint: item.hint,
                            badge: item.badge,
                            badgeColor: item.badgeColor,
                            top: rect.top + rect.height / 2,
                          });
                        }}
                        onMouseLeave={() => setHoveredTooltip(null)}
                        className={({ isActive }) =>
                          `relative flex items-center justify-center w-9 h-9 mx-auto rounded-full transition-all duration-200 cursor-pointer ${
                            isActive
                              ? 'bg-[#133527] dark:bg-emerald-600 text-white shadow-sm scale-105'
                              : 'bg-slate-50 dark:bg-[#1f2621] text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-white/10 shadow-2xs hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/5 dark:hover:text-white hover:scale-105 hover:shadow-xs'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon size={16} strokeWidth={isActive ? 2.2 : 1.9} />
                            {item.badge && (
                              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#141916]" />
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  }

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/admin'}
                      onClick={() => {
                        if (window.innerWidth < 768 && toggleSidebar) toggleSidebar();
                      }}
                      className={({ isActive }) =>
                        `group relative flex items-center justify-between w-full rounded-xl transition-all duration-150 cursor-pointer h-[36px] px-2.5 ${
                          isActive
                            ? 'bg-slate-100/90 dark:bg-white/10 shadow-xs border border-slate-200/90 dark:border-white/10'
                            : 'hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {/* Left: Icon container + Name */}
                          <div className="flex items-center min-w-0 flex-1 pr-1.5">
                            <div
                              className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center transition-all duration-150 ${
                                isActive
                                  ? 'bg-[#133527] dark:bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                              }`}
                            >
                              <Icon size={15} strokeWidth={isActive ? 2.2 : 1.9} />
                            </div>

                            <div className="min-w-0 flex items-center whitespace-nowrap overflow-hidden ml-2 flex-1">
                              <span
                                className={`truncate tracking-tight text-[11.5px] ${
                                  isActive
                                    ? 'font-bold text-[#133527] dark:text-emerald-400'
                                    : 'font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors'
                                }`}
                              >
                                {item.name}
                              </span>
                            </div>
                          </div>

                          {/* Right: Badge */}
                          {item.badge && (
                            <span
                              className={`ml-auto shrink-0 min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full text-[9.5px] font-bold tabular-nums leading-none ${
                                item.badgeColor || 'bg-[#133527] text-white'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

      </aside>

      {/* ── Fixed Floating Tooltip Portal for Collapsed Mode ── */}
      <AnimatePresence>
        {hoveredTooltip && collapsedState && (
          <motion.div
            initial={{ opacity: 0, x: -8, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ top: `${hoveredTooltip.top}px` }}
            className="hidden md:flex fixed left-[76px] -translate-y-1/2 flex-col gap-1 bg-white/98 dark:bg-[#18201b]/98 text-slate-800 dark:text-slate-100 py-2.5 px-3.5 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-[#2b382f] whitespace-nowrap z-50 pointer-events-none min-w-[160px] backdrop-blur-2xl"
          >
            <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 bg-white dark:bg-[#18201b] border-l border-b border-slate-200/80 dark:border-[#2b382f]" />

            <div className="flex items-center justify-between gap-3">
              <span className="text-[12.5px] font-bold">
                {hoveredTooltip.name}
              </span>
              {hoveredTooltip.badge && (
                <span className="text-[9.5px] font-black px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
                  {hoveredTooltip.badge}
                </span>
              )}
            </div>

            {hoveredTooltip.hint && (
              <span className="text-[10.5px] text-slate-400 font-medium">
                {hoveredTooltip.hint}
              </span>
            )}

            <div className="pt-1 mt-0.5 border-t border-slate-100 dark:border-white/5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
              {hoveredTooltip.group}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
