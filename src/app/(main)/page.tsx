
'use client';

import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useMemo, useState, useEffect } from 'react';
import type { Book } from '@/lib/types';
import { BookCarousel } from '@/components/BookCarousel';
import { Leaf, Book as BookIcon, Feather, TrendingUp } from 'lucide-react';
import { GlobalSearch } from '@/components/layout/GlobalSearch';

export default function HomePage() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  
  const [greeting, setGreeting] = useState("Selamat Datang");
  const [tagline, setTagline] = useState("Setiap karsa Anda adalah awal dari sebuah mahakarya.");

  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 5) return "Selamat Malam";
      if (hour < 12) return "Selamat Pagi";
      if (hour < 15) return "Selamat Siang";
      if (hour < 18) return "Selamat Sore";
      return "Selamat Malam";
    };
    setGreeting(getGreeting());

    const taglines = [
        "Setiap karsa Anda adalah awal dari sebuah mahakarya.",
        "Di mana imajinasi menemukan rumahnya.",
        "Tuliskan duniamu, satu kata setiap saat.",
        "Jejak digital untuk para pujangga modern."
    ];
    setTagline(taglines[Math.floor(Math.random() * taglines.length)]);
  }, []);
  
  const booksQuery = useMemo(() => (
    (firestore && currentUser)
    ? query(
        collection(firestore, 'books'), 
        where('status', '==', 'published')
      )
    : null
  ), [firestore, currentUser]);
  
  const { data: rawBooks, isLoading: areBooksLoading } = useCollection<Book>(booksQuery);

  const latestBooks = useMemo(() => {
    if (!rawBooks) return null;
    return [...rawBooks]
      .filter(b => b.visibility === 'public')
      .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
      .slice(0, 12);
  }, [rawBooks]);

  const popularNovels = useMemo(() => {
    if (!rawBooks) return null;
    return [...rawBooks]
      .filter(b => b.visibility === 'public' && b.type === 'book')
      .sort((a, b) => (b.favoriteCount + b.viewCount) - (a.favoriteCount + a.viewCount))
      .slice(0, 12);
  }, [rawBooks]);
  
  const popularPoems = useMemo(() => {
    if (!rawBooks) return null;
    return [...rawBooks]
      .filter(b => b.visibility === 'public' && b.type === 'poem')
      .sort((a, b) => (b.favoriteCount + b.viewCount) - (a.favoriteCount + a.viewCount))
      .slice(0, 12);
  }, [rawBooks]);

  return (
    <div className="relative space-y-16 w-full max-w-7xl mx-auto pb-20">
      <header className="space-y-8">
        <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-headline font-black tracking-tight text-foreground">
                {greeting}, <span className="text-primary italic">{currentUser?.displayName || 'Pujangga'}!</span>
            </h1>
            <p className="text-muted-foreground font-medium text-lg italic opacity-60">"{tagline}"</p>
        </div>
        
        <div className="max-w-xl">
            <GlobalSearch />
        </div>
      </header>

      <section className="space-y-10 pt-8">
        <div className="flex items-center gap-4">
            <h2 className="text-2xl md:text-3xl font-headline font-black tracking-tight flex items-center gap-3">
                <TrendingUp className="h-7 w-7 text-primary/80" />
                Rilisan <span className="text-primary italic">Terbaru</span>
            </h2>
            <div className="h-px bg-border/50 flex-1" />
        </div>
        <BookCarousel title="" books={latestBooks} isLoading={areBooksLoading} />
      </section>
      
      {popularNovels && popularNovels.length > 0 && (
        <section className="space-y-10">
          <div className="flex items-center gap-4">
              <h2 className="text-2xl md:text-3xl font-headline font-black tracking-tight flex items-center gap-3">
                  <BookIcon className="h-7 w-7 text-primary/80" />
                  Novel <span className="text-primary italic">Populer</span>
              </h2>
              <div className="h-px bg-border/50 flex-1" />
          </div>
          <BookCarousel title="" books={popularNovels} isLoading={areBooksLoading} />
        </section>
      )}

      {popularPoems && popularPoems.length > 0 && (
        <section className="space-y-10">
          <div className="flex items-center gap-4">
              <h2 className="text-2xl md:text-3xl font-headline font-black tracking-tight flex items-center gap-3">
                  <Feather className="h-7 w-7 text-primary/80" />
                  Antologi <span className="text-primary italic">Puisi</span>
              </h2>
              <div className="h-px bg-border/50 flex-1" />
          </div>
          <BookCarousel title="" books={popularPoems} isLoading={areBooksLoading} />
        </section>
      )}

      <div className="text-center opacity-10 select-none grayscale py-20">
          <div className="flex items-center justify-center gap-3">
              <Leaf className="h-5 w-5 text-primary" />
              <span className="text-[11px] font-black uppercase tracking-[0.6em]">Nusakarsa</span>
          </div>
      </div>
    </div>
  );
}
