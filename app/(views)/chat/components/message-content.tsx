import { Message } from "@/types/message";
import Image from "next/image";
import { memo } from "react";
import MessageAvatar from "./message-avatar";

const MessageContent = ({ message }: { message: Message }) => {
  switch (message.type) {
    case "text":
      return (
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-2">
            <MessageAvatar avatar={message.sender.avatar} />
            <strong>{message.sender.name.split(" ")[0]}:</strong>{" "}
          </div>
          <p>{message.content}</p>
        </div>
      );

    case "image":
      return (
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <MessageAvatar avatar={message.sender.avatar} />
            <strong>{message.sender.name.split(" ")[0]} (Sends Image)</strong>
          </div>
          <Image
            src={message.content}
            alt="Message"
            width={200}
            height={200}
            priority
            className="h-auto w-auto"
          />
        </div>
      );

    case "file":
      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <MessageAvatar avatar={message.sender.avatar} />
            <strong>{message.sender.name.split(" ")[0]}:</strong>
          </div>
          <a
            href={message.content}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            {message.content.split("/").pop()}
          </a>
        </div>
      );
  }
};

export default memo(MessageContent);
