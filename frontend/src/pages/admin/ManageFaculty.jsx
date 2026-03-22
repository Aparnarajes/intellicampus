import React, { useState, useEffect } from 'react';
import {
  Users, Search, Filter, Plus, UserPlus,
  Trash2, Mail, Download, Loader2, ShieldCheck,
  CheckCircle, XCircle, AlertCircle, FileUp, Building2
} from 'lucide-react';
import adminService from '../../services/adminService';

const ManageFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  
  const [newFaculty, setNewFaculty] = useState({ facultyId: '', fullName: '', email: '', department: '', designation: 'Faculty' });
  const [editingFaculty, setEditingFaculty] = useState(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const params = { search: search || undefined };
      const res = await adminService.listFaculty(params);
      setFaculty(res.data.data.faculty);
    } catch (err) {
      setError('Failed to fetch faculty list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { fetchFaculty(); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await adminService.bulkImportFaculty(file);
      setSuccess(`Import complete! ${res.data.data.inserted} faculty members added.`);
      fetchFaculty();
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
      fetchFaculty();
    } catch (err) {
      alert(err.response?.data?.message || 'Status toggle failed.');
    }
  };

  const handleAddFaculty = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setError('');
    setSuccess('');
    try {
      await adminService.addFaculty(newFaculty);
      setSuccess(`Directory entry for ${newFaculty.fullName} configured successfully.`);
      setShowAddModal(false);
      setNewFaculty({ facultyId: '', fullName: '', email: '', department: '', designation: 'Faculty' });
      fetchFaculty();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to authorize faculty.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdateFaculty = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setError('');
    setSuccess('');
    try {
      await adminService.updateFaculty(editingFaculty.id, editingFaculty);
      setSuccess(`Personnel file for ${editingFaculty.fullName} synchronized.`);
      setShowEditModal(false);
      setEditingFaculty(null);
      fetchFaculty();
    } catch (err) {
      setError(err.response?.data?.message || 'Update protocol failure.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteSingle = async (member) => {
    if (window.confirm(`PERMANENTLY PURGE PERSONNEL: ${member.facultyId}? THIS CANNOT BE UNDONE.`)) {
        try {
            await adminService.deleteFaculty(member.id);
            setSuccess(`Identity ${member.facultyId} purged from global registry.`);
            fetchFaculty();
        } catch (err) {
            setError(err.response?.data?.message || 'Purge protocol failure.');
        }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 italic uppercase">
            <Building2 className="text-secondary-400" size={32} />
            Faculty <span className="text-secondary-500 text-shadow-glow">Registry</span>
          </h1>
          <p className="text-slate-400 mt-1 uppercase text-[10px] font-black tracking-widest">Institutional Personnel Substrate</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowBulkModal(true)} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-700 transition-all flex items-center gap-2">
            <Download size={16} /> Sync Pipeline
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary-secondary px-6 py-3 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-secondary-500/20">
            <UserPlus size={16} /> Enroll Personnel
          </button>
        </div>
      </header>

      {/* Messages */}
      {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold flex items-center gap-3"><AlertCircle size={18} /> {error}</div>}
      {success && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-bold flex items-center gap-3"><CheckCircle size={18} /> {success}</div>}

      <div className="bg-slate-900 border border-white/5 rounded-3xl p-4 shadow-inner">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input type="text" placeholder="Search by Faculty ID, Name, or Sector..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-14 h-14 text-sm font-bold placeholder-slate-600" />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-secondary-500" size={48} />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Scanning Personnel Matrix...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {faculty.map((member) => (
            <div key={member.id} className="glass-card p-8 group hover:border-secondary-500/30 transition-all duration-300 flex flex-col h-full relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-white group-hover:scale-110 transition-transform"><Building2 size={120} /></div>
               
               <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner border ${member.isRegistered ? 'bg-secondary-500/10 text-secondary-400 border-secondary-500/20' : 'bg-slate-800 text-slate-600 border-white/5'}`}>
                    {member.fullName[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setEditingFaculty({...member}); setShowEditModal(true); }} className="p-2 bg-slate-800 hover:bg-secondary-500 hover:text-white rounded-xl text-slate-500 border border-white/5 transition-all">
                        <UserPlus size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteSingle(member); }} className="p-2 bg-slate-800 hover:bg-rose-500 hover:text-white rounded-xl text-slate-500 border border-white/5 transition-all">
                        <Trash2 size={14} />
                    </button>
                  </div>
               </div>

               <div className="relative z-10 space-y-1 mb-6">
                  <h3 className="text-xl font-black text-white italic uppercase truncate group-hover:text-secondary-400 transition-colors tracking-tight">{member.fullName}</h3>
                  <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black font-mono text-slate-500 uppercase tracking-widest bg-slate-950 px-2 py-1 rounded-lg border border-white/5 shadow-inner">
                            ID: {member.facultyId}
                        </span>
                        <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest leading-none">Global Persistence ID</span>
                  </div>
               </div>

               <div className="relative z-10 mt-auto space-y-4">
                  <div className="flex items-center gap-3 text-slate-400 bg-slate-950/40 p-3 rounded-2xl border border-white/5">
                    <Building2 size={14} className="text-secondary-500" />
                    <span className="text-[10px] truncate font-bold uppercase tracking-wide">{member.department}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/5">{member.designation}</span>
                  </div>
               </div>

               <div className="relative z-10 mt-8 pt-6 border-t border-white/5">
                {member.isRegistered ? (
                    <button onClick={(e) => { e.stopPropagation(); toggleStatus(member, member.isActive); }} className={`w-full py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all ${member.isActive ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {member.isActive ? 'Suspend Access' : 'Restore Access'}
                    </button>
                ) : (
                    <div className="w-full py-3 bg-slate-950/40 text-slate-700 rounded-2xl text-[9px] font-black uppercase tracking-widest text-center italic border border-white/5">Identity Pending</div>
                )}
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="glass-card w-full max-w-lg p-8 space-y-6">
            <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase italic truncate">
                <UserPlus className="text-secondary-400" /> Authorize Registration Slot
            </h2>
            <form onSubmit={handleAddFaculty} className="space-y-4">
               <div><label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Official Faculty ID</label><input required type="text" placeholder="e.g. FAC-001" value={newFaculty.facultyId} onChange={(e) => setNewFaculty({...newFaculty, facultyId: e.target.value})} className="input-field" /></div>
               <div><label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Full Name</label><input required type="text" placeholder="e.g. Dr. John Doe" value={newFaculty.fullName} onChange={(e) => setNewFaculty({...newFaculty, fullName: e.target.value})} className="input-field" /></div>
               <div><label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Official Email</label><input required type="email" placeholder="e.g. faculty.name@university.edu" value={newFaculty.email} onChange={(e) => setNewFaculty({...newFaculty, email: e.target.value})} className="input-field" /></div>
               <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Sector (Dept)</label><input required type="text" placeholder="AI" value={newFaculty.department} onChange={(e) => setNewFaculty({...newFaculty, department: e.target.value})} className="input-field" /></div>
                  <div><label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Rank</label><input required type="text" placeholder="Professor" value={newFaculty.designation} onChange={(e) => setNewFaculty({...newFaculty, designation: e.target.value})} className="input-field" /></div>
               </div>
               <button type="submit" disabled={addLoading} className="w-full btn-primary-secondary py-3 text-[10px] font-black uppercase mt-4">{addLoading ? 'Processing...' : 'Synchronize Identity Slot'}</button>
               <button type="button" onClick={() => setShowAddModal(false)} className="w-full text-[10px] font-black uppercase text-slate-500">Cancel Protocol</button>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingFaculty && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="glass-card w-full max-w-lg p-8 space-y-6">
            <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase italic truncate">
                <UserPlus className="text-secondary-400" /> Modify Identity Node
            </h2>
            <form onSubmit={handleUpdateFaculty} className="space-y-4">
               <div><label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Full Name</label><input required type="text" value={editingFaculty.fullName} onChange={(e) => setEditingFaculty({...editingFaculty, fullName: e.target.value})} className="input-field" /></div>
               <div><label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Internal Vector (Email)</label><input required type="email" value={editingFaculty.email} onChange={(e) => setEditingFaculty({...editingFaculty, email: e.target.value})} className="input-field" /></div>
               <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Sector (Dept)</label><input required type="text" value={editingFaculty.department} onChange={(e) => setEditingFaculty({...editingFaculty, department: e.target.value})} className="input-field" /></div>
                    <div><label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Designation</label><input required type="text" value={editingFaculty.designation} onChange={(e) => setEditingFaculty({...editingFaculty, designation: e.target.value})} className="input-field" /></div>
               </div>
               <button type="submit" disabled={updateLoading} className="w-full btn-primary-secondary py-3 text-[10px] font-black uppercase mt-4">{updateLoading ? 'Processing...' : 'Synchronize Modifications'}</button>
               <button type="button" onClick={() => setShowEditModal(false)} className="w-full text-[10px] font-black uppercase text-slate-500">Abort Protocol</button>
            </form>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
            <div className="glass-card w-full max-w-lg p-8 text-center space-y-6">
                <h2 className="text-xl font-black text-white uppercase italic">Bulk Import Substrate</h2>
                <input type="file" accept=".csv" onChange={handleBulkUpload} className="hidden" id="faculty-bulk" />
                <label htmlFor="faculty-bulk" className="btn-secondary-glow block w-full py-8 border-2 border-dashed border-white/10 rounded-3xl cursor-pointer hover:border-secondary-500/30 transition-all">
                    {importLoading ? 'Synthesizing...' : 'Upload Identity Ledger (CSV)'}
                </label>
                <button onClick={() => setShowBulkModal(false)} className="text-[10px] font-black text-slate-500 uppercase">Cancel Protocol</button>
            </div>
        </div>
      )}

    </div>
  );
};

export default ManageFaculty;