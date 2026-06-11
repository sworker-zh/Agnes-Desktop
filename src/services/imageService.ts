// ============================================================
// Image Service — Agnes-Image-2.1-Flash
// ============================================================

import { BASE_URL, getHeaders } from "./api";
import type { ImageResponse } from "@/types";

const MODEL = "agnes-image-2.1-flash";

/** Text-to-Image — returns URL */
export async function textToImageUrl(
  prompt: string,
  size: string = "1024x768"
): Promise<ImageResponse> {
  const res = await fetch(`${BASE_URL}/images/generations`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: MODEL,
      prompt,
      size,
      extra_body: { response_format: "url" },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Image API error: ${res.status}`);
  }
  return res.json();
}

/** Text-to-Image — returns Base64 */
export async function textToImageBase64(
  prompt: string,
  size: string = "1024x768"
): Promise<ImageResponse> {
  const res = await fetch(`${BASE_URL}/images/generations`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: MODEL,
      prompt,
      size,
      return_base64: true,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Image API error: ${res.status}`);
  }
  return res.json();
}

/** Image-to-Image — takes input URL, returns URL or Base64 */
export async function imageToImage(
  prompt: string,
  inputImageUrl: string,
  options?: {
    size?: string;
    responseFormat?: "url" | "b64_json";
  }
): Promise<ImageResponse> {
  const size = options?.size ?? "1024x768";
  const responseFormat = options?.responseFormat ?? "url";

  const res = await fetch(`${BASE_URL}/images/generations`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: MODEL,
      prompt,
      size,
      extra_body: {
        image: [inputImageUrl],
        response_format: responseFormat,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Image-to-Image API error: ${res.status}`);
  }
  return res.json();
}
