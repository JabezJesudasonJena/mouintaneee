'use client';

import { useEffect, useMemo, useCallback, useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/app-store';
import MapView from '@/components/map/MapView';
import RiskScoreGauge from '@/components/ui/RiskScoreGauge';
import type { Trip, Alert, TripStatus } from '@/lib/data/types';
import { AlertFeed } from '@/components/ui/AlertFeed';

// ============================================================
// Status config
// ============================================================
const STATUS_CONFIG: Record<TripStatus, { label: string; color: string; bg: string }> = {
  planned: { label: 'Planned', color: 'var(--color-info-400)', bg: 'rgba(74, 127, 181, 0.12)' },
  en_route: { label: 'En Route', color: 'var(--color-forest-400)', bg: 'rgba(77, 168, 126, 0.12)' },
  delayed: { label: 'Delayed', color: 'var(--color-amber-500)', bg: 'rgba(212, 130, 10, 0.12)' },
  at_risk: { label: 'At Risk', color: 'var(--color-rust-500)', bg: 'rgba(204, 85, 51, 0.12)' },
  completed: { label: 'Completed', color: 'var(--color-sage-400)', bg: 'rgba(150, 171, 142, 0.1)' },
  cancelled: { label: 'Cancelled', color: 'var(--color-stone-400)', bg: 'rgba(150, 140, 126, 0.1)' },
};

// ============================================================
// Stats Row
// ============================================================
function StatsRow({ trips }: { trips: Trip[] }) {
  const active = trips.filter((t) => ['en_route', 'delayed', 'at_risk', 'planned'].includes(t.status));
  const onTime = active.filter((t) => t.status === 'en_route' || t.status === 'planned');
  const atRisk = active.filter((t) => t.status === 'at_risk');
  const delayed = active.filter((t) => t.status === 'delayed');

  const stats = [
    { label: 'Active Trips', value: active.length, color: 'var(--text-primary)' },
    { label: 'On Time', value: onTime.length, color: 'var(--color-forest-400)' },
    { label: 'Delayed', value: delayed.length, color: 'var(--color-amber-500)' },
    { label: 'At Risk', value: atRisk.length, color: 'var(--color-rust-500)' },
  ];

  return (
    <div className="flex gap-1">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-4 py-3"
        >
          <div className="text-[11px] text-[var(--text-muted)] mb-0.5">{stat.label}</div>
          <div className="mono text-2xl font-semibold" style={{ color: stat.color }}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Trip Table (rows, not cards)
// ============================================================
function TripTable({ trips, drivers, vehicles }: {
  trips: Trip[];
  drivers: { id: string; name: string }[];
  vehicles: { id: string; name: string }[];
}) {
  const getDriverName = (id: string) => drivers.find((d) => d.id === id)?.name || id;
  const getVehicleName = (id: string) => vehicles.find((v) => v.id === id)?.name || id;

  const formatEta = (eta: string) => {
    const d = new Date(eta);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-default)] flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Active Trips</h2>
        <span className="mono text-xs text-[var(--text-muted)]">{trips.length} trips</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-medium">Trip</th>
              <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-medium">Driver</th>
              <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-medium">Vehicle</th>
              <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-medium">ETA</th>
              <th className="text-center px-4 py-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-medium">Risk</th>
              <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-medium">Status</th>
              <th className="text-right px-4 py-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-medium">Progress</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => {
              const status = STATUS_CONFIG[trip.status];
              return (
                <tr
                  key={trip.id}
                  className="border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--bg-panel)] transition-colors cursor-pointer"
                >
                  <td className="px-4 py-2.5">
                    <Link href={`/dashboard/trip/${trip.id}`} className="hover:underline">
                      <span className="mono text-xs font-medium text-[var(--text-primary)]">
                        {trip.id.replace('trp_', 'TRP-').toUpperCase()}
                      </span>
                      <div className="text-[11px] text-[var(--text-muted)] truncate max-w-[140px]">
                        {trip.origin.name} → {trip.destination.name}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)]">
                    {getDriverName(trip.driverId)}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)] max-w-[120px] truncate">
                    {getVehicleName(trip.vehicleId)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="mono text-xs text-[var(--text-primary)]">{formatEta(trip.eta)}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-center">
                      <RiskScoreGauge score={trip.riskScore} size="sm" showLabel={false} />
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-[11px] font-medium"
                      style={{ color: status.color, backgroundColor: status.bg }}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="w-16 h-1.5 bg-[var(--border-default)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${trip.currentProgress}%`,
                            backgroundColor: status.color,
                          }}
                        />
                      </div>
                      <span className="mono text-[11px] text-[var(--text-muted)] w-8 text-right">
                        {Math.round(trip.currentProgress)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {trips.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                  No active trips
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ============================================================
// Dashboard Overview Page
// ============================================================
export default function DashboardOverview() {
  const { trips, drivers, vehicles, routes, hazards, hubs, alerts, driverLocations, refreshData, client } = useAppStore();

  useEffect(() => {
    refreshData();
    // Start simulation
    client.startSimulation();

    const refreshInterval = setInterval(refreshData, 3000);
    return () => {
      clearInterval(refreshInterval);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeTrips = useMemo(() => 
    trips.filter((t) => ['en_route', 'delayed', 'at_risk', 'planned'].includes(t.status)),
    [trips]
  );

  const activeHazards = useMemo(() =>
    hazards.filter((h) => h.status !== 'resolved'),
    [hazards]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Operations Overview</h1>
          <p className="text-xs text-[var(--text-muted)]">Central Mountain District · Highland Logistics Co.</p>
        </div>
        <div className="flex items-center gap-3">
          <HazardInjector />
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-panel)] text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-forest-400)] animate-pulse" />
            <span className="text-[var(--text-secondary)]">Live</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Stats */}
        <StatsRow trips={trips} />

        {/* Map + Alert sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Map — 2/3 width */}
          <div className="lg:col-span-2">
            <MapView
              routes={routes}
              hazards={activeHazards}
              hubs={hubs}
              driverLocations={driverLocations}
              className="h-[340px] rounded-lg"
            />
          </div>
          {/* Alert feed — 1/3 width */}
          <div className="lg:col-span-1">
            <AlertFeed alerts={alerts} />
          </div>
        </div>

        {/* Trip Table */}
        <TripTable trips={activeTrips} drivers={drivers} vehicles={vehicles} />
      </div>
    </div>
  );
}

// ============================================================
// Hazard Injector — demo button
// ============================================================
function HazardInjector() {
  const { client, refreshData } = useAppStore();
  const [injecting, setInjecting] = useState(false);

  const inject = useCallback(() => {
    setInjecting(true);
    client.injectHazard({
      type: 'landslide',
      severity: 'high',
      title: 'Landslide near KM 6.5 — Mountain Pass',
      description: 'Fresh landslide debris covering outer lane. Road passable with extreme caution. Risk score recalculated for affected routes.',
      location: { type: 'Point', coordinates: [85.398, 27.675] },
      affectedRoutes: ['rte_001'],
    });
    refreshData();
    setTimeout(() => setInjecting(false), 2000);
  }, [client, refreshData]);

  return (
    <button
      onClick={inject}
      disabled={injecting}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--color-rust-600)] hover:bg-[var(--color-rust-500)] text-white transition-colors disabled:opacity-50"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M7 1v12M1 7h12" strokeLinecap="round" />
      </svg>
      {injecting ? 'Injecting...' : 'Inject Hazard'}
    </button>
  );
}
