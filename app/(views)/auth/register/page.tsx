"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowBigLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUploadImage } from "@/hooks/use-upload";
import { useState } from "react";
import client from "@/services/axios";

interface RegisterFormInputs {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  avatar: FileList | null;
}

const schema = z
  .object({
    name: z.string().min(1, "Name is required."),
    email: z
      .string()
      .min(1, "Email is required.")
      .email("Invalid email address."),
    password: z.string().min(6, "Password must be at least 6 characters long."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
    avatar: z
      .any()
      .refine((files) => files?.length === 1, "Avatar image is required."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
  });

function RegisterPage() {
  const router = useRouter();
  const { uploadImage, isUploading } = useUploadImage();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RegisterFormInputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      avatar: null,
    },
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    setError(null);
    try {
      const avatarUrl = await uploadImage(data.avatar![0]);

      if (!avatarUrl) {
        setError("Failed to upload avatar");
        return;
      }

      const userData = {
        name: data.name,
        email: data.email,
        password: data.password,
        avatar: avatarUrl,
      };

      const response = await client.post("/auth/register", userData);
      console.log(response);

      if (response.status === 201) {
        router.push("/auth/login");
      } else {
        setError("Registration failed");
      }
    } catch (err) {
      setError("An error occurred during registration");
    }
  };

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
        <form className="mt-8 space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      id="name"
                      autoComplete="name"
                      placeholder="Enter your name"
                      className="relative block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-indigo-600 focus:ring-inset sm:text-sm sm:leading-6"
                      {...field}
                    />
                  </FormControl>
                  {form.formState.errors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </FormItem>
              )}
            />

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
                      type="password"
                      id="password"
                      autoComplete="new-password"
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
                  <FormLabel id="confirmPassword">Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      id="confirmPassword"
                      autoComplete="new-password"
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

            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Avatar</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      id="avatar"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => field.onChange(e.target.files)}
                      onBlur={field.onBlur}
                      value={undefined}
                    />
                  </FormControl>
                  {form.formState.errors.avatar && (
                    <p className="mt-1 text-sm text-red-600">
                      {form.formState.errors.avatar.message}
                    </p>
                  )}
                </FormItem>
              )}
            />
          </div>

          {error && (
            <div className="text-center text-sm text-red-600">{error}</div>
          )}

          <div>
            <Button
              type="submit"
              disabled={isUploading || form.formState.isSubmitting}
              className="group relative flex w-full cursor-pointer justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-300 ease-in-out hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
            >
              {isUploading || form.formState.isSubmitting
                ? "Registering..."
                : "Register"}
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

export default RegisterPage;
