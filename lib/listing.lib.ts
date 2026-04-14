import { BASE_URL } from "@/constants/constants";

export const safeJson = async (response: Response) => {
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  if (!text || text.trim() === "") return null;

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Failed to parse JSON response: "${text.slice(0, 100)}"`);
  }
};

export const getClientListings = async () => {
  const response = await fetch(`${BASE_URL}/api/listings`, {});

  return safeJson(response);
};
export const getUserListings = async (uid: string) => {
  const response = await fetch(`${BASE_URL}/api/account`, {
    method: "POST",
    headers: {
      Authorization: uid,
    },
    body: JSON.stringify({ uid }),
  });

  return safeJson(response);
};
export const getClientListingsWithCategory = async (cat: string) => {
  const response = await fetch(
    `${BASE_URL}/api/listings/search?cat=${cat}`,
    {},
  );

  return safeJson(response);
};
export const getClientListingsNotUsers = async (uid: string) => {
  const response = await fetch(`${BASE_URL}/api/listings`, {
    headers: {
      Authorization: uid,
    },
    method: "GET",
  });

  return safeJson(response);
};
export const newListingAction = async (
  newListing: listingFormData,
  sellerId: string,
) => {
  const response = await fetch(`${BASE_URL}/api/listings`, {
    method: "POST",
    headers: {
      Authorization: sellerId,
    },
    body: JSON.stringify({ ...newListing, sellerId }),
  });

  return safeJson(response);
};
export const editListingAction = async (
  listingToEdit: listingFormData,
  sellerId: string,
) => {
  const response = await fetch(
    `${BASE_URL}/api/listings/${listingToEdit.lid}`,
    {
      headers: {
        Authorization: sellerId,
      },
      method: "PUT",
      body: JSON.stringify({ ...listingToEdit, sellerId }),
    },
  );

  return safeJson(response);
};

export const deleteListingAction = async (lid: string, sellerId: string) => {
  if (!sellerId) return;
  const response = await fetch(`${BASE_URL}/api/listings/${lid}`, {
    headers: {
      Authorization: sellerId,
    },
    method: "DELETE",
  });

  return safeJson(response);
};
