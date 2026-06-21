// src/app/chat/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import ChatPageContent from "@/components/chat/ChatPageContent";

export default async function ChatPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login?callbackUrl=/chat");
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden">
      <ChatPageContent
        currentUserId={user.id}
        currentUserRole={user.role}
      />
    </div>
  );
}