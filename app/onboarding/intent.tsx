import { useUser } from "@/store/zustand";
import { BASE_URL, INTENTS, onboardingTotal } from "@/constants/constants";
import { colors } from "@/constants/theme";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import {
  useSafeAreaInsets,
  SafeAreaView as RNSAV,
} from "react-native-safe-area-context";
import { IntentCard, SpringButton, StepDots } from "@/components/Onboarding";
import { styled } from "nativewind";
import { ScrollView } from "moti";

type Intent = "buying" | "selling" | "both";

const SafeAreaView = styled(RNSAV);

// ── Main screen ──────────────────────────────────────────────────
const OnboardingIntent = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useUser();

  const [intent, setIntent] = useState<Intent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {

    if (!intent) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/api/users/onboarding/intent`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: user?.id! },
        body: JSON.stringify({ intent }),
      }).then((r) => r.json());

      if (!res.success) {
        setError(res.message ?? "Something went wrong. Please try again.");
        return;
      }

      setUser({ ...user, app_user: { ...user?.app_user, ...res?.user } });
      router.push("/onboarding/categories"); // → screen 4
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      style={{ paddingBottom: insets.bottom }}
    >
      <View className="flex-1 px-6 pt-6 gap-8">
        {/* ── Top bar ── */}
        <View className="flex-row items-center justify-between">
          <StepDots total={onboardingTotal} current={3} />
          <Pressable
            onPress={() => router.push("/onboarding/categories")}
            hitSlop={12}
          >
            <Text className="text-sm text-text/70 font-medium">Skip</Text>
          </Pressable>
        </View>

        {/* ── Header ── */}
        <View className="gap-2">
          <Text className="text-4xl font-bold text-text tracking-tight">
            What brings you here?
          </Text>
          <Text className="text-lg font-light text-text/70 leading-5">
            We&apos;ll personalise your feed based on this. You can change it
            anytime.
          </Text>
        </View>

        {/* ── Cards ── */}
        <ScrollView showsVerticalScrollIndicator={false}  className="gap-4 p-4  flex-1">
          {INTENTS.map((item) => (
            <IntentCard
              key={item.value}
              {...item}
              selected={intent === item.value}
              onPress={() => setIntent(item.value)}
            />
          ))}
        </ScrollView>

        {/* ── Error ── */}
        {error ? (
          <View className="flex-row items-center gap-2 bg-red-500/10 px-4 py-3 rounded-2xl">
            <FontAwesome6 name="circle-exclamation" size={13} color="#f87171" />
            <Text className="text-sm text-red-400 flex-1">{error}</Text>
          </View>
        ) : null}
      </View>

      {/* ── Pinned footer ── */}
      <View className="px-6 pb-4 gap-3 border-t border-secondary/10 pt-4 bg-background">
        <SpringButton
          onPress={handleContinue}
          disabled={!intent || loading}
          className="h-14 bg-primary rounded-2xl items-center justify-center"
        >
          {loading ? (
            <ActivityIndicator color={colors.pill} />
          ) : (
            <View className="flex-row items-center gap-2">
              <Text className="text-base font-bold text-pill">Continue</Text>
              <FontAwesome6 name="arrow-right" size={13} color={colors.pill} />
            </View>
          )}
        </SpringButton>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingIntent;
