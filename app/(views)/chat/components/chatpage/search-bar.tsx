import { Button } from "@/components/ui/button";
import SearchBar from "@/components/ui/searchbar";
import { RefreshCw, Sparkles } from "lucide-react";

interface SearchBarProps {
  searchQuery: string;
  isRefreshing: boolean;
  isFetching: boolean;
  handleSearch: (query: string) => void;
  handleRefresh: () => void;
}

function SearchRoomBar({
  searchQuery,
  isRefreshing,
  isFetching,
  handleSearch,
  handleRefresh,
}: SearchBarProps) {
  return (
    <div className="px-4 pb-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchBar
            className="rounded-xl border-2 border-gray-200 bg-white shadow-sm transition-all duration-300 focus-within:border-blue-500 hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:focus-within:border-blue-400 dark:hover:border-blue-500"
            onSearch={handleSearch}
          />
          {searchQuery && (
            <div className="absolute top-1/2 right-3 -translate-y-1/2">
              <Sparkles
                size={16}
                className="animate-pulse text-blue-500 dark:text-blue-400"
              />
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing || isFetching}
          className="h-10 w-10 shrink-0 rounded-xl border-2 border-gray-200 bg-white shadow-sm transition-all duration-300 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500 dark:hover:bg-gray-700"
          aria-label="Refresh chats"
        >
          <RefreshCw
            size={18}
            className={`text-gray-600 transition-all duration-500 dark:text-gray-400 ${
              isRefreshing || isFetching
                ? "animate-spin text-blue-600 dark:text-blue-400"
                : ""
            }`}
          />
        </Button>
      </div>
    </div>
  );
}

export default SearchRoomBar;
