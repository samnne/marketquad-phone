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
export default function HomeScreen() {
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
    mount()
  }, [setListings]);
  const active = useMemo(
    () => listings.filter((l) => !l.sold && !l.archived),
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
      [...active].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 8),
    [active],
  );
  const forYou = useMemo(
    () => [...active].sort(() => 0.5 - Math.random()).slice(0, 10),
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
              <View className="p-12 items-center">
                <Text className="text-text/40 text-sm italic">
                  Nothing found in {activeCategory}
                </Text>
              </View>
            ) : (
              forYou.map((l) => <ListingCard key={l.lid} listing={l} />)
            )}
          </View>
        ) : (
          <>
            <SectionTitle
              label="Trending on Campus"
              onSeeAll={() => router.push("/listings?sort=views")}
            />

            {hot.map((l) => (
              <ListingCard key={l.lid} listing={l} />
            ))}

            <SectionTitle
              label="Fresh Listings"
              onSeeAll={() => router.push("/listings")}
            />
            {forYou.map((l) => (
              <ListingCard key={l.lid} listing={l} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
