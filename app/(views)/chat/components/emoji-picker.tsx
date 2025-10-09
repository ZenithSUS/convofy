"use client";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { memo } from "react";

interface EmojiPickerProps {
  onEmojiAppend: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiAppend }: EmojiPickerProps) {
  return (
    <div className="absolute -right-20 bottom-0 w-[300px] overflow-scroll md:-right-22 md:w-[400px] md:max-w-[400px]">
      <Picker
        theme="dark"
        data={data}
        onEmojiSelect={(emoji: { native: string }) =>
          onEmojiAppend(emoji.native)
        }
      />
    </div>
  );
}

export default memo(EmojiPicker);
