import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ui } from '@/components/emergency/screen';
import { useCurrentLocation } from '@/hooks/use-current-location';
import { useAedBuildings } from '@/hooks/use-emergency-data';
import { byDistance, formatDistance } from '@/lib/nearby';
import { NearbyMap } from './nearby-map';

/** How many of the closest buildings get a pin on the preview, and how many its initial view must include. */
const PINNED = 8;
const FITTED = 3;
/** Beyond this the user is off campus, so say how far away BU is instead of "near". */
export const FAR_METERS = 2000;

const aedCount = (count: number) => `${count} AED${count === 1 ? '' : 's'}`;

/**
 * Map of the user's location with the closest BU buildings marked. The expand button in its corner opens
 * a full-screen map with every BU building, which can be dragged and zoomed; tapping a building there
 * opens its AEDs. Hidden until both the location and the buildings are known.
 */
export function NearbyBuildings() {
  const location = useCurrentLocation();
  const buildings = useAedBuildings();
  const [expanded, setExpanded] = useState(false);
  if (location.status !== 'ready' || !buildings.data) return null;
  const nearby = byDistance(location.coords, buildings.data);
  if (!nearby.length) return null;
  const [closest] = nearby;
  const far = closest.meters > FAR_METERS;
  const places = nearby.map(({ item, point, meters }) => ({
    ...point,
    id: item.id,
    name: item.name,
    detail: `${formatDistance(meters)} away · ${aedCount(item.aeds.length)}`,
  }));
  const fit = nearby.slice(0, far ? 1 : FITTED).map(({ point }) => point);
  const openBuilding = (building: string) => {
    setExpanded(false);
    router.push({ pathname: '/aeds', params: { building } });
  };
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>
        {far ? `${formatDistance(closest.meters)} from BU` : `Near ${closest.item.name}`}
      </Text>
      <Text style={styles.subtitle}>
        {far ? 'The nearest BU building is marked on the map.' : 'Nearby BU buildings are marked in red.'}
      </Text>
      <View>
        <NearbyMap center={location.coords} places={places.slice(0, PINNED)} fit={fit} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Expand map of BU buildings"
          onPress={() => setExpanded(true)}
          style={({ pressed }) => [styles.expand, pressed && ui.pressed]}
        >
          <Text accessible={false} style={styles.expandIcon}>
            ⤢
          </Text>
        </Pressable>
      </View>
      <Modal visible={expanded} animationType="slide" onRequestClose={() => setExpanded(false)}>
        <SafeAreaView style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetCopy}>
              <Text accessibilityRole="header" style={styles.title}>
                BU Buildings with AEDs
              </Text>
              <Text style={styles.subtitle}>Drag and zoom the map. Tap a building to see its AEDs.</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setExpanded(false)}
              style={({ pressed }) => [ui.darkButton, styles.done, pressed && ui.pressed]}
            >
              <Text style={ui.helpText}>Done</Text>
            </Pressable>
          </View>
          {expanded && (
            <NearbyMap center={location.coords} places={places} fit={fit} interactive onSelect={openBuilding} />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#c8c8c8',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginBottom: 18,
  },
  title: { color: '#2d2926', fontSize: 17, fontWeight: '800' },
  subtitle: { color: '#5b5957', fontSize: 13, lineHeight: 18, marginBottom: 4 },
  expand: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 1px 4px #00000040',
    zIndex: 1,
  },
  expandIcon: { color: '#2d2926', fontSize: 22, fontWeight: '700' },
  sheet: { flex: 1, backgroundColor: '#fff' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  sheetCopy: { flex: 1 },
  done: { minHeight: 44, paddingVertical: 10 },
});
