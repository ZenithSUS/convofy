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
import Link from "next/link";
import anonymousName from "@/helper/anonymous-name";
import generateAnonymousAvatar from "@/helper/anonymous-avatar";

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
  const [isAnonymousLoading, startAnonymousTransition] = useTransition();
  const [isGoogleLoading, startGoogleTransition] = useTransition();
  const [isGithubLoading, startGithubTransition] = useTransition();
  const [isDiscordLoading, startDiscordTransition] = useTransition();

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

  const handleAnonymousLogin = async () => {
    const alias = anonymousName();
    const avatar = generateAnonymousAvatar(alias);
    startAnonymousTransition(async () => {
      const res = await signIn("anonymous", { alias, avatar, redirect: false });

      if (res?.error) {
        setAuthError(res.error);
        return;
      }

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

  const handleDiscordLogin = () => {
    startDiscordTransition(async () => {
      const res = await signIn("discord");

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
    <div className="light:border-gray-200 light:from-white light:via-gray-50 light:to-blue-50/30 light:shadow-blue-500/5 relative w-full max-w-md space-y-8 rounded-3xl border border-gray-800 bg-linear-to-br from-gray-900 via-gray-900 to-gray-950 p-10 shadow-2xl shadow-blue-500/10 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 dark:shadow-blue-500/10">
      {/* Back Button */}
      <button
        onClick={() => router.push("/")}
        className="group light:hover:bg-gray-100 absolute top-6 left-6 rounded-full p-2 transition-colors duration-200 hover:bg-gray-800 dark:hover:bg-gray-800"
      >
        <ArrowLeft className="light:text-gray-600 light:group-hover:text-gray-900 h-5 w-5 text-gray-400 group-hover:text-gray-100 dark:text-gray-400 dark:group-hover:text-gray-100" />
        <span className="sr-only">Go back</span>
      </button>

      {/* Header */}
      <div className="text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30">
          <span className="text-2xl font-bold text-white">C</span>
        </div>
        <h1 className="light:text-gray-900 mb-2 text-3xl font-bold text-white dark:text-white">
          Welcome Back
        </h1>
        <p className="light:text-gray-600 text-gray-400 dark:text-gray-400">
          Sign in to continue to Convofy
        </p>
      </div>

      <Form {...form}>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="light:text-gray-700 text-sm font-semibold text-gray-300 dark:text-gray-300">
                  Email Address
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="light:text-gray-400 absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-500 dark:text-gray-500" />
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="Enter your email"
                      className="light:border-gray-300 light:bg-white light:text-gray-900 light:placeholder:text-gray-400 light:focus:border-blue-500 light:focus:bg-gray-50 h-12 rounded-xl border-2 border-gray-700 bg-gray-800/50 pl-10 text-white transition-colors placeholder:text-gray-500 focus:border-blue-500 focus:bg-gray-800 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-blue-500 dark:focus:bg-gray-800"
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
                <FormLabel className="light:text-gray-700 text-sm font-semibold text-gray-300 dark:text-gray-300">
                  Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="light:text-gray-400 absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-500 dark:text-gray-500" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="light:border-gray-300 light:bg-white light:text-gray-900 light:placeholder:text-gray-400 light:focus:border-blue-500 light:focus:bg-gray-50 h-12 rounded-xl border-2 border-gray-700 bg-gray-800/50 pr-10 pl-10 text-white transition-colors placeholder:text-gray-500 focus:border-blue-500 focus:bg-gray-800 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-blue-500 dark:focus:bg-gray-800"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="light:text-gray-400 light:hover:text-gray-600 absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-300 dark:text-gray-500 dark:hover:text-gray-300"
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
            <div className="light:border-red-300 light:bg-red-50 rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-center dark:border-red-500/50 dark:bg-red-500/10">
              <p className="light:text-red-600 text-sm font-medium text-red-400 dark:text-red-400">
                {authError}
              </p>
            </div>
          )}

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                checked={isRemembered}
                onCheckedChange={(checked) => setIsRemembered(!!checked)}
                className="light:border-gray-400 border-gray-600 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 dark:border-gray-600"
              />
              <label
                htmlFor="remember-me"
                className="light:text-gray-700 cursor-pointer text-sm font-medium text-gray-300 dark:text-gray-300"
              >
                Remember me
              </label>
            </div>

            <Link
              href="/auth/forgot"
              className="light:text-blue-600 light:hover:text-blue-700 text-sm font-semibold text-blue-400 transition-colors hover:text-blue-300 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Forgot password?
            </Link>
          </div>

          {/* Sign In Button */}
          <Button
            type="submit"
            disabled={isCredentialsLoading}
            className="h-12 w-full rounded-xl bg-linear-to-r from-blue-600 to-purple-600 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:from-blue-500 hover:to-purple-500 hover:shadow-xl hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCredentialsLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          {/* Anonymous Sign In */}
          <Button
            type="button"
            onClick={handleAnonymousLogin}
            disabled={!isAnonymousLoading}
            className="light:from-gray-600 light:via-gray-700 light:to-gray-800 h-12 w-full rounded-xl bg-linear-to-r from-gray-700 via-gray-800 to-gray-900 font-semibold text-white shadow-lg shadow-gray-900/30 transition-all duration-300 hover:from-gray-600 hover:via-gray-700 hover:to-gray-800 hover:shadow-xl hover:shadow-gray-900/40 disabled:opacity-50 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900"
          >
            {isAnonymousLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Please Wait...
              </>
            ) : (
              "Anonymous Mode"
            )}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="light:border-gray-300 w-full border-t border-gray-700 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="light:bg-white light:text-gray-600 bg-gray-900 px-4 font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-500">
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
              className="light:border-gray-300 light:bg-white light:text-gray-900 light:hover:border-gray-400 light:hover:bg-gray-50 h-12 flex-1 rounded-xl border-2 border-gray-700 bg-gray-800/30 font-semibold text-white transition-all duration-300 hover:border-gray-600 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800/30 dark:text-white dark:hover:border-gray-600 dark:hover:bg-gray-800"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
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
              className="light:border-gray-300 light:bg-white light:text-gray-900 light:hover:border-gray-400 light:hover:bg-gray-50 h-12 flex-1 rounded-xl border-2 border-gray-700 bg-gray-800/30 font-semibold text-white transition-all duration-300 hover:border-gray-600 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800/30 dark:text-white dark:hover:border-gray-600 dark:hover:bg-gray-800"
            >
              {isGithubLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
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

            {/* Discord Sign In */}
            <Button
              variant="outline"
              type="button"
              onClick={handleDiscordLogin}
              disabled={isDiscordLoading}
              className="light:border-gray-300 light:bg-white light:text-gray-900 light:hover:border-gray-400 light:hover:bg-gray-50 h-12 flex-1 rounded-xl border-2 border-gray-700 bg-gray-800/30 font-semibold text-white transition-all duration-300 hover:border-gray-600 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800/30 dark:text-white dark:hover:border-gray-600 dark:hover:bg-gray-800"
            >
              {isDiscordLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                </>
              ) : (
                <>
                  <Image
                    width={20}
                    height={20}
                    src="/discord.png"
                    alt="Discord Logo"
                    className="h-5 w-5"
                  />
                </>
              )}
            </Button>
          </div>

          {/* Sign Up Link */}
          <div className="space-y-1 pt-2 text-center">
            <div>
              <span className="light:text-gray-600 text-sm text-gray-400 dark:text-gray-400">
                Don&apos;t have an account?{" "}
              </span>
              <button
                type="button"
                onClick={() => router.push("/auth/register")}
                className="light:text-blue-600 light:hover:text-blue-700 text-sm font-semibold text-blue-400 transition-colors hover:text-blue-300 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Sign up for free
              </button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default LoginPage;
