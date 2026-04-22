import { BASE_URL } from "@/constants/constants";
import { getUserSupabase } from "@/utils/functions";
import { useState } from "react";

export function useLike(
  listingId: string,
  initialLiked: boolean,
  initialCount: number,
) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (loading) return;
    // optimistic update
    setLiked((prev) => !prev);
    setCount((prev) => (liked ? prev - 1 : prev + 1));
    setLoading(true);

    try {
      const { user } = await getUserSupabase();
      const res = await fetch(`${BASE_URL}/api/listings/${listingId}/like`, {
        method: "POST",
        headers: { Authorization: user?.id! },
      });
      const data = await res.json();
      
      // reconcile with server truth
      setLiked(data.liked);
    } catch {
      // rollback on failure
      setLiked((prev) => !prev);
      setCount((prev) => (liked ? prev + 1 : prev - 1));
    } finally {
      setLoading(false);
    }
  };

  return { liked, count, toggle, loading };
}
