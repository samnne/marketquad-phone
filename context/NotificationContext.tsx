// context/NotificationContext.tsx
import { createContext, useContext, useEffect, ReactNode } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { registerPushToken } from "@/utils/notifications";
import { useUser } from "@/store/zustand";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowList: true,
  }),
});

const NotificationContext = createContext({});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const router = useRouter();

  // Register push token when user logs in

  useEffect(() => {
    if (user?.id) registerPushToken(user?.id);
  
  }, [user]);

  // Handle notification tap → deep link
  useEffect(() => {
    const tapSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { screen, conversationId } =
          response.notification.request.content.data;
        if (screen === "convos" && conversationId) {
          router.push(`/convos/${conversationId}`);
        }
      },
    );

    // Optional: handle notification arriving while app is foregrounded
    const foregroundSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received in foreground:", notification);
        // You could trigger an in-app toast/banner here instead
      },
    );

    return () => {
      tapSub.remove();
      foregroundSub.remove();
    };
  }, []);

  return (
    <NotificationContext.Provider value={{}}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
