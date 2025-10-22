import client from "@/lib/axios";
import {
  InfiniteData,
  useInfiniteQuery,
  UseInfiniteQueryResult,
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import {
  CreateMessage,
  MediaMessage,
  Message,
  MessageTyping,
} from "@/types/message";

export const useGetMessagesByRoom = (
  roomId: string,
  limit: number = 5,
): UseInfiniteQueryResult<InfiniteData<Message[], unknown>, Error> => {
  const getMessagesByRoom = async (
    roomId: string,
    limit: number,
    offset: number,
  ) => {
    const response = await client
      .get(`/message/${roomId}`, {
        params: {
          limit,
          offset,
        },
      })
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        console.error("Error fetching messages:", err);
        throw err;
      });

    return response;
  };

  return useInfiniteQuery<Message[], Error>({
    queryKey: ["messages", roomId],
    queryFn: async ({ pageParam = 0 }) =>
      getMessagesByRoom(roomId, limit, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length < limit ? undefined : allPages.length * limit;
    },
    select: (data) => ({ pages: data.pages, pageParams: data.pageParams }),
    placeholderData: { pages: [], pageParams: [] },
    refetchOnWindowFocus: false,
    networkMode: "offlineFirst",
  });
};

export const useGetMessagesByUserAndMedia = (
  userId: string,
  limit: number,
): UseInfiniteQueryResult<InfiniteData<MediaMessage[], unknown>, Error> => {
  const getMessagesByUserAndMedia = async (
    userId: string,
    limit: number,
    offset: number,
  ) => {
    const response = await client
      .get(`message/media/${userId}`, {
        params: {
          limit,
          offset,
        },
      })
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        console.error("Error fetching messages:", err);
        throw err;
      });
    return response;
  };

  return useInfiniteQuery<MediaMessage[], Error>({
    queryKey: ["mediaMessages", userId],
    queryFn: async ({ pageParam = 0 }) =>
      getMessagesByUserAndMedia(userId, limit, pageParam as number),
    initialPageParam: 0,
    select: (data) => ({ pages: data.pages, pageParams: data.pageParams }),
    placeholderData: { pages: [], pageParams: [] },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length < limit ? undefined : allPages.length * limit;
    },
    refetchOnWindowFocus: false,
    networkMode: "offlineFirst",
    enabled: !!userId,
  });
};

export const useSendMessage = (): UseMutationResult<
  Message[],
  unknown,
  CreateMessage,
  Message[]
> => {
  const queryClient = useQueryClient();
  const sendMessage = async (data: CreateMessage) => {
    const response = await client
      .post("/message", data)
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        console.error("Error sending message:", err);
        throw err;
      });

    return response;
  };

  return useMutation({
    mutationKey: ["messages"],
    mutationFn: async (data: CreateMessage) => sendMessage(data),
    onSuccess: (data: Message[], variables: CreateMessage) => {
      // Update the cache with the new message
      queryClient.setQueryData(
        ["messages", variables.room],
        (
          old:
            | import("@tanstack/react-query").InfiniteData<Message[]>
            | undefined,
        ) => {
          if (!old) {
            return {
              pages: [data],
              pageParams: [],
            };
          }

          // Flatten all messages from all pages
          const allMessages = old.pages.flat();

          // Prevent duplicate messages
          const hasDuplicates = data.some((newMsg) =>
            allMessages.some((existingMsg) => existingMsg._id === newMsg._id),
          );

          if (hasDuplicates) return old;

          // Append the new messages to the last page
          const newPages = [...old.pages];
          newPages[newPages.length - 1] = [
            ...newPages[newPages.length - 1],
            ...data,
          ];

          return {
            ...old,
            pages: newPages,
          };
        },
      );

      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
};

export const useSendLiveMessage = (): UseMutationResult<
  Message[],
  unknown,
  CreateMessage,
  Message[]
> => {
  const sendMessage = async (data: CreateMessage) => {
    const response = await client
      .post("/chat", data)
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        console.error("Error sending message:", err);
        throw err;
      });

    return response;
  };

  return useMutation({
    mutationKey: ["messages"],
    mutationFn: async (data: CreateMessage) => sendMessage(data),
  });
};

export const useCheckTyping = (): UseMutationResult<
  MessageTyping,
  unknown,
  MessageTyping
> => {
  const checkTyping = async (data: MessageTyping) => {
    const response = await client
      .post("/typing", data)
      .then((res) => res.data)
      .catch((err) => {
        console.log("Failed to defined typing", err);
        throw err;
      });

    return response;
  };

  return useMutation({
    mutationKey: ["typing"],
    mutationFn: async (data: MessageTyping) => checkTyping(data),
  });
};

export const useDeleteMessage = (): UseMutationResult<
  { message: string },
  unknown,
  string,
  unknown
> => {
  const queryClient = useQueryClient();
  const deleteMessage = async (messageId: string) => {
    const response = await client
      .delete(`/message/${messageId}`)
      .then((res) => res.data)
      .catch((err) => {
        console.error("Error deleting message:", err);
        throw err;
      });

    return response;
  };

  return useMutation({
    mutationKey: ["deleteMessage"],
    mutationFn: async (messageId: string) => deleteMessage(messageId),
    onSuccess: () => {
      // Invalidate messages query to refetch
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
};

export const useDeleteLiveMessage = () => {
  const deleteLiveMessage = async (messageId: string) => {
    const response = await client
      .delete(`chat/${messageId}`)
      .then((res) => res.data)
      .catch((err) => {
        console.error("Error deleting message:", err);
        throw err;
      });

    return response;
  };

  return useMutation({
    mutationKey: ["deleteMessage"],
    mutationFn: async (messageId: string) => deleteLiveMessage(messageId),
  });
};

export const useUpdateLiveMessage = () => {
  const updateMessage = async (id: string, content: string) => {
    const response = await client
      .put(`/chat/${id}`, { content })
      .then((res) => res.data)
      .catch((err) => {
        console.error("Error updating message:", err);
        throw err;
      });
    return response;
  };

  return useMutation({
    mutationKey: ["updateMessage"],
    mutationFn: async (data: { id: string; content: string }) =>
      updateMessage(data.id, data.content),
  });
};
