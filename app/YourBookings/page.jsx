"use client"
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useRouter } from 'next/navigation';
import { BrowserProvider, ethers } from 'ethers';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
const VideoConference = dynamic(() => import('@/components/VideoConference'), { ssr: false });

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Video, 
  CheckCircle, 
  AlertCircle, 
  History,
  Wallet,
  ArrowRight,
  Calendar as CalendarIcon,
  Timer,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import Image from 'next/image';

const MATIC_TO_USD = 0.8;

const YourBookings = () => {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVideoConference, setShowVideoConference] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [maticBalance, setMaticBalance] = useState(null);
  const upcomingBookings = bookings.filter(booking => new Date(booking.date) >= new Date());
  const pastBookings = bookings.filter(booking => new Date(booking.date) < new Date());
  const [developerServices, setDeveloperServices] = useState({});

  useEffect(() => {
    fetchBookings();
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        setWalletConnected(accounts.length > 0);
        if (accounts.length > 0) {
          const provider = new BrowserProvider(window.ethereum);
          const balance = await provider.getBalance(accounts[0]);
          setMaticBalance(ethers.formatEther(balance));
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err);
      }
    }
  };

  const fetchDeveloperServices = async (developerIds) => {
    try {
      const servicesRef = collection(db, 'services');
      const q = query(servicesRef, where('userId', 'in', developerIds));
      const querySnapshot = await getDocs(q);
      
      const services = {};
      querySnapshot.forEach((doc) => {
        services[doc.data().userId] = doc.data();
      });
      
      setDeveloperServices(services);
    } catch (err) {
      console.error('Error fetching developer services:', err);
    }
  };

const fetchBookings = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      router.push('/SignIn');
      return;
    }

    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);

    const bookingsData = [];
    const developerIds = new Set();

    querySnapshot.forEach((doc) => {
      bookingsData.push({ id: doc.id, ...doc.data() });
      developerIds.add(doc.data().developerId);
    });

    bookingsData.sort((a, b) => new Date(b.date) - new Date(a.date));
    setBookings(bookingsData);

    if (developerIds.size > 0) {
      await fetchDeveloperServices(Array.from(developerIds));
    }
  } catch (err) {
    setError('Failed to fetch bookings');
    console.error('Error fetching bookings:', err);
  } finally {
    setLoading(false);
  }
};

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletConnected(true);
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        const balance = await provider.getBalance(accounts[0]);
        setMaticBalance(ethers.formatEther(balance));
      } catch (err) {
        console.error('Error connecting wallet:', err);
      }
    }
  };

  const isSessionActive = (booking) => {
    const now = new Date();
    const sessionDate = new Date(booking.date);
    const [bookingHour] = booking.timeSlot.start.split(':').map(Number);
    sessionDate.setHours(bookingHour, 0, 0, 0);

    const sessionEndDate = new Date(sessionDate);
    sessionEndDate.setHours(bookingHour + booking.duration);

    // Allow joining 10 minutes before and staying 10 minutes after
    const joinWindowStart = new Date(sessionDate);
    joinWindowStart.setMinutes(joinWindowStart.getMinutes() - 10);
    
    const joinWindowEnd = new Date(sessionEndDate);
    joinWindowEnd.setMinutes(joinWindowEnd.getMinutes() + 10);

    return now >= joinWindowStart && now <= joinWindowEnd;
  };

  const processPayment = async (booking) => {
    try {
      setProcessingPayment(true);

      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const maticAmount = (booking.totalCost / MATIC_TO_USD).toFixed(6);
      
      const tx = await signer.sendTransaction({
        to: booking.developerWallet,
        value: ethers.parseEther(maticAmount),
      });

      await tx.wait();

      // Update booking status in Firestore
      await updateDoc(doc(db, 'bookings', booking.id), {
        paymentStatus: 'completed',
        transactionHash: tx.hash
      });

      // Refresh bookings
      await fetchBookings();

    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Payment failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (booking) => {
    const isActive = isSessionActive(booking);
    
    if (booking.paymentStatus === 'completed') {
      if (isActive) {
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            Active Now
          </Badge>
        );
      }
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600">
          Confirmed
        </Badge>
      );
    }
    
    return (
      <Badge variant="destructive">
        Payment Pending
      </Badge>
    );
  };

  const getTimeLeft = (booking) => {
    const now = new Date();
    const sessionDate = new Date(booking.date);
    const [bookingHour] = booking.timeSlot.start.split(':').map(Number);
    sessionDate.setHours(bookingHour, 0, 0, 0);

    const diff = sessionDate - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} days`;
    if (hours > 0) return `${hours} hours`;
    return `${minutes} minutes`;
  };

  const renderBookingCard = (booking) => {
    const isActive = isSessionActive(booking);
    const isPending = booking.paymentStatus === 'pending';
    const showPaymentButton = isPending && isActive;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="mb-6 overflow-hidden border-2 hover:border-blue-500/20 transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl mb-2 flex items-center gap-2">
                <img
                src={developerServices[booking.developerId]?.imageUrl || '/placeholder.jpg'}
                alt={booking.developerName}
                className="rounded-full object-cover"
                style={{ width: '100px', height: '100px' }}
                />

                  <div>
                    <span className="text-gray-900 dark:text-white">
                      {developerServices[booking.developerId]?.title}
                    </span>
                    <div className="text-sm font-normal text-gray-500 dark:text-gray-400">
                      {developerServices[booking.developerId]?.description}
                    </div>
                  </div>
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(booking)}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Date</div>
                    <div className="font-medium">{formatDate(booking.date)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Time</div>
                    <div className="font-medium">
                      {booking.timeSlot.start} - {booking.timeSlot.end}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Timer className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Duration</div>
                    <div className="font-medium">{booking.duration} hour(s)</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Cost</div>
                    <div className="font-medium">${booking.totalCost}</div>
                  </div>
                </div>

                {booking.paymentStatus === 'completed' && booking.transactionHash && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Transaction</div>
                      <a
                        href={`https://polygonscan.com/tx/${booking.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-500 hover:text-blue-600 flex items-center gap-1"
                      >
                        View on Explorer
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}

                {new Date(booking.date) > new Date() && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Timer className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Starting in</div>
                      <div className="font-medium">{getTimeLeft(booking)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {showPaymentButton && (
              <div className="mt-6 space-y-4">
                <Alert variant="warning" className="bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertTitle className="text-amber-800 dark:text-amber-300">Payment Required</AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-400">
                    Your session is about to start. Please complete the payment to join.
                  </AlertDescription>
                </Alert>
                
                {!walletConnected ? (
                  <Button 
                    onClick={connectWallet} 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    <Wallet className="w-5 h-5 mr-2" />
                    Connect Wallet to Pay
                  </Button>
                ) : (
                  <Button
                    onClick={() => processPayment(booking)}
                    disabled={processingPayment}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    {processingPayment ? (
                      <>
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-5 h-5 mr-2" />
                        Pay Now (${booking.totalCost})
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardContent>

          {isActive && booking.paymentStatus === 'completed' && (
            <CardFooter className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 p-6">
              <Button 
                onClick={() => {
                  setActiveSession(booking);
                  setShowVideoConference(true);
                }}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 h-12"
              >
                <Video className="w-5 h-5 mr-2" />
                Join Video Session Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-gray-500 dark:text-gray-400">Loading your bookings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black py-12">
      <div className="container mx-auto px-4 mt-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Your Bookings
            </h1>
            
            {walletConnected && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow">
                      <Wallet className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">{Number(maticBalance).toFixed(4)} MATIC</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Your wallet balance</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList className="bg-white dark:bg-gray-800 p-1 rounded-lg">
              <TabsTrigger 
                value="upcoming" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
              >
                <Calendar className="w-4 h-4" />
                Upcoming Sessions
              </TabsTrigger>
              <TabsTrigger 
                value="past"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
              >
                <History className="w-4 h-4" />
                Past Sessions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              <AnimatePresence>
                {upcomingBookings.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="text-center p-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
                  >
                    <div className="max-w-md mx-auto space-y-6">
                      <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
                        <Calendar className="w-12 h-12 text-blue-500" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        No Upcoming Sessions
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        You don't have any upcoming mentoring sessions scheduled. Book a session with a developer to get started!
                      </p>
                      <Button 
                        onClick={() => router.push('/developers')}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                      >
                        Find a Developer
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-6">
                    {upcomingBookings.map(booking => renderBookingCard(booking))}
                  </div>
                )}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="past">
              <AnimatePresence>
                {pastBookings.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="text-center p-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
                  >
                    <div className="max-w-md mx-auto space-y-6">
                      <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto">
                        <History className="w-12 h-12 text-purple-500" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        No Past Sessions
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        You haven't completed any mentoring sessions yet. Book your first session to start learning!
                      </p>
                      <Button 
                        onClick={() => router.push('/developers')}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        Explore Developers
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-6">
                    {pastBookings.map(booking => renderBookingCard(booking))}
                  </div>
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>

          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <Dialog open={showVideoConference} onOpenChange={setShowVideoConference}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Video Session with {activeSession?.developerName}</DialogTitle>
            <DialogDescription>
              Your session will end automatically after {activeSession?.duration} hour(s)
            </DialogDescription>
          </DialogHeader>
          
          {activeSession && (
            <div className="flex-1 min-h-0">
              <VideoConference
                sessionId={activeSession.id}
                participantName={auth.currentUser?.displayName || 'User'}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default YourBookings;