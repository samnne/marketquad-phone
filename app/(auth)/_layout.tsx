import ErrorMessage from "@/components/Modals/ErrorMessage";
import SuccessMessage from "@/components/Modals/SuccessMessage";
import MarketQuad from "@/components/Utils/MarketQuad";
import { useMessage } from "@/store/zustand";
import { Slot } from "expo-router";
import {
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
      <View
        className="flex-1 bg-background"
        style={{ paddingTop: insets.top }}
      >
        {/* Modals */}
        {error && <ErrorMessage msg={msg} onDismiss={() => setError(false)} />}
        {success && <SuccessMessage msg={msg} onDismiss={() => setSuccess(false)} />}

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
            contentContainerClassName="flex-grow justify-center gap-5 px-6 py-12"
          >
            <AuthContent />
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const AuthContent = () => (
  <View className="gap-10">
    {/* ── Logo + header ── */}
    <View className="gap-6">
      <Image
        source={require("@/assets/icons/logo.png")}
        className="w-40 h-28"
        resizeMode="contain"
      />
      <View className="gap-1.5">
        <Text className="text-4xl font-light text-text tracking-tight">
          Welcome to{" "}
          <Text className="font-bold text-primary"><MarketQuad className="font-bold text-primary"/></Text>
        </Text>
        <Text className="text-sm font-light text-secondary leading-5">
          UVic&apos;s student-only marketplace. Built by a student, for students.
        </Text>
      </View>
    </View>

    {/* ── Divider ── */}
    <View className="flex-row items-center gap-3">
     
    </View>

    {/* ── Form slot ── */}
    <Slot />
  </View>
);

export default AuthLayout;