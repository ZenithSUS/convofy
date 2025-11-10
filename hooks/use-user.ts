import client from "@/lib/axios";
import { UserSession } from "@/models/User";
import { EmailChangeData, EmailTokenData } from "@/types/email";
import { AxiosErrorMessage } from "@/types/error";
import {
  CreateLinkedAccount,
  User,
  UserChangePassword,
  UserLinkedAccount,
  UserMediaDataStats,
  UserMessageDataStats,
} from "@/types/user";
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

export const useChangePassword = (): UseMutationResult<
  User,
  Error,
  UserChangePassword,
  unknown
> => {
  const changePassword = async (
    id: string,
    currentPassword: string,
    newPassword: string,
  ) => {
    const response = client
      .patch("users/me/password", { id, currentPassword, newPassword })
      .then((res) => res.data)
      .catch((err) => {
        console.error("Error changing password:", err);
        throw err;
      });

    return response;
  };

  return useMutation({
    mutationKey: ["changePassword"],
    mutationFn: async (data: UserChangePassword) =>
      changePassword(data.id, data.oldPassword, data.newPassword),
  });
};

export const useLinkUserCredentials = (): UseMutationResult<
  User,
  Error,
  CreateLinkedAccount,
  unknown
> => {
  const linkUserCredentials = async (
    id: string,
    credentials: { email: string; password: string },
    linkedAccount: UserLinkedAccount,
  ) => {
    const response = await client
      .post(`/auth/${id}/link`, { credentials, linkedAccount })
      .then((res) => res.data)
      .catch((err) => {
        console.error("Error linking user credentials:", err);
        throw err;
      });

    return response;
  };

  return useMutation({
    mutationKey: ["linkUserCredentials"],
    mutationFn: async (data: CreateLinkedAccount) =>
      linkUserCredentials(data.id, data.credentials, data.linkedAccount),
  });
};

export const useUnlinkUserCredentials = () => {
  const unlinkUserCredentials = async (
    id: string,
    accountType: UserLinkedAccount,
  ) => {
    const response = await client
      .patch(`/auth/${id}/unlink`, { accountType })
      .then((res) => res.data)
      .catch((err) => {
        console.error("Error unlinking user credentials:", err);
        throw err;
      });

    return response;
  };

  return useMutation({
    mutationKey: ["unlinkUserCredentials"],
    mutationFn: async (data: { id: string; accountType: UserLinkedAccount }) =>
      unlinkUserCredentials(data.id, data.accountType),
  });
};

export const useGetUserSessions = (): UseBaseQueryResult<
  UserSession[],
  Error
> => {
  const getUserSessions = async () => {
    const response = await client
      .get("/sessions")
      .then((res) => res.data)
      .catch((err) => {
        console.error("Error fetching user sessions:", err);
        throw err;
      });

    return response;
  };

  return useQuery({
    queryKey: ["userSessions"],
    queryFn: async () => getUserSessions(),
  });
};

export const useRemoveAllUserSessions = (): UseMutationResult<
  void,
  Error,
  { exceptCurrent: boolean },
  unknown
> => {
  const removeAllUserSessions = async (exceptCurrent: boolean) => {
    const response = await client
      .post("/sessions/revoke-all", { exceptCurrent })
      .then((res) => res.data)
      .catch((err) => {
        console.error("Error removing user sessions:", err);
        throw err;
      });

    return response;
  };

  return useMutation({
    mutationKey: ["removeAllUserSessions"],
    mutationFn: async (data: { exceptCurrent: boolean }) =>
      removeAllUserSessions(data.exceptCurrent),
  });
};

export const useChangeUserEmail = (): UseMutationResult<
  void,
  Error,
  { newEmail: string; currentPassword: string }
> => {
  const changeUserEmail = async (newEmail: string, currentPassword: string) => {
    const response = await client
      .post("/users/email/change", {
        newEmail,
        currentPassword,
      })
      .then((res) => res.data)
      .catch((err) => {
        console.error("There is something wrong in changing the email:", err);
        throw err;
      });

    return response;
  };

  return useMutation({
    mutationKey: ["changeEmail"],
    mutationFn: async (data: { newEmail: string; currentPassword: string }) =>
      changeUserEmail(data.newEmail, data.currentPassword),
  });
};

export const useChangeEmailToken = (
  userId: string,
  token: string,
): UseBaseQueryResult<EmailTokenData, AxiosErrorMessage> => {
  const changeEmailToken = async (token: string): Promise<EmailTokenData> => {
    const response = await client
      .get("users/email/verify", { params: { token } })
      .then((res) => res.data)
      .catch((err) => {
        console.error("There is something wrong in changing the email:", err);
        throw err;
      });

    return response;
  };

  return useQuery<EmailTokenData, AxiosErrorMessage>({
    queryKey: ["changeEmailToken", userId],
    queryFn: async () => changeEmailToken(token),
    enabled: !!userId,
  });
};

export const useChangeEmail = (): UseMutationResult<
  User,
  AxiosErrorMessage,
  EmailChangeData,
  unknown
> => {
  const changeEmail = async (data: EmailChangeData) => {
    const response = await client
      .post("/users/email/verify", data)
      .then((res) => res.data)
      .catch((err) => {
        console.error("There is something wrong in changing the email:", err);
        throw err;
      });

    return response;
  };

  return useMutation({
    mutationKey: ["changeEmail"],
    mutationFn: async (data: EmailChangeData) => changeEmail(data),
  });
};
