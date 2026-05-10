
import UserListings from "@/components/UserListings";
import { BASE_URL } from "@/constants/constants";
import { colors, components } from "@/constants/theme";

import { useRefresh } from "@/hooks/useRefresh";
import { getConvos } from "@/lib/conversations.lib";
import { getUserListings } from "@/lib/listing.lib";

import { useConvos, useListings, useMessage, useUser } from "@/store/zustand";
import { supabase } from "@/supabase/authHelper";
import { cleanUP, getUserSupabase } from "@/utils/functions";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { useRouter } from "expo-router";
import { Image } from "moti";
import { MotiPressable } from "moti/interactions";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function getInitials(name?: string, email?: string) {
  if (name) return name[0];
  if (email) return email[0].toUpperCase();
  return "?";
}

function ProfileScreen() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false); // add this
  const animateNew = useMemo(() => {
    return ({ hovered, pressed }: { hovered: boolean; pressed: boolean }) => {
      "worklet";
      const expression = hovered || pressed;

      return {
        scale: expression ? 1.1 : 1,
        rotate: expression ? "15deg" : "0deg"
       
      };
    };
  }, []);
  const insets = useSafeAreaInsets();
  const bottomClearance = components.tabBar.height + insets.bottom;
  const {
    user,
    userListings,
    setUserListings,
    setUser,
    reset: userReset,
  } = useUser();
  const { reset: convoReset, setConvos, convos } = useConvos();
  const { reset: lisReset } = useListings();

  const { setError, setSuccess, setMessage } = useMessage();

  // Derive unread count from convos store
  const unreadCount = convos?.filter((c) => c?.unread).length ?? 0;

  const { refreshing, onRefresh } = useRefresh({
    func: async () => {
      const { user: u, app_user } = await getUserSupabase();

      if (!u) return;
      const ulst = await getUserListings(u.id);
      setUserListings(ulst.listings);

      const convos = await getConvos(u.id);
      if (convos) setConvos(convos);

      const res = await fetch(`${BASE_URL}/api/reviews/count`, {
        headers: { Authorization: u.id },
      });
      const data = await res.json();

      setUser({ ...user, app_user: { ...app_user, rating: data?.rating } });
      return;
    },
  });

  const mountSession = useCallback(async () => {

    try {
      const { user: u, error, app_user } = await getUserSupabase();

      if (!u || error) {
        setError(true);
        setMessage("Logged Out!");
        router.replace("/sign-in");
        return;
      }
      setUser({ ...u, app_user });
      const tempListings = await getUserListings(u.id);
      if (!tempListings?.listings) {
        setError(true);
        setMessage("Couldn't fetch listings");
        return;
      }
      const convos = await getConvos(u.id);
      if (convos) setConvos(convos);

      setUserListings(tempListings?.listings);
    } catch (err) {}
  }, [setError, setMessage, setUser, setConvos, setUserListings, router]);

  useEffect(() => {
    mountSession();
    
  }, [mountSession]);

  const handleLogout = async () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          cleanUP(
            { reset: lisReset },
            { reset: userReset },
            { reset: convoReset },
          );
          setSuccess(true);
          setMessage("Logged Out");
          router.replace("/sign-in");
        },
      },
    ]);
  };

  const soldCount = userListings?.filter((l) => l.sold).length ?? 0;
  const initials = getInitials(user?.app_user?.name, user?.app_user?.email);
  const isVerified = user?.app_user?.isVerified;
  const rating = user?.app_user?.rating;
  const displayName =
    user?.app_user?.name ?? user?.app_user?.email?.split("@")[0] ?? "Welcome";

  const stats = [
    { num: userListings?.length ?? 0, label: "Listings" },
    { num: soldCount, label: "Sold" },
    {
      num: rating && rating > 0 ? Number(rating).toFixed(1) : "—",
      label: "Rating",
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: bottomClearance }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-4 gap-4">
        {/* ── Profile card ── */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(0)}
          className="bg-pill rounded-[20px] border border-secondary/25 p-5"
        >
          <View className="flex-row items-center gap-3.5">
            {/* Avatar */}
            <MotiPressable 
            animate={animateNew}
              onPress={() =>
              router.push(`/profiles/${user?.id || user?.app_user?.uid}`)
              }
              style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              flexShrink: 0,
              }}
            >
              {user?.app_user?.profileURL ? (
                <Image
                  src={user?.app_user?.profileURL}
                  className="w-full h-full rounded-full"
                />
              ) : (
                <Text className="text-[20px] font-bold text-text">
                  {initials}
                </Text>
              )}
            </MotiPressable>

            {/* Name / email / badge */}
            <View className="flex-1 min-w-0 gap-1">
              <Text
                className="text-[17px] font-bold text-text"
                numberOfLines={1}
              >
                {displayName} -{" "}
                <Text className="text-primary">
                  @{user?.app_user?.username}
                </Text>
              </Text>
              <Text className="text-[12px] text-secondary" numberOfLines={1}>
                {user?.app_user?.email}
              </Text>
              <View className="flex-row flex-wrap gap-1.5 mt-1">
                <View
                  className={`px-2 py-0.5 rounded-md ${
                    isVerified ? "bg-primary/50" : "bg-red-100"
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold ${
                      isVerified ? "text-text" : "text-red-600"
                    }`}
                  >
                    {isVerified ? "Verified student" : "Not Verified"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Flag button */}
            <Pressable
              onPress={() => router.push("/reports")}
              className="w-8 h-8 rounded-[9px] bg-background border border-primary items-center justify-center shrink-0"
            >
              <FontAwesome name="flag" size={12} color={colors.accent} />
            </Pressable>
          </View>

          {/* Stats strip */}
          <View className="flex-row mt-4 rounded-xl overflow-hidden border border-primary/25">
            {stats.map(({ num, label }, i) => (
              <View
                key={label + `${i}`}
                className={`flex-1 py-3 items-center ${i !== 2 ? "border-r border-primary/25" : ""}`}
              >
                <Text className="text-[18px] font-bold text-text">{num}</Text>
                <Text className="text-[10px] text-secondary mt-0.5">
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Your market ── */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(80)}
          className="gap-3"
        >
          <Text className="text-3xl font-medium text-text uppercase pl-1">
            Your market
          </Text>

          <Pressable
            onPress={() => setShowModal(true)} // was router.push
            className="bg-pill rounded-[20px] border border-primary/25 flex-row items-center justify-between px-4 py-4 active:opacity-70"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-[10px] bg-background border border-primary/25 items-center justify-center">
                <FontAwesome name="list" size={16} color={colors.primary} />
              </View>
              <Text className="text-[15px] font-semibold text-text">
                Your listings
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              {(userListings?.length ?? 0) > 0 && (
                <View className="bg-primary rounded-full px-2 py-0.5">
                  <Text className="text-white text-[12px] font-bold">
                    {userListings!.length}
                  </Text>
                </View>
              )}
              <FontAwesome
                name="chevron-right"
                size={12}
                color={colors.text + "50"}
              />
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push({ pathname: "/convos" })}
            className="bg-pill rounded-[20px] border border-primary/25 flex-row items-center justify-between px-4 py-4 active:opacity-70"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-[10px] bg-background border border-primary/25 items-center justify-center">
                <FontAwesome
                  name="comment-o"
                  size={16}
                  color={colors.secondary}
                />
              </View>
              <Text className="text-[15px] font-semibold text-text">
                Your messages
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              {unreadCount > 0 && (
                <View className="bg-secondary rounded-full px-2 py-0.5">
                  <Text className="text-white text-[12px] font-bold">
                    {unreadCount}
                  </Text>
                </View>
              )}
              <FontAwesome
                name="chevron-right"
                size={12}
                color={colors.text + "50"}
              />
            </View>
          </Pressable>
        </Animated.View>

        {/* ── Settings ── */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(140)}
          className="gap-3"
        >
          <Text className="text-3xl font-medium text-text uppercase  pl-1">
            Settings
          </Text>

          <Pressable
            onPress={() => router.push({ pathname: "/prefs/prefs" })}
            className="bg-pill rounded-[20px] border border-primary/25 flex-row items-center justify-between px-4 py-4 active:opacity-70"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-[10px] bg-background border border-primary/25 items-center justify-center">
                <FontAwesome name="thumbs-o-up" size={16} color={colors.text} />
              </View>
              <Text className="text-[15px] font-semibold text-text">
                Preferences & Privacy
              </Text>
            </View>
            <FontAwesome
              name="chevron-right"
              size={12}
              color={colors.text + "50"}
            />
          </Pressable>

          <Pressable
            onPress={() =>
              router.push({
                pathname: `/settings/[uid]`,
                params: {
                  uid: user?.id || user?.app_user.uid!,
                },
              })
            }
            className="bg-pill rounded-[20px] border border-primary/25 flex-row items-center justify-between px-4 py-4 active:opacity-70"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-[10px] bg-background border border-primary/25 items-center justify-center">
                <FontAwesome name="gear" size={16} color={colors.text} />
              </View>
              <Text className="text-[15px] font-semibold text-text">
                Settings
              </Text>
            </View>
            <FontAwesome
              name="chevron-right"
              size={12}
              color={colors.text + "50"}
            />
          </Pressable>

          <Pressable
            onPress={handleLogout}
            className="bg-pill rounded-[20px] border border-red-400/30 flex-row items-center justify-between px-4 py-4 active:opacity-70"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-[10px] bg-red-50 border border-red-400/30 items-center justify-center">
                <FontAwesome name="sign-out" size={16} color="#f87171" />
              </View>
              <Text className="text-[15px] font-semibold text-red-400">
                Log out
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#f87171" />
          </Pressable>
        </Animated.View>
      </View>
      <UserListings setModals={() => setShowModal(false)} showModal={showModal} />
    </ScrollView>
  );
}

export default function Profile() {
  return <ProfileScreen />;
}
