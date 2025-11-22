import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGetUserSessions, useRemoveAllUserSessions } from "@/hooks/use-user";
import { Chrome, Loader2, LogOut, Monitor } from "lucide-react";

import { toast } from "react-toastify";
import { Session } from "@/app/(views)/chat/components/chatpage/chat-header";
import { signOut, useSession } from "next-auth/react";
import SessionRemoveWarning from "./session-remove-warning";

function SessionManagement({ session }: { session: Session }) {
  const { update } = useSession();
  const { mutateAsync: removeAllUserSessions, isPending: isLoggingOutAll } =
    useRemoveAllUserSessions();

  const {
    mutateAsync: removeAllUserSessionsExceptCurrent,
    isPending: isLoggingOutExceptCurrent,
  } = useRemoveAllUserSessions();

  const {
    data: activeSessions,
    isLoading: sessionsLoading,
    refetch,
  } = useGetUserSessions();

  const handleLogoutAllDevices = async () => {
    try {
      await removeAllUserSessions({ exceptCurrent: false });

      signOut({ callbackUrl: "/auth/login" });
      toast.success("Logged out from all devices");
    } catch (error) {
      toast.error("Failed to logout from all devices");
      console.error("Error logging out from all devices:", error);
    }
  };

  const handleLogoutExceptCurrent = async () => {
    try {
      await removeAllUserSessionsExceptCurrent({ exceptCurrent: true });
      await update();
      refetch();
      toast.success("Logged out from all devices except current");
    } catch (error) {
      toast.error("Failed to logout from all devices");
      console.error("Error logging out from all devices:", error);
    }
  };

  return (
    <Card className="mb-4 border border-gray-200 bg-white shadow-lg sm:mb-6 dark:border-gray-700 dark:bg-gray-800">
      <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Monitor className="h-4 w-4 shrink-0 text-blue-600 sm:h-5 sm:w-5" />
          <span className="truncate">Active Sessions</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Manage devices where you&apos;re currently logged in
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-4 sm:px-6">
        {sessionsLoading && (
          <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-gray-50 p-3 sm:p-4 dark:border-gray-950 dark:bg-gray-900">
            <Loader2 className="h-5 w-5 animate-spin text-gray-600 sm:h-6 sm:w-6" />
            <p className="text-xs text-gray-600 sm:text-sm">Loading...</p>
          </div>
        )}

        {activeSessions?.length === 0 && !sessionsLoading && (
          <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-gray-50 p-3 sm:p-4 dark:border-gray-950 dark:bg-gray-900">
            <LogOut className="h-5 w-5 text-gray-600 sm:h-6 sm:w-6" />
            <p className="text-xs text-gray-600 sm:text-sm">
              No active sessions
            </p>
          </div>
        )}

        {activeSessions &&
          activeSessions?.length > 0 &&
          activeSessions.map((sessionItem) => (
            <div
              key={sessionItem.sessionId}
              className={`flex items-center justify-between gap-2 rounded-xl border-2 p-3 sm:p-4 ${
                sessionItem.sessionId === session.user.sessionId
                  ? "border-green-200 bg-linear-to-r from-green-50 to-emerald-50 dark:border-green-700 dark:from-green-900 dark:to-green-900"
                  : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm sm:h-12 sm:w-12 dark:bg-gray-800">
                  <Chrome className="h-5 w-5 text-gray-700 sm:h-6 sm:w-6 dark:text-gray-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900 sm:text-base dark:text-white">
                    {sessionItem.deviceInfo.device || "Unknown Device"}
                  </p>
                  <p className="truncate text-xs text-gray-600 sm:text-sm dark:text-gray-400">
                    {sessionItem.deviceInfo.browser || "Unknown Browser"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {sessionItem.deviceInfo.os || "Unknown OS"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {sessionItem.deviceInfo.ip || "Unknown IP"}
                  </p>
                </div>
              </div>
              {sessionItem.sessionId === session.user.sessionId && (
                <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700 sm:px-3 sm:py-2">
                  Current
                </span>
              )}
            </div>
          ))}

        <div className="flex flex-wrap items-center gap-2">
          <SessionRemoveWarning
            description="This will log you out from all devices."
            handleRemoveSession={handleLogoutAllDevices}
          >
            <Button
              disabled={isLoggingOutAll}
              variant="outline"
              className="h-10 flex-1 rounded-xl border-2 border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 sm:h-11 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900 dark:hover:text-white"
            >
              {isLoggingOutAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Logging Out...</span>
                  <span className="sm:hidden">Logging Out...</span>
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">
                    Logout From All Devices
                  </span>
                  <span className="sm:hidden">Logout All Devices</span>
                </>
              )}
            </Button>
          </SessionRemoveWarning>

          <SessionRemoveWarning
            description="This will log you out from all devices except the current one."
            handleRemoveSession={handleLogoutExceptCurrent}
          >
            <Button
              disabled={isLoggingOutExceptCurrent}
              variant="outline"
              className="h-10 flex-1 rounded-xl border-2 border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 sm:h-11 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900 dark:hover:text-white"
            >
              {isLoggingOutExceptCurrent ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Logging Out...</span>
                  <span className="sm:hidden">Logging Out...</span>
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">
                    Logout Except Current
                  </span>
                  <span className="sm:hidden">Logout Except Current</span>
                </>
              )}
            </Button>
          </SessionRemoveWarning>
        </div>
      </CardContent>
    </Card>
  );
}

export default SessionManagement;
