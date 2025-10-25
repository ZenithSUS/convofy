import { Input } from "@/components/ui/input";
import { ChangeEvent } from "react";

interface MessageSearchbarProps {
  onSearch: (query: ChangeEvent<HTMLInputElement>) => void;
}

function MessageSearchbar({ onSearch }: MessageSearchbarProps) {
  return (
    <div className="my-4 flex-1 rounded-md">
      <Input placeholder="Search messages" onChange={onSearch} />
    </div>
  );
}

export default MessageSearchbar;
