// ============================================================
// Chat Store — conversations and messages
// ============================================================

import { create } from "zustand";
import type { Conversation, ConversationMessage } from "@/types";

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isStreaming: boolean;

  createConversation: () => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string) => void;
  addMessage: (conversationId: string, message: ConversationMessage) => void;
  appendToLastMessage: (conversationId: string, text: string) => void;
  setStreaming: (streaming: boolean) => void;

  getActiveConversation: () => Conversation | undefined;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  isStreaming: false,

  createConversation: () => {
    const id = generateId();
    const conversation: Conversation = {
      id,
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
    };
    set((s) => ({
      conversations: [conversation, ...s.conversations],
      activeConversationId: id,
    }));
    return id;
  },

  deleteConversation: (id: string) => {
    set((s) => {
      const filtered = s.conversations.filter((c) => c.id !== id);
      return {
        conversations: filtered,
        activeConversationId:
          s.activeConversationId === id
            ? filtered[0]?.id ?? null
            : s.activeConversationId,
      };
    });
  },

  setActiveConversation: (id: string) => {
    set({ activeConversationId: id });
  },

  addMessage: (conversationId: string, message: ConversationMessage) => {
    set((s) => ({
      conversations: s.conversations.map((c) => {
        if (c.id !== conversationId) return c;
        const updatedMessages = [...c.messages, message];
        // Auto-title from first user message
        const title =
          c.messages.length === 0 && message.role === "user"
            ? message.content.slice(0, 40) + (message.content.length > 40 ? "..." : "")
            : c.title;
        return { ...c, messages: updatedMessages, title };
      }),
    }));
  },

  appendToLastMessage: (conversationId: string, text: string) => {
    set((s) => ({
      conversations: s.conversations.map((c) => {
        if (c.id !== conversationId) return c;
        const msgs = [...c.messages];
        const last = msgs[msgs.length - 1];
        if (last && last.role === "assistant") {
          msgs[msgs.length - 1] = { ...last, content: last.content + text };
        }
        return { ...c, messages: msgs };
      }),
    }));
  },

  setStreaming: (streaming: boolean) => {
    set({ isStreaming: streaming });
  },

  getActiveConversation: () => {
    const s = get();
    return s.conversations.find((c) => c.id === s.activeConversationId);
  },
}));
