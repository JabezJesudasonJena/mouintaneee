'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store/app-store';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { login, currentUser, refreshData, isOnline, toggleOnline, syncQueue } = useAppStore();

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'driver') {
      login('driver');
    }
    refreshData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const navItems = [
    { href: '/driver', label: 'Trip', icon: 'navigation' },
    { href: '/driver/report', label: 'Report', icon: 'alert' },
    { href: '/driver/sync', label: 'Sync', icon: 'sync' },
  ];

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
        <div className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none" className="flex-shrink-0">
            <path d="M14 3L3 25h22L14 3z" fill="var(--color-forest-700)" />
            <path d="M14 9L7 25h14L14 9z" fill="var(--color-forest-500)" />
          </svg>
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">MountainRoute</div>
            <div className="text-[10px] text-[var(--text-muted)]">Driver</div>
          </div>
        </div>

        {/* Online/Offline toggle */}
        <button
          onClick={toggleOnline}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            isOnline
              ? 'bg-[rgba(77,168,126,0.12)] text-[var(--color-forest-400)]'
              : 'bg-[rgba(212,130,10,0.12)] text-[var(--color-amber-500)]'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[var(--color-forest-400)]' : 'bg-[var(--color-amber-500)]'}`}
          />
          {isOnline ? 'Online' : 'Offline'}
          {!isOnline && syncQueue.length > 0 && (
            <span className="ml-1 bg-[var(--color-amber-500)] text-white w-4 h-4 rounded-full text-[9px] flex items-center justify-center">
              {syncQueue.length}
            </span>
          )}
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Bottom navigation — mobile-first, large touch targets */}
      <nav className="flex border-t border-[var(--border-default)] bg-[var(--bg-surface)]">
        {navItems.map((item) => {
          const isActive = item.href === '/driver'
            ? pathname === '/driver'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-3 min-h-[56px] transition-colors ${
                isActive
                  ? 'text-[var(--color-forest-400)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <DriverNavIcon icon={item.icon} active={isActive} />
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function DriverNavIcon({ icon, active }: { icon: string; active: boolean }) {
  const color = active ? 'var(--color-forest-400)' : 'currentColor';
  const props = { width: 22, height: 22, viewBox: '0 0 22 22', fill: 'none', stroke: color, strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (icon) {
    case 'navigation':
      return <svg {...props}><path d="M3 11l8-8 8 8M5 19V11h12v8" /><path d="M9 19v-4h4v4" /></svg>;
    case 'alert':
      return <svg {...props}><path d="M10 3L2 17h16L10 3z" transform="translate(1,1)" /><path d="M11 9v3" /><circle cx="11" cy="15" r="0.5" fill={color} /></svg>;
    case 'sync':
      return <svg {...props}><path d="M4 7a8 8 0 0114 0M18 15a8 8 0 01-14 0" /><path d="M4 3v4h4M18 19v-4h-4" /></svg>;
    default:
      return null;
  }
}
