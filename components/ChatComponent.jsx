"use client"
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, where, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2, AlertCircle, Wallet, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ethers, BrowserProvider } from 'ethers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const POLYGON_CHAIN_ID = '0x89';

const networkConfig = {
  chainId: POLYGON_CHAIN_ID,
  chainName: 'Polygon Mainnet',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18
  },
  rpcUrls: ['https://polygon-rpc.com/'],
  blockExplorerUrls: ['https://polygonscan.com/']
};

const FundRequestDialog = ({ onRequest, isOpen, setIsOpen, currentAccount }) => {
  const [usdAmount, setUsdAmount] = useState('');
  const [ethAmount, setEthAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentAccount) {
      setWalletAddress(currentAccount);
    }
  }, [currentAccount]);

  const convertUsdToEth = (usdAmount) => {
    const ETH_PRICE_USD = 0.421;
    return (parseFloat(usdAmount) / ETH_PRICE_USD).toFixed(6);
  };

  useEffect(() => {
    if (usdAmount && !isNaN(usdAmount)) {
      const eth = convertUsdToEth(usdAmount);
      setEthAmount(eth);
    } else {
      setEthAmount('0');
    }
  }, [usdAmount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onRequest({
        amount: ethAmount,
        walletAddress,
        usdAmount
      });
      setIsOpen(false);
      setUsdAmount('');
    } catch (error) {
      console.error('Error submitting request:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Funds</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount in USD</label>
            <div className="relative">
              <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="number"
                value={usdAmount}
                onChange={(e) => setUsdAmount(e.target.value)}
                className="pl-8"
                placeholder="Enter USD amount"
                step="0.01"
                min="0"
                required
              />
            </div>
            {ethAmount !== '0' && (
              <p className="text-sm text-gray-500">
                ≈ {ethAmount} POL
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Wallet Address</label>
            <Input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Enter your wallet address"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Request'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ChatComponent = ({ bookingId, developerId, developerName, developerImage }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [networkError, setNetworkError] = useState(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [walletInfo, setWalletInfo] = useState({
    connected: false,
    currentAccount: '',
    maticBalance: null
  });
  const scrollAreaRef = useRef(null);
  const currentUser = auth.currentUser;
  const [isDeveloper, setIsDeveloper] = useState(false);

  useEffect(() => {
    if (currentUser && developerId) {
      setIsDeveloper(currentUser.uid === developerId);
    }
  }, [currentUser, developerId]);

  const checkAndSwitchNetwork = async (provider) => {
    try {
      const chainId = await provider.request({ method: 'eth_chainId' });
      if (chainId !== POLYGON_CHAIN_ID) {
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: POLYGON_CHAIN_ID }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [networkConfig],
            });
          } else {
            throw switchError;
          }
        }
      }
      setNetworkError(null);
      return true;
    } catch (error) {
      setNetworkError('Please switch to the Polygon network');
      console.error('Error switching to Polygon network:', error);
      return false;
    }
  };

  const updateWalletStatus = async (account) => {
    try {
      const provider = window.ethereum || window.trustwallet;
      if (!provider || !account || !ethers.isAddress(account)) {
        throw new Error('Invalid wallet configuration');
      }

      const ethersProvider = new BrowserProvider(provider);
      const balance = await ethersProvider.getBalance(account);
      
      setWalletInfo(prev => ({
        ...prev,
        connected: true,
        currentAccount: account,
        maticBalance: ethers.formatEther(balance)
      }));
    } catch (error) {
      console.error("Error updating wallet status:", error);
      setError("Error updating wallet status: " + error.message);
      setWalletInfo(prev => ({
        ...prev,
        connected: false,
        currentAccount: '',
        maticBalance: null
      }));
    }
  };

  useEffect(() => {
    const checkWallet = async () => {
      try {
        const provider = window.ethereum || window.trustwallet;
        if (!provider) return;

        const isCorrectNetwork = await checkAndSwitchNetwork(provider);
        if (!isCorrectNetwork) return;

        const accounts = await provider.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await updateWalletStatus(accounts[0]);
        }

        const handleAccountsChanged = async (accounts) => {
          if (accounts.length === 0) {
            setWalletInfo(prev => ({
              ...prev,
              connected: false,
              currentAccount: '',
              maticBalance: null
            }));
          } else {
            await updateWalletStatus(accounts[0]);
          }
        };

        provider.on('accountsChanged', handleAccountsChanged);
        provider.on('chainChanged', () => window.location.reload());

        return () => {
          provider.removeListener('accountsChanged', handleAccountsChanged);
          provider.removeListener('chainChanged', () => window.location.reload());
        };
      } catch (error) {
        console.error("Error checking wallet:", error);
        setError("Error connecting to wallet");
      }
    };

    checkWallet();
  }, []);

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
    if (!bookingId || !isAuthenticated) return;

    const q = query(
      collection(db, 'chats'),
      where('bookingId', '==', bookingId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(newMessages);
        setLoading(false);
        
        setTimeout(() => {
          if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
          }
        }, 100);
      },
      (err) => {
        console.error('Error in chat snapshot:', err);
        setError(`Failed to load messages: ${err.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [bookingId, isAuthenticated]);

  const sendFunds = async ({ amount, walletAddress }) => {
    try {
      const provider = window.ethereum || window.trustwallet;
      if (!provider) {
        throw new Error('No wallet found. Please install MetaMask or Trust Wallet.');
      }
  
      const ethersProvider = new BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
  
      const amountInWei = ethers.parseEther(amount.toString());
  
      const tx = await signer.sendTransaction({
        to: walletAddress,
        value: amountInWei
      });

      await tx.wait();
  
      const messageData = {
        bookingId,
        message: `Sent ${amount} ETH`,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'User',
        senderImage: currentUser.photoURL,
        recipientId: developerId,
        timestamp: serverTimestamp(),
        type: 'payment_sent',
        transactionHash: tx.hash
      };
  
      await addDoc(collection(db, 'chats'), messageData);
    } catch (error) {
      console.error('Error sending funds:', error);
      setError(`Failed to send funds: ${error.message}`);
    }
  };

  const connectWallet = async () => {
    try {
      const provider = window.ethereum || window.trustwallet;
      if (!provider) {
        throw new Error('No wallet found. Please install MetaMask or Trust Wallet.');
      }

      const isCorrectNetwork = await checkAndSwitchNetwork(provider);
      if (!isCorrectNetwork) return;

      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      await updateWalletStatus(accounts[0]);
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message);
    }
  };

  const handleFundRequest = async (requestData) => {
    try {
      if (!currentUser) throw new Error('Authentication required');
      
      const messageData = {
        bookingId,
        message: `Requested ${requestData.usdAmount} USD (${requestData.amount} ETH)`,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'User',
        senderImage: currentUser.photoURL,
        recipientId: developerId,
        timestamp: serverTimestamp(),
        type: 'payment_request',
        amount: requestData.amount,
        walletAddress: requestData.walletAddress,
        usdAmount: requestData.usdAmount
      };

      await addDoc(collection(db, 'chats'), messageData);
    } catch (error) {
      console.error('Error sending fund request:', error);
      setError(`Failed to send fund request: ${error.message}`);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !isAuthenticated) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      if (!currentUser) throw new Error('Authentication required');
      if (!bookingId || !developerId) throw new Error('Missing booking or developer information');

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

  const renderMessage = (msg) => {
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
                msg.type === 'payment_request'
                  ? 'bg-green-100 dark:bg-green-900'
                  : isCurrentUser
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <p className="text-sm break-words">{msg.message}</p>
              {msg.type === 'payment_request' && currentUser?.uid !== developerId && (
                <Button
                  onClick={() => sendFunds({
                    amount: msg.amount,
                    walletAddress: msg.walletAddress
                  })}
                  className="mt-2"
                  disabled={!walletInfo.connected}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Send {msg.amount} ETH
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatMessageTime(msg.timestamp)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={developerImage} alt={developerName} />
              <AvatarFallback>{developerName?.[0] || 'D'}</AvatarFallback>
            </Avatar>
            <CardTitle>{developerName}</CardTitle>
          </div>
          <div className="flex items-center space-x-4">
            {isDeveloper && (
              <Button 
                onClick={() => setIsRequestDialogOpen(true)}
                variant="outline"
                className="flex items-center"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Request Funds
              </Button>
            )}
            {walletInfo.currentAccount && (
              <div className="text-sm text-gray-500">
                {walletInfo.currentAccount.slice(0, 6)}...{walletInfo.currentAccount.slice(-4)}
                {walletInfo.maticBalance && ` (${Number(walletInfo.maticBalance).toFixed(4)} MATIC)`}
              </div>
            )}
            {networkError && (
              <Alert variant="destructive" className="ml-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{networkError}</AlertDescription>
              </Alert>
            )}
            {!walletInfo.connected && (
              <Button onClick={connectWallet} variant="outline">
                <Wallet className="w-4 h-4 mr-2" />
                Connect Polygon Wallet
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea ref={scrollAreaRef} className="h-[460px] p-4">
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
              {messages.map(renderMessage)}
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
      {isDeveloper && (
        <FundRequestDialog
          onRequest={handleFundRequest}
          isOpen={isRequestDialogOpen}
          setIsOpen={setIsRequestDialogOpen}
          currentAccount={walletInfo.currentAccount}
        />
      )}
    </Card>
  );
};

export default ChatComponent;