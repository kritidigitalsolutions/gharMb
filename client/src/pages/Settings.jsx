import React, { useState, useEffect } from 'react';
import {
  User,
  Save,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Send,
  RefreshCw
} from 'lucide-react';
import API from '../api/api';
import { sendFirebasePasswordReset } from '../config/firebase';

const Settings = () => {
  // Real Admin Profile loaded from /api/admin/auth/me
  const [admin, setAdmin] = useState(() => {
    try {
      const raw = localStorage.getItem('adminUser') || localStorage.getItem('admin');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Unified Form Data matching the Image 2 layout
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Toggle password visibilities
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email Reset Link State
  const [isSendingResetLink, setIsSendingResetLink] = useState(false);
  const [resetLinkMessage, setResetLinkMessage] = useState('');
  const [resetLinkError, setResetLinkError] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Fetch real profile from backend API
  const fetchProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const res = await API.get('/admin/auth/me');
      const profileData = res?.data?.admin || res?.data?.data;
      if (profileData) {
        setAdmin(profileData);
        localStorage.setItem('adminUser', JSON.stringify(profileData));
        localStorage.setItem('admin', JSON.stringify(profileData));
        setFormData(prev => ({
          ...prev,
          name: profileData.name || 'Admin',
          email: profileData.email || ''
        }));
      }
    } catch (err) {
      console.warn('Could not refresh admin profile:', err?.response?.data?.message || err?.message);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Cooldown countdown timer for password reset link
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Unified Save Changes Handler
  const handleSaveChanges = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const { name, email, currentPassword, newPassword, confirmPassword } = formData;

    // Validate password change if user typed a new password
    if (newPassword) {
      if (newPassword.length < 6) {
        setErrorMessage('New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('New password and confirmation password do not match.');
        return;
      }
      if (!currentPassword) {
        setErrorMessage('Please enter your current password to authorize this security update.');
        return;
      }
    }

    // Validate email change if altered
    const currentEmail = (admin?.email || '').trim().toLowerCase();
    const targetEmail = (email || '').trim().toLowerCase();
    if (targetEmail && targetEmail !== currentEmail && !currentPassword) {
      setErrorMessage('Please enter your current password to authorize email address change.');
      return;
    }

    setIsSaving(true);

    try {
      const res = await API.put('/admin/auth/profile', {
        name: (name || '').trim(),
        email: targetEmail,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined
      });

      const updatedAdmin = res?.data?.admin || res?.data?.data?.admin;
      const newToken = res?.data?.token || res?.data?.accessToken;

      if (updatedAdmin) {
        setAdmin(updatedAdmin);
        localStorage.setItem('adminUser', JSON.stringify(updatedAdmin));
        localStorage.setItem('admin', JSON.stringify(updatedAdmin));
      }

      if (newToken) {
        localStorage.setItem('adminToken', newToken);
      }

      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      setSuccessMessage(res?.data?.message || 'Settings saved successfully!');
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save settings.';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Send Password Reset Email Link
  const handleSendResetLink = async () => {
    const targetEmail = admin?.email || formData.email;
    if (!targetEmail) {
      setResetLinkError('No registered admin email found.');
      return;
    }

    setResetLinkError('');
    setResetLinkMessage('');
    setIsSendingResetLink(true);

    try {
      const fbResult = await sendFirebasePasswordReset(targetEmail);

      try {
        await API.post('/admin/auth/send-password-reset-link', { email: targetEmail });
      } catch (_) {}

      if (fbResult && fbResult.success) {
        setCountdown(60);
        setResetLinkMessage(`Password reset link sent to ${targetEmail}. Please check your inbox or spam folder.`);
      } else {
        setResetLinkError(fbResult?.error || 'Failed to send reset email.');
      }
    } catch (err) {
      setResetLinkError(err.message || 'Error sending password reset email.');
    } finally {
      setIsSendingResetLink(false);
    }
  };

  return (
    <div className="space-y-5 pb-10 w-full">
      
      {/* ── Top Header Toolbar matching Core System ── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
            Settings
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 font-normal">
            Configure your platform preferences
          </p>
        </div>

        {/* Save Changes Button */}
        <button
          type="button"
          onClick={handleSaveChanges}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand hover:bg-brand-dark text-white font-semibold text-xs shadow-2xs transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:pointer-events-none active:scale-95"
        >
          {isSaving ? (
            <>
              <Loader2 size={13} className="animate-spin text-white" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={13} />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {/* ── Alert Notices ── */}
      {successMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center gap-2.5 text-xs font-medium text-emerald-400">
          <CheckCircle2 size={15} className="shrink-0" />
          <span className="flex-1">{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-emerald-400 hover:text-emerald-300 text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-center gap-2.5 text-xs font-medium text-rose-400">
          <AlertCircle size={15} className="shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-rose-400 hover:text-rose-300 text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Main Unified Settings Card ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 sm:p-5 shadow-2xs">
        
        {/* Card Header matching Image 2 */}
        <div className="flex items-center gap-2.5 pb-3.5 border-b border-[var(--border)]">
          <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0 border border-brand/20">
            <User size={15} />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] tracking-tight">
              Admin Account & Credentials
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Update your login profile details and system passwords
            </p>
          </div>
        </div>

        {/* ── Form Fields List ── */}
        <form onSubmit={handleSaveChanges} className="divide-y divide-[var(--border)]/70">
          
          {/* Row 1: Admin Full Name */}
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6">
            <div className="sm:w-1/2">
              <label htmlFor="name-input" className="block text-xs font-semibold text-[var(--text-primary)]">
                Admin Full Name
              </label>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Your display name on the platform dashboard
              </p>
            </div>
            <div className="sm:w-1/2 sm:flex sm:justify-end">
              <input
                id="name-input"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Admin"
                className="w-full sm:max-w-[280px] py-1.5 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/50 text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)]/50 focus:border-brand focus:outline-hidden transition-all duration-150 font-medium"
              />
            </div>
          </div>

          {/* Row 2: Admin Email */}
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6">
            <div className="sm:w-1/2">
              <label htmlFor="email-input" className="block text-xs font-semibold text-[var(--text-primary)]">
                Admin Email
              </label>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Used for login and administrative alerts
              </p>
            </div>
            <div className="sm:w-1/2 sm:flex sm:justify-end">
              <input
                id="email-input"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@gharmb.com"
                className="w-full sm:max-w-[280px] py-1.5 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/50 text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)]/50 focus:border-brand focus:outline-hidden transition-all duration-150 font-medium"
              />
            </div>
          </div>

          {/* Row 3: Current Password */}
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6">
            <div className="sm:w-1/2">
              <label htmlFor="current-pw-input" className="block text-xs font-semibold text-[var(--text-primary)]">
                Current Password
              </label>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Enter your current password to verify security updates
              </p>
            </div>
            <div className="sm:w-1/2 sm:flex sm:justify-end">
              <div className="relative w-full sm:max-w-[280px]">
                <input
                  id="current-pw-input"
                  type={showCurrentPassword ? "text" : "password"}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full py-1.5 pl-3 pr-8 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/50 text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)]/50 focus:border-brand focus:outline-hidden transition-all duration-150 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 rounded transition-colors cursor-pointer"
                  title={showCurrentPassword ? "Hide password" : "Show password"}
                >
                  {showCurrentPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
          </div>

          {/* Row 4: New Password */}
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6">
            <div className="sm:w-1/2">
              <label htmlFor="new-pw-input" className="block text-xs font-semibold text-[var(--text-primary)]">
                New Password
              </label>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                At least 6 characters long with numbers/letters
              </p>
            </div>
            <div className="sm:w-1/2 sm:flex sm:justify-end">
              <div className="relative w-full sm:max-w-[280px]">
                <input
                  id="new-pw-input"
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="New password"
                  className="w-full py-1.5 pl-3 pr-8 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/50 text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)]/50 focus:border-brand focus:outline-hidden transition-all duration-150 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 rounded transition-colors cursor-pointer"
                  title={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
          </div>

          {/* Row 5: Confirm New Password */}
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6">
            <div className="sm:w-1/2">
              <label htmlFor="confirm-pw-input" className="block text-xs font-semibold text-[var(--text-primary)]">
                Confirm New Password
              </label>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Re-type your new password to prevent typos
              </p>
            </div>
            <div className="sm:w-1/2 sm:flex sm:justify-end">
              <div className="relative w-full sm:max-w-[280px]">
                <input
                  id="confirm-pw-input"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  className="w-full py-1.5 pl-3 pr-8 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/50 text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)]/50 focus:border-brand focus:outline-hidden transition-all duration-150 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 rounded transition-colors cursor-pointer"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
          </div>

        </form>

        {/* ── Discreet Password Reset Email Row ── */}
        <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <span className="font-semibold text-xs text-[var(--text-primary)]">Forgot or prefer email reset?</span>
            <p className="text-[11px] text-[var(--text-muted)]">
              Receive a secure password reset link directly in your admin inbox.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSendResetLink}
            disabled={isSendingResetLink || countdown > 0}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]/60 hover:bg-[var(--bg-muted)] text-[var(--text-primary)] hover:text-brand font-medium text-xs transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          >
            {isSendingResetLink ? (
              <>
                <Loader2 size={11} className="animate-spin" />
                <span>Sending...</span>
              </>
            ) : countdown > 0 ? (
              <span>Resend in {countdown}s</span>
            ) : (
              <>
                <Send size={11} className="text-brand" />
                <span>Send Reset Link</span>
              </>
            )}
          </button>
        </div>

        {resetLinkMessage && (
          <p className="mt-2 text-xs text-emerald-400 font-medium">
            {resetLinkMessage}
          </p>
        )}
        {resetLinkError && (
          <p className="mt-2 text-xs text-rose-400 font-medium">
            {resetLinkError}
          </p>
        )}

      </div>
    </div>
  );
};

export default Settings;
