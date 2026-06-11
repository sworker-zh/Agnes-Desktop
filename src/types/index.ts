// ============================================================
// Agnes AI API Type Definitions
// ============================================================

// --- Common ---
export interface ApiError {
  code: string;
  message: string;
}

// --- Chat ---
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentBlock[];
}

export interface ContentBlock {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// --- Image ---
export interface ImageRequest {
  model: string;
  prompt: string;
  size: string;
  return_base64?: boolean;
  extra_body?: {
    image?: string[];
    response_format?: "url" | "b64_json";
  };
}

export interface ImageData {
  url: string | null;
  b64_json: string | null;
  revised_prompt: string | null;
}

export interface ImageResponse {
  created: number;
  data: ImageData[];
}

// --- Video ---
export interface VideoCreateRequest {
  model: string;
  prompt: string;
  image?: string;
  height?: number;
  width?: number;
  num_frames?: number;
  frame_rate?: number;
  seed?: number;
  negative_prompt?: string;
  extra_body?: {
    image?: string[];
    mode?: string;
  };
}

export interface VideoTaskResponse {
  id: string;
  task_id: string;
  video_id: string;
  object: string;
  model: string;
  status: "queued" | "in_progress" | "completed" | "failed";
  progress: number;
  created_at: number;
  seconds: string;
  size: string;
}

export interface VideoResultResponse {
  id: string;
  video_id: string;
  model: string;
  object: string;
  status: "queued" | "in_progress" | "completed" | "failed";
  progress: number;
  seconds: string;
  size: string;
  remixed_from_video_id: string | null;
  error: string | null;
}

// --- App State ---
export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: number;
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  url: string | null;
  b64_json: string | null;
  localPath: string | null;
  size: string;
  timestamp: number;
}

export interface GeneratedVideo {
  id: string;
  prompt: string;
  videoId: string;
  status: "queued" | "in_progress" | "completed" | "failed";
  progress: number;
  videoUrl: string | null;
  localPath: string | null;
  seconds: string;
  size: string;
  timestamp: number;
}
