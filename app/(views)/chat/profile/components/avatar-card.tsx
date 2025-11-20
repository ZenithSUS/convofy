import { Session } from "@/app/(views)/chat/components/chat-header";
import UserImage from "@/app/(views)/chat/profile/components/user-image";
import { useMemo } from "react";

interface AvatarCardProps {
  children?: React.ReactNode;
  session: Session;
  name: string;
}

function AvatarCard({ children, session, name }: AvatarCardProps) {
  const userAvatar = useMemo(() => {
    if (session.user.isAnonymous && session.user.role === "user") {
      return session.user.anonAvatar || "/default-avatar.png";
    }

    if (session.user.isAnonymous && session.user.role === "anonymous") {
      return session.user.image || "/default-avatar.png";
    }

    return session.user.image || "/default-avatar.png";
  }, [session.user]);

  const userName = useMemo(() => {
    if (session.user.isAnonymous && session.user.role === "user") {
      return session.user.anonAlias || "Anonymous";
    }

    if (session.user.isAnonymous && session.user.role === "anonymous") {
      return session.user.name || "Anonymous";
    }

    return session.user.name || "User";
  }, [session.user]);

  return (
    <div className="relative -mt-20 mb-8">
      <div className="rounded-3xl border border-gray-300 bg-white p-6 shadow-2xl backdrop-blur-lg dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col items-center gap-3">
          <UserImage userImage={userAvatar} />
          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {userName}
            </p>
          </div>
        </div>

        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
}

export default AvatarCard;
