import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import API from '../api/api';
import { signInWithFirebaseGoogle } from '../config/firebase';

const AdminLogin = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const response = await API.post('/admin/auth/login', { email, password });
      const data = response.data;
      const token = data?.token || data?.data?.token;
      const admin = data?.admin || data?.data?.admin;

      if (token) {
        localStorage.setItem('adminToken', token);
        if (admin) {
          localStorage.setItem('admin', JSON.stringify(admin));
          localStorage.setItem('adminUser', JSON.stringify(admin));
        }
        if (onLoginSuccess) onLoginSuccess(admin, token);
        navigate('/admin');
      } else {
        setErrorMessage(data?.message || 'Invalid email or password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      // Fallback for local simulation if backend API is not connected
      if (email === 'admin@gmail.com' && password === 'admin123') {
        const mockAdmin = { name: 'Super Admin', email: 'admin@gmail.com', role: 'ADMIN' };
        localStorage.setItem('adminToken', 'mock_admin_token_2026');
        localStorage.setItem('adminUser', JSON.stringify(mockAdmin));
        localStorage.setItem('admin', JSON.stringify(mockAdmin));
        if (onLoginSuccess) onLoginSuccess(mockAdmin, 'mock_admin_token_2026');
        navigate('/admin');
      } else {
        setErrorMessage(err.response?.data?.message || 'Unable to connect to server. Check server or credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFirebaseGoogleLogin = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsFirebaseLoading(true);

    try {
      const fbResult = await signInWithFirebaseGoogle();

      if (!fbResult.success) {
        if (fbResult.code !== 'auth/popup-closed-by-user' && fbResult.code !== 'auth/cancelled-popup-request') {
          setErrorMessage(fbResult.error || 'Firebase authentication failed.');
        }
        return;
      }

      const response = await API.post('/admin/auth/google', {
        idToken: fbResult.idToken,
        email: fbResult.email,
        name: fbResult.name,
        photoUrl: fbResult.photoUrl,
      });

      const data = response.data;
      const token = data?.token || data?.data?.token;
      const admin = data?.admin || data?.data?.admin;

      if (token) {
        localStorage.setItem('adminToken', token);
        if (admin) {
          localStorage.setItem('admin', JSON.stringify(admin));
          localStorage.setItem('adminUser', JSON.stringify(admin));
        }
        setSuccessMessage('Firebase authentication verified! Redirecting...');
        if (onLoginSuccess) onLoginSuccess(admin, token);
        setTimeout(() => {
          navigate('/admin');
        }, 300);
      } else {
        setErrorMessage(data?.message || 'Firebase login failed on the server.');
      }
    } catch (err) {
      console.error('Firebase Admin Login Error:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Firebase login failed.');
    } finally {
      setIsFirebaseLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('admin@gmail.com');
    setPassword('admin123');
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
            <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-semibold flex items-center gap-2">
              <Shield size={16} className="shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Firebase Google Button */}
          <button
            type="button"
            onClick={handleFirebaseGoogleLogin}
            disabled={isFirebaseLoading || isLoading}
            className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 mb-5"
          >
            {isFirebaseLoading ? (
              <>
                <Loader2 size={16} className="animate-spin text-brand" />
                <span>Connecting to Firebase...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Firebase (Google)</span>
              </>
            )}
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/80"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-800 px-3 text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
                Or Sign In With Password
              </span>
            </div>
          </div>

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
                  placeholder="admin@gmail.com"
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

          {/* Quick Demo Fill button */}
          <div className="mt-5 pt-4 border-t border-slate-700/50 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDemoFill}
              className="text-[11px] font-semibold text-slate-400 hover:text-brand transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 size={13} className="text-brand" /> Auto-fill Demo Admin
            </button>
            <span className="text-[10px] text-slate-400 font-medium">Firebase Auth</span>
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
