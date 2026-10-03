import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Building2,
  Inbox,
  IndianRupee,
  BarChart3,
  Settings,
  X,
  ChevronLeft,
  FileText,
  Info,
  Bell,
  Briefcase,
  Lock,
  Gift,
  Sparkles,
  MessageSquareQuote,
  MailCheck,
  Layers
} from 'lucide-react';

const Sidebar = ({
  isOpen,
  toggleSidebar,
  isCollapsed,
  setIsCollapsed,
  collapsed,
  setCollapsed,
  onLogout
}) => {
  const navigate = useNavigate();

  const collapsedState = isCollapsed !== undefined ? isCollapsed : (collapsed !== undefined ? collapsed : false);
  const toggleCollapse = () => {
    if (setIsCollapsed) setIsCollapsed(!collapsedState);
    else if (setCollapsed) setCollapsed(!collapsedState);
  };

  // Grouped Navigation Structure for optimal UX & cognitive ease
  const navGroups = [
    {
      group: 'Core',
      items: [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { name: 'Verification', path: '/admin/verification', icon: CheckSquare },
        { name: 'User Directory', path: '/admin/users', icon: Users },
      ]
    },
    {
      group: 'Real Estate & CRM',
      items: [
        { name: 'Builders & RERA', path: '/admin/builders', icon: Building2 },
        { name: 'Leads & Enquiries', path: '/admin/leads', icon: Inbox },
        { name: 'Services Hub', path: '/admin/services', icon: Briefcase },
        { name: 'Token Bookings', path: '/admin/tokens', icon: Lock },
        { name: 'Referral Network', path: '/admin/references', icon: Gift },
      ]
    },
    {
      group: 'Finance & Analytics',
      items: [
        { name: 'Revenue', path: '/admin/revenue', icon: IndianRupee },
        { name: 'Reports & Export', path: '/admin/reports', icon: BarChart3 },
      ]
    },
    {
      group: 'Content & Inquiries',
      items: [
        { name: 'App Banners', path: '/admin/banners', icon: Layers },
        { name: 'Insights & Blogs', path: '/admin/insights', icon: Sparkles },
        { name: 'FAQ Management', path: '/admin/faq', icon: Info },
        { name: 'Testimonials', path: '/admin/testimonials', icon: MessageSquareQuote },
        { name: 'Web Inquiries', path: '/admin/web-inquiries', icon: MailCheck },
        { name: 'Notifications', path: '/admin/notifications', icon: Bell },
      ]
    },
    {
      group: 'Platform & Legal',
      items: [
        { name: 'Settings', path: '/admin/settings', icon: Settings },
        { name: 'Legal Policies', path: '/admin/legal', icon: FileText },
        { name: 'About Platform', path: '/admin/about', icon: Info },
      ]
    }
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen bg-[var(--bg-surface)] border-r border-[var(--border)] transition-[width,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)] select-none flex flex-col ${
        isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
      } ${collapsedState ? 'w-56 md:w-20' : 'w-56'}`}
    >
      {/* Floating edge toggle button with rotating chevron */}
      <button
        type="button"
        onClick={toggleCollapse}
        className="hidden md:flex absolute top-5 -right-3 w-6 h-6 bg-[var(--bg-surface)] border border-[var(--border)] hover:border-brand text-[var(--text-muted)] hover:text-brand rounded-full items-center justify-center shadow-md hover:shadow-brand/20 transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer z-50 group"
        title={collapsedState ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
      >
        <ChevronLeft
          size={12}
          strokeWidth={2.5}
          className={`transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
            collapsedState ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>

      {/* Brand Header */}
      <div
        className={`flex items-center border-b border-[var(--border)] shrink-0 h-16 transition-all duration-300 px-3.5 ${
          collapsedState ? 'justify-between md:justify-center md:px-0' : 'justify-between'
        }`}
      >
        <div 
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2.5 overflow-hidden cursor-pointer group/brand"
        >
          {/* Logo container */}
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-muted)] border border-[var(--border)] p-1.5 shrink-0 shadow-sm shadow-brand/10 group-hover/brand:border-brand/40 group-hover/brand:shadow-brand/25 group-hover/brand:scale-105 transition-all duration-300 overflow-hidden">
            <img src="/favicon.png" alt="GHARMB Logo" className="w-full h-full object-contain transition-transform duration-300 group-hover/brand:scale-110" />
          </div>

          {/* Brand Name & Tag */}
          <div
            className={`flex flex-col transition-all duration-200 overflow-hidden ${
              collapsedState ? 'opacity-100 max-w-[130px] md:opacity-0 md:max-w-0 md:hidden' : 'opacity-100 max-w-[130px]'
            }`}
          >
            <span className="font-extrabold text-sm text-[var(--text-primary)] tracking-tight flex items-center gap-1.5">
              GHARMB
              <span className="text-[9px] bg-brand/10 text-brand border border-brand/20 px-1.5 py-0.2 rounded-full font-bold">
                SaaS
              </span>
            </span>
            <span className="text-[9px] text-[var(--text-muted)] font-medium tracking-tight">Admin Console</span>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] md:hidden rounded-xl transition-all hover:scale-110 active:scale-95 duration-200 cursor-pointer"
          title="Close navigation"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation List */}
      <nav
        className={`flex-1 py-3 overflow-y-auto overflow-x-hidden custom-scrollbar transition-all duration-200 ${
          collapsedState ? 'px-2.5 md:px-2' : 'px-2.5'
        }`}
      >
        <div className="space-y-3.5">
          {navGroups.map((group, groupIdx) => (
            <div key={group.group} className="space-y-1">
              {/* Category Header (expanded & mobile) */}
              <div
                className={`transition-all duration-200 ${
                  collapsedState ? 'px-2 pt-1.5 pb-1 md:hidden' : 'px-2 pt-1.5 pb-1'
                }`}
              >
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] select-none">
                  {group.group}
                </span>
              </div>

              {/* Collapsed divider on desktop */}
              {collapsedState && groupIdx > 0 && (
                <div className="hidden md:block my-2 mx-auto w-8 border-t border-[var(--border)]/70" />
              )}

              {/* Group items */}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/admin'}
                    onClick={() => {
                      if (window.innerWidth < 768 && toggleSidebar) toggleSidebar();
                    }}
                    className={({ isActive }) =>
                      `group relative flex items-center rounded-xl transition-all duration-200 cursor-pointer ${
                        collapsedState
                          ? 'justify-start gap-2.5 px-2.5 h-9.5 md:justify-center md:w-11 md:h-11 md:mx-auto md:p-0'
                          : 'justify-start gap-2.5 px-2.5 h-9.5'
                      } ${
                        isActive
                          ? collapsedState
                            ? 'bg-gradient-to-r from-brand to-[#ff6b4a] text-white shadow-md shadow-brand/20 md:bg-gradient-to-br md:shadow-brand/25 md:ring-2 md:ring-brand/20 md:scale-105'
                            : 'bg-gradient-to-r from-brand to-[#ff6b4a] text-white shadow-md shadow-brand/20'
                          : 'text-[var(--text-subtle)] hover:bg-[var(--bg-muted)]/70 hover:text-[var(--text-primary)] md:hover:scale-[1.02]'
                      }`
                    }
                  >

                    {({ isActive }) => (
                      <>
                        {/* Hover accent bar (expanded) */}
                        {!isActive && (
                          <span
                            className={`absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-brand opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                              collapsedState ? 'md:hidden' : ''
                            }`}
                          />
                        )}

                        {/* Active accent bar (expanded) */}
                        {isActive && (
                          <span
                            className={`absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-white opacity-90 shadow-xs ${
                              collapsedState ? 'md:hidden' : ''
                            }`}
                          />
                        )}

                        {/* Icon */}
                        <item.icon
                          size={18}
                          strokeWidth={isActive ? 2.2 : 1.8}
                          className={`shrink-0 transition-all duration-200 ${
                            isActive
                              ? 'text-white'
                              : 'text-[var(--text-muted)] group-hover:text-brand group-hover:scale-110 group-hover:-rotate-3'
                          }`}
                        />

                        {/* Text Label */}
                        <span
                          className={`flex-1 truncate tracking-tight text-xs font-semibold transition-transform duration-200 ${
                            isActive ? 'font-bold text-white' : 'group-hover:translate-x-0.5'
                          } ${collapsedState ? 'md:hidden' : ''}`}
                        >
                          {item.name}
                        </span>

                        {/* Badge */}
                        {item.badge && (
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full transition-colors ${
                              isActive
                                ? 'bg-white/20 text-white backdrop-blur-xs'
                                : 'bg-[var(--bg-muted)] text-[var(--text-muted)] group-hover:bg-brand/10 group-hover:text-brand'
                            } ${collapsedState ? 'md:hidden' : ''}`}
                          >
                            {item.badge}
                          </span>
                        )}

                        {/* Pip dot when collapsed and has badge */}
                        {collapsedState && item.badge && !isActive && (
                          <span className="hidden md:block absolute top-2 right-2 w-2 h-2 rounded-full bg-brand ring-2 ring-[var(--bg-surface)]" />
                        )}

                        {/* Collapsed Tooltip */}
                        {collapsedState && (
                          <div className="hidden md:group-hover:flex items-center gap-2 absolute left-[calc(100%+14px)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs font-semibold py-1.5 px-3 rounded-xl shadow-xl border border-[var(--border)] whitespace-nowrap z-50 animate-tooltip-pop origin-left pointer-events-none">
                            <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-[var(--bg-surface)] border-l border-b border-[var(--border)]" />
                            <span>{item.name}</span>
                            {item.badge && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-brand/10 text-brand">
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
          ))}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
