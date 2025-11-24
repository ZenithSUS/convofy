import { Button } from "@/components/ui/button";
import { Globe, Tag, Users, X } from "lucide-react";
import { useCallback } from "react";

interface AnonymousContentProps {
  isSearching: boolean;
  isCancelling: boolean;
  language: string;
  setLanguage: (language: string) => void;
  currentInterest: string;
  interests: string[];
  showPreferences: boolean;
  hideWelcome?: boolean;
  setShowPreferences: (showPreferences: boolean) => void;
  setCurrentInterest: (interest: string) => void;
  handleRemoveInterest: (interest: string) => void;
  handleAddInterest: () => void;
  handleStartSearching: () => Promise<void>;
  handleStopSearching: () => Promise<void>;
}

function AnonymousContent({
  isSearching,
  isCancelling,
  language,
  setLanguage,
  currentInterest,
  interests,
  showPreferences,
  hideWelcome = false,
  setCurrentInterest,
  setShowPreferences,
  handleRemoveInterest,
  handleAddInterest,
  handleStartSearching,
  handleStopSearching,
}: AnonymousContentProps) {
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddInterest();
      }
    },
    [handleAddInterest],
  );

  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      {showPreferences ? (
        <>
          {/* Preferences Form */}
          <div className="w-full max-w-md space-y-6">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-950/50 dark:to-purple-950/50">
              <Users size={36} className="text-blue-500 dark:text-blue-400" />
            </div>

            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              Set Your Preferences
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Help us find the perfect match for you
            </p>

            {/* Language Selection */}
            <div className="space-y-2 text-left">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Globe size={16} className="text-blue-500 dark:text-blue-400" />
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-700 transition-all focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:focus:border-blue-400"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="ru">Russian</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="zh">Chinese</option>
                <option value="ar">Arabic</option>
                <option value="hi">Hindi</option>
                <option value="tl">Tagalog</option>
                <option value="bi">Bisaya</option>
                <option value="il">Ilocano</option>
              </select>
            </div>

            {/* Interests Input */}
            <div className="space-y-2 text-left">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Tag
                  size={16}
                  className="text-purple-500 dark:text-purple-400"
                />
                Interests{" "}
                <span className="text-xs text-gray-500">(optional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentInterest}
                  onChange={(e) => setCurrentInterest(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., Music, Sports, Gaming..."
                  className="flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-700 transition-all focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:focus:border-purple-400"
                />
                <Button
                  type="button"
                  onClick={handleAddInterest}
                  disabled={!currentInterest.trim()}
                  className="rounded-xl bg-purple-600 px-6 text-white hover:bg-purple-700 disabled:opacity-50 dark:bg-purple-500 dark:hover:bg-purple-600"
                >
                  Add
                </Button>
              </div>

              {/* Interests Tags */}
              {interests.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {interests.map((interest, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                    >
                      {interest}
                      <button
                        onClick={() => handleRemoveInterest(interest)}
                        className="hover:text-purple-900 dark:hover:text-purple-100"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {!hideWelcome && (
                <Button
                  variant="outline"
                  onClick={() => setShowPreferences(false)}
                  className="flex-1 rounded-xl border-2 border-gray-200 dark:border-gray-700"
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleStartSearching}
                className="flex-1 rounded-xl bg-linear-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500"
              >
                Start Searching
              </Button>
            </div>
          </div>
        </>
      ) : isSearching ? (
        <>
          {/* Searching Animation */}
          <div className="relative mb-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-950/50 dark:to-purple-950/50">
              <Users size={40} className="text-blue-500 dark:text-blue-400" />
            </div>
            {/* Animated rings */}
            <div className="absolute inset-0 animate-ping rounded-full border-4 border-blue-500 opacity-75 dark:border-blue-400"></div>
            <div className="absolute inset-0 animate-pulse rounded-full border-4 border-purple-500 dark:border-purple-400"></div>
          </div>

          <h3 className="mb-2 animate-pulse text-lg font-semibold text-gray-700 dark:text-gray-300">
            Searching for a user...
          </h3>
          <p className="mb-2 max-w-sm text-sm text-gray-600 dark:text-gray-400">
            Please wait while we find someone for you to chat with
          </p>

          {/* Show preferences */}
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              <Globe size={12} />
              {language.toUpperCase()}
            </span>
            {interests.map((interest, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
              >
                <Tag size={12} />
                {interest}
              </span>
            ))}
          </div>

          {/* Loading dots */}
          <div className="mb-6 flex gap-2">
            <div
              className="h-3 w-3 animate-bounce rounded-full bg-blue-500"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="h-3 w-3 animate-bounce rounded-full bg-blue-500"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="h-3 w-3 animate-bounce rounded-full bg-blue-500"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>

          <Button
            variant="outline"
            disabled={isCancelling}
            className="border-2 border-red-500 text-red-500 hover:bg-red-50 disabled:opacity-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950/20"
            onClick={handleStopSearching}
          >
            {isCancelling ? "Cancelling..." : " Cancel Search"}
          </Button>
        </>
      ) : (
        !hideWelcome && (
          <>
            {/* Default State */}
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-950/50 dark:to-purple-950/50">
              <Users size={40} className="text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
              Welcome, Guest!
            </h3>
            <p className="mb-6 max-w-sm text-sm text-gray-600 dark:text-gray-400">
              Connect with random users instantly for one-on-one conversations.
              Click the button below to start chatting!
            </p>
          </>
        )
      )}
    </div>
  );
}

export default AnonymousContent;
