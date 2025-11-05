"use client";

import { signIn } from "next-auth/react";
import { ArrowLeft, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";

const schema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormInputs = z.infer<typeof schema>;

function LoginPage() {
  const router = useRouter();

  const form = useForm<LoginFormInputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const [isRemembered, setIsRemembered] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCredentialsLoading, startCredentialsTransition] = useTransition();
  const [isGoogleLoading, startGoogleTransition] = useTransition();
  const [isGithubLoading, startGithubTransition] = useTransition();
  const [isFacebookLoading, startFacebookTransition] = useTransition();

  const onSubmit = async (data: LoginFormInputs) => {
    setAuthError("");
    if (isRemembered) {
      localStorage.setItem("rememberedEmail", data.email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    startCredentialsTransition(async () => {
      const res = await signIn("credentials", { ...data, redirect: false });

      if (res?.error) {
        setAuthError(res.error);
        return;
      }

      form.reset();
      router.push("/chat");
    });
  };

  const handleGoogleLogin = () => {
    startGoogleTransition(async () => {
      const res = await signIn("google");

      if (res?.error) {
        setAuthError(res.error);
        return;
      }
    });
  };

  const handleGithubLogin = () => {
    startGithubTransition(async () => {
      const res = await signIn("github");

      if (res?.error) {
        setAuthError(res.error);
        return;
      }
    });
  };

  const handleFacebookLogin = () => {
    startFacebookTransition(async () => {
      const res = await signIn("facebook");

      if (res?.error) {
        setAuthError(res.error);
        return;
      }
    });
  };

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setIsRemembered(true);
      form.setValue("email", rememberedEmail);
    }
  }, [form]);

  return (
    <div className="relative w-full max-w-md space-y-8 rounded-3xl border border-gray-100 bg-white p-10 shadow-2xl">
      {/* Back Button */}
      <button
        onClick={() => router.push("/")}
        className="group absolute top-6 left-6 rounded-full p-2 transition-colors duration-200 hover:bg-gray-100"
      >
        <ArrowLeft className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
        <span className="sr-only">Go back</span>
      </button>

      {/* Header */}
      <div className="text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-purple-600 shadow-lg">
          <span className="text-2xl font-bold text-white">C</span>
        </div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Welcome Back</h1>
        <p className="text-gray-600">Sign in to continue to Convofy</p>
      </div>

      <Form {...form}>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-gray-700">
                  Email Address
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="Enter your email"
                      className="h-12 rounded-xl border-2 border-gray-200 pl-10 transition-colors focus:border-blue-500"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Password Field */}
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
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="h-12 rounded-xl border-2 border-gray-200 pr-10 pl-10 transition-colors focus:border-blue-500"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                    >
                      {showPassword ? (
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

          {/* Error Message */}
          {authError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center">
              <p className="text-sm font-medium text-red-600">{authError}</p>
            </div>
          )}

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                checked={isRemembered}
                onCheckedChange={(checked) => setIsRemembered(!!checked)}
              />
              <label
                htmlFor="remember-me"
                className="cursor-pointer text-sm font-medium text-gray-700"
              >
                Remember me
              </label>
            </div>

            <a
              href="#"
              className="text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
            >
              Forgot password?
            </a>
          </div>

          {/* Sign In Button */}
          <Button
            type="submit"
            disabled={isCredentialsLoading}
            className="h-12 w-full rounded-xl bg-linear-to-r from-blue-600 to-purple-600 font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCredentialsLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 font-medium text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Google Sign In */}
            <Button
              variant="outline"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="h-12 flex-1 rounded-xl border-2 border-gray-200 font-semibold transition-all duration-300 hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                </>
              ) : (
                <>
                  <Image
                    width={20}
                    height={20}
                    src="/google-logo.png"
                    alt="Google Logo"
                    className="h-5 w-5"
                  />
                </>
              )}
            </Button>

            {/* Github Sign In */}
            <Button
              variant="outline"
              type="button"
              onClick={handleGithubLogin}
              disabled={isGithubLoading}
              className="h-12 flex-1 rounded-xl border-2 border-gray-200 font-semibold transition-all duration-300 hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGithubLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                </>
              ) : (
                <>
                  <Image
                    width={20}
                    height={20}
                    src="/github.png"
                    alt="Github Logo"
                    className="h-5 w-5"
                  />
                </>
              )}
            </Button>

            {/* Facebook Sign In */}
            <Button
              variant="outline"
              type="button"
              onClick={handleFacebookLogin}
              disabled={isFacebookLoading}
              className="h-12 flex-1 rounded-xl border-2 border-gray-200 font-semibold transition-all duration-300 hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isFacebookLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                </>
              ) : (
                <>
                  <Image
                    width={20}
                    height={20}
                    src="/facebook.png"
                    alt="Facebook Logo"
                    className="h-5 w-5"
                  />
                </>
              )}
            </Button>
          </div>

          {/* Sign Up Link */}
          <div className="pt-2 text-center">
            <span className="text-sm text-gray-600">
              Don&apos;t have an account?{" "}
            </span>
            <button
              type="button"
              onClick={() => router.push("/auth/register")}
              className="text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
            >
              Sign up for free
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default LoginPage;
