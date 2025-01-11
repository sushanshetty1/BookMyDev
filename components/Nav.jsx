"use client"

import React from 'react';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Menu, Sun, Moon, Code2 } from "lucide-react";
import { useTheme } from "next-themes";
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
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <nav className="fixed top-0 w-full border-b bg-background/50 backdrop-blur-lg z-50">
      <div className="max-w-[1400px] flex items-center justify-between h-20 mx-auto px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 group">
          <Code2 className="h-8 w-8 text-blue-600 group-hover:text-indigo-600 transition-colors" />
          <span className="text-2xl tracking-tight font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
            BookMyDev
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link 
            href="/about" 
            className="text-lg font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            About
          </Link>
          <Link 
            href="/developers" 
            className="text-lg font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            Developers
          </Link>
          <Link 
            href="/contact" 
            className="text-lg font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            Contact
          </Link>
          
          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Sun className="h-[1.4rem] w-[1.4rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.4rem] w-[1.4rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="mt-2">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="default" size="lg" className="text-base px-6">
            Sign In
          </Button>
        </div>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px]">
            <SheetHeader>
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col space-y-6 mt-8">
              <Link 
                href="/about" 
                className="text-lg font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                About
              </Link>
              <Link 
                href="/developers" 
                className="text-lg font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                Developers
              </Link>
              <Link 
                href="/contact" 
                className="text-lg font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                Contact
              </Link>
              
              {/* Mobile Theme Toggle */}
              <div className="flex items-center justify-between py-2">
                <span className="text-lg font-medium">Theme</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10">
                      <Sun className="h-[1.4rem] w-[1.4rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-[1.4rem] w-[1.4rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      <span className="sr-only">Toggle theme</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="mt-2">
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      Light
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
                      System
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Button variant="default" size="lg" className="w-full text-base">
                Sign In
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default Navbar;