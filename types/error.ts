import { AxiosError } from "axios/";

export type AxiosErrorMessage = AxiosError & {
  response: {
    data: {
      error: string;
    };
  };
};
