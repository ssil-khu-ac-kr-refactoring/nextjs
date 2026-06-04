import type { SimulationRow, PotentialResult, FormType, MaterialType, TimeMode } from '@/lib/spis/types';

// Predefined material property sets per material
const MATERIAL_PROPS: Record<string, { sey: number; mpd: number; pey: number; ipe: number; pee: number; msey: number; buc: number | null; sre: number | null }[]> = {
  'AL2K': [
    { sey: 0.244, mpd: 2700, pey: 4e-5, ipe: 230, pee: 0.3, msey: 0.97, buc: -1, sre: -1 },
    { sey: 0.244, mpd: 2000, pey: 4e-5, ipe: 230, pee: 0.35, msey: 3.2, buc: -1, sre: -1 },
    { sey: 0.413, mpd: 2000, pey: 2.9e-5, ipe: 135, pee: 0.8, msey: 1.3, buc: -1, sre: -1 },
    { sey: 0.455, mpd: 2000, pey: 2e-5, ipe: 140, pee: 0.2, msey: 1.9, buc: 1e-15, sre: 1e15 },
    { sey: 0.455, mpd: 9000, pey: 2e-5, ipe: 140, pee: 0.35, msey: 1.6, buc: 1e-14, sre: 1e14 },
    { sey: 0.68, mpd: 2000, pey: 7.6e-5, ipe: 60, pee: 0.45, msey: 6.4, buc: 4.3e-14, sre: 1e15 },
    { sey: 0.244, mpd: 9000, pey: 2e-5, ipe: 230, pee: 0.8, msey: 5.5, buc: 1e-13, sre: 1e15 },
  ],
  'ALOX': [
    { sey: 0.244, mpd: 2700, pey: 4e-5, ipe: 230, pee: 0.3, msey: 0.97, buc: -1, sre: -1 },
    { sey: 0.455, mpd: 2000, pey: 2e-5, ipe: 140, pee: 0.2, msey: 1.9, buc: 1e-15, sre: 1e15 },
    { sey: 0.68, mpd: 2000, pey: 7.6e-5, ipe: 60, pee: 0.45, msey: 6.4, buc: 4.3e-14, sre: 1e15 },
  ],
  'GOLD': [
    { sey: 0.455, mpd: 9000, pey: 2e-5, ipe: 140, pee: 0.35, msey: 1.6, buc: 1e-14, sre: 1e14 },
    { sey: 0.244, mpd: 9000, pey: 2e-5, ipe: 230, pee: 0.8, msey: 5.5, buc: 1e-13, sre: 1e15 },
  ],
  'GOLD (2k)': [
    { sey: 0.244, mpd: 2700, pey: 4e-5, ipe: 230, pee: 0.3, msey: 0.97, buc: -1, sre: -1 },
  ],
  'KAPT': [
    { sey: 0.455, mpd: 2000, pey: 2e-5, ipe: 140, pee: 0.2, msey: 1.9, buc: 1e-15, sre: 1e15 },
    { sey: 0.244, mpd: 2000, pey: 4e-5, ipe: 230, pee: 0.35, msey: 3.2, buc: -1, sre: -1 },
    { sey: 0.413, mpd: 2000, pey: 2.9e-5, ipe: 135, pee: 0.8, msey: 1.3, buc: -1, sre: -1 },
  ],
  'EPOX': [
    { sey: 0.68, mpd: 2000, pey: 7.6e-5, ipe: 60, pee: 0.45, msey: 6.4, buc: 4.3e-14, sre: 1e15 },
    { sey: 0.455, mpd: 9000, pey: 2e-5, ipe: 140, pee: 0.35, msey: 1.6, buc: 1e-14, sre: 1e14 },
  ],
  'Al2O3': [
    { sey: 0.244, mpd: 2000, pey: 4e-5, ipe: 230, pee: 0.35, msey: 3.2, buc: -1, sre: -1 },
    { sey: 0.244, mpd: 9000, pey: 2e-5, ipe: 230, pee: 0.8, msey: 5.5, buc: 1e-13, sre: 1e15 },
  ],
  'CERS': [
    { sey: 0.413, mpd: 2000, pey: 2.9e-5, ipe: 135, pee: 0.8, msey: 1.3, buc: -1, sre: -1 },
    { sey: 0.455, mpd: 2000, pey: 2e-5, ipe: 140, pee: 0.2, msey: 1.9, buc: 1e-15, sre: 1e15 },
  ],
};

export function generateSampleData(): SimulationRow[] {
  const forms: FormType[] = ['3U+Boom', '3U', '1U', 'Thin Panel'];
  const materials: MaterialType[] = ['AL2K', 'ALOX', 'GOLD', 'GOLD (2k)', 'KAPT', 'EPOX', 'Al2O3', 'CERS'];
  const latValues = [-60, -30, 0, 30, 60, 90];
  const lonValues = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180];
  const timeModes: TimeMode[] = ['DAY', 'NGT'];

  const rows: SimulationRow[] = [];

  for (const form of forms) {
    for (const mat of materials) {
      const propSets = MATERIAL_PROPS[mat] || [];
      for (const props of propSets) {
        for (const timeMode of timeModes) {
          for (const lat of latValues) {
            for (const lon of lonValues) {
              const latFactor = 1 + Math.abs(lat) / 90 * 0.5;
              const timeFactor = timeMode === 'NGT' ? 0.6 : 1.0;
              const ngtShift = timeMode === 'NGT' ? -150 : 0;

              // Result: Average Potential depends on all inputs
              const basePot = -300 + (props.mpd / 20) + (props.sey * 200) - (props.pee * 100);
              const avPot = Math.round((basePot * latFactor * timeFactor + ngtShift + (Math.random() * 100 - 50)));

              rows.push({
                nth: 1e7, tth: 11000, ne: 1e8, te: 0.2, ni: 1e8, ti: 0.2, alt: 450,
                lat, lon,
                sey: props.sey,
                mpd: props.mpd,
                pey: props.pey,
                ipe: props.ipe,
                pee: props.pee,
                msey: props.msey,
                buc: props.buc,
                sre: props.sre,
                avPot,
                form, node0Mat: mat, timeMode,
              });
            }
          }
        }
      }
    }
  }
  return rows;
}

// Generate All_node matrix: Average Potential per (FORM × Node0_Mat × Config)
export function generatePotentialMatrix(): PotentialResult[] {
  const forms: FormType[] = ['3U+Boom', '3U', '1U', 'Thin Panel'];
  const materials: MaterialType[] = ['AL2K', 'ALOX', 'GOLD', 'GOLD (2k)', 'KAPT', 'EPOX', 'Al2O3', 'CERS'];
  const configs = [
    'SINGLE_DAY', 'SINGLE_NGT',
    'KAPT_R_INF_DAY', 'KAPT_R_INF_NGT', 'KAPT_R_1M_DAY', 'KAPT_R_1M_NGT',
    'AL2K_R_INF_DAY', 'AL2K_R_INF_NGT', 'AL2K_R_1M_DAY', 'AL2K_R_1M_NGT',
  ];

  const data: PotentialResult[] = [];

  forms.forEach((form, fi) => {
    materials.forEach((mat, mi) => {
      const potentials: Record<string, number | null> = {};
      const base = -500 + fi * 150 + mi * 80;

      configs.forEach((cfg) => {
        const isNgt = cfg.includes('NGT');
        const isInf = cfg.includes('R_INF');
        const isKapt = cfg.includes('KAPT');
        const isSingle = cfg.includes('SINGLE');

        if (mat === 'GOLD (2k)') {
          potentials[cfg] = null;
          return;
        }

        let val = base;
        val += isNgt ? -80 : 80;
        if (!isSingle) {
          val += isKapt ? 50 : -50;
          val += isInf ? 120 : -120;
        }
        val += Math.round(Math.random() * 100 - 50);
        potentials[cfg] = val;
      });

      data.push({ form, node0Mat: mat, potentials });
    });
  });

  return data;
}

export function getUniqueValues(data: SimulationRow[], key: keyof SimulationRow): number[] {
  const set = new Set<number>();
  data.forEach((r) => { const v = r[key]; if (typeof v === 'number') set.add(v); });
  return Array.from(set).sort((a, b) => a - b);
}
