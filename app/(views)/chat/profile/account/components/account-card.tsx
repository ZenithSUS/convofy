"use client";

import { Button } from "@/components/ui/button";
import CreateCredentials from "./create-credentials";
import { Session } from "@/app/(views)/chat/components/chat-header";
import { UserLinkedAccount, UserOAuthProviders } from "@/types/user";
import Image from "next/image";
import { CheckCircle2, Lock, X } from "lucide-react";
import UnlinkWarning from "./unlink-warning";
import React from "react";
import { UseMutateAsyncFunction } from "@tanstack/react-query";

export type AccountProvider = {
  id: UserOAuthProviders;
  name: string;
  icon: "lock" | "image";
  imageSrc?: string;
  isConnected: boolean;
  isCredentials?: boolean;
};

interface AccountCardProps {
  provider: AccountProvider;
  providerAccount?: string;
  isConnecting: boolean;
  isOneAccount: boolean;
  isMobile: boolean;
  session: Session;
  unlinkAuth: UseMutateAsyncFunction<
    void,
    unknown,
    {
      id: string;
      accountType: UserLinkedAccount;
    }
  >;
  isUnlinking: boolean;
  setError: (error: string | null) => void;
  onConnect: (provider: UserOAuthProviders) => void;
  isGoogleAuth?: boolean;
  setIsConnecting: React.Dispatch<
    React.SetStateAction<Record<UserOAuthProviders, boolean>>
  >;
}

function AccountCard({
  provider,
  providerAccount,
  isConnecting,
  isOneAccount,
  isMobile,
  session,
  unlinkAuth,
  isUnlinking,
  setError,
  onConnect,
  isGoogleAuth,
  setIsConnecting,
}: AccountCardProps) {
  const iconSize = isMobile ? 20 : 24;

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-xl border bg-linear-to-r ${
        provider.isConnected
          ? "border-green-200 from-green-50 to-green-50"
          : "border-gray-200 from-gray-100 to-gray-50"
      } p-3 sm:p-4`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm sm:h-12 sm:w-12">
          {provider.icon === "lock" ? (
            <Lock className="h-4 w-4 shrink-0 text-blue-600 sm:h-5 sm:w-5" />
          ) : (
            <Image
              src={provider.imageSrc!}
              alt={provider.name}
              width={iconSize}
              height={iconSize}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 sm:text-base">
            {provider.name}
          </p>
          <p className="truncate text-xs text-gray-600 sm:text-sm">
            {providerAccount}
          </p>
        </div>
      </div>

      {provider.isConnected ? (
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 sm:h-5 sm:w-5" />
          <span className="hidden text-sm font-semibold text-green-600 sm:inline">
            Connected
          </span>
          <UnlinkWarning
            session={session}
            unlinkAuth={unlinkAuth}
            isUnlinking={isUnlinking}
            setError={setError}
            provider={provider.id}
          >
            {!isOneAccount && (
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            )}
          </UnlinkWarning>
        </div>
      ) : provider.isCredentials ? (
        <CreateCredentials
          session={session}
          isGoogleAuth={isGoogleAuth!}
          setIsConnecting={setIsConnecting}
        >
          <Button
            disabled={isConnecting}
            variant="outline"
            size="sm"
            className="rounded-lg text-xs sm:text-sm"
          >
            {isConnecting ? "Connecting..." : "Connect"}
          </Button>
        </CreateCredentials>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg text-xs sm:text-sm"
          onClick={() => onConnect(provider.id)}
          disabled={isConnecting}
        >
          {isConnecting ? "Connecting..." : "Connect"}
        </Button>
      )}
    </div>
  );
}

export default AccountCard;
