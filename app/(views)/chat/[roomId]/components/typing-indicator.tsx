"use client";

import { MessageOutputTyping } from "@/types/message";
import { useEffect } from "react";

interface TypingIndicatorProps {
  typingUsers: Map<string, MessageOutputTyping>;
  typingIndicatorRef: React.RefObject<HTMLDivElement | null>;
}

function TypingIndicator({
  typingUsers,
  typingIndicatorRef,
}: TypingIndicatorProps) {
  // Auto scroll on the typing indicator
  useEffect(() => {
    if (typingIndicatorRef.current && typingUsers.size > 0) {
      typingIndicatorRef.current.scrollIntoView({ behavior: "smooth" });
    }

    return () => {
      typingIndicatorRef.current = null;
    };
  }, [typingUsers, typingIndicatorRef]);

  return (
    <div
      className="mt-4 flex w-fit items-center gap-2 rounded-full bg-gray-100 px-4 py-2 dark:bg-gray-800"
      ref={typingIndicatorRef}
    >
      <div className="flex gap-1">
        <span
          className="h-2 w-2 animate-bounce rounded-full bg-blue-500 dark:bg-blue-400"
          style={{ animationDelay: "0ms" }}
        ></span>
        <span
          className="h-2 w-2 animate-bounce rounded-full bg-blue-500 dark:bg-blue-400"
          style={{ animationDelay: "150ms" }}
        ></span>
        <span
          className="h-2 w-2 animate-bounce rounded-full bg-blue-500 dark:bg-blue-400"
          style={{ animationDelay: "300ms" }}
        ></span>
      </div>
      <span className="text-sm text-gray-700 dark:text-gray-400">
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
