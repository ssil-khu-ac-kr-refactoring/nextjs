"use client";

import { useMemo, useState, useEffect } from 'react';
import type { SimulationRow, PotentialResult, FilterState } from '@/lib/spis/types';
import { generateColorLegend, getColorForValue } from '@/lib/spis/colorScale';
import { solarElevation } from '@/lib/spis/solar';
import { localTimeAtLon } from '@/lib/spis/lt';
import { PolarMap } from './PolarMap';
const worldMapImage = '/spis/world-map.jpg';

interface WorldMapProps {
  simData: SimulationRow[];
  potentials: PotentialResult[];
  filters: FilterState;
  mapDataRange: { min: number; max: number };
  potentialRange: { min: number; max: number };
  now: Date;
  /** Cell size in degrees. Data-native (real data: 2°×15°); legacy synthesis: 30°×30°. */
  cellSpan?: { latDeg: number; lonDeg: number };
}

// Cells arrive already positioned at their CENTERS at native resolution —
// no re-binning here; just average duplicates sharing the same center.
function buildHeatmapGrid(data: SimulationRow[]) {
  const grid = new Map<string, { lat: number; lon: number; values: number[] }>();
  data.forEach((row) => {
    const key = `${row.lat}_${row.lon}`;
    if (!grid.has(key)) grid.set(key, { lat: row.lat, lon: row.lon, values: [] });
    grid.get(key)!.values.push(row.avPot);
  });
  return Array.from(grid.values()).map(g => ({
    lat: g.lat, lon: g.lon,
    avg: g.values.reduce((a, b) => a + b, 0) / g.values.length,
  }));
}

function formatValue(v: number) {
  if (Math.abs(v) >= 1000 || (Math.abs(v) < 0.01 && v !== 0)) return v.toExponential(1);
  return v.toFixed(1);
}

/** Generate a 360x180 night-shadow data URL (alpha = darkness amount). */
function useNightShadowDataUrl(now: Date) {
  return useMemo(() => {
    const W = 360, H = 180;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    const img = ctx.createImageData(W, H);
    for (let y = 0; y < H; y++) {
      const lat = 90 - (y + 0.5);
      for (let x = 0; x < W; x++) {
        const lon = -180 + (x + 0.5);
        const elev = solarElevation(lat, lon, now);
        // Keep the terminator calculation, but use a subtle 20% maximum shadow.
        const t = Math.max(0, Math.min(1, (elev + 3) / 6));
        const alpha = Math.round((1 - t) * 51);
        const i = (y * W + x) * 4;
        img.data[i] = 0;
        img.data[i + 1] = 0;
        img.data[i + 2] = 15;
        img.data[i + 3] = alpha;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL();
  }, [now]);
}

/** Convert the existing equirectangular texture into a light, neutral outline map. */
function useNeutralLineMapDataUrl() {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let cancelled = false;
    const source = new Image();
    source.onload = () => {
      const width = 720;
      const height = 360;
      const input = document.createElement('canvas');
      input.width = width;
      input.height = height;
      const inputContext = input.getContext('2d', { willReadFrequently: true });
      if (!inputContext) return;
      inputContext.drawImage(source, 0, 0, width, height);
      const pixels = inputContext.getImageData(0, 0, width, height);
      const output = inputContext.createImageData(width, height);
      const luminance = (x: number, y: number) => {
        const index = (Math.max(0, Math.min(height - 1, y)) * width + Math.max(0, Math.min(width - 1, x))) * 4;
        return pixels.data[index] * 0.2126 + pixels.data[index + 1] * 0.7152 + pixels.data[index + 2] * 0.0722;
      };
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const gx = luminance(x + 1, y) - luminance(x - 1, y);
          const gy = luminance(x, y + 1) - luminance(x, y - 1);
          const edge = Math.min(1, Math.hypot(gx, gy) / 65);
          const gray = Math.round(248 - edge * 100);
          const index = (y * width + x) * 4;
          output.data[index] = gray;
          output.data[index + 1] = gray;
          output.data[index + 2] = gray;
          output.data[index + 3] = 255;
        }
      }
      inputContext.putImageData(output, 0, 0);
      if (!cancelled) setUrl(input.toDataURL('image/png'));
    };
    source.src = worldMapImage;
    return () => { cancelled = true; };
  }, []);
  return url;
}

export function WorldMap({ simData, potentials, filters, mapDataRange, potentialRange, now, cellSpan }: WorldMapProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const gridCells = useMemo(() => buildHeatmapGrid(simData), [simData]);

  const span = cellSpan ?? { latDeg: 30, lonDeg: 30 };
  const cellWidthPct = (span.lonDeg / 360) * 100;
  const cellHeightPct = (span.latDeg / 180) * 100;
  // 세밀 격자(위도 2°)에선 셀 테두리를 생략해 지도가 지저분해지지 않게.
  const fineGrid = span.latDeg < 10;

  const nightShadowUrl = useNightShadowDataUrl(now);
  const neutralMapUrl = useNeutralLineMapDataUrl();
  const legend = useMemo(
    () => generateColorLegend(mapDataRange.min, mapDataRange.max),
    [mapDataRange.min, mapDataRange.max],
  );

  // LT axis ticks at lon = -180..180 step 30
  const ltTicks = useMemo(() => {
    return Array.from({ length: 13 }, (_, i) => {
      const lon = -180 + i * 30;
      return { lon, x: ((lon + 180) / 360) * 100, lt: localTimeAtLon(lon, now) };
    });
  }, [now]);

  return (
    <div className="flex-1 bg-muted/30 overflow-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            위성 전위 분석
            <span className="ml-3 text-sm font-normal text-muted-foreground">
              FORM: {filters.form} · UTC {now.toISOString().slice(11, 16)}
            </span>
          </h2>
        </div>

        {/* 2D World Map Heatmap */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            세계지도 · LT 기반 x축 (실시간 그림자)
          </h3>

          <div className="flex">
            {/* 위도(Y) 축 — LT 축처럼 항상 일정한 간격의 눈금 (30° 마다) */}
            <div className="w-10 shrink-0 flex flex-col">
              <div className="h-5" />
              <div className="relative h-[440px] lg:h-[540px]">
                {[90, 60, 30, 0, -30, -60, -90].map((lat) => (
                  <div
                    key={lat}
                    className="absolute right-1.5 -translate-y-1/2 text-[10px] text-muted-foreground"
                    style={{ top: `${((90 - lat) / 180) * 100}%` }}
                  >
                    {lat}°
                  </div>
                ))}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 origin-center text-[10px] font-medium text-foreground">
                  LAT
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
          {/* LT axis (top) */}
          <div className="relative h-5 ml-0">
            {ltTicks.map((t) => (
              <div
                key={`top-${t.lon}`}
                className="absolute text-[10px] text-muted-foreground -translate-x-1/2"
                style={{ left: `${t.x}%`, top: 0 }}
              >
                {t.lt.toFixed(0)}h
              </div>
            ))}
          </div>

          {/* 위도 방향을 길게: 고정 높이 + object-fill 로 세로 확대 (오버레이는 %-배치라 그대로 정합) */}
          <div className="relative rounded-lg overflow-hidden border border-border h-[440px] lg:h-[540px]">
            <img
              src={neutralMapUrl || worldMapImage}
              alt="World Map"
              className="absolute inset-0 w-full h-full object-fill select-none pointer-events-none bg-[#f8f8f8]"
              style={neutralMapUrl ? undefined : { filter: 'grayscale(1)', opacity: 0.25 }}
              draggable={false}
            />

            {/* Subtle night shadow below potential cells, so their colors stay unchanged. */}
            {nightShadowUrl && (
              <img
                src={nightShadowUrl}
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
            )}

            {/* Grid lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {[-60, -30, 0, 30, 60].map(lat => {
                const y = ((90 - lat) / 180) * 100;
                return <line key={`lat-${lat}`} x1="0" y1={y} x2="100" y2={y} stroke="rgba(100,100,100,0.22)" strokeWidth="0.15" strokeDasharray="1,1" />;
              })}
              {Array.from({ length: 12 }, (_, i) => i * 30 - 180).map(lon => {
                const x = ((lon + 180) / 360) * 100;
                return <line key={`lon-${lon}`} x1={x} y1="0" x2={x} y2="100" stroke="rgba(100,100,100,0.22)" strokeWidth="0.15" strokeDasharray="1,1" />;
              })}
            </svg>

            {/* 데이터 셀 — 중심(lat,lon) ± 스팬/2 로 native 해상도 렌더 (실데이터: 위도 2° × 경도 15°) */}
            {gridCells.map((cell) => {
              const color = getColorForValue(cell.avg, mapDataRange.min, mapDataRange.max);
              const left = ((((cell.lon - span.lonDeg / 2 + 180) % 360) + 360) % 360 / 360) * 100;
              const top = ((90 - (cell.lat + span.latDeg / 2)) / 180) * 100;
              const ltCenter = localTimeAtLon(cell.lon, now);
              return (
                <div
                  key={`${cell.lat}_${cell.lon}`}
                  className={`absolute cursor-pointer transition-colors ${fineGrid ? 'hover:outline hover:outline-1 hover:outline-white/70' : 'border border-white/10 hover:border-white/50'}`}
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    width: `${cellWidthPct}%`,
                    height: `${cellHeightPct}%`,
                    backgroundColor: color,
                    opacity: 0.86,
                  }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                    const r = e.currentTarget.getBoundingClientRect();
                    if (rect) setTooltip({
                      x: r.left - rect.left + r.width / 2,
                      y: r.top - rect.top,
                      text: `LAT ${cell.lat - span.latDeg / 2}°~${cell.lat + span.latDeg / 2}° / LT ${ltCenter.toFixed(1)}h\nAvPot: ${formatValue(cell.avg)} [V]`,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}

            {tooltip && (
              <div className="absolute z-50 pointer-events-none bg-popover border border-border rounded-lg shadow-xl p-2 text-xs whitespace-pre-line" style={{ left: tooltip.x, top: tooltip.y - 10, transform: 'translate(-50%, -100%)' }}>
                {tooltip.text}
              </div>
            )}
          </div>

          {/* LT axis (bottom) */}
          <div className="relative h-5 ml-0 mt-1">
            {ltTicks.map((t) => (
              <div
                key={`bot-${t.lon}`}
                className="absolute text-[10px] text-muted-foreground -translate-x-1/2"
                style={{ left: `${t.x}%`, top: 0 }}
              >
                {t.lt.toFixed(0)}
              </div>
            ))}
            <div className="absolute right-0 -top-0 text-[10px] font-medium text-foreground">LT [h]</div>
          </div>
            </div>
          </div>

          {/* Signed continuous potential legend. */}
          <div className="mt-2 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground shrink-0">AvPot [V]</span>
              <div className="flex h-3 flex-1 max-w-xl overflow-hidden rounded-sm border border-border">
                {legend.map((entry, index) => (
                  <span key={index} className="flex-1" style={{ backgroundColor: entry.color }} />
                ))}
              </div>
            </div>
            <div className="ml-[62px] flex max-w-xl justify-between mt-0.5">
              <span>{formatValue(mapDataRange.min)}</span>
              {mapDataRange.min < 0 && mapDataRange.max > 0 && <span>0</span>}
              <span>{formatValue(mapDataRange.max)}</span>
            </div>
          </div>
        </div>


        {/* Polar maps */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            반구별 LT 극좌표 지도
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PolarMap hemisphere="N" simData={simData} range={mapDataRange} now={now} cellSpan={span} />
            <PolarMap hemisphere="S" simData={simData} range={mapDataRange} now={now} cellSpan={span} />
          </div>
        </div>

        {/* No data */}
        {simData.length === 0 && potentials.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">데이터가 없습니다</p>
              <p className="text-sm mt-1">좌측에서 샘플 데이터를 로드해주세요</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
