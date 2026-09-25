'use client';

import { useEffect, useMemo, use } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/app-store';
import MapView from '@/components/map/MapView';
import RiskScoreGauge from '@/components/ui/RiskScoreGauge';
import ElevationProfile from '@/components/ui/ElevationProfile';
import { SEED_DATA } from '@/lib/data/seed';
import type { Route, TripEvent } from '@/lib/data/types';

// ============================================================
// Route Comparison Card
// ============================================================
function RouteComparison({ routes, activeRouteId }: { routes: Route[]; activeRouteId: string }) {
  if (routes.length < 2) return null;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-default)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Route Comparison</h3>
      </div>
      <div className="grid grid-cols-2 divide-x divide-[var(--border-default)]">
        {routes.map((route) => {
          const isActive = route.id === activeRouteId;
          const riskColor = route.riskScore > 60 ? 'var(--color-rust-500)' : route.riskScore > 35 ? 'var(--color-amber-500)' : 'var(--color-forest-500)';

          return (
            <div
              key={route.id}
              className={`p-4 ${isActive ? 'bg-[var(--bg-panel)]' : ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--text-primary)]">{route.name}</div>
                  {isActive && (
                    <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-forest-800)] text-[var(--color-forest-300)]">
                      Active
                    </span>
                  )}
                  {route.isRecommended && !isActive && (
                    <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-info-500)] text-white">
                      Recommended
                    </span>
                  )}
                </div>
                <RiskScoreGauge score={route.riskScore} size="sm" />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Distance</span>
                  <span className="mono text-[var(--text-primary)]">{route.totalDistanceKm} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Est. Time</span>
                  <span className="mono text-[var(--text-primary)]">{route.estimatedMinutes} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Elevation Gain</span>
                  <span className="mono text-[var(--text-primary)]">+{route.totalElevationGain}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Max Elevation</span>
                  <span className="mono text-[var(--text-primary)]">{route.maxElevation}m</span>
                </div>
              </div>

              {route.comparisonNotes && route.comparisonNotes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
                  <div className="text-[10px] text-[var(--text-muted)] mb-1.5">Notes</div>
                  <ul className="space-y-1">
                    {route.comparisonNotes.map((note, i) => {
                      const isPositive = note.startsWith('+') || note.includes('safe') || note.includes('coverage') || note.includes('Fuel');
                      const isNegative = note.startsWith('-') || note.includes('rockfall') || note.includes('narrow') || note.includes('No cell') || note.includes('Limited');
                      return (
                        <li
                          key={i}
                          className="text-[11px] flex items-start gap-1"
                          style={{
                            color: isNegative ? 'var(--color-rust-400)' : isPositive ? 'var(--color-forest-400)' : 'var(--text-secondary)',
                          }}
                        >
                          <span className="flex-shrink-0 mt-0.5">
                            {isNegative ? '−' : isPositive ? '+' : '·'}
                          </span>
                          {note}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Trip Timeline
// ============================================================
function TripTimeline({ events }: { events: TripEvent[] }) {
  const sorted = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const typeConfig: Record<string, { color: string; icon: string }> = {
    departed: { color: 'var(--color-forest-500)', icon: '▶' },
    checkpoint: { color: 'var(--color-sage-400)', icon: '◆' },
    hazard_detected: { color: 'var(--color-rust-500)', icon: '⚠' },
    route_changed: { color: 'var(--color-info-400)', icon: '↻' },
    delay: { color: 'var(--color-amber-500)', icon: '⏱' },
    incident: { color: 'var(--color-rust-400)', icon: '!' },
    arrived: { color: 'var(--color-forest-400)', icon: '✓' },
    alert: { color: 'var(--color-amber-400)', icon: '●' },
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-default)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Trip Timeline</h3>
      </div>
      <div className="p-4">
        <div className="space-y-0">
          {sorted.map((event, idx) => {
            const config = typeConfig[event.type] || { color: 'var(--text-muted)', icon: '·' };
            const time = new Date(event.timestamp);

            return (
              <div key={event.id} className="flex gap-3">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0"
                    style={{ backgroundColor: `color-mix(in srgb, ${config.color} 15%, transparent)`, color: config.color }}
                  >
                    {config.icon}
                  </div>
                  {idx < sorted.length - 1 && (
                    <div className="w-px flex-1 min-h-[16px] bg-[var(--border-default)]" />
                  )}
                </div>
                {/* Content */}
                <div className="pb-4 min-w-0">
                  <p className="text-xs text-[var(--text-primary)]">{event.description}</p>
                  <span className="mono text-[10px] text-[var(--text-muted)]">
                    {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Trip Detail Page
// ============================================================
export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { trips, drivers, vehicles, routes, hazards, hubs, driverLocations, refreshData, client } = useAppStore();

  useEffect(() => {
    refreshData();
    client.startSimulation();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const trip = useMemo(() => trips.find((t) => t.id === id), [trips, id]);
  const driver = useMemo(() => trip ? drivers.find((d) => d.id === trip.driverId) : null, [trip, drivers]);
  const vehicle = useMemo(() => trip ? vehicles.find((v) => v.id === trip.vehicleId) : null, [trip, vehicles]);
  const tripRoutes = useMemo(() => {
    if (!trip) return [];
    const ids = [trip.routeId, trip.alternateRouteId].filter(Boolean);
    return routes.filter((r) => ids.includes(r.id));
  }, [trip, routes]);

  const activeRoute = useMemo(() => routes.find((r) => r.id === trip?.routeId), [routes, trip]);

  // Get elevation data
  const elevationData = useMemo(() => {
    if (!activeRoute) return [];
    const profiles = SEED_DATA.elevationProfiles as Record<string, typeof SEED_DATA.elevationProfiles[keyof typeof SEED_DATA.elevationProfiles]>;
    return profiles[activeRoute.id] || [];
  }, [activeRoute]);

  if (!trip) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm text-[var(--text-muted)]">Trip not found</p>
          <Link href="/dashboard" className="text-sm text-[var(--color-forest-400)] hover:underline mt-2 inline-block">
            Back to overview
          </Link>
        </div>
      </div>
    );
  }

  const riskColor = trip.riskScore > 60 ? 'var(--color-rust-500)' : trip.riskScore > 35 ? 'var(--color-amber-500)' : 'var(--color-forest-500)';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-3 border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
          <Link href="/dashboard" className="hover:text-[var(--text-secondary)]">Overview</Link>
          <span>/</span>
          <span className="text-[var(--text-primary)]">{trip.id.replace('trp_', 'TRP-').toUpperCase()}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              {trip.origin.name} → {trip.destination.name}
            </h1>
            <div className="flex items-center gap-4 mt-1 text-xs text-[var(--text-secondary)]">
              <span>Driver: {driver?.name || 'Unknown'}</span>
              <span>Vehicle: {vehicle?.name || 'Unknown'}</span>
              <span className="mono">ETA: {new Date(trip.eta).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
          <RiskScoreGauge
            score={trip.riskScore}
            size="md"
            breakdown={activeRoute?.riskBreakdown}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Map with route */}
        <MapView
          routes={tripRoutes}
          hazards={hazards.filter((h) => h.status !== 'resolved')}
          hubs={hubs}
          driverLocations={driverLocations.filter((dl) => dl.tripId === trip.id)}
          highlightedRouteId={trip.routeId}
          className="h-[280px] rounded-lg"
        />

        {/* Elevation Profile */}
        {elevationData.length > 0 && (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Elevation Profile</h3>
            <ElevationProfile data={elevationData} driverProgress={trip.currentProgress} />
          </div>
        )}

        {/* Route Comparison + Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RouteComparison routes={tripRoutes} activeRouteId={trip.routeId} />
          <TripTimeline events={trip.events} />
        </div>

        {/* Progress bar */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Trip Progress</h3>
            <span className="mono text-sm" style={{ color: riskColor }}>{Math.round(trip.currentProgress)}%</span>
          </div>
          <div className="w-full h-2 bg-[var(--border-default)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${trip.currentProgress}%`, backgroundColor: riskColor }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-[var(--text-muted)]">
            <span>{trip.origin.name}</span>
            <span>{trip.destination.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
