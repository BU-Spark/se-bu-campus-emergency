import { ActionSheetIOS, Linking, Platform } from 'react-native';

// Adding the state keeps searches in Massachusetts; the map app's own location bias picks the right town.
const query = (address: string) => encodeURIComponent(`${address}, MA`);

export const appleMapsUrl = (address: string) => `https://maps.apple.com/?q=${query(address)}`;
export const googleMapsUrl = (address: string) => `https://www.google.com/maps/search/?api=1&query=${query(address)}`;

/**
 * Opens an address in a map app. iOS asks whether to use Apple Maps or Google Maps (Google Maps opens in the
 * browser if the app is not installed); Android shows its own chooser of installed map apps; web opens
 * Google Maps.
 */
export function openDirections(address: string): void {
  const open = (url: string) => Linking.openURL(url).catch(() => undefined);
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: 'Open in Maps',
        message: address,
        options: ['Apple Maps', 'Google Maps', 'Cancel'],
        cancelButtonIndex: 2,
      },
      (index) => {
        if (index === 0) void open(appleMapsUrl(address));
        if (index === 1) void open(googleMapsUrl(address));
      }
    );
  } else if (Platform.OS === 'android') {
    void Linking.openURL(`geo:0,0?q=${query(address)}`).catch(() => open(googleMapsUrl(address)));
  } else {
    void open(googleMapsUrl(address));
  }
}
