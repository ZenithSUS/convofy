"use client";

import { MessageTyping } from "@/types/message";

function TypingIndicator({
  typingUsers,
}: {
  typingUsers: Map<string, MessageTyping>;
}) {
  return (
    <div className="mt-4 flex w-fit items-center gap-2 rounded-full bg-gray-100 px-4 py-2">
      <div className="flex gap-1">
        <span
          className="h-2 w-2 animate-bounce rounded-full bg-blue-500"
          style={{ animationDelay: "0ms" }}
        ></span>
        <span
          className="h-2 w-2 animate-bounce rounded-full bg-blue-500"
          style={{ animationDelay: "150ms" }}
        ></span>
        <span
          className="h-2 w-2 animate-bounce rounded-full bg-blue-500"
          style={{ animationDelay: "300ms" }}
        ></span>
      </div>
      <span className="text-sm text-gray-700">
        <span className="font-medium">
          {Array.from(typingUsers.values())
            .map((typing) => typing.user.name)
            .join(", ")}
        </span>{" "}
        {typingUsers.size > 1 ? "are" : "is"} typing...
      </span>
    </div>
  );
}

export default TypingIndicator;
