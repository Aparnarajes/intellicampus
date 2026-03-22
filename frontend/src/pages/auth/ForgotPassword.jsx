import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, KeyRound, Loader2, ArrowLeft, ArrowRight, MoveLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ForgotPassword = () => {
    const { forgotPassword, actionLoading } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        try {
            const res = await forgotPassword(email);
            setStatus('success');
            setMessage(res.message);
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Failed to send reset link.');
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-6 bg-[#020617]">
            <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-[0.05]" />
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-sky-600/10 rounded-full blur-[100px]" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="premium-card p-1">
                    <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[1.85rem] p-8 lg:p-12 text-center">
                        <AnimatePresence mode="wait">
                            {status === 'success' ? (
                                <motion.div 
                                    key="success"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-8"
                                >
                                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                    </div>
                                    <h1 className="text-3xl font-black text-white">Reset Dispatched</h1>
                                    <p className="text-slate-400 font-medium leading-relaxed">{message}</p>
                                    <button 
                                        onClick={() => navigate('/login')}
                                        className="btn-action w-full py-4 tracking-[0.2em] font-black"
                                    >
                                        BACK TO LOGIN <ArrowRight className="w-4 h-4 ml-2" />
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div key="form" exit={{ opacity: 0, y: -20 }} className="space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex justify-center">
                                            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-xl shadow-blue-900/40">
                                                <KeyRound className="w-8 h-8" />
                                            </div>
                                        </div>
                                        <h1 className="text-3xl font-black text-white tracking-tight">Recover Access</h1>
                                        <p className="text-slate-400 text-sm font-medium">Lost your security key? Enter your college email and we'll dispatch a recovery link.</p>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-6 text-left">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Endpoint Identity</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                                                <input 
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    type="email" 
                                                    className="input-field pl-12 bg-black/40 border-white/5 focus:border-blue-500/50"
                                                    placeholder="university@email.edu"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {status === 'error' && (
                                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 text-sm font-bold">
                                                <AlertCircle className="w-5 h-5 shrink-0" />
                                                {message}
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            <button 
                                                type="submit" 
                                                disabled={actionLoading}
                                                className="btn-action w-full py-4 tracking-[0.2em] font-black disabled:opacity-50"
                                            >
                                                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : "DISPATCH RECOVERY LINK"}
                                            </button>
                                            
                                            <button 
                                                type="button"
                                                onClick={() => navigate('/login')}
                                                className="w-full flex items-center justify-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors py-2"
                                            >
                                                <MoveLeft className="w-4 h-4" /> Wait, I remember it!
                                            </button>
                                        </div>
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

export default ForgotPassword;
