import { Button } from "@/components/ui/button";
import { Loader2, LucideProps } from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

interface LoadMoreButtonProps {
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  content: string;
}

function LoadMoreButton({
  icon: Icon,
  isFetchingNextPage,
  fetchNextPage,
  content,
}: LoadMoreButtonProps) {
  return (
    <div className="mt-8 flex items-center justify-center">
      <Button
        onClick={fetchNextPage}
        disabled={isFetchingNextPage}
        className="rounded-xl bg-linear-to-r from-blue-600 to-purple-600 px-8 py-6 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 dark:from-blue-400 dark:to-purple-400 dark:hover:from-blue-500 dark:hover:to-purple-500"
      >
        {isFetchingNextPage ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading More...
          </>
        ) : (
          <>
            <Icon className="mr-2 h-5 w-5" />
            Load More {content}
          </>
        )}
      </Button>
    </div>
  );
}

export default LoadMoreButton;
