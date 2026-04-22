type PublicUser = {
  uid: string;
  name: string;
  profileURL: string;
  createdAt: string;
  rating: number;
  hidden: boolean;
};
declare module "*.mp4" {
  const src: string;
  export default src;
}
type Intent = "buying" | "selling" | "both";

type Review = {
  rid: string;
  rating: number;
  comment: string | null;
  role: "BUYER" | "SELLER";
  createdAt: string;
  reviewer: {
    uid: string;
    name: string;
    profileURL: string;
  } | null;
};

type Listing = {
  lid: string;
  title: string;
  price: number;
  imageUrls: string[];
  condition: string | null;
  category: string | null;
  createdAt: string;
  sold: boolean;
  archived: boolean;
  views: number;
};

type ProfileData = {
  uid: string;
  name: string;
  username: string;
  profileURL: string | null;
  bio: string | null;
  faculty: string | null;
  year: number | null;
  intent: "buying" | "selling" | "both" | null;
  category_interests: string[];
  isVerified: boolean;
  rating: number;
  hidden: boolean;
  createdAt: string;
  listings: Listing[];
  reviewsReceived: Review[];
};