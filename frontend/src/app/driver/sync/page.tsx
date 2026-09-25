'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import type { SyncEvent } from '@/lib/data/types';

const SYNC_TYPE_LABELS: Record<string, string> = {
  location_update: 'Location Update',
  incident_report: 'Incident Report',
  trip_status_change: 'Trip Status Change',
  alert_acknowledgment: 'Alert Acknowledgment',
};

const SYNC_STATUS_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  pending: { color: 'var(--color-amber-500)', label: 'Pending', icon: '⏳' },
  syncing: { color: 'var(--color-info-400)', label: 'Syncing...', icon: '↻' },
  synced: { color: 'var(--color-forest-400)', label: 'Synced', icon: '✓' },
  failed: { color: 'var(--color-rust-500)', label: 'Failed', icon: '✗' },
};

export default function DriverSyncPage() {
  const { isOnline, toggleOnline, syncQueue, client, refreshData } = useAppStore();
  const [syncing, setSyncing] = useState(false);
  const [localQueue, setLocalQueue] = useState<SyncEvent[]>([]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(() => {
      setLocalQueue(client.getSyncQueue());
    }, 500);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate some offline events for demo
  const generateOfflineEvents = useCallback(() => {
    client.addToSyncQueue({
      type: 'location_update',
      payload: { lat: 27.67, lng: 85.39, timestamp: new Date().toISOString() },
    });
    client.addToSyncQueue({
      type: 'location_update',
      payload: { lat: 27.665, lng: 85.395, timestamp: new Date().toISOString() },
    });
    setLocalQueue(client.getSyncQueue());
  }, [client]);

  const handleSync = useCallback(async () => {
    if (!isOnline) {
      // Simulate going online first
      toggleOnline();
      await new Promise((r) => setTimeout(r, 500));
    }

    setSyncing(true);

    // Animate syncing
    const refreshLoop = setInterval(() => {
      setLocalQueue(client.getSyncQueue());
    }, 300);

    await client.processSyncQueue();

    clearInterval(refreshLoop);
    setLocalQueue(client.getSyncQueue());
    setSyncing(false);
    refreshData();
  }, [isOnline, toggleOnline, client, refreshData]);

  const pendingCount = localQueue.filter((e) => e.status === 'pending').length;
  const syncingCount = localQueue.filter((e) => e.status === 'syncing').length;
  const syncedCount = localQueue.filter((e) => e.status === 'synced').length;

  return (
    <div className="p-4 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Offline & Sync</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Manage connectivity and queued events</p>
      </div>

      {/* Connection Status Card */}
      <div
        className="rounded-lg p-4 border"
        style={{
          backgroundColor: isOnline ? 'rgba(77,168,126,0.08)' : 'rgba(212,130,10,0.08)',
          borderColor: isOnline ? 'var(--color-forest-600)' : 'var(--color-amber-500)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${isOnline ? 'bg-[var(--color-forest-400)]' : 'bg-[var(--color-amber-500)]'}`}
            >
              {isOnline && (
                <div className="w-3 h-3 rounded-full bg-[var(--color-forest-400)] animate-ping" />
              )}
            </div>
            <span className="text-sm font-semibold" style={{ color: isOnline ? 'var(--color-forest-400)' : 'var(--color-amber-400)' }}>
              {isOnline ? 'Connected' : 'Offline Mode'}
            </span>
          </div>
          <button
            onClick={toggleOnline}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors min-h-[36px] ${
              isOnline
                ? 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-default)]'
                : 'bg-[var(--color-forest-800)] text-white'
            }`}
          >
            {isOnline ? 'Go Offline' : 'Go Online'}
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          {isOnline
            ? 'All data syncs in real-time. Tap "Go Offline" to simulate loss of connectivity.'
            : 'Events are queued locally and will sync when you reconnect.'}
        </p>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2.5 text-center">
          <div className="mono text-lg font-semibold text-[var(--color-amber-500)]">{pendingCount}</div>
          <div className="text-[10px] text-[var(--text-muted)]">Pending</div>
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2.5 text-center">
          <div className="mono text-lg font-semibold text-[var(--color-info-400)]">{syncingCount}</div>
          <div className="text-[10px] text-[var(--text-muted)]">Syncing</div>
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2.5 text-center">
          <div className="mono text-lg font-semibold text-[var(--color-forest-400)]">{syncedCount}</div>
          <div className="text-[10px] text-[var(--text-muted)]">Synced</div>
        </div>
      </div>

      {/* Demo: generate events while offline */}
      {!isOnline && (
        <button
          onClick={generateOfflineEvents}
          className="w-full py-3 rounded-lg text-sm font-medium bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--color-forest-600)] transition-colors min-h-[48px]"
        >
          Generate Sample Offline Events
        </button>
      )}

      {/* Sync Queue */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-default)] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Sync Queue</h3>
          {localQueue.length > 0 && pendingCount > 0 && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-3 py-1 rounded text-xs font-medium bg-[var(--color-forest-800)] hover:bg-[var(--color-forest-700)] text-white transition-colors disabled:opacity-50 min-h-[32px]"
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          )}
        </div>

        <div className="divide-y divide-[var(--border-subtle)]">
          {localQueue.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[var(--text-muted)]">Queue is empty</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Go offline and generate events to see the sync queue
              </p>
            </div>
          ) : (
            localQueue.map((event) => {
              const config = SYNC_STATUS_CONFIG[event.status];
              return (
                <div key={event.id} className="px-4 py-3 flex items-center gap-3">
                  {/* Status icon with animation */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                      event.status === 'syncing' ? 'animate-spin' : ''
                    }`}
                    style={{
                      backgroundColor: `color-mix(in srgb, ${config.color} 12%, transparent)`,
                      color: config.color,
                    }}
                  >
                    {config.icon}
                  </div>

                  {/* Event info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[var(--text-primary)]">
                      {SYNC_TYPE_LABELS[event.type] || event.type}
                    </div>
                    <div className="mono text-[10px] text-[var(--text-muted)]">
                      {new Date(event.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>

                  {/* Status */}
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                    style={{
                      color: config.color,
                      backgroundColor: `color-mix(in srgb, ${config.color} 10%, transparent)`,
                    }}
                  >
                    {config.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Offline tips */}
      <div className="bg-[var(--bg-panel)] rounded-lg p-4">
        <div className="text-xs font-medium text-[var(--text-secondary)] mb-2">How Offline Mode Works</div>
        <ul className="space-y-1.5 text-[11px] text-[var(--text-muted)]">
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-forest-400)] mt-0.5">1</span>
            <span>Toggle &ldquo;Go Offline&rdquo; to simulate losing connectivity</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-forest-400)] mt-0.5">2</span>
            <span>Report incidents or perform actions — they queue locally</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-forest-400)] mt-0.5">3</span>
            <span>Toggle &ldquo;Go Online&rdquo; or tap &ldquo;Sync Now&rdquo; — watch events sync one by one</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
