import { BASE_URL, onboardingTotal } from "@/constants/constants";
import { colors } from "@/constants/theme";
import { SpringButton, StepDots } from "@/components/Onboarding";
import { useUser } from "@/store/zustand";

import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useState, useRef } from "react";
import {
  ActivityIndicator,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView as RNSAV,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { styled } from "nativewind";

const SafeAreaView = styled(RNSAV);

const EULA_URL = "https://market-quad.com/eula";

// ── Inline EULA summary sections ─────────────────────────────────────────────
const SECTIONS = [
  {
    icon: "graduation-cap",
    title: "Students only",
    body: "MarketQuad is exclusively for students. You must provide accurate information and we may verify your student status at any time.",
  },
  {
    icon: "store",
    title: "Marketplace disclaimer",
    body: "MarketQuad is not a buyer or seller. We don't verify listings, guarantee payments, or guarantee delivery. All transactions are at your own risk.",
  },
  {
    icon: "file-lines",
    title: "Your content",
    body: "You keep ownership of what you post, but grant us the right to display it. No illegal items, misleading listings, or harmful content.",
  },
  {
    icon: "shield-halved",
    title: "Prohibited conduct",
    body: "No scams, fraud, harassment, or attempts to bypass safety systems. Violations may result in immediate account suspension.",
  },
  {
    icon: "money-bill-transfer",
    title: "Payments",
    body: "MarketQuad does not process payments. All transactions happen directly between users.",
  },
  {
    icon: "scale-balanced",
    title: "Governing law",
    body: "This agreement is governed by the laws of British Columbia, Canada.",
  },
];

// ── Sub-components ─────────────────────────────────────────────────────────
const EulaSection = ({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) => (
  <View className="flex-row gap-3 py-3 border-b border-secondary/10">
    <View className="w-8 h-8 rounded-xl bg-primary/10 items-center justify-center mt-0.5 shrink-0">
      <FontAwesome6 name={icon as any} size={13} color={colors.primary} />
    </View>
    <View className="flex-1 gap-0.5">
      <Text className="text-sm font-semibold text-text">{title}</Text>
      <Text className="text-sm text-text/60 leading-5">{body}</Text>
    </View>
  </View>
);

// ── Screen ─────────────────────────────────────────────────────────────────
const AcceptGuidelines = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useUser();

  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const scrollRef = useRef<ScrollView>(null);

  const canContinue = accepted;

  // Mark as scrolled when the user reaches the bottom
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const distanceFromBottom =
      contentSize.height - layoutMeasurement.height - contentOffset.y;
    if (distanceFromBottom < 40) setScrolledToBottom(true);
  };

  const handleContinue = async () => {
    if (!canContinue) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${BASE_URL}/api/users/onboarding/eula`, {
        method: "PATCH",
        headers: {
          Authorization: user?.id!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accepted_eula: true }),
      }).then((r) => r.json());

      if (!res.success) {
        setError(res.message ?? "Something went wrong. Please try again.");
        return;
      }

      setUser({ ...user, app_user: { ...user?.app_user, ...res.user } });
      router.push("/onboarding");
    } catch {
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
      {/* ── Scrollable body ── */}
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="flex-grow px-6 pt-6 pb-10"
      >
        <View className="flex-1 gap-8">
          {/* ── Top bar ── */}
          <View className="flex-row items-center justify-between">
            <StepDots total={onboardingTotal} current={0} />
            {/* No skip — EULA must be accepted */}
          </View>

          {/* ── Header ── */}
          <View className="gap-2">
            <Text className="text-5xl font-bold text-text tracking-tight">
              Before you continue
            </Text>
            <Text className="text-lg font-light text-text leading-5">
              Please read and accept our End User License Agreement to use{" "}
              <Text className="font-semibold text-primary">MarketQuad</Text>.
            </Text>
          </View>

          {/* ── EULA Summary Card ── */}
          <View className="bg-pill rounded-3xl px-4 py-2 shadow">
            <View className="flex-row items-center justify-between py-3 border-b border-secondary/10">
              <Text className="text-xs font-semibold text-text/40 tracking-widest uppercase">
                Key highlights
              </Text>
              <Pressable
                onPress={() => Linking.openURL(EULA_URL)}
                hitSlop={12}
                className="flex-row items-center gap-1"
              >
                <Text className="text-xs font-semibold text-primary">
                  Full EULA
                </Text>
                <FontAwesome6
                  name="arrow-up-right-from-square"
                  size={10}
                  color={colors.primary}
                />
              </Pressable>
            </View>

            {SECTIONS.map((s) => (
              <EulaSection key={s.title} {...s} />
            ))}

            {/* Last row — no bottom border */}
            <View className="py-3">
              <Text className="text-xs text-text/40 leading-5 text-center">
                Last updated May 3, 2026 · Governed by British Columbia law
              </Text>
            </View>
          </View>

          {/* ── Scroll nudge ── */}
          {!scrolledToBottom && (
            <Pressable
              onPress={() =>
                scrollRef.current?.scrollToEnd({ animated: true })
              }
              className="flex-row items-center justify-center gap-2"
            >
              <Text className="text-sm text-text/40">Scroll to continue</Text>
              <FontAwesome6
                name="chevron-down"
                size={11}
                color={colors.text + "66"}
              />
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* ── Footer ── */}
      <View className="px-6 pb-4 gap-3 border-t border-secondary/10 pt-4 bg-background">
        {/* Checkbox row */}
        <Pressable
          onPress={() => setAccepted((v) => !v)}
          className="flex-row items-start gap-3"
          hitSlop={8}
        >
          <View
            className={`w-5 h-5 rounded-md border-2 items-center justify-center mt-0.5 ${
              accepted
                ? "bg-primary border-primary"
                : "bg-transparent border-secondary/40"
            }`}
          >
            {accepted && (
              <FontAwesome6 name="check" size={10} color={colors.pill} />
            )}
          </View>
          <Text className="flex-1 text-sm text-text/70 leading-5">
            I have read and agree to the{" "}
            <Text
              className="text-primary font-semibold"
              onPress={() => Linking.openURL(EULA_URL)}
            >
              End User License Agreement
            </Text>
            {" "}and understand that MarketQuad is a student-only platform.
          </Text>
        </Pressable>

        {/* Error */}
        {error ? (
          <View className="flex-row items-center gap-2 bg-red-500/10 px-4 py-3 rounded-2xl">
            <FontAwesome6
              name="circle-exclamation"
              size={13}
              color="#f87171"
            />
            <Text className="text-sm text-red-400 flex-1">{error}</Text>
          </View>
        ) : null}

        {/* CTA */}
        <SpringButton
          onPress={handleContinue}
          disabled={!canContinue || loading}
          className="h-14 bg-primary rounded-2xl items-center justify-center"
        >
          {loading ? (
            <ActivityIndicator color={colors.pill} />
          ) : (
            <View className="flex-row items-center gap-2">
              <Text className="text-base font-bold text-pill">
                I Agree &amp; Continue
              </Text>
              <FontAwesome6
                name="arrow-right"
                size={13}
                color={colors.pill}
              />
            </View>
          )}
        </SpringButton>

        <Text className="text-xs text-center text-text/50">
          You must accept the EULA to use MarketQuad
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default AcceptGuidelines;