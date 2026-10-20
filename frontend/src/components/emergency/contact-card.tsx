import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmergencyIcon } from '@/components/emergency/icon';
import { ui } from '@/components/emergency/screen';
import { openDirections } from '@/lib/maps';
import { formatPhone } from '@/lib/phone';
import type { ContactInfo } from '@/services/emergency-data';

/** Tappable address line that opens the address in a map app. */
export function DirectionsLink({ address }: { address: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Directions to ${address}`}
      onPress={() => openDirections(address)}
      style={({ pressed }) => [styles.address, pressed && ui.pressed]}
    >
      <View style={styles.addressIcon}>
        <EmergencyIcon name="location" size={16} />
      </View>
      <Text style={styles.addressText}>{address}</Text>
      <Text style={styles.directions}>Directions ›</Text>
    </Pressable>
  );
}

/**
 * One contact laid out line by line: name, formatted number, what it is for, and (when known) the address
 * with directions. Tapping the top part asks to confirm the call.
 */
export function ContactCard({
  contact,
  onCall,
  campusLabel,
}: {
  contact: ContactInfo;
  onCall: (contact: ContactInfo) => void;
  /** Shown when numbers for both campuses are listed together, e.g. 'Charles River Campus'. */
  campusLabel?: string;
}) {
  const phone = formatPhone(contact.phone);
  return (
    <View style={[styles.card, contact.id === '911' && styles.urgent]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Call ${contact.name}${campusLabel ? `, ${campusLabel}` : ''}, ${phone}`}
        onPress={() => onCall(contact)}
        style={({ pressed }) => [styles.call, pressed && ui.pressed]}
      >
        <View style={styles.copy}>
          <Text style={styles.name}>{contact.name}</Text>
          {campusLabel && <Text style={styles.campus}>{campusLabel}</Text>}
          <Text style={styles.phone}>{phone}</Text>
          <Text style={styles.description}>{contact.description}</Text>
        </View>
        <View style={styles.phoneIcon}>
          <EmergencyIcon name="phone" size={22} />
        </View>
      </Pressable>
      {contact.address && <DirectionsLink address={contact.address} />}
    </View>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#d6d4d3', marginBottom: 12 },
  urgent: { backgroundColor: '#f6d6d9', borderColor: '#e7b1b6' },
  call: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1, gap: 4 },
  name: { color: '#a32332', fontSize: 17, fontWeight: '700' },
  campus: { color: '#575350', fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  phone: { color: '#2d2926', fontSize: 18, fontWeight: '600' },
  description: { color: '#575350', fontSize: 14, lineHeight: 20 },
  phoneIcon: { backgroundColor: '#a62b36', borderRadius: 22, padding: 10 },
  address: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#e1e4e5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  addressIcon: { backgroundColor: '#2d2926', borderRadius: 14, padding: 6 },
  addressText: { flex: 1, color: '#363230', fontSize: 15, lineHeight: 21 },
  directions: { color: '#286b9c', fontSize: 15, fontWeight: '700' },
});
