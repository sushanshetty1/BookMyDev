"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { 
  Wallet, 
  ExternalLink,
  AlertCircle,
  Trash2,
  RefreshCw,
  ChevronDown,
  Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import WalletSkeleton from "@/components/WalletSkeleton";
import {
  JsonRpcProvider,
  formatEther,
  formatUnits,
  Contract,
  parseUnits
} from 'ethers';
import { auth, db } from "../../firebase";

const ManageWallet = () => {
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [wallets, setWallets] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletLabel, setWalletLabel] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('all');
  const [isMobile, setIsMobile] = useState(false);
  const [transactions, setTransactions] = useState({});
  const [isWalletAvailable, setIsWalletAvailable] = useState({
    MetaMask: false,
    'Trust Wallet': false
  });
  const INFURA_KEY = "p194044a6f7f6448e99d23ff06cb76a25";


  const getEthereumProvider = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return window.ethereum;
    }
    return null;
  };

  const updateBalancesAndTransactions = async () => {
    try {
      if (!wallets.length) return;
    
      for (const wallet of wallets) {
        await refreshBalances(wallet);
      }
    } catch (error) {
      console.error('Error updating balances and transactions:', error);
      setError('Failed to update wallet information');
    }
  };

  const WALLET_TYPES = {
    MetaMask: {
      name: 'MetaMask',
      defaultChain: 'ethereum'
    },
    'Trust Wallet': {
      name: 'Trust Wallet',
      defaultChain: 'bsc'
    }
  };

  const SUPPORTED_NETWORKS = {
    ethereum: {
      name: 'Ethereum',
      chainId: '0x1',
      rpcUrl: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
      explorer: 'https://etherscan.io',
      nativeCurrency: {
        symbol: 'ETH',
        decimals: 18
      }
    },
    bsc: {
      name: 'BNB Smart Chain',
      chainId: '0x38',
      rpcUrl: 'https://bsc-dataseed.binance.org',
      explorer: 'https://bscscan.com',
      nativeCurrency: {
        symbol: 'BNB',
        decimals: 18
      }
    },
    polygon: {
      name: 'Polygon',
      chainId: '0x89',
      rpcUrl: 'https://polygon-rpc.com',
      explorer: 'https://polygonscan.com',
      nativeCurrency: {
        symbol: 'MATIC',
        decimals: 18
      }
    }
  };

  const COMMON_TOKENS = {
    ethereum: [
      { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
      { symbol: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
      { symbol: 'DAI', address: '0x6b175474e89094c44da98b954eedeac495271d0f' }
    ],
    bsc: [
      { symbol: 'USDT', address: '0x55d398326f99059ff775485246999027b3197955' },
      { symbol: 'USDC', address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d' },
      { symbol: 'BUSD', address: '0xe9e7cea3dedca5984780bafc599bd69add087d56' }
    ],
    polygon: [
      { symbol: 'USDT', address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f' },
      { symbol: 'USDC', address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174' },
      { symbol: 'DAI', address: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063' }
    ]
  };

  const ERC20_ABI = [
    {
      name: "balanceOf",
      type: "function",
      inputs: [{ name: "owner", type: "address" }],
      outputs: [{ name: "balance", type: "uint256" }],
      stateMutability: "view"
    }
  ];

  const getNetworkProvider = (network) => {
    return new JsonRpcProvider(SUPPORTED_NETWORKS[network].rpcUrl);
  };

  const getNativeBalance = async (walletAddress, network) => {
    const provider = getNetworkProvider(network);
    try {
      const balance = await provider.getBalance(walletAddress);
      return formatEther(balance);
    } catch (error) {
      console.error('Error fetching native balance:', error);
      return '0';
    }
  };

  const getTokenBalance = async (tokenAddress, walletAddress, network) => {
    const provider = getNetworkProvider(network);
    const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);
    try {
      const balance = await tokenContract.balanceOf(walletAddress);
      return formatUnits(balance, 18);
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return '0';
    }
  };

  const fetchTransactionHistory = async (address, network) => {
    const provider = getNetworkProvider(network);
    try {
      const blockNumber = await provider.getBlockNumber();
      const fromBlock = blockNumber - 100;

      const filter = {
        fromBlock,
        toBlock: blockNumber,
        address: address
      };
  
      const logs = await provider.getLogs(filter);
      
      return logs.map(log => ({
        hash: log.transactionHash,
        from: log.address,
        to: address,
        value: '0',
        timestamp: new Date().getTime() / 1000,
        status: 1
      }));
    } catch (error) {
      console.error(`Error fetching transactions for ${network}:`, error);
      return [];
    }
  };


  const refreshBalances = async (wallet) => {
    setRefreshing(true);
    try {
      const newBalances = { ...balances };
      const newTransactions = { ...transactions };
      newBalances[wallet.address] = {};
      newTransactions[wallet.address] = {};
  
      for (const network of Object.keys(SUPPORTED_NETWORKS)) {
        try {
          const nativeBalance = await getNativeBalance(wallet.address, network);
          newBalances[wallet.address][network] = {
            native: {
              symbol: SUPPORTED_NETWORKS[network].nativeCurrency.symbol,
              balance: nativeBalance
            },
            tokens: {}
          };
  
          for (const token of COMMON_TOKENS[network]) {
            try {
              const tokenBalance = await getTokenBalance(token.address, wallet.address, network);
              if (parseFloat(tokenBalance) > 0) {
                newBalances[wallet.address][network].tokens[token.symbol] = tokenBalance;
              }
            } catch (tokenError) {
              console.error(`Error fetching ${token.symbol} balance:`, tokenError);
            }
          }
  
          const txHistory = await fetchTransactionHistory(wallet.address, network);
          newTransactions[wallet.address][network] = txHistory;
        } catch (networkError) {
          console.error(`Error processing ${network}:`, networkError);
          newBalances[wallet.address][network] = {
            native: {
              symbol: SUPPORTED_NETWORKS[network].nativeCurrency.symbol,
              balance: '0'
            },
            tokens: {}
          };
          newTransactions[wallet.address][network] = [];
        }
      }
  
      setBalances(newBalances);
      setTransactions(newTransactions);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh wallet data');
    } finally {
      setRefreshing(false);
    }
  };

  const TransactionHistory = ({ wallet, network }) => {
    const txs = transactions[wallet.address]?.[network] || [];
    
    return (
      <div className="mt-4 space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Transaction History
        </h3>
        {txs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions found</p>
        ) : (
          <div className="space-y-2">
            {txs.map((tx) => (
              <div key={tx.hash} className="p-2 rounded-lg bg-secondary/20">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {formatAddress(tx.from)} → {formatAddress(tx.to)}
                  </span>
                  <span className="text-sm">
                    {parseFloat(tx.value).toFixed(4)} {SUPPORTED_NETWORKS[network].nativeCurrency.symbol}
                  </span>
                </div>
                <a
                  href={`${SUPPORTED_NETWORKS[network].explorer}/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center mt-1"
                >
                  View Transaction <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const WalletCard = ({ wallet }) => {
    const walletBalances = balances[wallet.address] || {};
    const [isExpanded, setIsExpanded] = useState(false);
    
    return (
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                {wallet.label}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => refreshBalances(wallet)}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => disconnectWallet(wallet.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Disconnect Wallet
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <CardDescription className="flex items-center gap-2">
            <span>{wallet.type} • Multi-Chain</span>
            <div className="flex-1" />
            <span className="text-xs text-muted-foreground">
              {formatAddress(wallet.address)}
            </span>
          </CardDescription>
        </CardHeader>
  
        <CardContent>
          <Tabs defaultValue="all" className="w-full" value={selectedNetwork}>
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="all" onClick={() => setSelectedNetwork('all')}>
                All
              </TabsTrigger>
              {Object.keys(SUPPORTED_NETWORKS).map(network => (
                <TabsTrigger 
                  key={network} 
                  value={network}
                  onClick={() => setSelectedNetwork(network)}
                >
                  {SUPPORTED_NETWORKS[network].name}
                </TabsTrigger>
              ))}
            </TabsList>
  
            <TabsContent value="all" className="space-y-4 mt-4">
              {Object.entries(walletBalances).map(([network, data]) => (
                <div key={network} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">
                      {SUPPORTED_NETWORKS[network].name}
                    </h3>
                    <a 
                      href={`${SUPPORTED_NETWORKS[network].explorer}/address/${wallet.address}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary flex items-center"
                    >
                      View on Explorer
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
  
                  <div className="space-y-1 bg-secondary/10 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{data.native.symbol}</span>
                      <span className="text-sm">
                        {parseFloat(data.native.balance).toFixed(4)}
                      </span>
                    </div>
                    {Object.entries(data.tokens || {}).map(([symbol, balance]) => (
                      <div key={symbol} className="flex justify-between items-center">
                        <span className="text-sm">{symbol}</span>
                        <span className="text-sm">{parseFloat(balance).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
  
                  <TransactionHistory 
                    wallet={wallet} 
                    network={network}
                    isExpanded={isExpanded}
                  />
                </div>
              ))}
            </TabsContent>
  
            {Object.keys(SUPPORTED_NETWORKS).map(network => (
              <TabsContent key={network} value={network} className="space-y-4 mt-4">
                {walletBalances[network] && (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">
                        {SUPPORTED_NETWORKS[network].name} Balance
                      </h3>
                      <a 
                        href={`${SUPPORTED_NETWORKS[network].explorer}/address/${wallet.address}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary flex items-center"
                      >
                        View on Explorer
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
  
                    <div className="space-y-1 bg-secondary/10 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {walletBalances[network].native.symbol}
                        </span>
                        <span className="text-sm">
                          {parseFloat(walletBalances[network].native.balance).toFixed(4)}
                        </span>
                      </div>
                      {Object.entries(walletBalances[network].tokens || {}).map(([symbol, balance]) => (
                        <div key={symbol} className="flex justify-between items-center">
                          <span className="text-sm">{symbol}</span>
                          <span className="text-sm">{parseFloat(balance).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
  
                    <TransactionHistory 
                      wallet={wallet} 
                      network={network}
                      isExpanded={isExpanded}
                    />
                  </>
                )}
              </TabsContent>
            ))}
          </Tabs>
  
          <div className="mt-4 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              {isExpanded ? 'Show Less' : 'Show More'}
              <ChevronDown className={`h-4 w-4 ml-1 transform transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`} />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
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
  
    setIsConnecting(true);
    try {
      const provider = getEthereumProvider();
      if (!provider) {
        throw new Error('No provider available');
      }
  
      let address;
      
      const isCorrectWallet = (walletType === 'MetaMask' && provider.isMetaMask) ||
                             (walletType === 'Trust Wallet' && provider.isTrust);
                             
      if (!isCorrectWallet) {
        throw new Error(`Please select ${walletType} in your browser`);
      }
      const accounts = await provider.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }
      
      address = accounts[0];

      if (wallets.some(w => w.address.toLowerCase() === address.toLowerCase())) {
        throw new Error('This wallet is already connected');
      }
  
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const walletsRef = collection(db, `users/${user.uid}/wallets`);
      await addDoc(walletsRef, {
        type: walletType,
        address,
        label: walletLabel,
        defaultChain: WALLET_TYPES[walletType].defaultChain,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
  
      setSuccess(`${walletType} wallet connected successfully!`);
      await verifyAndUpdateWallets();
      setWalletLabel('');
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
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
      await verifyAndUpdateWallets();
    } catch (err) {
      setError('Failed to disconnect wallet');
    }
  };

  const verifyAndUpdateWallets = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Please sign in to access your wallet');
        return;
      }

      const walletsRef = collection(db, `users/${user.uid}/wallets`);
      const walletsSnapshot = await getDocs(walletsRef);
      const storedWallets = walletsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setWallets(storedWallets);

      if (storedWallets.length > 0) {
        await updateBalancesAndTransactions();
      }
    } catch (err) {
      console.error('Error verifying wallets:', err);
      setError('Failed to verify wallet connections');
    }
  };

  useEffect(() => {
    const checkWalletProviders = () => {
      const provider = getEthereumProvider();
      setIsWalletAvailable({
        MetaMask: !!provider?.isMetaMask,
        'Trust Wallet': !!provider?.isTrust
      });
    };

    const initializeWallet = async () => {
      setLoading(true);
      try {
        checkWalletProviders();
        await verifyAndUpdateWallets();
      } catch (error) {
        console.error('Error initializing wallet:', error);
        setError('Failed to initialize wallet');
      } finally {
        setLoading(false);
      }
    };

    initializeWallet();
    setIsMobile(window.innerWidth <= 768);

    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    
    const updateInterval = setInterval(() => {
      if (wallets.length > 0) {
        updateBalancesAndTransactions();
      }
    }, 30000);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(updateInterval);
    };
  }, [wallets.length]);

  useEffect(() => {
    const provider = getEthereumProvider();
    if (!provider) return;

    const handleAccountsChanged = async () => {
      await verifyAndUpdateWallets();
    };

    const handleChainChanged = async () => {
      await verifyAndUpdateWallets();
    };

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);

    return () => {
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('chainChanged', handleChainChanged);
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
    <div className="container max-w-4xl mx-auto p-4 space-y-6 mt-14">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Wallet className="h-8 w-8 text-primary" />
        Manage Wallet
      </h1>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-500/10 text-green-500 dark:bg-green-500/20">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {wallets.map((wallet) => (
          <WalletCard key={wallet.id} wallet={wallet} />
        ))}

        {wallets.length < 2 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Connect Wallet</CardTitle>
              <CardDescription>
                Connect your cryptocurrency wallet to view balances across multiple chains
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => connectWallet('MetaMask')}
                    disabled={isConnecting}
                  >
                    <span className="mr-2">🦊</span>
                    Connect MetaMask
                  </Button>
                  <Button
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={() => connectWallet('Trust Wallet')}
                    disabled={isConnecting}
                  >
                    <span className="mr-2">💎</span>
                    Connect Trust Wallet
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ManageWallet;
