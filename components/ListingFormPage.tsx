import { uploadImages } from "@/cloudinary/cloudinary";
import {
  BASE_URL,
  categories,
  condition,
  UVIC_LNG_LAT,
} from "@/constants/constants";
import { editListingAction, newListingAction } from "@/lib/listing.lib";
import { useListings, useMessage, usePrefs, useUser } from "@/store/zustand";
import { getUserSupabase } from "@/utils/functions";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
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
import * as z from "zod";

import { colors, components } from "@/constants/theme";

import { styled } from "nativewind";
import {
  SafeAreaView as RNSAV,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import LocationInput from "./Inputs/LocationInput";
const SafeAreaView = styled(RNSAV);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ListingFormSchema = z.object({
  title: z.string().min(4, "Title Too Short"),
  price: z.number().min(0).max(1000000),
  description: z.string().min(0),
  category: z.string().min(3, "Please Choose a Category"),
  condition: z.string().min(3, "Please Choose a Condition"),
});

type ImageEntry = { uri: string; isRemote: boolean };

const ListingFormPage = ({ type }: { type: "new" | "edit" }) => {
  const router = useRouter();
  const { user, setUser, userListings, setUserListings } = useUser();
  const { selectedListing, setSelectedListing } = useListings();
  const { setError, setSuccess } = useMessage();
  const insets = useSafeAreaInsets();
  const { prefs } = usePrefs();
  const pathname = usePathname();
  const [latLong, setLatLong] = useState<[number, number]>([
    prefs.defaultLat ?? UVIC_LNG_LAT[1],
    prefs.defaultLng ?? UVIC_LNG_LAT[0],
  ]);

  const bottomClearance = components.tabBar.height + insets.bottom;
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    price: "0",
    description: "",
    condition: prefs.defaultCondition ?? "",
    category: prefs.defaultCategory ?? "",
    defaultLocation: "",
  });

  // ── Mount ──
  useEffect(() => {
    const mount = async () => {
      const { user: u, app_user } = await getUserSupabase();
      if (!u) {
        setError(true);
        router.replace("/sign-in");
        return;
      }
      setUser({ ...u, app_user });
    };
    mount();
    setFormData((prev) => {
      return {
        ...prev,
        condition: prefs.defaultCondition ?? "",
        category: prefs.defaultCategory ?? "",
      };
    });
    if (type === "edit" && selectedListing) {
      const {
        title,
        price,
        description,
        condition: cond,
        imageUrls,
        category,
      } = selectedListing;
      setFormData({
        title,
        price: String(price),
        description,
        condition: cond,
        category,
        defaultLocation: formData.defaultLocation,
      });
      if (imageUrls) {
        setImages(imageUrls.map((uri: string) => ({ uri, isRemote: true })));
      }
    }
  }, [pathname]);

  // ── Validate on change ──
  useEffect(() => {
    const result = ListingFormSchema.safeParse({
      ...formData,
      price: Number(formData.price),
    });
    setDisabled(!result.success);
  }, [formData]);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      quality: 0.8,
      base64: false, // ← don't need base64, URI upload is more efficient
    });

    if (!result.canceled) {
      const newEntries = result.assets.map((a) => {
        console.log("picked URI:", a.uri);
        return { uri: a.uri, isRemote: false };
      });
      setImages((prev) => [...prev, ...newEntries].slice(0, 10));
    }
  };
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Submit ──
  const handleSubmit = async () => {
    const parsed = ListingFormSchema.safeParse({
      ...formData,
      price: Number(formData.price),
    });
    if (!parsed.success || !user?.id) {
      setError(true);
      return;
    }

    setIsLoading(true);

    try {
      const { title, price, description, condition: cond } = parsed.data;

      const localImages = images.filter((img) => !img.uri.startsWith("http"));
      const remoteUrls = images
        .filter((img) => img.uri.startsWith("http"))
        .map((img) => img.uri);

      setUploading(true);
      const uploadedUrls = await uploadImages(
        localImages.map((i) => i.uri),
        user.id,
      );
      await Promise.allSettled(
        localImages.map(({ uri }) =>
          FileSystem.deleteAsync(uri, { idempotent: true }),
        ),
      );
      setUploading(false);

      const allImageUrls = [...remoteUrls, ...uploadedUrls];

      if (type === "new") {
        const res = await newListingAction(
          {
            title,
            price,
            description,
            condition: cond,
            imageUrls: allImageUrls,
            sellerId: user.id,
            category: formData.category,
            latitude: latLong[0],
            longitude: latLong[1],
          },
          user.id,
        );
        if (res.success) {
          setSuccess(true);
          setSelectedListing(res.listing);
          setUserListings([
            ...userListings.filter((l) => l.lid !== res.listing.lid),
            res.listing,
          ]);
          router.replace("/listings");
        } else setError(true);
      } else if (type === "edit" && selectedListing) {
        const toDelete =
          selectedListing.imageUrls?.filter(
            (url: string) => !images.find((img) => img.uri === url),
          ) ?? [];
        if (toDelete.length > 0)
          await fetch(`${BASE_URL}/api/cloudinary`, {
            method: "delete",
            body: JSON.stringify(toDelete),
            headers: {
              Authorization: user.id,
            },
          });

        const res = await editListingAction(
          {
            title,
            price,
            description,
            condition: cond,
            lid: selectedListing.lid,
            imageUrls: allImageUrls,
            sellerId: user.id,
            category: formData.category,
            latitude: latLong[0],
            longitude: latLong[1],
          },
          user.id,
        );
        if (res?.success) {
          setSuccess(true);
          setSelectedListing(res.listing);
          setUserListings([
            ...userListings.filter((l) => l.lid !== res.listing.lid),
            res.listing,
          ]);
          router.replace("/listings");
        } else setError(true);
      }
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setFormData({
        title: "",
        price: "0",
        description: "",
        condition: prefs.defaultCondition ?? "",
        category: prefs.defaultCategory ?? "",
        defaultLocation: prefs.defaultLocation ?? "",
      });
      setLatLong([prefs.defaultLat ?? 0, prefs.defaultLng ?? 0]);

      setIsLoading(false);
      setUploading(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-5 pt-4 gap-5"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <SafeAreaView style={{ paddingBottom: bottomClearance }}>
        {/* ── Photos ── */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(0)}
          className="gap-2"
        >
          <Text className="text-[11px] font-medium text-primary/50 uppercase tracking-widest">
            Photos
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-3"
          >
            {images.map(({ uri }, i) => (
              <View
                key={uri + i}
                className="relative w-36 h-36 rounded-2xl overflow-hidden border border-secondary/20"
              >
                <Image
                  source={{ uri }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() => removeImage(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-text/70 items-center justify-center"
                >
                  <Text className="text-pill text-xs font-bold">✕</Text>
                </Pressable>
              </View>
            ))}

            {/* Add photos */}
            {images.length < 10 && (
              <Pressable
                onPress={pickImages}
                className="w-36 h-36 rounded-2xl border-2 border-dashed border-secondary/40 bg-pill items-center justify-center gap-1"
              >
                <Text className="text-primary text-xl mt-4 font-sans">＋</Text>
                <Text className="text-[11px] text-primary/50 font-medium text-center">
                  Add photos
                </Text>
              </Pressable>
            )}
          </ScrollView>

          <Text className="text-[11px] text-primary/50">
            {images.length}/10 photos added
          </Text>
        </Animated.View>

        <View className="h-px bg-secondary/20" />

        {/* ── Title ── */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(60)}
          className="gap-1.5"
        >
          <Text className="text-xl mt-4 font-sans font-medium text-text">
            Title
          </Text>
          <TextInput
            style={inputStyle.base}
            value={formData.title}
            onChangeText={(v) => setFormData((p) => ({ ...p, title: v }))}
            placeholder="e.g. Calculus textbook — 3rd edition"
            placeholderTextColor={colors.primary + "80"}
          />
        </Animated.View>

        {/* ── Price ── */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(80)}
          className="gap-1.5"
        >
          <Text className="text-xl mt-4 font-sans font-medium text-text">
            Price
          </Text>
          <View className="flex-row items-center">
            <Text className="absolute left-3.5 text-sm text-primary/50 z-10">
              $
            </Text>
            <TextInput
              style={[inputStyle.base, { paddingLeft: 28 }]}
              value={formData.price}
              onChangeText={(v) =>
                setFormData((p) => ({ ...p, price: v.replace(/[^0-9]/g, "") }))
              }
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.primary + "80"}
            />
          </View>
        </Animated.View>

        <View className="h-px bg-secondary/20 mt-4" />

        {/* ── Condition chips ── */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(100)}
          className="gap-2"
        >
          <Text className="text-xl mt-4 font-sans font-medium text-text">
            Condition
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2"
          >
            {condition.map((c) => (
              <SpringChip
                key={c}
                label={c}
                active={c === formData.condition}
                onPress={() => setFormData((p) => ({ ...p, condition: c }))}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── Category chips ── */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(120)}
          className="gap-2"
        >
          <Text className="text-xl mt-4 font-sans font-medium text-text">
            Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2"
          >
            {categories
              .filter((c) => c !== "All")
              .map((c) => (
                <SpringChip
                  key={c}
                  label={c}
                  active={c === formData.category}
                  onPress={() => setFormData((p) => ({ ...p, category: c }))}
                />
              ))}
          </ScrollView>
        </Animated.View>

        <View className="h-px bg-secondary/20 mt-4" />

        {/* ── Description ── */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(140)}
          className="gap-1.5"
        >
          <Text className="text-xl mt-4 font-sans font-medium text-text">
            Description
          </Text>
          <TextInput
            style={[
              inputStyle.base,
              { minHeight: 80, textAlignVertical: "top" },
            ]}
            value={formData.description}
            onChangeText={(v) => setFormData((p) => ({ ...p, description: v }))}
            placeholder="Describe the item — edition, defects, extras included…"
            placeholderTextColor={colors.primary + "80"}
            multiline
            numberOfLines={4}
          />
        </Animated.View>

        <Animated.View>
          <Text className="text-xl mt-4 font-sans font-medium text-text">
            Location
          </Text>
          <LocationInput
            llSetter={setLatLong}
            ll={latLong}
            onLocationName={(name) =>
              setFormData((p) => ({ ...p, defaultLocation: name }))
            }
          />
        </Animated.View>

        <View className="h-px bg-secondary/20 my-8" />

        {/* ── Submit ── */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(180)}
          className="gap-3"
        >
          <SpringChip
            label={
              uploading
                ? "Uploading images..."
                : isLoading
                  ? "Posting..."
                  : type === "edit"
                    ? "Save changes"
                    : "Post listing"
            }
            active={true}
            onPress={handleSubmit}
            disabled={isLoading || disabled || uploading}
            fullWidth
            large
          />

          <Pressable
            onPress={() => {
              setSelectedListing({});
              router.replace("/(tabs)/new");
            }}
            className="w-full items-center py-3 rounded-2xl border border-secondary/30"
          >
            <Text className="text-primary/50 font-medium text-[14px]">
              Cancel
            </Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </ScrollView>
  );
};

const SpringChip = ({
  label,
  active,
  onPress,
  disabled,
  fullWidth,
  large,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  large?: boolean;
}) => {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={style}
      onPressIn={() => {
        scale.value = withSpring(0.92, { stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { stiffness: 400 });
      }}
      onPress={onPress}
      disabled={disabled}
      className={`
        items-center justify-center rounded-full border
        ${large ? "py-3.5 rounded-2xl" : "px-3.5 py-1.5"}
        ${fullWidth ? "w-full" : ""}
        ${active ? "bg-text border-text" : "bg-pill border-secondary/30"}
        ${disabled ? "opacity-40" : ""}
      `}
    >
      <Text
        className={`font-bold text-sm ${active ? "text-primary" : "text-primary/50"}`}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
};

const inputStyle = StyleSheet.create({
  base: {
    width: "100%",
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.secondary + "40",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
});

export default ListingFormPage;
