"use client";

import { signIn, useSession } from "next-auth/react";
import { ArrowBigLeft } from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
} from "../ui/form";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";

const schema = z.object({
  email: z.string().min(1, "Email is required."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormInputs = z.infer<typeof schema>;

function LoginScreen() {
  const { data: session } = useSession();
  const router = useRouter();

  if (session) {
    router.push("/chat");
  }
  const form = useForm<LoginFormInputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const [isRemembered, setIsRemembered] = useState(false);

  const onSubmit = (data: LoginFormInputs) => {
    if (isRemembered) {
      localStorage.setItem("rememberedEmail", data.email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    console.log("Logging in with", data);
  };

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setIsRemembered(true);
      form.setValue("email", rememberedEmail);
    }
  }, [form]);

  return (
    <div className="relative w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-xl dark:bg-gray-800">
      <div>
        <ArrowBigLeft
          className="absolute top-4 left-4 h-6 w-6 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={() => router.push("/")}
        />
        <span className="sr-only">Go back</span>
      </div>

      <div>
        <h1 className="text-center text-3xl font-semibold text-gray-900 dark:text-white">
          Convofy
        </h1>

        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Sign in to your account
        </h2>
      </div>
      <Form {...form}>
        <form className="mt-8 space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="-space-y-px rounded-md shadow-sm">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Email address</FormLabel>
                  <FormControl>
                    <Input
                      id="email-address"
                      type="email"
                      autoComplete="email"
                      placeholder="Email address"
                      className="relative block w-full appearance-none rounded-none rounded-t-md"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="p-1" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Password</FormLabel>
                  <FormControl>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Password"
                      className="relative block w-full appearance-none rounded-none rounded-b-md"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="p-1" />
                </FormItem>
              )}
            />
          </div>

          <div>
            <Button
              type="submit"
              className="group relative flex w-full cursor-pointer justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-300 ease-in-out hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
            >
              Sign In
            </Button>
          </div>

          <div>
            <Button
              variant="outline"
              type="button"
              onClick={() => signIn("google")}
              className="group relative flex w-full cursor-pointer justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
            >
              <img
                src="/google-logo.png"
                alt="Google Logo"
                className="mr-2 h-5 w-5"
              />
              Sign in with Google
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                checked={isRemembered}
                onCheckedChange={(checked) => setIsRemembered(!!checked)}
              />
              <label
                htmlFor="remember-me"
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Forgot your password?
              </a>
            </div>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
            </span>
            <button
              type="button"
              onClick={() => router.push("/auth/register")}
              className="cursor-pointer font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Sign up
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default LoginScreen;
