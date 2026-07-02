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

export default function SpisApp() {
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
      return next;
    });
  }, [data, options]);

  // Shared row predicate for the current selection (env params included when present).
  const matchesFilter = useCallback(
    (d: SpisPotentialRow) =>
      d.node0Mat === filter.node0Mat &&
      (options.node1.length === 0 || d.node1Mat === filter.node1Mat) &&
      (options.res.length === 0 || d.res === filter.res) &&
      (options.node.length === 0 || d.node === filter.node) &&
      (options.condSolar.length === 0 || (d.condSolar ?? "") === filter.condSolar) &&
      (options.kp.length === 0 || (d.kp ?? "") === filter.kp),
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

  // Build the lat/lon grid the renderers consume.
  //  • If the data carries LT → convert LT to a geographic longitude (lonForLT, now-relative)
  //    and place each value there. When a row has no latitude, paint it across all bands.
  //  • Otherwise → fall back to DAY/NGT synthesis split by the real-time solar terminator.
  const gridCells = useMemo<SimulationRow[]>(() => {
    if (ltRows.length > 0) {
      const cells: SimulationRow[] = [];
      for (const r of ltRows) {
        const lon = lonForLT(r.lt as number, now);
        const lats = r.lat != null ? [Math.floor(r.lat / 30) * 30] : LAT_BINS;
        for (const latBin of lats) {
          const day = isDaytime(latBin + 15, lon, now);
          cells.push(makeCell(latBin, lon, r.avPot, day));
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
        cells.push(makeCell(latBin, lonBin, v, day));
      }
    }
    return cells;
  }, [ltRows, dayValue, ngtValue, now, makeCell]);

  const mapDataRange = useMemo(() => {
    const vals = gridCells.length
      ? gridCells.map((c) => c.avPot)
      : [dayValue, ngtValue].filter((v): v is number => v !== null);
    if (vals.length === 0) return { min: 0, max: 100 };
    let min = Math.min(...vals);
    let max = Math.max(...vals);
    if (min === max) {
      min -= 1;
      max += 1;
    }
    return { min, max };
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

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setData(await fetchSpisPotentials());
    } catch (e: any) {
      toast.error(`데이터 로드 실패: ${e.message ?? e}`);
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Public local demo (no DB write): random values across the option set.
  const handleLoadDemoLocal = useCallback(() => {
    const NODE0 = ["AL2K", "ALOX", "GOLD", "GOLD (2k)", "KAPT", "EPOX", "Al2O3", "CERS"];
    const NODE1 = ["AL2K", "KAPT"];
    const RES = ["R0", "R1"];
    const NODES = [0, 1];
    const DN: ("DAY" | "NGT")[] = ["DAY", "NGT"];
    const out: SpisPotentialRow[] = [];
    for (const node0Mat of NODE0)
      for (const node1Mat of NODE1)
        for (const res of RES)
          for (const node of NODES)
            for (const dn of DN) {
              const base = dn === "NGT" ? -12000 : -5000;
              out.push({ env: "AUR", res, dn, node0Mat, node1Mat, node, avPot: Math.round(base * (0.5 + Math.random()) * 10) / 10 });
            }
    setData(out);
    toast.success(`데모 데이터 로드: ${out.length}개 (로컬 미리보기)`);
  }, []);

  return (
    <div className="flex w-full h-[calc(100vh-100px)] bg-background overflow-hidden">
      <Toaster richColors position="top-right" />
      <SpisControls
        filter={filter}
        onChange={setFilter}
        options={options}
        dayValue={dayValue}
        ngtValue={ngtValue}
        dataCount={data.length}
        isLoading={isLoading}
        onLoadDemoLocal={handleLoadDemoLocal}
      />
      {filter.viewMode === "3D" ? (
        <Globe3D simData={gridCells} filters={renderFilters} mapDataRange={mapDataRange} now={now} />
      ) : (
        <WorldMap
          simData={gridCells}
          potentials={[]}
          filters={renderFilters}
          mapDataRange={mapDataRange}
          potentialRange={mapDataRange}
          now={now}
        />
      )}
    </div>
  );
}
