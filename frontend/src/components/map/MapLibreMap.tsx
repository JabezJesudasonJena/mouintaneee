'use client';

import { useEffect, useRef, useState } from 'react';
// import maplibregl from 'maplibre-gl';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_STYLES } from './mapStyles';

maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  routes?: any[];
  hazards?: any[];
  driverLocations?: any[];
  highlightedRouteId?: string;
  className?: string;
}

export default function MapLibreMap({
  routes = [],
  hazards = [],
  driverLocations = [],
  highlightedRouteId,
  className = '',
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentStyle, setCurrentStyle] = useState<'satellite' | 'terrain' | 'streets'>('satellite');

  useEffect(() => {
    if (!mapContainer.current) return;
    let mounted = true;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLES['satellite'],
      center: [77.18, 31.12], // Shimla-Kinnaur area
      zoom: 10,
      pitch: 0,
    });

    mapRef.current = map;

    map.on('load', () => {
      if (!mounted) return;
      setMapLoaded(true);

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        // Fly-in cinematic moment
        setCurrentStyle('terrain');
        map.setStyle(MAP_STYLES['terrain']);

        setTimeout(() => {
          if (!mounted) return;
          map.easeTo({
            pitch: 65,
            bearing: 45,
            zoom: 12,
            duration: 3000,
            easing: (t: number) => t * (2 - t),
          });

          // After fly-in, revert to satellite (plus hillshade if desired, but we'll just revert to satellite)
          // The user requested: "treat the full setTerrain 3D tilt as an enhancement for the "fly-in" moment specifically, not a permanent state"
          setTimeout(() => {
            if (!mounted) return;
            map.setTerrain(null); // Remove 3D exaggeration
            setCurrentStyle('satellite');
            map.setStyle(MAP_STYLES['satellite']);
            // Keep the pitch and bearing, just remove the terrain extrusion to avoid visual fighting
          }, 3500);

        }, 500);
      }
    });

    return () => {
      mounted = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle style switching manually
  const handleStyleChange = (styleId: 'satellite' | 'terrain' | 'streets') => {
    setCurrentStyle(styleId);
    if (mapRef.current) {
      if (styleId !== 'terrain') {
        mapRef.current.setTerrain(null);
      }
      mapRef.current.setStyle(MAP_STYLES[styleId]);
    }
  };

  // Handle drawing routes & drivers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Draw Routes
    const sourceId = 'routes-source';
    const features: any[] = routes.map((r) => ({
      type: 'Feature',
      properties: {
        id: r.id,
        isHighlighted: r.id === highlightedRouteId,
        riskScore: r.riskScore,
      },
      geometry: r.geometry,
    }));

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features });
    } else {
      map.addSource(sourceId, { type: 'geojson', data: { type: 'FeatureCollection', features } });

      map.addLayer({
        id: 'routes-layer-bg',
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': [
            'case',
            ['>', ['get', 'riskScore'], 60], '#dc2626',
            ['>', ['get', 'riskScore'], 35], '#f59e0b',
            '#10b981'
          ],
          'line-width': ['case', ['boolean', ['get', 'isHighlighted'], false], 8, 4],
          'line-opacity': ['case', ['boolean', ['get', 'isHighlighted'], false], 0.4, 0.1],
        },
      });

      map.addLayer({
        id: 'routes-layer',
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': [
            'case',
            ['>', ['get', 'riskScore'], 60], '#ef4444',
            ['>', ['get', 'riskScore'], 35], '#fbbf24',
            '#34d399'
          ],
          'line-width': ['case', ['boolean', ['get', 'isHighlighted'], false], 4, 2],
          'line-dasharray': ['case', ['boolean', ['get', 'isHighlighted'], false], ['literal', [1]], ['literal', [2, 2]]],
        },
      });
    }

    // Draw Hazards
    const hazSourceId = 'hazards-source';
    const hazFeatures: any[] = hazards.map((h) => ({
      type: 'Feature',
      properties: { severity: h.severity },
      geometry: h.location,
    }));

    if (map.getSource(hazSourceId)) {
      (map.getSource(hazSourceId) as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: hazFeatures });
    } else {
      map.addSource(hazSourceId, { type: 'geojson', data: { type: 'FeatureCollection', features: hazFeatures } });
      map.addLayer({
        id: 'hazards-layer-glow',
        type: 'circle',
        source: hazSourceId,
        paint: {
          'circle-radius': 16,
          'circle-color': ['case', ['==', ['get', 'severity'], 'critical'], '#ef4444', '#fbbf24'],
          'circle-opacity': 0.2,
        },
      });
      map.addLayer({
        id: 'hazards-layer',
        type: 'circle',
        source: hazSourceId,
        paint: {
          'circle-radius': 6,
          'circle-color': ['case', ['==', ['get', 'severity'], 'critical'], '#ef4444', '#fbbf24'],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });
    }

    // Draw Driver location
    const dSourceId = 'driver-source';
    const dFeatures: any[] = driverLocations.map((d) => ({
      type: 'Feature',
      properties: { speed: d.speed, heading: d.heading },
      geometry: d.location,
    }));

    if (map.getSource(dSourceId)) {
      (map.getSource(dSourceId) as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: dFeatures });
    } else {
      map.addSource(dSourceId, { type: 'geojson', data: { type: 'FeatureCollection', features: dFeatures } });
      map.addLayer({
        id: 'driver-layer-glow',
        type: 'circle',
        source: dSourceId,
        paint: {
          'circle-radius': 12,
          'circle-color': '#10b981',
          'circle-opacity': 0.3,
        },
      });
      map.addLayer({
        id: 'driver-layer',
        type: 'circle',
        source: dSourceId,
        paint: {
          'circle-radius': 5,
          'circle-color': '#10b981',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });
    }

    if (driverLocations.length > 0) {
      const loc = driverLocations[0].location.coordinates;
      map.panTo(loc as [number, number], { duration: 1000, easing: (t: number) => t });
    }

  }, [routes, hazards, driverLocations, highlightedRouteId, mapLoaded, currentStyle]);

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />

      <div className="absolute top-4 right-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md shadow-lg shadow-black/20 p-1 flex gap-1 z-10">
        {[
          { id: 'satellite', label: 'Satellite' },
          { id: 'terrain', label: 'Terrain 3D' },
          { id: 'streets', label: 'Streets' },
        ].map((style) => (
          <button
            key={style.id}
            onClick={() => handleStyleChange(style.id as any)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${currentStyle === style.id
                ? 'bg-[var(--color-forest-700)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-panel)]'
              }`}
          >
            {style.label}
          </button>
        ))}
      </div>
    </div>
  );
}
