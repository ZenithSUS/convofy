import client from "@/lib/axios";
import { CreateRoom, Room, RoomContent } from "@/types/room";
import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";

interface JoinRoom {
  roomId: string;
  userId: string;
}

export const useGetRooms = (
  searchQuery: string = "",
): UseQueryResult<Room[], unknown> => {
  const getRooms = async () => {
    const response = await client
      .get("/rooms", {
        params: {
          query: searchQuery,
        },
      })
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        console.error("Error fetching rooms:", err);
        throw err;
      });
    return response;
  };

  return useQuery({
    queryKey: ["rooms", searchQuery],
    queryFn: async () => getRooms(),
  });
};

export const useGetRoomById = (
  id: string,
): UseQueryResult<RoomContent, unknown> => {
  const getRoomById = async () => {
    const response = await client
      .get(`/rooms/${id}`)
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        console.error("Error fetching room:", err);
        throw err;
      });
    return response;
  };

  return useQuery({
    queryKey: ["room", id],
    queryFn: async () => getRoomById(),
    enabled: !!id,
  });
};

export const useGetRoomByUserId = (
  id: string,
  isAvailable: boolean,
  isSearch: boolean,
  searchQuery: string = "",
): UseQueryResult<RoomContent[], unknown> => {
  const getRoomByUserId = async (isSearch: boolean) => {
    const route = isSearch ? `/rooms/search` : `/rooms`;

    const response = await client
      .get(route, {
        params: {
          query: searchQuery,
        },
      })
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        console.error("Error fetching room:", err);
        throw err;
      });
    return response;
  };

  return useQuery({
    queryKey: ["rooms", id, searchQuery],
    queryFn: async () => getRoomByUserId(isSearch),
    enabled: !!id && isAvailable,
  });
};

export const useCreateRoom = (): UseMutationResult<
  Room,
  unknown,
  CreateRoom,
  Room
> => {
  const createRoom = async (data: CreateRoom) => {
    const response = await client
      .post("/rooms", data)
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        console.error("Failed to create room:", err);
        throw err;
      });

    return response;
  };

  return useMutation<Room, unknown, CreateRoom, Room>({
    mutationFn: async (data: CreateRoom) => createRoom(data),
    mutationKey: ["createRoom"],
  });
};

export const useGetOrCreatePrivateRoom = (): UseMutationResult<
  Room,
  unknown,
  { userA: string; userB: string },
  Room
> => {
  const queryClient = useQueryClient();
  const getOrCreatePrivateRoom = async (data: {
    userA: string;
    userB: string;
  }) => {
    const response = await client
      .post("/rooms/private", data)
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        console.error("Failed to get or create private room:", err);
        throw err;
      });
    return response;
  };

  return useMutation({
    mutationKey: ["privateRoom"],
    mutationFn: async (data: { userA: string; userB: string }) =>
      getOrCreatePrivateRoom(data),
    onSuccess: () => {
      // Invalidate rooms query to refetch
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["room"] });
    },
    onError: (err) => {
      console.error("Error getting or creating private room:", err);
      throw err;
    },
  });
};

export const useJoinRoom = (): UseMutationResult<
  Room,
  unknown,
  JoinRoom,
  Room
> => {
  const queryClient = useQueryClient();
  const joinRoom = async (data: JoinRoom) => {
    const response = await client
      .post(`/rooms/join`, data)
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        console.error("Failed to join room:", err);
        throw err;
      });

    return response;
  };

  return useMutation<Room, unknown, JoinRoom, Room>({
    mutationFn: async (data: JoinRoom) => joinRoom(data),
    mutationKey: ["joinRoom"],
    onSuccess: () => {
      // Invalidate rooms query to refetch
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["room"] });
    },
    onError: (err) => {
      console.error("Error joining room:", err);
      throw err;
    },
  });
};
