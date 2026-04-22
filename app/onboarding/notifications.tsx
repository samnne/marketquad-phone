import { useUser } from "@/store/zustand";
import { colors } from "@/constants/theme";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { VideoPlayer, VideoView, useVideoPlayer } from "expo-video";
import {
  useSafeAreaInsets,
  SafeAreaView as RNSAV,
} from "react-native-safe-area-context";
import notisVideo from "@/assets/Scene.mp4" 
import * as Notifications from "expo-notifications";
import { SpringButton, StepDots } from "@/components/Onboarding";
import { styled } from "nativewind";

const SafeAreaView = styled(RNSAV);

// ── Notification preview card ────────────────────────────────────
const NotifPreview = ({
  icon,
  title,
  body,
  time,
  player
}: {
  icon: string;
  title: string;
  body: string;
  time: string;
  player: VideoPlayer
}) => (
  //   <View className="flex-row items-start gap-3 bg-pill border border-secondary/15 rounded-2xl px-4 py-3.5">
  //     <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center mt-0.5">
  //       <FontAwesome6 name={icon as any} size={14} color={colors.primary} />
  //     </View>
  //     <View className="flex-1 gap-0.5">
  //       <View className="flex-row items-center justify-between">
  //         <Text className="text-sm font-semibold text-text">{title}</Text>
  //         <Text className="text-xs text-secondary/50">{time}</Text>
  //       </View>
  //       <Text className="text-xs text-secondary leading-4">{body}</Text>
  //     </View>
  //   </View>
  <View className="flex-row flex-1 w-full mix-blend-screen  justify-center items-center gap-3 ">
    <VideoView player={player}   style={{width: 320, height: 320, }} contentFit="contain"  nativeControls={false} />
    
  </View>
);

// ── Perk row ─────────────────────────────────────────────────────
const PerkRow = ({ icon, text }: { icon: string; text: string }) => (
  <View className="flex-row items-center gap-3">
    <View className="w-8 h-8 rounded-xl bg-primary/10 items-center justify-center">
      <FontAwesome6 name={icon as any} size={13} color={colors.primary} />
    </View>
    <Text className="text-sm text-text/80 flex-1">{text}</Text>
  </View>
);

// ── Main screen ──────────────────────────────────────────────────
const OnboardingNotifications = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useUser();
    const player = useVideoPlayer(notisVideo, (player) => {
        player.loop = false;
        player.muted = true;
        player.play();
    })
  const [loading, setLoading] = useState(false);

  const finish = () => {
    router.replace("/onboarding/welcome");
  };

  const handleEnable = async () => {
    setLoading(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const enabled = status === "granted";

      try {
        await fetch(
          `${process.env.EXPO_PUBLIC_BASE_URL}/api/users/onboarding/notifications`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: user.id,
            },
            body: JSON.stringify({ notifications_enabled: enabled }),
          },
        );
      } catch (_) {}

      setUser({
        ...user,
        app_user: { ...user?.app_user, notifications_enabled: enabled },
      });
    } catch (_) {
    } finally {
      setLoading(false);
      finish();
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
          <StepDots total={4} current={3} />
          {/* No skip label — just an X to close */}
          <Pressable onPress={finish} hitSlop={12}>
            <FontAwesome6 name="xmark" size={16} color={colors.secondary} />
          </Pressable>
        </View>

        {/* ── Header ── */}
        <View className="gap-2">
          <Text className="text-3xl font-bold text-text tracking-tight">
            Stay in the loop
          </Text>
          <Text className="text-sm font-light text-secondary leading-5">
            Turn on notifications so you never miss a sale or a message.
          </Text>
        </View>

        {/* ── Mock notification previews ── */}
        <View className="gap-2.5 py-8">
          <NotifPreview
            icon="bell"
            player={player}
            title="Someone wants your textbook"
            body="Alex sent you a message about MATH 101 Calculus."
            time="now"
          />
          {/* <NotifPreview
            icon="tag"
            title="New listing in Electronics"
            body="MacBook Air M2 — $850 · Near Ring Road Residence"
            time="2m ago"
          />
          <NotifPreview
            icon="heart"
            title="Your item sold!"
            body="Congratulations — your IKEA desk has a buyer."
            time="5m ago"
          /> */}
        </View>

        {/* ── Perks ── */}
        <View className="gap-3">
          <PerkRow
            icon="comment"
            text="Get notified the moment a buyer messages you"
          />
          <PerkRow
            icon="bolt"
            text="Be first to see new listings in your categories"
          />
          <PerkRow
            icon="circle-check"
            text="Know instantly when your item sells"
          />
        </View>
      </View>

      {/* ── Pinned footer ── */}
      <View className="px-6 pb-4 gap-3 pt-4 border-t border-secondary/10 bg-background">
        <SpringButton
          onPress={handleEnable}
          disabled={loading}
          className="h-14 bg-primary rounded-2xl items-center justify-center"
        >
          {loading ? (
            <ActivityIndicator color={colors.pill} />
          ) : (
            <View className="flex-row items-center gap-2">
              <FontAwesome6 name="bell" size={14} color={colors.pill} />
              <Text className="text-base font-bold text-pill">
                Turn on notifications
              </Text>
            </View>
          )}
        </SpringButton>

        <Pressable onPress={finish} className="items-center py-2" hitSlop={8}>
          <Text className="text-sm text-secondary/60">Not now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingNotifications;
