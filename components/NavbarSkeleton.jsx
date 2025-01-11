import React from 'react';

const NavbarSkeleton = () => {
  return (
    <nav className="fixed top-0 w-full border-b bg-background/50 backdrop-blur-lg z-40">
      <div className="max-w-[1400px] flex items-center justify-between h-16 mx-auto px-4 md:px-8">
        {/* BookMyDev Logo Skeleton */}
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-md bg-blue-600/20 animate-pulse" />
          <div className="h-8 w-32 rounded-md bg-gradient-to-r from-blue-600/20 to-indigo-600/20 animate-pulse" />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {/* About Link */}
          <div className="h-6 w-12 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
          
          {/* Developers Link */}
          <div className="h-6 w-24 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
          
          {/* Contact Link */}
          <div className="h-6 w-16 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
          
          {/* Theme Toggle Button */}
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          
          {/* User Menu / Sign In Button */}
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden h-10 w-10 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    </nav>
  );
};

export default NavbarSkeleton;