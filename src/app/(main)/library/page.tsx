
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy, doc, getDoc, getDocs, where } from 'firebase/firestore';
import type { Book, ReadingProgress, User } from '@/lib/types';
import { Loader2, Library, X, ArrowRight, BookOpen, Heart, Layers, Feather, History, PenSquare, Eye, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';


// Palette warna punggung buku yang lebih kaya
const SPINE_COLORS = [
  "#4E342E", "#6D4C41", "#283593", "#2E7D32", "#C62828", 
  "#6A1B9A", "#00695C", "#D84315", "#4527A0", "#1565C0",
  "#558B2F", "#AD1457", "#00838F", "#6D4C41", "#212121"
];

// Menambahkan tipe data untuk buku yang dipilih
type SelectedBook = (Book & { progress?: number }) | null;

export default function LibraryPage() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const [isLoading, setIsLoading] = useState(true);

  const [favorites, setFavorites] = useState<Book[]>([]);
  const [readingHistory, setReadingHistory] = useState<(Book & { progress: number })[]>([]);
  const [myWorks, setMyWorks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<SelectedBook>(null);

  const { data: currentUserProfile } = useUser<User>();
  const isAuthor = currentUserProfile?.role === 'penulis';

  useEffect(() => {
    if (!firestore || !currentUser) return;

    const fetchLibraryData = async () => {
      setIsLoading(true);
      try {
        const fetchFavorites = async () => {
          const favsRef = collection(firestore, `users/${currentUser.uid}/favorites`);
          const favsSnap = await getDocs(query(favsRef, orderBy('addedAt', 'desc')));
          const bookPromises = favsSnap.docs.map(d => getDoc(doc(firestore, 'books', d.id)));
          const bookDocs = await Promise.all(bookPromises);
          return bookDocs.map(snap => ({ id: snap.id, ...snap.data() } as Book)).filter(b => b.title);
        };

        const fetchReadingHistory = async () => {
          const progressRef = collection(firestore, `users/${currentUser.uid}/readingProgress`);
          const progressSnap = await getDocs(query(progressRef, orderBy('lastReadAt', 'desc')));
          const historyPromises = progressSnap.docs.map(async (d) => {
            const progressData = d.data() as ReadingProgress;
            const bookSnap = await getDoc(doc(firestore, 'books', progressData.bookId));
            if (bookSnap.exists()) {
              return { id: bookSnap.id, ...bookSnap.data(), progress: progressData.progressPercentage } as Book & { progress: number };
            }
            return null;
          });
          const results = await Promise.all(historyPromises);
          return results.filter((b): b is Book & { progress: number } => b !== null);
        };

        const fetchMyWorks = async () => {
          if (!isAuthor) return [];
          const worksRef = collection(firestore, 'books');
          const worksSnap = await getDocs(query(worksRef, where('authorId', '==', currentUser.uid), orderBy('createdAt', 'desc')));
          return worksSnap.docs.map(d => ({ id: d.id, ...d.data() } as Book));
        };

        const [favs, history, works] = await Promise.all([ 
            fetchFavorites(), 
            fetchReadingHistory(), 
            fetchMyWorks() 
        ]);

        setFavorites(favs);
        setReadingHistory(history);
        setMyWorks(works);

      } catch (err) {
        console.error("Gagal memuat perpustakaan:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLibraryData();
  }, [firestore, currentUser, isAuthor]);

  const { favoriteNovels, favoritePoems } = useMemo(() => ({
    favoriteNovels: favorites.filter(b => b.type === 'book'),
    favoritePoems: favorites.filter(b => b.type === 'poem'),
  }), [favorites]);

  const noBooks = favorites.length === 0 && readingHistory.length === 0 && myWorks.length === 0;

  return (
    <div className="max-w-6xl mx-auto pb-32 space-y-12 px-4 pt-6 min-h-screen">
      <header className="text-center space-y-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-4">
            <Library className="h-4 w-4" /> Koleksi Pribadi
          </div>
          <h1 className="text-4xl md:text-6xl font-headline font-black tracking-tight leading-none italic text-foreground">Pustaka <span className="text-primary">Saya.</span></h1>
          <p className="text-muted-foreground font-medium italic mt-2">"Arsip karsa yang menanti untuk kembali disapa."</p>
        </motion.div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6 opacity-40">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="font-black uppercase text-[10px] tracking-[0.4em]">Menyusun Rak Kayu...</p>
        </div>
      ) : noBooks ? (
        <div className="py-32 text-center space-y-8 opacity-30">
          <div className="p-10 bg-muted/30 rounded-[3rem] w-fit mx-auto shadow-inner border border-border/50">
            <Library className="h-20 w-20" />
          </div>
          <div className="space-y-2">
            <p className="font-headline text-2xl font-black italic text-foreground">Rak Masih Hening.</p>
            <p className="text-xs font-bold uppercase tracking-widest px-10">Simpan mahakarya ke favorit untuk mengisi pustaka Anda.</p>
          </div>
          <Button asChild className="rounded-full px-8 h-12 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
            <Link href="/">Cari Inspirasi</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-20">
            <BookShelfSection icon={Heart} title="Novel Favorit" books={favoriteNovels} onBookClick={setSelectedBook} color="text-rose-500" />
            <BookShelfSection icon={Feather} title="Puisi Favorit" books={favoritePoems} onBookClick={setSelectedBook} color="text-cyan-500" />
            <BookShelfSection icon={History} title="Riwayat Baca" books={readingHistory} onBookClick={setSelectedBook} color="text-amber-500" />
            {isAuthor && <BookShelfSection icon={PenSquare} title="Karya Saya" books={myWorks} onBookClick={setSelectedBook} color="text-emerald-500" />}
        </div>
      )}

      <AnimatePresence>
        {selectedBook && <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />}
      </AnimatePresence>

      <style jsx global>{`
        .perspective-2000 { perspective: 2000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .rotate-y-90 { transform: rotateY(90deg); }
        .vertical-rl { writing-mode: vertical-rl; }
      `}</style>
    </div>
  );
}

// Component untuk setiap seksi rak buku
const BookShelfSection = ({ icon: Icon, title, books, onBookClick, color }: any) => {
  if (books.length === 0) return null;

  const shelfGroups = useMemo(() => {
    const groups: any[][] = [];
    const booksPerShelf = 9;
    for (let i = 0; i < books.length; i += booksPerShelf) {
      groups.push(books.slice(i, i + booksPerShelf));
    }
    return groups;
  }, [books]);

  return (
    <section className="space-y-8">
      <div className="flex items-center gap-4">
        <h2 className={`text-2xl md:text-3xl font-headline font-black tracking-tight flex items-center gap-3 ${color}`}>
            <Icon className="h-7 w-7" />
            {title}
        </h2>
        <div className="h-px bg-border/50 flex-1" />
      </div>
      <div className="bookshelf-container space-y-20 perspective-[2000px]">
        {shelfGroups.map((group, gIdx) => (
          <div key={`${title}-shelf-${gIdx}`} className="relative group/shelf">
            <div className="flex items-end gap-0.5 px-4 pb-6 relative z-10 min-h-[240px]">
              {group.map((book, bIdx) => {
                const spineColor = SPINE_COLORS[(gIdx * 9 + bIdx) % SPINE_COLORS.length];
                const randomHeight = 180 + Math.abs((((gIdx * 9 + bIdx) * 23) % 5) - 2) * 12;
                
                return (
                  <motion.div 
                    key={book.id}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: bIdx * 0.05 }}
                    className="book-wrapper group/book cursor-pointer relative preserve-3d transition-all duration-500 hover:-translate-y-6 flex-1 max-w-[50px]"
                    onClick={() => onBookClick(book)}
                  >
                    <div 
                      className="w-full rounded-sm relative flex items-center justify-center shadow-[2px_10px_20px_rgba(0,0,0,0.3)] border-l-2 border-white/20"
                      style={{ backgroundColor: spineColor, height: `${randomHeight}px` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
                      <span 
                        className="spine-title font-headline text-[10px] md:text-[12px] font-black text-white/95 uppercase tracking-widest vertical-rl rotate-180 truncate h-[85%] px-1.5"
                      >
                        {book.title}
                      </span>
                      <div 
                        className="absolute right-[-18px] top-0 w-[18px] h-full origin-left rotate-y-90 brightness-[0.6] filter shadow-inner"
                        style={{ backgroundColor: spineColor }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-[#6D4C41] via-[#4E342E] to-[#3E2723] rounded-sm shadow-[0_20px_40px_rgba(0,0,0,0.5)] z-0">
              <div className="absolute top-0 left-0 right-0 h-1 bg-white/10" />
              <div className="absolute bottom-[-15px] left-0 right-0 h-[15px] bg-[#2D1B18] origin-top -rotate-x-90" style={{transform: 'rotateX(-60deg)'}} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}


// Modal untuk menampilkan detail buku dengan animasi responsif
const BookDetailModal = ({ book, onClose } : { book: SelectedBook, onClose: () => void }) => {
    if (!book) return null;
    
    const renderStars = () => {
        const rating = book.averageRating || 0;
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

        return (
            <div className="flex items-center gap-1 text-yellow-400">
                {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} className="h-5 w-5 fill-current" />)}
                {halfStar && <Star key="half" className="h-5 w-5" />}
                {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} className="h-5 w-5 text-gray-400/70" />)}
                {book.ratingCount > 0 && 
                    <span className="ml-2 text-sm font-bold text-muted-foreground/80">({book.ratingCount} ulasan)</span>
                }
            </div>
        );
    };

    return (
        <div
            className="fixed inset-0 z-[400] flex items-center justify-center p-4 overflow-y-auto perspective-2000"
            onClick={onClose}
        >
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-sm md:max-w-4xl my-auto flex flex-col md:flex-row shadow-2xl shadow-black/50"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Halaman Kiri (Cover) - dengan animasi membuka */}
                <motion.div 
                    initial={{ rotateX: -90, scale: 1.1 }} 
                    animate={{ rotateX: 0, scale: 1 }} 
                    exit={{ rotateX: -90, scale: 1.1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                    className="w-full md:w-1/2 origin-bottom md:origin-right"
                >
                     <motion.div 
                        initial={{ rotateY: -90 }} 
                        animate={{ rotateY: 0 }} 
                        exit={{ rotateY: -90 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                        className="hidden md:block w-full h-full origin-right"
                    >
                        <div className="relative aspect-[2/3] w-full rounded-l-2xl overflow-hidden shadow-2xl shadow-black/40">
                            <Image src={book.coverUrl} alt={book.title} fill className="object-cover" sizes="(max-width: 768px) 0vw, 20vw" />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-white/10" />
                        </div>
                    </motion.div>
                     <div className="block md:hidden relative aspect-[2/3] w-full rounded-t-2xl overflow-hidden shadow-2xl shadow-black/40">
                        <Image src={book.coverUrl} alt={book.title} fill className="object-cover" sizes="80vw" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-white/10" />
                    </div>
                </motion.div>
                
                {/* Halaman Kanan (Details) - dengan animasi membuka */}
                <motion.div 
                    initial={{ rotateX: 90, scale: 1.1 }} 
                    animate={{ rotateX: 0, scale: 1 }} 
                    exit={{ rotateX: 90, scale: 1.1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                    className="w-full md:w-1/2 origin-top md:origin-left bg-card rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none border-t md:border-l md:border-t-0 border-white/5"
                >
                    <motion.div
                         initial={{ rotateY: 90 }} 
                         animate={{ rotateY: 0 }} 
                         exit={{ rotateY: 90 }}
                         transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                         className="hidden md:flex flex-col h-full p-8 md:p-10 origin-left"
                    >
                        <div className="space-y-4 flex-grow">
                            <h2 className="font-headline text-3xl md:text-4xl font-black tracking-tight text-foreground italic leading-tight">{book.title}</h2>
                            <div>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">OLEH {book.authorName}</p>
                                {book.createdAt && <p className="text-xs text-muted-foreground/60">Terbit {format(book.createdAt.toDate(), 'd MMMM yyyy', { locale: id })}</p>}
                            </div>
                            <div className='py-3'>{renderStars()}</div>
                            {book.progress !== undefined && (
                                <div className='space-y-2 pt-2'>
                                    <p className='text-xs font-bold uppercase tracking-widest text-muted-foreground/70'>Progres Baca Anda</p>
                                    <div className='flex items-center gap-3'><Progress value={book.progress} className="h-2 bg-muted/50" /><span className='font-black text-sm text-primary'>{Math.round(book.progress)}%</span></div>
                                </div>
                            )}
                            <div className="text-sm text-muted-foreground leading-relaxed italic line-clamp-4 md:line-clamp-5 border-t border-border/20 pt-4">{book.synopsis}</div>
                        </div>
                        <div className="mt-8 flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/20">
                            <Button asChild className="flex-1 h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"><Link href={`/books/${book.id}/read`}><BookOpen className="mr-2 h-5 w-5" />{book.progress && book.progress > 1 && book.progress < 99 ? 'Lanjutkan' : 'Mulai'}</Link></Button>
                            <Button asChild variant="outline" className="flex-1 h-14 rounded-2xl font-black text-sm uppercase tracking-widest border-2 hover:bg-primary/5 hover:text-primary transition-all active:scale-95"><Link href={`/books/${book.id}`}>Detail <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                        </div>
                    </motion.div>
                     <div className="flex md:hidden flex-col h-full p-6">
                        <div className="space-y-3 flex-grow">
                            <h2 className="font-headline text-2xl font-black tracking-tight text-foreground italic leading-tight">{book.title}</h2>
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">OLEH {book.authorName}</p>
                                {book.createdAt && <p className="text-[10px] text-muted-foreground/60">Terbit {format(book.createdAt.toDate(), 'd MMM yyyy', { locale: id })}</p>}
                            </div>
                            <div className='py-2'>{renderStars()}</div>
                            {book.progress !== undefined && (
                                <div className='space-y-1.5'>
                                    <p className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70'>Progres Baca Anda</p>
                                    <div className='flex items-center gap-3'><Progress value={book.progress} className="h-1.5 bg-muted/50" /><span className='font-black text-xs text-primary'>{Math.round(book.progress)}%</span></div>
                                </div>
                            )}
                            <div className="text-xs text-muted-foreground leading-relaxed italic line-clamp-3 border-t border-border/20 pt-3 mt-3">{book.synopsis}</div>
                        </div>
                        <div className="mt-6 flex flex-col gap-2 pt-3 border-t border-border/20">
                            <Button asChild className="flex-1 h-12 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20"><Link href={`/books/${book.id}/read`}><BookOpen className="mr-2 h-4 w-4" />{book.progress && book.progress > 1 && book.progress < 99 ? 'Lanjutkan' : 'Mulai'}</Link></Button>
                            <Button asChild variant="outline" className="flex-1 h-12 rounded-xl font-black text-xs uppercase tracking-widest border hover:bg-primary/5 hover:text-primary"><Link href={`/books/${book.id}`}>Detail <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                        </div>
                    </div>
                </motion.div>

                <motion.button
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1, transition: { delay: 0.5 } }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute -top-3 -right-3 md:-top-4 md:-right-4 h-10 w-10 md:h-12 md:w-12 rounded-full bg-background/80 backdrop-blur-md border shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:scale-110 hover:rotate-90 transition-all z-20"
                >
                    <X className="h-5 w-5 md:h-6 md:w-6" />
                </motion.button>
            </motion.div>
        </div>
    );
}
