import { Target } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  return (
    <header className="py-4 px-4 md:px-6 border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground font-headline">
            CareerCompassAI
          </h1>
        </Link>
      </div>
    </header>
  );
}
