import { View, Text } from "react-native";
import React from "react";

const MarketQuad = ({className}: {className: string}) => {
  return (
    <Text className={className}>
      Market<Text className="text-secondary">Quad</Text>
    </Text>
  );
};

export default MarketQuad;
