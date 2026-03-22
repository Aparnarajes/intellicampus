import React, { useState, useEffect } from 'react';
import {
    Users, BookOpen, Calendar, CheckSquare, Award,
    Plus, Search, Filter, ArrowRight, UserCheck,
    AlertCircle, LayoutGrid, List, TrendingUp, Clock,
    Megaphone, Send
} from 'lucide-react';
import { Link } from 'react-router-dom';
import academicService from '../../services/academicService';
import { getAnnouncements } from '../../services/userService';
import { motion } from 'framer-motion';

const AcademicManagement = () => {
    const [subjects, setSubjects] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('grid');

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            const [subjectsRes, announcementsRes] = await Promise.all([
                academicService.getFacultySubjects(),
                getAnnouncements()
            ]);

            if (subjectsRes.success) {
                setSubjects(subjectsRes.data);
            }
            if (announcementsRes.success) {
                setAnnouncements(announcementsRes.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to sync with academic ecosystem.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-slate-400 font-medium">Fetching Academic Workload...</p>
        </div>
    );

    if (error || (!loading && subjects.length === 0)) return (
        <div className="p-8 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500" />
            <div>
                <h2 className="text-xl font-bold text-amber-500">Academic Sync Failed</h2>
                <p className="text-amber-400/80 mt-1">{error || 'Unable to retrieve faculty workload. Please contact Admin if your subjects are not assigned.'}</p>
                <button
                    onClick={fetchSubjects}
                    className="mt-6 px-6 py-2 bg-amber-500 text-white rounded-xl font-bold text-xs uppercase"
                >
                    Retry Sync
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2 text-indigo-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                        Faculty Workspace
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-100 tracking-tight">
                        Academic <span className="text-indigo-500">Management</span>
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">Select a subject to manage attendance, evaluations, and student records.</p>
                </div>

                <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            {/* Broadcast Matrix Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                    <Megaphone size={20} className="animate-pulse" />
                    </div>
                    <h2 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Institutional <span className="text-indigo-500 text-shadow-glow">Transmissions</span></h2>
                </div>
                <div className="h-[1px] flex-1 mx-8 bg-gradient-to-r from-indigo-500/20 to-transparent hidden md:block" />
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic animate-pulse">Live Payload Syncing...</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {announcements.slice(0, 4).map((ann) => (
                    <div key={ann.id} className={`group relative bg-slate-900/60 border border-white/5 rounded-[2.5rem] p-8 hover:border-indigo-500/30 transition-all shadow-2xl overflow-hidden hover:scale-[1.02] ${ann.priority === 'CRITICAL' ? 'border-rose-500/30 bg-rose-500/5' : ''}`}>
                    <div className="absolute top-0 right-0 p-8 opacity-[0.01] group-hover:opacity-[0.05] transition-opacity duration-1000 -rotate-12 group-hover:rotate-0">
                        <Send size={150} />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-[0.2em] border ${ann.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.3)]' : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20'}`}>
                                    {ann.priority}
                                </div>
                                <div className="px-2 py-0.5 bg-slate-800 border border-white/10 text-slate-500 text-[7px] font-black uppercase tracking-[0.2em] rounded-full">
                                    {ann.category}
                                </div>
                            </div>
                            <span className="text-[8px] font-bold text-slate-600 uppercase font-mono">{new Date(ann.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div>
                        <h3 className="text-sm font-black text-white italic uppercase tracking-tight group-hover:text-indigo-400 transition-colors line-clamp-1">{ann.title}</h3>
                        <p className="text-[10px] font-bold text-slate-500 mt-2 leading-relaxed italic line-clamp-2 uppercase tracking-wide">{ann.content}</p>
                        </div>
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-black text-indigo-500 text-[8px] uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all">
                                OPEN PACKET <ArrowRight size={10} />
                            </div>
                            <Send size={12} className="text-slate-700" />
                        </div>
                    </div>
                    </div>
                ))}
                {announcements.length === 0 && (
                    <div className="lg:col-span-4 p-12 text-center bg-slate-900/30 border border-dashed border-white/10 rounded-[2.5rem] opacity-30 grayscale pointer-events-none">
                        <Megaphone size={40} className="mx-auto mb-4 opacity-10" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Sector Quiescence — No active transmissions detected</p>
                    </div>
                )}
                </div>
            </section>

            {/* Grid View */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subjects.map((sub, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={sub.id}
                            className="group bg-slate-900/40 border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/30 transition-all duration-500 relative overflow-hidden"
                        >
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />

                            <div className="flex items-center justify-between mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-[10px] font-black text-indigo-400 border border-slate-700/50">
                                    {sub.subjectCode}
                                </div>
                                <div className="px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                    SECTION {sub.section}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-slate-100 mb-2 leading-tight group-hover:text-indigo-400 transition-colors">{sub.subjectName}</h3>
                            <p className="text-slate-500 text-xs font-medium mb-8">Management console for core academic data and student tracking.</p>

                            <div className="grid grid-cols-2 gap-3">
                                <Link
                                    to="/faculty/mark-attendance"
                                    state={{ subjectName: sub.subjectName, section: sub.section, subjectCode: sub.subjectCode }}
                                    className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700/50 text-xs font-bold transition-all"
                                >
                                    <UserCheck className="w-4 h-4" /> Attendance
                                </Link>
                                <Link
                                    to="/faculty/marks"
                                    state={{ subjectName: sub.subjectName, section: sub.section, subjectCode: sub.subjectCode }}
                                    className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700/50 text-xs font-bold transition-all"
                                >
                                    <Award className="w-4 h-4" /> Evaluations
                                </Link>
                            </div>

                            <Link
                                to={`/faculty/subject/${sub.subjectCode}`}
                                className="w-full mt-3 flex items-center justify-between py-4 px-6 bg-indigo-500/5 hover:bg-indigo-500 text-slate-300 hover:text-white rounded-2xl border border-indigo-500/10 hover:border-indigo-500 transition-all duration-300 text-sm font-black uppercase tracking-widest group/btn"
                            >
                                Subject Dashboard <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                    ))}

                    {/* Add New Mapping Placeholder */}
                    <div className="border-2 border-dashed border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center group hover:border-slate-700 transition-colors">
                        <div className="w-14 h-14 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-500 group-hover:bg-slate-800 transition-colors mb-4">
                            <Plus className="w-6 h-6" />
                        </div>
                        <h4 className="text-slate-300 font-bold mb-1">Request Subject</h4>
                        <p className="text-slate-500 text-xs max-w-[200px]">Contact Academic Admin to add a subject to your workload.</p>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/50">
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Code</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Section</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjects.map((sub) => (
                                <tr key={sub.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                                    <td className="p-6">
                                        <span className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-black border border-indigo-500/20">
                                            {sub.subjectCode}
                                        </span>
                                    </td>
                                    <td className="p-6 font-bold text-slate-200">{sub.subjectName}</td>
                                    <td className="p-6 text-center">
                                        <span className="text-slate-400 font-bold text-xs">Section {sub.section}</span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/50">
                                                <Users className="w-4 h-4" />
                                            </button>
                                            <button className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/50">
                                                <CheckSquare className="w-4 h-4" />
                                            </button>
                                            <button className="p-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white transition-all shadow-lg shadow-indigo-500/20">
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Quick Summary Cards (Situational Awareness) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
                {[
                    { icon: Users, label: 'Synchronized Nodes', value: '420 Units', color: 'indigo' },
                    { icon: Clock, label: 'Pedagogical Handshake', value: '82% AVG', color: 'emerald' },
                    { icon: Award, label: 'Evaluation Density', value: '1,240 PKTS', color: 'amber' },
                    { icon: TrendingUp, label: 'Sector Compliance', value: '94% SAFE', color: 'rose' }
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-900/40 border border-white/5 p-6 rounded-[2rem] flex items-center gap-5 hover:bg-slate-800/40 transition-all group">
                        <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-500 border border-${stat.color}-500/20 group-hover:scale-110 transition-transform`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] leading-none mb-2">{stat.label}</p>
                            <p className="text-xl font-black text-white italic tracking-tighter">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AcademicManagement;
