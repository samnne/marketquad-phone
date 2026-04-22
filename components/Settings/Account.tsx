import { colors } from "@/constants/theme";
import { Field, SaveButton } from "@/components/Onboarding";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

type Props = {
  open: boolean;
  email: string;
  save: (newPassword: string) => void;
  loading: boolean;
  onDeleteAccount: () => void;
};

export default function AccountSection(props: Props) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  if (!props.open) return null;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(100)}
      className="px-4 pb-4 gap-4 border-t border-secondary/10"
    >
      <View className="h-3" />

      {/* Email — read only */}
      <Field label="Email">
        <View className="h-12 px-4 border border-secondary/10 rounded-xl bg-secondary/5 justify-center flex-row items-center gap-2">
          <Text className="text-sm text-secondary flex-1" numberOfLines={1}>
            {props.email}
          </Text>
          <FontAwesome6 name="lock" size={11} color={colors.secondary + "80"} />
        </View>
      </Field>

      {/* New password */}
      <Field label="New password" hint="Minimum 8 characters">
        <View className="relative">
          <TextInput
            className="h-12 px-4 pr-12 border border-secondary/20 rounded-xl bg-background text-text text-sm"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPw}
            placeholder="New password"
            placeholderTextColor={colors.secondary + "60"}
            autoCapitalize="none"
          />
          <Pressable
            onPress={() => setShowPw((p) => !p)}
            className="absolute right-4 top-3.5"
            hitSlop={8}
          >
            <FontAwesome6
              name={showPw ? "eye-slash" : "eye"}
              size={14}
              color={colors.secondary}
            />
          </Pressable>
        </View>
      </Field>

      {/* Confirm password */}
      <Field label="Confirm password">
        <TextInput
          className={`h-12 px-4 border rounded-xl bg-background text-text text-sm ${
            confirmPassword.length > 0 && confirmPassword !== newPassword
              ? "border-red-400/60"
              : "border-secondary/20"
          }`}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPw}
          placeholder="Confirm new password"
          placeholderTextColor={colors.secondary + "60"}
          autoCapitalize="none"
        />
      </Field>

      <SaveButton
        onPress={() => props.save(newPassword)}
        loading={props.loading}
      />

      {/* Danger zone */}
      <View className="flex-row items-center gap-3 my-1">
        <View className="flex-1 h-px bg-secondary/10" />
        <Text className="text-xs text-secondary/40">Danger zone</Text>
        <View className="flex-1 h-px bg-secondary/10" />
      </View>

      <Pressable
        onPress={props.onDeleteAccount}
        className="h-11 border border-red-400/40 rounded-xl items-center justify-center"
      >
        <Text className="text-sm font-semibold text-red-400">
          Delete account
        </Text>
      </Pressable>
     
    </Animated.View>
  );
}
