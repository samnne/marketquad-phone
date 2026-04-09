import { tabs } from "@/constants/constants";
import { useTabStore } from "@/store/zustand";

export const TAB_ORDER = tabs.map((tab) => {
  if (tab.name === "home") {
    return "/home";
  }

  return `/${tab.name}`;
}); // match your actual routes
// hooks/useTabDirection.ts

export function useTabDirection(currentPath: string) {
  const { tabIndex, setTabIndex } = useTabStore();
  const currentIndex = TAB_ORDER.findIndex((t) => currentPath.startsWith(t));
  const direction = currentIndex >= tabIndex ? "right" : "left";
  return { direction, currentIndex, setTabIndex };
}
