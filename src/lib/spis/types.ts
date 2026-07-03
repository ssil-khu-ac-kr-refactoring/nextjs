// FORM types from Excel
export type FormType = '3U+Boom' | '3U' | '1U' | 'Thin Panel';

// Node0 materials from Excel
export type MaterialType = 'AL2K' | 'ALOX' | 'GOLD' | 'GOLD (2k)' | 'KAPT' | 'EPOX' | 'Al2O3' | 'CERS';

// Body configuration
export type BodyMode = 'single' | 'multi';

// Boom material (Node1 material for multi-body)
export type BoomMaterialType = 'KAPT' | 'AL2K';

// Resistance - only for multi-body
export type ResistanceType = 'R_INF' | 'R_1M';

// Day/Night
export type TimeMode = 'DAY' | 'NGT';

// UI-level time selection: AUTO uses real-time terminator per cell.
export type TimeModeUI = 'AUTO' | 'DAY' | 'NGT';

// Map view mode
export type ViewMode = '2D' | '3D';

// Material property keys (these are INPUT parameters, not results)
export type MaterialPropKey = 'sey' | 'mpd' | 'pey' | 'ipe' | 'pee' | 'msey' | 'buc' | 'sre';

// Material property definitions for UI selectors
export interface MaterialPropOption {
  key: MaterialPropKey;
  label: string;
  fullLabel: string;
  unit: string;
}

export const MATERIAL_PROP_OPTIONS: MaterialPropOption[] = [
  { key: 'sey', label: 'SEY', fullLabel: 'Secondary Electron Yield', unit: '[-]' },
  { key: 'mpd', label: 'MPD', fullLabel: 'Max Potential Difference', unit: '[V]' },
  { key: 'pey', label: 'PEY', fullLabel: 'Photoelectron Yield', unit: '[A/m²]' },
  { key: 'ipe', label: 'IPE', fullLabel: 'Ion Primary Energy', unit: '[keV]' },
  { key: 'pee', label: 'PEE', fullLabel: 'Primary Electron Energy', unit: '[keV]' },
  { key: 'msey', label: 'MSEY', fullLabel: 'Max Secondary Electron Yield', unit: '[-]' },
  { key: 'buc', label: 'BUC', fullLabel: 'Bulk Conductivity', unit: '[Ω⁻¹·m⁻¹]' },
  { key: 'sre', label: 'SRE', fullLabel: 'Surface Resistivity', unit: '[Ω]' },
];

// A full simulation data row (one row from the Excel)
export interface SimulationRow {
  // Environment input parameters
  nth: number;
  tth: number;
  ne: number;
  te: number;
  ni: number;
  ti: number;
  alt: number;

  // Material properties (INPUT parameters - selectable)
  sey: number | null;
  mpd: number | null;
  pey: number | null;
  ipe: number | null;
  pee: number | null;
  msey: number | null;
  buc: number | null;
  sre: number | null;

  // Location
  lat: number;
  lon: number;

  // RESULT: Average Potential
  avPot: number;

  // Categorization
  form: FormType;
  node0Mat: MaterialType;
  timeMode: TimeMode;
}

// Input parameter definition for UI selectors (environment params)
export interface InputParamOption {
  key: keyof Pick<SimulationRow, 'nth' | 'tth' | 'ne' | 'te' | 'ni' | 'ti' | 'alt'>;
  label: string;
  unit: string;
}

export const INPUT_PARAM_OPTIONS: InputParamOption[] = [
  { key: 'nth', label: 'Nth (열전자 밀도)', unit: 'm⁻³' },
  { key: 'tth', label: 'Tth (열전자 온도)', unit: 'eV' },
  { key: 'ne', label: 'Ne (전자 밀도)', unit: 'm⁻³' },
  { key: 'te', label: 'Te (전자 온도)', unit: 'eV' },
  { key: 'ni', label: 'Ni (이온 밀도)', unit: 'm⁻³' },
  { key: 'ti', label: 'Ti (이온 온도)', unit: 'eV' },
  { key: 'alt', label: 'ALT (고도)', unit: 'km' },
];

// Excel 스펙 기반 환경 파라미터 기본값 (드롭다운의 첫 옵션)
export const ENV_FIXED_VALUES: Record<InputParamOption['key'], number> = {
  nth: 1e7,
  tth: 11000,
  ne: 1e8,
  te: 0.2,
  ni: 1e8,
  ti: 0.2,
  alt: 550,
};

// 환경 파라미터 선택 가능 옵션 (드롭다운)
export const ENV_PARAM_VALUES: Record<InputParamOption['key'], number[]> = {
  nth: [1e6, 1e7, 1e8, 1e9],
  tth: [1000, 5000, 11000, 20000],
  ne: [1e7, 1e8, 1e9, 1e10],
  te: [0.1, 0.2, 0.5, 1.0, 2.0],
  ni: [1e7, 1e8, 1e9, 1e10],
  ti: [0.1, 0.2, 0.5, 1.0, 2.0],
  alt: [400, 500, 550, 600, 700, 800],
};

// Excel 스펙 기반 재질 물성 고정 옵션 (개별 선택)
export const MATERIAL_PROP_VALUES: Record<MaterialPropKey, number[]> = {
  sey: [0.244, 0.413, 0.455, 0.68],
  mpd: [2700, 2000, 9000],
  pey: [4e-5, 2.9e-5, 7.6e-5, 2e-5],
  ipe: [230, 135, 140, 60],
  pee: [0.3, 0.8, 0.35, 0.2, 0.45],
  msey: [0.97, 1.3, 1.6, 1.9, 3.2, 5.5, 6.4],
  buc: [-1, 1e-14, 1e-15, 4.3e-14],
  sre: [-1, 1e14, 1e15],
};

// 30° 그리드 좌표
export const LAT_BINS = [-90, -60, -30, 0, 30, 60]; // 6개 (각 셀은 30° 높이)
export const LON_BINS = [-180, -150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150]; // 12개

export interface FilterState {
  bodyMode: BodyMode;
  form: FormType;
  node0Material: MaterialType;
  boomMaterial: BoomMaterialType;
  resistance: ResistanceType;
  timeMode: TimeModeUI;
  viewMode: ViewMode;
  showAurora: boolean;
  showSatellite: boolean;
  // Environment param filters
  nth: number | null;
  tth: number | null;
  ne: number | null;
  te: number | null;
  ni: number | null;
  ti: number | null;
  alt: number | null;
  // Material property filters
  sey: number | null;
  mpd: number | null;
  pey: number | null;
  ipe: number | null;
  pee: number | null;
  msey: number | null;
  buc: number | null;
  sre: number | null;
}

// All_node matrix: one row per (FORM × Node0_Mat), with potentials for each config
export interface PotentialResult {
  form: FormType;
  node0Mat: MaterialType;
  // Keys like "SINGLE_DAY", "SINGLE_NGT", "KAPT_R_INF_DAY", "KAPT_R_1M_NGT", "AL2K_R_INF_DAY", etc.
  potentials: Record<string, number | null>;
}

// All config columns for the matrix table display
export const ALL_NODE_COLUMNS = [
  { group: 'SINGLE', resistance: null, configs: [
    { key: 'SINGLE_DAY', label: 'DAY' },
    { key: 'SINGLE_NGT', label: 'NGT' },
  ]},
  { group: 'KAPT_Boom', resistance: 'R = ∞', configs: [
    { key: 'KAPT_R_INF_DAY', label: 'DAY' },
    { key: 'KAPT_R_INF_NGT', label: 'NGT' },
  ]},
  { group: 'KAPT_Boom', resistance: 'R = 1MΩ', configs: [
    { key: 'KAPT_R_1M_DAY', label: 'DAY' },
    { key: 'KAPT_R_1M_NGT', label: 'NGT' },
  ]},
  { group: 'AL2K_Boom', resistance: 'R = ∞', configs: [
    { key: 'AL2K_R_INF_DAY', label: 'DAY' },
    { key: 'AL2K_R_INF_NGT', label: 'NGT' },
  ]},
  { group: 'AL2K_Boom', resistance: 'R = 1MΩ', configs: [
    { key: 'AL2K_R_1M_DAY', label: 'DAY' },
    { key: 'AL2K_R_1M_NGT', label: 'NGT' },
  ]},
];

export const FORM_OPTIONS: FormType[] = ['3U+Boom', '3U', '1U', 'Thin Panel'];
export const MATERIAL_OPTIONS: MaterialType[] = ['AL2K', 'ALOX', 'GOLD', 'GOLD (2k)', 'KAPT', 'EPOX', 'Al2O3', 'CERS'];
export const BOOM_MATERIAL_OPTIONS: BoomMaterialType[] = ['KAPT', 'AL2K'];
export const RESISTANCE_OPTIONS: { value: ResistanceType; label: string }[] = [
  { value: 'R_INF', label: 'R = ∞' },
  { value: 'R_1M', label: 'R = 1MΩ' },
];

export function getPotentialKey(filters: FilterState): string {
  if (filters.bodyMode === 'single') {
    return `SINGLE_${filters.timeMode}`;
  }
  return `${filters.boomMaterial}_${filters.resistance}_${filters.timeMode}`;
}

// =====================================================================
// SPIS All_node data model (Hancell-exported workbook)
// Long format: one average-potential value per
// (env, resistance, day/night, node0 material, node1/boom material, node).
// No spatial dimension — the globe paints the day hemisphere with the DAY
// value and the night hemisphere with the NGT value (boundary by local time).
// =====================================================================

export interface SpisPotentialRow {
  env: string;            // e.g. "AUR"
  res: string;            // "R0" | "R1"
  dn: TimeMode;           // "DAY" | "NGT"
  node0Mat: string;
  node1Mat: string;
  node: number;           // 0 | 1
  avPot: number;
  // Optional spatial dimension. The client delivers position as LOCAL TIME (LT),
  // not longitude. When `lt` is present we convert it to a geographic longitude
  // at render time via lonForLT(lt, now) and place the value on the 2D/3D map.
  // `lat` is optional: when absent the value is painted across all latitude bands.
  lt?: number | null;     // local time, 0..24 (geographic, sun-relative)
  lat?: number | null;    // latitude, -90..90
  // Environment parameters (client's real data format — all optional).
  condSolar?: string | null; // e.g. "SOLARmin" | "SOLARmax"
  kp?: string | null;        // e.g. "2lt4"
  eN?: number | null;        // electron density
  eT?: number | null;        // electron temperature
  iN?: number | null;        // ion density
  iT?: number | null;        // ion temperature
  form?: string | null;      // satellite form (CSV "type"), e.g. "3U" | "3U+Boom"
  // Any UNRECOGNIZED Excel columns, keyed by the original header name.
  // New parameters flow through here automatically (no code change needed).
  extras?: Record<string, string | number> | null;
}

// UI selection for the SPIS globe (selectors derived from the data at runtime).
export interface SpisFilter {
  node0Mat: string;
  node1Mat: string;
  res: string;
  node: number;
  // Environment parameter selections (empty string = not applicable / no data).
  condSolar: string;
  kp: string;
  // Selections for auto-discovered extras columns: { header: selectedValue }.
  // Empty string = 전체 (no filtering on that key).
  extraSel: Record<string, string>;
  viewMode: ViewMode;     // '2D' | '3D'
  showAurora: boolean;
  showSatellite: boolean;
}
