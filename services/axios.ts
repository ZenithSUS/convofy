import axios from "axios";

if (!process.env.NEXT_PUBLIC_BASE_URL)
  throw new Error("NEXT_PUBLIC_BASE_URL is not defined");

const client = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BASE_URL}/api`,
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
