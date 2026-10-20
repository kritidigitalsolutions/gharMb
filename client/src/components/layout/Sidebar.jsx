import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContexts';
import API from '../../api/api';
import {
  LayoutDashboard,
  BarChart3,
  IndianRupee,
  CheckSquare,
  Building2,
  FileCheck,
  Users,
  Inbox,
  MailCheck,
  UserCheck,
  User,
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
  Search,
  X,
} from 'lucide-react';

const Sidebar = ({
  isOpen,
  toggleSidebar,
  isCollapsed,
  setIsCollapsed,
  collapsed,
  setCollapsed
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();

  const collapsedState = isCollapsed !== undefined ? isCollapsed : (collapsed !== undefined ? collapsed : false);
  const toggleCollapse = useCallback(() => {
    if (setIsCollapsed) setIsCollapsed(!collapsedState);
    else if (setCollapsed) setCollapsed(!collapsedState);
  }, [collapsedState, setIsCollapsed, setCollapsed]);

  // Dynamic live badges
  const [pendingVerificationCount, setPendingVerificationCount] = useState(0);
  const [pendingAgentsCount, setPendingAgentsCount] = useState(0);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [pendingEnquiriesCount, setPendingEnquiriesCount] = useState(0);

  // In-sidebar search query
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // Floating tooltip state for collapsed desktop view
  const [hoveredTooltip, setHoveredTooltip] = useState(null);

  // Fetch dynamic badge counts
  useEffect(() => {
    let isMounted = true;
    const fetchBadgeCounts = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        // 1. Pending agents
        API.get('/admin/users/pending-agents')
          .then(res => {
            if (!isMounted) return;
            const data = res.data;
            if (data?.status === 'success') {
              setPendingAgentsCount(data.results || data.data?.agents?.length || 0);
            }
          })
          .catch(() => {});

        // 2. Unread notifications
        API.get('/admin/notifications')
          .then(res => {
            if (!isMounted) return;
            const data = res.data;
            if (data?.status === 'success') {
              setUnreadNotifsCount(data.counts?.unread || 0);
            }
          })
          .catch(() => {});

        // 3. Pending enquiries count
        API.get('/admin/dashboard/enquiries')
          .then(res => {
            if (!isMounted) return;
            const data = res.data;
            if (data?.status === 'success' && data.data) {
              const pCount = (data.data.propertyEnquiries || []).filter(e =>
                ['pending', 'new', 'open'].includes((e.status || '').toLowerCase())
              ).length;
              const dCount = (data.data.developerEnquiries || []).filter(e =>
                ['pending', 'new', 'open'].includes((e.status || '').toLowerCase())
              ).length;
              const vCount = (data.data.visitRequests || []).filter(e =>
                ['pending', 'new', 'open'].includes((e.status || '').toLowerCase())
              ).length;
              setPendingEnquiriesCount(pCount + dCount + vCount);
            }
          })
          .catch(() => {});

        // 4. Pending Property / Project Verifications
        API.get('/admin/dashboard/stats')
          .then(res => {
            if (!isMounted) return;
            const data = res.data;
            if (data?.status === 'success' && data.data?.stats) {
              setPendingVerificationCount(data.data.stats.pendingProperties || 0);
            }
          })
          .catch(() => {});
      } catch (_) {}
    };

    fetchBadgeCounts();
    const timer = setInterval(fetchBadgeCounts, 25000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  // Keyboard shortcut listener for quick filter (press "/" or "Escape")
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable) {
        if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
          setSearchQuery('');
        }
        return;
      }
      if (e.key === '/' && !collapsedState) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [collapsedState]);

  // Perfectly organized semantic navigation groups
  const navGroups = useMemo(() => [
    {
      id: 'overview',
      group: 'Overview & Stats',
      short: 'Overview',
      items: [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { name: 'Reports & Export', path: '/admin/reports', icon: BarChart3 },
        { name: 'Revenue & Finance', path: '/admin/revenue', icon: IndianRupee },
      ]
    },
    {
      id: 'properties',
      group: 'Real Estate & Projects',
      short: 'Properties',
      items: [
        {
          name: 'Property Verification',
          path: '/admin/verification',
          icon: CheckSquare,
          badge: pendingVerificationCount > 0 ? String(pendingVerificationCount) : null
        },
        { name: 'Builders & Projects', path: '/admin/builders', icon: Building2 },
        { name: 'Token Bookings', path: '/admin/tokens', icon: FileCheck },
      ]
    },
    {
      id: 'crm',
      group: 'CRM & Inquiries',
      short: 'CRM',
      items: [
        { name: 'Leads Pipeline', path: '/admin/leads', icon: Users },
        {
          name: 'Property Enquiries',
          path: '/admin/enquiries',
          icon: Inbox,
          badge: pendingEnquiriesCount > 0 ? String(pendingEnquiriesCount) : null
        },
        { name: 'Website Enquiries', path: '/admin/web-inquiries', icon: MailCheck },
        {
          name: 'Agents & Brokers',
          path: '/admin/agents',
          icon: UserCheck,
          badge: pendingAgentsCount > 0 ? String(pendingAgentsCount) : null
        },
        { name: 'User Accounts', path: '/admin/users', icon: User },
      ]
    },
    {
      id: 'services',
      group: 'Services & Growth',
      short: 'Services',
      items: [
        { name: 'Services Hub', path: '/admin/services', icon: Briefcase },
        { name: 'Service Catalog', path: '/admin/services-catalog', icon: PackageCheck },
        { name: 'Referral Network', path: '/admin/references', icon: Gift },
      ]
    },
    {
      id: 'content',
      group: 'Content & Media',
      short: 'Content',
      items: [
        { name: 'Market Insights', path: '/admin/insights', icon: Sparkles },
        { name: 'App Banners', path: '/admin/banners', icon: Layers },
        { name: 'Client Reviews', path: '/admin/testimonials', icon: MessageSquareQuote },
        { name: 'Help & FAQs', path: '/admin/faq', icon: HelpCircle },
      ]
    },
    {
      id: 'system',
      group: 'System & Platform',
      short: 'System',
      items: [
        {
          name: 'System Notifications',
          path: '/admin/notifications',
          icon: Bell,
          badge: unreadNotifsCount > 0 ? String(unreadNotifsCount) : null
        },
        { name: 'Push Broadcasts', path: '/admin/broadcasts', icon: Radio },
        { name: 'Platform Settings', path: '/admin/settings', icon: Settings },
        { name: 'Legal Policies', path: '/admin/legal', icon: FileText },
        { name: 'About Platform', path: '/admin/about', icon: Info },
        { name: 'Contact Details', path: '/admin/contact', icon: PhoneCall },
      ]
    }
  ], [pendingAgentsCount, pendingEnquiriesCount, unreadNotifsCount, pendingVerificationCount]);

  // Filter items if user typed in sidebar search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return navGroups;
    const query = searchQuery.toLowerCase().trim();
    return navGroups
      .map(group => {
        const matchingItems = group.items.filter(item =>
          item.name.toLowerCase().includes(query) ||
          group.group.toLowerCase().includes(query)
        );
        return {
          ...group,
          items: matchingItems
        };
      })
      .filter(group => group.items.length > 0);
  }, [navGroups, searchQuery]);

  const totalFilteredItems = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.items.length, 0);
  }, [filteredGroups]);

  return (
    <>
      <aside
        className={`fixed top-0 left-0 z-40 h-screen bg-[var(--bg-surface)]/95 border-r border-[var(--border)] transition-[width,transform] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-[width] select-none flex flex-col backdrop-blur-xl ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        } ${collapsedState ? 'w-[260px] md:w-[72px]' : 'w-[260px]'}`}
      >
        {/* ── Desktop Floating Edge Toggle Button ── */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="hidden md:flex absolute top-4.5 -right-3.5 w-7 h-7 bg-[var(--bg-surface)] border border-[var(--border)] hover:border-brand text-[var(--text-muted)] hover:text-brand rounded-full items-center justify-center shadow-md hover:shadow-brand/20 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer z-50 group"
          title={collapsedState ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          aria-label="Toggle sidebar collapse"
        >
          <ChevronLeft
            size={14}
            strokeWidth={2.5}
            className={`transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
              collapsedState ? 'rotate-180 text-brand' : 'rotate-0'
            }`}
          />
        </button>

        {/* ── Brand Header ── */}
        <div className="flex items-center justify-between border-b border-[var(--border)]/70 shrink-0 h-16 px-3.5 overflow-hidden transition-colors duration-300">
          <div
            onClick={() => navigate('/admin')}
            className="flex items-center gap-3 overflow-hidden cursor-pointer group/brand min-w-0"
          >
            {/* Logo container with brand glow */}
            <div className="relative flex items-center justify-center w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-brand/15 via-brand/5 to-transparent border border-brand/20 p-1.5 transition-all duration-300 group-hover/brand:scale-105 group-hover/brand:border-brand/40 shadow-xs">
              <img
                src="/favicon.png"
                alt="GHARMB Logo"
                className={`w-full h-full object-contain ${isDark ? 'hidden' : 'block'}`}
              />
              <img
                src="/favicon-dark.png"
                alt="GHARMB Logo"
                className={`w-full h-full object-contain ${isDark ? 'block' : 'hidden'}`}
              />
            </div>

            {/* Brand Name & Tag */}
            <div
              className={`flex flex-col whitespace-nowrap overflow-hidden transition-[max-width,opacity,transform] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-[max-width,opacity] ${
                collapsedState
                  ? 'opacity-100 max-w-[170px] md:max-w-0 md:opacity-0 md:-translate-x-3 pointer-events-none'
                  : 'opacity-100 max-w-[170px] translate-x-0'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-[var(--text-primary)] tracking-tight">
                  GHARMB
                </span>
                <span className="text-[9px] font-extrabold text-brand bg-brand/12 border border-brand/25 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-medium tracking-tight">
                Management Suite
              </span>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] md:hidden rounded-lg transition-all duration-200 active:scale-95 cursor-pointer"
            title="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Quick In-Sidebar Search / Filter Bar ── */}
        <div
          className={`px-3 pt-3 pb-1 border-b border-[var(--border)]/40 transition-[max-height,opacity,padding] duration-300 overflow-hidden ${
            collapsedState
              ? 'md:max-h-12 md:p-2 flex md:justify-center'
              : 'max-h-16 opacity-100'
          }`}
        >
          {collapsedState ? (
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden md:flex w-9 h-9 rounded-xl text-[var(--text-muted)] hover:text-brand hover:bg-brand/10 items-center justify-center transition-all cursor-pointer"
              title="Search pages (Expand sidebar)"
            >
              <Search size={16} />
            </button>
          ) : (
            <div className="relative w-full flex items-center">
              <Search
                size={13}
                className="absolute left-2.5 text-[var(--text-muted)] pointer-events-none"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Quick find page... (/)"
                className="w-full h-8 pl-8 pr-7 bg-[var(--bg-muted)]/70 hover:bg-[var(--bg-muted)] focus:bg-[var(--bg-surface)] border border-transparent focus:border-brand/40 text-[11.5px] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none transition-all duration-150"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md cursor-pointer"
                  title="Clear filter"
                >
                  <X size={12} />
                </button>
              ) : (
                <span className="absolute right-2 text-[10px] font-semibold text-[var(--text-muted)] border border-[var(--border)] px-1 rounded bg-[var(--bg-surface)]/80 pointer-events-none">
                  /
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Navigation List ── */}
        <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden sidebar-scrollbar px-2.5 transition-all duration-300">
          {/* Results summary when filtering */}
          {searchQuery.trim() && !collapsedState && (
            <div className="flex items-center justify-between px-2 pb-2 text-[10.5px] text-[var(--text-muted)]">
              <span>
                Found <strong className="text-brand">{totalFilteredItems}</strong> page{totalFilteredItems !== 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-brand hover:underline font-semibold cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}

          {filteredGroups.length === 0 ? (
            <div className="py-8 px-3 text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded-xl bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)]">
                <Search size={15} />
              </div>
              <div className="text-xs font-semibold text-[var(--text-primary)]">
                No matching pages
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5 mb-2">
                Try searching with different keywords
              </div>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-brand hover:underline font-semibold cursor-pointer"
              >
                Reset filter
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredGroups.map((group, groupIdx) => {
                const hasActiveItem = group.items.some(item =>
                  item.path === '/admin'
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(item.path)
                );

                // Calculate total badges for this category
                const groupBadgeCount = group.items.reduce((sum, item) => {
                  const count = parseInt(item.badge || '0', 10);
                  return sum + (isNaN(count) ? 0 : count);
                }, 0);

                return (
                  <div key={group.id} className="space-y-1">
                    {/* ── Highlighted Category Header (No dropdown chevron) ── */}
                    <div
                      className={`overflow-hidden transition-[max-height,opacity,margin,padding] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                        collapsedState
                          ? 'md:max-h-0 md:opacity-0 md:p-0 md:m-0 pointer-events-none'
                          : 'max-h-10 opacity-100 px-2 pt-2.5 pb-1'
                      }`}
                    >
                      <div className="flex items-center gap-2 select-none">
                        {/* Highlighted indicator dot */}
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300 ${
                            hasActiveItem
                              ? 'bg-brand ring-2 ring-brand/35 shadow-[0_0_8px_rgba(255,90,60,0.8)] scale-110'
                              : 'bg-brand/50'
                          }`}
                        />

                        {/* Highlighted Category Title */}
                        <span className="text-[11px] font-black uppercase tracking-wider text-[var(--text-primary)] dark:text-zinc-100 shrink-0">
                          {group.group}
                        </span>

                        {/* Category Badge Pill */}
                        {groupBadgeCount > 0 && (
                          <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-brand/15 text-brand border border-brand/25 shrink-0 animate-pulse">
                            {groupBadgeCount}
                          </span>
                        )}

                        {/* Elegant divider line extending across */}
                        <span className="h-[1px] flex-1 bg-gradient-to-r from-[var(--border)] via-[var(--border)]/50 to-transparent ml-1" />
                      </div>
                    </div>

                    {/* Collapsed divider on desktop */}
                    <div
                      className={`hidden md:block transition-[opacity,width,margin] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                        collapsedState && groupIdx > 0
                          ? 'my-2 mx-auto w-6 border-t border-[var(--border)]/70 opacity-100'
                          : 'my-0 w-0 h-0 border-transparent opacity-0 overflow-hidden'
                      }`}
                    />

                    {/* Category Items List (Always visible, non-collapsing) */}
                    <div className="space-y-0.5">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          end={item.path === '/admin'}
                          onClick={() => {
                            if (window.innerWidth < 768 && toggleSidebar) toggleSidebar();
                          }}
                          onMouseEnter={(e) => {
                            if (!collapsedState || window.innerWidth < 768) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredTooltip({
                              name: item.name,
                              group: group.group,
                              badge: item.badge,
                              top: rect.top + rect.height / 2,
                            });
                          }}
                          onMouseLeave={() => setHoveredTooltip(null)}
                          className={({ isActive }) =>
                            `group relative flex items-center w-full rounded-xl transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer h-9 px-2.5 overflow-hidden ${
                              isActive
                                ? 'bg-gradient-to-r from-brand/12 via-brand/6 to-transparent text-brand border border-brand/25 dark:border-brand/35 font-semibold shadow-xs'
                                : 'text-[var(--text-subtle)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] hover:translate-x-0.5 border border-transparent'
                            } ${collapsedState ? 'md:justify-center md:px-0' : ''}`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {/* Centered Icon Container with micro-animation */}
                              <div
                                className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center transition-all duration-200 ${
                                  isActive
                                    ? 'bg-brand text-white shadow-xs shadow-brand/30'
                                    : 'text-[var(--text-muted)] group-hover:text-brand group-hover:bg-brand/10 group-hover:scale-110'
                                }`}
                              >
                                <item.icon
                                  size={15}
                                  strokeWidth={isActive ? 2.3 : 1.9}
                                  className="shrink-0 transition-transform duration-200"
                                />
                              </div>

                              {/* Text Label with fluid width and slide animation */}
                              <span
                                className={`flex-1 truncate tracking-tight text-[12px] whitespace-nowrap overflow-hidden transition-[max-width,opacity,transform,margin] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-[max-width,opacity] ${
                                  collapsedState
                                    ? 'opacity-100 max-w-[170px] ml-2.5 md:max-w-0 md:opacity-0 md:-translate-x-2 md:ml-0 pointer-events-none'
                                    : 'max-w-[170px] opacity-100 translate-x-0 ml-2.5'
                                } ${
                                  isActive
                                    ? 'font-bold text-brand'
                                    : 'font-medium text-[var(--text-subtle)] group-hover:text-[var(--text-primary)]'
                                }`}
                              >
                                {item.name}
                              </span>

                              {/* Badge with fluid collapse */}
                              {item.badge && (
                                <span
                                  className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap overflow-hidden transition-[max-width,opacity,padding] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] shrink-0 ${
                                    collapsedState
                                      ? 'opacity-100 max-w-[40px] md:max-w-0 md:opacity-0 md:p-0 pointer-events-none'
                                      : 'max-w-[40px] opacity-100'
                                  } ${
                                    isActive
                                      ? 'bg-brand text-white shadow-2xs'
                                      : 'bg-brand/12 text-brand ring-1 ring-brand/25 group-hover:bg-brand group-hover:text-white transition-all'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}

                              {/* Notification pip dot when collapsed on desktop */}
                              {collapsedState && item.badge && !isActive && (
                                <span className="hidden md:block absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand ring-2 ring-[var(--bg-surface)] animate-pulse" />
                              )}
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </nav>
      </aside>

      {/* ── Fixed Floating Tooltip Portal for Collapsed Desktop Mode ── */}
      <AnimatePresence>
        {hoveredTooltip && collapsedState && (
          <motion.div
            initial={{ opacity: 0, x: -6, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -6, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ top: `${hoveredTooltip.top}px` }}
            className="hidden md:flex fixed left-[78px] -translate-y-1/2 flex-col gap-0.5 bg-[var(--bg-surface)]/95 text-[var(--text-primary)] py-2 px-3 rounded-xl shadow-2xl border border-[var(--border)] whitespace-nowrap z-50 pointer-events-none min-w-[140px] backdrop-blur-xl"
          >
            <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 bg-[var(--bg-surface)] border-l border-b border-[var(--border)]" />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {hoveredTooltip.name}
              </span>
              {hoveredTooltip.badge && (
                <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-brand/15 text-brand ring-1 ring-brand/30">
                  {hoveredTooltip.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-medium">
              {hoveredTooltip.group}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
