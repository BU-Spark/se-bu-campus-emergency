import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { Linking } from 'react-native';

import { EmergencyScreen } from '@/components/emergency/screen';
import { LocationProvider } from '@/hooks/use-current-location';

jest.setTimeout(15000);

jest.mock('expo-location', () => ({
  Accuracy: { High: 4 },
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});
jest.mock('expo-image', () => ({ Image: () => null }));

const location = jest.mocked(Location);
const permission = (status: 'granted' | 'denied', canAskAgain: boolean) =>
  ({ status, canAskAgain, granted: status === 'granted', expires: 'never' }) as Location.LocationPermissionResponse;
const position = (latitude: number, longitude: number) =>
  ({ coords: { latitude, longitude, accuracy: 10 }, timestamp: 0 }) as Location.LocationObject;

const renderScreen = () =>
  render(
    <LocationProvider>
      <EmergencyScreen>{null}</EmergencyScreen>
    </LocationProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  location.getForegroundPermissionsAsync.mockResolvedValue(permission('granted', true));
  location.getCurrentPositionAsync.mockResolvedValue(position(42.3503, -71.106));
  location.getLastKnownPositionAsync.mockResolvedValue(null);
  location.reverseGeocodeAsync.mockResolvedValue([
    { streetNumber: '775', street: 'Commonwealth Avenue' } as Location.LocationGeocodedAddress,
  ]);
});

it('shows the street address and campus once location is found', async () => {
  await renderScreen();
  expect(await screen.findByText('775 Commonwealth Avenue')).toBeTruthy();
  expect(screen.getByText('Charles River Campus')).toBeTruthy();
});

it('falls back to coordinates when the address lookup fails', async () => {
  location.getCurrentPositionAsync.mockResolvedValue(position(42.3355, -71.0725));
  location.reverseGeocodeAsync.mockRejectedValue(new Error('not supported on web'));
  await renderScreen();
  expect(await screen.findByText('42.3355, -71.0725')).toBeTruthy();
  expect(screen.getByText('Medical Campus')).toBeTruthy();
});

it('asks for permission, and lets the user try again after declining', async () => {
  location.getForegroundPermissionsAsync.mockResolvedValue(permission('denied', true));
  location.requestForegroundPermissionsAsync
    .mockResolvedValueOnce(permission('denied', true))
    .mockResolvedValueOnce(permission('granted', true));
  await renderScreen();

  expect(await screen.findByText('Tap to allow location')).toBeTruthy();
  expect(location.getCurrentPositionAsync).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByRole('button', { name: /Your current location/ }));
  expect(await screen.findByText('775 Commonwealth Avenue')).toBeTruthy();
  expect(location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(2);
});

it('opens Settings when permission can no longer be requested', async () => {
  const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
  location.getForegroundPermissionsAsync.mockResolvedValue(permission('denied', false));
  await renderScreen();

  await fireEvent.press(await screen.findByRole('button', { name: /Tap to turn on in Settings/ }));
  expect(openSettings).toHaveBeenCalled();
  expect(location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
});

it('uses the last known position when a fresh fix fails', async () => {
  location.getCurrentPositionAsync.mockRejectedValue(new Error('location services off'));
  location.getLastKnownPositionAsync.mockResolvedValue(position(42.3744, -71.1169));
  await renderScreen();
  expect(await screen.findByText('Not on a BU campus')).toBeTruthy();
});

it('shows a retry message when no position is available', async () => {
  location.getCurrentPositionAsync.mockRejectedValue(new Error('location services off'));
  await renderScreen();
  expect(await screen.findByText('Location unavailable')).toBeTruthy();
  await waitFor(() => expect(screen.getByText('Tap to try again')).toBeTruthy());
});
