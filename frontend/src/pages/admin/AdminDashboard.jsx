import React, { useState, useEffect } from 'react';
import {
  Users, UserRound, BookOpen, BarChart3, Activity,
  ShieldAlert, PlusCircle, FileDown, Loader2, TrendingUp,
  AlertTriangle, Building2, ShieldCheck, CheckSquare, Clock, Calendar,
  Settings, Zap, Database, Cpu, Server
} from 'lucide-react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auditType, setAuditType] = useState('student');
  const [auditStatus, setAuditStatus] = useState('registered');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, healthRes] = await Promise.all([
          adminService.getAdminStats(),
          adminService.getSystemHealth()
        ]);
        setData(statsRes.data.data);
        setHealth(healthRes.data.data);
      } catch (err) {
        console.error('Failed to synchronize system metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    {
      label: 'Enrolled Students',
      value: data?.students?.total?.toLocaleString() || '0',
      sub: `${data?.students?.registered || 0} Registered`,
      icon: Users,
      color: 'text-primary-400',
      bg: 'bg-primary-500/10'
    },
    {
      label: 'Authorized Faculty',
      value: data?.faculty?.total?.toLocaleString() || '0',
      sub: `${data?.faculty?.registered || 0} Registered`,
      icon: ShieldCheck,
      color: 'text-secondary-400',
      bg: 'bg-secondary-500/10'
    },
    {
      label: 'Active Sessions',
      value: data?.totalActiveUsers?.toLocaleString() || '0',
      sub: 'Last 24 Hours',
      icon: Activity,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10'
    },
    {
      label: 'Pending Setup',
      value: ((data?.students?.pending || 0) + (data?.faculty?.pending || 0)).toString(),
      sub: 'Awaiting First Login',
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10'
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-primary-500" size={48} />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compiling System Metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-neural-fade pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
            System <span className="text-primary-500 text-shadow-glow">Intelligence</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">
            Secure Platform Oversight & Access Control
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/students" className="btn-primary-secondary px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group">
            <PlusCircle size={18} className="group-hover:rotate-90 transition-transform duration-500" /> Enroll Users
          </Link>
        </div>
      </header>

      {/* Security Banner */}
      <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-white uppercase tracking-widest">Platform Status: Protected</p>
            <p className="text-[10px] text-slate-500 font-bold italic">Closed registration active. Access restricted to official USNs only.</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase italic">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Synchronized with College DB
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card p-6 group hover:border-primary-500/30 transition-all relative overflow-hidden">
            <div className={`absolute -top-4 -right-4 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity`}>
              <stat.icon size={100} />
            </div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`p-3 rounded-2xl ${stat.bg}`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <div className="text-[9px] font-black text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-lg border border-white/5 uppercase tracking-widest">
                Real-Time
              </div>
            </div>
            <div className="text-4xl font-black text-white italic tracking-tighter relative z-10">{stat.value}</div>
            <div className="flex justify-between items-end mt-1 relative z-10">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
              <div className="text-[9px] font-black text-primary-400 italic bg-primary-500/5 px-1.5 rounded uppercase">{stat.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Registry Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link to="/admin/students" className="group bg-slate-900/50 border border-white/5 p-8 rounded-3xl hover:border-primary-500/50 transition-all relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 p-8 text-primary-500 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <Users size={120} />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary-500/10 rounded-2xl text-primary-400">
                  <Users size={24} />
                </div>
                <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Student Matrix</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 italic">Gated ledger of {data?.students?.total || 0} valid USNs. Manage registration keys and academic status.</p>
              <div className="flex items-center gap-2 text-[10px] font-black text-primary-400 uppercase tracking-widest">
                Review Registry <PlusCircle size={14} />
              </div>
            </Link>

            <Link to="/admin/faculty" className="group bg-slate-900/50 border border-white/5 p-8 rounded-3xl hover:border-secondary-500/50 transition-all relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 p-8 text-secondary-500 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <UserRound size={120} />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-secondary-500/10 rounded-2xl text-secondary-400">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Faculty Roster</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 italic">Secure directory of authorized staff. Provision IDs and manage departmental permissions.</p>
              <div className="flex items-center gap-2 text-[10px] font-black text-secondary-400 uppercase tracking-widest">
                Edit Directory <PlusCircle size={14} />
              </div>
            </Link>
          </div>

          {/* Upcoming Events & Announcements Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl relative">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-primary-500">
                    <Calendar size={120} />
                </div>
                <div className="p-6 border-b border-white/5 bg-slate-800/10 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                        <Clock className="text-primary-500 animate-pulse" size={20} />
                        <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] italic">Temporal Matrix</h2>
                    </div>
                    <Link to="/admin/calendar" className="text-[9px] font-black text-primary-400 uppercase tracking-widest hover:text-white transition-colors bg-primary-500/10 px-3 py-1 rounded-lg border border-primary-500/20">Sync All</Link>
                </div>
                <div className="p-6 space-y-4 relative z-10">
                    {!data?.calendar || data.calendar.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 opacity-30 grayscale italic text-center">
                            <Activity size={48} strokeWidth={1} className="mb-4" />
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-center italic">Timeline Parameters Undefined</p>
                        </div>
                    ) : data?.calendar?.slice(0, 4).map((event) => {
                        const isExam = event.type === 'EXAM';
                        const isHoliday = event.type === 'HOLIDAY';
                        const colorClass = isExam ? 'text-rose-400' : isHoliday ? 'text-emerald-400' : 'text-primary-400';
                        const bgClass = isExam ? 'bg-rose-500/10' : isHoliday ? 'bg-emerald-500/10' : 'bg-primary-500/10';
                        
                        return (
                            <div key={event.id} className="flex items-center gap-5 group p-4 rounded-[1.5rem] hover:bg-white/[0.04] transition-all border border-transparent hover:border-white/10 bg-slate-950/20">
                                <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border border-white/5 shrink-0 shadow-lg ${bgClass}`}>
                                    <span className={`text-[9px] font-black uppercase tracking-widest opacity-60 ${colorClass}`}>{new Date(event.startDate).toLocaleDateString('default', { month: 'short' })}</span>
                                    <span className="text-xl font-black text-white italic tracking-tighter">{new Date(event.startDate).getDate()}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-sm font-black text-white uppercase italic tracking-tight truncate group-hover:text-primary-400 transition-colors">{event.event}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${colorClass}`}>{event.type}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-800" />
                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">S-0{event.semester || 'X'}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md">
                <div className="p-6 border-b border-white/5 bg-slate-800/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="text-primary-500" size={20} />
                        <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Latest Broadcasts</h2>
                    </div>
                    <Link to="/admin/announcements" className="text-[10px] font-black text-primary-400 uppercase tracking-widest hover:underline">Manage All</Link>
                </div>
                <div className="p-6 space-y-4">
                    {data?.announcements?.length === 0 ? (
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center py-10 opacity-40 italic font-medium">No Transmissions active</p>
                    ) : data?.announcements?.map((msg) => (
                        <div key={msg.id} className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-white/5 group">
                            <h4 className="text-xs font-black text-white uppercase italic tracking-tight mb-1 group-hover:text-primary-400 transition-colors uppercase truncate">{msg.title}</h4>
                            <div className="flex items-center justify-between">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{msg.targetBatch}</span>
                                <span className="text-[8px] font-black text-slate-600 italic">{new Date(msg.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
          </div>

          {/* Adoption Pulse Section */}
          <section className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
              <div className="p-6 border-b border-white/5 bg-slate-800/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <CheckSquare className="text-emerald-500" size={20} />
                      <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Adoption Pulse</h2>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Registrations per Cohort</span>
              </div>
              <div className="p-8 space-y-8">
                  <div className="space-y-4">
                      <div className="flex justify-between items-end">
                          <span className="text-xs font-black text-white uppercase italic tracking-tight">Student Body</span>
                          <span className="text-xs font-black text-primary-400 italic">{Math.round((data?.students?.registered / data?.students?.total) * 100 || 0)}% Registered</span>
                      </div>
                      <div className="h-4 bg-slate-950/50 rounded-full overflow-hidden p-[2px] border border-white/5">
                          <div
                              className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                              style={{ width: `${(data?.students?.registered / data?.students?.total) * 100 || 0}%` }}
                          />
                      </div>
                  </div>

                  <div className="space-y-4">
                      <div className="flex justify-between items-end">
                          <span className="text-xs font-black text-white uppercase italic tracking-tight">Faculty Personnel</span>
                          <span className="text-xs font-black text-secondary-400 italic">{Math.round((data?.faculty?.registered / data?.faculty?.total) * 100 || 0)}% Registered</span>
                      </div>
                      <div className="h-4 bg-slate-950/50 rounded-full overflow-hidden p-[2px] border border-white/5">
                          <div
                              className="h-full bg-gradient-to-r from-secondary-600 to-secondary-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(124,58,237,0.4)]"
                              style={{ width: `${(data?.faculty?.registered / data?.faculty?.total) * 100 || 0}%` }}
                          />
                      </div>
                  </div>
              </div>
          </section>
        </div>

        {/* Neural Identity Feed */}
        <div className="space-y-8 h-full">
          <section className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md flex flex-col h-[600px]">
            <div className="p-6 border-b border-white/5 bg-slate-800/10 flex items-center justify-between">
              <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2 relative">
                <Activity size={14} className="text-primary-500 absolute -left-6" /> 
                Identity Feed
              </h2>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-white/5">
                  <button 
                    onClick={() => setAuditType('student')}
                    className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded transition-all ${auditType === 'student' ? 'bg-primary-500/20 text-primary-400' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Students
                  </button>
                  <button 
                    onClick={() => setAuditType('faculty')}
                    className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded transition-all ${auditType === 'faculty' ? 'bg-secondary-500/20 text-secondary-400' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Faculty
                  </button>
              </div>
            </div>

            <div className="flex border-b border-white/5">
                <button 
                  onClick={() => setAuditStatus('registered')}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${auditStatus === 'registered' ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:bg-white/5 border-b-2 border-transparent'}`}
                >
                  Synchronized ({auditType === 'student' ? data?.students?.registered : data?.faculty?.registered})
                </button>
                <button 
                  onClick={() => setAuditStatus('pending')}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${auditStatus === 'pending' ? 'bg-amber-500/10 text-amber-400 border-b-2 border-amber-500' : 'text-slate-500 hover:bg-white/5 border-b-2 border-transparent'}`}
                >
                  Pending ({auditType === 'student' ? data?.students?.pending : data?.faculty?.pending})
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {(() => {
                    const list = data?.[auditType === 'student' ? 'students' : 'faculty']?.[`${auditStatus}List`] || [];
                    
                    if (list.length === 0) {
                        return (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3 opacity-50">
                                <Users size={32} />
                                <span className="text-[10px] font-black uppercase tracking-widest">No Sector Activity</span>
                            </div>
                        );
                    }

                    return list.map((user, i) => (
                        <div key={user.id || i} className="flex items-center justify-between p-4 mb-2 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-transparent hover:border-white/5 group">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white group-hover:text-primary-400 transition-colors">{user.name}</span>
                                <span className="text-[10px] text-slate-500 font-mono mt-1">{user.usn || user.facultyId}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {auditStatus === 'registered' ? (
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                ) : (
                                    <div className="w-2 h-2 rounded-full bg-amber-500 opacity-50" />
                                )}
                            </div>
                        </div>
                    ));
                })()}
            </div>
            
            <div className="p-4 border-t border-white/5 bg-slate-900/50 text-center">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{auditStatus === 'registered' ? 'Active nodes mapped to the host framework.' : 'Awaiting manual initialization by user.'}</span>
            </div>
          </section>
        </div>
      </div>
      {/* Governance Command Matrix */}
      <section className="mt-12 space-y-8 animate-neural-fade">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-500/20 rounded-2xl text-rose-400">
            <Settings size={22} className="animate-spin-slow" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Institutional <span className="text-shadow-glow text-rose-500">Governance Matrix</span></h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest tracking-[0.2em]">Platform Core Control & Real-Time Performance Analytics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Node 01: High-Fidelity Telemetry */}
          <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 p-8 text-rose-500 opacity-5 pointer-events-none">
              <Activity size={150} />
            </div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
              <Cpu size={14} className="text-rose-500" /> Neural Node Telemetry
            </h3>
            <div className="space-y-10">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-white uppercase italic">Central Processing Unit</span>
                  <span className="text-xs font-black text-rose-400 italic font-mono">{health?.metrics?.cpu || '0.00'}%</span>
                </div>
                <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 transition-all duration-1000" 
                    style={{ width: `${health?.metrics?.cpu || 0}%` }} 
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-white uppercase italic">Allocated Memory Matrix</span>
                  <span className="text-xs font-black text-sky-400 italic font-mono">{health?.metrics?.memory || '0.00'}%</span>
                </div>
                <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-sky-500 transition-all duration-1000" 
                    style={{ width: `${health?.metrics?.memory || 0}%` }} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Handshake Latency</span>
                  <p className="text-lg font-black text-emerald-400 italic">{health?.metrics?.latency || '0'}ms</p>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Uptime</span>
                  <p className="text-lg font-black text-white italic">{health?.uptime || '99.9%'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Node 02: Service Registry Status */}
          <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
              <Server size={14} className="text-primary-500" /> Active Service Registry
            </h3>
            <div className="space-y-4">
              {health?.services?.map((svc, i) => (
                <div key={i} className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/5 group hover:bg-white/[0.08] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                    <div>
                      <h4 className="text-xs font-black text-white uppercase italic">{svc.name}</h4>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Response: {svc.status}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-slate-950 rounded-full text-[8px] font-black text-slate-500 uppercase tracking-widest border border-white/5">
                    {svc.load} LOAD
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Node 03: Executive Governance Overrides */}
          <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 p-8 text-primary-500 opacity-5 pointer-events-none">
              <Zap size={150} />
            </div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
              <Zap size={14} className="text-primary-500" /> Platform Multi-Control
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Neural Maintenance Protocol', icon: Settings, color: 'text-rose-400', active: false },
                { label: 'Intelligent Data Cache', icon: Database, color: 'text-primary-400', active: true },
                { label: 'Secure ERP Handshake', icon: ShieldCheck, color: 'text-emerald-400', active: true },
                { label: 'Automated Global Backup', icon: FileDown, color: 'text-indigo-400', active: true }
              ].map((ctrl, i) => (
                <div key={i} className="p-5 rounded-3xl bg-slate-950/50 border border-white/5 flex items-center justify-between group cursor-pointer hover:border-primary-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <ctrl.icon size={18} className={ctrl.color} />
                    <span className="text-[10px] font-black text-white uppercase italic tracking-tight">{ctrl.label}</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-all flex items-center relative ${ctrl.active ? 'bg-primary-500' : 'bg-slate-800'}`}>
                    <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-lg transition-transform absolute ${ctrl.active ? 'translate-x-5.5' : 'translate-x-1'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Notification & Event Log Console */}
        <div className="bg-slate-950/80 border border-white/5 rounded-[2rem] p-6 shadow-2xl backdrop-blur-xl group">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
             <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Live Core Event Matrix</h4>
             </div>
             <span className="text-[9px] font-mono font-bold text-slate-600 uppercase">Last Handshake: {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="space-y-3 max-h-[120px] overflow-y-auto custom-scrollbar pr-4">
            <div className="flex gap-4 group/log">
                <span className="text-[10px] font-mono text-emerald-500 font-bold opacity-60">12:34:01</span>
                <span className="text-[10px] font-black text-slate-400 uppercase italic tracking-tight transition-colors group-hover/log:text-white">ID_RESOLVED: Access packet synchronized for Faculty sector (DEPT_CSE)</span>
            </div>
            <div className="flex gap-4 group/log">
                <span className="text-[10px] font-mono text-emerald-500 font-bold opacity-60">12:38:15</span>
                <span className="text-[10px] font-black text-slate-400 uppercase italic tracking-tight transition-colors group-hover/log:text-white">AI_SYNC: Neural weights refreshed for student predictive engine (SUCCESS_92%)</span>
            </div>
            <div className="flex gap-4 group/log border-l-2 border-rose-500/40 pl-4 bg-rose-500/5 py-1">
                <span className="text-[10px] font-mono text-rose-500 font-bold opacity-80">12:45:22</span>
                <span className="text-[10px] font-black text-white uppercase italic tracking-tight">SECURITY_ALERT: Unauthorized login attempt throttled by RateLimiter (IP_HASH: 72x...89)</span>
            </div>
            <div className="flex gap-4 group/log">
                <span className="text-[10px] font-mono text-emerald-500 font-bold opacity-60">13:10:05</span>
                <span className="text-[10px] font-black text-slate-400 uppercase italic tracking-tight transition-colors group-hover/log:text-white">DB_BACKUP: Institutional registry mirrored to cloud vault (STABLE)</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;