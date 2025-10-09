import { toast } from "react-toastify";

interface ErrorData {
  error: {
    data: {
      code: number;
      message: string;
    };
  };
}

export const showErrorConnectionMessage = (error: unknown): void => {
  const err = error as ErrorData;

  // Provide more specific error messages
  if (err.error) {
    const errorData = err.error.data;
    if (errorData) {
      if (errorData.code === 4004) {
        toast.error("Over capacity. Please try again later.");
      } else if (errorData.code === 4005) {
        toast.error("Path not found. Check your Pusher configuration.");
      } else if (errorData.code === 4006) {
        toast.error("Invalid version string.");
      } else if (errorData.code === 4007) {
        toast.error("Unsupported protocol version.");
      } else if (errorData.code === 4008) {
        toast.error("No protocol specified.");
      } else if (errorData.code === 4009) {
        toast.error("Connection is unauthorized. Check your Pusher key.");
      } else {
        toast.error(`Connection error: ${errorData.code}`);
      }
    } else {
      toast.error("Connection error. Retrying...");
    }
  } else {
    toast.error("Connection error. Retrying...");
  }
};

export default showErrorConnectionMessage;
