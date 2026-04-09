import { Stack } from "expo-router";
import "expo-sqlite/localStorage/install";
import "../global.css";

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
