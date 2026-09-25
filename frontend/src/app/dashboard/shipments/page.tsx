'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import type { GeoPoint } from '@/lib/data/types';
import type { CreateShipmentPayload } from '@/lib/data/client';
import { SEED_DATA } from '@/lib/data/seed';

// ============================================================
// Location presets for the form (coordinates from seed)
// ============================================================
const LOCATION_PRESETS = [
  { name: 'Remote Village', coords: [85.324, 27.717] as [number, number] },
  { name: 'Collection Center', coords: [85.362, 27.695] as [number, number] },
  { name: 'Regional Market', coords: [85.460, 27.620] as [number, number] },
  { name: 'Bridge Crossing Hub', coords: [85.420, 27.640] as [number, number] },
  { name: 'Mountain Fuel Station', coords: [85.390, 27.660] as [number, number] },
];

const SPECIAL_HANDLING_OPTIONS = [
  { value: 'fragile', label: 'Fragile' },
  { value: 'temperature_controlled', label: 'Temperature Controlled' },
  { value: 'hazmat', label: 'Hazardous Materials' },
  { value: 'livestock', label: 'Livestock' },
  { value: 'perishable', label: 'Perishable' },
] as const;

// ============================================================
// Shipment Creation Form
// ============================================================
function CreateShipmentForm({ onCreated }: { onCreated: () => void }) {
  const { client, refreshData, vehicles } = useAppStore();
  const [formData, setFormData] = useState({
    originName: '',
    originCoords: '' as string,
    destinationName: '',
    destinationCoords: '' as string,
    cargoDescription: '',
    weightKg: '',
    volumeCbm: '',
    specialHandling: [] as string[],
    priority: 'standard' as 'standard' | 'express' | 'urgent' | 'critical',
    deadlineHours: '8',
  });

  const [step, setStep] = useState<'form' | 'vehicles' | 'confirm'>('form');

  const compatibleVehicles = useMemo(() => {
    const weight = parseFloat(formData.weightKg) || 0;
    const volume = parseFloat(formData.volumeCbm) || 0;
    if (weight === 0) return [];
    return client.getCompatibleVehicles(weight, volume);
  }, [formData.weightKg, formData.volumeCbm, client]);

  const handleSubmit = useCallback(() => {
    const originPreset = LOCATION_PRESETS.find((p) => p.name === formData.originCoords);
    const destPreset = LOCATION_PRESETS.find((p) => p.name === formData.destinationCoords);

    if (!originPreset || !destPreset) return;

    const payload: CreateShipmentPayload = {
      originName: formData.originName || originPreset.name,
      originLocation: { type: 'Point', coordinates: originPreset.coords },
      destinationName: formData.destinationName || destPreset.name,
      destinationLocation: { type: 'Point', coordinates: destPreset.coords },
      cargoDescription: formData.cargoDescription,
      weightKg: parseFloat(formData.weightKg),
      volumeCbm: parseFloat(formData.volumeCbm),
      specialHandling: formData.specialHandling as CreateShipmentPayload['specialHandling'],
      priority: formData.priority,
      deadline: new Date(Date.now() + parseFloat(formData.deadlineHours) * 3600000).toISOString(),
    };

    client.createShipment(payload);
    refreshData();
    onCreated();
  }, [formData, client, refreshData, onCreated]);

  const update = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleHandling = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      specialHandling: prev.specialHandling.includes(val)
        ? prev.specialHandling.filter((h) => h !== val)
        : [...prev.specialHandling, val],
    }));
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg">
      <div className="px-5 py-4 border-b border-[var(--border-default)]">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Create Shipment</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Define cargo, origin, destination, and handling requirements</p>
      </div>

      <div className="p-5 space-y-5">
        {/* Origin & Destination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Origin</label>
            <select
              value={formData.originCoords}
              onChange={(e) => {
                update('originCoords', e.target.value);
                update('originName', e.target.value);
              }}
              className="w-full px-3 py-2 rounded-md bg-[var(--bg-panel)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            >
              <option value="">Select origin...</option>
              {LOCATION_PRESETS.map((p) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Destination</label>
            <select
              value={formData.destinationCoords}
              onChange={(e) => {
                update('destinationCoords', e.target.value);
                update('destinationName', e.target.value);
              }}
              className="w-full px-3 py-2 rounded-md bg-[var(--bg-panel)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            >
              <option value="">Select destination...</option>
              {LOCATION_PRESETS.map((p) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Cargo */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Cargo Description</label>
          <input
            type="text"
            value={formData.cargoDescription}
            onChange={(e) => update('cargoDescription', e.target.value)}
            placeholder="e.g., Fresh produce and dairy for morning market"
            className="w-full px-3 py-2 rounded-md bg-[var(--bg-panel)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
          />
        </div>

        {/* Weight, Volume, Deadline */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Weight (kg)</label>
            <input
              type="number"
              value={formData.weightKg}
              onChange={(e) => update('weightKg', e.target.value)}
              placeholder="800"
              className="w-full px-3 py-2 rounded-md bg-[var(--bg-panel)] border border-[var(--border-default)] text-sm mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Volume (m³)</label>
            <input
              type="number"
              value={formData.volumeCbm}
              onChange={(e) => update('volumeCbm', e.target.value)}
              placeholder="3.5"
              step="0.1"
              className="w-full px-3 py-2 rounded-md bg-[var(--bg-panel)] border border-[var(--border-default)] text-sm mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Deadline (hours)</label>
            <input
              type="number"
              value={formData.deadlineHours}
              onChange={(e) => update('deadlineHours', e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-[var(--bg-panel)] border border-[var(--border-default)] text-sm mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            />
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Priority</label>
          <div className="flex gap-2">
            {(['standard', 'express', 'urgent', 'critical'] as const).map((p) => {
              const colors = {
                standard: 'var(--color-sage-400)',
                express: 'var(--color-info-400)',
                urgent: 'var(--color-amber-500)',
                critical: 'var(--color-rust-500)',
              };
              const isActive = formData.priority === p;
              return (
                <button
                  key={p}
                  onClick={() => update('priority', p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                    isActive
                      ? 'border-2'
                      : 'border border-[var(--border-default)] hover:border-[var(--color-forest-600)]'
                  }`}
                  style={isActive ? { borderColor: colors[p], color: colors[p], backgroundColor: `color-mix(in srgb, ${colors[p]} 10%, transparent)` } : {}}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Special Handling */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Special Handling</label>
          <div className="flex flex-wrap gap-2">
            {SPECIAL_HANDLING_OPTIONS.map((opt) => {
              const isActive = formData.specialHandling.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleHandling(opt.value)}
                  className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                    isActive
                      ? 'bg-[var(--color-forest-800)] text-[var(--color-forest-300)] border border-[var(--color-forest-600)]'
                      : 'bg-[var(--bg-panel)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:border-[var(--color-forest-600)]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Compatible Vehicles Preview */}
        {parseFloat(formData.weightKg) > 0 && (
          <div className="bg-[var(--bg-panel)] rounded-lg p-4">
            <h3 className="text-xs font-medium text-[var(--text-secondary)] mb-2">
              Compatible Vehicles ({compatibleVehicles.length})
            </h3>
            {compatibleVehicles.length > 0 ? (
              <div className="space-y-2">
                {compatibleVehicles.map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[var(--text-primary)] font-medium">{v.name}</span>
                      <span className="text-[var(--text-muted)] ml-2">{v.plateNumber}</span>
                    </div>
                    <span className="mono text-[var(--text-muted)]">
                      {v.maxWeightKg}kg / {v.maxVolumeCbm}m³
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--color-amber-500)]">
                No available vehicles can handle this weight/volume. Check fleet status.
              </p>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={!formData.originCoords || !formData.destinationCoords || !formData.cargoDescription || !formData.weightKg}
            className="px-5 py-2 rounded-md text-sm font-medium bg-[var(--color-forest-800)] hover:bg-[var(--color-forest-700)] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create Shipment
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Shipment List
// ============================================================
function ShipmentList() {
  const { shipments } = useAppStore();

  const statusColors: Record<string, { color: string; bg: string }> = {
    pending: { color: 'var(--color-info-400)', bg: 'rgba(74, 127, 181, 0.12)' },
    assigned: { color: 'var(--color-amber-400)', bg: 'rgba(224, 154, 47, 0.12)' },
    in_transit: { color: 'var(--color-forest-400)', bg: 'rgba(77, 168, 126, 0.12)' },
    delivered: { color: 'var(--color-sage-400)', bg: 'rgba(150, 171, 142, 0.1)' },
    cancelled: { color: 'var(--color-stone-400)', bg: 'rgba(150, 140, 126, 0.1)' },
  };

  const priorityColors: Record<string, string> = {
    standard: 'var(--color-sage-400)',
    express: 'var(--color-info-400)',
    urgent: 'var(--color-amber-500)',
    critical: 'var(--color-rust-500)',
  };

  const sorted = [...shipments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-default)]">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">All Shipments</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-medium">ID</th>
              <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-medium">Route</th>
              <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-medium">Cargo</th>
              <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-medium">Weight</th>
              <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-medium">Priority</th>
              <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-medium">Status</th>
              <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-medium">Deadline</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => {
              const st = statusColors[s.status] || statusColors.pending;
              return (
                <tr key={s.id} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-panel)] transition-colors">
                  <td className="px-4 py-2.5 mono text-xs">{s.id.replace('shp_', 'SHP-').slice(0, 12)}</td>
                  <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)]">{s.origin.name} → {s.destination.name}</td>
                  <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)] max-w-[180px] truncate">{s.cargo.description}</td>
                  <td className="px-4 py-2.5 mono text-xs">{s.cargo.weightKg}kg</td>
                  <td className="px-4 py-2.5">
                    <span className="text-[11px] font-medium capitalize" style={{ color: priorityColors[s.priority] }}>
                      {s.priority}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium capitalize" style={{ color: st.color, backgroundColor: st.bg }}>
                      {s.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 mono text-xs text-[var(--text-muted)]">
                    {new Date(s.deadline).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Shipments Page
// ============================================================
export default function ShipmentsPage() {
  const { refreshData } = useAppStore();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    refreshData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Shipments</h1>
          <p className="text-xs text-[var(--text-muted)]">Create and manage shipment orders</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium bg-[var(--color-forest-800)] hover:bg-[var(--color-forest-700)] text-white transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 1v12M1 7h12" strokeLinecap="round" />
          </svg>
          New Shipment
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {showForm && (
          <CreateShipmentForm onCreated={() => {
            setShowForm(false);
            refreshData();
          }} />
        )}
        <ShipmentList />
      </div>
    </div>
  );
}
