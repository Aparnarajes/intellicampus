import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Sparkles, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Logo from './Logo';

const Navbar = () => {
  const { user } = useAuth();

  return (
    <nav className="bg-slate-950/80 backdrop-blur-3xl border-b border-white/5 h-16 sticky top-0 z-[100] transition-all duration-500">
      <div className="max-w-[1800px] mx-auto px-8 h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 group">
          {/* Custom Logo Mark */}
          <div className="relative flex-shrink-0 w-10 h-10 group-hover:scale-110 transition-transform duration-500">
            <div className="absolute inset-0 rounded-2xl bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 group-hover:border-[var(--brand-primary)]/50 transition-all duration-500 group-hover:shadow-[0_0_20px_var(--brand-glow)]" />
            <div className="relative w-full h-full flex items-center justify-center p-1">
              <Logo size={34} />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl italic uppercase leading-none text-white tracking-tighter">Intelli<span className="text-[var(--brand-primary)] underline decoration-[var(--brand-primary)]/30 underline-offset-4">Campus</span></span>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1.5 flex items-center gap-1">
              <Sparkles size={8} className="text-[var(--brand-primary)]" /> Neural Interface V4.0
            </span>
          </div>
        </Link>

        {/* Search Bar - Aesthetic addition */}
        {user && (
          <div className="hidden lg:flex items-center bg-white/5 border border-white/5 rounded-2xl px-4 py-2 w-96 group hover:border-[var(--brand-primary)]/20 transition-all">
            <Search size={14} className="text-slate-500 group-hover:text-[var(--brand-primary)] transition-colors" />
            <input
              type="text"
              placeholder="Search neural entities..."
              className="bg-transparent border-none text-xs font-bold text-slate-300 placeholder:text-slate-600 focus:outline-none w-full px-3 uppercase tracking-widest italic"
            />
            <span className="text-[8px] font-black text-slate-700 border border-slate-800 px-1.5 py-0.5 rounded-md">⌘K</span>
          </div>
        )}

        <div className="flex items-center gap-8">
          {!user ? (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-[10px] font-black text-slate-500 hover:text-white uppercase italic tracking-widest transition-all px-4">
                Verify Identity
              </Link>
              <Link to="/register" className="btn-action shadow-none hover:shadow-[0_0_15px_var(--brand-glow)]">
                <UserPlus size={14} /> Provision Access
              </Link>
            </div>
          ) : (
            <Link to={`/${user.role.toLowerCase()}/profile`} className="flex items-center gap-5 group">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-white uppercase italic tracking-tight leading-none group-hover:text-[var(--brand-primary)] transition-colors">{user.name || 'Academic User'}</span>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1.5">{user.role} Instance</span>
              </div>
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl border border-white/10 p-0.5 group-hover:border-[var(--brand-primary)]/40 transition-all duration-500 rotate-45 group-hover:rotate-[225deg]">
                  <div className="w-full h-full rounded-[14px] bg-slate-900 overflow-hidden flex items-center justify-center -rotate-45 group-hover:rotate-45 transition-transform duration-500">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-black text-white italic">{user.name?.[0] || 'U'}</span>
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse" />
              </div>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;