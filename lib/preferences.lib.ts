import { BASE_URL } from "@/constants/constants";

export type PreferencesPayload = {
  defaultCategory?: string | null;
  defaultCondition?: string | null;
  defaultLocation?: string | null;
  defaultLat?: number | null;
  defaultLng?: number | null;
};

export async function getPreferences(userId: string) {
  try {
    const preferences = await fetch(`${BASE_URL}/api/account/prefs`, {
      headers: {
        Authorization: userId
      }
    }).then(
      (res) => res.json(),
    );
    return { success: true, preferences: preferences.preferences };
  } catch (err) {
    console.error("Error fetching preferences:", err);
    return { success: false, preferences: null };
  }
}

export async function upsertPreferences(
  userId: string,
  data: PreferencesPayload,
) {
  try {
    const preferences = await fetch(`${BASE_URL}/api/account/prefs`, {
        method: "put"
    }).then(
      (res) => res.json(),
    );
    return { success: true, preferences };
  } catch (err) {
    console.error("Error upserting preferences:", err);
    return { success: false, preferences: null };
  }
}
