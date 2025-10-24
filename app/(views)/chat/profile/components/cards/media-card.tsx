"use client";

import { MediaMessage } from "@/types/message";
import { FileIcon } from "lucide-react";
import Image from "next/image";
import ViewImageModal from "@/app/(views)/chat/components/modals/view-image-modal";

interface MediaCardProps {
  media: MediaMessage;
}

function MediaCard({ media }: MediaCardProps) {
  return (
    <div className="flex items-center justify-center">
      {media.type === "image" ? (
        <ViewImageModal content={media.content} user={media.sender.name}>
          <Image
            src={media.content}
            alt="Media"
            width={200}
            height={200}
            priority
            className="h-[200px] w-screen rounded-md object-cover"
          />
        </ViewImageModal>
      ) : media.type === "file" ? (
        <div className="flex h-[200px] w-[200px] flex-col gap-2 bg-gray-400">
          <FileIcon size={22} />
          <p className="text-center text-sm">{media.content}</p>
        </div>
      ) : null}
    </div>
  );
}

export default MediaCard;
