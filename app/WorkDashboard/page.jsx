"use client"
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import VideoConference from '@/components/VideoConference';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc, 
  addDoc,
  onSnapshot,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MessageCircle, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { onAuthStateChanged } from 'firebase/auth';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  DollarSign,
  MoreVertical,
  Plus,
  Trash2,
  Edit,
  BookOpen,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Video,
  MessageSquare
} from 'lucide-react';
import ChatComponent from '@/components/ChatComponent';
import Link from 'next/link';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30';
  const textColor = type === 'error' ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400';

  return (
    <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg ${bgColor} ${textColor} 
                    transform transition-all duration-300 ease-in-out 
                    translate-y-0 opacity-100 flex items-center justify-between
                    min-w-[300px] max-w-md`}>
      <span className="font-medium">{message}</span>
      <button 
        onClick={onClose}
        className="ml-4 hover:opacity-70 transition-opacity duration-200"
      >
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
};

const DeveloperDashboard = () => {
  const [activeChatBooking, setActiveChatBooking] = useState(null);
  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let unsubscribeBookings = null;

    const setupSubscriptions = async () => {
      setLoading(true);
      
      try {
        await new Promise((resolve) => {
          const unsubAuth = auth.onAuthStateChanged((user) => {
            if (user !== null) {
              unsubAuth();
              resolve();
            }
          });
        });

        const user = auth.currentUser;
        if (!user) {
          setError('Please sign in to view your dashboard');
          setLoading(false);
          return;
        }

        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('developerId', '==', user.uid),
          orderBy('date', 'desc')
        );

        unsubscribeBookings = onSnapshot(bookingsQuery,
          (snapshot) => {
            const bookingsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              date: convertTimestamp(doc.data().date)
            })).filter(Boolean);
            
            setBookings(bookingsData);
            calculateStats(bookingsData);
          },
          (error) => {
            console.error('Bookings listener error:', error);
            if (error.code === 'permission-denied') {
              setError('Access denied. Please check your permissions.');
            }
          }
        );

      } catch (error) {
        console.error('Setup error:', error);
        setError('Failed to initialize dashboard');
      } finally {
        setLoading(false);
      }
    };

    setupSubscriptions();

    return () => {
      if (unsubscribeBookings) unsubscribeBookings();
    };
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleChatOpen = (booking) => {
    setActiveChatBooking(booking);
    setIsChatDialogOpen(true);
  };

  const convertTimestamp = (timestamp) => {
    if (!timestamp) return null;
    
    try {
      if (timestamp instanceof Date) {
        return timestamp;
      }
      if (timestamp?.toDate) {
        return timestamp.toDate();
      }

      if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? null : date;
      }

      if (typeof timestamp === 'number') {
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? null : date;
      }
      
      return null;
    } catch (error) {
      console.error('Error converting timestamp:', error);
      return null;
    }
  };

  const shouldShowJoinMeeting = (booking) => {
    if (!booking?.date || !booking?.timeSlot?.start || !booking?.timeSlot?.end || 
        booking.paymentStatus !== 'completed' || 
        booking.status !== 'confirmed') {
      return false;
    }

    try {
      const now = new Date();
      const bookingDate = convertTimestamp(booking.date);
      
      if (!bookingDate) {
        console.error('Invalid booking date');
        return false;
      }

      const bookingStart = new Date(bookingDate);
      const [startHour, startMinute] = booking.timeSlot.start.split(':');
      bookingStart.setHours(parseInt(startHour, 10), parseInt(startMinute, 10), 0, 0);
      
      const bookingEnd = new Date(bookingDate);
      const [endHour, endMinute] = booking.timeSlot.end.split(':');
      bookingEnd.setHours(parseInt(endHour, 10), parseInt(endMinute, 10), 0, 0);
      
      const fifteenMinutesBefore = new Date(bookingStart);
      fifteenMinutesBefore.setMinutes(bookingStart.getMinutes() - 15);

      return now >= fifteenMinutesBefore && 
             now <= bookingEnd && 
             now.toDateString() === bookingDate.toDateString();
    } catch (error) {
      console.error('Error in shouldShowJoinMeeting:', error);
      return false;
    }
  };

  const handleJoinMeeting = (roomId) => {
    setCurrentRoomId(roomId);
    setIsVideoDialogOpen(true);
  };

  const handleEndMeeting = () => {
    setIsVideoDialogOpen(false);
    setCurrentRoomId(null);
    showToast('Meeting ended successfully');
  };
  
  const formatDate = (timestamp) => {
    const date = convertTimestamp(timestamp);
    if (!date) return 'Invalid date';
    
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  useEffect(() => {
    let unsubscribeNotifications = null;

    const startListeningForNotifications = async (user) => {
      if (!user) return;

      const devmeetRef = doc(db, 'devMeet', user.uid);

      unsubscribeNotifications = onSnapshot(devmeetRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setMeet = data.roomId
        } else {
          console.log('No such document!');
        }
      });
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        startListeningForNotifications(user);
      } else {
        if (unsubscribeNotifications) {
          unsubscribeNotifications();
          unsubscribeNotifications = null;
        }
      }
    });

    return () => {
      if (unsubscribeNotifications) unsubscribeNotifications();
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, [auth, db]);

  const calculateStats = (bookingsData) => {
    const stats = bookingsData.reduce((acc, booking) => {
      acc.totalBookings++;
      if (booking.status === 'completed') {
        acc.completedBookings++;
        acc.totalEarnings += booking.totalCost;
      } else if (booking.status === 'pending') {
        acc.pendingBookings++;
      }
      return acc;
    }, {
      totalBookings: 0,
      pendingBookings: 0,
      completedBookings: 0,
      totalEarnings: 0
    });

    setStats(stats);
  };

  const handleBookingStatusUpdate = async (bookingId, newStatus) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: newStatus,
        updatedAt: Timestamp.now()
      });
      showToast(`Booking status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating booking:', error);
      showToast('Failed to update booking status. Please try again.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black p-4 sm:p-6 mt-16">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Developer Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
                Manage your bookings and client interactions
              </p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Link href="/ListService">
                <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  List New Service
                </Button>
              </Link>
              <Link href="/EditService">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Services
                </Button>
              </Link>
            </div>
          </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Bookings</p>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.totalBookings}
                  </h3>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending Bookings</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.pendingBookings}
                  </h3>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.completedBookings}
                  </h3>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    ${stats.totalEarnings}
                  </h3>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 relative">
          {/* Bookings Table */}
          <div className={`${isChatOpen && !isMobile ? 'xl:col-span-3' : 'xl:col-span-4'} transition-all duration-300`}>
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Client</TableHead>
                      <TableHead></TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="w-[200px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id} className={booking.isExpired ? 'opacity-60' : ''}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white">
                              {booking.userName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="font-medium">{booking.userName}</div>
                              <div className="text-sm text-gray-500">{booking.userEmail}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{booking.serviceTitle}</TableCell>
                        <TableCell>
                          <div className="font-medium">{formatDate(booking.date)}</div>
                          <div className="text-sm text-gray-500">
                            {booking.timeSlot.start} - {booking.timeSlot.end}
                          </div>
                        </TableCell>
                        <TableCell>{booking.duration} hour(s)</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`
                              ${booking.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : ''}
                              ${booking.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : ''}
                              ${booking.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : ''}
                            `}
                          >
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`
                              ${booking.paymentStatus === 'paid' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : ''}
                              ${booking.paymentStatus === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : ''}
                            `}
                          >
                            {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                        <div className="flex items-center gap-2">
                          {shouldShowJoinMeeting(booking) && (
                            <Button
                              onClick={() => handleJoinMeeting(booking.roomId)}
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              <Video className="w-4 h-4 mr-2" />
                              Join Meeting
                            </Button>
                          )}
                          
                          {!booking.isExpired && (
                            <Button
                              onClick={() => handleChatOpen(booking)}
                              variant="outline"
                              size="sm"
                              className="border-blue-200 hover:border-blue-300 dark:border-blue-800 dark:hover:border-blue-700"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Chat
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!booking.isExpired && (
                                <>
                                  <DropdownMenuItem onClick={() => handleBookingStatusUpdate(booking.id, 'completed')}>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Mark Completed
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleBookingStatusUpdate(booking.id, 'cancelled')} className="text-red-600">
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Cancel Booking
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Dialog 
  open={isChatDialogOpen} 
  onOpenChange={setIsChatDialogOpen}
  modal={true}
>
  <DialogContent className="w-full max-w-[500px] max-h-[90vh] p-1 flex flex-col rounded-lg shadow-lg bg-white">
    {/* Dialog Header */}
    <DialogHeader className="px-3 py-2 border-b border-gray-200 flex flex-col gap-2">
      <DialogTitle className="text-lg font-semibold text-gray-800">
        Chat with {activeChatBooking?.userName}
      </DialogTitle>
      <DialogDescription className="text-sm text-gray-500">
        Booking: {activeChatBooking?.serviceTitle}
      </DialogDescription>
    </DialogHeader>

    {/* Chat Body */}
    {activeChatBooking && (
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatComponent
          bookingId={activeChatBooking.id}
          developerId={auth.currentUser?.uid}
          developerName={auth.currentUser?.displayName}
          developerImage={auth.currentUser?.photoURL}
          className="flex-1 flex flex-col overflow-y-auto p-4"
        />
      </div>
    )}
  </DialogContent>
</Dialog>

    </div>
  </div>
  </div>
  );
};

export default DeveloperDashboard;