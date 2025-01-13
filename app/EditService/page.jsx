"use client"
import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Wallet, Upload, Image as ImageIcon, AlertCircle, Clock, Copy, ArrowLeft } from 'lucide-react';
import { auth, db } from '../../firebase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const EditService = () => {
  const router = useRouter();
  const [state, setState] = useState({
    isLoading: true,
    error: '',
    success: false,
    saving: false,
    hasChanges: false,
    profileImage: null,
    imagePreview: null,
    uploadingImage: false,
    skillInput: '',
    selectedSkills: [],
    formData: {
      title: '',
      rate: '',
      description: '',
      portfolioLink: '',
      linkedinLink: '',
      timezone: '',
      availabilityPattern: 'weekly',
    },
    availability: {
      monday: { isAvailable: false, slots: [] },
      tuesday: { isAvailable: false, slots: [] },
      wednesday: { isAvailable: false, slots: [] },
      thursday: { isAvailable: false, slots: [] },
      friday: { isAvailable: false, slots: [] },
      saturday: { isAvailable: false, slots: [] },
      sunday: { isAvailable: false, slots: [] },
    },
    originalData: null
  });

  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  const timezones = [
    'UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00',
    'UTC-07:00', 'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00',
    'UTC-02:00', 'UTC-01:00', 'UTC+00:00', 'UTC+01:00', 'UTC+02:00',
    'UTC+03:00', 'UTC+04:00', 'UTC+05:00', 'UTC+06:00', 'UTC+07:00',
    'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'
  ];

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          await loadServiceData();
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Please sign in to access this page'
          }));
          router.push('/Login');
        }
      });

      return () => unsubscribe();
    };

    checkAuthAndLoadData();
  }, []);

  // Fix: Compare only relevant data for changes
  useEffect(() => {
    if (state.originalData) {
      const currentData = {
        ...state.formData,
        skills: state.selectedSkills,
        availability: state.availability,
      };
      const hasDataChanged = JSON.stringify(currentData) !== JSON.stringify({
        ...state.originalData,
        imageUrl: undefined // Exclude imageUrl from comparison
      });
      setState(prev => ({ ...prev, hasChanges: hasDataChanged }));
    }
  }, [state.formData, state.selectedSkills, state.availability, state.originalData]);

  const loadServiceData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setState(prev => ({
          ...prev,
          error: 'Please sign in to access this page',
          isLoading: false
        }));
        router.push('/Login');
        return;
      }

      const serviceDoc = await getDoc(doc(db, 'services', user.uid));
      
      if (!serviceDoc.exists()) {
        setState(prev => ({
          ...prev,
          error: 'Service not found. Please create a new service.',
          isLoading: false
        }));
        return;
      }

      const data = serviceDoc.data();
      setState(prev => ({
        ...prev,
        formData: {
          title: data.title || '',
          rate: data.rate || '',
          description: data.description || '',
          portfolioLink: data.portfolioLink || '',
          linkedinLink: data.linkedinLink || '',
          timezone: data.timezone || '',
          availabilityPattern: data.availabilityPattern || 'weekly',
        },
        selectedSkills: data.skills || [],
        availability: data.availability || prev.availability,
        imagePreview: data.imageUrl || null,
        originalData: data,
        isLoading: false,
        error: ''
      }));
    } catch (err) {
      console.error('Error loading service:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: `Failed to load service data: ${err.message || 'Unknown error occurred'}`
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [name]: value }
    }));
  };

  const handleSkillInputKeyDown = (e) => {
    if (e.key === 'Enter' && state.skillInput.trim()) {
      e.preventDefault();
      const newSkill = state.skillInput.trim();
      if (!state.selectedSkills.includes(newSkill)) {
        setState(prev => ({
          ...prev,
          selectedSkills: [...prev.selectedSkills, newSkill],
          skillInput: ''
        }));
      }
    }
  };

  const handleSave = async () => {
    try {
      setState(prev => ({ ...prev, saving: true, error: '' }));
      
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const serviceData = {
        ...state.formData,
        skills: state.selectedSkills,
        availability: state.availability,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'services', user.uid), serviceData);
      
      setState(prev => ({
        ...prev,
        saving: false,
        success: true,
        hasChanges: false,
        originalData: serviceData
      }));
    } catch (err) {
      console.error('Error saving service:', err);
      setState(prev => ({
        ...prev,
        saving: false,
        error: `Failed to save changes: ${err.message || 'Unknown error occurred'}`
      }));
    }
  };

  const handleDiscard = () => {
    if (state.originalData) {
      setState(prev => ({
        ...prev,
        formData: {
          title: state.originalData.title || '',
          rate: state.originalData.rate || '',
          description: state.originalData.description || '',
          portfolioLink: state.originalData.portfolioLink || '',
          linkedinLink: state.originalData.linkedinLink || '',
          timezone: state.originalData.timezone || '',
          availabilityPattern: state.originalData.availabilityPattern || 'weekly',
        },
        selectedSkills: state.originalData.skills || [],
        availability: state.originalData.availability || prev.availability,
        hasChanges: false
      }));
    }
  };

  // Fix: Add missing functions
  const removeSkill = (skillToRemove) => {
    setState(prev => ({
      ...prev,
      selectedSkills: prev.selectedSkills.filter(skill => skill !== skillToRemove)
    }));
  };

  const toggleDayAvailability = (day) => {
    setState(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          isAvailable: !prev.availability[day].isAvailable
        }
      }
    }));
  };

  const addTimeSlot = (day) => {
    setState(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          slots: [...prev.availability[day].slots, { start: '09:00', end: '17:00' }]
        }
      }
    }));
  };

  const removeTimeSlot = (day, index) => {
    setState(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          slots: prev.availability[day].slots.filter((_, i) => i !== index)
        }
      }
    }));
  };

  const updateTimeSlot = (day, index, field, value) => {
    setState(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          slots: prev.availability[day].slots.map((slot, i) => 
            i === index ? { ...slot, [field]: value } : slot
          )
        }
      }
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('image/')) {
      setState(prev => ({
        ...prev,
        error: 'Please select a valid image file'
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, uploadingImage: true, error: '' }));

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'Domnix-Blog');

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dwkxh75ux/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();

      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      await updateDoc(doc(db, 'services', user.uid), {
        imageUrl: data.secure_url
      });

      setState(prev => ({
        ...prev,
        imagePreview: data.secure_url,
        uploadingImage: false,
        error: '',
        hasChanges: true
      }));

    } catch (err) {
      console.error('Error uploading image:', err);
      setState(prev => ({
        ...prev,
        uploadingImage: false,
        error: `Failed to upload image: ${err.message || 'Unknown error occurred'}`
      }));
    }
  };

  const copyTimeSlots = (fromDay) => {
    setState(prev => {
      const fromSlots = prev.availability[fromDay].slots;
      const updatedAvailability = { ...prev.availability };
      
      Object.keys(updatedAvailability).forEach(day => {
        if (day !== fromDay && updatedAvailability[day].isAvailable) {
          updatedAvailability[day] = {
            ...updatedAvailability[day],
            slots: [...fromSlots]
          };
        }
      });
      
      return {
        ...prev,
        availability: updatedAvailability
      };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pt-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header with Back Button */}
        <div className="flex items-center mb-8">
          <Link 
            href="/WorkDashboard"
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Services
          </Link>
        </div>

        {/* Title Section */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Edit Your Service
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Update your service details and availability
          </p>
        </div>

        {/* Changes Banner */}
        {state.hasChanges && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-center justify-between">
            <span className="text-yellow-800 dark:text-yellow-200">
              You have unsaved changes
            </span>
            <div className="flex gap-3">
              <button
                onClick={handleDiscard}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Discard Changes
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {state.error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 shadow-xl border-0">
          <CardContent className="p-8">
            <form className="space-y-8">
              {/* Profile Image */}
              <div className="flex justify-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-lg transition-transform transform group-hover:scale-105">
                    {state.uploadingImage ? (
                      <div className="flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : state.imagePreview ? (
                      <img 
                        src={state.imagePreview} 
                        alt="Profile preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-all">
                    <Upload className="w-6 h-6 text-white" />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={state.uploadingImage}
                    />
                  </label>
                </div>
              </div>

              {/* Main Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Service Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Service Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={state.formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Senior React Developer"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Hourly Rate */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Hourly Rate (USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-500">$</span>
                      <input
                        type="number"
                        name="rate"
                        value={state.formData.rate}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Skills
                    </label>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={state.skillInput}
                        onChange={(e) => setState(prev => ({ ...prev, skillInput: e.target.value }))}
                        onKeyDown={handleSkillInputKeyDown}
                        placeholder="Type a skill and press Enter..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <div className="flex flex-wrap gap-2">
                        {state.selectedSkills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="hover:text-blue-800 dark:hover:text-blue-200"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={state.formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your expertise and experience..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Timezone */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Your Timezone
                    </label>
                    <Select 
                      value={state.formData.timezone} 
                      onValueChange={(value) => setState(prev => ({
                        ...prev,
                        formData: { ...prev.formData, timezone: value }
                      }))}
                    >
                      <SelectTrigger className="w-full rounded-xl">
                        <SelectValue placeholder="Select your timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((zone) => (
                          <SelectItem key={zone} value={zone}>
                            {zone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Professional Links */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Portfolio Website
                      </label>
                      <input
                        type="url"
                        name="portfolioLink"
                        value={state.formData.portfolioLink}
                        onChange={handleInputChange}
                        placeholder="https://yourportfolio.com"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        LinkedIn Profile
                      </label>
                      <input
                        type="url"
                        name="linkedinLink"
                        value={state.formData.linkedinLink}
                        onChange={handleInputChange}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Availability Schedule */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Availability Schedule
                  </h3>
                  <Select 
                    value={state.formData.availabilityPattern} 
                    onValueChange={(value) => setState(prev => ({
                      ...prev,
                      formData: { ...prev.formData, availabilityPattern: value }
                    }))}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {Object.entries(state.availability).map(([day, { isAvailable, slots }]) => (
                    <div key={day} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isAvailable}
                            onChange={() => toggleDayAvailability(day)}
                            className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-base font-medium capitalize">
                            {day}
                          </span>
                        </div>
                        {isAvailable && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => addTimeSlot(day)}
                              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            >
                              Add Time Slot
                            </button>
                            {slots.length > 0 && (
                              <button
                                type="button"
                                onClick={() => copyTimeSlots(day)}
                                className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                              >
                                <Copy className="w-4 h-4" />
                                Copy to Other Days
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {isAvailable && (
                        <div className="space-y-3 pl-8">
                          {slots.map((slot, index) => (
                            <div key={index} className="flex items-center gap-4 animate-fadeIn">
                              <Select
                                value={slot.start}
                                onValueChange={(value) => updateTimeSlot(day, index, 'start', value)}
                              >
                                <SelectTrigger className="w-36">
                                  <SelectValue placeholder="Start Time" />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeSlots.map((time) => (
                                    <SelectItem key={time} value={time}>
                                      {time}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <span className="text-gray-500">to</span>
                              <Select
                                value={slot.end}
                                onValueChange={(value) => updateTimeSlot(day, index, 'end', value)}
                              >
                                <SelectTrigger className="w-36">
                                  <SelectValue placeholder="End Time" />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeSlots.map((time) => (
                                    <SelectItem key={time} value={time}>
                                      {time}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <button
                                type="button"
                                onClick={() => removeTimeSlot(day, index)}
                                className="text-red-500 hover:text-red-600 transition-colors"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                          {slots.length === 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No time slots added. Click "Add Time Slot" to set your availability.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                  <Link href="/services">
                    <button
                      type="button"
                      className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </Link>
                  <button
                    type="button"
                    onClick={handleDiscard}
                    className="px-6 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    disabled={!state.hasChanges}
                  >
                    Discard Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!state.hasChanges || state.saving}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {state.saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Success Modal */}
        {state.success && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-4 animate-scaleIn">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Changes Saved Successfully!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your service has been updated and changes are now live.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setState(prev => ({ ...prev, success: false }));
                      router.push('/services');
                    }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all transform hover:scale-105"
                  >
                    View My Services
                  </button>
                  <button
                    onClick={() => setState(prev => ({ ...prev, success: false }))}
                    className="w-full px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Continue Editing
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditService;