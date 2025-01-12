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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { onAuthStateChanged } from 'firebase/auth';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  Video
} from 'lucide-react';
import Link from 'next/link';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30';
  const textColor = type === 'error' ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400';
  const borderColor = type === 'error' ? 'border-red-200 dark:border-red-800' : 'border-green-200 dark:border-green-800';

  return (
    <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg border ${bgColor} ${textColor} ${borderColor} shadow-lg flex items-center justify-between min-w-[300px]`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 hover:opacity-70">
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
};

const DeveloperDashboard = () => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalEarnings: 0
  });
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [error, setError] = useState(null);
  
  const [newService, setNewService] = useState({
    title: '',
    description: '',
    rate: '',
    isAvailable: true,
    skills: [],
    timezone: 'UTC',
    availability: {
      monday: { isAvailable: true, slots: [{ start: '09:00', end: '17:00' }] },
      tuesday: { isAvailable: true, slots: [{ start: '09:00', end: '17:00' }] },
      wednesday: { isAvailable: true, slots: [{ start: '09:00', end: '17:00' }] },
      thursday: { isAvailable: true, slots: [{ start: '09:00', end: '17:00' }] },
      friday: { isAvailable: true, slots: [{ start: '09:00', end: '17:00' }] },
      saturday: { isAvailable: false, slots: [] },
      sunday: { isAvailable: false, slots: [] }
    }
  });

  const convertTimestamp = (timestamp) => {
    if (!timestamp) return null;
    
    try {
      if (timestamp?.toDate) {
        return timestamp.toDate();
      }

      if (timestamp instanceof Date) {
        return timestamp;
      }

      if (typeof timestamp === 'number') {
        return new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp);
      }

      if (typeof timestamp === 'string') {
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
    if (!booking.date || !booking.timeSlot || 
        booking.paymentStatus !== 'completed' || 
        booking.status !== 'confirmed') {
      return false;
    }

    const now = new Date();
    const bookingDate = booking.date.toDate();
    
    const bookingStart = new Date(bookingDate);
    const [startHour, startMinute] = booking.timeSlot.start.split(':');
    bookingStart.setHours(parseInt(startHour, 10), parseInt(startMinute, 10), 0, 0);
    
    const bookingEnd = new Date(bookingDate);
    const [endHour, endMinute] = booking.timeSlot.end.split(':');
    bookingEnd.setHours(parseInt(endHour, 10), parseInt(endMinute, 10), 0, 0);
    
    const fifteenMinutesBefore = new Date(bookingStart);
    fifteenMinutesBefore.setMinutes(bookingStart.getMinutes() - 15);

    const isWithinTimeRange = now >= fifteenMinutesBefore && now <= bookingEnd;
    
    const isSameDay = now.toDateString() === bookingDate.toDateString();
    return isWithinTimeRange && isSameDay;
  };

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setError('Please sign in to view your dashboard');
        setLoading(false);
        return;
      }

      try {
        const servicesQuery = query(
          collection(db, 'services'),
          where('developerId', '==', user.uid)
        );

        const unsubscribeServices = onSnapshot(servicesQuery, (snapshot) => {
          const servicesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setServices(servicesData);
        }, (error) => {
          console.error('Error fetching services:', error);
          setError('Failed to load services. Please check your permissions.');
        });

        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('developerId', '==', user.uid),
          orderBy('date', 'asc')
        );

        const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
          const now = new Date();
          const bookingsData = snapshot.docs.map(doc => {
            const data = doc.data();
            const bookingDate = convertTimestamp(data.date);
            
            if (!bookingDate) {
              console.warn(`Invalid date for booking ${doc.id}`);
              return null;
            }

            const bookingEnd = new Date(bookingDate);
            
            if (data.timeSlot?.end) {
              const [endHour, endMinute] = data.timeSlot.end.split(':');
              bookingEnd.setHours(parseInt(endHour, 10), parseInt(endMinute, 10), 0, 0);
            }
            
            const isExpired = bookingEnd < now;

            // Only update status if the booking exists and is pending
            if (isExpired && data.status === 'pending') {
              updateDoc(doc.ref, { 
                status: 'completed',
                updatedAt: Timestamp.now()
              }).catch(error => {
                console.error('Error updating expired booking:', error);
              });
              data.status = 'completed';
            }
            
            return {
              id: doc.id,
              ...data,
              date: bookingDate, // Store the converted date
              isExpired
            };
          }).filter(Boolean); // Remove null entries
          
          const sortedBookings = bookingsData.sort((a, b) => {
            if (a.isExpired === b.isExpired) {
              return a.date - b.date;
            }
            return a.isExpired ? 1 : -1;
          });

          setBookings(sortedBookings);
          calculateStats(sortedBookings);
        }, (error) => {
          console.error('Error fetching bookings:', error);
          setError('Failed to load bookings. Please check your permissions.');
        });

        setLoading(false);
        
        return () => {
          unsubscribeServices();
          unsubscribeBookings();
        };
      } catch (error) {
        console.error('Error setting up listeners:', error);
        setError('An error occurred while loading the dashboard');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      showToast('Please sign in to create/edit services', 'error');
      return;
    }

    try {
      const serviceData = {
        ...newService,
        developerId: user.uid,
        rate: parseFloat(newService.rate),
        updatedAt: Timestamp.now()
      };

      if (isEditMode && selectedService) {
        const serviceRef = doc(db, 'services', selectedService.id);
        await updateDoc(serviceRef, serviceData);
        showToast('Service updated successfully');
      } else {
        const servicesRef = collection(db, 'services');
        await addDoc(servicesRef, {
          ...serviceData,
          createdAt: Timestamp.now()
        });
        showToast('Service created successfully');
      }

      setIsServiceDialogOpen(false);
      resetServiceForm();
    } catch (error) {
      console.error('Error saving service:', error);
      showToast('Failed to save service. Please try again.', 'error');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'services', serviceId));
      showToast('Service deleted successfully');
    } catch (error) {
      console.error('Error deleting service:', error);
      showToast('Failed to delete service. Please try again.', 'error');
    }
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

  const resetServiceForm = () => {
    setNewService({
      title: '',
      description: '',
      rate: '',
      isAvailable: true,
      skills: [],
      timezone: 'UTC',
      availability: {
        monday: { isAvailable: true, slots: [{ start: '09:00', end: '17:00' }] },
        tuesday: { isAvailable: true, slots: [{ start: '09:00', end: '17:00' }] },
        wednesday: { isAvailable: true, slots: [{ start: '09:00', end: '17:00' }] },
        thursday: { isAvailable: true, slots: [{ start: '09:00', end: '17:00' }] },
        friday: { isAvailable: true, slots: [{ start: '09:00', end: '17:00' }] },
        saturday: { isAvailable: false, slots: [] },
        sunday: { isAvailable: false, slots: [] }
      }
    });
    setIsEditMode(false);
    setSelectedService(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black p-8 mt-12">
    {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Developer Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your services and bookings
            </p>
          </div>
          <Link href={'/ListService'}>
          <Button
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            List New Services
          </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.totalBookings}
                  </h3>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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

        {/* Main Content Tabs */}
        <div className="flex space-x-4 mb-6">
        <Button
          variant={activeTab === 'bookings' ? 'default' : 'outline'}
          onClick={() => setActiveTab('bookings')}
          className="flex items-center"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Bookings
        </Button>
        <Button
          variant={activeTab === 'services' ? 'default' : 'outline'}
          onClick={() => setActiveTab('services')}
          className="flex items-center"
        >
          <User className="w-4 h-4 mr-2" />
          Services
        </Button>
      </div>

      {/* Content Area */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        
        <CardContent className="p-6">
          {activeTab === 'bookings' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Client</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Meeting</TableHead>
                  <TableHead>Actions</TableHead>
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
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setIsEditMode(false);
                    resetServiceForm();
                    setIsServiceDialogOpen(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Service
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Service</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{service.title}</div>
                          <div className="text-sm text-gray-500">{service.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>${service.rate}/hr</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={service.isAvailable ? 
                            'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 
                            'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
                          }
                        >
                          {service.isAvailable ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {bookings.filter(b => b.serviceId === service.id).length} total
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedService(service);
                              setNewService(service);
                              setIsEditMode(true);
                              setIsServiceDialogOpen(true);
                            }}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteService(service.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )} 
        </CardContent>
      </Card>
      </div>

      {/* Add/Edit Service Dialog */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Service' : 'Add New Service'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update your service details' : 'Create a new service offering for your clients'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleServiceSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Service Title</Label>
              <Input
                id="title"
                placeholder="e.g., Web Development"
                value={newService.title}
                onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your service..."
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Hourly Rate ($)</Label>
              <Input
                id="rate"
                type="number"
                placeholder="100"
                value={newService.rate}
                onChange={(e) => setNewService({ ...newService, rate: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="available">Available for Booking</Label>
              <Switch
                id="available"
                checked={newService.isAvailable}
                onCheckedChange={(checked) => setNewService({ ...newService, isAvailable: checked })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsServiceDialogOpen(false);
                resetServiceForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditMode ? 'Update Service' : 'Create Service'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
     {/* Video Conference Dialog */}
     <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Live Consultation Session</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <VideoConference
              roomId={currentRoomId}
              participantName={auth.currentUser?.displayName || 'Developer'}
              isDeveloper={true}
              onLeave={handleEndMeeting}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeveloperDashboard;