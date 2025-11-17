"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Loading from "@/components/ui/loading";
import { useGetRecoveryToken, useRecoverPassword } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@radix-ui/react-label";
import { ArrowLeft, Eye, EyeOff, Info, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import timerFormat from "@/helper/timer-format";
import { Toast } from "@/components/providers/toast-provider";
import { Alert, AlertTitle } from "@/components/ui/alert";
import PasswordRecoveryError from "./components/recovery-password-error";
import PasswordStrength from "@/helper/password-strength";

const changePasswordSchema = z
  .object({
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

function RecoverPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = String(searchParams.get("token"));

  const form = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const {
    data: recoveryToken,
    isFetching: isRecoveryTokenFetching,
    isLoading: isRecoveryTokenLoading,
    isError: isRecoveryTokenError,
    error: recoveryTokenError,
  } = useGetRecoveryToken(token);

  const {
    mutateAsync: recoverPassword,
    isPending: isRecoverPasswordPending,
    isError: isRecoverPasswordError,
    error: recoverPasswordError,
  } = useRecoverPassword();

  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmPassword: false,
  });
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const toggleShowPassword = (field: "newPassword" | "confirmPassword") => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const isRecoveryTokenProcessing = useMemo(() => {
    return isRecoveryTokenFetching || isRecoveryTokenLoading;
  }, [isRecoveryTokenFetching, isRecoveryTokenLoading]);

  const newPassword = form.watch("newPassword");
  const { strengthScore, strengthColor, strengthLabel } =
    PasswordStrength(newPassword);

  const onSubmit = useCallback(
    async (data: ChangePasswordData) => {
      try {
        await recoverPassword({
          token: token,
          newPassword: data.newPassword,
        });

        Toast.success("Password changed successfully!");
        router.push("/auth/login");
      } catch (error: unknown) {
        console.error("Error changing password:", error);
      }
    },
    [recoverPassword, token, router],
  );

  useEffect(() => {
    if (!recoveryToken?.expiresIn) return;

    const updateRemainingTime = () => {
      const now = new Date().getTime();
      const expiry = new Date(recoveryToken.expiresIn).getTime();
      const diff = expiry - now;

      if (diff < 0) {
        setTimeRemaining(0);
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      setTimeRemaining(diff);
    };

    updateRemainingTime();
    timerRef.current = setInterval(updateRemainingTime, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [recoveryToken?.expiresIn]);

  if (isRecoveryTokenProcessing) {
    return <Loading text="Verifying recovery token..." />;
  }

  if (isRecoveryTokenError) {
    return <PasswordRecoveryError error={recoveryTokenError} />;
  }

  return (
    <div className="relative mx-auto max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-xl transition-shadow hover:shadow-2xl">
      {/* Go Back */}
      <Button
        variant="ghost"
        onClick={() => router.push("/")}
        className="group absolute top-6 left-6 cursor-pointer rounded-full p-2 transition-colors duration-200 hover:bg-gray-100"
      >
        <ArrowLeft className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
        <span className="sr-only">Go back</span>
      </Button>

      <div className="text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-purple-600 shadow-lg">
          <span className="text-2xl font-bold text-white">C</span>
        </div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Recover Password
        </h1>
        <p className="text-gray-600">
          Create and confirm your password to proceed
        </p>
      </div>

      <div className="mb-4 text-center text-sm text-gray-600">
        {timeRemaining > 0 ? (
          <p>
            Recovery Token expires in{" "}
            <span className="font-semibold text-red-600">
              {timerFormat(timeRemaining)}
            </span>
          </p>
        ) : (
          <p className="font-semibold text-red-600">Token has expired.</p>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-2 space-y-2">
          {/* New Password */}
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <Label
                  htmlFor="new-password"
                  className="text-sm font-semibold sm:text-sm"
                >
                  New Password
                </Label>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="new-password"
                      autoComplete="off"
                      type={showPassword.newPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      className="h-11 rounded-xl border-2 pr-10 pl-10 text-sm"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={toggleShowPassword.bind(null, "newPassword")}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword.newPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {newPassword && newPassword.length > 0 && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-b-full ${i <= strengthScore ? strengthColor : "bg-gray-200"} `}
                  ></div>
                ))}
              </div>

              <div className="text-xs text-gray-500">{strengthLabel}</div>
            </div>
          )}

          {/* Confirm Password */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <Label
                  htmlFor="confirm-password"
                  className="text-sm font-semibold sm:text-sm"
                >
                  Confirm Password
                </Label>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="confirm-password"
                      autoComplete="off"
                      type={showPassword.confirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className="h-11 rounded-xl border-2 pr-10 pl-10 text-sm"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={toggleShowPassword.bind(null, "confirmPassword")}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword.confirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {isRecoverPasswordError && (
            <Alert className="mt-2 border-red-200 bg-red-50">
              <Info className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-sm text-red-900 sm:text-base">
                {recoverPasswordError.response.data.error ||
                  "Something went wrong"}
              </AlertTitle>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={isRecoverPasswordPending || form.formState.isSubmitting}
            className="mt-2 h-12 w-full cursor-pointer rounded-xl bg-linear-to-r from-blue-600 to-purple-600 font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default RecoverPasswordPage;
