"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowBigLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface RegisterFormInputs {
  email: string;
  password: string;
  confirmPassword: string;
}

const schema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required.")
      .email("Invalid email address."),
    password: z.string().min(6, "Password must be at least 6 characters long."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
  });

function RegisterScreen() {
  const router = useRouter();

  const form = useForm<RegisterFormInputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <div className="relative w-full max-w-md space-y-8 rounded-lg bg-white px-6 py-12 shadow-xl dark:bg-gray-800">
      <div>
        <ArrowBigLeft
          className="absolute top-3 left-3 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={() => router.replace("/")}
        />
        <span className="sr-only">Go back</span>
      </div>
      <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        Create your account
      </h2>

      <Form {...form}>
        <form
          className="mt-8 space-y-6"
          onSubmit={form.handleSubmit((data) => console.log(data))}
        >
          <div className="-space-y-px rounded-md shadow-sm">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      id="email"
                      autoComplete="email"
                      placeholder="Enter your email"
                      className="relative block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-indigo-600 focus:ring-inset sm:text-sm sm:leading-6"
                      {...field}
                    />
                  </FormControl>
                  {form.formState.errors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      id="password"
                      autoComplete="password"
                      placeholder="Enter your password"
                      className="relative block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-indigo-600 focus:ring-inset sm:text-sm sm:leading-6"
                      {...field}
                    />
                  </FormControl>
                  {form.formState.errors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      id="confirmPassword"
                      autoComplete="confirmPassword"
                      placeholder="Enter your password again"
                      className="relative block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-indigo-600 focus:ring-inset sm:text-sm sm:leading-6"
                      {...field}
                    />
                  </FormControl>
                  {form.formState.errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </FormItem>
              )}
            />
          </div>

          <div>
            <Button
              type="submit"
              className="group relative flex w-full cursor-pointer justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-300 ease-in-out hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
            >
              Register
            </Button>
          </div>

          <div className="flex items-center justify-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Already have an account?
              <Link
                className="ml-1 font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                href="/auth/login"
              >
                Sign in
              </Link>
            </span>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default RegisterScreen;
