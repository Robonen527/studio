import Link from 'next/link';
import { DateDisplay } from './date-display';
import { AuthButton } from './auth-button';
import { Lightbulb } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-auto min-h-14 flex-wrap items-center justify-between py-2 max-w-screen-2xl gap-y-2 gap-x-4">
        
        {/* Logo and Site Title */}
        <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse">
              <Lightbulb className="h-6 w-6 text-primary" />
              <span className="font-headline text-xl font-bold text-primary">
                מאיר בפרשה
              </span>
            </Link>
        </div>

        {/* Date and Parsha display - Centered */}
        {/* flex-1 allows this to take up space and center its content */}
        <div className="flex-1 flex justify-center order-last md:order-none w-full md:w-auto pt-2 md:pt-0">
            <DateDisplay />
        </div>
        
        {/* Auth Button - pushed to the end */}
        <div className="flex items-center">
            <AuthButton />
        </div>
      </div>
    </header>
  );
}
