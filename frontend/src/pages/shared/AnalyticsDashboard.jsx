import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    LineChart, Line, Legend, BarChart, Bar, Cell
} from 'recharts';
import {
    TrendingUp, Users, BookOpen, Calendar, Zap, AlertTriangle,
    ChevronRight, Layout, Loader2, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

// Lazy load actual chart components to split the bundle if needed, 
// but here we'll keep it simple and just lazy load the whole dashboard in App.jsx.

const Skeleton = ({ className }) => (
    <div className={`bg-slate-900 animate-pulse rounded-2xl ${className}`} />
);

const AnalyticsDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        attendanceTrend: [],
        performance: [],
        prediction: { currentTrend: [], prediction: [] },
        weakStudents: [],
        heatmap: []
    });

    const [selectedBatch, setSelectedBatch] = useState('2023-A'); // Default batch

    useEffect(() => {
        fetchAnalytics();
    }, [selectedBatch]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            if (user.role === 'student') {
                const [att, perf, pred] = await Promise.all([
                    api.get('/analytics/student/attendance-trend'),
                    api.get('/analytics/student/performance'),
                    api.get('/analytics/student/prediction')
                ]);
                setData({
                    attendanceTrend: att.data.data,
                    performance: perf.data.data,
                    prediction: pred.data.data,
                });
            } else {
                const [weak, heat] = await Promise.all([
                    api.get(`/analytics/batch/weak-students?batch=${selectedBatch}`),
                    api.get(`/analytics/batch/heatmap?batch=${selectedBatch}`)
                ]);
                setData({
                    weakStudents: weak.data.data,
                    heatmap: heat.data.data
                });
            }
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    const predictionData = useMemo(() => {
        const historical = data.prediction?.currentTrend?.map(p => ({ ...p, type: 'Historical' })) || [];
        const forecast = data.prediction?.prediction?.map(p => ({ ...p, type: 'Forecast' })) || [];
        return [...historical, ...forecast];
    }, [data.prediction]);

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Skeleton className="h-[400px]" />
                    <Skeleton className="h-[400px]" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Layout className="text-primary-500" size={32} />
                        {user.role === 'student' ? 'My Performance Insights' : 'Batch Intelligence Dashboard'}
                    </h1>
                    <p className="text-slate-400 mt-1 font-medium italic">
                        {user.role === 'student' ? 'AI-powered regression analysis of your academic journey' : `Deep-dive metrics for Batch ${selectedBatch}`}
                    </p>
                </div>
                {user.role !== 'student' && (
                    <select
                        value={selectedBatch}
                        onChange={(e) => setSelectedBatch(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-white px-4 py-2 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                        <option value="2023-A">Batch 2023-A</option>
                        <option value="2023-B">Batch 2023-B</option>
                        <option value="2024-A">Batch 2024-A</option>
                    </select>
                )}
            </div>

            {user.role === 'student' ? (
                <>
                    {/* Student KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/10 blur-3xl group-hover:bg-primary-500/20 transition-all" />
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary-500/10 rounded-2xl text-primary-500"><TrendingUp size={24} /></div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg Growth</p>
                                    <p className="text-2xl font-black text-white">+{data.prediction?.m?.toFixed(2) || '0.00'} <span className="text-sm font-bold text-slate-500">per test</span></p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-3xl group-hover:bg-emerald-500/20 transition-all" />
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500"><Calendar size={24} /></div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Attendance Stability</p>
                                    <p className="text-2xl font-black text-white">92% <span className="text-sm font-bold text-slate-500">Steady</span></p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-3xl group-hover:bg-amber-500/20 transition-all" />
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500"><Zap size={24} /></div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Next Target</p>
                                    <p className="text-2xl font-black text-white">{(data.prediction?.prediction?.[0]?.y || 0).toFixed(1)}% <span className="text-sm font-bold text-slate-500">Predicted</span></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Performance Prediction */}
                        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] space-y-6">
                            <h3 className="font-black text-white flex items-center gap-2">
                                <TrendingUp size={20} className="text-primary-500" />
                                Performance Projection
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={predictionData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="x" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Test Sequence', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#475569' }} />
                                        <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="y" name="Current Trend" stroke="#6366f1" strokeWidth={4} dot={{ fill: '#6366f1', strokeWidth: 2 }} activeDot={{ r: 8 }} connectNulls />
                                        <Line type="monotone" dataKey="y" name="AI Prediction" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#6366f1' }} connectNulls />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Subject Mastery Radar */}
                        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] space-y-6">
                            <h3 className="font-black text-white flex items-center gap-2">
                                <Zap size={20} className="text-amber-500" />
                                Subject-wise Mastery
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.performance}>
                                        <PolarGrid stroke="#1e293b" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                        <Radar name="Scoring %" dataKey="percentage" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Attendance Trend */}
                        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] space-y-6 lg:col-span-2">
                            <h3 className="font-black text-white flex items-center gap-2">
                                <Calendar size={20} className="text-emerald-500" />
                                Weekly Attendance Stability
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.attendanceTrend}>
                                        <defs>
                                            <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#475569"
                                            fontSize={10}
                                            tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        />
                                        <YAxis stroke="#475569" fontSize={12} domain={[0, 100]} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                        />
                                        <Area type="stepBefore" dataKey="rate" name="Attendance %" stroke="#10b981" fillOpacity={1} fill="url(#colorAtt)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Faculty View: Weak Students & Heatmap */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <h3 className="font-black text-white flex items-center gap-2">
                                <AlertTriangle size={20} className="text-rose-500" />
                                Intervention Required
                            </h3>
                            <div className="space-y-4">
                                {data.weakStudents.map((subjectData, idx) => (
                                    <div key={idx} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                                        <p className="text-xs font-black text-primary-400 uppercase tracking-widest">{subjectData.subject}</p>
                                        <div className="space-y-2">
                                            {subjectData.topWeak.map((student, sIdx) => (
                                                <div key={sIdx} className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-300 font-medium">{student.name}</span>
                                                    <span className="text-rose-500 font-black">{student.score}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-8 rounded-[2rem] space-y-6">
                            <h3 className="font-black text-white flex items-center gap-2">
                                <Users size={20} className="text-blue-500" />
                                Performance Heatmap
                            </h3>
                            <div className="overflow-x-auto">
                                <div className="min-w-[500px] grid grid-cols-6 gap-2">
                                    <div className="text-[10px] font-black text-slate-500 uppercase p-2">Student</div>
                                    {/* Assuming we show up to 5 subjects for simplicity in heatmap header */}
                                    {[...new Set(data.heatmap.map(h => h.subject))].slice(0, 5).map(sub => (
                                        <div key={sub} className="text-[10px] font-black text-slate-500 uppercase p-2 text-center truncate">{sub}</div>
                                    ))}

                                    {/* Heatmap Rows */}
                                    {[...new Set(data.heatmap.map(h => h.student))].slice(0, 10).map(name => (
                                        <React.Fragment key={name}>
                                            <div className="text-xs text-white font-medium p-2 truncate">{name}</div>
                                            {[...new Set(data.heatmap.map(h => h.subject))].slice(0, 5).map(sub => {
                                                const cell = data.heatmap.find(h => h.student === name && h.subject === sub);
                                                const score = cell ? cell.score : 0;
                                                const bgColor = score === 0 ? 'bg-slate-800' :
                                                    score < 40 ? 'bg-rose-950 text-rose-400' :
                                                        score < 60 ? 'bg-orange-950 text-orange-400' :
                                                            score < 80 ? 'bg-blue-950 text-blue-400' :
                                                                'bg-emerald-950 text-emerald-400';
                                                return (
                                                    <div key={sub} className={`flex items-center justify-center text-[10px] font-black h-10 rounded-lg ${bgColor} border border-white/5`}>
                                                        {cell ? `${score}%` : 'N/A'}
                                                    </div>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-950 rounded-sm" /><span className="text-[10px] text-slate-500 tracking-tighter uppercase font-bold">Critical (&lt;40)</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-950 rounded-sm" /><span className="text-[10px] text-slate-500 tracking-tighter uppercase font-bold">Weak (40-60)</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-950 rounded-sm" /><span className="text-[10px] text-slate-500 tracking-tighter uppercase font-bold">Excellence (&gt;80)</span></div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AnalyticsDashboard;
