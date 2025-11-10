"use client";

import { Session } from "@/app/(views)/chat/components/chat-header";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Loading from "@/components/ui/loading";
import useHybridSession from "@/hooks/use-hybrid-session";
import { useChangeEmail, useChangeEmailToken } from "@/hooks/use-user";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Info, Lock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import VerifyEmailError from "@/app/(views)/auth/verify-email-change/components/verify-email-error";
import { EmailChangeData } from "@/types/email";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { toast } from "react-toastify";
import timerFormat from "@/helper/timer-format";

interface VerifyEmailChangePageClientProps {
  serverSession: Session;
}

const changeEmailSchema = z
  .object({
    password: z.string().min(1, "Password is required."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type ChangeEmailType = z.infer<typeof changeEmailSchema>;

function VerifyEmailChangePageClient({
  serverSession,
}: VerifyEmailChangePageClientProps) {
  const { session, update } = useHybridSession(serverSession);
  const searchParams = useSearchParams();

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const userId = session?.user?.id as string;
  const token = searchParams.get("token") as string;

  const {
    data: changeEmailToken,
    isLoading: changeEmailTokenLoading,
    isError: changeEmailTokenError,
    error: changeEmailTokenErrorData,
  } = useChangeEmailToken(userId, token);

  const {
    mutateAsync: changeEmail,
    isPending: changeEmailPending,
    isError: changeEmailError,
    error: changeEmailErrorData,
  } = useChangeEmail();

  const form = useForm<ChangeEmailType>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const isFormButtonDisabled = useMemo(
    () => changeEmailPending || form.formState.isSubmitting,
    [changeEmailPending, form.formState.isSubmitting],
  );

  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  const onSubmit = useCallback(
    async (data: ChangeEmailType) => {
      const emailData: EmailChangeData = {
        newEmail: changeEmailToken?.newEmail as string,
        currentEmail: changeEmailToken?.currentEmail as string,
        password: data.password,
        token: token,
        userId: userId,
      };

      try {
        await changeEmail(emailData);

        update({
          user: {
            ...session?.user,
            email: changeEmailToken?.newEmail as string,
          },
        });

        toast.success("Email changed successfully!");
        setIsVerified(true);
      } catch (error) {
        console.error("Error changing email:", error);
      }
    },
    [changeEmail, userId, token, changeEmailToken, update, session?.user],
  );

  // Display the time to expire
  useEffect(() => {
    const expiresIn = changeEmailToken?.expiresIn || 0;

    const updateRemainingTime = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresIn).getTime();
      const diff = expiry - now;

      if (diff < 0) {
        setTimeRemaining(0);
        if (timerRef.current) clearTimeout(timerRef.current);

        return;
      }

      setTimeRemaining(diff);
    };

    updateRemainingTime();
    timerRef.current = setInterval(updateRemainingTime, 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [changeEmailToken?.expiresIn]);

  if (changeEmailTokenLoading) {
    return <Loading text="Verifying Email Change" />;
  }

  if (changeEmailTokenError) {
    return <VerifyEmailError error={changeEmailTokenErrorData} />;
  }

  if (isVerified) {
    return (
      <div className="mx-auto h-fit max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-xl transition-shadow hover:shadow-2xl">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900">
            Email Changed Successfully
          </h1>

          <p className="text-sm text-gray-600">You Can Now Close This tab</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-xl transition-shadow hover:shadow-2xl">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900">
          Verify Email Change
        </h1>
        <p className="text-sm text-gray-600">
          Enter your password to confirm your email update.
        </p>
      </div>

      <div className="mb-4 text-center text-sm text-gray-600">
        {timeRemaining > 0 ? (
          <p>
            Link expires in{" "}
            <span className="font-semibold text-red-600">
              {timerFormat(timeRemaining)}
            </span>
          </p>
        ) : (
          <p className="font-semibold text-red-600">Link has expired.</p>
        )}
      </div>

      <div className="mb-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
        <p className="font-semibold">
          <span className="text-gray-500">Current:</span>{" "}
          {changeEmailToken?.currentEmail}
        </p>
        <p className="font-semibold">
          <span className="text-gray-500">New:</span>{" "}
          {changeEmailToken?.newEmail}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-gray-700">
                  Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      {...field}
                      type={showPassword.password ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="h-12 w-full rounded-xl border-2 border-gray-200 pr-12 pl-10 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() =>
                        setShowPassword((prev) => ({
                          ...prev,
                          password: !prev.password,
                        }))
                      }
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword.password ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage className="mt-1 text-xs text-red-500" />
              </FormItem>
            )}
          />

          {/* Confirm Password */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-gray-700">
                  Confirm Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      {...field}
                      type={showPassword.confirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      autoComplete="current-password"
                      className="h-12 w-full rounded-xl border-2 border-gray-200 pr-12 pl-10 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() =>
                        setShowPassword((prev) => ({
                          ...prev,
                          confirmPassword: !prev.confirmPassword,
                        }))
                      }
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword.confirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage className="mt-1 text-xs text-red-500" />
              </FormItem>
            )}
          />

          {changeEmailError && (
            <Alert className="border-red-200 bg-red-50">
              <Info className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-sm text-red-900 sm:text-base">
                {changeEmailErrorData.response.data.error ||
                  "Something went wrong"}
              </AlertTitle>
            </Alert>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={isFormButtonDisabled}
            className="h-12 w-full cursor-pointer rounded-xl bg-linear-to-r from-blue-600 to-purple-600 font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default VerifyEmailChangePageClient;
