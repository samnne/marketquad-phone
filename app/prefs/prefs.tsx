import { db, STORAGE_KEY } from "@/db/db";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { colors, components } from "@/constants/theme";
import { categories, condition, UVIC_LNG_LAT } from "@/constants/constants";
import { getUserSupabase, BASE_URL } from "@/utils/functions";

import LocationInput from "@/components/Inputs/LocationInput";
import { usePrefs } from "@/store/zustand";

type Prefs = {
  defaultCategory: string | null;
  defaultCondition: string | null;
  defaultLocation: string | null;
  defaultLat: number | null;
  defaultLng: number | null;
};

const DEFAULT_PREFS: Prefs = {
  defaultCategory: null,
  defaultCondition: null,
  defaultLocation: null,
  defaultLat: null,
  defaultLng: null,
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View className="gap-2">
    <Text className="text-[11px] font-medium text-text uppercase tracking-widest pl-1">
      {title}
    </Text>
    <View className="bg-pill rounded-[20px] border border-primary/25 overflow-hidden p-4 gap-3">
      {children}
    </View>
  </View>
);

const ChipRow = ({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string | null;
  onSelect: (val: string | null) => void;
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerClassName="gap-2"
  >
    {options.map((opt) => {
      const active = opt === selected;
      return (
        <Pressable
          key={opt}
          onPress={() => onSelect(active ? null : opt)}
          className={`px-3.5 py-1.5 rounded-full border ${
            active ? "bg-text border-text" : "bg-background border-primary/30"
          }`}
        >
          <Text
            className={`text-[13px] font-medium ${active ? "text-primary" : "text-primary"}`}
          >
            {opt}
          </Text>
        </Pressable>
      );
    })}
  </ScrollView>
);

export default function PrefsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomClearance = components.tabBar.height + insets.bottom;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { prefs, prefsLoaded, loadPrefs, savePrefs, updatePref, resetPrefs } =
    usePrefs();
  const [latLong, setLatLong] = useState<[number, number]>([
    prefs.defaultLat ?? UVIC_LNG_LAT[1],
    prefs.defaultLng ?? UVIC_LNG_LAT[0],
  ]);

  useEffect(() => {
    setLoading(true);
    try {
      loadPrefs();
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, []);

  const update = <K extends keyof typeof prefs>(key: K, value: any) => {
    updatePref(key, value);
   
    setDirty(true);
  };

  const save = () => {
    setSaving(true);
    try {
      savePrefs(); // writes zustand state → localStorage
      setDirty(false);
      Alert.alert("Saved", "Your preferences have been saved.");
    } finally {
      setSaving(false);
    }
  };
  const reset = () => {
    Alert.alert(
      "Reset preferences",
      "This will clear all your saved preferences.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            resetPrefs(); // clears localStorage + resets zustand state
            setDirty(false);
          },
        },
      ],
    );
  };

  if (!prefsLoaded) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: bottomClearance }}
      style={{ paddingTop: insets.top }}
      showsVerticalScrollIndicator={false}
    >
      <View className="p-4 gap-5">
        {/* ── Header ── */}
        <Animated.View
          entering={FadeInDown.duration(300)}
          className="flex-row items-center justify-between"
        >
          <View>
            <Text className="text-2xl font-extrabold text-text">
              Preferences
            </Text>
            <Text className="text-[13px] text-primary mt-0.5">
              Saved locally on this device
            </Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-[10px] bg-pill border border-primary/25 items-center justify-center"
          >
            <FontAwesome name="times" size={14} color={colors.text} />
          </Pressable>
        </Animated.View>

        {/* ── Default category ── */}
        <Animated.View entering={FadeInDown.duration(300).delay(60)}>
          <Section title="Default category">
            <Text className="text-[13px] text-primary">
              Pre-selects this category when you open listings.
            </Text>
            <ChipRow
              options={categories.filter((c) => c !== "All")}
              selected={prefs.defaultCategory}
              onSelect={(v) => update("defaultCategory", v)}
            />
          </Section>
        </Animated.View>

        {/* ── Default condition ── */}
        <Animated.View entering={FadeInDown.duration(300).delay(100)}>
          <Section title="Default condition">
            <Text className="text-[13px] text-primary">
              Pre-selects condition when browsing or creating a listing.
            </Text>
            <ChipRow
              options={condition}
              selected={prefs.defaultCondition}
              onSelect={(v) => update("defaultCondition", v)}
            />
          </Section>
        </Animated.View>

        {/* ── Default location ── */}
        <Animated.View entering={FadeInDown.duration(300).delay(140)}>
          <Section title="Default location">
            <Text className="text-[13px] text-primary">
              Your preferred pickup/meetup area.
            </Text>

            {/* Location display */}
            <View className="bg-background border border-primary/20 rounded-xl p-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2 flex-1">
                <FontAwesome
                  name="map-marker"
                  size={16}
                  color={colors.primary}
                />
                <Text
                  className="text-[13px] text-text flex-1"
                  numberOfLines={1}
                >
                  {prefs.defaultLocation ?? "No location set"}
                </Text>
              </View>
              {prefs.defaultLocation && (
                <Pressable
                  onPress={() => {
                    update("defaultLocation", null);
                    update("defaultLat", null);
                    update("defaultLng", null);
                  }}
                >
                  <FontAwesome
                    name="times-circle"
                    size={16}
                    color={colors.primary}
                  />
                </Pressable>
              )}
            </View>

            {/* Coordinates display if set */}
            {prefs.defaultLat && prefs.defaultLng && (
              <Text className="text-[11px] text-primary/60 pl-1">
                {prefs.defaultLat.toFixed(5)}, {prefs.defaultLng.toFixed(5)}
              </Text>
            )}

            <Animated.View className="flex-row items-center gap-2 bg-primary/10 border border-primary/20  rounded-xl px-4 py-2.5">
              <FontAwesome name="crosshairs" size={14} color={colors.primary} />
              <LocationInput
                llSetter={setLatLong}
                ll={latLong}
                onLocationName={(name) => update("defaultLocation", name)}
              />
            </Animated.View>
          </Section>
        </Animated.View>
        {/* ── Summary card ── */}
        {(prefs.defaultCategory ||
          prefs.defaultCondition ||
          prefs.defaultLocation) && (
          <Animated.View entering={FadeInDown.duration(300).delay(180)}>
            <Section title="Current defaults">
              {prefs.defaultCategory && (
                <Row
                  icon="tag"
                  label="Category"
                  value={prefs.defaultCategory}
                />
              )}
              {prefs.defaultCondition && (
                <Row
                  icon="star-o"
                  label="Condition"
                  value={prefs.defaultCondition}
                />
              )}
              {prefs.defaultLocation && (
                <Row
                  icon="map-marker"
                  label="Location"
                  value={prefs.defaultLocation}
                />
              )}
            </Section>
          </Animated.View>
        )}

        {/* ── Actions ── */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(220)}
          className="gap-3"
        >
          {/* Save */}
          <Pressable
            onPress={save}
            disabled={!dirty || saving}
            className={`w-full py-3.5 rounded-2xl items-center ${
              dirty ? "bg-text" : "bg-text/30"
            }`}
          >
            {saving ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text
                className={`font-bold text-[15px] ${dirty ? "text-secondary" : "text-secondary/40"}`}
              >
                {dirty ? "Save preferences" : "No changes"}
              </Text>
            )}
          </Pressable>

          {/* Reset */}
          <Pressable
            onPress={reset}
            className="w-full py-3 rounded-2xl items-center border border-primary/30"
          >
            <Text className="text-primary font-medium text-[14px]">
              Reset to defaults
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const Row = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) => (
  <View className="flex-row items-center justify-between">
    <View className="flex-row items-center gap-2">
      <FontAwesome name={icon as any} size={13} color={colors.primary} />
      <Text className="text-[13px] text-primary">{label}</Text>
    </View>
    <View className="bg-primary/10 px-2.5 py-1 rounded-lg">
      <Text className="text-[12px] font-semibold text-primary">{value}</Text>
    </View>
  </View>
);
