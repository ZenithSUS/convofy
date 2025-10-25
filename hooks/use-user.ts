import client from "@/lib/axios";
import { User, UserMediaDataStats, UserMessageDataStats } from "@/types/user";
import {
  UseBaseQueryResult,
  useMutation,
  UseMutationResult,
  useQuery,
} from "@tanstack/react-query";

export const useGetUserDataStats = (
  userId: string,
): UseBaseQueryResult<UserMediaDataStats, Error> => {
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

export const useGetUserMessageStats = (
  userId: string,
): UseBaseQueryResult<UserMessageDataStats, Error> => {
  const getUserMessageStats = async (userId: string) => {
    const response = await client
      .get(`users/${userId}/message-stats`)
      .then((res) => res.data)
      .catch((err) => {
        console.error("Error fetching user message stats:", err);
        throw err;
      });

    return response;
  };

  return useQuery({
    queryKey: ["userMessageStats", userId],
    queryFn: async () => getUserMessageStats(userId),
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

export const useUpdateUser = (): UseMutationResult<
  User,
  Error,
  Partial<User>,
  unknown
> => {
  const updateUser = async (data: Partial<User>) => {
    const response = await client
      .put(`users/me`, data)
      .then((res) => res.data)
      .catch((err) => {
        console.error("Error updating user:", err);
        throw err;
      });

    return response;
  };

  return useMutation({
    mutationKey: ["updateUser"],
    mutationFn: async (data: Partial<User>) => updateUser(data),
  });
};
