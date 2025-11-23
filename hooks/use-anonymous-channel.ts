import { pusherClient } from "@/lib/pusher/pusher-client";
import { PusherChannel } from "@/types/pusher";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { AxiosErrorMessage } from "@/types/error";

interface MatchPreferences {
  interests: string[];
  language: string;
}

interface MatchFoundEvent {
  roomId: string;
  partner: {
    id: string;
  };
}

interface UseAnonymousMatchingReturn {
  isSearching: boolean;
  isMatched: boolean;
  matchedRoomId: string | null;
  isCancelling: boolean;
  startSearching: (preferences: MatchPreferences) => Promise<void>;
  cancelSearch: () => Promise<void>;
  error: string | null;
}

interface JoinRoomResponse {
  data: {
    roomId: string;
    matched: boolean;
    searching: boolean;
  };
}

interface CheckMatchStatusResponse {
  data: {
    status: string;
    matched: boolean;
    roomId?: string;
    partnerId?: string;
  };
}

function useAnonymousMatching(
  userId: string,
  isAnonymous: boolean,
): UseAnonymousMatchingReturn {
  const router = useRouter();
  const isMountedRef = useRef(false);
  const currentChannel = useRef<PusherChannel | null>(null);
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [matchedRoomId, setMatchedRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check match status periodically (fallback if Pusher fails)
  const checkMatchStatus = useCallback(async () => {
    if (!isAnonymous || !userId) return;

    try {
      const response: CheckMatchStatusResponse =
        await axios.get("/api/match/status");
      const data = response.data;

      if (data.status === "matched" && data.roomId) {
        setIsMatched(true);
        setMatchedRoomId(data.roomId);
        setIsSearching(false);

        // Clear interval
        if (statusCheckInterval.current) {
          clearInterval(statusCheckInterval.current);
          statusCheckInterval.current = null;
        }

        // Navigate to chat room
        setTimeout(() => {
          router.push(`/chat/${data.roomId}`);
        }, 1000);
      } else if (data.status === "cancelled") {
        setIsSearching(false);
        setError("Search was cancelled");

        if (statusCheckInterval.current) {
          clearInterval(statusCheckInterval.current);
          statusCheckInterval.current = null;
        }
      }
    } catch (err) {
      console.error("Error checking match status:", err);
    }
  }, [isAnonymous, userId, router]);

  // Start searching for a match
  const startSearching = useCallback(
    async (preferences: MatchPreferences) => {
      if (!isAnonymous || !userId) {
        setError("User must be anonymous to use matching");
        return;
      }

      setIsSearching(true);
      setIsMatched(false);
      setMatchedRoomId(null);
      setError(null);

      try {
        const response: JoinRoomResponse = await axios.post("/api/match/join", {
          userId,
          preferences,
        });

        const data = response.data;

        if (data.matched && data.roomId) {
          // Immediate match found
          setIsMatched(true);
          setMatchedRoomId(data.roomId);
          setIsSearching(false);

          setTimeout(() => {
            router.push(`/chat/${data.roomId}`);
          }, 1000);
        } else if (data.searching) {
          // Still searching, start polling
          statusCheckInterval.current = setInterval(checkMatchStatus, 3000);
        }
      } catch (err: unknown) {
        const error = err as AxiosErrorMessage;
        console.error("Error starting search:", err);
        setError(error.response?.data?.error || "Failed to start search");
        setIsSearching(false);
        toast.error("Failed to start search. Please try again.");
      }
    },
    [isAnonymous, userId, router, checkMatchStatus],
  );

  // Cancel the search
  const cancelSearch = useCallback(async () => {
    if (!userId) return;

    try {
      setIsCancelling(true);
      await axios.post("/api/match/cancel", { userId });

      setIsSearching(false);
      setIsMatched(false);
      setMatchedRoomId(null);
      setError(null);

      // Clear polling interval
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
        statusCheckInterval.current = null;
      }

      toast.info("Search cancelled");
    } catch (err) {
      console.error("Error cancelling search:", err);
      toast.error("Failed to cancel search");
    } finally {
      setIsCancelling(false);
    }
  }, [userId]);

  // Subscribe to the Pusher channel for real-time notifications
  useEffect(() => {
    isMountedRef.current = true;

    if (!isAnonymous || !userId) return;

    const cleanupChannel = () => {
      if (currentChannel.current) {
        const channelName = currentChannel.current.name;
        currentChannel.current.unbind_all();

        try {
          pusherClient.unsubscribe(channelName);
        } catch (error) {
          console.error("Error unsubscribing from channel:", error);
        }
        currentChannel.current = null;
      }
    };

    const channelName = `private-user-${userId}`;

    // Clean up existing channel
    if (
      !currentChannel.current ||
      currentChannel.current.name !== channelName
    ) {
      const existingChannel = pusherClient.channel(channelName);
      if (existingChannel) {
        existingChannel.unbind_all();
        pusherClient.unsubscribe(channelName);
      }

      const channel = pusherClient.subscribe(channelName);
      currentChannel.current = channel;

      // Listen for match found event
      channel.bind("match-found", (data: MatchFoundEvent) => {
        if (!isMountedRef.current) return;

        setIsMatched(true);
        setMatchedRoomId(data.roomId);
        setIsSearching(false);

        // Clear polling interval
        if (statusCheckInterval.current) {
          clearInterval(statusCheckInterval.current);
          statusCheckInterval.current = null;
        }

        toast.success("Match found! Redirecting...");
        setTimeout(() => {
          router.push(`/chat/${data.roomId}`);
        }, 1000);
      });

      // Listen for search cancelled event
      channel.bind("search-cancelled", () => {
        if (!isMountedRef.current) return;

        setIsSearching(false);
        setError("Search was cancelled");

        // Clear polling interval
        if (statusCheckInterval.current) {
          clearInterval(statusCheckInterval.current);
          statusCheckInterval.current = null;
        }
      });
    }

    return () => {
      isMountedRef.current = false;
      cleanupChannel();

      // Clear polling interval on unmount
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
        statusCheckInterval.current = null;
      }
    };
  }, [userId, isAnonymous, router]);

  useEffect(() => {
    if (!isAnonymous) return;

    const interval = setInterval(() => {
      axios.post("/api/match/heartbeat");
    }, 15000);

    if (!isSearching) clearInterval(interval);

    return () => clearInterval(interval);
  }, [isSearching, isAnonymous]);

  return {
    isSearching,
    isMatched,
    matchedRoomId,
    startSearching,
    isCancelling,
    cancelSearch,
    error,
  };
}

export default useAnonymousMatching;
