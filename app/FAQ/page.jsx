"use client";
import React, { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: "How can I book a developer?",
      answer:
        "You can book a developer by using the 'Book Now' button on the homepage. Simply search for a developer with the desired skill set, check their availability, and confirm your booking.",
    },
    {
      question: "What payment methods are supported?",
      answer:
        "We accept all major credit and debit cards, as well as popular online payment methods like PayPal, Stripe, and Google Pay.",
    },
    {
      question: "Are the developers verified?",
      answer:
        "Yes, all developers on our platform are pre-vetted to ensure their skills and expertise match our quality standards.",
    },
    {
      question: "Can I cancel or reschedule a booking?",
      answer:
        "Yes, you can cancel or reschedule a booking from your dashboard. Please note that cancellations made within 24 hours of the session may incur a fee.",
    },
    {
      question: "What happens if a developer misses a session?",
      answer:
        "In the rare case that a developer misses a session, you can report the issue, and we will arrange a replacement or offer a refund.",
    },
  ];

  const toggleFAQ = (index) => {
    setActiveIndex(index === activeIndex ? null : index);
  };

  return (
    <section className="bg-white dark:bg-black py-16 mt-6">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Find answers to common questions about our platform and services.
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl p-6 transition-all hover:shadow-xl"
            >
              <button
                className="flex justify-between items-center w-full text-white"
                onClick={() => toggleFAQ(index)}
              >
                <div className="flex items-center space-x-3">
                  <HelpCircle className="text-white" size={24} />
                  <h3 className="text-xl font-semibold">{faq.question}</h3>
                </div>
                {activeIndex === index ? (
                  <ChevronUp className="text-white" />
                ) : (
                  <ChevronDown className="text-white" />
                )}
              </button>
              {activeIndex === index && (
                <p className="mt-4 text-gray-200">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
