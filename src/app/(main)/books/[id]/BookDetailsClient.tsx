'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useMemo, useRef } from 'react';
import { notFound } from 'next/navigation';
import { useFirestore, useUser, useDoc, useCollection } from '@/firebase';
import { doc, collection, addDoc, serverTimestamp, query, orderBy, updateDoc, increment, writeBatch, getDocs, where } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  Eye, 
  BookOpen, 
  Send, 
  MessageCircle, 
  Loader2, 
  PenTool, 
  Layers, 
  Heart, 
  Share2, 
  Clapperboard, 
  CheckCircle2, 
  Music2, 
  Info,
  ChevronRight,
  Download,
  Copy,
  Check,
  Star
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Book, Comment, User, Favorite, ReadingProgress } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BookCommentItem } from '@/components/comments/BookCommentItem';
import { motion, AnimatePresence } from 'framer-motion';

interface BookDetailsClientProps {
  bookId: string;
}

export default function BookDetailsClient({ bookId }: BookDetailsClientProps) {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const bookRef = useMemo(() => (
    firestore ? doc(firestore, 'books', bookId) : null
  ), [firestore, bookId]);
  const { data: book, isLoading: isBookLoading } = useDoc<Book>(bookRef);

  const authorRef = useMemo(() => (
    (firestore && book?.authorId) ? doc(firestore, 'users', book.authorId) : null
  ), [firestore, book]);
  const { data: author, isLoading: isAuthorLoading } = useDoc<User>(authorRef);

  const { data: currentUserProfile } = useDoc<User>(
    (firestore && currentUser) ? doc(firestore, 'users', currentUser.uid) : null
  );

  const commentsQuery = useMemo(() => (
    (firestore && currentUser) 
      ? query(collection(firestore, 'books', bookId, 'comments'), orderBy('createdAt', 'desc')) 
      : null
  ), [firestore, currentUser, bookId]);
  const { data: comments, isLoading: areCommentsLoading } = useCollection<Comment>(commentsQuery);
  
  const favoriteRef = useMemo(() => (
    (firestore && currentUser) ? doc(firestore, 'users', currentUser.uid, 'favorites', bookId) : null
  ), [firestore, currentUser, bookId]);
  const { data: favoriteDoc } = useDoc<Favorite>(favoriteRef);
  
  const readingProgressRef = useMemo(() => (
    (firestore && currentUser) ? doc(firestore, 'users', currentUser.uid, 'readingProgress', bookId) : null
  ), [firestore, currentUser, bookId]);
  const { data: readingProgress } = useDoc<ReadingProgress>(readingProgressRef);

  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const viewIncremented = useRef(false);
  const COMMENT_MAX_LENGTH = 500;
  
  const [isCopied, setIsCopied] = useState(false);
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/books/${bookId}` : '';

  const isFavorite = !!favoriteDoc;
  const isAuthor = currentUser?.uid === book?.authorId;

  useEffect(() => {
    setIsMounted(true);
    if (book && bookRef && !viewTrackedInSession()) {
        updateDoc(bookRef, { viewCount: increment(1) })
            .catch(err => console.warn("Failed to increment view count", err));
        markAsViewed();
    }
  }, [book, bookRef]);

  // Helper untuk mencegah penambahan view berulang dalam satu sesi
  const viewTrackedInSession = () => {
      if (typeof window === 'undefined') return true;
      return sessionStorage.getItem(`viewed_${bookId}`) === 'true';
  };

  const markAsViewed = () => {
      if (typeof window !== 'undefined') {
          sessionStorage.setItem(`viewed_${bookId}`, 'true');
      }
  };

  const handleToggleFavorite = async () => {
    if (!firestore || !currentUser || !bookRef || !book) {
        toast({ variant: "destructive", title: "Harap masuk" });
        return;
    };
    setIsTogglingFavorite(true);
    const favoriteDocRef = doc(firestore, 'users', currentUser.uid, 'favorites', bookId);
    const batch = writeBatch(firestore);
    try {
        if (isFavorite) {
            batch.delete(favoriteDocRef);
            batch.update(bookRef, { favoriteCount: increment(-1) });
        } else {
            batch.set(favoriteDocRef, { userId: currentUser.uid, addedAt: serverTimestamp() });
            batch.update(bookRef, { favoriteCount: increment(1) });
        }
        await batch.commit();
        toast({ title: isFavorite ? "Dihapus dari Favorit" : "Ditambahkan ke Favorit" });
    } catch (error) {
        toast({ variant: "destructive", title: "Gagal" });
    } finally {
        setIsTogglingFavorite(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !currentUser || !firestore || !book || !currentUserProfile) return;
    setIsSubmitting(true);
    try {
        const batch = writeBatch(firestore);
        
        const commentsCol = collection(firestore, 'books', bookId, 'comments');
        const newCommentRef = doc(commentsCol);
        const commentData: Partial<Comment> = {
          text: newComment,
          userId: currentUser.uid,
          userName: currentUserProfile.displayName,
          userAvatarUrl: currentUserProfile.photoURL ?? '',
          username: currentUserProfile.username,
          createdAt: serverTimestamp(),
          likeCount: 0,
          replyCount: 0,
        };

        if (rating > 0) {
            commentData.rating = rating;
        }

        batch.set(newCommentRef, commentData);

        if (rating > 0 && bookRef) {
            const currentRatingCount = book.ratingCount || 0;
            const currentAverageRating = book.averageRating || 0;
            const newRatingCount = currentRatingCount + 1;
            const newAverageRating = ((currentAverageRating * currentRatingCount) + rating) / newRatingCount;

            batch.update(bookRef, {
                ratingCount: increment(1),
                averageRating: newAverageRating
            });
        }

        if (book.authorId !== currentUser.uid) {
            const authorNotificationRef = doc(collection(firestore, `users/${book.authorId}/notifications`));
            batch.set(authorNotificationRef, {
                type: 'comment',
                text: `${currentUserProfile.displayName} memberikan ulasan di karya Anda "${book.title}".`,
                link: `/books/${bookId}`,
                actor: {
                    uid: currentUser.uid,
                    displayName: currentUserProfile.displayName,
                    photoURL: currentUserProfile.photoURL,
                },
                read: false,
                createdAt: serverTimestamp(),
            });
        }
        
        const mentions = newComment.match(/@(\w+)/g);
        if (mentions) {
            const usernames = mentions.map(m => m.substring(1));
            const uniqueUsernames = [...new Set(usernames)];

            const usersRef = collection(firestore, 'users');
            const usersQuery = query(usersRef, where('username', 'in', uniqueUsernames));
            const usersSnap = await getDocs(usersQuery);

            usersSnap.forEach(userDoc => {
                const mentionedUser = userDoc.data() as User;
                if (mentionedUser.uid !== currentUser.uid && mentionedUser.uid !== book.authorId) {
                    const notificationRef = doc(collection(firestore, `users/${mentionedUser.uid}/notifications`));
                    batch.set(notificationRef, {
                        type: 'comment',
                        text: `${currentUserProfile.displayName} menyebut Anda dalam ulasan di karya "${book.title}".`,
                        link: `/books/${bookId}`,
                        actor: {
                            uid: currentUser.uid,
                            displayName: currentUserProfile.displayName,
                            photoURL: currentUserProfile.photoURL,
                        },
                        read: false,
                        createdAt: serverTimestamp(),
                    });
                }
            });
        }

        await batch.commit();
        
        setNewComment('');
        setRating(0);
        toast({ variant: 'success', title: "Ulasan Terkirim" });

    } catch (e) {
        console.error("Error submitting comment:", e);
        toast({ variant: 'destructive', title: "Gagal mengirim ulasan" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
        await navigator.clipboard.writeText(shareUrl);
        toast({ variant: 'success', title: "Tautan Berhasil Disalin!" });
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
        toast({ 
            variant: 'destructive', 
            title: "Gagal Menyalin"
        });
    }
  };

  const handleShare = async () => {
    if (!book) return;
    if (navigator.share) {
        try {
            await navigator.share({
                title: `Mahakarya: ${book.title} oleh ${book.authorName}`,
                text: book.synopsis,
                url: shareUrl,
            });
        } catch (err) {}
    } else {
        handleCopyToClipboard(); // Fallback
        toast({ title: 'Tautan disalin!', description: 'Fitur bagikan tidak didukung di browser ini.' });
    }
  };


  if (!isMounted || isBookLoading || isAuthorLoading) return <BookDetailsSkeleton />;
  if (!book) return notFound();

  const hasSoundtrack = book.playlist && book.playlist.length > 0;
  const showContinueReading = readingProgress && readingProgress.progressPercentage > 1 && readingProgress.progressPercentage < 99 && !book.isCompleted;

  return (
    <div className="relative max-w-lg mx-auto pb-32 px-4 md:max-w-7xl md:px-8 lg:px-12">
      <div className="absolute top-0 right-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10 pointer-events-none md:w-96 md:h-96 md:right-0" />
      <div className="absolute bottom-1/2 left-[-10%] w-64 h-64 bg-accent/5 rounded-full blur-[100px] -z-10 pointer-events-none md:w-96 md:h-96 md:left-0" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-10 py-6"
      >
        <div className="md:grid md:grid-cols-2 md:gap-8 lg:gap-12 md:items-start">
          <div className="space-y-6 md:sticky md:top-8">
            <div className="relative aspect-[2/3] w-full shadow-[0_30px_80px_-15px_rgba(0,0,0,0.3)] rounded-[2.5rem] md:rounded-[3rem] overflow-hidden border border-white/10 group">
                <Image 
                    src={book.coverUrl} 
                    alt={book.title} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-105" 
                    priority 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <Badge className="bg-primary/90 backdrop-blur-md text-white border-none uppercase text-[9px] font-black px-4 py-1.5 rounded-full tracking-widest shadow-xl">
                        {book.genre}
                    </Badge>
                    {book.isCompleted && (
                        <Badge className="bg-emerald-500/90 backdrop-blur-md text-white border-none uppercase text-[9px] font-black px-4 py-1.5 rounded-full tracking-widest shadow-xl">
                            <CheckCircle2 className="h-3 w-3 mr-1.5" /> Tamat
                        </Badge>
                    )}
                </div>

                {hasSoundtrack && (
                    <div className="absolute top-6 right-6">
                        <div className="bg-indigo-600/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/20 shadow-2xl animate-pulse">
                            <Music2 className="h-3.5 w-3.5" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Soundtrack Aktif</span>
                        </div>
                    </div>
                )}
            </div>
          </div>

          <div className="space-y-8 md:space-y-10">
            <div className="space-y-8 px-2 md:px-0">
                <div className="space-y-3">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-black leading-[1.1] tracking-tight italic">
                        {book.title}
                    </h1>
                    
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-12 bg-primary rounded-full" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">Arsip Mahakarya Nusakarsa</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Link href={`/profile/${book.authorUsername}`} className="flex items-center gap-4 bg-card/50 backdrop-blur-sm p-2.5 pr-8 rounded-full border shadow-xl hover:shadow-2xl hover:border-primary/20 transition-all group shrink-0">
                        <div className="relative">
                            <Avatar className="h-12 w-12 border-2 border-background shadow-md group-hover:scale-105 transition-transform">
                                <AvatarImage src={book.authorAvatarUrl} className="object-cover" />
                                <AvatarFallback className="bg-primary/5 text-primary font-black">{book.authorName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-0.5 -right-0.5 bg-primary p-1 rounded-full border-2 border-background">
                                <CheckCircle2 className="h-2 w-2 text-white" />
                            </div>
                        </div>
                        <div className="text-left">
                            <p className="text-[9px] font-black uppercase tracking-widest text-primary/60">Arsitek Narasi</p>
                            <p className="font-black text-base">{book.authorName}</p>
                        </div>
                    </Link>

                    {isAuthor && (
                        <Button variant="outline" className="rounded-full border-2 h-14 px-8 font-black uppercase text-[10px] tracking-[0.2em] shadow-lg hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95" asChild>
                            <Link href={`/books/${book.id}/edit`}>
                                <PenTool className="mr-2.5 h-4 w-4" /> Edit Karya
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Jejak Baca', value: book.viewCount, icon: Eye, color: 'text-primary' },
                        { label: 'Apresiasi', value: book.favoriteCount, icon: Heart, color: 'text-rose-500' },
                        { label: 'Peringkat', value: book.averageRating || 0, icon: Star, color: 'text-yellow-400' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-muted/30 backdrop-blur-sm p-5 rounded-[2rem] border border-white/5 shadow-inner group">
                            <div className="flex flex-col items-center text-center gap-1">
                                <div className={cn("p-2 rounded-xl bg-white/50 mb-1 transition-transform group-hover:scale-110", stat.color)}>
                                    <stat.icon className="h-4 w-4" />
                                </div>
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{stat.label}</p>
                                <p className="font-black text-xl tracking-tighter">
                                    {isMounted ? 
                                        (stat.label === 'Peringkat' ? 
                                            stat.value.toFixed(1) :
                                            new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(stat.value)
                                        )
                                        : '...'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4 px-2 md:px-0">
                <div className="grid grid-cols-5 gap-3">
                    <Button className="col-span-4 h-16 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all" asChild>
                        <Link href={`/books/${book.id}/read`}>
                            {showContinueReading ? (
                                <><BookOpen className="mr-3 h-5 w-5" /> Lanjutkan</>
                            ) : book.type === 'screenplay' ? (
                                <><Clapperboard className="mr-3 h-5 w-5" /> Mulai Naskah</>
                            ) : (
                                <><BookOpen className="mr-3 h-5 w-5" /> Mulai Baca</>
                            )}
                        </Link>
                    </Button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="h-16 rounded-[1.5rem] md:rounded-[2rem] border-2 shadow-xl hover:bg-primary/5 hover:text-primary transition-all active:scale-[0.98]">
                                <Share2 className="h-6 w-6" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2 rounded-2xl" align="end">
                            <div className="flex flex-col gap-1">
                                <Button variant="ghost" onClick={handleShare} className="justify-start gap-3 px-4 py-2 h-auto rounded-lg">
                                    <Share2 className="h-4 w-4" />
                                    <span className="font-bold">Bagikan</span>
                                </Button>
                                {book.fileUrl && (
                                    <Button variant="ghost" asChild className="justify-start gap-3 px-4 py-2 h-auto rounded-lg">
                                    <a href={book.fileUrl} download={`${book.title}.pdf`}>
                                        <Download className="h-4 w-4" />
                                        <span className="font-bold">Download PDF</span>
                                    </a>
                                    </Button>
                                )}
                                <Button variant="ghost" onClick={handleCopyToClipboard} className="justify-start gap-3 px-4 py-2 h-auto rounded-lg">
                                    {isCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                    <span className="font-bold">{isCopied ? 'Disalin!' : 'Salin Tautan'}</span>
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                
                <Button 
                    variant="ghost" 
                    className={cn(
                        "w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all duration-500",
                        isFavorite ? "text-rose-500 bg-rose-500/5 hover:bg-rose-500/10" : "bg-muted/50 hover:bg-muted/80 text-muted-foreground"
                    )}
                    onClick={handleToggleFavorite}
                    disabled={isTogglingFavorite}
                >
                    <Heart className={cn("mr-2.5 h-4 w-4 transition-transform duration-500", isFavorite && "fill-current scale-110")} />
                    {isFavorite ? 'Mahakarya Favorit' : 'Simpan ke Favorit'}
                </Button>
            </div>
          </div>
        </div>

        <section className="space-y-6 pt-8 md:pt-12">
            <div className="flex items-center gap-4 px-2 md:px-0">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">Sinopsis Karya</h2>
                <div className="h-px bg-border/50 flex-1" />
            </div>
            <div className="bg-card/50 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent" />
                <p className="text-base md:text-lg leading-[1.8] italic font-serif text-foreground/80 first-letter:text-4xl first-letter:font-black first-letter:text-primary first-letter:mr-2 first-letter:float-left">
                    {book.synopsis}
                </p>
            </div>
        </section>

        <section className="space-y-10 pt-8">
            <div className="flex items-center justify-between px-2 md:px-0">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600">
                        <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-headline font-black tracking-tight">Suara Pembaca</h2>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Apresiasi & Diskusi</p>
                    </div>
                </div>
                <Badge className="rounded-full bg-primary/10 text-primary border-none px-4 py-1 font-black text-[10px]">{comments?.length || 0} Ulasan</Badge>
            </div>

            {currentUser && (
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="space-y-4 px-2 md:px-0">
                    <div className="flex flex-col items-center gap-3 mb-4">
                      <p className="text-sm font-bold tracking-wider uppercase text-muted-foreground">Beri Peringkat Karyamu</p>
                      <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                              <motion.button
                                  whileHover={{ scale: 1.2 }}
                                  whileTap={{ scale: 0.9 }}
                                  key={star}
                                  type="button"
                                  onClick={() => setRating(star)}
                                  className="focus:outline-none transition-colors"
                              >
                                  <Star
                                      className={cn(
                                          "h-9 w-9",
                                          rating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-400/50 hover:text-yellow-300"
                                      )}
                                  />
                              </motion.button>
                          ))}
                      </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-[2rem] blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                        <Textarea 
                            placeholder="Tuangkan ulasan puitismu di sini... (gunakan @ untuk menyebut pengguna)" 
                            className="relative rounded-[1.75rem] bg-muted/30 border-none min-h-[140px] p-6 font-medium text-sm focus-visible:ring-primary/20 shadow-inner break-all"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            maxLength={COMMENT_MAX_LENGTH}
                        />
                        <div className="absolute bottom-4 right-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                            {newComment.length} / {COMMENT_MAX_LENGTH}
                        </div>
                    </div>
                    <Button 
                        className="w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all" 
                        onClick={handleCommentSubmit} 
                        disabled={isSubmitting || !newComment.trim() || newComment.length > COMMENT_MAX_LENGTH}
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                        Publikasikan Ulasan
                    </Button>
                </motion.div>
            )}

            <div className="space-y-8 px-2 md:px-0">
                <AnimatePresence mode="popLayout">
                    {comments?.map((comment, idx) => (
                        <BookCommentItem 
                            key={comment.id} 
                            bookId={bookId}
                            bookTitle={book.title}
                            bookAuthorId={book.authorId}
                            comment={comment} 
                            currentUserProfile={currentUserProfile} 
                        />
                    ))}
                </AnimatePresence>
                
                {(!comments || comments.length === 0) && (
                    <div className="text-center py-20 opacity-20 flex flex-col items-center gap-4">
                        <MessageCircle className="h-16 w-16" />
                        <p className="font-black uppercase tracking-[0.3em] text-[10px]">Belum ada diskusi untuk karya ini.</p>
                    </div>
                )}
            </div>
        </section>
      </motion.div>
      
      <div className="text-center opacity-20 select-none grayscale py-16">
          <span className="text-[10px] font-black uppercase tracking-[0.5em]">Nusakarsa</span>
      </div>
    </div>
  );
}

function BookDetailsSkeleton() {
    return (
        <div className="max-w-lg mx-auto p-6 space-y-10 animate-pulse md:max-w-7xl md:px-8">
            <div className="md:grid md:grid-cols-2 md:gap-8">
                <Skeleton className="aspect-[2/3] w-full rounded-[2.5rem] md:rounded-[3rem]" />
                <div className="space-y-6">
                    <Skeleton className="h-12 w-3/4 rounded-full" />
                    <Skeleton className="h-6 w-1/2 rounded-full" />
                    <div className="grid grid-cols-3 gap-4">
                        <Skeleton className="h-24 rounded-[2rem]" />
                        <Skeleton className="h-24 rounded-[2rem]" />
                        <Skeleton className="h-24 rounded-[2rem]" />
                    </div>
                </div>
            </div>
            <Skeleton className="h-64 w-full rounded-[2.5rem]" />
        </div>
    );
}
