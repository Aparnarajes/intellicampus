import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Lock, CheckCircle, AlertCircle, ShieldCheck,
  Eye, EyeOff, ArrowRight, Sparkles, Key
} from 'lucide-react';
import api from '../../services/api';

/**
 * SetupPassword — Finalize Account Setup
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Token Verification: Validates the 15-minute secure token.
 * 2. New Password Setting: Enforces strong password rules.
 * 3. Finalization: Activates the user account for normal login.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SetupPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSetup = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) return setError('Invalid setup link. Please request a new one.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (!/(?=.*[0-9])(?=.*[!@#$%^&*])/.test(password)) {
      return setError('Password must include at least one number and one special character.');
    }

    setLoading(true);
    try {
      await api.post('/auth/setup-password', { token, password, confirmPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 bg-grid page-transition relative overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-primary-500/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />

      <div className="w-full max-w-xl relative">
        <div className="glass-card p-8 lg:p-12 relative z-10 overflow-hidden backdrop-blur-xl border border-white/5 shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-primary-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
                <Sparkles size={12} />
                <span>Account Finalization</span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                Secure <span className="text-primary-400">Setup</span>
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Your account is ready. Please set your password to continue.
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
              <Key size={28} className="text-white" />
            </div>
          </div>

          {/* ── Error & Success ── */}
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto scale-up">
                <CheckCircle size={32} className="text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">Password Set Successfully</h3>
                <p className="text-slate-400 text-sm">
                  Your academic account is now active. Redirecting you to login...
                </p>
              </div>
              <div className="pt-4">
                <button onClick={() => navigate('/login')} className="btn-primary w-full h-12 text-sm font-bold">
                  Go to Login Now
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSetup} className="space-y-6">
              {/* Token Display (Optional/Helper) */}
              {!token && (
                <p className="p-4 bg-rose-500/5 text-rose-400 text-xs rounded-xl font-medium">
                  Alert: No authentication token found in the URL. Ensure you use the full link from the email.
                </p>
              )}

              {/* Secure Password Requirements */}
              <div className="p-4 bg-primary-500/5 rounded-2xl border border-primary-500/10 space-y-2 mb-4">
                <h4 className="text-[10px] font-black uppercase text-primary-400 tracking-widest">Requirements</h4>
                <div className="grid grid-cols-2 gap-2">
                   <div className={`flex items-center gap-2 text-[10px] ${password.length >= 8 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle size={10} /> 8+ Characters
                  </div>
                  <div className={`flex items-center gap-2 text-[10px] ${/[0-9]/.test(password) ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle size={10} /> One Number
                  </div>
                  <div className={`flex items-center gap-2 text-[10px] ${/[!@#$%^&*]/.test(password) ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle size={10} /> Special Char
                  </div>
                  <div className={`flex items-center gap-2 text-[10px] ${password && password === confirmPassword ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle size={10} /> Passwords Match
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set a strong password"
                    className="input-field pl-12 pr-12 h-14 text-sm"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Confirm New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={18} />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="input-field pl-12 h-14 text-sm"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading || !token}
                className="btn-primary w-full h-14 text-sm font-bold group shadow-xl shadow-primary-500/20 active:scale-95 transition-all mt-4">
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Confirm & Activate Account</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        {/* Footer Security Badge */}
        <div className="flex items-center justify-center gap-2 mt-6 text-slate-600 text-xs">
          <ShieldCheck size={14} />
          <span>Secured by IntelliCampus Identity Protection</span>
        </div>
      </div>
    </div>
  );
};

export default SetupPassword;
