import { BASE_URL } from "@/constants/constants";
import { components } from "@/constants/theme";
import { useUser } from "@/store/zustand";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
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

// ─── Review Card ─────────────────────────────────────────────────────────────

const ReviewCard = ({ review, index }: { review: Review; index: number }) => (
  <Animated.View
    entering={FadeInDown.duration(350).delay(index * 60)}
    className="bg-pill rounded-2xl p-4 gap-3 border border-secondary/10 mb-3"
  >
    <View className="flex-row justify-between items-start">
      <View className="flex-row gap-3 items-center flex-1">
        {review.reviewer?.profileURL ? (
          <Image
            source={{ uri: review.reviewer.profileURL }}
            className="w-9 h-9 rounded-xl"
          />
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
            month: "short",
            year: "numeric",
          })}
        </Text>
      </View>
    </View>

    {review.comment && (
      <Text className="text-[13px] text-text/80 leading-relaxed">
        {review.comment}
      </Text>
    )}
  </Animated.View>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const ProfileSkeleton = () => (
  <View className="mx-4 bg-pill rounded-2xl p-4 flex-row gap-4 border border-secondary/10">
    <View className="w-[68px] h-[68px] rounded-2xl bg-secondary/20" />
    <View className="flex-1 gap-2 justify-center">
      <View className="h-4 w-1/2 bg-secondary/20 rounded-full" />
      <View className="h-3 w-1/3 bg-secondary/10 rounded-full" />
      <View className="h-3 w-2/5 bg-secondary/10 rounded-full" />
    </View>
  </View>
);

// ─── Tab Pill ─────────────────────────────────────────────────────────────────

const TabPill = ({
  label,
  active,
  count,
  onPress,
}: {
  label: string;
  active: boolean;
  count: number;
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.94, { stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { stiffness: 400 });
        }}
        onPress={onPress}
        className={`flex-row items-center gap-1.5 px-4 py-2 rounded-full border ${
          active ? "bg-text border-text" : "bg-pill border-secondary/20"
        }`}
      >
        <Text
          className={`text-[13px] font-semibold ${
            active ? "text-pill" : "text-secondary"
          }`}
        >
          {label}
        </Text>
        <View
          className={`min-w-[18px] h-[18px] rounded-full items-center justify-center px-1 ${
            active ? "bg-pill/20" : "bg-secondary/15"
          }`}
        >
          <Text
            className={`text-[10px] font-bold ${
              active ? "text-pill" : "text-secondary"
            }`}
          >
            {count}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PublicProfileScreen() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useUser();

  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"listings" | "reviews">(
    "listings",
  );

  const isOwnProfile = currentUser?.id === uid;

  useEffect(() => {
    if (!uid) return;
    const fetchProfile = async () => {
      try {
        setLoading(true);
       
        const res = await fetch(`${BASE_URL}/api/users/${uid}`, {
          headers: { Authorization: currentUser?.id! },
        });
        
        if (!res.ok) throw new Error("Failed to fetch profile");
        const json = await res.json();
        if (json.success) setData(json.data);
        else throw new Error(json.message ?? "Unknown error");
      } catch (err) {
        setError("Couldn't load this profile.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [uid]);

  const activeListings =
    data?.listings.filter((l) => !l.sold && !l.archived) ?? [];
  const avgRating = data?.rating ?? 0;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
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
        <View className="flex-1 pt-4 gap-4">
          <ProfileSkeleton />
          <ActivityIndicator color="#3db88a" style={{ marginTop: 32 }} />
        </View>
      ) : error ? (
        /* ── Error ── */
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Text className="text-4xl">😕</Text>
          <Text className="text-[15px] text-secondary text-center">
            {error}
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-2 bg-primary px-6 py-3 rounded-xl"
          >
            <Text className="text-pill font-bold text-sm">Go back</Text>
          </Pressable>
        </View>
      ) : data ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: components.tabBar.height + insets.bottom + 24,
          }}
        >
          {/* ── Hero card ── */}
          <Animated.View
            entering={FadeInDown.duration(400)}
            className="mx-4 mt-1 bg-pill rounded-2xl p-4 border border-secondary/10 gap-4"
          >
            <View className="flex-row gap-4 items-center">
              {data?.profileURL ? (
                <Image
                  source={{ uri: data?.profileURL }}
                  className="w-[68px] h-[68px] rounded-2xl"
                />
              ) : (
                <View className="w-[68px] h-[68px] rounded-2xl bg-primary/10 items-center justify-center">
                  <Text className="text-2xl font-extrabold text-primary">
                    {data?.name[0]?.toUpperCase()}
                  </Text>
                </View>
              )}

              <View className="flex-1 gap-1.5">
                <Text className="text-xl font-extrabold text-text tracking-tight">
                  {data.name}
                </Text>

                <View className="flex-row items-center gap-2">
                  <StarRating value={avgRating} setValue={() => {}} />
                  <Text className="text-xs font-semibold text-text">
                    {avgRating > 0 ? avgRating.toFixed(1) : "No ratings"}
                    {data.reviewsReceived.length > 0 && (
                      <Text className="font-normal text-secondary">
                        {" · "}
                        {data.reviewsReceived.length} review
                        {data.reviewsReceived.length !== 1 ? "s" : ""}
                      </Text>
                    )}
                  </Text>
                </View>

                <Text className="text-[11px] text-secondary">
                  Member since{" "}
                  {new Date(data.createdAt).toLocaleDateString("en-CA", {
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </View>

            {/* Action buttons — hidden on own profile */}
            {!isOwnProfile && (
              <View className="flex-row justify-end gap-2.5">
                {/* <Pressable
                  onPress={() => router.push(`/new?sellerId=${uid}`)}
                  className="flex-1 flex-row items-center justify-center gap-2 bg-primary py-3 rounded-xl"
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text className="text-pill font-bold text-sm">Message</Text>
                </Pressable> */}

                <Pressable
                  hitSlop={8}
                  className="w-11 h-11  rounded-xl bg-secondary/10 items-center justify-center"
                >
                  <Ionicons name="flag-outline" size={16} color="#a97bc7" />
                </Pressable>
              </View>
            )}
          </Animated.View>

          {/* ── Tabs ── */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(80)}
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
                  <Text className="text-[15px] font-bold text-text">
                    No active listings
                  </Text>
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
                    <ListingCard listing={{...listing, seller: data}} />
                  </Animated.View>
                ))
              )
            ) : data.reviewsReceived.length === 0 ? (
              <Animated.View
                entering={FadeInDown.duration(300)}
                className="items-center py-12 gap-2 bg-pill rounded-2xl border border-secondary/10 mt-1"
              >
                <Text className="text-3xl mb-1">⭐</Text>
                <Text className="text-[15px] font-bold text-text">
                  No reviews yet
                </Text>
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
        </ScrollView>
      ) : null}
    </View>
  );
}
