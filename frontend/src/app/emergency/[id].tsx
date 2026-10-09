import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmergencyIcon, emergencyPresentation } from '@/components/emergency/icon';
import { DataState, EmergencyScreen, ui } from '@/components/emergency/screen';
import { useEmergencyTypes, useGuidanceSteps } from '@/hooks/use-emergency-data';
import type { GuidanceStep } from '@/services/emergency-data';

function StepCard({ step, color }: { step: GuidanceStep; color: string }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={step.title}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(!expanded)}
        style={styles.stepHeader}
      >
        <View style={[styles.number, { backgroundColor: color }]}>
          <Text style={styles.numberText}>{step.step_order}</Text>
        </View>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text accessible={false} style={styles.chevron}>
          {expanded ? '⌃' : '⌄'}
        </Text>
      </Pressable>
      {expanded && <Text style={[ui.body, styles.stepBody]}>{step.body}</Text>}
    </View>
  );
}
export default function GuidanceScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';
  const query = useGuidanceSteps(id);
  const types = useEmergencyTypes();
  const presentation = emergencyPresentation(id);
  const name = types.data?.find((type) => type.id === id)?.name ?? presentation.label ?? 'Emergency guidance';
  const steps = [...(query.data ?? [])].sort((a, b) => a.step_order - b.step_order);
  return (
    <EmergencyScreen back>
      <View style={styles.heading}>
        <View style={[styles.categoryIcon, { backgroundColor: presentation.color }]}>
          <EmergencyIcon name={id} size={30} />
        </View>
        <Text accessibilityRole="header" style={[ui.title, styles.title]}>
          {name}
        </Text>
      </View>
      <Text style={[ui.subtitle, styles.subtitle]}>Emergency instructions · BU EHS</Text>
      <DataState {...query} empty={!steps.length} emptyMessage="No guidance is available for this category." />
      {!query.loading &&
        !query.error &&
        steps.map((step, index) => (
          <View key={`${id}-${step.id}`}>
            {step.section && step.section !== steps[index - 1]?.section && (
              <Text accessibilityRole="header" style={styles.section}>
                {step.section}
              </Text>
            )}
            <StepCard step={step} color={presentation.color} />
          </View>
        ))}
    </EmergencyScreen>
  );
}
const styles = StyleSheet.create({
  heading: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  categoryIcon: { width: 48, height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 24 },
  subtitle: { textAlign: 'left', marginBottom: 22 },
  section: { fontSize: 18, fontWeight: '700', color: '#2d2926', marginTop: 12, marginBottom: 12 },
  card: { backgroundColor: '#e3d5d3', borderRadius: 8, marginBottom: 12, overflow: 'hidden' },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, minHeight: 68 },
  number: { minWidth: 40, minHeight: 42, padding: 6, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  numberText: { color: '#fff', fontSize: 23, fontWeight: '800' },
  stepTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#2d2926' },
  chevron: { fontSize: 25, color: '#2d2926' },
  stepBody: { paddingHorizontal: 16, paddingBottom: 16 },
});
