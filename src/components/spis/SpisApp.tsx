"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { ControlPanel } from "@/components/spis/ControlPanel";
import { WorldMap } from "@/components/spis/WorldMap";
import { Globe3D } from "@/components/spis/Globe3D";
import type { FilterState, SimulationRow, PotentialResult, TimeMode } from "@/lib/spis/types";
import { MATERIAL_PROP_VALUES } from "@/lib/spis/types";
import { fetchAllSimulationRows, fetchAllPotentialMatrix } from "@/lib/spis/dataApi";
import { generateSampleData, generatePotentialMatrix } from "@/lib/spis/excelParser";
import { isDaytime } from "@/lib/spis/solar";
import { useNow } from "@/hooks/useNow";

export default function SpisApp() {
  const [simData, setSimData] = useState<SimulationRow[]>([]);
  const [potentialMatrix, setPotentialMatrix] = useState<PotentialResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const now = useNow(10000);
  const [filters, setFilters] = useState<FilterState>({
    bodyMode: "single",
    form: "3U+Boom",
    node0Material: "AL2K",
    boomMaterial: "KAPT",
    resistance: "R_INF",
    timeMode: "AUTO",
    viewMode: "3D",
    showAurora: true,
    showSatellite: true,
    nth: null, tth: null, ne: null, te: null, ni: null, ti: null, alt: null,
    sey: MATERIAL_PROP_VALUES.sey[0],
    mpd: MATERIAL_PROP_VALUES.mpd[0],
    pey: MATERIAL_PROP_VALUES.pey[0],
    ipe: MATERIAL_PROP_VALUES.ipe[0],
    pee: MATERIAL_PROP_VALUES.pee[0],
    msey: MATERIAL_PROP_VALUES.msey[0],
    buc: MATERIAL_PROP_VALUES.buc[0],
    sre: MATERIAL_PROP_VALUES.sre[0],
  });

  const filteredSimData = useMemo(() => {
    return simData.filter((row) => {
      if (row.form !== filters.form) return false;
      if (row.node0Mat !== filters.node0Material) return false;

      const resolvedMode: TimeMode =
        filters.timeMode === "AUTO"
          ? (isDaytime(row.lat, row.lon, now) ? "DAY" : "NGT")
          : filters.timeMode;
      if (row.timeMode !== resolvedMode) return false;

      if (filters.nth !== null && row.nth !== filters.nth) return false;
      if (filters.tth !== null && row.tth !== filters.tth) return false;
      if (filters.ne !== null && row.ne !== filters.ne) return false;
      if (filters.te !== null && row.te !== filters.te) return false;
      if (filters.ni !== null && row.ni !== filters.ni) return false;
      if (filters.ti !== null && row.ti !== filters.ti) return false;
      if (filters.alt !== null && row.alt !== filters.alt) return false;
      if (filters.sey !== null && row.sey !== filters.sey) return false;
      if (filters.mpd !== null && row.mpd !== filters.mpd) return false;
      if (filters.pey !== null && row.pey !== filters.pey) return false;
      if (filters.ipe !== null && row.ipe !== filters.ipe) return false;
      if (filters.pee !== null && row.pee !== filters.pee) return false;
      if (filters.msey !== null && row.msey !== filters.msey) return false;
      if (filters.buc !== null && row.buc !== filters.buc) return false;
      if (filters.sre !== null && row.sre !== filters.sre) return false;
      return true;
    });
  }, [simData, filters, now]);

  const filteredPotentials = useMemo(() => {
    return potentialMatrix.filter((p) => p.form === filters.form);
  }, [potentialMatrix, filters.form]);

  const mapDataRange = useMemo(() => {
    const values = filteredSimData.map((r) => r.avPot);
    if (values.length === 0) return { min: 0, max: 100 };
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [filteredSimData]);

  const potentialRange = useMemo(() => {
    const values = filteredPotentials
      .flatMap((p) => Object.values(p.potentials))
      .filter((v): v is number => v !== null);
    if (values.length === 0) return { min: -500, max: 500 };
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [filteredPotentials]);

  // Load data from DB on mount (public read)
  const refreshFromDb = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sim, pot] = await Promise.all([fetchAllSimulationRows(), fetchAllPotentialMatrix()]);
      setSimData(sim);
      setPotentialMatrix(pot);
    } catch (e: any) {
      toast.error(`데이터 로드 실패: ${e.message ?? e}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFromDb();
  }, [refreshFromDb]);

  // Public: load sample data into local state only (no auth, no DB write)
  const handleLoadDemoLocal = useCallback(() => {
    const sim = generateSampleData();
    const matrix = generatePotentialMatrix();
    setSimData(sim);
    setPotentialMatrix(matrix);
    toast.success(`데모 데이터 로드: ${sim.length}개 시뮬레이션 (로컬 미리보기)`);
  }, []);

  return (
    <div className="flex w-full h-[calc(100vh-100px)] bg-background overflow-hidden">
      <Toaster richColors position="top-right" />
      <ControlPanel
        filters={filters}
        onFilterChange={setFilters}
        onLoadDemoLocal={handleLoadDemoLocal}
        filteredData={filteredSimData}
        dataRange={mapDataRange}
        dataCount={simData.length}
        isLoading={isLoading}
        now={now}
      />
      {filters.viewMode === "3D" ? (
        <Globe3D
          simData={filteredSimData}
          filters={filters}
          mapDataRange={mapDataRange}
          now={now}
        />
      ) : (
        <WorldMap
          simData={filteredSimData}
          potentials={filteredPotentials}
          filters={filters}
          mapDataRange={mapDataRange}
          potentialRange={potentialRange}
          now={now}
        />
      )}
    </div>
  );
}
