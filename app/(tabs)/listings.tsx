import ListingCard from "@/components/Listings/ListingCard";

import { BASE_URL, categories } from "@/constants/constants";
import { colors, components } from "@/constants/theme";
import { useRefresh } from "@/hooks/useRefresh";
import { useListings, useMessage } from "@/store/zustand";
import { fetchListings, getUserSupabase } from "@/utils/functions";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import housing from "@/assets/images/housing.jpg";
import vintage from "@/assets/images/vintage.jpg";
import tech from "@/assets/images/tech.jpg";
import textbooks from "@/assets/images/textbooks.jpg";
import { Image } from "moti";
import CategoryChips from "@/components/Utils/CategoryChips";
import MarketQuad from "@/components/Utils/MarketQuad";

const SkeletonCard = () => (
  <View className="bg-pill rounded-2xl border border-secondary/20 overflow-hidden flex-1">
    <View className="h-48 bg-secondary/10" />
    <View className="p-3 gap-2">
      <View className="h-3 w-2/3 bg-secondary/20 rounded-full" />
      <View className="h-3 w-1/3 bg-secondary/10 rounded-full" />
      <View className="h-4 w-1/4 bg-secondary/30 rounded-full mt-1" />
    </View>
  </View>
);

export default function ListingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { search: searchQuery, cat } = useLocalSearchParams<{
    search?: string;
    cat?: string;
  }>();
  const contentRef = useRef<View>(null);
  const { listings, setListings, selectedListing, setSelectedListing } =
    useListings();
  const { refreshing, onRefresh } = useRefresh({
    func: async () => await fetchListings({ setter: setListings }),
  });
  const { setError, setMessage } = useMessage();

  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchQuery ?? "");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [activeCategory, setActiveCategory] = useState(cat ?? "All");
  const [view, setView] = useState<"grid" | "list">("list");

  const baseListings =
    searchQuery && searchResults !== null ? searchResults : listings;
  const displayListings =
    activeCategory === "All"
      ? baseListings
      : baseListings?.filter(
          (l) => l.category?.toLowerCase() === activeCategory.toLowerCase(),
        );

  useEffect(() => {
    const loadListings = async () => {
      if (!searchQuery && listings?.length > 0) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        if (searchQuery) {
          const user = await getUserSupabase();

          const response = await fetch(
            `${BASE_URL}/api/listings/search?q=${encodeURIComponent(searchQuery)}`,
            { headers: { Authorization: user ? user.user?.id! : "0" } },
          );
          if (!response.ok) throw new Error("Failed to fetch");
          const data = await response.json();

          if (data.success) setSearchResults(data.listings);
          else {
            setMessage("Couldn't find that?");
            setError(true);

          }
        } else {
          setSearchResults(null);
          if (listings.length === 0)
            await fetchListings({ setter: setListings });
        }
      } catch (err) {
        console.error(err);
        setError(true);
        setMessage("Something went wrong...")
      } finally {
        setLoading(false);
      }
    };
    loadListings();
  }, [searchQuery, listings.length, setError, setListings, setMessage]);

  const handleSearch = () => {
    const val = searchInput.trim();
    if (val) router.push(`/listings?search=${encodeURIComponent(val)}`);
    else router.push("/listings");
  };

  const clearFilters = () => {
    setActiveCategory("All");
    if (searchQuery) router.push("/listings");
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      style={{
        backgroundColor: colors.background,
      }}
      contentContainerStyle={{
        paddingBottom: components.tabBar.height + insets.bottom,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="flex-row flex-wrap w-full p-2">
        {[
          { name: "Housing", image: housing },
          { name: "Textbooks", image: textbooks },
          { name: "Tech", image: tech },
          { name: "Clothes", image: vintage },
        ].map((item, i) => (
          <Pressable
            onPress={() => {
              if (contentRef.current) {
              }
              setActiveCategory(item.name);
            }}
            key={i}
            className="w-1/2 aspect-square p-1"
          >
            <View className="relative flex-1 bg-accent justify-center items-center rounded-2xl">
              <Image
                source={item.image}
                className="h-full w-full rounded-2xl"
                resizeMode="cover"
              />
              <Text className="absolute bottom-0  text-white pb-2 uppercase  font-bold text-3xl">
                {item.name}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
      <View className="gap-2 w-full h-40 p-4 justify-center items-center">
        <Text className="text-4xl font-black text-center ">
          Buy Local. Sell Better. <MarketQuad className="text-primary" />
        </Text>
        <Pressable
          onPress={() => router.push("/new")}
          className="px-4 py-2 bg-primary rounded-xl"
        >
          <Text className="text-xl font-black text-pill">SELL NOW</Text>
        </Pressable>
      </View>

      {/* ── Search bar ── */}
      <Animated.View
        entering={FadeInDown.duration(300)}
        className="px-4 pt-4 pb-3"
      >
        <View className="bg-pill border border-secondary/50 rounded-2xl px-4 py-2.5 flex-row items-center gap-2.5">
          <Text className="text-text opacity-40 text-base">⌕</Text>
          <TextInput
            className="flex-1 text-[13px] text-text"
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={handleSearch}
            placeholder="Search listings…"
            placeholderTextColor={colors.secondary}
            returnKeyType="search"
          />
          {searchQuery ? (
            <Pressable
              onPress={() => {
                setSearchInput("");
                router.push("/listings");
              }}
            >
              <Text className="text-secondary text-sm">✕</Text>
            </Pressable>
          ) : null}
        </View>
      </Animated.View>

      {/* ── Category chips ── */}
      <CategoryChips {...{ activeCategory, setActiveCategory }} />

      {/* ── Header row ── */}
      <Animated.View
        entering={FadeInDown.duration(300).delay(120)}
        className="flex-row items-center justify-between px-4 pb-3"
      >
        <Text className="text-[13px] font-medium text-text">
          {searchQuery
            ? `Results for "${searchQuery}"${!loading && displayListings?.length > 0 ? ` · ${displayListings.length}` : ""}`
            : `Today's listings${!loading && displayListings?.length > 0 ? ` · ${displayListings.length}` : ""}`}
        </Text>

        {/* Grid / list toggle */}
      </Animated.View>

      {/* ── Content ── */}
      <View ref={contentRef} className="px-4 pb-6">
        {loading ? (
          <View
            className={view === "grid" ? "flex-row flex-wrap gap-3" : "gap-3"}
          >
            {[1, 2, 3, 4].map((n) => (
              <View key={n} className={view === "grid" ? "w-[48%]" : "w-full"}>
                <SkeletonCard />
              </View>
            ))}
          </View>
        ) : displayListings?.length > 0 ? (
          <View
            className={view === "grid" ? "flex-row flex-wrap gap-3" : "gap-3"}
          >
            {displayListings.map((listing, i) => (
              <Animated.View
                key={listing.lid}
                entering={FadeInDown.duration(300).delay(i * 50)}
                className={view === "grid" ? "w-[48%]" : "w-full"}
              >
                <ListingCard listing={listing} />
              </Animated.View>
            ))}
          </View>
        ) : (
          /* ── Empty state ── */
          <View className="items-center justify-center py-20 gap-4">
            <View className="w-14 h-14 bg-secondary/20 rounded-2xl items-center justify-center">
              <Text className="text-2xl">🏷️</Text>
            </View>
            <Text className="text-[14px] text-secondary text-center leading-relaxed">
              {searchQuery
                ? `No listings matched "${searchQuery}".`
                : activeCategory !== "All"
                  ? `No listings in ${activeCategory} yet.`
                  : "No listings available yet."}
            </Text>
            {(searchQuery || activeCategory !== "All") && (
              <Pressable onPress={clearFilters}>
                <Text className="text-[13px] text-secondary/50 underline font-medium">
                  Clear filters
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
      {/* {selectedListing && <ListingModal listing={selectedListing} />} */}
    </ScrollView>
  );
}
