// ============================================================
// Agnes AI API Base Configuration
// ============================================================

const BASE_URL = "https://apihub.agnes-ai.com/v1";

export function getApiKey(): string {
  return localStorage.getItem("agnes_api_key") || "";
}

export function setApiKey(key: string): void {
  localStorage.setItem("agnes_api_key", key);
}

export function getHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getApiKey()}`,
  };
}

export { BASE_URL };
