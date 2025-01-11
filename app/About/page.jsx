import React from 'react';
import { ShieldCheck, Clock, Video, Globe } from 'lucide-react';

const AboutPage = () => {
  const features = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      title: "Verified Experts",
      description: "Every developer undergoes a thorough vetting process to ensure top-quality consultations. We carefully review technical skills, communication abilities, and professional experience."
    },
    {
      icon: <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      title: "Flexible Scheduling",
      description: "Book sessions that fit your timezone and schedule, with instant or planned appointments. Our platform automatically handles timezone conversions and calendar management."
    },
    {
      icon: <Video className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      title: "Seamless Video Calls",
      description: "High-quality video conferencing built right into the platform for smooth collaboration. No additional software installation required - just click and connect."
    },
    {
      icon: <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      title: "Global Reach",
      description: "Connect with developers from around the world, bringing diverse expertise to your projects. Access a wide range of programming languages, frameworks, and specialized skills."
    }
  ];

  return (
    <div className="bg-white dark:bg-black min-h-screen mt-12 text-gray-900 dark:text-white">
      {/* Hero Section */}
      <section className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              About BookMyDev
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300">
              Connecting businesses with top developers worldwide through seamless video consultations.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-gray-100 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Mission</h2>
            <p className="text-lg text-gray-800 dark:text-gray-300">
              BookMyDev aims to revolutionize how businesses connect with technical expertise. We're building a future where accessing developer knowledge is seamless, efficient, and productive for everyone involved. Our platform bridges the gap between businesses seeking technical guidance and skilled developers ready to share their expertise.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            What Sets Us Apart
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-8 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Our Values</h2>
            <div className="space-y-8 text-lg">
              <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-2">Quality First</h3>
                <p className="text-gray-800 dark:text-gray-300">
                  We maintain high standards in our developer selection process to ensure exceptional consultation quality. Every developer on our platform is thoroughly vetted for technical expertise and communication skills.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-2">Innovation</h3>
                <p className="text-gray-800 dark:text-gray-300">
                  We continuously improve our platform to provide the best possible experience for both developers and clients. Our team is dedicated to implementing cutting-edge technologies and user-friendly features.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-2">Global Community</h3>
                <p className="text-gray-800 dark:text-gray-300">
                  We're building a diverse, inclusive community of developers and businesses from around the world. Our platform celebrates different perspectives and approaches to problem-solving.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
