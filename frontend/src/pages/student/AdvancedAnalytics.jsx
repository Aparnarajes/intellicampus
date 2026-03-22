import React, { useState, useEffect, useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis
} from 'recharts';
import {
    Activity, TrendingUp, Target, BookOpen, AlertCircle, ChevronRight, 
    Zap, Sparkles, Filter, Calendar, Award
} from 'lucide-react';
import api, { checkSystemHealth } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const AdvancedAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [diagnosis, setDiagnosis] = useState(null);
    const [selectedSemester, setSelectedSemester] = useState('ALL');
    const [selectedSubject, setSelectedSubject] = useState('ALL');

    useEffect(() => {
        fetchAdvancedAnalytics();
    }, []);

    const fetchAdvancedAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);
            setDiagnosis(null);
            
            const res = await api.get('/analytics/student/advanced-dashboard');
            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (err) {
            console.error('[DIAGNOSTIC_FAILURE]:', err.response || err.message);
            setError(err.response?.data?.message || 'Neural Link Error: Connection with academic registry failed.');
            
            // Perform deep diagnosis
            const health = await checkSystemHealth();
            if (!health.ok) {
                setDiagnosis(`${health.code}: ${health.issue}`);
            } else {
                setDiagnosis('ENGINE_UP | POSSIBLE_AUTH_EXPIRATION');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = async () => {
        const health = await checkSystemHealth();
        if (health.ok) {
            window.location.reload(); // Hard reset for session stability
        } else {
            fetchAdvancedAnalytics();
        }
    };

    const filteredPerformance = useMemo(() => {
        if (!data) return [];
        let perf = data.visuals.performance;
        if (selectedSubject !== 'ALL') {
            perf = perf.filter(p => p.subject === selectedSubject);
        }
        return perf;
    }, [data, selectedSubject]);

    if (loading) return (
        <div className="min-h-[600px] flex flex-col items-center justify-center gap-6">
            <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin" />
                <Activity className="absolute inset-0 m-auto text-indigo-500 animate-pulse" size={32} />
            </div>
            <div className="text-center">
                <h2 className="text-xl font-black text-white tracking-widest uppercase italic font-mono">Synthesizing Intelligence...</h2>
                <p className="text-slate-500 text-[10px] mt-2 font-bold tracking-[.3em] uppercase">Compiling regression vectors and subject mastery...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="p-12 bg-rose-500/10 border border-rose-500/20 rounded-[2.5rem] text-center max-w-2xl mx-auto mt-10">
            <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-white italic truncate uppercase">Neural Sync Interrupted</h2>
            
            <div className="space-y-4 mt-6">
                <p className="text-rose-400 font-medium text-sm">{error}</p>
                {diagnosis && (
                    <div className="bg-rose-900/40 p-4 rounded-2xl border border-rose-500/30 text-rose-200 font-mono text-[10px] uppercase tracking-widest flex items-center justify-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        DIAGNOSIS: {diagnosis}
                    </div>
                )}
            </div>

            <button 
                onClick={handleRetry} 
                className="mt-10 px-10 py-4 bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl transition-all flex items-center justify-center gap-3 mx-auto shadow-[0_20px_40px_rgba(225,29,72,0.3)] active:scale-95"
            >
                <Zap size={16} className="animate-pulse" />
                Re-establish Connection
            </button>
            <p className="mt-6 text-slate-500 text-[9px] uppercase tracking-widest italic font-bold">Protocol Alpha-5 | Recursive Sync Enabled</p>
        </div>
    );

    return (
        <div className="space-y-10 pb-20 animate-in fade-in duration-1000">
            {/* Advanced Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                            Real-time Matrix
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Engine Active
                        </div>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase">
                        Neural <span className="text-indigo-500">Analytics</span>
                    </h1>
                    <p className="text-slate-400 font-medium max-w-xl text-sm italic">
                        Advanced performance decomposition for <span className="text-white font-bold">{data.student.name}</span>. 
                        Interpreting academic vectors through AI-driven regression models.
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
                    {[
                        { label: 'AVG Score', value: `${data.kpis.avgScore}%`, sub: 'Collective Avg', icon: TrendingUp, color: 'text-indigo-400' },
                        { label: 'CGPA', value: data.kpis.cgpa.toFixed(2), sub: 'Registry Data', icon: Award, color: 'text-emerald-400' },
                        { label: 'Next Target', value: `${Math.round(data.kpis.nextTarget)}%`, sub: 'AI Forecast', icon: Target, color: 'text-amber-400' },
                        { label: 'Stability', value: `${Math.round(data.kpis.attendanceStability)}%`, sub: 'Presence Metric', icon: Activity, color: 'text-sky-400' },
                    ].map((kpi, i) => (
                        <div key={i} className="bg-slate-900/40 border border-white/5 p-4 py-5 rounded-2xl backdrop-blur-xl group hover:border-white/10 transition-all">
                            <div className="flex items-center gap-3 mb-3">
                                <kpi.icon size={16} className={kpi.color} />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{kpi.label}</span>
                            </div>
                            <div className="text-2xl font-black text-white italic tracking-tight">{kpi.value}</div>
                            <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{kpi.sub}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Insight Strip */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {data.insights.map((insight, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`p-5 rounded-[1.5rem] border flex items-start gap-4 ${
                            insight.type === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/20' : 
                            insight.type === 'WARNING' ? 'bg-amber-500/10 border-amber-500/20' : 
                            'bg-sky-500/10 border-sky-500/20'
                        }`}
                    >
                        <div className={`mt-1 p-2 rounded-xl shrink-0 ${
                            insight.type === 'CRITICAL' ? 'bg-rose-500/20 text-rose-500' : 
                            insight.type === 'WARNING' ? 'bg-amber-500/20 text-amber-500' : 
                            'bg-sky-500/20 text-sky-500'
                        }`}>
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                                insight.type === 'CRITICAL' ? 'text-rose-500' : 
                                insight.type === 'WARNING' ? 'text-amber-500' : 
                                'text-sky-500'
                            }`}>AI Prediction Agent</h4>
                            <p className="text-white text-xs font-medium mt-1 leading-relaxed opacity-90">{insight.text}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Neural Matrix Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 1. Subject Mastery Radar */}
                <div className="lg:col-span-4 bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-3xl group">
                    <div className="flex items-center justify-between mb-8">
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-white italic tracking-tight uppercase">Mastery Radar</h3>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Balanced performance map</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/10">
                            <Zap size={20} />
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.visuals.performance}>
                                <PolarGrid stroke="#1e293b" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                    itemStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
                                />
                                <Radar 
                                    name="Score %" 
                                    dataKey="percentage" 
                                    stroke="#f59e0b" 
                                    fill="#f59e0b" 
                                    fillOpacity={0.4} 
                                    strokeWidth={3}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Performance Decomposition */}
                <div className="lg:col-span-8 bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-3xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-lg shadow-indigo-500/10">
                                <Activity size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white italic tracking-tight uppercase">Performance Decomposition</h3>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Cross-subject metric analysis</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <select 
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="pl-9 pr-8 py-2.5 bg-slate-950/80 border border-white/5 rounded-xl text-xs font-black text-slate-300 outline-none hover:border-indigo-500/30 transition-all appearance-none cursor-pointer tracking-widest uppercase italic"
                                >
                                    <option value="ALL">ALL SUBJECTS</option>
                                    {data.visuals.performance.map(s => <option key={s.subject} value={s.subject}>{s.subject}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filteredPerformance} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="subject" stroke="#475569" fontSize={10} fontWeight="black" axisLine={false} tickLine={false} dy={10} />
                                <YAxis stroke="#475569" fontSize={11} fontWeight="black" axisLine={false} tickLine={false} domain={[0, 100]} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '12px' }}
                                />
                                <Bar dataKey="percentage" radius={[8, 8, 0, 0]}>
                                    {filteredPerformance.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Bracket Distribution */}
                <div className="lg:col-span-5 bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-3xl group">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/10">
                            <Target size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Bracket Matrix</h3>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Performance zoning matrix</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                        <div className="h-[250px] w-full md:w-1/2">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.visuals.distribution}
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {data.visuals.distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-4 w-full md:w-1/2">
                            {data.visuals.distribution.map((entry, index) => (
                                <div key={entry.name} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-[9px] font-black text-slate-300 uppercase italic truncate tracking-wider">{entry.name}</span>
                                    </div>
                                    <span className="text-sm font-black text-white italic">{entry.value} SBJ</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4. AI Performance Trend */}
                <div className="lg:col-span-7 bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-3xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-indigo-500 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                        <TrendingUp size={240} />
                    </div>
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-lg shadow-indigo-500/10">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tight">AI Forecast Hub</h3>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Regression-based growth prediction</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/50 border border-white/5">
                            <Sparkles size={12} className="text-indigo-400" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic underline underline-offset-4 decoration-indigo-500">Projection Active</span>
                        </div>
                    </div>

                    <div className="h-[250px] w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[...data.visuals.prediction.currentTrend, ...data.visuals.prediction.prediction]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="x" stroke="#475569" fontSize={10} fontWeight="bold" hide />
                                <YAxis stroke="#475569" fontSize={11} fontWeight="black" axisLine={false} tickLine={false} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                    itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="y" 
                                    stroke="#6366f1" 
                                    strokeWidth={4} 
                                    dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }} 
                                    activeDot={{ r: 8, stroke: '#0f172a', strokeWidth: 4 }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="y" 
                                    stroke="#6366f1" 
                                    strokeWidth={3} 
                                    strokeDasharray="8 6" 
                                    dot={{ fill: '#6366f1', r: 2 }} 
                                    data={data.visuals.prediction.prediction}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 5. Recommended Focus Topics */}
                <div className="lg:col-span-12 bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-3xl group">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/10">
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Strategic Action Plan</h3>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Recommended topics for immediate focus</p>
                            </div>
                        </div>
                        <Link to="/student/notes" className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-all hover:gap-3 group/link">
                            Deep Study <ChevronRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {data.topics.length === 0 ? (
                            <div className="lg:col-span-4 py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center opacity-30 italic">
                                <Activity size={40} className="mb-4" />
                                <p className="text-xs uppercase font-black tracking-widest italic">No Critical Deficits Detected in Registry</p>
                            </div>
                        ) : data.topics.map((item, i) => (
                            <div key={i} className="group relative bg-slate-950/40 border border-white/5 p-6 rounded-3xl hover:border-indigo-500/30 transition-all duration-500 overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-3xl group-hover:bg-indigo-500/10 transition-all" />
                                <div className="flex items-center justify-between mb-5">
                                    <div className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] italic">{item.subject}</div>
                                    <div className={`w-2 h-2 rounded-full ${item.score < 40 ? 'bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`} />
                                </div>
                                <h4 className="text-sm font-black text-white uppercase italic leading-tight group-hover:text-indigo-400 transition-colors mb-2 tracking-tight">{item.topic}</h4>
                                <div className="flex items-center justify-between mt-8">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Current Mastery</p>
                                        <p className="text-sm font-black text-white italic">{item.score}%</p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Stagnation Period</p>
                                        <p className="text-[10px] font-black text-slate-400 italic font-mono">{item.daysSinceUpdate}D</p>
                                    </div>
                                </div>
                                <div className="mt-6 h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.score}%` }}
                                        className={`h-full ${item.score < 40 ? 'bg-rose-500' : 'bg-amber-500'}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedAnalytics;
