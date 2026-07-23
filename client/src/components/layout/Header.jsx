import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  CheckSquare,
  MessageSquare,
  Plus,
  Moon,
  Sun,
  Mail,
  Zap,
  Download,
  ShieldCheck
} from 'lucide-react';

const Header = ({ toggleSidebar, title }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const mockNotifications = [
    { id: 1, title: 'RERA License Pending', desc: 'Tata Developers submitted a new license key.', time: '5m ago', color: 'bg-orange-50 text-brand' },
    { id: 2, title: 'Escrow Released', desc: '₹1,00,000 released for Project DLF Phase 2.', time: '1h ago', color: 'bg-green-50 text-green-600' },
  ];

  const mockMessages = [
    { id: 1, sender: 'Aaditya Sen', text: 'Hey, I want to book a visit for the DLF Skycourt site...', time: '12m ago', read: false },
    { id: 2, sender: 'Radha Realties', text: 'Can you please check why my listing is rejected?', time: '2h ago', read: true },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white border-b border-slate-100 shrink-0">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 md:hidden transition-colors"
        >
          <Menu size={18} />
        </button>
        <h1 className="text-sm font-bold text-slate-800 tracking-tight md:text-base">
          {title || 'Overview'}
        </h1>
      </div>

      {/* Action triggers */}
      <div className="flex items-center gap-3">
        {/* Quick Actions Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowQuickActions(!showQuickActions);
              setShowNotifications(false);
              setShowMessages(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-[10px] font-extrabold shadow-md shadow-brand/10 transition-all cursor-pointer"
          >
            <Plus size={12} /> Quick Actions
          </button>

          {showQuickActions && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowQuickActions(false)}></div>
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 overflow-hidden py-1">
                <button
                  type="button"
                  onClick={() => { alert('Opening listing editor...'); setShowQuickActions(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2"
                >
                  <Zap size={14} className="text-brand" /> Add New Property
                </button>
                <button
                  type="button"
                  onClick={() => { alert('Registering builder form...'); setShowQuickActions(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2"
                >
                  <Plus size={14} className="text-brand" /> Register Builder
                </button>
                <button
                  type="button"
                  onClick={() => { alert('Generating report summary...'); setShowQuickActions(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2"
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
            className="w-48 lg:w-64 pl-9 pr-4 py-1.5 text-[11px] bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-brand/40 focus:bg-white transition-all"
          />
        </div>

        {/* Theme Switcher Toggle */}
        <button
          type="button"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 text-slate-400 rounded-xl hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun size={16} className="text-yellow-500" /> : <Moon size={16} />}
        </button>

        {/* Messages inbox dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowMessages(!showMessages);
              setShowNotifications(false);
              setShowQuickActions(false);
            }}
            className="relative p-2 text-slate-400 rounded-xl hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full border border-white"></span>
            <Mail size={16} />
          </button>

          {showMessages && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMessages(false)}></div>
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                  <span className="font-bold text-xs text-slate-800">Messages Inbox</span>
                  <span className="text-[9px] font-extrabold text-brand bg-brand-light px-1.5 py-0.5 rounded-full">2 Unread</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {mockMessages.map((msg) => (
                    <div key={msg.id} className="p-3 hover:bg-slate-50 transition-colors cursor-pointer space-y-1">
                      <div className="flex justify-between">
                        <span className="font-bold text-[11px] text-slate-800">{msg.sender}</span>
                        <span className="text-[9px] text-slate-400">{msg.time}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-snug">{msg.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowMessages(false);
              setShowQuickActions(false);
            }}
            className="relative p-2 text-slate-400 rounded-xl hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full border border-white"></span>
            <Bell size={16} />
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)}></div>
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                  <span className="font-bold text-xs text-slate-800">Alerts & Logs</span>
                  <button className="text-[9px] font-bold text-brand hover:underline">Clear</button>
                </div>
                <div className="divide-y divide-slate-50">
                  {mockNotifications.map((notif) => (
                    <div key={notif.id} className="p-3 hover:bg-slate-50 transition-colors cursor-pointer flex gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${notif.color}`}>
                        <CheckSquare size={14} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-[11px] text-slate-800 leading-tight">{notif.title}</p>
                        <p className="text-[10px] text-slate-500 leading-snug">{notif.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
