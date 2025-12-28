"use client";

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut } from 'lucide-react';

export function AuthButton() {
  const { isAdmin, toggleAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <Button variant="outline" size="sm" disabled className="w-28"><div className="h-4 w-20 animate-pulse rounded-md bg-muted"></div></Button>
  }

  return (
    <Button variant="outline" size="sm" onClick={toggleAdmin}>
      {isAdmin ? <LogOut className="ml-2 h-4 w-4" /> : <LogIn className="ml-2 h-4 w-4" />}
      {isAdmin ? 'יציאת מנהל' : 'כניסת מנהל'}
    </Button>
  );
}
