import client from "@/lib/axios";
import { EmailRecoveryData } from "@/types/email";
import { AxiosErrorMessage } from "@/types/error";
import {
  UseBaseQueryResult,
  useMutation,
  UseMutationResult,
  useQuery,
} from "@tanstack/react-query";

export const useSendRecoveryEmail = (): UseMutationResult<
  void,
  AxiosErrorMessage,
  string
> => {
  const sendRecoveryEmail = async (email: string) => {
    const response = await client
      .post("/auth/recover", { email })
      .then((res) => res.data)
      .catch((err) => {
        console.error("Error sending recovery email:", err);
        throw err;
      });

    return response;
  };

  return useMutation({
    mutationKey: ["sendRecoveryEmail"],
    mutationFn: async (email: string) => sendRecoveryEmail(email),
  });
};

export const useGetRecoveryToken = (
  token: string,
): UseBaseQueryResult<EmailRecoveryData, AxiosErrorMessage> => {
  const getRecoveryToken = async (
    token: string,
  ): Promise<EmailRecoveryData> => {
    const response = await client
      .get("/auth/recover", { params: { token } })
      .then((res) => res.data)
      .catch((err) => {
        console.error("Error getting recovery token:", err);
        throw err;
      });

    return response;
  };

  return useQuery<EmailRecoveryData, AxiosErrorMessage>({
    queryKey: ["recovery"],
    queryFn: async () => getRecoveryToken(token),
    enabled: !!token,
  });
};

export const useRecoverPassword = (): UseMutationResult<
  void,
  AxiosErrorMessage,
  { token: string; newPassword: string },
  void
> => {
  const recoverPassword = async (
    token: string,
    newPassword: string,
  ): Promise<void> => {
    const response = await client
      .put("/auth/recover", { token, newPassword })
      .then((res) => res.data)
      .catch((err) => {
        console.error("Error recovering password:", err);
        throw err;
      });

    return response;
  };

  return useMutation({
    mutationKey: ["recoverPassword"],
    mutationFn: async (data: { token: string; newPassword: string }) =>
      recoverPassword(data.token, data.newPassword),
  });
};
