"use client";

import { Check, X } from "lucide-react";
import RequestCard from "./cards/request-card";
import { RoomRequest } from "@/types/room";
import { useCallback, useEffect } from "react";

interface RequestsDropdownProps {
  requests: RoomRequest[];
  onAccept?: (roomId: string, userId: string) => Promise<void>;
  onDecline?: (roomId: string, userId: string) => Promise<void>;
  onViewAll?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  isAccepting: boolean;
  isDeclining: boolean;
}

export function RequestsDropdown({
  requests,
  onAccept,
  onDecline,
  onViewAll,
  isOpen = true,
  onClose,
  isAccepting,
  isDeclining,
}: RequestsDropdownProps) {
  // Prevent body scroll when dropdown is open on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleAccept = useCallback(
    async (roomId: string, userId: string) => {
      await onAccept?.(roomId, userId);
      onClose?.();
    },
    [onAccept, onClose],
  );

  const handleDecline = useCallback(
    async (roomId: string, userId: string) => {
      await onDecline?.(roomId, userId);
      onClose?.();
    },
    [onDecline, onClose],
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 z-60 min-h-screen overflow-hidden bg-black/50 lg:hidden"
        onClick={onClose}
      />

      {/* Dropdown Container */}
      <div className="fixed inset-x-0 -top-1 z-70 lg:absolute lg:inset-auto lg:top-full lg:right-0 lg:z-50 lg:mt-2 lg:w-80">
        <div className="flex max-h-[70vh] w-full flex-col rounded-t-2xl border-gray-200 bg-white shadow-xl md:max-h-128 md:rounded-lg md:border dark:border-gray-700 dark:bg-gray-800">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:block md:py-3 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Message Requests
              {requests.length > 0 && (
                <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {requests.length}
                </span>
              )}
            </h3>
            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 md:hidden dark:text-gray-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Requests List */}
          <div className="flex-1 overflow-y-auto">
            {requests.length > 0 ? (
              requests.map((request) => (
                <RequestCard
                  key={request._id}
                  request={request}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  isAccepting={isAccepting}
                  isDeclining={isDeclining}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-12 md:py-8">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                  <Check className="h-6 w-6 text-gray-400 dark:text-gray-100" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  All caught up!
                </p>
                <p className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400">
                  No pending message requests
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {requests.length > 0 && (
            <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3 md:py-2 dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={() => {
                  onViewAll?.();
                  if (window.innerWidth < 768) onClose?.();
                }}
                className="w-full rounded-md py-2.5 text-center text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 md:py-2 md:text-xs dark:text-blue-400 dark:hover:bg-gray-800"
              >
                View All Requests
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default RequestsDropdown;
