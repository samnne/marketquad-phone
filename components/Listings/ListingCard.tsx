import { View, Text, Image, Pressable, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { db } from "@/db/db";
import { useEffect, useState } from "react";
import { colors } from "@/constants/theme";
import { useLike } from "@/hooks/useLike";

const { width: W } = Dimensions.get("window");
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ListingCard = ({ listing }: { listing: any }) => {
  const scale = useSharedValue(1);
  const router = useRouter();
  const { count, liked, loading, toggle } = useLike(
    listing?.lid,
    listing.likes?.length > 0,
    listing._count?.likes,
  );

  const [isFav, setIsFav] = useState(false);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  useEffect(() => {
    const prev = JSON.parse(db.getItem("SAVED_LISTINGS") ?? "[]");
    const isFavourite = (prev as []).find((li) => li.lid === listing.lid);
    setIsFav(isFavourite ? true : false);
  }, [listing.lid]);

  // For an IG look, we usually want the image to be a square or 4:5 ratio
  const IMAGE_HEIGHT = W * 1.0;

  return (
    <AnimatedPressable
      style={animatedStyle}
      onPressIn={() => (scale.value = withSpring(0.98, { stiffness: 400 }))}
      onPressOut={() => (scale.value = withSpring(1, { stiffness: 400 }))}
      className="w-full mb-4 bg-pill" // White background for the "post"
    >
      {/* ── 1. Header (Seller Info) ── */}
      <View className="flex-row items-center justify-between p-3">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-accent items-center justify-center border border-background">
            <Text className="text-pill font-bold">
              {listing?.seller?.name?.[0].toUpperCase()}
            </Text>
          </View>
          <View>
            <Text className="text-[14px] font-bold text-text">
              {listing?.seller?.name}
            </Text>
            <Text className="text-[11px] text-text/50">
              {listing?.seller?.email.split("@")[0]}
            </Text>
          </View>
        </View>
      </View>

      {/* ── 2. Media (Image) ── */}
      <Pressable
        onPress={() => router.push(`/listings/${listing?.lid}`)}
        style={{ height: IMAGE_HEIGHT }}
        className="bg-background relative"
      >
        {listing.imageUrls?.[0] ? (
          <Image
            source={{ uri: listing.imageUrls[0] }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="image-outline" size={48} color="#1a2e2811" />
          </View>
        )}

        {/* Sold / Archived Badge (Overlaid on image only) */}
        {(listing.sold || listing.archived) && (
          <View
            className={`absolute top-3 right-3 px-3 py-1 rounded-full ${listing.sold ? "bg-accent" : "bg-text"}`}
          >
            <Text className="text-pill text-[10px] font-black uppercase">
              {listing.sold ? "SOLD" : "ARCHIVED"}
            </Text>
          </View>
        )}
      </Pressable>

      {/* ── 3. Action Row (IG Icons) ── */}
      <View className="flex-row items-center justify-between px-3 pt-3">
        <Pressable
          onPress={() => {
            toggle();
          }}
          className="flex-row gap-4"
        >
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={24}
            color={liked ? "red" : colors.text}
          />
          {!loading && <Text className="self-center">{count}</Text>}
        </Pressable>

        <Pressable
          onPress={() => {
            const prev = JSON.parse(db.getItem("SAVED_LISTINGS") ?? "[]");

            const newFavs = prev.find((li) => listing.lid === li.lid);
            if (!newFavs) {
              setIsFav(true);
              db.setItem("SAVED_LISTINGS", JSON.stringify([...prev, listing]));
              return;
            }

            setIsFav(false);
            db.setItem(
              "SAVED_LISTINGS",
              JSON.stringify([...prev.filter((li) => li.lid !== listing.lid)]),
            );
          }}
        >
          <Ionicons
            name={isFav ? "bookmark" : "bookmark-outline"}
            size={22}
            color="#1a2e28"
          />
        </Pressable>
      </View>

      {/* ── 4. Body Content (Caption Style) ── */}
      <View className="px-3 py-2 gap-1">
        <Text className="text-primary text-lg font-black">
          {listing.price != "0" ? `$${listing.price}` : "FREE"}
        </Text>

        <View className="flex-row flex-wrap">
          <Text className="text-text font-bold mr-1">
            {listing?.seller?.name}
          </Text>
          <Text className="text-text font-bold mr-1">· {listing.title}</Text>
          <Text className="text-text/80  text-sm w-full h-10 truncate leading-5">
            {listing.description}
          </Text>
        </View>

        <Text className="text-[11px] text-text/40 font-bold uppercase mt-1">
          {listing.condition}
        </Text>
      </View>
    </AnimatedPressable>
  );
};

export default ListingCard;
