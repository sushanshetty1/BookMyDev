"use client"
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
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
} from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Wallet, Calendar as CalendarIcon, Clock, DollarSign, CheckCircle, XCircle, Star, Globe, Code } from 'lucide-react';

const BookingPage = () => {
  const params = useParams();
  const router = useRouter();
  const [developer, setDeveloper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [duration, setDuration] = useState(1);
  const [totalCost, setTotalCost] = useState(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState(null);

  // Fetch developer details
  useEffect(() => {
    const fetchDeveloper = async () => {
      try {
        const docRef = doc(db, 'services', params.booking);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setDeveloper({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Developer not found');
        }
      } catch (err) {
        setError('Failed to load developer details');
      } finally {
        setLoading(false);
      }
    };

    if (params.booking) {
      fetchDeveloper();
    }
  }, [params.booking]);

  // Generate available time slots based on developer's availability
  useEffect(() => {
    if (selectedDate && developer?.availability) {
      const day = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dayAvailability = developer.availability[day];
      
      if (dayAvailability?.isAvailable) {
        const slots = dayAvailability.slots.filter(slot => {
          const [startHour] = slot.start.split(':').map(Number);
          const [endHour] = slot.end.split(':').map(Number);
          return endHour - startHour >= duration;
        });
        
        setAvailableSlots(slots);
      } else {
        setAvailableSlots([]);
      }
    }
  }, [selectedDate, developer, duration]);

  // Calculate total cost
  useEffect(() => {
    if (developer?.rate && duration) {
      setTotalCost(developer.rate * duration);
    }
  }, [developer?.rate, duration]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];
        
        setConnectedWallet({
          address: userAddress,
          type: 'MetaMask',
          label: 'MetaMask Wallet'
        });
        setWalletConnected(true);
      } catch (err) {
        setError('Failed to connect wallet');
      }
    } else {
      setError('Please install MetaMask to continue');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedSlot || !walletConnected || !termsAccepted) {
      return;
    }

    setSubmitting(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Please sign in to book a session');
      }

      const bookingData = {
        userId: user.uid,
        developerId: developer.id,
        date: selectedDate.toISOString(),
        timeSlot: selectedSlot,
        duration,
        totalCost,
        status: 'pending',
        walletInfo: connectedWallet,
        createdAt: new Date().toISOString(),
      };

      // Create booking in Firestore
      const bookingsRef = collection(db, 'bookings');
      await setDoc(doc(bookingsRef), bookingData);
      
      setShowSuccessDialog(true);
    } catch (err) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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
                  <CardTitle className="text-2xl">{developer?.title}</CardTitle>
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
                      <h4 className="font-medium mb-3 flex items-center gap-2">
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

            {/* Booking Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2"
            >
              <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Book Your Session</CardTitle>
                  <CardDescription>
                    Choose your preferred time and duration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Calendar */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          Select Date
                        </label>
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDateSelect}
                          disabled={(date) => {
                            const day = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                            return date < new Date() || !developer?.availability?.[day]?.isAvailable;
                          }}
                          className="rounded-xl border-2 border-gray-200 dark:border-gray-700 p-3"
                        />
                      </div>

                      <div className="space-y-6">
                        {/* Duration Selection */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Duration</label>
                          <Select 
                            value={duration.toString()} 
                            onValueChange={(value) => setDuration(Number(value))}
                          >
                            <SelectTrigger className="w-full">
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
                          <label className="text-sm font-medium flex items-center gap-2">
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
                                  selectedSlot === slot ? 'bg-blue-500 text-white' : ''
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
                        <span className="text-3xl font-bold">${totalCost}</span>
                      </div>
                    </div>

                    {/* Wallet & Terms */}
                    <div className="space-y-4">
                      {walletConnected ? (
                        <div className="flex items-center gap-2 text-green-500">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Wallet Connected</span>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={connectWallet}
                          className="w-full"
                        >
                          <Wallet className="w-4 h-4 mr-2" />
                          Connect Wallet
                        </Button>
                      )}

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="terms"
                          checked={termsAccepted}
                          onCheckedChange={setTermsAccepted}
                        />
                        <label htmlFor="terms" className="text-sm">
                          I agree to the terms and conditions
                        </label>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-lg"
                      disabled={!selectedDate || !selectedSlot || !walletConnected || !termsAccepted || submitting}
                    >
                      {submitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Confirming...
                        </div>
                      ) : (
                        'Confirm Booking'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Booking Confirmed!
            </DialogTitle>
            <DialogDescription className="text-lg">
              Your session has been successfully booked. Check your email for confirmation details.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6">
            <Button
              onClick={() => router.push('/developers')}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all"
            >
              Back to Developers
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingPage;