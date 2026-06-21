import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { successResponse, errorResponse } from "@/lib/api-response";
import { db } from "@/lib/db";
import { conversationsTable, messagesTable, usersTable } from "@/lib/schema";
import { eq, desc, and, sql, ne } from "drizzle-orm";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  if (user.role === "admin") {
    const rows = await db
      .select({
        id: conversationsTable.id,
        userId: conversationsTable.userId,
        updatedAt: conversationsTable.updatedAt,
        otherUserName: usersTable.name,
        otherUserEmail: usersTable.email,
        otherUserImage: usersTable.image,
      })
      .from(conversationsTable)
      .leftJoin(usersTable, eq(conversationsTable.userId, usersTable.id))
      .orderBy(desc(conversationsTable.updatedAt));

    const result = await Promise.all(
      rows.map(async (row) => {
        const [lastMessage] = await db
          .select({
            content: messagesTable.content,
            mediaType: messagesTable.mediaType,
            createdAt: messagesTable.createdAt,
            senderId: messagesTable.senderId,
          })
          .from(messagesTable)
          .where(eq(messagesTable.conversationId, row.id))
          .orderBy(desc(messagesTable.createdAt))
          .limit(1);

        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(messagesTable)
          .where(
            and(
              eq(messagesTable.conversationId, row.id),
              eq(messagesTable.isRead, false),
              ne(messagesTable.senderId, user.id)
            )
          );

        return {
          id: row.id,
          otherUser: {
            id: row.userId,
            name: row.otherUserName,
            email: row.otherUserEmail,
            image: row.otherUserImage,
            role: "user",
          },
          lastMessage: lastMessage ?? null,
          unreadCount: count,
          updatedAt: row.updatedAt,
        };
      })
    );

    return successResponse(result);
  }

  // Normal user — sirf 1 conversation, admin ke sath, auto create
  let [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.userId, user.id))
    .limit(1);

  if (!conversation) {
    [conversation] = await db
      .insert(conversationsTable)
      .values({ userId: user.id })
      .returning();
  }

  return successResponse([
    {
      id: conversation.id,
      otherUser: { id: "admin", name: "Support", email: null, image: null, role: "admin" },
      lastMessage: null,
      unreadCount: 0,
      updatedAt: conversation.updatedAt,
    },
  ]);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  if (user.role !== "admin") {
    return errorResponse("Only admin can open a conversation manually", 403);
  }

  const { userId } = await req.json();
  if (!userId) return errorResponse("userId is required", 422);

  let [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.userId, userId))
    .limit(1);

  if (!conversation) {
    [conversation] = await db
      .insert(conversationsTable)
      .values({ userId })
      .returning();
  }

  return successResponse(conversation, 201);
}