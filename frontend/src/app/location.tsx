import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { DataState, EmergencyScreen, ui } from '@/components/emergency/screen';
import { useAedBuildings } from '@/hooks/use-emergency-data';
import { useSelectedBuilding } from '@/hooks/use-selected-building';

export default function LocationScreen() {
  const query = useAedBuildings();
  const { building, selectBuilding } = useSelectedBuilding();
  const [selected, setSelected] = useState(building?.id);
  const [search, setSearch] = useState('');
  const term = search.trim().toLowerCase();
  const buildings = (query.data ?? []).filter((item) =>
    `${item.name} ${item.address} ${item.campus}`.toLowerCase().includes(term)
  );
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const choice = query.data?.find((item) => item.id === selected);
  return (
    <EmergencyScreen back>
      <Text accessibilityRole="header" style={ui.title}>
        Edit Your Location
      </Text>
      <Text style={[ui.body, styles.intro]}>
        Choose your building to view its AED locations. You can do this without location permission.
      </Text>
      <TextInput
        accessibilityLabel="Search BU buildings"
        placeholder="Search building, address, or campus"
        placeholderTextColor="#75716e"
        value={search}
        onChangeText={setSearch}
        autoCorrect={false}
        style={styles.search}
      />
      <Text style={styles.caption}>Buildings available in the BU AED directory</Text>
      <DataState
        {...query}
        empty={!buildings.length}
        emptyMessage="No matching buildings. Try another name or address."
      />
      {!query.loading &&
        !query.error &&
        buildings.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected === item.id }}
            accessibilityLabel={`${item.name}, ${item.address}, ${item.campus}`}
            onPress={() => setSelected(item.id)}
            style={[styles.option, selected === item.id && styles.selected]}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={ui.body}>{item.address}</Text>
            <Text style={styles.caption}>
              {item.campus}
              {selected === item.id ? ' · Selected' : ''}
            </Text>
          </Pressable>
        ))}
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={!choice || query.loading || !!query.error}
          accessibilityState={{ disabled: !choice || query.loading || !!query.error }}
          style={[ui.darkButton, (!choice || query.loading || !!query.error) && ui.pressed]}
          onPress={() => {
            if (choice) {
              selectBuilding(choice);
              close();
            }
          }}
        >
          <Text style={ui.helpText}>Save and close</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.secondary} onPress={close}>
          <Text style={ui.body}>Cancel</Text>
        </Pressable>
        {building && (
          <Pressable
            accessibilityRole="button"
            style={styles.secondary}
            onPress={() => {
              selectBuilding(undefined);
              close();
            }}
          >
            <Text style={ui.body}>Clear manual building selection</Text>
          </Pressable>
        )}
      </View>
    </EmergencyScreen>
  );
}
const styles = StyleSheet.create({
  intro: { marginVertical: 16 },
  search: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#c8c8c8',
    borderRadius: 10,
    padding: 14,
    minHeight: 48,
    fontSize: 16,
    color: '#2d2926',
    marginBottom: 12,
  },
  caption: { color: '#575350', fontSize: 13, marginBottom: 8 },
  option: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d6d4d3',
    borderRadius: 10,
    padding: 16,
    gap: 4,
    marginTop: 10,
  },
  selected: { backgroundColor: '#f9dfe1', borderColor: '#aa2c3b' },
  name: { color: '#2d2926', fontSize: 17, fontWeight: '700' },
  actions: { gap: 10, marginTop: 20 },
  secondary: { padding: 14, minHeight: 48, alignItems: 'center', backgroundColor: '#e0e3e7', borderRadius: 10 },
});
