'use client';
import { useUser, useFirestore, useCollection } from '@/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { UserNav } from './UserNav';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import type { Notification } from '@/lib/types';
import { collection, query, where } from 'firebase/firestore';
import { useBrowserNotifier } from '@/hooks/use-browser-notifications';

export function HeaderActions() {
  const { user, isLoading } = useUser();
  const firestore = useFirestore();

  const notificationsQuery = useMemo(() => (
    (firestore && user)
      ? query(collection(firestore, `users/${user.uid}/notifications`), where('read', '==', false))
      : null
  ), [firestore, user]);
  const { data: unreadNotifications } = useCollection<Notification>(notificationsQuery);

  const totalUnreadNotifCount = unreadNotifications?.length ?? 0;

  useBrowserNotifier(totalUnreadNotifCount);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  if (user) {
    return (
      <nav className="flex items-center gap-2">
        <Link href="/notifications" className="relative group">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-all">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifikasi</span>
          </Button>
           {totalUnreadNotifCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[1rem] px-1 items-center justify-center rounded-full bg-primary text-[8px] font-black text-white shadow-lg ring-2 ring-background">
                {totalUnreadNotifCount > 99 ? '99+' : totalUnreadNotifCount}
            </span>
          )}
        </Link>
        
        <UserNav />
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-3">
      <Link href="/login">
        <Button variant="ghost" className="rounded-full px-6 font-bold hover:bg-primary/10 hover:text-primary">Masuk</Button>
      </Link>
      <Link href="/register">
        <Button className="rounded-full px-6 font-bold shadow-lg shadow-primary/20">Daftar</Button>
      </Link>
    </nav>
  );
}
