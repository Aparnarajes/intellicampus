import React, { useState, useEffect } from 'react';
import {
  FileText,
  BookOpen,
  Youtube,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
  Zap,
  Loader2,
  Target,
  BrainCircuit,
  Activity,
  Award,
  Megaphone,
  Send,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import * as attendanceService from '../../services/attendanceService';
import * as intelligenceService from '../../services/intelligenceService';
import * as userService from '../../services/userService';
import NotificationFeed from '../../components/student/NotificationFeed';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState({ percent: 0, loading: true });
  const [predictive, setPredictive] = useState({ data: null, loading: true });
  const [performanceData, setPerformanceData] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // Use /attendance/me — relies on JWT, no ID mixup
        const attRes = await attendanceService.getMyAttendance();
        const attRecords = attRes?.data || [];
        if (attRecords.length > 0) {
          // DB stores enum as 'PRESENT' (uppercase) — match correctly
          const attended = attRecords.filter(a => a.status === 'PRESENT').length;
          const percent = Math.round((attended / attRecords.length) * 100);
          setAttendance({ percent, loading: false });
        } else {
          setAttendance({ percent: 0, loading: false });
        }

        const intelRes = await intelligenceService.getStudentPredictiveScore();
        setPredictive({ data: intelRes.data, loading: false });

        const annRes = await userService.getAnnouncements();
        if (annRes.success) {
          setAnnouncements(annRes.data);
        }

        const evRes = await userService.getEvents();
        if (evRes.success) {
          setEvents(evRes.data);
        }

        setPerformanceData([
          { name: 'Unit 1', score: 65, avg: 70 },
          { name: 'Unit 2', score: 85, avg: 72 },
          { name: 'Unit 3', score: 78, avg: 75 },
          { name: 'Unit 4', score: 92, avg: 74 },
        ]);

      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
        setAttendance({ percent: 0, loading: false });
        setPredictive({ data: null, loading: false });
      }
    };
    fetchData();
  }, [user]);

  const radarData = [
    { subject: 'Theory', A: 85, fullMark: 100 },
    { subject: 'Problem Solving', A: 70, fullMark: 100 },
    { subject: 'Punctuality', A: attendance.percent, fullMark: 100 },
    { subject: 'Engagement', A: 90, fullMark: 100 },
    { subject: 'Quiz', A: 75, fullMark: 100 },
  ];

  const quickActions = [
    { title: 'AI Notes Generator', desc: 'Neural synthesis of your syllabus into optimized summaries.', icon: FileText, link: '/student/notes', color: 'primary' },
    { title: 'AI Question Generator', desc: 'Dynamic assessment engine with adaptive difficulty scaling.', icon: BookOpen, link: '/student/questions', color: 'purple' },
    { title: 'YouTube Guide', desc: 'Algorithmically curated visual learning for complex concepts.', icon: Youtube, link: '/student/youtube', color: 'rose' },
    { title: 'Study Chatbot', desc: 'Infinite concept retrieval & exam-ready viva simulations.', icon: MessageSquare, link: '/student/chatbot', color: 'emerald' },
  ];

  return (
    <div className="space-y-12 pb-20 animate-neural-fade">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500/20 rounded-lg text-primary-400">
              <BrainCircuit size={20} className="animate-pulse" />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Neural Intelligence Active</span>
          </div>
          <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
            Ecosystem <span className="text-primary-500 text-shadow-glow">Intelligence</span>
          </h1>
          <p className="text-slate-500 font-bold max-w-lg leading-relaxed italic">
            Processing academic signals for {user?.name || 'Authorized Student'}. Success probability and cross-domain trends are updated in real-time.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center gap-6 shadow-2xl relative overflow-hidden group min-w-[320px]">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
              <Target size={120} />
            </div>
            <div className="relative z-10 w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center border border-white/5">
              {predictive.loading ? (
                <Loader2 className="animate-spin text-primary-500" />
              ) : (
                <span className="text-3xl font-black text-primary-400 italic">{predictive.data?.successProbability}%</span>
              )}
            </div>
            <div className="relative z-10">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Pass Probability</h3>
              <p className="text-sm font-bold text-white uppercase italic">
                {predictive.loading ? 'Calculating Forecast...' : `Status: ${predictive.data?.primaryRisk} Risk`}
              </p>
              <div className="mt-2 text-[10px] font-bold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View Neural Report <ArrowUpRight size={12} />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center gap-6 shadow-2xl relative overflow-hidden group min-w-[320px]">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                <Calendar size={120} />
              </div>
              <div className="relative z-10 w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center border border-white/5">
                <Calendar className="text-indigo-400" size={32} />
              </div>
              <div className="relative z-10">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Next Milestone</h3>
                <p className="text-sm font-bold text-white uppercase italic truncate max-w-[150px]">
                  {events.length > 0 ? [...events].sort((a,b) => new Date(a.startDate) - new Date(b.startDate))[0]?.event : 'No Pending Events'}
                </p>
                <Link to="/student/calendar" className="mt-2 text-[10px] font-bold text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Check Global Epoch Map <ArrowUpRight size={12} />
                </Link>
              </div>
          </div>
        </div>
      </header>

      <NotificationFeed />

      {/* Broadcast Matrix Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500/20 rounded-lg text-primary-400">
              <Megaphone size={20} className="animate-pulse" />
            </div>
            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Institutional <span className="text-primary-500">Transmissions</span></h2>
          </div>
          <div className="h-[1px] flex-1 mx-8 bg-gradient-to-r from-white/10 to-transparent hidden md:block" />
          <Link to="/student/calendar" className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-primary-400 transition-colors">Global Epoch Map</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {announcements.slice(0, 4).map((ann) => (
            <div key={ann.id} className={`group relative bg-slate-900 border border-white/5 rounded-[2rem] p-8 hover:border-primary-500/30 transition-all shadow-2xl overflow-hidden ${ann.priority === 'CRITICAL' ? 'border-rose-500/20 bg-rose-500/5' : ''}`}>
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-1000 -rotate-12 group-hover:rotate-0">
                <Send size={150} />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border ${ann.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-primary-500/20 text-primary-400 border-primary-500/20'}`}>
                    {ann.priority}
                  </div>
                  <div className="px-3 py-1 bg-slate-800 border border-white/10 text-slate-500 text-[8px] font-black uppercase tracking-[0.2em] rounded-full">
                    Sector: {ann.category}
                  </div>
                  <span className="text-[8px] font-bold text-slate-600 uppercase ml-auto">{new Date(ann.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white italic uppercase tracking-tighter group-hover:text-primary-400 transition-colors">{ann.title}</h3>
                  <p className="text-[11px] font-bold text-slate-500 mt-2 leading-relaxed italic line-clamp-2 uppercase">{ann.content}</p>
                </div>
              </div>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="md:col-span-2 p-12 text-center bg-slate-900/50 border border-dashed border-white/5 rounded-[2rem] opacity-30 italic">
               <p className="text-[10px] font-black uppercase tracking-widest">Quiet Sector — No active transmissions</p>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Academic Velocity</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Score Distribution vs Class Average</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Your Performance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-700" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Avg</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} tick={{ dy: 10 }} />
                <YAxis stroke="#64748b" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                <Area type="monotone" dataKey="avg" stroke="#334155" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
          <div className="space-y-1 mb-8">
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Cognitive Profile</h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Multidimensional Competency Map</p>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 8, fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Student" dataKey="A" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-gradient-to-br from-primary-600 to-blue-700 rounded-[2rem] p-8 text-white shadow-2xl shadow-primary-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
            <Zap size={140} />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-8">
              <Activity size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Neural Signal</span>
            </div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-4">Correlation Insight</h3>
            <p className="text-sm font-bold text-white/80 italic leading-relaxed mb-10">
              {predictive.loading ? 'Decoding metadata...' : (predictive.data?.correlationInsight || 'Processing signals for optimization...')}
            </p>
            <div className="mt-auto flex items-center gap-3 bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
              <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-300"><Award size={20} /></div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-0.5">Predicted Outcome</h4>
                <p className="text-sm font-black italic">{predictive.loading ? 'Calculating...' : `Projected Grade: ${predictive.data?.predictedGrade}`}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {quickActions.map((action, i) => (
            <Link key={i} to={action.link} className="group bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] hover:border-primary-500/50 hover:bg-slate-800/50 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><action.icon size={80} /></div>
              <div className="flex items-start justify-between relative z-10 mb-8">
                <div className="p-4 rounded-2xl bg-slate-800 border border-white/5 group-hover:scale-110 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300 shadow-xl"><action.icon size={24} /></div>
                <div className="bg-primary-500/10 text-primary-400 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-primary-500/20">SYSTEM 4.0</div>
              </div>
              <div className="relative z-10">
                <h3 className="text-lg font-black text-white italic uppercase group-hover:text-primary-400 transition-colors tracking-tight">{action.title}</h3>
                <p className="text-slate-500 text-[11px] mt-2 font-bold leading-relaxed max-w-[200px] uppercase italic">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;