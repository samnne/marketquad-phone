import { BASE_URL } from "@/constants/constants";
import { getUserSupabase } from "@/utils/functions";

interface NewConvo {
  listingId: string;
  buyerId: string;
  sellerId: string;
  initialMessage: string; // just pass the text
}

export async function getConvo(cid: string) {
  const { user } = await getUserSupabase();

  if (!user) return;
  const response = await fetch(`${BASE_URL}/api/conversations/${cid}`, {
    headers: {
      Authorization: user?.id,
    },
    method: "GET",
  }).then((res) => res.json());

  if (!response) return false;
  return response.convo;
}

export async function createConvo(
  { listingId, buyerId, sellerId, initialMessage }: NewConvo,
  existing = null,
) {

  const convo = await fetch(`${BASE_URL}/api/conversations`, {
    headers: {
      Authorization: buyerId,
    },
    body: JSON.stringify({
      listingId,
      buyerId,
      sellerId,
      initialMessage,
      existing,
    }),
    method: "POST",
  }).then((res) => res.json());
  
  return convo;
}

export async function getConvos(uid: string) {
  const convos = await fetch(`${BASE_URL}/api/conversations`, {
    headers: {
      Authorization: uid,
    },
  }).then((res) => res.json());

  if (!convos) return false;
  return convos.convos;
}
