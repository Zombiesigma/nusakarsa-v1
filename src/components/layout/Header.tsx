'use client';

import { HeaderActions } from './HeaderActions';
import { Logo } from '@/components/Logo';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Header() {
  return (
    <header className="sticky top-0 z-[100] w-full bg-transparent shrink-0">
      <div className="container flex h-20 items-center justify-between px-6 md:px-12 mx-auto md:max-w-none">
        {/* Logo bertahta di pojok kiri hanya pada mode mobile kawan */}
        <Link href="/" className="md:hidden group">
          <div className="bg-white/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-sm transition-all active:scale-95 group-hover:bg-white/60">
            <Logo className="h-8 w-8" />
          </div>
        </Link>
        
        {/* Spacer di desktop agar aksi header tetap bertahta di sisi kanan kawan */}
        <div className="hidden md:block flex-1" />

        <div className="bg-white/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-sm">
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}
