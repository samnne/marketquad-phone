import { HapticTab } from "@/components/HapticTab";
import { tabs } from "@/constants/constants";
import { colors, components } from "@/constants/theme";
import { TAB_ORDER } from "@/hooks/useTabDirection";
import { usePrefs, useTabStore } from "@/store/zustand";
import { TabIconProps } from "@/type";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { ReactNode, useEffect } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TabsLayout = () => {
  const insets = useSafeAreaInsets();
  const tabBar = components.tabBar;
  const { setTabIndex } = useTabStore();
  const { loadPrefs } = usePrefs();

  useEffect(() => {
    loadPrefs();
  }, []);

  function TabIcon({ focused, icon }: TabIconProps): ReactNode {
    return (
      <View className=" size-14 items-center justify-center">
        <View
          className={` size-14 items-center justify-center rounded-full ${
            focused ? "bg-primary" : "bg-pill"
          }`}
        >
          {icon}
        </View>
        <View>
          <StatusBar style="dark" />
        </View>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          bottom: insets.bottom,
          marginHorizontal: tabBar.horizontalInset,
          borderRadius: tabBar.radius,
          backgroundColor: colors.pill,
          elevation: 0,
          borderTopWidth: 0,
        },
        tabBarButton: (props) => <HapticTab {...props} />,

        tabBarItemStyle: {
          paddingVertical: tabBar.height / 2 - tabBar.iconFrame / 1.6,
        },
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
              <TabIcon focused={focused} icon={tab.icon} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
};

export default TabsLayout;
