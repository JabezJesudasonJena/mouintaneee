import type { Route } from '@/lib/data/types';
import RiskScoreGauge from './RiskScoreGauge';

export function RouteComparison({ routes, activeRouteId }: { routes: Route[]; activeRouteId: string }) {
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
