'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { Route, HazardEvent, Hub, DriverLocation, GeoPoint } from '@/lib/data/types';

import dynamic from 'next/dynamic';

const MapLibreMap = dynamic(() => import('./MapLibreMap'), { ssr: false });


interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  routes?: Route[];
  hazards?: HazardEvent[];
  hubs?: Hub[];
  driverLocations?: DriverLocation[];
  highlightedRouteId?: string;
  className?: string;
  onMapReady?: (map: unknown) => void;
  interactive?: boolean;
  showControls?: boolean;
  demoMode?: boolean;
}



// Simple SVG-based map as fallback / lightweight option
function SVGMapFallback({
  routes = [],
  hazards = [],
  hubs = [],
  driverLocations = [],
  highlightedRouteId,
  className = '',
}: MapViewProps) {
  // Transform geo coordinates to SVG space
  const allCoords: [number, number][] = [];
  routes.forEach((r) => allCoords.push(...r.geometry.coordinates));
  hubs.forEach((h) => allCoords.push(h.location.coordinates));
  hazards.forEach((h) => allCoords.push(h.location.coordinates));
  driverLocations.forEach((d) => allCoords.push(d.location.coordinates));

  if (allCoords.length === 0) {
    allCoords.push([85.400, 27.670]);
  }

  const lngs = allCoords.map((c) => c[0]);
  const lats = allCoords.map((c) => c[1]);
  const minLng = Math.min(...lngs) - 0.01;
  const maxLng = Math.max(...lngs) + 0.01;
  const minLat = Math.min(...lats) - 0.01;
  const maxLat = Math.max(...lats) + 0.01;

  const width = 800;
  const height = 500;
  const pad = 40;

  const toX = (lng: number) => pad + ((lng - minLng) / (maxLng - minLng)) * (width - 2 * pad);
  const toY = (lat: number) => height - pad - ((lat - minLat) / (maxLat - minLat)) * (height - 2 * pad);

  const hubIcons: Record<string, string> = {
    village: '🏘',
    collection_center: '📦',
    market: '🏪',
    fuel_station: '⛽',
    service_point: '🔧',
    distribution_hub: '🏭',
  };

  return (
    <div className={`relative bg-[var(--color-night-950)] rounded-lg overflow-hidden ${className}`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines for terrain feel */}
        {Array.from({ length: 20 }, (_, i) => (
          <line
            key={`gx-${i}`}
            x1={pad + (i * (width - 2 * pad)) / 19}
            y1={pad}
            x2={pad + (i * (width - 2 * pad)) / 19}
            y2={height - pad}
            stroke="var(--color-night-800)"
            strokeWidth="0.5"
          />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <line
            key={`gy-${i}`}
            x1={pad}
            y1={pad + (i * (height - 2 * pad)) / 11}
            x2={width - pad}
            y2={pad + (i * (height - 2 * pad)) / 11}
            stroke="var(--color-night-800)"
            strokeWidth="0.5"
          />
        ))}

        {/* Routes */}
        {routes.map((route) => {
          const isHighlighted = !highlightedRouteId || route.id === highlightedRouteId;
          const pathD = route.geometry.coordinates
            .map((c, i) => `${i === 0 ? 'M' : 'L'} ${toX(c[0])} ${toY(c[1])}`)
            .join(' ');

          const riskColor = route.riskScore > 60
            ? 'var(--color-rust-500)'
            : route.riskScore > 35
            ? 'var(--color-amber-500)'
            : 'var(--color-forest-500)';

          return (
            <g key={route.id}>
              {/* Shadow */}
              <path
                d={pathD}
                fill="none"
                stroke={riskColor}
                strokeWidth={isHighlighted ? 6 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isHighlighted ? 0.2 : 0.05}
              />
              {/* Main line */}
              <path
                d={pathD}
                fill="none"
                stroke={riskColor}
                strokeWidth={isHighlighted ? 3 : 1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isHighlighted ? 1 : 0.4}
                strokeDasharray={isHighlighted ? 'none' : '4 4'}
              />
              {/* Route label */}
              {isHighlighted && route.geometry.coordinates.length > 2 && (
                <text
                  x={toX(route.geometry.coordinates[Math.floor(route.geometry.coordinates.length / 2)][0])}
                  y={toY(route.geometry.coordinates[Math.floor(route.geometry.coordinates.length / 2)][1]) - 10}
                  fontSize="10"
                  fill="var(--color-sage-300)"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                >
                  {route.name} · {route.riskScore}
                </text>
              )}
            </g>
          );
        })}

        {/* Hazards */}
        {hazards.map((hazard) => {
          const cx = toX(hazard.location.coordinates[0]);
          const cy = toY(hazard.location.coordinates[1]);
          const color = hazard.severity === 'critical' ? 'var(--color-rust-500)' : 'var(--color-amber-500)';

          return (
            <g key={hazard.id}>
              <circle cx={cx} cy={cy} r="16" fill={color} opacity="0.12">
                <animate attributeName="r" values="12;20;12" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx={cx} cy={cy} r="5" fill={color} />
              <text x={cx} y={cy - 12} fontSize="9" fill={color} textAnchor="middle" fontWeight="600" fontFamily="var(--font-sans)">
                {hazard.type.replace('_', ' ')}
              </text>
            </g>
          );
        })}

        {/* Hubs */}
        {hubs.map((hub) => {
          const cx = toX(hub.location.coordinates[0]);
          const cy = toY(hub.location.coordinates[1]);
          return (
            <g key={hub.id}>
              <circle cx={cx} cy={cy} r="4" fill="var(--color-forest-600)" stroke="var(--color-night-900)" strokeWidth="1.5" />
              <text x={cx} y={cy + 16} fontSize="9" fill="var(--color-sage-400)" textAnchor="middle" fontFamily="var(--font-sans)">
                {hub.name}
              </text>
            </g>
          );
        })}

        {/* Driver locations */}
        {driverLocations.map((dl) => {
          const cx = toX(dl.location.coordinates[0]);
          const cy = toY(dl.location.coordinates[1]);
          return (
            <g key={dl.driverId}>
              {/* Glow */}
              <circle cx={cx} cy={cy} r="10" fill="var(--color-forest-400)" opacity="0.15" />
              {/* Marker */}
              <circle cx={cx} cy={cy} r="5" fill="var(--color-forest-400)" stroke="var(--color-night-950)" strokeWidth="2" />
              {/* Speed label */}
              <text x={cx + 10} y={cy + 3} fontSize="8" fill="var(--color-sage-300)" fontFamily="var(--font-mono)">
                {Math.round(dl.speed)}km/h
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function MapView(props: MapViewProps) {
  if (props.demoMode) {
    return <MapLibreMap {...props} />;
  }
  // Use SVG-based map as fallback for dashboard/driver
  return <SVGMapFallback {...props} />;
}
