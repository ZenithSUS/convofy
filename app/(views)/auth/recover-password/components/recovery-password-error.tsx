"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { AxiosErrorMessage } from "@/types/error";

interface PasswordRecoveryErrorProps {
  error: AxiosErrorMessage;
}

function PasswordRecoveryError({ error }: PasswordRecoveryErrorProps) {
  const router = useRouter();

  return (
    <Card className="m-2 w-full max-w-md flex-col shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          <div className="text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-purple-600 shadow-lg">
              <span className="text-2xl font-bold text-white">C</span>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              Password Recovery Error
            </h1>
          </div>
        </CardTitle>
        <CardDescription>
          {error.response.data.error ||
            "There is something wrong in recovering your password."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        <p className="text-center">Please try to verify your email again</p>

        <Button
          variant="default"
          onClick={() => router.push("/auth/forgot")}
          className="mt-4 w-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <p className="text-red-600">
          Recovery Token is either invalid or expired
        </p>
      </CardFooter>
    </Card>
  );
}

export default PasswordRecoveryError;
