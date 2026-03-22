import React, { useState } from 'react';
import { FileBarChart, ShieldAlert, CheckCircle, Database, Search, Download, Filter, Terminal, Activity, Calendar } from 'lucide-react';

const mockReports = [
  { id: 'LOG-8842', action: 'SYSTEM_BOOT', user: 'SYSTEM_ROOT', status: 'SUCCESS', details: 'Initialized core neural and academic databases.', time: '2 mins ago' },
  { id: 'LOG-8841', action: 'FACULTY_AUTH', user: 'aparnaintellicampus@gmail.com', status: 'SUCCESS', details: 'Authorized faculty registration slot (FAC-999).', time: '14 mins ago' },
  { id: 'LOG-8840', action: 'RATE_LIMIT_FLAG', user: 'UNKNOWN_IP', status: 'WARNING', details: 'Rate limit exceeded on /api/admin/stats. Throttled.', time: '22 mins ago' },
  { id: 'LOG-8839', action: 'DATA_SYNC', user: 'CRON_DAEMON', status: 'SUCCESS', details: 'Synchronized student records with college DB.', time: '1 hour ago' },
  { id: 'LOG-8838', action: 'UNAUTHORIZED_ACCESS', user: '192.168.1.104', status: 'CRITICAL', details: 'Failed login attempt for nonexistent admin node.', time: '3 hours ago' },
];

const Reports = () => {
  const [filter, setFilter] = useState('ALL');

  const filteredReports = mockReports.filter(r => filter === 'ALL' || r.status === filter);

  return (
    <div className="space-y-8 animate-neural-fade pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
            <FileBarChart className="text-secondary-500" size={36} />
            Audit <span className="text-secondary-500 text-shadow-glow">Reports</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">
            Immutable Ledger of System Modifications and Security Flags
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl border border-slate-700 font-bold transition-all text-[10px] uppercase tracking-widest shadow-xl">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex flex-col justify-between group hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
              <CheckCircle size={24} />
            </div>
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Successful Syncs</div>
          </div>
          <div className="text-4xl font-black text-white italic">14,204</div>
          <p className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-widest mt-2">+2% this week</p>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between group hover:border-amber-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400">
              <Activity size={24} />
            </div>
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Rate Limit Flags</div>
          </div>
          <div className="text-4xl font-black text-white italic">28</div>
          <p className="text-[10px] text-amber-400/80 font-bold uppercase tracking-widest mt-2">-15% this week</p>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between group hover:border-rose-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-400">
              <ShieldAlert size={24} />
            </div>
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Critical Intrusions</div>
          </div>
          <div className="text-4xl font-black text-white italic">4</div>
          <p className="text-[10px] text-rose-400/80 font-bold uppercase tracking-widest mt-2">Requires Review</p>
        </div>
      </div>

      {/* Ledger UI */}
      <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="p-6 border-b border-white/5 bg-slate-800/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Terminal className="text-secondary-500" size={20} />
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Live Security Ledger</h2>
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input type="text" placeholder="Trace ID or User..." className="bg-slate-950 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-secondary-500 w-full" />
            </div>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5 shrink-0">
              {['ALL', 'SUCCESS', 'WARNING', 'CRITICAL'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${filter === f ? 'bg-secondary-500/20 text-secondary-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Log Entries */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-white/5 bg-slate-900/50">
                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Trace ID</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Action Vector</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest w-full">Detailed Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredReports.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 text-xs font-mono font-bold text-slate-400 group-hover:text-secondary-400 transition-colors">{log.id}</td>
                  <td className="px-6 py-4 flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <Calendar size={12} /> {log.time}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${
                      log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      log.status === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-black text-white uppercase italic tracking-tight">{log.action}</div>
                    <div className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{log.user}</div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400 overflow-hidden text-ellipsis w-full max-w-md">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredReports.length === 0 && (
            <div className="flex flex-col items-center justify-center p-20 text-slate-500 opacity-50 space-y-4">
              <Database size={48} />
              <p className="text-[10px] font-black uppercase tracking-widest text-center">No trace logs match the current filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;