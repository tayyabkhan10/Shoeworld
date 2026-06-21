import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { successResponse, errorResponse } from "@/lib/api-response";
import { db } from "@/lib/db";
import { conversationsTable, messagesTable, usersTable } from "@/lib/schema";
import { eq, and, asc, ne } from "drizzle-orm";
import { pusherServer, getConversationChannel, ADMIN_INBOX_CHANNEL } from "@/lib/pusher";

async function getConversationForUser(
  conversationId: string,
  user: { id: string; role: string }
) {
  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, conversationId))
    .limit(1);

  if (!conversation) return null;
  if (user.role === "admin" || conversation.userId === user.id) return conversation;
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const { conversationId } = await params;
  const conversation = await getConversationForUser(conversationId, user);
  if (!conversation) return errorResponse("Conversation not found", 404);

  const history = await db
    .select({
      id: messagesTable.id,
      content: messagesTable.content,
      mediaUrl: messagesTable.mediaUrl,
      mediaType: messagesTable.mediaType,
      senderId: messagesTable.senderId,
      isRead: messagesTable.isRead,
      createdAt: messagesTable.createdAt,
      senderName: usersTable.name,
      senderImage: usersTable.image,
    })
    .from(messagesTable)
    .leftJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
    .where(eq(messagesTable.conversationId, conversationId))
    .orderBy(asc(messagesTable.createdAt));

  await db
    .update(messagesTable)
    .set({ isRead: true })
    .where(
      and(
        eq(messagesTable.conversationId, conversationId),
        eq(messagesTable.isRead, false),
        ne(messagesTable.senderId, user.id)
      )
    );

  return successResponse({ conversation, messages: history });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const { conversationId } = await params;
  const conversation = await getConversationForUser(conversationId, user);
  if (!conversation) return errorResponse("Conversation not found", 404);

  const body = await req.json();
  const content = (body?.content as string | undefined)?.trim() || null;
  const mediaUrl = (body?.mediaUrl as string | undefined) || null;
  const mediaType = (body?.mediaType as string | undefined) || null;

  if (!content && !mediaUrl) {
    return errorResponse("Message content or media is required", 422);
  }

  const [message] = await db
    .insert(messagesTable)
    .values({ conversationId, senderId: user.id, content, mediaUrl, mediaType })
    .returning();

  await db
    .update(conversationsTable)
    .set({ updatedAt: new Date() })
    .where(eq(conversationsTable.id, conversationId));

 const payload = {
  id: message.id,
  content: message.content,
  mediaUrl: message.mediaUrl,
  mediaType: message.mediaType,
  senderId: message.senderId,
  senderName: user.name,
  senderImage: user.image,
  isRead: message.isRead,
  isEdited: message.isEdited,
  isDeleted: message.isDeleted,
  createdAt: message.createdAt,
  conversationId,
};

  try {
    await pusherServer.trigger(getConversationChannel(conversationId), "new-message", payload);
    await pusherServer.trigger(ADMIN_INBOX_CHANNEL, "new-message", payload);
  } catch (error) {
    console.error("Pusher trigger failed:", error);
  }

  return successResponse(payload, 201);
}