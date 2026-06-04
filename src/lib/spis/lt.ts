// Local Time helpers
import { subsolarPoint, solarDeclination } from '@/lib/spis/solar';

/** LT at given longitude for given UTC date. Range [0, 24). */
export function localTimeAtLon(lon: number, date: Date): number {
  const utc = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  return ((utc + lon / 15) % 24 + 24) % 24;
}

/** Longitude that corresponds to a given LT now. Range (-180, 180]. */
export function lonForLT(lt: number, date: Date): number {
  const utc = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  let lon = (lt - utc) * 15;
  lon = ((lon + 540) % 360) - 180;
  return lon;
}

/**
 * Terminator latitude at longitude L (the latitude where sun elevation = 0).
 * Returns { lat, allDay, allNight } — when allDay true, the entire meridian is day;
 * when allNight true, the entire meridian is night (polar regions).
 */
export function terminatorLatAtLon(lon: number, date: Date): { lat: number | null; allDay: boolean; allNight: boolean } {
  const sub = subsolarPoint(date);
  const decl = sub.lat;
  const DEG = Math.PI / 180;
  const dLon = (lon - sub.lon) * DEG;
  const tanDecl = Math.tan(decl * DEG);
  // elevation = 0 => sin(lat)*sin(decl) + cos(lat)*cos(decl)*cos(dLon) = 0
  // => tan(lat) = -cos(dLon)/tan(decl)
  if (Math.abs(tanDecl) < 1e-6) {
    // Equinox: terminator is along lon = sub.lon ± 90
    return { lat: null, allDay: Math.abs(Math.cos(dLon)) < 0, allNight: false };
  }
  const tanLat = -Math.cos(dLon) / tanDecl;
  const lat = Math.atan(tanLat) / DEG;
  return { lat, allDay: false, allNight: false };
}
