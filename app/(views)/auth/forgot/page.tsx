"use client";

import { Alert, AlertTitle } from "@/components/ui/alert";
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
import { useSendRecoveryEmail } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Info, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const schema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Invalid email address."),
});

type FormValues = z.infer<typeof schema>;

function ForgotPage() {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
    },
  });

  const {
    mutateAsync: sendRecoveryEmail,
    isError: isSendError,
    error: sendError,
    isPending: isSendPending,
  } = useSendRecoveryEmail();

  const onSubmit = useCallback(
    async (data: FormValues) => {
      try {
        toast.promise(
          async () => {
            await sendRecoveryEmail(data.email);
          },
          {
            success: "Recovery email sent!",
            loading: "Sending recovery email...",
            error: "Failed to send recovery email.",
          },
        );

        form.reset();
      } catch (error) {
        console.error("Error sending recovery email:", error);
      }
    },
    [sendRecoveryEmail, form],
  );

  return (
    <div className="relative w-full max-w-md rounded-3xl border-2 border-gray-200 bg-white p-10 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
      {/* Back Button */}
      <div className="absolute top-6 left-6 rounded-full p-2 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800">
        <button onClick={() => router.push("/")}>
          <span className="sr-only">Go back</span>
          <ArrowLeft className="h-5 w-5 text-gray-600 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-gray-100" />
        </button>
      </div>

      {/* Header */}
      <div className="text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30">
          <span className="text-2xl font-bold text-white">C</span>
        </div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
          Forgot Password
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Enter your email address and we will send you a link to reset your
          password
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-2 space-y-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Email
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <Input
                      placeholder="Enter your email address"
                      autoComplete="off"
                      {...field}
                      className="h-12 rounded-xl border-2 border-gray-200 pl-10 transition-colors focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-500"
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {isSendError && (
            <Alert className="mt-2 flex items-center border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30">
              <Info className="h-4 w-4 text-red-900 dark:text-red-400" />
              <AlertTitle className="text-sm text-red-900 sm:text-base dark:text-red-300">
                {sendError.response.data.error ||
                  "Something went wrong in sending the email."}
              </AlertTitle>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={form.formState.isSubmitting || isSendPending}
            className="mt-2 h-12 w-full cursor-pointer rounded-xl bg-linear-to-r from-blue-600 to-purple-600 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send Reset Link
          </Button>

          <p className="mt-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{" "}
            <span
              className="cursor-pointer text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
              onClick={() => router.push("/auth/signup")}
            >
              Sign Up
            </span>
          </p>
        </form>
      </Form>
    </div>
  );
}

export default ForgotPage;
