// Solar position utilities for day/night terminator
// All angles in degrees unless noted.

const DEG = Math.PI / 180;

/** Day-of-year (1..366) in UTC */
function dayOfYearUTC(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor((date.getTime() - start) / 86400000);
}

/** Approximate solar declination (deg) for a given date. */
export function solarDeclination(date: Date): number {
  const N = dayOfYearUTC(date);
  // Cooper's equation
  return 23.44 * Math.sin(((360 / 365) * (N - 81)) * DEG);
}

/** Equation of time (minutes). */
function equationOfTime(date: Date): number {
  const N = dayOfYearUTC(date);
  const B = ((360 / 365) * (N - 81)) * DEG;
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

/** Subsolar point (lat, lon in degrees). */
export function subsolarPoint(date: Date): { lat: number; lon: number } {
  const decl = solarDeclination(date);
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const eot = equationOfTime(date);
  // Solar noon at longitude L occurs when UTC = 12 - L/15 - eot/60
  // => subsolar longitude = (12 - utcHours - eot/60) * 15
  let lon = (12 - utcHours - eot / 60) * 15;
  // wrap to [-180, 180]
  lon = ((lon + 540) % 360) - 180;
  return { lat: decl, lon };
}

/**
 * Solar elevation angle (deg) at (lat, lon) for a given date.
 * Positive = above horizon (day). Negative = below horizon (night).
 */
export function solarElevation(lat: number, lon: number, date: Date): number {
  const sub = subsolarPoint(date);
  const phi1 = lat * DEG;
  const phi2 = sub.lat * DEG;
  const dLon = (lon - sub.lon) * DEG;
  const cosZ = Math.sin(phi1) * Math.sin(phi2) + Math.cos(phi1) * Math.cos(phi2) * Math.cos(dLon);
  return Math.asin(Math.max(-1, Math.min(1, cosZ))) / DEG;
}

/** True if the location is in daylight at the given date (sun above horizon). */
export function isDaytime(lat: number, lon: number, date: Date): boolean {
  return solarElevation(lat, lon, date) > 0;
}
