"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Filter, Star, Clock, Check, ChevronDown } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from 'next/navigation';

const DevelopersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [rateRange, setRateRange] = useState([0, 200]);
  const [availability, setAvailability] = useState('all');
  const [minRating, setMinRating] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedSort, setSelectedSort] = useState('recommended');
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  // Fetch developers from Firebase
  useEffect(() => {
    try {
      const servicesRef = collection(db, 'services');
      const unsubscribe = onSnapshot(servicesRef, (snapshot) => {
        const developersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Transform the availability data into a status string
          status: isAvailableNow(doc.data().availability) ? 'online' : 'away',
          // Transform the availability data into a readable string
          availabilityString: getAvailabilityString(doc.data().availability)
        }));
        setDevelopers(developersData);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching developers:", err);
        setError("Failed to load developers");
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up developers listener:", err);
      setError("Failed to initialize developers");
      setLoading(false);
    }
  }, []);


  const isAvailableNow = (availability) => {
    if (!availability) return false;
  
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();  // Use 'long' to get full day name
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    const dayAvailability = availability[day];
    if (!dayAvailability?.isAvailable) return false;
    
    return dayAvailability.slots.some(slot => 
      time >= slot.start && time <= slot.end
    );
  };
  
  const getAvailabilityString = (availability) => {
    if (!availability) return "Not Available";
  
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
    if (isAvailableNow(availability)) {
      return "Available Now";
    }
  
    const todaySlots = availability[day]?.slots || [];
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    const laterToday = todaySlots.some(slot => slot.start > time);
    if (laterToday) return "Available Today";
    
    return "Available This Week";
  };
  

  const filteredDevelopers = useMemo(() => {
    return developers
      .filter(dev => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
          dev.title?.toLowerCase().includes(searchLower) ||
          dev.description?.toLowerCase().includes(searchLower) ||
          dev.skills?.some(skill => skill.toLowerCase().includes(searchLower));

        const matchesSkills = 
          selectedSkills.length === 0 ||
          selectedSkills.every(skill => dev.skills?.includes(skill));

        const matchesRate = 
          dev.rate >= rateRange[0] && dev.rate <= rateRange[1];

        const matchesAvailability = 
          availability === 'all' ||
          (availability === 'now' && dev.availabilityString === 'Available Now') ||
          (availability === 'today' && dev.availabilityString === 'Available Today') ||
          (availability === 'week' && dev.availabilityString.includes('Available'));

        return matchesSearch && matchesSkills && matchesRate && matchesAvailability;
      })
      .sort((a, b) => {
        switch (selectedSort) {
          case 'rate-low':
            return a.rate - b.rate;
          case 'rate-high':
            return b.rate - a.rate;
          case 'availability':
            return a.availabilityString.localeCompare(b.availabilityString);
          default:
            return 0;
        }
      });
  }, [developers, searchQuery, selectedSkills, rateRange, availability, selectedSort]);


  const sortOptions = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'rate-low', label: 'Lowest Rate' },
    { value: 'rate-high', label: 'Highest Rate' },
    { value: 'availability', label: 'Availability' }
  ];

  const toggleSkill = (skill) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const resetFilters = () => {
    setSelectedSkills([]);
    setRateRange([0, 200]);
    setAvailability('all');
    setMinRating('all');
    setSearchQuery('');
  };


  const FilterSection = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        {selectedSkills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map(skill => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-md text-sm"
              >
                {skill}
                <button
                  onClick={() => toggleSkill(skill)}
                  className="hover:text-blue-900 dark:hover:text-blue-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Rate Range Filter */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Hourly Rate</h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            ${rateRange[0]} - ${rateRange[1]}
          </span>
        </div>
        <Slider
          defaultValue={[0, 200]}
          max={200}
          step={10}
          value={rateRange}
          onValueChange={setRateRange}
          className="mt-2"
        />
      </div>

      {/* Availability Filter */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Availability
        </h3>
        <Select value={availability} onValueChange={setAvailability}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Availabilities</SelectItem>
            <SelectItem value="now">Available Now</SelectItem>
            <SelectItem value="today">Available Today</SelectItem>
            <SelectItem value="week">Available This Week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Rating Filter */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Minimum Rating
        </h3>
        <Select value={minRating} onValueChange={setMinRating}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select minimum rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="4.5">4.5+ Stars</SelectItem>
            <SelectItem value="4.0">4.0+ Stars</SelectItem>
            <SelectItem value="3.5">3.5+ Stars</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black mt-16">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Find Developers
            </h1>
            <div className="flex items-center gap-4">
              <Select value={selectedSort} onValueChange={setSelectedSort}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters - Desktop */}
          <div className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-gray-900 dark:text-white">Filters</h2>
                <button
                  onClick={resetFilters}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Reset All
                </button>
              </div>
              <FilterSection />
            </div>
          </div>

          {/* Filters - Mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300">
                <Filter className="w-4 h-4" />
                Filters
                {(selectedSkills.length > 0 || availability !== 'all' || minRating !== 'all') && (
                  <span className="ml-1 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                    {selectedSkills.length + (availability !== 'all' ? 1 : 0) + (minRating !== 'all' ? 1 : 0)}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-8">
                <FilterSection />
              </div>
            </SheetContent>
          </Sheet>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, skills, or expertise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Developer Cards */}
            <div className="flex-1 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">{error}</div>
            ) : filteredDevelopers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No developers found matching your criteria
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredDevelopers
                  .slice((page - 1) * 10, page * 10)
                  .map((dev) => (
                    <div
                      key={dev.id}
                      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:border-blue-500 dark:hover:border-blue-400 transition-all"
                    >
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Profile Info */}
                        <div className="md:w-64 shrink-0">
                          <div className="flex flex-col items-center text-center">
                            <div className="relative mb-3">
                              <img
                                src={dev.imageUrl || '/api/placeholder/150/150'}
                                alt={dev.title}
                                className="w-24 h-24 rounded-full object-cover"
                              />
                              <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                                dev.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                              }`} />
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {dev.title}
                            </h3>
                            <div className="flex items-center gap-1.5 text-sm mb-4">
                              <span className="text-gray-500 dark:text-gray-400">
                                {dev.timezone}
                              </span>
                            </div>
                            <button 
                              onClick={() => router.push(`/Developers/${dev.id}`)}
                              className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mb-4"
                            >
                              Book Now
                            </button>
                          </div>
                        </div>

                        {/* Developer Details */}
                        <div className="flex-1 space-y-6">
                          {/* Description */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              About
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400">
                              {dev.description}
                            </p>
                          </div>

                          {/* Skills */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                              Skills
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {dev.skills?.map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Rate, Availability and Wallet */}
                          <div className="flex flex-wrap gap-6">
                            {/* Rate Section */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Hourly Rate
                              </h4>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                ${dev.rate}/hr
                              </p>
                            </div>

                            {/* Availability Section */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Availability
                              </h4>
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${
                                  dev.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                                }`} />
                                <span className="text-gray-900 dark:text-white">
                                  {dev.availabilityString}
                                </span>
                              </div>
                            </div>

                            {/* Wallet Section */}
                            <div className="flex-1 min-w-[200px]">
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Payment Method
                              </h4>
                              {dev.walletConnected && dev.walletInfo ? (
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-900 dark:text-white font-medium">
                                      {dev.walletInfo.type}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                                      {dev.walletInfo.address.slice(0, 6)}...{dev.walletInfo.address.slice(-4)}
                                    </span>
                                  </div>
                                  <button 
                                    onClick={() => navigator.clipboard.writeText(dev.walletInfo.address)}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1 rounded-md transition-colors"
                                    title="Copy wallet address"
                                  >
                                    <svg 
                                      className="w-4 h-4" 
                                      fill="none" 
                                      viewBox="0 0 24 24" 
                                      stroke="currentColor"
                                    >
                                      <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
                                      />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-gray-500 dark:text-gray-400">
                                  No wallet connected
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
            )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                <select
                  value={page}
                  onChange={(e) => setPage(Number(e.target.value))}
                  className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5].map(p => (
                    <option key={p} value={p}>
                      Page {p}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  of 5 pages
                </span>
              </div>
              <button
                onClick={() => setPage(p => Math.min(5, p + 1))}
                disabled={page === 5}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevelopersPage;