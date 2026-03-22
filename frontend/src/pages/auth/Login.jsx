import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
    Mail, Lock, LogIn, ArrowRight, AlertCircle, Loader2, ShieldCheck, 
    Sparkles, KeyRound, Building2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Login = () => {
    const navigate = useNavigate();
    const { login, initiateSetup, actionLoading } = useAuth();

    const [isSetup, setIsSetup] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [errors, setErrors] = useState({});
    const [loginStatus, setLoginStatus] = useState(null); // 'success', 'error', 'unverified', 'setup_sent'

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrors({});
        
        if (!formData.email || !formData.password) {
            setErrors({ server: 'Identity and Secret Key required' });
            return;
        }

        try {
            const user = await login(formData.email, formData.password);
            setLoginStatus('success');
            
            setTimeout(() => {
                const role = user.role.toLowerCase();
                navigate(`/${role}`);
            }, 1500);
        } catch (err) {
            const status = err.response?.status;
            const data = err.response?.data;
            
            if (status === 403 && data?.setupRequired) {
                setErrors({ server: data.message });
                // We could auto-switch to setup mode here if we want
            } else if (status === 403) {
                setLoginStatus('unverified');
            } else {
                setErrors({ server: data?.message || 'Authentication failed. Please check your credentials.' });
            }
        }
    };

    const handleSetup = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!formData.email) {
            setErrors({ server: 'Institutional email is required' });
            return;
        }

        try {
            await initiateSetup(formData.email);
            setLoginStatus('setup_sent');
        } catch (err) {
            setErrors({ server: err.response?.data?.message || 'Could not verify institution record. Please contact Admin.' });
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-[#020617]">
            {/* Background elements */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute inset-0 bg-grid opacity-[0.05]" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg relative z-10"
            >
                <div className="premium-card p-1 overflow-hidden">
                    <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[1.85rem] p-8 lg:p-12 border border-white/5">
                        {/* Status-specific animations */}
                        <AnimatePresence mode="wait">
                            {loginStatus === 'success' ? (
                                <motion.div 
                                    key="success"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center py-12"
                                >
                                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <ShieldCheck className="w-12 h-12 text-emerald-400" />
                                    </div>
                                    <h1 className="text-3xl font-black text-white mb-2">Access Granted</h1>
                                    <p className="text-slate-400">Booting your academic environment...</p>
                                    <div className="mt-8 flex justify-center">
                                        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                                    </div>
                                </motion.div>
                            ) : loginStatus === 'unverified' ? (
                                <motion.div 
                                    key="unverified"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center py-10"
                                >
                                    <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Mail className="w-12 h-12 text-amber-400" />
                                    </div>
                                    <h1 className="text-2xl font-black text-white mb-4">Verification Required</h1>
                                    <p className="text-slate-300 mb-8 leading-relaxed">
                                        You haven't verified your email yet. Please check your inbox for the activation link.
                                    </p>
                                    <div className="space-y-4">
                                        <button 
                                            onClick={() => {
                                                setLoginStatus(null);
                                                setIsSetup(true);
                                            }}
                                            className="btn-action w-full bg-amber-600 hover:bg-amber-500 shadow-amber-900/40"
                                        >
                                            Resend Verification Email
                                        </button>
                                        <button 
                                            onClick={() => setLoginStatus(null)}
                                            className="text-slate-400 text-sm font-semibold hover:text-white transition-colors"
                                        >
                                            Back to Login
                                        </button>
                                    </div>
                                </motion.div>
                            ) : loginStatus === 'setup_sent' ? (
                                <motion.div 
                                    key="setup_sent"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center py-10"
                                >
                                    <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Sparkles className="w-12 h-12 text-blue-400" />
                                    </div>
                                    <h1 className="text-2xl font-black text-white mb-4">Verification Sent</h1>
                                    <p className="text-slate-300 mb-8 leading-relaxed">
                                        An activation link has been dispatched to your institutional email. Please verify to setup your account password.
                                    </p>
                                    <button 
                                        onClick={() => setLoginStatus(null)}
                                        className="btn-action w-full"
                                    >
                                        Return to Login
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div key="form" exit={{ opacity: 0, y: -20 }}>
                                    {/* Logo/Icon */}
                                    <div className="mb-10 text-center">
                                        <div className="flex justify-center mb-6">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse" />
                                                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center relative border border-white/10">
                                                    <Building2 className="text-white w-8 h-8" />
                                                </div>
                                            </div>
                                        </div>
                                        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">INTELLICAMPUS</h1>
                                        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">
                                            {isSetup ? 'Account Activation Node' : 'Neural Academic Gateway'}
                                        </p>
                                    </div>

                                    <form onSubmit={isSetup ? handleSetup : handleLogin} className="space-y-6">
                                        {/* Email */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Identity Endpoint</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                                                <input 
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    type="email" 
                                                    className="input-field pl-12 bg-black/40 border-white/5 focus:border-blue-500/50"
                                                    placeholder="university@email"
                                                />
                                            </div>
                                        </div>

                                        {/* Password - Only in Login mode */}
                                        {!isSetup && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center px-1">
                                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Secret Key</label>
                                                    <Link to="/forgot-password" size="sm" className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors">
                                                        Reset Access
                                                    </Link>
                                                </div>
                                                <div className="relative group">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                                                    <input 
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        type="password" 
                                                        className="input-field pl-12 bg-black/40 border-white/5 focus:border-blue-500/50"
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {errors.server && (
                                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-bold">
                                                <AlertCircle className="w-5 h-5 shrink-0" />
                                                {errors.server}
                                            </div>
                                        )}

                                        <button 
                                            type="submit" 
                                            disabled={actionLoading}
                                            className={`btn-action w-full py-4 text-[11px] tracking-[0.3em] font-black group ${isSetup ? 'bg-indigo-600 shadow-indigo-900/50' : 'shadow-blue-900/50'}`}
                                        >
                                            {actionLoading ? (
                                                <Loader2 className="w-5 h-5 animate-spin mx-auto text-white/50" />
                                            ) : (
                                                <span className="flex items-center justify-center gap-3">
                                                    {isSetup ? 'INITIALIZE ACCOUNT' : 'ESTABLISH SESSION'} 
                                                    {isSetup ? <Sparkles className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                                                </span>
                                            )}
                                        </button>

                                        <div className="pt-6 text-center border-t border-white/5 mt-4">
                                            <button 
                                                type="button"
                                                onClick={() => setIsSetup(!isSetup)}
                                                className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-2 mx-auto"
                                            >
                                                {isSetup ? (
                                                    <>ALREADY ACTIVE? <span className="text-blue-500">SIGN IN HERE</span></>
                                                ) : (
                                                    <>FIRST TIME SETUP? <span className="text-blue-500">INITIALIZE HERE</span> <ArrowRight className="w-3 h-3 text-blue-500" /></>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>

            {/* Footer decoration */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-600 font-bold uppercase tracking-[0.5em] text-[8px] select-none pointer-events-none">
                Secured by IntelliShield Advanced Protection
            </div>
        </div>
    );
};

export default Login;