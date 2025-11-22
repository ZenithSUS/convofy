import { RoomContent } from "@/types/room";
import { TrendingUp } from "lucide-react";

interface SearchRoomResultsProps {
  rooms: RoomContent[];
  debouncedSearchQuery: string;
}

function SearchRoomResults({
  rooms,
  debouncedSearchQuery,
}: SearchRoomResultsProps) {
  return (
    <div className="px-4 pb-4">
      <div className="rounded-xl border border-blue-100 bg-linear-to-r from-blue-50 to-purple-50 p-4 dark:border-blue-900/50 dark:from-blue-950/50 dark:to-purple-950/50">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <TrendingUp
                size={16}
                className="text-blue-600 dark:text-blue-400"
              />
              Search Results
            </h2>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Found{" "}
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {rooms && rooms.length > 0 ? rooms.length : 0}
              </span>{" "}
              matches for {`"${debouncedSearchQuery}"`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchRoomResults;
