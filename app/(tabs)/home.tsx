import { ErrorBoundary } from "@/components/ErrorBoundary";
import ListingCard from "@/components/Listings/ListingCard";
import CategoryChips from "@/components/Utils/CategoryChips";
import { categories } from "@/constants/constants";
import { components } from "@/constants/theme";
import { useRefresh } from "@/hooks/useRefresh";
import { useConvos, useListings, useUser } from "@/store/zustand";
import { fetchConvos, fetchListings, getUserSupabase } from "@/utils/functions";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Sections & Stories ───────────────────────────────────────────────────────
const SectionTitle = ({
  label,
  onSeeAll,
}: {
  label: string;
  onSeeAll?: () => void;
}) => (
  <View className="flex-row items-center justify-between px-4 pt-5 pb-2.5">
    <Text className="text-text text-3xl font-extrabold tracking-tight uppercase">
      {label}
    </Text>
    {onSeeAll && (
      <Pressable onPress={onSeeAll}>
        <Text className="text-accent text-lg font-semibold">See all</Text>
      </Pressable>
    )}
  </View>
);

// ── HomeScreen ─────────────────────────────────────────────────────────────
function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { listings, setListings } = useListings();
  const { setConvos } = useConvos();

  const { refreshing, onRefresh } = useRefresh({
    func: async () => {
      await fetchListings({ setter: setListings });
      await fetchConvos({ setter: setConvos });
    },
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const { setUser } = useUser();
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const mount = async () => {
      const { user, app_user } = await getUserSupabase();
      if (!user) router.navigate("/(auth)/sign-in");
      setUser({ ...user, app_user });
    };
    mount();
  }, [router, setUser]);

  useEffect(() => {
    const mount = async () => {
      await fetchListings({ setter: setListings });
    };
    mount();
  }, [setListings]);
  const active = useMemo(
    () => (listings ?? []).filter((l) => !l.sold && !l.archived),
    [listings],
  );

  const filtered = useMemo(
    () =>
      activeCategory === "All"
        ? active
        : active.filter((l) => l.category === activeCategory),
    [active, activeCategory],
  );

  const hot = useMemo(
    () =>
      [...(active ?? [])]
        .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
        .slice(0, 8),
    [active],
  );

  const forYou = useMemo(
    () => [...(active ?? [])].sort(() => 0.5 - Math.random()).slice(0, 10),
    [active],
  );
  const isFiltered = activeCategory !== "All";

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + components.tabBar.height,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3db88a"
          />
        }
      >
        {/* ── Search ── */}
        <View
          className={`mx-4 mb-4 mt-4 flex-row items-center bg-pill rounded-xl border px-3 py-3 gap-2 ${focused ? "border-primary" : "border-background"}`}
        >
          <Ionicons name="search-outline" size={16} color="#1a2e2866" />
          <TextInput
            onSubmitEditing={() => {
              router.push(`/listings?search=${searchQuery}`);
            }}
            className="flex-1 text-sm text-text font-medium"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search textbooks, gear..."
            placeholderTextColor="#1a2e2844"
          />
        </View>

        {/* ── Categories & Toggle ── */}
        <CategoryChips {...{ activeCategory, setActiveCategory }} />

        {/* ── Feed ── */}

        {isFiltered ? (
          <View className="mt-2">
            {filtered.length === 0 ? (
              <View className="p-12 items-center gap-3">
                <Text className="text-3xl">🏷️</Text>
                <Text className="text-text/40 text-sm italic">
                  Nothing found in {activeCategory}
                </Text>
              </View>
            ) : (
              filtered?.map((l) => <ListingCard key={l.lid} listing={l} />)
            )}
          </View>
        ) : (
          <>
            <SectionTitle
              label="Trending on Campus"
              onSeeAll={() => router.push("/listings?sort=views")}
            />
            {hot.length > 0 ? (
              hot.map((l) => <ListingCard key={l.lid} listing={l} />)
            ) : (
              <View className="mx-4 my-2 py-10 items-center gap-2 bg-pill rounded-2xl border border-secondary/10">
                <Text className="text-2xl"></Text>
                <Text className="text-text font-semibold text-sm">
                  Nothing trending yet
                </Text>
                <Text className="text-secondary text-xs text-center px-8">
                  Be the first to post, your listing could be here.
                </Text>
              </View>
            )}

            <SectionTitle
              label="Fresh Listings"
              onSeeAll={() => router.push("/listings")}
            />
            {forYou.length > 0 ? (
              forYou.map((l) => <ListingCard key={l.lid} listing={l} />)
            ) : (
              <View className="mx-4 my-2 py-10 items-center gap-2 bg-pill rounded-2xl border border-secondary/10">
                <Text className="text-text font-semibold text-sm">
                  No listings yet
                </Text>
                <Text className="text-secondary text-xs text-center px-8">
                  The marketplace is empty, list something and get it started.
                </Text>
                <Pressable
                  onPress={() => router.push("/new")}
                  className="mt-2 bg-primary px-5 py-2 rounded-xl"
                >
                  <Text className="text-pill font-bold text-sm">
                    Post a listing
                  </Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
export default function Home() {
  return (
    <ErrorBoundary>
      <HomeScreen />
    </ErrorBoundary>
  );
}
