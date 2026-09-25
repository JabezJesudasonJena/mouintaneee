'use client';

import type { ElevationPoint } from '@/lib/data/types';

interface ElevationProfileProps {
  data: ElevationPoint[];
  className?: string;
  height?: number;
  showLabels?: boolean;
  driverProgress?: number; // 0-100
}

export default function ElevationProfile({
  data,
  className = '',
  height = 120,
  showLabels = true,
  driverProgress,
}: ElevationProfileProps) {
  if (data.length < 2) return null;

  const width = 600;
  const pad = { top: 20, right: 20, bottom: 30, left: 45 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const maxDist = Math.max(...data.map((d) => d.distanceKm));
  const minElev = Math.min(...data.map((d) => d.elevation)) - 50;
  const maxElev = Math.max(...data.map((d) => d.elevation)) + 50;

  const toX = (dist: number) => pad.left + (dist / maxDist) * innerW;
  const toY = (elev: number) => pad.top + innerH - ((elev - minElev) / (maxElev - minElev)) * innerH;

  const linePath = data
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.distanceKm)} ${toY(p.elevation)}`)
    .join(' ');

  const areaPath = linePath + ` L ${toX(data[data.length - 1].distanceKm)} ${pad.top + innerH} L ${toX(data[0].distanceKm)} ${pad.top + innerH} Z`;

  // Terrain type colors
  const terrainColors: Record<string, string> = {
    paved: 'var(--color-forest-700)',
    gravel: 'var(--color-amber-500)',
    mountain_pass: 'var(--color-rust-500)',
    bridge: 'var(--color-info-500)',
    dirt: 'var(--color-stone-400)',
    tunnel: 'var(--color-night-600)',
  };

  // Driver position on the profile
  let driverPoint: { x: number; y: number } | null = null;
  if (driverProgress !== undefined && driverProgress >= 0) {
    const progressDist = (driverProgress / 100) * maxDist;
    // Interpolate elevation
    let elev = data[0].elevation;
    for (let i = 0; i < data.length - 1; i++) {
      if (progressDist >= data[i].distanceKm && progressDist <= data[i + 1].distanceKm) {
        const t = (progressDist - data[i].distanceKm) / (data[i + 1].distanceKm - data[i].distanceKm);
        elev = data[i].elevation + (data[i + 1].elevation - data[i].elevation) * t;
        break;
      }
    }
    driverPoint = { x: toX(progressDist), y: toY(elev) };
  }

  return (
    <div className={`${className}`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="elevGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-forest-600)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-forest-600)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Y-axis gridlines */}
        {Array.from({ length: 5 }, (_, i) => {
          const elev = minElev + ((maxElev - minElev) * i) / 4;
          const y = toY(elev);
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="var(--color-night-700)" strokeWidth="0.5" />
              {showLabels && (
                <text x={pad.left - 5} y={y + 3} fontSize="9" fill="var(--color-sage-400)" textAnchor="end" fontFamily="var(--font-mono)">
                  {Math.round(elev)}m
                </text>
              )}
            </g>
          );
        })}

        {/* Terrain type color bands on the bottom */}
        {data.map((p, i) => {
          if (i >= data.length - 1) return null;
          const next = data[i + 1];
          const x1 = toX(p.distanceKm);
          const x2 = toX(next.distanceKm);
          const color = terrainColors[p.terrainType] || 'var(--color-night-600)';
          return (
            <rect
              key={i}
              x={x1}
              y={pad.top + innerH}
              width={x2 - x1}
              height={4}
              fill={color}
              opacity="0.6"
            />
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#elevGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="var(--color-forest-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points with grade markers */}
        {data.filter((_, i) => i % 2 === 0).map((p, i) => {
          const x = toX(p.distanceKm);
          const y = toY(p.elevation);
          const gradeColor = Math.abs(p.grade) > 12 ? 'var(--color-rust-400)' : Math.abs(p.grade) > 6 ? 'var(--color-amber-400)' : 'var(--color-sage-400)';
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="2" fill="var(--color-forest-400)" />
              {showLabels && Math.abs(p.grade) > 5 && (
                <text x={x} y={y - 8} fontSize="8" fill={gradeColor} textAnchor="middle" fontFamily="var(--font-mono)">
                  {p.grade > 0 ? '+' : ''}{p.grade}%
                </text>
              )}
            </g>
          );
        })}

        {/* Driver position */}
        {driverPoint && (
          <g>
            <line x1={driverPoint.x} y1={pad.top} x2={driverPoint.x} y2={pad.top + innerH} stroke="var(--color-forest-400)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
            <circle cx={driverPoint.x} cy={driverPoint.y} r="4" fill="var(--color-forest-400)" stroke="var(--color-night-950)" strokeWidth="2" />
          </g>
        )}

        {/* X-axis labels */}
        {showLabels && (
          <>
            <text x={pad.left} y={height - 5} fontSize="9" fill="var(--color-sage-400)" fontFamily="var(--font-mono)">
              0 km
            </text>
            <text x={width - pad.right} y={height - 5} fontSize="9" fill="var(--color-sage-400)" textAnchor="end" fontFamily="var(--font-mono)">
              {maxDist.toFixed(1)} km
            </text>
          </>
        )}
      </svg>

      {/* Terrain legend */}
      {showLabels && (
        <div className="flex flex-wrap gap-3 mt-1 px-1">
          {Object.entries(terrainColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-[9px] text-[var(--text-muted)] capitalize">{type.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
