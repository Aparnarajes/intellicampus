import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Calendar, CheckSquare, Bell, Clock,
  Save, UserCheck, Loader2, Users, FlaskConical,
  ArrowLeft, RefreshCw, Smartphone,
  TrendingUp, ShieldCheck, BookOpen, Zap, Layers
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentLesson, getTodaySchedule, facultyNames } from '../../utils/timetableData';
import academicService from '../../services/academicService';
import { useAuth } from '../../hooks/useAuth';

// ─── Session type badge ───────────────────────────────────────────────────────
const SessionBadge = ({ lesson }) => {
  if (!lesson) return (
    <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-900 text-slate-600 border border-white/5">
      Session Parameters Undefined
    </span>
  );
  if (lesson.isLab) return (
    <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-2 w-fit shadow-[0_0_15px_rgba(99,102,241,0.1)]">
      <FlaskConical size={12} className="animate-pulse" /> Specialized Lab Sector
    </span>
  );
  if (lesson.isOpenHour) return (
    <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-2 w-fit shadow-[0_0_15px_rgba(245,158,11,0.1)]">
      <Clock size={12} /> Open Scholastic Hour
    </span>
  );
  return (
    <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-2 w-fit shadow-[0_0_15px_rgba(16,185,129,0.1)]">
      <Users size={12} /> Standard Pedagogical Session
    </span>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
const MarkAttendance = () => {
  const [batch, setBatch] = useState('All');
  const [availableBatches, setAvailableBatches] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null); // full subject object {subjectId, subjectCode, subjectName, section}
  const [apiSubjects, setApiSubjects] = useState([]);           // subjects from API (have real IDs)
  const [students, setStudents] = useState([]);
  const [allFetchedStudents, setAllFetchedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitResult, setSubmitResult] = useState(null);

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const passedState = location.state || {};

  // ── On mount: load API subjects first, then students ────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // 1. Fetch real subjects from API (contains actual subjectId)
        const subRes = await academicService.getFacultySubjects();
        const subs = subRes.data || [];
        setApiSubjects(subs);

        // 2. Auto-select subject if passed from navigation state
        if (passedState.subjectCode) {
          const match = subs.find(s => s.subjectCode === passedState.subjectCode);
          if (match) setSelectedSubject(match);
        } else if (subs.length === 1) {
          setSelectedSubject(subs[0]);
        }

        // 3. Fetch students
        await fetchStudents(subs);
      } catch (err) {
        console.error('Init error:', err);
        setLoading(false);
      }
    };
    init();
  }, []);

  // ── Update timetable when date changes ─────────────────────────────────────
  useEffect(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    const lesson = getCurrentLesson(d);
    setCurrentLesson(lesson);
    setTodaySchedule(getTodaySchedule(d));
  }, [selectedDate]);

  // ── Clicking a timetable slot manually ─────────────────────────────────────
  const handleSlotClick = (slot) => {
    if (!slot || slot.isSpecial) return;
    if (slot.subjectCode) {
      const match = apiSubjects.find(s => s.subjectCode === slot.subjectCode);
      if (match) setSelectedSubject(match);
    }
  };

  // ── Fetch students ──────────────────────────────────────────────────────────
  const fetchStudents = async (subs) => {
    setLoading(true);
    try {
      let data = [];
      const subCode = passedState.subjectCode;
      const sec = passedState.section;

      if (subCode && sec) {
        const res = await academicService.getStudentsBySubject(subCode, sec);
        data = res.data || [];
      } else {
        const res = await academicService.getStudents();
        data = res.data || [];
      }

      setAllFetchedStudents(data);
      const batches = [...new Set(data.filter(s => s.batch || s.section).map(s => s.batch || s.section))].sort();
      setAvailableBatches(batches);
      filterAndSetStudents(data, batch);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSetStudents = (data, currentBatch) => {
    const filtered = currentBatch === 'All'
      ? data
      : data.filter(s => s.batch === currentBatch || s.section === currentBatch);
    setStudents(filtered.map(s => ({ ...s, status: 'present', parentNotified: false })));
  };

  // Re-filter when batch changes
  useEffect(() => {
    if (allFetchedStudents.length > 0) {
      filterAndSetStudents(allFetchedStudents, batch);
    }
  }, [batch, allFetchedStudents]);

  // ── Toggle student status ───────────────────────────────────────────────────
  const toggleStatus = (id) => {
    setStudents(prev => prev.map(s => {
      if (s._id === id) {
        const newStatus = s.status === 'present' ? 'absent' : 'present';
        return { ...s, status: newStatus, parentNotified: newStatus === 'absent' };
      }
      return s;
    }));
  };

  const markAllPresent = () => setStudents(prev => prev.map(s => ({ ...s, status: 'present', parentNotified: false })));
  const markAllAbsent = () => setStudents(prev => prev.map(s => ({ ...s, status: 'absent', parentNotified: true })));

  // ── Submit — batch save (single API call) ───────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedSubject) {
      setSubmitResult({ type: 'error', msg: 'Please select a subject before submitting.' });
      return;
    }
    if (students.length === 0) {
      setSubmitResult({ type: 'error', msg: 'No students to mark attendance for.' });
      return;
    }

    setSubmitting(true);
    setSubmitResult(null);

    try {
      const records = students.map(student => ({
        studentId: student._id,
        status: student.status === 'present' ? 'PRESENT' : 'ABSENT',
      }));

      // Single API call — saves all records in one transaction
      const result = await academicService.markAttendanceBatch(
        selectedSubject.subjectId,   // ← real DB ID from API (not static local data)
        selectedDate,
        records
      );

      const absentCount = students.filter(s => s.status === 'absent').length;
      setSubmitResult({
        type: 'success',
        msg: `✅ Attendance saved for ${result.data?.count || students.length} students. ${absentCount} absent in "${selectedSubject.subjectName}".`,
      });
      setTimeout(() => navigate('/faculty/history'), 2500);
    } catch (err) {
      console.error('[ATTENDANCE] Submit error:', err);
      const msg = err.response?.data?.message || 'Failed to save attendance. Check connection.';
      setSubmitResult({ type: 'error', msg });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const filteredStudents = useMemo(() =>
    students.filter(s =>
      (s.name || s.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.usn || '').toLowerCase().includes(searchTerm.toLowerCase())
    ), [students, searchTerm]);

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.length - presentCount;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Result Banner */}
      {submitResult && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 font-bold text-sm ${submitResult.type === 'success'
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
          {submitResult.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <button
              onClick={() => navigate('/faculty')}
              className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all active:scale-95 group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em] bg-emerald-500/5 px-3 py-1 rounded-lg border border-emerald-500/10">
              <UserCheck size={12} className="animate-pulse" />
              <span>Presence Registration Engine</span>
            </div>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter leading-none uppercase italic">
            Neural <span className="text-emerald-500 text-shadow-glow">Registry</span>
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <SessionBadge lesson={currentLesson} />
            {currentLesson && (
              <span className="text-xs text-slate-500 font-bold">
                {currentLesson.start}–{currentLesson.end}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-900 border border-white/5 rounded-xl flex items-center gap-3">
            <Calendar size={18} className="text-emerald-500" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Select Date</span>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>
          </div>
          <div className="px-4 py-2 bg-slate-900 border border-white/5 rounded-xl hidden lg:flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-slate-500 text-[9px] font-black uppercase tracking-widest">
              <Clock size={10} /> Live Time
            </div>
            <div className="text-xs font-bold text-white">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || students.length === 0 || !selectedSubject}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:grayscale text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 transition-all shadow-2xl shadow-emerald-500/20 active:scale-95 group"
          >
            {submitting
              ? <RefreshCw size={20} className="animate-spin" />
              : <Save size={20} className="group-hover:rotate-6 transition-transform" />
            }
            {submitting ? 'SAVING...' : 'SAVE ATTENDANCE'}
          </button>
        </div>
      </div>

      {/* ── Config Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Search + Subject */}
        <div className="lg:col-span-3 glass-card p-4 flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search by name or USN…"
              className="input-field pl-11 h-11 text-sm w-full"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {/* Subject selector — uses API subjects so subjectId is always resolved */}
          <select
            className="input-field px-4 h-11 text-sm bg-slate-900 border-white/5 focus:border-emerald-500/50 flex-1 md:w-[300px]"
            value={selectedSubject?.subjectCode || ''}
            onChange={e => {
              const found = apiSubjects.find(s => s.subjectCode === e.target.value);
              setSelectedSubject(found || null);
            }}
          >
            <option value="">— Select Subject —</option>
            {apiSubjects.map(sub => (
              <option key={sub.subjectCode} value={sub.subjectCode}>
                {sub.subjectName} ({sub.subjectCode}) — Sec {sub.section}
              </option>
            ))}
          </select>
        </div>

        {/* Batch filter */}
        <div className="glass-card p-4 flex flex-col gap-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Layers size={10} /> Batch Filter
          </p>
          <select
            className="input-field px-4 h-11 text-sm bg-slate-900 border-white/5 focus:border-emerald-500/50 w-full font-bold"
            value={batch}
            onChange={e => setBatch(e.target.value)}
          >
            <option value="All">All Batches</option>
            {availableBatches.map(b => (
              <option key={b} value={b}>Batch {b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Current session info bar ── */}
      {selectedSubject && (
        <div className="flex items-center gap-6 px-8 py-6 bg-slate-900/60 border border-white/5 rounded-[2rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-emerald-500 group-hover:scale-110 transition-transform duration-1000">
            <Zap size={100} />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shrink-0">
            <ShieldCheck size={24} className="animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Pedagogical Sector Identified</p>
            <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-white italic uppercase tracking-tighter truncate leading-none">
                {selectedSubject.subjectName}
                </h2>
                <span className="px-3 py-1 bg-slate-950 border border-white/5 rounded-full text-[9px] font-black text-primary-500 uppercase tracking-widest mt-1">Section {selectedSubject.section}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Entity Count</p>
            <span className="text-lg font-black text-white italic">{students.length} NODES</span>
          </div>
        </div>
      )}

      {/* ── Main layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">

        {/* Student Table */}
        <div className="xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
              <Users size={14} className="text-primary-500" />
              Student List
              {batch !== 'All' && (
                <span className="text-[10px] text-primary-400 bg-primary-500/10 border border-primary-500/20 px-2 py-0.5 rounded-full">
                  Batch {batch}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllAbsent}
                className="text-[10px] font-black uppercase text-rose-500 hover:text-white px-3 py-1.5 border border-rose-500/20 rounded-lg hover:bg-rose-500 transition-all"
              >
                All Absent
              </button>
              <button
                onClick={markAllPresent}
                className="text-[10px] font-black uppercase text-emerald-500 hover:text-white px-3 py-1.5 border border-emerald-500/20 rounded-lg hover:bg-emerald-500 transition-all"
              >
                All Present
              </button>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            {loading ? (
              <div className="p-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-emerald-500" size={40} />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Loading Students…</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-16 text-center">
                <Users size={40} className="mx-auto text-slate-700 mb-4 opacity-30" />
                <p className="text-slate-500 font-bold">No students found</p>
                <p className="text-slate-600 text-xs mt-1">
                  {!selectedSubject ? 'Select a subject to load students.' : 'Try a different batch or search term.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-900/80 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Student</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">USN</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Section</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Alert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredStudents.map(student => {
                    const sid = student._id;
                    const isPresent = student.status === 'present';
                    return (
                      <tr key={sid} className={`group transition-all duration-300 ${isPresent ? 'hover:bg-emerald-500/5' : 'hover:bg-rose-500/5'}`}>
                        {/* Name */}
                        <td className="px-6 py-6 border-b border-white/5">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-md font-black transition-all border shadow-lg ${isPresent ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                              }`}>
                              {(student.name || student.fullName || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="space-y-0.5">
                                <p className={`text-md font-black uppercase italic tracking-tight transition-colors ${isPresent ? 'text-white group-hover:text-emerald-400' : 'text-rose-400'}`}>
                                {student.name || student.fullName}
                                </p>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Identity Synchronized</span>
                            </div>
                          </div>
                        </td>
                        {/* USN */}
                        <td className="px-6 py-6 text-center border-b border-white/5">
                          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-white/5 shadow-inner">
                            {student.usn || '—'}
                          </span>
                        </td>
                        {/* Section */}
                        <td className="px-6 py-6 text-center border-b border-white/5">
                          <span className="text-[10px] font-black px-3 py-1.5 rounded-xl border bg-primary-500/10 text-primary-400 border-primary-500/20 shadow-sm">
                            SEC {student.section || student.batch || 'N/A'}
                          </span>
                        </td>
                        {/* Status toggle */}
                        <td className="px-6 py-6 border-b border-white/5">
                          <div className="flex justify-center gap-4">
                            <button
                              onClick={() => toggleStatus(sid)}
                              className={`w-28 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border ${isPresent
                                ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-105'
                                : 'bg-slate-900 text-slate-500 border-white/5 hover:border-emerald-500/40 hover:text-emerald-400'
                                }`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => toggleStatus(sid)}
                              className={`w-28 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border ${!isPresent
                                ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)] scale-105'
                                : 'bg-slate-900 text-slate-500 border-white/5 hover:border-rose-500/40 hover:text-rose-400'
                                }`}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                        {/* Alert */}
                        <td className="px-6 py-6 text-right border-b border-white/5">
                          {!isPresent ? (
                            <div className="inline-flex items-center gap-2 text-rose-400 bg-rose-500/10 px-4 py-2 rounded-2xl border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                              <Smartphone size={12} className="animate-bounce" />
                              <span className="text-[9px] font-black uppercase tracking-widest">Alert Armed</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 text-emerald-500/40 font-black text-[10px] uppercase tracking-[0.15em]">
                                <ShieldCheck size={12} /> Verified
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Timetable */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                <Calendar size={13} className="text-primary-500" />
                {new Date(selectedDate).toDateString() === new Date().toDateString() ? "Today's Schedule" : "Selected Schedule"}
              </h3>
              <span className="text-[10px] font-bold text-slate-500">
                {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
              </span>
            </div>
            <div className="glass-card overflow-hidden">
              {todaySchedule.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-slate-600 text-xs font-bold">No classes scheduled.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {todaySchedule.map((slot, i) => {
                    const now = new Date();
                    const isToday = now.toDateString() === new Date(selectedDate + 'T00:00:00').toDateString();
                    const cur = now.getHours() * 60 + now.getMinutes();
                    const [sh, sm] = slot.start.split(':').map(Number);
                    const [eh, em] = slot.end.split(':').map(Number);
                    const isLive = isToday && cur >= sh * 60 + sm && cur <= eh * 60 + em;
                    const isPast = isToday ? cur > eh * 60 + em : new Date(selectedDate) < now;

                    return (
                      <button
                        key={i}
                        onClick={() => !slot.isSpecial && handleSlotClick(slot)}
                        disabled={slot.isSpecial}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-all ${slot.isSpecial ? 'cursor-default' : 'hover:bg-white/5 cursor-pointer'} ${isLive ? 'bg-emerald-500/5' : ''}`}
                      >
                        <div className="mt-1.5 shrink-0">
                          {isLive
                            ? <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]" />
                            : isPast
                              ? <div className="w-2 h-2 rounded-full bg-slate-800" />
                              : slot.isLab
                                ? <div className="w-2 h-2 rounded-full bg-purple-500/40 border border-purple-500/60" />
                                : <div className="w-2 h-2 rounded-full border border-slate-500" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${isLive ? 'text-emerald-400' : 'text-slate-600'}`}>
                            {slot.start}–{slot.end}{isLive && <span className="ml-1 text-emerald-400"> ● LIVE</span>}
                          </p>
                          <p className={`text-xs font-bold leading-snug truncate ${isPast ? 'text-slate-700' : isLive ? 'text-emerald-300' : 'text-slate-300'}`}>
                            {slot.title || '—'}
                          </p>
                        </div>
                        {!slot.isSpecial && !isPast && slot.subjectCode && (
                          <Zap size={10} className="shrink-0 mt-1.5 text-primary-500/30" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Live Summary */}
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2 mb-3">
              <CheckSquare size={13} className="text-emerald-500" />
              Live Summary
            </h3>
            <div className="glass-card p-5 border-emerald-500/20">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Attendance</p>
                  <p className="text-4xl font-black text-white mt-1">
                    {students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0}%
                  </p>
                </div>
                <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                  <TrendingUp className="text-emerald-500" size={20} />
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Present</span>
                  <span className="text-xs font-black text-emerald-400">{presentCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />Absent</span>
                  <span className="text-xs font-black text-rose-400">{absentCount}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="flex items-center gap-2 text-xs text-slate-400"><Users size={12} className="text-primary-500" />Total</span>
                  <span className="text-xs font-black text-white">{students.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notice card */}
          <div className="glass-card p-5 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border-indigo-500/20">
            <Bell className="text-indigo-400 mb-3" size={20} />
            <h4 className="text-xs font-black text-white uppercase tracking-[0.1em] mb-2">Auto-Alert System</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
              After saving, alerts are sent to parents of absent students.
            </p>
            <div className="flex items-center gap-1.5 py-1.5 px-3 bg-white/5 rounded-lg border border-white/10 w-fit">
              <ShieldCheck size={10} className="text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-300">Compliance Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;