'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import type { Alert, AlertPriority } from '@/lib/data/types';

const PRIORITY_CONFIG: Record<AlertPriority, { color: string; bg: string; label: string }> = {
  critical: { color: 'var(--color-rust-500)', bg: 'rgba(204, 85, 51, 0.12)', label: 'Critical' },
  high: { color: 'var(--color-amber-500)', bg: 'rgba(212, 130, 10, 0.12)', label: 'High' },
  medium: { color: 'var(--color-amber-400)', bg: 'rgba(224, 154, 47, 0.1)', label: 'Medium' },
  info: { color: 'var(--color-info-400)', bg: 'rgba(74, 127, 181, 0.1)', label: 'Info' },
};

export default function AlertsPage() {
  const { alerts, refreshData, markAlertRead, dismissAlert } = useAppStore();

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sortedAlerts = useMemo(() => {
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, info: 3 };
    return [...alerts]
      .filter((a) => !a.dismissed)
      .sort((a, b) => {
        const pDiff = (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4);
        if (pDiff !== 0) return pDiff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }, [alerts]);

  const unread = sortedAlerts.filter((a) => !a.read).length;

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 60000;
    if (diff < 60) return `${Math.round(diff)}m ago`;
    if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
    return d.toLocaleDateString();
  };

  const handleMarkRead = useCallback((id: string) => {
    markAlertRead(id);
  }, [markAlertRead]);

  const handleDismiss = useCallback((id: string) => {
    dismissAlert(id);
  }, [dismissAlert]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Alerts</h1>
          <p className="text-xs text-[var(--text-muted)]">{unread} unread · {sortedAlerts.length} total</p>
        </div>
      </div>

      {/* Alerts list */}
      <div className="flex-1 overflow-auto">
        <div className="divide-y divide-[var(--border-subtle)]">
          {sortedAlerts.map((alert) => {
            const config = PRIORITY_CONFIG[alert.priority];

            return (
              <div
                key={alert.id}
                className={`px-6 py-4 hover:bg-[var(--bg-panel)] transition-colors ${
                  !alert.read ? 'bg-[var(--bg-surface)]' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Priority indicator */}
                  <div
                    className="flex-shrink-0 w-2 rounded-full mt-1"
                    style={{
                      backgroundColor: config.color,
                      height: '40px',
                    }}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold"
                        style={{ color: config.color, backgroundColor: config.bg }}
                      >
                        {config.label}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] capitalize">
                        {alert.category.replace('_', ' ')}
                      </span>
                      <span className="mono text-[10px] text-[var(--text-muted)]">
                        {formatTime(alert.timestamp)}
                      </span>
                      {!alert.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-forest-400)]" />
                      )}
                    </div>

                    <p className={`text-sm ${!alert.read ? 'font-medium text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                      {alert.title}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                      {alert.message}
                    </p>

                    {/* Merged alerts */}
                    {alert.duplicateCount > 0 && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--bg-panel)] text-[10px] text-[var(--text-muted)]">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M4 4h6v6H4z" />
                          <path d="M2 2h6v6" />
                        </svg>
                        {alert.duplicateCount} similar reports merged
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-2">
                      {alert.actionRequired && alert.actionLabel && (
                        <button className="text-xs font-medium text-[var(--color-forest-400)] hover:text-[var(--color-forest-300)] transition-colors">
                          {alert.actionLabel}
                        </button>
                      )}
                      {!alert.read && (
                        <button
                          onClick={() => handleMarkRead(alert.id)}
                          className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => handleDismiss(alert.id)}
                        className="text-[11px] text-[var(--text-muted)] hover:text-[var(--color-rust-400)] transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {sortedAlerts.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-[var(--text-muted)]">No active alerts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
