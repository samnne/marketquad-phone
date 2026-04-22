import React from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';

const TypingIndicator = () => {
  return (
    <View className="flex-row items-center gap-1 px-4 py-3 max-w-70 rounded-[18px] bg-primary/25 rounded-bl-[5px]  w-16 mt-2">
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
            delay: delay * index,
          }}
          className="w-1.5 h-1.5 rounded-full bg-secondary"
        />
      ))}
    </View>
  );
};

export default TypingIndicator;