import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { NearbyBuildings } from '@/components/emergency/nearby-buildings';
import { EmergencyScreen } from '@/components/emergency/screen';
import { useCurrentLocation, type CurrentLocation } from '@/hooks/use-current-location';
import { useAedBuildings } from '@/hooks/use-emergency-data';
import { byDistance, formatDistance, regionAround } from '@/lib/nearby';
import type { AedBuilding } from '@/services/emergency-data';

jest.setTimeout(15000);

jest.mock('@/hooks/use-emergency-data', () => ({ useAedBuildings: jest.fn() }));
jest.mock('@/hooks/use-current-location', () => ({ useCurrentLocation: jest.fn() }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});
const building = (id: string, name: string, latitude: number | null, longitude: number | null, aeds = 1) =>
  ({
    id,
    name,
    address: name,
    campus: 'CRC',
    latitude,
    longitude,
    aeds: Array.from({ length: aeds }, (_, i) => ({
      id: `${id}-${i}`,
      floor: '01',
      room: '100',
      location_note: '',
      sort_order: i,
    })),
  }) satisfies AedBuilding;
const buildings = [
  building('501', 'Fitness and Recreation Center', 42.35182, -71.116462, 2),
  building('619', 'Mugar Memorial Library', 42.351012, -71.107992),
  building('621', 'George Sherman Union', 42.350967, -71.108976),
  building('909', 'Talbot Building', 42.335781, -71.071689),
  building('999', 'No Coordinates Hall', null, null),
];
// Outside Mugar Library on Commonwealth Avenue.
const atMugar = { latitude: 42.3508, longitude: -71.108 };
const located = (coords = atMugar, details: { campus?: 'CRC'; address?: string } = {}): CurrentLocation => ({
  status: 'ready',
  coords: { ...coords, accuracy: 10 },
  ...details,
  refresh: jest.fn(),
});
const ready = <T,>(data: T) => ({ data, loading: false, error: undefined, reload: jest.fn() });

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useAedBuildings).mockReturnValue(ready(buildings));
  jest.mocked(useCurrentLocation).mockReturnValue(located());
});

describe('distance helpers', () => {
  it('sorts by distance and skips buildings without coordinates', () => {
    const sorted = byDistance(atMugar, buildings);
    expect(sorted.map(({ item }) => item.id)).toEqual(['619', '621', '501', '909']);
    expect(sorted[0].meters).toBeLessThan(50);
    expect(sorted[0].point).toEqual({ latitude: 42.351012, longitude: -71.107992 });
  });

  it('formats rounded distances', () => {
    expect(formatDistance(3)).toBe('10 m');
    expect(formatDistance(83)).toBe('80 m');
    expect(formatDistance(1234)).toBe('1.2 km');
    expect(formatDistance(23_456)).toBe('23 km');
  });

  it('builds a map region that includes every point, with a minimum zoom', () => {
    const region = regionAround(atMugar, [{ latitude: 42.36, longitude: -71.1 }]);
    expect(region.latitude).toBe(atMugar.latitude);
    expect(region.latitudeDelta / 2).toBeGreaterThan(42.36 - atMugar.latitude);
    expect(region.longitudeDelta / 2).toBeGreaterThan(-71.1 - atMugar.longitude);
    expect(regionAround(atMugar, []).latitudeDelta).toBe(0.006);
  });
});

describe('nearby map on the home screen', () => {
  it('names the nearest building and pins the closest buildings with coordinates', async () => {
    await render(<NearbyBuildings />);
    expect(screen.getByText('Near Mugar Memorial Library')).toBeTruthy();
    expect(screen.getByText('Nearby BU buildings are marked in red.')).toBeTruthy();
    expect(screen.getByTestId('map')).toBeTruthy();
    expect(screen.getByTestId('pin Talbot Building')).toBeTruthy();
    expect(screen.queryByTestId('pin No Coordinates Hall')).toBeNull();
    // The AED list lives in the AED finder, not on the home screen; the only button expands the map.
    expect(screen.getAllByRole('button').map((b) => b.props.accessibilityLabel)).toEqual([
      'Expand map of BU buildings',
    ]);
  });

  it('expands to a full-screen map of every building, and opens a building from its pin', async () => {
    await render(<NearbyBuildings />);
    expect(screen.queryByText('BU Buildings with AEDs')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Expand map of BU buildings' }));
    expect(screen.getByText('BU Buildings with AEDs')).toBeTruthy();
    expect(screen.getAllByTestId('map')).toHaveLength(2);
    expect(screen.getAllByTestId(/^pin /)).toHaveLength(4 + 4); // preview and full map, both with all 4 located

    await fireEvent(screen.getAllByTestId('pin Talbot Building')[1], 'calloutPress');
    expect(router.push).toHaveBeenCalledWith({ pathname: '/aeds', params: { building: '909' } });
    expect(screen.queryByText('BU Buildings with AEDs')).toBeNull();
  });

  it('closes the full-screen map with Done', async () => {
    await render(<NearbyBuildings />);
    await fireEvent.press(screen.getByRole('button', { name: 'Expand map of BU buildings' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByText('BU Buildings with AEDs')).toBeNull();
  });

  it('says how far away BU is when the user is off campus', async () => {
    jest.mocked(useCurrentLocation).mockReturnValue(located({ latitude: 42.3736, longitude: -71.1097 }));
    await render(<NearbyBuildings />);
    expect(screen.getByText(/^2\.\d km from BU$/)).toBeTruthy();
  });

  it('stays hidden until the location and buildings are known', async () => {
    jest.mocked(useCurrentLocation).mockReturnValue({ status: 'denied', canAskAgain: true, refresh: jest.fn() });
    await render(<NearbyBuildings />);
    expect(screen.queryByTestId('map')).toBeNull();

    jest.mocked(useCurrentLocation).mockReturnValue(located());
    jest
      .mocked(useAedBuildings)
      .mockReturnValue({ data: undefined, loading: true, error: undefined, reload: jest.fn() });
    await render(<NearbyBuildings />);
    expect(screen.queryByTestId('map')).toBeNull();
  });
});

describe('location in the header', () => {
  const header = () => screen.getByLabelText(/^Your current location/).props.accessibilityLabel;

  it('shows the street address when the phone can look one up', async () => {
    jest
      .mocked(useCurrentLocation)
      .mockReturnValue(located(atMugar, { address: '771 Commonwealth Ave', campus: 'CRC' }));
    await render(<EmergencyScreen>{null}</EmergencyScreen>);
    expect(header()).toBe('Your current location. 771 Commonwealth Ave. Charles River Campus');
  });

  it('names the nearest BU building instead of showing coordinates', async () => {
    jest.mocked(useCurrentLocation).mockReturnValue(located(atMugar, { campus: 'CRC' }));
    await render(<EmergencyScreen>{null}</EmergencyScreen>);
    expect(header()).toBe('Your current location. Near Mugar Memorial Library. Charles River Campus');
  });

  it('never shows coordinates, even far from BU', async () => {
    jest.mocked(useCurrentLocation).mockReturnValue(located({ latitude: 42.3736, longitude: -71.1097 }));
    await render(<EmergencyScreen>{null}</EmergencyScreen>);
    expect(header()).toBe('Your current location. Location found. Not on a BU campus');
  });
});
