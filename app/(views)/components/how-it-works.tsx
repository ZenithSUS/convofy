"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

function HowItWorks() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/auth/login");
  };

  return (
    <section
      id="howitworks"
      className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 px-6 py-24 text-white md:px-16"
    >
      <div className="absolute inset-0 bg-black/10"></div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-5xl font-extrabold md:text-6xl">
            Get Started in 3 Easy Steps
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-blue-100">
            Join thousands of users already enjoying seamless conversations
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
          <div className="group relative text-center">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-lg transition-all duration-300 hover:scale-105 hover:bg-white/20">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl font-bold text-blue-600 shadow-xl transition-transform group-hover:scale-110">
                1
              </div>
              <h3 className="mb-3 text-2xl font-bold">Sign Up</h3>
              <p className="text-blue-100">
                Create your free account in just a few seconds. No credit card
                required.
              </p>
            </div>
            {/* Connector line */}
            <div className="absolute top-1/2 left-full hidden h-0.5 w-12 -translate-y-1/2 bg-white/30 md:block"></div>
          </div>

          <div className="group relative text-center">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-lg transition-all duration-300 hover:scale-105 hover:bg-white/20">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl font-bold text-purple-600 shadow-xl transition-transform group-hover:scale-110">
                2
              </div>
              <h3 className="mb-3 text-2xl font-bold">Connect</h3>
              <p className="text-blue-100">
                Find friends, create groups, or join existing conversations
                instantly.
              </p>
            </div>
            {/* Connector line */}
            <div className="absolute top-1/2 left-full hidden h-0.5 w-12 -translate-y-1/2 bg-white/30 md:block"></div>
          </div>

          <div className="group relative text-center">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-lg transition-all duration-300 hover:scale-105 hover:bg-white/20">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl font-bold text-pink-600 shadow-xl transition-transform group-hover:scale-110">
                3
              </div>
              <h3 className="mb-3 text-2xl font-bold">Chat Away</h3>
              <p className="text-blue-100">
                Start chatting with real-time messages and enjoy seamless
                conversations.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Button
            size="lg"
            className="rounded-xl bg-white px-10 py-6 text-lg font-bold text-blue-600 shadow-xl transition-all duration-300 hover:scale-105 hover:bg-gray-100 hover:shadow-2xl"
            onClick={handleGetStarted}
          >
            Start Chatting Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
