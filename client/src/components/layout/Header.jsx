import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContexts';
import {
  Menu,
  Bell,
  Search,
  CheckSquare,
  Plus,
  Zap,
  Download,
  ShieldCheck,
  Sun,
  Moon,
  ExternalLink
} from 'lucide-react';

const Header = ({ toggleSidebar, title }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [notifications, setNotifications] = useState([]);

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
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'property_status':
      case 'verification':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
      case 'payment':
        return 'bg-green-500/10 text-green-600 dark:text-green-400';
      default:
        return 'bg-slate-500/10 text-slate-500 dark:text-slate-400';
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

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-[var(--bg-surface)] border-b border-[var(--border)] shrink-0 transition-colors duration-250">
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-muted)] md:hidden transition-all duration-200 active:scale-90 shrink-0"
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
            className="group flex items-center justify-center w-8 h-8 md:w-auto md:h-auto md:px-3 md:py-1.5 bg-brand hover:bg-brand-dark text-white rounded-full md:rounded-xl text-[10px] font-extrabold shadow-md shadow-brand/10 transition-all hover:scale-105 active:scale-95 duration-150 cursor-pointer shrink-0"
            title="Quick Actions"
          >
            <Plus size={12} className="transition-transform duration-300 group-hover:rotate-90" />
            <span className="hidden md:inline ml-1">Quick Actions</span>
          </button>

          {showQuickActions && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowQuickActions(false)}></div>
              <div className="absolute right-0 mt-2 w-60 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xl z-20 overflow-hidden py-1 animate-slide-down origin-top-right">
                <button
                  type="button"
                  onClick={() => { navigate('/admin/verification'); setShowQuickActions(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-subtle)] flex items-center gap-2"
                >
                  <Zap size={14} className="text-brand" /> Verify Properties
                </button>
                <button
                  type="button"
                  onClick={() => { navigate('/admin/services'); setShowQuickActions(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-subtle)] flex items-center gap-2"
                >
                  <Plus size={14} className="text-purple-500" /> Services Hub (Loan & Interior)
                </button>
                <button
                  type="button"
                  onClick={() => { navigate('/admin/tokens'); setShowQuickActions(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-subtle)] flex items-center gap-2"
                >
                  <ShieldCheck size={14} className="text-blue-500" /> Escrow Token Bookings
                </button>
                <button
                  type="button"
                  onClick={() => { navigate('/admin/references'); setShowQuickActions(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-subtle)] flex items-center gap-2"
                >
                  <ExternalLink size={14} className="text-emerald-500" /> Referral Rewards
                </button>
                <button
                  type="button"
                  onClick={() => { navigate('/admin/builders'); setShowQuickActions(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-subtle)] flex items-center gap-2"
                >
                  <Building size={14} className="text-slate-500" /> Builders & RERA
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
            className="group relative p-2 text-[var(--text-muted)] rounded-xl hover:bg-[var(--bg-muted)] hover:text-[var(--text-subtle)] transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer"
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

        {/* Theme Toggle Switch */}
        <label
          className="theme-toggle-switch flex items-center shrink-0 scale-90 md:scale-100 transition-transform"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <input
            className="toggle-checkbox"
            type="checkbox"
            checked={theme === 'dark'}
            onChange={toggleTheme}
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
        </label>
      </div>
    </header>
  );
};

export default Header;
