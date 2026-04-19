import Carousel from "@/components/Carousel";
import StarRating from "@/components/StarRating";
import { BASE_URL } from "@/constants/constants";
import { colors } from "@/constants/theme";
import { createConvo } from "@/lib/conversations.lib";
import { deleteListingAction } from "@/lib/listing.lib";
import { useConvos, useListings, useMessage, useUser } from "@/store/zustand";
import { getUserSupabase } from "@/utils/functions";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import LocationPreview from "./ListingMap";

const RANDOM_MESSAGES = [
  "Is this still available?",
  "What time could this be picked up?",
  "Hey, I'm interested, when could I pick it up?",
  "I can come pick this up today, does that work?",
  "I'll take it, where should I bring the cash?",
];

function getRandomFirstMessage() {
  return RANDOM_MESSAGES[Math.floor(Math.random() * RANDOM_MESSAGES.length)];
}

function timeAgo(date?: string | Date) {
  if (!date) return "No time available";
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)} minutes ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

const ListingModal = ({ listing }: { listing: any }) => {
  const router = useRouter();
  const { setSelectedListing } = useListings();
  const pathname = usePathname();
  const { user, setUser, setUserListings, userListings } = useUser();
  const { setSelectedConvo, setConvos, convos } = useConvos();
  const { setError, setSuccess } = useMessage();

  const [message, setMessage] = useState(getRandomFirstMessage());
  const [expandDescription, setExpand] = useState(false);
  const [localReviews, setLocalReviews] = useState<number | null>(null);
  const [creatingConvo, setCreatingConvo] = useState(false);

  useEffect(() => {
    if (!listing?.title) return;
    setMessage(getRandomFirstMessage());

    const mount = async () => {
      const { user: u, app_user } = await getUserSupabase();
      if (!u) return;
      setUser({ ...u, app_user });
      const res = await fetch(`${BASE_URL}/api/reviews/count`, {
        headers: { Authorization: u.id },
      });

      const data = await res.json();
      setLocalReviews(data.count ?? 0);
      setSelectedListing(listing);
    };
    mount();
  }, [listing, setSelectedListing, setUser]);

  // ── Actions ──
  const createConversation = async () => {

    setCreatingConvo(true);
    try {
      const data = await getUserSupabase();
      if (!data.user) {
        setError(true);
        router.replace("/sign-in");
        return;
      }
      const existing = listing.conversations.find((con: any) => {
        return con?.listingId === listing?.lid;
      });
  
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
        conversations: [...listing.conversations,newCon?.convo],
        buyerId: data.app_user.uid,
      });

      setConvos([...convos, newCon?.convo]);

      router.push("/convos");
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setCreatingConvo(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!user?.id) return;
    const res = await deleteListingAction(listing.lid, user.id);
    if (res?.success) {
      const filtered = userListings.filter((ld) => ld.lid !== listing.lid);
      setUserListings(filtered);
      setSelectedListing({});

      router.replace("/listings");
    }
  };

  const handleToggle = async (field: "archived" | "sold") => {
    if (!user) return;
    const updated = { ...listing, [field]: !listing[field] };
    const res = await fetch(`${BASE_URL}/api/listings`, {
      method: "PUT",
      headers: { Authorization: user.id, "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    }).then((r) => r.json());

    if (!res.success) {
      setError(true);
      return;
    }
    setSuccess(true);
    const newListings = userListings.map((lis) => {
      if (lis?.lid === updated?.lid) {
        return updated;
      }
      return lis;
    });
    setUserListings(newListings);
    setSelectedListing({});
  };

  const isSeller = listing?.sellerId === user?.id;
  const existingConvo = (listing?.conversations ?? []).find(
    (c: any) => c.buyerId === user?.id,
  );

  if (!listing?.title) return null;
  const safeImages = (listing.imageUrls ?? []).filter(
    (url: any) => typeof url === "string" && url.startsWith("http"),
  );

  const closeModal = pathname.includes("new")
    ? false
    : pathname.includes("convo")
      ? false
      : true;
  return (
    <Modal
      visible={closeModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setSelectedListing({})}
    >
      <View className="flex-1 bg-pill">
        {/* ── Nav ── */}
        <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-secondary/15 bg-pill">
          <Pressable
            onPress={() => setSelectedListing({})}
            className="w-9 h-9 rounded-[10px] bg-background border border-secondary/20 items-center justify-center"
          >
            <FontAwesome name="times" size={14} color={colors.text} />
          </Pressable>

          <Text className="text-[13px] font-bold text-text">
            Listing details
          </Text>

          <View className="w-9 h-9 rounded-[10px] bg-background border border-secondary/20 items-center justify-center">
            <FontAwesome name="ellipsis-h" size={14} color={colors.secondary} />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-10"
        >
          {/* ── Image carousel ── */}
          <View className="w-full h-64 bg-secondary/10 overflow-hidden">
            {safeImages?.length > 0 ? (
              <Carousel images={safeImages} />
            ) : (
              <View className="flex-1 items-center justify-center">
                <FontAwesome name="image" size={40} color={colors.secondary} />
              </View>
            )}
            {listing.condition && (
              <View className="absolute top-3 right-3 bg-text px-2.5 py-1 rounded-lg z-10">
                <Text className="text-primary text-[11px] font-bold">
                  {listing.condition}
                </Text>
              </View>
            )}
          </View>

          <View className="flex-col gap-4 p-4">
            {/* ── Title + price ── */}
            <Animated.View entering={FadeInDown.duration(300).delay(0)}>
              <Text className="text-[20px] font-extrabold text-text leading-tight mb-1">
                {listing.title}
              </Text>
              <View className="flex-row items-baseline gap-2.5">
                <Text className="text-[26px] font-extrabold text-text">
                  {listing.price !== "0" ? `$${listing.price}` : "FREE"}
                </Text>
                <Text className="text-[12px] text-secondary">
                  {timeAgo(listing.createdAt)}
                </Text>
              </View>
            </Animated.View>

            {/* ── Buyer: message / go to convo ── */}
            {!isSeller && (
              <Animated.View
                entering={FadeInDown.duration(300).delay(60)}
                className="bg-background border border-secondary/20 rounded-2xl p-5"
              >
                {!existingConvo ? (
                  <>
                    <Text className="text-[13px] font-bold text-text mb-2.5">
                      Send a message
                    </Text>
                    <View className="flex-row items-center gap-2 bg-pill border border-secondary/30 rounded-2xl pl-3.5 pr-1.5 py-1.5">
                      <TextInput
                        className="flex-1 text-[13px] text-text"
                        value={message}
                        onChangeText={setMessage}
                        placeholder="Message the seller…"
                        placeholderTextColor={colors.secondary}
                      />
                      <Pressable
                        onPress={createConversation}
                        disabled={creatingConvo}
                        className="bg-primary px-3.5 py-2 rounded-xl"
                      >
                        {creatingConvo ? (
                          <ActivityIndicator size="small" color={colors.text} />
                        ) : (
                          <Text className="text-text text-[12px] font-bold">
                            Send →
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </>
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
                        className="w-full bg-text py-3 rounded-2xl items-center"
                      >
                        <Text className="text-primary font-bold text-[14px]">
                          Go to conversation →
                        </Text>
                      </Pressable>
                    ))
                )}
              </Animated.View>
            )}

            {/* ── Seller: manage listing ── */}
            {isSeller && (
              <Animated.View
                entering={FadeInDown.duration(300).delay(60)}
                className="bg-background border border-secondary/20  rounded-2xl p-3.5"
              >
                <Text className="text-[13px] font-bold text-text mb-2.5">
                  Manage listing
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-2"
                >
                  {[
                    {
                      label: "Edit",
                      activeLabel: null,
                      fn: () => {
                        // router.dismiss(2);
                        setTimeout(() => {
                          router.push("/(tabs)/new?type=edit");
                        }, 500);
                      },
                      key: null,
                    },
                    {
                      label: "Mark sold",
                      activeLabel: "Sold",
                      fn: () => handleToggle("sold"),
                      key: "sold",
                    },
                    {
                      label: "Archive",
                      activeLabel: "Archived",
                      fn: () => handleToggle("archived"),
                      key: "archived",
                    },
                  ].map(({ label, activeLabel, fn, key }) => {
                    const isActive = key ? listing[key] : false;
                    return (
                      <SpringChip
                        key={label}
                        label={isActive && activeLabel ? activeLabel : label}
                        active={!!isActive}
                        onPress={fn}
                      />
                    );
                  })}

                  {/* Delete */}
                  <Pressable
                    onPress={handleDeleteListing}
                    className="shrink-0 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200"
                  >
                    <Text className="text-red-600 text-[12px] font-semibold">
                      Delete
                    </Text>
                  </Pressable>
                </ScrollView>
              </Animated.View>
            )}

            {/* ── Description ── */}
            <Animated.View
              entering={FadeInDown.duration(300).delay(120)}
              className="bg-background border border-secondary/20 rounded-2xl p-4"
            >
              <Text className="text-[13px] font-bold text-text mb-2">
                Description
              </Text>
              <Text
                className="text-[14px] text-text leading-relaxed"
                numberOfLines={expandDescription ? undefined : 4}
              >
                {listing.description}
              </Text>
              <Pressable
                onPress={() => setExpand((p) => !p)}
                className="mt-1.5"
              >
                <Text className="text-[12px] text-primary font-semibold">
                  {expandDescription ? "Show less" : "Show more"}
                </Text>
              </Pressable>
            </Animated.View>

            {/* ── Seller info ── */}
            <Animated.View
              entering={FadeInDown.duration(300).delay(160)}
              className="bg-background border border-secondary/20 rounded-2xl p-4"
            >
              <Text className="text-[13px] font-bold text-text mb-3">
                The seller
              </Text>
              <View className="flex-row items-center gap-3">
                <View className="w-11 h-11 rounded-full bg-secondary items-center justify-center shrink-0">
                  <Text className="text-[15px] font-bold text-text">
                    {(listing?.seller?.name[0] ?? "?").toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text className="text-[14px] font-bold text-text">
                    {listing?.seller?.name ?? "Seller"}
                  </Text>
                  <View className="flex-row items-center gap-1 mt-0.5">
                    <StarRating
                      value={listing?.seller?.rating ?? 3}
                      setValue={() => {}}
                    />
                    <Text className="text-[11px] text-secondary">
                      (
                      {localReviews === null
                        ? "loading..."
                        : localReviews === 1
                          ? "1 review"
                          : `${localReviews} reviews`}
                      )
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* ── Location placeholder ── */}
            <Animated.View
              entering={FadeInDown.duration(300).delay(200)}
              className="bg-background border border-secondary/20 rounded-2xl p-4"
            >
              <Text className="text-[13px] font-bold text-text mb-3">
                Location
              </Text>
              <View className="h-40  w-full rounded-xl bg-secondary/10 items-center justify-center">
                {listing.latitude && listing.longitude ? (
                  <LocationPreview
                    lat={listing.latitude}
                    lon={listing.longitude}
                    title="UVIC"
                  />
                ) : (
                  <Text className="text-secondary text-[12px]">
                    No location provided
                  </Text>
                )}
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// ── SpringChip ───────────────────────────────────────────────────────────────
const SpringChip = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const AP = Animated.createAnimatedComponent(Pressable);

  return (
    <AP
      style={style}
      onPressIn={() => {
        scale.value = withSpring(0.92, { stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { stiffness: 400 });
      }}
      onPress={onPress}
      className={`shrink-0 px-3.5 py-1.5 rounded-full border ${
        active ? "bg-text border-text" : "bg-pill border-secondary/30"
      }`}
    >
      <Text
        className={`text-[12px] font-semibold ${active ? "text-primary" : "text-secondary"}`}
      >
        {label}
      </Text>
    </AP>
  );
};

export default ListingModal;
