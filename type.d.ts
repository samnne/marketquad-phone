type PublicUser = {
  uid: string;
  name: string;
  profileURL: string;
  createdAt: string;
  rating: number;
  hidden: boolean;
  email: string;
  likes: [{ listingId: string }];
};

type ConvosState = {
  convos: Conversation[];
  selectedConvo: Conversation | null;
  setConvos: (convos: Conversation[]) => void;
  setSelectedConvo: (convo: Conversation) => void;
  removeConvo: (cid: string) => void; // ← add this
  reset: () => void;
};

type Conversation = {
  cid: string;
  listing: Listing;
  buyerId: string;
  sellerId: string;
  buyer: ProfileData;
  seller: ProfileData;
  listingId: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
  unreadCount: number;
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
  revieweeId: string;
  reviewerId: string;
  reviewer: {
    uid: string;
    name: string;
    profileURL: string;
  } | null;
};

type Message = {
  mid: string;
  text: string;
  senderId: string;
  createdAt: Date;
};

type Listing = {
  lid: string;
  title: string;
  price: number;
  imageUrls: string[];
  condition: string;
  category: string;
  createdAt: string;
  sold: boolean;
  archived: boolean;
  views: number;
  description: string;
  sellerId: string;
  seller: { name: string; profileURL: string; username: string; email: string };
  likes: [];
  conversations: Conversation[];
  _count: { likes: number };
};
type listingFormData = {
  condition: string;
  title: string;
  latitude?: number;
  longitude?: number;
  description: string;
  price: number;
  imageUrls: File[] | string[];
  sellerId: string;
  views?: number;
  category: string;
};

type BlockedUser = {
  id: string;
  blockerId: string;
  blockedId: string;

  createdAt: Date;
  blocker: ProfileData;
  blocked: ProfileData;
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
  notif_messages: boolean;
  notif_listings: boolean;
  notif_sales: boolean;
  Blocker: BlockedUser[];
};
