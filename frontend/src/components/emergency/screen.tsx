import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentLocation, type CurrentLocation } from '@/hooks/use-current-location';
import { campuses } from '@/lib/campus';
import { useSelectedBuilding } from '@/hooks/use-selected-building';
import { EmergencyIcon } from './icon';

export function EmergencyScreen({
  children,
  back = false,
  help = true,
  emergency,
}: {
  children: ReactNode;
  back?: boolean;
  help?: boolean;
  /** Emergency type whose contacts "Call for Help" should show; all contacts when omitted. */
  emergency?: string;
}) {
  return (
    <SafeAreaView style={ui.safe}>
      <View style={ui.frame}>
        <View style={ui.header}>
          <LocationSummary />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit your building"
            onPress={() => router.push('/location')}
            style={ui.edit}
          >
            <Text style={ui.headerAction}>Edit</Text>
          </Pressable>
          <View style={ui.brand}>
            <Text style={ui.brandText}>BOSTON{'\n'}UNIVERSITY</Text>
          </View>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.content}>
          {back && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              style={ui.back}
            >
              <Text style={ui.backText}>← Back</Text>
            </Pressable>
          )}
          {children}
        </ScrollView>
        {help && (
          <View style={ui.footer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Call for help — view contacts"
              onPress={() => router.push(emergency ? { pathname: '/contacts', params: { emergency } } : '/contacts')}
              style={({ pressed }) => [ui.help, pressed && ui.pressed]}
            >
              <EmergencyIcon name="phone" size={22} />
              <Text style={ui.helpText}>CALL FOR HELP</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
/** Header block showing the user's location; tapping it retries or opens Settings when access is off. */
function LocationSummary() {
  const location = useCurrentLocation();
  const { building } = useSelectedBuilding();
  const [line1, line2, action] = describeLocation(location);
  if (building)
    return (
      <View style={ui.location}>
        <EmergencyIcon name="location" size={30} />
        <View style={ui.headerCopy}>
          <Text style={ui.headerTitle}>Your Current Location</Text>
          <Text style={ui.headerDetail}>{building.name}</Text>
          <Text style={ui.headerDetail}>{building.address}</Text>
          <Text style={ui.headerDetail}>Manually selected</Text>
        </View>
      </View>
    );
  const onPress =
    location.status === 'denied' && !location.canAskAgain
      ? () => void Linking.openSettings()
      : location.status === 'denied' || location.status === 'unavailable' || location.status === 'ready'
        ? location.refresh
        : undefined;
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={['Your current location', line1, line2, action].filter(Boolean).join('. ')}
      accessibilityLiveRegion="polite"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [ui.location, pressed && ui.pressed]}
    >
      <EmergencyIcon name="location" size={30} />
      <View style={ui.headerCopy}>
        <Text style={ui.headerTitle}>Your Current Location</Text>
        <Text style={ui.headerDetail}>{line1}</Text>
        <Text style={ui.headerDetail}>{line2}</Text>
        {action && <Text style={ui.headerAction}>{action}</Text>}
      </View>
    </Pressable>
  );
}
function describeLocation(location: CurrentLocation): [string, string, string?] {
  switch (location.status) {
    case 'idle':
      return ['Location not set', 'Boston University'];
    case 'loading':
      return ['Finding your location…', 'Boston University'];
    case 'denied':
      return [
        'Location access is off',
        'Boston University',
        location.canAskAgain ? 'Tap to allow location' : 'Tap to turn on in Settings',
      ];
    case 'unavailable':
      return ['Location unavailable', 'Boston University', 'Tap to try again'];
    case 'ready': {
      const { latitude, longitude } = location.coords;
      return [
        location.address ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        location.campus ? campuses[location.campus].name : 'Not on a BU campus',
      ];
    }
  }
}
export function DataState({
  loading,
  error,
  reload,
  empty,
  emptyMessage,
}: {
  loading: boolean;
  error?: Error;
  reload: () => void;
  empty: boolean;
  emptyMessage: string;
}) {
  if (loading)
    return (
      <View style={ui.state} accessibilityLiveRegion="polite">
        <ActivityIndicator color="#aa2c3b" />
        <Text style={ui.body}>Loading…</Text>
      </View>
    );
  if (error)
    return (
      <View style={ui.state}>
        <Text accessibilityRole="alert" style={ui.body}>
          Unable to load information. Check your connection and try again.
        </Text>
        <Pressable accessibilityRole="button" onPress={reload} style={ui.darkButton}>
          <Text style={ui.helpText}>Try again</Text>
        </Pressable>
      </View>
    );
  if (empty)
    return (
      <View style={ui.state}>
        <Text style={ui.body}>{emptyMessage}</Text>
      </View>
    );
  return null;
}
export const ui = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  frame: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center', backgroundColor: '#f0f4f5' },
  header: {
    backgroundColor: '#2d2926',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  location: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  edit: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  headerCopy: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  headerDetail: { color: '#dedbd9', fontSize: 12, lineHeight: 17 },
  headerAction: { color: '#fff', fontSize: 12, lineHeight: 17, fontWeight: '700', textDecorationLine: 'underline' },
  brand: { backgroundColor: '#cc0000', borderColor: '#ff7979', borderWidth: 1, padding: 4 },
  brandText: { color: '#fff', fontFamily: 'serif', fontSize: 10, textAlign: 'center' },
  content: { padding: 20, paddingBottom: 28, flexGrow: 1 },
  title: { color: '#2d2926', fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 15, color: '#5b5957', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  body: { color: '#363230', fontSize: 16, lineHeight: 24 },
  back: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginBottom: 8, paddingRight: 20 },
  backText: { color: '#363230', fontSize: 16, fontWeight: '600' },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14, alignItems: 'flex-end' },
  help: {
    minHeight: 54,
    backgroundColor: '#e80018',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  helpText: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  pressed: { opacity: 0.65 },
  state: { paddingVertical: 40, alignItems: 'center', gap: 18 },
  darkButton: {
    backgroundColor: '#2d2926',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    minHeight: 48,
  },
});
