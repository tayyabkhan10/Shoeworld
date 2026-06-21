// src/components/chat/types.ts

export interface ChatUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: "admin" | "user";
}

export interface ConversationListItem {
  id: string | null; // null = abhi tak conversation nahi bani
  otherUser: ChatUser;
  lastMessage: {
    content: string | null;
    mediaType: "image" | "video" | null;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
  updatedAt: string | null;
}

export interface ChatMessage {
  id: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: "image" | "video" | null;
  senderId: string;
  senderName: string;
  senderImage: string | null;
  isRead: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
  createdAt: string;
  conversationId?: string;
}