import { memo } from "react";
import dynamic from "next/dynamic";
import { useIsMobile } from "@/hooks/use-mobile";
import { Theme } from "emoji-picker-react";

const Picker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface EmojiPickerV2Props {
  onEmojiAppend: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiAppend }: EmojiPickerV2Props) {
  const isMobile = useIsMobile();

  return (
    <div className="mr-2">
      <Picker
        height={isMobile ? 300 : 400}
        width={isMobile ? 300 : 400}
        onEmojiClick={({ emoji }) => onEmojiAppend(emoji)}
        theme={Theme.AUTO}
      />
    </div>
  );
}

export default memo(EmojiPicker);
