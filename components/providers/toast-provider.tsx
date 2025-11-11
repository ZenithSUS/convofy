"use client";

import { toast, ToastContainer, TypeOptions } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TOAST_ID = "latest-toast";

export const Toast = {
  show: (message: string, type: TypeOptions = "default") => {
    toast(message, { toastId: TOAST_ID, type });
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
    />
  );
};
