import React from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';

const TypingIndicator = () => {
  return (
    <View className="flex-row items-center gap-1 bg-gray-100 rounded-[18px] rounded-bl-[5px] px-3.5 py-4 w-16 mt-2">
      {[0, 150, 300].map((delay, index) => (
        <MotiView
          key={index}
          from={{ translateY: 0 }}
          animate={{ translateY: -5 }}
          transition={{
            type: 'timing',
            duration: 400,
            loop: true,
            repeatReverse: true,
            delay: delay,
          }}
          className="w-1.5 h-1.5 rounded-full bg-secondary"
        />
      ))}
    </View>
  );
};

export default TypingIndicator;