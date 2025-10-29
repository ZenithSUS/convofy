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

const EmojiPicker = dynamic(() => import("./emoji-picker"), {
  ssr: false,
  loading: () => <p className="p-2 text-sm">Loading Emojis...</p>,
});

interface EmojiSelectionV2Props {
  onEmojiAppend: (emoji: string) => void;
}

export function EmojiSelection({ onEmojiAppend }: EmojiSelectionV2Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" type="button">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="relative w-auto overflow-hidden p-0">
        <EmojiPicker onEmojiAppend={onEmojiAppend} />
      </PopoverContent>
    </Popover>
  );
}

export default memo(EmojiSelection);
