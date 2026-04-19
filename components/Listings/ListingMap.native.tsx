import MapView, { Marker, Circle } from "react-native-maps";
import { View } from "react-native";
import { colors } from "@/constants/theme";

type Props = {
  lat: number;
  lon: number;
  title?: string;
};

export default function LocationPreview({ lat, lon, title }: Props) {
  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ width: 330, height: 150, borderRadius: 12 }}
        initialRegion={{
          latitude: lat,
          longitude: lon,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        <Marker
          coordinate={{ latitude: lat, longitude: lon }}
          title={title || "Location"}
        />
        <Circle
          center={{ latitude: lat, longitude: lon }}
          radius={1000}
          strokeWidth={1}
          strokeColor={colors.secondary}
          fillColor={`${colors.primary}50`}
        />
      </MapView>
    </View>
  );
}