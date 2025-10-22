import client from "@/lib/axios";
import { useState } from "react";

interface UploadResponse {
  secure_url: string;
}

export const useUploadImage = () => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const response: { data: UploadResponse } = await client.post(
        "/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      return response.data.secure_url;
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading };
};
