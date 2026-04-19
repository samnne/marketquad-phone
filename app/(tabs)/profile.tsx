import DeleteModal from "@/components/Modals/DeleteModal";
import ProfileSections from "@/components/ProfileSections";
import { BASE_URL } from "@/constants/constants";
import { colors, components } from "@/constants/theme";
import { useNotifications } from "@/context/NotificationContext";
import { useRefresh } from "@/hooks/useRefresh";
import { getConvos } from "@/lib/conversations.lib";
import { getUserListings } from "@/lib/listing.lib";
import { getPreferences } from "@/lib/preferences.lib";
import { useConvos, useListings, useMessage, useUser } from "@/store/zustand";
import { supabase } from "@/supabase/authHelper";
import { cleanUP, getUserSupabase } from "@/utils/functions";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
  if (name)
    return name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  if (email) return email[0].toUpperCase();
  return "?";
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomClearance = components.tabBar.height + insets.bottom;
  const {
    user,
    userListings,
    setUserListings,
    setUser,
    reset: userReset,
  } = useUser();
  const { reset: convoReset, convos, setConvos } = useConvos();
  const { reset: lisReset } = useListings();
  const { setError, setSuccess, setMessage } = useMessage();
  const [deleteUser, setDeleteUser] = useState(false);

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

  // ── Mount ──
  useEffect(() => {
    const mountSession = async () => {
      const { user: u, error, app_user } = await getUserSupabase();

      if (!u || error) {
        setError(true);
        setMessage("Logged Out!")
        router.replace("/sign-in");
        return;
      }
      setUser({ ...u, app_user });
    };
    mountSession();
  }, [router, setError, setUser, setMessage]);

  useEffect(() => {
    const mountUserListings = async () => {
      if (userListings.length > 0) return;
      try {
        const { user: u, error, app_user } = await getUserSupabase();
        if (!u) return;

        const tempListings = await getUserListings(u.id);
        if (!tempListings.listings) {
          setError(true);
          setMessage("Couldn't fetch listings")
          return;
        }
        const convos = await getConvos(u.id);
        if (convos) setConvos(convos);

        setUserListings(tempListings.listings);
      } catch (err) {
        console.error(err);
        setError(true);
      }
    };
    mountUserListings();
  }, [user, setConvos, setError, setUserListings, userListings.length]);

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
          setMessage("Logged Out")
          router.replace("/sign-in");
        },
      },
    ]);
  };

  const unreadCount =
    convos?.filter((c) => (c.unreadCount ?? 0) > 0).length ?? 0;
  const soldCount = userListings?.filter((l) => l.sold).length ?? 0;
  const initials = getInitials(user?.name, user?.email);
  const isVerified = user?.user_metadata?.email_verified;
  const rating = user?.app_user?.rating;
  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "Welcome";

  const stats = [
    { num: userListings?.length ?? 0, label: "Listings" },
    { num: soldCount, label: "Sold" },
    { num: rating ? Number(rating).toFixed(1) : "—", label: "Rating" },
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
            <View className="w-16 h-16 rounded-full bg-primary items-center justify-center shrink-0">
              <Text className="text-[20px] font-bold text-text">
                {initials}
              </Text>
            </View>

            {/* Name / email / badge */}
            <View className="flex-1 min-w-0 gap-1">
              <Text
                className="text-[17px] font-bold text-text"
                numberOfLines={1}
              >
                {displayName}
              </Text>
              <Text className="text-[12px] text-secondary" numberOfLines={1}>
                {user?.email}
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

            {/* Edit button */}
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
                key={label}
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
        <Animated.View entering={FadeInDown.duration(300).delay(80)}>
          <Text className="text-[11px] font-medium text-primary uppercase tracking-widest mb-2.5 pl-1">
            Your market
          </Text>
          <View className="bg-pill rounded-[20px] border border-primary/25 overflow-hidden">
            <ProfileSections
              sideIcon={
                <FontAwesome name="list" size={16} color={colors.primary} />
              }
              displayText="Your listings"
              badge={userListings?.length}
              props={{ type: "ulist" }}
            />
            <ProfileSections
              sideIcon={
                <FontAwesome
                  name="comment-o"
                  size={16}
                  color={colors.secondary}
                />
              }
              displayText="Your messages"
              badge={unreadCount > 0 ? unreadCount : undefined}
              badgeAccent
              props={{ type: "messages" }}
            />
          </View>
        </Animated.View>

        {/* ── Settings ── */}
        <Animated.View entering={FadeInDown.duration(300).delay(140)}>
          <Text className="text-[11px] font-medium text-primary uppercase tracking-widest mb-2.5 pl-1">
            Settings
          </Text>
          <View className="bg-pill rounded-[20px] border border-primary/25 overflow-hidden">
            <ProfileSections
              sideIcon={
                <FontAwesome name="thumbs-o-up" size={16} color={colors.text} />
              }
              displayText="Preferences & Privacy"
              props={{ type: "prefs" }}
            />

            {/* Logout row */}
            <View className="flex-row items-center justify-between px-4 py-3.5 border-t border-primary/15">
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-[10px] bg-background border border-primary/25 items-center justify-center">
                  <FontAwesome
                    name="sign-out"
                    size={16}
                    color={colors.secondary}
                  />
                </View>
                <Text className="text-[14px] font-medium text-text">
                  Logout
                </Text>
              </View>
              <Pressable
                onPress={handleLogout}
                className="bg-text px-4 py-2 rounded-xl"
              >
                <Text className="text-primary text-[13px] font-bold">
                  Log out
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* ── Danger zone ── */}
        <Animated.View entering={FadeInDown.duration(300).delay(200)}>
          <Text className="text-[11px] font-medium text-primary uppercase tracking-widest mb-2.5 pl-1">
            Danger zone
          </Text>
          <View className="bg-pill rounded-[20px] border border-primary/25 overflow-hidden">
            <View className="flex-row items-center justify-between px-4 py-3.5">
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-[10px] bg-red-50 border border-red-200 items-center justify-center">
                  <FontAwesome name="warning" size={14} color="#dc2626" />
                </View>
                <View>
                  <Text className="text-[14px] font-medium text-red-600">
                    Delete account
                  </Text>
                  <Text className="text-[11px] text-primary">
                    This cannot be undone
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setDeleteUser(true)}
                className="bg-red-50 border border-red-200 px-4 py-2 rounded-xl"
              >
                <Text className="text-red-600 text-[13px] font-bold">
                  Delete
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* ── Delete modal ── */}
      {deleteUser && (
        <DeleteModal
          session={user}
          lisReset={lisReset}
          userReset={userReset}
          setDeleteUser={setDeleteUser}
          deleteUser={deleteUser}
        />
      )}
    </ScrollView>
  );
}
