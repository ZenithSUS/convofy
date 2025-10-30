import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, Link2 } from "lucide-react";
import Image from "next/image";
import { Session } from "@/app/(views)/chat/components/chat-header";

interface ConnectedAccountsProps {
  session: Session;
  isGoogleAuth: boolean;
  isMobile: boolean;
}

function ConnectedAccounts({
  session,
  isGoogleAuth,
  isMobile,
}: ConnectedAccountsProps) {
  return (
    <Card className="mb-4 border border-gray-200 bg-white shadow-lg sm:mb-6">
      <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Link2 className="h-4 w-4 flex-shrink-0 text-blue-600 sm:h-5 sm:w-5" />
          <span className="truncate">Connected Accounts</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Manage your OAuth connections
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-4 sm:px-6">
        {isGoogleAuth ? (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-3 sm:p-4">
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
                  {session.user.email}
                </p>
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
              <span className="hidden text-sm font-semibold text-green-600 sm:inline">
                Connected
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm sm:h-12 sm:w-12">
                <Image
                  src="/google-logo.png"
                  alt="Google"
                  width={isMobile ? 20 : 24}
                  height={isMobile ? 20 : 24}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 sm:text-base">
                  Google
                </p>
                <p className="text-xs text-gray-600 sm:text-sm">
                  Not connected
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg text-xs sm:text-sm"
            >
              Connect
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ConnectedAccounts;
