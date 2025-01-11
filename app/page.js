"use client"
import React, { useState } from 'react';
import { Search, ChevronRight, Star, Video, Calendar, Clock, Shield } from 'lucide-react';

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const developers = [
    {
      id: 1,
      name: 'Sarah Chen',
      skill: 'Full Stack Developer',
      skills: ['React', 'Node.js', 'Python', 'AWS'],
      rate: 150,
      rating: 4.9,
      availability: 'Available Now'
    },
    {
      id: 2,
      name: 'Mike Johnson',
      skill: 'React Specialist',
      skills: ['React', 'TypeScript', 'Next.js', 'TailwindCSS'],
      rate: 125,
      rating: 4.8,
      availability: 'Available in 2 hours'
    },
    {
      id: 3,
      name: 'Alex Kumar',
      skill: 'Cloud Architect',
      skills: ['AWS', 'Docker', 'Kubernetes', 'DevOps'],
      rate: 175,
      rating: 4.9,
      availability: 'Available Today'
    }
  ];

  const features = [
    {
      icon: <Video className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      title: "On-Demand Video Calls",
      description: "Connect instantly with skilled developers through seamless video conferencing."
    },
    {
      icon: <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      title: "Easy Scheduling",
      description: "Book sessions at your convenience with our efficient scheduling system."
    },
    {
      icon: <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      title: "Flexible Timing",
      description: "Choose from various time slots that work best for your schedule."
    },
    {
      icon: <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      title: "Verified Developers",
      description: "Access a network of pre-vetted, experienced developers."
    }
  ];

  return (
    <section className="bg-white dark:bg-black mt-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Hero Section */}
        <div className="pt-20 pb-16">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Find & Book Top Developers Instantly
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Access skilled developers for on-demand video calls at your convenience.
            </p>

            {/* Search Bar */}
            <div className="relative mb-8">
              <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by skills, hourly rate, or availability..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105 transition-all flex items-center justify-center">
                Book Now
                <ChevronRight size={20} className="ml-2" />
              </button>
              <button className="px-8 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-400 transform hover:scale-105 transition-all dark:text-white">
                Browse Developers
              </button>
            </div>
          </div>

          {/* Developer Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {developers.map((dev) => (
              <div
                key={dev.id}
                className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer bg-white dark:bg-gray-800"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg shrink-0">
                    {dev.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="space-y-3 w-full">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{dev.name}</h3>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">${dev.rate}/hr</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">{dev.skill}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Star size={16} className="text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{dev.rating}</span>
                      <span className="text-sm text-green-600 dark:text-green-400 ml-auto">{dev.availability}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {dev.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Features Section */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Why Choose BookMyDev?</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Connect with skilled developers through our professional platform designed for seamless video consultations and technical discussions.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="text-center p-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;