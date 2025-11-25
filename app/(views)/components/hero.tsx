import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

function Hero() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/auth/login");
  };

  return (
    <section className="md:px-16lg:px-24 relative grid min-h-[90vh] grid-cols-1 place-content-center gap-8 bg-linear-to-br from-white via-blue-50 to-purple-50 px-6 py-4 md:grid-cols-2">
      {/* Animated background elements */}
      <div className="absolute top-20 left-10 h-72 w-72 animate-pulse rounded-full bg-blue-400/20 blur-3xl"></div>
      <div
        className="absolute right-10 bottom-20 h-96 w-96 animate-pulse rounded-full bg-purple-400/20 blur-3xl"
        style={{ animationDelay: "1s" }}
      ></div>

      {/* Hero Content */}
      <div className="animate-in fade-in slide-in-from-left relative z-10 flex flex-col items-start justify-center gap-6 duration-1000">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
          <Sparkles size={16} />
          Welcome to the Future of Messaging
        </div>

        <h1 className="bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-6xl leading-tight font-extrabold text-transparent md:text-7xl">
          Real Time Chat App
        </h1>

        <p className="max-w-xl text-xl leading-relaxed text-gray-700 md:text-2xl">
          Connect instantly with friends and family. Experience seamless,
          <span className="font-semibold text-blue-600">
            {" "}
            real-time conversations
          </span>{" "}
          that bring you closer together.
        </p>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row">
          <Button
            size="lg"
            className="group rounded-xl bg-linear-to-r from-blue-600 to-purple-600 px-8 py-6 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-2xl"
            onClick={handleGetStarted}
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="rounded-xl border-2 border-gray-300 px-8 py-6 text-lg font-semibold text-gray-700 transition-all duration-300 hover:border-blue-500 hover:bg-blue-50"
            onClick={() =>
              document
                .getElementById("features")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Learn More
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="mt-6 flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-green-500" size={20} />
            <span>Secure & Private</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-green-500" size={20} />
            <span>Anonymous Messaging</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-green-500" size={20} />
            <span>Instant Messaging</span>
          </div>
        </div>
      </div>

      {/* Hero Image */}
      <div className="animate-in fade-in slide-in-from-right relative z-10 flex items-center justify-center duration-1000">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse rounded-3xl bg-linear-to-r from-blue-500 to-purple-500 opacity-30 blur-2xl"></div>
          <Image
            src="/hero.png"
            alt="Chat Interface"
            width={500}
            height={400}
            className="relative rounded-md drop-shadow-2xl transition-transform duration-500 hover:scale-105"
            priority
          />
        </div>
      </div>
    </section>
  );
}

export default Hero;
