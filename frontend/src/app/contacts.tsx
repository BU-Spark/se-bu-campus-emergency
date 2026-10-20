import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCallConfirmation } from '@/components/emergency/call-confirmation';
import { ContactCard } from '@/components/emergency/contact-card';
import { DataState, EmergencyScreen, ui } from '@/components/emergency/screen';
import { useCurrentLocation } from '@/hooks/use-current-location';
import { useContacts, useEmergencyTypes } from '@/hooks/use-emergency-data';
import type { Campus } from '@/lib/campus';

const campusTabs = [
  ['CRC', 'Charles River Campus'],
  ['MED', 'Medical Campus'],
] as const;

export default function ContactsScreen() {
  // Opened from an emergency's "Call for Help", e.g. /contacts?emergency=fire, it lists only that emergency's contacts.
  const params = useLocalSearchParams<{ emergency?: string | string[] }>();
  const emergency = Array.isArray(params.emergency) ? params.emergency[0] : params.emergency;
  const query = useContacts();
  const types = useEmergencyTypes();
  const location = useCurrentLocation();
  const [chosenCampus, setChosenCampus] = useState<Campus>();
  const [showAll, setShowAll] = useState(false);
  const { requestCall, confirmation } = useCallConfirmation();
  // Until the user picks a campus, follow the one their location is on.
  const detectedCampus = location.status === 'ready' ? location.campus : undefined;
  const campus = chosenCampus ?? detectedCampus ?? 'CRC';
  const all = query.data ?? [];
  const forEmergency = emergency && !showAll ? all.filter((contact) => contact.emergencies.includes(emergency)) : [];
  // Emergencies without their own contacts (e.g. Extreme Weather) fall back to the full list.
  const filtered = forEmergency.length > 0;
  const emergencyName = types.data?.find((type) => type.id === emergency)?.name;
  const contacts = (filtered ? forEmergency : all)
    .filter((contact) => contact.campus === campus || contact.campus === 'ALL')
    .sort((a, b) => a.sort_order - b.sort_order);
  return (
    <EmergencyScreen back help={false}>
      <Text accessibilityRole="header" style={ui.title}>
        {filtered && emergencyName ? `${emergencyName} Contacts` : 'Emergency Contacts'}
      </Text>
      <Text style={[ui.subtitle, styles.intro]}>
        {filtered ? 'Numbers to call for this emergency. ' : ''}Choose your campus, then tap a contact.
        {!chosenCampus && detectedCampus ? ' Campus selected from your location.' : ''}
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
      <DataState {...query} empty={!contacts.length} emptyMessage="No contacts are available for this campus." />
      {!query.loading &&
        !query.error &&
        contacts.map((contact) => <ContactCard key={contact.id} contact={contact} onCall={requestCall} />)}
      {filtered && !query.loading && !query.error && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowAll(true)}
          style={({ pressed }) => [styles.showAll, pressed && ui.pressed]}
        >
          <Text style={styles.showAllText}>View all contacts</Text>
        </Pressable>
      )}
      {confirmation}
    </EmergencyScreen>
  );
}
const styles = StyleSheet.create({
  intro: { textAlign: 'left', marginBottom: 20 },
  tabs: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', backgroundColor: '#e1e4e5', marginBottom: 20 },
  tab: { flex: 1, padding: 12, minHeight: 50, justifyContent: 'center' },
  activeTab: { backgroundColor: '#a62b36' },
  tabText: { color: '#363230', textAlign: 'center', fontWeight: '600', fontSize: 14 },
  activeTabText: { color: '#fff' },
  showAll: { alignSelf: 'center', minHeight: 48, justifyContent: 'center', paddingHorizontal: 20, marginTop: 4 },
  showAllText: { color: '#286b9c', fontSize: 16, fontWeight: '700', textDecorationLine: 'underline' },
});
