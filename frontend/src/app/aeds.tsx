import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { DirectionsLink } from '@/components/emergency/contact-card';
import { DataState, EmergencyScreen, ui } from '@/components/emergency/screen';
import { useCurrentLocation } from '@/hooks/use-current-location';
import { useAedBuildings } from '@/hooks/use-emergency-data';
import { useSelectedBuilding } from '@/hooks/use-selected-building';
import type { Aed, AedBuilding } from '@/services/emergency-data';

const campusTabs = [
  ['CRC', 'Charles River'],
  ['FEN', 'Fenway'],
  ['MED', 'Medical'],
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
function BuildingCard({ building, initiallyExpanded = false }: { building: AedBuilding; initiallyExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const count = `${building.aeds.length} AED${building.aeds.length === 1 ? '' : 's'}`;
  const showAddress = building.address !== building.name;
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={[building.name, showAddress && building.address, count].filter(Boolean).join(', ')}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(!expanded)}
        style={({ pressed }) => [styles.buildingHeader, pressed && ui.pressed]}
      >
        <View style={styles.buildingCopy}>
          <Text style={styles.buildingName}>{building.name}</Text>
          {showAddress && <Text style={styles.detail}>{building.address}</Text>}
        </View>
        <Text style={styles.count}>{count}</Text>
        <Text accessible={false} style={styles.chevron}>
          {expanded ? '⌃' : '⌄'}
        </Text>
      </Pressable>
      {expanded && (
        <>
          <DirectionsLink address={building.address} />
          {!building.aeds.length && <Text style={styles.aed}>No AED locations are listed for this building.</Text>}
          {building.aeds.map((aed) => (
            <AedRow key={aed.id} aed={aed} />
          ))}
        </>
      )}
    </View>
  );
}
export default function AedScreen() {
  const query = useAedBuildings();
  const location = useCurrentLocation();
  const { building: selectedBuilding } = useSelectedBuilding();
  const [chosenCampus, setChosenCampus] = useState<AedCampus>();
  const [search, setSearch] = useState('');
  // Until the user picks a campus, follow the one their location is on.
  const detectedCampus = location.status === 'ready' ? location.campus : undefined;
  const selectedCampus = campusTabs.find(([value]) => value === selectedBuilding?.campus)?.[0];
  const campus: AedCampus = chosenCampus ?? selectedCampus ?? detectedCampus ?? 'CRC';
  const currentBuilding = query.data?.find((item) => item.id === selectedBuilding?.id);
  const term = search.trim().toLowerCase();
  const buildings = (query.data ?? []).filter(
    (building) =>
      building.campus === campus &&
      (!term || building.name.toLowerCase().includes(term) || building.address.toLowerCase().includes(term))
  );
  return (
    <EmergencyScreen back>
      <Text accessibilityRole="header" style={ui.title}>
        Find an AED
      </Text>
      <Text style={[ui.subtitle, styles.intro]}>
        Choose your campus, then tap your building to see where its defibrillators are.
        {!chosenCampus && detectedCampus ? ' Campus selected from your location.' : ''}
      </Text>
      {!query.loading && !query.error && currentBuilding && (
        <View>
          <Text accessibilityRole="header" style={styles.buildingName}>
            AEDs in your selected building
          </Text>
          <BuildingCard key={`selected-${currentBuilding.id}`} building={currentBuilding} initiallyExpanded />
          <Text style={styles.intro}>Browse other buildings below</Text>
        </View>
      )}
      {!query.loading && !query.error && selectedBuilding && !currentBuilding && (
        <Text style={ui.body}>
          Your selected building is no longer in the directory. Use Edit to choose another building.
        </Text>
      )}
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
        buildings.map((building) => <BuildingCard key={building.id} building={building} />)}
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
  chevron: { fontSize: 25, color: '#2d2926' },
  aed: { borderTopWidth: 1, borderTopColor: '#e1e4e5', paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  note: { color: '#363230', fontSize: 16, lineHeight: 22, fontWeight: '600' },
  detail: { color: '#575350', fontSize: 14, lineHeight: 20 },
  source: { color: '#75716e', fontSize: 12, marginTop: 8 },
});
