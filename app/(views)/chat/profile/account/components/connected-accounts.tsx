"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link2, AlertCircle } from "lucide-react";
import { Session } from "@/app/(views)/chat/components/chat-header";
import { signIn } from "next-auth/react";
import { useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUnlinkUserCredentials } from "@/hooks/use-user";
import { UserOAuthProviders } from "@/types/user";
import AccountCard, { AccountProvider } from "./account-card";

interface ConnectedAccountsProps {
  session: Session;
  isCredentialsAuth: boolean;
  isGoogleAuth: boolean;
  isGitHubAuth: boolean;
  isDiscordAuth: boolean;
  isAnyOAuth: boolean;
  isMobile: boolean;
}

function ConnectedAccounts({
  session,
  isCredentialsAuth,
  isGoogleAuth,
  isGitHubAuth,
  isDiscordAuth,
  isAnyOAuth,
  isMobile,
}: ConnectedAccountsProps) {
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState({
    credentials: false,
    google: false,
    github: false,
    discord: false,
  });

  const { mutateAsync: unlinkAuth, isPending: isUnlinking } =
    useUnlinkUserCredentials();

  const linkedAccounts = session.user.linkedAccounts.map((account) => ({
    provider: account.provider,
    providerAccount: account.providerAccount,
    providerAccountId: account.providerAccountId,
  }));

  const isOneAccount = useMemo<boolean>(() => {
    return session.user.linkedAccounts.length === 1;
  }, [session.user.linkedAccounts]);

  const handleConnect = async (provider: UserOAuthProviders) => {
    try {
      setError(null);
      setIsConnecting((prev) => ({ ...prev, [provider]: true }));

      await signIn(provider, {
        callbackUrl: "/settings/accounts",
      });
    } catch (err) {
      console.error("Connection error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsConnecting((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const providers: AccountProvider[] = [
    {
      id: "credentials",
      name: "Credentials",
      icon: "lock",
      isConnected: isCredentialsAuth,
      isCredentials: true,
    },
    {
      id: "google",
      name: "Google",
      icon: "image",
      imageSrc: "/google-logo.png",
      isConnected: isGoogleAuth,
    },
    {
      id: "github",
      name: "GitHub",
      icon: "image",
      imageSrc: "/github.png",
      isConnected: isGitHubAuth,
    },
    {
      id: "discord",
      name: "Discord",
      icon: "image",
      imageSrc: "/discord.png",
      isConnected: isDiscordAuth,
    },
  ];

  return (
    <Card className="mb-4 border border-gray-200 bg-white shadow-lg sm:mb-6 dark:border-gray-700 dark:bg-gray-800">
      <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Link2 className="h-4 w-4 shrink-0 text-blue-600 sm:h-5 sm:w-5" />
          <span className="truncate">Connected Accounts</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Manage your connected accounts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-4 sm:px-6">
        {error && (
          <Alert variant="destructive" className="mb-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {providers.map((provider) => (
          <AccountCard
            key={provider.id}
            provider={provider}
            providerAccount={
              linkedAccounts.find((acc) => acc.provider === provider.id)
                ?.providerAccount
            }
            isConnecting={isConnecting[provider.id]}
            isOneAccount={isOneAccount}
            isMobile={isMobile}
            session={session}
            unlinkAuth={unlinkAuth}
            isUnlinking={isUnlinking}
            setError={setError}
            onConnect={handleConnect}
            isAnyOAuth={isAnyOAuth}
            setIsConnecting={setIsConnecting}
          />
        ))}
      </CardContent>
    </Card>
  );
}

export default ConnectedAccounts;
