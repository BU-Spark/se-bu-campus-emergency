export type Campus = 'CRC' | 'MED';

export type Point = { latitude: number; longitude: number };

/**
 * Approximate centre and radius of each BU campus. The circles are only used to tell which campus the
 * user is on; building-level detection will use the buildings table once it exists.
 */
export const campuses: Record<Campus, Point & { name: string; radiusMeters: number }> = {
  CRC: { name: 'Charles River Campus', latitude: 42.3505, longitude: -71.1054, radiusMeters: 1600 },
  MED: { name: 'Medical Campus', latitude: 42.3354, longitude: -71.0729, radiusMeters: 800 },
};

const EARTH_RADIUS_METERS = 6_371_000;

/** Great-circle (haversine) distance between two points, in metres. */
export function distanceInMeters(a: Point, b: Point): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

/** The campus whose area contains `point`, or undefined when the point is off campus. */
export function findCampus(point: Point): Campus | undefined {
  return (Object.keys(campuses) as Campus[]).find(
    (id) => distanceInMeters(point, campuses[id]) <= campuses[id].radiusMeters
  );
}
