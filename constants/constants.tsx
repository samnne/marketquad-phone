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

export const FACULTIES = [
  { label: "Engineering & Computer Science", icon: "microchip" },
  { label: "Science", icon: "flask" },
  { label: "Business", icon: "briefcase" },
  { label: "Fine Arts", icon: "palette" },
  { label: "Social Sciences", icon: "people-group" },
  { label: "Law", icon: "scale-balanced" },
  { label: "Education", icon: "book-open" },
  { label: "Medicine", icon: "stethoscope" },
  { label: "Humanities", icon: "landmark" },
] as const;
export const YEARS = [
  { label: "1st year", value: 1 },
  { label: "2nd year", value: 2 },
  { label: "3rd year", value: 3 },
  { label: "4th year", value: 4 },
  { label: "5th year+", value: 5 },
  { label: "Graduate", value: 6 },
] as const;



export const newSingle = {
  name: "new",
  title: "New",
  icon: ({ color }: { color: string }) => (
    <MaterialIcons name="add" size={16} color={color} />
  ),
};
export const INTENTS: {
  value: Intent;
  label: string;
  tagline: string;
  icon: string;
  perks: string[];
}[] = [
  {
    value: "buying",
    label: "Buying",
    tagline: "I'm looking for deals",
    icon: "bag-shopping",
    perks: [
      "Browse listings near you",
      "Get alerts on new drops",
      "Save items to wishlist",
    ],
  },
  {
    value: "selling",
    label: "Selling",
    tagline: "I've got stuff to offload",
    icon: "tag",
    perks: [
      "List in under 2 minutes",
      "Reach 10k+ UVic students",
      "Get paid fast",
    ],
  },
  {
    value: "both",
    label: "Both",
    tagline: "I want the full experience",
    icon: "arrows-left-right",
    perks: [
      "Everything from Buying",
      "Everything from Selling",
      "Personalised home feed",
    ],
  },
];


export const categories: { value: string; label: string; icon: string }[] = [
  { value: "textbooks",    label: "Textbooks",      icon: "book"           },
  { value: "electronics",  label: "Electronics",    icon: "laptop"         },
  { value: "furniture",    label: "Furniture",      icon: "couch"          },
  { value: "clothing",     label: "Clothing",       icon: "shirt"          },
  { value: "bikes",        label: "Bikes",          icon: "bicycle"        },
  { value: "kitchen",      label: "Kitchen",        icon: "utensils"       },
  { value: "sports",       label: "Sports & Fitness", icon: "dumbbell"     },
  { value: "music",        label: "Instruments",    icon: "guitar"         },
  { value: "gaming",       label: "Gaming",         icon: "gamepad"        },
  { value: "stationery",   label: "Stationery",     icon: "pencil"         },
  { value: "room",         label: "Room Decor",     icon: "lamp"           },
  { value: "tickets",      label: "Tickets & Events", icon: "ticket"       },
  { value: "transport",    label: "Transport",      icon: "car"            },
  { value: "other",        label: "Other",          icon: "box-open"       },
];


export const condition = [
  "New",
  "Used - Good",
  "Used - Fair",
  "Used - Poor",
  "Used - New",
  "Broken",
];
