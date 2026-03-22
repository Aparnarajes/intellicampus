import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, Calendar, CheckCircle2, XCircle,
  AlertTriangle, TrendingUp, Loader2, BookOpen,
  ChevronDown, ChevronUp, Clock, User, Filter,
  Sparkles, PieChart, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid
} from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import * as attendanceService from '../../services/attendanceService';
import aiService from '../../services/aiService';

// ─── Helpers ────────────────────────────────────────────────
const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

// ─── Subject Card ────────────────────────────────────────────
const SubjectCard = ({ sub }) => {
  const [expanded, setExpanded] = useState(false);
  // DB stores status as uppercase enum PRESENT/ABSENT
  const absentRecords = sub.records.filter(r => r.status === 'ABSENT');
  const presentRecords = sub.records.filter(r => r.status === 'PRESENT');

  const color =
    sub.percent >= 85 ? 'emerald' :
      sub.percent >= 75 ? 'primary' :
        sub.percent >= 60 ? 'amber' : 'rose';

  const colorMap = {
    emerald: { ring: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    primary: { ring: 'border-primary-500/30', bg: 'bg-primary-500/10', text: 'text-primary-400', bar: 'bg-primary-500', badge: 'bg-primary-500/20 text-primary-300 border-primary-500/30' },
    amber: { ring: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-500', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    rose: { ring: 'border-rose-500/30', bg: 'bg-rose-500/10', text: 'text-rose-400', bar: 'bg-rose-500', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  };
  const c = colorMap[color];

  return (
    <div className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-300 ${c.ring}`}>
      {/* Card Header */}
      <div
        className="p-6 cursor-pointer hover:bg-slate-800/40 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Percent circle */}
            <div className={`w-16 h-16 shrink-0 rounded-2xl ${c.bg} flex flex-col items-center justify-center`}>
              <span className={`text-xl font-black ${c.text}`}>{sub.percent}%</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-bold text-base leading-snug truncate">{sub.name}</h3>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-xs text-slate-400">{sub.attended}/{sub.total} classes</span>
                {sub.percent < 75 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
                    ⚠ Below 75%
                  </span>
                )}
                {absentRecords.length > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.badge} uppercase tracking-wider`}>
                    {absentRecords.length} Absent
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress + toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
              <div className={`h-full rounded-full ${c.bar} transition-all`} style={{ width: `${sub.percent}%` }} />
            </div>
            <div className={`${c.text}`}>
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t border-white/5">
          {/* Absent Days */}
          {absentRecords.length > 0 ? (
            <div className="p-5">
              <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <XCircle size={12} /> Absent Sessions ({absentRecords.length})
              </h4>
              <div className="space-y-2">
                {absentRecords.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-rose-500/5 border border-rose-500/15 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-rose-300">{formatDate(r.date)}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock size={9} />
                        {formatTime(r.date)}
                        {r.faculty?.name && (
                          <><span className="mx-1">·</span><User size={9} /> {r.faculty.name}</>
                        )}
                      </p>
                    </div>
                    <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg uppercase tracking-wider shrink-0">
                      Absent
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-5 flex items-center gap-3 text-emerald-400">
              <CheckCircle2 size={16} />
              <p className="text-sm font-bold">No absences recorded for this subject!</p>
            </div>
          )}

          {/* Present Days (collapsed count) */}
          {presentRecords.length > 0 && (
            <div className="px-5 pb-5">
              <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <CheckCircle2 size={12} /> Present Sessions ({presentRecords.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {presentRecords.map((r, i) => (
                  <div key={i} className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                    <p className="text-xs font-bold text-emerald-300/80">{formatDate(r.date)}</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">{formatTime(r.date)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main AttendanceView ─────────────────────────────────────
const AttendanceView = () => {
  const { user } = useAuth();
  const [rawRecords, setRawRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'absent' | 'present'
  const [activeTab, setActiveTab] = useState('subjects');  // 'subjects' | 'timeline' | 'analytics'
  const [aiInsight, setAiInsight] = useState('');
  const [isInsightLoading, setIsInsightLoading] = useState(false);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const res = await attendanceService.getMyAttendance();
        const records = res?.data || [];
        setRawRecords(records);

        // Fetch AI Insight
        if (records.length > 0) {
          fetchAiInsight(records);
        }
      } catch (err) {
        console.error('Failed to fetch attendance:', err);
        setRawRecords([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAttendance();
  }, [user]);

  const fetchAiInsight = async (records) => {
    setIsInsightLoading(true);
    try {
      const absencesByDay = {};
      const subjectsMap = {};
      records.forEach(r => {
        // r.subject is an object from Prisma include
        const subjectName = r.subject?.subjectName || r.subject || 'Unknown';
        if (r.status === 'ABSENT') {
          const day = new Date(r.date).toLocaleDateString('en-US', { weekday: 'long' });
          absencesByDay[day] = (absencesByDay[day] || 0) + 1;
        }
        if (!subjectsMap[subjectName]) {
          subjectsMap[subjectName] = { total: 0, attended: 0 };
        }
        subjectsMap[subjectName].total++;
        if (r.status === 'PRESENT') subjectsMap[subjectName].attended++;
      });

      const stats = {
        overall: Math.round((records.filter(r => r.status === 'PRESENT').length / records.length) * 100),
        totalAbsents: records.filter(r => r.status === 'ABSENT').length,
        dayWiseAbsences: absencesByDay,
        subjectWise: Object.keys(subjectsMap).map(s => ({
          name: s,
          percent: Math.round((subjectsMap[s].attended / subjectsMap[s].total) * 100)
        }))
      };

      const insightRes = await aiService.getAttendanceInsight(stats);
      if (insightRes.success) {
        setAiInsight(insightRes.insight);
      }
    } catch (error) {
      console.error('Failed to get AI insight:', error);
    } finally {
      setIsInsightLoading(false);
    }
  };

  // Aggregate records per subject using the nested subject object from API
  const subjects = useMemo(() => {
    const map = {};
    rawRecords.forEach(r => {
      // r.subject is an object from Prisma include: { subject: true }
      const subjectCode = r.subject?.subjectCode || 'Unknown';
      const subjectName = r.subject?.subjectName || subjectCode;
      if (!map[subjectCode]) {
        map[subjectCode] = { name: subjectName, code: subjectCode, attended: 0, total: 0, records: [] };
      }
      map[subjectCode].total += 1;
      if (r.status === 'PRESENT') map[subjectCode].attended += 1;
      map[subjectCode].records.push(r);
    });
    return Object.values(map).map(s => ({
      ...s,
      percent: Math.round((s.attended / s.total) * 100) || 0
    })).sort((a, b) => a.percent - b.percent); // Show critical first
  }, [rawRecords]);

  // Monthly Analytics Data
  const monthlyData = useMemo(() => {
    const months = {};
    rawRecords.forEach(r => {
      const date = new Date(r.date);
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      if (!months[month]) months[month] = { month, total: 0, attended: 0 };
      months[month].total++;
      if (r.status === 'PRESENT') months[month].attended++;
    });
    return Object.values(months).map(m => ({
      ...m,
      percentage: Math.round((m.attended / m.total) * 100)
    }));
  }, [rawRecords]);

  // Group Timeline by Date
  const groupedTimeline = useMemo(() => {
    const filtered = rawRecords.filter(r =>
      filterStatus === 'all' ? true :
        filterStatus === 'absent' ? r.status === 'ABSENT' :
          r.status === 'PRESENT'
    );

    const groups = {};
    filtered.forEach(r => {
      const dateStr = new Date(r.date).toDateString();
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(r);
    });

    return Object.entries(groups).map(([date, records]) => ({
      date,
      records: records.sort((a, b) => new Date(b.date) - new Date(a.date))
    })).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [rawRecords, filterStatus]);

  const overallPercent = subjects.length > 0
    ? Math.round(subjects.reduce((sum, s) => sum + s.percent, 0) / subjects.length)
    : 0;
  const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
  const totalClasses = subjects.reduce((sum, s) => sum + s.total, 0);
  const criticalCount = subjects.filter(s => s.percent < 75).length;
  const totalAbsents = rawRecords.filter(r => r.status === 'ABSENT').length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-primary-500" size={48} />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Loading Attendance...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary-400 font-bold text-[10px] uppercase tracking-[0.2em]">
            <Activity size={12} />
            <span>Academic Presence</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-none uppercase italic">
            Attendance <span className="text-primary-500">Record</span>
          </h1>
        </div>

        {/* AI Insight Box */}
        {aiInsight && (
          <div className="bg-slate-900 border border-primary-500/20 rounded-2xl p-4 flex gap-4 max-w-md animate-in slide-in-from-right-4 duration-500">
            <div className="w-10 h-10 shrink-0 bg-primary-500/10 rounded-xl flex items-center justify-center text-primary-400">
              <Sparkles size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">AI Insight</p>
              <p className="text-xs font-medium text-slate-300 italic">"{aiInsight}"</p>
            </div>
          </div>
        )}
      </header>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall */}
        <div className={`col-span-2 lg:col-span-1 p-6 rounded-2xl border relative overflow-hidden
          ${overallPercent >= 75 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Overall</p>
          <div className={`text-5xl font-black ${overallPercent >= 75 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {overallPercent}%
          </div>
          <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${overallPercent >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>

        {/* Classes */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Classes</p>
          <div className="text-4xl font-black text-white">
            {totalAttended}<span className="text-xl text-slate-600 font-medium">/{totalClasses}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Attended</p>
        </div>

        {/* Absents */}
        <div className={`p-6 rounded-2xl border ${totalAbsents > 0 ? 'bg-rose-500/5 border-rose-500/20' : 'bg-slate-900 border-slate-800'}`}>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Absences</p>
          <div className={`text-4xl font-black ${totalAbsents > 0 ? 'text-rose-400' : 'text-slate-400'}`}>{totalAbsents}</div>
          <p className="text-xs text-slate-400 mt-1">Total sessions missed</p>
        </div>

        {/* Critical subjects */}
        <div className={`p-6 rounded-2xl border ${criticalCount > 0 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
          <div className={`flex items-center gap-2 mb-1 ${criticalCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            <AlertTriangle size={14} />
            <p className="text-[10px] font-black uppercase tracking-widest">Risk</p>
          </div>
          <div className={`text-4xl font-black ${criticalCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{criticalCount}</div>
          <p className="text-xs text-slate-400 mt-1">{criticalCount > 0 ? 'Subjects under 75%' : 'All subjects safe!'}</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex p-1 bg-slate-900 rounded-xl border border-white/5 w-fit">
        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'subjects' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          <span className="flex items-center gap-2"><BookOpen size={14} />Subject View</span>
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'timeline' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          <span className="flex items-center gap-2"><Calendar size={14} />Daily log</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'analytics' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          <span className="flex items-center gap-2"><PieChart size={14} />Analytics</span>
        </button>
      </div>

      {/* ── Analytics View ── */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white uppercase italic tracking-widest flex items-center gap-3 leading-none">
                <TrendingUp className="text-primary-500" /> Monthly Stats
              </h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    cursor={{ fill: '#1e293b' }}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  />
                  <Bar dataKey="percentage" radius={[6, 6, 0, 0]} barSize={40}>
                    {monthlyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.percentage >= 75 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subject-wise Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
            <h3 className="text-xl font-black text-white uppercase italic tracking-widest flex items-center gap-3 leading-none">
              <BookOpen className="text-primary-500" /> Subject Comparison
            </h3>
            <div className="space-y-5">
              {subjects.map((sub, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-slate-400">{sub.name}</span>
                    <span className={sub.percent >= 75 ? 'text-emerald-400' : 'text-rose-400'}>{sub.percent}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${sub.percent >= 75 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-rose-600 to-rose-400'}`}
                      style={{ width: `${sub.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Subject View ── */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          {subjects.length === 0 ? (
            <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-2xl">
              <BarChart3 size={48} className="mx-auto text-slate-700 mb-4 opacity-20" />
              <p className="text-slate-500 font-bold">No attendance records yet.</p>
              <p className="text-slate-600 text-sm mt-1">Your faculty hasn't submitted any attendance sessions.</p>
            </div>
          ) : (
            subjects.map((sub, i) => <SubjectCard key={i} sub={sub} />)
          )}
        </div>
      )}

      {/* ── Daily log (Timeline) ── */}
      {activeTab === 'timeline' && (
        <div className="space-y-8">
          {/* Filter buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5">
              <Filter size={10} /> Filter:
            </span>
            {['all', 'absent', 'present'].map(f => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`px-4 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all ${filterStatus === f
                  ? f === 'absent' ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-900/20'
                    : f === 'present' ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-900/20'
                      : 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-900/20'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                  }`}
              >
                {f === 'all' ? 'All' : f === 'absent' ? '🔴 Absent' : '🟢 Present'}
              </button>
            ))}
          </div>

          {groupedTimeline.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
              <Calendar size={48} className="mx-auto text-slate-700 mb-4 opacity-20" />
              <p className="text-slate-500 font-bold">No records found.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {groupedTimeline.map((group, idx) => (
                <div key={idx} className="relative">
                  {/* Date Header */}
                  <div className="sticky top-0 z-20 bg-slate-950 py-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
                        <h4 className="text-sm font-black text-white tracking-widest uppercase italic">
                          {group.date === new Date().toDateString() ? 'Today - ' : ''}
                          {group.date}
                        </h4>
                      </div>
                      <div className="h-[1px] flex-1 bg-slate-800" />
                    </div>
                  </div>

                  {/* Records for this day */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.records.map((r, i) => (
                      <div
                        key={i}
                        className={`p-5 rounded-2xl border transition-all hover:scale-[1.02] duration-300 shadow-lg
                                                    ${r.status === 'ABSENT'
                            ? 'bg-rose-500/5 border-rose-500/20 shadow-rose-900/10'
                            : 'bg-slate-900 border-slate-800 shadow-black'
                          }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-2 rounded-xl ${r.status === 'ABSENT' ? 'bg-rose-500/20 text-rose-400' : 'bg-primary-500/10 text-primary-400'}`}>
                            {r.status === 'ABSENT' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                          </div>
                          <span className={`text-[10px] font-black px-2 py-1 rounded-lg border uppercase tracking-wider
                                                      ${r.status === 'ABSENT' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'}`}>
                            {r.status}
                          </span>
                        </div>

                        <h5 className="text-white font-bold leading-tight mb-1">{r.subject?.subjectName || "Unknown Subject"}</h5>
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5">
                            <Clock size={10} /> {formatTime(r.date)}
                          </p>
                          {r.faculty?.name && (
                            <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 line-clamp-1">
                              <User size={10} /> {r.faculty.name}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceView;