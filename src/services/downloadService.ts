// ============================================================
// Download Service — Dual mode: Tauri desktop OR Web browser
// ============================================================

// Detect if running inside Tauri desktop
function isTauri(): boolean {
  return !!(window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
}

// ---- Browser-native download helpers ----

/** Trigger a browser file download from a URL */
async function browserDownloadFromUrl(
  url: string,
  filename: string
): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);

  return `Browser:Downloads/${filename}`;
}

/** Trigger a browser file download from base64 data */
function browserDownloadFromBase64(
  data: string,
  filename: string
): string {
  // Strip data URI prefix if present
  const b64 = data.startsWith("data:") ? data.split(",")[1] : data;
  const byteString = atob(b64);
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }

  const blob = new Blob([byteArray], { type: "image/png" });
  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);

  return `Browser:Downloads/${filename}`;
}

// ---- Public API (works in both environments) ----

/** Download a file from URL and save locally */
export async function downloadFile(
  url: string,
  savePath: string
): Promise<string> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<string>("download_file", { url, savePath });
  }

  // Browser: extract filename from savePath
  const filename = savePath.split("/").pop() || savePath.split("\\").pop() || "download";
  return browserDownloadFromUrl(url, filename);
}

/** Save base64 image data to local file */
export async function saveBase64Image(
  data: string,
  filename: string,
  _dir: string
): Promise<string> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<string>("save_base64_image", { data, filename, dir: _dir });
  }

  // Browser: trigger download
  return browserDownloadFromBase64(data, filename);
}

/** Get the default download directory */
export async function getDefaultDownloadDir(): Promise<string> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<string>("get_default_download_dir");
  }

  // Browser: no filesystem access, return placeholder
  return "Browser:Downloads";
}

/** Generate a timestamped filename */
export function generateFilename(prefix: string, ext: string): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `${prefix}_${ts}.${ext}`;
}
