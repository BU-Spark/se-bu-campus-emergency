import { Image } from 'expo-image';

// Local vector artwork renders consistently across mobile and web without emoji fonts.
const paths: Record<string, string> = {
  fire: '<path d="M13 2c2 6-4 7-1 11 1-2 3-3 3-5 5 5 7 9 3 13-4 4-12 2-13-3-1-4 2-7 4-9-1 4 0 5 1 5-2-5 4-7 3-12Z"/>',
  medical:
    '<path d="M8 3h8v4h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4V3Zm2 2v2h4V5h-4Zm0 5v3H7v4h3v3h4v-3h3v-4h-3v-3h-4Z" fill-rule="evenodd"/>',
  'hazardous-spill':
    '<g fill="none" stroke="white" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M9 2C3 5 5 11 9 12M15 2c6 3 4 9 0 10M3 13c-1 7 6 10 9 5m9-5c1 7-6 10-9 5M7 21c-6-3-3-10 2-10m8 10c6-3 3-10-2-10"/></g>',
  utilities: '<path d="M14 2a7 7 0 0 0-8 9L1 16a3 3 0 0 0 5 5l6-6a7 7 0 0 0 9-8l-5 4-4-4 2-5Z"/>',
  violence: '<path d="m12 2 11 20H1L12 2Zm-1 6v7h2V8h-2Zm0 9v3h2v-3h-2Z" fill-rule="evenodd"/>',
  'suspicious-package':
    '<circle cx="11" cy="15" r="8"/><path d="m14 7 3-3-2-2-3 3Z"/><path d="M17 3c3-3 3 3 5 1" stroke="white" fill="none" stroke-width="2"/>',
  weather:
    '<path d="M6 16a5 5 0 1 1 0-10 7 7 0 0 1 13 1 4.5 4.5 0 1 1 0 9h-4l2-5h-6l-3 5H6Z"/><path d="m11 13-3 7h4l-1 4 7-9h-5l1-2Z"/>',
  phone:
    '<path d="m5 2 4 5-3 3c2 4 4 6 8 8l3-3 5 4c-2 6-7 4-12 1S1 10 2 5l3-3Z" fill="none" stroke="white" stroke-width="1.8"/>',
  location:
    '<path d="M12 22S4 14 4 9a8 8 0 1 1 16 0c0 5-8 13-8 13Z" fill="none" stroke="white" stroke-width="2"/><circle cx="12" cy="9" r="3"/>',
};
const presentations: Record<string, { label: string; color: string }> = {
  fire: { label: 'FIRE', color: '#a62b36' },
  medical: { label: 'MEDICAL', color: '#577e28' },
  'hazardous-spill': { label: 'SPILL', color: '#ac650b' },
  utilities: { label: 'UTILITIES', color: '#286b9c' },
  violence: { label: 'VIOLENCE', color: '#8a6b08' },
  'suspicious-package': { label: 'SUSPICIOUS', color: '#48525f' },
  weather: { label: 'WEATHER', color: '#79488f' },
};
export function emergencyPresentation(id: string): { label?: string; color: string } {
  return presentations[id] ?? { color: '#aa2c3b' };
}
export function EmergencyIcon({ name, size = 28 }: { name: string; size?: number }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 26" fill="white">${paths[name] ?? paths.medical}</svg>`;
  return (
    <Image
      accessible={false}
      source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` }}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}
