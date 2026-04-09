import { styled } from "nativewind";
import React from "react";
import { View } from "react-native-reanimated/lib/typescript/Animated";
import {
    SafeAreaView as RNSAV,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
const SafeAreaView = styled(RNSAV);

const index = () => {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView className="flex-1 p-8">
      <View className="flex-1 items-center-justify-center w-full max-w-sm my-8 bg-primary"></View>
    </SafeAreaView>
  );
};

export default index;
