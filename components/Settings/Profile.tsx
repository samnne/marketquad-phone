import { colors } from "@/constants/theme";
import { Field, SaveButton } from "@/components/Onboarding";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { View, Text, TextInput } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

type Props = {
  open: boolean;
  name: string;
  username: string;
  bio: string;
  setName: (v: string) => void;
  setUsername: (v: string) => void;
  setBio: (v: string) => void;
  save: () => void;
  loading: boolean;
  USERNAME_OK: boolean;
};

export default function ProfileSection(props: Props) {
  if (!props.open) return null;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(100)}
      className="px-4 pb-4 gap-4 border-t border-secondary/10"
    >
      <View className="h-3" />

      {/* Avatar */}
      <View className="items-center">
        <View className="relative">
          <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center border-2 border-primary/20">
            <Text className="text-2xl font-bold text-primary">
              {props.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "?"}
            </Text>
          </View>
          <View className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary items-center justify-center">
            <FontAwesome6 name="camera" size={10} color={colors.pill} />
          </View>
        </View>
        <Text className="text-xs text-secondary mt-2">Photo upload coming soon</Text>
      </View>

      <Field label="Display name">
        <TextInput
          className="h-12 px-4 border border-secondary/20 rounded-xl bg-background text-text text-sm"
          value={props.name}
          onChangeText={props.setName}
          autoCapitalize="words"
          placeholderTextColor={colors.secondary + "60"}
        />
      </Field>

      <Field label="Username">
        <View className="relative">
          <Text className="absolute left-4 top-3 text-sm text-secondary z-10">@</Text>
          <TextInput
            className={`h-12 pl-8 pr-4 border rounded-xl bg-background text-text text-sm ${
              props.username.length > 0 && !props.USERNAME_OK
                ? "border-red-400/60"
                : "border-secondary/20"
            }`}
            value={props.username}
            onChangeText={(v) =>
              props.setUsername(v.toLowerCase().replace(/[^a-z0-9._]/g, ""))
            }
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
            placeholderTextColor={colors.secondary + "60"}
          />
        </View>
      </Field>

      <Field label="Bio" hint="Max 120 characters">
        <TextInput
          className="px-4 py-3 border border-secondary/20 rounded-xl bg-background text-text text-sm"
          value={props.bio}
          onChangeText={(v) => props.setBio(v.slice(0, 120))}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={{ minHeight: 76 }}
          placeholderTextColor={colors.secondary + "60"}
        />
      </Field>

      <SaveButton onPress={props.save} loading={props.loading} />
    </Animated.View>
  );
}