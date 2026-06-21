// src/lib/pusher-client.ts
import PusherClient from "pusher-js";

let pusherClientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        authEndpoint: "/api/pusher/auth",
        authTransport: "ajax",
      }
    );
  }
  return pusherClientInstance;
}

export function getConversationChannelName(conversationId: string) {
  return `private-conversation-${conversationId}`;
}

export const ADMIN_INBOX_CHANNEL = "private-admin-inbox";