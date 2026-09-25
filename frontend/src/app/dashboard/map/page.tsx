'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import MapView from '@/components/map/MapView';

type LayerToggle = {
  id: string;
  label: string;
  enabled: boolean;
  color: string;
};

export default function LiveMapPage() {
  const { routes, hazards, hubs, driverLocations, refreshData, client } = useAppStore();

  const [layers, setLayers] = useState<LayerToggle[]>([
    { id: 'routes', label: 'Routes', enabled: true, color: 'var(--color-forest-500)' },
    { id: 'hazards', label: 'Hazards', enabled: true, color: 'var(--color-rust-500)' },
    { id: 'hubs', label: 'Hubs & Stops', enabled: true, color: 'var(--color-info-400)' },
    { id: 'drivers', label: 'Drivers', enabled: true, color: 'var(--color-forest-400)' },
  ]);

  useEffect(() => {
    refreshData();
    client.startSimulation();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleLayer = useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l))
    );
  }, []);

  const isEnabled = (id: string) => layers.find((l) => l.id === id)?.enabled ?? true;

  const activeHazards = useMemo(() =>
    hazards.filter((h) => h.status !== 'resolved'),
    [hazards]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Live Map</h1>
          <p className="text-xs text-[var(--text-muted)]">Full-screen operational view — all layers</p>
        </div>
        {/* Layer toggles */}
        <div className="flex items-center gap-2">
          {layers.map((layer) => (
            <button
              key={layer.id}
              onClick={() => toggleLayer(layer.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                layer.enabled
                  ? 'bg-[var(--bg-panel)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full transition-opacity"
                style={{
                  backgroundColor: layer.color,
                  opacity: layer.enabled ? 1 : 0.3,
                }}
              />
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map — full remaining height */}
      <div className="flex-1 relative">
        <MapView
          routes={isEnabled('routes') ? routes : []}
          hazards={isEnabled('hazards') ? activeHazards : []}
          hubs={isEnabled('hubs') ? hubs : []}
          driverLocations={isEnabled('drivers') ? driverLocations : []}
          className="h-full"
        />

        {/* Legend overlay */}
        <div className="absolute bottom-4 left-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-[10px] space-y-1.5">
          <div className="text-[var(--text-muted)] font-medium mb-1">Route Risk</div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded bg-[var(--color-forest-500)]" />
            <span className="text-[var(--text-secondary)]">Low (0–30)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded bg-[var(--color-amber-500)]" />
            <span className="text-[var(--text-secondary)]">Medium (31–60)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded bg-[var(--color-rust-500)]" />
            <span className="text-[var(--text-secondary)]">High (61+)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
