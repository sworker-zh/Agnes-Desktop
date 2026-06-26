# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Agnes AI Tool** — a cross-platform desktop app (Tauri 2.0 + React + TypeScript) for interacting with the Agnes AI API. Provides four features: **Chat** (streaming LLM conversations), **Image Generation** (text-to-image + image-to-image with local file upload), **Video Generation** (async text-to-video + image-to-video with polling), and **Settings** (API key, save path, theme, language/en-zh).

Also runnable as a standalone web app via `npm run web:dev` or `npm run web`.

## Tech Stack

- **Frontend**: React 19 + TypeScript 6 + Vite 8 + Tailwind CSS v4 (via `@tailwindcss/vite`)
- **State**: Zustand (4 stores: `chatStore`, `imageStore`, `videoStore`, `settingsStore`)
- **UI Components**: Custom shadcn-style primitives (`@/components/ui/*`) built on `class-variance-authority` + `clsx` + `tailwind-merge`; icons from `lucide-react`
- **Routing**: Manual page switching via `PageKey` type + `useState` in `App.tsx`/`MainLayout` — no router library
- **i18n**: Custom, dependency-free system (NOT i18next) in `src/lib/i18n.ts` + `src/locales/{en,zh}.json`
- **Desktop**: Tauri 2.11 (Rust backend in `src-tauri/src/`)
- **Styling**: Tailwind CSS v4 with CSS custom properties for light/dark themes (`oklch` colors)

## Directory Structure

```
agnes-tool/
├── src/                          # React frontend
│   ├── main.tsx                  # Entry point (createsRoot)
│   ├── App.tsx                   # Root component — page router
│   ├── App.css
│   ├── index.css                 # Tailwind + theme tokens
│   ├── lib/
│   │   ├── utils.ts              # cn() helper
│   │   ├── i18n.ts               # t() translator + TranslationKey type
│   │   └── error-boundary.tsx    # App-wide React error boundary (class component)
│   ├── locales/                  # i18n translation source (en.json is canonical)
│   │   ├── en.json
│   │   └── zh.json
│   ├── types/index.ts            # All API + app state types
│   ├── services/                 # API clients (plain fetch, no axios)
│   │   ├── api.ts                # BASE_URL + auth header helpers
│   │   ├── chatService.ts        # sendChat / sendChatStream + SSE parser
│   │   ├── imageService.ts       # textToImageUrl / textToImageBase64 / imageToImage
│   │   ├── videoService.ts       # createTextVideo / createImageVideo + pollVideoResult
│   │   └── downloadService.ts    # Dual-mode: Tauri invoke OR browser Blob download
│   ├── stores/                   # Zustand stores
│   │   ├── chatStore.ts          # Conversations, messages, streaming state
│   │   ├── imageStore.ts         # Generated images list
│   │   ├── videoStore.ts         # Video tasks with progress/status
│   │   └── settingsStore.ts      # API key, save path, theme, language
│   ├── components/
│   │   ├── layout/MainLayout.tsx # Sidebar nav + content area
│   │   ├── chat/ChatView.tsx     # Conversation list + streaming chat
│   │   ├── image/ImageView.tsx   # Text→Image / Image→Image with upload
│   │   ├── video/VideoView.tsx   # Video generation + task list
│   │   ├── settings/SettingsView.tsx
│   │   └── ui/*                  # Button, Card, Input, Badge, Tabs, etc.
├── src-tauri/                    # Rust backend
│   ├── Cargo.toml                # Tauri 2 + reqwest + tokio + base64
│   ├── tauri.conf.json           # App config (window, bundle, targets)
│   ├── build.rs                  # tauri_build::build()
│   ├── src/
│   │   ├── main.rs               # Entry — app_lib::run()
│   │   └── lib.rs                # Tauri commands: download_file, save_base64_image, get_default_download_dir
│   ├── capabilities/default.json # Permissions: core, http, fs, dialog, log
│   └── icons/                    # App icons
├── 构建手册.md                   # Build manual (Chinese)
├── vite.config.ts                # Alias @/, Tauri port 1420, junction-safe root (see Windows note)
├── eslint.config.js              # TS + React Hooks + Refresh
└── package.json
```

## Key Architecture Notes

- **API base URL**: `https://apihub.agnes-ai.com/v1` (defined in `src/services/api.ts`)
- **Models**: `agnes-2.0-flash` (chat), `agnes-image-2.1-flash` (image), `agnes-video-v2.0` (video)
- **State persistence**: API key, save path, theme, and language all live in `localStorage` (keys prefixed `agnes_`, e.g. `agnes_api_key`, `agnes_language`); chat conversations are in-memory only (Zustand). `settingsStore.loadSettings()` runs once on startup (called from `App.tsx`) to hydrate state and apply theme + i18n.
- **i18n architecture**: `t(key)` in `src/lib/i18n.ts` reads a **module-level** `currentLang`, so calling it does not trigger React re-renders. To make UI re-translate on language switch, components subscribe to `language` from `settingsStore` and recompute translated strings in `useMemo([language])` (see `MainLayout.tsx` for the pattern). `TranslationKey` is a TS mapped type derived from `en.json`'s nested structure → dotted keys (e.g. `"nav.chat"`); **`en.json` is the canonical source** — add a key there first or the type won't include it. Interpolation uses `{{var}}`. `setLanguage()` also writes `agnes_language` and sets `<html lang>`.
- **Error boundary**: `ErrorBoundary` in `src/lib/error-boundary.tsx` wraps the app root in `App.tsx`, catching render crashes with a reload fallback.
- **Download service**: Abstracts Tauri filesystem (`invoke`) vs browser Blob download — the `isTauri()` check switches behavior
- **Video generation**: Async/polling pattern — creates task → polls `queryVideoResult` every 5s → auto-downloads on completion
- **Chat streaming**: SSE via `ReadableStream` reader with manual buffer parsing; `parseSSEStream` calls callbacks for each delta
- **No tests exist** — the project has no test framework configured
- **Windows build gotcha (junction paths)**: `vite.config.ts` pins `root` and the `@` alias to `fs.realpathSync.native(__dirname)`. This is required when the project lives under a directory junction/symlink (e.g. `C:\project` → a `D:` volume): Node's JS `realpath` does not resolve it but Vite 8's bundler (rolldown) does, causing build failures (absolute-path asset names) or a duplicate-React "Invalid hook call". Do not "simplify" this back to a plain `__dirname`. It's a no-op on machines without a junction in the path.

## Common Commands

### Development

```bash
npm run dev              # Vite dev server only (port 3000)
npm run tauri dev        # Tauri desktop app with hot reload (port 1420)
npm run web:dev          # Web dev mode (port 3000, --host)
```

### Build

```bash
npm run build            # TypeScript check + Vite production build → dist/
npm run tauri build      # Full Tauri build (Rust release + frontend bundle)
npm run tauri build -- --no-bundle   # Build binary only, skip NSIS/MSI packaging
npm run tauri build -- --bundles nsis # Only NSIS installer
npm run tauri build -- --bundles msi  # Only MSI installer
npm run web              # Build + serve dist/ locally on port 3000
```

### Lint

```bash
npm run lint             # ESLint (type-checked via typescript-eslint)
```

### Output Locations

- Web build: `dist/`
- Tauri release binary: `src-tauri/target/release/agnes-ai-tool.exe`
- NSIS installer: `src-tauri/target/release/bundle/nsis/`
- MSI installer: `src-tauri/target/release/bundle/msi/`

## Environment Requirements

- **Node.js** 18+ LTS
- **Rust** 1.77.2+ (via rustup)
- **VS Build Tools 2022** with "Desktop development with C++" workload (MSVC v143 + Windows SDK)
- **WebView2** — pre-installed on Windows 11

See `构建手册.md` for the full Chinese-language build guide.
