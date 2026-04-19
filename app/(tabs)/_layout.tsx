import { HapticTab } from "@/components/HapticTab";
import CustomHeader from "@/components/Headers/TopHeader";
import { newSingle, tabs } from "@/constants/constants";
import { colors, components } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import { TAB_ORDER } from "@/hooks/useTabDirection";
import { useMessage, usePrefs, useTabStore } from "@/store/zustand";
import { TabIconProps } from "@/type";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AnimatePresence, Text } from "moti";
import React, { ReactNode, useEffect } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SuccessMessage from "@/components/Modals/SuccessMessage";
import ErrorMessage from "@/components/Modals/ErrorMessage";

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { setTabIndex } = useTabStore();

  const mainRoutes = state.routes.filter((r) => r.name !== newSingle.name);
  const newRoute = state.routes.find((r) => r.name === newSingle.name);
  const newIndex = state.routes.findIndex((r) => r.name === newSingle.name);

  const handlePress = (route: (typeof state.routes)[number], index: number) => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented && state.index !== index) {
      navigation.navigate(route.name);
    }
    const tabIndex = TAB_ORDER.findIndex(
      (t) => t === `/${route.name}` || (route.name === "home" && t === "/home"),
    );
    if (tabIndex !== -1) setTabIndex(tabIndex);
    return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View
      style={{
        position: "absolute",
        bottom: Math.max(insets.bottom, 12),
        left: 16,
        right: 16,
        height: 80,
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 10,
      }}
    >
      {/* ── Pill: 4 main tabs ── */}
      <View
        className=""
        style={{
          flex: 1,
          height: 65,
          backgroundColor: colors.pill,
          borderRadius: 28,

          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-around",

          paddingVertical: 15,
          borderWidth: 0.5,
          borderColor: "rgba(0,0,0,0.08)",
        }}
      >
        {mainRoutes.map((route, i) => {
          const focused = state.index === state.routes.indexOf(route);
          const tab = tabs.find((t) => t.name === route.name);
          if (!tab) return null;

          return (
            <Pressable
              key={route.key}
              onPress={() => handlePress(route, state.routes.indexOf(route))}
              style={{ flex: 1, alignItems: "center", gap: 4 }}
            >
              {tab.icon({ color: focused ? colors.primary : colors.text })}
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: focused ? "600" : "400",
                  color: focused ? colors.primary : colors.text,
                }}
              >
                {tab.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Circle: New tab ── */}
      {newRoute && (
        <Pressable
          onPress={() => handlePress(newRoute, newIndex)}
          style={{
            width: 65,
            height: 65,
            borderRadius: 32,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            // lift it slightly above the pill
            marginBottom: 2,
            borderWidth: 3,
            borderColor: colors.background, // cuts it out from the bg
          }}
        >
          {newSingle.icon({ color: "#fff" })}
          <Text style={{ fontSize: 9, color: "#fff", fontWeight: "600" }}>
            {newSingle.title}
          </Text>
        </Pressable>
      )}
      <StatusBar style="dark" />
    </View>
  );
}

const TabsLayout = () => {
  const insets = useSafeAreaInsets();
  const tabBar = components.tabBar;
  const { setTabIndex } = useTabStore();
  const { loadPrefs } = usePrefs();
  const { success, error, msg } = useMessage();
  useEffect(() => {
    loadPrefs();
  }, []);

  function TabIcon({ focused, icon, title }: TabIconProps): ReactNode {
    return (
      <View className={`size-30  items-center pb-2  justify-center`}>
        <View className={`  size-10 items-center justify-center rounded-full`}>
          {icon({ color: focused ? colors.primary : colors.text })}
        </View>
        <Text
          className={`text-xs  ${focused ? "text-primary" : "text-text"} mb-5 font-semibold `}
        >
          {title}
        </Text>
        <View>
          <StatusBar style="dark" />
        </View>
      </View>
    );
  }

  return (
    <>
      <AnimatePresence>
        {success && <SuccessMessage message={msg} />}
        {error && <ErrorMessage message={msg} />}
      </AnimatePresence>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: true,
          header: () => <CustomHeader />,
          tabBarShowLabel: false,
          tabBarButton: (props) => <HapticTab {...props} />,
          tabBarStyle: {
            position: "absolute",
            bottom: Math.max(insets.bottom, tabBar.horizontalInset),
            height: tabBar.height,
            marginHorizontal: tabBar.horizontalInset,
            borderRadius: tabBar.radius,
            backgroundColor: "transparent",
            borderTopWidth: 0,
            elevation: 0,
          },
          tabBarItemStyle: {
            marginVertical: 5, // 3. Nudge items to center or push up
          },
          animation: "shift",
          tabBarIconStyle: {
            width: tabBar.iconFrame,

            height: tabBar.height,
            alignItems: "center",
          },
        }}
        screenListeners={{
          tabPress: (e) => {
            const route = e.target?.split("-")[0]; // expo-router target format
            const index = TAB_ORDER.findIndex(
              (t) => t === `/${route}` || (route === "home" && t === "/home"),
            );
            if (index !== -1) setTabIndex(index);
          },
        }}
      >
        {tabs.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ focused }) => (
                <TabIcon focused={focused} icon={tab.icon} title={tab.title} />
              ),
            }}
          />
        ))}
        <Tabs.Screen
          key={newSingle.name}
          name={newSingle.name}
          options={{
            title: newSingle.title,
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                icon={newSingle.icon}
                title={newSingle.title}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
};

export default TabsLayout;
