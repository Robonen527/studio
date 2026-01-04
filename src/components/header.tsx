'use client';

import Link from 'next/link';
import { DateDisplay } from './date-display';
import { AuthButton } from './auth-button';
import { Lightbulb, BookKey } from 'lucide-react';
import { useUser } from '@/firebase';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';

function AdminNav() {
  const { user, isUserLoading } = useUser();
  const isAdmin = !!user;

  if (isUserLoading) {
    return <Skeleton className="h-9 w-24" />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Button variant="ghost" asChild>
      <Link href="/admin/parshiot">
        <BookKey className="ml-2" />
        ניהול קטגוריות
      </Link>
    </Button>
  );
}


export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-4 md:px-6">
        
        <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse">
              <Lightbulb className="h-6 w-6 text-primary" />
              <span className="font-headline text-xl font-bold text-primary">
                מאיר בפרשה
              </span>
            </Link>
        </div>
        
        <div className="flex flex-1 justify-center px-4">
            <DateDisplay />
        </div>

        <div className="flex items-center justify-end gap-2">
            <AdminNav />
            <AuthButton />
        </div>
      </div>
    </header>
  );
}
