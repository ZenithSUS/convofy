"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
  SheetTitle,
  SheetDescription,
  SheetHeader,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

function Header() {
  const isMobile = useIsMobile();

  return (
    <header className="bg-background/50 border-border sticky top-0 z-50 flex w-full items-center justify-between border-b px-3 py-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold">Convofy</h1>

      {isMobile ? (
        <Sheet>
          <SheetTrigger asChild>
            <button className="p-2">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </button>
          </SheetTrigger>
          <SheetContent
            side="top"
            className="pt-6 pb-2 pl-4"
            aria-describedby="Mobile navigation links"
          >
            {/* Navigation title */}
            <SheetHeader className="p-0">
              <SheetTitle className="text-lg">Navigation</SheetTitle>
              <SheetDescription className="sr-only">
                Select a section to navigate to
              </SheetDescription>
            </SheetHeader>
            {/* Navigation links */}
            <nav className="mt-8 flex flex-col space-y-4">
              <SheetClose asChild>
                <a href="#features" className="text-lg">
                  Features
                </a>
              </SheetClose>
              <SheetClose asChild>
                <a href="#howitworks" className="text-lg">
                  How it works
                </a>
              </SheetClose>
              <SheetClose asChild>
                <a href="#qa" className="text-lg">
                  Q&A
                </a>
              </SheetClose>
            </nav>
          </SheetContent>
        </Sheet>
      ) : (
        <nav className="flex items-center space-x-4">
          <a href="#features">Features</a>
          <a href="#howitworks">How it works</a>
          <a href="#qa">Q&A</a>
        </nav>
      )}
    </header>
  );
}

export { Header };
