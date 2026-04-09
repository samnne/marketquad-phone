import { BASE_URL } from "@/constants/constants";

import plimit from "p-limit";
export async function getCloudinarySignature() {
  const res = await fetch(`${BASE_URL}/api/cloudinary`);
  return await res.json();
}
const limit = plimit(10);

export async function uploadImage(uri: string): Promise<string> {
  // Get signature from your backend
  const { timestamp, signature, cloudName, apiKey } =
    await getCloudinarySignature();
  console.log(timestamp, signature, cloudName);

  // Build form data
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
    console.error("Cloudinary upload failed:", data);
    throw new Error(data.error?.message ?? "Upload failed");
  }

  return data.secure_url;
}

export async function uploadImages(images: string[]): Promise<string[]> {
  const imagesToUpload = images.map(async (image) => {
    return limit(async () => {
      return await uploadImage(image);
      // const buffer = Buffer.from(await image.arrayBuffer());

      // return new Promise<string>((resolve, rej) => {
      //   cloudinary.uploader
      //     .upload_stream({ folder: "/uploads" }, (error, res) => {
      //       if (error || !res) return rej(error);
      //       resolve(res.secure_url);
      //     })
      //     .end(buffer);
      // });
    });
  });

  return Promise.all(imagesToUpload);
}
