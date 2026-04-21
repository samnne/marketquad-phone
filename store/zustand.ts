import { Conversation, Listing, User, UserPreferences } from "@/type";
import { create, StoreApi, UseBoundStore } from "zustand";

import { db, STORAGE_KEY } from "@/db/db";

type TYPEAUTH=  
   "sign-in" | "sign-up" | "otp"

export interface Store {
  type: TYPEAUTH;
  changeType: (newType: TYPEAUTH) => void;
}
export const useType: UseBoundStore<StoreApi<Store>> = create((set) => {
  const store: Store = {
    type: "sign-in",
    changeType: (newType: TYPEAUTH) => set({ type: newType }),
  };
  return { ...store };
});

export type ListingStore = {
  listings: Listing[];
  setListings: Function;
  selectedListing?: Listing | null;
  setSelectedListing: Function;
  reset: Function;
};

export const useListings: UseBoundStore<StoreApi<ListingStore>> = create(
  (set) => {
    return {
      listings: [] as Listing[],
      setListings: (listings: Listing[]) => set({ listings: listings }),
      selectedListing: null,
      setSelectedListing: (listing: Listing) =>
        set({ selectedListing: listing }),
      reset: () => set({ listings: [], selectedListing: null }),
    };
  },
);

export type UserState = {
  user: User | null;
  setUser: Function;
  userListings: Listing[];
  setUserListings: Function;
  reset: Function;
  preferences: UserPreferences | null;
  setPreferences: (p: UserPreferences | null) => void;
};
export const useUser: UseBoundStore<StoreApi<UserState>> = create((set) => {
  return {
    user: null,
    setUser: (user: User) => set({ user: user }),
    userListings: [],
    setUserListings: (listings: Listing[]) => set({ userListings: listings }),
    reset: () => set({ user: null, userListings: [] }),
    preferences: null,
    setPreferences: (pref: UserPreferences | null) => set({ preferences: pref }),
  };
});

export type MessagePopUp = {
  error: boolean;
  success: boolean;
  setSuccess: Function;
  setError: Function;
  msg: string;
  setMessage: Function;
};

export const useMessage: UseBoundStore<StoreApi<MessagePopUp>> = create(
  (set) => {
    return {
      error: false,
      success: false,
      msg: "",
      setSuccess: (success: boolean) => set({ success: success }),
      setError: (error: boolean) => set({ error: error }),
      setMessage: (msg: string) => set({ msg: msg }),
    };
  },
);

export const useTabStore = create<{
  tabIndex: number;
  setTabIndex: (i: number) => void;
}>((set) => ({
  tabIndex: 0,
  setTabIndex: (tabIndex) => set({ tabIndex }),
}));
// store/zustand.ts — inside useConvos
type ConvosState = {
  convos: Conversation[];
  selectedConvo: Conversation | null;
  setConvos: (convos: Conversation[]) => void;
  setSelectedConvo: (convo: Conversation) => void;
  removeConvo: (cid: string) => void; // ← add this
  reset: () => void;
};

export const useConvos = create<ConvosState>((set) => ({
  convos: [],
  selectedConvo: null,
  setConvos: (convos) => set({ convos }),
  setSelectedConvo: (convo) => set({ selectedConvo: convo }),
  removeConvo: (cid) => {
   
    return set((state) => {
     
      return {
        convos: state.convos.filter((c) => c.cid !== cid),
      };
    });
  },
  reset: () => set({ convos: [], selectedConvo: null }),
}));
export interface ReviewModalState {
  reviewModal: boolean;
  setReviewModal: Function;
  makeReview: boolean;
  setMakeAReview: Function;
  reset: Function;
}

export const useReviewModal: UseBoundStore<StoreApi<ReviewModalState>> = create(
  (set) => {
    return {
      reviewModal: false,
      setReviewModal: (show: boolean) =>
        set({
          reviewModal: show,
        }),
      makeReview: false,
      setMakeAReview: (show: boolean) => set({ makeReview: show }),
      reset: () => set({ reviewModal: false, makeReview: false }),
    };
  },
);

type Prefs = {
  defaultCategory: string | null;
  defaultCondition: string | null;
  defaultLocation: string | null;
  defaultLat: number | null;
  defaultLng: number | null;
};

type PrefsState = {
  prefs: Prefs;
  prefsLoaded: boolean;

  setPrefs: (prefs: Partial<Prefs>) => void;
  loadPrefs: () => void;
  savePrefs: () => void;
  resetPrefs: () => void;
  updatePref: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void;
};

const DEFAULT_PREFS: Prefs = {
  defaultCategory: null,
  defaultCondition: null,
  defaultLocation: null,
  defaultLat: null,
  defaultLng: null,
};

export const usePrefs = create<PrefsState>((set, get) => ({
  prefs: DEFAULT_PREFS,
  prefsLoaded: false,

  loadPrefs: () => {
    try {
      const stored = db.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Prefs;
        set({ prefs: { ...DEFAULT_PREFS, ...parsed }, prefsLoaded: true });
      } else {
        set({ prefsLoaded: true });
      }
    } catch (err) {
      console.error("loadPrefs failed:", err);
      set({ prefsLoaded: true });
    }
  },

  savePrefs: () => {
    try {
      const { prefs } = get();
      db.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (err) {
      console.error("savePrefs failed:", err);
    }
  },

  setPrefs: (incoming) => {
    set((state) => ({
      prefs: { ...state.prefs, ...incoming },
    }));
  },

  updatePref: (key, value) => {
    set((state) => ({
      prefs: { ...state.prefs, [key]: value },
    }));
  },

  resetPrefs: () => {
    db.removeItem(STORAGE_KEY);
    set({ prefs: DEFAULT_PREFS });
  },
}));
