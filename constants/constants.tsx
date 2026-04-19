import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
export const UVIC_LNG_LAT: number[] & LngLatLike = [-123.312603, 48.463816];
export const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export const tabs = [
  {
    name: "home",
    title: "Home",
    icon: ({ color }: { color: string }) => (
      <FontAwesome5 name="home" size={16} color={color} />
    ),
  },
  {
    name: "listings",
    title: "Listings",
    icon: ({ color }: { color: string }) => (
      <AntDesign name="shopping-cart" size={16} color={color} />
    ),
  },
  {
    name: "convos",
    title: "Messages",
    icon: ({ color }: { color: string }) => (
      <FontAwesome6 name="inbox" size={16} color={color} />
    ),
  },
  {
    name: "profile",
    title: "Profile",
    icon: ({ color }: { color: string }) => (
      <Ionicons name="person-circle-outline" size={16} color={color} />
    ),
  },
];
export const newSingle = {
  name: "new",
  title: "New",
  icon: ({ color }: { color: string }) => (
    <MaterialIcons name="add" size={16} color={color} />
  ),
};

export const categories = [
  "All",
  "Textbooks",
  "Tech",
  "Housing",
  "Dorm",
  "Clothes",
  "Sports",
  "Leisure",
  "School",
];
export const condition = [
  "New",
  "Used - Good",
  "Used - Fair",
  "Used - Poor",
  "Used - New",
  "Broken",
];
