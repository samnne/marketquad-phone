import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useState, useEffect } from "react";
import { categories } from "@/constants/constants";
import { fetchConvos, fetchListings, getUserSupabase } from "@/utils/functions";
import { useListings, useConvos, useMessage } from "@/store/zustand";
import SectionHeader from "@/components/SectionHeader";
import DataCard from "@/components/DataCard";
import { useRefresh } from "@/hooks/useRefresh";
import { TabScreenWrapper } from "@/components/TabScreenWrapper";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { listings, setListings } = useListings();
  const { convos, setConvos } = useConvos();
  const { setError } = useMessage();
  const { refreshing, onRefresh } = useRefresh({
    func: async () => {
      await fetchListings({ setter: setListings });
      await fetchConvos({ setter: setConvos });
    },
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    const mount = async () => {
      const { user } = await getUserSupabase();
      if (!user) {
        router.navigate("/(auth)/sign-in");
        return;
      }
    };
    mount();
  }, []);
  useEffect(() => {
    const loadData = async () => {
      if (listings.length && convos?.length) return;
      try {
        setLoading(true);
        await fetchListings({ setter: setListings });
        await fetchConvos({ setter: setConvos });
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSearchByCat = (cat: string) =>
    router.push(`/listings?cat=${cat}`);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setError(true);
      return;
    }
    router.push(`/listings?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <TabScreenWrapper>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="px-5 pt-4 pb-6 gap-6"
        style={{ paddingTop: insets.top }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ── Search bar ── */}
        <Animated.View
          entering={FadeInDown.duration(350).delay(0)}
          className="bg-pill rounded-2xl border border-secondary/30 px-4 py-3 flex-row items-center gap-2.5"
        >
          <Text className="text-lg text-text opacity-35">⌕</Text>

          <TextInput
            className="flex-1 text-sm text-text p-1"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholder="Search textbooks, gear, notes…"
            placeholderTextColor="#8DB8A8"
            returnKeyType="search"
          />

          <Pressable
            onPress={handleSearch}
            className="w-8 h-8 rounded-[9px] bg-primary items-center justify-center"
          >
            <Text className="text-pill font-bold text-base">≡</Text>
          </Pressable>
        </Animated.View>

        {/* ── Category chips ── */}
        <Animated.ScrollView
          entering={FadeInDown.duration(350).delay(70)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 py-1"
        >
          {categories.map((cat, i) => (
            <Pressable
              key={cat}
              onPress={() => handleSearchByCat(cat)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full border ${
                i === 0 ? "bg-text border-text" : "bg-pill border-secondary/50"
              }`}
            >
              <Text
                className={`text-[13px] font-medium ${
                  i === 0 ? "text-primary" : "text-secondary"
                }`}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </Animated.ScrollView>

        {/* ── Listings ── */}
        <Animated.View
          entering={FadeInDown.duration(350).delay(140)}
          className="gap-2"
        >
          <SectionHeader type="listings" title="Today's Listings" />
          {loading ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-3 py-2"
            >
              {[1, 2, 3].map((n) => (
                <View
                  key={n}
                  className="w-50 h-45 rounded-xl bg-pill border border-secondary/20 opacity-60"
                />
              ))}
            </ScrollView>
          ) : (
            <DataCard dataList={listings} href="listings" />
          )}
        </Animated.View>

        {/* ── Messages ── */}
        <Animated.View
          entering={FadeInDown.duration(350).delay(210)}
          className="gap-2"
        >
          <SectionHeader type="messages" title="Messages" />
          {loading ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-3 py-2"
            >
              {[1, 2].map((n) => (
                <View
                  key={n}
                  className="w-[200px] h-20 rounded-xl bg-pill border border-secondary/20 opacity-60"
                />
              ))}
            </ScrollView>
          ) : (
            <DataCard dataList={convos} href="convos" />
          )}
        </Animated.View>

        {/* ── Sell banner ── */}
        <Animated.View
          entering={FadeInUp.duration(350).delay(280)}
          className="bg-text rounded-[18px] p-5 flex-row items-center justify-between overflow-hidden relative"
        >
          {/* Decorative blobs */}
          <View className="absolute -top-5 -right-5 w-24 h-24 rounded-full bg-primary opacity-10" />
          <View className="absolute -bottom-8 right-8 w-20 h-20 rounded-full bg-secondary opacity-15" />

          <View className="gap-1 z-10">
            <Text className="text-[11px] text-primary font-medium uppercase tracking-widest">
              Got stuff to offload?
            </Text>
            <Text className="text-[17px] font-extrabold text-pill leading-tight">
              {"List an item\nin 30 seconds"}
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/(tabs)/new")}
            className="z-10 bg-primary rounded-xl px-4 py-2.5 "
          >
            <Text className="text-text text-[13px] font-bold">+ Sell</Text>
          </Pressable>
        </Animated.View>

        {/* Bottom clearance for floating tab bar */}
        <View className="h-20" />
      </ScrollView>
    </TabScreenWrapper>
  );
}
