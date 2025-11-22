import { Check } from "lucide-react";

function MatchFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-20">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-950/50 dark:to-purple-950/50">
        <Check size={40} className="text-blue-600 dark:text-blue-400" />
      </div>
      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
        Match Found!
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        You have a match!
      </p>
    </div>
  );
}

export default MatchFound;
