'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';

// ============================================================
// SVG-based animated route visualization for the hero
// ============================================================

interface RoutePoint {
  x: number;
  y: number;
  elevation: number;
}

const ROUTE_A_POINTS: RoutePoint[] = [
  { x: 80, y: 320, elevation: 1900 },
  { x: 140, y: 290, elevation: 2100 },
  { x: 200, y: 240, elevation: 2600 },
  { x: 260, y: 180, elevation: 3100 },
  { x: 300, y: 150, elevation: 3420 },
  { x: 340, y: 190, elevation: 3000 },
  { x: 400, y: 260, elevation: 2400 },
  { x: 460, y: 310, elevation: 1950 },
  { x: 520, y: 330, elevation: 1850 },
];

const ROUTE_B_POINTS: RoutePoint[] = [
  { x: 80, y: 320, elevation: 1900 },
  { x: 140, y: 340, elevation: 1880 },
  { x: 220, y: 350, elevation: 1920 },
  { x: 300, y: 330, elevation: 2060 },
  { x: 380, y: 340, elevation: 2180 },
  { x: 440, y: 350, elevation: 2020 },
  { x: 520, y: 330, elevation: 1850 },
];

function pointsToPath(points: RoutePoint[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

function HeroVisualization() {
  const [riskScore, setRiskScore] = useState(35);
  const [showHazard, setShowHazard] = useState(false);
  const [activeRoute, setActiveRoute] = useState<'A' | 'B'>('A');
  const [driverPos, setDriverPos] = useState(0);
  const [phase, setPhase] = useState<'normal' | 'hazard' | 'reroute'>('normal');
  const animRef = useRef<number | null>(null);

  // Driver movement animation
  useEffect(() => {
    let t = 0;
    const animate = () => {
      t += 0.003;
      if (t > 1) t = 0;
      setDriverPos(t);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Demo loop: normal → hazard appears → risk jumps → reroute
  useEffect(() => {
    const sequence = [
      { delay: 4000, action: () => { setShowHazard(true); setPhase('hazard'); } },
      { delay: 6500, action: () => { setRiskScore(72); } },
      { delay: 9000, action: () => { setActiveRoute('B'); setRiskScore(28); setPhase('reroute'); } },
      { delay: 14000, action: () => { setShowHazard(false); setActiveRoute('A'); setRiskScore(35); setPhase('normal'); } },
    ];

    const timers = sequence.map((step) =>
      setTimeout(step.action, step.delay)
    );

    const loopTimer = setInterval(() => {
      setShowHazard(false);
      setActiveRoute('A');
      setRiskScore(35);
      setPhase('normal');

      sequence.forEach((step) => {
        setTimeout(step.action, step.delay);
      });
    }, 16000);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(loopTimer);
    };
  }, []);

  const routePoints = activeRoute === 'A' ? ROUTE_A_POINTS : ROUTE_B_POINTS;
  const currentPointIdx = Math.floor(driverPos * (routePoints.length - 1));
  const nextIdx = Math.min(currentPointIdx + 1, routePoints.length - 1);
  const localT = (driverPos * (routePoints.length - 1)) - currentPointIdx;
  const driverX = routePoints[currentPointIdx].x + (routePoints[nextIdx].x - routePoints[currentPointIdx].x) * localT;
  const driverY = routePoints[currentPointIdx].y + (routePoints[nextIdx].y - routePoints[currentPointIdx].y) * localT;

  const riskColor = riskScore > 60 ? '#cc5533' : riskScore > 35 ? '#d4820a' : '#3a8a66';

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <svg viewBox="0 0 600 420" className="w-full h-auto" role="img" aria-label="Route visualization showing risk scoring and rerouting">
        {/* Terrain contour hints */}
        <defs>
          <linearGradient id="terrainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a4230" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#1a4230" stopOpacity="0.02" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Contour lines */}
        {[200, 250, 300, 350].map((y, i) => (
          <path
            key={i}
            d={`M 40 ${y} Q 150 ${y - 20 + i * 5} 300 ${y - 10} Q 450 ${y + 10 - i * 3} 560 ${y + 5}`}
            fill="none"
            stroke="var(--color-forest-800)"
            strokeWidth="0.5"
            opacity="0.3"
          />
        ))}

        {/* Route A (mountain pass) — always visible as reference */}
        <path
          d={pointsToPath(ROUTE_A_POINTS)}
          fill="none"
          stroke={activeRoute === 'A' ? '#3a8a66' : 'var(--color-night-600)'}
          strokeWidth={activeRoute === 'A' ? 3 : 1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={activeRoute === 'A' ? 'none' : '4 4'}
          style={{ transition: 'all 0.8s ease-in-out' }}
        />

        {/* Route B (valley) — always visible as reference */}
        <path
          d={pointsToPath(ROUTE_B_POINTS)}
          fill="none"
          stroke={activeRoute === 'B' ? '#3a8a66' : 'var(--color-night-600)'}
          strokeWidth={activeRoute === 'B' ? 3 : 1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={activeRoute === 'B' ? 'none' : '4 4'}
          style={{ transition: 'all 0.8s ease-in-out' }}
        />

        {/* Origin marker */}
        <circle cx="80" cy="320" r="6" fill="var(--color-forest-500)" />
        <text x="80" y="348" textAnchor="middle" fontSize="10" fill="var(--color-sage-300)" fontFamily="var(--font-sans)">
          Origin
        </text>

        {/* Destination marker */}
        <circle cx="520" cy="330" r="6" fill="var(--color-forest-500)" />
        <text x="520" y="358" textAnchor="middle" fontSize="10" fill="var(--color-sage-300)" fontFamily="var(--font-sans)">
          Destination
        </text>

        {/* Hazard marker */}
        {showHazard && (
          <g>
            <circle cx="280" cy="170" r="18" fill="#cc5533" opacity="0.15">
              <animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0.08;0.2" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="280" cy="170" r="6" fill="#cc5533" />
            <text x="280" y="156" textAnchor="middle" fontSize="9" fill="#e07050" fontWeight="600" fontFamily="var(--font-sans)">
              Rockfall
            </text>
          </g>
        )}

        {/* Driver marker */}
        <g filter="url(#glow)">
          <circle
            cx={driverX}
            cy={driverY}
            r="5"
            fill="#4da87e"
            stroke="var(--color-night-900)"
            strokeWidth="2"
          />
        </g>

        {/* Route labels */}
        <text x="250" y="210" fontSize="9" fill="var(--color-sage-400)" fontFamily="var(--font-mono)" opacity={activeRoute === 'A' ? 1 : 0.4} style={{ transition: 'opacity 0.5s' }}>
          Route A · Mountain Pass
        </text>
        <text x="280" y="380" fontSize="9" fill="var(--color-sage-400)" fontFamily="var(--font-mono)" opacity={activeRoute === 'B' ? 1 : 0.4} style={{ transition: 'opacity 0.5s' }}>
          Route B · Valley Road
        </text>
      </svg>

      {/* Risk Score HUD overlay */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-4 py-3 min-w-[140px]">
          <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Risk Score</div>
          <div
            className="mono text-3xl font-semibold number-tween"
            style={{ color: riskColor }}
          >
            {riskScore}
          </div>
          <div className="w-full h-1.5 bg-[var(--border-default)] rounded-full mt-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${riskScore}%`,
                backgroundColor: riskColor,
              }}
            />
          </div>
        </div>

        {phase !== 'normal' && (
          <div
            className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-xs max-w-[180px]"
            style={{
              borderLeftColor: phase === 'hazard' ? '#cc5533' : '#3a8a66',
              borderLeftWidth: '3px',
            }}
          >
            {phase === 'hazard' && (
              <span className="text-[#e07050]">⚠ Hazard detected — recalculating route...</span>
            )}
            {phase === 'reroute' && (
              <span className="text-[#6ec49a]">✓ Rerouted via Valley Road — risk reduced</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Landing Page
// ============================================================

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="flex-shrink-0">
            <path d="M14 3L3 25h22L14 3z" fill="var(--color-forest-700)" />
            <path d="M14 9L7 25h14L14 9z" fill="var(--color-forest-500)" />
            <path d="M14 15L10 25h8L14 15z" fill="var(--color-forest-300)" opacity="0.7" />
          </svg>
          <span className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
            MountainRoute
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Ops Dashboard
          </Link>
          <Link
            href="/driver"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Driver App
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)] mb-4 leading-[1.15]">
            Can this vehicle safely make
            <br />
            <span className="text-[var(--color-forest-400)]">this route, right now?</span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
            Terrain-aware logistics for mountain regions. Real-time risk scoring,
            hazard detection, and route optimization — works offline.
          </p>
        </div>

        {/* Live visualization */}
        {mounted && <HeroVisualization />}

        {/* Role picker */}
        <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/dashboard"
            className="group flex items-center gap-3 bg-[var(--color-forest-800)] hover:bg-[var(--color-forest-700)] text-white px-6 py-3.5 rounded-lg transition-colors w-full sm:w-auto"
          >
            <div className="flex-shrink-0 w-9 h-9 rounded bg-[var(--color-forest-600)] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="2" y="2" width="5" height="5" rx="1" />
                <rect x="11" y="2" width="5" height="5" rx="1" />
                <rect x="2" y="11" width="5" height="5" rx="1" />
                <rect x="11" y="11" width="5" height="5" rx="1" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold">Ops Dashboard</div>
              <div className="text-xs text-[var(--color-sage-300)] opacity-70">Manage shipments, routes, and fleet</div>
            </div>
          </Link>

          <Link
            href="/driver"
            className="group flex items-center gap-3 bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--color-forest-600)] text-[var(--text-primary)] px-6 py-3.5 rounded-lg transition-colors w-full sm:w-auto"
          >
            <div className="flex-shrink-0 w-9 h-9 rounded bg-[var(--bg-panel)] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="9" cy="6" r="3" />
                <path d="M3 16c0-3 2.7-5 6-5s6 2 6 5" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold">Driver App</div>
              <div className="text-xs text-[var(--text-muted)]">Active trip, navigation, reports</div>
            </div>
          </Link>
        </div>

        {/* Capabilities */}
        <div className="mt-20 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <div className="mono text-2xl font-semibold text-[var(--color-forest-400)] mb-1">0–100</div>
            <div className="text-sm text-[var(--text-secondary)]">
              Route risk scores factor terrain, weather, hazards, and history
            </div>
          </div>
          <div>
            <div className="mono text-2xl font-semibold text-[var(--color-amber-400)] mb-1">Real-time</div>
            <div className="text-sm text-[var(--text-secondary)]">
              Hazard detection triggers instant rerouting and driver alerts
            </div>
          </div>
          <div>
            <div className="mono text-2xl font-semibold text-[var(--color-info-400)] mb-1">Offline</div>
            <div className="text-sm text-[var(--text-secondary)]">
              Full operation with no connectivity — queues sync when back online
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)]">
        MountainRoute · Frontend Demo · No real backend connected
      </footer>
    </div>
  );
}
