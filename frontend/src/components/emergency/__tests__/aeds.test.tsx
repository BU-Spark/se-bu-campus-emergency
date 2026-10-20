import { fireEvent, render, screen } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import AedScreen from '@/app/aeds';
import GuidanceScreen from '@/app/emergency/[id]';
import { useCurrentLocation, type CurrentLocation } from '@/hooks/use-current-location';
import { useAedBuildings, useEmergencyTypes, useGuidanceSteps } from '@/hooks/use-emergency-data';

jest.setTimeout(15000);

jest.mock('@/hooks/use-emergency-data', () => ({
  useAedBuildings: jest.fn(),
  useEmergencyTypes: jest.fn(),
  useGuidanceSteps: jest.fn(),
}));
jest.mock('@/hooks/use-current-location', () => ({ useCurrentLocation: jest.fn() }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) },
  useLocalSearchParams: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});
jest.mock('expo-image', () => ({ Image: () => null }));

const buildings = [
  {
    id: '501',
    name: 'Fitness and Recreation Center',
    address: '915 Commonwealth Avenue',
    campus: 'CRC',
    aeds: [
      { id: '501-01-111', floor: '01', room: '111', location_note: 'Inside Weight Room near 111', sort_order: 1 },
      { id: '501-B-B02', floor: 'B', room: 'B02', location_note: 'Near the pool entrance', sort_order: 2 },
    ],
  },
  {
    id: '627',
    name: '890 Commonwealth Avenue',
    address: '890 Commonwealth Avenue',
    campus: 'CRC',
    aeds: [{ id: '627-01-100', floor: '01', room: '100', location_note: 'Main lobby', sort_order: 1 }],
  },
  {
    id: '909',
    name: 'T-Bldg - Talbot Building',
    address: '715 Albany Street',
    campus: 'MED',
    aeds: [{ id: '909-01-100', floor: '01', room: '100', location_note: 'Outside the elevators', sort_order: 1 }],
  },
];
const ready = <T,>(data: T) => ({ data, loading: false, error: undefined, reload: jest.fn() });
const located = (campus?: 'CRC' | 'MED'): CurrentLocation => ({
  status: 'ready',
  coords: { latitude: 0, longitude: 0, accuracy: 10 },
  campus,
  refresh: jest.fn(),
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useAedBuildings).mockReturnValue(ready(buildings));
  jest.mocked(useCurrentLocation).mockReturnValue({ status: 'loading', refresh: jest.fn() });
  jest.mocked(useEmergencyTypes).mockReturnValue(ready([]));
  jest.mocked(useGuidanceSteps).mockReturnValue(ready([]));
});

const step = (step_order: number, link: string | null) => ({
  id: step_order,
  section: null,
  step_order,
  title: `Step ${step_order}`,
  body: 'Body',
  link,
  contacts: [],
});

it('opens the AED finder from the step that links to it', async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ id: 'medical' });
  jest.mocked(useGuidanceSteps).mockReturnValue(ready([step(1, null), step(2, '/aeds')]));
  await render(<GuidanceScreen />);
  expect(screen.getAllByRole('button', { name: 'FIND AN AED' })).toHaveLength(1);
  await fireEvent.press(screen.getByRole('button', { name: 'FIND AN AED' }));
  expect(router.push).toHaveBeenCalledWith('/aeds');
});

it('ignores step links to unknown screens', async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ id: 'fire' });
  jest.mocked(useGuidanceSteps).mockReturnValue(ready([step(1, '/unknown')]));
  await render(<GuidanceScreen />);
  expect(screen.queryByRole('button', { name: 'FIND AN AED' })).toBeNull();
});

it('offers directions to a building once it is opened', async () => {
  await render(<AedScreen />);
  expect(screen.queryByRole('button', { name: 'Directions to 915 Commonwealth Avenue' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: /Fitness and Recreation Center/ }));
  expect(screen.getByRole('button', { name: 'Directions to 915 Commonwealth Avenue' })).toBeTruthy();
});

it('lists buildings for the Charles River Campus and expands to show AED locations', async () => {
  await render(<AedScreen />);
  expect(screen.getByText('Fitness and Recreation Center')).toBeTruthy();
  expect(screen.getByText('2 AEDs')).toBeTruthy();
  expect(screen.queryByText('T-Bldg - Talbot Building')).toBeNull();
  // The address is only repeated when it differs from the building name.
  expect(screen.getAllByText('890 Commonwealth Avenue')).toHaveLength(1);

  expect(screen.queryByText('Inside Weight Room near 111')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: /Fitness and Recreation Center/ }));
  expect(screen.getByText('Inside Weight Room near 111')).toBeTruthy();
  expect(screen.getByText('Floor 1 · Room 111')).toBeTruthy();
  expect(screen.getByText('Basement · Room B02')).toBeTruthy();
});

it('selects the campus from the user location, and lets the user change it', async () => {
  jest.mocked(useCurrentLocation).mockReturnValue(located('MED'));
  await render(<AedScreen />);
  expect(screen.getByText('T-Bldg - Talbot Building')).toBeTruthy();
  expect(screen.queryByText('Fitness and Recreation Center')).toBeNull();

  await fireEvent.press(screen.getByRole('tab', { name: 'Charles River' }));
  expect(screen.getByText('Fitness and Recreation Center')).toBeTruthy();
});

it('filters buildings by name or address', async () => {
  await render(<AedScreen />);
  await fireEvent.changeText(screen.getByLabelText('Search buildings'), 'fitness');
  expect(screen.getByText('Fitness and Recreation Center')).toBeTruthy();
  expect(screen.queryByText('890 Commonwealth Avenue')).toBeNull();

  await fireEvent.changeText(screen.getByLabelText('Search buildings'), '890 comm');
  expect(screen.getByText('890 Commonwealth Avenue')).toBeTruthy();

  await fireEvent.changeText(screen.getByLabelText('Search buildings'), 'nowhere');
  expect(screen.getByText('No buildings on this campus match "nowhere".')).toBeTruthy();
});
