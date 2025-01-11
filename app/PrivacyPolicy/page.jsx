"use client"

import React from 'react';
import { Separator } from "@/components/ui/separator";

const PrivacyPolicy = () => {
  return (
    <div className="max-w-[1000px] mx-auto px-6 py-16 md:py-24">
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">Last updated: January 11, 2024</p>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Introduction</h2>
            <p>
              Welcome to BookMyDev. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <Separator className="my-8" />

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Information We Collect</h2>
            <div className="space-y-4">
              <h3 className="text-xl font-medium">2.1 Personal Information</h3>
              <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Identity Data: name, username, or similar identifier</li>
                <li>Contact Data: email address and telephone numbers</li>
                <li>Technical Data: internet protocol (IP) address, browser type and version, time zone setting</li>
                <li>Profile Data: your skills, portfolio, work history, and preferences</li>
                <li>Usage Data: information about how you use our website and services</li>
              </ul>
            </div>
          </section>

          <Separator className="my-8" />

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. How We Use Your Information</h2>
            <p>We use your personal data for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain our service</li>
              <li>To notify you about changes to our service</li>
              <li>To allow you to participate in interactive features</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information to improve our service</li>
            </ul>
          </section>

          <Separator className="my-8" />

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Data Security</h2>
            <p>
              We have implemented appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. We limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.
            </p>
          </section>

          <Separator className="my-8" />

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Your Legal Rights</h2>
            <p>Under data protection laws, you have rights including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The right to access your personal data</li>
              <li>The right to correction of your personal data</li>
              <li>The right to erasure of your personal data</li>
              <li>The right to restrict processing of your personal data</li>
              <li>The right to object to processing of your personal data</li>
            </ul>
          </section>

          <Separator className="my-8" />

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our privacy practices, please contact us at:
              <br />
              Email: privacy@bookmydev.com
              <br />
              Address: [Your Business Address]
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;