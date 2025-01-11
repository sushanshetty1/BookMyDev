"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { 
  Wallet, 
  ArrowDownRight, 
  ArrowUpRight, 
  RefreshCw, 
  AlertCircle,
  Trash2,
  ExternalLink
} from "lucide-react";
import WalletSkeleton from '@/components/WalletSkeleton';
import { auth, db } from '../../firebase';
import { 
  doc, 
  getDoc, 
  setDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

const ManageWallet = () => {
  const [balance, setBalance] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [walletLabel, setWalletLabel] = useState('');
  const [isWalletAvailable, setIsWalletAvailable] = useState({
    MetaMask: false,
    'Trust Wallet': false,
    Phantom: false
  });

  const WALLET_CHAINS = {
    MetaMask: 'Ethereum',
    'Trust Wallet': 'Multi-Chain',
    Phantom: 'Solana'
  };

  useEffect(() => {
    const initializeWallet = async () => {
      setLoading(true);
      try {
        // Check for wallet providers
        const checkWalletProviders = async () => {
          setIsWalletAvailable({
            MetaMask: !!window.ethereum?.isMetaMask,
            'Trust Wallet': !!window.ethereum?.isTrust,
            Phantom: !!window.solana?.isPhantom
          });
        };

        // Fetch stored wallet data and verify connections
        await checkWalletProviders();
        await verifyAndUpdateWallets();
      } catch (error) {
        console.error('Error initializing wallet:', error);
        setError('Failed to initialize wallet');
      } finally {
        setLoading(false);
      }
    };

    initializeWallet();
    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  const checkDeviceType = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  const verifyAndUpdateWallets = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Please sign in to access your wallet');
        return;
      }

      // Fetch stored wallets
      const walletsRef = collection(db, `users/${user.uid}/wallets`);
      const walletsSnapshot = await getDocs(walletsRef);
      const storedWallets = walletsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Verify each wallet's connection
      const verifiedWallets = [];
      for (const wallet of storedWallets) {
        let isStillConnected = false;

        try {
          switch (wallet.type) {
            case 'MetaMask':
              if (window.ethereum?.isMetaMask) {
                const accounts = await window.ethereum.request({ 
                  method: 'eth_accounts' // Use eth_accounts instead of eth_requestAccounts to check without prompting
                });
                isStillConnected = accounts.some(
                  account => account.toLowerCase() === wallet.address.toLowerCase()
                );
              }
              break;

            case 'Trust Wallet':
              if (window.ethereum?.isTrust) {
                const accounts = await window.ethereum.request({ 
                  method: 'eth_accounts'
                });
                isStillConnected = accounts.some(
                  account => account.toLowerCase() === wallet.address.toLowerCase()
                );
              }
              break;

            case 'Phantom':
              if (window.solana?.isPhantom) {
                const connected = window.solana.isConnected;
                const currentAddress = window.solana.publicKey?.toString();
                isStillConnected = connected && currentAddress === wallet.address;
              }
              break;
          }

          if (isStillConnected) {
            verifiedWallets.push(wallet);
          } else {
            // Remove disconnected wallet from database
            await deleteDoc(doc(db, `users/${user.uid}/wallets/${wallet.id}`));
          }
        } catch (err) {
          console.error(`Error verifying ${wallet.type} connection:`, err);
          // Remove wallet if verification fails
          await deleteDoc(doc(db, `users/${user.uid}/wallets/${wallet.id}`));
        }
      }

      setWallets(verifiedWallets);
      await fetchUserData();
    } catch (err) {
      console.error('Error verifying wallets:', err);
      setError('Failed to verify wallet connections');
    }
  };

  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Please sign in to access your wallet');
        setLoading(false);
        return;
      }

      // Create user document if it doesn't exist
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          walletBalance: 0,
          createdAt: serverTimestamp(),
          email: user.email
        });
      }

      // Fetch user's wallets
      const walletsRef = collection(db, `users/${user.uid}/wallets`);
      const walletsSnapshot = await getDocs(walletsRef);
      const walletsData = walletsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWallets(walletsData);

      // Fetch user's balance
      if (userDoc.exists()) {
        setBalance(userDoc.data().walletBalance || 0);
      }

      await fetchTransactions();
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to fetch wallet data');
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const transactionsRef = collection(db, `users/${user.uid}/transactions`);
      const q = query(
        transactionsRef,
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      const txs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp)
      }));
      setTransactions(txs);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to fetch transaction history');
    }
  };

  const connectWallet = async (walletType) => {
    setError('');
    setSuccess('');
    
    if (!walletLabel.trim()) {
      setError('Please enter a label for your wallet');
      return;
    }

    if (wallets.length >= 2) {
      setError('Maximum of 2 wallets allowed');
      return;
    }

    if (!isWalletAvailable[walletType]) {
      setError(`${walletType} is not installed`);
      return;
    }

    setIsConnecting(true);
    try {
      let address;

      switch (walletType) {
        case 'MetaMask':
          const isMetaMask = window.ethereum?.isMetaMask;
          if (!window.ethereum || !isMetaMask) {
            throw new Error('MetaMask is not installed');
          }
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          address = accounts[0];
          break;
          
        case 'Trust Wallet':
          const isTrust = window.ethereum?.isTrust;
          if (!window.ethereum || !isTrust) {
            throw new Error('Trust Wallet is not installed');
          }
          const trustAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          address = trustAccounts[0];
          break;
          
        case 'Phantom':
          if (!window.solana?.isPhantom) {
            throw new Error('Phantom Wallet is not installed');
          }
          const response = await window.solana.connect();
          address = response.publicKey.toString();
          break;
          
        default:
          throw new Error('Unsupported wallet type');
      }

      if (wallets.some(w => w.address.toLowerCase() === address.toLowerCase())) {
        throw new Error('This wallet is already connected');
      }

      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const walletsRef = collection(db, `users/${user.uid}/wallets`);
      await addDoc(walletsRef, {
        type: walletType,
        address,
        chain: WALLET_CHAINS[walletType],
        label: walletLabel,
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      setSuccess(`${walletType} wallet connected successfully!`);
      await fetchUserData();
      setWalletLabel('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
};

  const disconnectWallet = async (walletId) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      await deleteDoc(doc(db, `users/${user.uid}/wallets/${walletId}`));
      setSuccess('Wallet disconnected successfully');
      await fetchUserData();
    } catch (err) {
      setError('Failed to disconnect wallet');
    }
  };

  const handleWithdraw = async () => {
    setError('');
    setSuccess('');

    if (wallets.length === 0) {
      setError('Please connect at least one wallet first');
      return;
    }

    if (!withdrawAmount) {
      setError('Please enter an amount to withdraw');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount > balance) {
      setError('Insufficient balance');
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const batch = db.batch();

      // Create transaction document
      const transactionRef = doc(collection(db, `users/${user.uid}/transactions`));
      batch.set(transactionRef, {
        userId: user.uid,
        type: 'withdrawal',
        amount: amount,
        description: `Withdrawal to ${wallets[0].label} (${wallets[0].type})`,
        timestamp: serverTimestamp(),
        walletAddress: wallets[0].address,
        walletType: wallets[0].type,
        status: 'completed'
      });

      // Update user's balance
      const userRef = doc(db, 'users', user.uid);
      batch.update(userRef, {
        walletBalance: balance - amount
      });

      await batch.commit();
      setSuccess(`Successfully withdrew $${amount.toFixed(2)}`);
      await fetchUserData();
      setWithdrawAmount('');
    } catch (err) {
      console.error('Withdrawal error:', err);
      setError('Failed to process withdrawal. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const handleAccountsChanged = () => {
      verifyAndUpdateWallets();
    };

    const handleChainChanged = () => {
      verifyAndUpdateWallets();
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    if (window.solana) {
      window.solana.on('disconnect', handleAccountsChanged);
      window.solana.on('accountChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
      if (window.solana) {
        window.solana.removeListener('disconnect', handleAccountsChanged);
        window.solana.removeListener('accountChanged', handleAccountsChanged);
      }
    };
  }, []);

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return <WalletSkeleton />;
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Wallet className="h-8 w-8 text-primary" />
        Manage Wallet
      </h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-500/10 text-green-500 dark:bg-green-500/20">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg md:col-span-2">
          <CardHeader>
            <CardTitle>Available Balance</CardTitle>
            <CardDescription>Your current wallet balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">${balance.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-lg md:col-span-2">
          <CardHeader>
            <CardTitle>Connected Wallets ({wallets.length}/2)</CardTitle>
            <CardDescription>
              Connect up to two cryptocurrency wallets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {wallets.length > 0 && (
              <div className="space-y-4">
                {wallets.map((wallet) => (
                  <div
                    key={wallet.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{
                        wallet.type === 'MetaMask' ? '🦊' :
                        wallet.type === 'Trust Wallet' ? '💎' :
                        wallet.type === 'Phantom' ? '👻' : '💳'
                      }</div>
                      <div>
                        <div className="font-medium">{wallet.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {wallet.type} • {wallet.chain}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          {formatAddress(wallet.address)}
                          <ExternalLink className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      onClick={() => disconnectWallet(wallet.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {wallets.length < 2 && (
              <>
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="wallet-label">Wallet Label</Label>
                    <Input
                      id="wallet-label"
                      placeholder="Enter a name for this wallet"
                      value={walletLabel}
                      onChange={(e) => setWalletLabel(e.target.value)}
                      maxLength={30}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-700"
                      onClick={() => connectWallet('MetaMask')}
                      disabled={isConnecting}
                    >
                      <span className="mr-2">🦊</span>
                      Connect MetaMask
                    </Button>
                    <Button
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
                      onClick={() => connectWallet('Trust Wallet')}
                      disabled={isConnecting}
                    >
                      <span className="mr-2">💎</span>
                      Connect Trust Wallet
                    </Button>
                    {isMobile && (
                      <Button
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white dark:bg-purple-600 dark:hover:bg-purple-700 md:col-span-2"
                        onClick={() => connectWallet('Phantom')}
                        disabled={isConnecting}
                      >
                        <span className="mr-2">👻</span>
                        Connect Phantom
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest wallet activity</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                    {tx.type === 'credit' ? (
                        <ArrowDownRight className="h-5 w-5 text-green-500" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <div className="font-medium">{tx.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(tx.timestamp).toLocaleDateString()} • {tx.status}
                        </div>
                        {tx.walletAddress && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            {formatAddress(tx.walletAddress)}
                            <ExternalLink className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`font-medium ${
                      tx.type === 'credit' ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                    }`}>
                      {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {wallets.length > 0 && (
          <Card className="shadow-lg md:col-span-2">
            <CardHeader>
              <CardTitle>Withdraw Funds</CardTitle>
              <CardDescription>
                Transfer funds to your connected wallet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">Amount (USD)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="withdraw-amount"
                      type="number"
                      placeholder="0.00"
                      className="pl-8"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Available balance: ${balance.toFixed(2)}
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={handleWithdraw}
                  disabled={loading || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > balance}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Withdraw to Wallet'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ManageWallet;