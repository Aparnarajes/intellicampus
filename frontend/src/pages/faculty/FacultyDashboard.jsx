import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, GraduationCap, Clock, FileText,
  ChevronRight, ArrowUpRight, TrendingUp,
  Search, ShieldCheck, UserCheck, Calendar,
  AlertTriangle, BookOpen, BarChart3, Activity,
  PlusCircle, ShieldAlert, Sparkles, BrainCircuit,
  PieChart as PieIcon, LineChart as LineIcon
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, Cell,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import * as userService from '../../services/userService';
import * as intelligenceService from '../../services/intelligenceService';

const FacultyDashboard = () => {
  const [stats, setStats] = useState({
    classesCount: 0,
    handledClasses: [],
    pendingAssignments: [],
    atRiskCount: 0,
    atRiskStudents: [],
    batchComparison: [],
    totalStudents: 0
  });
  const [batchInsight, setBatchInsight] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await userService.getFacultyStats();
      if (res.success) {
        setStats(res.data);
        // Fetch AI insight for the first handled batch if available
        if (res.data.handledClasses?.length > 0) {
          const firstBatch = res.data.handledClasses[0].batch;
          const aiRes = await intelligenceService.getBatchPatterns(firstBatch);
          setBatchInsight(aiRes.insight);
        }
      }
    } catch (err) {
      console.error('Error fetching faculty dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
        <div className="relative">
          <Activity className="animate-spin text-primary-500" size={64} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles size={24} className="text-primary-400 animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-[12px] font-black text-white uppercase tracking-[0.3em]">Syncing Neural Ecosystem...</p>
          <p className="text-slate-500 text-[10px] font-bold mt-1 uppercase">Processing Batch Metadata</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-neural-fade pb-20">
      {/* Neural Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pt-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500/20 rounded-lg text-primary-400">
              <BrainCircuit size={20} className="animate-pulse" />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Neural Analytics Engine Active</span>
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
            Faculty <span className="text-primary-500 text-shadow-glow">Intelligence</span>
          </h1>
          <p className="text-slate-500 font-bold max-w-xl leading-relaxed italic">
            Monitoring Institutional performance through the IntelliCampus brain.
            Real-time pedological patterns and compliance risks are synchronized.
          </p>
        </div>

      {/* AI Batch Pulse */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group min-w-[340px] border-l-4 border-l-primary-500">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
            <Sparkles size={100} />
          </div>
          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Pattern Detection</h3>
              <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 text-[8px] font-black uppercase">Institutional Handshake</div>
            </div>
            <p className="text-sm font-bold text-white italic leading-snug">
              "{batchInsight || 'Analyzing cross-domain student behaviors for pedagogical optimization...'}"
            </p>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => <div key={i} className="w-5 h-5 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[7px] font-black text-slate-500 uppercase">AI</div>)}
              </div>
              <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest italic group-hover:translate-x-1 transition-transform cursor-pointer">Sector Diagnostics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Command Control */}
      <div className="flex flex-wrap gap-4 items-center">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mr-4">Common Protocols:</h3>
        {[
          { label: 'Register Presence', icon: UserCheck, color: 'emerald', link: '/faculty/mark-attendance' },
          { label: 'Evaluation Entry', icon: Award, color: 'amber', link: '/faculty/marks' },
          { label: 'Adaptive Blueprint', icon: Zap, color: 'indigo', link: '/faculty/adaptive' },
          { label: 'Subject Matrix', icon: BookOpen, color: 'primary', link: '/faculty/academic-management' }
        ].map((ctrl, i) => (
          <button 
            key={i}
            onClick={() => navigate(ctrl.link)}
            className="flex items-center gap-3 px-6 py-3 bg-slate-900 border border-white/5 rounded-2xl hover:border-primary-500/30 hover:bg-slate-800 transition-all group"
          >
            <ctrl.icon size={16} className={`text-${ctrl.color}-500 group-hover:scale-110 transition-transform`} />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">{ctrl.label}</span>
          </button>
        ))}
      </div>

      {/* Primary Infrastructure Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Active Subjects', value: stats.classesCount, icon: BookOpen, color: 'text-primary-400', bg: 'bg-primary-500/10', trend: 'Handled Workload' },
          { label: 'Evaluation Backlog', value: stats.pendingAssignments?.length || 0, icon: FileText, color: 'text-amber-400', bg: 'bg-amber-400/10', trend: 'Assessment Queue' },
          { label: 'Compliance Risk', value: stats.atRiskCount, icon: ShieldAlert, color: stats.atRiskCount > 0 ? 'text-rose-400' : 'text-emerald-400', bg: stats.atRiskCount > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10', trend: 'Engagement Status' },
          { label: 'Student Collective', value: stats.totalStudents, icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10', trend: 'Synchronized nodes' }
        ].map((m, i) => (
          <div key={i} className={`bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden group shadow-xl ${i === 2 && stats.atRiskCount > 0 ? 'border-rose-500/40 bg-rose-500/5' : ''}`}>
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <m.icon size={80} />
            </div>
            <div className="relative z-10">
              <div className={`w-14 h-14 rounded-2xl ${m.bg} flex items-center justify-center ${m.color} mb-6 border border-white/5`}>
                <m.icon size={28} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white italic tracking-tighter leading-none">{m.value}</span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.label.split(' ')[1]}</span>
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center gap-1 ${i === 2 && stats.atRiskCount > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                {m.trend} {i === 0 && <ArrowUpRight size={10} />}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Institutional Velocity (Chart) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-indigo-500 opacity-50" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                <BarChart3 className="text-primary-500" /> Infrastructure Analytics
              </h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Batch Performance vs Attendance Correlation</p>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary-500 shadow-[0_0_10px_#0ea5e9]" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evaluation</span>
              </div>
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.batchComparison} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorScr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="batch" stroke="#64748b" fontSize={10} fontWeight="black" axisLine={false} tickLine={false} tick={{ dy: 10 }} />
                <YAxis stroke="#64748b" fontSize={10} fontWeight="black" axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#ffffff02' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }}
                />
                <Area type="monotone" dataKey="avgAttendance" name="Presence" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorAtt)" strokeWidth={3} />
                <Area type="monotone" dataKey="avgScore" name="Velocity" stroke="#6366f1" fillOpacity={1} fill="url(#colorScr)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Neural Hub (Management) & Temporal Matrix */}
        <div className="space-y-10">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl flex flex-col h-[400px]">
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3 mb-10">
              <Activity className="text-primary-500" size={24} /> Neural Hub
            </h2>

            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {stats.handledClasses.map((cl, i) => (
                <div key={i} className="group bg-slate-800/10 border border-white/5 p-6 rounded-3xl hover:bg-slate-800/50 hover:border-primary-500/40 transition-all cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                    <GraduationCap size={40} />
                  </div>
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <h4 className="font-black text-white text-md uppercase italic tracking-tight mb-1 group-hover:text-primary-400 transition-colors uppercase">{cl.subject}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">Batch {cl.batch}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Stable</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-white group-hover:bg-primary-600 transition-all">
                      <ArrowUpRight size={18} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Temporal Matrix Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl flex flex-col h-[420px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 text-primary-500 group-hover:scale-110 transition-transform duration-1000">
                <Calendar size={120} />
            </div>
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                    <Clock className="text-primary-500 animate-pulse" size={24} />
                    <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Temporal Matrix</h2>
                </div>
                <button onClick={() => navigate('/faculty/calendar')} className="text-[10px] font-black text-primary-400 uppercase tracking-widest hover:text-white transition-colors">Global epoch</button>
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 relative z-10">
                {!stats.calendar || stats.calendar.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale italic px-6">
                        <Activity size={40} className="mb-4 animate-pulse" />
                        <p className="text-[10px] uppercase font-black tracking-widest">Timeline Parameters Undefined</p>
                    </div>
                ) : (
                    stats.calendar.map(ev => {
                        const isExam = ev.type === 'EXAM';
                        const isHoliday = ev.type === 'HOLIDAY';
                        const colorClass = isExam ? 'text-rose-400' : isHoliday ? 'text-emerald-400' : 'text-primary-400';
                        const bgClass = isExam ? 'bg-rose-500/10' : isHoliday ? 'bg-emerald-500/10' : 'bg-primary-500/10';

                        return (
                            <div key={ev.id} className="flex items-center gap-5 group p-5 rounded-[2rem] bg-slate-950/40 border border-white/5 hover:border-primary-500/30 transition-all">
                                <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border border-white/5 shrink-0 shadow-lg ${bgClass}`}>
                                    <span className={`text-[9px] font-black uppercase tracking-widest opacity-60 ${colorClass}`}>{new Date(ev.startDate).toLocaleDateString('default', { month: 'short' })}</span>
                                    <span className="text-xl font-black text-white italic tracking-tighter">{new Date(ev.startDate).getDate()}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-xs font-black text-slate-100 uppercase italic tracking-tight truncate group-hover:text-primary-400 transition-colors uppercase">{ev.event}</h4>
                                    <p className={`text-[8px] font-black uppercase tracking-widest mt-1 ${colorClass}`}>{ev.type}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Critical Operational Signal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-12">
        {/* Risk Alerts */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3 text-rose-500">
              <ShieldAlert size={20} className="animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-[0.3em] italic">System Critical Alerts</h3>
            </div>
            <span className="px-3 py-1 bg-rose-500/10 text-rose-400 text-[9px] font-bold uppercase tracking-widest rounded-lg border border-rose-500/20">
              {stats.atRiskCount} Operational Risks Identified
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {stats.atRiskStudents?.length > 0 ? (
              stats.atRiskStudents.slice(0, 3).map((student) => (
                <div key={student._id} className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex items-center gap-6 group hover:border-rose-500/40 transition-all relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500 opacity-50" />
                  <div className="w-16 h-16 rounded-2xl bg-slate-950 flex flex-col items-center justify-center border border-white/5 group-hover:border-rose-500/20 transition-colors">
                    <span className="text-md font-black text-rose-400 italic leading-none">{student.attendance}%</span>
                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest mt-1">Status</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-white text-md uppercase italic tracking-tighter mb-1 truncate">{student.name}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{student.usn}</span>
                      <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest italic">Batch {student.batch}</span>
                    </div>
                  </div>
                  <button className="h-10 w-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white transition-all shadow-xl">
                    <ArrowUpRight size={18} />
                  </button>
                </div>
              ))
            ) : (
              <div className="bg-slate-900 border-2 border-dashed border-slate-800 p-12 text-center rounded-[2.5rem]">
                <ShieldCheck size={48} className="mx-auto text-emerald-500/20 mb-4" />
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Institutional compliance healthy</p>
              </div>
            )}
          </div>
        </div>

        {/* Neural Evaluation Tracker */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3 text-amber-500">
              <Clock size={20} />
              <h3 className="text-xs font-black uppercase tracking-[0.3em] italic">Evaluation Pipeline</h3>
            </div>
            <button className="text-[9px] font-black text-primary-500 uppercase tracking-widest hover:text-white transition-colors">Neural Evaluation Monitor</button>
          </div>

          <div className="space-y-6">
            {stats.pendingAssignments?.length > 0 ? (
              stats.pendingAssignments.slice(0, 2).map((asgn) => (
                <div key={asgn._id} className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] group hover:bg-slate-800/50 transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-125 transition-transform duration-1000">
                    <FileText size={100} />
                  </div>
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                      <h4 className="text-lg font-black text-white uppercase italic tracking-tighter mb-2">{asgn.title}</h4>
                      <div className="flex gap-3">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-2 py-1 rounded-lg border border-white/5">{asgn.subject}</span>
                        <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest bg-slate-950 px-2 py-1 rounded-lg border border-white/5">Batch {asgn.batch}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-black text-rose-400 uppercase tracking-widest italic mb-1">Due {new Date(asgn.dueDate).toLocaleDateString()}</div>
                      <div className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-[8px] font-black text-amber-500 uppercase rounded-full">In Queue</div>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden p-[1px] border border-white/5">
                    <div className="h-full w-1/3 bg-amber-500 rounded-full" />
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-900 border-2 border-dashed border-slate-800 p-16 text-center rounded-[2.5rem]">
                <PlusCircle size={48} className="mx-auto text-slate-800 mb-4 opacity-50" />
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Evaluation pipeline clear</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;