//ListService.jsx

"use client"

import React, { useState, useEffect } from 'react';
import { setDoc, collection, doc, getDoc, query, where, onSnapshot } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Wallet, Upload, Image as ImageIcon, AlertCircle, Clock, Copy } from 'lucide-react';
import { auth, db } from '../../firebase';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';

const ListService = () => {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [connectedWallets, setConnectedWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [skillInput, setSkillInput] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [walletStatus, setWalletStatus] = useState({
    loading: true,
    error: null,
    connected: false
  });
  
  const [formData, setFormData] = useState({
    title: '',
    rate: '',
    description: '',
    portfolioLink: '',
    linkedinLink: '',
    timezone: '',
    availabilityPattern: 'weekly',
  });
  
  const [availability, setAvailability] = useState({
    monday: { isAvailable: false, slots: [] },
    tuesday: { isAvailable: false, slots: [] },
    wednesday: { isAvailable: false, slots: [] },
    thursday: { isAvailable: false, slots: [] },
    friday: { isAvailable: false, slots: [] },
    saturday: { isAvailable: false, slots: [] },
    sunday: { isAvailable: false, slots: [] },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
      if (currentUser) {
        setupWalletListeners(currentUser.uid);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);
  const setupWalletListeners = (userId) => {
    try {
      setWalletStatus(prev => ({ ...prev, loading: true }));
      
      const walletsRef = collection(db, 'users', userId, 'wallets');
      const walletsQuery = query(walletsRef, where('userId', '==', userId));
      const unsubscribe = onSnapshot(walletsQuery, (snapshot) => {
        const walletsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setConnectedWallets(walletsData);
        
        if (walletsData.length > 0) {
          setSelectedWallet(walletsData[0].id);
          setIsWalletConnected(true);
          setWalletStatus({
            loading: false,
            error: null,
            connected: true
          });
        } else {
          setIsWalletConnected(false);
          setWalletStatus({
            loading: false,
            error: null,
            connected: false
          });
        }
      }, (error) => {
        console.error('Error fetching wallets:', error);
        setWalletStatus({
          loading: false,
          error: 'Failed to load wallet information',
          connected: false
        });
      });

      return unsubscribe;
    } catch (err) {
      console.error('Error setting up wallet listeners:', err);
      setWalletStatus({
        loading: false,
        error: 'Failed to initialize wallet connection',
        connected: false
      });
    }
  };
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
      if (currentUser) {
        setupWalletListeners(currentUser.uid);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const uploadImageToCloudinary = async (file) => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'Domnix-Blog');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dwkxh75ux/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Image upload failed');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (err) {
      console.error('Error uploading image:', err);
      throw new Error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  const handleSkillInputKeyDown = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      const newSkill = skillInput.trim();
      if (!selectedSkills.includes(newSkill)) {
        setSelectedSkills([...selectedSkills, newSkill]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setSelectedSkills(selectedSkills.filter(skill => skill !== skillToRemove));
  };

  const copyTimeSlots = (fromDay) => {
    const fromSlots = availability[fromDay].slots;
    const updatedAvailability = { ...availability };
    
    Object.keys(availability).forEach(day => {
      if (day !== fromDay && availability[day].isAvailable) {
        updatedAvailability[day] = {
          ...updatedAvailability[day],
          slots: [...fromSlots]
        };
      }
    });
    
    setAvailability(updatedAvailability);
  };

  const timezones = [
    'UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00',
    'UTC-07:00', 'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00',
    'UTC-02:00', 'UTC-01:00', 'UTC+00:00', 'UTC+01:00', 'UTC+02:00',
    'UTC+03:00', 'UTC+04:00', 'UTC+05:00', 'UTC+06:00', 'UTC+07:00',
    'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

 const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Please upload a valid image file (JPEG, PNG, or WebP)');
        return;
      }

      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleDayAvailability = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isAvailable: !prev[day].isAvailable
      }
    }));
  };

  const addTimeSlot = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, { start: '', end: '' }]
      }
    }));
  };

  const updateTimeSlot = (day, index, field, value) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, i) => 
          i === index ? { ...slot, [field]: value } : slot
        )
      }
    }));
  };

  const removeTimeSlot = (day, index) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, i) => i !== index)
      }
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Please sign in to publish your service');
        return;
      }
  
      let imageUrl = '';
      if (profileImage) {
        try {
          imageUrl = await uploadImageToCloudinary(profileImage);
        } catch (err) {
          setError('Failed to upload image. Please try again.');
          return;
        }
      }
  
      const selectedWalletData = connectedWallets.find(w => w.id === selectedWallet);
      
      const serviceData = {
        userId: user.uid,
        ...formData,
        skills: selectedSkills,
        imageUrl,
        walletConnected: isWalletConnected,
        walletInfo: selectedWalletData ? {
          id: selectedWalletData.id,
          type: selectedWalletData.type,
          address: selectedWalletData.address,
          label: selectedWalletData.label
        } : null,
        availability,
        createdAt: new Date().toISOString(),
      };
  
      // Create a reference to the specific user's service document
      const userServiceRef = doc(db, 'services', user.uid);
      
      // Check if document exists first
      const docSnap = await getDoc(userServiceRef);
      
      if (docSnap.exists()) {
        // Update existing service
        await updateDoc(userServiceRef, serviceData);
      } else {
        // Create new service
        await setDoc(userServiceRef, serviceData);
      }
  
      setSuccess(true);
      setFormData({
        title: '',
        rate: '',
        description: '',
        portfolioLink: '',
        linkedinLink: '',
        timezone: '',
      });
      setSelectedSkills([]);
      setProfileImage(null);
      setImagePreview(null);
    } catch (err) {
      console.error('Error saving service:', err);
      if (err.code === 'permission-denied') {
        setError('You do not have permission to publish this service. Please check your authentication status.');
      } else {
        setError('Failed to save service. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderWalletSection = () => (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
      <div className="max-w-md mx-auto space-y-4">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 block">
          Connect Wallet for Payments
        </label>
        
        {walletStatus.loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : walletStatus.error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{walletStatus.error}</AlertDescription>
          </Alert>
        ) : connectedWallets.length > 0 ? (
          <div className="space-y-4">
            <Select 
              value={selectedWallet} 
              onValueChange={setSelectedWallet}
            >
              <SelectTrigger className="w-full rounded-xl">
                <SelectValue placeholder="Select a wallet for payments" />
              </SelectTrigger>
              <SelectContent>
                {connectedWallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    <div className="flex items-center gap-2">
                      <span>{
                        wallet.type === 'MetaMask' ? '🦊' :
                        wallet.type === 'Trust Wallet' ? '💎' :
                        wallet.type === 'Phantom' ? '👻' : '💳'
                      }</span>
                      <span>{wallet.label}</span>
                      <span className="text-sm text-gray-500">
                        ({wallet.address.slice(0, 6)}...{wallet.address.slice(-4)})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Link
              href="/ManageWallet"
              className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Manage Wallets
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleWalletConnect}
              disabled={walletStatus.loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Wallet className="w-5 h-5" />
              Connect Wallet
            </button>
            
            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
              No wallets connected. Please connect a wallet to receive payments.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderImageUpload = () => (
    <div className="flex justify-center">
      <div className="relative group">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-lg transition-transform transform group-hover:scale-105">
          {uploadingImage ? (
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : imagePreview ? (
            <img 
              src={imagePreview} 
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
            disabled={uploadingImage}
          />
        </label>
      </div>
    </div>
  );

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-black dark:via-gray-950 dark:to-gray-900 pt-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            List Your Service
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Showcase your expertise and connect with clients worldwide
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 animate-shake">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 shadow-xl border-0">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Profile Image Upload */}
              <div className="flex justify-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-lg transition-transform transform group-hover:scale-105">
                  {renderImageUpload()}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-all">
                    <Upload className="w-6 h-6 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
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
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Senior React Developer"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
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
                        value={formData.rate}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Skills Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Skills
                  </label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleSkillInputKeyDown}
                      placeholder="Type a skill and press Enter..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <div className="flex flex-wrap gap-2">
                      {selectedSkills.map((skill, index) => (
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
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your expertise and experience..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  {/* Timezone */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Your Timezone
                    </label>
                    <Select 
                      value={formData.timezone} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
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
                </div>
              </div>

              {/* Availability Schedule */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Service Availability
                </h3>
                
                {Object.entries(availability).map(([day, { isAvailable, slots }]) => (
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

                    {isAvailable && slots.map((slot, index) => (
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
                  </div>
                ))}
              </div>

              {/* Professional Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Professional Links (Optional)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Portfolio Website
                    </label>
                    <input
                      type="url"
                      name="portfolioLink"
                      value={formData.portfolioLink}
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
                      value={formData.linkedinLink}
                      onChange={handleInputChange}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Wallet Connection */}
              {renderWalletSection()}

              {/* Submit Button */}
              <div className="pt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium text-lg transition-all transform hover:scale-105 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Save & Publish Service
                    </>
                  )}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Success Modal */}
        {success && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-4 animate-scaleIn">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Service Published!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your service has been successfully listed. Clients can now find and book your services.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all transform hover:scale-105"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListService;