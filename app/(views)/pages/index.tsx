"use client";

import Header from "@/app/(views)/components/header";
import HowItWorks from "../components/how-it-works";
import Features from "../components/features";
import QA from "@/app/(views)/components/qa";
import CTA from "@/app/(views)/components/cta";
import Hero from "@/app/(views)/components/hero";
import Footer from "@/app/(views)/components/footer";

function HomeScreen() {
  return (
    <div className="relative overflow-hidden">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <Features />

      {/* How it Works Section */}
      <HowItWorks />

      {/* Q&A Section */}
      <QA />

      {/* CTA Section */}
      <CTA />

      {/* Footer */}
      <Footer />

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default HomeScreen;
