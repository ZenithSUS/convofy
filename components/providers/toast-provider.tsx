"use client";

import { ToastContainer } from "react-toastify";

export const ToastProvider = () => {
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      limit={3}
      newestOnTop
    />
  );
};
