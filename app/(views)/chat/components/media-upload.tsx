import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileIcon } from "lucide-react";

import { ChangeEvent, useRef } from "react";

interface MediaUploadProps {
  onChange: (value: ChangeEvent<HTMLInputElement>) => void;
}

export function MediaUpload({ onChange }: MediaUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <Input
        ref={fileRef}
        id="file-upload"
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt,.zip"
        className="hidden"
        onChange={onChange}
      />
      <Button
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
