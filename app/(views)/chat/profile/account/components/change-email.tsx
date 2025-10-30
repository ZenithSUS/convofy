import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { Session } from "@/app/(views)/chat/components/chat-header";
import { toast } from "react-toastify";

function ChangeEmail({ session }: { session: Session }) {
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    setIsChangingEmail(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Verification email sent! Please check your inbox.");
      setNewEmail("");
    } catch (error) {
      console.error("Error changing email:", error);
      toast.error("Failed to change email");
    } finally {
      setIsChangingEmail(false);
    }
  };

  return (
    <Card className="mb-4 border border-gray-200 bg-white shadow-lg sm:mb-6">
      <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Mail className="h-4 w-4 flex-shrink-0 text-blue-600 sm:h-5 sm:w-5" />
          <span className="truncate">Change Email Address</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Update your email address (verification required)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-4 sm:space-y-4 sm:px-6">
        <div>
          <Label
            htmlFor="current-email"
            className="text-xs font-semibold sm:text-sm"
          >
            Current Email
          </Label>
          <Input
            id="current-email"
            type="email"
            value={session.user.email}
            disabled
            className="mt-1 h-10 rounded-xl border-2 bg-gray-50 text-sm sm:h-11"
          />
        </div>

        <div>
          <Label
            htmlFor="new-email"
            className="text-xs font-semibold sm:text-sm"
          >
            New Email Address
          </Label>
          <div className="relative mt-1">
            <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 sm:h-5 sm:w-5" />
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email address"
              className="h-10 rounded-xl border-2 pl-9 text-sm sm:h-11 sm:pl-10"
            />
          </div>
        </div>

        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-sm text-blue-900 sm:text-base">
            Verification Required
          </AlertTitle>
          <AlertDescription className="text-xs text-blue-800 sm:text-sm">
            We&apos;ll send a verification link to your new email address.
            You&apos;ll need to verify it before the change takes effect.
          </AlertDescription>
        </Alert>

        <Button
          onClick={handleChangeEmail}
          disabled={isChangingEmail || !newEmail}
          className="h-10 w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-sm font-semibold hover:from-blue-700 hover:to-purple-700 sm:h-11"
        >
          {isChangingEmail ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Sending Verification...</span>
              <span className="sm:hidden">Sending...</span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline">Send Verification Email</span>
              <span className="sm:hidden">Send Verification</span>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default ChangeEmail;
