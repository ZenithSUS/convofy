"use client";

import { toast, ToastContainer, TypeOptions, Id } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

let currentToastId: Id | null = null;

export const Toast = {
  show(message: string, type: TypeOptions = "default") {
    // Dismiss the current toast if it exists
    if (currentToastId !== null) {
      toast.dismiss(currentToastId);
    }

    // Show new toast and store its ID
    currentToastId = toast(message, {
      type,
      autoClose: 3000,
      onClose: () => {
        currentToastId = null;
      },
    });

    return currentToastId;
  },
  success: (message: string) => Toast.show(message, "success"),
  error: (message: string) => Toast.show(message, "error"),
  info: (message: string) => Toast.show(message, "info"),
  warn: (message: string) => Toast.show(message, "warning"),
};

export const ToastProvider = () => {
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      limit={1}
      newestOnTop
      closeOnClick
      pauseOnHover
      draggable
    />
  );
};
