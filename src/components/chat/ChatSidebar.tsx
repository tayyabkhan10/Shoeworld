

// src/components/chat/ChatSidebar.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ConversationListItem, ChatMessage } from "./types";
import { getPusherClient, ADMIN_INBOX_CHANNEL } from "@/lib/pusher-client";

interface ChatSidebarProps {
  currentUserId: string;
  currentUserRole: string;
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

function getInitials(name: string | null): string {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const AVATAR_PALETTE = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-fuchsia-500",
];

function getAvatarColor(name: string | null): string {
  const key = name && name.trim() ? name : "?";
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

export function Avatar({
  name,
  image,
  size = 48,
}: {
  name: string | null;
  image: string | null;
  size?: number;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const style = { width: size, height: size };

  if (image && !imageFailed) {
    return (
      <img
        src={image}
        alt={name ?? "User"}
        style={style}
        onError={() => setImageFailed(true)}
        className="flex-shrink-0 rounded-full object-cover ring-1 ring-black/5"
      />
    );
  }

  return (
    <div
      style={style}
      className={`flex flex-shrink-0 items-center justify-center rounded-full text-[15px] font-semibold tracking-tight text-white ${getAvatarColor(name)}`}
    >
      {getInitials(name)}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="h-12 w-12 flex-shrink-0 animate-pulse rounded-full bg-black/[0.06]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div
              className="h-3 animate-pulse rounded-full bg-black/[0.06]"
              style={{ width: `${55 + (i % 3) * 10}%` }}
            />
            <div
              className="h-2.5 animate-pulse rounded-full bg-black/[0.05]"
              style={{ width: `${35 + (i % 4) * 8}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ChatSidebar({
  currentUserId,
  currentUserRole,
  selectedConversationId,
  onSelectConversation,
}: ChatSidebarProps) {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const isAdmin = currentUserRole === "admin";

  useEffect(() => {
    if (!errorToast) return;
    const t = setTimeout(() => setErrorToast(null), 3500);
    return () => clearTimeout(t);
  }, [errorToast]);

  useEffect(() => {
    let active = true;
    const endpoint = isAdmin ? "/api/chat/users" : "/api/chat";

    fetch(endpoint)
      .then((res) => res.json())
      .then((json) => {
        if (!active || !json.success) return;
        setConversations(json.data);

        if (!isAdmin && json.data.length > 0 && json.data[0].id && !selectedConversationId) {
          onSelectConversation(json.data[0].id);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentUserId, currentUserRole]);

  useEffect(() => {
    if (!isAdmin) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(ADMIN_INBOX_CHANNEL);

    let isSubscribed = true;

    const handleMessage = (data: ChatMessage) => {
      if (!isSubscribed || !data.conversationId) return;

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === data.conversationId);
        const updatedItem = {
          ...(idx >= 0
            ? prev[idx]
            : ({
                id: data.conversationId!,
                otherUser: {
                  id: data.senderId,
                  name: data.senderName,
                  email: null,
                  image: data.senderImage,
                  role: "user" as const,
                },
                unreadCount: 0,
                updatedAt: data.createdAt,
                lastMessage: null,
              } as ConversationListItem)),
          lastMessage: {
            content: data.content,
            mediaType: data.mediaType,
            createdAt: data.createdAt,
            senderId: data.senderId,
          },
          updatedAt: data.createdAt,
          unreadCount:
            data.senderId !== currentUserId && data.conversationId !== selectedConversationId
              ? (idx >= 0 ? prev[idx].unreadCount : 0) + 1
              : idx >= 0
                ? prev[idx].unreadCount
                : 0,
        };

        const rest = idx >= 0 ? prev.filter((_, i) => i !== idx) : prev;
        return [updatedItem, ...rest];
      });
    };

    channel.bind("new-message", handleMessage);

    return () => {
      isSubscribed = false;
      channel.unbind("new-message", handleMessage);
      pusher.unsubscribe(ADMIN_INBOX_CHANNEL);
    };
  }, [isAdmin, currentUserId, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversationId ? { ...c, unreadCount: 0 } : c
      )
    );
  }, [selectedConversationId]);

  async function handleSelect(item: ConversationListItem) {
    if (item.id) {
      onSelectConversation(item.id);
      return;
    }

    setCreatingFor(item.otherUser.id);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: item.otherUser.id }),
      });
      const json = await res.json();
      if (json.success) {
        onSelectConversation(json.data.id);
      } else {
        setErrorToast(json.message ?? "Failed to start conversation");
      }
    } finally {
      setCreatingFor(null);
    }
  }

  function formatTimestamp(iso: string): string {
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], { day: "2-digit", month: "short" });
  }

  if (!isAdmin) {
    return <div className="hidden" />;
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const visibleConversations = conversations
    .filter((c) => (filter === "unread" ? c.unreadCount > 0 : true))
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        c.otherUser.name?.toLowerCase().includes(q) ||
        c.otherUser.email?.toLowerCase().includes(q) ||
        c.lastMessage?.content?.toLowerCase().includes(q)
      );
    });

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-black/[0.08] bg-white">
        <div className="flex items-center gap-2.5 px-3 py-3 sm:px-4">
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
          <h2 className="flex-shrink-0 text-[17px] font-semibold tracking-tight text-black">
            Chats
          </h2>
          {totalUnread > 0 && (
            <span className="flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
          <span className="ml-auto flex-shrink-0 text-[11px] text-black/35">
            {conversations.length} total
          </span>
        </div>

        {/* Search */}
        <div className="px-3 pb-2.5 sm:px-4">
          <div className="flex items-center gap-2 rounded-full bg-black/[0.05] px-3.5 py-2 ring-1 ring-transparent transition-all focus-within:bg-white focus-within:ring-black/15">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-black/35">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
              <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full bg-transparent text-[13.5px] text-black placeholder:text-black/35 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="flex-shrink-0 text-black/30 hover:text-black/60"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 px-3 pb-3 sm:px-4">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-all ${
                filter === f
                  ? "bg-black text-white"
                  : "bg-black/[0.05] text-black/55 hover:bg-black/[0.08]"
              }`}
            >
              {f === "all" ? "All" : `Unread${totalUnread > 0 ? ` (${totalUnread})` : ""}`}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.15)_transparent]">
        {loading && <SidebarSkeleton />}

        {!loading && conversations.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/[0.04] ring-1 ring-black/[0.06]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                  stroke="rgba(0,0,0,0.35)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-sm text-black/35">No users found</p>
          </div>
        )}

        {!loading && conversations.length > 0 && visibleConversations.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/[0.04] ring-1 ring-black/[0.06]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="rgba(0,0,0,0.35)" strokeWidth="1.6" />
                <path d="M21 21l-4.3-4.3" stroke="rgba(0,0,0,0.35)" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm text-black/35">
              {filter === "unread" ? "No unread chats" : "No chats match your search"}
            </p>
          </div>
        )}

        {!loading &&
          visibleConversations.map((conv) => {
            const isSelected = conv.id !== null && conv.id === selectedConversationId;
            const isCreating = creatingFor === conv.otherUser.id;
            const isUnread = conv.unreadCount > 0;
            return (
              <button
                key={conv.otherUser.id}
                onClick={() => handleSelect(conv)}
                disabled={isCreating}
                className={`relative flex w-full items-center gap-3 px-3 py-3 text-left transition-colors active:bg-black/[0.05] disabled:opacity-60 sm:px-4 ${
                  isSelected ? "bg-black/[0.05]" : "hover:bg-black/[0.025]"
                }`}
              >
                {isSelected && (
                  <span className="absolute inset-y-0 left-0 w-[3px] bg-black" />
                )}
                <Avatar name={conv.otherUser.name} image={conv.otherUser.image} />
                <div className="min-w-0 flex-1 border-b border-black/[0.06] pb-3 pt-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className={`truncate text-[15px] ${
                        isUnread ? "font-semibold text-black" : "font-medium text-black/90"
                      }`}
                    >
                      {conv.otherUser.name ?? "Unknown"}
                    </p>
                    {conv.lastMessage?.createdAt && (
                      <span
                        className={`flex-shrink-0 text-[11px] ${
                          isUnread ? "font-semibold text-emerald-600" : "text-black/35"
                        }`}
                      >
                        {formatTimestamp(conv.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p
                      className={`truncate text-[13px] ${
                        isUnread ? "font-medium text-black/70" : "text-black/40"
                      }`}
                    >
                      {isCreating ? (
                        "Starting chat..."
                      ) : conv.lastMessage?.content ? (
                        conv.lastMessage.content
                      ) : conv.lastMessage ? (
                        <span className="inline-flex items-center gap-1">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 opacity-60">
                            <path
                              d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Attachment
                        </span>
                      ) : (
                        "No messages yet"
                      )}
                    </p>
                    {isUnread && (
                      <span className="flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white">
                        {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
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