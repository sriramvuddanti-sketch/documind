import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import Brand from './Brand';
import Icon from './Icon';

const navigation = [
  { to: '/dashboard', label: 'Overview', icon: 'dashboard' },
  { to: '/documents', label: 'Documents', icon: 'file' },
  { to: '/upload', label: 'Upload document', icon: 'upload' },
];

function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  return <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 px-4 py-5 text-white">
    <div className="px-2 pb-8"><Brand light /></div>
    <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Workspace</div>
    <nav className="space-y-1">{navigation.map((item) => <NavLink className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/10' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`} end={item.to === '/dashboard'} key={item.to} onClick={onNavigate} to={item.to}><Icon name={item.icon} size={18} />{item.label}</NavLink>)}</nav>
    <div className="mt-auto">
      <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><div className="mb-3 flex items-center gap-2 text-xs font-semibold text-cyan-300"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-400/10"><Icon name="sparkles" size={14} /></span>AI extraction active</div><p className="text-xs leading-5 text-slate-500">Upload an invoice or bill and let DocuMind structure the details for you.</p></div>
      <div className="flex items-center gap-3 border-t border-slate-800 px-2 pt-4"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-cyan-300">{(user?.name || user?.email || 'U').charAt(0).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{user?.name || 'Workspace owner'}</p><p className="truncate text-xs text-slate-500">{user?.email || 'Account'}</p></div><button aria-label="Log out" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-900 hover:text-white" onClick={logout} type="button"><Icon name="logout" size={17} /></button></div>
    </div>
  </aside>;
}

export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const pageTitle = location.pathname.startsWith('/documents/') ? 'Document review' : navigation.find((item) => item.to === location.pathname)?.label || 'Workspace';
  return <div className="min-h-screen bg-[#f7f9fc] text-slate-900 lg:flex">
    <div className="hidden h-screen lg:block"><Sidebar /></div>
    {menuOpen && <div className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" onClick={() => setMenuOpen(false)} />}
    <div className={`fixed inset-y-0 left-0 z-50 transition-transform lg:hidden ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}><Sidebar onNavigate={() => setMenuOpen(false)} /></div>
    <div className="min-w-0 flex-1"><header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-[#f7f9fc]/90 px-4 backdrop-blur-md sm:px-8 lg:px-10"><div className="flex items-center gap-3"><button aria-label="Open navigation" className="rounded-lg p-2 text-slate-600 hover:bg-white lg:hidden" onClick={() => setMenuOpen(true)} type="button"><Icon name="menu" size={21} /></button><div className="text-sm font-semibold text-slate-500">{pageTitle}</div></div><NavLink className="button-primary hidden sm:inline-flex" to="/upload"><Icon name="plus" size={16} />New upload</NavLink></header><main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-8 sm:py-9 lg:px-10"><Outlet /></main></div>
  </div>;
}
