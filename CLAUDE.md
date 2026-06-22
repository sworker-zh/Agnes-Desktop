# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Agnes AI Tool** — a cross-platform desktop app (Tauri 2.0 + React + TypeScript) for interacting with the Agnes AI API. Provides four features: **Chat** (streaming LLM conversations), **Image Generation** (text-to-image + image-to-image with local file upload), **Video Generation** (async text-to-video + image-to-video with polling), and **Settings** (API key, save path, theme).

Also runnable as a standalone web app via `npm run web:dev` or `npm run web`.

## Tech Stack

- **Frontend**: React 19 + TypeScript 6 + Vite 8 + Tailwind CSS v4 (via `@tailwindcss/vite`)
- **State**: Zustand (4 stores: `chatStore`, `imageStore`, `videoStore`, `settingsStore`)
- **UI Components**: Custom shadcn-style primitives (`@/components/ui/*`) built on `class-variance-authority` + `clsx` + `tailwind-merge`
- **Routing**: Manual page switching via `PageKey` type in `MainLayout` (no react-router navigation — `react-router-dom` is a dependency but unused for in-app routing)
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
│   ├── lib/utils.ts              # cn() helper
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
│   │   └── settingsStore.ts      # API key, save path, theme
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
├── vite.config.ts                # Alias @/, Tauri port 1420
├── eslint.config.js              # TS + React Hooks + Refresh
└── package.json
```

## Key Architecture Notes

- **API base URL**: `https://apihub.agnes-ai.com/v1` (defined in `src/services/api.ts`)
- **Models**: `agnes-2.0-flash` (chat), `agnes-image-2.1-flash` (image), `agnes-video-v2.0` (video)
- **State persistence**: API key and settings stored in `localStorage`; chat conversations are in-memory only (Zustand)
- **Download service**: Abstracts Tauri filesystem (`invoke`) vs browser Blob download — the `isTauri()` check switches behavior
- **Video generation**: Async/polling pattern — creates task → polls `queryVideoResult` every 5s → auto-downloads on completion
- **Chat streaming**: SSE via `ReadableStream` reader with manual buffer parsing; `parseSSEStream` calls callbacks for each delta
- **No tests exist** — the project has no test framework configured
- **react-router-dom** is installed but not used; navigation is handled by simple state in `App.tsx`

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
