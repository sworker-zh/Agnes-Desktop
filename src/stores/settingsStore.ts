// ============================================================
// Settings Store — API Key, save path, theme
// ============================================================

import { create } from "zustand";
import { getApiKey, setApiKey as saveApiKey } from "@/services/api";

interface SettingsState {
  apiKey: string;
  savePath: string;
  theme: "light" | "dark";
  setApiKey: (key: string) => void;
  setSavePath: (path: string) => void;
  setTheme: (theme: "light" | "dark") => void;
  loadSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  apiKey: getApiKey(),
  savePath: localStorage.getItem("agnes_save_path") || "",
  theme:
    (localStorage.getItem("agnes_theme") as "light" | "dark") || "light",

  setApiKey: (key: string) => {
    saveApiKey(key);
    set({ apiKey: key });
  },

  setSavePath: (path: string) => {
    localStorage.setItem("agnes_save_path", path);
    set({ savePath: path });
  },

  setTheme: (theme: "light" | "dark") => {
    localStorage.setItem("agnes_theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    set({ theme });
  },

  loadSettings: () => {
    const apiKey = getApiKey();
    const savePath = localStorage.getItem("agnes_save_path") || "";
    const theme =
      (localStorage.getItem("agnes_theme") as "light" | "dark") || "light";
    document.documentElement.classList.toggle("dark", theme === "dark");
    set({ apiKey, savePath, theme });
  },
}));
