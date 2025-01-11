"use client"

import React from 'react';
import { Separator } from "@/components/ui/separator";

const TermsOfService = () => {
  return (
    <div className="max-w-[1000px] mx-auto px-6 py-16 md:py-24">
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">Last updated: January 11, 2024</p>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Agreement to Terms</h2>
            <p>
              By accessing and using BookMyDev, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
          </section>

          <Separator className="my-8" />

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Use License</h2>
            <div className="space-y-4">
              <h3 className="text-xl font-medium">2.1 Platform Usage</h3>
              <p>BookMyDev grants you a limited, non-exclusive, non-transferable license to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Create and maintain a profile</li>
                <li>Search and connect with developers</li>
                <li>Book development services</li>
                <li>Access and use platform features</li>
              </ul>
            </div>
          </section>

          <Separator className="my-8" />

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. User Responsibilities</h2>
            <div className="space-y-4">
              <h3 className="text-xl font-medium">3.1 Account Security</h3>
              <p>You are responsible for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintaining the confidentiality of your account</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us of any unauthorized use</li>
                <li>Ensuring your profile information is accurate</li>
              </ul>
            </div>
          </section>

          <Separator className="my-8" />

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Payment Terms</h2>
            <p>
              All fees are quoted in USD unless otherwise specified. You agree to pay all fees associated with using our services. We use secure third-party payment processors for all transactions.
            </p>
            <div className="space-y-2">
              <h3 className="text-xl font-medium">4.1 Refund Policy</h3>
              <p>
                Refunds are handled on a case-by-case basis. Please contact our support team for refund requests.
              </p>
            </div>
          </section>

          <Separator className="my-8" />

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Intellectual Property</h2>
            <p>
              The service and its original content, features, and functionality are owned by BookMyDev and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
          </section>

          <Separator className="my-8" />

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Termination</h2>
            <p>
              We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>

          <Separator className="my-8" />

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
              <br />
              Email: legal@bookmydev.com
              <br />
              Address: [Your Business Address]
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;