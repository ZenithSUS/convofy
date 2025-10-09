import axios from "axios";

const baseURL =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_BASE_URL_DEV
    : process.env.NEXT_PUBLIC_BASE_URL_PROD;

if (!baseURL) throw new Error("baseURL is not defined");

const client = axios.create({
  baseURL: `${baseURL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use((config) => {
  // You can add authorization headers or other custom headers here
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors globally
    return Promise.reject(error);
  },
);

export default client;
