type PublicUser = {
  uid: string;
  name: string;
  profileURL: string;
  createdAt: string;
  rating: number;
  hidden: boolean;
};

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
  profileURL: string;
  createdAt: string;
  rating: number;
  hidden: boolean;
  listings: Listing[];
  reviewsReceived: Review[];  // ← matches Prisma include key
};
