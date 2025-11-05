"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, Link2, AlertCircle, Lock, X } from "lucide-react";
import Image from "next/image";
import { Session } from "@/app/(views)/chat/components/chat-header";
import { signIn } from "next-auth/react";
import { useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CreateCredentials from "@/app/(views)/chat/profile/account/components/create-credentials";
import { useUnlinkUserCredentials } from "@/hooks/use-user";
import UnlinkWarning from "@/app/(views)/chat/profile/account/components/unlink-warning";

interface ConnectedAccountsProps {
  session: Session;
  isCredentialsAuth: boolean;
  isGoogleAuth: boolean;
  isGitHubAuth: boolean;
  isFacebookAuth: boolean;
  isMobile: boolean;
}

function ConnectedAccounts({
  session,
  isCredentialsAuth,
  isGoogleAuth,
  isGitHubAuth,
  isFacebookAuth,
  isMobile,
}: ConnectedAccountsProps) {
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState({
    credentials: false,
    google: false,
    github: false,
    facebook: false,
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

  const handleConnectGoogle = async () => {
    try {
      setError(null);
      setIsConnecting((prev) => ({ ...prev, google: true }));

      // Trigger OAuth sign-in flow, but come back to this page after
      await signIn("google", {
        callbackUrl: "/settings/accounts",
      });
    } catch (err) {
      console.error("Connection error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsConnecting((prev) => ({ ...prev, google: false }));
    }
  };

  const handleConnectGitHub = async () => {
    try {
      setError(null);
      setIsConnecting((prev) => ({ ...prev, github: true }));

      // Trigger OAuth sign-in flow, but come back to this page after
      await signIn("github");
    } catch (err) {
      console.error("Connection error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsConnecting((prev) => ({ ...prev, github: false }));
    }
  };

  const handleConnectFacebook = async () => {
    try {
      setError(null);
      setIsConnecting((prev) => ({ ...prev, facebook: true }));

      // Trigger OAuth sign-in flow, but come back to this page after
      await signIn("facebook");
    } catch (err) {
      console.error("Connection error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsConnecting((prev) => ({ ...prev, facebook: false }));
    }
  };

  return (
    <Card className="mb-4 border border-gray-200 bg-white shadow-lg sm:mb-6">
      <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Link2 className="h-4 w-4 flex-shrink-0 text-blue-600 sm:h-5 sm:w-5" />
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

        {/* Credentials */}
        <div
          className={`flex items-center justify-between gap-2 rounded-xl border bg-gradient-to-r ${isCredentialsAuth ? "border-green-200 from-green-50 to-green-50" : "border-gray-200 from-gray-100 to-gray-50"} p-3 sm:p-4`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm sm:h-12 sm:w-12">
              <Lock className="h-4 w-4 flex-shrink-0 text-blue-600 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 sm:text-base">
                Credentials
              </p>
              <p className="truncate text-xs text-gray-600 sm:text-sm">
                {
                  linkedAccounts.find(
                    (account) => account.provider === "credentials",
                  )?.providerAccount
                }
              </p>
            </div>
          </div>
          {isCredentialsAuth ? (
            <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600 sm:h-5 sm:w-5" />
              <span className="hidden text-sm font-semibold text-green-600 sm:inline">
                Connected
              </span>
              <UnlinkWarning
                session={session}
                unlinkAuth={unlinkAuth}
                isUnlinking={isUnlinking}
                setError={setError}
                provider="credentials"
              >
                {!isOneAccount && (
                  <Button variant="ghost" size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </UnlinkWarning>
            </div>
          ) : (
            <CreateCredentials
              session={session}
              isGoogleAuth={isGoogleAuth}
              setIsConnecting={setIsConnecting}
            >
              <Button
                disabled={isConnecting.credentials}
                variant="outline"
                size="sm"
                className="rounded-lg text-xs sm:text-sm"
              >
                {isConnecting ? "Connecting..." : "Connect"}
              </Button>
            </CreateCredentials>
          )}
        </div>

        {/* Google */}
        <div
          className={`flex items-center justify-between gap-2 rounded-xl border bg-gradient-to-r ${isGoogleAuth ? "border-green-200 from-green-50 to-green-50" : "border-gray-200 from-gray-100 to-gray-50"} p-3 sm:p-4`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm sm:h-12 sm:w-12">
              <Image
                src="/google-logo.png"
                alt="Google"
                width={isMobile ? 20 : 24}
                height={isMobile ? 20 : 24}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 sm:text-base">
                Google
              </p>
              <p className="truncate text-xs text-gray-600 sm:text-sm">
                {
                  linkedAccounts.find(
                    (account) => account.provider === "google",
                  )?.providerAccount
                }
              </p>
            </div>
          </div>
          {isGoogleAuth ? (
            <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
              <span className="hidden text-sm font-semibold text-green-600 sm:inline">
                Connected
              </span>
              <UnlinkWarning
                session={session}
                unlinkAuth={unlinkAuth}
                isUnlinking={isUnlinking}
                setError={setError}
                provider="google"
              >
                {!isOneAccount && (
                  <Button variant="ghost" size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </UnlinkWarning>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg text-xs sm:text-sm"
              onClick={handleConnectGoogle}
              disabled={isConnecting.google}
            >
              {isConnecting.google ? "Connecting..." : "Connect"}
            </Button>
          )}
        </div>

        {/* GitHub */}
        <div
          className={`flex items-center justify-between gap-2 rounded-xl border bg-gradient-to-r ${isGitHubAuth ? "border-green-200 from-green-50 to-green-50" : "border-gray-200 from-gray-100 to-gray-50"} p-3 sm:p-4`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm sm:h-12 sm:w-12">
              <Image
                src="/github.png"
                alt="GitHub"
                width={isMobile ? 20 : 24}
                height={isMobile ? 20 : 24}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 sm:text-base">
                GitHub
              </p>
              <p className="truncate text-xs text-gray-600 sm:text-sm">
                {
                  linkedAccounts.find(
                    (account) => account.provider === "github",
                  )?.providerAccount
                }
              </p>
            </div>
          </div>
          {isGitHubAuth ? (
            <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
              <span className="hidden text-sm font-semibold text-green-600 sm:inline">
                Connected
              </span>
              <UnlinkWarning
                session={session}
                unlinkAuth={unlinkAuth}
                isUnlinking={isUnlinking}
                setError={setError}
                provider="github"
              >
                {!isOneAccount && (
                  <Button variant="ghost" size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </UnlinkWarning>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg text-xs sm:text-sm"
              onClick={handleConnectGitHub}
              disabled={isConnecting.github}
            >
              {isConnecting.github ? "Connecting..." : "Connect"}
            </Button>
          )}
        </div>

        {/* Facebook */}
        <div
          className={`flex items-center justify-between gap-2 rounded-xl border bg-gradient-to-r ${isFacebookAuth ? "border-green-200 from-green-50 to-green-50" : "border-gray-200 from-gray-100 to-gray-50"} p-3 sm:p-4`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm sm:h-12 sm:w-12">
              <Image
                src="/facebook.png"
                alt="Facebook"
                width={isMobile ? 20 : 24}
                height={isMobile ? 20 : 24}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 sm:text-base">
                Facebook
              </p>
              <p className="truncate text-xs text-gray-600 sm:text-sm">
                {
                  linkedAccounts.find(
                    (account) => account.provider === "facebook",
                  )?.providerAccount
                }
              </p>
            </div>
          </div>
          {isFacebookAuth ? (
            <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
              <span className="hidden text-sm font-semibold text-green-600 sm:inline">
                Connected
              </span>
              <UnlinkWarning
                session={session}
                unlinkAuth={unlinkAuth}
                isUnlinking={isUnlinking}
                setError={setError}
                provider="facebook"
              >
                {!isOneAccount && (
                  <Button variant="ghost" size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </UnlinkWarning>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg text-xs sm:text-sm"
              onClick={handleConnectFacebook}
              disabled={isConnecting.facebook}
            >
              {isConnecting.facebook ? "Connecting..." : "Connect"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ConnectedAccounts;
