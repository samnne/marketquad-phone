import { Stack } from "expo-router";
import "expo-sqlite/localStorage/install";
import "../global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NotificationProvider } from "@/context/NotificationContext";
import { AnimatePresence } from "moti";
import SuccessMessage from "@/components/Modals/SuccessMessage";
import ErrorMessage from "@/components/Modals/ErrorMessage";
import { useMessage } from "@/store/zustand";
import * as Sentry from "@sentry/react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PostHogProvider } from "posthog-react-native";

Sentry.init({
  dsn: process.env.EXP_PUBLIC_SENTRY_DSN,
  sendDefaultPii: true,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],
  spotlight: __DEV__,
});

export default Sentry.wrap(function RootLayout() {
  const { success, error, msg } = useMessage();

  return (
    <ErrorBoundary
      onError={(err, info) => {
        Sentry.captureException(err, { extra: { componentStack: info.componentStack } });
      }}
    >
      <GestureHandlerRootView>
        <PostHogProvider
          apiKey={process.env.EXPO_PUBLIC_POSTHOG_KEY!}
          options={{ host: process.env.EXPO_PUBLIC_POSTHOG_HOST }}
        >
          <NotificationProvider>
            <AnimatePresence>
              {success && <SuccessMessage message={msg} />}
              {error && <ErrorMessage message={msg} />}
            </AnimatePresence>
            <Stack screenOptions={{ headerShown: false }} />
          </NotificationProvider>
        </PostHogProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
});