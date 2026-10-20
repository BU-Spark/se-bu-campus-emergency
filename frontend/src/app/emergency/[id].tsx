import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCallConfirmation } from '@/components/emergency/call-confirmation';
import { ContactCard } from '@/components/emergency/contact-card';
import { EmergencyIcon, emergencyPresentation } from '@/components/emergency/icon';
import { DataState, EmergencyScreen, ui } from '@/components/emergency/screen';
import { useCurrentLocation } from '@/hooks/use-current-location';
import { useEmergencyTypes, useGuidanceSteps } from '@/hooks/use-emergency-data';
import { campuses, type Campus } from '@/lib/campus';
import type { ContactInfo, GuidanceStep } from '@/services/emergency-data';

/** In-app screens a step can link to (guidance_steps.link), with the button label shown in the step. */
const stepLinks = { '/aeds': 'FIND AN AED' } as const;
const isStepLink = (link: string | null): link is keyof typeof stepLinks => !!link && link in stepLinks;

function StepCard({
  step,
  color,
  campus,
  onCall,
}: {
  step: GuidanceStep;
  color: string;
  campus?: Campus;
  onCall: (contact: ContactInfo) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  // Campus-specific numbers (BUPD, Facilities) are stored for both campuses; show the user's campus only,
  // or both with a label when the campus is not known.
  const contacts = step.contacts.filter((contact) => contact.campus === 'ALL' || !campus || contact.campus === campus);
  const link = step.link;
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
      {expanded && (
        <View style={styles.stepBody}>
          <Text style={ui.body}>{step.body}</Text>
          {isStepLink(link) && (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(link)}
              style={({ pressed }) => [styles.linkButton, { backgroundColor: color }, pressed && ui.pressed]}
            >
              <Text style={ui.helpText}>{stepLinks[link]}</Text>
            </Pressable>
          )}
          {contacts.length > 0 && (
            <View style={styles.contacts}>
              {contacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onCall={onCall}
                  campusLabel={
                    !campus && contact.campus !== 'ALL' ? campuses[contact.campus as Campus]?.name : undefined
                  }
                />
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
export default function GuidanceScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';
  const query = useGuidanceSteps(id);
  const types = useEmergencyTypes();
  const location = useCurrentLocation();
  const { requestCall, confirmation } = useCallConfirmation();
  const campus = location.status === 'ready' ? location.campus : undefined;
  const presentation = emergencyPresentation(id);
  const name = types.data?.find((type) => type.id === id)?.name ?? presentation.label ?? 'Emergency guidance';
  const steps = [...(query.data ?? [])].sort((a, b) => a.step_order - b.step_order);
  return (
    <EmergencyScreen back emergency={id}>
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
            <StepCard step={step} color={presentation.color} campus={campus} onCall={requestCall} />
          </View>
        ))}
      {confirmation}
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
  stepBody: { paddingHorizontal: 16, paddingBottom: 16, gap: 14 },
  linkButton: {
    minHeight: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  contacts: { marginBottom: -12 },
});
