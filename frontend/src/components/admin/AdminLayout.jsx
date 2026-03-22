import React, { Suspense } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AdminSidebar from './AdminSidebar';
import { ShieldCheck, Cpu, Power } from 'lucide-react';

const AdminLayout = () => {
    const { user, logout } = useAuth();

    if (!user || user.role.toLowerCase() !== 'admin') {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-rose-500/30 font-sans overflow-x-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-600/5 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
            </div>

            {/* Top Command Bar */}
            <header className="h-16 border-b border-white/5 bg-slate-950/50 backdrop-blur-3xl flex items-center justify-between px-8 sticky top-0 z-[100]">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-500 group-hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all duration-500">
                            <ShieldCheck size={24} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-xl italic uppercase tracking-tighter leading-none">CORE <span className="text-rose-500">ADMIN</span></span>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1.5 flex items-center gap-1">
                                <Cpu size={8} className="text-rose-500" /> SYSTEM ARCHITECT PORTAL
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end border-r border-white/5 pr-6">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Authorization Token</span>
                        <span className="text-[9px] font-mono text-emerald-400/70 truncate w-32 text-right">0x7F2A_SYSTEM_AUTH_ROOT</span>
                    </div>
                    
                    <button 
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-2 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 transition-all group"
                    >
                        <Power size={14} className="group-hover:rotate-90 transition-transform duration-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Terminate Session</span>
                    </button>
                </div>
            </header>

            <div className="flex h-[calc(100vh-64px)] overflow-hidden">
                <AdminSidebar />
                <main className="flex-1 overflow-y-auto p-10 relative z-10 custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Suspense fallback={<div className="flex items-center justify-center min-h-[400px] text-slate-500">Executing Core Directives...</div>}>
                            <Outlet />
                        </Suspense>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
