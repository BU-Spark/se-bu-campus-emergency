import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';

export default function ContactsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ThemedText type="title">Emergency Contacts</ThemedText>
      <ThemedText>BUPD, Student Health Services, and more coming soon.</ThemedText>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
});
