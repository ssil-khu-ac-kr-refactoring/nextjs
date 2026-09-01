"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { SpisControls } from "@/components/spis/SpisControls";
import { WorldMap } from "@/components/spis/WorldMap";
import { Globe3D } from "@/components/spis/Globe3D";
import type { SpisFilter, SpisPotentialRow, SimulationRow, FilterState } from "@/lib/spis/types";
import { LAT_BINS, LON_BINS } from "@/lib/spis/types";
import { fetchSpisPotentials } from "@/lib/spis/dataApi";
import { isDaytime } from "@/lib/spis/solar";
import { lonForLT } from "@/lib/spis/lt";
import { useNow } from "@/hooks/useNow";

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export interface SpisAppProps {
  showExperimentalViews?: boolean;
}

export default function SpisApp({ showExperimentalViews = false }: SpisAppProps) {
  const [data, setData] = useState<SpisPotentialRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const now = useNow(10000);
  const [filter, setFilter] = useState<SpisFilter>({
    node0Mat: "",
    node1Mat: "",
    res: "",
    node: 0,
    condSolar: "",
    kp: "",
    extraSel: {},
    viewMode: "2D",
    showAurora: true,
    showSatellite: true,
  });

  // Distinct selector options derived from the data itself.
  // Environment params (condSolar, kp) appear automatically when the data carries them.
  const options = useMemo(
    () => ({
      node0: uniq(data.map((d) => d.node0Mat)).filter(Boolean),
      node1: uniq(data.map((d) => d.node1Mat)).filter(Boolean),
      res: uniq(data.map((d) => d.res)).filter(Boolean),
      node: uniq(data.map((d) => d.node)).sort((a, b) => a - b),
      condSolar: uniq(data.map((d) => d.condSolar ?? "")).filter(Boolean),
      kp: uniq(data.map((d) => d.kp ?? "")).filter(Boolean),
    }),
    [data],
  );

  // Auto-discovered filter options from unrecognized Excel columns (extras JSON).
  // Every key that appears in any row's extras (with ≥1 non-empty value) becomes a
  // dropdown; keys with >50 distinct values are skipped (junk/continuous columns).
  const extraOptions = useMemo(() => {
    const sets: Record<string, Set<string | number>> = {};
    for (const d of data) {
      if (!d.extras) continue;
      for (const [k, v] of Object.entries(d.extras)) {
        if (v === null || v === undefined || v === "") continue;
        (sets[k] ??= new Set()).add(v);
      }
    }
    const out: Record<string, (string | number)[]> = {};
    for (const [k, set] of Object.entries(sets)) {
      if (set.size === 0 || set.size > 50) continue;
      out[k] = [...set].sort((a, b) =>
        typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b)),
      );
    }
    return out;
  }, [data]);

  // Initialize / repair the selection whenever the option set changes.
  useEffect(() => {
    if (data.length === 0) return;
    setFilter((f) => {
      const next = { ...f };
      if (!options.node0.includes(next.node0Mat)) next.node0Mat = options.node0[0] ?? "";
      if (options.node1.length && !options.node1.includes(next.node1Mat)) next.node1Mat = options.node1[0] ?? "";
      if (options.res.length && !options.res.includes(next.res)) next.res = options.res[0] ?? "";
      if (options.node.length && !options.node.includes(next.node)) next.node = options.node[0] ?? 0;
      if (options.condSolar.length && !options.condSolar.includes(next.condSolar)) next.condSolar = options.condSolar[0] ?? "";
      if (!options.condSolar.length) next.condSolar = "";
      if (options.kp.length && !options.kp.includes(next.kp)) next.kp = options.kp[0] ?? "";
      if (!options.kp.length) next.kp = "";
      // Extras: keep only keys still present; drop selections whose value disappeared.
      const extraSel: Record<string, string> = {};
      for (const [k, vals] of Object.entries(extraOptions)) {
        const cur = next.extraSel[k] ?? "";
        extraSel[k] = cur !== "" && vals.some((v) => String(v) === cur) ? cur : "";
      }
      next.extraSel = extraSel;
      return next;
    });
  }, [data, options, extraOptions]);

  // Shared row predicate for the current selection (env params included when present).
  const matchesFilter = useCallback(
    (d: SpisPotentialRow) =>
      d.node0Mat === filter.node0Mat &&
      (options.node1.length === 0 || d.node1Mat === filter.node1Mat) &&
      (options.res.length === 0 || d.res === filter.res) &&
      (options.node.length === 0 || d.node === filter.node) &&
      (options.condSolar.length === 0 || (d.condSolar ?? "") === filter.condSolar) &&
      (options.kp.length === 0 || (d.kp ?? "") === filter.kp) &&
      // Auto-discovered extras filters: empty selection ("") = 전체 (pass-through).
      Object.entries(filter.extraSel).every(
        ([k, sel]) => sel === "" || String(d.extras?.[k] ?? "") === sel,
      ),
    [filter, options],
  );

  // DAY / NGT average potential for the current selection.
  const { dayValue, ngtValue } = useMemo(() => {
    const match = (dn: string) => data.find((d) => matchesFilter(d) && d.dn === dn);
    return { dayValue: match("DAY")?.avPot ?? null, ngtValue: match("NGT")?.avPot ?? null };
  }, [data, matchesFilter]);

  // LT-positioned rows for the current selection (the new data delivery format:
  // position arrives as LOCAL TIME, not longitude).
  const ltRows = useMemo(() => {
    return data.filter((d) => d.lt != null && matchesFilter(d));
  }, [data, matchesFilter]);

  // Helper: a blank SimulationRow shell (only lat/lon/avPot/timeMode matter to the renderers).
  const makeCell = useCallback(
    (lat: number, lon: number, avPot: number, day: boolean): SimulationRow => ({
      nth: 0, tth: 0, ne: 0, te: 0, ni: 0, ti: 0, alt: 0,
      sey: null, mpd: null, pey: null, ipe: null, pee: null, msey: null, buc: null, sre: null,
      lat, lon, avPot,
      form: "3U+Boom",
      node0Mat: filter.node0Mat as unknown as SimulationRow["node0Mat"],
      timeMode: day ? "DAY" : "NGT",
    }),
    [filter.node0Mat],
  );

  // Cell spans derived from the data's native resolution.
  // Real delivery format: lat 2° × LT 1h (→ 15° lon). Falls back to 30° for the
  // legacy DAY/NGT synthesis path (no lt/lat in rows).
  const cellSpan = useMemo(() => {
    const minGap = (vals: number[]) => {
      const u = [...new Set(vals)].sort((a, b) => a - b);
      let g = Infinity;
      for (let i = 1; i < u.length; i++) g = Math.min(g, u[i] - u[i - 1]);
      return Number.isFinite(g) && g > 0 ? g : null;
    };
    const latGap = minGap(ltRows.map((r) => r.lat).filter((v): v is number => v != null));
    const ltGap = minGap(ltRows.map((r) => r.lt).filter((v): v is number => v != null));
    return { latDeg: latGap ?? 30, lonDeg: ltGap != null ? ltGap * 15 : 30 };
  }, [ltRows]);

  // Build the lat/lon grid the renderers consume. Cell coords are CENTERS
  // (matches the data's lat_center/ltime_center); span comes from cellSpan.
  //  • If the data carries LT → convert LT to a geographic longitude (lonForLT, now-relative)
  //    and place each value there at native resolution. Rows without latitude paint all bands.
  //  • Otherwise → fall back to 30° DAY/NGT synthesis split by the real-time solar terminator.
  const gridCells = useMemo<SimulationRow[]>(() => {
    if (ltRows.length > 0) {
      const cells: SimulationRow[] = [];
      for (const r of ltRows) {
        const lon = lonForLT(r.lt as number, now);
        const lats = r.lat != null ? [r.lat] : LAT_BINS.map((b) => b + 15);
        for (const lat of lats) {
          const day = isDaytime(lat, lon, now);
          cells.push(makeCell(lat, lon, r.avPot, day));
        }
      }
      return cells;
    }

    if (dayValue === null && ngtValue === null) return [];
    const cells: SimulationRow[] = [];
    for (const latBin of LAT_BINS) {
      for (const lonBin of LON_BINS) {
        const day = isDaytime(latBin + 15, lonBin + 15, now);
        const v = day ? dayValue : ngtValue;
        if (v === null) continue; // no value for this side → leave dark
        cells.push(makeCell(latBin + 15, lonBin + 15, v, day));
      }
    }
    return cells;
  }, [ltRows, dayValue, ngtValue, now, makeCell]);

  // 대전 위험은 전위의 크기(|AvPot|) 기준 — 음전위가 클수록 위험(빨강).
  const mapDataRange = useMemo(() => {
    const vals = (gridCells.length
      ? gridCells.map((c) => c.avPot)
      : [dayValue, ngtValue].filter((v): v is number => v !== null)
    );
    if (vals.length === 0) return { min: 0, max: 0 };
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [gridCells, dayValue, ngtValue]);

  // Minimal FilterState shim for the existing renderers (they read only a few fields).
  const renderFilters = useMemo<FilterState>(
    () => ({
      bodyMode: "multi",
      form: `${filter.node0Mat}/${filter.node1Mat} ${filter.res} N${filter.node}` as unknown as FilterState["form"],
      node0Material: filter.node0Mat as unknown as FilterState["node0Material"],
      boomMaterial: "KAPT",
      resistance: "R_INF",
      timeMode: "AUTO",
      viewMode: filter.viewMode,
      showAurora: filter.showAurora,
      showSatellite: filter.showSatellite,
      nth: null, tth: null, ne: null, te: null, ni: null, ti: null, alt: null,
      sey: null, mpd: null, pey: null, ipe: null, pee: null, msey: null, buc: null, sre: null,
    }),
    [filter],
  );

  // Public local demo (no DB write) in the REAL delivery format:
  // lat 2° (−87..89) × LT 1h (0.5..23.5) grid, CSV categorical values
  // (cond_Solar/Kp/재질/저항/type). Values mimic auroral-zone night charging.
  const handleLoadDemoLocal = useCallback(() => {
    const NODE0 = ["Al", "ALOX", "Al2O3", "Epoxy", "Gold"];
    const KP = ["2lt4", "SOLARmin_Kpge4"];
    const MAT_F: Record<string, number> = { Al: 0.6, ALOX: 1.0, Al2O3: 1.15, Epoxy: 1.4, Gold: 0.45 };
    const out: SpisPotentialRow[] = [];
    for (const node0Mat of NODE0)
      for (const kp of KP) {
        const kpBoost = kp === "SOLARmin_Kpge4" ? 1.8 : 1.0;
        for (let lat = -87; lat <= 89; lat += 2) {
          for (let lt = 0.5; lt < 24; lt += 1) {
            const night = lt >= 21 || lt < 6;
            const auroral = Math.abs(lat) > 60 && Math.abs(lat) < 80;
            let v = -(5 + Math.random() * 45); // quiet baseline
            if (auroral && night) v = -(800 + Math.random() * 2500) * kpBoost;
            else if (auroral) v = -(60 + Math.random() * 300);
            else if (night) v = -(30 + Math.random() * 120);
            v *= MAT_F[node0Mat];
            out.push({
              env: "AUR", res: "infinite", dn: lt >= 6 && lt < 18 ? "DAY" : "NGT",
              node0Mat, node1Mat: "", node: 0, form: "3U",
              condSolar: "SOLARmin", kp,
              lat, lt, avPot: Math.round(v * 10) / 10,
            });
          }
        }
      }
    setData(out);
    toast.success(`데모 데이터 로드: ${out.length.toLocaleString()}행 (위도 2°×LT 1h, 실데이터 형식)`);
  }, []);

  // Load from DB; when the DB is empty, fall back to the demo automatically
  // (요구사항: 아무것도 없으면 데모, 있으면 DB 데이터).
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const rows = await fetchSpisPotentials();
      if (rows.length === 0) {
        handleLoadDemoLocal();
        toast.info("DB가 비어 있어 데모 데이터를 표시합니다");
      } else {
        setData(rows);
      }
    } catch (e: any) {
      toast.error(`데이터 로드 실패: ${e.message ?? e}`);
    } finally {
      setIsLoading(false);
    }
  }, [handleLoadDemoLocal]);
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="flex w-full h-[calc(100vh-100px)] bg-background overflow-hidden">
      <Toaster richColors position="top-right" />
      <SpisControls
        filter={filter}
        onChange={setFilter}
        options={options}
        extraOptions={extraOptions}
        dayValue={dayValue}
        ngtValue={ngtValue}
        dataCount={data.length}
        isLoading={isLoading}
        onLoadDemoLocal={handleLoadDemoLocal}
        showExperimentalViews={showExperimentalViews}
      />
      {showExperimentalViews && filter.viewMode === "3D" ? (
        <Globe3D
          simData={gridCells}
          filters={renderFilters}
          mapDataRange={mapDataRange}
          now={now}
          cellSpan={cellSpan}
        />
      ) : (
        <WorldMap
          simData={gridCells}
          potentials={[]}
          filters={renderFilters}
          mapDataRange={mapDataRange}
          potentialRange={mapDataRange}
          now={now}
          cellSpan={cellSpan}
        />
      )}
    </div>
  );
}
