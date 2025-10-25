import { Session } from "@/app/(views)/chat/components/chat-header";
import UserImage from "@/app/(views)/chat/profile/components/user-image";

interface AvatarCardProps {
  session: Session;
  name: string;
}

function AvatarCard({ session, name }: AvatarCardProps) {
  return (
    <div className="relative -mt-20 mb-8">
      <div className="rounded-3xl border border-gray-300 bg-white p-6 shadow-2xl backdrop-blur-lg">
        <div className="flex flex-col items-center gap-3">
          <UserImage userImage={session.user.image} />
          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">{name}</h1>
            <p className="text-sm text-gray-600">{session.user.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AvatarCard;
