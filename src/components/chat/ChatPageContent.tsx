// src/components/chat/ChatPageContent.tsx
"use client";

import { useState } from "react";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";

interface ChatPageContentProps {
  currentUserId: string;
  currentUserRole: string;
}

export default function ChatPageContent({
  currentUserId,
  currentUserRole,
}: ChatPageContentProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const isAdmin = currentUserRole === "admin";

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-white sm:h-[calc(100dvh-4rem)] sm:rounded-xl sm:border sm:border-black/10">
      {/* Sidebar — admin: conversation list. Normal user: hidden helper that auto-selects */}
      <div
       className={`flex-shrink-0 flex-col border-r border-black/10 bg-white
  ${isAdmin ? "w-full sm:w-[320px] md:w-[360px] lg:w-[400px]" : "w-0 overflow-hidden"}
  ${isAdmin && selectedConversationId ? "hidden sm:flex" : "flex"}
`}
      >
        <ChatSidebar
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
        />
      </div>

      {/* Chat window */}
      <div
        className={`flex min-w-0 flex-1 flex-col bg-[#fafafa]
          ${isAdmin && !selectedConversationId ? "hidden sm:flex" : "flex"}
        `}
      >
        {selectedConversationId ? (
          <>
            {isAdmin && (
              <button
                onClick={() => setSelectedConversationId(null)}
                className="flex flex-shrink-0 items-center gap-1 border-b border-black/10 bg-white px-3 py-3 text-left text-sm font-medium text-black sm:hidden"
              >
                <span className="text-lg">←</span> Conversations
              </button>
            )}
            <ChatWindow
              key={selectedConversationId}
              conversationId={selectedConversationId}
              currentUserId={currentUserId}
            />
          </>
        ) : (
          <div className="flex h-full flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/5 text-2xl">
              💬
            </div>
            <p className="text-sm text-black/40">
              {isAdmin ? "Select a conversation to start chatting" : "Connecting to support..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}