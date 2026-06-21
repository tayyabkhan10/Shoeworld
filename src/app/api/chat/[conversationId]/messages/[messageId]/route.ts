// src/app/api/chat/[conversationId]/messages/[messageId]/route.ts
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { successResponse, errorResponse } from "@/lib/api-response";
import { db } from "@/lib/db";
import { messagesTable, conversationsTable } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { pusherServer, getConversationChannel, ADMIN_INBOX_CHANNEL } from "@/lib/pusher";

async function getOwnedMessage(conversationId: string, messageId: string, userId: string) {
  const [message] = await db
    .select()
    .from(messagesTable)
    .where(
      and(
        eq(messagesTable.id, messageId),
        eq(messagesTable.conversationId, conversationId)
      )
    )
    .limit(1);

  if (!message || message.senderId !== userId || message.isDeleted) return null;
  return message;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string; messageId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const { conversationId, messageId } = await params;
  const message = await getOwnedMessage(conversationId, messageId, user.id);
  if (!message) return errorResponse("Message not found or not editable", 404);

  const body = await req.json();
  const content = (body?.content as string | undefined)?.trim();
  if (!content) return errorResponse("Content is required", 422);

  const [updated] = await db
    .update(messagesTable)
    .set({ content, isEdited: true })
    .where(eq(messagesTable.id, messageId))
    .returning();

  const payload = {
    id: updated.id,
    content: updated.content,
    mediaUrl: updated.mediaUrl,
    mediaType: updated.mediaType,
    senderId: updated.senderId,
    isEdited: updated.isEdited,
    isDeleted: updated.isDeleted,
    conversationId,
  };

  try {
    await pusherServer.trigger(getConversationChannel(conversationId), "message-updated", payload);
    await pusherServer.trigger(ADMIN_INBOX_CHANNEL, "message-updated", payload);
  } catch (error) {
    console.error("Pusher trigger failed:", error);
  }

  return successResponse(payload);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string; messageId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const { conversationId, messageId } = await params;
  const message = await getOwnedMessage(conversationId, messageId, user.id);
  if (!message) return errorResponse("Message not found or not deletable", 404);

  await db
    .update(messagesTable)
    .set({ content: null, mediaUrl: null, mediaType: null, isDeleted: true })
    .where(eq(messagesTable.id, messageId));

  const payload = { id: messageId, conversationId };

  try {
    await pusherServer.trigger(getConversationChannel(conversationId), "message-deleted", payload);
    await pusherServer.trigger(ADMIN_INBOX_CHANNEL, "message-deleted", payload);
  } catch (error) {
    console.error("Pusher trigger failed:", error);
  }

  return successResponse(payload);
}