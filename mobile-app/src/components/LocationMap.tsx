import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export type MapPoint = { latitude: number; longitude: number };
type Props = { point: MapPoint | null; title: string; follow?: boolean; onSelect?: (point: MapPoint) => void };

export default function LocationMap({ point, title, follow = false, onSelect }: Props) {
  const center = point || { latitude: 12.9716, longitude: 77.5946 };
  const region = { ...center, latitudeDelta: follow ? 0.015 : 0.08, longitudeDelta: follow ? 0.015 : 0.08 };
  return <MapView style={StyleSheet.absoluteFill} region={region} onPress={event => onSelect?.(event.nativeEvent.coordinate)} onRegionChangeComplete={visible => {
    if (!onSelect || (point && Math.abs(visible.latitude - point.latitude) < 0.00001 && Math.abs(visible.longitude - point.longitude) < 0.00001)) return;
    onSelect({ latitude: visible.latitude, longitude: visible.longitude });
  }}>
    {point && <Marker coordinate={point} title={title} />}
  </MapView>;
}
