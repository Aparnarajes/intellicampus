import React, { useState, useEffect } from 'react';
import {
    ShieldAlert,
    AlertTriangle,
    TrendingDown,
    Flame,
    Download,
    Loader2,
    Calendar,
    Zap,
    ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const AcademicIntelligence = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/analytics/academic-intelligence');
                if (res.data.success) {
                    setData(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch academic intelligence:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleExport = () => {
        window.open(`${import.meta.env.VITE_API_URL}/analytics/export-intelligence`, '_blank');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-primary-500" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-neural-fade">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Zap className="text-amber-500" size={16} />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Predictive Oversight Hub</span>
                    </div>
                    <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                        Academic <span className="text-primary-500 text-shadow-glow">Intelligence</span>
                    </h1>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-3 bg-white text-slate-900 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-primary-500 hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95"
                >
                    <Download size={18} /> Export Neural Ledger
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Attendance Risk Panel */}
                <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl group">
                    <div className="p-8 border-b border-white/5 bg-slate-800/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ShieldAlert className="text-rose-500" size={20} />
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">Attendance Risk</h2>
                        </div>
                        <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-[9px] font-black text-rose-400 uppercase">
                            Critical &lt; 75%
                        </div>
                    </div>
                    <div className="p-4 max-h-[450px] overflow-y-auto custom-scrollbar">
                        {data?.attendanceRisk?.length > 0 ? (
                            <div className="space-y-2">
                                {data.attendanceRisk.map((student, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-3xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group/item">
                                        <div className="space-y-1">
                                            <div className="text-xs font-black text-white uppercase italic tracking-tight">{student.name}</div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{student.usn} • {student.batch}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-black text-rose-500 italic leading-none">{student.percent}%</div>
                                            <div className="text-[9px] font-bold text-rose-500/50 uppercase">DEFICIT</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center opacity-20 flex flex-col items-center">
                                <ShieldAlert size={48} className="mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest">No Active Risks</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Failure Probability Ranking */}
                <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl group">
                    <div className="p-8 border-b border-white/5 bg-slate-800/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Flame className="text-orange-500" size={20} />
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">Curriculum Difficulty</h2>
                        </div>
                    </div>
                    <div className="p-8 space-y-8">
                        {data?.subjectDifficulty?.map((subject, i) => (
                            <div key={i} className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <span className="text-sm font-black text-white uppercase tracking-tight italic">{subject.subject}</span>
                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Failure Prob: {subject.failureProbability.toFixed(1)}%</div>
                                    </div>
                                    <span className={`text-xs font-black italic ${subject.avgScore < 50 ? 'text-rose-400' : 'text-primary-400'}`}>
                                        Avg: {subject.avgScore}%
                                    </span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden p-[1px] border border-white/5">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${subject.avgScore < 50 ? 'bg-gradient-to-r from-rose-600 to-orange-500 shadow-[0_0_10px_#e11d4866]' : 'bg-gradient-to-r from-primary-600 to-blue-500'}`}
                                        style={{ width: `${subject.avgScore}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Load Heatmap */}
                <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <div className="p-8 border-b border-white/5 bg-slate-800/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Calendar className="text-primary-500" size={20} />
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">30-Day Static Load</h2>
                        </div>
                    </div>
                    <div className="p-8 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.academicLoad}>
                                <defs>
                                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#475569"
                                    fontSize={10}
                                    fontWeight="bold"
                                    tickFormatter={(val) => val.split('-').slice(2).join('/')}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis stroke="#475569" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '10px', fontWeight: 'bold' }}
                                    itemStyle={{ color: '#0ea5e9' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="load"
                                    stroke="#0ea5e9"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorLoad)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="px-8 pb-8 flex items-center gap-4">
                        <div className="bg-primary-500/10 border border-primary-500/20 p-4 rounded-3xl flex-1 flex items-center justify-between group hover:bg-primary-500/20 transition-all cursor-default">
                            <div>
                                <div className="text-[9px] font-black text-primary-400 uppercase tracking-widest">Peak Load Date</div>
                                <div className="text-xs font-black text-white italic mt-1 uppercase">
                                    {data?.academicLoad?.reduce((prev, current) => (prev.load > current.load) ? prev : current, { load: 0 }).date || 'N/A'}
                                </div>
                            </div>
                            <TrendingDown className="text-primary-500 group-hover:rotate-12 transition-transform" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcademicIntelligence;
