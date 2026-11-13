import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NearbyMap as NativeNearbyMap } from './nearby-map';

export type { MapPlace } from './nearby-map';

type Props = ComponentProps<typeof NativeNearbyMap>;

/**
 * Web version of the nearby map (react-native-maps has no web support): an OpenStreetMap map drawn with
 * Leaflet, with a blue dot for the user and red dots for the places. As on native, the small preview
 * can't be panned (so it doesn't fight the page scroll) and the `interactive` one can; clicking a place
 * there opens a popup whose "View AEDs" button calls `onSelect`.
 *
 * Leaflet uses `window` as soon as it loads, and web pages are first rendered on the server (app.json
 * "output": "static") where there is no window, so it is only loaded in the browser, inside the effect.
 */
export function NearbyMap({ onSelect, ...props }: Props) {
  const container = useRef<View>(null);
  const select = useRef(onSelect);
  useEffect(() => {
    select.current = onSelect;
  }, [onSelect]);
  // Leaflet manages its own DOM, so rebuild it only when what it shows changes, not on every render.
  const signature = JSON.stringify(props);

  useEffect(() => {
    const { center, places, fit, interactive = false }: Omit<Props, 'onSelect'> = JSON.parse(signature);
    let map: LeafletMap | undefined;
    let cancelled = false;
    void import('leaflet').then(({ default: L }) => {
      if (cancelled || !container.current) return;
      map = L.map(container.current as unknown as HTMLElement, {
        zoomControl: interactive,
        dragging: interactive,
        touchZoom: interactive,
        doubleClickZoom: interactive,
        scrollWheelZoom: interactive,
        boxZoom: interactive,
        keyboard: interactive,
      });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      for (const place of places) {
        const marker = L.circleMarker([place.latitude, place.longitude], {
          radius: interactive ? 8 : 7,
          color: '#fff',
          weight: 2,
          fillColor: '#cc0000',
          fillOpacity: 0.9,
        });
        if (interactive) marker.bindPopup(popup(place, () => select.current?.(place.id)));
        else marker.bindTooltip(`<b>${escapeHtml(place.name)}</b><br>${escapeHtml(place.detail)}`);
        marker.addTo(map);
      }
      L.circleMarker([center.latitude, center.longitude], {
        radius: 8,
        color: '#fff',
        weight: 3,
        fillColor: '#1a73e8',
        fillOpacity: 1,
      })
        .bindTooltip('You are here')
        .addTo(map);
      const bounds = L.latLngBounds([center, ...fit].map((point) => [point.latitude, point.longitude]));
      map.fitBounds(bounds.pad(0.3), { maxZoom: 17 });
      // The full-screen map's container can still be sizing itself when Leaflet measures it.
      if (interactive) setTimeout(() => map?.invalidateSize(), 250);
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [signature]);

  return (
    <View
      ref={container}
      accessibilityElementsHidden
      style={[styles.map, props.interactive ? styles.full : styles.preview]}
    />
  );
}

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

/** Popup content: the place's name and detail, and a "View AEDs" button. */
function popup(place: Props['places'][number], onPress: () => void): HTMLElement {
  const element = document.createElement('div');
  element.innerHTML = `<b>${escapeHtml(place.name)}</b><br>${escapeHtml(place.detail)}<br>`;
  const button = document.createElement('button');
  button.textContent = 'View AEDs';
  button.style.cssText =
    'margin-top:8px;padding:6px 12px;border:0;border-radius:6px;background:#2d2926;color:#fff;font-weight:600;cursor:pointer';
  button.addEventListener('click', onPress);
  element.append(button);
  return element;
}

const styles = StyleSheet.create({
  // zIndex keeps Leaflet's layers (which use z-index 400+) inside the map instead of above the page.
  map: { overflow: 'hidden', zIndex: 0 },
  preview: { height: 180, borderRadius: 8 },
  full: { flex: 1 },
});
