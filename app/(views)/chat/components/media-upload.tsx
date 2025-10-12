import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileIcon, Loader2 } from "lucide-react";

import { ChangeEvent, useRef } from "react";

interface MediaUploadProps {
  onChange: (value: ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
}

export function MediaUpload({ onChange, isUploading }: MediaUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <Input
        ref={fileRef}
        id="file-upload"
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt,.gif,.mp4,.mp3"
        className="hidden"
        onChange={onChange}
        multiple
      />
      <Button
        disabled={isUploading}
        size="icon"
        variant="ghost"
        type="button"
        onClick={() => fileRef.current?.click()}
      >
        {isUploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileIcon />
        )}
      </Button>
    </div>
  );
}

export default MediaUpload;
