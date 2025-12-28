import Link from 'next/link';
import { DateDisplay } from './date-display';
import { AuthButton } from './auth-button';
import { TorahIcon } from './torah-icon';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2 rtl:space-x-reverse">
          <TorahIcon className="h-6 w-6 text-primary" />
          <span className="font-headline text-2xl font-bold text-primary">
            פניני תורה
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end rtl:space-x-reverse">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <DateDisplay />
          </div>
          <nav className="flex items-center">
            <AuthButton />
          </nav>
        </div>
      </div>
    </header>
  );
}
