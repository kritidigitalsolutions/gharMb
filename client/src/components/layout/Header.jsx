import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContexts';
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  CheckSquare,
  Plus,
  Zap,
  Download,
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';

const Header = ({ toggleSidebar, title }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'RERA License Pending', desc: 'Tata Developers submitted a new license key.', time: '5m ago', color: 'bg-orange-50 text-brand' },
    { id: 2, title: 'Escrow Released', desc: '₹1,00,000 released for Project DLF Phase 2.', time: '1h ago', color: 'bg-green-500/10 text-green-600' },
  ]);

  const unreadNotificationsCount = notifications.length;

  const handleNotifClick = (notif) => {
    setShowNotifications(false);
    if (notif.title.includes('RERA')) {
      navigate('/builders');
    } else if (notif.title.includes('Escrow')) {
      navigate('/revenue');
    }
  };

  const handleClearNotifs = (e) => {
    e.stopPropagation();
    setNotifications([]);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-[var(--bg-surface)] border-b border-[var(--border)] shrink-0 transition-colors duration-250">
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-muted)] md:hidden transition-colors shrink-0"
        >
          <Menu size={18} />
        </button>
        <h1 className="text-xs sm:text-sm md:text-base font-extrabold text-[var(--text-primary)] tracking-tight truncate whitespace-nowrap max-w-[150px] xs:max-w-[200px] sm:max-w-[300px] md:max-w-none">
          {title || 'Overview'}
        </h1>
      </div>

      {/* Action triggers */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Quick Actions Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowQuickActions(!showQuickActions);
              setShowNotifications(false);
            }}
            className="flex items-center justify-center w-8 h-8 md:w-auto md:h-auto md:px-3 md:py-1.5 bg-brand hover:bg-brand-dark text-white rounded-full md:rounded-xl text-[10px] font-extrabold shadow-md shadow-brand/10 transition-all cursor-pointer shrink-0"
            title="Quick Actions"
          >
            <Plus size={12} />
            <span className="hidden md:inline ml-1">Quick Actions</span>
          </button>

          {showQuickActions && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowQuickActions(false)}></div>
              <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xl z-20 overflow-hidden py-1">
                <button
                  type="button"
                  onClick={() => { navigate('/verification'); setShowQuickActions(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-subtle)] flex items-center gap-2"
                >
                  <Zap size={14} className="text-brand" /> Add New Property
                </button>
                <button
                  type="button"
                  onClick={() => { navigate('/builders'); setShowQuickActions(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-subtle)] flex items-center gap-2"
                >
                  <Plus size={14} className="text-brand" /> Register Builder
                </button>
                <button
                  type="button"
                  onClick={() => { navigate('/reports'); setShowQuickActions(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-subtle)] flex items-center gap-2"
                >
                  <Download size={14} className="text-brand" /> Export Operations Logs
                </button>
              </div>
            </>
          )}
        </div>

        {/* Search */}
        <div className="relative hidden max-w-xs md:block">
          <Search className="absolute top-2.5 left-3 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search dashboard parameters..."
            className="w-48 lg:w-64 pl-9 pr-4 py-1.5 text-[11px] bg-[var(--bg-muted)] text-[var(--text-primary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-brand/40 focus:bg-[var(--bg-surface)] transition-all placeholder:text-[var(--text-muted)]"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowQuickActions(false);
            }}
            className="relative p-2 text-[var(--text-muted)] rounded-xl hover:bg-[var(--bg-muted)] hover:text-[var(--text-subtle)] transition-colors cursor-pointer"
          >
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full border border-[var(--bg-surface)]"></span>
            )}
            <Bell size={16} />
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)}></div>
              <div className="absolute right-0 mt-2 w-72 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xl z-20 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-[var(--border-muted)] flex justify-between items-center bg-[var(--bg-muted)]">
                  <span className="font-bold text-xs text-[var(--text-primary)]">Alerts & Logs</span>
                  {unreadNotificationsCount > 0 && (
                    <button onClick={handleClearNotifs} className="text-[9px] font-bold text-brand hover:underline cursor-pointer">Clear All</button>
                  )}
                </div>
                <div className="divide-y divide-[var(--border-muted)] max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[var(--text-muted)] font-semibold">No notifications pending.</div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className="p-3 hover:bg-[var(--bg-muted)] transition-colors cursor-pointer flex gap-2.5"
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${notif.color}`}>
                          <CheckSquare size={14} />
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-bold text-[11px] text-[var(--text-primary)] leading-tight">{notif.title}</p>
                          <p className="text-[10px] text-[var(--text-subtle)] leading-snug">{notif.desc}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 text-[var(--text-muted)] rounded-xl hover:bg-[var(--bg-muted)] hover:text-[var(--text-subtle)] transition-colors cursor-pointer shrink-0"
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
};

export default Header;
