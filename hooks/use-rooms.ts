import client from "@/services/axios";
import { CreateRoom, Room } from "@/types/room";
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

export const useGetRoomById = (id: string): UseQueryResult<Room, unknown> => {
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
  });
};

export const useGetRoomByUserId = (
  id: string,
  isSearch: boolean,
  searchQuery: string = "",
): UseQueryResult<Room[], unknown> => {
  const getRoomByUserId = async (isSearch: boolean) => {
    const route = isSearch ? `/rooms` : `/rooms/user/${id}`;

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
    queryKey: ["room", id, searchQuery],
    queryFn: async () => getRoomByUserId(isSearch),
    enabled: !!id,
  });
};

export const useCreateRoom = (): UseMutationResult<
  Room,
  unknown,
  CreateRoom,
  Room
> => {
  const queryClient = useQueryClient();
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
    onSuccess: () => {
      // Invalidate rooms query to refetch
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
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
  });
};
