"use client";

import { useMemo, useState } from 'react';
import type { SimulationRow } from '@/lib/spis/types';
import { getColorForValue } from '@/lib/spis/colorScale';
import { localTimeAtLon } from '@/lib/spis/lt';

interface PolarMapProps {
  hemisphere: 'N' | 'S';
  simData: SimulationRow[];
  range: { min: number; max: number };
  now: Date;
  size?: number;
}

function formatValue(v: number) {
  if (Math.abs(v) >= 1000 || (Math.abs(v) < 0.01 && v !== 0)) return v.toExponential(1);
  return v.toFixed(1);
}

/**
 * Polar plot in LT coordinates.
 *  - Angle: LT (0 at top, 6 at right, 12 at bottom, 18 at left).
 *  - Radius: co-latitude. Center = pole (90°), outer rim = 30° latitude.
 *  - Grid rings at 60°, 70°, 80°.
 */
export function PolarMap({ hemisphere, simData, range, now, size = 320 }: PolarMapProps) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 24;
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  // Aggregate cells in the hemisphere on a 30° lat × 30° lon (= 2h LT) grid.
  // Lat bins for N: 30..60, 60..90 -> we render rings r ∈ [0..1] mapped from co-lat (0..60°).
  const cells = useMemo(() => {
    const grid = new Map<string, { latBin: number; lonBin: number; vals: number[] }>();
    simData.forEach((row) => {
      if (hemisphere === 'N' && row.lat < 30) return;
      if (hemisphere === 'S' && row.lat > -30) return;
      const latBin = Math.floor(row.lat / 30) * 30;
      const lonBin = Math.floor((row.lon + 180) / 30) * 30 - 180;
      const key = `${latBin}_${lonBin}`;
      if (!grid.has(key)) grid.set(key, { latBin, lonBin, vals: [] });
      grid.get(key)!.vals.push(row.avPot);
    });
    return Array.from(grid.values()).map((g) => ({
      latBin: g.latBin,
      lonBin: g.lonBin,
      avg: g.vals.reduce((a, b) => a + b, 0) / g.vals.length,
    }));
  }, [simData, hemisphere]);

  // Map |lat| in [30..90] -> r in [R..0]   (90° = center)
  const latToR = (absLat: number) => ((90 - absLat) / 60) * R;
  // LT angle: top = LT 0, clockwise. theta_deg = LT*15 - 90  (so 0 is top, 6 is right)
  // In SVG, x = cx + r*cos(theta), y = cy + r*sin(theta), where theta is measured from +x axis clockwise (since SVG y is down).
  const ltToXY = (lt: number, r: number) => {
    const theta = (lt * 15 - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) };
  };

  // Build a wedge path for one cell (latBin, lonBin)
  const wedgePath = (latBin: number, lonBin: number) => {
    const absLatInner = hemisphere === 'N' ? latBin + 30 : Math.abs(latBin);
    const absLatOuter = hemisphere === 'N' ? latBin : Math.abs(latBin + 30);
    const rInner = latToR(absLatInner);
    const rOuter = latToR(absLatOuter);
    // Convert lonBin range to LT range (now): take both edges, pick smaller and bigger
    const lt1 = localTimeAtLon(lonBin, now);
    const lt2 = localTimeAtLon(lonBin + 30, now);
    // Ensure angular sweep is 2h (handle wrap)
    let dLT = lt2 - lt1;
    if (dLT < 0) dLT += 24;
    if (dLT > 12) dLT = 2; // safety; sweep is always ~2h
    const startLT = lt1;
    const endLT = lt1 + 2;
    const a1 = (startLT * 15 - 90) * (Math.PI / 180);
    const a2 = (endLT * 15 - 90) * (Math.PI / 180);
    const p1 = { x: cx + rOuter * Math.cos(a1), y: cy + rOuter * Math.sin(a1) };
    const p2 = { x: cx + rOuter * Math.cos(a2), y: cy + rOuter * Math.sin(a2) };
    const p3 = { x: cx + rInner * Math.cos(a2), y: cy + rInner * Math.sin(a2) };
    const p4 = { x: cx + rInner * Math.cos(a1), y: cy + rInner * Math.sin(a1) };
    return `M ${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 0 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rInner} ${rInner} 0 0 0 ${p4.x} ${p4.y} Z`;
  };

  return (
    <div className="relative bg-card border border-border rounded-lg p-3">
      <div className="text-xs font-semibold text-foreground mb-2">
        {hemisphere === 'N' ? '북반구' : '남반구'} LT 기반 극좌표 지도
      </div>
      <svg width={size} height={size} className="block mx-auto">
        {/* Background disk */}
        <circle cx={cx} cy={cy} r={R} fill="hsl(var(--muted) / 0.3)" stroke="hsl(var(--border))" />

        {/* Lat rings: 60°, 70°, 80° */}
        {[60, 70, 80].map((latRing) => (
          <circle
            key={latRing}
            cx={cx}
            cy={cy}
            r={latToR(latRing)}
            fill="none"
            stroke="hsl(var(--border))"
            strokeDasharray="2,2"
            strokeWidth={0.5}
          />
        ))}

        {/* LT spokes every 6h */}
        {[0, 6, 12, 18].map((lt) => {
          const p = ltToXY(lt, R);
          return (
            <line key={lt} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="hsl(var(--border))" strokeWidth={0.5} strokeDasharray="2,2" />
          );
        })}

        {/* Cells */}
        {cells.map((c) => {
          const color = getColorForValue(Math.abs(c.avg), range.min, range.max);
          return (
            <path
              key={`${c.latBin}_${c.lonBin}`}
              d={wedgePath(c.latBin, c.lonBin)}
              fill={color}
              opacity={0.85}
              stroke="hsl(var(--background) / 0.5)"
              strokeWidth={0.3}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                const r = e.currentTarget.getBoundingClientRect();
                if (rect) setTooltip({
                  x: r.left - rect.left + r.width / 2,
                  y: r.top - rect.top,
                  text: `LAT ${c.latBin}°~${c.latBin + 30}°\nLT ${localTimeAtLon(c.lonBin, now).toFixed(1)}h\nAvPot: ${formatValue(c.avg)} V`,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        })}

        {/* LT labels */}
        {[
          { lt: 0, label: '0\n(LT)' },
          { lt: 6, label: '6' },
          { lt: 12, label: '12' },
          { lt: 18, label: '18' },
        ].map(({ lt, label }) => {
          const p = ltToXY(lt, R + 12);
          return (
            <text
              key={lt}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={10}
              fill="hsl(var(--foreground))"
            >
              {label.split('\n').map((line, i) => (
                <tspan key={i} x={p.x} dy={i === 0 ? 0 : 11}>{line}</tspan>
              ))}
            </text>
          );
        })}

        {/* Lat ring labels */}
        {[60, 70, 80].map((latRing) => (
          <text
            key={latRing}
            x={cx + 2}
            y={cy - latToR(latRing) + 3}
            fontSize={8}
            fill="hsl(var(--muted-foreground))"
          >
            {latRing}°{hemisphere}
          </text>
        ))}
      </svg>

      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none bg-popover border border-border rounded shadow-xl p-2 text-[10px] whitespace-pre-line"
          style={{ left: tooltip.x, top: tooltip.y - 10, transform: 'translate(-50%, -100%)' }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
