// src/app/api/chat/users/route.ts
import { getCurrentUser } from "@/lib/session";
import { successResponse, errorResponse } from "@/lib/api-response";
import { db } from "@/lib/db";
import { usersTable, conversationsTable, messagesTable } from "@/lib/schema";
import { eq, ne, desc, and, sql } from "drizzle-orm";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);
  if (user.role !== "admin") return errorResponse("Forbidden", 403);

  const allUsers = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      image: usersTable.image,
    })
    .from(usersTable)
    .where(ne(usersTable.role, "admin"));

  const result = await Promise.all(
    allUsers.map(async (u) => {
      const [conversation] = await db
        .select()
        .from(conversationsTable)
        .where(eq(conversationsTable.userId, u.id))
        .limit(1);

      let lastMessage = null;
      let unreadCount = 0;

      if (conversation) {
        const [lm] = await db
          .select({
            content: messagesTable.content,
            mediaType: messagesTable.mediaType,
            createdAt: messagesTable.createdAt,
            senderId: messagesTable.senderId,
          })
          .from(messagesTable)
          .where(eq(messagesTable.conversationId, conversation.id))
          .orderBy(desc(messagesTable.createdAt))
          .limit(1);
        lastMessage = lm ?? null;

        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(messagesTable)
          .where(
            and(
              eq(messagesTable.conversationId, conversation.id),
              eq(messagesTable.isRead, false),
              sql`${messagesTable.senderId} != ${user.id}`
            )
          );
        unreadCount = count;
      }

      return {
        id: conversation?.id ?? null,
        otherUser: {
          id: u.id,
          name: u.name,
          email: u.email,
          image: u.image,
          role: "user" as const,
        },
        lastMessage,
        unreadCount,
        updatedAt: conversation?.updatedAt ?? null,
      };
    })
  );

  result.sort((a, b) => {
    if (a.updatedAt && b.updatedAt) {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    if (a.updatedAt) return -1;
    if (b.updatedAt) return 1;
    return 0;
  });

  return successResponse(result);
}