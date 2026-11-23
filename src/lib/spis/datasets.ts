export const SPIS_DATASET_IDS = ['DMSP_ONLY', 'DMSP_IRI2016'] as const;

export type SpisDatasetId = (typeof SPIS_DATASET_IDS)[number];

export const DEFAULT_SPIS_DATASET: SpisDatasetId = 'DMSP_ONLY';

export const SPIS_DATASETS: ReadonlyArray<{
  id: SpisDatasetId;
  label: string;
  description: string;
  expectedRows?: number;
  expectedEnvironments?: number;
  expectedMaterialsPerEnvironment?: number;
}> = [
  {
    id: 'DMSP_ONLY',
    label: 'DMSP-only',
    description: 'High-energy plasma conditions derived from DMSP SSJ/5 observations.',
  },
  {
    id: 'DMSP_IRI2016',
    label: 'DMSP + IRI2016',
    description: 'DMSP-based high-energy plasma with IRI2016 background ionospheric plasma.',
    expectedRows: 17_626,
    expectedEnvironments: 2_518,
    expectedMaterialsPerEnvironment: 7,
  },
];

export function isSpisDatasetId(value: unknown): value is SpisDatasetId {
  return typeof value === 'string' && (SPIS_DATASET_IDS as readonly string[]).includes(value);
}

export function getSpisDataset(datasetId: SpisDatasetId) {
  return SPIS_DATASETS.find((dataset) => dataset.id === datasetId)!;
}
