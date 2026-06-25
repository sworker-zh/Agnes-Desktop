// ============================================================
// Chat Store — conversations and messages (persisted to localStorage)
// ============================================================

import { create } from "zustand";
import type { Conversation, ConversationMessage } from "@/types";

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isStreaming: boolean;
  abortController: AbortController | null;

  createConversation: () => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string) => void;
  addMessage: (conversationId: string, message: ConversationMessage) => void;
  appendToLastMessage: (conversationId: string, text: string) => void;
  setStreaming: (streaming: boolean) => void;
  setAbortController: (controller: AbortController | null) => void;

  getActiveConversation: () => Conversation | undefined;
  stopStreaming: () => void;
  loadConversations: () => void;
  saveConversations: () => void;
}

const STORAGE_KEY = "agnes_chat_conversations";
const ACTIVE_CONV_KEY = "agnes_active_conversation_id";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadFromStorage(): {
  conversations: Conversation[];
  activeConversationId: string | null;
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const convs = raw ? JSON.parse(raw) : [];
    const activeId = localStorage.getItem(ACTIVE_CONV_KEY);
    return { conversations: convs, activeConversationId: activeId };
  } catch {
    return { conversations: [], activeConversationId: null };
  }
}

function saveToStorage(conversations: Conversation[], activeConversationId: string | null) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    if (activeConversationId) {
      localStorage.setItem(ACTIVE_CONV_KEY, activeConversationId);
    } else {
      localStorage.removeItem(ACTIVE_CONV_KEY);
    }
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export const useChatStore = create<ChatState>((set, get) => {
  const stored = loadFromStorage();

  return {
    conversations: stored.conversations,
    activeConversationId: stored.conversations.some((c) => c.id === stored.activeConversationId)
      ? stored.activeConversationId
      : null,
    isStreaming: false,
    abortController: null,

    createConversation: () => {
      const id = generateId();
      const conversation: Conversation = {
        id,
        title: "New Chat",
        messages: [],
        createdAt: Date.now(),
      };
      set((s) => {
        const newS = {
          conversations: [conversation, ...s.conversations],
          activeConversationId: id,
        };
        saveToStorage(newS.conversations, newS.activeConversationId);
        return newS;
      });
      return id;
    },

    deleteConversation: (id: string) => {
      set((s) => {
        const filtered = s.conversations.filter((c) => c.id !== id);
        const newS = {
          conversations: filtered,
          activeConversationId:
            s.activeConversationId === id
              ? filtered[0]?.id ?? null
              : s.activeConversationId,
        };
        saveToStorage(newS.conversations, newS.activeConversationId);
        return newS;
      });
    },

    setActiveConversation: (id: string) => {
      set((s) => {
        saveToStorage(s.conversations, id);
        return { activeConversationId: id };
      });
    },

    addMessage: (conversationId: string, message: ConversationMessage) => {
      set((s) => {
        const conversations = s.conversations.map((c) => {
          if (c.id !== conversationId) return c;
          const updatedMessages = [...c.messages, message];
          const title =
            c.messages.length === 0 && message.role === "user"
              ? message.content.slice(0, 40) + (message.content.length > 40 ? "..." : "")
              : c.title;
          return { ...c, messages: updatedMessages, title };
        });
        saveToStorage(conversations, s.activeConversationId);
        return { conversations };
      });
    },

    appendToLastMessage: (conversationId: string, text: string) => {
      set((s) => {
        const conversations = s.conversations.map((c) => {
          if (c.id !== conversationId) return c;
          const msgs = [...c.messages];
          const last = msgs[msgs.length - 1];
          if (last && last.role === "assistant") {
            msgs[msgs.length - 1] = { ...last, content: last.content + text };
          }
          return { ...c, messages: msgs };
        });
        saveToStorage(conversations, s.activeConversationId);
        return { conversations };
      });
    },

    setStreaming: (streaming: boolean) => {
      set({ isStreaming: streaming });
    },

    setAbortController: (controller: AbortController | null) => {
      set({ abortController: controller });
    },

    stopStreaming: () => {
      const { abortController } = get();
      if (abortController) {
        abortController.abort();
        set({ abortController: null, isStreaming: false });
      }
    },

    loadConversations: () => {
      const stored = loadFromStorage();
      set((s) => ({
        conversations: stored.conversations,
        activeConversationId: stored.conversations.some(
          (c) => c.id === stored.activeConversationId
        )
          ? stored.activeConversationId
          : s.activeConversationId,
      }));
    },

    saveConversations: () => {
      const { conversations, activeConversationId } = get();
      saveToStorage(conversations, activeConversationId);
    },

    getActiveConversation: () => {
      const s = get();
      return s.conversations.find((c) => c.id === s.activeConversationId);
    },
  };
});
