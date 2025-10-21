"use client";

import { Send } from "lucide-react";

function StartMessage() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20">
      <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
        <Send size={40} className="text-blue-500" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-gray-700">
        No messages yet
      </h3>
      <p className="max-w-xs text-center text-sm text-gray-500">
        Start the conversation by sending the first message
      </p>
    </div>
  );
}

export default StartMessage;
