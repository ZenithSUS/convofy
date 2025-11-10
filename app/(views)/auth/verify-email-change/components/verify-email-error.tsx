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

interface VerifyEmailErrorProps {
  error: AxiosErrorMessage;
}

function VerifyEmailError({ error }: VerifyEmailErrorProps) {
  const router = useRouter();

  return (
    <Card className="m-2 w-full max-w-md flex-col shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Email Verification Error
        </CardTitle>
        <CardDescription>
          {error.response.data.error ||
            "There is something wrong in changing the email."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        <p className="text-center">Please try to verify your email again</p>

        <Button
          variant="default"
          onClick={() => router.push("/chat/profile/account")}
          className="mt-4 w-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <p className="text-red-600">Email Token is either invalid or expired</p>
      </CardFooter>
    </Card>
  );
}

export default VerifyEmailError;
