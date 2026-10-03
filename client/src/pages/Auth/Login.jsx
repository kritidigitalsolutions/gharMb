import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Info,
  ShieldCheck,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import API, { isTokenExpired, clearAuthSession } from "../../api/api";
import { signInWithFirebaseEmail } from "../../config/firebase";
import AnimatedGradientBackground from "../../components/common/AnimatedGradientBackground";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSessionNotice('');
    setSuccess('');
    setLoading(true);

    const { email, password } = formData;

    try {
      // 1. Authenticate via Firebase Email & Password
      let firebaseToken = null;
      try {
        const fbResult = await signInWithFirebaseEmail(email, password);
        if (fbResult && fbResult.success) {
          firebaseToken = fbResult.idToken;
        }
      } catch (fbErr) {
        console.warn("Firebase email auth notice:", fbErr);
      }

      // 2. Authenticate / verify session with backend
      let response;
      if (firebaseToken) {
        try {
          response = await API.post('/admin/auth/firebase', {
            idToken: firebaseToken,
            email,
            password
          });
        } catch (_) {
          // Fallback to standard admin auth endpoint if /admin/auth/firebase is not available
          response = await API.post('/admin/auth/login', {
            email,
            password
          });
        }
      } else {
        response = await API.post('/admin/auth/login', {
          email,
          password
        });
      }

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
        }, 300);
      } else {
        setError(response?.data?.message || 'Login failed. Invalid response from server.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your email and password.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setFormData({
      email: 'admin@gmail.com',
      password: 'admin123'
    });
    setError('');
  };

  return (
    <div 
      style={{ colorScheme: 'dark' }}
      className="dark relative min-h-screen w-full flex flex-col items-center justify-center bg-[#111111] text-[#DDDDDD] p-4 sm:p-6 font-sans overflow-hidden select-none"
    >
      
      {/* ── Animated Breathing Radial Gradient Background ── */}
      <AnimatedGradientBackground 
        startingGap={115}
        Breathing={true}
        forceDark={true}
        animationSpeed={0.035}
        breathingRange={8}
      />

      {/* ── Main Clean Animated Dark Card with Entrance & Floating Breathing Loop ── */}
      <motion.div 
        initial={{ opacity: 0, y: 28, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          y: [0, -6, 0],
          scale: 1,
        }}
        transition={{
          opacity: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
          scale: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
          y: {
            duration: 5,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: 0.6,
          }
        }}
        className="relative w-full max-w-[420px] rounded-[28px] p-7 sm:p-9 z-10 transition-colors duration-300 bg-[#111111]/80 backdrop-blur-xl border border-[#444444]/80 shadow-2xl"
      >

        {/* Brand Header & Clean Logo */}
        <div className="flex flex-col items-center mb-7 text-center">
          
          {/* Logo with gentle spring entrance */}
          <motion.div 
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-4"
          >
            <img 
              src="/logo.png" 
              alt="GHARMB Logo" 
              className="w-16 h-16 object-contain" 
            />
          </motion.div>

          {/* Brand Name & Pill Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="flex items-center gap-2.5"
          >
            <h1 className="text-2xl font-black text-[#DDDDDD] tracking-tight">
              GHAR<span className="text-[#FF5A3C]">MB</span>
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-[#FF5A3C]/10 text-[#FF5A3C] border border-[#FF5A3C]/30">
              Admin Portal
            </span>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.32, duration: 0.4 }}
            className="text-xs font-medium text-[#888888] mt-1.5"
          >
            Real Estate Management & Live Control System
          </motion.p>
        </div>

        {/* Animated Alert & Notice Banners */}
        <AnimatePresence mode="wait">
          {sessionNotice && (
            <motion.div 
              key="session-notice"
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="mb-5 p-3.5 bg-[#444444]/30 border border-[#444444] text-[#DDDDDD] text-xs rounded-xl flex items-center gap-2.5 font-medium overflow-hidden"
            >
              <Info size={16} className="text-[#FF5A3C] shrink-0" />
              <span>{sessionNotice}</span>
            </motion.div>
          )}

          {error && (
            <motion.div 
              key="auth-error"
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ 
                opacity: 1, 
                height: "auto", 
                y: 0,
                x: [-6, 6, -4, 4, -2, 2, 0]
              }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              transition={{ duration: 0.35 }}
              className="mb-5 p-3.5 bg-[#DD543C]/15 border border-[#DD543C]/40 text-[#DDDDDD] text-xs rounded-xl text-center font-semibold leading-relaxed flex items-center justify-center gap-2 overflow-hidden"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C] shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
          
          {success && (
            <motion.div 
              key="auth-success"
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="mb-5 p-3.5 bg-[#FF5A3C]/15 border border-[#FF5A3C]/40 text-[#DDDDDD] text-xs rounded-xl text-center font-semibold flex items-center justify-center gap-2 overflow-hidden"
            >
              <ShieldCheck size={16} className="text-[#FF5A3C] shrink-0" />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email & Password Authentication Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Email Field */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.4 }}
            className="space-y-1.5"
          >
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#888888] ml-1">
              Admin Email Address
            </label>
            <div className="group relative flex items-center rounded-xl border border-[#444444]/80 bg-[#111111] hover:border-[#888888]/60 focus-within:border-[#FF5A3C] focus-within:ring-2 focus-within:ring-[#FF5A3C]/20 transition-all duration-200 overflow-hidden">
              <div className="pl-3.5 pr-2.5 text-[#888888] flex items-center pointer-events-none group-focus-within:text-[#FF5A3C] transition-colors">
                <Mail size={16} />
              </div>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                placeholder="admin@gmail.com"
                style={{
                  colorScheme: 'dark',
                  WebkitBoxShadow: '0 0 0 1000px #111111 inset',
                  WebkitTextFillColor: '#DDDDDD'
                }}
                className="w-full py-2.5 sm:py-3 pr-3.5 bg-[#111111] text-xs sm:text-sm text-[#DDDDDD] placeholder:text-[#888888]/50 focus:outline-none font-medium"
              />
            </div>
          </motion.div>

          {/* Password Field */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            className="space-y-1.5"
          >
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#888888] ml-1">
              Password
            </label>
            <div className="group relative flex items-center rounded-xl border border-[#444444]/80 bg-[#111111] hover:border-[#888888]/60 focus-within:border-[#FF5A3C] focus-within:ring-2 focus-within:ring-[#FF5A3C]/20 transition-all duration-200 overflow-hidden">
              <div className="pl-3.5 pr-2.5 text-[#888888] flex items-center pointer-events-none group-focus-within:text-[#FF5A3C] transition-colors">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  colorScheme: 'dark',
                  WebkitBoxShadow: '0 0 0 1000px #111111 inset',
                  WebkitTextFillColor: '#DDDDDD'
                }}
                className="w-full py-2.5 sm:py-3 pr-2 bg-[#111111] text-xs sm:text-sm text-[#DDDDDD] placeholder:text-[#888888]/50 focus:outline-none font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-2 mr-1 rounded-lg text-[#888888] hover:text-[#DDDDDD] hover:bg-[#444444]/40 transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </motion.div>

          {/* Submit Action Button with interactive hover & tap physics */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.52, duration: 0.4 }}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#FF5A3C] hover:bg-[#DD543C] text-white font-bold rounded-xl transition-all duration-150 disabled:opacity-60 disabled:pointer-events-none mt-5 cursor-pointer text-xs sm:text-sm tracking-wide shadow-xs hover:shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin text-white" />
                <span>Authenticating Session...</span>
              </>
            ) : (
              <>
                <span>Sign In with Firebase</span>
                <ArrowRight size={15} className="transition-transform duration-200 hover:translate-x-0.5" />
              </>
            )}
          </motion.button>
        </form>

        {/* Demo Credentials Quick Fill & Badge */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-6 pt-4 border-t border-[#444444]/60 flex items-center justify-between gap-2"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={handleDemoFill}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#888888] hover:text-[#DDDDDD] bg-[#444444]/30 hover:bg-[#444444]/60 border border-[#444444] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Sparkles size={12} className="text-[#FF5A3C] shrink-0" />
            <span>Auto-fill Demo</span>
          </motion.button>
          
          <div className="flex items-center gap-1.5 text-[10px] text-[#888888] font-semibold">
            <ShieldCheck size={13} className="text-[#FF5A3C] shrink-0" />
            <span>Firebase Protected</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;