// ============================================================
// Video Store — generation tasks and polling state
// ============================================================

import { create } from "zustand";
import type { GeneratedVideo } from "@/types";

interface VideoState {
  videos: GeneratedVideo[];
  isCreating: boolean;
  error: string | null;

  addVideo: (video: GeneratedVideo) => void;
  updateVideoProgress: (id: string, progress: number, status: GeneratedVideo["status"]) => void;
  completeVideo: (id: string, videoUrl: string, localPath?: string) => void;
  failVideo: (id: string, error: string) => void;
  removeVideo: (id: string) => void;
  setCreating: (creating: boolean) => void;
  setError: (error: string | null) => void;
}

export const useVideoStore = create<VideoState>((set) => ({
  videos: [],
  isCreating: false,
  error: null,

  addVideo: (video: GeneratedVideo) => {
    set((s) => ({ videos: [video, ...s.videos] }));
  },

  updateVideoProgress: (id: string, progress: number, status: GeneratedVideo["status"]) => {
    set((s) => ({
      videos: s.videos.map((v) =>
        v.id === id ? { ...v, progress, status } : v
      ),
    }));
  },

  completeVideo: (id: string, videoUrl: string, localPath?: string) => {
    set((s) => ({
      videos: s.videos.map((v) =>
        v.id === id
          ? { ...v, status: "completed" as const, progress: 100, videoUrl, localPath: localPath ?? v.localPath }
          : v
      ),
    }));
  },

  failVideo: (id: string, error: string) => {
    set((s) => ({
      videos: s.videos.map((v) =>
        v.id === id ? { ...v, status: "failed" as const } : v
      ),
      error,
    }));
  },

  removeVideo: (id: string) => {
    set((s) => ({ videos: s.videos.filter((v) => v.id !== id) }));
  },

  setCreating: (creating: boolean) => {
    set({ isCreating: creating });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
