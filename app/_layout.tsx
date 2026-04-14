import { Stack } from "expo-router";
import "expo-sqlite/localStorage/install";
import "../global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
