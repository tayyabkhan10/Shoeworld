import Pusher from "pusher";

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export function getConversationChannel(conversationId: string) {
  return `private-conversation-${conversationId}`;
}

export const ADMIN_INBOX_CHANNEL = "private-admin-inbox";