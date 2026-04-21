import ErrorMessage from "@/components/Modals/ErrorMessage";
import SuccessMessage from "@/components/Modals/SuccessMessage";
import { useMessage } from "@/store/zustand";
import { captureException } from "@sentry/react-native";
import { Slot } from "expo-router";
import {
  Button,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

const AuthLayout = () => {
  const insets = useSafeAreaInsets();
  const { error, success, setSuccess, setError, msg } = useMessage();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        {isTablet ? (
          /* ── Tablet: two-column layout ── */
          <View className="flex-1 flex-row">
            <View className="flex-1 bg-primary" />
            <ScrollView
              className="flex-1"
              keyboardShouldPersistTaps="handled"
              contentContainerClassName="flex-grow justify-center gap-5 p-10"
            >
              <AuthContent />
            </ScrollView>
          </View>
        ) : (
          /* ── Mobile: single column ── */
          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="flex-grow justify-center gap-5 px-8 py-10"
          >
            <AuthContent />
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const AuthContent = () => (
  <>
    {/* ── Logo + header ── */}
    <View className="gap-10">
      <Image
        source={require("@/assets/icons/logo.png")}
        className="w-50 h-40"
        resizeMode="contain"
      />
      <View className="gap-2">
        <Text className="text-4xl text-text">
          Welcome to <Text className="font-bold text-primary">MarketQuad</Text>
        </Text>
        <Text className="font-light text-sm text-secondary">
          UVic student only Marketplace. Built by a Student for Students.
        </Text>
      </View>
      
    </View>

    {/* ── Screen content (login / signup form) ── */}
    <View className="mt-4">
      <Slot />
    </View>
  </>
);

export default AuthLayout;
