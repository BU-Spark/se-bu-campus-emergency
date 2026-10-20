import * as Location from 'expo-location';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { findCampus, type Campus, type Point } from '@/lib/campus';

export type LocationState =
  | { status: 'idle' } // no LocationProvider above this component
  | { status: 'loading' }
  | { status: 'denied'; canAskAgain: boolean }
  | { status: 'unavailable' } // permission granted, but the device could not provide a position
  | { status: 'ready'; coords: Point & { accuracy: number | null }; campus?: Campus; address?: string };

export type CurrentLocation = LocationState & {
  /** Asks for permission (if still possible) and looks up the position again. */
  refresh: () => void;
};

const LocationContext = createContext<CurrentLocation>({ status: 'idle', refresh: () => {} });

/** How long to wait for a fresh GPS fix before falling back to the last known position. */
const POSITION_TIMEOUT_MS = 15000;

async function currentPosition(): Promise<Location.LocationObject | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), POSITION_TIMEOUT_MS);
    });
    const fix = await Promise.race([Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }), timeout]);
    return fix ?? (await Location.getLastKnownPositionAsync());
  } catch {
    return Location.getLastKnownPositionAsync().catch(() => null);
  } finally {
    clearTimeout(timer);
  }
}

/** A short street address such as "881 Commonwealth Avenue", or undefined if lookup fails (e.g. on web). */
async function streetAddress(point: Point): Promise<string | undefined> {
  try {
    const [place] = await Location.reverseGeocodeAsync(point);
    if (!place) return undefined;
    return [place.streetNumber, place.street].filter(Boolean).join(' ') || place.name || undefined;
  } catch {
    return undefined;
  }
}

async function locate(): Promise<LocationState> {
  let permission = await Location.getForegroundPermissionsAsync();
  if (permission.status !== 'granted' && permission.canAskAgain) {
    permission = await Location.requestForegroundPermissionsAsync();
  }
  if (permission.status !== 'granted') return { status: 'denied', canAskAgain: permission.canAskAgain };

  const position = await currentPosition();
  if (!position) return { status: 'unavailable' };

  const { latitude, longitude, accuracy } = position.coords;
  const coords = { latitude, longitude, accuracy };
  return { status: 'ready', coords, campus: findCampus(coords), address: await streetAddress(coords) };
}

/** Looks up the user's location once when the app opens and shares it with every screen. */
export function LocationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LocationState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    locate().then(
      (next) => {
        if (!cancelled) setState(next);
      },
      () => {
        if (!cancelled) setState({ status: 'unavailable' });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const refresh = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  return <LocationContext.Provider value={{ ...state, refresh }}>{children}</LocationContext.Provider>;
}

export function useCurrentLocation(): CurrentLocation {
  return useContext(LocationContext);
}
