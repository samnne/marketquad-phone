import { FACULTIES, YEARS } from "@/constants/constants";
import { colors } from "@/constants/theme";
import { Field, SaveButton } from "@/components/Onboarding";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { View, Text, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

type Props = {
  open: boolean;
  faculty: string | null;
  year: number | null;
  setFaculty: (v: string | null) => void;
  setYear: (v: number | null) => void;
  save: () => void;
  loading: boolean;
};

export default function StudentInfoSection(props: Props) {
  if (!props.open) return null;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(100)}
      className="px-4 pb-4 gap-4 border-t border-secondary/10"
    >
      <View className="h-3" />

      <Field label="Faculty">
        <View className="gap-2">
          {FACULTIES?.map((f) => (
            <Pressable
              key={f.label}
              onPress={() =>
                props.setFaculty(props.faculty === f.label ? null : f.label)
              }
              className={`flex-row items-center justify-between px-4 py-3 rounded-xl border ${
                props.faculty === f.label
                  ? "bg-primary/10 border-primary/40"
                  : "bg-background border-secondary/15"
              }`}
            >
              <Text
                className={`text-sm ${
                  props.faculty === f.label
                    ? "text-primary font-semibold"
                    : "text-text"
                }`}
              >
                {f.label}
              </Text>
              {props.faculty === f.label && (
                <FontAwesome6
                  name="circle-check"
                  size={14}
                  color={colors.primary}
                />
              )}
            </Pressable>
          ))}
        </View>
      </Field>

      <Field label="Year of study">
        <View className="flex-row flex-wrap gap-2">
          {YEARS?.map((y) => (
            <Pressable
              key={y.value}
              onPress={() =>
                props.setYear(props.year === y.value ? null : y.value)
              }
              className={`px-4 py-2.5 rounded-xl border ${
                props.year === y.value
                  ? "bg-primary/10 border-primary/40"
                  : "bg-background border-secondary/15"
              }`}
            >
              <Text
                className={`text-sm ${
                  props.year === y.value
                    ? "text-primary font-semibold"
                    : "text-text"
                }`}
              >
                {y.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Field>

      <SaveButton onPress={props.save} loading={props.loading} />
    </Animated.View>
  );
}