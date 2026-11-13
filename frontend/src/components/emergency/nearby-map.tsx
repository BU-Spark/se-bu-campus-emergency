import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { Point } from '@/lib/campus';
import { regionAround } from '@/lib/nearby';

export type MapPlace = Point & { id: string; name: string; detail: string };

/**
 * Map centred on the user, with a pin for each place. The small preview can't be panned, so it doesn't
 * fight the screen's scrolling; the full-screen (`interactive`) map can be dragged and zoomed, and tapping
 * a pin's label calls `onSelect`. Screen readers skip the map: the text next to it names the nearest
 * building. (Web uses nearby-map.web.tsx, since react-native-maps has no web support.)
 */
export function NearbyMap({
  center,
  places,
  fit,
  interactive = false,
  onSelect,
}: {
  center: Point;
  places: MapPlace[];
  /** Places the initial view must include (e.g. the closest few). */
  fit: Point[];
  interactive?: boolean;
  onSelect?: (id: string) => void;
}) {
  const region = regionAround(center, fit);
  return (
    <MapView
      // Re-centre when the user's position changes noticeably (about 100 m).
      key={`${center.latitude.toFixed(3)},${center.longitude.toFixed(3)}`}
      initialRegion={region}
      showsUserLocation
      showsMyLocationButton={interactive}
      scrollEnabled={interactive}
      zoomEnabled={interactive}
      rotateEnabled={false}
      pitchEnabled={false}
      toolbarEnabled={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={interactive ? styles.full : styles.preview}
    >
      {places.map((place) => (
        <Marker
          key={place.id}
          coordinate={{ latitude: place.latitude, longitude: place.longitude }}
          title={place.name}
          description={place.detail}
          pinColor="#cc0000"
          onCalloutPress={onSelect && (() => onSelect(place.id))}
        />
      ))}
    </MapView>
  );
}
const styles = StyleSheet.create({
  preview: { height: 180, borderRadius: 8 },
  full: { flex: 1 },
});
