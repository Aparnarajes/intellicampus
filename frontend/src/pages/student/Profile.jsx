import React, { useState, useEffect } from 'react';
import {
    User, Mail, Phone, MapPin, Briefcase, Award, Save, Edit2,
    CheckCircle, Cpu, BookOpen, Camera, Upload, Trash2,
    Sparkles, BrainCircuit, ShieldCheck, Zap, ArrowUpRight,
    Activity, Target, AlertCircle
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import * as userService from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';

const Profile = () => {
    const { id } = useParams();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        bio: '',
        phone: '',
        address: '',
        interests: '',
        skills: '',
        birthday: '',
        profileImage: '',
        parentEmail: '',
        parentName: '',
        parentPhone: ''
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        fetchProfile();
    }, [id]);

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const data = id
                ? await userService.getUserProfile(id)
                : await userService.getProfile();

            if (data.success) {
                setProfile(data.data);
                const d = data.data;
                setFormData({
                    name: d.name || '',
                    email: d.email || '',
                    bio: d.bio || '',
                    phone: d.phone || '',
                    address: d.address || '',
                    interests: d.interests || '',
                    skills: d.skills?.join(', ') || '',
                    birthday: d.birthday ? d.birthday.split('T')[0] : '',
                    profileImage: d.profileImage || '',
                    parentEmail: d.parentEmail || '',
                    parentName: d.parentName || '',
                    parentPhone: d.parentPhone || ''
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        setIsUpdating(true);
        
        let attempts = 0;
        const MAX_ATTEMPTS = 3;

        const performUpdate = async () => {
            try {
                attempts++;
                const payload = {
                    ...formData,
                    skills: formData.skills.split(',').map(s => s.trim()).filter(s => s !== '')
                };

                console.log(`[NEURAL_SYNC] Attempt ${attempts}/${MAX_ATTEMPTS} | Commit:`, payload);
                setMessage({ text: `Submitting Neural Uplink (Attempt ${attempts}/${MAX_ATTEMPTS})...`, type: 'info' });

                const res = id
                    ? await userService.updateUserProfile(id, payload)
                    : await userService.updateProfile(payload);

                console.log("[NEURAL_SYNC] Results:", res);

                if (res.success) {
                    const d = res.data;
                    setProfile(d);
                    setFormData({
                        name: d.name || '',
                        email: d.email || '',
                        bio: d.bio || '',
                        phone: d.phone || d.phoneNumber || '',
                        address: d.address || '',
                        interests: d.interests || '',
                        skills: d.skills?.join(', ') || '',
                        birthday: d.dateOfBirth ? d.dateOfBirth.split('T')[0] : (d.birthday ? d.birthday.split('T')[0] : ''),
                        profileImage: d.profileImage || '',
                        parentEmail: d.parentEmail || '',
                        parentName: d.parentName || '',
                        parentPhone: d.parentPhone || ''
                    });
                    setIsEditing(false);
                    setMessage({ text: 'Neural profile synchronized successfully.', type: 'success' });
                } else {
                    setMessage({ text: res.message || 'Synchronization protocol failed.', type: 'error' });
                }
            } catch (error) {
                console.error(`[NEURAL_SYNC_FAIL_ATTEMPT_${attempts}]:`, error);
                
                if (attempts < MAX_ATTEMPTS && !error.response) {
                    console.log("[NEURAL_SYNC] Connection Refused. Attempting Neural Re-discovery...");
                    // Try to re-probe health before retry
                    await checkSystemHealth();
                    return performUpdate(); 
                }

                let errMsg = 'Neural link interrupted during sync.';
                if (!error.response) {
                    errMsg = `Backend offline after ${attempts} attempts. Check server connectivity.`;
                } else if (error.response.status === 401) {
                    errMsg = 'Unauthorized Access. Session Expired.';
                } else if (error.response.data?.message) {
                    errMsg = error.response.data.message;
                }

                setMessage({ text: errMsg, type: 'error' });
            }
        };

        await performUpdate();
        setIsUpdating(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, profileImage: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
                <BrainCircuit className="animate-spin text-[var(--brand-primary)]" size={48} />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Neural Identity Retrieval...</p>
            </div>
        );
    }

    const performance = profile?.academicPerformance || { overallScore: 0, cgpa: 0, attendance: 0 };

    return (
        <div className="space-y-12 pb-20 animate-neural-fade">
            {/* Header: Identity Card */}
            <div className="premium-card p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-125 transition-transform duration-1000">
                    <BrainCircuit size={180} />
                </div>

                <div className="flex flex-col lg:flex-row gap-12 items-start lg:items-center relative z-10">
                    <div className="relative group/avatar">
                        <div className="w-44 h-44 rounded-[2.5rem] bg-slate-800 border-2 border-white/5 p-1 relative overflow-hidden transition-all duration-500 group-hover/avatar:border-[var(--brand-primary)]/40 shadow-2xl">
                            <div className="w-full h-full rounded-[2.2rem] bg-slate-900 overflow-hidden flex items-center justify-center">
                                {(isEditing ? formData.profileImage : profile?.profileImage) ? (
                                    <img
                                        src={isEditing ? formData.profileImage : profile.profileImage}
                                        alt="Profile"
                                        className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-700"
                                    />
                                ) : (
                                    <span className="text-6xl font-black text-white italic">{profile?.name?.charAt(0)}</span>
                                )}
                            </div>
                            {isEditing && (
                                <label className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                                    <Camera size={24} className="text-white mb-2" />
                                    <span className="text-[8px] font-black text-white uppercase tracking-widest text-shadow-glow">Update Uplink</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                            )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-[var(--brand-primary)] text-white p-2 rounded-xl shadow-lg border-2 border-slate-950">
                            <ShieldCheck size={16} />
                        </div>
                    </div>

                    <div className="flex-1 space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Bio Registry Identity</span>
                                <div className="h-[1px] flex-1 bg-white/5" />
                            </div>
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <h1 className="text-6xl font-black text-white tracking-tighter italic uppercase leading-none">
                                    {profile?.name}
                                </h1>
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="btn-action shadow-none border border-white/10 hover:border-[var(--brand-primary)]/50 bg-white/5"
                                    >
                                        <Edit2 size={14} /> Reconfigure Profile
                                    </button>
                                )}
                            </div>
                        </div>

                        <p className="text-slate-400 font-bold italic leading-relaxed max-w-2xl">
                            {profile?.bio || 'Initializing neural bio description... No uplink detected.'}
                        </p>

                        <div className="flex flex-wrap gap-4 pt-4">
                            {[
                                { icon: Mail, value: profile?.email, color: 'text-sky-400' },
                                { icon: Award, value: profile?.role === 'student' ? (profile?.usn || 'Provisioning USN...') : (profile?.employeeId || 'Staff Instance'), color: 'text-[var(--brand-primary)]' },
                                { icon: Briefcase, value: profile?.role === 'student' ? (profile?.batch ? `${profile.batch} Batch` : `${profile?.branch} Registry`) : 'Institutional Staff', color: 'text-indigo-400' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 px-5 py-2.5 bg-slate-950/40 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                    <item.icon size={14} className={item.color} />
                                    <span className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">{item.value || 'N/A'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Configuration / Detail Section */}
                <div className="lg:col-span-2 space-y-12">
                    {isEditing ? (
                        <div className="premium-card p-10 animate-in zoom-in-95 duration-500">
                            <div className="flex items-center justify-between mb-12">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">System Reconfiguration</h2>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Update your neural bio-parameters</p>
                                </div>
                                <button onClick={() => setIsEditing(false)} className="text-[9px] font-black text-slate-600 hover:text-rose-500 uppercase tracking-[0.2em] transition-colors italic">Terminate Edit</button>
                            </div>

                            {message.text && (
                                <div className={`mb-8 p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
                                    message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
                                    message.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                                    'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                }`}>
                                    {message.type === 'success' ? <CheckCircle size={18} /> : message.type === 'error' ? <AlertCircle size={18} /> : <BrainCircuit className="animate-spin" size={18} />}
                                    <span className="text-[10px] font-black uppercase tracking-widest">{message.text}</span>
                                </div>
                            )}

                            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[
                                    { label: 'Neural Handle', key: 'name', type: 'text' },
                                    { label: 'Uplink Email', key: 'email', type: 'email' },
                                    { label: 'Creation Date', key: 'birthday', type: 'date' },
                                    { label: 'Digital Contact', key: 'phone', type: 'text' },
                                    ...(profile?.role === 'student' ? [
                                        { label: 'Parent Uplink', key: 'parentEmail', type: 'email' },
                                        { label: 'Parent Name', key: 'parentName', type: 'text' },
                                        { label: 'Parent Phone', key: 'parentPhone', type: 'text' }
                                    ] : [])
                                ].map((field) => (
                                    <div key={field.key} className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{field.label}</label>
                                        <input
                                            type={field.type}
                                            value={formData[field.key]}
                                            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none focus:border-[var(--brand-primary)]/50 transition-all uppercase italic"
                                        />
                                    </div>
                                ))}

                                <div className="md:col-span-2 space-y-3">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Geographical Uplink (Address)</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        rows="2"
                                        className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none focus:border-[var(--brand-primary)]/50 transition-all resize-none italic"
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-3">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Neural Bio (About)</label>
                                    <textarea
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        rows="3"
                                        className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none focus:border-[var(--brand-primary)]/50 transition-all resize-none italic"
                                    />
                                </div>

                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Career Vectors</label>
                                        <input
                                            type="text"
                                            value={formData.interests}
                                            onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                                            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none focus:border-[var(--brand-primary)]/50 transition-all uppercase italic"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Neural Skills (CSV)</label>
                                        <input
                                            type="text"
                                            value={formData.skills}
                                            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none focus:border-[var(--brand-primary)]/50 transition-all uppercase italic"
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isUpdating}
                                    className={`md:col-span-2 btn-action py-5 text-sm mt-6 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isUpdating ? (
                                        <>
                                            <BrainCircuit className="animate-spin" size={18} />
                                            Synchronizing...
                                        </>
                                    ) : (
                                        <>
                                            <Zap size={18} /> Synchronize Profile Data
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {/* Stats Grid for Profile */}
                            {profile?.role === 'student' && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                                    {[
                                        { label: 'Operational Score', value: `${performance.overallScore}%`, icon: Target, color: 'text-primary-500' },
                                        { label: 'Retention Rating', value: `${performance.attendance}%`, icon: Activity, color: 'text-emerald-500' },
                                        { label: 'Current CGPA', value: performance.cgpa || '0.0', icon: Sparkles, color: 'text-amber-500' }
                                    ].map((m, i) => (
                                        <div key={i} className="premium-card p-8 group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
                                                <m.icon size={60} />
                                            </div>
                                            <m.icon className={`${m.color} mb-4`} size={20} />
                                            <div className="text-3xl font-black text-white italic tracking-tighter mb-1">{m.value}</div>
                                            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{m.label}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Skills & Vectors */}
                            <div className="premium-card p-10 space-y-8">
                                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                                    <Cpu className="text-[var(--brand-primary)]" size={24} /> Neural Skill Matrix
                                </h3>
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Current Interests</label>
                                        <p className="text-white font-bold italic bg-white/5 p-6 rounded-3xl border border-white/5 uppercase text-xs leading-relaxed">
                                            {profile?.interests || 'Standard curriculum profile... No specialized uplink detected.'}
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Verified Skillsets</label>
                                        <div className="flex flex-wrap gap-3">
                                            {profile?.skills && profile.skills.length > 0 ? (
                                                profile.skills.map((skill, i) => (
                                                    <div key={i} className="px-6 py-2.5 bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 text-[var(--brand-primary)] text-[10px] font-black rounded-2xl uppercase italic tracking-widest hover:bg-[var(--brand-primary)] hover:text-white transition-all cursor-default">
                                                        {skill}
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-slate-600 text-[10px] font-bold uppercase italic">Awaiting technical verification...</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Vertical Sidebar: Neural Integrity */}
                <div className="space-y-12">
                    <div className="premium-card p-10 text-center space-y-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                            <ShieldCheck size={100} />
                        </div>
                        <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center justify-center text-emerald-400 shadow-2xl mx-auto group-hover:rotate-12 transition-transform duration-700">
                            <ShieldCheck size={48} />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                                {profile?.role === 'student' ? 'Authorized Student' : 'Verified Staff'}
                            </h4>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Neural Integrity Confirmed</p>
                        </div>
                        <div className="pt-4 border-t border-white/5">
                            <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">
                                <span>Security Level</span>
                                <span className="text-emerald-400">Class A</span>
                            </div>
                            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full w-full bg-emerald-500" />
                            </div>
                        </div>
                    </div>

                    {/* Contact Matrix */}
                    <div className="premium-card p-10 space-y-8">
                        <h3 className="text-xs font-black text-white uppercase italic tracking-widest flex items-center gap-3">
                            <MapPin size={16} className="text-[var(--brand-primary)]" /> Contact Matrix
                        </h3>
                        <div className="space-y-6">
                            {[
                                { icon: Phone, label: 'Digital Line', value: profile?.phone },
                                { icon: MapPin, label: 'Geo-Coordinates', value: profile?.address },
                                ...(profile?.role === 'student' ? [{ icon: Mail, label: 'Parent Uplink', value: profile?.parentEmail }] : [])
                            ].map((item, i) => (
                                <div key={i} className="group">
                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2">{item.label}</p>
                                    <div className="flex items-center gap-4 bg-slate-950/40 p-4 rounded-2xl border border-white/5 group-hover:border-[var(--brand-primary)]/30 transition-all">
                                        <item.icon size={14} className="text-slate-500" />
                                        <p className="text-[10px] font-bold text-white uppercase italic truncate">{item.value || 'Not Provisioned'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-primary-600/5 border border-primary-600/20 rounded-[2.5rem] p-8 text-center space-y-4 shadow-2xl">
                        <h4 className="text-[10px] font-black text-primary-400 uppercase tracking-[0.4em]">Neural Summary</h4>
                        <p className="text-[9px] font-bold text-slate-500 uppercase italic leading-loose">
                            Profile identity established via neural synchronization. All biometric and academic metadata is secured by IntelliCampus Core.
                        </p>
                        <div className="pt-2 text-primary-500 flex justify-center">
                            <BrainCircuit size={24} className="animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
