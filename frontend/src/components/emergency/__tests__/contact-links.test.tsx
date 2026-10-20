import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ActionSheetIOS, Linking } from 'react-native';

import ContactsScreen from '@/app/contacts';
import GuidanceScreen from '@/app/emergency/[id]';
import { useCurrentLocation, type CurrentLocation } from '@/hooks/use-current-location';
import { useContacts, useEmergencyTypes, useGuidanceSteps } from '@/hooks/use-emergency-data';
import type { Contact } from '@/services/emergency-data';

jest.setTimeout(15000);

jest.mock('@/hooks/use-emergency-data', () => ({
  useContacts: jest.fn(),
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

const contact = (id: string, name: string, campus: string, emergencies: string[], address: string | null = null) =>
  ({
    id,
    name,
    campus,
    emergencies,
    address,
    phone: '+16175550100',
    description: 'Test fixture',
    sort_order: 1,
  }) satisfies Contact;
const contacts = [
  contact('911', 'Emergency (911)', 'ALL', ['fire']),
  contact('bupd-crc', 'BUPD Charles River', 'CRC', ['fire', 'violence']),
  contact('bupd-med', 'BUPD Medical', 'MED', ['fire', 'violence']),
  contact('student-health', 'Student Health Services', 'CRC', ['medical'], '881 Commonwealth Ave.'),
];
const ready = <T,>(data: T) => ({ data, loading: false, error: undefined, reload: jest.fn() });
const located = (campus?: 'CRC' | 'MED'): CurrentLocation => ({
  status: 'ready',
  coords: { latitude: 0, longitude: 0, accuracy: 10 },
  campus,
  refresh: jest.fn(),
});
const alertStep = {
  id: 3,
  section: null,
  step_order: 3,
  title: 'Alert',
  body: 'Call BUPD.',
  link: null,
  contacts: contacts.slice(0, 3),
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useContacts).mockReturnValue(ready(contacts));
  jest.mocked(useEmergencyTypes).mockReturnValue(
    ready([
      { id: 'fire', name: 'Fire', sort_order: 1 },
      { id: 'weather', name: 'Extreme Weather', sort_order: 7 },
    ])
  );
  jest.mocked(useGuidanceSteps).mockReturnValue(ready([alertStep]));
  jest.mocked(useCurrentLocation).mockReturnValue({ status: 'loading', refresh: jest.fn() });
  jest.mocked(useLocalSearchParams).mockReturnValue({});
});
afterEach(() => jest.restoreAllMocks());

describe('Call for Help', () => {
  it('opens the contacts for the emergency being viewed', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ id: 'fire' });
    await render(<GuidanceScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Call for help — view contacts' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/contacts', params: { emergency: 'fire' } });
  });

  it("lists only that emergency's contacts, with a way to see them all", async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ emergency: 'fire' });
    await render(<ContactsScreen />);
    expect(screen.getByText('Fire Contacts')).toBeTruthy();
    expect(screen.getByText('Emergency (911)')).toBeTruthy();
    expect(screen.getByText('BUPD Charles River')).toBeTruthy();
    expect(screen.queryByText('Student Health Services')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'View all contacts' }));
    expect(screen.getByText('Emergency Contacts')).toBeTruthy();
    expect(screen.getByText('Student Health Services')).toBeTruthy();
  });

  it('shows every contact for emergencies without their own list', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ emergency: 'weather' });
    await render(<ContactsScreen />);
    expect(screen.getByText('Emergency Contacts')).toBeTruthy();
    expect(screen.getByText('Student Health Services')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'View all contacts' })).toBeNull();
  });

  it("selects the user's campus from their location", async () => {
    jest.mocked(useCurrentLocation).mockReturnValue(located('MED'));
    await render(<ContactsScreen />);
    expect(screen.getByText('BUPD Medical')).toBeTruthy();
    expect(screen.queryByText('BUPD Charles River')).toBeNull();
  });

  it('formats numbers and shows addresses on their own line', async () => {
    await render(<ContactsScreen />);
    expect(screen.getAllByText('(617) 555-0100').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Directions to 881 Commonwealth Ave.' })).toBeTruthy();
  });
});

describe('call buttons inside guidance steps', () => {
  beforeEach(() => jest.mocked(useLocalSearchParams).mockReturnValue({ id: 'fire' }));

  it("shows only the user's campus number", async () => {
    jest.mocked(useCurrentLocation).mockReturnValue(located('CRC'));
    await render(<GuidanceScreen />);
    expect(screen.getByText('BUPD Charles River')).toBeTruthy();
    expect(screen.queryByText('BUPD Medical')).toBeNull();
    expect(screen.getByText('Emergency (911)')).toBeTruthy();
  });

  it('labels both campus numbers when the campus is unknown', async () => {
    await render(<GuidanceScreen />);
    expect(
      screen.getByRole('button', { name: 'Call BUPD Charles River, Charles River Campus, (617) 555-0100' })
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Call BUPD Medical, Medical Campus, (617) 555-0100' })).toBeTruthy();
  });

  it('asks for confirmation before dialing', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await render(<GuidanceScreen />);
    await fireEvent.press(screen.getByRole('button', { name: /^Call Emergency \(911\)/ }));
    expect(screen.getByText('CONFIRM CALL')).toBeTruthy();
    expect(openURL).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Call Now' }));
    await waitFor(() => expect(openURL).toHaveBeenCalledWith('tel:+16175550100'));
  });
});

it('lets iOS users choose Apple Maps or Google Maps for directions', async () => {
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  const sheet = jest
    .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
    .mockImplementation((_options, callback) => callback(1));
  await render(<ContactsScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Directions to 881 Commonwealth Ave.' }));
  expect(sheet.mock.calls[0][0].options).toEqual(['Apple Maps', 'Google Maps', 'Cancel']);
  expect(openURL).toHaveBeenCalledWith(
    'https://www.google.com/maps/search/?api=1&query=881%20Commonwealth%20Ave.%2C%20MA'
  );
});
