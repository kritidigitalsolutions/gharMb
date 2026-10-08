import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Info,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import API, { isTokenExpired, clearAuthSession } from "../../api/api";
import { signInWithFirebaseEmail, sendFirebasePasswordReset } from "../../config/firebase";
import AnimatedGradientBackground from "../../components/common/AnimatedGradientBackground";
import { InteractiveHoverButton } from "../../components/ui/interactive-hover-button";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionNotice, setSessionNotice] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Always force Dark Mode on the Login Page
  useEffect(() => {
    const previousTheme = localStorage.getItem('adminTheme');
    document.documentElement.classList.add('dark');
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');

    return () => {
      // Restore user's dashboard theme preference if they configured light mode
      if (previousTheme === 'light') {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('theme-dark');
        document.body.classList.add('theme-light');
      }
    };
  }, []);

  useEffect(() => {
    // Check if redirected due to expired session
    const storedMsg = sessionStorage.getItem('adminSessionMessage');
    const isExpiredUrl = location.search.includes('expired=1');
    if (storedMsg || isExpiredUrl) {
      setSessionNotice(storedMsg || 'Your admin session has expired. Please log in again to continue.');
      sessionStorage.removeItem('adminSessionMessage');
    }

    const token = localStorage.getItem('adminToken');
    if (token) {
      if (!isTokenExpired(token)) {
        navigate('/admin', { replace: true });
      } else {
        clearAuthSession();
      }
    }
  }, [navigate, location]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleForgotPassword = async () => {
    setError('');
    setSuccess('');
    const emailToReset = (formData.email || '').trim().toLowerCase();

    if (!emailToReset) {
      setError('Please enter your admin email address first, then click Forgot password.');
      return;
    }

    setResetLoading(true);
    try {
      // 1. Send via Firebase Client SDK
      const fbResult = await sendFirebasePasswordReset(emailToReset);

      if (fbResult && fbResult.success) {
        setSuccess(`Password reset email sent to ${emailToReset}. Check your inbox or spam folder.`);
      } else {
        // Fallback: Trigger backend password reset link handler
        try {
          const backendRes = await API.post('/admin/auth/forgot-password', { email: emailToReset });
          setSuccess(backendRes.data?.message || `Password reset link sent to ${emailToReset}. Please check your email.`);
        } catch (backendErr) {
          const errMsg = fbResult?.error || backendErr.response?.data?.message || 'Failed to send password reset email.';
          setError(errMsg);
        }
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Error sending password reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSessionNotice('');
    setSuccess('');
    setLoading(true);

    try {
      const cleanEmail = (formData.email || '').trim().toLowerCase();
      const password = formData.password;

      if (!cleanEmail || !password) {
        setError('Please enter both email and password.');
        setLoading(false);
        return;
      }

      // 1. Fast attempt with Firebase Email Login Service
      let firebaseToken = null;
      try {
        const fbResult = await Promise.race([
          signInWithFirebaseEmail(cleanEmail, password),
          new Promise((resolve) => setTimeout(() => resolve(null), 2000))
        ]);
        if (fbResult && fbResult.success && fbResult.idToken) {
          firebaseToken = fbResult.idToken;
        }
      } catch (fbErr) {
        console.warn("Firebase Email Login notice:", fbErr?.message || fbErr);
      }

      // 2. Strict backend verification
      const response = await API.post('/admin/auth/login', {
        email: cleanEmail,
        password,
        firebaseToken
      });

      const token = response?.data?.token || response?.data?.data?.token;
      const adminData = response?.data?.admin || response?.data?.data?.admin;

      if (token) {
        localStorage.setItem('adminToken', token);
        const refreshToken = response?.data?.refreshToken || response?.data?.data?.refreshToken;
        if (refreshToken) {
          localStorage.setItem('adminRefreshToken', refreshToken);
        }
        if (adminData) {
          localStorage.setItem('admin', JSON.stringify(adminData));
          localStorage.setItem('adminUser', JSON.stringify(adminData));
        }

        setSuccess('Authentication verified! Redirecting to workspace...');
        const destination = location.state?.from?.pathname || '/admin';
        setTimeout(() => {
          navigate(destination, { replace: true });
        }, 200);
      } else {
        setError(response?.data?.message || 'Login failed. Invalid response from server.');
      }
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || err.message || 'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{ colorScheme: 'dark' }}
      className="dark relative min-h-screen w-full flex flex-col items-center justify-center bg-[#111111] text-[#DDDDDD] p-4 sm:p-6 font-sans overflow-hidden select-none"
    >
      
      {/* ── Background Ambient Glow ── */}
      <AnimatedGradientBackground 
        startingGap={115}
        Breathing={true}
        forceDark={true}
        animationSpeed={0.025}
        breathingRange={6}
      />

      {/* ── Brand Logo & Name on Background ── */}
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mb-4 sm:mb-5 flex flex-col items-center justify-center text-center"
      >
        <img 
          src="/logo-dark.png" 
          alt="GHARMB Logo" 
          className="w-18 h-18 sm:w-20 sm:h-20 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.65)] mb-1.5" 
        />
        <h2 className="text-xl sm:text-2xl font-black tracking-wider text-white">
          GHAR<span className="text-[#FF5A3C]">MB</span>
        </h2>
      </motion.div>

      {/* ── Main Clean Animated Dark Card ── */}
      <motion.div 
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[365px] rounded-[22px] p-5 sm:p-6.5 z-10 bg-[#111111]/90 backdrop-blur-xl border border-[#444444]/80 shadow-2xl"
      >

        {/* Admin Panel Heading */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex flex-col items-center mb-3.5 text-center"
        >
          <h1 className="text-lg sm:text-xl font-black text-[#DDDDDD] tracking-tight">
            Admin Panel
          </h1>
        </motion.div>


        {/* Alert & Notice Banners */}
        <AnimatePresence mode="wait">
          {sessionNotice && (
            <motion.div 
              key="session-notice"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="mb-3 px-3 py-2 bg-blue-500/[0.08] border border-blue-500/20 rounded-xl flex items-start gap-2.5 text-left"
            >
              <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
              <span className="text-[11px] font-medium text-blue-200/90 leading-snug">{sessionNotice}</span>
            </motion.div>
          )}

          {error && (
            <motion.div 
              key="auth-error"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                x: [-3, 3, -2, 2, 0]
              }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="mb-3 px-3 py-2 bg-rose-500/[0.08] border border-rose-500/25 rounded-xl flex items-start gap-2.5 text-left"
            >
              <AlertCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
              <span className="text-[11px] font-medium text-rose-200/90 leading-snug">{error}</span>
            </motion.div>
          )}
          
          {success && (
            <motion.div 
              key="auth-success"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="mb-3 px-3 py-2 bg-emerald-500/[0.08] border border-emerald-500/25 rounded-xl flex items-start gap-2.5 text-left"
            >
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-[11px] font-medium text-emerald-200/90 leading-snug">{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email & Password Authentication Form */}
        <form onSubmit={handleLogin} className="space-y-3">
          
          {/* Email Field */}
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.3 }}
            className="group relative flex items-center rounded-xl border border-[#444444]/80 bg-[#111111] hover:border-[#888888]/60 focus-within:border-[#FF5A3C] focus-within:ring-2 focus-within:ring-[#FF5A3C]/20 transition-all duration-200 overflow-hidden"
          >
            <div className="pl-3 pr-2 text-[#888888] flex items-center pointer-events-none group-focus-within:text-[#FF5A3C] transition-colors">
              <Mail size={15} />
            </div>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              placeholder="Email"
              style={{
                colorScheme: 'dark',
                WebkitBoxShadow: '0 0 0 1000px #111111 inset',
                WebkitTextFillColor: '#DDDDDD'
              }}
              className="w-full py-2 sm:py-2.5 pr-3 bg-[#111111] text-xs sm:text-sm text-[#DDDDDD] placeholder:text-[#888888]/60 focus:outline-none font-medium"
            />
          </motion.div>

          {/* Password Field */}
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="space-y-1"
          >
            <div className="group relative flex items-center rounded-xl border border-[#444444]/80 bg-[#111111] hover:border-[#888888]/60 focus-within:border-[#FF5A3C] focus-within:ring-2 focus-within:ring-[#FF5A3C]/20 transition-all duration-200 overflow-hidden">
              <div className="pl-3 pr-2 text-[#888888] flex items-center pointer-events-none group-focus-within:text-[#FF5A3C] transition-colors">
                <Lock size={15} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                placeholder="Password"
                style={{
                  colorScheme: 'dark',
                  WebkitBoxShadow: '0 0 0 1000px #111111 inset',
                  WebkitTextFillColor: '#DDDDDD'
                }}
                className="w-full py-2 sm:py-2.5 pr-2 bg-[#111111] text-xs sm:text-sm text-[#DDDDDD] placeholder:text-[#888888]/60 focus:outline-none font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 mr-1 rounded-lg text-[#888888] hover:text-[#DDDDDD] hover:bg-[#444444]/40 transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end pr-1 pt-0.5">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading || loading}
                className="text-[11px] font-semibold text-[#FF5A3C] hover:text-[#DD543C] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
              >
                {resetLoading ? (
                  <>
                    <Loader2 size={11} className="animate-spin" />
                    <span>Sending email...</span>
                  </>
                ) : (
                  <span>Forgot password?</span>
                )}
              </button>
            </div>
          </motion.div>

          {/* Submit Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26, duration: 0.3 }}
            className="mt-4"
          >
            <InteractiveHoverButton
              type="submit"
              text="Sign In"
              loading={loading}
              loadingText="Signing in..."
              className="w-full rounded-xl py-2.5 sm:py-3 text-xs sm:text-sm font-bold"
            />
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;