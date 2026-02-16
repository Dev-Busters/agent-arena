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
      className="fixed left-0 top-0 h-screen flex flex-col items-center z-50"
      style={{
        width: 60,
        paddingTop: 16,
        paddingBottom: 16,
        gap: 2,
        background: 'rgba(8, 8, 14, 0.9)',
        borderRight: '1px solid rgba(255, 255, 255, 0.04)',
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center justify-center"
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'radial-gradient(circle at 50% 40%, rgba(212, 168, 67, 0.25), rgba(212, 168, 67, 0.08))',
          boxShadow: '0 0 24px rgba(212, 168, 67, 0.08)',
          marginBottom: 16,
        }}
      >
        <Flame size={18} style={{ color: '#d4a843' }} />
      </Link>

      {/* Divider */}
      <div
        style={{
          width: 28,
          height: 1,
          marginBottom: 8,
          background: 'rgba(255, 255, 255, 0.06)',
        }}
      />

      {/* Navigation */}
      <nav className="flex-1 flex flex-col" style={{ gap: 2 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative flex items-center justify-center transition-all duration-200"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                color: isActive ? '#d4a843' : '#5c574e',
                background: isActive ? 'rgba(212, 168, 67, 0.08)' : 'transparent',
              }}
              title={item.label}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#8a8478';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#5c574e';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {/* Gold left-edge indicator */}
              {isActive && (
                <span
                  className="absolute"
                  style={{
                    left: -10,
                    top: '30%',
                    bottom: '30%',
                    width: 2.5,
                    background: '#d4a843',
                    borderRadius: '0 2px 2px 0',
                  }}
                />
              )}

              <Icon size={16} />

              {/* Tooltip */}
              <span
                className="absolute left-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50"
                style={{
                  marginLeft: 12,
                  padding: '4px 10px',
                  fontSize: '0.7rem',
                  borderRadius: 8,
                  background: 'rgba(20, 20, 34, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#d4cfc5',
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom user icon */}
      <div
        className="flex items-center justify-center"
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          fontSize: 13,
          background: 'rgba(212, 168, 67, 0.08)',
          border: '1px solid rgba(212, 168, 67, 0.15)',
        }}
      >
        ⚔️
      </div>
    </aside>
  );
}
