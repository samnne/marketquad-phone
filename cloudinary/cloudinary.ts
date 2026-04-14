import { BASE_URL } from "@/constants/constants";

import plimit from "p-limit";
export async function getCloudinarySignature(uid) {
  const res = await fetch(`${BASE_URL}/api/cloudinary`, {
    headers: {
      Authorization: uid,
    },
  });

  return await res.json();
}

const limit = plimit(10);

export async function uploadImages(
  images: string[],
  uid: string,
): Promise<string[]> {
  const { timestamp, signature, cloudName, apiKey } =
    await getCloudinarySignature(uid);

  const imagesToUpload = images.map((image) =>
    limit(() =>
      uploadImage(image, { timestamp, signature, cloudName, apiKey }),
    ),
  );

  return Promise.all(imagesToUpload);
}

export async function uploadImage(
  uri: string,
  credentials?: {
    timestamp: string;
    signature: string;
    cloudName: string;
    apiKey: string;
  },
): Promise<string> {
  const { timestamp, signature, cloudName, apiKey } =
    credentials ?? (await getCloudinarySignature(uid));

  const formData = new FormData();
  formData.append("file", {
    uri,
    type: "image/jpeg",
    name: `upload_${Date.now()}.jpg`,
  } as any);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("api_key", apiKey);
  formData.append("folder", "listings");

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData },
  );

  const data = await uploadRes.json();

  if (!data.secure_url) {
    console.error("Cloudinary upload failed:", JSON.stringify(data));
    throw new Error(data.error?.message ?? "Upload failed");
  }

  return data.secure_url;
}
