'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Swords, Package, Trophy, User, Flame, BookOpen, FileText, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { href: '/dashboard',   label: 'War Room',    icon: Home },
  { href: '/arena',       label: 'The Crucible',icon: Swords },
  { href: '/inventory',   label: 'Armory',      icon: Package },
  { href: '/leaderboard', label: 'Champions',   icon: Trophy },
  { href: '/profile',     label: 'Chronicle',   icon: User },
];

const secondaryItems = [
  { href: '/dashboard#codex',     label: 'Codex',     icon: BookOpen },
  { href: '/dashboard#contracts', label: 'Contracts', icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    document.cookie = 'aa_token=; path=/; max-age=0';
    router.push('/auth/login');
  };

  const itemStyle = (active: boolean) => ({
    width: 40, height: 40, borderRadius: 10,
    color:       active ? '#d4a843' : '#5c574e',
    background:  active ? 'rgba(212,168,67,0.08)' : 'transparent',
  });

  const NavLink = ({ href, label, icon: Icon }: typeof navItems[number]) => {
    const isActive = pathname === href || (pathname.startsWith(href) && href !== '/dashboard') || (href === '/dashboard' && pathname === '/dashboard');
    return (
      <Link href={href}
        className="group relative flex items-center justify-center transition-all duration-200"
        style={itemStyle(isActive)}
        title={label}
        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color='#8a8478'; e.currentTarget.style.background='rgba(255,255,255,0.03)'; } }}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color='#5c574e'; e.currentTarget.style.background='transparent'; } }}
      >
        {isActive && (
          <span className="absolute" style={{ left:-10, top:'30%', bottom:'30%', width:2.5, background:'#d4a843', borderRadius:'0 2px 2px 0' }} />
        )}
        <Icon size={16} />
        <span className="absolute left-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50"
          style={{ marginLeft:12, padding:'4px 10px', fontSize:'0.7rem', borderRadius:8, background:'rgba(20,20,34,0.95)', border:'1px solid rgba(255,255,255,0.06)', color:'#d4cfc5' }}>
          {label}
        </span>
      </Link>
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-screen flex flex-col items-center z-50"
      style={{ width:60, paddingTop:16, paddingBottom:16, gap:2, background:'rgba(8,8,14,0.9)', borderRight:'1px solid rgba(255,255,255,0.04)' }}>

      {/* Logo */}
      <Link href="/" className="flex items-center justify-center"
        style={{ width:36, height:36, borderRadius:10, background:'radial-gradient(circle at 50% 40%,rgba(212,168,67,0.25),rgba(212,168,67,0.08))', boxShadow:'0 0 24px rgba(212,168,67,0.08)', marginBottom:16 }}>
        <Flame size={18} style={{ color:'#d4a843' }} />
      </Link>

      <div style={{ width:28, height:1, marginBottom:8, background:'rgba(255,255,255,0.06)' }} />

      {/* Primary nav */}
      <nav className="flex flex-col" style={{ gap:2 }}>
        {navItems.map(item => <NavLink key={item.href} {...item} />)}
      </nav>

      <div style={{ width:28, height:1, margin:'8px 0', background:'rgba(255,255,255,0.04)' }} />

      {/* Secondary nav (Codex + Contracts) */}
      <nav className="flex flex-col" style={{ gap:2 }}>
        {secondaryItems.map(item => <NavLink key={item.href} {...item} />)}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      <div style={{ width:28, height:1, marginBottom:8, background:'linear-gradient(90deg,transparent,rgba(212,168,67,0.25),transparent)' }} />

      {/* User avatar / info */}
      {user ? (
        <div className="group relative flex flex-col items-center gap-1">
          <div className="flex items-center justify-center" title={user.username}
            style={{ width:32, height:32, borderRadius:'50%', fontSize:13, background:'rgba(212,168,67,0.1)', border:'1px solid rgba(212,168,67,0.25)', cursor:'default' }}>
            <span style={{ color:'#d4a843', fontSize:13, fontWeight:700, fontFamily:'monospace' }}>
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          {/* Logout tooltip */}
          <button onClick={handleLogout} title="Log out"
            className="flex items-center justify-center transition-all hover:opacity-80"
            style={{ width:24, height:24, borderRadius:6, background:'rgba(192,57,43,0.1)', border:'1px solid rgba(192,57,43,0.2)' }}>
            <LogOut size={11} style={{ color:'#c0392b' }} />
          </button>
          {/* Username tooltip */}
          <span className="absolute left-full bottom-6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50"
            style={{ marginLeft:12, padding:'4px 10px', fontSize:'0.7rem', borderRadius:8, background:'rgba(20,20,34,0.95)', border:'1px solid rgba(255,255,255,0.06)', color:'#d4cfc5' }}>
            {user.username} · Lv{user.level}
          </span>
        </div>
      ) : (
        <Link href="/auth/login" title="Sign In"
          className="flex items-center justify-center"
          style={{ width:32, height:32, borderRadius:'50%', fontSize:13, background:'rgba(212,168,67,0.08)', border:'1px solid rgba(212,168,67,0.15)' }}>
          <span style={{ color:'#5c574e' }}>⚔️</span>
        </Link>
      )}
    </aside>
  );
}
