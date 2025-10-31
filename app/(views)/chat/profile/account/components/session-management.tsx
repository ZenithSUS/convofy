import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Chrome, Loader2, LogOut, Monitor } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { Session } from "@/app/(views)/chat/components/chat-header";

interface ActiveSession {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}

function SessionManagement({ session }: { session: Session }) {
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const activeSessions: ActiveSession[] = [
    {
      id: "1",
      device: "Chrome on Windows",
      location: "Manila, Philippines",
      lastActive: "Active now",
      current: true,
    },
    {
      id: "2",
      device: "Safari on iPhone",
      location: "Manila, Philippines",
      lastActive: "2 hours ago",
      current: false,
    },
  ];

  const handleLogoutAllDevices = async () => {
    setIsLoggingOutAll(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Logged out from all devices");
    } catch (error) {
      toast.error("Failed to logout from all devices");
      console.error("Error logging out from all devices:", error);
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  return (
    <Card className="mb-4 border border-gray-200 bg-white shadow-lg sm:mb-6">
      <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Monitor className="h-4 w-4 flex-shrink-0 text-blue-600 sm:h-5 sm:w-5" />
          <span className="truncate">Active Sessions</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Manage devices where you&apos;re currently logged in
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-4 sm:px-6">
        {activeSessions.map((sessionItem) => (
          <div
            key={sessionItem.id}
            className={`flex items-center justify-between gap-2 rounded-xl border-2 p-3 sm:p-4 ${
              sessionItem.current
                ? "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm sm:h-12 sm:w-12">
                <Chrome className="h-5 w-5 text-gray-700 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                  {sessionItem.device}
                </p>
                <p className="truncate text-xs text-gray-600 sm:text-sm">
                  {sessionItem.location}
                </p>
                <p className="text-xs text-gray-500">
                  {sessionItem.lastActive}
                </p>
              </div>
            </div>
            {sessionItem.current && (
              <span className="flex-shrink-0 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700 sm:px-3">
                Current
              </span>
            )}
          </div>
        ))}

        <Button
          onClick={handleLogoutAllDevices}
          disabled={isLoggingOutAll}
          variant="outline"
          className="h-10 w-full rounded-xl border-2 border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 sm:h-11"
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
              <span className="hidden sm:inline">Logout From All Devices</span>
              <span className="sm:hidden">Logout All</span>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default SessionManagement;
