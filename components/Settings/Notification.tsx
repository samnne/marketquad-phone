import { colors } from "@/constants/theme";
import { SaveButton } from "@/components/Onboarding";
import { View, Text, Switch } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

type Props = {
  open: boolean;
  notifMessages: boolean;
  notifListings: boolean;
  notifSales: boolean;
  setNotifMessages: (v: boolean) => void;
  setNotifListings: (v: boolean) => void;
  setNotifSales: (v: boolean) => void;
  save: () => void;
  loading: boolean;
};

export default function NotificationsSection(props: Props) {
  if (!props.open) return null;

  const rows = [
    {
      label: "Messages",
      sublabel: "When a buyer or seller messages you",
      value: props.notifMessages,
      setter: props.setNotifMessages,
    },
    {
      label: "New listings",
      sublabel: "Listings in your saved categories",
      value: props.notifListings,
      setter: props.setNotifListings,
    },
    {
      label: "Sales",
      sublabel: "When one of your items sells",
      value: props.notifSales,
      setter: props.setNotifSales,
    },
  ];

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(100)}
      className="pb-4 border-t border-secondary/10"
    >
      {rows.map((row, i) => (
        <View
          key={row.label}
          className={`flex-row items-center justify-between px-4 py-3.5 ${
            i < rows.length - 1 ? "border-b border-secondary/8" : ""
          }`}
        >
          <View className="flex-1 pr-4">
            <Text className="text-sm font-semibold text-text">{row.label}</Text>
            <Text className="text-xs text-secondary mt-0.5">{row.sublabel}</Text>
          </View>
          <Switch
            value={row.value}
            onValueChange={row.setter}
            trackColor={{
              false: colors.secondary + "30",
              true: colors.primary + "60",
            }}
            thumbColor={row.value ? colors.primary : colors.secondary}
          />
        </View>
      ))}
      <View className="px-4 pt-2">
        <SaveButton onPress={props.save} loading={props.loading} />
      </View>
    </Animated.View>
  );
}