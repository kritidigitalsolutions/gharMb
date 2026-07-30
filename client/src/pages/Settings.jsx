import React, { useState, useEffect } from 'react';
import {
  Save,
  Shield,
  Mail,
  Phone,
  Coins,
  Smartphone,
  Server,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

const Settings = () => {
  const [config, setConfig] = useState({
    adminEmail: 'rishika.chaudhary@gharmb.com',
    signupBonus: '100',
    referralCredit: '50',
    androidVersion: '1.0.4',
    iosVersion: '1.0.3',
    androidUrl: 'https://play.google.com/store/apps/details?id=com.gharmb',
    iosUrl: 'https://apps.apple.com/app/gharmb',
    forceUpdate: true,
    twilioSid: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    twilioToken: '••••••••••••••••••••••••••••••••',
    twilioPhone: '+14155552671',
    smtpServer: 'smtp.gmail.com',
    smtpPort: '587',
    smtpEmail: 'noreply@gharmb.com',
    maintenanceMode: false,
    announcement: 'System maintenance scheduled for next Sunday at 02:00 AM IST.'
  });

  const [showToast, setShowToast] = useState(false);

  // Load from local storage
  useEffect(() => {
    const savedSettings = localStorage.getItem('gharmb_settings');
    if (savedSettings) {
      try {
        setConfig(JSON.parse(savedSettings));
      } catch (err) {
        console.error('Error loading settings from localStorage:', err);
      }
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('gharmb_settings', JSON.stringify(config));
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-800 text-emerald-300 py-3.5 px-6 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up">
          <CheckCircle2 className="text-emerald-400 shrink-0" size={18} />
          <div className="text-xs">
            <p className="font-extrabold text-white">Configurations Saved</p>
            <p className="text-[10px] text-emerald-400/90">SaaS settings written to localStorage persistence.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Header toolbar */}
        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">System Settings</h3>
            <p className="text-xs text-[var(--text-muted)]">Configure global parameters, verification engines, wallets, and platform updates</p>
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto py-2.5 px-4 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-brand/10 cursor-pointer"
          >
            <Save size={14} /> Save Configuration
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Roles & Permissions (SaaS Admin Profile) */}
          <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4">
            <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-muted)] pb-2">
              <Shield size={16} className="text-brand shrink-0" />
              <span>Roles & Admin Credentials</span>
            </h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Super Admin Email</label>
                <input
                  type="email"
                  required
                  value={config.adminEmail}
                  onChange={(e) => setConfig({ ...config, adminEmail: e.target.value })}
                  className="w-full p-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-brand/40"
                />
              </div>
            </div>
          </div>

          {/* Referral & Coins settings */}
          <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4">
            <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-muted)] pb-2">
              <Coins size={16} className="text-brand shrink-0" />
              <span>Wallet Reward Rules</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase">Signup Bonus (Coins)</label>
                <input
                  type="number"
                  required
                  value={config.signupBonus}
                  onChange={(e) => setConfig({ ...config, signupBonus: e.target.value })}
                  className="w-full p-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-brand/40"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase">Referral Credit (Coins)</label>
                <input
                  type="number"
                  required
                  value={config.referralCredit}
                  onChange={(e) => setConfig({ ...config, referralCredit: e.target.value })}
                  className="w-full p-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-brand/40"
                />
              </div>
            </div>
          </div>

          {/* App Version control (Force updates) */}
          {/*
          <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4">
            <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-muted)] pb-2">
              <Smartphone size={16} className="text-brand shrink-0" />
              <span>App Version Management</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase">Min Android Version</label>
                <input
                  type="text"
                  required
                  value={config.androidVersion}
                  onChange={(e) => setConfig({ ...config, androidVersion: e.target.value })}
                  className="w-full p-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-brand/40 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase">Min iOS Version</label>
                <input
                  type="text"
                  required
                  value={config.iosVersion}
                  onChange={(e) => setConfig({ ...config, iosVersion: e.target.value })}
                  className="w-full p-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-brand/40 font-mono"
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase">Android Play Store Link</label>
                <input
                  type="url"
                  required
                  value={config.androidUrl}
                  onChange={(e) => setConfig({ ...config, androidUrl: e.target.value })}
                  className="w-full p-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-brand/40 text-[var(--text-subtle)]"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase">iOS App Store Link</label>
                <input
                  type="url"
                  required
                  value={config.iosUrl}
                  onChange={(e) => setConfig({ ...config, iosUrl: e.target.value })}
                  className="w-full p-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-brand/40 text-[var(--text-subtle)]"
                />
              </div>
              <div className="flex items-center gap-2 pt-1.5">
                <input
                  type="checkbox"
                  id="force-update"
                  checked={config.forceUpdate}
                  onChange={(e) => setConfig({ ...config, forceUpdate: e.target.checked })}
                  className="rounded border-slate-300 text-brand focus:ring-brand"
                />
                <label htmlFor="force-update" className="font-semibold text-[var(--text-subtle)] select-none cursor-pointer">
                  Force upgrade users below target builds
                </label>
              </div>
            </div>
          </div>
          */}

          {/* Twilio SMS API integrations */}
          {/*
          <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4">
            <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-muted)] pb-2">
              <Phone size={16} className="text-brand shrink-0" />
              <span>Twilio SMS Gateway Configuration</span>
            </h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase">Twilio Account SID</label>
                <input
                  type="text"
                  required
                  value={config.twilioSid}
                  onChange={(e) => setConfig({ ...config, twilioSid: e.target.value })}
                  className="w-full p-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-brand/40 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase">Twilio Auth Token</label>
                <input
                  type="text"
                  required
                  value={config.twilioToken}
                  onChange={(e) => setConfig({ ...config, twilioToken: e.target.value })}
                  className="w-full p-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-brand/40 font-mono text-[var(--text-subtle)]"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase">Twilio Phone Number (Sender ID)</label>
                <input
                  type="text"
                  required
                  value={config.twilioPhone}
                  onChange={(e) => setConfig({ ...config, twilioPhone: e.target.value })}
                  className="w-full p-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-brand/40 font-mono"
                />
              </div>
            </div>
          </div>
          */}

          {/* SMTP Email Server configurations */}
          {/*
          <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4">
            <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-muted)] pb-2">
              <Mail size={16} className="text-brand shrink-0" />
              <span>SMTP Mail Dispatcher Configurations</span>
            </h4>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase">SMTP Server Host</label>
                  <input
                    type="text"
                    required
                    value={config.smtpServer}
                    onChange={(e) => setConfig({ ...config, smtpServer: e.target.value })}
                    className="w-full p-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-brand/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase">SMTP Port</label>
                  <input
                    type="text"
                    required
                    value={config.smtpPort}
                    onChange={(e) => setConfig({ ...config, smtpPort: e.target.value })}
                    className="w-full p-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-brand/40 font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase">System Sender Email</label>
                <input
                  type="email"
                  required
                  value={config.smtpEmail}
                  onChange={(e) => setConfig({ ...config, smtpEmail: e.target.value })}
                  className="w-full p-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-brand/40"
                />
              </div>
            </div>
          </div>
          */}

          {/* Maintenance Mode & Announcement */}
          {/*
          <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm space-y-4">
            <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-muted)] pb-2">
              <Server size={16} className="text-brand shrink-0" />
              <span>Platform Availability Settings</span>
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl">
                <div className="flex gap-2">
                  <AlertTriangle className="text-amber-500 shrink-0" size={16} />
                  <div className="space-y-0.5">
                    <p className="font-bold text-[var(--text-subtle)]">Maintenance Mode</p>
                    <p className="text-[9px] text-[var(--text-muted)]">Put Mobile client API access into offline state</p>
                  </div>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.maintenanceMode}
                    onChange={(e) => setConfig({ ...config, maintenanceMode: e.target.checked })}
                    className="sr-only peer"
                    id="maintenance-toggle"
                  />
                  <label
                    htmlFor="maintenance-toggle"
                    className="w-9 h-5 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 cursor-pointer"
                  ></label>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase">Global Announcement Text</label>
                <textarea
                  value={config.announcement}
                  onChange={(e) => setConfig({ ...config, announcement: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-brand/40 resize-none"
                  placeholder="Announce maintenance windows or platform updates..."
                />
              </div>
            </div>
          </div>
          */}
        </div>
      </form>
    </div>
  );
};

export default Settings;
