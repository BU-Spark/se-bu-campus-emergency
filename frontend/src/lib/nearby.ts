import { distanceInMeters, type Point } from '@/lib/campus';

type Located = { latitude: number | null; longitude: number | null };

export type Nearby<T> = { item: T; point: Point; meters: number };

/** Items with coordinates, closest to `point` first. Items without coordinates are left out. */
export function byDistance<T extends Located>(point: Point, items: T[]): Nearby<T>[] {
  return items
    .flatMap((item) => {
      if (item.latitude === null || item.longitude === null) return [];
      const at = { latitude: item.latitude, longitude: item.longitude };
      return [{ item, point: at, meters: distanceInMeters(point, at) }];
    })
    .sort((a, b) => a.meters - b.meters);
}

/** 83 → '80 m', 1234 → '1.2 km'. Rounded, because GPS and building coordinates are approximate. */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)} km`;
}

/**
 * Map region (centre and span in degrees) that shows `center` and every point in `points`, with some
 * padding. The span never drops below `minDelta`, so a nearby building doesn't zoom the map in too far.
 */
export function regionAround(center: Point, points: Point[], minDelta = 0.006) {
  const lats = [center.latitude, ...points.map((p) => p.latitude)];
  const lngs = [center.longitude, ...points.map((p) => p.longitude)];
  const latSpan = Math.max(...lats.map((lat) => Math.abs(lat - center.latitude))) * 2;
  const lngSpan = Math.max(...lngs.map((lng) => Math.abs(lng - center.longitude))) * 2;
  return {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: Math.max(minDelta, latSpan * 1.3),
    longitudeDelta: Math.max(minDelta, lngSpan * 1.3),
  };
}
