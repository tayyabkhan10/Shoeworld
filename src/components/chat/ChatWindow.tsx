

// src/components/chat/ChatWindow.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChatMessage, ConversationListItem } from "./types";
import { Avatar } from "./ChatSidebar";
import { getPusherClient, getConversationChannelName } from "@/lib/pusher-client";

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
}

interface PendingAttachment {
  file: File;
  previewUrl: string;
  type: "image" | "video";
}

export default function ChatWindow({
  conversationId,
  currentUserId,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [otherUser, setOtherUser] = useState<ConversationListItem["otherUser"] | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function showError(message: string) {
    setErrorToast(message);
  }

  useEffect(() => {
    if (!errorToast) return;
    const t = setTimeout(() => setErrorToast(null), 3500);
    return () => clearTimeout(t);
  }, [errorToast]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetch(`/api/chat/${conversationId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        if (json.success) {
          setMessages(json.data.messages);

          fetch("/api/chat/users")
            .then((r) => r.json())
            .then((listJson) => {
              if (!active || !listJson.success) return;
              const match = listJson.data.find(
                (c: ConversationListItem) => c.id === conversationId
              );
              if (match) setOtherUser(match.otherUser);
            })
            .catch(() => {});
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    const pusher = getPusherClient();
    const channelName = getConversationChannelName(conversationId);
    const channel = pusher.subscribe(channelName);

    let isSubscribed = true;

    const handleNew = (data: ChatMessage) => {
      if (!isSubscribed) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
    };

    const handleUpdated = (data: Partial<ChatMessage> & { id: string }) => {
      if (!isSubscribed) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === data.id ? { ...m, ...data } : m))
      );
    };

    const handleDeleted = (data: { id: string }) => {
      if (!isSubscribed) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.id
            ? { ...m, content: null, mediaUrl: null, mediaType: null, isDeleted: true }
            : m
        )
      );
    };

    channel.bind("new-message", handleNew);
    channel.bind("message-updated", handleUpdated);
    channel.bind("message-deleted", handleDeleted);

    return () => {
      isSubscribed = false;
      channel.unbind("new-message", handleNew);
      channel.unbind("message-updated", handleUpdated);
      channel.unbind("message-deleted", handleDeleted);
      pusher.unsubscribe(channelName);
    };
  }, [conversationId]);

  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Close action menu on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [openMenuId]);

  async function handleSend() {
    const content = input.trim();
    if (!content) return;

    if (editingId) {
      await submitEdit(editingId, content);
      return;
    }

    if (sending) return;
    setSending(true);
    setInput("");

    try {
      const res = await fetch(`/api/chat/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (json.success) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === json.data.id)) return prev;
          return [...prev, json.data];
        });
      } else {
        showError(json.message ?? "Failed to send message");
        setInput(content);
      }
    } finally {
      setSending(false);
    }
  }

  async function submitEdit(messageId: string, content: string) {
    setSending(true);
    try {
      const res = await fetch(`/api/chat/${conversationId}/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (json.success) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, ...json.data } : m))
        );
        setEditingId(null);
        setInput("");
      } else {
        showError(json.message ?? "Failed to update message");
      }
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(messageId: string) {
    setOpenMenuId(null);

    const res = await fetch(`/api/chat/${conversationId}/messages/${messageId}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.success) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content: null, mediaUrl: null, mediaType: null, isDeleted: true }
            : m
        )
      );
    } else {
      showError(json.message ?? "Failed to delete message");
    }
  }

  function startEdit(msg: ChatMessage) {
    setOpenMenuId(null);
    setPendingAttachment(null);
    setEditingId(msg.id);
    setInput(msg.content ?? "");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function cancelEdit() {
    setEditingId(null);
    setInput("");
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      showError("Only image or video files are allowed");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setEditingId(null);
    setPendingAttachment({
      file,
      previewUrl: URL.createObjectURL(file),
      type: isVideo ? "video" : "image",
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function cancelAttachment() {
    if (pendingAttachment) URL.revokeObjectURL(pendingAttachment.previewUrl);
    setPendingAttachment(null);
    setInput("");
  }

  async function sendAttachment() {
    if (!pendingAttachment || sending) return;
    setSending(true);

    try {
      const formData = new FormData();
      formData.append("file", pendingAttachment.file);

      const uploadRes = await fetch("/api/chat/upload", {
        method: "POST",
        body: formData,
      });
      const uploadJson = await uploadRes.json();

      if (!uploadJson.success) {
        showError(uploadJson.message ?? "Upload failed");
        return;
      }

      const res = await fetch(`/api/chat/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: input.trim() || null,
          mediaUrl: uploadJson.data.url,
          mediaType: uploadJson.data.mediaType,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === json.data.id)) return prev;
          return [...prev, json.data];
        });
        URL.revokeObjectURL(pendingAttachment.previewUrl);
        setPendingAttachment(null);
        setInput("");
      } else {
        showError(json.message ?? "Failed to send message");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-white text-black">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-gradient-to-br from-black/[0.035] to-transparent blur-3xl" />
        <div className="absolute -right-28 top-1/3 h-80 w-80 rounded-full bg-gradient-to-bl from-black/[0.03] to-transparent blur-3xl" />
        <div className="absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-gradient-to-tr from-black/[0.03] to-transparent blur-3xl" />
      </div>

      {/* Header — glass, with back-to-home */}
      <div className="relative z-20 flex flex-shrink-0 items-center gap-3 border-b border-black/[0.08] bg-white/70 px-3 py-3 backdrop-blur-2xl sm:px-5">
        <Link
          href="/"
          aria-label="Back to home"
          className="group flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-black/60 ring-1 ring-black/[0.06] transition-all hover:bg-black/[0.1] hover:text-black active:scale-95"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className="transition-transform group-hover:-translate-x-0.5"
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        {loading ? (
          <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-full bg-black/10" />
        ) : (
          otherUser && (
            <div className="flex-shrink-0 rounded-full ring-2 ring-black/[0.06]">
              <Avatar name={otherUser.name} image={otherUser.image} />
            </div>
          )
        )}

        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="h-3.5 w-28 animate-pulse rounded-full bg-black/10" />
          ) : (
            <>
              <p className="truncate text-[15px] font-semibold tracking-tight text-black">
                {otherUser?.name ?? "Conversation"}
              </p>
              <p className="flex items-center gap-1.5 text-[11px] text-black/40">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                Online
              </p>
            </>
          )}
        </div>

        <Link
          href="/"
          className="hidden flex-shrink-0 items-center gap-1.5 rounded-full bg-black/[0.05] px-3.5 py-1.5 text-[12px] font-medium text-black/65 ring-1 ring-black/[0.06] transition-all hover:bg-black/[0.1] hover:text-black sm:flex"
        >
          Home
        </Link>
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-3 py-4 sm:px-6 lg:px-10 [scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.15)_transparent]">
        {loading ? (
          <div className="mx-auto flex h-full max-w-4xl flex-col items-center justify-center gap-3">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 rounded-full border-2 border-black/10" />
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-black/60" />
            </div>
            <p className="text-[13px] text-black/35">Loading conversation…</p>
          </div>
        ) : (
          <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-end gap-2.5">
            {messages.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/[0.04] ring-1 ring-black/[0.06]">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                      stroke="rgba(0,0,0,0.4)"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="text-sm text-black/35">No messages yet. Say hello!</p>
              </div>
            )}
            {messages.map((msg) => {
              const isOwn = msg.senderId === currentUserId;
              const isMenuOpen = openMenuId === msg.id;
              return (
                <div
                  key={msg.id}
                  className={`group flex items-center gap-1.5 ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  {/* Action trigger for own messages */}
                  {isOwn && !msg.isDeleted && (
                    <div className="relative order-first">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(isMenuOpen ? null : msg.id);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-black/30 opacity-0 transition-opacity hover:bg-black/5 hover:text-black/60 group-hover:opacity-100 sm:opacity-0"
                      >
                        ⋮
                      </button>
                      {isMenuOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-8 z-20 w-32 overflow-hidden rounded-xl border border-black/[0.08] bg-white/95 shadow-2xl shadow-black/10 backdrop-blur-2xl"
                        >
                          {msg.content && !msg.mediaUrl && (
                            <button
                              onClick={() => startEdit(msg)}
                              className="block w-full px-3 py-2 text-left text-sm text-black/85 hover:bg-black/5"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-black/5"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-[20px] px-3.5 py-2 text-sm shadow-md sm:max-w-[60%] md:max-w-[50%] lg:max-w-[45%] ${
                      msg.isDeleted
                        ? "bg-black/[0.04] text-black/35 italic ring-1 ring-black/[0.06]"
                        : isOwn
                          ? "relative overflow-hidden bg-black text-white shadow-black/20"
                          : "bg-black/[0.05] text-black ring-1 ring-black/[0.07]"
                    }`}
                  >
                    {/* Glossy highlight on own bubbles */}
                    {isOwn && !msg.isDeleted && (
                      <span className="pointer-events-none absolute -left-3 -top-3 h-10 w-10 rounded-full bg-white/10 blur-md" />
                    )}

                    {msg.isDeleted ? (
                      <p className="relative flex items-center gap-1.5">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                          <path
                            d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        This message was deleted
                      </p>
                    ) : (
                      <>
                        {msg.mediaType === "image" && msg.mediaUrl && (
                          <img
                            src={msg.mediaUrl}
                            alt="attachment"
                            className="relative mb-1 max-w-full rounded-xl ring-1 ring-black/[0.08] sm:max-w-[260px]"
                          />
                        )}
                        {msg.mediaType === "video" && msg.mediaUrl && (
                          <video
                            src={msg.mediaUrl}
                            controls
                            className="relative mb-1 max-w-full rounded-xl ring-1 ring-black/[0.08] sm:max-w-[280px]"
                          />
                        )}
                        {msg.content && (
                          <p className="relative whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        )}
                        <p
                          className={`relative mt-1 flex items-center justify-end gap-1 text-right text-[10px] ${
                            isOwn ? "text-white/50" : "text-black/40"
                          }`}
                        >
                          {msg.isEdited && <span className="italic">edited</span>}
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Attachment preview — glass full-screen overlay */}
      {pendingAttachment && (
        <div className="absolute inset-0 z-30 flex flex-col bg-black/30 backdrop-blur-md">
          <div className="flex flex-1 items-center justify-center p-4 sm:p-10">
            <div className="max-h-full max-w-full overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/[0.08]">
              {pendingAttachment.type === "image" ? (
                <img
                  src={pendingAttachment.previewUrl}
                  alt="preview"
                  className="max-h-[60vh] max-w-full object-contain"
                />
              ) : (
                <video
                  src={pendingAttachment.previewUrl}
                  controls
                  className="max-h-[60vh] max-w-full object-contain"
                />
              )}
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2 border-t border-black/[0.08] bg-white/80 px-3 py-3 backdrop-blur-2xl sm:px-4">
            <button
              onClick={cancelAttachment}
              disabled={sending}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-black/60 transition-colors hover:bg-black/5 hover:text-black disabled:opacity-40"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendAttachment();
                }
              }}
              placeholder="Add a caption..."
              className="flex-1 rounded-full border border-black/15 bg-white px-4 py-2 text-sm text-black placeholder:text-black/35 focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/5"
            />
            <button
              onClick={sendAttachment}
              disabled={sending}
              className="flex h-9 flex-shrink-0 items-center justify-center gap-1.5 rounded-full bg-black px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {sending ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
              ) : (
                "Send"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Edit banner */}
      {editingId && (
        <div className="relative z-10 flex flex-shrink-0 items-center justify-between border-t border-black/[0.08] bg-white/70 px-4 py-1.5 text-xs text-black/55 backdrop-blur-2xl">
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Editing message
          </span>
          <button onClick={cancelEdit} className="font-medium text-black/70 hover:text-black">
            Cancel
          </button>
        </div>
      )}

      {/* Input bar — glass pill */}
      <div className="relative z-10 flex flex-shrink-0 items-center gap-2 border-t border-black/[0.08] bg-white/70 px-3 py-2.5 backdrop-blur-2xl sm:px-4 sm:py-3">
        <input
          type="file"
          accept="image/*,video/*"
          ref={fileInputRef}
          onChange={handleFileSelected}
          className="hidden"
        />
        {!editingId && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || loading}
            title="Send image or video"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-black/60 ring-1 ring-black/[0.06] transition-all hover:bg-black/[0.1] hover:text-black active:scale-95 disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
            if (e.key === "Escape" && editingId) cancelEdit();
          }}
          placeholder={editingId ? "Edit message..." : "Type a message..."}
          className="flex-1 rounded-full border border-black/15 bg-white px-4 py-2.5 text-sm text-black placeholder:text-black/35 focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/5 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={sending || loading || !input.trim()}
          className="flex h-10 flex-shrink-0 items-center justify-center gap-1.5 rounded-full bg-black px-4 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:active:scale-100"
        >
          {sending ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
          ) : editingId ? (
            "Update"
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Error toast */}
      {errorToast && (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-50 flex justify-center px-4">
          <div className="pointer-events-auto flex max-w-sm items-center gap-2 rounded-full bg-black px-4 py-2.5 text-[13px] font-medium text-white shadow-xl">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 8v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="12" cy="16" r="0.9" fill="currentColor" />
            </svg>
            <span className="truncate">{errorToast}</span>
            <button
              onClick={() => setErrorToast(null)}
              className="ml-1 flex-shrink-0 text-white/50 hover:text-white"
              aria-label="Dismiss"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}