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
    <aside className="fixed left-0 top-0 h-screen w-20 bg-arena-dark border-r border-border-warm flex flex-col items-center py-6 gap-6 z-50">
      {/* Logo */}
      <Link 
        href="/"
        className="group relative flex items-center justify-center w-14 h-14 mb-2"
      >
        <Flame size={28} className="text-gold group-hover:text-gold-bright transition-colors" />
        <div className="absolute inset-0 rounded-lg bg-gold/5 group-hover:bg-gold/10 transition-colors" />
      </Link>
      
      {/* Divider */}
      <div className="w-10 h-px bg-gradient-to-r from-transparent via-gold-dim to-transparent" />
      
      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group relative flex items-center justify-center w-12 h-12 rounded-lg
                transition-all duration-200
                ${isActive 
                  ? 'text-gold bg-gold/10' 
                  : 'text-[#6b7280] hover:text-[#e8e6e3] hover:bg-arena-elevated'
                }
              `}
              title={item.label}
            >
              {/* Gold left-edge indicator for active item */}
              {isActive && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-[3px] rounded-r-sm bg-gold" />
              )}
              
              <Icon size={20} />
              
              {/* Tooltip */}
              <span className="absolute left-full ml-4 px-3 py-1.5 bg-arena-card border border-border-warm text-[#e8e6e3] text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 font-body">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      
      {/* User avatar at bottom */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-dim to-fire flex items-center justify-center text-arena-deep font-bold text-sm">
        ⚔️
      </div>
    </aside>
  );
}
