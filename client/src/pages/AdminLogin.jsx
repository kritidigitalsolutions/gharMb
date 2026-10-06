import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import API from '../api/api';
import { signInWithFirebaseEmail } from '../config/firebase';

const AdminLogin = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const response = await API.post('/admin/auth/login', { 
        email: email.trim().toLowerCase(), 
        password 
      });

      const data = response.data;
      const token = data?.token || data?.data?.token;
      const admin = data?.admin || data?.data?.admin;

      if (token) {
        localStorage.setItem('adminToken', token);
        const refreshToken = data?.refreshToken || data?.data?.refreshToken;
        if (refreshToken) {
          localStorage.setItem('adminRefreshToken', refreshToken);
        }
        if (admin) {
          localStorage.setItem('admin', JSON.stringify(admin));
          localStorage.setItem('adminUser', JSON.stringify(admin));
        }
        setSuccessMessage('Administrator authentication verified! Redirecting...');
        if (onLoginSuccess) onLoginSuccess(admin, token);
        setTimeout(() => {
          navigate('/admin');
        }, 300);
      } else {
        setErrorMessage(data?.message || 'Invalid email or password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Unable to connect to server. Check server or credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background ambient lighting gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/10 border border-white/20 p-3 mb-4 shadow-2xl shadow-brand/20 overflow-hidden">
            <img src="/favicon.png" alt="GHARMB Logo" className="w-full h-full object-contain" />
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
            <div className="mb-5 px-3.5 py-2.5 bg-rose-500/[0.08] border border-rose-500/25 rounded-xl text-rose-200/90 text-xs font-medium flex items-start gap-2.5 text-left">
              <AlertCircle size={15} className="shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 px-3.5 py-2.5 bg-emerald-500/[0.08] border border-emerald-500/25 rounded-xl text-emerald-200/90 text-xs font-medium flex items-start gap-2.5 text-left">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-400 mt-0.5" />
              <span className="leading-snug">{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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
                  placeholder="name@company.com"
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
              disabled={isLoading || isFirebaseLoading}
              className="w-full py-3 px-4 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
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

          <div className="mt-5 pt-4 border-t border-slate-700/50 flex items-center justify-center">
            <span className="text-[10px] text-slate-400 font-medium">Secured Administrative Access</span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-center text-slate-500 mt-6">
          GHARMB Real Estate Infrastructure Platform &copy; {new Date().getFullYear()}. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
