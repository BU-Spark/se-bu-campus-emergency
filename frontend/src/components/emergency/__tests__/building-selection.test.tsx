import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useEffect, type ReactNode } from 'react';
import { router } from 'expo-router';
import LocationScreen from '@/app/location';
import AedScreen from '@/app/aeds';
import ContactsScreen from '@/app/contacts';
import { BuildingProvider, useSelectedBuilding } from '@/hooks/use-selected-building';
import { useAedBuildings, useContacts, useEmergencyTypes } from '@/hooks/use-emergency-data';
import type { AedBuilding } from '@/services/emergency-data';

jest.setTimeout(15000);
jest.mock('@/hooks/use-emergency-data', () => ({
  useAedBuildings: jest.fn(),
  useContacts: jest.fn(),
  useEmergencyTypes: jest.fn(),
}));
jest.mock('@/hooks/use-current-location', () => ({
  useCurrentLocation: () => ({ status: 'denied', canAskAgain: false, refresh: jest.fn() }),
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: jest.requireActual('react-native').View }));
jest.mock('expo-image', () => ({ Image: () => null }));
const building: AedBuilding = {
  id: 'med',
  name: 'Test Medical Building',
  address: '123 Test Street',
  campus: 'MED',
  aeds: [{ id: 'aed1', floor: '01', room: '102', location_note: 'Test lobby', sort_order: 1 }],
};
const ready = <T,>(data: T) => ({ data, loading: false, error: undefined, reload: jest.fn() });
function SelectionReadout() {
  const { building } = useSelectedBuilding();
  return <Text testID="selection">{building?.id ?? 'none'}</Text>;
}
function Preset({ children }: { children: ReactNode }) {
  const { selectBuilding } = useSelectedBuilding();
  useEffect(() => {
    selectBuilding(building);
  }, [selectBuilding]);
  return children;
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useAedBuildings).mockReturnValue(ready([building]));
  jest.mocked(useEmergencyTypes).mockReturnValue(ready([]));
  jest.mocked(useContacts).mockReturnValue(
    ready([
      {
        id: 'med',
        name: 'Medical campus contact',
        description: '',
        phone: '2025550100',
        address: null,
        campus: 'MED',
        sort_order: 1,
        emergencies: [],
      },
      {
        id: 'crc',
        name: 'Charles River contact',
        description: '',
        phone: '2025550101',
        address: null,
        campus: 'CRC',
        sort_order: 2,
        emergencies: [],
      },
    ])
  );
});
it('saves a manual building without GPS permission and updates the shared header', async () => {
  await render(
    <BuildingProvider>
      <LocationScreen />
      <SelectionReadout />
    </BuildingProvider>
  );
  expect(screen.getByRole('button', { name: 'Save and close' })).toBeDisabled();
  await fireEvent.changeText(screen.getByLabelText('Search BU buildings'), '123 Test');
  await fireEvent.press(screen.getByRole('radio', { name: /Test Medical Building/ }));
  expect(screen.getByTestId('selection')).toHaveTextContent('none');
  await fireEvent.press(screen.getByRole('button', { name: 'Save and close' }));
  expect(screen.getByTestId('selection')).toHaveTextContent('med');
  expect(screen.getByText('Manually selected')).toBeTruthy();
  expect(router.back).toHaveBeenCalled();
});
it('cancel does not apply the draft choice', async () => {
  await render(
    <BuildingProvider>
      <LocationScreen />
      <SelectionReadout />
    </BuildingProvider>
  );
  await fireEvent.press(screen.getByRole('radio', { name: /Test Medical Building/ }));
  await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.getByTestId('selection')).toHaveTextContent('none');
});
it('can clear a previously selected building', async () => {
  await render(
    <BuildingProvider>
      <Preset>
        <LocationScreen />
        <SelectionReadout />
      </Preset>
    </BuildingProvider>
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Clear manual building selection' }));
  expect(screen.getByTestId('selection')).toHaveTextContent('none');
});
it('shows the selected building AED details without expanding the directory', async () => {
  await render(
    <BuildingProvider>
      <Preset>
        <AedScreen />
      </Preset>
    </BuildingProvider>
  );
  expect(screen.getByText('AEDs in your selected building')).toBeTruthy();
  expect(screen.getByText('Test lobby')).toBeTruthy();
  expect(screen.getByRole('tab', { name: 'Medical', selected: true })).toBeTruthy();
});
it('uses the manual building campus for contacts even when GPS is denied', async () => {
  await render(
    <BuildingProvider>
      <Preset>
        <ContactsScreen />
      </Preset>
    </BuildingProvider>
  );
  expect(screen.getByText('Medical campus contact')).toBeTruthy();
  expect(screen.queryByText('Charles River contact')).toBeNull();
});
it('shows directory failures and allows retry without saving invalid data', async () => {
  const reload = jest.fn();
  jest
    .mocked(useAedBuildings)
    .mockReturnValue({ data: undefined, loading: false, error: new Error('offline'), reload });
  await render(
    <BuildingProvider>
      <LocationScreen />
    </BuildingProvider>
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(reload).toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Save and close' })).toBeDisabled();
});
