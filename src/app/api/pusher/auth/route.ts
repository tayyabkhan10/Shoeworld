import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { pusherServer } from "@/lib/pusher";
import { db } from "@/lib/db";
import { conversationsTable } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const socketId = formData.get("socket_id") as string;
  const channel = formData.get("channel_name") as string;
  if (!socketId || !channel) {
    return NextResponse.json({ error: "Missing params" }, { status: 422 });
  }

  // Admin inbox — sirf admin
  if (channel === "private-admin-inbox") {
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(pusherServer.authorizeChannel(socketId, channel));
  }

  // Conversation channel — admin ya us conversation ka owner
  if (channel.startsWith("private-conversation-")) {
    const conversationId = channel.replace("private-conversation-", "");

    if (user.role === "admin") {
      return NextResponse.json(pusherServer.authorizeChannel(socketId, channel));
    }

    const [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId))
      .limit(1);

    if (!conversation || conversation.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(pusherServer.authorizeChannel(socketId, channel));
  }

  return NextResponse.json({ error: "Unknown channel" }, { status: 403 });
}