import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
    User, Mail, Lock, Building2, Calendar, 
    ArrowRight, CheckCircle2, AlertCircle, Loader2 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Register = () => {
    const navigate = useNavigate();
    const { register, actionLoading } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        department: '',
        semester: ''
    });

    const [errors, setErrors] = useState({});
    const [successMsg, setSuccessMsg] = useState('');

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        const passRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/;
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (!passRegex.test(formData.password)) {
            newErrors.password = 'Must have uppercase, number, and special character';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.department) newErrors.department = 'Department is required';
        if (!formData.semester) newErrors.semester = 'Semester is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            const response = await register(formData);
            setSuccessMsg(response.message || 'Registration successful. Check your email!');
            // After 5 seconds, redirect to login
            setTimeout(() => navigate('/login'), 5000);
        } catch (err) {
            setErrors({ server: err.response?.data?.message || 'Registration failed. Try again.' });
        }
    };

    const departments = [
        'Computer Science', 'Electronic Engineering', 'Mechanical', 'Civil', 'Business Administration', 'Biotech'
    ];

    const semesters = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

    return (
        <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[#020617]" />
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl relative z-10"
            >
                <div className="premium-card p-1 lg:p-1.5 overflow-hidden">
                    <div className="bg-slate-900/50 backdrop-blur-3xl rounded-[1.85rem] p-8 lg:p-12">
                        {/* Header */}
                        <div className="mb-10 text-center">
                            <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/20"
                            >
                                <Building2 className="text-white w-10 h-10" />
                            </motion.div>
                            <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Create Account</h1>
                            <p className="text-slate-400 text-lg font-medium">Join the IntelliCampus Ecosystem</p>
                        </div>

                        <AnimatePresence mode="wait">
                            {successMsg ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-10"
                                >
                                    <div className="flex justify-center mb-6 text-emerald-400">
                                        <CheckCircle2 className="w-20 h-20" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-4">Verification Email Sent!</h2>
                                    <p className="text-slate-300 leading-relaxed mb-8">{successMsg}</p>
                                    <Link to="/login" className="btn-action w-full max-w-xs mx-auto">
                                        Go to Login <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Name */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                            <div className="relative group">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                                                <input 
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    type="text" 
                                                    className={`input-field pl-12 ${errors.name ? 'border-red-500/50 bg-red-500/5' : ''}`}
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                            {errors.name && <p className="text-red-400 text-xs mt-1 flex items-center gap-1 font-medium"><AlertCircle className="w-3 h-3" /> {errors.name}</p>}
                                        </div>

                                        {/* Email */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">College Email</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                                                <input 
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    type="email" 
                                                    className={`input-field pl-12 ${errors.email ? 'border-red-500/50 bg-red-500/5' : ''}`}
                                                    placeholder="john@university.edu"
                                                />
                                            </div>
                                            {errors.email && <p className="text-red-400 text-xs mt-1 flex items-center gap-1 font-medium"><AlertCircle className="w-3 h-3" /> {errors.email}</p>}
                                        </div>

                                        {/* Department */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Department</label>
                                            <div className="relative group">
                                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors w-5 h-5 pointer-events-none" />
                                                <select 
                                                    name="department"
                                                    value={formData.department}
                                                    onChange={handleChange}
                                                    className={`input-field pl-12 appearance-none ${errors.department ? 'border-red-500/50 bg-red-500/5' : ''}`}
                                                >
                                                    <option value="" className="bg-slate-900">Select Dept</option>
                                                    {departments.map(dept => <option key={dept} value={dept} className="bg-slate-900">{dept}</option>)}
                                                </select>
                                            </div>
                                            {errors.department && <p className="text-red-400 text-xs mt-1 font-medium">{errors.department}</p>}
                                        </div>

                                        {/* Semester */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Current Semester</label>
                                            <div className="relative group">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors w-5 h-5 pointer-events-none" />
                                                <select 
                                                    name="semester"
                                                    value={formData.semester}
                                                    onChange={handleChange}
                                                    className={`input-field pl-12 appearance-none ${errors.semester ? 'border-red-500/50 bg-red-500/5' : ''}`}
                                                >
                                                    <option value="" className="bg-slate-900">Select Sem</option>
                                                    {semesters.map(sem => <option key={sem} value={sem} className="bg-slate-900">{sem}</option>)}
                                                </select>
                                            </div>
                                            {errors.semester && <p className="text-red-400 text-xs mt-1 font-medium">{errors.semester}</p>}
                                        </div>

                                        {/* Password */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                                                <input 
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    type="password" 
                                                    className={`input-field pl-12 ${errors.password ? 'border-red-500/50 bg-red-500/5' : ''}`}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                            {errors.password && <p className="text-red-400 text-[10px] mt-1 font-medium">{errors.password}</p>}
                                        </div>

                                        {/* Confirm Password */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                                                <input 
                                                    name="confirmPassword"
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    type="password" 
                                                    className={`input-field pl-12 ${errors.confirmPassword ? 'border-red-500/50 bg-red-500/5' : ''}`}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1 font-medium">{errors.confirmPassword}</p>}
                                        </div>
                                    </div>

                                    {errors.server && (
                                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 text-sm font-medium">
                                            <AlertCircle className="w-5 h-5 shrink-0" />
                                            {errors.server}
                                        </div>
                                    )}

                                    <button 
                                        type="submit" 
                                        disabled={actionLoading}
                                        className="btn-action w-full py-4 text-sm tracking-[0.2em] relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {actionLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                        ) : (
                                            <>
                                                Initialize Access <ArrowRight className="w-4 h-4" />
                                                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                                            </>
                                        )}
                                    </button>

                                    <div className="pt-6 text-center">
                                        <p className="text-slate-500 text-sm font-semibold">
                                            Already registered?{' '}
                                            <Link to="/login" className="text-blue-500 hover:text-blue-400 transition-colors underline-offset-4 hover:underline">
                                                Sign In
                                            </Link>
                                        </p>
                                    </div>
                                </form>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;