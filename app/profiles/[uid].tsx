import { BASE_URL } from "@/constants/constants";
import { components, colors } from "@/constants/theme";
import { useUser } from "@/store/zustand";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ListingCard from "@/components/Listings/ListingCard";
import StarRating from "@/components/StarRating";
import { useRefresh } from "@/hooks/useRefresh";
import { getUserSupabase } from "@/utils/functions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const YEAR_LABELS: Record<number, string> = {
  1: "1st year", 2: "2nd year", 3: "3rd year",
  4: "4th year", 5: "5th year+", 6: "Graduate",
};

const INTENT_CONFIG: Record<string, { label: string; icon: string }> = {
  buying:  { label: "Buying",           icon: "bag-shopping"      },
  selling: { label: "Selling",          icon: "tag"               },
  both:    { label: "Buying & Selling", icon: "arrows-left-right" },
};

// ─── Small components ─────────────────────────────────────────────────────────

const StatBox = ({ value, label, icon }: { value: string | number; label: string; icon: string }) => (
  <View className="flex-1 items-center gap-1 bg-background rounded-2xl py-4 border border-secondary/10">
    <FontAwesome6 name={icon as any} size={14} color={colors.primary} />
    <Text className="text-base font-bold text-text">{value}</Text>
    <Text className="text-[10px] text-secondary text-center leading-4">{label}</Text>
  </View>
);

const CategoryChip = ({ label }: { label: string }) => (
  <View className="bg-primary/8 border border-primary/20 px-2.5 py-1 rounded-full">
    <Text className="text-[11px] font-semibold text-primary">{label}</Text>
  </View>
);

const VerifiedBadge = () => (
  <View className="flex-row items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full self-start">
    <FontAwesome6 name="circle-check" size={10} color="#10b981" />
    <Text className="text-[11px] font-bold text-emerald-600">Verified Student</Text>
  </View>
);

const IntentBadge = ({ intent }: { intent: string }) => {
  const cfg = INTENT_CONFIG[intent] ?? INTENT_CONFIG.both;
  return (
    <View className="flex-row items-center gap-1.5 bg-secondary/8 border border-secondary/15 px-2.5 py-1 rounded-full self-start">
      <FontAwesome6 name={cfg.icon as any} size={10} color={colors.secondary} />
      <Text className="text-[11px] font-semibold text-secondary">{cfg.label}</Text>
    </View>
  );
};

// ─── Review Card ─────────────────────────────────────────────────────────────

const ReviewCard = ({ review, index }: { review: Review; index: number }) => (
  <Animated.View
    entering={FadeInDown.duration(350).delay(index * 60)}
    className="bg-pill rounded-2xl p-4 gap-3 border border-secondary/10 mb-3"
  >
    <View className="flex-row justify-between items-start">
      <View className="flex-row gap-3 items-center flex-1">
        {review.reviewer?.profileURL ? (
          <Image source={{ uri: review.reviewer.profileURL }} className="w-9 h-9 rounded-xl" />
        ) : (
          <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center">
            <Text className="text-sm font-bold text-primary">
              {review.reviewer?.name?.[0]?.toUpperCase() ?? "?"}
            </Text>
          </View>
        )}
        <View className="gap-0.5">
          <Text className="text-[13px] font-bold text-text">
            {review.reviewer?.name ?? "Deleted user"}
          </Text>
          <Text className="text-[11px] text-secondary">
            {review.role === "BUYER" ? "Bought from them" : "Sold to them"}
          </Text>
        </View>
      </View>
      <View className="items-end gap-1">
        <StarRating value={review.rating} setValue={() => {}} />
        <Text className="text-[10px] text-secondary">
          {new Date(review.createdAt).toLocaleDateString("en-CA", {
            month: "short", year: "numeric",
          })}
        </Text>
      </View>
    </View>
    {review.comment && (
      <Text className="text-[13px] text-text/80 leading-relaxed">{review.comment}</Text>
    )}
  </Animated.View>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const ProfileSkeleton = () => (
  <View className="gap-4">
    <View className="mx-4 bg-pill rounded-2xl p-4 flex-row gap-4 border border-secondary/10">
      <View className="w-[68px] h-[68px] rounded-2xl bg-secondary/20" />
      <View className="flex-1 gap-2 justify-center">
        <View className="h-4 w-1/2 bg-secondary/20 rounded-full" />
        <View className="h-3 w-1/3 bg-secondary/10 rounded-full" />
        <View className="h-3 w-2/5 bg-secondary/10 rounded-full" />
      </View>
    </View>
    <View className="mx-4 flex-row gap-2">
      {[0, 1, 2].map((i) => (
        <View key={i} className="flex-1 h-20 bg-pill rounded-2xl border border-secondary/10" />
      ))}
    </View>
  </View>
);

// ─── Tab Pill ─────────────────────────────────────────────────────────────────

const TabPill = ({
  label, active, count, onPress,
}: {
  label: string; active: boolean; count: number; onPress: () => void;
}) => {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={style}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.94, { stiffness: 400 }); }}
        onPressOut={() => { scale.value = withSpring(1, { stiffness: 400 }); }}
        onPress={onPress}
        className={`flex-row items-center gap-1.5 px-4 py-2 rounded-full border ${
          active ? "bg-text border-text" : "bg-pill border-secondary/20"
        }`}
      >
        <Text className={`text-[13px] font-semibold ${active ? "text-pill" : "text-secondary"}`}>
          {label}
        </Text>
        <View className={`min-w-[18px] h-[18px] rounded-full items-center justify-center px-1 ${
          active ? "bg-pill/20" : "bg-secondary/15"
        }`}>
          <Text className={`text-[10px] font-bold ${active ? "text-pill" : "text-secondary"}`}>
            {count}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PublicProfileScreen() {
  const params = useLocalSearchParams();
  const uid = params.uid as string | undefined;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useUser();

  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"listings" | "reviews">("listings");

  const fetchProfile = async (authId?: string) => {
    if (!uid || typeof uid !== "string") return;
    try {
      const res = await fetch(`${BASE_URL}/api/users/${uid}`, {
        headers: { Authorization: authId ?? currentUser?.id ?? "" },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const json = await res.json();
      if (json.success) setData(json.data);
      else throw new Error(json.message ?? "Unknown error");
    } catch (err) {
      setError("Couldn't load this profile.");
      console.error(err);
    }
  };

  const { refreshing, onRefresh } = useRefresh({
    func: async () => {
      const { user: u } = await getUserSupabase();
      if (!u) return;
      await fetchProfile(u.id);
    },
  });

  useEffect(() => {
    if (!uid || typeof uid !== "string") return;
    setLoading(true);
    fetchProfile().finally(() => setLoading(false));
  }, [uid]);

  const activeListings = data?.listings.filter((l) => !l.sold && !l.archived) ?? [];
  const totalSales = data?.listings.filter((l) => l.sold).length ?? 0;
  const avgRating = data?.rating ?? 0;
  const yearLabel = data?.year ? YEAR_LABELS[data.year] : null;
  const isOwnProfile = currentUser?.id === uid;

  return (
    <ScrollView
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingBottom: components.tabBar.height + insets.bottom + 24,
        flexGrow: 1,
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* ── Navbar ── */}
      <Animated.View
        entering={FadeInUp.duration(300)}
        className="flex-row items-center justify-between px-4 py-3"
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="w-9 h-9 rounded-xl bg-pill border border-secondary/20 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={22} color="#1a2e28" />
        </Pressable>
        <Text
          className="text-base font-bold text-text tracking-tight flex-1 text-center"
          numberOfLines={1}
        >
          {loading ? "Profile" : (data?.name ?? "Profile")}
        </Text>
        <View className="w-9" />
      </Animated.View>

      {/* ── Loading ── */}
      {loading ? (
        <View className="pt-4 gap-4">
          <ProfileSkeleton />
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        </View>

      ) : error ? (
        /* ── Error ── */
        <View className="flex-1 items-center justify-center gap-3 px-8 py-24">
          <Text className="text-4xl">😕</Text>
          <Text className="text-[15px] text-secondary text-center">{error}</Text>
          <Pressable onPress={() => router.back()} className="mt-2 bg-primary px-6 py-3 rounded-xl">
            <Text className="text-pill font-bold text-sm">Go back</Text>
          </Pressable>
        </View>

      ) : data ? (
        <>
          {/* ══════════════════════════════════════
              HERO CARD
          ══════════════════════════════════════ */}
          <Animated.View
            entering={FadeInDown.duration(400)}
            className="mx-4 mt-1 bg-pill rounded-2xl p-4 border border-secondary/10 gap-3"
          >
            {/* Avatar + name row */}
            <View className="flex-row gap-4 items-center">
              {data.profileURL ? (
                <Image source={{ uri: data.profileURL }} className="w-[68px] h-[68px] rounded-2xl" />
              ) : (
                <View className="w-[68px] h-[68px] rounded-2xl bg-primary/10 items-center justify-center">
                  <Text className="text-2xl font-extrabold text-primary">
                    {data.name[0]?.toUpperCase()}
                  </Text>
                </View>
              )}

              <View className="flex-1 gap-1.5">
                <View className="flex-row items-center gap-1.5 flex-wrap">
                  <Text className="text-lg font-extrabold text-text tracking-tight">
                    {data.name}
                  </Text>
                  {data.isVerified && <VerifiedBadge />}
                </View>

                <Text className="text-sm font-medium text-primary">@{data.username}</Text>

                {(data.faculty || yearLabel) && (
                  <Text className="text-xs text-secondary" numberOfLines={1}>
                    {[yearLabel, data.faculty].filter(Boolean).join(" · ")}
                  </Text>
                )}

                <View className="flex-row items-center gap-1.5 mt-0.5">
                  <StarRating value={avgRating} setValue={() => {}} />
                  <Text className="text-xs font-semibold text-text">
                    {avgRating > 0 ? avgRating.toFixed(1) : "No ratings"}
                    {data.reviewsReceived.length > 0 && (
                      <Text className="font-normal text-secondary">
                        {" · "}{data.reviewsReceived.length} review
                        {data.reviewsReceived.length !== 1 ? "s" : ""}
                      </Text>
                    )}
                  </Text>
                </View>
              </View>
            </View>

            {/* Bio */}
            {data.bio ? (
              <Text className="text-[13px] text-text/80 leading-relaxed">{data.bio}</Text>
            ) : null}

            {/* Intent + member since */}
            <View className="flex-row items-center justify-between flex-wrap gap-2">
              {data.intent && <IntentBadge intent={data.intent} />}
              <Text className="text-[11px] text-secondary">
                Member since{" "}
                {new Date(data.createdAt).toLocaleDateString("en-CA", {
                  month: "long", year: "numeric",
                })}
              </Text>
            </View>

            {/* Category interests */}
            {data.category_interests?.length > 0 && (
              <View className="gap-1.5">
                <Text className="text-[10px] font-semibold tracking-widest uppercase text-secondary/60">
                  Interested in
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {data.category_interests.map((cat: string) => (
                    <CategoryChip key={cat} label={cat} />
                  ))}
                </View>
              </View>
            )}

            {/* Report — hidden on own profile */}
            {!isOwnProfile && (
              <View className="flex-row justify-end gap-2.5 pt-1 border-t border-secondary/10">
                <Pressable
                  hitSlop={8}
                  className="w-10 h-10 rounded-xl bg-secondary/10 items-center justify-center"
                >
                  <Ionicons name="flag-outline" size={16} color="#a97bc7" />
                </Pressable>
              </View>
            )}
          </Animated.View>

          {/* ══════════════════════════════════════
              STAT ROW
          ══════════════════════════════════════ */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(60)}
            className="flex-row mx-4 mt-3 gap-2"
          >
            <StatBox icon="tag"   value={totalSales}            label={"Total\nsales"}     />
            <StatBox icon="store" value={activeListings.length} label={"Active\nlistings"} />
            <StatBox icon="star"  value={avgRating > 0 ? avgRating.toFixed(1) : "—"} label={"Avg\nrating"} />
          </Animated.View>

          {/* ── Tabs ── */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(120)}
            className="flex-row px-4 mt-4 gap-2"
          >
            <TabPill
              label="Listings"
              active={activeTab === "listings"}
              count={activeListings.length}
              onPress={() => setActiveTab("listings")}
            />
            <TabPill
              label="Reviews"
              active={activeTab === "reviews"}
              count={data.reviewsReceived.length}
              onPress={() => setActiveTab("reviews")}
            />
          </Animated.View>

          {/* ── Tab content ── */}
          <View className="px-4 pt-3 gap-2.5">
            {activeTab === "listings" ? (
              activeListings.length === 0 ? (
                <Animated.View
                  entering={FadeInDown.duration(300)}
                  className="items-center py-12 gap-2 bg-pill rounded-2xl border border-secondary/10 mt-1"
                >
                  <Text className="text-3xl mb-1">🏷️</Text>
                  <Text className="text-[15px] font-bold text-text">No active listings</Text>
                  <Text className="text-[13px] text-secondary text-center px-8 leading-relaxed">
                    {data.name.split(" ")[0]} hasn&apos;t posted anything yet.
                  </Text>
                </Animated.View>
              ) : (
                activeListings.map((listing, i) => (
                  <Animated.View
                    key={listing.lid}
                    entering={FadeInDown.duration(300).delay(i * 50)}
                  >
                    <ListingCard listing={{ ...listing, seller: data }} />
                  </Animated.View>
                ))
              )
            ) : data.reviewsReceived.length === 0 ? (
              <Animated.View
                entering={FadeInDown.duration(300)}
                className="items-center py-12 gap-2 bg-pill rounded-2xl border border-secondary/10 mt-1"
              >
                <Text className="text-3xl mb-1">⭐</Text>
                <Text className="text-[15px] font-bold text-text">No reviews yet</Text>
                <Text className="text-[13px] text-secondary text-center px-8 leading-relaxed">
                  Reviews appear after completed transactions.
                </Text>
              </Animated.View>
            ) : (
              data.reviewsReceived.map((review, i) => (
                <ReviewCard key={review.rid} review={review} index={i} />
              ))
            )}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}