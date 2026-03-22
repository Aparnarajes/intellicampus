import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon, Clock, Filter, Search, Download,
  Users, ChevronRight, FileText, BarChart3,
  ArrowLeft, RefreshCw, UserCheck, AlertTriangle,
  CheckCircle2, XCircle, Edit3, Save, ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// Removed static subjectsBySemester import — subjects now come from API
import academicService from '../../services/academicService';
import { useAuth } from '../../hooks/useAuth';

const AttendanceHistory = () => {
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSubject, setSelectedSubject] = useState(''); // stores subjectCode
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(null); // ID of record being updated
  const [apiSubjects, setApiSubjects] = useState([]); // subjects from API with real codes

  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load faculty subjects from API on mount
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const res = await academicService.getFacultySubjects();
        setApiSubjects(res.data || []);
      } catch (err) {
        console.error('Failed to load subjects:', err);
      }
    };
    loadSubjects();
  }, []);

  useEffect(() => {
    fetchDates();
  }, []);

  useEffect(() => {
    if (selectedDate && selectedSubject) {
      fetchSessionRecords();
    } else {
      setRecords([]);
    }
  }, [selectedDate, selectedSubject, selectedBatch]);

  const fetchDates = async () => {
    try {
      const res = await academicService.getAttendanceDates();
      if (res.success) {
        setDates(res.data);
        // If current selected date isn't in dates but dates exist, maybe pick latest
        if (res.data.length > 0 && !selectedDate) {
          setSelectedDate(res.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch attendance dates:', err);
    }
  };

  const fetchSessionRecords = async () => {
    setIsLoading(true);
    try {
      const res = await academicService.getSessionAttendance(selectedDate, selectedSubject);
      if (res.success) {
        setRecords(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch session records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (id, currentStatus) => {
    // DB stores PRESENT/ABSENT in uppercase — toggle accordingly
    const newStatus = currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT';
    setIsUpdating(id);
    try {
      const res = await academicService.updateAttendanceRecord(id, newStatus);
      if (res.success) {
        setRecords(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
      }
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update attendance status.');
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredRecords = records.filter(r =>
    (r.student?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.student?.usn || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: records.length,
    present: records.filter(r => r.status === 'PRESENT').length,
    absent: records.filter(r => r.status === 'ABSENT').length,
    percentage: records.length ? Math.round((records.filter(r => r.status === 'PRESENT').length / records.length) * 100) : 0
  };

  return (
    <div className="space-y-8 animate-neural-fade pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/faculty')}
              className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all shadow-lg active:scale-95"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2 text-primary-400 font-bold text-[10px] uppercase tracking-[0.2em]">
              <CalendarIcon size={12} />
              <span>Attendance Archives</span>
            </div>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-none">
            Review <span className="text-primary-500">& Edit</span>
          </h1>
          <p className="text-slate-400 mt-3 font-medium">Modify previous attendance records and correct errors.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-900 border border-white/5 rounded-xl">
            <div className="flex items-center gap-2 text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">
              <BarChart3 size={10} /> Active Filter Stats
            </div>
            <div className="text-xs font-bold text-white uppercase">
              {stats.present}/{stats.total} Present ({stats.percentage}%)
            </div>
          </div>
        </div>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 glass-card p-4 grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Subject — uses real API subjects with subjectCode */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Subject</label>
            <select
              className="input-field px-4 h-11 text-sm bg-slate-900"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">— Select Subject —</option>
              {apiSubjects.map((sub) => (
                <option key={sub.subjectCode} value={sub.subjectCode}>
                  {sub.subjectName} ({sub.subjectCode})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker / Quick Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date</label>
            <input
              type="date"
              className="input-field px-4 h-11 text-sm bg-slate-900"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        {/* Batch Selector */}
        <div className="glass-card p-4 space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Batch Filter</label>
          <select
            className="input-field px-4 h-11 text-sm bg-slate-900 font-bold"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
          >
            <option value="All">All Batches</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
            <option value="no-batch">Unassigned</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-4">
          {/* Search bar */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search students in this session..."
              className="input-field pl-12 h-12 text-sm bg-slate-900/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="glass-card overflow-hidden min-h-[400px]">
            {!selectedSubject ? (
              <div className="p-20 text-center">
                <FileText size={48} className="mx-auto text-slate-700 mb-4 opacity-20" />
                <h4 className="text-white font-bold">Select a Subject</h4>
                <p className="text-slate-500 text-sm mt-1">Choose a subject and date to view records.</p>
              </div>
            ) : isLoading ? (
              <div className="p-20 flex flex-col items-center justify-center gap-4">
                <RefreshCw className="animate-spin text-primary-500" size={40} />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fetching Session Data...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-20 text-center">
                <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4 opacity-20" />
                <h4 className="text-white font-bold">No Records Found</h4>
                <p className="text-slate-500 text-sm mt-1">No attendance was marked for this combination.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-900/80 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Student</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Batch</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRecords.map((record) => (
                    <tr key={record._id} className="group hover:bg-white/5 transition-all">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl border border-white/5 flex items-center justify-center text-xs font-black
                            ${record.status === 'Present' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {record.student?.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{record.student?.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{record.student?.usn}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[10px] font-bold px-2 py-1 bg-slate-900 rounded border border-white/5 text-slate-400">
                          {record.student?.batch || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg border uppercase tracking-wider
                          ${record.status === 'PRESENT'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleStatusUpdate(record._id, record.status)}
                          disabled={isUpdating === record._id}
                          className={`p-2 rounded-lg border transition-all 
                            ${record.status === 'PRESENT'
                              ? 'text-rose-400 border-rose-400/20 hover:bg-rose-400/10'
                              : 'text-emerald-400 border-emerald-400/20 hover:bg-emerald-400/10'}`}
                          title={`Mark as ${record.status === 'PRESENT' ? 'Absent' : 'Present'}`}
                        >
                          {isUpdating === record._id ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : record.status === 'PRESENT' ? (
                            <UserCheck size={16} className="text-rose-400" />
                          ) : (
                            <UserCheck size={16} className="text-emerald-400" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sidebar - Sessions found for this day */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
            <Clock size={14} className="text-primary-500" />
            Dates with Records
          </h3>
          <div className="glass-card max-h-[500px] overflow-y-auto divide-y divide-white/5">
            {dates.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs italic">No archives found.</div>
            ) : (
              dates.slice(0, 10).map((d) => (
                <button
                  key={d._id}
                  onClick={() => setSelectedDate(d._id)}
                  className={`w-full text-left p-4 hover:bg-white/5 transition-all flex items-center justify-between
                    ${selectedDate === d._id ? 'bg-primary-500/10 border-l-2 border-primary-500' : ''}`}
                >
                  <div>
                    <p className="text-xs font-bold text-white">
                      {new Date(d._id).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      {d.count} records
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-slate-700" />
                </button>
              ))
            )}
          </div>

          <div className="glass-card p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <AlertTriangle className="text-amber-500 mb-4" size={24} />
            <h4 className="text-sm font-black text-white uppercase tracking-[0.1em] mb-2">Audit Mode</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Changes made here are logged and will trigger status updates in student dashboards immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;