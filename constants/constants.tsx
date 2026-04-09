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
    icon: <FontAwesome5 name="home" size={24} color="black" />,
  },
  {
    name: "listings",
    title: "Listings",
    icon: <AntDesign name="shopping-cart" size={24} color="black" />,
  },
  {
    name: "new",
    title: "New",
    icon: <MaterialIcons name="add" size={24} color="black" />,
  },
  {
    name: "convos",
    title: "Conversations",
    icon: <FontAwesome6 name="inbox" size={24} color="black" />,
  },
  {
    name: "profile",
    title: "Profile",
    icon: <Ionicons name="person-circle-outline" size={24} color="black" />,
  },
];

export const categories = [
  "All",
  "Textbooks",
  "Electronics",
  "Housing",
  "Notes",
  "Clothes",
  "Sports",
];
export const condition = [
  "New",
  "Used - Good",
  "Used - Fair",
  "Used - Poor",
  "Used - New",
  "Broken",
];
