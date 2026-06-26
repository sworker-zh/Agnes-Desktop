// ============================================================
// Chat View — AI conversation interface
// ============================================================

import { useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Plus, Trash2, Loader2, User, Bot, Square } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { sendChatStream, parseSSEStream } from "@/services/chatService";
import { t } from "@/lib/i18n";
import type { ChatMessage } from "@/types";

export function ChatView() {
  const {
    conversations,
    activeConversationId,
    isStreaming,
    createConversation,
    deleteConversation,
    setActiveConversation,
    addMessage,
    appendToLastMessage,
    setStreaming,
    setAbortController,
    stopStreaming,
    getActiveConversation,
  } = useChatStore();

  const apiKey = useSettingsStore((s) => s.apiKey);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeConversation = getActiveConversation();

  // Translated UI strings — memoized to avoid recreating on every render
  const STR = useMemo(
    () => ({
      newChat: t("chat.newChat"),
      startNewConversation: t("chat.startNewConversation"),
      clickNewChatBegin: t("chat.clickNewChatBegin"),
      typeAMessage: t("chat.typeAMessage"),
      pleaseSetApiKeyFirst: t("chat.pleaseSetApiKeyFirst"),
    }),
    []
  );

  // Auto-scroll to bottom only when new messages arrive (not on every stream chunk)
  const messageCountRef = useRef(0);
  useEffect(() => {
    if (scrollRef.current && messageCountRef.current !== (activeConversation?.messages.length ?? 0)) {
      messageCountRef.current = activeConversation?.messages.length ?? 0;
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.messages.length]);

  const handleStop = useCallback(() => {
    stopStreaming();
  }, [stopStreaming]);

  const handleSend = useCallback(async () => {
    const input = inputRef.current;
    if (!input || !input.value.trim() || isStreaming) return;

    if (!apiKey) {
      alert(STR.pleaseSetApiKeyFirst);
      return;
    }

    let convId = activeConversationId;
    if (!convId) {
      convId = createConversation();
    }

    const userText = input.value.trim();
    input.value = "";

    // Add user message
    addMessage(convId, {
      id: Date.now().toString(36),
      role: "user",
      content: userText,
      timestamp: Date.now(),
    });

    // Add empty assistant message
    const assistantId = Date.now().toString(36) + "_a";
    addMessage(convId, {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    });

    // Build messages for API
    const conv = useChatStore.getState().conversations.find((c) => c.id === convId);
    const apiMessages: ChatMessage[] = (conv?.messages || [])
      .filter((m) => m.content)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    apiMessages.push({ role: "user", content: userText });

    setStreaming(true);

    try {
      const controller = new AbortController();
      setAbortController(controller);

      const response = await sendChatStream(apiMessages, {
        signal: controller.signal,
      });
      parseSSEStream(
        response,
        (chunk) => {
          appendToLastMessage(convId!, chunk);
        },
        () => {
          setStreaming(false);
          setAbortController(null);
        }
      );
    } catch (err) {
      // AbortError means user stopped the stream — don't show error
      if (err instanceof DOMException && err.name === "AbortError") {
        setStreaming(false);
        setAbortController(null);
      } else {
        appendToLastMessage(
          convId!,
          `\n\n**Error:** ${err instanceof Error ? err.message : "Unknown error"}`
        );
        setStreaming(false);
        setAbortController(null);
      }
    }
  }, [activeConversationId, isStreaming, apiKey, createConversation, addMessage, appendToLastMessage, setStreaming, setAbortController, stopStreaming, STR.pleaseSetApiKeyFirst]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full">
      {/* Conversation List */}
      <div className="w-56 border-r border-border flex flex-col">
        <div className="p-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => createConversation()}
          >
            <Plus className="h-4 w-4 mr-2" />
            {STR.newChat}
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="px-2 space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm group ${
                  conv.id === activeConversationId
                    ? "bg-secondary"
                    : "hover:bg-muted"
                }`}
                onClick={() => setActiveConversation(conv.id)}
              >
                <span className="flex-1 truncate">{conv.title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeConversation ? (
          <>
            {/* Messages */}
            <ScrollArea className="flex-1 min-h-0 p-4">
              <div ref={scrollRef} className="max-w-3xl mx-auto space-y-4">
                {activeConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2.5 max-w-[80%] whitespace-pre-wrap text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {msg.content || (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-border p-4 shrink-0">
              <div className="max-w-3xl mx-auto flex gap-2">
                <Textarea
                  ref={inputRef}
                  placeholder={STR.typeAMessage}
                  className="min-h-[44px] max-h-[200px] resize-none"
                  rows={1}
                  onKeyDown={handleKeyDown}
                  disabled={isStreaming}
                />
                <Button
                  onClick={isStreaming ? handleStop : handleSend}
                  disabled={isStreaming}
                  size="icon"
                  className="shrink-0"
                  title={isStreaming ? "Stop streaming" : "Send"}
                >
                  {isStreaming ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-3">
              <Bot className="h-12 w-12 mx-auto opacity-50" />
              <p className="text-lg">{STR.startNewConversation}</p>
              <Badge variant="secondary">{STR.clickNewChatBegin}</Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
