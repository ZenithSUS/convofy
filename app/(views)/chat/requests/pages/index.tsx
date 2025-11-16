"use client";

import ChatHeader, { Session } from "@/app/(views)/chat/components/chat-header";
import useHybridSession from "@/hooks/use-hybrid-session";
import useConnectionStatus from "@/store/connection-status-store";
import ConnectionStatus from "@/app/(views)/chat/[roomId]/components/connection-status";
import {
  useAcceptRoomInvite,
  useDeclineRoomInvite,
  useGetRoomInvites,
} from "@/hooks/use-room-invite";
import { useCallback, useMemo } from "react";
import Loading from "@/components/ui/loading";
import RequestCard from "@/app/(views)/chat/components/cards/request-card";
import { Toast } from "@/components/providers/toast-provider";
import { RoomRequest } from "@/types/room";
import ErrorMessage from "@/components/ui/error-message";

interface RequestListClientProps {
  serverSession: Session;
}

function RequestListClient({ serverSession }: RequestListClientProps) {
  const { session } = useHybridSession(serverSession);
  const { status: connectionStatus } = useConnectionStatus();
  const {
    data: messageRequests,
    isLoading: isMessageRequestsLoading,
    isFetching: isMessageRequestsFetching,
    isError: isMessageRequestsError,
    error: messageRequestsError,
    refetch,
  } = useGetRoomInvites(session.user.id);

  const isProcessing = useMemo(() => {
    return isMessageRequestsLoading || isMessageRequestsFetching;
  }, [isMessageRequestsLoading, isMessageRequestsFetching]);

  const messageRequestsData = useMemo<RoomRequest[]>(() => {
    if (!messageRequests) return [];

    return messageRequests.sort((a, b) => {
      const aLastMessage = new Date(a.lastMessage.createdAt || 0);
      const bLastMessage = new Date(b.lastMessage.createdAt || 0);

      return bLastMessage.getTime() - aLastMessage.getTime();
    });
  }, [messageRequests]);

  const { mutateAsync: acceptInvite, isPending: isAccepting } =
    useAcceptRoomInvite();
  const { mutateAsync: declineInvite, isPending: isDeclining } =
    useDeclineRoomInvite();

  const handleAccept = useCallback(
    async (roomId: string, userId: string) => {
      try {
        await acceptInvite({ roomId, userId });
        Toast.success("Request accepted successfully");
      } catch (error) {
        console.error("Error accepting room invite:", error);
        Toast.error("Error accepting room invite");
      }
    },
    [acceptInvite],
  );

  const handleDecline = useCallback(
    async (roomId: string, userId: string) => {
      try {
        await declineInvite({ userId, roomId });
        Toast.success("Request declined successfully");
      } catch (error) {
        console.error("Error declining room invite:", error);
        Toast.error("Error declining room invite");
      }
    },
    [declineInvite],
  );

  return (
    <div className="flex h-screen flex-col bg-linear-to-br from-slate-50 via-white to-blue-50/30">
      <div className="flex-1 overflow-y-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 shadow-sm backdrop-blur-xl">
          {connectionStatus !== "connected" && (
            <ConnectionStatus connectionStatus={connectionStatus} />
          )}

          <div className="px-4 py-3">
            <div className="flex-1">
              <ChatHeader session={session} />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="mx-auto px-4 py-6">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="animate-pulse">
                <Loading text="Loading requests" />
              </div>
            </div>
          ) : messageRequestsData.length > 0 ? (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Message Requests
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    {messageRequestsData.length} pending{" "}
                    {messageRequestsData.length === 1 ? "request" : "requests"}
                  </p>
                </div>
              </div>

              {/* Request Cards */}
              <div className="space-y-3">
                {messageRequestsData.map((request, index) => (
                  <div
                    key={request._id}
                    className="animate-in fade-in slide-in-from-bottom-4 duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <RequestCard
                      request={request}
                      onAccept={handleAccept}
                      onDecline={handleDecline}
                      isAccepting={isAccepting}
                      isDeclining={isDeclining}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : isMessageRequestsError ? (
            <div className="py-20">
              <ErrorMessage error={messageRequestsError} onClick={refetch} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="space-y-3 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-blue-50 to-indigo-100">
                  <svg
                    className="h-10 w-10 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    All caught up!
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You don&apos;t have any message requests at the moment
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RequestListClient;
