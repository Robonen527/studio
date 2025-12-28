
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AdminLoginForm } from './admin-login-form';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Skeleton } from './ui/skeleton';

export function AuthButton() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  
  const isAdmin = !!user;

  if (isUserLoading) {
    return <Skeleton className="h-9 w-28" />
  }

  const handleLoginSuccess = () => {
    setIsLoginOpen(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
  }

  const handleButtonClick = () => {
    if (isAdmin) {
      handleLogout();
    } else {
      setIsLoginOpen(true);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleButtonClick}>
        {isAdmin ? <LogOut className="ml-2 h-4 w-4" /> : <LogIn className="ml-2 h-4 w-4" />}
        {isAdmin ? 'יציאת מנהל' : 'כניסת מנהל'}
      </Button>
      {!isAdmin && (
        <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">כניסת מנהל</DialogTitle>
              <DialogDescription>
                הזן את פרטי ההתחברות כדי לגשת לאפשרויות הניהול.
              </DialogDescription>
            </DialogHeader>
            <AdminLoginForm onSuccess={handleLoginSuccess} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
