'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { SCENARIOS } from '@/lib/demo/scenarios';
import { SimulationEngine, type DemoState } from '@/lib/demo/simulation-engine';
import MapView from '@/components/map/MapView';
import { AlertFeed } from '@/components/ui/AlertFeed';
import { RouteComparison } from '@/components/ui/RouteComparison';

export default function DemoPage() {
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [engine, setEngine] = useState<SimulationEngine | null>(null);
  const [demoState, setDemoState] = useState<DemoState | null>(null);
  const [speed, setSpeed] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const scenario = useMemo(() => SCENARIOS.find((s) => s.id === activeScenarioId), [activeScenarioId]);

  // Handle engine instantiation
  useEffect(() => {
    if (!scenario) return;

    // Default prefers-reduced-motion check
    const prefersReducedMotion = typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

    const newEngine = new SimulationEngine(
      scenario,
      (state) => {
        setDemoState({ ...state });
      },
      prefersReducedMotion
    );

    newEngine.setSpeed(speed);
    setEngine(newEngine);
    setDemoState(newEngine.getState());
    setProgress(0);
    setIsRunning(false);

    return () => {
      newEngine.pause();
    };
  }, [scenario]); // Do not re-init on speed change

  // Sync state from engine for UI controls
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (engine) {
      interval = setInterval(() => {
        setIsRunning(engine.getIsRunning());
        setProgress(engine.getProgress());
      }, 100);
    }
    return () => clearInterval(interval);
  }, [engine]);

  const handlePlayPause = () => {
    if (!engine) return;
    if (engine.getIsRunning()) {
      engine.pause();
    } else {
      engine.start();
    }
  };

  const handleRestart = () => {
    if (!engine) return;
    engine.reset();
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (engine) {
      engine.setSpeed(newSpeed);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">MountainRoute Demo</h1>
            <p className="text-xs text-[var(--text-muted)]">Interactive Simulation</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-md text-sm font-medium bg-[var(--bg-panel)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Skip to Dashboard
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Scenario Picker */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SCENARIOS.map((s) => {
            const isActive = activeScenarioId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveScenarioId(s.id)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'border-[var(--color-forest-500)] bg-[var(--color-forest-800)] text-[var(--color-forest-100)]'
                    : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--color-forest-600)]'
                }`}
              >
                <div className="text-sm font-semibold mb-1" style={{ color: isActive ? 'var(--color-forest-300)' : 'var(--text-primary)' }}>
                  {s.name}
                </div>
                <div className="text-xs" style={{ color: isActive ? 'var(--color-forest-100)' : 'var(--text-muted)' }}>
                  {s.description}
                </div>
              </button>
            );
          })}
        </div>

        {!scenario && (
          <div className="flex-1 flex items-center justify-center min-h-[400px] border border-dashed border-[var(--border-default)] rounded-xl">
            <p className="text-[var(--text-muted)]">Select a scenario above to start the demo.</p>
          </div>
        )}

        {scenario && demoState && engine && (
          <div className="space-y-4">
            
            {/* Playback Controls */}
            <div className="flex items-center justify-between bg-[var(--bg-surface)] border border-[var(--border-default)] p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayPause}
                  disabled={demoState.isComplete}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-forest-700)] hover:bg-[var(--color-forest-600)] text-white transition-colors disabled:opacity-50"
                >
                  {isRunning ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                  )}
                </button>
                <button
                  onClick={handleRestart}
                  className="px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Restart
                </button>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-xs text-[var(--text-muted)] mr-2">Speed:</span>
                {[1, 2, 4].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => handleSpeedChange(spd)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      speed === spd
                        ? 'bg-[var(--bg-panel)] text-[var(--text-primary)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Narrative Captions */}
            <div className="bg-[rgba(77,168,126,0.1)] border-l-4 border-[var(--color-forest-500)] p-4 rounded-r-lg">
              <p className="text-sm md:text-base font-medium text-[var(--color-forest-100)]">
                {demoState.narrative}
              </p>
            </div>

            {/* Main Visuals Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Map Column */}
              <div className="lg:col-span-2 space-y-4">
                <div className="relative">
                  <MapView
                    routes={demoState.routes}
                    hazards={demoState.hazards}
                    driverLocations={demoState.driverLocations}
                    highlightedRouteId={demoState.activeRouteId}
                    className="h-[400px] rounded-xl border border-[var(--border-default)]"
                    demoMode={true}
                  />
                  
                  {/* Slim Progress Overlay on Map */}
                  <div className="absolute bottom-4 left-4 right-4 bg-[var(--bg-surface)]/90 backdrop-blur border border-[var(--border-default)] rounded-full p-2 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-[var(--border-default)] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[var(--color-forest-500)] transition-all duration-300 ease-linear"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Optional: Summary Panel at End */}
                {demoState.isComplete && (
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Simulation Complete</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-[rgba(204,85,51,0.1)] border border-[rgba(204,85,51,0.2)]">
                        <div className="text-xs font-semibold text-[var(--color-rust-400)] mb-3 uppercase tracking-wider">Without MountainRoute</div>
                        <div className="space-y-3">
                          <div>
                            <div className="text-[10px] text-[var(--text-muted)]">Delay</div>
                            <div className="text-sm font-medium">{scenario.summary.without.delay}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-[var(--text-muted)]">Risk</div>
                            <div className="text-sm font-medium">{scenario.summary.without.risk}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-[var(--text-muted)]">Deadline</div>
                            <div className="text-sm font-medium">{scenario.summary.without.deadline}</div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-[rgba(77,168,126,0.1)] border border-[rgba(77,168,126,0.2)]">
                        <div className="text-xs font-semibold text-[var(--color-forest-400)] mb-3 uppercase tracking-wider">With MountainRoute</div>
                        <div className="space-y-3">
                          <div>
                            <div className="text-[10px] text-[var(--text-muted)]">Delay</div>
                            <div className="text-sm font-medium">{scenario.summary.with.delay}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-[var(--text-muted)]">Risk</div>
                            <div className="text-sm font-medium">{scenario.summary.with.risk}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-[var(--text-muted)]">Deadline</div>
                            <div className="text-sm font-medium">{scenario.summary.with.deadline}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        onClick={handleRestart}
                        className="px-4 py-2 rounded-md text-sm font-medium bg-[var(--bg-panel)] text-[var(--text-primary)] transition-colors"
                      >
                        Run Again
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Column */}
              <div className="space-y-4">
                {demoState.alerts.length > 0 && (
                  <div className="animate-in fade-in slide-in-from-right-4">
                    <AlertFeed alerts={demoState.alerts} />
                  </div>
                )}
                
                {demoState.routes.length > 1 && (
                  <div className="animate-in fade-in slide-in-from-right-4 delay-100">
                    <RouteComparison routes={demoState.routes} activeRouteId={demoState.activeRouteId} />
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
