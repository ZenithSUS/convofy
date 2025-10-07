"use client";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { memo } from "react";

interface EmojiPickerProps {
  onEmojiAppend: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiAppend }: EmojiPickerProps) {
  return (
    <div className="absolute -right-14 bottom-0">
      <Picker
        theme="dark"
        data={data}
        onEmojiSelect={(emoji: any) => onEmojiAppend(emoji.native)}
      />
    </div>
  );
}

export default memo(EmojiPicker);
