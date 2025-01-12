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
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [duration, setDuration] = useState(1);
  const [totalCost, setTotalCost] = useState(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [maticBalance, setMaticBalance] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentScheduled, setPaymentScheduled] = useState(false);
  const [transactionHash, setTransactionHash] = useState(null);

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

  useEffect(() => {
    if (developer?.rate && duration) {
      setTotalCost(developer.rate * duration);
    }
  }, [developer?.rate, duration]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
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

  const schedulePayment = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }
      
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const maticAmount = usdToMatic(totalCost);
      
      const tx = await signer.sendTransaction({
        to: developer.walletAddress,
        value: ethers.parseEther(maticAmount),
      });

      setTransactionHash(tx.hash);
      setPaymentStatus('scheduled');
      setPaymentScheduled(true);
      
      setTimeout(() => {
        setPaymentStatus('completed');
      }, 24 * 60 * 60 * 1000);
      
    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment scheduling failed');
      setPaymentStatus('failed');
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          // User disconnected wallet
          setWalletConnected(false);
          setMaticBalance(null);
          setConnectedWallet(null);
        } else {
          // Update with new account
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

      // Cleanup listener on component unmount
      return () => {
        window.ethereum.removeListener('accountsChanged', () => {});
      };
    }
  }, []);

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

      await schedulePayment();

      const bookingData = {
        userId: user.uid,
        developerId: developer.id,
        date: selectedDate.toISOString(),
        timeSlot: selectedSlot,
        duration,
        totalCost,
        status: 'pending',
        walletInfo: connectedWallet,
        paymentStatus,
        transactionHash,
        createdAt: new Date().toISOString(),
      };

      const bookingsRef = collection(db, 'bookings');
      await setDoc(doc(bookingsRef), bookingData);
      
      setShowSuccessDialog(true);
    } catch (err) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  // Wallet Connection Card Component
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

  // Payment Dialog Component
  const PaymentDialog = () => (
    <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
      <DialogContent className="sm:max-w-md dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle>Schedule Payment</DialogTitle>
          <DialogDescription>
            Your payment will be held for 24 hours before being transferred to the developer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <span>Amount (MATIC):</span>
            <span className="font-bold">{usdToMatic(totalCost)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Amount (USD):</span>
            <span className="font-bold">${totalCost}</span>
          </div>
          <Alert className="dark:bg-gray-800">
            <AlertTitle>Payment Schedule</AlertTitle>
            <AlertDescription>
              Payment will be processed after 24 hours from confirmation.
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter>
          <Button
            onClick={schedulePayment}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            Schedule Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

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
                      <DollarSign className="w-5 h-5" />
                      Hourly Rate
                    </h4>
                    <p className="text-3xl font-bold">${developer?.rate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Wallet Card */}
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
                        disabled={(date) => {
                          const day = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                          return date < new Date() || !developer?.availability?.[day]?.isAvailable;
                        }}
                        className="rounded-xl border-2 border-gray-200 dark:border-gray-700 p-3 dark:bg-gray-800"
                      />
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

                    <Button
                      type="submit"
                      className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white transition-all duration-200 disabled:opacity-50"
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
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>

    {/* Payment Dialog */}
    <PaymentDialog />

    {/* Success Dialog */}
    <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
      <DialogContent className="sm:max-w-md dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2 text-gray-900 dark:text-white">
            <CheckCircle className="w-6 h-6 text-green-500" />
            Booking Confirmed!
          </DialogTitle>
          <DialogDescription className="text-lg dark:text-gray-400">
            Your session has been successfully booked. Check your email for confirmation details.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6">
          <Button
            onClick={() => router.push('/developers')}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all text-white"
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