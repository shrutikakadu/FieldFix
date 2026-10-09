import React from 'react';
import { Text, View } from 'react-native';
import type { MapPoint } from './LocationMap';

type Props = { point: MapPoint | null; title: string; follow?: boolean; onSelect?: (point: MapPoint) => void };

export default function LocationMap({ point }: Props) {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
    <Text style={{ color: '#294136', textAlign: 'center' }}>
      {point ? `Location: ${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}` : 'Open the native app to select a map location.'}
    </Text>
  </View>;
}
