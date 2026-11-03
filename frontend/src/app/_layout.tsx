import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f0f4f5' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="emergency/[id]" />
        <Stack.Screen name="contacts" />
      </Stack>
    </>
  );
}
