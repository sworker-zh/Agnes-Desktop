import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

// The project sits under a directory junction (C:\project → a mounted D:
// volume). Node's JS realpath does NOT resolve it (stays on C:\), but
// rolldown — Vite 8's bundler — DOES (goes to D:\). That mismatch breaks
// things two ways: the production build emits index.html with an absolute
// path as its asset name (build failure), and papering it over with
// preserveSymlinks produces a duplicate React instance ("Invalid hook call"
// at runtime) because react resolves under two path identities. Pin root and
// the @ alias to the *native*-resolved (D:) path so Node and rolldown agree.
// No-op on machines without a symlink/junction in the path.
const projectRoot = fs.realpathSync.native(__dirname);

// https://vite.dev/config/
export default defineConfig({
  root: projectRoot,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(projectRoot, "./src"),
    },
  },
  // Tauri expects a fixed port in dev
  server: {
    port: 1420,
    strictPort: true,
  },
});
