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
import { Menu, MessageCircle, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

function Header() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#howitworks", label: "How it Works" },
    { href: "#qa", label: "FAQ" },
  ];

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    const element = document.querySelector(href);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
              Convofy
            </h1>
            <p className="hidden text-xs text-gray-500 sm:block">
              Real-time Chat
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        {!isMobile && (
          <nav className="flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="group relative text-sm font-semibold text-gray-700 transition-colors hover:text-blue-600"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
            <Button
              onClick={() => router.push("/auth/login")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Get Started
            </Button>
          </nav>
        )}

        {/* Mobile Menu */}
        {isMobile && (
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button className="group relative rounded-xl p-2 transition-colors hover:bg-gray-100">
                <Menu className="h-6 w-6 text-gray-700 transition-colors group-hover:text-blue-600" />
                <span className="sr-only">Open menu</span>
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] border-l border-gray-200 bg-white sm:w-[400px]"
              aria-describedby="Mobile navigation links"
            >
              {/* Header */}
              <SheetHeader className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <SheetTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent">
                        Convofy
                      </SheetTitle>
                      <SheetDescription className="text-xs">
                        Navigate to sections
                      </SheetDescription>
                    </div>
                  </div>
                  <SheetClose asChild className="hidden">
                    <button
                      className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                      type="button"
                    >
                      <X className="h-5 w-5 text-gray-500" />
                    </button>
                  </SheetClose>
                </div>
              </SheetHeader>

              {/* Navigation Links */}
              <nav className="mt-8 flex flex-col space-y-2">
                {navLinks.map((link, index) => (
                  <SheetClose asChild key={link.href}>
                    <a
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavClick(link.href);
                      }}
                      className="group flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold text-gray-700 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600"
                      style={{
                        animation: `slideIn 0.3s ease-out ${index * 0.1}s both`,
                      }}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-600 transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-purple-500 group-hover:text-white">
                        {index + 1}
                      </span>
                      {link.label}
                    </a>
                  </SheetClose>
                ))}
              </nav>

              {/* CTA Button */}
              <div className="absolute right-6 bottom-6 left-6">
                <SheetClose asChild>
                  <Button
                    onClick={() => router.push("/auth/login")}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-6 font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Get Started Free
                  </Button>
                </SheetClose>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-20 right-10 h-32 w-32 rounded-full bg-blue-400/10 blur-3xl"></div>
              <div className="absolute bottom-40 left-10 h-40 w-40 rounded-full bg-purple-400/10 blur-3xl"></div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </header>
  );
}

export default Header;
