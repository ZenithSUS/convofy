import client from "@/lib/axios";
import { AxiosErrorMessage } from "@/types/error";
import { RoomRequest } from "@/types/room";
import {
  UseBaseMutationResult,
  UseBaseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export const useGetRoomInvites = (
  userId: string,
): UseBaseQueryResult<RoomRequest[], AxiosErrorMessage> => {
  const getRoomInvites = async () => {
    const response = await client
      .get(`/rooms/invites/${userId}`)
      .then((res) => res.data)
      .catch((err) => {
        console.error("Error fetching room invites:", err);
        throw err;
      });

    return response;
  };

  return useQuery({
    queryKey: ["roomInvites", userId],
    queryFn: async () => getRoomInvites(),
    enabled: !!userId,
  });
};

export const useAcceptRoomInvite = (): UseBaseMutationResult<
  void,
  AxiosErrorMessage,
  { roomId: string; userId: string }
> => {
  const queryClient = useQueryClient();
  const acceptRoomInvite = async (roomId: string, userId: string) => {
    const response = await client
      .post(`/rooms/invites/accept`, { roomId, userId })
      .then((res) => res.data)
      .catch((err) => {
        console.error("Error accepting room invite:", err);
        throw err;
      });

    return response;
  };

  return useMutation({
    mutationKey: ["acceptRoomInvite"],
    mutationFn: async (data: { roomId: string; userId: string }) =>
      acceptRoomInvite(data.roomId, data.userId),
    onSuccess: (_, variables) => {
      queryClient.setQueryData(
        ["roomInvites", variables.userId],
        (prevInvites: RoomRequest[]) => {
          return prevInvites.filter((prev) => prev._id !== variables.roomId);
        },
      );
    },
  });
};

export const useDeclineRoomInvite = (): UseBaseMutationResult<
  void,
  AxiosErrorMessage,
  { userId: string; roomId: string }
> => {
  const queryClient = useQueryClient();
  const declineRoomInvite = async (userId: string, roomId: string) => {
    const response = await client
      .post(`/rooms/invites/decline`, { userId, roomId })
      .then((res) => res.data)
      .catch((err) => {
        console.error("Error declining room invite:", err);
        throw err;
      });

    return response;
  };

  return useMutation({
    mutationKey: ["declineRoomInvite"],
    mutationFn: async (data: { userId: string; roomId: string }) =>
      declineRoomInvite(data.userId, data.roomId),
    onSuccess: (_, variables) => {
      queryClient.setQueryData(
        ["roomInvites", variables.userId],
        (prevInvites: RoomRequest[]) => {
          return prevInvites.filter((prev) => prev._id !== variables.roomId);
        },
      );
    },
  });
};
