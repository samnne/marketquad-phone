import { useUser } from "@/store/zustand";
import { BASE_URL, onboardingTotal } from "@/constants/constants";
import { colors } from "@/constants/theme";

import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  useSafeAreaInsets,
  SafeAreaView as RNSAV,
} from "react-native-safe-area-context";
import {
  AvatarPlaceholder,
  Field,
  SpringButton,
  StepDots,
} from "@/components/Onboarding";
import { styled } from "nativewind";
import { uploadPFP } from "@/cloudinary/cloudinary";
const SafeAreaView = styled(RNSAV);

const USERNAME_RE = /^[a-z0-9._]{3,20}$/;

const getUsernameHint = (val: string) => {
  if (!val) return "";
  if (val.length < 3) return "At least 3 characters";
  if (!USERNAME_RE.test(val)) return "Letters, numbers, . and _ only";
  return "✓ Looks good";
};

const OnboardingProfile = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useUser();

  const [name, setName] = useState<string>(
    user?.app_user?.name ?? user?.user_metadata?.name ?? "",
  );
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // PFP state — localUri is shown immediately, uploaded only on save
  const [localPfpUri, setLocalPfpUri] = useState<string | null>(null);

  const usernameHint = getUsernameHint(username);
  const usernameOk = USERNAME_RE.test(username);
  const canContinue = name.trim().length > 0 && usernameOk; 
  

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      // alert("Photo library access is required to update your profile picture. Please go to Settings > MarketQuad and enable Photos access.");

      return router.push("/permissions?type=photo");
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setLocalPfpUri(result.assets[0].uri);
    }
  };

  const handleContinue = async () => {
    if (!canContinue) return;
    setLoading(true);
    setError("");

    try {
      // Upload PFP first if user picked one
      let pfpUrl: string | undefined;
      if (localPfpUri && !user?.app_user?.profileURL) {
        pfpUrl = await uploadPFP(localPfpUri, user?.id!);
      }

      const res = await fetch(`${BASE_URL}/api/users/onboarding/profile`, {
        method: "PATCH",
        headers: {
          Authorization: user?.id!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          bio: bio.trim(),
          ...(pfpUrl && { pfp_url: pfpUrl }),
        }),
      }).then((r) => r.json());

      if (!res.success) {
        setError(res.message ?? "Something went wrong. Please try again.");
        return;
      }

      setUser({ ...user, app_user: { ...user?.app_user, ...res.user } });
      router.push("/onboarding/education");
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <SafeAreaView
        className="flex-1 bg-background"
        style={{ paddingBottom: insets.bottom }}
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="flex-grow px-6 pt-6 pb-10"
        >
          <View className="flex-1 gap-8">
            {/* ── Top bar ── */}
            <View className="flex-row items-center justify-between">
              <StepDots total={onboardingTotal} current={1} />
              <Pressable
                onPress={() => router.push("/onboarding/education")}
                hitSlop={12}
              >
                <Text className="text-sm text-text/70 font-medium">Skip</Text>
              </Pressable>
            </View>

            {/* ── Header ── */}
            <View className="gap-2">
              <Text className="text-5xl font-bold text-text tracking-tight">
                Set up your profile
              </Text>
              <Text className="text-lg font-light text-text leading-5">
                This is how other students will see you on MarketQuad.
              </Text>
            </View>

            {/* ── Avatar ── */}
            <View className="items-center">
              <AvatarPlaceholder
                name={name}
                uri={localPfpUri ?? ""} // show local preview
                onPress={handlePickPhoto}
              />
            </View>

            {/* ── Fields ── */}
            <View className="gap-5">
              <Field label="Display name">
                <TextInput
                  className="w-full h-15 px-4 shadow leading-none   rounded-2xl bg-pill text-text text-lg"
                  placeholder="Jane Smith"
                  placeholderTextColor={colors.text + "60"}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </Field>

              <Field
                label="Username"
                hint={usernameHint}
                right={
                  username.length > 0 ? (
                    <Text
                      className={`text-xs absolute right-0 font-semibold ${
                        usernameOk ? "text-green-500" : "text-red-400"
                      }`}
                    >
                      {username.length}/20
                    </Text>
                  ) : null
                }
              >
                <View className="relative">
                  <Text className="absolute left-4 top-4 text-lg text-text z-10">
                    @
                  </Text>
                  <TextInput
                    className={`w-full h-15  pl-9 leading-none   border shadow rounded-2xl bg-pill text-text text-lg ${
                      username.length > 0 && !usernameOk
                        ? "border-red-400/60"
                        : username.length > 0 && usernameOk
                          ? "border-green-500/40"
                          : "border-0"
                    }`}
                    placeholder="jane.smith"
                    placeholderTextColor={colors.text + "60"}
                    value={username}
                    onChangeText={(v) =>
                      setUsername(v.toLowerCase().replace(/[^a-z0-9._]/g, ""))
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={20}
                    returnKeyType="next"
                  />
                </View>
              </Field>

              <Field
                label="Bio"
                hint="Tell buyers a bit about yourself (Optional)"
                right={
                  <Text className="text-sm text-text/50">{bio.length}/120</Text>
                }
              >
                <TextInput
                  className="w-full px-4 py-3 shadow   rounded-2xl bg-pill text-text text-lg"
                  placeholder="3rd year CS student selling textbooks and a desk..."
                  placeholderTextColor={colors.text + "60"}
                  value={bio}
                  onChangeText={(v) => setBio(v.slice(0, 120))}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  style={{ minHeight: 88 }}
                />
              </Field>
            </View>

            {/* ── Error ── */}
            {error ? (
              <View className="flex-row items-center gap-2 bg-red-500/10 px-4 py-3 rounded-2xl">
                <FontAwesome6
                  name="circle-exclamation"
                  size={13}
                  color="#f87171"
                />
                <Text className="text-sm text-red-400 flex-1">{error}</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>

        {/* ── Footer CTA ── */}
        <View className="px-6 pb-4 gap-3 border-t border-secondary/10 pt-4 bg-background">
          <SpringButton
            onPress={handleContinue}
            disabled={!canContinue || loading}
            className="h-14 bg-primary rounded-2xl items-center justify-center"
          >
            {loading ? (
              <ActivityIndicator color={colors.pill} />
            ) : (
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-bold text-pill">Continue</Text>
                <FontAwesome6
                  name="arrow-right"
                  size={13}
                  color={colors.pill}
                />
              </View>
            )}
          </SpringButton>

          <Text className="text-xs text-center text-text/50">
            You can always update this in your profile settings
          </Text>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default OnboardingProfile;
