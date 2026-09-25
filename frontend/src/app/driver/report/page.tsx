'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import type { IncidentCategory } from '@/lib/data/types';

const CATEGORIES: { value: IncidentCategory; label: string; icon: string }[] = [
  { value: 'road_blockage', label: 'Road Blockage', icon: '🚧' },
  { value: 'vehicle_breakdown', label: 'Vehicle Issue', icon: '🔧' },
  { value: 'accident', label: 'Accident', icon: '🚗' },
  { value: 'weather_hazard', label: 'Weather Hazard', icon: '⛈' },
  { value: 'security_concern', label: 'Security', icon: '🔒' },
  { value: 'infrastructure_damage', label: 'Road Damage', icon: '🕳' },
];

const SEVERITY_OPTIONS = [
  { value: 'minor', label: 'Minor', color: 'var(--color-sage-400)' },
  { value: 'moderate', label: 'Moderate', color: 'var(--color-amber-400)' },
  { value: 'severe', label: 'Severe', color: 'var(--color-amber-500)' },
  { value: 'critical', label: 'Critical', color: 'var(--color-rust-500)' },
] as const;

export default function DriverReportPage() {
  const { client, refreshData, currentUser, drivers, trips, isOnline } = useAppStore();

  useEffect(() => {
    refreshData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [category, setCategory] = useState<IncidentCategory | null>(null);
  const [severity, setSeverity] = useState<'minor' | 'moderate' | 'severe' | 'critical'>('moderate');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const driver = useMemo(() => {
    if (!currentUser) return null;
    return drivers.find((d) => d.userId === currentUser.id) || drivers[0];
  }, [currentUser, drivers]);

  const activeTrip = useMemo(() => {
    if (!driver) return null;
    return trips.find((t) => t.driverId === driver.id && ['en_route', 'delayed', 'at_risk'].includes(t.status));
  }, [driver, trips]);

  const handleSubmit = useCallback(() => {
    if (!category || !driver) return;

    const categoryLabels: Record<string, string> = {
      road_blockage: 'Road Blockage',
      vehicle_breakdown: 'Vehicle Issue',
      accident: 'Accident',
      weather_hazard: 'Weather Hazard',
      security_concern: 'Security Concern',
      infrastructure_damage: 'Infrastructure Damage',
      other: 'Other Incident',
    };

    client.reportIncident({
      tripId: activeTrip?.id,
      driverId: driver.id,
      category,
      severity,
      title: `${categoryLabels[category]} reported by ${driver.name}`,
      description: description || `Driver reported ${categoryLabels[category].toLowerCase()} incident.`,
      location: driver.currentLocation || { type: 'Point', coordinates: [85.400, 27.670] },
    });

    refreshData();
    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
      setCategory(null);
      setSeverity('moderate');
      setDescription('');
    }, 3000);
  }, [category, severity, description, driver, activeTrip, client, refreshData]);

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[rgba(77,168,126,0.12)] flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--color-forest-400)" strokeWidth="2" strokeLinecap="round">
            <path d="M6 14l6 6 10-10" />
          </svg>
        </div>
        <p className="text-base font-semibold text-[var(--text-primary)]">Report Submitted</p>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {isOnline ? 'Ops team has been notified' : 'Queued for sync when back online'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Report Incident</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Select category and severity — tap to report</p>
      </div>

      {/* Category selection — large touch targets */}
      <div>
        <div className="text-xs font-medium text-[var(--text-secondary)] mb-2">What happened?</div>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-lg text-left transition-colors min-h-[56px] ${
                category === cat.value
                  ? 'bg-[var(--color-forest-800)] border-2 border-[var(--color-forest-500)] text-[var(--color-forest-300)]'
                  : 'bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)] hover:border-[var(--color-forest-600)]'
              }`}
            >
              <span className="text-xl">{cat.icon}</span>
              <span className="text-sm font-medium">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Severity — only show after category selected */}
      {category && (
        <div>
          <div className="text-xs font-medium text-[var(--text-secondary)] mb-2">How severe?</div>
          <div className="flex gap-2">
            {SEVERITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSeverity(opt.value)}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors min-h-[48px] ${
                  severity === opt.value
                    ? 'border-2'
                    : 'bg-[var(--bg-surface)] border border-[var(--border-default)]'
                }`}
                style={
                  severity === opt.value
                    ? {
                        borderColor: opt.color,
                        color: opt.color,
                        backgroundColor: `color-mix(in srgb, ${opt.color} 10%, transparent)`,
                      }
                    : { color: 'var(--text-secondary)' }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Additional description */}
      {category && (
        <div>
          <div className="text-xs font-medium text-[var(--text-secondary)] mb-2">Details (optional)</div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you see..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] resize-none"
          />
        </div>
      )}

      {/* Submit */}
      {category && (
        <button
          onClick={handleSubmit}
          className="w-full py-3.5 rounded-lg text-sm font-semibold bg-[var(--color-forest-800)] hover:bg-[var(--color-forest-700)] text-white transition-colors min-h-[48px]"
        >
          {isOnline ? 'Submit Report' : 'Save for Sync'}
        </button>
      )}

      {!isOnline && category && (
        <p className="text-xs text-[var(--color-amber-400)] text-center">
          You are offline. This report will be queued and synced when connectivity returns.
        </p>
      )}
    </div>
  );
}
