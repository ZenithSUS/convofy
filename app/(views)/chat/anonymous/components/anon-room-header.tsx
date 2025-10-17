"use client";

import { Button } from "@/components/ui/button";
import { ArrowBigLeftDashIcon } from "lucide-react";
import { useRouter } from "next/navigation";

function AnonymousRoomHeader() {
  const router = useRouter();

  return (
    <header className="bg-background flex items-center justify-between border-b px-4 py-2">
      <h1 className="text-2xl font-bold">Anonymous Chat</h1>
      <Button variant="ghost" size="icon" onClick={() => router.back()}>
        <ArrowBigLeftDashIcon size={24} />
      </Button>
    </header>
  );
}

export default AnonymousRoomHeader;
