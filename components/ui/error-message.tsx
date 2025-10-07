import { AxiosError } from "axios/";
import { axiosErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ErrorMessageProps {
  error: AxiosError;
  onClick: () => void;
}

function ErrorMessage({ error, onClick }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <h2 className="text-2xl font-bold text-red-600">
        Error {error.response?.status}
      </h2>
      <p className="text-lg">{axiosErrorMessage(error)}</p>
      <Button
        variant="default"
        className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all duration-300 ease-in-out hover:scale-105"
        onClick={onClick}
      >
        Try Again
      </Button>
    </div>
  );
}

export default ErrorMessage;
