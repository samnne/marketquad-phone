import ListingCard from "@/components/Listings/ListingCard";
import { colors } from "@/constants/theme";
import { useListings, useUser } from "@/store/zustand";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInLeft } from "react-native-reanimated";
import ListingModal from "./Listings/ListingModal";

type Filter = "all" | "sold" | "archived";

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Sold", value: "sold" },
  { label: "Archived", value: "archived" },
];

const UserListings = ({
  setModals,
  showModal,
}: {
  setModals: () => void;
  showModal: boolean;
}) => {
  const router = useRouter();

  const { selectedListing, setSelectedListing } = useListings();
  const { userListings } = useUser();
  const [filter, setFilter] = useState<Filter>("all");
  const pathname = usePathname();
  const displayedListings = userListings.filter((listing) => {
    if (filter === "sold") return listing.sold === true;
    if (filter === "archived") return listing.archived === true;
    return true;
  });

  useEffect(() => {
    if (pathname.includes("new") || pathname.split('/').length > 2) {
      setModals();
      return;
    }
  }, [pathname]);

  return (
    <Modal
      visible={showModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={setModals}
    >
      <View className="flex-1 bg-background">
        {/* ── Sticky header ── */}
        <Animated.View
          entering={FadeInLeft.duration(250)}
          className="bg-pill border-b border-secondary/20 px-4 py-3.5 flex-row items-center justify-between"
        >
          <Text className="text-[17px] font-extrabold text-text">
            Your listings{"  "}
            {userListings.length > 0 && (
              <Text className="text-[13px] font-normal text-secondary">
                · {displayedListings.length}
              </Text>
            )}
          </Text>
          <Pressable
            onPress={setModals}
            className="bg-background border border-secondary/30 rounded-xl px-3.5 py-1.5 flex-row items-center gap-1.5"
          >
            <Text className="text-[13px] font-semibold text-secondary">
              Close
            </Text>
            <FontAwesome name="times" size={12} color={colors.secondary} />
          </Pressable>
        </Animated.View>

        {/* ── Filter chips ── */}
        <View className="bg-pill border-b border-secondary/20 px-4 py-3 flex-row gap-2">
          {FILTERS.map(({ label, value }) => {
            const count =
              value === "all"
                ? userListings.length
                : userListings.filter((l) => l[value] === true).length;
            const isActive = filter === value;

            return (
              <Pressable
                key={value}
                onPress={() => setFilter(value)}
                className={`flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-full border ${
                  isActive
                    ? "bg-text border-text"
                    : "bg-background border-secondary/30"
                }`}
              >
                <Text
                  className={`text-[13px] font-medium ${
                    isActive ? "text-primary" : "text-secondary"
                  }`}
                >
                  {label}
                </Text>
                {count > 0 && (
                  <View
                    className={`px-1.5 py-0.5 rounded-full ${
                      isActive ? "bg-primary/20" : "bg-secondary/20"
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${
                        isActive ? "text-primary" : "text-secondary"
                      }`}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ── Content ── */}
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 py-4 gap-3 pb-10"
          showsVerticalScrollIndicator={false}
        >
          {displayedListings.length > 0 ? (
            displayedListings.map((listing, i) => (
              <Animated.View
                key={listing.lid}
                entering={FadeInDown.duration(300).delay(Math.min(i * 40, 300))}
              >
                <ListingCard
                  listing={listing}
        
                />
              </Animated.View>
            ))
          ) : userListings.length === 0 ? (
            /* ── No listings at all ── */
            <Animated.View
              entering={FadeInDown.duration(350)}
              className="gap-4 pt-2"
            >
              <View>
                <Text className="text-[26px] font-extrabold text-text leading-tight mb-1">
                  Make a listing!
                </Text>
                <Text className="text-[14px] text-secondary">
                  Created listings will appear here.
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  setModals();
                  router.push("/new");
                }}
                className="bg-pill border border-secondary/20 rounded-[20px] overflow-hidden"
              >
                {/* Banner */}
                <View className="w-full h-40 bg-secondary/10 items-center justify-center">
                  <View className="w-12 h-12 rounded-xl bg-secondary/20 items-center justify-center">
                    <FontAwesome name="plus" size={24} color={colors.primary} />
                  </View>
                </View>

                {/* Tap to list badge */}
                <View className="absolute top-3 right-3 bg-primary px-3 py-1.5 rounded-xl">
                  <Text className="text-text text-[11px] font-bold">
                    Tap to list
                  </Text>
                </View>

                <View className="p-4">
                  <Text className="text-[15px] font-bold text-text mb-0.5">
                    Tap here to create a listing
                  </Text>
                  <Text className="text-[12px] text-secondary">
                    Takes less than 30 seconds
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          ) : (
            /* ── Filter returned nothing ── */
            <Animated.View
              entering={FadeInDown.duration(350)}
              className="items-center justify-center py-16 gap-3"
            >
              <View className="w-12 h-12 bg-secondary/20 rounded-2xl items-center justify-center">
                <FontAwesome name="filter" size={18} color={colors.primary} />
              </View>
              <Text className="text-[14px] text-secondary text-center">
                No <Text className="text-text font-semibold">{filter}</Text>{" "}
                listings yet.
              </Text>
              <Pressable onPress={() => setFilter("all")}>
                <Text className="text-[13px] text-accent underline font-medium">
                  Show all listings
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </View>
      {/* {selectedListing && <ListingModal listing={selectedListing} />} */}
    </Modal>
  );
};

export default UserListings;
