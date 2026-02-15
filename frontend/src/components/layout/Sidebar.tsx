'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Swords, Package, Trophy, User } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/arena', label: 'Arena', icon: Swords },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  
  return (
    <aside className="fixed left-0 top-0 h-screen w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-6 gap-6">
      {/* Logo */}
      <Link 
        href="/"
        className="text-3xl mb-4 hover:scale-110 transition-transform"
      >
        ⚔️
      </Link>
      
      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-4">
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
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }
              `}
              title={item.label}
            >
              <Icon size={20} />
              
              {/* Tooltip */}
              <span className="absolute left-full ml-4 px-3 py-1.5 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      
      {/* User avatar at bottom */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
        U
      </div>
    </aside>
  );
}
