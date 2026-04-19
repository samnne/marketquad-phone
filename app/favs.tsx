import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import React, { useState, useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { db } from "@/db/db";
import ListingCard from "@/components/Listings/ListingCard";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@/store/zustand";

const FavsScreen = () => {
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUser();

  // Re-load favorites whenever this screen comes into focus
  const loadFavs = useCallback(() => {
    const data = JSON.parse(db.getItem("SAVED_LISTINGS") ?? "[]");
    
    const savedItems = data.filter((val) => val.sellerId !== user?.id);
    setSavedItems(savedItems);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavs();
    }, [loadFavs]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadFavs();
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* ── Header ── */}
      <View className="px-4 pb-4 border-b border-text/5">
        <Text className="text-2xl font-black text-text tracking-tighter">
          Saved Items
        </Text>
        <Text className="text-text/50 text-sm font-medium">
          {savedItems.length} {savedItems.length === 1 ? "listing" : "listings"}{" "}
          you're watching
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3db88a"
          />
        }
      >
        {savedItems.length > 0 ? (
          <View className="pt-2">
            {savedItems.map((item) => (
              <ListingCard key={item.lid} listing={item} />
            ))}
          </View>
        ) : (
          /* ── Empty State ── */
          <View className="flex-1 items-center justify-center px-10 py-20">
            <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-6">
              <Ionicons name="bookmark-outline" size={40} color="#3db88a" />
            </View>
            <Text className="text-xl font-bold text-text text-center">
              No favorites yet
            </Text>
            <Text className="text-text/50 text-center mt-2 leading-5">
              Tap the bookmark icon on any listing to save it for later.
            </Text>

            <Pressable
              onPress={() => router.push("/")}
              className="bg-primary px-8 py-4 rounded-2xl mt-8 shadow-sm"
            >
              <Text className="text-pill font-bold text-base">
                Start Exploring
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default FavsScreen;
