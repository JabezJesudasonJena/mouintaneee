import Link from 'next/link';
import type { Alert } from '@/lib/data/types';

export function AlertFeed({ alerts }: { alerts: Alert[] }) {
  const priorityColors: Record<string, string> = {
    critical: 'var(--color-rust-500)',
    high: 'var(--color-amber-500)',
    medium: 'var(--color-amber-400)',
    info: 'var(--color-info-400)',
  };

  const recentAlerts = alerts
    .filter((a) => !a.dismissed)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 60000;
    if (diff < 60) return `${Math.round(diff)}m ago`;
    if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-default)] flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recent Alerts</h2>
        <Link href="/dashboard/alerts" className="text-xs text-[var(--color-forest-400)] hover:underline">
          View all
        </Link>
      </div>
      <div className="divide-y divide-[var(--border-subtle)]">
        {recentAlerts.map((alert) => (
          <div key={alert.id} className="px-4 py-3 flex gap-3 hover:bg-[var(--bg-panel)] transition-colors">
            <div
              className="flex-shrink-0 w-1.5 rounded-full mt-0.5"
              style={{
                backgroundColor: priorityColors[alert.priority],
                height: '100%',
                minHeight: '32px',
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-xs font-medium ${alert.read ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                  {alert.title}
                </p>
                <span className="mono text-[10px] text-[var(--text-muted)] flex-shrink-0">
                  {formatTime(alert.timestamp)}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-2">
                {alert.message}
              </p>
              {alert.duplicateCount > 0 && (
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-panel)] text-[var(--text-muted)]">
                  {alert.duplicateCount} similar reports merged
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
