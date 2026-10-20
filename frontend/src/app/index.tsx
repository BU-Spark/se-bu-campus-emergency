import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmergencyIcon, emergencyPresentation } from '@/components/emergency/icon';
import { DataState, EmergencyScreen, ui } from '@/components/emergency/screen';
import { useEmergencyTypes } from '@/hooks/use-emergency-data';
import { useSelectedBuilding } from '@/hooks/use-selected-building';

const order = ['fire', 'medical', 'hazardous-spill', 'utilities', 'violence', 'suspicious-package', 'weather'];
export default function HomeScreen() {
  const query = useEmergencyTypes();
  const { building } = useSelectedBuilding();
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length);
  const types = [...(query.data ?? [])].sort((a, b) => rank(a.id) - rank(b.id) || a.sort_order - b.sort_order);
  return (
    <EmergencyScreen>
      <Text accessibilityRole="header" style={[ui.title, styles.heading]}>
        Select an Emergency
      </Text>
      <Text style={ui.subtitle}>Choose a category to view instructions</Text>
      <DataState {...query} empty={!types.length} emptyMessage="No emergency categories are available." />
      {!query.loading && !query.error && (
        <View style={styles.grid}>
          {types.map((type) => (
            <Pressable
              key={type.id}
              accessibilityRole="button"
              accessibilityLabel={`View ${type.name} guidance`}
              onPress={() => router.push({ pathname: '/emergency/[id]', params: { id: type.id } })}
              style={({ pressed }) => [styles.card, pressed && ui.pressed]}
            >
              <View style={styles.circle}>
                <EmergencyIcon name={type.id} size={48} />
              </View>
              <Text style={styles.label}>{emergencyPresentation(type.id).label ?? type.name.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <View style={styles.resources}>
        <Text accessibilityRole="header" style={styles.resourceTitle}>
          Building resources
        </Text>
        <Text style={ui.body}>{building ? building.name : 'Select a building to find its AED locations.'}</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/aeds')} style={ui.darkButton}>
          <Text style={ui.helpText}>Find an AED</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push('/location')} style={ui.back}>
          <Text style={ui.backText}>{building ? 'Change building' : 'Choose building'}</Text>
        </Pressable>
      </View>
    </EmergencyScreen>
  );
}
const styles = StyleSheet.create({
  resources: { padding: 16, backgroundColor: '#fff', borderRadius: 12, gap: 12 },
  resourceTitle: { color: '#2d2926', fontSize: 20, fontWeight: '700' },
  heading: { textAlign: 'center', marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 20, paddingVertical: 24 },
  card: {
    width: '43%',
    maxWidth: 180,
    minHeight: 136,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#c8c8c8',
    borderRadius: 12,
    boxShadow: '0px 4px 3px #00000026',
  },
  circle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#aa2c3b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: '#2d2926', fontSize: 17, textAlign: 'center', fontWeight: '500' },
});
