import { useUser } from "@/store/zustand";
import { colors } from "@/constants/theme";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";

import {
 
  Text,
  View,
} from "react-native";
import Animated, {
 
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { SafeAreaView as RNSAV, useSafeAreaInsets } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { FeatureRow, SpringButton, StatPill, SuccessRing } from "@/components/Onboarding";
const SafeAreaView = styled(RNSAV)

const OnboardingWelcome = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const firstName = user?.app_user?.name?.split(" ")[0] ?? "there";

  return (
    <SafeAreaView
      className="flex-1 bg-background "
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom,  }}
    >
      <View className="flex-1 gap-5 px-8">

        {/* ── Success ring ── */}
        <Animated.View entering={FadeIn.delay(100)} className="items-center pt-4">
          <SuccessRing />
        </Animated.View>

        {/* ── Headline ── */}
        <Animated.View
          entering={FadeInUp.delay(400).springify().damping(100)}
          className="items-center gap-2"
        >
          <Text className="text-4xl font-bold text-text tracking-tight text-center">
            You&apos;re all set,{"\n"}
            <Text className="text-primary">{firstName}!</Text>
          </Text>
          <Text className="text-sm font-light text-secondary text-center leading-5">
            Welcome to MarketQuad — UVic&apos;s own student marketplace.
          </Text>
        </Animated.View>

        {/* ── Stats ── */}
        <Animated.View
          entering={FadeInUp.delay(550).springify().damping(100)}
          className="flex-row gap-3"
        >
          <StatPill icon="users" value="20+" label="UVic students" delay={600} />
          <StatPill icon="tag" value="Free" label="To list & buy" delay={680} />
          <StatPill icon="bolt" value="Fast" label="Local pickup" delay={760} />
        </Animated.View>

        {/* ── What's next ── */}
        <Animated.View
          entering={FadeInDown.delay(700).springify().damping(100)}
          className="gap-2"
        >
          <Text className="text-xs font-semibold tracking-widest uppercase text-secondary px-0.5">
            What you can do now
          </Text>
          <View className="gap-4">
            <FeatureRow
              icon="magnifying-glass"
              title="Browse listings"
              body="Find textbooks, furniture, bikes and more near you."
              delay={780}
            />
            <FeatureRow
              icon="plus"
              title="Post your first listing"
              body="List something in under 2 minutes — no fees, ever."
              delay={860}
            />
            <FeatureRow
              icon="comment"
              title="Message sellers directly"
              body="Chat, negotiate, and arrange pickup on campus."
              delay={940}
            />
          </View>
        </Animated.View>
      </View>

      {/* ── Pinned footer ── */}
      <Animated.View
        entering={FadeInUp.delay(1000).springify().damping(100)}
        className="gap-2 pt-4 px-6 border-t border-secondary/10"
      >
        <SpringButton
          onPress={() => router.replace("/home")}
          className="h-14 bg-primary rounded-2xl items-center justify-center"
        >
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-bold text-pill">
              Explore MarketQuad
            </Text>
            <FontAwesome6 name="arrow-right" size={13} color={colors.pill} />
          </View>
        </SpringButton>

        <SpringButton
          onPress={() => router.replace("/new")}
          className="h-12 bg-primary/10 border border-primary/20 rounded-2xl items-center justify-center"
        >
          <View className="flex-row items-center gap-2">
            <FontAwesome6 name="plus" size={12} color={colors.primary} />
            <Text className="text-sm font-semibold text-primary">
              Post a listing
            </Text>
          </View>
        </SpringButton>
      </Animated.View>
    </SafeAreaView>
  );
};

export default OnboardingWelcome;