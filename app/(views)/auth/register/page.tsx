"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Loader2,
  Mail,
  Lock,
  User,
  Upload,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUploadImage } from "@/hooks/use-upload";
import { useState } from "react";
import client from "@/lib/axios";
import { useDeleteFile } from "@/hooks/use-delete-file";
import { extractPublicId } from "cloudinary-build-url";
import Image from "next/image";
import PasswordStrength from "@/helper/password-strength";
import fileDirectories from "@/helper/file-directories";
import { signIn } from "next-auth/react";

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
    path: ["confirmPassword"],
  });

function RegisterPage() {
  const router = useRouter();

  const { uploadImage, isUploading } = useUploadImage();
  const { deleteFile } = useDeleteFile();

  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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

  const password = form.watch("password") || "";
  const { strengthScore, strengthLabel, strengthColor } =
    PasswordStrength(password);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: RegisterFormInputs) => {
    setError(null);
    try {
      const directory = fileDirectories("avatar");
      const avatarUrl = await uploadImage(data.avatar![0], directory);

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

      if (response.status === 201) {
        signIn("credentials", { email: data.email, password: data.password });
      } else {
        const publicId = extractPublicId(avatarUrl);
        await deleteFile(publicId);
        setError("Registration failed");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred during registration");
    }
  };

  return (
    <div className="relative w-full max-w-md space-y-8 rounded-3xl border border-gray-100 bg-white p-10 shadow-2xl">
      {/* Back Button */}
      <button
        onClick={() => router.replace("/")}
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
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Create Account
        </h1>
        <p className="text-gray-600">Join Convofy and start chatting today</p>
      </div>

      <Form {...form}>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          {/* Avatar Upload */}
          <FormField
            control={form.control}
            name="avatar"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-gray-700">
                  Profile Picture
                </FormLabel>
                <FormControl>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {avatarPreview ? (
                        <Image
                          src={avatarPreview}
                          alt="Avatar preview"
                          width={80}
                          height={80}
                          className="h-20 w-20 rounded-full border-4 border-blue-100 object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-gray-100 bg-linear-to-br from-gray-100 to-gray-200">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <label
                        htmlFor="avatar"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 font-medium text-blue-600 transition-colors hover:bg-blue-100"
                      >
                        <Upload className="h-4 w-4" />
                        Choose Image
                      </label>
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        className="hidden"
                        onChange={(e) => {
                          field.onChange(e.target.files);
                          handleAvatarChange(e);
                        }}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        JPG, PNG (Max 5MB)
                      </p>
                    </div>
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Name Field */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-gray-700">
                  Full Name
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      autoComplete="name"
                      placeholder="Enter your full name"
                      className="h-12 rounded-xl border-2 border-gray-200 pl-10 transition-colors focus:border-blue-500"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

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
                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <Input
                        type={showPassword.password ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Create a password"
                        className="h-12 rounded-xl border-2 border-gray-200 pr-10 pl-10 transition-colors focus:border-blue-500"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((prev) => ({
                            ...prev,
                            password: !prev.password,
                          }))
                        }
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                      >
                        {showPassword.password ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {/* Password Strength Indicator */}
                    {password.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full ${i <= strengthScore ? strengthColor : "bg-gray-200"}`}
                            ></div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">{strengthLabel}</p>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Confirm Password Field */}
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
                      type={showPassword.confirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Confirm your password"
                      className="h-12 rounded-xl border-2 border-gray-200 pr-10 pl-10 transition-colors focus:border-blue-500"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((prev) => ({
                          ...prev,
                          confirmPassword: !prev.confirmPassword,
                        }))
                      }
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
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

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center">
              <p className="text-sm font-medium text-red-600">{error}</p>
            </div>
          )}

          {/* Terms */}
          <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <p className="text-xs text-gray-700">
              By creating an account, you agree to our{" "}
              <a
                href="#"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Privacy Policy
              </a>
            </p>
          </div>

          {/* Register Button */}
          <Button
            type="submit"
            disabled={isUploading || form.formState.isSubmitting}
            className="h-12 w-full rounded-xl bg-linear-to-r from-blue-600 to-purple-600 font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading || form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>

          {/* Sign In Link */}
          <div className="pt-2 text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{" "}
            </span>
            <Link
              href="/auth/login"
              className="text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
            >
              Sign in
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default RegisterPage;
