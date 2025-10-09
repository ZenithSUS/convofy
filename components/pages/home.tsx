"use client";

import Image from "next/image";
import { Button } from "../ui/button";
import { Header } from "../ui/header";
import { useRouter } from "next/navigation";

function HomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/auth/login");
  };

  return (
    <>
      <Header />
      <section className="grid min-h-[90vh] grid-cols-1 place-content-center gap-2 px-15 md:grid-cols-2">
        {/* Hero */}
        <div className="flex flex-col items-start justify-center gap-4">
          <h1 className="text-6xl font-bold">Real Time Chat App</h1>
          <p className="text-2xl">Chat with your friends in real time</p>
          <Button
            size="lg"
            className="mt-5 w-fit cursor-pointer"
            onClick={handleGetStarted}
          >
            Get Started
          </Button>
        </div>

        <div className="flex items-center justify-center">
          <Image
            src="/convofy.png"
            alt="Chat Interface"
            width={500}
            height={400}
          />
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-15 py-20"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-4xl font-bold">Features</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="bg-primary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="mb-2 text-2xl font-semibold">
                Real-time Messaging
              </h3>
              <p className="text-muted-foreground">
                Chat instantly with friends and groups without delays.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="mb-2 text-2xl font-semibold">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your conversations are encrypted and protected.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <span className="text-2xl">🌐</span>
              </div>
              <h3 className="mb-2 text-2xl font-semibold">Cross-Platform</h3>
              <p className="text-muted-foreground">
                Access your chats from any device, anywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="howitworks" className="px-15 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-4xl font-bold">How it Works</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="bg-secondary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold">
                1
              </div>
              <h3 className="mb-2 text-2xl font-semibold">Sign Up</h3>
              <p className="text-muted-foreground">
                Create your account in seconds.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-secondary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold">
                2
              </div>
              <h3 className="mb-2 text-2xl font-semibold">Start a Chat</h3>
              <p className="text-muted-foreground">
                Find friends or create group chats.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-secondary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold">
                3
              </div>
              <h3 className="mb-2 text-2xl font-semibold">Chat Away</h3>
              <p className="text-muted-foreground">
                Enjoy real-time conversations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Q&A */}
      <section
        id="qa"
        className="bg-gradient-to-br from-green-50 to-teal-100 px-15 py-20"
      >
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-4xl font-bold">Q&A</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <h3 className="mb-2 text-xl font-semibold">Is Convofy free?</h3>
              <p className="text-muted-foreground">
                Yes, Convofy is completely free to use.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-semibold">
                How secure are my messages?
              </h3>
              <p className="text-muted-foreground">
                All messages are end-to-end encrypted.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-semibold">
                Can I use it on mobile?
              </h3>
              <p className="text-muted-foreground">
                Yes, access from any device with a browser.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-semibold">What is Convofy?</h3>
              <p className="text-muted-foreground">
                A real-time chat application for friends and groups.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-semibold">How do I sign up?</h3>
              <p className="text-muted-foreground">
                Click Get Started and create your account.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-semibold">
                Can I create groups?
              </h3>
              <p className="text-muted-foreground">
                Yes, start group chats with multiple friends.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-semibold">
                Is there a message limit?
              </h3>
              <p className="text-muted-foreground">
                No, enjoy unlimited messaging.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-semibold">
                How to delete a chat?
              </h3>
              <p className="text-muted-foreground">
                Manage and delete chats in your settings.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-semibold">
                Multi-language support?
              </h3>
              <p className="text-muted-foreground">
                Currently supports English.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-10 text-center">
        <p className="text-muted-foreground">
          © {new Date().getFullYear()} Convofy. All rights reserved.
        </p>
      </footer>
    </>
  );
}
export default HomeScreen;
