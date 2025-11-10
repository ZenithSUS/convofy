"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import getErrorMessage from "@/helper/google/error-message";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorInfo = getErrorMessage(error, error);

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {errorInfo.title}
        </CardTitle>
        <CardDescription>{errorInfo.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Code: {error || "Unknown"}</AlertTitle>
          <AlertDescription className="mt-2">
            If this problem persists, please contact support with this error
            code.
          </AlertDescription>
        </Alert>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <Button asChild className="w-full" variant="default">
          <Link href="/auth/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign In
          </Link>
        </Button>
        <Button asChild className="w-full" variant="outline">
          <Link href="/">Go Home</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
