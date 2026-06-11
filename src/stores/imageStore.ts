// ============================================================
// Image Store — generation history and state
// ============================================================

import { create } from "zustand";
import type { GeneratedImage } from "@/types";

interface ImageState {
  images: GeneratedImage[];
  isGenerating: boolean;
  error: string | null;

  addImage: (image: GeneratedImage) => void;
  updateImageLocalPath: (id: string, localPath: string) => void;
  setGenerating: (generating: boolean) => void;
  setError: (error: string | null) => void;
  removeImage: (id: string) => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const useImageStore = create<ImageState>((set) => ({
  images: [],
  isGenerating: false,
  error: null,

  addImage: (image: GeneratedImage) => {
    set((s) => ({ images: [image, ...s.images] }));
  },

  updateImageLocalPath: (id: string, localPath: string) => {
    set((s) => ({
      images: s.images.map((img) =>
        img.id === id ? { ...img, localPath } : img
      ),
    }));
  },

  setGenerating: (generating: boolean) => {
    set({ isGenerating: generating });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  removeImage: (id: string) => {
    set((s) => ({ images: s.images.filter((img) => img.id !== id) }));
  },
}));

export { generateId };
