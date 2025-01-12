import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Code2, CheckCircle, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

const BecomeDeveloperDialog = ({ user, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(null);

  const handleBecomeDeveloper = async () => {
    if (!user) {
      window.location.href = '/SignIn';
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        userType: 'developer'
      });
      
      setStatus('success');
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      
    } catch (error) {
      console.error('Error updating user type:', error);
      setStatus('error');
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-blue-600" />
            Become a Developer
          </AlertDialogTitle>
          <div className="space-y-2 text-sm text-muted-foreground">
            <AlertDialogDescription>
              Are you ready to join our developer community? By becoming a developer, you'll be able to:
            </AlertDialogDescription>
            <ul className="list-disc pl-4 space-y-1">
              <li>Create your professional profile</li>
              <li>Receive booking requests from clients</li>
              <li>Manage your work schedule</li>
              <li>Earn money for your expertise</li>
            </ul>
          </div>
        </AlertDialogHeader>

        {status && (
          <Alert variant={status === 'success' ? 'default' : 'destructive'} className="my-2">
            {status === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {status === 'success' 
                ? "Successfully registered as a developer! Redirecting..." 
                : "Failed to update developer status. Please try again."}
            </AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel 
            className="sm:w-full"
            onClick={() => {
              setStatus(null);
              setIsOpen(false);
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="sm:w-full bg-blue-600 hover:bg-blue-700"
            onClick={handleBecomeDeveloper}
            disabled={status === 'success'}
          >
            Become a Developer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BecomeDeveloperDialog;