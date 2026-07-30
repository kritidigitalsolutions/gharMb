import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, Building2, CheckCircle2 } from 'lucide-react';

const AdminLogin = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      // Call Real Admin Login API
      const response = await fetch('http://localhost:5001/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.data.admin));
        if (onLoginSuccess) onLoginSuccess(data.data.admin, data.token);
        navigate('/');
      } else {
        setErrorMessage(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      // Fallback for local simulation if backend API is not connected
      if (email === 'admin@gharmb.com' && password) {
        const mockAdmin = { name: 'Super Admin', email: 'admin@gharmb.com', role: 'admin' };
        localStorage.setItem('adminToken', 'mock_admin_token_2026');
        localStorage.setItem('adminUser', JSON.stringify(mockAdmin));
        if (onLoginSuccess) onLoginSuccess(mockAdmin, 'mock_admin_token_2026');
        navigate('/');
      } else {
        setErrorMessage('Unable to connect to server. Check server or credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('admin@gharmb.com');
    setPassword('AdminPassword123!');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background ambient lighting gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 text-brand mb-4 shadow-xl shadow-brand/10">
            <Building2 size={28} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight sm:text-3xl">
            GHARMB <span className="text-brand text-xs px-2 py-0.5 bg-brand/10 border border-brand/20 rounded-md font-bold align-middle">SaaS Admin</span>
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            Sign in to access platform management & live analytics
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {errorMessage && (
            <div className="mb-6 p-3.5 bg-red-500/100/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-semibold flex items-center gap-2">
              <Shield size={16} className="shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gharmb.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Sign In to Admin Panel</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill button */}
          <div className="mt-6 pt-5 border-t border-slate-700/50 text-center">
            <button
              type="button"
              onClick={handleDemoFill}
              className="text-[11px] font-semibold text-slate-400 hover:text-brand transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 size={13} className="text-brand" /> Auto-fill Super Admin Credentials
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-center text-slate-500 mt-6">
          GHARMB Real Estate Infrastructure Platform &copy; 2026. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
