//ChatComponent.jsx
"use client"
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, where, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ChatComponent = ({ bookingId, developerId, developerName, developerImage }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const scrollAreaRef = useRef(null);
  const messagesRef = useRef([]);
  const currentUser = auth.currentUser;
  const DEBUG = true;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      if (!user) {
        setError('Please sign in to access the chat');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (DEBUG) {
      console.log('Chat Component Props:', {
        bookingId,
        developerId,
        developerName,
        developerImage,
        currentUser: auth.currentUser?.uid
      });
    }
  }, [bookingId, developerId, developerName, developerImage]);

  useEffect(() => {
    if (!bookingId || !isAuthenticated) {
      if (DEBUG) console.log('Missing required data:', { bookingId, isAuthenticated });
      return;
    }

    let unsubscribe;
    
    try {
      if (DEBUG) console.log('Setting up chat listener for bookingId:', bookingId);

      const q = query(
        collection(db, 'chats'),
        where('bookingId', '==', bookingId),
        orderBy('timestamp', 'asc')
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (DEBUG) console.log('Chat snapshot received:', snapshot.size, 'messages');
          
          const newMessages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          if (DEBUG) console.log('Processed messages:', newMessages);
          
          setMessages(newMessages);
          messagesRef.current = newMessages;
          setLoading(false);
          setError(null);
          
          // Scroll to bottom after messages update
          setTimeout(() => {
            if (scrollAreaRef.current) {
              scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
            }
          }, 100);
        },
        (err) => {
          console.error('Error in chat snapshot:', err);
          if (err.code === 'permission-denied') {
            setError(`Access denied. Please check your permissions. Error: ${err.message}`);
          } else {
            setError(`Failed to load messages: ${err.message}`);
          }
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Error setting up chat listener:', err);
      setError(`Chat initialization failed: ${err.message}`);
      setLoading(false);
    }

    return () => {
      if (DEBUG) console.log('Cleaning up chat listener');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [bookingId, isAuthenticated]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !isAuthenticated) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      if (!currentUser) {
        throw new Error('Authentication required');
      }

      if (!bookingId || !developerId) {
        throw new Error('Missing booking or developer information');
      }

      if (DEBUG) {
        console.log('Sending message:', {
          bookingId,
          messageText,
          senderId: currentUser.uid,
          developerId
        });
      }

      const messageData = {
        bookingId,
        message: messageText,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'User',
        senderImage: currentUser.photoURL,
        recipientId: developerId,
        timestamp: serverTimestamp(),
        type: 'message'
      };

      await addDoc(collection(db, 'chats'), messageData);

      if (DEBUG) console.log('Message sent successfully');

    } catch (error) {
      console.error('Error sending message:', error);
      setError(`Failed to send message: ${error.message}`);
      setNewMessage(messageText);
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate();
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit'
      });
    } catch (err) {
      console.error('Error formatting timestamp:', err);
      return '';
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please sign in to access the chat
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={developerImage} alt={developerName} />
            <AvatarFallback>{developerName?.[0] || 'D'}</AvatarFallback>
          </Avatar>
          <CardTitle>{developerName}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea 
          ref={scrollAreaRef}
          className="h-[460px] p-4"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <Alert variant="destructive" className="mx-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isCurrentUser = msg.senderId === currentUser?.uid;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-[80%] ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={msg.senderImage} />
                        <AvatarFallback>{msg.senderName?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div
                          className={`rounded-lg p-3 ${
                            isCurrentUser
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800'
                          }`}
                        >
                          <p className="text-sm break-words">{msg.message}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatMessageTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                )})}
            </div>
          )}
        </ScrollArea>

        <form 
          onSubmit={sendMessage}
          className="border-t p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
        >
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={!!error}
            />
            <Button 
              type="submit" 
              disabled={!newMessage.trim() || !!error}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChatComponent;