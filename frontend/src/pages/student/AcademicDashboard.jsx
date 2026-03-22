import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import {
    GraduationCap, BookOpen, AlertCircle, TrendingUp, CheckCircle,
    Calendar, Clock, ShieldAlert, Award, Activity, ChevronRight
} from 'lucide-react';
import academicService from '../../services/academicService';
import { motion, AnimatePresence } from 'framer-motion';

const AcademicDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const res = await academicService.getStudentDashboard();
            if (res.success) {
                setData(res.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to sync with academic engine.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-slate-400 font-medium animate-pulse">Synchronizing Academic Registry...</p>
        </div>
    );

    if (error || (!loading && !data)) return (
        <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <div>
                <h2 className="text-xl font-bold text-red-500">Academic Sync Failed</h2>
                <p className="text-red-400/80 mt-1">{error || 'Unable to retrieve academic intelligence data.'}</p>
            </div>
        </div>
    );

    const attendanceData = Object.entries(data.attendance).map(([subject, percent]) => ({
        subject,
        percentage: parseInt(percent)
    }));

    const marksData = Object.entries(data.marks).map(([subject, score]) => ({
        subject,
        score: score === 'N/A' ? 0 : score
    }));

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
                        Academic <span className="text-indigo-500">Intelligence</span>
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">Real-time performance analytics for {data.student.name} ({data.student.usn})</p>
                </div>

                <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`w-8 h-8 rounded-full border-2 border-slate-900 bg-indigo-${i * 200} flex items-center justify-center text-[10px] font-bold text-white`}>
                                {String.fromCharCode(64 + i)}
                            </div>
                        ))}
                    </div>
                    <div className="pr-4">
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-tight text-right">Academic Status</p>
                        <p className="text-xs font-bold text-indigo-400 text-right">Verified Enrollment</p>
                    </div>
                </div>
            </div>

            {/* Warning Panel */}
            <AnimatePresence>
                {data.warnings.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        {data.warnings.map((warning, idx) => (
                            <div key={idx} className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                    <ShieldAlert className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-amber-500 font-bold text-sm">Action Required</h3>
                                    <p className="text-amber-200/70 text-xs mt-0.5 leading-relaxed">{warning}</p>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Attendance Summary */}
                <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl group hover:border-indigo-500/30 transition-all duration-500">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-lg shadow-indigo-500/10">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-200">Attendance Registry</h3>
                                <p className="text-slate-500 text-xs">Subject-wise percentage tracking</p>
                            </div>
                        </div>
                        <div className="px-4 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Live Feed
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={attendanceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="subject" stroke="#64748b" fontSize={11} fontWeight={700} axisLine={false} tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={11} fontWeight={700} axisLine={false} tickLine={false} domain={[0, 100]} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '12px' }}
                                    itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="percentage" radius={[8, 8, 0, 0]}>
                                    {attendanceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.percentage < 75 ? '#f59e0b' : '#6366f1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Global Stats */}
                <div className="space-y-6">
                    <div className="bg-indigo-600 rounded-3xl p-8 relative overflow-hidden group shadow-2xl shadow-indigo-900/20">
                        <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-indigo-500/30 group-hover:scale-110 transition-transform duration-700 ease-out" />
                        <p className="text-indigo-200 text-xs font-black uppercase tracking-[0.2em]">Overall Standing</p>
                        <h4 className="text-5xl font-black text-white mt-2">Active</h4>
                        <div className="mt-8 flex items-center justify-between">
                            <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                                <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-widest">Enrollment</p>
                                <p className="text-white font-black text-lg">SEM {data.student.semester}</p>
                            </div>
                            <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md text-right">
                                <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-widest">Section</p>
                                <p className="text-white font-black text-lg">{data.student.section}</p>
                            </div>
                        </div>
                    </div>

                    {/* AI Performance Oracle */}
                    <div className={`rounded-3xl p-8 border ${data.prediction?.level === 'Good' ? 'bg-emerald-500/5 border-emerald-500/20' : data.prediction?.level === 'Average' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-rose-500/5 border-rose-500/20'} relative overflow-hidden group transition-all`}>
                         <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <Activity className={`w-5 h-5 ${data.prediction?.level === 'Good' ? 'text-emerald-500' : data.prediction?.level === 'Average' ? 'text-amber-500' : 'text-rose-500'}`} />
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">AI Neural Status</h4>
                            </div>
                            <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${data.prediction?.level === 'Good' ? 'bg-emerald-500/10 text-emerald-500' : data.prediction?.level === 'Average' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                Proactive Signal
                            </div>
                         </div>
                         <div className="space-y-1">
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vector Trajectory</p>
                             <p className={`text-4xl font-black italic tracking-tighter ${data.prediction?.level === 'Good' ? 'text-white' : data.prediction?.level === 'Average' ? 'text-amber-400' : 'text-rose-500'}`}>
                                {data.prediction?.level || 'Analyzing...'}
                             </p>
                         </div>
                         <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                             <div className="flex flex-col">
                                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Confidence Score</p>
                                 <p className="text-xs font-bold text-slate-300">{(data.prediction?.probability * 100).toFixed(0)}% Probability</p>
                             </div>
                             <Link to="/student/analytics" className={`text-[10px] font-black uppercase tracking-[0.2em] border-b border-transparent transition-all ${data.prediction?.level === 'Good' ? 'hover:border-emerald-500 text-emerald-500' : data.prediction?.level === 'Average' ? 'hover:border-amber-500 text-amber-500' : 'hover:border-rose-500 text-rose-500'}`}>
                                Proactive Insight <ChevronRight size={12} className="inline ml-1" />
                             </Link>
                         </div>
                    </div>

                    {/* Temporal Matrix & Grade Matrix Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Temporal Matrix (Calendar) */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 text-indigo-500 group-hover:scale-110 transition-transform duration-500">
                                <Calendar size={120} />
                            </div>
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="flex items-center gap-3">
                                    <Clock className="text-indigo-500 animate-pulse" size={20} />
                                    <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] italic">Temporal Matrix</h4>
                                </div>
                                <Link to="/student/calendar" className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors">Global Epoch</Link>
                            </div>
                            <div className="space-y-4 relative z-10">
                                {!data.calendar || data.calendar.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 opacity-30 italic text-center">
                                        <Activity size={32} className="mb-4" />
                                        <p className="text-[10px] uppercase font-black tracking-widest">No Sector Activity</p>
                                    </div>
                                ) : data.calendar.map((ev) => {
                                    const isExam = ev.type === 'EXAM';
                                    const isHoliday = ev.type === 'HOLIDAY';
                                    const colorClass = isExam ? 'text-rose-400' : isHoliday ? 'text-emerald-400' : 'text-sky-400';
                                    const bgClass = isExam ? 'bg-rose-500/10' : isHoliday ? 'bg-emerald-500/10' : 'bg-sky-500/10';

                                    return (
                                        <div key={ev.id} className="flex items-center gap-4 group p-3 rounded-2xl hover:bg-white/[0.03] transition-all border border-transparent hover:border-white/5 bg-slate-950/20">
                                            <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border border-white/5 shrink-0 shadow-lg ${bgClass}`}>
                                                <span className={`text-[8px] font-black uppercase tracking-widest opacity-60 ${colorClass}`}>{new Date(ev.startDate).toLocaleDateString('default', { month: 'short' })}</span>
                                                <span className="text-lg font-black text-white italic tracking-tighter">{new Date(ev.startDate).getDate()}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-xs font-black text-slate-100 uppercase italic tracking-tight truncate group-hover:text-indigo-400 transition-colors uppercase">{ev.event}</h4>
                                                <p className={`text-[8px] font-black uppercase tracking-widest ${colorClass}`}>{ev.type}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Grade Matrix */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
                            <h4 className="text-slate-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-6">
                                <Award className="w-4 h-4 text-emerald-500" /> Grade Matrix
                            </h4>
                            <div className="space-y-4 custom-scrollbar max-h-[300px] pr-2">
                                {Object.entries(data.marks).map(([subject, score]) => (
                                    <div key={subject} className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/30 border border-slate-800/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-indigo-400 uppercase">
                                                {subject.slice(0, 3)}
                                            </div>
                                            <span className="text-slate-300 font-bold text-xs tracking-tight uppercase">{subject}</span>
                                        </div>
                                        <span className={`text-lg font-black ${score < 40 ? 'text-rose-500 font-italic shadow-rose-500/10' : 'text-slate-100'}`}>
                                            {score}
                                        </span>
                                    </div>
                                ))}
                                {Object.keys(data.marks).length === 0 && (
                                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] text-center py-10">Data Points Undefined</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Line Chart */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 group hover:border-emerald-500/30 transition-all duration-500">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                        <LineChart className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-200">Execution Quality</h3>
                        <p className="text-slate-500 text-xs">Subject-wise marks distribution</p>
                    </div>
                </div>

                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={marksData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="subject" stroke="#64748b" fontSize={11} fontWeight={700} axisLine={false} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={11} fontWeight={700} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#10b981"
                                strokeWidth={4}
                                dot={{ r: 6, fill: '#10b981', strokeWidth: 0 }}
                                activeDot={{ r: 8, stroke: '#0f172a', strokeWidth: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AcademicDashboard;
