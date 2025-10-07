"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Smile } from "lucide-react";
import { memo } from "react";

const EmojiPicker = memo(
  dynamic(() => import("./emoji-picker"), {
    ssr: false,
    loading: () => <div className="p-2 text-sm">Loading emojis…</div>,
  }),
);

interface EmojiSelectionProps {
  onEmojiAppend: (emoji: string) => void;
}

export function EmojiSelection({ onEmojiAppend }: EmojiSelectionProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" type="button">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="relative w-fit">
        <EmojiPicker onEmojiAppend={onEmojiAppend} />
      </PopoverContent>
    </Popover>
  );
}

export default memo(EmojiSelection);
