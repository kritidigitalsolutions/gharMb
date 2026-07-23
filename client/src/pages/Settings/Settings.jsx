import React from 'react';
import { Settings as SettingsIcon, Save, Shield, Mail, Phone, Coins, CreditCard } from 'lucide-react';

const Settings = () => {
  return (
    <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b border-slate-50 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">System Settings</h3>
          <p className="text-xs text-slate-400">Configure email templates, SMS limits, coins criteria, and payouts</p>
        </div>
        <button
          type="button"
          onClick={() => alert('Configuration parameters saved successfully.')}
          className="py-2 px-4 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg shadow-brand/10"
        >
          <Save size={14} /> Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Auth and Admin Profile */}
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
          <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
            <Shield size={14} className="text-brand" /> Roles & Permissions
          </h4>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400">Super Admin Email</label>
            <input type="text" defaultValue="rishika.chaudhary@gharmb.com" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl" />
          </div>
        </div>

        {/* Coin Wallets Rules */}
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
          <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
            <Coins size={14} className="text-brand" /> Referral & Coins settings
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400">Signup Bonus (Coins)</label>
              <input type="number" defaultValue="100" className="w-full p-2 bg-white border border-slate-200 rounded-lg" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400">Referral Credit (Coins)</label>
              <input type="number" defaultValue="50" className="w-full p-2 bg-white border border-slate-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
