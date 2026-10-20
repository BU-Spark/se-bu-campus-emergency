import { useRef, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { EmergencyIcon } from '@/components/emergency/icon';
import { ui } from '@/components/emergency/screen';
import { formatPhone } from '@/lib/phone';
import type { ContactInfo } from '@/services/emergency-data';

type Callable = Pick<ContactInfo, 'name' | 'phone'>;

/**
 * Confirm-before-dialing flow shared by every screen with call buttons. Render `confirmation` once and
 * call `requestCall(contact)` from a button; the phone app only opens after the user taps "Call Now".
 */
export function useCallConfirmation() {
  const [selected, setSelected] = useState<Callable | null>(null);
  const [dialing, setDialing] = useState(false);
  const [callError, setCallError] = useState('');
  const callInFlight = useRef(false);
  function requestCall(contact: Callable) {
    setSelected(contact);
    setCallError('');
  }
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
  const confirmation = (
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
            {selected && formatPhone(selected.phone)}
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
  );
  return { requestCall, confirmation };
}
const styles = StyleSheet.create({
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
  description: { color: '#575350', fontSize: 14, lineHeight: 20 },
  actions: { width: '100%', flexDirection: 'row', gap: 12, marginTop: 10 },
  action: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  cancel: { backgroundColor: '#e0e3e7', borderRadius: 10, minHeight: 48, padding: 14 },
  cancelText: { color: '#363230', fontSize: 16, fontWeight: '600' },
  error: { color: '#a32332', fontSize: 14, lineHeight: 20 },
});
