import client from "@/services/axios";
import { CreateRoom, Room } from "@/types/room";
import {
  useMutation,
  UseMutationResult,
  useQuery,
  UseQueryResult,
} from "@tanstack/react-query";

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
