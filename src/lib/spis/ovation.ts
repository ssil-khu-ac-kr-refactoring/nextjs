// NOAA OVATION aurora forecast fetch
// Data: https://services.swpc.noaa.gov/json/ovation_aurora_latest.json
// Returns a grid of [lon (0..359), lat (-90..90), aurora % (0..100)]

export interface OvationPoint {
  lon: number; // -180..180
  lat: number; // -90..90
  value: number; // 0..100
}

export interface OvationData {
  observationTime: string;
  forecastTime: string;
  points: OvationPoint[];
}

const URL = 'https://services.swpc.noaa.gov/json/ovation_aurora_latest.json';

export async function fetchOvation(): Promise<OvationData> {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`OVATION fetch failed: ${res.status}`);
  const json = await res.json() as {
    'Observation Time': string;
    'Forecast Time': string;
    coordinates: [number, number, number][]; // [lon (0..359), lat (-90..90), value]
  };

  const points: OvationPoint[] = json.coordinates
    .filter((c) => c[2] > 0) // skip zero values to keep it light
    .map(([lon, lat, value]) => ({
      lon: lon > 180 ? lon - 360 : lon,
      lat,
      value,
    }));

  return {
    observationTime: json['Observation Time'],
    forecastTime: json['Forecast Time'],
    points,
  };
}
