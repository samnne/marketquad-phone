
import "expo-sqlite/localStorage/install";

export const db = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      console.warn("db.getItem failed:", err);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      console.warn("db.setItem failed:", err);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn("db.removeItem failed:", err);
    }
  },
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (err) {
      console.warn("db.clear failed:", err);
    }
  },
};

export const STORAGE_KEY = "user_preferences";