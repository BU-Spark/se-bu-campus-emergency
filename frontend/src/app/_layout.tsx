import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { LocationProvider } from '@/hooks/use-current-location';
import { BuildingProvider } from '@/hooks/use-selected-building';

export default function RootLayout() {
  return (
    <LocationProvider>
      <BuildingProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f0f4f5' } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="emergency/[id]" />
          <Stack.Screen name="contacts" />
          <Stack.Screen name="aeds" />
          <Stack.Screen name="location" />
        </Stack>
      </BuildingProvider>
    </LocationProvider>
  );
}
