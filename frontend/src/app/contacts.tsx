import { useRef, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { EmergencyIcon } from '@/components/emergency/icon';
import { DataState, EmergencyScreen, ui } from '@/components/emergency/screen';
import { useContacts } from '@/hooks/use-emergency-data';
import type { Contact } from '@/services/emergency-data';

export default function ContactsScreen() {
  const query = useContacts();
  const [campus, setCampus] = useState('CRC');
  const [selected, setSelected] = useState<Contact | null>(null);
  const [dialing, setDialing] = useState(false);
  const [callError, setCallError] = useState('');
  const callInFlight = useRef(false);
  const contacts = [...(query.data ?? [])]
    .filter((contact) => contact.campus === campus || contact.campus === 'ALL')
    .sort((a, b) => a.sort_order - b.sort_order);
  function close() {
    if (!callInFlight.current) {
      setSelected(null);
      setCallError('');
    }
  }
  async function call() {
    if (!selected || callInFlight.current) return;
    callInFlight.current = true;
    setDialing(true);
    setCallError('');
    try {
      const phone = selected.phone.replace(/[\s().-]/g, '');
      if (!/^\+?\d+$/.test(phone)) throw new Error('Invalid number');
      await Linking.openURL('tel:' + phone);
      setSelected(null);
    } catch {
      setCallError('Unable to open the phone app. You can dial the displayed number manually.');
    } finally {
      callInFlight.current = false;
      setDialing(false);
    }
  }
  return (
    <EmergencyScreen back help={false}>
      <Text accessibilityRole="header" style={ui.title}>
        Emergency Contacts
      </Text>
      <Text style={[ui.subtitle, styles.intro]}>Choose your campus, then tap a contact.</Text>
      <View style={styles.tabs}>
        {[
          ['CRC', 'Charles River Campus'],
          ['MED', 'Medical Campus'],
        ].map(([value, label]) => (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityState={{ selected: campus === value }}
            onPress={() => setCampus(value)}
            style={[styles.tab, campus === value && styles.activeTab]}
          >
            <Text style={[styles.tabText, campus === value && styles.activeTabText]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <DataState {...query} empty={!contacts.length} emptyMessage="No contacts are available for this campus." />
      {!query.loading &&
        !query.error &&
        contacts.map((contact) => (
          <Pressable
            key={contact.id}
            accessibilityRole="button"
            accessibilityLabel={`Call ${contact.name}, ${contact.phone}`}
            onPress={() => {
              setSelected(contact);
              setCallError('');
            }}
            style={({ pressed }) => [styles.contact, contact.id === '911' && styles.urgent, pressed && ui.pressed]}
          >
            <View style={styles.contactCopy}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.phone}>{contact.phone}</Text>
              <Text style={styles.description}>{contact.description}</Text>
            </View>
            <View style={styles.phoneIcon}>
              <EmergencyIcon name="phone" size={22} />
            </View>
          </Pressable>
        ))}
      <Modal visible={selected !== null} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.backdrop}>
          <View accessibilityViewIsModal style={styles.dialog}>
            <View style={styles.modalIcon}>
              <EmergencyIcon name="phone" size={28} />
            </View>
            <Text accessibilityRole="header" style={styles.confirmTitle}>
              CONFIRM CALL
            </Text>
            <Text style={styles.selectedName}>{selected?.name}</Text>
            <Text selectable style={styles.modalPhone}>
              {selected?.phone}
            </Text>
            <Text style={styles.description}>Your phone app will open to place this call.</Text>
            {!!callError && (
              <Text accessibilityRole="alert" style={styles.error}>
                {callError}
              </Text>
            )}
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                disabled={dialing}
                onPress={close}
                style={[styles.cancel, styles.action]}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: dialing }}
                disabled={dialing}
                onPress={call}
                style={[ui.darkButton, styles.action, dialing && ui.pressed]}
              >
                <Text style={ui.helpText}>{dialing ? 'Opening…' : 'Call Now'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  contact: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d6d4d3',
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  urgent: { backgroundColor: '#f6d6d9', borderColor: '#e7b1b6' },
  contactCopy: { flex: 1, gap: 6 },
  contactName: { color: '#a32332', fontSize: 17, fontWeight: '700' },
  phone: { color: '#2d2926', fontSize: 17, fontWeight: '600' },
  description: { color: '#575350', fontSize: 14, lineHeight: 20 },
  phoneIcon: { backgroundColor: '#a62b36', borderRadius: 22, padding: 10 },
  backdrop: { flex: 1, backgroundColor: '#00000080', justifyContent: 'center', padding: 24 },
  dialog: {
    backgroundColor: '#f0f4f5',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 12,
  },
  modalIcon: { backgroundColor: '#a62b36', padding: 14, borderRadius: 30 },
  confirmTitle: { color: '#a62b36', fontSize: 21, fontWeight: '800' },
  selectedName: { color: '#2d2926', fontSize: 18, fontWeight: '600', textAlign: 'center' },
  modalPhone: { color: '#363230', fontSize: 22 },
  actions: { width: '100%', flexDirection: 'row', gap: 12, marginTop: 10 },
  action: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  cancel: { backgroundColor: '#e0e3e7', borderRadius: 10, minHeight: 48, padding: 14 },
  cancelText: { color: '#363230', fontSize: 16, fontWeight: '600' },
  error: { color: '#a32332', fontSize: 14, lineHeight: 20 },
});
