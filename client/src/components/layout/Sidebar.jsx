import { useState, useEffect, useMemo } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContexts';
import API from '../../api/api';
import {
  LayoutDashboard,
  BarChart3,
  IndianRupee,
  CheckSquare,
  Building2,
  UserCheck,
  Inbox,
  Users,
  FileCheck,
  Briefcase,
  PackageCheck,
  Gift,
  Bell,
  MailCheck,
  Radio,
  Layers,
  Sparkles,
  Info,
  MessageSquareQuote,
  Settings,
  FileText,
  PhoneCall,
  ChevronLeft,
  X
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
  const toggleCollapse = () => {
    if (setIsCollapsed) setIsCollapsed(!collapsedState);
    else if (setCollapsed) setCollapsed(!collapsedState);
  };

  const [pendingAgentsCount, setPendingAgentsCount] = useState(0);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [pendingEnquiriesCount, setPendingEnquiriesCount] = useState(0);

  // Track collapsed state of accordion groups
  const [collapsedSections, setCollapsedSections] = useState({});

  useEffect(() => {
    const fetchBadgeCounts = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        // 1. Pending agents
        API.get('/admin/users/pending-agents')
          .then(res => {
            const data = res.data;
            if (data?.status === 'success') {
              setPendingAgentsCount(data.results || data.data?.agents?.length || 0);
            }
          })
          .catch(() => {});

        // 2. Unread notifications
        API.get('/admin/notifications')
          .then(res => {
            const data = res.data;
            if (data?.status === 'success') {
              setUnreadNotifsCount(data.counts?.unread || 0);
            }
          })
          .catch(() => {});

        // 3. Pending enquiries count
        API.get('/admin/dashboard/enquiries')
          .then(res => {
            const data = res.data;
            if (data?.status === 'success' && data.data) {
              const pCount = (data.data.propertyEnquiries || []).filter(e => ['pending', 'new', 'open'].includes((e.status || '').toLowerCase())).length;
              const dCount = (data.data.developerEnquiries || []).filter(e => ['pending', 'new', 'open'].includes((e.status || '').toLowerCase())).length;
              const vCount = (data.data.visitRequests || []).filter(e => ['pending', 'new', 'open'].includes((e.status || '').toLowerCase())).length;
              setPendingEnquiriesCount(pCount + dCount + vCount);
            }
          })
          .catch(() => {});
      } catch (_) {}
    };

    fetchBadgeCounts();
    const timer = setInterval(fetchBadgeCounts, 25000);
    return () => clearInterval(timer);
  }, []);

  // Crystal-clear, intuitive navigation categories
  const navGroups = useMemo(() => [
    {
      id: 'overview',
      group: 'Overview',
      items: [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { name: 'Reports & Export', path: '/admin/reports', icon: BarChart3 },
        { name: 'Revenue & Finance', path: '/admin/revenue', icon: IndianRupee },
      ]
    },
    {
      id: 'crm',
      group: 'Real Estate & CRM',
      items: [
        { name: 'Property Verification', path: '/admin/verification', icon: CheckSquare },
        { name: 'Builders & Projects', path: '/admin/builders', icon: Building2 },
        {
          name: 'Agents & Brokers',
          path: '/admin/agents',
          icon: UserCheck,
          badge: pendingAgentsCount > 0 ? String(pendingAgentsCount) : null
        },
        {
          name: 'Property Enquiries',
          path: '/admin/enquiries',
          icon: Inbox,
          badge: pendingEnquiriesCount > 0 ? String(pendingEnquiriesCount) : null
        },
        { name: 'Leads Pipeline', path: '/admin/leads', icon: Users },
        { name: 'Token Bookings', path: '/admin/tokens', icon: FileCheck },
      ]
    },
    {
      id: 'services',
      group: 'Services & Network',
      items: [
        { name: 'Services Hub', path: '/admin/services', icon: Briefcase },
        { name: 'Service Catalog', path: '/admin/services-catalog', icon: PackageCheck },
        { name: 'Referral Network', path: '/admin/references', icon: Gift },
      ]
    },
    {
      id: 'communications',
      group: 'Communications',
      items: [
        {
          name: 'System Notifications',
          path: '/admin/notifications',
          icon: Bell,
          badge: unreadNotifsCount > 0 ? String(unreadNotifsCount) : null
        },
        { name: 'Website Enquiries', path: '/admin/web-inquiries', icon: MailCheck },
        { name: 'Push Broadcasts', path: '/admin/broadcasts', icon: Radio },
      ]
    },
    {
      id: 'content',
      group: 'Content & Media',
      items: [
        { name: 'App Banners', path: '/admin/banners', icon: Layers },
        { name: 'Market Insights', path: '/admin/insights', icon: Sparkles },
        { name: 'Help & FAQs', path: '/admin/faq', icon: Info },
        { name: 'Client Reviews', path: '/admin/testimonials', icon: MessageSquareQuote },
      ]
    },
    {
      id: 'system',
      group: 'System & Legal',
      items: [
        { name: 'User Accounts', path: '/admin/users', icon: Users },
        { name: 'Platform Settings', path: '/admin/settings', icon: Settings },
        { name: 'Legal Policies', path: '/admin/legal', icon: FileText },
        { name: 'About Platform', path: '/admin/about', icon: Info },
        { name: 'Contact Details', path: '/admin/contact', icon: PhoneCall },
      ]
    }
  ], [pendingAgentsCount, pendingEnquiriesCount, unreadNotifsCount]);

  const toggleSection = (id) => {
    setCollapsedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen bg-[var(--bg-surface)] border-r border-[var(--border)]/80 transition-[width,transform] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-[width] select-none flex flex-col backdrop-blur-md ${
        isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
      } ${collapsedState ? 'w-[218px] md:w-[68px]' : 'w-[218px]'}`}
    >
      {/* Floating edge toggle button with rotating chevron */}
      <button
        type="button"
        onClick={toggleCollapse}
        className="hidden md:flex absolute top-4 -right-3 w-6 h-6 bg-[var(--bg-surface)] border border-[var(--border)] hover:border-brand text-[var(--text-muted)] hover:text-brand rounded-full items-center justify-center shadow-xs hover:shadow-brand/20 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer z-50 group"
        title={collapsedState ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
      >
        <ChevronLeft
          size={12}
          strokeWidth={2.5}
          className={`transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
            collapsedState ? 'rotate-180 text-brand' : 'rotate-0'
          }`}
        />
      </button>

      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)]/70 shrink-0 h-14 px-3.5 overflow-hidden transition-colors duration-300">
        <div
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2.5 overflow-hidden cursor-pointer group/brand min-w-0"
        >
          {/* Logo container */}
          <div className="relative flex items-center justify-center w-8 h-8 shrink-0 rounded-lg transition-transform duration-300 group-hover/brand:scale-105">
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
              collapsedState ? 'opacity-100 max-w-[130px] md:max-w-0 md:opacity-0 md:-translate-x-3 pointer-events-none' : 'opacity-100 max-w-[130px] translate-x-0'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xs text-[var(--text-primary)] tracking-tight">
                GHARMB
              </span>
              <span className="text-[8.5px] font-bold text-brand bg-brand/10 px-1 py-0.2 rounded-full uppercase tracking-wider">
                Admin
              </span>
            </div>
            <span className="text-[9px] text-[var(--text-muted)] font-medium tracking-tight">
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
          <X size={16} />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden sidebar-scrollbar px-2 transition-all duration-300">
        <div className="space-y-2.5">
          {navGroups.map((group, groupIdx) => {
            const isSectionCollapsed = collapsedSections[group.id];
            const hasActiveItem = group.items.some(item =>
              item.path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.path)
            );

            return (
              <div key={group.id} className="space-y-0.5">
                {/* Category Header (expanded & mobile) */}
                <div
                  className={`overflow-hidden transition-[max-height,opacity,margin,padding] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                    collapsedState
                      ? 'md:max-h-0 md:opacity-0 md:p-0 md:m-0 pointer-events-none'
                      : 'max-h-8 opacity-100 px-2 pt-1 pb-0.5'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSection(group.id)}
                    className="w-full flex items-center text-[9.5px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] hover:text-brand transition-colors duration-150 select-none cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 transition-transform duration-150 hover:translate-x-0.5">
                      {group.group}
                      {hasActiveItem && (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                      )}
                    </span>
                  </button>
                </div>

                {/* Collapsed divider on desktop */}
                <div
                  className={`hidden md:block transition-[opacity,width,margin] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                    collapsedState && groupIdx > 0
                      ? 'my-1.5 mx-auto w-5 border-t border-[var(--border)]/60 opacity-100'
                      : 'my-0 w-0 h-0 border-transparent opacity-0 overflow-hidden'
                  }`}
                />

                {/* Group items container */}
                <div
                  className={`space-y-0.5 overflow-hidden transition-all duration-200 ${
                    isSectionCollapsed && !collapsedState ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'
                  }`}
                >
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/admin'}
                      onClick={() => {
                        if (window.innerWidth < 768 && toggleSidebar) toggleSidebar();
                      }}
                      className={({ isActive }) =>
                        `group relative flex items-center w-full rounded-lg transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer h-8.5 px-2 overflow-hidden ${
                          isActive
                            ? 'bg-brand text-white shadow-sm shadow-brand/25 font-semibold'
                            : 'text-[var(--text-subtle)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] hover:shadow-xs'
                        } ${!collapsedState ? 'hover:translate-x-1' : 'md:hover:scale-105'}`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {/* Centered Icon Container */}
                          <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                            <item.icon
                              size={16}
                              strokeWidth={isActive ? 2.2 : 1.8}
                              className={`shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                                isActive
                                  ? 'text-white'
                                  : 'text-[var(--text-muted)] group-hover:text-brand group-hover:scale-115 group-hover:-rotate-6'
                              }`}
                            />
                          </div>

                          {/* Text Label with fluid width and slide animation */}
                          <span
                            className={`flex-1 truncate tracking-tight text-[11.5px] whitespace-nowrap overflow-hidden transition-[max-width,opacity,transform,margin] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-[max-width,opacity] ${
                              collapsedState
                                ? 'opacity-100 max-w-[150px] ml-2 md:max-w-0 md:opacity-0 md:-translate-x-2 md:ml-0 pointer-events-none'
                                : 'max-w-[150px] opacity-100 translate-x-0 ml-2'
                            } ${
                              isActive
                                ? 'font-bold text-white'
                                : 'font-medium text-[var(--text-subtle)] group-hover:text-[var(--text-primary)] group-hover:translate-x-0.5'
                            }`}
                          >
                            {item.name}
                          </span>

                          {/* Badge with fluid collapse */}
                          {item.badge && (
                            <span
                              className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap overflow-hidden transition-[max-width,opacity,padding] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] shrink-0 ${
                                collapsedState
                                  ? 'opacity-100 max-w-[40px] md:max-w-0 md:opacity-0 md:p-0 pointer-events-none'
                                  : 'max-w-[40px] opacity-100'
                              } ${
                                isActive
                                  ? 'bg-white/20 text-white backdrop-blur-xs'
                                  : 'bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white group-hover:scale-105'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}

                          {/* Notification pip dot when collapsed on desktop */}
                          {collapsedState && item.badge && !isActive && (
                            <span className="hidden md:block absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand ring-2 ring-[var(--bg-surface)] animate-pulse" />
                          )}

                          {/* Collapsed Tooltip on Desktop */}
                          {collapsedState && (
                            <div className="hidden md:group-hover:flex items-center gap-2 absolute left-[calc(100%+12px)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs font-semibold py-1.5 px-2.5 rounded-lg shadow-xl border border-[var(--border)] whitespace-nowrap z-50 animate-tooltip-pop origin-left pointer-events-none">
                              <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-[var(--bg-surface)] border-l border-b border-[var(--border)]" />
                              <span>{item.name}</span>
                              {item.badge && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-brand/10 text-brand">
                                  {item.badge}
                                </span>
                              )}
                            </div>
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
      </nav>
    </aside>
  );
};

export default Sidebar;
