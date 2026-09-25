'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import MapView from '@/components/map/MapView';
import type { HazardEvent, Incident } from '@/lib/data/types';

const HAZARD_TYPE_LABELS: Record<string, string> = {
  landslide: 'Landslide',
  flooding: 'Flooding',
  road_damage: 'Road Damage',
  snow_ice: 'Snow/Ice',
  rockfall: 'Rockfall',
  bridge_damage: 'Bridge Damage',
  road_closure: 'Road Closure',
  weather_severe: 'Severe Weather',
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string }> = {
  low: { color: 'var(--color-sage-400)', bg: 'rgba(150, 171, 142, 0.12)' },
  moderate: { color: 'var(--color-amber-400)', bg: 'rgba(224, 154, 47, 0.12)' },
  high: { color: 'var(--color-amber-500)', bg: 'rgba(212, 130, 10, 0.15)' },
  critical: { color: 'var(--color-rust-500)', bg: 'rgba(204, 85, 51, 0.15)' },
};

export default function HazardsPage() {
  const { hazards, incidents, routes, hubs, refreshData, client } = useAppStore();
  const [tab, setTab] = useState<'hazards' | 'incidents'>('hazards');

  useEffect(() => {
    refreshData();
    client.startSimulation();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeHazards = useMemo(() =>
    hazards.filter((h) => h.status !== 'resolved'),
    [hazards]
  );

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 60000;
    if (diff < 60) return `${Math.round(diff)}m ago`;
    if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
    return d.toLocaleDateString();
  };

  // Inject hazard for demo
  const [injecting, setInjecting] = useState(false);
  const injectDemo = useCallback(() => {
    setInjecting(true);
    const types: HazardEvent['type'][] = ['landslide', 'flooding', 'road_damage', 'rockfall'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    client.injectHazard({
      type: randomType,
      severity: 'high',
      title: `New ${HAZARD_TYPE_LABELS[randomType]} detected`,
      description: `Automated detection system identified potential ${randomType} hazard in the Mountain Pass area. Verification pending.`,
      location: {
        type: 'Point',
        coordinates: [85.39 + Math.random() * 0.04, 27.65 + Math.random() * 0.04],
      },
      affectedRoutes: ['rte_001'],
    });
    refreshData();
    setTimeout(() => setInjecting(false), 1500);
  }, [client, refreshData]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Hazards & Incidents</h1>
          <p className="text-xs text-[var(--text-muted)]">{activeHazards.length} active hazards · {incidents.length} incident reports</p>
        </div>
        <button
          onClick={injectDemo}
          disabled={injecting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--color-rust-600)] hover:bg-[var(--color-rust-500)] text-white transition-colors disabled:opacity-50"
        >
          {injecting ? 'Injecting...' : 'Inject Hazard (Demo)'}
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">
          {/* Map */}
          <div className="border-r border-[var(--border-default)]">
            <MapView
              routes={routes}
              hazards={activeHazards}
              hubs={hubs}
              className="h-full min-h-[400px]"
            />
          </div>

          {/* List panel */}
          <div className="flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-[var(--border-default)]">
              <button
                onClick={() => setTab('hazards')}
                className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
                  tab === 'hazards'
                    ? 'text-[var(--text-primary)] border-b-2 border-[var(--color-forest-500)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                Hazards ({activeHazards.length})
              </button>
              <button
                onClick={() => setTab('incidents')}
                className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
                  tab === 'incidents'
                    ? 'text-[var(--text-primary)] border-b-2 border-[var(--color-forest-500)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                Incidents ({incidents.length})
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto">
              {tab === 'hazards' ? (
                <div className="divide-y divide-[var(--border-subtle)]">
                  {hazards.map((hazard) => {
                    const sev = SEVERITY_CONFIG[hazard.severity] || SEVERITY_CONFIG.moderate;
                    return (
                      <div key={hazard.id} className="px-4 py-3 hover:bg-[var(--bg-panel)] transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium capitalize"
                                style={{ color: sev.color, backgroundColor: sev.bg }}
                              >
                                {hazard.severity}
                              </span>
                              <span className="text-[10px] text-[var(--text-muted)] capitalize">
                                {HAZARD_TYPE_LABELS[hazard.type] || hazard.type}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-[var(--text-primary)]">{hazard.title}</p>
                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-2">{hazard.description}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="mono text-[10px] text-[var(--text-muted)]">{formatTime(hazard.reportedAt)}</div>
                            <div
                              className="mt-1 text-[10px] capitalize px-1.5 py-0.5 rounded"
                              style={{
                                color: hazard.status === 'resolved' ? 'var(--color-sage-400)' : 'var(--color-amber-400)',
                                backgroundColor: hazard.status === 'resolved' ? 'rgba(150,171,142,0.1)' : 'rgba(224,154,47,0.1)',
                              }}
                            >
                              {hazard.status}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--text-muted)]">
                          <span className="mono">
                            📍 {hazard.location.coordinates[1].toFixed(3)}, {hazard.location.coordinates[0].toFixed(3)}
                          </span>
                          <span>Radius: {hazard.affectedRadius}km</span>
                          {hazard.affectedRoutes.length > 0 && (
                            <span>{hazard.affectedRoutes.length} routes affected</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {hazards.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                      No hazards reported
                    </div>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-subtle)]">
                  {incidents.map((incident) => {
                    const sev = SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG.moderate;
                    return (
                      <div key={incident.id} className="px-4 py-3 hover:bg-[var(--bg-panel)] transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium capitalize"
                                style={{ color: sev.color, backgroundColor: sev.bg }}
                              >
                                {incident.severity}
                              </span>
                              <span className="text-[10px] text-[var(--text-muted)] capitalize">
                                {incident.category.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-[var(--text-primary)]">{incident.title}</p>
                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-2">{incident.description}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="mono text-[10px] text-[var(--text-muted)]">{formatTime(incident.timestamp)}</div>
                            <div
                              className="mt-1 text-[10px] capitalize px-1.5 py-0.5 rounded"
                              style={{
                                color: incident.status === 'resolved' ? 'var(--color-sage-400)' : 'var(--color-info-400)',
                                backgroundColor: incident.status === 'resolved' ? 'rgba(150,171,142,0.1)' : 'rgba(74,127,181,0.1)',
                              }}
                            >
                              {incident.status}
                            </div>
                          </div>
                        </div>
                        {incident.clusterGroupId && (
                          <span className="inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-panel)] text-[var(--text-muted)]">
                            Part of proximity cluster
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {incidents.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                      No incidents reported
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
