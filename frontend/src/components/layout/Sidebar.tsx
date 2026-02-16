'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Swords, Package, Trophy, User, Flame } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'War Room', icon: Home },
  { href: '/arena', label: 'The Depths', icon: Swords },
  { href: '/inventory', label: 'Armory', icon: Package },
  { href: '/leaderboard', label: 'Champions', icon: Trophy },
  { href: '/profile', label: 'Chronicle', icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  
  return (
    <aside 
      className="fixed left-0 top-0 h-screen w-[60px] flex flex-col items-center py-4 gap-1 z-50"
      style={{ 
        background: 'rgba(10, 10, 18, 0.95)',
        borderRight: '1px solid rgba(255, 255, 255, 0.04)',
      }}
    >
      {/* Logo */}
      <Link 
        href="/"
        className="flex items-center justify-center w-10 h-10 rounded-xl mb-3"
        style={{
          background: 'rgba(245, 158, 11, 0.15)',
          boxShadow: '0 0 20px rgba(245, 158, 11, 0.1)',
        }}
      >
        <Flame size={20} className="text-gold" />
      </Link>
      
      {/* Divider */}
      <div className="w-7 h-px mb-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
      
      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200"
              style={{
                color: isActive ? '#f59e0b' : '#6b7280',
                background: isActive ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
              }}
              title={item.label}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.color = '#9ca3af';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {/* Gold left-edge indicator */}
              {isActive && (
                <span 
                  className="absolute rounded-r"
                  style={{
                    left: -8, top: '25%', bottom: '25%', width: 3,
                    background: '#f59e0b',
                    borderRadius: '0 3px 3px 0',
                  }}
                />
              )}
              
              <Icon size={18} />
              
              {/* Tooltip */}
              <span 
                className="absolute left-full ml-3 px-2.5 py-1 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50"
                style={{
                  background: 'rgba(30,30,50,0.95)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#e8e6e3',
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      
      {/* User */}
      <div 
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm"
        style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
        }}
      >
        ⚔️
      </div>
    </aside>
  );
}
