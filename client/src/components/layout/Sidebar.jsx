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
  ChevronRight,
  LogOut,
  FileText,
  Info,
  Crown,
  ShieldCheck,
  Bell,
  Briefcase,
  Lock,
  Gift,
  Sparkles,
  MessageSquareQuote
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar, isCollapsed, setIsCollapsed, collapsed, setCollapsed, onLogout }) => {
  const navigate = useNavigate();

  const collapsedState = isCollapsed !== undefined ? isCollapsed : (collapsed !== undefined ? collapsed : false);
  const toggleCollapse = () => {
    if (setIsCollapsed) setIsCollapsed(!collapsedState);
    else if (setCollapsed) setCollapsed(!collapsedState);
  };

  // Get logged-in admin user info from localStorage if available
  const storedUserRaw = localStorage.getItem('adminUser');
  let adminUser = { name: 'Rishika C.', role: 'SaaS Admin' };
  if (storedUserRaw) {
    try {
      adminUser = JSON.parse(storedUserRaw);
    } catch (err) {
      console.error('Error parsing adminUser:', err);
    }
  }

  const getInitials = (name) => {
    if (!name) return 'RC';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('admin');
    if (onLogout) onLogout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Verification', path: '/admin/verification', icon: CheckSquare },
    { name: 'User Directory', path: '/admin/users', icon: Users },
    { name: 'Builders & RERA', path: '/admin/builders', icon: Building2 },
    { name: 'Leads & Enquiries', path: '/admin/leads', icon: Inbox, badgeColor: 'bg-brand text-white' },
    { name: 'Services Hub', path: '/admin/services', icon: Briefcase },
    { name: 'Token Bookings', path: '/admin/tokens', icon: Lock },
    { name: 'Referral Network', path: '/admin/references', icon: Gift },
    { name: 'Revenue', path: '/admin/revenue', icon: IndianRupee },
    { name: 'Reports & Export', path: '/admin/reports', icon: BarChart3 },
    { name: 'Insights & Blogs', path: '/admin/insights', icon: Sparkles },
    { name: 'FAQ Management', path: '/admin/faq', icon: Info },
    { name: 'Testimonials', path: '/admin/testimonials', icon: MessageSquareQuote },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
    { name: 'Legal Policies', path: '/admin/legal', icon: FileText },
    { name: 'About Platform', path: '/admin/about', icon: Info },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen bg-[var(--bg-surface)] border-r border-[var(--border)] transition-[width,transform] duration-200 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } ${collapsedState ? 'w-64 md:w-16' : 'w-64'}`}
    >
      {/* Border toggle button */}
      <button
        type="button"
        onClick={toggleCollapse}
        className="hidden md:flex absolute top-5 -right-3 w-6 h-6 bg-[var(--bg-surface)] border border-[var(--border)] hover:border-slate-400 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-full items-center justify-center shadow-sm hover:shadow transition-all hover:scale-110 active:scale-90 duration-200 cursor-pointer z-50"
      >
        {collapsedState ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      <div className="flex flex-col h-full">
        {/* Brand header */}
        <div className={`flex items-center border-b border-[var(--border)] shrink-0 h-16 transition-[padding] duration-200 ease-in-out px-4 justify-between ${
          collapsedState ? 'md:justify-center md:px-2' : ''
        }`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white border border-slate-200/50 p-1 shrink-0 shadow-md shadow-brand/10 hover:scale-105 transition-transform duration-300 cursor-pointer overflow-hidden">
              <img src="/favicon.png" alt="GHARMB Logo" className="w-full h-full object-contain" />
            </div>
            <span className={`font-extrabold text-sm text-[var(--text-primary)] tracking-tight flex items-center gap-1 ${
              collapsedState ? 'md:hidden' : ''
            }`}>
              GHARMB <span className="text-[9px] bg-brand-light text-brand px-1.5 py-0.5 rounded-full font-bold">SaaS</span>
            </span>
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-muted)] md:hidden rounded-xl transition-all hover:scale-110 hover:rotate-90 active:scale-90 duration-200 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation list */}
        <nav
          style={{ overflowX: 'clip' }}
          className={`flex-1 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden ${collapsedState ? 'px-3 md:px-2' : 'px-3'}`}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              onClick={() => {
                if (window.innerWidth < 768) toggleSidebar();
              }}
              className={({ isActive }) =>
                `flex items-center rounded-xl text-xs font-bold transition-all duration-200 hover:scale-[1.02] active:scale-95 group relative cursor-pointer ${
                  isCollapsed ? 'justify-start gap-3 px-3 py-2.5 md:justify-center md:p-3' : 'justify-start gap-3 px-3 py-2.5'
                } ${
                  isActive
                    ? isCollapsed
                      ? 'bg-brand text-white shadow-md shadow-brand/20 md:bg-brand/5 md:text-brand md:shadow-none'
                      : 'bg-brand text-white shadow-md shadow-brand/20'
                    : 'text-[var(--text-subtle)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && isCollapsed && (
                    <span className="absolute left-0 top-2.5 bottom-2.5 w-0.5 bg-brand rounded-r-full hidden md:block"></span>
                  )}

                  <item.icon 
                    size={18} 
                    className={`shrink-0 transition-transform duration-250 group-hover:scale-110 group-hover:-rotate-3 ${
                      isActive 
                        ? isCollapsed 
                          ? 'text-white md:text-brand' 
                          : 'text-white' 
                        : 'text-[var(--text-muted)] group-hover:text-[var(--text-subtle)]'
                    }`} 
                  />
                  
                  <span className={`flex-1 truncate tracking-tight ${isCollapsed ? 'md:hidden' : ''}`}>
                    {item.name}
                  </span>

                  {item.badge && (
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${isCollapsed ? 'md:hidden' : ''} ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[var(--bg-muted)] text-[var(--text-subtle)]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {isCollapsed && (
                    <div className="absolute left-16 hidden md:group-hover:block bg-slate-900 text-white text-[10px] font-extrabold py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap z-50 border border-slate-700 animate-tooltip-pop origin-left">
                      {item.name}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}



          {/* Divider line before logout */}
          <div className="border-t border-[var(--border)] my-2 mx-1"></div>

          {/* Logout Action */}
          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center rounded-xl text-xs font-bold transition-all duration-200 hover:scale-[1.02] active:scale-95 group relative cursor-pointer text-[var(--text-subtle)] hover:bg-red-500/10 hover:text-red-600 ${
              isCollapsed ? 'justify-start gap-3 px-3 py-2.5 md:justify-center md:p-3' : 'justify-start gap-3 px-3 py-2.5'
            }`}
          >
            <LogOut 
              size={18} 
              className="shrink-0 text-slate-400 group-hover:text-red-500 transition-all duration-250 group-hover:translate-x-0.5" 
            />
            <span className={`flex-1 text-left truncate tracking-tight ${isCollapsed ? 'md:hidden' : ''}`}>Logout</span>
            {isCollapsed && (
              <div className="absolute left-16 hidden md:group-hover:block bg-red-600 text-white text-[10px] font-extrabold py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap z-50 animate-tooltip-pop origin-left">
                Logout
              </div>
            )}
          </button>
        </nav>

        {/* User profile footer */}
        <div className={`p-3 border-t border-[var(--border)] bg-[var(--bg-muted)] flex items-center justify-between px-4 py-3.5 transition-[padding] duration-200 ease-in-out shrink-0 min-w-0 ${
          isCollapsed ? 'md:justify-center md:px-2' : ''
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative group/avatar shrink-0 cursor-pointer">
              {/* Profile Avatar Wrapper */}
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-brand-dark via-brand to-orange-400 p-[1.5px] shadow-sm transition-all duration-300 group-hover/avatar:scale-105 group-hover/avatar:shadow-md group-hover/avatar:shadow-brand/20">
                <div className="w-full h-full rounded-full bg-[var(--bg-surface)] flex items-center justify-center font-black text-[10px] text-brand tracking-wider uppercase border border-brand/5">
                  {getInitials(adminUser.name)}
                </div>
              </div>
              {/* Active status indicator */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[var(--bg-surface)] shadow-sm animate-pulse"></span>
              {isCollapsed && (
                <div className="absolute left-14 top-1/2 -translate-y-1/2 hidden md:group-hover/avatar:flex items-center gap-3 bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl shadow-xl z-50 border border-[var(--border)] p-2.5 animate-avatar-tooltip-pop origin-left min-w-[170px]">
                  {(() => {
                    const isAdmin = (adminUser.role || '').toLowerCase().includes('admin') || (adminUser.name || '').toLowerCase().includes('admin');
                    return (
                      <div className="w-8 h-8 rounded-xl bg-brand-light flex items-center justify-center text-brand shrink-0">
                        {isAdmin ? <Crown size={15} /> : <ShieldCheck size={16} />}
                      </div>
                    );
                  })()}
                  <div className="flex flex-col min-w-0 text-left">
                    <p className="text-[11px] font-extrabold text-[var(--text-primary)] leading-tight truncate">{adminUser.name}</p>
                    <span className="inline-flex items-center text-[8px] font-extrabold text-brand bg-brand-light px-1.5 py-0.5 rounded-md mt-1 w-max">
                      {adminUser.role || 'SaaS Admin'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className={`text-left leading-tight max-w-[130px] overflow-hidden ${isCollapsed ? 'md:hidden' : ''}`}>
              <p className="text-xs font-bold text-[var(--text-primary)] truncate">{adminUser.name}</p>
              <p className="text-[9px] text-[var(--text-muted)] mt-0.5 truncate font-medium">{adminUser.role || 'SaaS Admin'}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
