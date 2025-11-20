"use client";

import { Session } from "@/app/(views)/chat/components/chat-header";
import ProfileHeader from "../components/profile-header";
import useHybridSession from "@/hooks/use-hybrid-session";
import AvatarCard from "../components/avatar-card";
import { Sun, EyeOff, MessageSquare, Activity, Moon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useUpdatePreferences } from "@/hooks/use-user";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import useTheme from "@/store/theme-store";

interface PreferencesPageProps {
  serverSession: Session;
}

function PreferencesPageClient({ serverSession }: PreferencesPageProps) {
  const queryClient = useQueryClient();
  const { session, update } = useHybridSession(serverSession);
  const { theme: isDarkMode, setTheme: toggleDarkMode } = useTheme();
  const { mutateAsync: updatePreferences, isPending: isUpdating } =
    useUpdatePreferences();

  const [settings, setSettings] = useState({
    theme: session.user.preferences.theme === "dark",
    anonymousMode: session.user.isAnonymous,
    hideTypingIndicator: session.user.preferences.hideTypingIndicator,
    hideStatus: session.user.preferences.hideStatus,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    if (key === "theme") {
      toggleDarkMode(settings.theme ? "light" : "dark");
    }

    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isChangeAnonymity = useMemo(() => {
    return session.user.isAnonymous !== settings.anonymousMode;
  }, [session.user.isAnonymous, settings.anonymousMode]);

  const noChangesMade = useMemo(() => {
    return (
      session.user.isAnonymous === settings.anonymousMode &&
      session.user.preferences.theme === (settings.theme ? "dark" : "light") &&
      session.user.preferences.hideTypingIndicator ===
        settings.hideTypingIndicator &&
      session.user.preferences.hideStatus === settings.hideStatus
    );
  }, [
    session.user.isAnonymous,
    settings.anonymousMode,
    session.user.preferences.theme,
    settings.theme,
    session.user.preferences.hideTypingIndicator,
    settings.hideTypingIndicator,
    session.user.preferences.hideStatus,
    settings.hideStatus,
  ]);

  const handleSavePreferences = useCallback(async () => {
    try {
      if (isUpdating) return;
      toast.promise(
        async () => {
          const response = await updatePreferences({
            userId: session.user.id,
            isAnonymous: settings.anonymousMode,
            preferences: {
              theme: settings.theme ? "dark" : "light",
              hideTypingIndicator: settings.hideTypingIndicator,
              hideStatus: settings.hideStatus,
            },
          });

          if (!response) {
            toast.error("Failed to update preferences. Please try again.");
            return;
          }

          await update({
            user: {
              ...session.user,
              avatar: response.avatar,
              isAnonymous: response.isAnonymous,
              preferences: {
                ...response.preferences,
              },
              anonAlias: response.anonAlias,
              anonAvatar: response.anonAvatar,
            },
          });

          if (isChangeAnonymity) {
            queryClient.removeQueries({ queryKey: ["rooms"] });
            queryClient.removeQueries({ queryKey: ["room"] });
            queryClient.removeQueries({ queryKey: ["messages"] });
          }

          document.documentElement.classList.toggle("dark", settings.theme);
        },
        {
          loading: "Updating preferences...",
          success: "Preferences updated successfully.",
          error: "Failed to update preferences. Please try again.",
        },
      );
    } catch (error) {
      console.error("Failed to update preferences:", error);
      toast.error("Failed to update preferences. Please try again.");
      return;
    }
  }, [
    updatePreferences,
    session.user,
    settings,
    isUpdating,
    update,
    isChangeAnonymity,
    queryClient,
  ]);

  const settingsList = [
    {
      key: "theme" as const,
      icon: isDarkMode ? Moon : Sun,
      title: "Theme",
      description:
        "Switch between light, dark, or system themes to suit your style",
      iconBg: isDarkMode
        ? "bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-500 dark:to-amber-600"
        : "bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-500 dark:to-yellow-600",
      iconColor: isDarkMode
        ? "text-amber-400 dark:text-amber-100"
        : "text-yellow-400 dark:text-yellow-100",
    },
    {
      key: "anonymousMode" as const,
      icon: EyeOff,
      title: "Anonymous Mode",
      description:
        "Switch to anonymous mode to access anonymous chat experiences",
      iconBg:
        "bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-500 dark:to-purple-600",
      iconColor: "text-purple-400 dark:text-purple-100",
    },
    {
      key: "hideTypingIndicator" as const,
      icon: MessageSquare,
      title: "Hide Typing Indicator",
      description: "Don't show when you're typing to others",
      iconBg:
        "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-500 dark:to-blue-600",
      iconColor: "text-blue-400 dark:text-blue-100",
    },
    {
      key: "hideStatus" as const,
      icon: Activity,
      title: "Hide Status",
      description: "Display your online/offline status to others",
      iconBg:
        "bg-gradient-to-br from-green-100 to-green-200 dark:from-green-500 dark:to-green-600",
      iconColor: "text-green-400 dark:text-green-100",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <ProfileHeader
        sessionId={session.user.sessionId}
        userId={session.user.id}
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-8">
        <AvatarCard session={session} name="Preferences" />

        <div className="mt-6 rounded-lg bg-white/70 p-6 shadow-sm backdrop-blur-md dark:bg-gray-800/70">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            Preferences
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            Customize your chat preferences, including themes, notification
            settings, and more.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {settingsList.map((setting) => {
            const Icon = setting.icon;
            const isEnabled = settings[setting.key];

            if (
              setting.key === "anonymousMode" &&
              session.user.role === "anonymous"
            ) {
              return null;
            }

            return (
              <div
                key={setting.key}
                className="flex items-center gap-4 rounded-lg bg-white/70 p-4 shadow-sm backdrop-blur-md dark:bg-gray-800/70"
              >
                <div className={`rounded-md p-2 ${setting.iconBg}`}>
                  <Icon className={`h-6 w-6 ${setting.iconColor}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {setting.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {setting.description}
                  </p>
                </div>

                <button
                  onClick={() => toggleSetting(setting.key)}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                    isEnabled ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                  aria-label={`Toggle ${setting.title}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                      isEnabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {
          /* Save button */
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSavePreferences}
              disabled={isUpdating || noChangesMade}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:dark:opacity-50"
            >
              Save Preferences
            </Button>
          </div>
        }
      </div>
    </div>
  );
}

export default PreferencesPageClient;
