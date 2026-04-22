import { colors } from "@/constants/theme";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { View, Text, Pressable, Linking } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const LINKS = [
  { label: "Privacy Policy", icon: "shield-halved", url: "https://market-quad.com/privacy" },
  { label: "Terms of Service", icon: "file-lines", url: "https://market-quad.com/tos" },
  { label: "Open source licenses", icon: "code", url: "https://market-quad.com/licenses" },
] as const;

type Props = { open: boolean };

export default function LegalSection({ open }: Props) {
  if (!open) return null;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(100)}
      className="border-t border-secondary/10"
    >
      {LINKS.map((item, i) => (
        <Pressable
          key={item.label}
          onPress={() => Linking.openURL(item.url)}
          className={`flex-row items-center justify-between px-4 py-3.5 ${
            i < LINKS.length - 1 ? "border-b border-secondary/8" : ""
          }`}
        >
          <View className="flex-row items-center gap-3">
            <FontAwesome6
              name={item.icon as any}
              size={13}
              color={colors.secondary}
            />
            <Text className="text-sm text-text">{item.label}</Text>
          </View>
          <FontAwesome6
            name="chevron-right"
            size={11}
            color={colors.secondary + "60"}
          />
        </Pressable>
      ))}
      <View className="px-4 py-3 border-t border-secondary/8">
        <Text className="text-xs text-secondary/50">
          MarketQuad v1.0.0 · Built at UVic 🎓
        </Text>
      </View>
    </Animated.View>
  );
}