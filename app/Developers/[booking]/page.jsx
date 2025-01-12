//Booking for Client
"use client"
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, getDocs, setDoc, collection, query, where } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import dynamic from 'next/dynamic';
const VideoConference = dynamic(() => import('@/components/VideoConference'), { ssr: false });
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { Wallet, Calendar as CalendarIcon, Clock, DollarSign, CheckCircle, XCircle, Star, Globe, Code, Info } from 'lucide-react';
import { ethers, BrowserProvider } from 'ethers';

const MATIC_TO_USD = 0.8;

const BookingPage = () => {
  const params = useParams();
  const router = useRouter();
  
  const [developer, setDeveloper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isTestMode, setIsTestMode] = useState(false);
const [bypassPayment, setBypassPayment] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [duration, setDuration] = useState(1);
  const [totalCost, setTotalCost] = useState(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showVideoConference, setShowVideoConference] = useState(false);
  const [conferenceRoomId, setConferenceRoomId] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [maticBalance, setMaticBalance] = useState(null);
  const [transactionHash, setTransactionHash] = useState(null);
  const [loadingError, setLoadingError] = useState(null);
  const [isToday, setIsToday] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);

  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (selectedDate && developer?.id) {
        const bookingsRef = collection(db, 'bookings');
        const dateString = selectedDate.toISOString().split('T')[0];
        
        const q = query(
          bookingsRef,
          where('developerId', '==', developer.id),
          where('date', '>=', dateString),
          where('date', '<', dateString + 'T23:59:59')
        );

        const querySnapshot = await getDocs(q);
        const booked = [];
        querySnapshot.forEach((doc) => {
          const booking = doc.data();
          booked.push({
            start: booking.timeSlot.start,
            end: booking.timeSlot.end,
            duration: booking.duration
          });
        });
        setBookedSlots(booked);
      }
    };

    fetchBookedSlots();
  }, [selectedDate, developer?.id]);

  useEffect(() => {
    const fetchDeveloper = async () => {
      setLoading(true);
      setLoadingError(null);
      try {
        const docRef = doc(db, 'services', params.booking);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const developerData = { id: docSnap.id, ...docSnap.data() };
          
          if (!developerData.walletInfo.address) {
            setLoadingError('Developer wallet address is missing');
            return;
          }

          if (!ethers.isAddress(developerData.walletInfo.address)) {
            setLoadingError('Developer has an invalid wallet address');
            return;
          }

          setDeveloper(developerData);
        } else {
          setLoadingError('Developer not found');
        }
      } catch (err) {
        console.error('Error fetching developer:', err);
        setLoadingError(err.message || 'Failed to load developer details');
      } finally {
        setLoading(false);
      }
    };

    if (params.booking) {
      fetchDeveloper();
    }
  }, [params.booking]);

  useEffect(() => {
    if (selectedDate && developer?.availability) {
      const day = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dayAvailability = developer.availability[day];
      
      if (dayAvailability?.isAvailable) {
        const slots = [];
        const [startHour] = dayAvailability.slots[0].start.split(':').map(Number);
        const [endHour] = dayAvailability.slots[0].end.split(':').map(Number);
        
        for (let hour = startHour; hour < endHour - (duration - 1); hour++) {
          const slot = {
            start: `${hour.toString().padStart(2, '0')}:00`,
            end: `${(hour + duration).toString().padStart(2, '0')}:00`
          };
          
          if (isSlotAvailable(slot, duration)) {
            slots.push(slot);
          }
        }
        
        setAvailableSlots(slots);
      } else {
        setAvailableSlots([]);
      }
    }
  }, [selectedDate, developer, duration, bookedSlots]);

  useEffect(() => {
    if (developer?.rate && duration) {
      setTotalCost(developer.rate * duration);
    }
  }, [developer?.rate, duration]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          setWalletConnected(false);
          setMaticBalance(null);
          setConnectedWallet(null);
        } else {
          getWalletBalance(accounts[0]).then(balance => {
            setMaticBalance(balance);
            setConnectedWallet(prev => ({
              ...prev,
              address: accounts[0],
              balance
            }));
          });
        }
      });

      return () => {
        window.ethereum.removeListener('accountsChanged', () => {});
      };
    }
  }, []);

  

  const isCurrentSession = (date, timeSlot) => {
    if (!date || !timeSlot) return false;

    const now = new Date();
    const bookingDate = new Date(date);
    
    const [bookingHour] = timeSlot.start.split(':').map(Number);
    bookingDate.setHours(bookingHour, 0, 0, 0);

    const sessionEndDate = new Date(bookingDate);
    sessionEndDate.setHours(bookingHour + duration);

    const joinWindowStart = new Date(bookingDate);
    joinWindowStart.setMinutes(joinWindowStart.getMinutes() - 5);

    return now >= joinWindowStart && now < sessionEndDate;
  };

  const handleTestTime = () => {
    const now = new Date();
    setSelectedDate(now);
    setIsTestMode(true);
    setSelectedSlot(null);
    
    // Get the current hour
    const currentHour = now.getHours();
    const nextHour = currentHour + 1;
    
    // Create a time slot for the next hour
    const testSlot = {
      start: `${currentHour.toString().padStart(2, '0')}:00`,
      end: `${nextHour.toString().padStart(2, '0')}:00`
    };
    
    setSelectedSlot(testSlot);
    setIsToday(true);
  };

  const handleDateSelect = (date) => {
    if (!date) {
      setSelectedDate(null);
      setSelectedSlot(null);
      setIsToday(false);
      setIsTestMode(false);
      return;
    }
    
    // Get today's date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isTestDate = date.toDateString() === today.toDateString();
    
    if (isTestDate) {
      // For test dates, use current time
      const now = new Date();
      date = now;
    }
    
    setSelectedDate(date);
    setSelectedSlot(null);
    setIsTestMode(isTestDate);
    
    if (selectedSlot) {
      setIsToday(isCurrentSession(date, selectedSlot));
    } else {
      setIsToday(false);
    }
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    
    const day = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (date < startOfDay) {
      return true;
    }
    
    if (date.toDateString() === now.toDateString()) {
      return false;
    }
    
    return !developer?.availability?.[day]?.isAvailable;
  };



 useEffect(() => {
    if (selectedDate && selectedSlot) {
      setIsToday(isCurrentSession(selectedDate, selectedSlot));
    } else {
      setIsToday(false);
    }
  }, [selectedDate, selectedSlot, duration]);

  useEffect(() => {
    if (!selectedDate || !developer?.availability) {
      setAvailableSlots([]);
      return;
    }

    const day = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayAvailability = developer.availability[day];
    
    if (dayAvailability?.isAvailable) {
      const slots = [];
      const [startHour] = dayAvailability.slots[0].start.split(':').map(Number);
      const [endHour] = dayAvailability.slots[0].end.split(':').map(Number);
      const now = new Date();
      
      let minimumHour = startHour;
      if (selectedDate.toDateString() === now.toDateString()) {
        minimumHour = now.getMinutes() >= 55 
          ? now.getHours() + 1 
          : now.getHours();
      }
      
      for (let hour = minimumHour; hour < endHour - (duration - 1); hour++) {
        const slot = {
          start: `${hour.toString().padStart(2, '0')}:00`,
          end: `${(hour + duration).toString().padStart(2, '0')}:00`
        };
        
        if (isSlotAvailable(slot, duration)) {
          slots.push(slot);
        }
      }
      
      setAvailableSlots(slots);
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDate, developer, duration, bookedSlots]);

  const isSlotAvailable = (slot, duration) => {
    if (!selectedDate) return false;
    
    const slotStart = new Date(`1970-01-01T${slot.start}`);
    const slotEnd = new Date(`1970-01-01T${slot.end}`);
    
    return !bookedSlots.some(bookedSlot => {
      const bookedStart = new Date(`1970-01-01T${bookedSlot.start}`);
      const bookedEnd = new Date(`1970-01-01T${bookedSlot.end}`);

      return (
        (slotStart < bookedEnd && slotStart >= bookedStart) ||
        (slotEnd > bookedStart && slotEnd <= bookedEnd) ||
        (slotStart <= bookedStart && slotEnd >= bookedEnd)
      );
    });
  };

  const usdToMatic = (usdAmount) => {
    return (usdAmount / MATIC_TO_USD).toFixed(6);
  };

  const getWalletBalance = async (address) => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      return null;
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];
        const balance = await getWalletBalance(userAddress);
        
        setConnectedWallet({
          address: userAddress,
          type: 'MetaMask',
          label: 'MetaMask Wallet',
          balance
        });
        setWalletConnected(true);
        setMaticBalance(balance);
      } catch (err) {
        setError('Failed to connect wallet');
      }
    } else {
      setError('Please install MetaMask to continue');
    }
  };

  const processPayment = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      if (!developer?.walletInfo?.address) {
        throw new Error('Developer wallet address not found');
      }

      const developerAddress = developer.walletInfo.address;
      if (!ethers.isAddress(developerAddress)) {
        throw new Error('Invalid developer wallet address');
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const maticAmount = usdToMatic(totalCost);
      
      const gasEstimate = await provider.estimateGas({
        to: developerAddress,
        value: ethers.parseEther(maticAmount),
      });

      const tx = await signer.sendTransaction({
        to: developerAddress,
        value: ethers.parseEther(maticAmount),
        gasLimit: gasEstimate,
      });

      await tx.wait();
      setTransactionHash(tx.hash);
      return tx.hash;
      
    } catch (error) {
      console.error('Payment error:', error);
      throw new Error(error.message || 'Payment failed');
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!selectedDate || !selectedSlot || !termsAccepted) {
    return;
  }

  setSubmitting(true);
  setError(null);

  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Please sign in to book a session');
    }

    let txHash = null;
    let paymentStatus = 'pending';

    // Handle payment based on test mode and bypass settings
    if (!isTestMode && !bypassPayment && walletConnected) {
      try {
        txHash = await processPayment();
        paymentStatus = 'completed';
      } catch (paymentError) {
        throw new Error(`Payment failed: ${paymentError.message}`);
      }
    } else if (isTestMode) {
      paymentStatus = 'completed';
    } else if (bypassPayment) {
      paymentStatus = 'completed';
    }

    const bookingId = `${Date.now()}-${user.uid}`;
    const roomId = `${bookingId}-${developer.id}`;

    // Use current date/time for test bookings
    const bookingDate = isTestMode ? new Date() : selectedDate;

    const bookingData = {
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName,
      roomId: roomId,
      developerId: developer.id,
      developerName: developer.title,
      date: bookingDate.toISOString(),
      timeSlot: selectedSlot,
      duration,
      totalCost,
      status: 'confirmed',
      paymentStatus,
      walletInfo: connectedWallet || null,
      transactionHash: txHash,
      createdAt: new Date().toISOString(),
      isTestBooking: isTestMode,
      paymentBypassed: bypassPayment,
      paymentDue: (!isCurrentSession(bookingDate, selectedSlot) && !isTestMode) 
        ? bookingDate.toISOString() 
        : null
    };

    // Save booking to database
    await setDoc(doc(db, 'bookings', bookingId), bookingData);

    // Handle immediate session start for test bookings
    if (isTestMode || isCurrentSession(bookingDate, selectedSlot)) {
      setConferenceRoomId(roomId);
      setShowVideoConference(true);

      // Notify developer
      await setDoc(doc(db, 'devMeet', developer.id), {
        type: 'session_start',
        bookingId: bookingId,
        roomId: roomId,
        timestamp: new Date().toISOString(),
        read: false,
        isTestSession: isTestMode
      });
    } else {
      setShowSuccessDialog(true);
    }

  } catch (err) {
    console.error('Booking error:', err);
    setError(err.message || 'Failed to create booking');
  } finally {
    setSubmitting(false);
  }
};

  useEffect(() => {
    if (selectedDate && developer?.availability) {
      const day = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dayAvailability = developer.availability[day];
      
      if (dayAvailability?.isAvailable) {
        const slots = [];
        const [startHour] = dayAvailability.slots[0].start.split(':').map(Number);
        const [endHour] = dayAvailability.slots[0].end.split(':').map(Number);
        const now = new Date();
        
        let minimumHour = startHour;
        if (selectedDate.toDateString() === now.toDateString()) {
          minimumHour = Math.max(startHour, now.getHours() + 1);
        }
        
        for (let hour = minimumHour; hour < endHour - (duration - 1); hour++) {
          const slot = {
            start: `${hour.toString().padStart(2, '0')}:00`,
            end: `${(hour + duration).toString().padStart(2, '0')}:00`
          };
          
          if (isSlotAvailable(slot, duration)) {
            if (selectedDate.toDateString() !== now.toDateString() || 
                hour > now.getHours()) {
              slots.push(slot);
            }
          }
        }
        
        setAvailableSlots(slots);
      } else {
        setAvailableSlots([]);
      }
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDate, developer, duration, bookedSlots]);

  const WalletCard = () => (
    <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 shadow-xl border-2 border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        <div className="space-y-4">
          {walletConnected ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-500 dark:text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Wallet Connected</span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Your wallet is connected and ready for payment</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Balance:</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    {maticBalance} MATIC
                  </span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  ≈ ${(maticBalance * MATIC_TO_USD).toFixed(2)} USD
                </div>
              </div>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={connectWallet}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="container mx-auto px-4 py-8 mt-10">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Error Loading Developer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{loadingError}</AlertDescription>
            </Alert>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black py-12 mt-10">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
            Schedule Your Session
          </h1>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Developer Info Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 shadow-xl">
                <CardHeader className="text-center">
                  <div className="relative mb-4">
                    <div className="w-32 h-32 mx-auto">
                      <img
                        src={developer?.imageUrl || '/api/placeholder/150/150'}
                        alt={developer?.title}
                        className="w-full h-full rounded-full object-cover ring-4 ring-blue-500/30"
                      />
                    </div>
                  </div>
                  <CardTitle className="text-2xl text-gray-900 dark:text-white">{developer?.title}</CardTitle>
                  <div className="flex items-center justify-center gap-2 text-yellow-500 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                      <Globe className="w-5 h-5" />
                      <span>{developer?.timezone}</span>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                        <Code className="w-5 h-5" />
                        Expertise
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {developer?.skills?.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-xl text-white">
                      <h4 className="font-medium mb-1 flex items-center gap-2">
                        Hourly Rate
                      </h4>
                      <p className="text-3xl font-bold">${developer?.rate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Wallet and Booking Form Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2"
            >
              <WalletCard />

              {/* Booking Form */}
              <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 shadow-xl mt-8">
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-900 dark:text-white">Book Your Session</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Choose your preferred time and duration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Calendar */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2 text-gray-900 dark:text-white">
                          <CalendarIcon className="w-4 h-4" />
                          Select Date
                        </label>

                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDateSelect}
                          disabled={isDateDisabled}
                          className="rounded-xl border-2 border-gray-200 dark:border-gray-700 p-3 dark:bg-gray-800"
                        />
                                                <Button
                            type="button"
                            onClick={handleTestTime}
                            variant="outline"
                            className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                          >
                            Test Time
                          </Button>
                      </div>

                      <div className="space-y-6">
                        {/* Duration Selection */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-900 dark:text-white">Duration</label>
                          <Select 
                            value={duration.toString()} 
                            onValueChange={(value) => setDuration(Number(value))}
                          >
                            <SelectTrigger className="w-full dark:bg-gray-800 dark:border-gray-700">
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4].map((hours) => (
                                <SelectItem key={hours} value={hours.toString()}>
                                  {hours} hour{hours > 1 ? 's' : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Time Slots */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium flex items-center gap-2 text-gray-900 dark:text-white">
                            <Clock className="w-4 h-4" />
                            Available Times
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {availableSlots.map((slot, index) => (
                              <Button
                                key={index}
                                type="button"
                                variant={selectedSlot === slot ? "default" : "outline"}
                                className={`w-full ${
                                  selectedSlot === slot 
                                    ? 'bg-blue-500 text-white dark:bg-blue-600' 
                                    : 'dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                                }`}
                                onClick={() => setSelectedSlot(slot)}
                              >
                                {slot.start}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Total Cost */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 rounded-xl text-white">
                      <div className="flex justify-between items-center">
                        <span className="text-lg">Total Cost</span>
                        <div className="text-right">
                          <div className="text-3xl font-bold">${totalCost}</div>
                          {walletConnected && (
                            <div className="text-sm opacity-90">
                              ≈ {usdToMatic(totalCost)} MATIC
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Terms & Submit */}
                    <div className="space-y-4">
                      {!isToday && (
                        <Alert className="bg-blue-50 dark:bg-blue-900/30">
                          <AlertTitle>Payment Notice</AlertTitle>
                          <AlertDescription>
                            Since you're booking for a future date, payment will be collected on the day of the session.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="terms"
                          checked={termsAccepted}
                          onCheckedChange={setTermsAccepted}
                          className="dark:border-gray-600"
                        />
                        <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-300">
                          I agree to the terms and conditions
                        </label>
                      </div>
                      {isTestMode && (
                        <div className="mb-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setBypassPayment(!bypassPayment)}
                            className={`w-full ${
                              bypassPayment 
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                                : ''
                            }`}
                          >
                            {bypassPayment ? 'Payment Bypass Enabled' : 'Bypass Payment (Test Only)'}
                          </Button>
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white transition-all duration-200 disabled:opacity-50"
                        disabled={
                          !selectedDate || 
                          !selectedSlot || 
                          (!walletConnected && isToday && !bypassPayment) || 
                          !termsAccepted || 
                          submitting
                        }
                      >
                        {submitting ? (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Processing...
                          </div>
                        ) : isTestMode ? 'Start Test Session' : isToday ? 'Book and Pay Now' : 'Book Session'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Success Dialog */}
      {showVideoConference ? (
        <Dialog open={showVideoConference} onOpenChange={setShowVideoConference}>
          <DialogContent className="sm:max-w-4xl dark:bg-gray-900">
            <DialogHeader>
              <DialogTitle className="text-2xl text-gray-900 dark:text-white">
                Video Conference Session
              </DialogTitle>
            </DialogHeader>
            <VideoConference
              roomId={conferenceRoomId}
              participantName={auth.currentUser?.displayName || 'Client'}
              onLeave={() => {
                setShowVideoConference(false);
                router.push('/Developers');
              }}
            />
          </DialogContent>
        </Dialog>
      ) : (
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
              <DialogContent className="sm:max-w-md dark:bg-gray-900">
                <DialogHeader>
                  <DialogTitle className="text-2xl flex items-center gap-2 text-gray-900 dark:text-white">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    Booking Confirmed!
                  </DialogTitle>
                  <DialogDescription className="text-lg dark:text-gray-400">
                    Your payment has been processed and your session is confirmed. Check your email for booking details.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-6">
                  <Button
                    onClick={() => router.push('/Developers')}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all text-white"
                  >
                    Back to Developers
                  </Button>
                </div>
              </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default BookingPage;