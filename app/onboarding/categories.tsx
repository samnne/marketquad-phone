import { useUser } from "@/store/zustand";
import { BASE_URL, categories } from "@/constants/constants";
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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets, SafeAreaView as RNSAV } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { SpringButton, StepDots } from "@/components/Onboarding";
const SafeAreaView = styled(RNSAV)
// ── Re-used primitives ───────────────────────────────────────────
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);



const MIN_SELECTED = 3;


const CategoryTile = ({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={style}
      onPressIn={() => (scale.value = withSpring(0.9, { stiffness: 500 }))}
      onPressOut={() => (scale.value = withSpring(1, { stiffness: 500 }))}
      onPress={onPress}
      className={`items-center justify-center gap-2 py-4 rounded-2xl border-2 ${
        selected
          ? "bg-primary/10 border-primary"
          : "bg-pill border-secondary/15"
      }`}
    >
      {/* Check badge */}
      {selected && (
        <View className="absolute top-2 right-2">
          <FontAwesome6 name="circle-check" size={13} color={colors.primary} />
        </View>
      )}

      <View
        className={`w-10 h-10 rounded-xl items-center justify-center ${
          selected ? "bg-primary" : "bg-secondary/10"
        }`}
      >
        <FontAwesome6
          name={icon as any}
          size={16}
          color={selected ? colors.pill : colors.secondary}
        />
      </View>
      <Text
        className={`text-xs font-semibold text-center px-1 leading-4 ${
          selected ? "text-primary" : "text-text/80"
        }`}
        numberOfLines={2}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
};


const SelectedStrip = ({
  selected,
  onRemove,
}: {
  selected: string[];
  onRemove: (val: string) => void;
}) => {
  if (selected.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-6"
      className="-mx-6"
    >
      {selected.map((val) => {
        const cat = categories.find((c) => c.value === val)!;
        return (
          <Pressable
            key={val}
            onPress={() => onRemove(val)}
            className="flex-row items-center gap-1.5 bg-primary/10 border border-primary/30 px-3 py-1.5 rounded-full"
          >
            <Text className="text-xs font-semibold text-primary">
              {cat.label}
            </Text>
            <FontAwesome6 name="xmark" size={10} color={colors.primary} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const OnboardingCategories = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useUser();

  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canContinue = selected.length >= MIN_SELECTED;

  const toggle = (val: string) => {
    setSelected((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const handleContinue = async () => {
    if (!canContinue) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/api/users/onboarding/categories`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: user.id },
        body: JSON.stringify({ categories: selected }),
      }).then((r) => r.json());

      if (!res.success) {
        setError(res.message ?? "Something went wrong. Please try again.");
        return;
      }

      setUser({ ...user, app_user: { ...user?.app_user, ...res.user } });
      router.push("/onboarding/notifications"); // → screen 5
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const remaining = MIN_SELECTED - selected.length;

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ paddingBottom: insets.bottom }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-6 pt-6 pb-10 gap-7"
      >
        {/* ── Top bar ── */}
        <View className="flex-row items-center justify-between">
          <StepDots total={5} current={3} />
          <Pressable onPress={() => router.push("/onboarding/notifications")} hitSlop={12}>
            <Text className="text-sm text-secondary/70 font-medium">Skip</Text>
          </Pressable>
        </View>

        {/* ── Header ── */}
        <View className="gap-2">
          <Text className="text-3xl font-bold text-text tracking-tight">
            What are you into?
          </Text>
          <Text className="text-sm font-light text-secondary leading-5">
            Pick at least {MIN_SELECTED} categories to personalise your feed and alerts.
          </Text>
        </View>

        {/* ── Selected strip ── */}
        <SelectedStrip selected={selected} onRemove={toggle} />

        {/* ── Grid ── */}
        <View className="flex-row flex-wrap gap-3">
          {categories.map((cat) => (
            <View key={cat.value} className="w-[30%]">
              <CategoryTile
                label={cat.label}
                icon={cat.icon}
                selected={selected.includes(cat.value)}
                onPress={() => toggle(cat.value)}
              />
            </View>
          ))}
        </View>

        {/* ── Error ── */}
        {error ? (
          <View className="flex-row items-center gap-2 bg-red-500/10 px-4 py-3 rounded-2xl">
            <FontAwesome6 name="circle-exclamation" size={13} color="#f87171" />
            <Text className="text-sm text-red-400 flex-1">{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* ── Pinned footer ── */}
      <View className="px-6 pb-4 gap-3 border-t border-secondary/10 pt-4 bg-background">
        {/* Counter bar */}
        <View className="flex-row items-center justify-between px-0.5">
          <Text className="text-xs text-secondary/60">
            {selected.length > 0
              ? `${selected.length} selected`
              : "None selected yet"}
          </Text>
          {!canContinue && (
            <Text className="text-xs text-secondary/60">
              {remaining} more to go
            </Text>
          )}
          {canContinue && (
            <Text className="text-xs text-primary font-semibold">
              ✓ Ready to continue
            </Text>
          )}
        </View>

        {/* Progress track */}
        <View className="h-1 bg-secondary/10 rounded-full overflow-hidden">
          <View
            className="h-full bg-primary rounded-full"
            style={{
              width: `${Math.min((selected.length / MIN_SELECTED) * 100, 100)}%`,
            }}
          />
        </View>

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

export default OnboardingCategories;