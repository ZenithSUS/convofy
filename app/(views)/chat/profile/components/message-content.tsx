import { UserMessage } from "@/types/message";
import ViewImageModal from "@/app/(views)/chat/components/modals/view-image-modal";
import Image from "next/image";
import { FileIcon } from "lucide-react";
import { memo } from "react";
import Link from "next/link";

const MessageContent = ({ message }: { message: UserMessage }) => {
  switch (message.type) {
    case "text":
      return (
        <p className="whitespace-pre-wrap">
          {message.content}{" "}
          <span className="text-gray-400">
            {message.isEdited ? "(Edited)" : ""}
          </span>
        </p>
      );
    case "image":
      return (
        <ViewImageModal content={message.content} user={message.sender.name}>
          <Image
            src={message.content}
            alt="Message"
            width={200}
            height={200}
            priority
            className="h-[200px] w-screen rounded-md object-cover"
          />
        </ViewImageModal>
      );
    case "file":
      return (
        <div className="flex h-[200px] max-w-screen items-center justify-center gap-2 rounded-2xl bg-gray-300">
          <FileIcon size={22} />
          <Link
            href={message.content}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            {message.content.split("/").pop()}
          </Link>
        </div>
      );
    default:
      return null;
  }
};

export default memo(MessageContent);
