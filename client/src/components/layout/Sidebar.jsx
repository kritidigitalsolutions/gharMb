import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

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
    if (onLogout) onLogout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Verification', path: '/verification', icon: CheckSquare, badge: '5' },
    { name: 'User Directory', path: '/users', icon: Users },
    { name: 'Builders & RERA', path: '/builders', icon: Building2 },
    { name: 'Leads & Enquiries', path: '/leads', icon: Inbox, badge: 'New', badgeColor: 'bg-brand text-white' },
    { name: 'Revenue', path: '/revenue', icon: IndianRupee },
    { name: 'Reports & Export', path: '/reports', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen bg-white border-r border-slate-100 transition-all duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      <div className="flex flex-col h-full">
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand text-white font-black text-sm shrink-0 shadow-md shadow-brand/20">
              G
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-1">
                  GHARMB <span className="text-[9px] bg-brand-light text-brand px-1.5 py-0.5 rounded-full font-bold">SaaS</span>
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 text-slate-400 hover:bg-slate-50 md:hidden rounded-xl transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 768) toggleSidebar();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative cursor-pointer ${
                  isActive
                    ? 'bg-brand text-white shadow-md shadow-brand/20'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {!isCollapsed && (
                    <span className="flex-1 truncate tracking-tight">{item.name}</span>
                  )}

                  {!isCollapsed && item.badge && (
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                        item.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600')
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {isCollapsed && (
                    <div className="absolute left-20 hidden group-hover:block bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded shadow-lg whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User profile footer */}
        <div className={`p-4 border-t border-slate-50 bg-slate-50/30 flex flex-col gap-2 ${isCollapsed ? 'items-center' : 'items-stretch'}`}>
          <div className="flex items-center gap-3 justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-light flex items-center justify-center font-bold text-xs text-brand shrink-0">
                {getInitials(adminUser.name)}
              </div>
              {!isCollapsed && (
                <div className="text-left leading-none max-w-[110px] overflow-hidden">
                  <p className="text-xs font-bold text-slate-800 truncate">{adminUser.name}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5 truncate">{adminUser.role || 'SaaS Admin'}</p>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
              title="Sign Out / Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
