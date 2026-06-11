// ============================================================
// Video Service — Agnes-Video-V2.0 (Async)
// ============================================================

import { BASE_URL, getHeaders, getApiKey } from "./api";
import type { VideoTaskResponse, VideoResultResponse } from "@/types";

const MODEL = "agnes-video-v2.0";

/** Create a text-to-video task */
export async function createTextVideo(
  prompt: string,
  options?: {
    height?: number;
    width?: number;
    num_frames?: number;
    frame_rate?: number;
  }
): Promise<VideoTaskResponse> {
  const res = await fetch(`${BASE_URL}/videos`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: MODEL,
      prompt,
      height: options?.height ?? 768,
      width: options?.width ?? 1152,
      num_frames: options?.num_frames ?? 121,
      frame_rate: options?.frame_rate ?? 24,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Video create error: ${res.status}`);
  }
  return res.json();
}

/** Create an image-to-video task */
export async function createImageVideo(
  prompt: string,
  imageUrl: string,
  options?: {
    num_frames?: number;
    frame_rate?: number;
  }
): Promise<VideoTaskResponse> {
  const res = await fetch(`${BASE_URL}/videos`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: MODEL,
      prompt,
      image: imageUrl,
      num_frames: options?.num_frames ?? 121,
      frame_rate: options?.frame_rate ?? 24,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Video create error: ${res.status}`);
  }
  return res.json();
}

/** Create a multi-image or keyframe video task */
export async function createMultiImageVideo(
  prompt: string,
  imageUrls: string[],
  options?: {
    mode?: "keyframes";
    num_frames?: number;
    frame_rate?: number;
  }
): Promise<VideoTaskResponse> {
  const res = await fetch(`${BASE_URL}/videos`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: MODEL,
      prompt,
      extra_body: {
        image: imageUrls,
        mode: options?.mode,
      },
      num_frames: options?.num_frames ?? 121,
      frame_rate: options?.frame_rate ?? 24,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Video create error: ${res.status}`);
  }
  return res.json();
}

/** Query video result by video_id (recommended) */
export async function queryVideoResult(
  videoId: string
): Promise<VideoResultResponse> {
  const baseUrl = "https://apihub.agnes-ai.com";
  const res = await fetch(
    `${baseUrl}/agnesapi?video_id=${videoId}&model_name=${MODEL}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
      },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Video query error: ${res.status}`);
  }
  return res.json();
}

/** Poll video result until completed or failed */
export function pollVideoResult(
  videoId: string,
  onUpdate: (response: VideoResultResponse) => void,
  onComplete: (response: VideoResultResponse) => void,
  onError: (error: string) => void,
  intervalMs: number = 5000
): () => void {
  let stopped = false;

  const poll = async () => {
    if (stopped) return;
    try {
      const result = await queryVideoResult(videoId);
      onUpdate(result);

      if (result.status === "completed") {
        onComplete(result);
        return;
      }
      if (result.status === "failed") {
        onError(result.error || "Video generation failed");
        return;
      }
      // Continue polling
      setTimeout(poll, intervalMs);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  poll();

  // Return stop function
  return () => {
    stopped = true;
  };
}
