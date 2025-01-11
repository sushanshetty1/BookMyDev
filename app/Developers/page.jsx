"use client"
import React, { useState, useMemo } from 'react';
import { Search, X, Filter, Star, Clock, Check, ChevronDown } from 'lucide-react';
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

const DevelopersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [rateRange, setRateRange] = useState([0, 200]);
  const [availability, setAvailability] = useState('all');
  const [minRating, setMinRating] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedSort, setSelectedSort] = useState('recommended');

  const developers = [
    {
      id: 1,
      name: 'Sarah Chen',
      title: 'Full Stack Developer',
      skills: ['React', 'Node.js', 'Python', 'AWS'],
      rate: 150,
      rating: 4.9,
      reviews: 128,
      availability: 'Available Now',
      status: 'online',
      image: '/api/placeholder/150/150',
      lastActive: '2 minutes ago',
      timezone: 'PST',
      bio: 'Full stack developer with 8+ years of experience building scalable web applications.'
    },
    {
      id: 2,
      name: 'Mike Johnson',
      title: 'React Specialist',
      skills: ['React', 'TypeScript', 'Next.js', 'TailwindCSS'],
      rate: 125,
      rating: 4.8,
      reviews: 89,
      availability: 'Available in 2 hours',
      status: 'away',
      image: '/api/placeholder/150/150',
      lastActive: '1 hour ago',
      timezone: 'EST',
      bio: 'Frontend expert specializing in React and modern JavaScript frameworks.'
    },
    {
      id: 3,
      name: 'Alex Kumar',
      title: 'Cloud Architect',
      skills: ['AWS', 'Docker', 'Kubernetes', 'DevOps'],
      rate: 175,
      rating: 4.9,
      reviews: 156,
      availability: 'Available Today',
      status: 'online',
      image: '/api/placeholder/150/150',
      lastActive: '5 minutes ago',
      timezone: 'GMT',
      bio: 'Senior cloud architect with expertise in AWS and containerization.'
    }
  ];

  const allSkills = [
    'React', 'Node.js', 'Python', 'AWS', 'TypeScript', 'Next.js', 
    'TailwindCSS', 'Docker', 'Kubernetes', 'DevOps', 'JavaScript',
    'Vue.js', 'Angular', 'Java', 'Go', 'Ruby', 'PHP'
  ];

  const filteredDevelopers = useMemo(() => {
    return developers
      .filter(dev => {
        // Search query filter
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
          dev.name.toLowerCase().includes(searchLower) ||
          dev.title.toLowerCase().includes(searchLower) ||
          dev.skills.some(skill => skill.toLowerCase().includes(searchLower));

        // Skills filter
        const matchesSkills = 
          selectedSkills.length === 0 ||
          selectedSkills.every(skill => dev.skills.includes(skill));

        // Rate range filter
        const matchesRate = 
          dev.rate >= rateRange[0] && dev.rate <= rateRange[1];

        // Availability filter
        const matchesAvailability = 
          availability === 'all' ||
          (availability === 'now' && dev.availability === 'Available Now') ||
          (availability === 'today' && dev.availability === 'Available Today') ||
          (availability === 'week' && dev.availability.includes('Available'));

        // Rating filter
        const matchesRating =
          minRating === 'all' ||
          dev.rating >= parseFloat(minRating);

        return matchesSearch && matchesSkills && matchesRate && 
               matchesAvailability && matchesRating;
      })
      .sort((a, b) => {
        switch (selectedSort) {
          case 'rating':
            return b.rating - a.rating;
          case 'rate-low':
            return a.rate - b.rate;
          case 'rate-high':
            return b.rate - a.rate;
          case 'availability':
            return a.availability.localeCompare(b.availability);
          default:
            return 0;
        }
      });
  }, [developers, searchQuery, selectedSkills, rateRange, availability, minRating, selectedSort]);


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
      {/* Skills Filter */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Skills</h3>
          {selectedSkills.length > 0 && (
            <button
              onClick={() => setSelectedSkills([])}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-full px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-left text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600">
              {selectedSkills.length === 0 ? (
                "Select skills..."
              ) : (
                `${selectedSkills.length} selected`
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search skills..." />
              <CommandEmpty>No skills found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {allSkills.map(skill => (
                  <CommandItem
                    key={skill}
                    onSelect={() => toggleSkill(skill)}
                    className="flex items-center gap-2"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      selectedSkills.includes(skill)
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selectedSkills.includes(skill) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    {skill}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
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
    <div className="min-h-screen bg-gray-50 dark:bg-black">
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
            <div className="grid gap-6">
              {filteredDevelopers
                .slice((page - 1) * 10, page * 10)
                .map((dev) => (
                  <div
                    key={dev.id}
                    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:border-blue-500 dark:hover:border-blue-400 transition-all"
                  >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Left Column - Profile Info */}
                    <div className="md:w-64 shrink-0">
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-3">
                          <img
                            src={dev.image}
                            alt={dev.name}
                            className="w-24 h-24 rounded-full object-cover"
                          />
                          <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                            dev.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                          }`} />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {dev.name}
                          </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                          {dev.title}
                        </p>
                        <div className="flex items-center gap-1.5 text-sm mb-4">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {dev.rating}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            ({dev.reviews} reviews)
                          </span>
                        </div>
                        <button className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mb-4">
                          Book Now
                        </button>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{dev.timezone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Developer Details */}
                    <div className="flex-1 space-y-6">
                      {/* Bio */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          About
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {dev.bio}
                        </p>
                      </div>

                      {/* Skills */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {dev.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Rate and Availability */}
                      <div className="flex flex-wrap gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Hourly Rate
                          </h4>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            ${dev.rate}/hr
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Availability
                          </h4>
                          <p className="text-sm">
                            <span className="inline-flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${
                                dev.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                              }`} />
                              <span className="text-gray-900 dark:text-white">{dev.availability}</span>
                            </span>
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Last Active
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {dev.lastActive}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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