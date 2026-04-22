import { categories as CATEGORIES, INTENTS } from "@/constants/constants";
import { colors } from "@/constants/theme";
import { Field, SaveButton } from "@/components/Onboarding";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { View, Text, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

type Intent = "buying" | "selling" | "both";

type Props = {
  open: boolean;
  intent: Intent;
  categories: string[];
  setIntent: (v: Intent) => void;
  setCategories: (v: string[]) => void;
  save: () => void;
  loading: boolean;
};

export default function PreferencesSection(props: Props) {
  if (!props.open) return null;

  const toggleCategory = (val: string) =>
    props.setCategories(
      props.categories.includes(val)
        ? props.categories.filter((v) => v !== val)
        : [...props.categories, val]
    );

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(100)}
      className="px-4 pb-4 gap-5 border-t border-secondary/10"
    >
      <View className="h-3" />

      <Field label="I'm here to…">
        <View className="flex-row gap-2">
          {INTENTS?.map((item) => (
            <Pressable
              key={item.value}
              onPress={() => props.setIntent(item.value as Intent)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-xl border ${
                props.intent === item.value
                  ? "bg-primary/10 border-primary/40"
                  : "bg-background border-secondary/15"
              }`}
            >
              <FontAwesome6
                name={item.icon as any}
                size={11}
                color={
                  props.intent === item.value ? colors.primary : colors.secondary
                }
              />
              <Text
                className={`text-sm font-semibold ${
                  props.intent === item.value ? "text-primary" : "text-text"
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Field>

      <Field label={`Categories  ·  ${props.categories.length} selected`}>
        <View className="flex-row flex-wrap gap-2">
          {CATEGORIES?.map((cat) => {
            const sel = props.categories.includes(cat.value);
            return (
              <Pressable
                key={cat.value}
                onPress={() => toggleCategory(cat.value)}
                className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${
                  sel
                    ? "bg-primary/10 border-primary/40"
                    : "bg-background border-secondary/15"
                }`}
              >
                <FontAwesome6
                  name={cat.icon as any}
                  size={11}
                  color={sel ? colors.primary : colors.secondary}
                />
                <Text
                  className={`text-xs font-medium ${
                    sel ? "text-primary" : "text-text/70"
                  }`}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <SaveButton onPress={props.save} loading={props.loading} />
    </Animated.View>
  );
}