import { distanceInMeters, findCampus } from '@/lib/campus';

describe('campus detection', () => {
  it('measures distance between two points', () => {
    // Marsh Plaza to the Medical Campus is roughly 3.3 km.
    const meters = distanceInMeters(
      { latitude: 42.3503, longitude: -71.106 },
      { latitude: 42.3354, longitude: -71.0729 }
    );
    expect(meters).toBeGreaterThan(3000);
    expect(meters).toBeLessThan(3600);
  });

  it('detects the Charles River Campus', () => {
    expect(findCampus({ latitude: 42.3503, longitude: -71.106 })).toBe('CRC'); // Marsh Plaza
    expect(findCampus({ latitude: 42.3528, longitude: -71.118 })).toBe('CRC'); // West Campus
  });

  it('detects the Medical Campus', () => {
    expect(findCampus({ latitude: 42.3355, longitude: -71.0725 })).toBe('MED');
  });

  it('returns undefined off campus', () => {
    expect(findCampus({ latitude: 42.3744, longitude: -71.1169 })).toBeUndefined(); // Harvard Yard
  });
});
