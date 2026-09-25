'use client';

import { useEffect, useRef, useState } from 'react';

interface RiskScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  breakdown?: {
    terrain: number;
    weather: number;
    hazard: number;
    historical: number;
  };
}

function getRiskColor(score: number): string {
  if (score >= 75) return 'var(--color-rust-500)';
  if (score >= 50) return 'var(--color-amber-500)';
  if (score >= 30) return 'var(--color-amber-400)';
  return 'var(--color-forest-500)';
}

function getRiskLabel(score: number): string {
  if (score >= 75) return 'Critical';
  if (score >= 50) return 'High';
  if (score >= 30) return 'Medium';
  return 'Low';
}

export default function RiskScoreGauge({ score, size = 'md', showLabel = true, breakdown }: RiskScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const prevScore = useRef(score);

  // Animate score changes
  useEffect(() => {
    const start = prevScore.current;
    const end = score;
    const duration = 600;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setDisplayScore(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    prevScore.current = score;
  }, [score]);

  const color = getRiskColor(score);
  const label = getRiskLabel(score);

  const dimensions = {
    sm: { width: 52, height: 52, strokeWidth: 3, fontSize: '14px', labelSize: '9px' },
    md: { width: 72, height: 72, strokeWidth: 4, fontSize: '20px', labelSize: '10px' },
    lg: { width: 100, height: 100, strokeWidth: 5, fontSize: '28px', labelSize: '11px' },
  }[size];

  const radius = (dimensions.width - dimensions.strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: dimensions.width, height: dimensions.height }}>
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={dimensions.width / 2}
            cy={dimensions.height / 2}
            r={radius}
            fill="none"
            stroke="var(--border-default)"
            strokeWidth={dimensions.strokeWidth}
          />
          {/* Score ring */}
          <circle
            cx={dimensions.width / 2}
            cy={dimensions.height / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={dimensions.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Score number */}
        <div
          className="absolute inset-0 flex items-center justify-center mono font-semibold"
          style={{ fontSize: dimensions.fontSize, color }}
        >
          {displayScore}
        </div>
      </div>

      {showLabel && (
        <span
          className="text-xs font-medium"
          style={{ fontSize: dimensions.labelSize, color }}
        >
          {label}
        </span>
      )}

      {/* Breakdown bar */}
      {breakdown && size !== 'sm' && (
        <div className="w-full mt-1">
          <div className="flex h-1.5 rounded-full overflow-hidden bg-[var(--border-default)]">
            <div
              className="h-full"
              style={{ width: `${breakdown.terrain}%`, backgroundColor: 'var(--color-forest-600)' }}
              title={`Terrain: ${breakdown.terrain}`}
            />
            <div
              className="h-full"
              style={{ width: `${breakdown.weather}%`, backgroundColor: 'var(--color-info-400)' }}
              title={`Weather: ${breakdown.weather}`}
            />
            <div
              className="h-full"
              style={{ width: `${breakdown.hazard}%`, backgroundColor: 'var(--color-amber-500)' }}
              title={`Hazard: ${breakdown.hazard}`}
            />
            <div
              className="h-full"
              style={{ width: `${breakdown.historical}%`, backgroundColor: 'var(--color-stone-400)' }}
              title={`Historical: ${breakdown.historical}`}
            />
          </div>
          <div className="flex justify-between mt-0.5 text-[8px] text-[var(--text-muted)]">
            <span>Terr</span>
            <span>Wea</span>
            <span>Haz</span>
            <span>Hist</span>
          </div>
        </div>
      )}
    </div>
  );
}
