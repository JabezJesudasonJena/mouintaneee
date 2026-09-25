'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store/app-store';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: 'grid' },
  { href: '/dashboard/shipments', label: 'Shipments', icon: 'package' },
  { href: '/dashboard/map', label: 'Live Map', icon: 'map' },
  { href: '/dashboard/hazards', label: 'Hazards', icon: 'alert-triangle' },
  { href: '/dashboard/alerts', label: 'Alerts', icon: 'bell' },
];

function NavIcon({ icon, size = 18 }: { icon: string; size?: number }) {
  const props = { width: size, height: size, viewBox: '0 0 18 18', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (icon) {
    case 'grid':
      return <svg {...props}><rect x="2" y="2" width="5.5" height="5.5" rx="1" /><rect x="10.5" y="2" width="5.5" height="5.5" rx="1" /><rect x="2" y="10.5" width="5.5" height="5.5" rx="1" /><rect x="10.5" y="10.5" width="5.5" height="5.5" rx="1" /></svg>;
    case 'package':
      return <svg {...props}><path d="M2 6l7-4 7 4v8l-7 4-7-4V6z" /><path d="M9 10V18" /><path d="M2 6l7 4 7-4" /></svg>;
    case 'map':
      return <svg {...props}><path d="M1 4l5-2 6 2 5-2v12l-5 2-6-2-5 2V4z" /><path d="M6 2v12" /><path d="M12 4v12" /></svg>;
    case 'alert-triangle':
      return <svg {...props}><path d="M8.1 2.8L1.3 14.5a1 1 0 00.86 1.5h13.66a1 1 0 00.86-1.5L9.9 2.8a1 1 0 00-1.8 0z" /><path d="M9 7v3" /><circle cx="9" cy="13" r="0.5" fill="currentColor" /></svg>;
    case 'bell':
      return <svg {...props}><path d="M13.73 14a2 2 0 01-9.46 0" /><path d="M5 6.5a4 4 0 018 0c0 4 2 5.5 2 5.5H3s2-1.5 2-5.5z" /></svg>;
    default:
      return null;
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { login, currentUser, refreshData, alerts, sidebarOpen, setSidebarOpen } = useAppStore();

  useEffect(() => {
    if (!currentUser) {
      login('ops_manager');
    }
    refreshData();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const unreadAlerts = alerts.filter(a => !a.read && !a.dismissed).length;

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex-shrink-0 flex flex-col bg-[var(--color-night-900)] border-r border-[var(--border-default)] transition-all duration-200 ${
          sidebarOpen ? 'w-56' : 'w-14'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-3 h-14 border-b border-[var(--border-default)]">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--color-night-700)] transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--color-sage-300)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 5h12M3 9h12M3 13h12" />
            </svg>
          </button>
          {sidebarOpen && (
            <Link href="/" className="text-sm font-semibold text-[var(--text-primary)] truncate">
              MountainRoute
            </Link>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 flex flex-col gap-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors relative ${
                  isActive
                    ? 'bg-[var(--color-forest-800)] text-[var(--color-forest-300)]'
                    : 'text-[var(--color-sage-300)] hover:bg-[var(--color-night-700)] hover:text-[var(--text-primary)]'
                }`}
              >
                <NavIcon icon={item.icon} />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
                {item.icon === 'bell' && unreadAlerts > 0 && (
                  <span className="absolute top-1 left-6 w-4 h-4 rounded-full bg-[var(--color-rust-500)] text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadAlerts > 9 ? '9+' : unreadAlerts}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-[var(--border-default)]">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[var(--color-forest-700)] flex items-center justify-center text-xs font-semibold text-[var(--color-forest-300)]">
                {currentUser?.name?.[0] || 'K'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-[var(--text-primary)] truncate">
                  {currentUser?.name || 'Kiran Thapa'}
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">Ops Manager</div>
              </div>
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-[var(--color-forest-700)] flex items-center justify-center text-xs font-semibold text-[var(--color-forest-300)] mx-auto">
              {currentUser?.name?.[0] || 'K'}
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
