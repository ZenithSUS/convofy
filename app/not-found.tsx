"use client";

import { useRouter } from "next/navigation";
import { Home, Search, ArrowLeft } from "lucide-react";
import "@/styles/globals.css";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-slate-50 via-white to-blue-50/30 px-4">
      <div className="w-full max-w-md text-center">
        {/* 404 Illustration */}
        <div className="relative mb-8">
          <div className="absolute inset-0 -z-10 animate-pulse">
            <div className="mx-auto h-48 w-48 rounded-full bg-linear-to-br from-blue-100 to-purple-100 opacity-50 blur-3xl" />
          </div>

          <div className="relative">
            <h1 className="text-9xl font-bold text-gray-200 sm:text-[12rem]">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="h-16 w-16 text-blue-400 sm:h-20 sm:w-20" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="mb-8 space-y-3">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Page Not Found
          </h2>
          <p className="text-base text-gray-600 sm:text-lg">
            Oops! The page you&apos;re looking for doesn&apos;t exist or has
            been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </button>

          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-blue-500 to-purple-600 px-6 py-3 font-medium text-white transition-all hover:from-blue-600 hover:to-purple-700 active:scale-95"
          >
            <Home className="h-5 w-5" />
            Back to Home
          </button>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="mb-4 text-sm font-medium text-gray-500">
            Maybe try these instead?
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => router.push("/chat")}
              className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              Chats
            </button>
            <button
              onClick={() => router.push("/chat/profile")}
              className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              Profile
            </button>
            <button
              onClick={() => router.push("/chat/profile/account")}
              className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
