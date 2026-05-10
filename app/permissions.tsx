import { View, Text, Pressable, Alert, Linking } from 'react-native'
import React from 'react'
import { SafeAreaView as RNSAV } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { colors } from '@/constants/theme'
import { styled } from 'nativewind'
import * as Notifications from 'expo-notifications'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'

const SafeAreaView = styled(RNSAV)

const PERMISSION_CONFIG = {
  noti: {
    icon: 'notifications' as const,
    iconColor: colors.secondary,
    iconBg: 'bg-secondary/15',
    title: 'Allow notifications',
    description:
      "We'll notify you when someone messages you, makes an offer, or your listing gets a new view.",
  },
  photo: {
    icon: 'images' as const,
    iconColor: colors.accent,
    iconBg: 'bg-accent/15',
    title: 'Allow photo access',
    description:
      "We'll need access to your photo library so you can upload images to your listings and profile.",
  },
}

const Permissions = () => {
  const { type, next } = useLocalSearchParams<{
    type: 'noti' | 'photo'
    next?: string
  }>()
  const router = useRouter()
  const config = PERMISSION_CONFIG[type ?? 'photo']

  const openSettings = () => {
    Alert.alert(
      'Permission Required',
      `To enable this, please go to Settings and allow MarketQuad to access your ${type === 'noti' ? 'notifications' : 'photos'}.`,
      [
        { text: 'Not now', style: 'cancel', onPress: () => advance() },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    )
  }

  const advance = () => {
    if (next) {
      router.replace(next as any)
    } else {
      router.back()
    }
  }

  const handleNext = async () => {
    if (type === 'noti') {
      const { status: existing } = await Notifications.getPermissionsAsync()
   
      if (existing === 'granted') { advance(); return }
      if (existing === 'denied') { openSettings(); return }
      const { status } = await Notifications.requestPermissionsAsync()
      status === 'granted' ? advance() : openSettings()
    }

    if (type === 'photo') {
      const { status: existing } = await ImagePicker.getMediaLibraryPermissionsAsync()
      if (existing === 'granted') { advance(); return }
      if (existing === 'denied') { openSettings(); return }
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      status === 'granted' ? advance() : openSettings()
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-8 justify-center items-center gap-10">

        {/* Illustration area */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(0).springify()}
          className="items-center"
        >
          <View className="relative w-56 h-56 items-center justify-center">
            <View className="absolute w-56 h-56 rounded-full border border-primary/10" />
            <View className="absolute w-40 h-40 rounded-full border border-primary/15" />

            <View className="absolute top-3 right-8 w-2.5 h-2.5 rounded-full bg-secondary/50" />
            <View className="absolute top-10 right-3 w-1.5 h-1.5 rounded-full bg-accent/50" />
            <View className="absolute bottom-6 left-6 w-2 h-2 rounded-full bg-primary/40" />
            <View className="absolute bottom-12 left-2 w-1.5 h-1.5 rounded-full bg-secondary/30" />

            <View
              className={`w-32 h-32 rounded-[40px] ${config.iconBg} items-center justify-center`}
              style={{
                shadowColor: config.iconColor,
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.2,
                shadowRadius: 24,
                elevation: 8,
              }}
            >
              <Ionicons
                name={config.icon}
                size={56}
                color={config.iconColor}
              />
            </View>
          </View>
        </Animated.View>

        {/* Text content */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(100).springify()}
          className="items-center gap-3"
        >
          <Text className="text-[26px] font-bold text-text text-center leading-tight">
            {config.title}
          </Text>
          <Text className="text-[15px] text-text/50 text-center leading-relaxed px-4">
            {config.description}
          </Text>
        </Animated.View>

        {/* Actions */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(200).springify()}
          className="w-full gap-4"
        >
          <Pressable
            onPress={handleNext}
            className="w-full bg-primary rounded-2xl py-4 items-center active:opacity-80"
            style={{
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 6,
            }}
          >
            <Text className="text-white text-[16px] font-bold tracking-wide">
              Next
            </Text>
          </Pressable>
        </Animated.View>

      </View>
    </SafeAreaView>
  )
}

export default Permissions