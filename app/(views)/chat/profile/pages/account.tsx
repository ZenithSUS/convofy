"use client";

// Hooks
import useHybridSession from "@/hooks/use-hybrid-session";
import { useIsMobile } from "@/hooks/use-mobile";

// Types
import { Session } from "@/app/(views)/chat/components/chat-header";

// Components
import ProfileHeader from "@/app/(views)/chat/profile/components/profile-header";
import AvatarCard from "@/app/(views)/chat/profile/components/avatar-card";
import ChangeEmail from "@/app/(views)/chat/profile/account/components/change-email";
import ChangePassword from "@/app/(views)/chat/profile/account/components/change-password";
import ConnectedAccounts from "@/app/(views)/chat/profile/account/components/connected-accounts";
import SessionManagement from "@/app/(views)/chat/profile/account/components/session-management";
import DangerZone from "@/app/(views)/chat/profile/account/components/danger-zone";
import AccountInfo from "@/app/(views)/chat/profile/account/components/account-into";
import { useMemo } from "react";

function AccountPageClient({ serverSession }: { serverSession: Session }) {
  const { session } = useHybridSession(serverSession);

  const isMobile = useIsMobile();
  const accountCreationDate = new Date(session.user.createdAt || "2024-01-01");
  const isAnonymous = useMemo<boolean>(() => {
    if (session.user.isAnonymous && session.user.role === "anonymous") {
      return true;
    }

    return false;
  }, [session]);

  const isGoogleAuth = session.user.linkedAccounts.some(
    (account) => account.provider === "google",
  );

  const isCredentialsAuth = session.user.linkedAccounts.some(
    (account) => account.provider === "credentials",
  );

  const isGitHubAuth = session.user.linkedAccounts.some(
    (account) => account.provider === "github",
  );

  const isDiscordAuth = session.user.linkedAccounts.some(
    (account) => account.provider === "discord",
  );

  const isAnyOAuth = useMemo(() => {
    return isGoogleAuth || isGitHubAuth || isDiscordAuth;
  }, [isGoogleAuth, isGitHubAuth, isDiscordAuth]);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header Background */}
      <ProfileHeader
        userId={session.user.id}
        sessionId={session.user.sessionId}
      />

      <div className="relative mx-auto max-w-7xl px-3 pb-8 sm:px-4 md:px-6">
        {/* User Avatar Card */}
        <AvatarCard session={session} name="Account Settings" />

        {/* Account Info Card */}
        <AccountInfo
          session={session}
          accountCreationDate={accountCreationDate}
          isMobile={isMobile}
        />

        {/* Change Password */}
        {!isAnonymous && isCredentialsAuth && (
          <ChangePassword session={session} />
        )}

        {/* Change Email */}
        {!isAnonymous && isCredentialsAuth && <ChangeEmail session={session} />}

        {/* Connected Accounts */}
        {!isAnonymous && (
          <ConnectedAccounts
            session={session}
            isCredentialsAuth={isCredentialsAuth}
            isGoogleAuth={isGoogleAuth}
            isGitHubAuth={isGitHubAuth}
            isDiscordAuth={isDiscordAuth}
            isAnyOAuth={isAnyOAuth}
            isMobile={isMobile}
          />
        )}

        {/* Session Management */}
        <SessionManagement session={session} />

        {/* Danger Zone */}
        {!isAnonymous && (
          <DangerZone
            session={session}
            linkedAccounts={session.user.linkedAccounts}
          />
        )}
      </div>
    </div>
  );
}

export default AccountPageClient;
