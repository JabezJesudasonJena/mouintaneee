'use client';

import { useEffect, useMemo } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import MapView from '@/components/map/MapView';
import RiskScoreGauge from '@/components/ui/RiskScoreGauge';

export default function DriverActiveTripPage() {
  const { currentUser, trips, drivers, vehicles, routes, hazards, hubs, driverLocations, refreshData, client } = useAppStore();

  useEffect(() => {
    refreshData();
    client.startSimulation();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Find this driver's active trip
  const driver = useMemo(() => {
    if (!currentUser) return null;
    return drivers.find((d) => d.userId === currentUser.id) || drivers[0];
  }, [currentUser, drivers]);

  const activeTrip = useMemo(() => {
    if (!driver) return null;
    return trips.find((t) => t.driverId === driver.id && ['en_route', 'delayed', 'at_risk', 'planned'].includes(t.status));
  }, [driver, trips]);

  const tripRoute = useMemo(() => {
    if (!activeTrip) return null;
    return routes.find((r) => r.id === activeTrip.routeId);
  }, [activeTrip, routes]);

  const activeHazards = useMemo(() =>
    hazards.filter((h) => h.status !== 'resolved'),
    [hazards]
  );

  const driverLoc = useMemo(() =>
    driverLocations.filter((dl) => dl.driverId === driver?.id),
    [driverLocations, driver]
  );

  if (!activeTrip || !tripRoute) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--bg-panel)] flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--color-sage-400)" strokeWidth="1.5">
            <circle cx="14" cy="14" r="10" />
            <path d="M14 9v6M14 19v.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">No active trip assigned</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Waiting for dispatch...</p>
      </div>
    );
  }

  const riskColor = activeTrip.riskScore > 60 ? 'var(--color-rust-500)' : activeTrip.riskScore > 35 ? 'var(--color-amber-500)' : 'var(--color-forest-500)';
  const etaTime = new Date(activeTrip.eta).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  // High-risk alert banner
  const showRiskBanner = activeTrip.riskLevel === 'high' || activeTrip.riskLevel === 'critical';

  return (
    <div className="flex flex-col h-full">
      {/* Risk alert banner */}
      {showRiskBanner && (
        <div
          className="px-4 py-3 flex items-center gap-3"
          style={{
            backgroundColor: activeTrip.riskLevel === 'critical' ? 'rgba(204,85,51,0.15)' : 'rgba(212,130,10,0.12)',
            borderBottom: `2px solid ${activeTrip.riskLevel === 'critical' ? 'var(--color-rust-500)' : 'var(--color-amber-500)'}`,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
            <path d="M10 2L1 18h18L10 2z" fill={activeTrip.riskLevel === 'critical' ? 'var(--color-rust-500)' : 'var(--color-amber-500)'} />
            <path d="M10 8v4M10 15v.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: activeTrip.riskLevel === 'critical' ? 'var(--color-rust-400)' : 'var(--color-amber-400)' }}>
              {activeTrip.riskLevel === 'critical' ? 'Critical Risk' : 'High Risk'} — Proceed with caution
            </p>
            <p className="text-xs text-[var(--text-muted)] truncate">
              {activeTrip.events[activeTrip.events.length - 1]?.description || 'Check route conditions'}
            </p>
          </div>
        </div>
      )}

      {/* Map — hero */}
      <div className="flex-1 relative min-h-[250px]">
        <MapView
          routes={tripRoute ? [tripRoute] : []}
          hazards={activeHazards}
          hubs={hubs}
          driverLocations={driverLoc}
          highlightedRouteId={activeTrip.routeId}
          className="h-full"
        />
      </div>

      {/* Bottom sheet — trip info */}
      <div className="bg-[var(--bg-surface)] border-t border-[var(--border-default)] rounded-t-2xl -mt-4 relative z-10">
        {/* Drag handle */}
        <div className="flex justify-center py-2">
          <div className="w-8 h-1 rounded-full bg-[var(--border-default)]" />
        </div>

        <div className="px-4 pb-4">
          {/* Destination + ETA */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-[11px] text-[var(--text-muted)]">Heading to</div>
              <div className="text-lg font-semibold text-[var(--text-primary)]">{activeTrip.destination.name}</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                From {activeTrip.origin.name}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-[var(--text-muted)]">ETA</div>
              <div className="mono text-2xl font-semibold text-[var(--text-primary)]">{etaTime}</div>
            </div>
          </div>

          {/* Progress + Risk */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-[var(--text-muted)]">Progress</span>
                <span className="mono text-xs" style={{ color: riskColor }}>{Math.round(activeTrip.currentProgress)}%</span>
              </div>
              <div className="w-full h-2.5 bg-[var(--border-default)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${activeTrip.currentProgress}%`, backgroundColor: riskColor }}
                />
              </div>
            </div>
            <RiskScoreGauge score={activeTrip.riskScore} size="sm" />
          </div>

          {/* Route stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[var(--bg-panel)] rounded-lg px-3 py-2.5 text-center">
              <div className="mono text-base font-semibold text-[var(--text-primary)]">
                {tripRoute.totalDistanceKm}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">km total</div>
            </div>
            <div className="bg-[var(--bg-panel)] rounded-lg px-3 py-2.5 text-center">
              <div className="mono text-base font-semibold text-[var(--text-primary)]">
                +{tripRoute.totalElevationGain}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">m elevation</div>
            </div>
            <div className="bg-[var(--bg-panel)] rounded-lg px-3 py-2.5 text-center">
              <div className="mono text-base font-semibold text-[var(--text-primary)]">
                {tripRoute.estimatedMinutes}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">min est.</div>
            </div>
          </div>

          {/* Latest event */}
          {activeTrip.events.length > 0 && (
            <div className="mt-3 bg-[var(--bg-panel)] rounded-lg px-3 py-2.5">
              <div className="text-[10px] text-[var(--text-muted)] mb-0.5">Latest Update</div>
              <p className="text-xs text-[var(--text-primary)]">
                {activeTrip.events[activeTrip.events.length - 1].description}
              </p>
              <span className="mono text-[10px] text-[var(--text-muted)]">
                {new Date(activeTrip.events[activeTrip.events.length - 1].timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
