
'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { useFirestore, useUser, useCollection, useDoc } from '@/firebase';
import { collection, query, where, limit, doc, writeBatch, increment, serverTimestamp, orderBy } from 'firebase/firestore';
import type { User, Book, Follow } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BookCard } from '@/components/BookCard';
import { 
  UserPlus, 
  Edit, 
  Loader2, 
  UserMinus, 
  CheckCircle2, 
  X,
  BookOpen,
  Users,
  MapPin,
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { FollowsSheet } from '@/components/profile/FollowsSheet';
import { motion } from 'framer-motion';
import { 
  Dialog, 
  DialogContent 
} from '@/components/ui/dialog';

const statVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: 'easeOut'
    }
  })
};

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  const [sheetState, setSheetState] = useState<{open: boolean; type: 'followers' | 'following'}>({ open: false, type: 'followers' });

  const normalizedUsername = useMemo(() => params.username?.toLowerCase().replace(/[^a-z0-9_]/g, ''), [params.username]);

  const userQuery = useMemo(() => (
    (firestore && normalizedUsername)
      ? query(collection(firestore, 'users'), where('username', '==', normalizedUsername), limit(1)) 
      : null
  ), [firestore, normalizedUsername]);
  
  const { data: users, isLoading: isUserLoading } = useCollection<User>(userQuery);
  const user = users?.[0];
  const isOwnProfile = user?.uid === currentUser?.uid;

  const followingRef = useMemo(() => (firestore && currentUser && user && !isOwnProfile) ? doc(firestore, 'users', currentUser.uid, 'following', user.uid) : null, [firestore, currentUser, user, isOwnProfile]);
  const { data: followingDoc } = useDoc<Follow>(followingRef);

  useEffect(() => { setIsFollowing(!!followingDoc); }, [followingDoc]);

  const publishedBooksQuery = useMemo(() => (firestore && user) ? query(collection(firestore, 'books'), where('authorId', '==', user.uid), where('status', '==', 'published'), orderBy('createdAt', 'desc')) : null, [firestore, user]);
  const { data: publishedBooks, isLoading: areBooksLoading } = useCollection<Book>(publishedBooksQuery);

  const handleFollow = async () => {
    if (!firestore || !currentUser || !user || isOwnProfile) return;
    setIsTogglingFollow(true);
    try {
        const batch = writeBatch(firestore);
        const followRef = doc(firestore, 'users', currentUser.uid, 'following', user.uid);
        const followerRef = doc(firestore, 'users', user.uid, 'followers', currentUser.uid);
        
        if (isFollowing) {
            batch.delete(followRef);
            batch.delete(followerRef);
            batch.update(doc(firestore, 'users', currentUser.uid), { following: increment(-1) });
            batch.update(doc(firestore, 'users', user.uid), { followers: increment(-1) });
        } else {
            batch.set(followRef, { userId: currentUser.uid, followedAt: serverTimestamp() });
            batch.set(followerRef, { userId: user.uid, followedAt: serverTimestamp() });
            batch.update(doc(firestore, 'users', currentUser.uid), { following: increment(1) });
            batch.update(doc(firestore, 'users', user.uid), { followers: increment(1) });

            const notifRef = doc(collection(firestore, `users/${user.uid}/notifications`));
            batch.set(notifRef, {
                type: 'follow',
                text: `${currentUser.displayName} mulai mengikuti Anda.`,
                link: `/profile/${currentUser.displayName?.toLowerCase().replace(/\s+/g, '')}`,
                actor: {
                    uid: currentUser.uid,
                    displayName: currentUser.displayName!,
                    photoURL: currentUser.photoURL!,
                },
                read: false,
                createdAt: serverTimestamp()
            });
        }
        await batch.commit();
        toast({ title: isFollowing ? "Berhenti mengikuti" : "Mulai mengikuti" });
    } catch(e) {
        toast({ variant: 'destructive', title: "Gagal" });
    } finally { setIsTogglingFollow(false); }
  };

  if (isUserLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Memindai Jejak Digital...</p>
    </div>
  );
  if (!user) notFound();

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto pb-32 space-y-12 px-4 md:px-10"
    >
      <FollowsSheet 
        userId={user.uid} 
        type={sheetState.type} 
        open={sheetState.open} 
        onOpenChange={(o) => setSheetState(prev => ({...prev, open: o}))} 
      />

      <motion.div custom={0} variants={sectionVariants} className="relative">
        <div className="h-48 md:h-80 w-full rounded-[2.5rem] md:rounded-[4rem] bg-card/20 relative overflow-hidden border border-primary/10 shadow-2xl shadow-primary/5">
            <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-accent/5 opacity-80"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-accent/5 blur-[120px] rounded-full" />
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 blur-[100px] rounded-full" />
        </div>

        <div className="flex flex-col lg:flex-row gap-10 md:gap-16 px-6 md:px-16 -mt-16 md:-mt-24 relative z-10">
            <motion.aside custom={1} variants={sectionVariants} className="w-full lg:w-[320px] shrink-0 space-y-8">
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                    <div className="relative mb-6">
                        <div className="p-1.5 rounded-full bg-background ring-8 ring-background shadow-2xl relative group">
                            <div className="absolute -inset-1 rounded-full bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
                            <Avatar className="h-32 w-32 md:h-48 md:w-48 border-4 border-background shadow-inner cursor-pointer" onClick={() => setIsPhotoPreviewOpen(true)}>
                                <AvatarImage src={user.photoURL} className="object-cover" />
                                <AvatarFallback className="bg-primary/5 text-primary text-6xl font-black">{user.displayName[0]}</AvatarFallback>
                            </Avatar>
                        </div>
                        {(user.role === 'penulis' || user.role === 'admin') && (
                            <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-2.5 rounded-full shadow-2xl shadow-primary/40 ring-4 ring-background">
                                <Award className="h-6 w-6" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-5xl font-headline font-black tracking-tight leading-tight text-foreground">{user.displayName}</h1>
                        <div className="flex items-center justify-center lg:justify-start gap-2">
                           <p className="text-sm font-mono text-muted-foreground">@{user.username}</p>
                        </div>
                    </div>

                    <motion.div custom={2} variants={sectionVariants} className="mt-8 p-6 md:p-8 rounded-[2rem] bg-card/50 backdrop-blur-2xl border shadow-xl w-full">
                        <p className="text-sm md:text-base font-medium italic text-muted-foreground leading-relaxed">
                            "{user.bio || "Jelajahi imajinasiku dalam semesta digital Nusakarsa."}"
                        </p>
                        
                        <div className="mt-8 pt-8 border-t border-border/50 space-y-4">
                            {user.domicile && (
                                <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    <span>{user.domicile}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span>Pujangga {user.role}</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div custom={3} variants={sectionVariants} className="w-full mt-8">
                        {isOwnProfile ? (
                            <Button className="w-full rounded-2xl h-14 font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all" asChild>
                                <Link href="/settings"><Edit className="mr-3 h-4 w-4" /> Kelola Profil</Link>
                            </Button>
                        ) : (
                            <Button 
                                variant={isFollowing ? "outline" : "default"}
                                className="w-full rounded-2xl h-14 font-black uppercase text-xs tracking-widest transition-all shadow-xl active:scale-95" 
                                onClick={handleFollow} 
                                disabled={isTogglingFollow}
                            >
                                {isTogglingFollow ? <Loader2 className="h-4 w-4 animate-spin" /> : isFollowing ? <UserMinus className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                {isFollowing ? 'Berhenti Ikuti' : 'Mulai Ikuti'}
                            </Button>
                        )}
                    </motion.div>
                </div>
            </motion.aside>

            <main className="flex-1 space-y-12 pb-20">
                <motion.div 
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                  className="grid grid-cols-3 gap-4 md:gap-8 bg-card/50 backdrop-blur-2xl p-6 md:p-8 rounded-[2.5rem] border shadow-2xl"
                >
                    <motion.div variants={statVariants} className="flex flex-col items-center justify-center space-y-1 md:space-y-2 border-r border-border/50">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary mb-1"><Layers className="h-5 w-5" /></div>
                        <p className="font-black text-2xl md:text-4xl tracking-tighter text-foreground">{publishedBooks?.length || 0}</p>
                        <p className="text-[8px] md:text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Karya</p>
                    </motion.div>
                    <motion.button variants={statVariants} onClick={() => setSheetState({ open: true, type: 'followers' })} className="flex flex-col items-center justify-center space-y-1 md:space-y-2 border-r border-border/50 hover:bg-primary/5 rounded-2xl transition-all">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary mb-1"><Users className="h-5 w-5" /></div>
                        <p className="font-black text-2xl md:text-4xl tracking-tighter text-foreground">{new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(user.followers || 0)}</p>
                        <p className="text-[8px] md:text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Pengikut</p>
                    </motion.button>
                    <motion.button variants={statVariants} onClick={() => setSheetState({ open: true, type: 'following' })} className="flex flex-col items-center justify-center space-y-1 md:space-y-2 hover:bg-primary/5 rounded-2xl transition-all">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary mb-1"><UserPlus className="h-5 w-5" /></div>
                        <p className="font-black text-2xl md:text-4xl tracking-tighter text-foreground">{user.following || 0}</p>
                        <p className="text-[8px] md:text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Mengikuti</p>
                    </motion.button>
                </motion.div>

                <motion.section custom={4} variants={sectionVariants} className="space-y-8">
                    <div className="flex items-center gap-4 px-2">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary"><BookOpen className="h-5 w-5" /></div>
                        <h2 className="text-xl md:text-3xl font-headline font-black tracking-tight text-foreground">Arsip <span className="text-primary italic">Karsa.</span></h2>
                        <div className="h-px bg-border flex-1" />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                        {areBooksLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-[2rem]" />
                            ))
                        ) : publishedBooks?.length === 0 ? (
                            <div className="col-span-full py-20 text-center text-muted-foreground italic font-medium">
                                Belum ada artefak digital yang diarsipkan.
                            </div>
                        ) : (
                            publishedBooks?.map((b, idx) => (
                                <motion.div 
                                    key={b.id} 
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <BookCard book={b} />
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.section>
            </main>
        </div>
      </motion.div>

      <Dialog open={isPhotoPreviewOpen} onOpenChange={setIsPhotoPreviewOpen}>
        <DialogContent className="max-w-none w-screen h-[100dvh] p-0 border-none bg-black/90 flex items-center justify-center rounded-none z-[300]">
            <button onClick={() => setIsPhotoPreviewOpen(false)} className="absolute top-10 right-10 text-white hover:text-primary transition-colors h-12 w-12 flex items-center justify-center bg-white/10 rounded-full backdrop-blur-md border border-white/10">
                <X className="h-7 w-7" />
            </button>
            <motion.img 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={user.photoURL} 
                className="max-w-[90vw] max-h-[85vh] object-contain rounded-3xl shadow-2xl ring-1 ring-white/10" 
                alt="Photo preview"
            />
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
