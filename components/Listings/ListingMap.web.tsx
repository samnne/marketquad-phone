import { View, Text } from "react-native";

type Props = {
  lat: number;
  lon: number;
  title?: string;
};

export default function LocationPreview({ lat, lon, title }: Props) {
  return (
    <View
      style={{
        width: 330,
        height: 150,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text>Map not supported on web</Text>
    </View>
  );
}