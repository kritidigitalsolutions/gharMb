import React, { useState } from 'react';
import { Save, Info, Building, Mail, Hash } from 'lucide-react';

const AboutSettings = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    platformName: 'GHARMB SaaS',
    version: '2.4.1',
    supportEmail: 'support@gharmb.in',
    description: 'GHARMB is a comprehensive SaaS platform designed to streamline real estate operations. It provides tools for property verification, builder RERA tracking, user directory management, and revenue analytics all in one centralized dashboard.\n\nOur mission is to bring transparency and efficiency to the real estate ecosystem by automating compliance checks and providing actionable insights for administrators.'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      alert('About page content updated successfully!');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Edit About Page</h2>
          <p className="text-xs text-slate-500 mt-1">Manage platform details visible to users and clients.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white text-xs font-bold rounded-xl shadow-md shadow-brand/20 transition-all disabled:opacity-70"
        >
          <Save size={14} />
          {isSaving ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Basic Settings */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Info size={16} className="text-brand" /> Core Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Platform Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 text-slate-400" size={14} />
                  <input
                    type="text"
                    name="platformName"
                    value={formData.platformName}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand/50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Current Version</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-2.5 text-slate-400" size={14} />
                  <input
                    type="text"
                    name="version"
                    value={formData.version}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand/50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Support Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-slate-400" size={14} />
                  <input
                    type="email"
                    name="supportEmail"
                    value={formData.supportEmail}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand/50 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Main Content Editor */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm h-full flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 mb-4">About Description</h3>
            <p className="text-xs text-slate-500 mb-4">This content will be displayed on the public 'About Us' section.</p>
            
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={12}
              className="w-full flex-1 p-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand/50 focus:bg-white transition-all resize-none custom-scrollbar"
              placeholder="Write about your platform here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutSettings;