import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Linking } from 'react-native';

import HomeScreen from '@/app/index';
import GuidanceScreen from '@/app/emergency/[id]';
import ContactsScreen from '@/app/contacts';
import { useContacts, useEmergencyTypes, useGuidanceSteps } from '@/hooks/use-emergency-data';

// React Native's first render can exceed Jest's default timeout on Windows.
jest.setTimeout(15000);

jest.mock('@/hooks/use-emergency-data', () => ({
  useContacts: jest.fn(),
  useEmergencyTypes: jest.fn(),
  useGuidanceSteps: jest.fn(),
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) },
  useLocalSearchParams: () => ({ id: 'fire' }),
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});
jest.mock('expo-image', () => ({ Image: () => null }));

const types = [
  { id: 'fire', name: 'Fire', sort_order: 1 },
  { id: 'medical', name: 'Medical Emergencies', sort_order: 2 },
  { id: 'hazardous-spill', name: 'Hazardous Materials / Spill', sort_order: 3 },
  { id: 'violence', name: 'Violence', sort_order: 4 },
  { id: 'suspicious-package', name: 'Suspicious Package / Bomb Threat', sort_order: 5 },
  { id: 'utilities', name: 'Utilities Failure', sort_order: 6 },
  { id: 'weather', name: 'Extreme Weather', sort_order: 7 },
];
const contacts = [
  {
    id: 'shared',
    name: 'Shared contact',
    phone: '2025550100',
    campus: 'ALL',
    description: 'Test fixture',
    address: null,
    sort_order: 1,
    emergencies: [],
  },
  {
    id: 'crc',
    name: 'CRC contact',
    phone: '+12025550101',
    campus: 'CRC',
    description: 'Test fixture',
    address: null,
    sort_order: 2,
    emergencies: [],
  },
  {
    id: 'med',
    name: 'MED contact',
    phone: '+12025550102',
    campus: 'MED',
    description: 'Test fixture',
    address: null,
    sort_order: 3,
    emergencies: [],
  },
];
const ready = <T,>(data: T) => ({ data, loading: false, error: undefined, reload: jest.fn() });
const mockTypes = jest.mocked(useEmergencyTypes);
const mockSteps = jest.mocked(useGuidanceSteps);
const mockContacts = jest.mocked(useContacts);

beforeEach(() => {
  jest.clearAllMocks();
  mockTypes.mockReturnValue(ready(types));
  mockSteps.mockReturnValue(
    ready([
      {
        id: 2,
        section: 'Example section',
        step_order: 2,
        title: 'Second step',
        body: 'Second body',
        link: null,
        contacts: [],
      },
      {
        id: 1,
        section: 'Example section',
        step_order: 1,
        title: 'First step',
        body: 'First body',
        link: null,
        contacts: [],
      },
    ])
  );
  mockContacts.mockReturnValue(ready(contacts));
});
afterEach(() => jest.restoreAllMocks());

it('shows all seven categories and navigates using the backend ID', async () => {
  await render(<HomeScreen />);
  expect(screen.getAllByRole('button', { name: /^View .* guidance$/ })).toHaveLength(7);
  await fireEvent.press(screen.getByRole('button', { name: 'View Hazardous Materials / Spill guidance' }));
  expect(router.push).toHaveBeenCalledWith({ pathname: '/emergency/[id]', params: { id: 'hazardous-spill' } });
  await fireEvent.press(screen.getByRole('button', { name: 'Call for help — view contacts' }));
  expect(router.push).toHaveBeenCalledWith('/contacts');
});

it.each([
  ['home', HomeScreen, mockTypes],
  ['guidance', GuidanceScreen, mockSteps],
  ['contacts', ContactsScreen, mockContacts],
] as const)('%s shows loading and a retry action on failure', async (_name, Component, hook) => {
  const reload = jest.fn();
  hook.mockReturnValue({ data: undefined, loading: true, error: undefined, reload });
  const view = await render(<Component />);
  expect(screen.getByText('Loading…')).toBeTruthy();
  hook.mockReturnValue({ data: undefined, loading: false, error: new Error('offline'), reload });
  await view.rerender(<Component />);
  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(reload).toHaveBeenCalledTimes(1);
});

it('loads the routed scenario, sorts instructions, preserves sections, and toggles body text', async () => {
  await render(<GuidanceScreen />);
  expect(mockSteps).toHaveBeenCalledWith('fire');
  expect(screen.getAllByText('Example section')).toHaveLength(1);
  expect(screen.getAllByRole('button', { name: /step$/ }).map((button) => button.props.accessibilityLabel)).toEqual([
    'First step',
    'Second step',
  ]);
  await fireEvent.press(screen.getByRole('button', { name: 'First step' }));
  expect(screen.queryByText('First body')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'First step' }));
  expect(screen.getByText('First body')).toBeTruthy();
});

it('shows an empty state for a scenario without instructions', async () => {
  mockSteps.mockReturnValue(ready([]));
  await render(<GuidanceScreen />);
  expect(screen.getByText('No guidance is available for this category.')).toBeTruthy();
});

it('filters contacts by campus while keeping shared contacts', async () => {
  await render(<ContactsScreen />);
  expect(screen.getByText('CRC contact')).toBeTruthy();
  expect(screen.queryByText('MED contact')).toBeNull();
  await fireEvent.press(screen.getByRole('tab', { name: 'Medical Campus' }));
  expect(screen.getByText('MED contact')).toBeTruthy();
  expect(screen.getByText('Shared contact')).toBeTruthy();
  expect(screen.queryByText('CRC contact')).toBeNull();
});

it('never dials on selection or cancel, and only dials after confirmation', async () => {
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  await render(<ContactsScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Call CRC contact, (202) 555-0101' }));
  expect(screen.getByText('CONFIRM CALL')).toBeTruthy();
  expect(openURL).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
  expect(openURL).not.toHaveBeenCalled();
  expect(screen.queryByText('CONFIRM CALL')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Call CRC contact, (202) 555-0101' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Call Now' }));
  await waitFor(() => expect(openURL).toHaveBeenCalledWith('tel:+12025550101'));
  expect(openURL).toHaveBeenCalledTimes(1);
});

it('shows a useful message when the phone app cannot open', async () => {
  jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('unavailable'));
  await render(<ContactsScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Call CRC contact, (202) 555-0101' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Call Now' }));
  await waitFor(() => expect(screen.getByText(/Unable to open the phone app/)).toBeTruthy());
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
});
