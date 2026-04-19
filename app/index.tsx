import { colors } from "@/constants/theme";
import Feather from "@expo/vector-icons/Feather";
import { styled } from "nativewind";
import React, { useState } from "react";
import { Pressable, Text, TouchableOpacity } from "react-native";
import {
  SafeAreaView as RNSAV,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { db } from "@/db/db";
import { Redirect, useRouter } from "expo-router";
import { AnimatePresence, MotiView, useAnimationState, View } from "moti";
const SafeAreaView = styled(RNSAV);

interface OnboardingStep {
  id: number;
  headline: string;
  body: string;
  icon: React.ReactNode;
  color: string;
}
const icons = [
  <Feather key={20} name="shopping-bag" size={64} color={colors.primary} />,
  <Feather key={21} name="search" size={64} color={colors.secondary} />,
  <Feather key={22} name="dollar-sign" size={64} color={colors.accent} />,
  <Feather key={23} name="shield" size={64} color={colors.primary} />,
  <Feather key={24} name="airplay" size={64} color={colors.secondary} />,
];
const STEPS: OnboardingStep[] = [
  {
    id: 1,
    headline: "Welcome to your UVic Marketplace.",
    body: "The easiest way to buy and sell with fellow vikes, right on campus.",
    icon: icons[0],
    color: "bg-primary",
  },
  {
    id: 2,
    headline: "Find what you need, fast.",
    body: "Score deals on textbooks, dorm essentials, electronics, and notes from students who took the class last semester.",
    icon: icons[1],
    color: "bg-secondary",
  },
  {
    id: 3,
    headline: "Turn clutter into cash.",
    body: "Snap a photo, set a price, and list your items in seconds. Meet up on campus—no shipping required.",
    icon: icons[2],
    color: "bg-accent",
  },
  {
    id: 4,
    headline: "Safe, verified, and student-only.",
    body: "Every user is verified with a valid @uvic email address. You always know you are dealing with a real student.",
    icon: icons[3],
    color: "bg-primary",
  },
  {
    id: 5,
    headline: "Ready to join the campus hustle?",
    body: "Let’s get your account set up so you can start browsing.",
    icon: icons[4],
    color: "bg-secondary",
  },
];
const ONBOARDING_KEY = "ONBOARDING";
const ONBOARDING_VALUE = "true";
STEPS.forEach((step, index) => {
  step.icon = icons[index];
});
const Index = () => {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [pressed, setPressed] = useState(false);
  const router = useRouter();
  const buttonAnimState = useAnimationState({
    from: { width: "0%", opacity: 0 },
    hidden: { width: "0%", opacity: 0 },
    visible: { width: "33%", opacity: 1 },
  });

  const val = db.getItem(ONBOARDING_KEY);
  if (val === ONBOARDING_VALUE) {
    return <Redirect href={"/home"} />;
  }

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setDirection(1); // sliding left = next
      setCurrentStep((prev) => prev + 1);
      if (currentStep === 0) buttonAnimState.transitionTo("visible");
      if (currentStep + 1 === STEPS.length - 1)
        buttonAnimState.transitionTo("hidden");
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setDirection(-1); // sliding right = back
      setCurrentStep((prev) => prev - 1);
      if (currentStep === 1) buttonAnimState.transitionTo("hidden");
    }
  };

  function handleFinish() {
    db.setItem(ONBOARDING_KEY, "true");
    router.navigate("/(auth)/sign-up");
  }

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <SafeAreaView className="flex-1 justify-between p-8 bg-white">
      {/* Key change forces AnimatePresence to unmount old, mount new */}
      <AnimatePresence exitBeforeEnter>
        <MotiView
          key={currentStep}
          from={{
            opacity: 0,
            translateX: direction * 300, // enters from right (next) or left (back)
          }}
          animate={{
            opacity: 1,
            translateX: 0,
          }}
          exit={{
            opacity: 0,
            translateX: direction * -300, // exits to left (next) or right (back)
          }}
          transition={{
            type: "timing",

            duration: 500,
          }}
          className="flex-2 items-center w-full max-w-sm my-8"
        >
          <MotiView className="flex-1 gap-4 justify-center items-center">
            {step.icon}
            <View className="flex-row">
              <Text className="text-5xl font-bold text-primary">Market</Text>
              <Text className="text-5xl font-bold text-secondary">Quad</Text>
            </View>
            <Text className="text-3xl mt-4 text-text font-bold text-center">
              {step.headline}
            </Text>
          </MotiView>
          <View className="flex-1 gap-2 flex-wrap flex-row justify-center items-center">
            <Text className="text-center text-gray-500 text-xl w-3/4">
              {step.body}
            </Text>
          </View>
        </MotiView>
      </AnimatePresence>

      <View>
        <View className="flex-row gap-2 items-stretch">
          <MotiView
            state={buttonAnimState}
            transition={{ type: "timing" }}
            style={{ overflow: "hidden" }}
          >
            <Pressable
              onPress={prevStep}
              className="flex-1 rounded-2xl bg-accent px-6 py-4 justify-center items-center"
            >
              <Text className="font-bold text-white text-xl">← Back</Text>
            </Pressable>
          </MotiView>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={isLastStep ? handleFinish : nextStep}
            className="flex-1"
          >
            <View
              animate={{
                scale: pressed ? 0.95 : 1,
                opacity: pressed ? 0.9 : 1,
              }}
              transition={{ type: "timing" }}
              className="rounded-2xl shadow bg-primary px-6 py-4 justify-center items-center"
            >
              <Text className="font-bold text-white text-xl">
                {isLastStep ? "Get Started" : "Next"}{" "}
                <Feather name="arrow-right" size={20} color="white" />
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-row justify-center mt-4 gap-2">
        {STEPS.map((s, i) => (
          <View
            key={s.body}
            animate={{
              backgroundColor: currentStep === i ? colors.primary : "#99a1af",
            }}
            className="h-4 w-8 rounded-full"
          />
        ))}
      </View>
      <AnimatePresence exitBeforeEnter>
      {currentStep > 0 && (
          <View
            from={{
              opacity: 0,
              translateY: 10,
              translateX: 25,
            }}
            animate={{
              opacity: 1,
              translateX: 0,
              translateY: 0,
                
            }}
            exit={{
              opacity: 0,
              translateY: 10,
              translateX: 25,
            }}
            className="absolute right-10 top-20 "
            transition={{
              type: "spring",
              damping: 60,
          
            }}
          >
            <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-in")}
              activeOpacity={0.9}
              className="flex-row   justify-center mt-4 items-center"
            >
              <Text className="text-sm text-gray-400 p-1">Skip</Text>
            </TouchableOpacity>
          </View>
      )}
        </AnimatePresence>
    </SafeAreaView>
  );
};

export default Index;
