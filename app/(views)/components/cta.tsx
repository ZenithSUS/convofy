import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

function CTA() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/auth/login");
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-20 text-white md:px-16">
      <div className="absolute top-0 left-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl"></div>
      <div className="absolute right-0 bottom-0 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-white/10 blur-3xl"></div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <h2 className="mb-6 text-4xl font-extrabold md:text-5xl">
          Ready to Start Chatting?
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-blue-100">
          Join thousands of users already enjoying seamless, real-time
          conversations. Get started today for free!
        </p>
        <Button
          size="lg"
          className="hover:shadow-3xl rounded-xl bg-white px-12 py-7 text-lg font-bold text-blue-600 shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-gray-100"
          onClick={handleGetStarted}
        >
          Get Started Free
          <ArrowRight className="ml-2 h-6 w-6" />
        </Button>
      </div>
    </section>
  );
}

export default CTA;
