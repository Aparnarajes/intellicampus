import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Users,
  UserRound,
  BookOpen,
  CalendarCheck,
  FileText,
  Youtube,
  MessageSquare,
  Settings,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  Brain,
  Award,
  Zap,
  Activity,
  Sparkles,
  ShieldAlert,
  Target,
  BarChart3,
  GitBranch
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Logo from './Logo';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const adminLinks = [
    { label: 'Control Intelligence', path: '/admin', icon: LayoutDashboard },
    { label: 'Academic Intelligence', path: '/admin/academic-intelligence', icon: Zap },
    { label: 'Faculty Registry', path: '/admin/faculty', icon: UserRound },
    { label: 'Student Core', path: '/admin/students', icon: Users },
    { label: 'System Mapping', path: '/admin/assign', icon: BookOpen },
    { label: 'Neural Insights', path: '/admin/analytics', icon: Activity },
    { label: 'System Reports', path: '/admin/reports', icon: BarChart3 },
  ];

  const facultyLinks = [
    { label: 'Instructional Brain', path: '/faculty', icon: LayoutDashboard },
    { label: 'Student Matrix', path: '/faculty/students', icon: Users },
    { label: 'Session Presence', path: '/faculty/mark-attendance', icon: CalendarCheck },
    { label: 'Evaluation Grid', path: '/faculty/marks', icon: Award },
    { label: 'Adaptive Engine', path: '/faculty/adaptive-paper', icon: Brain },
    { label: 'Strategic Insights', path: '/faculty/analytics', icon: Activity },
    { label: 'Archival Data', path: '/faculty/history', icon: FileText },
  ];

  const studentLinks = [
    { label: 'Personal Dashboard', path: '/student', icon: LayoutDashboard },
    { label: 'AI Study Synthesizer', path: '/student/notes', icon: Sparkles },
    { label: 'Neural Roadmap', path: '/student/roadmap', icon: GitBranch },
    { label: 'Target Vault', path: '/student/questions', icon: Target },
    { label: 'Visual Guidance', path: '/student/youtube', icon: Youtube },
    { label: 'AI Chatbot', path: '/student/chatbot', icon: MessageSquare },
    { label: 'Presence Metric', path: '/student/attendance', icon: BarChart3 },
    { label: 'Performance Analytics', path: '/student/analytics', icon: Activity },
    { label: 'Academic Transcript', path: '/student/marks', icon: Award },
    { label: 'Bio Registry', path: '/student/profile', icon: UserRound },
  ];

  const role = user.role.toLowerCase();
  const links = role === 'admin' ? adminLinks :
    role === 'faculty' ? facultyLinks :
      studentLinks;

  return (
    <aside className="w-72 bg-slate-950/50 backdrop-blur-3xl border-r border-white/5 flex flex-col h-[calc(100vh-64px)] fixed left-0 top-16 z-[90] transition-all duration-500 shadow-[20px_0_50px_rgba(0,0,0,0.3)]">
      <div className="p-8 flex-1 space-y-12 mt-2 custom-scrollbar overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-6 mb-8">
            <div className="w-7 h-7 flex-shrink-0">
              <Logo size={28} />
            </div>
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em] italic">Neural Navigation</h3>
          </div>

          <ul className="space-y-1.5">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;

              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`nav-item group ${isActive ? 'nav-item-active' : ''}`}
                  >
                    <Icon size={18} className={`${isActive ? 'text-[var(--brand-primary)]' : 'group-hover:text-[var(--brand-primary)]'} transition-colors duration-500`} />
                    <span className="flex-1">{link.label}</span>
                    {isActive ? (
                      <ChevronRight size={12} className="text-[var(--brand-primary)] animate-in slide-in-from-left-2" />
                    ) : (
                      <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* User Quick Switcher/Footer */}
      <div className="p-8 border-t border-white/5 space-y-6 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[var(--brand-primary)]/20 transition-all group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-slate-900 p-[1px]">
            <div className="w-full h-full rounded-[11px] bg-slate-950 flex items-center justify-center font-black text-white italic text-sm group-hover:scale-90 transition-transform">
              {user.name?.[0] || 'U'}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-white uppercase italic truncate tracking-tight">{user.name || 'Academic User'}</p>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mt-0.5">{user.role}</p>
          </div>
          <Settings size={14} className="text-slate-600 group-hover:rotate-90 transition-transform duration-500" />
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-4 px-6 py-4 rounded-2xl text-rose-500/60 hover:text-rose-400 hover:bg-rose-500/5 transition-all w-full group relative overflow-hidden active:scale-95"
        >
          <LogOut size={16} className="group-hover:-translate-x-1 transition-transform relative z-10" />
          <span className="font-black text-[10px] uppercase italic tracking-[0.3em] relative z-10">Neural Logoff</span>
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;