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
import { useAuth } from '@/context/auth-context';
import { getAuth, signOut } from 'firebase/auth';

export function AuthButton() {
  const { isAdmin, isLoading } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  if (isLoading) {
    return <Button variant="outline" size="sm" disabled className="w-28"><div className="h-4 w-20 animate-pulse rounded-md bg-muted"></div></Button>
  }

  const handleLoginSuccess = () => {
    setIsLoginOpen(false);
  };

  const handleLogout = async () => {
    const auth = getAuth();
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
