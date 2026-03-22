import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Search, Filter, Mail, User as UserIcon,
  GraduationCap, Download, MoreVertical, RefreshCw,
  ChevronRight, Calendar, Hash, ShieldCheck, Clock
} from 'lucide-react';
import academicService from '../../services/academicService';
import { useAuth } from '../../hooks/useAuth';
import { useMemo } from 'react';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [batchFilter, setBatchFilter] = useState('All');
  const { user } = useAuth();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await academicService.getStudents();
      setStudents(data.data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load student registry');
    } finally {
      setIsLoading(false);
    }
  };

  const availableBatches = useMemo(() => {
    if (user?.handledBatches && user.handledBatches.length > 0) {
      return user.handledBatches;
    }
    return [...new Set(students.filter(s => s.batch).map(s => s.batch))].sort();
  }, [user, students]);

  const batches = ['All', 'No Batch', ...availableBatches];

  const filteredStudents = students.filter(student => {
    // If faculty has specific batches, only show those students
    const isInHandledBatch = (user?.handledBatches && user.handledBatches.length > 0)
      ? user.handledBatches.includes(student.batch)
      : true;

    if (!isInHandledBatch) return false;

    const matchesSearch =
      (student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.usn || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBatch = batchFilter === 'All'
      ? true
      : batchFilter === 'No Batch'
        ? !student.batch
        : student.batch === batchFilter;

    return matchesSearch && matchesBatch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* High-Fidelity Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-4">
        <div>
          <div className="flex items-center gap-2 text-primary-400 font-black text-[10px] uppercase tracking-[0.4em] mb-3 bg-primary-500/5 px-4 py-1.5 rounded-xl border border-primary-500/10 w-fit">
            <Users size={14} className="animate-pulse" />
            <span>Institutional Monitoring Substrate</span>
          </div>
          <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none mb-3">
            Managed Student <span className="text-primary-500 text-shadow-glow">Intelligence</span> Registry
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic">Faculty oversight · Real-time scholastic engagement diagnostics</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchStudents}
            className="p-4 bg-slate-900 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all active:scale-95 group shadow-2xl"
          >
            <RefreshCw size={20} className={`group-hover:rotate-180 transition-transform duration-700 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 border border-white/5 rounded-2xl text-[10px] font-black uppercase text-slate-300 hover:bg-slate-800 transition-all shadow-2xl group">
            <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
            Registry Export
          </button>
        </div>
      </div>

      {/* Collegiate Telemetry Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Controlled Nodes', value: filteredStudents.length, icon: Users, color: 'indigo', trend: 'Nodes in assigned sectors' },
          { label: 'Scholastic Velocity', value: '84%', icon: GraduationCap, color: 'primary', trend: 'Average engagement density' },
          { label: 'Session Handshakes', value: '142', icon: Clock, color: 'emerald', trend: 'Active presence today' },
          { label: 'Collective Density', value: students.length, icon: ShieldCheck, color: 'rose', trend: 'Total students in registry' }
        ].map((stat, i) => (
            <div key={i} className="bg-slate-900/60 border border-white/5 p-6 rounded-[2rem] flex flex-col justify-between hover:bg-slate-800/40 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-white group-hover:scale-110 transition-transform">
                    <stat.icon size={60} />
                </div>
                <div className="space-y-1 relative z-10">
                    <p className={`text-[9px] font-black text-${stat.color}-500/60 uppercase tracking-[0.3em]`}>{stat.label}</p>
                    <p className="text-3xl font-black text-white italic">{stat.value}</p>
                </div>
                <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-4 relative z-10">{stat.trend}</p>
            </div>
        ))}
      </div>

      {/* Registry Intelligence Filter */}
      <div className="bg-slate-900/60 border border-white/5 rounded-[2.5rem] p-4 flex flex-wrap gap-4 items-center shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/5 to-primary-500/0 translate-x-[-100%] group-hover:translate-x-full transition-transform duration-1000" />
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
          <input
            type="text"
            placeholder="Search Global Registry (USN, Name, Email)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border-none rounded-2xl pl-16 py-4 text-xs font-bold text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-primary-500/20 transition-all shadow-inner"
          />
        </div>
        <div className="relative">
          <select
            className="bg-slate-950 border-none rounded-2xl px-12 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 focus:ring-2 focus:ring-primary-500/20 outline-none cursor-pointer appearance-none shadow-inner"
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
          >
            {batches.map(b => (
                <option key={b} value={b}>
                    {b === 'All' ? 'Every Batch' : b === 'No Batch' ? 'Unassigned Nodes' : `Batch ${b} Sector`}
                </option>
            ))}
          </select>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-700">
            <Filter size={14} />
          </div>
        </div>
        <div className="px-6 text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500">{filteredStudents.length} Nodes</p>
            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">Actively Tracked</p>
        </div>
      </div>

      {/* Registry Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glass-card h-48 animate-pulse bg-white/5"></div>
          ))}
        </div>
      ) : error ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
            <Hash className="text-rose-500" size={24} />
          </div>
          <h3 className="text-white font-bold text-xl mb-2">Connection Error</h3>
          <p className="text-slate-400 mb-6">{error}</p>
          <button onClick={fetchStudents} className="btn-primary px-8 h-12 text-sm mx-auto">Try Reconnecting</button>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="glass-card p-20 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mx-auto mb-6">
            <Users className="text-slate-700" size={32} />
          </div>
          <h3 className="text-2xl font-black text-white mb-2">No Students Found</h3>
          <p className="text-slate-500 max-w-sm mx-auto">We couldn't find any students matching your current search parameters or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredStudents.map((student) => (
            <div key={student.id} className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 group hover:border-primary-500/30 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] relative overflow-hidden flex flex-col h-full shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-white group-hover:scale-110 transition-transform">
                <GraduationCap size={120} />
              </div>
              
              <div className="relative z-10 flex items-start gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-white/5 flex items-center justify-center text-primary-400 shadow-2xl group-hover:from-primary-600 group-hover:to-primary-700 group-hover:text-white transition-all duration-500">
                  <UserIcon size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white group-hover:text-primary-400 transition-colors leading-tight uppercase italic tracking-tighter">{student.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black font-mono text-slate-600 uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded-lg border border-white/5">{student.usn || 'NO IDENTIFIER'}</span>
                    <span className="px-2 py-0.5 bg-primary-500/5 text-primary-500 text-[8px] font-black uppercase tracking-[0.2em] rounded-lg border border-primary-500/10 shadow-sm">SECTOR {student.batch || 'UNDEFINED'}</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 space-y-3 mb-8">
                <div className="flex items-center gap-3 p-4 bg-slate-950/40 rounded-2xl border border-white/5 group-hover:border-primary-500/10 transition-all">
                  <Mail size={14} className="text-primary-500" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide truncate">{student.email}</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-950/40 rounded-2xl border border-white/5 group-hover:border-primary-500/10 transition-all">
                  <Clock size={14} className="text-primary-500" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide whitespace-nowrap">
                    {student.lastLogin
                      ? `Last Handshake: ${new Date(student.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : 'Status: Registry Persistent'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-950/40 rounded-2xl border border-white/5 group-hover:border-primary-500/10 transition-all">
                  <Calendar size={14} className="text-primary-500" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide whitespace-nowrap">Initialization: {new Date(student.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              <div className="relative z-10 mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                <Link
                  to={`/${user.role}/profile/${student.id}`}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-950 hover:bg-slate-800 text-slate-500 hover:text-primary-400 rounded-2xl border border-white/5 transition-all text-[9px] font-black uppercase tracking-[0.2em] shadow-inner group/btn"
                >
                  Inspect Node <ChevronRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
                <button className="w-10 h-10 rounded-2xl bg-slate-950 flex items-center justify-center text-slate-700 hover:text-primary-400 hover:bg-slate-800 border border-white/5 transition-all shadow-inner">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentList;