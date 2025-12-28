import Link from 'next/link';
import { DateDisplay } from './date-display';
import { AuthButton } from './auth-button';
import { Lightbulb } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-auto min-h-14 flex-wrap items-center justify-between py-2 max-w-screen-2xl gap-y-2">
        
        {/* Logo and Site Title */}
        <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse">
              <Lightbulb className="h-6 w-6 text-primary" />
              <span className="font-headline text-xl font-bold text-primary">
                מאיר בפרשה
              </span>
            </Link>
        </div>

        {/* Date and Parsha display */}
        <div className="md:mr-0 md:ml-auto">
            <DateDisplay />
        </div>

        {/* Auth Button */}
        <div className="w-full md:w-auto flex-1 md:flex-none flex justify-center md:justify-start">
            <AuthButton />
        </div>
      </div>
    </header>
  );
}
