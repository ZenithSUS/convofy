import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Hash, Info } from "lucide-react";
import { Session } from "@/app/(views)/chat/components/chat-header";

interface AccountInfoProps {
  session: Session;
  accountCreationDate: Date;
  isMobile: boolean;
}

function AccountInfo({
  session,
  accountCreationDate,
  isMobile,
}: AccountInfoProps) {
  return (
    <Card className="mb-4 border border-gray-200 bg-white shadow-lg sm:mb-6">
      <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Info className="h-4 w-4 flex-shrink-0 text-blue-600 sm:h-5 sm:w-5" />
          <span className="truncate">Account Information</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Basic information about your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-4 sm:space-y-4 sm:px-6">
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
          <div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:gap-3 sm:p-4">
            <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-600 sm:h-5 sm:w-5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-700 sm:text-sm">
                Account Created
              </p>
              <p className="text-xs break-words text-gray-600 sm:text-sm">
                {accountCreationDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: isMobile ? "short" : "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:gap-3 sm:p-4">
            <Hash className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-600 sm:h-5 sm:w-5" />
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-gray-700 sm:text-sm">
                Account ID
              </p>
              <p className="truncate font-mono text-xs text-gray-600 sm:text-sm">
                {session.user.id.slice(0, isMobile ? 12 : 16)}...
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AccountInfo;
