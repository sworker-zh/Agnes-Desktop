// ============================================================
// Chat Service — Agnes-2.0-Flash
// ============================================================

import { BASE_URL, getHeaders } from "./api";
import type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
} from "@/types";

const MODEL = "agnes-2.0-flash";

/** Send a non-streaming chat completion request */
export async function sendChat(
  messages: ChatMessage[],
  options?: { temperature?: number; max_tokens?: number }
): Promise<ChatResponse> {
  const body: ChatRequest = {
    model: MODEL,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.max_tokens ?? 4096,
    stream: false,
  };

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Chat API error: ${res.status}`);
  }

  return res.json();
}

/** Send a streaming chat completion request — returns the raw Response */
export async function sendChatStream(
  messages: ChatMessage[],
  options?: { temperature?: number; max_tokens?: number }
): Promise<Response> {
  const body: ChatRequest = {
    model: MODEL,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.max_tokens ?? 4096,
    stream: true,
  };

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Chat stream error: ${res.status}`);
  }

  return res;
}

/** Parse SSE stream chunks and call onChunk for each delta */
export function parseSSEStream(
  response: Response,
  onChunk: (text: string) => void,
  onDone: () => void
) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No readable stream");
  const safeReader = reader;

  const decoder = new TextDecoder();
  let buffer = "";

  function read() {
    safeReader
      .read()
      .then(({ done, value }) => {
        if (done) {
          onDone();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) onChunk(delta);
          } catch {
            // Skip malformed JSON
          }
        }
        read();
      })
      .catch(() => onDone());
  }

  read();
}
