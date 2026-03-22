import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShieldAlert, CheckCircle2, Loader2, ArrowRight, Sparkles, KeyRound } from 'lucide-react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { resetPassword, actionLoading } = useAuth();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const token = searchParams.get('token');

    const handleReset = async (e) => {
        e.preventDefault();
        
        if (!token) {
            setStatus('error');
            setMessage('Reset token is missing from the URL.');
            return;
        }

        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Passwords do not match.');
            return;
        }

        const passRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/;
        if (password.length < 8 || !passRegex.test(password)) {
            setStatus('error');
            setMessage('Password must be 8+ chars and have uppercase, number, and special character.');
            return;
        }

        setStatus('loading');
        try {
            const res = await resetPassword(token, password);
            setStatus('success');
            setMessage(res.message);
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Failed to reset password. Link might be expired.');
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-6 bg-[#020617]">
            <div className="absolute inset-0 bg-grid opacity-[0.05]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[140px]" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="premium-card p-1">
                    <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[1.85rem] p-10 lg:p-14 text-center">
                        <AnimatePresence mode="wait">
                            {status === 'success' ? (
                                <motion.div key="success" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-8">
                                    <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-900/20">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                    </div>
                                    <h1 className="text-3xl font-black text-white px-2">Key Reset Complete</h1>
                                    <p className="text-emerald-400/80 font-medium">{message}</p>
                                    <button 
                                        onClick={() => navigate('/login')}
                                        className="btn-action w-full py-4 tracking-[0.2em] font-black uppercase text-[11px]"
                                    >
                                        ESTABLISH LOGIN <ArrowRight className="w-4 h-4 ml-2" />
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div key="form" exit={{ opacity: 0, y: -20 }} className="space-y-8 text-left">
                                    <div className="space-y-4 text-center">
                                        <div className="flex justify-center">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20" />
                                                <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white border border-white/10 relative">
                                                    <Sparkles className="w-8 h-8" />
                                                </div>
                                            </div>
                                        </div>
                                        <h1 className="text-3xl font-black text-white tracking-tighter">Forge New Key</h1>
                                        <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em]">Generate a Strong Security Credentials</p>
                                    </div>

                                    <form onSubmit={handleReset} className="space-y-6 pt-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">New Access Password</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors w-5 h-5 pointer-events-none" />
                                                <input 
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    type="password" 
                                                    className="input-field pl-12 bg-black/40 border-white/5 focus:border-blue-500/50"
                                                    placeholder="••••••••"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Confirm New Key</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors w-5 h-5 pointer-events-none" />
                                                <input 
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    type="password" 
                                                    className="input-field pl-12 bg-black/40 border-white/5 focus:border-blue-500/50"
                                                    placeholder="••••••••"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {status === 'error' && (
                                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 text-xs font-bold">
                                                <ShieldAlert className="w-5 h-5 shrink-0" />
                                                {message}
                                            </div>
                                        )}

                                        <button 
                                            type="submit" 
                                            disabled={actionLoading || status === 'loading'}
                                            className="btn-action w-full py-4 tracking-[0.2em] font-black text-[11px] disabled:opacity-50"
                                        >
                                            {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : "OVERWRITE OLD CREDENTIALS"}
                                        </button>
                                        
                                        <button 
                                            type="button"
                                            onClick={() => navigate('/login')}
                                            className="w-full text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors py-2 text-center"
                                        >
                                            ABORT RECOVERY
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
