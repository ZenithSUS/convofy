import client from "@/services/axios";
import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { CreateMessage, Message } from "@/types/message";

export const useGetMessagesByRoom = (
  roomId: string,
): UseQueryResult<Message[], unknown> => {
  const getMessagesByRoom = async (roomId: string) => {
    const response = await client
      .get(`/message/${roomId}`)
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        console.error("Error fetching messages:", err);
        throw err;
      });

    return response;
  };

  return useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => getMessagesByRoom(roomId),
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
      queryClient.setQueryData(
        ["messages", variables.room],
        (old: Message[]) => [...old, data],
      );
    },
  });
};
