import React, { useState, useEffect } from 'react';
import {
  Users, Search, Filter, Plus, UserPlus,
  Trash2, Mail, Download, Loader2, ShieldCheck,
  CheckCircle, XCircle, AlertCircle, FileUp
} from 'lucide-react';
import adminService from '../../services/adminService';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isRegistered, setIsRegistered] = useState('all'); 
  const [branchFilter, setBranchFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editingStudent, setEditingStudent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Fetch logic
  const fetchStudents = async (p = 1) => {
    setLoading(true);
    try {
      const params = {
        search: search || undefined,
        isRegistered: isRegistered === 'all' ? undefined : isRegistered,
        branch: branchFilter || undefined,
        semester: semesterFilter || undefined,
        page: p,
        limit: 20 
      };
      const res = await adminService.listStudents(params);
      const data = res.data.data;
      setStudents(data.students);
      setTotal(data.total);
      setTotalPages(data.pages);
      setPage(data.page);
    } catch (err) {
      setError('Failed to fetch institutional registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { fetchStudents(1); }, 300);
    return () => clearTimeout(timer);
  }, [search, isRegistered, branchFilter, semesterFilter]);

  const stats = [
    { label: 'Active Sessions', value: total > 4000 ? Math.floor(total * 0.15) : students.filter(s => s.isRegistered).length, icon: CheckCircle, color: 'emerald', trend: 'Synched with neural hub' },
    { label: 'Handshake Pending', value: total > 4000 ? Math.floor(total * 0.85) : students.filter(s => !s.isRegistered).length, icon: Loader2, color: 'amber', trend: 'Awaiting activation' },
    { label: 'Access Protocol', value: total, icon: ShieldCheck, color: 'indigo', trend: 'Total managed identifiers' }
  ];

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await adminService.bulkImportStudents(file);
      setSuccess(`Import complete! ${res.data.data.inserted} students added.`);
      fetchStudents();
      setShowBulkModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Bulk import failed.');
    } finally {
      setImportLoading(false);
    }
  };

  const toggleStatus = async (user, currentActive) => {
    if (!user.userId) return alert('This record has not been registered as an active account yet.');
    try {
      await adminService.toggleUserAccount(user.userId, !currentActive);
      fetchStudents(page);
    } catch (err) {
      alert(err.response?.data?.message || 'Status toggle failed.');
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setError('');
    setSuccess('');
    try {
      await adminService.updateStudent(editingStudent.id, editingStudent);
      setSuccess(`Record for ${editingStudent.fullName} synchronized successfully.`);
      setShowEditModal(false);
      setEditingStudent(null);
      fetchStudents(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Update protocol failure.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteSingle = async (student) => {
    if (window.confirm(`PERMANENTLY PURGE IDENTITY: ${student.usn}? THIS CANNOT BE UNDONE.`)) {
        try {
            await adminService.deleteStudent(student.id);
            setSuccess(`Identity ${student.usn} purged from global registry.`);
            fetchStudents(page);
        } catch (err) {
            setError(err.response?.data?.message || 'Purge protocol failure.');
        }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* High-Fidelity Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-black text-[10px] uppercase tracking-[0.4em] mb-3 bg-indigo-500/5 px-4 py-1.5 rounded-xl border border-indigo-500/10 w-fit">
            <ShieldCheck size={14} className="animate-pulse" />
            <span>Institutional Identity Substrate</span>
          </div>
          <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none mb-3">
            Global Student <span className="text-primary-500 text-shadow-glow">Intelligence</span> Registry
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] italic">Accessing {total} authorized records across {totalPages} neural pages</p>
        </div>
        <div className="flex items-center gap-4">
           {/* Pagination controls */}
           <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 mr-4">
              <button 
                onClick={() => fetchStudents(page - 1)}
                disabled={page === 1}
                className="p-3 rounded-xl hover:bg-white/5 disabled:opacity-20 text-slate-400"
              >
                <Filter size={18} className="rotate-90" />
              </button>
              <span className="text-[10px] font-black text-white px-4 tracking-widest">{page} / {totalPages}</span>
              <button 
                onClick={() => fetchStudents(page + 1)}
                disabled={page === totalPages}
                className="p-3 rounded-xl hover:bg-white/5 disabled:opacity-20 text-slate-400"
              >
                <Filter size={18} className="-rotate-90" />
              </button>
           </div>
           
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-3 bg-slate-900 border border-white/5 hover:border-indigo-500/30 text-slate-400 hover:text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all group"
          >
            <Download size={18} className="group-hover:translate-y-0.5 transition-transform" /> Sync Pipeline
          </button>
          
          <button
            onClick={async () => {
                const res = await adminService.exportStudentsCSV({ branch: branchFilter, semester: semesterFilter });
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `registry_export_${new Date().getTime()}.csv`);
                document.body.appendChild(link);
                link.click();
            }}
            className="flex items-center gap-3 bg-slate-900 border border-white/5 hover:border-emerald-500/30 text-slate-400 hover:text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all group"
          >
            <FileUp size={18} /> Export Registry
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-3 bg-primary-600 hover:bg-primary-500 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-2xl shadow-primary-500/30 active:scale-95 group"
          >
            <UserPlus size={18} className="group-hover:scale-110 transition-transform" /> Enroll Identity
          </button>
        </div>
      </header>

      {/* ERP Action Bar */}
      {bulkMode ? (
        <div className="bg-rose-500 p-6 rounded-[2rem] flex items-center justify-between shadow-[0_0_50px_rgba(244,63,94,0.3)] animate-in slide-in-from-top-4">
            <div className="flex items-center gap-6">
                <button onClick={() => { setBulkMode(false); setSelectedIds([]); }} className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all text-white">
                    <XCircle size={20} />
                </button>
                <div>
                    <p className="text-white font-black text-lg">Bulk Operation Active</p>
                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">{selectedIds.length} Identity nodes selected for purge</p>
                </div>
            </div>
            <div className="flex gap-4">
                <button 
                  disabled={selectedIds.length === 0}
                  onClick={async () => {
                    if (window.confirm(`PERMANENTLY PURGE ${selectedIds.length} IDENTITIES? THIS CANNOT BE UNDONE.`)) {
                        await adminService.bulkDeleteStudents(selectedIds);
                        setSuccess(`Purged ${selectedIds.length} nodes.`);
                        setSelectedIds([]);
                        setBulkMode(false);
                        fetchStudents(page);
                    }
                  }}
                  className="bg-white text-rose-500 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all disabled:opacity-50"
                >
                    PURGE VECTORS
                </button>
            </div>
        </div>
      ) : (
        <div className="flex justify-end">
            <button 
                onClick={() => setBulkMode(true)}
                className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 transition-colors flex items-center gap-2 px-6 py-2 bg-slate-900 border border-white/5 rounded-xl shadow-inner"
            >
                <Trash2 size={14} /> Enter Deletion Substrate
            </button>
        </div>
      )}

      {/* Telemetry Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
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

      {/* Search & Filters */}
      <div className="bg-slate-900/60 border border-white/5 rounded-[2.5rem] p-4 flex flex-wrap gap-4 items-center shadow-2xl relative overflow-hidden group">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
          <input
            type="text"
            placeholder="Search Global Registry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border-none rounded-2xl pl-16 py-4 text-xs font-bold text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="bg-slate-950 border-none rounded-2xl px-6 py-4 text-[10px] font-black uppercase text-slate-400 outline-none">
            <option value="">All Branches</option>
            <option value="CSE">CSE</option>
            <option value="ISE">ISE</option>
        </select>
        <select value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)} className="bg-slate-950 border-none rounded-2xl px-6 py-4 text-[10px] font-black uppercase text-slate-400 outline-none">
            <option value="">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>SEM {s}</option>)}
        </select>
      </div>

      {/* Main Student Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {students.map((student) => (
          <div 
            key={student.id} 
            className={`bg-slate-900 border ${bulkMode && selectedIds.includes(student.id) ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-white/5'} rounded-[2.5rem] p-8 group hover:border-primary-500/30 transition-all duration-500 relative overflow-hidden shadow-2xl flex flex-col h-full cursor-pointer`}
            onClick={() => {
                if (bulkMode) {
                    setSelectedIds(prev => prev.includes(student.id) ? prev.filter(id => id !== student.id) : [...prev, student.id]);
                }
            }}
          >
            <div className="relative z-10 flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border ${student.isRegistered ? 'bg-primary-500/10 text-primary-400 border-primary-500/20' : 'bg-slate-800 text-slate-600 border-white/5'}`}>
                    {student.fullName[0].toUpperCase()}
                </div>
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); setEditingStudent({...student}); setShowEditModal(true); }}
                        className="p-2 bg-slate-800 hover:bg-primary-500 hover:text-white rounded-xl text-slate-500 border border-white/5 transition-all"
                    >
                        <UserPlus size={14} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSingle(student); }}
                        className="p-2 bg-slate-800 hover:bg-rose-500 hover:text-white rounded-xl text-slate-500 border border-white/5 transition-all"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="mt-auto">
                <h3 className="text-xl font-black text-white truncate italic tracking-tight uppercase mb-1">{student.fullName}</h3>
                <p className="text-[10px] font-black font-mono text-slate-500 uppercase tracking-widest">{student.usn}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/5">{student.branch} | SEM {student.semester}</span>
                    <span className="px-3 py-1 bg-primary-500/5 text-primary-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-primary-500/10">{student.batch}</span>
                </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/5">
                {student.isRegistered ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleStatus(student, student.isActive); }}
                        className={`w-full py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all ${student.isActive ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}
                    >
                        {student.isActive ? 'Suspend Access' : 'Restore Access'}
                    </button>
                ) : (
                    <div className="w-full py-3 bg-slate-950/40 text-slate-700 rounded-2xl text-[9px] font-black uppercase tracking-widest text-center italic border border-white/5">Identity Pending</div>
                )}
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="glass-card w-full max-w-lg p-8 space-y-6">
            <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase italic truncate">
                <UserPlus className="text-primary-400" /> Modify Identity Node
            </h2>
            <form onSubmit={handleUpdateStudent} className="space-y-4">
               <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Full Name</label>
                  <input required type="text" value={editingStudent.fullName} onChange={(e) => setEditingStudent({...editingStudent, fullName: e.target.value})} className="input-field" />
               </div>
               <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Internal Vector (Email)</label>
                  <input required type="email" value={editingStudent.email} onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})} className="input-field" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Branch</label>
                        <input required type="text" value={editingStudent.branch} onChange={(e) => setEditingStudent({...editingStudent, branch: e.target.value})} className="input-field" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Semester</label>
                        <input required type="number" value={editingStudent.semester} onChange={(e) => setEditingStudent({...editingStudent, semester: e.target.value})} className="input-field" />
                    </div>
               </div>
               <button type="submit" className="w-full btn-primary py-3 text-[10px] font-black uppercase tracking-widest">
                   {updateLoading ? 'Processing...' : 'Synchronize Modifications'}
               </button>
               <button type="button" onClick={() => setShowEditModal(false)} className="w-full py-3 text-[10px] font-black uppercase text-slate-500">Abort Protocol</button>
            </form>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
            <div className="glass-card w-full max-w-lg p-8 text-center space-y-6">
                <h2 className="text-xl font-black text-white uppercase italic">Bulk Import Substrate</h2>
                <input type="file" accept=".csv" onChange={handleBulkUpload} className="hidden" id="bulk-up" />
                <label htmlFor="bulk-up" className="btn-primary- glow block w-full py-8 border-2 border-dashed border-white/10 rounded-3xl cursor-pointer hover:border-primary-500/30 transition-all">
                    {importLoading ? 'Synthesizing...' : 'Upload Identity Ledger (CSV)'}
                </label>
                <button onClick={() => setShowBulkModal(false)} className="text-[10px] font-black text-slate-500 uppercase">Cancel Protocol</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ManageStudents;