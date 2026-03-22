import React, { useState, useEffect } from 'react';
import {
  Building2, Search, Plus, Trash2, Save, Loader2,
  CheckCircle, AlertCircle, UserRound, GraduationCap,
  Calendar, BookOpen, ChevronRight, XCircle
} from 'lucide-react';
import adminService from '../../services/adminService';

const AssignSubjects = () => {
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [search, setSearch] = useState('');
  
  // Selection State
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [targetSection, setTargetSection] = useState('A');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [facRes, subRes] = await Promise.all([
        adminService.listFaculty({ search: search || undefined }),
        adminService.listSubjects()
      ]);
      setFaculty(facRes.data.data.faculty);
      setSubjects(subRes.data.data);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to fetch directory data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSelectFaculty = (member) => {
    setSelectedFaculty(member);
    // Note: If faculty is registered, we could fetch their current assignments.
    setAssignedSubjects([]); 
    setMessage({ type: '', text: '' });
  };

  const toggleSubjectSelection = (subjectId) => {
    if (assignedSubjects.includes(subjectId)) {
        setAssignedSubjects(assignedSubjects.filter(id => id !== subjectId));
    } else {
        setAssignedSubjects([...assignedSubjects, subjectId]);
    }
  };

  const handleSave = async () => {
    if (!selectedFaculty || assignedSubjects.length === 0) {
        return setMessage({ type: 'error', text: 'Select at least one subject.' });
    }
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await adminService.updateFacultyAssignments(selectedFaculty.id, {
        subjects: assignedSubjects,
        section: targetSection
      });
      setMessage({ type: 'success', text: 'Workload infrastructure synchronized.' });
      fetchData(); // Refresh list to get updated counts
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <header>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <GraduationCap className="text-primary-400" size={32} />
          Workload Infrastructure
        </h1>
        <p className="text-slate-400 mt-1 uppercase tracking-widest text-[10px] font-bold">
          Assign subjects from the matrix to personnel nodes.
        </p>
      </header>

      {message.text && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm uppercase tracking-tight">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Faculty Selector Sidebar */}
        <div className="lg:col-span-1 glass-card border-none bg-slate-900/50 flex flex-col max-h-[700px]">
          <div className="p-6 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Find Faculty Member..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10 text-xs h-10"
              />
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-50">
                <Loader2 className="animate-spin text-primary-500" size={24} />
                <p className="text-[10px] font-black uppercase tracking-tighter">Locating Personnel...</p>
              </div>
            ) : faculty.map(member => (
              <button
                key={member.id}
                onClick={() => handleSelectFaculty(member)}
                className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-4 group ${selectedFaculty?.id === member.id ? 'bg-primary-500/10 border border-primary-500/20' : 'hover:bg-white/5 border border-transparent'}`}
              >
                <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-black ${selectedFaculty?.id === member.id ? 'bg-primary-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  {member.fullName[0]}
                </div>
                <div className="truncate">
                  <p className={`text-sm font-black uppercase truncate ${selectedFaculty?.id === member.id ? 'text-white' : 'text-slate-400'}`}>
                    {member.fullName}
                  </p>
                  <p className="text-[10px] text-slate-600 font-bold truncate">{member.department || 'General'} • {member.facultyId}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Assignment Interface */}
        <div className="lg:col-span-2 space-y-6">
          {selectedFaculty ? (
            <div className="glass-card p-10 space-y-10 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-primary-500/20">
                  {selectedFaculty.fullName[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">{selectedFaculty.fullName}</h2>
                  <p className="text-xs text-slate-500 font-black uppercase tracking-widest mt-1">
                    {selectedFaculty.designation} • {selectedFaculty.department}
                  </p>
                </div>
                <div className="ml-auto">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 text-right">Target Section</div>
                    <select
                        value={targetSection}
                        onChange={(e) => setTargetSection(e.target.value)}
                        className="bg-slate-800 border border-white/5 rounded-xl px-4 py-2 text-white text-xs font-black outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>Section {s}</option>)}
                    </select>
                </div>
              </div>

              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary-400">
                        <BookOpen size={20} />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em]">Select Subjects from Matrix</h3>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase">{assignedSubjects.length} Selected</span>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {subjects.map((subject) => (
                        <button
                            key={subject.id}
                            onClick={() => toggleSubjectSelection(subject.id)}
                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${assignedSubjects.includes(subject.id) ? 'bg-primary-500/10 border-primary-500/40' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${assignedSubjects.includes(subject.id) ? 'bg-primary-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                {subject.subjectCode}
                            </div>
                            <div className="truncate">
                                <p className={`text-xs font-black uppercase truncate ${assignedSubjects.includes(subject.id) ? 'text-white' : 'text-slate-400'}`}>
                                    {subject.subjectName}
                                </p>
                                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Sem {subject.semester} • {subject.branch}</p>
                            </div>
                            {assignedSubjects.includes(subject.id) && <CheckCircle size={16} className="ml-auto text-primary-500" />}
                        </button>
                    ))}
                 </div>
              </div>

              {/* Action Footer */}
              <div className="pt-10 border-t border-white/5 flex items-center justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving || assignedSubjects.length === 0}
                    className="btn-primary px-8 py-3.5 flex items-center gap-3 font-black uppercase tracking-tighter shadow-2xl shadow-primary-500/30 disabled:opacity-50 active:scale-95"
                  >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Sync Workload Protocol
                  </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 glass-card border-dashed border-2 bg-transparent opacity-30 text-slate-500">
              <UserRound size={80} className="mb-6 stroke-1 border-2 border-slate-500 rounded-full p-4" />
              <p className="font-black uppercase tracking-[0.3em] text-sm italic">Accessing Personnel Node</p>
              <p className="text-[10px] mt-2 font-bold max-w-xs text-center uppercase tracking-widest leading-relaxed">Choose a record from the faculty directory to proceed with workload injection.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignSubjects;