import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, Loader2, House, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { verifyEmail, resendVerification, actionLoading } = useAuth();

    const [status, setStatus] = useState('verifying'); // verifying, success, error, resend
    const [message, setMessage] = useState('');
    const [resendEmail, setResendEmail] = useState('');

    const token = searchParams.get('token');

    useEffect(() => {
        if (token) {
            handleVerify();
        } else {
            setStatus('resend');
        }
    }, [token]);

    const handleVerify = async () => {
        try {
            const res = await verifyEmail(token);
            if (res.setupRequired) {
                // First-time setup: redirect to password setup with the same token
                setStatus('success');
                setMessage('Email verified! Redirecting you to set your password...');
                setTimeout(() => navigate(`/setup-password?token=${token}`), 2000);
            } else {
                setStatus('success');
                setMessage(res.message);
            }
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Verification failed. Link might be expired.');
        }
    };

    const handleResend = async (e) => {
        e.preventDefault();
        if (!resendEmail) return;
        try {
            await resendVerification(resendEmail);
            setMessage('A new verification email has been sent. Please check your inbox.');
            setStatus('success');
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to resend. Try again.');
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-6 bg-[#020617]">
            <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-[0.05]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[160px]" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg relative z-10"
            >
                <div className="premium-card p-1">
                    <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[1.85rem] p-10 lg:p-14 text-center">
                        {status === 'verifying' && (
                            <div className="space-y-6">
                                <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto" />
                                <h1 className="text-3xl font-black text-white">Verifying Identity</h1>
                                <p className="text-slate-400">Please wait while we establish your security clearance...</p>
                            </div>
                        )}

                        {status === 'success' && (
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-8">
                                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                </div>
                                <h1 className="text-3xl font-black text-white leading-tight">Identity Confirmed</h1>
                                <p className="text-emerald-400/80 font-medium px-4">{message}</p>
                                <div className="pt-4 space-y-4">
                                    <button 
                                        onClick={() => navigate('/login')}
                                        className="btn-action w-full py-4 uppercase tracking-[0.2em] font-black"
                                    >
                                        PROCEED TO LOGIN <ArrowRight className="w-4 h-4 ml-2" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {status === 'error' && (
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-8">
                                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                                    <AlertCircle className="w-10 h-10 text-red-500" />
                                </div>
                                <h1 className="text-3xl font-black text-white leading-tight">Link Expired or Invalid</h1>
                                <p className="text-slate-400 font-medium">{message}</p>
                                <button 
                                    onClick={() => setStatus('resend')}
                                    className="text-blue-500 hover:text-blue-400 font-bold uppercase tracking-widest text-sm underline underline-offset-8"
                                >
                                    GET A NEW LINK
                                </button>
                                <div className="pt-6">
                                    <Link to="/login" className="text-slate-500 text-sm font-bold flex items-center justify-center gap-2 hover:text-white transition-colors uppercase tracking-widest">
                                        <House className="w-4 h-4" /> Back to Dashboard
                                    </Link>
                                </div>
                            </motion.div>
                        )}

                        {status === 'resend' && (
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-8">
                                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
                                    <Mail className="w-10 h-10 text-blue-500" />
                                </div>
                                <h1 className="text-3xl font-black text-white">Resend Verification</h1>
                                <p className="text-slate-400">Enter your college email address to receive a fresh verification link.</p>
                                <form onSubmit={handleResend} className="space-y-6 pt-4 text-left">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors w-5 h-5 pointer-events-none" />
                                            <input 
                                                value={resendEmail}
                                                onChange={(e) => setResendEmail(e.target.value)}
                                                type="email" 
                                                className="input-field pl-12 bg-black/40 border-white/5 focus:border-blue-500/50"
                                                placeholder="university@email.edu"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={actionLoading}
                                        className="btn-action w-full py-4 tracking-[0.2em] font-black disabled:opacity-50"
                                    >
                                        {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : "DISPATCH EMAIL"}
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => navigate('/login')}
                                        className="w-full text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors"
                                    >
                                        WAIT, I'LL TRY TO LOG IN
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default VerifyEmail;
