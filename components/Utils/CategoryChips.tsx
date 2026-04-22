import { Text, Pressable } from "react-native";

import { categories } from "@/constants/constants";
import { ScrollView, View } from "moti";

const CategoryChips = ({
  activeCategory,
  setActiveCategory,
}: {
  activeCategory: string;
  setActiveCategory: (val: string) => void;
}) => {
  return (
    <View  className="flex-row items-center pr-2.5 mb-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        className="flex-1"
      >
        {[...categories].map((cat) => {
          const on = activeCategory === cat.label;
          return (
            <Pressable
              key={cat.value}
              id={cat.value}
              onPress={() => setActiveCategory(cat.label)}
              className={`px-4 py-1.5 rounded-xl border ${on ? "bg-primary border-primary" : "bg-pill border-background"}`}
            >
              <Text
                className={`text-lg font-bold ${on ? "text-pill" : "text-text/50"}`}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default CategoryChips;
