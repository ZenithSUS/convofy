import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileIcon } from "lucide-react";

import { ChangeEvent, useRef } from "react";

interface MediaUploadProps {
  onChange: (value: ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  disabled?: boolean;
}

export function MediaUpload({
  onChange,
  isUploading,
  disabled,
}: MediaUploadProps) {
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
        disabled={disabled}
        multiple
      />
      <Button
        disabled={isUploading || disabled}
        size="icon"
        variant="ghost"
        type="button"
        onClick={() => fileRef.current?.click()}
      >
        <FileIcon />
      </Button>
    </div>
  );
}

export default MediaUpload;
