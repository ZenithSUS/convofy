import Image from "next/image";

interface MessageAvatarProps {
  avatar: string;
}

export function MessageAvatar({ avatar }: MessageAvatarProps) {
  return (
    <Image
      src={avatar || "/default-avatar.png"}
      alt="User Avatar"
      width={32}
      height={32}
      className="h-8 w-8 rounded-full"
    />
  );
}

export default MessageAvatar;
