import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, PauseCircle } from "lucide-react";
import DeleteAccount from "./delete-account";
import { useState } from "react";
import { toast } from "react-toastify";

interface DangerZoneProps {
  isGoogleAuth: boolean;
}

function DangerZone({ isGoogleAuth }: DangerZoneProps) {
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState("");

  const handleDeactivateAccount = async () => {
    if (!isGoogleAuth && !deactivatePassword) {
      toast.error("Please enter your password");
      return;
    }

    setIsDeactivating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(
        "Account deactivated. You can reactivate anytime by logging in.",
      );
    } catch (error) {
      console.error("Error deactivating account:", error);
      toast.error("Failed to deactivate account");
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <Card className="mb-4 border-2 border-red-200 bg-white shadow-lg sm:mb-6">
      <CardHeader className="bg-red-50 px-4 py-4 sm:px-6 sm:py-6">
        <CardTitle className="flex items-center gap-2 text-lg text-red-700 sm:text-xl">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
          <span className="truncate">Danger Zone</span>
        </CardTitle>
        <CardDescription className="text-xs text-red-600 sm:text-sm">
          Irreversible and destructive actions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pt-4 sm:space-y-4 sm:px-6 sm:pt-6">
        {/* Deactivate Account */}
        <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-3 sm:p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-3">
              <PauseCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600 sm:mt-1 sm:h-6 sm:w-6" />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-gray-900 sm:text-base">
                  Deactivate Account
                </h3>
                <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                  Temporarily disable your account. You can reactivate it
                  anytime by logging in.
                </p>
              </div>
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="h-9 w-full rounded-lg border-2 border-orange-300 text-xs font-semibold text-orange-600 hover:bg-orange-100 sm:h-10 sm:text-sm"
              >
                <PauseCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Deactivate Account</span>
                <span className="sm:hidden">Deactivate</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100%-2rem)] rounded-2xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <PauseCircle className="h-5 w-5 text-orange-600" />
                  Deactivate Account
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Your account will be temporarily disabled. You can reactivate
                  it by logging in again.
                </DialogDescription>
              </DialogHeader>

              {!isGoogleAuth && (
                <div className="py-3 sm:py-4">
                  <Label
                    htmlFor="deactivate-password"
                    className="text-xs font-semibold sm:text-sm"
                  >
                    Enter your password to confirm
                  </Label>
                  <Input
                    id="deactivate-password"
                    type="password"
                    value={deactivatePassword}
                    onChange={(e) => setDeactivatePassword(e.target.value)}
                    placeholder="Your password"
                    className="mt-1 h-10 rounded-xl border-2 text-sm sm:h-11"
                  />
                </div>
              )}

              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button
                  onClick={handleDeactivateAccount}
                  disabled={
                    isDeactivating || (!isGoogleAuth && !deactivatePassword)
                  }
                  className="h-9 w-full rounded-lg bg-orange-600 text-xs font-semibold hover:bg-orange-700 sm:h-10 sm:text-sm"
                >
                  {isDeactivating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deactivating...
                    </>
                  ) : (
                    "Confirm Deactivation"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Delete Account */}
        <DeleteAccount />
      </CardContent>
    </Card>
  );
}

export default DangerZone;
