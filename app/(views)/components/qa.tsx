"use client";

import QAData from "@/constants/QA";

function QA() {
  return (
    <section
      id="qa"
      className="bg-gradient-to-br from-gray-50 to-white px-6 py-24 md:px-16"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-5xl font-extrabold text-gray-900 md:text-6xl">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about Convofy
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {QAData.map((item, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-100 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
              style={{
                animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
              }}
            >
              <h3 className="mb-2 flex items-start gap-2 text-lg font-bold text-gray-900">
                <span className="flex-shrink-0 text-blue-600">Q:</span>
                <span>{item.q}</span>
              </h3>
              <p className="pl-6 text-gray-600">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default QA;
