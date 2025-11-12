"use client";

import { Button } from "@/components/ui/button";
import { FileInfo } from "@/types/file";
import { FileIcon } from "lucide-react";
import Image from "next/image";

interface MediaPreviewProps {
  selectedFiles: FileInfo[];
  setSelectedFiles: (files: FileInfo[]) => void;
  handleRemoveFile: (index: number) => void;
  isUploading: boolean;
}

function MediaPreview({
  selectedFiles,
  setSelectedFiles,
  handleRemoveFile,
  isUploading,
}: MediaPreviewProps) {
  return (
    <div className="border-b bg-gray-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Selected Files ({selectedFiles.length})
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedFiles([])}
          disabled={isUploading}
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          Clear All
        </Button>
      </div>
      <div className="grid max-h-48 grid-cols-2 gap-3 overflow-y-auto md:grid-cols-4 lg:grid-cols-6">
        {selectedFiles.map((file, index) => {
          if (file.type.startsWith("image")) {
            return (
              <div
                key={file.id}
                className="group relative overflow-hidden rounded-lg shadow-sm transition-all hover:shadow-md"
              >
                <Image
                  src={file.image}
                  alt={file.name}
                  width={0}
                  height={0}
                  className="h-24 w-full object-cover"
                  unoptimized={file.image.startsWith("data:image")}
                  priority
                />
                <button
                  className="absolute top-1 right-1 rounded-full bg-red-500 p-1.5 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 hover:bg-red-600"
                  disabled={isUploading}
                  onClick={() => handleRemoveFile(index)}
                >
                  <span className="text-xs font-bold">✕</span>
                </button>
              </div>
            );
          } else if (
            file.type.startsWith("application") ||
            file.type.startsWith("text")
          ) {
            return (
              <div
                key={file.id}
                className="group relative rounded-lg border-2 border-dashed border-gray-300 bg-white transition-all hover:border-blue-400"
              >
                <div className="flex h-24 items-center gap-2 p-3">
                  <FileIcon className="h-6 w-6 shrink-0 text-gray-500" />
                  <span className="flex-1 truncate text-xs">{file.name}</span>
                </div>
                <button
                  className="absolute top-1 right-1 rounded-full bg-red-500 p-1.5 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 hover:bg-red-600"
                  onClick={() => handleRemoveFile(index)}
                  disabled={isUploading}
                >
                  <span className="text-xs font-bold">✕</span>
                </button>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

export default MediaPreview;
