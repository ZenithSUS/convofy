"use client";

import { Globe, Lock, MessageCircle, Shield, Users, Zap } from "lucide-react";

function Features() {
  return (
    <section
      id="features"
      className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 px-6 py-24 md:px-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="animate-in fade-in slide-in-from-bottom mb-16 text-center duration-700">
          <h2 className="mb-4 text-5xl font-extrabold text-gray-900 md:text-6xl">
            Powerful Features
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Everything you need for seamless communication, all in one place
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Feature 1 */}
          <div
            className="group animate-in fade-in slide-in-from-bottom rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-blue-300 hover:shadow-2xl"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg transition-transform duration-300 group-hover:scale-110">
              <MessageCircle className="text-white" size={32} />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-gray-900">
              Real-time Messaging
            </h3>
            <p className="leading-relaxed text-gray-600">
              Experience instant message delivery with zero delays. Stay
              connected with lightning-fast conversations.
            </p>
          </div>

          {/* Feature 2 */}
          <div
            className="group animate-in fade-in slide-in-from-bottom rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-purple-300 hover:shadow-2xl"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg transition-transform duration-300 group-hover:scale-110">
              <Shield className="text-white" size={32} />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-gray-900">
              Secure & Private
            </h3>
            <p className="leading-relaxed text-gray-600">
              Your conversations are protected with end-to-end encryption.
              Privacy is our top priority.
            </p>
          </div>

          {/* Feature 3 */}
          <div
            className="group animate-in fade-in slide-in-from-bottom rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-green-300 hover:shadow-2xl"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg transition-transform duration-300 group-hover:scale-110">
              <Globe className="text-white" size={32} />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-gray-900">
              Cross-Platform
            </h3>
            <p className="leading-relaxed text-gray-600">
              Access your chats seamlessly from any device, anywhere in the
              world. Stay connected on the go.
            </p>
          </div>

          {/* Additional Features */}
          <div
            className="group animate-in fade-in slide-in-from-bottom rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-orange-300 hover:shadow-2xl"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg transition-transform duration-300 group-hover:scale-110">
              <Zap className="text-white" size={32} />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-gray-900">
              Lightning Fast
            </h3>
            <p className="leading-relaxed text-gray-600">
              Optimized performance ensures smooth and responsive chat
              experience every time.
            </p>
          </div>

          <div
            className="group animate-in fade-in slide-in-from-bottom rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-pink-300 hover:shadow-2xl"
            style={{ animationDelay: "0.5s" }}
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 shadow-lg transition-transform duration-300 group-hover:scale-110">
              <Users className="text-white" size={32} />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-gray-900">
              Group Chats
            </h3>
            <p className="leading-relaxed text-gray-600">
              Create unlimited group conversations and collaborate with teams or
              friends effortlessly.
            </p>
          </div>

          <div
            className="group animate-in fade-in slide-in-from-bottom rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-indigo-300 hover:shadow-2xl"
            style={{ animationDelay: "0.6s" }}
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg transition-transform duration-300 group-hover:scale-110">
              <Lock className="text-white" size={32} />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-gray-900">
              Data Protection
            </h3>
            <p className="leading-relaxed text-gray-600">
              Advanced security measures keep your personal information safe and
              confidential at all times.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Features;
