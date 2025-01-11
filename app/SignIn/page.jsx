"use client"

import React, { useState, useEffect } from 'react';
import { ChevronRight, Mail, Lock, AlertCircle, Github } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { serverTimestamp } from 'firebase/firestore';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const googleProvider = new GoogleAuthProvider();

const AuthPage = () => {
    const router = useRouter();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showUserDetails, setShowUserDetails] = useState(false);
    const [userDetails, setUserDetails] = useState({
      displayName: '',
      userType: '',
      githubUsername: ''
    });
  
    const handleEmailAuth = async (e) => {
      e.preventDefault();
      setError('');
      setLoading(true);
  
      try {
        let userCredential;
        if (isSignUp) {
          userCredential = await createUserWithEmailAndPassword(auth, email, password);
          setShowUserDetails(true);
        } else {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
          const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
          if (!userDoc.exists()) {
            setShowUserDetails(true);
          }
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
  
    const handleGoogleSignIn = async () => {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const userDoc = await getDoc(doc(db, "users", result.user.uid));
        if (!userDoc.exists()) {
          setShowUserDetails(true);
        } else {
          router.push('/');
        }
      } catch (err) {
        setError(err.message);
      }
    };
    const handleUserDetails = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
          const user = auth.currentUser;
          if (!user) {
            throw new Error('No authenticated user found');
          }
      
          await updateProfile(user, {
            displayName: userDetails.displayName
          });
      
          const userData = {
            displayName: userDetails.displayName,
            email: user.email,
            userType: userDetails.userType,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
      
          if (userData.displayName.length < 2 || userData.displayName.length > 50) {
            throw new Error('Display name must be between 2 and 50 characters');
          }
      
          if (userDetails.userType === 'developer') {
            if (!userDetails.githubUsername) {
              throw new Error('GitHub username is required for developers');
            }
            userData.githubUsername = userDetails.githubUsername;
          }
      
          const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
          if (!emailRegex.test(userData.email)) {
            throw new Error('Invalid email format');
          }
      
          if (!['client', 'developer'].includes(userData.userType)) {
            throw new Error('Invalid user type');
          }
      
          console.log('Attempting to save user data:', userData);
      
          await setDoc(doc(db, "users", user.uid), userData);

          setShowUserDetails(false);
          
          router.push('/');
        } catch (err) {
          console.error('Error saving user details:', err);
          setError(err.message || 'Failed to save user details');
        } finally {
          setLoading(false);
        }
      };
    
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-6 mt-10">
          <div className="max-w-md w-full">
            <div className="bg-white dark:bg-black rounded-2xl shadow-lg p-8 mb-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {isSignUp ? 'Create an Account' : 'Welcome Back'}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {isSignUp 
                    ? 'Sign up to connect with top developers' 
                    : 'Sign in to your BookMyDev account'}
                </p>
              </div>
    
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400">
                  <AlertCircle size={20} />
                  <p className="text-sm">{error}</p>
                </div>
              )}
    
              <button
                onClick={handleGoogleSignIn}
                className="w-full mb-6 px-8 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-400 transform hover:scale-[1.02] transition-all flex items-center justify-center gap-3 dark:text-white bg-white dark:bg-black shadow-sm hover:shadow-md"
              >
                <GoogleIcon />
                <span className="font-medium">Continue with Google</span>
              </button>
    
              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-black text-gray-500">Or continue with email</span>
                </div>
              </div>
    
              <form onSubmit={handleEmailAuth} className="space-y-5">
              <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-3.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-[1.02] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ChevronRight size={20} className="ml-2" />
                </>
              )}
            </button>
              </form>
            </div>
    
            <p className="text-center text-gray-600 dark:text-gray-300">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
    
          <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Complete Your Profile</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUserDetails} className="space-y-6 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={userDetails.displayName}
                    onChange={(e) => setUserDetails(prev => ({
                      ...prev,
                      displayName: e.target.value
                    }))}
                    className="w-full px-4 py-3 rounded-xl border dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
    
                <div>
                  <label className="block text-sm font-medium mb-2">I am a</label>
                  <Select
                    value={userDetails.userType}
                    onValueChange={(value) => setUserDetails(prev => ({
                      ...prev,
                      userType: value
                    }))}
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
    
                {userDetails.userType === 'developer' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">GitHub Username</label>
                    <div className="relative">
                      <Github className="absolute left-4 top-3.5 text-gray-400" size={20} />
                      <input
                        type="text"
                        value={userDetails.githubUsername}
                        onChange={(e) => setUserDetails(prev => ({
                          ...prev,
                          githubUsername: e.target.value
                        }))}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="your-github-username"
                        required
                      />
                    </div>
                  </div>
                )}
    
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-8 py-3.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-[1.02] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Complete Profile
                      <ChevronRight size={20} className="ml-2" />
                    </>
                  )}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      );
    };
    
    export default AuthPage;