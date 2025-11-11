import client from "@/lib/axios";
import { useState } from "react";

export const useDeleteFile = () => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteFile = async (publicId?: string, folder?: string) => {
    try {
      setIsDeleting(true);
      const response = client
        .delete("/upload", {
          params: {
            publicId,
            folder,
          },
        })
        .then((res) => res.data)
        .catch((err) => {
          console.error("Error deleting file:", err);
          throw err;
        });

      return response;
    } catch (error) {
      console.error("Error deleting file:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteFile, isDeleting };
};
