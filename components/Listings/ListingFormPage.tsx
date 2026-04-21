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

import { useSafeAreaInsets } from "react-native-safe-area-context";
import LocationInput from "../Inputs/LocationInput";
import { Ionicons } from "@expo/vector-icons";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ListingFormSchema = z.object({
  title: z.string().min(4, "Title Too Short").max(150).trim(),
  price: z.number().min(0).max(1000000),
  description: z.string().min(0).max(2000).trim(), // ← add max + trim
  category: z.string().min(3, "Please Choose a Category").max(50).trim(),
  condition: z.string().min(3, "Please Choose a Condition").max(50).trim(),
});

type ImageEntry = { uri: string; isRemote: boolean };

// ── Section wrapper ────────────────────────────────────────────
const Section = ({
  label,
  delay = 0,
  children,
}: {
  label: string;
  delay?: number;
  children: React.ReactNode;
}) => (
  <Animated.View
    entering={FadeInDown.duration(400).delay(delay)}
    className="gap-2"
  >
    <Text className="text-[11px] font-semibold text-primary/40 uppercase tracking-widest px-1">
      {label}
    </Text>
    <View className="bg-pill rounded-2xl overflow-hidden border border-secondary/10">
      {children}
    </View>
  </Animated.View>
);

// ── Row inside a section ───────────────────────────────────────
const Row = ({
  children,
  last = false,
}: {
  children: React.ReactNode;
  last?: boolean;
}) => (
  <View>
    {children}
    {!last && <View className="h-px bg-secondary/15 mx-4" />}
  </View>
);

// ── Inline text field row ──────────────────────────────────────
const FieldRow = ({
  label,
  last = false,
  prefix,
  style,
  className, // pull this out so it doesn't get spread in
  ...props
}: {
  label: string;
  last?: boolean;
  prefix?: string;
} & React.ComponentProps<typeof TextInput>) => (
  <Row last={last}>
    <View className="flex-row items-center px-4 py-3.5 gap-3">
      <Text className="text-text text-[15px] w-24 font-medium">{label}</Text>
      <View className="flex-1 flex-row items-center">
        {prefix && (
          <Text className="text-primary/40 text-[15px] mr-1">{prefix}</Text>
        )}
        <TextInput
          style={[
            {
              flex: 1,
              fontSize: 15,
              color: colors.text,
              textAlign: "right",
            },
            style,
          ]}
          placeholderTextColor={colors.primary + "40"}
          {...props}
        />
      </View>
    </View>
  </Row>
);

// ── Chip ───────────────────────────────────────────────────────
const Chip = ({
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
  return (
    <AnimatedPressable
      style={style}
      onPressIn={() => {
        scale.value = withSpring(0.93, { stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { stiffness: 400 });
      }}
      onPress={onPress}
      className={`px-4 py-2 rounded-full border ${
        active ? "bg-text border-text" : "bg-transparent border-secondary/25"
      }`}
    >
      <Text
        className={`text-[13px] font-semibold ${
          active ? "text-pill" : "text-primary/50"
        }`}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
};

// ── Submit button ──────────────────────────────────────────────
const SubmitButton = ({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) => {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <AnimatedPressable
      style={style}
      onPressIn={() => {
        scale.value = withSpring(0.97, { stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { stiffness: 300 });
      }}
      onPress={onPress}
      disabled={disabled}
      className={`w-full items-center justify-center py-4 rounded-2xl bg-text ${
        disabled ? "opacity-30" : ""
      }`}
    >
      <Text className="text-pill font-semibold text-[16px]">{label}</Text>
    </AnimatedPressable>
  );
};

// ── Main form ──────────────────────────────────────────────────
const ListingFormPage = ({ type }: { type: "new" | "edit" }) => {
  const router = useRouter();
  const { user, setUser, userListings, setUserListings } = useUser();
  const { selectedListing, setSelectedListing } = useListings();
  const { setError, setSuccess, setMessage } = useMessage();
  const insets = useSafeAreaInsets();
  const { prefs } = usePrefs();
  const pathname = usePathname();

  const [latLong, setLatLong] = useState<[number, number]>([
    prefs.defaultLat ?? UVIC_LNG_LAT[1],
    prefs.defaultLng ?? UVIC_LNG_LAT[0],
  ]);
  const bottomClearance = components.tabBar.height + insets.bottom;
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    description: "",
    condition: prefs.defaultCondition ?? "",
    category: prefs.defaultCategory ?? "",
    defaultLocation: "",
  });

  useEffect(() => {
    const mount = async () => {
      const { user: u, app_user } = await getUserSupabase();
      if (!u) {
        setError(true);
        setMessage("Please sign in to continue.");
        router.replace("/sign-in");
        return;
      }
      setUser({ ...u, app_user });
    };
    mount();
    setFormData((prev) => ({
      ...prev,
      condition: prefs.defaultCondition ?? "",
      category: prefs.defaultCategory ?? "",
    }));
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
      if (imageUrls)
        setImages(imageUrls.map((uri: string) => ({ uri, isRemote: true })));
    }
  }, [pathname]);

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
      base64: false,
    });
    if (!result.canceled) {
      const newEntries = result.assets.map((a) => ({
        uri: a.uri,
        isRemote: false,
      }));
      setImages((prev) => [...prev, ...newEntries].slice(0, 10));
    }
  };

  const removeImage = (index: number) =>
    setImages((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    const parsed = ListingFormSchema.safeParse({
      ...formData,
      price: Number(formData.price),
    });
    if (!parsed.success || !user?.id) {
      setError(true);
      setMessage("Please fill in all required fields.");
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
        console.log(res);
        if (res.success) {
          setSuccess(true);
          setMessage("Listing posted successfully!");
          setSelectedListing(res.listing);

          setUserListings([
            ...userListings.filter((l) => l.lid !== res.listing?.lid),
            res.listing,
          ]);
          router.push(`/listings/${res.listing?.lid}`);
        } else {
          setError(true);
          setMessage("Failed to post listing. Please try again.");
        }
      } else if (type === "edit" && selectedListing) {
        const toDelete =
          selectedListing.imageUrls?.filter(
            (url: string) => !images.find((img) => img.uri === url),
          ) ?? [];
        if (toDelete.length > 0)
          await fetch(`${BASE_URL}/api/cloudinary`, {
            method: "delete",
            body: JSON.stringify(toDelete),
            headers: { Authorization: user.id },
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
        console.log(res);
        if (res?.success) {
          setSuccess(true);
          setMessage("Listing updated successfully!");
          setSelectedListing(res.listing);
          setUserListings([
            ...userListings.filter((l) => l.lid !== res.listing?.lid),
            res.listing,
          ]);
          router.push(`/listings/${res.listing?.lid}`);
        } else {
          setError(true);
          setMessage("Failed to update listing. Please try again.");
        }
      }
    } catch (err) {
      console.error(err);
      setError(true);
      setMessage("An error occurred. Please try again.");
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
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: bottomClearance,
        gap: 24,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Photos ── */}
      <Section label="Photos" delay={0}>
        <Row last>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, padding: 14 }}
          >
            {images.map(({ uri }, i) => (
              <View
                key={uri + i}
                className="relative w-80 h-80 rounded-xl overflow-hidden"
              >
                <Image
                  source={{ uri }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() => removeImage(i)}
                  className="absolute top-1 right-1 w-10  h-10 rounded-xl bg-white/80 items-center justify-center"
                >
                  <Ionicons name="close" size={24} color={colors.primary} />
                </Pressable>
              </View>
            ))}
            {images.length < 10 && (
              <Pressable
                onPress={pickImages}
                className="w-24 h-24 rounded-xl border border-dashed border-secondary/30 bg-background items-center justify-center gap-1"
              >
                <Ionicons name="add" size={24} color={colors.primary + "60"} />
                <Text className="text-[10px] text-primary/40 font-medium">
                  Add
                </Text>
              </Pressable>
            )}
          </ScrollView>
          <Text className="text-[11px] text-primary/30 pb-3 px-4">
            {images.length}/10 photos
          </Text>
        </Row>
      </Section>

      {/* ── Details ── */}
      <Section label="Details" delay={60}>
        <FieldRow
          label="Title"
          value={formData.title}
          onChangeText={(v) => setFormData((p) => ({ ...p, title: v }))}
          placeholder="What are you selling?"
          returnKeyType="next"
        />
        <FieldRow
          label="Price"
          prefix="$"
          value={formData.price}
          onChangeText={(v) =>
            setFormData((p) => ({ ...p, price: v.replace(/[^0-9]/g, "") }))
          }
          keyboardType="number-pad"
          placeholder="0"
          last
        />
      </Section>

      {/* ── Description ── */}
      <Section label="Description" delay={80}>
        <Row last>
          <TextInput
            style={[styles.textArea]}
            value={formData.description}
            onChangeText={(v) => setFormData((p) => ({ ...p, description: v }))}
            placeholder="Describe the item — edition, defects, extras included…"
            placeholderTextColor={colors.primary + "40"}
            multiline
            numberOfLines={4}
          />
        </Row>
      </Section>

      {/* ── Condition ── */}
      <Section label="Condition" delay={100}>
        <Row last>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, padding: 14 }}
          >
            {condition.map((c) => (
              <Chip
                key={c}
                label={c}
                active={c === formData.condition}
                onPress={() => setFormData((p) => ({ ...p, condition: c }))}
              />
            ))}
          </ScrollView>
        </Row>
      </Section>

      {/* ── Category ── */}
      <Section label="Category" delay={120}>
        <Row last>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, padding: 14 }}
          >
            {categories
              .filter((c) => c !== "All")
              .map((c) => (
                <Chip
                  key={c}
                  label={c}
                  active={c === formData.category}
                  onPress={() => setFormData((p) => ({ ...p, category: c }))}
                />
              ))}
          </ScrollView>
        </Row>
      </Section>

      {/* ── Location ── */}
      <Section label="Location" delay={140}>
        <Row last>
          <View className="p-3">
            <LocationInput
              llSetter={setLatLong}
              latLong={latLong}
              onLocationName={(name) =>
                setFormData((p) => ({ ...p, defaultLocation: name }))
              }
            />
          </View>
        </Row>
      </Section>

      {/* ── Actions ── */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(160)}
        className="gap-3 pb-4"
      >
        <SubmitButton
          label={
            uploading
              ? "Uploading…"
              : isLoading
                ? "Posting…"
                : type === "edit"
                  ? "Save Changes"
                  : "Post Listing"
          }
          onPress={handleSubmit}
          disabled={isLoading || disabled || uploading}
        />
        <Pressable
          onPress={() => {
            setSelectedListing({});
            if (type === "new") {
              setFormData({
                category: "",
                defaultLocation: "",
                condition: "",
                description: "",
                price: "",
                title: "",
              });
            } else {
              router.back();
            }
          }}
          className="w-full items-center py-4"
        >
          <Text className="text-primary/40 font-medium text-[15px]">
            Cancel
          </Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: "top",
  },
});

export default ListingFormPage;
