import client from "@/services/axios";
import { UserDataStats } from "@/types/user";
import { UseBaseQueryResult, useQuery } from "@tanstack/react-query";

export const useGetUserDataStats = (
  userId: string,
): UseBaseQueryResult<UserDataStats, Error> => {
  const getUserDataStats = async (userId: string) => {
    const response = await client
      .get(`users/${userId}/stats`)
      .then((res) => res.data)
      .catch((err) => {
        console.error("Error fetching user stats:", err);
        throw err;
      });

    return response;
  };

  return useQuery({
    queryKey: ["userDataStats", userId],
    queryFn: async () => getUserDataStats(userId),
    enabled: !!userId,
  });
};
