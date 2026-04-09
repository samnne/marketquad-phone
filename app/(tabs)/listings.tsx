import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  FlatList,
  RefreshControl,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useListings, useMessage } from "@/store/zustand";
import { fetchListings, getUserSupabase } from "@/utils/functions";
import { colors } from "@/constants/theme";
import ListingCard from "@/components/ListingCard";
import { useRefresh } from "@/hooks/useRefresh";
import ListingModal from "@/components/ListingModal";
import { TabScreenWrapper } from "@/components/TabScreenWrapper";
import { BASE_URL } from "@/constants/constants";

const CATEGORIES = [
  "All",
  "Textbooks",
  "Electronics",
  "Clothes",
  "Housing",
  "Notes",
  "Sports",
  "Other",
];

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
  const { listings, setListings, selectedListing, setSelectedListing } =
    useListings();
  const { refreshing, onRefresh } = useRefresh({
    func: async () => await fetchListings({ setter: setListings }),
  });
  const { setError } = useMessage();

  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchQuery ?? "");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [activeCategory, setActiveCategory] = useState(cat ?? "All");
  const [view, setView] = useState<"grid" | "list">("grid");

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
          else setError(true);
        } else {
          setSearchResults(null);
          if (listings.length === 0)
            await fetchListings({ setter: setListings });
        }
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    loadListings();
  }, [searchQuery]);

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
    <TabScreenWrapper>
      <ScrollView
        className="flex-1 bg-background"
        style={{ paddingTop: insets.top }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
        <Animated.ScrollView
          entering={FadeInDown.duration(300).delay(60)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-4 pb-3"
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setActiveCategory(cat)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full border ${
                activeCategory === cat
                  ? "bg-text border-text"
                  : "bg-pill border-secondary/50"
              }`}
            >
              <Text
                className={`text-[13px] font-medium ${
                  activeCategory === cat ? "text-primary" : "text-secondary"
                }`}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </Animated.ScrollView>

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
          <View className="flex-row gap-1 bg-pill border border-secondary/50 rounded-xl p-1">
            <Pressable
              onPress={() => setView("grid")}
              className={`w-7 h-7 rounded-lg items-center justify-center ${view === "grid" ? "bg-text" : ""}`}
            >
              <Text
                className={`text-[10px] ${view === "grid" ? "text-primary" : "text-secondary"}`}
              >
                ⊞
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setView("list")}
              className={`w-7 h-7 rounded-lg items-center justify-center ${view === "list" ? "bg-text" : ""}`}
            >
              <Text
                className={`text-[10px] ${view === "list" ? "text-primary" : "text-secondary"}`}
              >
                ☰
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* ── Content ── */}
        <View className="px-4 pb-6">
          {loading ? (
            <View
              className={view === "grid" ? "flex-row flex-wrap gap-3" : "gap-3"}
            >
              {[1, 2, 3, 4].map((n) => (
                <View
                  key={n}
                  className={view === "grid" ? "w-[48%]" : "w-full"}
                >
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
                  <ListingCard
                    listing={listing}
                    setSelectedListing={setSelectedListing}
                  />
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
        {selectedListing && <ListingModal listing={selectedListing} />}
        <View className="h-20" />
      </ScrollView>
    </TabScreenWrapper>
  );
}
