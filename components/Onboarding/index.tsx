import { colors } from "@/constants/theme";
import { FontAwesome6 } from "@expo/vector-icons";
import { Text, View } from "moti";
import { useEffect } from "react";
import { ActivityIndicator, Pressable } from "react-native";
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const SectionRow = ({
  icon, label, sublabel, open, onPress, iconBg,
}: {
  icon: string; label: string; sublabel?: string; open: boolean; onPress: () => void; iconBg: string;
}) => (
  <Pressable
    onPress={onPress}
    className="flex-row items-center gap-3 px-4 py-4"
  >
    <View className={`w-9 h-9 rounded-xl items-center justify-center ${iconBg}`}>
      <FontAwesome6 name={icon as any} size={14} color={colors.primary} />
    </View>
    <View className="flex-1">
      <Text className="text-sm font-semibold text-text">{label}</Text>
      {sublabel && <Text className="text-xs text-secondary mt-0.5" numberOfLines={1}>{sublabel}</Text>}
    </View>
    <FontAwesome6
      name={open ? "chevron-up" : "chevron-down"}
      size={11}
      color={colors.secondary}
    />
  </Pressable>
);

export const SaveButton = ({ onPress, loading }: { onPress: () => void; loading: boolean }) => (
  <SpringButton
    onPress={onPress}
    disabled={loading}
    className="h-11 bg-primary rounded-xl items-center justify-center mt-2"
  >
    {loading
      ? <ActivityIndicator color={colors.pill} size="small" />
      : <Text className="text-sm font-bold text-pill">Save changes</Text>}
  </SpringButton>
);


export const SpringButton = ({
  children,
  onPress,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  className?: string;
}) => {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <AnimatedPressable
      style={style}
      onPressIn={() => (scale.value = withSpring(0.95, { stiffness: 500 }))}
      onPressOut={() => (scale.value = withSpring(1, { stiffness: 500 }))}
      onPress={onPress}
      disabled={disabled}
      className={`${className ?? ""} ${disabled ? "opacity-50" : ""}`}
    >
      {children}
    </AnimatedPressable>
  );
};

export const YearChip = ({
  label,
  selected,
  onPress,
}: {
  label: string;
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
      onPressIn={() => (scale.value = withSpring(0.93, { stiffness: 500 }))}
      onPressOut={() => (scale.value = withSpring(1, { stiffness: 500 }))}
      onPress={onPress}
      className={`flex-1 items-center py-3 rounded-2xl border ${
        selected
          ? "bg-primary/10 border-primary/40"
          : "bg-pill border-secondary/20"
      }`}
    >
      <Text
        className={`text-sm font-semibold ${
          selected ? "text-primary" : "text-text"
        }`}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
};
export const FacultyPill = ({
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
      onPressIn={() => (scale.value = withSpring(0.93, { stiffness: 500 }))}
      onPressOut={() => (scale.value = withSpring(1, { stiffness: 500 }))}
      onPress={onPress}
      className={`flex-row items-center gap-2.5 px-4 py-3 rounded-2xl border ${
        selected
          ? "bg-primary/10 border-primary/40"
          : "bg-pill border-secondary/20"
      }`}
    >
      <FontAwesome6
        name={icon as any}
        size={13}
        color={selected ? colors.primary : colors.secondary}
      />
      <Text
        className={`text-sm font-medium flex-1 ${
          selected ? "text-primary" : "text-text"
        }`}
        numberOfLines={1}
      >
        {label}
      </Text>
      {selected && (
        <FontAwesome6 name="circle-check" size={14} color={colors.primary} />
      )}
    </AnimatedPressable>
  );
};
export const StepDots = ({ total, current }: { total: number; current: number }) => (
  <View className="flex-row gap-1.5 items-center">
    {Array.from({ length: total }).map((_, i) => (
      <View
        key={i}
        className={`h-1.5 rounded-full ${
          i === current
            ? "w-6 bg-primary"
            : i < current
              ? "w-1.5 bg-primary/40"
              : "w-1.5 bg-secondary/20"
        }`}
      />
    ))}
  </View>
);

// ── Field wrapper ────────────────────────────────────────────────
 export const Field = ({
  label,
  hint,
  children,
  right,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) => (
  <View className="gap-2">
    <View className="flex-row items-center justify-between px-0.5">
      <Text className="text-xs font-semibold tracking-widest uppercase text-secondary">
        {label}
      </Text>
      {right}
    </View>
    {children}
    {hint && <Text className="text-xs text-secondary/60 px-0.5">{hint}</Text>}
  </View>
);

// ── Avatar placeholder ───────────────────────────────────────────
export const AvatarPlaceholder = ({
  name,
  onPress,
}: {
  name: string;
  onPress: () => void;
}) => {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Pressable onPress={onPress} className="items-center gap-3">
      <View className="relative">
        {/* Avatar circle */}
        <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center border-2 border-primary/20">
          {initials ? (
            <Text className="text-3xl font-bold text-primary">{initials}</Text>
          ) : (
            <FontAwesome6 name="user" size={32} color={colors.primary} />
          )}
        </View>
        {/* Camera badge */}
        <View className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary items-center justify-center shadow-sm">
          <FontAwesome6 name="camera" size={11} color={colors.pill} />
        </View>
      </View>
      <Text className="text-xs text-secondary font-medium">
        Add photo later
      </Text>
    </Pressable>
  );
};

export const IntentCard = ({
  value,
  label,
  tagline,
  icon,
  perks,
  selected,
  onPress,
}: (typeof INTENTS)[0] & { selected: boolean; onPress: () => void }) => {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={style}
      onPressIn={() => (scale.value = withSpring(0.97, { stiffness: 700 }))}
      onPressOut={() => (scale.value = withSpring(1, { stiffness: 700 }))}
      onPress={onPress}
      className={`rounded-3xl border-2 p-5 gap-4 ${
        selected
          ? "bg-primary/8 border-primary"
          : "bg-pill border-secondary/15"
      }`}
    >
      {/* Card header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          {/* Icon bubble */}
          <View
            className={`w-11 h-11 rounded-2xl items-center justify-center ${
              selected ? "bg-primary" : "bg-secondary/10"
            }`}
          >
            <FontAwesome6
              name={icon as any}
              size={16}
              color={selected ? colors.pill : colors.secondary}
            />
          </View>

          <View>
            <Text
              className={`text-lg font-bold ${
                selected ? "text-primary" : "text-text"
              }`}
            >
              {label}
            </Text>
            <Text className="text-xs text-secondary font-light">{tagline}</Text>
          </View>
        </View>

        {/* Radio circle */}
        <View
          className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
            selected ? "border-primary bg-primary" : "border-secondary/30"
          }`}
        >
          {selected && (
            <FontAwesome6 name="check" size={10} color={colors.pill} />
          )}
        </View>
      </View>

      {/* Divider */}
      <View className={`h-px ${selected ? "bg-primary/20" : "bg-secondary/10"}`} />

      {/* Perks list */}
      <View className="gap-2">
        {perks.map((perk) => (
          <View key={perk} className="flex-row items-center gap-2.5">
            <FontAwesome6
              name="circle-check"
              size={12}
              color={selected ? colors.primary : colors.secondary + "60"}
            />
            <Text
              className={`text-sm ${
                selected ? "text-text" : "text-secondary/70"
              }`}
            >
              {perk}
            </Text>
          </View>
        ))}
      </View>
    </AnimatedPressable>
  );
};

export const SuccessRing = () => {
  const outerScale = useSharedValue(0);
  const innerScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  useEffect(() => {
    outerScale.value = withSpring(1, { stiffness: 700, damping: 12 });
    innerScale.value = withDelay(150, withSpring(1, { stiffness: 800, damping: 14 }));
    checkOpacity.value = withDelay(320, withTiming(1, { duration: 200 }));
  }, []);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outerScale.value }],
  }));
  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerScale.value }],
  }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
  }));

  return (
    <Animated.View
      style={outerStyle}
      className="w-28 h-28 rounded-full bg-primary/10 items-center justify-center"
    >
      <Animated.View
        style={innerStyle}
        className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center"
      >
        <View className="w-14 h-14 rounded-full bg-primary items-center justify-center">
          <Animated.View style={checkStyle}>
            <FontAwesome6 name="check" size={24} color={colors.pill} />
          </Animated.View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

// ── Stat pill ─────────────────────────────────────────────────────
export const StatPill = ({
  icon,
  value,
  label,
  delay,
}: {
  icon: string;
  value: string;
  label: string;
  delay: number;
}) => (
  <Animated.View
    entering={FadeInUp.delay(delay).springify().damping(80)}
    className="flex-1 items-center gap-1.5 bg-pill border border-secondary/15 rounded-2xl py-4"
  >
    <FontAwesome6 name={icon as any} size={15} color={colors.primary} />
    <Text className="text-lg font-bold text-text">{value}</Text>
    <Text className="text-xs text-secondary text-center leading-4">{label}</Text>
  </Animated.View>
);

// ── Feature row ───────────────────────────────────────────────────
export const FeatureRow = ({
  icon,
  title,
  body,
  delay,
}: {
  icon: string;
  title: string;
  body: string;
  delay: number;
}) => (
  <Animated.View
    entering={FadeInDown.delay(delay).springify().damping(80)}
    className="flex-row items-start gap-3"
  >
    <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center mt-0.5">
      <FontAwesome6 name={icon as any} size={13} color={colors.primary} />
    </View>
    <View className="flex-1 gap-0.5">
      <Text className="text-sm font-semibold text-text">{title}</Text>
      <Text className="text-xs text-secondary leading-4">{body}</Text>
    </View>
  </Animated.View>
);
