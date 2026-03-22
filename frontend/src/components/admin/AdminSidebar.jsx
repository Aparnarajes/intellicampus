import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    LayoutDashboard, Users, UserCog, Database, 
    FileBarChart, ShieldAlert, Settings, Terminal, 
    Activity, ChevronRight, BookPlus, BookOpen,
    Calendar, Megaphone
} from 'lucide-react';

const navItems = [
    { name: 'SYSTEM CONTROL', icon: LayoutDashboard, path: '/admin' },
    { name: 'FACULTY NODES', icon: UserCog, path: '/admin/faculty' },
    { name: 'STUDENT REGISTRY', icon: Users, path: '/admin/students' },
    { name: 'SUBJECT MATRIX', icon: BookOpen, path: '/admin/subjects' },
    { name: 'ACADEMIC CALENDAR', icon: Calendar, path: '/admin/calendar' },
    { name: 'BROADCAST HUB', icon: Megaphone, path: '/admin/announcements' },
    { name: 'WORKLOAD SETUP', icon: BookPlus, path: '/admin/assign' },
    { name: 'NEURAL ANALYTICS', icon: Activity, path: '/admin/academic-intelligence' },
    { name: 'SECURITY POLICY', icon: ShieldAlert, path: '/admin/security' }
];

const AdminSidebar = () => {
    return (
        <aside className="w-80 bg-slate-950/20 border-r border-white/5 h-full flex flex-col items-center py-10 z-[100] relative backdrop-blur-xl">
            <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />
            
            <div className="flex flex-col gap-4 w-full px-6 relative z-10">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 text-center">SYSTEM NAVIGATION</div>
                
                {navItems.map((item, index) => (
                    <NavLink
                        key={index}
                        to={item.path}
                        end={item.path === '/admin'}
                        className={({ isActive }) => `
                            flex items-center gap-4 px-6 py-4 rounded-2xl group transition-all duration-500 relative overflow-hidden
                            ${isActive 
                                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.1)]' 
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
                            }
                        `}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon size={18} className="transition-transform duration-500 group-hover:scale-110" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{item.name}</span>
                                <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                
                                {/* Selected Indicator */}
                                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-rose-500 rounded-r-md transition-all duration-500 ${isActive ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`} />
                            </>
                        )}
                    </NavLink>
                ))}
            </div>

            <div className="mt-auto w-full px-6 pt-10 relative z-10">
                <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 text-center space-y-4">
                    <Terminal size={24} className="text-rose-500/40 mx-auto" />
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
                        Authorized System Access Only. All transactions recorded.
                    </p>
                </div>
            </div>
        </aside>
    );
};

export default AdminSidebar;
