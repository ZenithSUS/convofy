import client from "@/services/axios";
import { Room } from "@/types/room";
import { useQuery, UseQueryResult } from "@tanstack/react-query";

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
