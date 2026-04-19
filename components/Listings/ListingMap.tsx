// import { Circle, Marker } from "react-native-maps";
import { Platform, Text, View } from "react-native";
import { colors } from "@/constants/theme";
import { lazy, Suspense } from "react";
type Props = {
  lat: number;
  lon: number;
  title?: string;
};
const Map = Platform.select({
  web: lazy(() => import("./ListingMap.web")),
  default: lazy(() => import("./ListingMap.native")),
});
const MapView = Map
export default function LocationPreview({ lat, lon, title }: Props) {
  return (
    <Suspense
      fallback={
        <View>
          <Text>Loading...</Text>
        </View>
      }
    >
      <MapView lat={lat} lon={lon} title={title}></MapView>
    </Suspense>
  );
}
