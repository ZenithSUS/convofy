"use client";

import { MediaMessage } from "@/types/message";
import { FileIcon } from "lucide-react";
import Image from "next/image";
import ViewImageModal from "@/app/(views)/chat/[roomId]/components/modals/view-image-modal";
import Link from "next/link";

interface MediaCardProps {
  media: MediaMessage;
}

function MediaCard({ media }: MediaCardProps) {
  const imageStr = media.content;
  const filename = decodeURIComponent(
    imageStr.substring(imageStr.indexOf("_") + 1),
  );

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
        <div className="flex h-[200px] w-screen flex-col items-center justify-center gap-2 truncate rounded-md bg-gray-400 md:flex-row dark:bg-gray-600">
          <FileIcon size={22} />
          <Link
            href={media.content}
            target="_blank"
            className="text-center text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            {filename}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export default MediaCard;
