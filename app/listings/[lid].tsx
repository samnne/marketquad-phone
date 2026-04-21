import Carousel from "@/components/Carousel";
import StarRating from "@/components/StarRating";
import { BASE_URL } from "@/constants/constants";
import { createConvo } from "@/lib/conversations.lib";
import { deleteListingAction } from "@/lib/listing.lib";
import { useConvos, useListings, useMessage, useUser } from "@/store/zustand";
import { getUserSupabase } from "@/utils/functions";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import LocationPreview from "@/components/Listings/ListingMap";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Share } from "react-native";
import { useLike } from "@/hooks/useLike";

// ── Helpers ───────────────────────────────────────────────────────────────────
const RANDOM_MESSAGES = [
  "Is this still available?",
  "What time could this be picked up?",
  "Hey, I'm interested, when could I pick it up?",
  "I can come pick this up today, does that work?",
  "I'll take it, where should I bring the cash?",
];
function getRandomMsg() {
  return RANDOM_MESSAGES[Math.floor(Math.random() * RANDOM_MESSAGES.length)];
}
function timeAgo(date?: string | Date) {
  if (!date) return "";
  const s = (Date.now() - new Date(date).getTime()) / 1000;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-row justify-between py-3.5 border-b border-background">
    <Text className="text-[13px] text-text/50">{label}</Text>
    <Text className="text-[13px] font-semibold text-text">{value}</Text>
  </View>
);

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ListingPage() {
  const { lid } = useLocalSearchParams<{ lid: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [actionLoading, setActionLoading] = useState<
    "edit" | "sold" | "archived" | "delete" | null
  >(null);

  const { setSelectedListing, selectedListing } = useListings();
  const { user, setUser, setUserListings, userListings } = useUser();
  const { setSelectedConvo, setConvos, convos } = useConvos();
  const { setError, setSuccess, setMessage } = useMessage();

  const [listing, setListing] = useState<any>(null);
  const {
    liked,
    count,
    toggle,
    loading: likeLoading,
  } = useLike(
    selectedListing?.lid ?? "",
    selectedListing?.likes?.length > 0,
    selectedListing?._count?.likes ?? 0,
  );
  const [message, setFirstMessage] = useState(getRandomMsg());
  const [expandDesc, setExpandDesc] = useState(false);
  const [localReviews, setLocalReviews] = useState<number | null>(null);
  const [creatingConvo, setCreatingConvo] = useState(false);
  const [tab, setTab] = useState<"about" | "details">("about");

  useEffect(() => {
    const mount = async () => {
      if (selectedListing?.lid === lid) setListing(selectedListing);
      const { user: u, app_user } = await getUserSupabase();
      if (!u) return;
      setUser({ ...u, app_user });

      const [listRes, revRes] = await Promise.all([
        fetch(`${BASE_URL}/api/listings/${lid}`, {
          headers: { Authorization: u.id },
        }),
        fetch(`${BASE_URL}/api/reviews/count`, {
          headers: { Authorization: u.id },
        }),
      ]);
      const listData = await listRes.json();
      if (listData?.listing) {
        setListing(listData.listing);
        setSelectedListing(listData.listing);
      }
      const revData = await revRes.json();
      setLocalReviews(revData.count ?? 0);
    };
    mount();
  }, [lid]);

  const createConversation = async () => {
    setCreatingConvo(true);
    try {
      const data = await getUserSupabase();
      if (!data.user) {
        setError(true);
        setMessage("Error creating convo");
        router.replace("/sign-in");
        return;
      }
      const existing = listing.conversations.find(
        (c: any) => c?.listingId === listing?.lid,
      );
      const newCon = await createConvo(
        {
          listingId: listing.lid,
          buyerId: data.app_user.uid,
          sellerId: listing.sellerId,
          initialMessage: message,
        },
        existing,
      );
      setSelectedListing({
        ...listing,
        conversations: [...listing.conversations, newCon?.convo],
        buyerId: data.app_user.uid,
      });

      setConvos([
        ...convos,
        {
          ...newCon?.convo,
          listing: { ...listing },
          seller: {
            ...listing?.seller,
          },
        },
      ]);
      router.push("/convos");
    } catch (err) {
      console.error(err);
      setError(true);
      setMessage("Something went wrong...");
    } finally {
      setCreatingConvo(false);
    }
  };

  const handleDelete = async () => {
    if (!user?.id || !listing) return;
    setActionLoading("delete");
    try {
      const res = await deleteListingAction(listing.lid, user.id);
      if (res?.success) {
        setUserListings(userListings.filter((l) => l.lid !== listing.lid));
        setSelectedListing({});
        router.replace("/listings");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleShare = async () => {
    if (!listing) return;
    try {
      await Share.share({
        title: listing.title,
        message: `Check out this listing on MarketQuad: ${listing.title} — $${listing.price}\n\nmarketquad://listings/${listing.lid}`,
        
      });
    } catch (err) {
      console.error(err);
    }
  };
  const handleToggle = async (field: "archived" | "sold") => {
    if (!user || !listing) return;
    setActionLoading(field);
    try {
      const updated = { ...listing, [field]: !listing[field] };
      const res = await fetch(`${BASE_URL}/api/listings`, {
        method: "PUT",
        headers: { Authorization: user.id, "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      }).then((r) => r.json());
      if (!res.success) {
        setError(true);
        setMessage("Toggle error");
        return;
      }
      setSuccess(true);
      setUserListings(
        userListings.map((l) => (l?.lid === updated?.lid ? updated : l)),
      );
      setListing(updated);
      setSelectedListing(updated);
    } finally {
      setActionLoading(null);
    }
  };

  if (!listing?.title) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#1a2e28" />
      </View>
    );
  }

  const isSeller = listing?.sellerId === user?.id;
  const existingConvo = (listing?.conversations ?? []).find(
    (c: any) => c.buyerId === user?.id,
  );
  const safeImages = (listing.imageUrls ?? []).filter(
    (url: any) => typeof url === "string" && url.startsWith("http"),
  );
  
  return (
    <View className="flex-1 bg-white" style={{}}>
      <KeyboardAvoidingView
        className="flex-1 bg-white pb-2"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* ── Floating nav ── */}
        <View className="absolute top-0 left-0 right-0 z-10 flex-row justify-between items-center px-4 pt-12 pb-3">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-pill/90 items-center justify-center shadow-sm"
          >
            <FontAwesome name="arrow-left" size={14} color="#1a2e28" />
          </Pressable>

          <View className="flex-row gap-2 items-center">
            {/* Like button */}
            <Pressable
              onPress={toggle}
              disabled={likeLoading || !listing}
              className="w-10 h-10 rounded-full bg-pill/90 items-center justify-center shadow-sm"
            >
              {likeLoading ? (
                <ActivityIndicator size="small" color="#1a2e28" />
              ) : (
                <FontAwesome
                  name={liked ? "heart" : "heart-o"}
                  size={14}
                  color={liked ? "#e53e3e" : "#1a2e28"}
                />
              )}
            </Pressable>

            {/* Share button — wired up next */}
            <Pressable
              onPress={handleShare}
              className="w-10 h-10 rounded-full bg-pill/90 items-center justify-center shadow-sm"
            >
              <FontAwesome name="share" size={14} color="#1a2e28" />
            </Pressable>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{}}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Hero ── */}
          <View className="h-120 bg-background">
            {safeImages.length > 0 ? (
              <Carousel images={safeImages} />
            ) : (
              <View className="flex-1 items-center justify-center">
                <FontAwesome
                  name="image"
                  size={48}
                  color="#1a2e28"
                  opacity={0.2}
                />
              </View>
            )}
            {listing.condition && (
              <View className="absolute bottom-2 left-4 bg-text px-3 py-1.5 rounded-full">
                <Text className="text-pill text-[11px] font-bold">
                  {listing.condition}
                </Text>
              </View>
            )}
          </View>

          {/* ── Card body ── */}
          <View className="bg-pill  rounded-t-[24px]  px-5 pt-6 gap-5">
            <Animated.View entering={FadeInDown.duration(300)}>
              <View className="flex-row justify-between items-start">
                <View className="flex-1 pr-3">
                  <Text className="text-xl font-bold text-text leading-7">
                    {listing.title}
                  </Text>
                  {listing.category && (
                    <Text className="text-[13px] text-text/50 mt-0.5">
                      {listing.category}
                    </Text>
                  )}
                </View>
                <View className="items-end">
                  <Text className="text-2xl font-extrabold text-primary">
                    {listing.price != "0" ? `$${listing.price}` : "FREE"}
                  </Text>
                  <Text className="text-[11px] text-text/30 mt-0.5">
                    {timeAgo(listing.createdAt)}
                  </Text>
                </View>
              </View>

              {/* Seller row */}
              <View className="flex-row items-center gap-2.5 mt-4 pt-4 border-t border-background">
                <Pressable onPress={() => router.push(`/profiles/${listing?.seller?.uid}`)} className="w-9 h-9 rounded-full bg-background items-center justify-center">
                  <Text className="text-sm font-bold text-text/70">
                    {(listing?.seller?.name?.[0] ?? "?").toUpperCase()}
                  </Text>
                </Pressable>
                <View className="flex-1">
                  <Text className="text-[13px] font-semibold text-text">
                    {listing?.seller?.name ?? "Seller"}
                  </Text>
                  <View className="flex-row items-center gap-1 mt-0.5">
                    <StarRating
                      value={listing?.seller?.rating ?? 0}
                      setValue={() => {}}
                    />
                    <Text className="text-[11px] text-text/40">
                      {localReviews === null ? "..." : `(${localReviews})`}
                    </Text>
                  </View>
                </View>
                <View className="px-2.5 py-1 rounded-full bg-background border border-background">
                  <Text className="text-[11px] font-semibold text-text/40">
                    Verified
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Tab switcher */}
            <Animated.View entering={FadeInDown.duration(300).delay(60)}>
              <View className="flex-row bg-background rounded-xl p-1">
                {(["about", "details"] as const).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setTab(t)}
                    className={`flex-1 py-2 rounded-lg items-center ${tab === t ? "bg-pill" : "transparent"}`}
                  >
                    <Text
                      className={`text-[13px] font-semibold capitalize ${tab === t ? "text-text" : "text-text/30"}`}
                    >
                      {t}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* Content Sections */}
            {tab === "about" && (
              <Animated.View
                entering={FadeInDown.duration(220)}
                className="gap-4.5"
              >
                <View>
                  <Text className="text-[13px] font-bold text-text mb-2">
                    Description
                  </Text>
                  <Text
                    className="text-sm text-text/70 leading-6"
                    numberOfLines={expandDesc ? undefined : 4}
                  >
                    {listing.description}
                  </Text>
                  <Pressable
                    onPress={() => setExpandDesc((p) => !p)}
                    className="mt-1.5"
                  >
                    <Text className="text-xs font-semibold text-accent">
                      {expandDesc ? "Show less ↑" : "Show more ↓"}
                    </Text>
                  </Pressable>
                </View>
                <View>
                  <Text className="text-[13px] font-bold text-text mb-2">
                    Pickup location
                  </Text>
                  <View className="h-48  p-3 rounded-2xl bg-background overflow-hidden items-center justify-center">
                    {listing.latitude && listing.longitude ? (
                      <LocationPreview
                        lat={listing.latitude}
                        lon={listing.longitude}
                        title="UVIC"
                      />
                    ) : (
                      <Text className="text-text/30 text-xs">
                        No location provided
                      </Text>
                    )}
                  </View>
                </View>
              </Animated.View>
            )}

            {tab === "details" && (
              <Animated.View entering={FadeInDown.duration(220)}>
                <Row label="Condition" value={listing.condition ?? "—"} />
                <Row label="Category" value={listing.category ?? "—"} />
                <Row label="Listed" value={timeAgo(listing.createdAt) || "—"} />
                <Row
                  label="Status"
                  value={
                    listing.sold
                      ? "Sold"
                      : listing.archived
                        ? "Archived"
                        : "Available"
                  }
                />
              </Animated.View>
            )}

            {/* Seller manage */}
            {isSeller && (
              <Animated.View
                entering={FadeInDown.duration(300).delay(80)}
                className="bg-background mb-8 rounded-2xl p-3.5 gap-2.5"
              >
                <Text className="text-[13px] font-bold text-text">
                  Manage listing
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {[
                    {
                      label: "Edit",
                      activeLabel: null,
                      fn: () => {
                        setActionLoading("edit");
                        setTimeout(() => {
                          router.push("/(tabs)/new?type=edit");
                          setActionLoading(null);
                        }, 500);
                      },
                      key: null,
                      loadingKey: "edit",
                    },
                    {
                      label: "Mark sold",
                      activeLabel: "Sold",
                      fn: () => handleToggle("sold"),
                      key: "sold",
                      loadingKey: "sold",
                    },
                    {
                      label: "Archive",
                      activeLabel: "Archived",
                      fn: () => handleToggle("archived"),
                      key: "archived",
                      loadingKey: "archived",
                    },
                  ].map(({ label, activeLabel, fn, key, loadingKey }) => {
                    const isActive = key ? listing[key] : false;
                    const isLoading = actionLoading === loadingKey;
                    return (
                      <Pressable
                        key={label}
                        onPress={fn}
                        disabled={!!actionLoading}
                        className={`px-3.5 py-2 rounded-full border flex-row items-center gap-1.5 ${
                          isActive
                            ? "bg-text border-text"
                            : "bg-pill border-background"
                        } ${!!actionLoading && !isLoading ? "opacity-40" : ""}`}
                      >
                        {isLoading ? (
                          <ActivityIndicator
                            size="small"
                            color={isActive ? "#fff" : "#1a2e28"}
                            className="w-8 h-2"
                          />
                        ) : (
                          <Text
                            className={`text-[12px] font-semibold ${isActive ? "text-pill" : "text-text/70"}`}
                          >
                            {isActive && activeLabel ? activeLabel : label}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}

                  <Pressable
                    onPress={handleDelete}
                    disabled={!!actionLoading}
                    className={`px-3.5 py-2 rounded-full bg-red-50 border border-red-100 flex-row items-center gap-1.5 ${
                      !!actionLoading && actionLoading !== "delete"
                        ? "opacity-40"
                        : ""
                    }`}
                  >
                    {actionLoading === "delete" ? (
                      <ActivityIndicator
                        size="small"
                        className="w-8 h-2"
                        color="#dc2626"
                      />
                    ) : (
                      <Text className="text-red-600 text-[12px] font-semibold">
                        Delete
                      </Text>
                    )}
                  </Pressable>
                </ScrollView>
              </Animated.View>
            )}
          </View>
        </ScrollView>

        {/* ── Bottom bar (buyer) ── */}
        {!isSeller && (
          <View className="bg-pill border-t border-background px-4 pb-20 pt-2 ">
            {!existingConvo ? (
              <View className="flex-row items-center gap-2.5">
                <View className="flex-1 flex-row items-center bg-background rounded-2xl px-3.5 py-3 gap-2">
                  <FontAwesome
                    name="comment-o"
                    size={13}
                    color="#1a2e28"
                    opacity={0.4}
                  />
                  <TextInput
                    className="flex-1 text-[13px]  text-text"
                    value={message}
                    onChangeText={setFirstMessage}
                    placeholder="Message the seller…"
                    placeholderTextColor="#1a2e2844"
                    returnKeyType="send"
                    onSubmitEditing={createConversation}
                  />
                </View>
                <Pressable
                  onPress={createConversation}
                  disabled={creatingConvo}
                  className="bg-text px-5 py-3.5 rounded-2xl min-w-[72px] items-center justify-center"
                >
                  {creatingConvo ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-pill text-[13px] font-bold">
                      Send
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : (
              (listing?.conversations ?? [])
                .filter((c: any) => c.buyerId === user?.id)
                .map((convo: any) => (
                  <Pressable
                    key={convo.cid}
                    onPress={() => {
                      setSelectedConvo(convo);
                      router.push(`/convos/${convo.cid}`);
                    }}
                    className="bg-text py-4 rounded-2xl items-center"
                  >
                    <Text className="text-pill font-bold text-sm">
                      Go to conversation →
                    </Text>
                  </Pressable>
                ))
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
