"use client"
import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Star, Video, Calendar, Clock, Shield } from 'lucide-react';
import { collection, query, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredDevs, setFeaturedDevs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const servicesRef = collection(db, 'services');
      const featuredQuery = query(servicesRef, limit(3));

      const unsubscribe = onSnapshot(featuredQuery, (snapshot) => {
        const developersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          status: isAvailableNow(doc.data().availability) ? 'online' : 'away',
          availabilityString: getAvailabilityString(doc.data().availability)
        }));
        setFeaturedDevs(developersData);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching developers:", err);
        setError("Failed to load featured developers");
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up developers listener:", err);
      setError("Failed to initialize featured developers");
      setLoading(false);
    }
  }, []);

  const isAvailableNow = (availability) => {
    if (!availability) return false;
    
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
    const time = now.getHours().toString().padStart(2, '0') + ':' + 
                 now.getMinutes().toString().padStart(2, '0');
    
    const dayAvailability = availability[day];
    if (!dayAvailability?.isAvailable) return false;
    
    return dayAvailability.slots.some(slot => 
      time >= slot.start && time <= slot.end
    );
  };

  const getAvailabilityString = (availability) => {
    if (!availability) return "Not Available";
    
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
    
    if (isAvailableNow(availability)) {
      return "Available Now";
    }

    const todaySlots = availability[day]?.slots || [];
    const time = now.getHours().toString().padStart(2, '0') + ':' + 
                 now.getMinutes().toString().padStart(2, '0');
    
    const laterToday = todaySlots.some(slot => slot.start > time);
    if (laterToday) return "Available Today";
    
    return "Available This Week";
  };

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
        <div className="pt-20 pb-16">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Find & Book Top Developers Instantly
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Access skilled developers for on-demand video calls at your convenience.
            </p>

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

          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {loading ? (
              <div className="col-span-3 flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="col-span-3 text-center py-12 text-red-500">{error}</div>
            ) : (
              featuredDevs.map((dev) => (
                <div
                  key={dev.id}
                  className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer bg-white dark:bg-gray-800"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <img
                        src={dev.imageUrl || '/api/placeholder/56/56'}
                        alt={dev.title}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                        dev.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                    </div>
                    <div className="space-y-3 w-full">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{dev.title}</h3>
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">${dev.rate}/hr</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">{dev.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Star size={16} className="text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{dev.rating}</span>
                        <span className={`text-sm ml-auto ${
                          dev.status === 'online' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {dev.availabilityString}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {dev.skills?.slice(0, 4).map((skill, index) => (
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
              ))
            )}
          </div>

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