'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useMemo, useState, useEffect } from 'react';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import type { Book, User } from '@/lib/types';
import { BookCard } from '@/components/BookCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Loader2, Search, Users, BookOpen, Filter, TrendingUp, ArrowLeft, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const q = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(q);
  const [activeTab, setActiveTab] = useState('all');
  
  useEffect(() => {
    setInputValue(q);
  }, [q]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputValue.trim() === q) return;
    router.push(`/search?q=${encodeURIComponent(inputValue.trim())}`);
  };

  const baseQueries = useMemo(() => {
    if (!firestore || !currentUser || !q) return { books: null, users: null };
    
    return {
        books: query(
            collection(firestore, 'books'),
            where('status', '==', 'published'),
            where('visibility', '==', 'public'),
            limit(200)
        ),
        users: query(
            collection(firestore, 'users'),
            limit(200)
        )
    };
  }, [firestore, currentUser, q]);

  const { data: rawBooks, isLoading: areBooksLoading } = useCollection<Book>(baseQueries.books);
  const { data: rawUsers, isLoading: areUsersLoading } = useCollection<User>(baseQueries.users);
  
  const filteredData = useMemo(() => {
      const term = q.trim().toLowerCase();
      if (!term) return { books: [], users: [] };

      const books = (rawBooks || []).filter(b => 
          b.title?.toLowerCase().includes(term) || 
          b.genre?.toLowerCase().includes(term) ||
          b.authorName?.toLowerCase().includes(term)
      );

      const users = (rawUsers || []).filter(u => 
          u.displayName?.toLowerCase().includes(term) || 
          u.username?.toLowerCase().includes(term) ||
          u.role?.toLowerCase().includes(term)
      );

      return { books, users };
  }, [rawBooks, rawUsers, q]);

  const isLoading = areBooksLoading || areUsersLoading;
  const resultCount = filteredData.books.length + filteredData.users.length;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-24 px-1">
      <div className="space-y-6 text-center pt-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl md:text-6xl font-headline font-black tracking-tight leading-none">
            Jelajahi <span className="text-primary italic">Semesta Karsa</span>
          </h1>
          <p className="text-muted-foreground font-medium text-lg mt-4 max-w-2xl mx-auto">
            Temukan mahakarya, pujangga, dan genre yang menggetarkan jiwa Anda.
          </p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-2xl mx-auto group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Cari mahakarya, pujangga, atau genre..."
                    className="w-full h-16 rounded-full bg-card border-none pl-16 pr-8 text-base font-bold shadow-lg ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/20"
                />
            </form>
        </motion.div>
      </div>

      {!q ? (
        <div className="max-w-2xl mx-auto py-12 px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
                   <TrendingUp className="h-4 w-4" /> Mulai Eksplorasi
               </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
                  {[
                      { label: 'Novel', color: 'text-blue-500', q: 'novel' },
                      { label: 'Fantasi', color: 'text-emerald-500', q: 'fantasy' },
                      { label: 'Pujangga Baru', color: 'text-orange-500', q: 'penulis' },
                      { label: 'Puisi', color: 'text-rose-500', q: 'poem' }
                  ].map((item, i) => (
                      <Card 
                          key={i} 
                          className="border-none bg-card/50 backdrop-blur-md p-4 rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer active:scale-95 border border-white/10 group"
                          onClick={() => router.push(`/search?q=${item.q}`)}
                      >
                          <p className={cn("text-[9px] font-black uppercase tracking-[0.2em] group-hover:text-primary transition-colors", item.color)}>{item.label}</p>
                      </Card>
                  ))}
              </div>
          </motion.div>
        </div>
      ) : (
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-10 pt-6">
          <div className="flex flex-col items-center gap-4">
              <p className="text-muted-foreground font-bold text-xs md:text-sm uppercase tracking-widest opacity-60">
                  Hasil untuk "<span className="text-foreground font-black">{q}</span>" • {isLoading ? '...' : resultCount} ditemukan
              </p>
              <div className="flex items-center overflow-x-auto no-scrollbar pb-2">
                  <TabsList className="bg-muted/50 p-1 rounded-full h-auto flex-shrink-0">
                      <TabsTrigger value="all" className="rounded-full px-8 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest transition-all">Semua</TabsTrigger>
                      <TabsTrigger value="books" className="rounded-full px-8 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest transition-all gap-2">
                          Karya {!isLoading && filteredData.books.length > 0 && <span className="bg-white/20 px-2 py-0.5 rounded-full text-[8px]">{filteredData.books.length}</span>}
                      </TabsTrigger>
                      <TabsTrigger value="users" className="rounded-full px-8 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest transition-all gap-2">
                          Pujangga {!isLoading && filteredData.users.length > 0 && <span className="bg-white/20 px-2 py-0.5 rounded-full text-[8px]">{filteredData.users.length}</span>}
                      </TabsTrigger>
                  </TabsList>
              </div>
          </div>
        
          <AnimatePresence mode="wait">
              <TabsContent value="all" key="all" className="space-y-16 mt-0">
                  {isLoading ? (
                      <div className="space-y-16">
                          <section className="space-y-8">
                              <Skeleton className="h-5 w-40" />
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {Array.from({ length: 3 }).map((_, i) => (
                                      <Card key={i} className="border-none shadow-lg bg-card/50 backdrop-blur-sm rounded-[2rem] p-6">
                                          <div className="flex items-center gap-5">
                                              <Skeleton className="h-16 w-16 rounded-full" />
                                              <div className="space-y-2">
                                                  <Skeleton className="h-4 w-24 rounded-md" />
                                                  <Skeleton className="h-3 w-16 rounded-md" />
                                              </div>
                                          </div>
                                      </Card>
                                  ))}
                              </div>
                          </section>
                          <section className="space-y-8">
                              <Skeleton className="h-5 w-40" />
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
                                  {Array.from({ length: 6 }).map((_, i) => (
                                      <div key={i} className="space-y-2">
                                          <Skeleton className="aspect-[2/3] w-full rounded-[1.5rem]" />
                                          <Skeleton className="h-3 w-3/4 rounded-full" />
                                      </div>
                                  ))}
                              </div>
                          </section>
                      </div>
                  ) : (!filteredData.users.length && !filteredData.books.length) ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed flex flex-col items-center gap-8 shadow-inner max-w-2xl mx-auto">
                          <Search className="h-16 w-16 text-muted-foreground/20" />
                          <div className="space-y-3 px-6">
                              <h2 className="text-3xl font-headline font-black tracking-tight">Hening Tanpa <span className="text-primary italic">Jejak.</span></h2>
                              <p className="text-muted-foreground max-w-sm mx-auto text-sm font-medium leading-relaxed">Kami tidak menemukan frekuensi yang cocok dengan "<span className="font-bold text-foreground">{q}</span>". Mari coba kata kunci lain.</p>
                          </div>
                      </motion.div>
                  ) : (
                      <>
                          {filteredData.users.length > 0 && (
                              <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                  <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 flex items-center gap-3"><Users className="h-4 w-4 text-primary" /> Profil Pujangga</h2>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                      {filteredData.users.map(user => <UserResultCard key={user.id} user={user} />)}
                                  </div>
                              </motion.section>
                          )}
                          {filteredData.books.length > 0 && (
                              <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                  <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 flex items-center gap-3"><BookOpen className="h-4 w-4 text-primary" /> Rak Mahakarya</h2>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
                                      {filteredData.books.map(book => <BookCard key={book.id} book={book} />)}
                                  </div>
                              </motion.section>
                          )}
                      </>
                  )}
              </TabsContent>

              <TabsContent value="books" key="books" className="mt-0">
                  {isLoading ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
                          {Array.from({ length: 12 }).map((_, i) => (
                              <div key={i} className="space-y-2">
                                  <Skeleton className="aspect-[2/3] w-full rounded-[1.5rem]" />
                                  <Skeleton className="h-3 w-3/4 rounded-full" />
                              </div>
                          ))}
                      </div>
                  ) : filteredData.books.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
                          {filteredData.books.map(book => <BookCard key={book.id} book={book} />)}
                      </div>
                  ) : (
                      <div className="text-center py-40 opacity-30 flex flex-col items-center gap-4">
                          <BookOpen className="h-16 w-16 mx-auto mb-2" />
                          <p className="font-black uppercase tracking-widest text-[10px]">Tidak ada karya ditemukan</p>
                      </div>
                  )}
              </TabsContent>

              <TabsContent value="users" key="users" className="mt-0">
                  {isLoading ? (
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {Array.from({ length: 6 }).map((_, i) => (
                              <Card key={i} className="border-none shadow-lg bg-card/50 backdrop-blur-sm rounded-[2rem] p-6">
                                  <div className="flex items-center gap-5">
                                      <Skeleton className="h-16 w-16 rounded-full" />
                                      <div className="space-y-2">
                                          <Skeleton className="h-4 w-24 rounded-md" />
                                          <Skeleton className="h-3 w-16 rounded-md" />
                                      </div>
                                  </div>
                              </Card>
                          ))}
                      </div>
                  ) : filteredData.users.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredData.users.map(user => <UserResultCard key={user.id} user={user} />)}
                      </div>
                  ) : (
                      <div className="text-center py-40 opacity-30 flex flex-col items-center gap-4">
                          <Users className="h-16 w-16 mx-auto mb-2" />
                          <p className="font-black uppercase tracking-widest text-[10px]">Tidak ada pujangga ditemukan</p>
                      </div>
                  )}
              </TabsContent>
          </AnimatePresence>
        </Tabs>
      )}
    </div>
  );
}

function UserResultCard({ user }: { user: User }) {
  return (
    <Link href={`/profile/${user.username}`} className="group">
        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm rounded-[2rem] hover:shadow-2xl hover:-translate-y-1 transition-all overflow-hidden relative border border-white/10">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all">
                <Badge variant="secondary" className="rounded-full text-[8px] font-black uppercase">Profil</Badge>
            </div>
            <CardContent className="p-6 flex items-center gap-5">
                <div className="relative">
                    <Avatar className="h-16 w-16 border-2 border-background shadow-xl ring-1 ring-border group-hover:scale-105 transition-transform duration-500">
                        <AvatarImage src={user.photoURL} alt={user.displayName} />
                        <AvatarFallback className="bg-primary/5 text-primary font-black text-xl italic">
                            {user.displayName?.charAt(0) || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    {user.status === 'online' && <span className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-2 border-card rounded-full shadow-lg" />}
                </div>
                <div className="min-w-0">
                    <p className="font-black text-lg truncate group-hover:text-primary transition-colors tracking-tight">{user.displayName}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-0.5">@{user.username}</p>
                    <div className="flex items-center gap-3 mt-3 text-[9px] font-black text-primary/60 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Users className="h-2.5 w-2.5" /> {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(user.followers)} Pengikut</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    </Link>
  )
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-40 gap-8">
                <Loader2 className="h-14 w-14 animate-spin text-primary/40" />
            </div>
        }>
            <SearchPageContent />
        </Suspense>
    )
}
