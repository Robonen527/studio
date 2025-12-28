import Link from 'next/link';
import { DateDisplay } from './date-display';
import { AuthButton } from './auth-button';
import { Lightbulb } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-auto min-h-14 flex-wrap items-center justify-between py-2 max-w-screen-2xl">
        <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse">
              <Lightbulb className="h-6 w-6 text-primary" />
              <span className="font-headline text-xl md:text-2xl font-bold text-primary">
                מאיר בפרשה
              </span>
            </Link>
        </div>
        
        <div className="flex items-center">
            <AuthButton />
        </div>

        <div className="w-full flex-1 md:w-auto md:flex-none mt-2 md:mt-0 md:ml-auto">
            <DateDisplay />
        </div>
      </div>
    </header>
  );
}
