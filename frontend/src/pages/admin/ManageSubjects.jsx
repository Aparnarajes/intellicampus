import React, { useState, useEffect } from 'react';
import {
  BookOpen, Search, Plus, Trash2, Loader2,
  CheckCircle, AlertCircle, Filter, BookPlus, XCircle,
  Pencil, Database
} from 'lucide-react';
import adminService from '../../services/adminService';

const ManageSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    subjectName: '',
    subjectCode: '',
    semester: '',
    branch: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const params = {
        search: search || undefined,
        branch: branch || undefined,
        semester: semester || undefined
      };
      const res = await adminService.listSubjects(params);
      setSubjects(res.data.data);
    } catch (err) {
      setError('Failed to fetch subjects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { fetchSubjects(); }, 300);
    return () => clearTimeout(timer);
  }, [search, branch, semester]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      if (editingSubject) {
        await adminService.updateSubject(editingSubject.id, formData);
        setSuccess('Subject synchronized successfully.');
      } else {
        await adminService.createSubject(formData);
        setSuccess('Subject added to the matrix.');
      }
      setShowAddModal(false);
      setEditingSubject(null);
      setFormData({ subjectName: '', subjectCode: '', semester: '', branch: '' });
      fetchSubjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Transaction failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      subjectName: subject.subjectName,
      subjectCode: subject.subjectCode,
      semester: subject.semester.toString(),
      branch: subject.branch
    });
    setShowAddModal(true);
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      await adminService.deleteSubject(id);
      setSuccess('Subject purged from matrix.');
      fetchSubjects();
    } catch (err) {
      setError('Failed to delete subject.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <BookOpen className="text-primary-400" size={32} />
            Subject Matrix
          </h1>
          <p className="text-slate-400 mt-1 uppercase tracking-widest text-[10px] font-bold">
            Define and manage the curriculum structure.
          </p>
        </div>
        <button
          onClick={() => {
              setEditingSubject(null);
              setFormData({ subjectName: '', subjectCode: '', semester: '', branch: '' });
              setShowAddModal(true);
          }}
          className="btn-primary px-6 py-2.5 font-bold flex items-center gap-2 shadow-xl shadow-primary-500/20"
        >
          <BookPlus size={18} /> New Subject
        </button>
      </header>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400">
          <AlertCircle size={20} />
          <p className="text-sm font-bold uppercase tracking-widest text-[10px]">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 shadow-lg shadow-emerald-500/5">
          <CheckCircle size={20} />
          <p className="text-sm font-bold uppercase tracking-widest text-[10px]">{success}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Search by Code or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-12 h-12 text-sm font-bold"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-[10px] font-black uppercase tracking-widest outline-none transition-all focus:border-primary-500"
          >
            <option value="">All Branches</option>
            <option value="CSE">CSE</option>
            <option value="ISE">ISE</option>
            <option value="ECE">ECE</option>
            <option value="AIML">AIML</option>
          </select>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-[10px] font-black uppercase tracking-widest outline-none transition-all focus:border-primary-500"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-primary-500" size={48} />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] italic">Accessing Curricular Data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <div key={subject.id} className="glass-card p-8 group hover:border-primary-500/30 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                <BookOpen size={100} />
              </div>
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 font-black text-xs shadow-inner uppercase">
                        {subject.subjectCode}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleEdit(subject)}
                        className="p-2.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                        title="Edit Node"
                    >
                        <Pencil size={18} />
                    </button>
                    <button
                        onClick={() => handleDeleteSubject(subject.id)}
                        className="p-2.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                        title="Purge Node"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
              </div>

              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter group-hover:text-primary-400 transition-colors relative z-10 leading-tight">
                {subject.subjectName}
              </h3>

              <div className="mt-6 flex flex-wrap gap-2 relative z-10">
                <span className="px-3 py-1 bg-slate-800/80 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/5 shadow-sm">
                  {subject.branch}
                </span>
                <span className="px-3 py-1 bg-primary-500/10 text-primary-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-primary-500/10 shadow-sm">
                  Semester {subject.semester}
                </span>
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Personnel</p>
                    <span className="text-[10px] font-black text-primary-500/60 uppercase">{subject.facultySubjects?.length || 0} Nodes</span>
                </div>
                <div className="flex -space-x-3">
                  {subject.facultySubjects?.length > 0 ? (
                    subject.facultySubjects.map((fs, idx) => (
                      <div key={idx} className="w-9 h-9 rounded-full bg-slate-900 border-2 border-slate-950 flex items-center justify-center text-[10px] font-black text-white hover:-translate-y-1 transition-transform cursor-help shadow-lg" title={fs.faculty?.fullName}>
                        {fs.faculty?.fullName?.[0] || '?'}
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 opacity-30 italic">
                        <div className="w-9 h-9 rounded-full border-2 border-dashed border-slate-700" />
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Awaiting Assignment</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          <button
            onClick={() => {
                setEditingSubject(null);
                setFormData({ subjectName: '', subjectCode: '', semester: '', branch: '' });
                setShowAddModal(true);
            }}
            className="border-2 border-dashed border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center justify-center gap-4 text-slate-700 hover:border-primary-500/40 hover:bg-primary-500/5 hover:text-primary-400 transition-all group group-hover:shadow-2xl active:scale-95"
          >
            <div className="p-5 bg-slate-900 rounded-3xl group-hover:bg-primary-500 group-hover:text-white transition-all shadow-inner border border-white/5">
              <Plus size={40} />
            </div>
            <p className="font-black text-xs uppercase tracking-[0.2em] italic">Inject New Matrix Node</p>
          </button>
        </div>
      )}

      {/* Add / Edit Subject Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-lg p-12 space-y-10 animate-in zoom-in-95 duration-300 relative border-white/10 shadow-3xl">
            <div className="absolute top-0 left-0 w-2 h-full bg-primary-500" />
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                    {editingSubject ? 'Synchronize Node' : 'Initialize Node'}
                </h2>
                <div className="h-1 w-24 bg-primary-500/40 rounded-full" />
              </div>
              <button 
                onClick={() => {
                    setShowAddModal(false);
                    setEditingSubject(null);
                }} 
                className="text-slate-500 hover:text-white transition-colors"
               >
                <XCircle size={32} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Official Designation</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.subjectName}
                    onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                    className="input-field h-16 text-lg font-black italic pl-6"
                    placeholder="E.G. DATA STRUCTURES & ALGORITHMS"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20"><BookOpen size={24} /></div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Matrix Identifier</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.subjectCode}
                    onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
                    className="input-field h-16 text-lg font-black italic pl-6 uppercase"
                    placeholder="E.G. CS-401"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20"><Database size={24} /></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Temporal Tier</label>
                  <select
                    required
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="input-field h-16 text-sm font-black uppercase tracking-widest px-6 appearance-none cursor-pointer"
                  >
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Specialization</label>
                  <select
                    required
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="input-field h-16 text-sm font-black uppercase tracking-widest px-6 appearance-none cursor-pointer"
                  >
                    <option value="">Select Branch</option>
                    <option value="CSE">CSE</option>
                    <option value="ISE">ISE</option>
                    <option value="ECE">ECE</option>
                    <option value="AIML">AIML</option>
                  </select>
                </div>
              </div>

              <div className="pt-8 flex gap-5">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-grow py-5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:brightness-125 transition-all shadow-3xl shadow-primary-500/40 active:scale-95 disabled:grayscale flex items-center justify-center gap-3"
                >
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : (editingSubject ? <Database size={18} /> : <Plus size={18} />)}
                  {submitting ? 'Processing Transaction...' : (editingSubject ? 'Synchronize Matrix Node' : 'Inject Node Into Matrix')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSubjects;
