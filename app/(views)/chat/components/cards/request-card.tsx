"use client";

import timeFormat from "@/helper/time-format";
import { RoomRequest } from "@/types/room";
import Image from "next/image";
import { Check, X } from "lucide-react";

interface RequestCardProps {
  request: RoomRequest;
  onAccept?: (roomId: string, userId: string) => Promise<void>;
  onDecline?: (roomId: string, userId: string) => Promise<void>;
  isAccepting: boolean;
  isDeclining: boolean;
}

function RequestCard({
  request,
  onAccept,
  onDecline,
  isAccepting,
  isDeclining,
}: RequestCardProps) {
  return (
    <div className="dark:hover:bg-gray-850 flex items-start gap-3 border-b border-gray-100 p-3 transition-colors last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900">
      {/* Avatar with online status */}
      <div className="relative shrink-0">
        <Image
          src={request.invitedBy?.avatar || "/default-avatar.png"}
          alt={`${request.invitedBy?.name || "User"} Avatar`}
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover"
        />
        <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500 dark:border-gray-900" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {request.invitedBy?.name}
            </p>
            {request.lastMessage && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {timeFormat(new Date(request.lastMessage.createdAt))}
              </p>
            )}
          </div>
        </div>

        {request.lastMessage && (
          <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
            {request.lastMessage.type === "text"
              ? request.lastMessage.content
              : request.lastMessage.type === "file"
                ? "Sent a file"
                : request.lastMessage.type === "image"
                  ? "Sent an image"
                  : "N/A"}
          </p>
        )}

        {/* Action Buttons */}
        <div className="mt-2 flex gap-2">
          <button
            disabled={isAccepting || isDeclining}
            onClick={() => onAccept?.(request._id, request.invitedUser || "")}
            className="flex flex-1 items-center justify-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:hover:bg-gray-200 disabled:hover:text-gray-400 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <Check className="h-3 w-3" />
            Accept
          </button>
          <button
            disabled={isAccepting || isDeclining}
            onClick={() => onDecline?.(request._id, request.invitedUser || "")}
            className="flex flex-1 items-center justify-center gap-1 rounded-md bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-300 disabled:bg-gray-200 disabled:text-gray-400 disabled:hover:bg-gray-200 disabled:hover:text-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-900 dark:hover:text-white"
          >
            <X className="h-3 w-3" />
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}

export default RequestCard;
