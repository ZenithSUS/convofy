import { Message } from "@/types/message";
import Image from "next/image";
import { memo, useMemo } from "react";
import { FileIcon } from "lucide-react";
import Link from "next/link";
import ViewImageModal from "@/app/(views)/chat/components/modals/view-image-modal";
import MessageAvatar from "@/app/(views)/chat/[roomId]/components/message/message-avatar";

const MessageContent = ({ message }: { message: Message }) => {
  const str = message.content;
  const fileName = decodeURIComponent(str.substring(str.indexOf("_") + 1));

  const avatar = useMemo(() => {
    if (message.sender.isAnonymous) {
      return message.room.isAnonymous
        ? message.sender.anonAvatar || "/default-avatar.png"
        : message.sender.avatar || "/default-avatar.png";
    }

    return message.sender.avatar || "/default-avatar.png";
  }, [message.sender, message.room.isAnonymous]);

  switch (message.type) {
    case "text":
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <MessageAvatar avatar={avatar} />
            <strong>{message.sender.name.split(" ")[0]}</strong>{" "}
          </div>
          <p className="wrap-break-word whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      );

    case "image":
      return (
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <MessageAvatar avatar={avatar} />
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
            <MessageAvatar avatar={avatar} />
            <strong>
              {message.sender.name.split(" ")[0]}{" "}
              <span className="font-normal">(Sends a file)</span>
            </strong>
          </div>
          <div className="flex h-[125px] w-[250px] items-center justify-center bg-gray-300 dark:bg-gray-700">
            <FileIcon className="h-6 w-6" />
            <Link
              href={message.content}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-blue-500 hover:text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-500"
            >
              {fileName}
            </Link>
          </div>
        </div>
      );
  }
};

export default memo(MessageContent);
