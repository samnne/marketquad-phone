import { useUser } from "@/store/zustand";
import { BASE_URL, FACULTIES, YEARS } from "@/constants/constants";
import { colors } from "@/constants/theme";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import {
  useSafeAreaInsets,
  SafeAreaView as RNSAV,
} from "react-native-safe-area-context";

import { FacultyPill, Field, SpringButton, StepDots, YearChip } from "@/components/Onboarding";
import { styled } from "nativewind";
const SafeAreaView = styled(RNSAV);





// ── Main screen ──────────────────────────────────────────────────
const OnboardingVerification = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useUser();

  const [faculty, setFaculty] = useState<string | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canContinue = faculty !== null && year !== null;

  const handleContinue = async () => {
    if (!canContinue) return;
    setLoading(true);
    setError("");
    try {
        
      const res = await fetch(`${BASE_URL}/api/users/onboarding/verification`, {
        method: "PATCH",
        headers: {
          Authorization: user?.id,

          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          faculty,
          year,
        }),
      }).then((r) => r.json());

      if (!res.success) {
        setError(res.message ?? "Something went wrong. Please try again.");
        return;
      }

      setUser({ ...user, app_user: { ...user?.app_user, ...res.user } });
      router.push("/onboarding/intent"); // → screen 3
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
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="flex-grow px-6 pt-6 pb-10"
      >
        <View className="gap-8">
          {/* ── Top bar ── */}
          <View className="flex-row items-center justify-between">
            <StepDots total={5} current={1} />
            <Pressable
              onPress={() => router.push("/onboarding/intent")}
              hitSlop={12}
            >
              <Text className="text-sm text-secondary/70 font-medium">
                Skip
              </Text>
            </Pressable>
          </View>

          {/* ── Header ── */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-text tracking-tight">
              Your student info
            </Text>
            <Text className="text-sm font-light text-secondary leading-5">
              This shows up on your listings and helps buyers trust who they&apos;re
              buying from.
            </Text>
          </View>

          {/* ── Preview badge ── */}
          {(faculty || year) && (
            <View className="flex-row items-center gap-2 self-start bg-primary/8 border border-primary/20 px-3.5 py-2 rounded-full">
              <FontAwesome6
                name="graduation-cap"
                size={12}
                color={colors.primary}
              />
              <Text className="text-xs font-semibold text-primary">
                {[
                  year ? YEARS.find((y) => y.value === year)?.label : null,
                  faculty ?? null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>
          )}

          {/* ── Faculty ── */}
          <Field
            label="Faculty"
            hint="Select the one that best matches your program"
          >
            <View className="gap-2">
              {FACULTIES.map((f) => (
                <FacultyPill
                  key={f.label}
                  label={f.label}
                  icon={f.icon}
                  selected={faculty === f.label}
                  onPress={() =>
                    setFaculty((prev) => (prev === f.label ? null : f.label))
                  }
                />
              ))}
            </View>
          </Field>

          {/* ── Year ── */}
          <Field label="Year of study">
            <View className="flex-row flex-wrap gap-2">
              {YEARS.map((y) => (
                <View key={y.value} className="w-[31%]">
                  <YearChip
                    label={y.label}
                    selected={year === y.value}
                    onPress={() =>
                      setYear((prev) => (prev === y.value ? null : y.value))
                    }
                  />
                </View>
              ))}
            </View>
          </Field>

          {/* ── Error ── */}
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
        </View>
      </ScrollView>

      {/* ── Pinned footer ── */}
      <View className="px-6 pb-4 gap-3 border-t border-secondary/10 pt-4 bg-background">
        {/* Progress hint */}
        <Text className="text-xs text-center text-secondary/50">
          {!faculty && !year
            ? "Select your faculty and year to continue"
            : !faculty
              ? "Select your faculty to continue"
              : !year
                ? "Select your year to continue"
                : "Looking good — ready to continue"}
        </Text>

        <SpringButton
          onPress={handleContinue}
          disabled={!canContinue || loading}
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

export default OnboardingVerification;
