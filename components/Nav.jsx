"use client"
import React, { useEffect, useState, memo } from 'react';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Menu, Sun, Moon, Code2, User, LogOut, Settings, Laptop, WifiOff, Home, InfoIcon, Users, Mail, Layout, Rocket, BookIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { auth } from '../firebase';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import NavbarSkeleton from '@/components/NavbarSkeleton';

const AnimatedDevAvatar = memo(({ user, userType, getInitials, isOffline }) => (
  <div className="relative h-10 w-10">
    <Avatar className="h-10 w-10 transition-transform duration-300 hover:scale-105">
      <AvatarImage src={user?.photoURL} alt={user?.displayName} />
      <AvatarFallback>
        {getInitials(user?.displayName)}
      </AvatarFallback>
    </Avatar>
    
    {userType === 'developer' && (
      <div className="absolute inset-0">
        {/* First orbital ring (decorative) */}
        <div 
          className="absolute inset-[-4px] rounded-full border border-blue-500/20"
          style={{ 
            transform: 'rotate(-45deg)',
          }}
        />
        
        {/* Electron orbit */}
        <div 
          className="absolute inset-[-4px] animate-electron-orbit"
          style={{ 
            transformOrigin: 'center',
          }}
        >
          <Code2 
            className="absolute h-3 w-3 text-blue-400 animate-electron-spin"
            style={{
              top: '35px',
              left: '80%',
              transform: 'translateX(-50%)',
            }}
          />
        </div>
      </div>
    )}
    {isOffline && (
      <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-background" />
    )}
  </div>
));
const ThemeToggle = memo(({ setTheme }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="h-10 w-10">
        <Sun className="h-[1.4rem] w-[1.4rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.4rem] w-[1.4rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="mt-2">
      <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
));

const UserMenu = memo(({ user, userType, isOffline, handleSignOut, getInitials }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button 
        variant="ghost" 
        className="relative h-10 w-10 rounded-full"
      >
        <AnimatedDevAvatar
          user={user}
          userType={userType}
          getInitials={getInitials}
          isOffline={isOffline}
        />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-64 p-2" align="end">
      <div className="flex flex-col space-y-4 p-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-blue-500/20">
            <AvatarImage src={user?.photoURL} alt={user?.displayName} />
            <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <p className="text-sm font-semibold truncate">
              {user?.displayName || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>

        {userType && (
          <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 rounded-md">
            <Code2 className="h-3 w-3 text-blue-500" />
            <span className="text-xs font-medium text-blue-600">
              {userType.charAt(0).toUpperCase() + userType.slice(1)}
            </span>
          </div>
        )}

        {isOffline && (
          <div className="flex items-center gap-2 px-2 py-1 bg-red-500/10 rounded-md">
            <WifiOff className="h-3 w-3 text-red-500" />
            <span className="text-xs font-medium text-red-600">
              Offline Mode
            </span>
          </div>
        )}
      </div>

      <DropdownMenuSeparator className="my-2" />
      
      <DropdownMenuItem asChild className="hover:bg-accent">
        <Link href="/ManageWallet" className="flex items-center gap-2 py-2">
          <Settings className="h-4 w-4" />
          <span>Manage Wallet</span>
        </Link>
      </DropdownMenuItem>
      
      {userType === 'developer' ? (
        <DropdownMenuItem asChild className="hover:bg-accent">
          <Link href="/WorkDashboard" className="flex items-center gap-2 py-2">
            <Layout className="h-4 w-4" />
            <span>Work Dashboard</span>
          </Link>
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem asChild className="hover:bg-accent">
          <Link href="/become-developer" className="flex items-center gap-2 py-2">
            <Rocket className="h-4 w-4" />
            <span>Become a Developer</span>
          </Link>
        </DropdownMenuItem>
      )}
      
      <DropdownMenuSeparator className="my-2" />
      
      <DropdownMenuItem 
        onClick={handleSignOut} 
        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign out
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
));

const NavigationItem = memo(({ href, icon: Icon, label, onClick }) => (
  <Link 
    href={href} 
    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors"
    onClick={onClick}
  >
    <Icon className="h-5 w-5 text-muted-foreground" />
    <span className="text-base font-medium">{label}</span>
  </Link>
));

const MobileSheetContent = memo(({ user, userType, handleSignOut, setTheme, setIsSheetOpen, getInitials }) => (
  <div className="flex flex-col h-full">
    <SheetHeader className="p-6 border-b">
      <SheetTitle className="flex items-center space-x-2">
        <Code2 className="h-6 w-6 text-blue-600" />
        <span className="text-xl tracking-tight font-bold">BookMyDev</span>
      </SheetTitle>
    </SheetHeader>
    
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col p-4">
        {user && (
          <div className="flex items-center p-4 mb-4 bg-accent rounded-lg">
            <div className="flex items-start space-x-4 w-full">
              <div className="relative flex-shrink-0">
                <Avatar className="h-12 w-12 ring-2 ring-blue-500">
                  <AvatarImage src={user?.photoURL} alt={user?.displayName} />
                  <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                </Avatar>
                {userType === 'developer' && (
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 animate-[spin_8s_linear_infinite]">
                      <Code2 
                        className="absolute h-4 w-4 text-blue-500 animate-pulse"
                        style={{
                          top: '-8px',
                          left: '50%',
                          transform: 'translateX(-50%) rotate(-90deg)'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-medium truncate">{user?.displayName || 'User'}</span>
                <span className="text-sm text-muted-foreground truncate">{user?.email}</span>
                {userType && (
                  <span className="text-sm font-medium text-blue-600 flex items-center gap-1 mt-1">
                    <Code2 className="h-3 w-3" />
                    {userType.charAt(0).toUpperCase() + userType.slice(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-1">
          <NavigationItem href="/" icon={Home} label="Home" onClick={() => setIsSheetOpen(false)} />
          <NavigationItem href="/Developers" icon={Users} label="Developers" onClick={() => setIsSheetOpen(false)} />
          
          {user && userType === 'client' && (
              <NavigationItem
                href="/YourBookings"
                icon={BookIcon} label="Your Bookings" onClick={() => setIsSheetOpen(false)}
              />
            )}

          {user && (userType === 'developer' ? (
            <>
              <NavigationItem 
                href="/WorkDashboard" 
                icon={Layout} 
                label="Work Dashboard" 
                onClick={() => setIsSheetOpen(false)} 
              />
              <NavigationItem 
                href="/ManageWallet" 
                icon={Settings} 
                label="Manage Wallet" 
                onClick={() => setIsSheetOpen(false)} 
              />
            </>
          ) : (
            <NavigationItem 
              href="/BecomeDeveloper" 
              icon={Rocket} 
              label="Become a Developer" 
              onClick={() => setIsSheetOpen(false)} 
            />
          ))}
        </div>

        <div className="mt-6 p-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium">Theme</span>
            <ThemeToggle setTheme={setTheme} />
          </div>
        </div>
      </div>
    </div>

    <div className="p-4 border-t">
      {user ? (
        <Button 
          variant="destructive" 
          size="lg" 
          className="w-full"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      ) : (
        <Link href="/SignIn" className="w-full" onClick={() => setIsSheetOpen(false)}>
          <Button variant="default" size="lg" className="w-full">
            Sign In
          </Button>
        </Link>
      )}
    </div>
  </div>
));

const Nav = () => {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserType = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserType(userDoc.data().userType);
      }
    } catch (error) {
      console.error("Error fetching user type:", error);
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchUserType(user.uid);
      } else {
        setUserType(null);
      }
      setIsLoading(false);
    });

    setMounted(true);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeAuth();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUserType(null);
      setIsSheetOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  if (!mounted || isLoading) {
    return <NavbarSkeleton />;
  }

  return (
    <>
      {isOffline && (
        <Alert variant="destructive" className="fixed top-0 w-full z-50">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You are currently offline. Some features may be limited.
          </AlertDescription>
        </Alert>
      )}
      <nav className={`fixed ${isOffline ? 'top-12' : 'top-0'} w-full border-b bg-background/50 backdrop-blur-lg z-40`}>
        <div className="max-w-[1400px] flex items-center justify-between h-16 mx-auto px-4 md:px-8">
          <Link href="/" className="flex items-center space-x-2 group">
            <Code2 className="h-6 w-6 md:h-8 md:w-8 text-blue-600 group-hover:text-indigo-600 transition-colors" />
            <span className="text-xl md:text-2xl tracking-tight font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
              BookMyDev
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/Developers" className="text-lg font-medium text-foreground/70 hover:text-foreground transition-colors">
              Developers
            </Link>

            {user && userType === 'client' && (
              <Link
                href="/YourBookings"
                className="text-lg font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                Your Bookings
              </Link>
            )}

            
            {user && (userType === 'developer' ? (
              <Link href="/WorkDashboard" className="text-lg font-medium text-foreground/70 hover:text-foreground transition-colors">
                Work Dashboard
              </Link>
            ) : (
              <Link href="/become-developer" className="text-lg font-medium text-foreground/70 hover:text-foreground transition-colors">
                Become a Developer
              </Link>
            ))}
            
            <ThemeToggle setTheme={setTheme} />

            {user ? (
              <UserMenu 
                user={user}
                userType={userType}
                isOffline={isOffline}
                handleSignOut={handleSignOut}
                getInitials={getInitials}
              />
            ) : (
              <Link href="/SignIn">
                <Button variant="default" size="lg" className="text-base px-6">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Navigation */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0">
              <MobileSheetContent
                user={user}
                userType={userType}
                handleSignOut={handleSignOut}
                setTheme={setTheme}
                setIsSheetOpen={setIsSheetOpen}
                getInitials={getInitials}
              />
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
};

export default Nav;