export const baseFolder =
  process.env.NODE_ENV === "development" ? "convofy-dev" : "convofy";

export const baseUrl =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_BASE_URL_PROD
    : process.env.NEXT_PUBLIC_BASE_URL_DEV;
