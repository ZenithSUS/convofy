import { Message } from "@/types/message";
import Image from "next/image";
import { memo } from "react";
import MessageAvatar from "./message-avatar";
import ViewImageModal from "./modals/view-image-modal";
import { FileIcon } from "lucide-react";

const MessageContent = ({ message }: { message: Message }) => {
  switch (message.type) {
    case "text":
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <MessageAvatar avatar={message.sender.avatar} />
            <strong>{message.sender.name.split(" ")[0]}</strong>{" "}
          </div>
          <p className="break-words whitespace-pre-wrap">{message.content}</p>
        </div>
      );

    case "image":
      return (
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <MessageAvatar avatar={message.sender.avatar} />
            <strong>
              {message.sender.name.split(" ")[0]}{" "}
              <span className="font-normal">(Sends an image)</span>
            </strong>
          </div>
          <ViewImageModal content={message.content} user={message.sender.name}>
            <Image
              src={message.content}
              alt="Message"
              width={200}
              height={200}
              priority
              className="h-auto w-auto flex-1"
            />
          </ViewImageModal>
        </div>
      );

    case "file":
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <MessageAvatar avatar={message.sender.avatar} />
            <strong>
              {message.sender.name.split(" ")[0]}{" "}
              <span className="font-normal">(Sends a file)</span>
            </strong>
          </div>
          <div className="flex h-[125px] w-[250px] items-center justify-center bg-gray-300">
            <FileIcon className="h-6 w-6" />
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
        </div>
      );
  }
};

export default memo(MessageContent);
