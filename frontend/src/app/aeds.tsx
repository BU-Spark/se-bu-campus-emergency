import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { DirectionsLink } from '@/components/emergency/contact-card';
import { DataState, EmergencyScreen, ui } from '@/components/emergency/screen';
import { useCurrentLocation } from '@/hooks/use-current-location';
import { useAedBuildings } from '@/hooks/use-emergency-data';
import { byDistance, formatDistance } from '@/lib/nearby';
import type { Aed, AedBuilding } from '@/services/emergency-data';

const campusTabs = [
  ['CRC', 'Charles River'],
  ['FEN', 'Fenway'],
  ['MED', 'Medical'],
  ['Non BU', 'Non BU'],
] as const;
type AedCampus = (typeof campusTabs)[number][0];

/** '01' → 'Floor 1', 'B' → 'Basement', 'L1' → 'Floor L1'. */
function formatFloor(floor: string): string {
  if (/^\d+$/.test(floor)) return `Floor ${Number(floor)}`;
  if (floor.toUpperCase() === 'B') return 'Basement';
  return `Floor ${floor}`;
}

function AedRow({ aed }: { aed: Aed }) {
  return (
    <View style={styles.aed}>
      <Text style={styles.note}>{aed.location_note}</Text>
      <Text style={styles.detail}>
        {formatFloor(aed.floor)} · Room {aed.room}
      </Text>
    </View>
  );
}
function BuildingCard({
  building,
  meters,
  initiallyExpanded = false,
}: {
  building: AedBuilding;
  /** Distance from the user, when their location is known. */
  meters?: number;
  initiallyExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const count = building.aeds.length
    ? `${building.aeds.length} AED${building.aeds.length === 1 ? '' : 's'}`
    : 'AED info pending';
  const showAddress = building.address !== building.name;
  const distance = meters === undefined ? undefined : `${formatDistance(meters)} away`;
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={[building.name, showAddress && building.address, distance, count]
          .filter(Boolean)
          .join(', ')}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(!expanded)}
        style={({ pressed }) => [styles.buildingHeader, pressed && ui.pressed]}
      >
        <View style={styles.buildingCopy}>
          <Text style={styles.buildingName}>{building.name}</Text>
          {showAddress && <Text style={styles.detail}>{building.address}</Text>}
          {distance && <Text style={styles.distance}>{distance}</Text>}
        </View>
        <Text style={styles.count}>{count}</Text>
        <Text accessible={false} style={styles.chevron}>
          {expanded ? '⌃' : '⌄'}
        </Text>
      </Pressable>
      {expanded && (
        <>
          <DirectionsLink address={building.address} />
          {building.aeds.length === 0 && (
            <View style={styles.aed}>
              <Text style={styles.detail}>
                No verified AED locations are currently listed for this building. This does not mean no AED is present.
              </Text>
            </View>
          )}
          {building.aeds.map((aed) => (
            <AedRow key={aed.id} aed={aed} />
          ))}
        </>
      )}
    </View>
  );
}
export default function AedScreen() {
  const params = useLocalSearchParams<{ building?: string | string[] }>();
  const buildingId = Array.isArray(params.building) ? params.building[0] : params.building;
  // A new map destination must reset old search/campus choices and expansion state.
  return <AedDirectory key={buildingId ?? 'directory'} buildingId={buildingId} />;
}

function AedDirectory({ buildingId }: { buildingId?: string }) {
  const query = useAedBuildings();
  const location = useCurrentLocation();
  const scrollRef = useRef<ScrollView>(null);
  const scrollFrame = useRef<ReturnType<typeof requestAnimationFrame> | undefined>(undefined);
  const didScroll = useRef(false);
  useEffect(
    () => () => {
      if (scrollFrame.current !== undefined) cancelAnimationFrame(scrollFrame.current);
    },
    []
  );
  const [chosenCampus, setChosenCampus] = useState<AedCampus>();
  const [search, setSearch] = useState('');
  // A building opened from the home screen's map picks its campus; otherwise follow the user's location
  // until they pick a campus themselves.
  const openedBuilding = query.data?.find((building) => building.id === buildingId);
  const detectedCampus = location.status === 'ready' ? location.campus : undefined;
  const campus: AedCampus = chosenCampus ?? (openedBuilding?.campus as AedCampus) ?? detectedCampus ?? 'CRC';
  const term = search.trim().toLowerCase();
  const matching = (query.data ?? []).filter(
    (building) =>
      building.campus === campus &&
      (!term || building.name.toLowerCase().includes(term) || building.address.toLowerCase().includes(term))
  );
  // Closest first when the user's location is known; buildings without coordinates keep name order, last.
  const sorted =
    location.status === 'ready'
      ? [
          ...byDistance(location.coords, matching),
          ...matching.filter((b) => b.latitude === null || b.longitude === null).map((item) => ({ item })),
        ]
      : matching.map((item) => ({ item }));
  const buildings: { item: AedBuilding; meters?: number }[] = sorted;
  return (
    <EmergencyScreen back scrollRef={scrollRef}>
      <Text accessibilityRole="header" style={ui.title}>
        Find an AED
      </Text>
      <Text style={[ui.subtitle, styles.intro]}>
        Choose your campus, then tap your building to see where its defibrillators are.
        {location.status === 'ready' ? ' Closest buildings are listed first.' : ''}
      </Text>
      <View style={styles.tabs}>
        {campusTabs.map(([value, label]) => (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityState={{ selected: campus === value }}
            onPress={() => setChosenCampus(value)}
            style={[styles.tab, campus === value && styles.activeTab]}
          >
            <Text style={[styles.tabText, campus === value && styles.activeTabText]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        accessibilityLabel="Search buildings"
        placeholder="Search building name or address"
        placeholderTextColor="#75716e"
        value={search}
        onChangeText={setSearch}
        autoCorrect={false}
        clearButtonMode="while-editing"
        style={styles.search}
      />
      <DataState
        {...query}
        empty={!buildings.length}
        emptyMessage={
          term ? `No buildings on this campus match "${search.trim()}".` : 'No AEDs are listed for this campus.'
        }
      />
      {!query.loading &&
        !query.error &&
        buildings.map(({ item, meters }) => (
          <View
            key={item.id}
            testID={`aed-building-${item.id}`}
            onLayout={
              item.id === buildingId
                ? (event) => {
                    if (didScroll.current) return;
                    const y = event.nativeEvent.layout.y;
                    if (scrollFrame.current !== undefined) cancelAnimationFrame(scrollFrame.current);
                    // Wait for the expanded card and scroll content to finish their layout.
                    scrollFrame.current = requestAnimationFrame(() => {
                      if (!scrollRef.current) return;
                      scrollRef.current.scrollTo({ y: Math.max(0, y - 12), animated: false });
                      didScroll.current = true;
                    });
                  }
                : undefined
            }
          >
            <BuildingCard building={item} meters={meters} initiallyExpanded={item.id === buildingId} />
          </View>
        ))}
      <Text style={styles.source}>Source: BU AED list</Text>
    </EmergencyScreen>
  );
}
const styles = StyleSheet.create({
  intro: { textAlign: 'left', marginBottom: 20 },
  tabs: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', backgroundColor: '#e1e4e5', marginBottom: 14 },
  tab: { flex: 1, padding: 12, minHeight: 50, justifyContent: 'center' },
  activeTab: { backgroundColor: '#577e28' },
  tabText: { color: '#363230', textAlign: 'center', fontWeight: '600', fontSize: 14 },
  activeTabText: { color: '#fff' },
  search: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#c8c8c8',
    borderRadius: 8,
    paddingHorizontal: 14,
    minHeight: 48,
    fontSize: 16,
    color: '#2d2926',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d6d4d3',
    marginBottom: 12,
    overflow: 'hidden',
  },
  buildingHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, minHeight: 64 },
  buildingCopy: { flex: 1, gap: 4 },
  buildingName: { color: '#2d2926', fontSize: 17, fontWeight: '700' },
  count: { color: '#577e28', fontSize: 14, fontWeight: '700' },
  distance: { color: '#aa2c3b', fontSize: 14, fontWeight: '600' },
  chevron: { fontSize: 25, color: '#2d2926' },
  aed: { borderTopWidth: 1, borderTopColor: '#e1e4e5', paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  note: { color: '#363230', fontSize: 16, lineHeight: 22, fontWeight: '600' },
  detail: { color: '#575350', fontSize: 14, lineHeight: 20 },
  source: { color: '#75716e', fontSize: 12, marginTop: 8 },
});
