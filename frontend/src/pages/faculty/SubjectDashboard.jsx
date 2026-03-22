import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users, Award, Calendar, CheckCircle, AlertCircle,
  TrendingUp, Download, ArrowLeft, Filter, Search,
  GraduationCap, BookOpen, UserCheck, Activity
} from 'lucide-react';
import academicService from '../../services/academicService';

/**
 * SubjectDashboard — Student Performance Matrix
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides a granular view of student performance across all evaluation metrics
 * for a specific subject assignment.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SubjectDashboard = () => {
  const { subjectCode } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMatrix();
  }, [subjectCode]);

  const fetchMatrix = async () => {
    try {
      setLoading(true);
      const res = await academicService.getStudentsBySubject(subjectCode);
      if (res.success) {
        setStudents(res.data);
      }
    } catch (err) {
      setError('Neural data synchronization failed. Please check connectivity.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
      <Activity className="w-10 h-10 text-primary-500 animate-spin" />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aggregating Subject Performance Matrix...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-neural-fade">
      {/* ── HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-primary-400 transition-colors text-[10px] font-black uppercase tracking-widest">
            <ArrowLeft size={14} /> Back to Workload
          </button>
          <div className="flex items-center gap-2 text-primary-400 font-bold uppercase tracking-[0.2em] text-[10px]">
            <BookOpen size={12} /> Subject Matrix: {subjectCode}
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Performance <span className="text-primary-500">Analytics</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search USN or Name..."
              className="bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-6 py-3 text-sm text-white focus:border-primary-500/50 outline-none w-[280px] transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── METRICS OVERVIEW ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Enrolled', value: students.length, icon: Users, color: 'primary' },
          { label: 'Avg Attendance', value: '84.2%', icon: UserCheck, color: 'emerald' },
          { label: 'Class GPA', value: '8.4', icon: GraduationCap, color: 'purple' },
          { label: 'Completion', value: '92%', icon: CheckCircle, color: 'amber' }
        ].map((m, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl group relative overflow-hidden">
            <div className={`w-10 h-10 rounded-xl bg-${m.color}-500/10 flex items-center justify-center text-${m.color}-500 mb-4`}>
              <m.icon size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">{m.label}</p>
            <h4 className="text-2xl font-black text-white italic">{m.value}</h4>
          </div>
        ))}
      </div>

      {/* ── PERFORMANCE MATRIX TABLE ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-indigo-500 opacity-20" />
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
             <thead>
              <tr className="bg-slate-800/20 border-b border-white/5 font-black text-[9px] text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">
                <th className="p-6 sticky left-0 bg-slate-900 z-10 w-64 shadow-[10px_0_30px_#00000040]">Student Identity</th>
                <th className="p-6 text-center">Sem</th>
                <th className="p-6 text-center">Attendance %</th>
                <th className="p-6 text-center bg-primary-500/5">IA1 (25)</th>
                <th className="p-6 text-center bg-primary-500/5">IA2 (25)</th>
                <th className="p-6 text-center">Assgn (10)</th>
                <th className="p-6 text-center">Quiz (10)</th>
                <th className="p-6 text-center bg-emerald-500/5">Demo (15)</th>
                <th className="p-6 text-center bg-emerald-500/5">Viva (10)</th>
                <th className="p-6 text-center bg-purple-500/5">Project (25)</th>
                <th className="p-6 text-center">Total (100)</th>
                <th className="p-6 text-center">Grade</th>
                <th className="p-6">Performance Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStudents.length > 0 ? filteredStudents.map((s, idx) => (
                <tr key={s._id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="p-6 sticky left-0 bg-slate-900/95 backdrop-blur-md z-10 group-hover:bg-slate-800/95 transition-colors shadow-[10px_0_30px_#00000020]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-black text-primary-400 group-hover:bg-primary-500 group-hover:text-white transition-all">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-white text-xs uppercase italic tracking-tight group-hover:text-primary-400 transition-colors truncate">{s.name}</p>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{s.studentId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-center text-[10px] font-black text-slate-400">{s.semester}</td>
                  <td className="p-6 text-center">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${parseFloat(s.attendancePercentage) < 75 ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20 animate-pulse' : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'}`}>
                      {s.attendancePercentage}
                    </span>
                  </td>
                  <td className="p-6 text-center font-black text-xs text-white bg-primary-500/5">{s.ia1}</td>
                  <td className="p-6 text-center font-black text-xs text-white bg-primary-500/5">{s.ia2}</td>
                  <td className="p-6 text-center font-bold text-xs text-slate-200">{s.assignment}</td>
                  <td className="p-6 text-center font-bold text-xs text-slate-200">{s.quiz}</td>
                  <td className="p-6 text-center font-black text-xs text-emerald-400 bg-emerald-500/5">{s.demo}</td>
                  <td className="p-6 text-center font-black text-xs text-emerald-400 bg-emerald-500/5">{s.viva}</td>
                  <td className="p-6 text-center font-black text-xs text-purple-400 bg-purple-500/5">{s.project + s.projectReview}</td>
                  <td className="p-6 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-black text-sm text-white tracking-widest leading-none">{s.totalMarks}</span>
                      <div className="w-8 h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-primary-500" style={{ width: `${s.totalMarks}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-[10px] font-black border ${
                      s.grade === 'A' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_#10b98120]' :
                      s.grade === 'B' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                      s.grade === 'F' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {s.grade}
                    </span>
                  </td>
                  <td className="p-6">
                    <p className="text-[10px] font-bold text-slate-500 italic leading-relaxed max-w-[200px]">
                      {s.remarks || 'Standard academic progression.'}
                    </p>
                  </td>
                </tr>
              )) : (
                <tr>
                   <td colSpan="13" className="p-20 text-center">
                     <AlertCircle className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                     <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No matching neural signatures found in this matrix.</p>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* ── LEGEND ── */}
      <div className="flex flex-wrap items-center gap-6 px-6 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary-500/10 border border-primary-500/20 rounded-md" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Internal Assessments (IA)</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Practical / Lab Evaluations</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500/10 border border-purple-500/20 rounded-md" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mini Projects & Reviews</span>
         </div>
      </div>
    </div>
  );
};

export default SubjectDashboard;
