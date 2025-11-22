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
import { useChangePassword } from "@/hooks/use-user";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { Session } from "@/app/(views)/chat/components/chatpage/chat-header";
import { UserChangePassword } from "@/types/user";
import PasswordStrength from "@/helper/password-strength";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, "Password must be at least 6 characters long."),
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters long."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordData = z.infer<typeof changePasswordSchema>;

function ChangePassword({ session }: { session: Session }) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const { mutateAsync: changePassword, isPending: isChangingPassword } =
    useChangePassword();

  const newPassword = watch("newPassword");
  const { strengthColor, strengthLabel, strengthScore } =
    PasswordStrength(newPassword);

  const onSubmit = async (data: ChangePasswordData) => {
    if (!session.user) return;

    try {
      const passwordData: UserChangePassword = {
        id: session.user.id,
        oldPassword: data.currentPassword,
        newPassword: data.newPassword,
      };

      await changePassword(passwordData);
      toast.success("Password changed successfully!");
      reset();
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password");
    }
  };

  if (!session.user) return null;

  return (
    <Card className="mb-6 border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Lock className="h-5 w-5 text-blue-600" />
          Change Password
        </CardTitle>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                type={showPassword.current ? "text" : "password"}
                {...register("currentPassword")}
                placeholder="Enter current password"
                className="h-11 rounded-xl border-2 pr-10 pl-10 text-sm"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => ({
                    ...prev,
                    current: !prev.current,
                  }))
                }
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword.current ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-xs text-red-600">
                {errors.currentPassword.message}
              </p>
            )}
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
                type={showPassword.new ? "text" : "password"}
                {...register("newPassword")}
                placeholder="Enter new password"
                className="h-11 rounded-xl border-2 pr-10 pl-10 text-sm"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => ({ ...prev, new: !prev.new }))
                }
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword.new ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-xs text-red-600">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Password strength indicator */}
          {newPassword && newPassword.length > 0 && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${i <= strengthScore ? strengthColor : "bg-gray-200"}`}
                  ></div>
                ))}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-200">
                {strengthLabel}
              </div>
            </div>
          )}

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
                type={showPassword.confirm ? "text" : "password"}
                {...register("confirmPassword")}
                placeholder="Confirm new password"
                className="h-11 rounded-xl border-2 pr-10 pl-10 text-sm"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => ({
                    ...prev,
                    confirm: !prev.confirm,
                  }))
                }
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword.confirm ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-auto">
            <Button
              type="submit"
              disabled={isChangingPassword}
              className="h-11 flex-1 rounded-xl bg-linear-to-r from-blue-600 to-purple-600 font-semibold hover:from-blue-700 hover:to-purple-700 dark:text-gray-300"
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

            <Button
              type="button"
              variant="destructive"
              disabled={isChangingPassword}
              className="h-11 rounded-xl dark:bg-red-600"
              onClick={() => reset()}
            >
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default ChangePassword;
