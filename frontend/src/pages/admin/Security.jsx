import React, { useState } from 'react';
import { Shield, Lock, Globe, Server, AlertOctagon, Key, Eye, Activity, CheckCircle, Save } from 'lucide-react';

const Security = () => {
    const [policies, setPolicies] = useState({
        mfaEnforced: true,
        strictRateLimit: true,
        geoFencing: false,
        ipWhitelisting: false,
        maxLoginAttempts: 5,
        sessionTimeout: 60,
    });

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const togglePolicy = (key) => {
        setPolicies(prev => ({ ...prev, [key]: !prev[key] }));
        setSaved(false);
    };

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }, 1200);
    };

    return (
        <div className="space-y-8 animate-neural-fade pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                        <Shield className="text-rose-500" size={36} />
                        Security <span className="text-rose-500 text-shadow-glow">Policies</span>
                    </h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                        Global Fortress Configurations & Access Overrides
                    </p>
                </div>
                
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${
                        saved 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                        : 'bg-rose-500 text-white hover:bg-rose-400 hover:shadow-[0_0_20px_#f43f5e66] active:scale-95'
                    }`}
                >
                    {saving ? <Activity className="animate-spin" size={16} /> : saved ? <CheckCircle size={16} /> : <Save size={16} />}
                    {saving ? 'Encrypting...' : saved ? 'Committed' : 'Deploy Policies'}
                </button>
            </div>

            {/* Overall Threat Status */}
            <div className="glass-card p-6 border-l-4 border-l-emerald-500 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-emerald-500/10 rounded-2xl">
                        <Server className="text-emerald-500" size={28} />
                    </div>
                    <div>
                        <h2 className="font-black text-white uppercase italic tracking-tight">System Core Protected</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">No active breaches. JWT rotating normally.</p>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <div className="text-3xl font-black text-white italic">0.02ms</div>
                    <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Handshake Latency</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Authentication Controls */}
                <div className="space-y-6">
                    <h3 className="font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                        <Key className="text-slate-400" size={18} /> Identity & Access Vector
                    </h3>
                    
                    <div className="glass-card rounded-3xl overflow-hidden divide-y divide-white/5 border border-white/5">
                        
                        <div className="p-6 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                            <div>
                                <h4 className="text-sm font-black text-white">MFA Enforcement</h4>
                                <p className="text-xs text-slate-500 mt-1 font-medium">Require multi-factor auth for Faculty & Admin nodes.</p>
                            </div>
                            <button 
                                onClick={() => togglePolicy('mfaEnforced')}
                                className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${policies.mfaEnforced ? 'bg-rose-500' : 'bg-slate-800'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform absolute ${policies.mfaEnforced ? 'translate-x-7' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="p-6 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                            <div>
                                <h4 className="text-sm font-black text-white">Brute-Force Blacklist</h4>
                                <p className="text-xs text-slate-500 mt-1 font-medium">Automatically drop IPs after multiple failed attempts.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <input 
                                    type="number" 
                                    value={policies.maxLoginAttempts}
                                    onChange={(e) => { setPolicies({...policies, maxLoginAttempts: e.target.value}); setSaved(false); }}
                                    className="w-16 bg-slate-900 border border-white/10 rounded-lg outline-none text-center py-1 text-xs font-mono font-bold text-rose-400"
                                />
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Tries</span>
                            </div>
                        </div>

                        <div className="p-6 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                            <div>
                                <h4 className="text-sm font-black text-white">Session Expiry TTL</h4>
                                <p className="text-xs text-slate-500 mt-1 font-medium">Auto-terminate idle active tokens.</p>
                            </div>
                             <div className="flex items-center gap-4">
                                <input 
                                    type="number" 
                                    value={policies.sessionTimeout}
                                    onChange={(e) => { setPolicies({...policies, sessionTimeout: e.target.value}); setSaved(false); }}
                                    className="w-16 bg-slate-900 border border-white/10 rounded-lg outline-none text-center py-1 text-xs font-mono font-bold text-rose-400"
                                />
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Mins</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Network Controls */}
                <div className="space-y-6">
                    <h3 className="font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                        <Globe className="text-slate-400" size={18} /> Network & Routing Rules
                    </h3>
                    
                    <div className="glass-card rounded-3xl overflow-hidden divide-y divide-white/5 border border-white/5">
                        
                        <div className="p-6 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                            <div>
                                <h4 className="text-sm font-black text-white">Aggressive Rate Limiting</h4>
                                <p className="text-xs text-slate-500 mt-1 font-medium">Cap API requests to block scraping engines (100 req/min).</p>
                            </div>
                            <button 
                                onClick={() => togglePolicy('strictRateLimit')}
                                className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${policies.strictRateLimit ? 'bg-amber-500' : 'bg-slate-800'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform absolute ${policies.strictRateLimit ? 'translate-x-7' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="p-6 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                            <div>
                                <h4 className="text-sm font-black text-white">IP Whitelisting Payload</h4>
                                <p className="text-xs text-slate-500 mt-1 font-medium">Restrict admin panel access to trusted LAN / VPN domains only.</p>
                            </div>
                            <button 
                                onClick={() => togglePolicy('ipWhitelisting')}
                                className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${policies.ipWhitelisting ? 'bg-emerald-500' : 'bg-slate-800'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform absolute ${policies.ipWhitelisting ? 'translate-x-7' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="p-6 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                            <div>
                                <h4 className="text-sm font-black text-white">Geofencing Firewall</h4>
                                <p className="text-xs text-slate-500 mt-1 font-medium">Drop all packets originating outside regional college bounds.</p>
                            </div>
                            <button 
                                onClick={() => togglePolicy('geoFencing')}
                                className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${policies.geoFencing ? 'bg-rose-500' : 'bg-slate-800'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform absolute ${policies.geoFencing ? 'translate-x-7' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Notice */}
            <div className="mt-8 bg-primary-500/5 border border-primary-500/20 p-6 rounded-2xl flex items-start gap-4">
                <AlertOctagon className="text-primary-500 shrink-0 mt-1" size={20} />
                <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Protocol Override Warning</h4>
                    <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">
                        Modifying Identity & Access Vectors (`MFA`, `Geofencing`) will immediately drop all active connections under `WSS` sockets. Logged-in admin peers will require mandatory re-authentication and handshake refresh. Proceed with caution in production.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Security;
