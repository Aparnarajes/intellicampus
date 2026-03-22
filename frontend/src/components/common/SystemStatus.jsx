import React, { useState, useEffect } from 'react';
import { checkSystemHealth } from '../../services/api';
import { AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react';

const SystemStatus = () => {
    const [status, setStatus] = useState({ ok: true, checking: true });

    const verifyConnectivity = async () => {
        setStatus(prev => ({ ...prev, checking: true }));
        const result = await checkSystemHealth();
        setStatus({ ok: result.ok, checking: false, issue: result.issue });
    };

    useEffect(() => {
        verifyConnectivity();
        const interval = setInterval(verifyConnectivity, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    if (status.checking && !status.issue) return (
        <div className="bg-slate-900/80 backdrop-blur-md text-slate-400 px-4 py-2 flex items-center gap-3 text-[9px] font-black uppercase tracking-widest border-b border-white/5">
            <RefreshCw size={12} className="animate-spin" />
            <span>Establishing Neural Link...</span>
        </div>
    );

    if (status.ok) return (
        <div className="bg-slate-900/80 backdrop-blur-md text-emerald-500 px-4 py-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest border-b border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            <span>Neural Engine: Active</span>
        </div>
    );

    return (
        <div className="bg-rose-500 text-white px-4 py-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
            <div className="flex items-center gap-3">
                <WifiOff size={14} />
                <span>Neural Engine Offline: {status.issue || 'Connection Refused'}</span>
            </div>
            <button 
                onClick={verifyConnectivity}
                className="flex items-center gap-2 hover:bg-white/20 px-3 py-1 rounded-full transition-colors"
            >
                <RefreshCw size={12} />
                Re-establish Link
            </button>
        </div>
    );
};

export default SystemStatus;
