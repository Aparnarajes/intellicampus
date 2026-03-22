import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, Plus, Trash2, Loader2,
  CheckCircle, AlertCircle, Clock, MapPin, XCircle,
  Trophy, GraduationCap, AlertTriangle, Info, Pencil,
  ChevronLeft, ChevronRight, Filter, Bookmark,
  Activity, ShieldCheck, Search, Database, Globe,
  ShieldAlert, LayoutDashboard, Share2, Download
} from 'lucide-react';
import adminService from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';

const AcademicCalendar = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    event_type: 'EVENT',
    semester: '',
    department: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await adminService.listEvents();
      setEvents(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch calendar framework.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // ── Stats Optimization ───────────────────────────────────────────────────────
  const stats = useMemo(() => {
      const upcoming = events.filter(e => new Date(e.startDate) >= new Date()).length;
      const examsCount = events.filter(e => e.type === 'EXAM').length;
      const holidaysCount = events.filter(e => e.type === 'HOLIDAY').length;
      return { total: events.length, upcoming, examsCount, holidaysCount };
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      const matchesSearch = ev.event.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (ev.description && ev.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = activeFilter === 'ALL' || ev.type === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [events, searchQuery, activeFilter]);

  // ── Calendar Logic ──────────────────────────────────────────────────────────
  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const calendarGrid = useMemo(() => {
    const days = [];
    const totalDays = daysInMonth(currentDate);
    const startOffset = firstDayOfMonth(currentDate);

    for (let i = 0; i < startOffset; i++) {
        days.push({ day: null, date: null });
    }
    for (let i = 1; i <= totalDays; i++) {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
        days.push({ day: i, date: d });
    }
    return days;
  }, [currentDate]);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // ── Persistence Logic ───────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        event: formData.title,
        description: formData.description,
        startDate: formData.start_date,
        endDate: formData.end_date,
        type: formData.event_type,
        semester: formData.semester ? parseInt(formData.semester) : null,
        department: formData.department
      };

      if (editingEvent) {
        await adminService.updateEvent(editingEvent.id, payload);
        setSuccess('Milestone synchronized successfully.');
      } else {
        await adminService.createEvent(payload);
        setSuccess('Event added to global curriculum.');
      }
      setShowModal(false);
      resetForm();
      fetchEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Transaction error.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      event_type: 'EVENT',
      semester: '',
      department: ''
    });
  };

  const handleEdit = (ev) => {
    setEditingEvent(ev);
    setFormData({
      title: ev.event,
      description: ev.description || '',
      start_date: ev.startDate.split('T')[0],
      end_date: ev.endDate ? ev.endDate.split('T')[0] : '',
      event_type: ev.type,
      semester: ev.semester || '',
      department: ev.department || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Terminate this milestone from the permanent record?')) return;
    try {
      await adminService.deleteEvent(id);
      setSuccess('Milestone redacted.');
      fetchEvents();
    } catch (err) {
      setError('Removal protocol failed.');
    }
  };

  // ── UI Helpers ───────────────────────────────────────────────────────────────
  const getTypeStyle = (type) => {
    switch (type) {
      case 'EXAM': return { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: <GraduationCap size={12}/> };
      case 'HOLIDAY': return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: <Info size={12}/> };
      case 'ASSIGNMENT': return { color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', icon: <Bookmark size={12}/> };
      case 'WORKSHOP': return { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: <Globe size={12}/> };
      case 'PLACEMENT': return { color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: <BookOpen size={12}/> };
      case 'CULTURAL': return { color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', icon: <Trophy size={12}/> };
      case 'SEMINAR': return { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', icon: <Users size={12}/> };
      case 'DEADLINE': return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: <AlertTriangle size={12}/> };
      default: return { color: 'text-primary-400', bg: 'bg-primary-500/10', border: 'border-primary-500/20', icon: <Clock size={12}/> };
    }
  };

  const getEventsForDay = (date) => {
    if (!date) return [];
    return events.filter(ev => {
        const s = new Date(ev.startDate);
        const e = ev.endDate ? new Date(ev.endDate) : s;
        s.setHours(0,0,0,0);
        e.setHours(23,59,59,999);
        const current = new Date(date);
        current.setHours(12,0,0,0);
        return current >= s && current <= e;
    });
  };

  const isPast = (date) => new Date(date) < new Date();

  return (
    <div className="space-y-12 animate-neural-fade pb-20 p-2">
      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-primary-500/20 border border-primary-500/30 rounded-lg text-[9px] font-black text-primary-400 uppercase tracking-widest">Temporal Intelligence</span>
                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-[9px] font-black text-emerald-400 uppercase tracking-widest">Live Node</span>
            </div>
            <h1 className="text-6xl font-black text-white italic uppercase tracking-tighter flex items-center gap-6">
                <Calendar className="text-primary-500 text-shadow-glow drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" size={64} />
                Temporal <span className="text-primary-500">Analytics</span>
            </h1>
            <p className="text-slate-500 uppercase tracking-[0.4em] text-[10px] font-bold flex items-center gap-2 max-w-xl leading-relaxed">
                Centralized framework for cross-departmental milestone synchronization and curriculum epoch management.
            </p>
        </div>

        <div className="flex items-center gap-4">
            <button className="p-4 bg-slate-900 border border-white/5 rounded-3xl text-slate-500 hover:text-white transition-all shadow-xl hover:bg-slate-800">
                <Download size={24} />
            </button>
            {isAdmin && (
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="btn-primary-secondary px-12 py-5 font-black text-[14px] uppercase tracking-[0.2em] flex items-center gap-4 shadow-3xl hover:shadow-primary-500/20 active:scale-95 group transition-all"
                >
                    <Plus size={24} className="group-hover:rotate-180 transition-transform duration-700" /> Initialize Epoch
                </button>
            )}
        </div>
      </header>

      {/* ── Main Dashboard Layout ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-12">
        
        {/* Left: Stats & Filters Column */}
        <div className="space-y-10">
            {/* Stats Overview */}
            <div className="glass-card p-10 border-white/5 space-y-8 bg-slate-900/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-primary-500">
                    <Database size={100} />
                </div>
                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                    <LayoutDashboard size={18} className="text-primary-500" /> Temporal Overview
                </h3>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Total Entries</p>
                        <p className="text-3xl font-black text-white italic">{stats.total}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Upcoming</p>
                        <p className="text-3xl font-black text-primary-500 italic">{stats.upcoming}</p>
                    </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest">
                        <span className="text-slate-500">Examinations</span>
                        <span className="text-rose-400">{stats.examsCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest">
                        <span className="text-slate-500">Administrative</span>
                        <span className="text-emerald-400">{stats.holidaysCount}</span>
                    </div>
                </div>
            </div>

            {/* Quick Filter Matrix */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-2 mb-4">Categorization Matrix</h3>
                {['ALL', 'EVENT', 'EXAM', 'PLACEMENT', 'CULTURAL', 'SEMINAR', 'HOLIDAY', 'DEADLINE'].map(type => (
                    <button
                        key={type}
                        onClick={() => setActiveFilter(type)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${activeFilter === type ? 'bg-primary-500 border-primary-500 text-white shadow-xl shadow-primary-500/20' : 'bg-slate-900 border-white/5 text-slate-500 hover:border-primary-500/20 hover:pl-6'}`}
                    >
                        <span>{type}</span>
                        {activeFilter === type && <CheckCircle size={14} />}
                    </button>
                ))}
            </div>
        </div>

        {/* Center: Calendar Grid Column (2 spans) */}
        <div className="xl:col-span-2 space-y-8">
            {/* Search & Navigation Bar */}
            <div className="glass-card p-6 flex items-center gap-6 border-white/5">
                <div className="relative flex-1 group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary-500 transition-colors">
                        <Search size={24} />
                    </div>
                    <input 
                        type="text" 
                        placeholder="SEARCH TIMELINE FOR BROADCASTS..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-16 bg-slate-950/50 rounded-2xl border-2 border-white/5 pl-16 pr-6 text-sm font-black italic tracking-widest focus:border-primary-500/50 transition-all outline-none uppercase"
                    />
                </div>
                <div className="flex bg-slate-950/50 p-2 rounded-2xl border border-white/5 h-16">
                    <button onClick={prevMonth} className="p-3 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"><ChevronLeft size={28} /></button>
                    <div className="flex flex-col items-center justify-center px-8 min-w-[140px]">
                        <span className="text-xs font-black text-white uppercase italic tracking-tighter leading-none">{monthName}</span>
                        <span className="text-[10px] font-black text-primary-500 leading-none mt-1 tracking-widest">{year}</span>
                    </div>
                    <button onClick={nextMonth} className="p-3 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"><ChevronRight size={28} /></button>
                </div>
            </div>

            {/* Grid Visualization */}
            <div className="glass-card p-10 border-white/5 bg-slate-900/40 relative">
                <div className="grid grid-cols-7 gap-4 mb-8">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                        <div key={d} className={`text-center text-[9px] font-black uppercase tracking-[0.3em] py-2  ${i === 0 || i === 6 ? 'text-rose-500/50' : 'text-slate-600'}`}>{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-6">
                    {calendarGrid.map((dt, idx) => {
                        const dayEvents = dt.date ? getEventsForDay(dt.date) : [];
                        const isToday = dt.date && dt.date.toDateString() === new Date().toDateString();

                        return (
                            <div key={idx} className={`min-h-[160px] rounded-[2rem] border transition-all flex flex-col p-4 relative overflow-hidden ${!dt.day ? 'border-transparent opacity-0' : (isToday ? 'border-primary-500/40 bg-primary-500/5 shadow-2xl shadow-primary-500/10' : 'border-white/5 bg-slate-950/20 hover:border-white/10 group')}`}>
                                {dt.day && (
                                    <>
                                        <div className="flex justify-between items-start z-10">
                                            <span className={`text-[12px] font-black ${isToday ? 'text-primary-500 italic scale-125' : 'text-slate-600'} transition-transform`}>{dt.day}</span>
                                            {dayEvents.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,1)]" />}
                                        </div>
                                        <div className="flex-1 space-y-2 mt-4 overflow-y-auto custom-scrollbar-mini pr-1 relative z-10">
                                            {dayEvents.map(ev => {
                                                const style = getTypeStyle(ev.type);
                                                return (
                                                    <button 
                                                        key={ev.id} 
                                                        onClick={() => isAdmin && handleEdit(ev)} 
                                                        className={`w-full flex items-center gap-2 p-2 rounded-xl border ${style.bg} ${style.border} ${style.color} text-[8px] font-black uppercase tracking-tighter truncate transition-all hover:scale-[1.05] shadow-inner group/item`}
                                                    >
                                                        {style.icon}
                                                        <span className="truncate">{ev.event}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* Right: Broadcast Feed Column */}
        <div className="space-y-8">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-2">Live Timeline Feed</h3>
            <div className="glass-card flex flex-col h-[850px] border-white/5 bg-slate-900/60 overflow-hidden shadow-edge">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    {filteredEvents.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale italic p-10">
                            <Activity size={80} strokeWidth={1} className="mb-6 animate-pulse" />
                            <p className="text-xs uppercase font-black tracking-widest leading-relaxed">System Synchronizer: No matching spatial data found in epoch.</p>
                        </div>
                    ) : (
                        [...filteredEvents].sort((a,b) => new Date(a.startDate) - new Date(b.startDate)).map((ev) => {
                            const style = getTypeStyle(ev.type);
                            const past = isPast(ev.startDate);
                            return (
                                <div key={ev.id} className={`group p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:border-primary-500/30 transition-all relative overflow-hidden flex flex-col items-start ${past ? 'opacity-50 grayscale hover:grayscale-0' : ''}`}>
                                    <div className={`absolute top-0 right-0 p-12 opacity-5 ${style.color}`}>
                                        {style.icon}
                                    </div>
                                    <div className="flex items-start justify-between w-full gap-4 mb-6">
                                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-slate-950 rounded-2xl border border-white/5 shadow-2xl group-hover:border-primary-500/40 transition-all">
                                            <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest">{new Date(ev.startDate).toLocaleDateString('default', { month: 'short' })}</span>
                                            <span className="text-2xl font-black text-white italic tracking-tighter">{new Date(ev.startDate).getDate()}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${style.color} ${style.bg} ${style.border}`}>
                                                    {ev.type}
                                                </span>
                                                {past && <span className="text-[8px] font-black text-slate-600 uppercase border border-white/10 px-2 py-1 rounded-full">Archive</span>}
                                            </div>
                                            <h4 className="text-xl font-black text-white uppercase italic tracking-tighter group-hover:text-primary-400 transition-colors truncate">{ev.event}</h4>
                                        </div>
                                    </div>
                                    
                                    <p className="text-xs text-slate-500 font-medium italic leading-[1.8] line-clamp-3 mb-6">{ev.description || 'Spatial parameters undefined in global matrix.'}</p>
                                    
                                    <div className="flex items-center justify-between w-full pt-6 border-t border-white/5">
                                        <div className="flex gap-6">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Target Sector</span>
                                                <span className="text-[10px] font-black text-white uppercase italic flex items-center gap-2 group-hover:text-primary-500 transition-colors">
                                                    <Globe size={12} /> {ev.department || 'GLOBAL BROADCAST'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Cohort</span>
                                                <span className="text-[10px] font-black text-white uppercase italic">S-0{ev.semester || 'X'}</span>
                                            </div>
                                        </div>
                                        {isAdmin && (
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => handleEdit(ev)} className="w-12 h-12 flex items-center justify-center bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 rounded-2xl transition-all shadow-xl"><Pencil size={18} /></button>
                                                <button onClick={() => handleDelete(ev.id)} className="w-12 h-12 flex items-center justify-center bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all shadow-xl"><Trash2 size={18} /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* ── Modal Integration Strategy ────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-950/95 backdrop-blur-3xl animate-in fade-in duration-500 overflow-y-auto">
          <div className="glass-card w-full max-w-2xl p-12 space-y-12 animate-neural-zoom relative overflow-hidden border-white/10 shadow-3xl bg-[#0a0f1c]/90 my-auto">
             <div className="absolute top-0 left-0 w-3 h-full bg-gradient-to-b from-primary-500 to-indigo-600" />
             <div className="absolute top-0 right-0 p-20 opacity-[0.03] -z-0">
                <Share2 size={240} className="rotate-12" />
             </div>

             <div className="flex items-center justify-between relative z-10">
                <div className="space-y-2">
                    <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
                        {editingEvent ? 'Synchronize' : 'Initialize'} <span className="text-primary-500">Milestone</span>
                    </h2>
                    <div className="flex items-center gap-3">
                        <div className="h-1.5 w-24 bg-primary-500/50 rounded-full" />
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic leading-none">Security Protocol: Admin Authorised</p>
                    </div>
                </div>
                <button onClick={() => setShowModal(false)} className="bg-slate-800/50 hover:bg-rose-500/20 p-5 rounded-[2rem] text-slate-500 hover:text-rose-500 transition-all group border border-white/5 active:scale-90">
                    <XCircle size={40} />
                </button>
             </div>

             <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-12 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2">
                            <Activity size={12} /> Designator Title
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full h-20 bg-slate-950/60 rounded-[1.5rem] border-2 border-white/5 px-8 text-xl font-black italic uppercase tracking-widest focus:border-primary-500/50 transition-all outline-none"
                            placeholder="E.G. SEMESTER_V_FINALS"
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2">
                            <ShieldAlert size={12} /> Type Class
                        </label>
                        <select
                            required
                            value={formData.event_type}
                            onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                            className="w-full h-20 bg-slate-950/60 rounded-[1.5rem] border-2 border-white/5 px-8 text-xs font-black uppercase tracking-widest cursor-pointer focus:border-primary-500/50 outline-none appearance-none"
                        >
                             <option value="EVENT">Institutional Event</option>
                             <option value="EXAM">Examination Period</option>
                             <option value="PLACEMENT">Placement/Career Drive</option>
                             <option value="CULTURAL">Cultural Symposium</option>
                             <option value="SEMINAR">Technical Seminar</option>
                             <option value="HOLIDAY">Administrative Holiday</option>
                             <option value="WORKSHOP">Workshop/Training</option>
                             <option value="DEADLINE">Critical Termination</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2">
                        <Database size={12} /> Mission Parameters
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full min-h-[160px] bg-slate-950/60 rounded-[1.5rem] border-2 border-white/5 p-8 text-sm font-bold italic leading-relaxed focus:border-primary-500/50 transition-all outline-none"
                        placeholder="Append spatial context and mission objectives..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Temporal Ingress</label>
                        <input
                            type="date"
                            required
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            className="w-full h-20 bg-slate-950/60 rounded-[1.5rem] border-2 border-white/5 px-8 text-sm font-black tracking-widest focus:border-primary-500/50 outline-none"
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Temporal Egress</label>
                        <input
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            className="w-full h-20 bg-slate-950/60 rounded-[1.5rem] border-2 border-white/5 px-8 text-sm font-black tracking-widest focus:border-primary-500/50 outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Target Cohort (SEM)</label>
                        <input
                            type="number"
                            value={formData.semester}
                            onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                            className="w-full h-20 bg-slate-950/60 rounded-[1.5rem] border-2 border-white/5 px-8 text-lg font-black italic focus:border-primary-500/50 outline-none"
                            placeholder="0-8 (Optional)"
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Department Sector</label>
                        <select
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            className="w-full h-20 bg-slate-950/60 rounded-[1.5rem] border-2 border-white/5 px-8 text-[11px] font-black uppercase tracking-widest cursor-pointer appearance-none outline-none"
                        >
                            <option value="">Global Network</option>
                            <option value="CSE">Comp Science</option>
                            <option value="ISE">Information</option>
                            <option value="ECE">Electronics</option>
                            <option value="AIML">AI-Driven</option>
                            <option value="ME">Mechanical</option>
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-8 mt-4 bg-gradient-to-r from-primary-600 to-indigo-700 text-white rounded-[2.5rem] font-black text-[14px] uppercase tracking-[0.3em] flex items-center justify-center gap-6 shadow-4xl hover:brightness-125 transition-all active:scale-95 disabled:grayscale group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
                    {submitting ? <Loader2 className="animate-spin" size={32} /> : (editingEvent ? <ShieldCheck size={32} /> : <Plus size={32} />)}
                    <span className="relative z-10">{submitting ? 'REWRITING TEMPORAL VOID...' : (editingEvent ? 'SYNCHRONIZE EPOCH PROTOCOL' : 'INITIALIZE TIMELINE BROADCAST')}</span>
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicCalendar;
