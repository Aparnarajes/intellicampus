import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone, Plus, Trash2, Loader2,
  CheckCircle, AlertCircle, Users, Clock,
  XCircle, Send, LayoutDashboard, Database,
  ShieldAlert, Zap, Globe, Activity, Filter,
  TrendingUp, Layers, Info, ShieldCheck, Mail
} from 'lucide-react';
import adminService from '../../services/adminService';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    targetBatch: 'All',
    priority: 'NORMAL',
    category: 'GENERAL'
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState('ALL');

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await adminService.listAnnouncements();
      setAnnouncements(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      setError('Neural link failure: Could not retrieve transmissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const stats = useMemo(() => {
    return {
      total: announcements.length,
      critical: announcements.filter(a => a.priority === 'CRITICAL').length,
      academic: announcements.filter(a => a.category === 'ACADEMIC').length,
      emergency: announcements.filter(a => a.category === 'EMERGENCY').length,
      uptime: '99.9%'
    };
  }, [announcements]);

  const filteredTransmissions = useMemo(() => {
    if (filterCategory === 'ALL') return announcements;
    return announcements.filter(a => a.category === filterCategory);
  }, [announcements, filterCategory]);

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await adminService.createAnnouncement(newAnnouncement);
      setSuccess('Data packet broadcasted successfully.');
      setShowAddModal(false);
      setNewAnnouncement({ title: '', content: '', targetBatch: 'All', priority: 'NORMAL', category: 'GENERAL' });
      fetchAnnouncements();
    } catch (err) {
      setError(err.response?.data?.message || 'Protocol failure: Transmission rejected.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Initiate termination protocol for this packet?')) return;
    try {
      await adminService.deleteAnnouncement(id);
      setSuccess('Transmission neutralized.');
      fetchAnnouncements();
    } catch (err) {
      setError('Neutralization failure.');
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse';
      case 'HIGH': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'NORMAL': return 'bg-primary-500/20 text-primary-400 border-primary-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };


  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-8">
      {/* Header / Global Protocol Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500/20 rounded-lg text-primary-400">
                <Globe size={20} className="animate-spin-slow" />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Broadcasting Hub v4.0</span>
          </div>
          <h1 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
            Digital <span className="text-primary-500 text-shadow-glow">Matrix</span>
          </h1>
          <p className="text-slate-500 font-bold max-w-xl leading-relaxed italic text-sm">
            Orchestrating campus-wide transmissions through high-fidelity data channels. 
            Real-time sector alerts and priority notices synchronized across all neural endpoints.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="group relative px-10 py-5 bg-primary-600 hover:bg-primary-500 text-white font-black uppercase italic tracking-[0.2em] rounded-3xl transition-all shadow-3xl shadow-primary-500/20 flex items-center gap-4 overflow-hidden active:scale-95 self-start lg:self-center"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Send size={20} className="group-hover:rotate-12 transition-transform" />
          <span>New Transmission</span>
        </button>
      </div>

      {/* Analytics & Controls Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Quick Stats */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
                { label: 'Active Streams', value: stats.total, icon: Activity, color: 'text-sky-400', bg: 'bg-sky-500/10' },
                { label: 'Critical Errors', value: stats.critical, icon: ShieldAlert, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                { label: 'Academic Flow', value: stats.academic, icon: Layers, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                { label: 'System Breach', value: stats.emergency, icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' }
            ].map((stat, i) => (
                <div key={i} className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl group hover:border-slate-700 transition-all shadow-lg">
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 border border-white/5`}>
                        <stat.icon size={20} />
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{stat.label}</p>
                    <p className="text-3xl font-black text-white mt-2 italic tracking-tighter tabular-nums">{stat.value}</p>
                </div>
            ))}
        </div>

        {/* Global Filter */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-center">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Filter size={14} /> Sector Filtering
            </h3>
            <div className="flex flex-wrap gap-2">
                {['ALL', 'GENERAL', 'ACADEMIC', 'EMERGENCY'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterCategory === cat ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Feed */}
        <div className="lg:col-span-8 space-y-8">
            {error && (
                <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center gap-4 text-rose-400 animate-in slide-in-from-top-2">
                    <ShieldAlert size={24} />
                    <p className="text-xs font-black uppercase tracking-widest">{error}</p>
                </div>
            )}
            {success && (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center gap-4 text-emerald-400 shadow-xl shadow-emerald-500/5 animate-in slide-in-from-top-2">
                    <CheckCircle size={24} />
                    <p className="text-xs font-black uppercase tracking-widest">{success}</p>
                </div>
            )}

            {loading ? (
                <div className="py-40 flex flex-col items-center justify-center gap-8">
                    <div className="relative">
                        <Loader2 className="animate-spin text-primary-500" size={80} />
                        <div className="absolute inset-0 bg-primary-500/20 blur-[50px] rounded-full" />
                    </div>
                    <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse italic">Synchronizing Data Streams...</p>
                </div>
            ) : filteredTransmissions.length === 0 ? (
                <div className="p-40 text-center bg-slate-900/10 border-2 border-dashed border-white/5 rounded-[4rem] opacity-20 hover:opacity-100 transition-all group">
                    <Megaphone size={120} className="mx-auto stroke-1 group-hover:scale-110 transition-transform duration-1000" />
                    <h3 className="text-4xl font-black uppercase tracking-tighter mt-10 italic">Quiet Sector</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] max-w-sm mx-auto mt-4 text-slate-500">No active transmissions detected in this frequency range.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-10">
                    {filteredTransmissions.map((announcement) => (
                        <div key={announcement.id} className={`group relative bg-slate-900/40 border-2 border-white/5 rounded-[3rem] p-10 hover:border-primary-500/20 transition-all shadow-2xl overflow-hidden ${announcement.priority === 'CRITICAL' ? 'shadow-[0_20px_60px_-15px_rgba(244,63,94,0.1)] border-rose-500/10' : ''}`}>
                            <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.08] transition-opacity duration-1000 -rotate-12 group-hover:rotate-0">
                                <Send size={200} />
                            </div>
                            
                            <div className="flex flex-col md:flex-row gap-10 relative z-10">
                                <div className="flex-1 space-y-8">
                                    <div className="flex items-center flex-wrap gap-3">
                                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${getPriorityStyle(announcement.priority)}`}>
                                            {announcement.priority}
                                        </div>
                                        <div className="px-4 py-1.5 bg-slate-800/80 border border-white/5 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] rounded-full">
                                            Sector: {announcement.category}
                                        </div>
                                        <div className="px-4 py-1.5 bg-primary-500/10 border border-primary-500/10 text-primary-400 text-[9px] font-black uppercase tracking-[0.2em] rounded-full">
                                            {announcement.targetBatch}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] ml-auto">
                                            <Clock size={12} /> {new Date(announcement.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none group-hover:text-primary-400 transition-colors">
                                            {announcement.title}
                                        </h3>
                                        <div className="bg-slate-950/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md shadow-inner">
                                            <p className="text-sm font-medium text-slate-400 leading-relaxed italic">
                                                {announcement.content}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/5 grayscale">
                                                <Users size={14} className="text-slate-500" />
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Broadcast Authority</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{announcement.postedBy}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                                            className="p-4 bg-rose-500/5 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl transition-all shadow-xl hover:shadow-rose-500/20 active:scale-95 border border-rose-500/10 hover:border-transparent"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Intelligence Sidebar */}
        <div className="lg:col-span-4 space-y-8">
            <div className="bg-gradient-to-br from-primary-600 to-indigo-700 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                <TrendingUp size={150} className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-1000" />
                <h4 className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mb-4">Transmission Pulse</h4>
                <div className="text-5xl font-black text-white italic tracking-tighter tabular-nums">100<span className="text-2xl text-white/50">%</span></div>
                <p className="text-xs font-bold text-white/70 uppercase mt-2">Neural reach efficiency</p>
                <div className="mt-10 h-2 bg-black/20 rounded-full overflow-hidden p-[1px]">
                    <div className="h-full w-full bg-white rounded-full animate-pulse shadow-[0_0_10px_#fff]" />
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 space-y-8 shadow-xl">
                <h4 className="text-xs font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                    <Info size={16} className="text-primary-500" /> Administrative Protocol
                </h4>
                <div className="space-y-6">
                    {[
                        { title: 'Global Sync', desc: 'Syncing notifications across all mobile and web endpoints instantly.', icon: Zap },
                        { title: 'Data Integrity', desc: 'Encrypted transients ensures payload remains unaltered.', icon: ShieldCheck },
                        { title: 'Targeting', desc: 'Spatially localized broadcasting for precise cohort engagement.', icon: Users }
                    ].map((item, idx) => (
                        <div key={idx} className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 shrink-0 flex items-center justify-center text-primary-400 border border-white/5">
                                <item.icon size={18} />
                            </div>
                            <div>
                                <h5 className="text-[10px] font-black text-slate-200 uppercase tracking-widest">{item.title}</h5>
                                <p className="text-[10px] font-bold text-slate-500 mt-1 leading-relaxed italic">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <button className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2">
                    <Mail size={14} /> Contact Support Hub
                </button>
            </div>
        </div>
      </div>

      {/* Add Announcement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-700">
          <div className="bg-slate-900 border border-white/10 w-full max-w-4xl rounded-[4rem] p-14 space-y-12 animate-in slide-in-from-bottom-20 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-14 opacity-5 text-primary-500">
                <Megaphone size={200} />
            </div>
            
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-2">
                <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">Initialize <span className="text-primary-500">Packet</span></h2>
                <div className="h-1.5 w-32 bg-primary-500 rounded-full shadow-[0_0_15px_#0ea5e9]" />
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="bg-slate-800 hover:bg-rose-500 p-4 rounded-3xl text-slate-400 hover:text-white transition-all group shadow-xl active:scale-90"
              >
                <XCircle size={32} className="group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-10 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Transmission Label</label>
                    <input
                        type="text"
                        required
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                        className="w-full bg-slate-950 border-2 border-white/5 focus:border-primary-500/50 rounded-2xl h-16 px-8 text-lg font-black italic text-white placeholder:text-slate-700 transition-all outline-none"
                        placeholder="E.G. FACULTY AUDIT 2026"
                    />
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Broadcast Target</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['All', '2022-2026', '2023-2027', 'Faculty'].map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setNewAnnouncement({ ...newAnnouncement, targetBatch: t })}
                                className={`h-16 rounded-2xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${newAnnouncement.targetBatch === t ? 'bg-primary-500 border-primary-500 text-white shadow-xl shadow-primary-500/30' : 'bg-slate-950 border-white/5 text-slate-500 hover:border-white/10'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Priority Matrix</label>
                    <div className="flex gap-2">
                        {['LOW', 'NORMAL', 'HIGH', 'CRITICAL'].map(p => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setNewAnnouncement({ ...newAnnouncement, priority: p })}
                                className={`flex-1 py-4 rounded-xl text-[8px] font-black uppercase tracking-widest border-2 transition-all ${newAnnouncement.priority === p ? 'bg-white text-slate-900 border-white shadow-xl scale-105' : 'bg-slate-950 border-white/5 text-slate-600 hover:text-slate-400'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Sector Domain</label>
                    <div className="flex gap-2">
                        {['GENERAL', 'ACADEMIC', 'ADMINISTRATIVE', 'EMERGENCY'].map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setNewAnnouncement({ ...newAnnouncement, category: c })}
                                className={`flex-1 py-4 rounded-xl text-[8px] font-black uppercase tracking-widest border-2 transition-all ${newAnnouncement.category === c ? 'bg-primary-500 border-primary-500 text-white' : 'bg-slate-950 border-white/5 text-slate-600'}`}
                            >
                                {c.slice(0, 5)}
                            </button>
                        ))}
                    </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Message Payload Content</label>
                <textarea
                  required
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  className="w-full bg-slate-950 border-2 border-white/5 focus:border-primary-500/50 rounded-[2.5rem] p-10 text-sm font-medium leading-relaxed italic text-white placeholder:text-slate-700 transition-all outline-none min-h-[180px] resize-none"
                  placeholder="Detailed administrative context for the target audience protocol..."
                />
              </div>

              <div className="pt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full group relative h-24 bg-primary-600 hover:bg-primary-500 text-white rounded-[2.5rem] font-black uppercase italic tracking-[0.4em] transition-all shadow-3xl shadow-primary-500/30 active:scale-95 disabled:grayscale overflow-hidden"
                  >
                    <div className="relative z-10 flex items-center justify-center gap-6">
                        {submitting ? <Loader2 className="animate-spin" size={32} /> : <Zap size={32} className="group-hover:scale-125 transition-transform" />}
                        <span className="text-xl">{submitting ? 'Broadcasting...' : 'Initiate Broadcast Protocol'}</span>
                    </div>
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
