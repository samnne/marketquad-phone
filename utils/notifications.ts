
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { db } from "@/db/db";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowList: true,
  }),
});

export async function registerPushToken(userId: string) {
  if (!Device.isDevice) return; // won't work in simulator

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return;

  // Android channel required
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("convos", {
      name: "convos",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6b9e8a",
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  const t = db.getItem("NOTI_TOKEN") as string
  
  if (JSON.parse(t)){
    return false
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_BASE_URL}/api/notis`,
    {
      method: "POST",
      headers: { Authorization: userId, "Content-Type": "application/json" },

      body: JSON.stringify({ userId, token, platform: Platform.OS }),
    },
  ).then((res) => res.json());
  if (!response.ok) return false;
  db.setItem(
    "NOTI_TOKEN",
    JSON.stringify({ userId, token, platform: Platform.OS }),
  );
}
