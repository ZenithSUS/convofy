"use client";

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
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);
    try {
      // TODO: Implement actual API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const passwordStrength = useMemo(
    () =>
      newPassword.length > 0
        ? newPassword.length < 6
          ? 1
          : newPassword.length < 8
            ? 2
            : newPassword.length < 12
              ? 3
              : 4
        : 0,
    [newPassword],
  );

  return (
    <Card className="mb-6 border border-gray-200 bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Lock className="h-5 w-5 text-blue-600" />
          Change Password
        </CardTitle>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label
            htmlFor="current-password"
            className="text-xs font-semibold sm:text-sm"
          >
            Current Password
          </Label>
          <div className="relative mt-1">
            <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              id="current-password"
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="h-11 rounded-xl border-2 pr-10 pl-10 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCurrentPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <Label
            htmlFor="new-password"
            className="text-xs font-semibold sm:text-sm"
          >
            New Password
          </Label>
          <div className="relative mt-1">
            <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              id="new-password"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="h-11 rounded-xl border-2 pr-10 pl-10 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNewPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {newPassword && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                <div
                  className={`h-1 flex-1 rounded-full ${passwordStrength >= 1 ? "bg-red-500" : "bg-gray-200"}`}
                ></div>
                <div
                  className={`h-1 flex-1 rounded-full ${passwordStrength >= 2 ? "bg-orange-500" : "bg-gray-200"}`}
                ></div>
                <div
                  className={`h-1 flex-1 rounded-full ${passwordStrength >= 3 ? "bg-yellow-500" : "bg-gray-200"}`}
                ></div>
                <div
                  className={`h-1 flex-1 rounded-full ${passwordStrength >= 4 ? "bg-green-500" : "bg-gray-200"}`}
                ></div>
              </div>
              <p className="text-xs text-gray-600">
                {passwordStrength === 1 && "Weak password"}
                {passwordStrength === 2 && "Fair password"}
                {passwordStrength === 3 && "Good password"}
                {passwordStrength === 4 && "Strong password"}
              </p>
            </div>
          )}
        </div>

        <div>
          <Label
            htmlFor="confirm-password"
            className="text-xs font-semibold sm:text-sm"
          >
            Confirm New Password
          </Label>
          <div className="relative mt-1">
            <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="h-11 rounded-xl border-2 pr-10 pl-10 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <Button
          onClick={handleChangePassword}
          disabled={
            isChangingPassword ||
            !currentPassword ||
            !newPassword ||
            !confirmPassword
          }
          className="h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 font-semibold hover:from-blue-700 hover:to-purple-700"
        >
          {isChangingPassword ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Changing Password...
            </>
          ) : (
            "Change Password"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
export default ChangePassword;
