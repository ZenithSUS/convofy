import client from "@/lib/axios";
import { UserDataStats } from "@/types/user";
import {
  UseBaseQueryResult,
  useMutation,
  UseMutationResult,
  useQuery,
} from "@tanstack/react-query";

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

export const useUpdateUserStatus = (): UseMutationResult<
  { status: string },
  Error,
  { userId: string; status: string }
> => {
  const updateUserStatus = async (userId: string, status: string) => {
    const response = await client
      .put(`users/${userId}/status`, { status })
      .then((res) => res.data)
      .catch((err) => {
        console.error("Error updating user status:", err);
        throw err;
      });

    return response;
  };

  return useMutation({
    mutationKey: ["updateUserStatus"],
    mutationFn: async (data: { userId: string; status: string }) =>
      updateUserStatus(data.userId, data.status),
  });
};
