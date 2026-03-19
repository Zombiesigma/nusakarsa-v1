

'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { notFound, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Settings, 
  ChevronsUp, 
  Music2, 
  Headphones, 
  Search, 
  Youtube, 
  Download, 
  ScrollText,
  ChevronRight,
  List,
  Play,
  Pause,
  Layers,
  Loader2,
  Feather,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useUser, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, setDoc, serverTimestamp } from 'firebase/firestore';
import type { Book, Chapter, Music, MusicTrack, ReadingProgress } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { searchYouTube, getPreviewAudioUrl } from '@/app/actions/music';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from '@/hooks/use-toast';

type ReadingTheme = 'light' | 'sepia' | 'paper';
type FontFamily = 'font-serif' | 'font-sans' | 'font-mono' | 'font-pacifico' | 'font-great-vibes' | 'font-dancing-script';

const PAPER_TEXTURE_URL = "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&q=80&w=1600";
const POEM_PAPER_TEXTURE_URL = "https://media.istockphoto.com/id/654922866/photo/old-yellowed-stained-paper-texture.jpg?s=612x612&w=0&k=20&c=uInwuGGMQMw2RKMillvZz5suVDgIcKD7yvrOmoPVt-k=";

const TableOfContents = ({ chapters, isPoem, onChapterClick }: any) => {
    return (
        <div className="flex flex-col h-full">
            <div className="px-8 pt-6 pb-6 text-left shrink-0 border-b">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 text-primary rounded-2xl shadow-sm ring-1 ring-primary/20">
                        <Layers className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="font-headline text-3xl font-black tracking-tight leading-none">Daftar Isi</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                            Navigasi {isPoem ? 'Bait Puisi' : 'Struktur Cerita'}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
                 <div className="grid gap-3">
                    {chapters?.map((c: any, idx: number) => (
                        <button 
                            key={c.id} 
                            onClick={()=> onChapterClick(c.id)} 
                            className="group w-full flex items-center gap-4 p-4 rounded-[1.75rem] transition-all hover:bg-primary/5 active:scale-[0.98] border border-transparent hover:border-primary/10 text-left relative overflow-hidden"
                        >
                            <div className="h-12 w-12 rounded-2xl bg-muted group-hover:bg-primary group-hover:text-white transition-all duration-300 flex items-center justify-center shrink-0 shadow-sm font-black text-xs">
                                {String(idx + 1).padStart(2, '0')}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-primary opacity-60">
                                        {isPoem ? 'Poem' : 'Bagian'}
                                    </span>
                                    <div className="h-1 w-1 rounded-full bg-border" />
                                    <span className="text-[8px] font-bold text-muted-foreground uppercase">
                                        ID: {c.id.substring(0, 4)}
                                    </span>
                                </div>
                                <p className="font-bold text-sm md:text-base truncate group-hover:text-primary transition-colors pr-4">
                                    {c.title}
                                </p>
                            </div>

                            <ChevronRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary/40 group-hover:translate-x-1 transition-all" />
                            
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-primary rounded-r-full transition-all group-hover:h-8" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};


export default function ReadPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  
  const [isMounted, setIsMounted] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(true);
  
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [fontFamily, setFontFamily] = useState<FontFamily>('font-serif');
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>('paper');
  
  const [readingProgress, setReadingProgress] = useState(0);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const [activeTrack, setActiveTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [musicSearchQuery, setMusicSearchQuery] = useState("");
  const [ytResults, setYtResults] = useState<MusicTrack[]>([]);
  const [isSearchingYt, setIsSearchingYt] = useState(false);
  
  const [hasScrolled, setHasScrolled] = useState(false);
  const currentProgressRef = useRef(0);
  const lastAutoSavedProgressRef = useRef<number | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const bookRef = useMemo(() => (firestore ? doc(firestore, 'books', params.id) : null), [firestore, params.id]);
  const { data: book, isLoading: isBookLoading } = useDoc<Book>(bookRef);

  const chaptersQuery = useMemo(() => (
    (firestore && currentUser) ? query(collection(firestore, 'books', params.id, 'chapters'), orderBy('order', 'asc')) : null
  ), [firestore, currentUser, params.id]);
  const { data: chapters, isLoading: isChaptersLoading } = useCollection<Chapter>(chaptersQuery);

  const musicQuery = useMemo(() => (
    (firestore && currentUser) ? query(collection(firestore, 'music'), orderBy('createdAt', 'desc')) : null
  ), [firestore, currentUser]);
  const { data: musicList } = useCollection<Music>(musicQuery);

  const readingProgressRef = useMemo(() => (
    (firestore && currentUser) ? doc(firestore, 'users', currentUser.uid, 'readingProgress', params.id) : null
  ), [firestore, currentUser, params.id]);
  const { data: userReadingProgress, isLoading: isProgressLoading } = useDoc<ReadingProgress>(readingProgressRef);

  const playTrack = useCallback(async (track: MusicTrack) => {
    if (!audioRef.current) return;
    if ((track.source === 'youtube' && !track.id) || (track.source === 'internal' && !track.url)) return;

    setIsAudioLoading(true);
    setActiveTrack(track);
    setIsPlaying(false);
    
    try {
        let streamUrl: string | null = null;
        if (track.source === 'internal') {
            streamUrl = track.url!;
        } else if (track.source === 'youtube' && track.id) {
            streamUrl = await getPreviewAudioUrl(track.id);
        }

        if (streamUrl) {
            audioRef.current.src = streamUrl;
            await audioRef.current.play();
            setIsPlaying(true);
        } else {
            throw new Error("Tidak dapat menjangkau aliran suara.");
        }
    } catch (err) {
        console.warn("Playback error:", err);
        setIsPlaying(false);
        setActiveTrack(null);
        toast({ variant: 'destructive', title: "Gagal Memutar", description: (err as Error).message });
    } finally {
        setIsAudioLoading(false);
    }
  }, [toast]);

  const handlePlayNext = useCallback(() => {
    if (!book?.playlist || book.playlist.length === 0 || !activeTrack) return;
    const currentIdx = book.playlist.findIndex(t => t.id === activeTrack.id);
    if (currentIdx !== -1 && currentIdx < book.playlist.length - 1) {
        playTrack(book.playlist[currentIdx + 1]);
    } else {
        setIsPlaying(false);
        setActiveTrack(null);
    }
  }, [book?.playlist, activeTrack, playTrack]);

  // Consolidated Audio Lifecycle Management
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    const handleError = () => {
      setIsPlaying(false);
      setIsAudioLoading(false);
      if (audio.currentSrc) { 
        toast({ variant: 'destructive', title: "Kesalahan Audio", description: "Tidak dapat memutar berkas suara." });
      }
    };

    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handlePlayNext);

    return () => {
      if (audio) {
        audio.pause();
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('ended', handlePlayNext);
        audio.removeAttribute('src');
      }
    }
  }, [handlePlayNext, toast]);

  // Effect to restore scroll position
  useEffect(() => {
    const startOver = searchParams.get('start_over') === 'true';
    if (startOver || hasScrolled || isProgressLoading || isChaptersLoading || !userReadingProgress || !scrollContainerRef.current) {
      return;
    }

    const scrollContainer = scrollContainerRef.current;
    const savedPercentage = userReadingProgress.progressPercentage;

    if (savedPercentage > 1) {
      setTimeout(() => {
        if (scrollContainer && !hasScrolled) {
          const scrollHeight = scrollContainer.scrollHeight - scrollContainer.clientHeight;
          if (scrollHeight > 0) {
            const scrollToPixel = (scrollHeight * savedPercentage) / 100;
            scrollContainer.scrollTo({ top: scrollToPixel, behavior: 'auto' });
            setHasScrolled(true); 
          }
        }
      }, 1000);
    } else {
      setHasScrolled(true);
    }
  }, [userReadingProgress, isProgressLoading, isChaptersLoading, chapters, hasScrolled, searchParams]);

  // Effect for periodic auto-saving
  useEffect(() => {
    if (userReadingProgress && lastAutoSavedProgressRef.current === null) {
      lastAutoSavedProgressRef.current = userReadingProgress.progressPercentage;
    }

    const saveInterval = setInterval(() => {
        if (!firestore || !currentUser || !readingProgressRef) return;

        const progressToSave = currentProgressRef.current;
        const lastSaved = lastAutoSavedProgressRef.current ?? 0;

        if (progressToSave > 0 && Math.abs(progressToSave - lastSaved) > 1) {
            setDoc(readingProgressRef, {
                userId: currentUser.uid,
                bookId: params.id,
                progressPercentage: progressToSave,
                lastReadAt: serverTimestamp(),
            }, { merge: true }).then(() => {
                lastAutoSavedProgressRef.current = progressToSave;
            }).catch(err => console.warn("Gagal menyimpan progres secara otomatis", err));
        }
    }, 10000);

    return () => clearInterval(saveInterval);

  }, [firestore, currentUser, readingProgressRef, params.id, userReadingProgress]);

  // Effect to save final progress on unmount
  useEffect(() => {
    return () => {
        if (!firestore || !currentUser || !readingProgressRef) return;
        
        const progressToSave = currentProgressRef.current;

        if (progressToSave > 99) {
            setDoc(readingProgressRef, {
                progressPercentage: 0,
                lastReadAt: serverTimestamp(),
            }, { merge: true }).catch(err => console.warn("Gagal mereset progres", err));
            return;
        }
        
        if (progressToSave < 1) return;

        setDoc(readingProgressRef, {
            userId: currentUser.uid,
            bookId: params.id,
            progressPercentage: progressToSave,
            lastReadAt: serverTimestamp(),
        }, { merge: true }).catch(err => console.warn("Gagal menyimpan progres akhir", err));
    };
  }, [firestore, currentUser, readingProgressRef, params.id]);


  const handleChapterClick = (chapterId: string) => {
    document.getElementById(`chapter-${chapterId}`)?.scrollIntoView({ behavior: 'smooth' });
    setIsSheetOpen(false);
  };

  const filteredInternalMusic = useMemo(() => {
    if (!musicList) return [];
    if (!musicSearchQuery.trim()) return musicList;
    return musicList.filter(m => 
      m.title.toLowerCase().includes(musicSearchQuery.toLowerCase()) ||
      m.artist.toLowerCase().includes(musicSearchQuery.toLowerCase())
    );
  }, [musicList, musicSearchQuery]);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const h = setTimeout(async () => {
        if (musicSearchQuery.trim().length >= 2) {
            setIsSearchingYt(true);
            try { const r = await searchYouTube(musicSearchQuery); setYtResults(r); } catch(e){} finally { setIsSearchingYt(false); }
        }
    }, 600);
    return () => clearTimeout(h);
  }, [musicSearchQuery]);

  const applyTheme = (t: ReadingTheme) => {
    setReadingTheme(t);
    localStorage.setItem('reading-theme', t);
  };

  useEffect(() => {
    setIsMounted(true);
    const savedTheme = (localStorage.getItem('reading-theme') as ReadingTheme) || 'paper';
    applyTheme(savedTheme);
  }, []);

  const handleScroll = () => {
    const c = scrollContainerRef.current;
    if (c) { 
      const scrollableHeight = c.scrollHeight - c.clientHeight;
      const progress = scrollableHeight > 0 ? (c.scrollTop / scrollableHeight) * 100 : 0;
      setReadingProgress(progress);
      currentProgressRef.current = progress;
      setShowScrollToTop(c.scrollTop > 500); 
    }
  };

  if (isBookLoading || !isMounted || isChaptersLoading) return <ReadPageSkeleton />;
  if (!book) return notFound();

  const isPoem = book.type === 'poem';

  const paperStyles = readingTheme === 'paper' ? {
    backgroundImage: `url("${isPoem ? POEM_PAPER_TEXTURE_URL : PAPER_TEXTURE_URL}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    color: '#3e2723'
  } : {};

  return (
    <div 
      className={cn(
        "flex h-full w-full transition-all duration-500 mx-auto overflow-hidden relative bg-background", 
        readingTheme === 'sepia' ? "bg-[#f4ecd8] text-[#5b4636]" : ""
      )}
      style={paperStyles}
    >
      <aside className={cn(
        "hidden md:flex flex-col bg-background/80 backdrop-blur-md border-r transition-all duration-500 z-40 h-full",
        isTocOpen ? "w-96" : "w-0 p-0 overflow-hidden border-none"
      )}>
        <TableOfContents 
            chapters={chapters} 
            isPoem={isPoem} 
            onChapterClick={handleChapterClick}
        />
      </aside>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <header className={cn(
            "flex items-center justify-between px-2 md:px-4 h-16 border-b sticky top-0 z-30 backdrop-blur-md",
            readingTheme === 'paper' ? "bg-white/40 border-black/10" : 
            "bg-background/80"
        )}>
          <div className="flex items-center gap-2">
            <Link href={`/books/${book.id}`} className="shrink-0">
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 md:h-10 md:w-10">
                <ArrowLeft className="h-5 w-5" />
                </Button>
            </Link>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 md:h-10 md:w-10 hidden md:inline-flex" onClick={() => setIsTocOpen(!isTocOpen)}>
                <List className="h-4.5 w-4.5 md:h-5 md:w-5" />
            </Button>
          </div>
          
          <div className="flex flex-col items-center flex-1 min-w-0 mx-1 md:mx-4 text-center">
              <h2 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-40 truncate w-full">
                Reading: {book.title}
              </h2>
              <div className="flex items-center justify-center gap-1.5 text-[7px] md:text-[8px] font-bold text-primary uppercase whitespace-nowrap">
                  {isPoem ? <Feather className="h-2 w-2 md:h-2.5 md:w-2.5" /> : <ScrollText className="h-2 w-2 md:h-2.5 md:w-2.5" />}
                  {isPoem ? 'POETRY MODE' : 'NOVEL MODE'}
              </div>
          </div>

          <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
            <AnimatePresence>
                {activeTrack && (
                    <motion.button 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => {
                          if (!audioRef.current || isAudioLoading) return;
                          if (isPlaying) {
                              audioRef.current.pause();
                              setIsPlaying(false);
                          } else {
                              audioRef.current.play().catch(() => {});
                              setIsPlaying(true);
                          }
                      }} 
                      className="h-9 w-9 md:h-10 md:w-10 flex items-center justify-center relative"
                    >
                        <motion.div 
                          animate={{ rotate: isPlaying ? 360 : 0 }} 
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }} 
                          className={cn(
                            "h-7 w-7 md:h-8 md:w-8 rounded-full bg-zinc-900 border border-white/20 overflow-hidden shadow-lg",
                            isAudioLoading && "opacity-50 animate-pulse"
                          )}
                        >
                            <img src={activeTrack.image} className="w-full h-full object-cover" alt="" />
                        </motion.div>
                        {isAudioLoading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="h-4 w-4 text-white animate-spin" />
                            </div>
                        )}
                    </motion.button>
                )}
            </AnimatePresence>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 md:h-10 md:w-10">
                  <Headphones className={cn("h-4.5 w-4.5 md:h-5 md:w-5", isPlaying && "text-primary animate-pulse")} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-6 rounded-[2rem] border-none shadow-2xl bg-background/95 backdrop-blur-xl" align="end">
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex justify-between text-[10px] font-black uppercase"><span>Volume</span><span>{Math.round(volume*100)}%</span></div>
                        <Slider defaultValue={[volume*100]} max={100} onValueChange={(v)=>setVolume(v[0]/100)} />
                    </div>

                    {book.playlist && book.playlist.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                Playlist Penulis
                            </p>
                            <div className="max-h-40 overflow-y-auto space-y-2 no-scrollbar">
                                {book.playlist.map((track, i) => (
                                    <button 
                                        key={track.id || i}
                                        className={cn(
                                            "flex items-center gap-3 w-full p-2.5 rounded-xl transition-all text-left",
                                            activeTrack?.id === track.id ? "bg-primary/10 text-primary shadow-inner" : "hover:bg-muted/50"
                                        )}
                                        onClick={() => playTrack(track)}
                                    >
                                        <div className="relative">
                                            <img src={track.image} className="h-10 w-10 rounded-lg object-cover shadow-sm" alt="" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-black text-xs truncate italic">"{track.name}"</p>
                                            <p className="text-[8px] font-bold opacity-60 uppercase mt-0.5">{track.artist}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input placeholder="Cari musik lain..." className="pl-9 h-10 rounded-xl bg-muted/30 border-none" value={musicSearchQuery} onChange={(e)=>setMusicSearchQuery(e.target.value)} />
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-2 no-scrollbar">
                        {filteredInternalMusic.map(m => (
                            <Button key={m.id} variant="ghost" className="w-full justify-start h-12 rounded-xl text-xs" onClick={()=>playTrack({
                                name: m.title,
                                artist: m.artist,
                                image: 'https://raw.githubusercontent.com/Zombiesigma/nusakarsa-assets/main/download.webp',
                                id: m.id,
                                source: 'internal',
                                url: m.url
                            })}>"{m.title}"</Button>
                        ))}
                        {ytResults.map((t, i) => (
                            <Button key={t.id || i} variant="ghost" className="w-full justify-start h-12 rounded-xl text-xs text-red-500" onClick={()=>playTrack(t)}><Youtube className="h-3 w-3 mr-2" /> {t.name}</Button>
                        ))}
                    </div>
                </div>
              </PopoverContent>
            </Popover>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 md:h-10 md:w-10 md:hidden">
                    <List className="h-4.5 w-4.5 md:h-5 md:w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-[3rem] h-[80vh] md:h-[70vh] p-0 overflow-hidden z-[300] border-none shadow-[0_-20px_50px_rgba(0,0,0,0.2)] bg-background">
                    <div className="mx-auto w-16 h-1.5 bg-muted rounded-full mt-4 mb-2 shrink-0 opacity-50" />
                    <TableOfContents chapters={chapters} isPoem={isPoem} onChapterClick={handleChapterClick} />
                </SheetContent>
            </Sheet>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 md:h-10 md:w-10">
                  <Settings className="h-4.5 w-4.5 md:h-5 md:w-5"/>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-6 rounded-[2rem] border-none shadow-2xl bg-background/95 backdrop-blur-xl" align="end">
                <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'light', label: 'Light', icon: null },
                          { id: 'sepia', label: 'Sepia', icon: null },
                          { id: 'paper', label: 'Paper', icon: <ScrollText className="h-3 w-3" /> }
                        ].map((t: any) => (
                            <Button 
                                key={t.id} 
                                variant={readingTheme === t.id ? 'default' : 'outline'} 
                                onClick={() => applyTheme(t.id as any)} 
                                className="h-10 text-[10px] uppercase font-black gap-2"
                            >
                                {t.icon}
                                {t.label}
                            </Button>
                        ))}
                    </div>
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-muted-foreground/60">Ukuran Huruf: {fontSize}px</p>
                        <Slider defaultValue={[fontSize]} min={14} max={32} onValueChange={(v)=>setFontSize(v[0])} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {['font-serif','font-sans','font-mono'].map(f=>(<Button key={f} variant={fontFamily===f?'default':'outline'} onClick={()=>setFontFamily(f as any)} className={cn("h-10 text-xs", f)}>Aa</Button>))}
                        {isPoem && ['font-pacifico', 'font-great-vibes', 'font-dancing-script'].map(f=>(
                            <Button key={f} variant={fontFamily===f?'default':'outline'} onClick={()=>setFontFamily(f as any)} className={cn("h-10 text-lg", f)}>Aa</Button>
                        ))}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border/40">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Aset Produksi</p>
                        <div className="grid grid-cols-1 gap-2">
                            {book.fileUrl && (
                                <Button variant="outline" className="w-full justify-start h-11 rounded-xl gap-3 font-bold border-2" asChild>
                                    <a href={book.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <Download className="h-4 w-4 text-primary" /> Unduh Naskah PDF
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        <Progress value={readingProgress} className="w-full h-1 rounded-none bg-muted/20" />
        
        <div 
          ref={scrollContainerRef} 
          onScroll={handleScroll} 
          className="flex-1 overflow-y-auto scroll-smooth relative z-10"
        >
          <div className={cn("w-full mx-auto max-w-4xl px-6 py-12")}>
            <header className="text-center space-y-6 mb-20">
                <h1 className="text-4xl md:text-6xl font-headline font-black italic">{book.title}</h1>
                <div className="flex flex-col items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Mahakarya Narasi Oleh</p>
                    <p className="font-headline text-xl md:text-2xl font-black">{book.authorName}</p>
                </div>
            </header>

            <article 
              className={cn(
                "transition-all duration-500 mx-auto", 
                cn(fontFamily, "prose max-w-lg prose-p:leading-relaxed"),
                isPoem && "text-center italic"
              )} 
              style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
            >
                <>
                    {chapters?.map((chapter) => (
                        <section 
                            key={chapter.id} 
                            id={`chapter-${chapter.id}`} 
                            className="mb-32"
                        >
                            <h2 className="text-3xl font-black mb-14">
                                {chapter.title}
                            </h2>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {chapter.content}
                            </ReactMarkdown>
                        </section>
                    ))}
                </>
            </article>
          </div>
        </div>

        {showScrollToTop && (
            <Button size="icon" className="fixed bottom-8 right-6 rounded-full h-14 w-14 shadow-[0_15px_40px_rgba(0,0,0,0.4)] z-50 bg-primary/90 backdrop-blur hover:bg-primary transition-all active:scale-90" onClick={() => scrollContainerRef.current?.scrollTo({top:0, behavior:'smooth'})}>
                <ChevronsUp className="h-7 w-7 text-white"/>
            </Button>
        )}
      </div>
      <style jsx global>{`
        .prose p { margin-bottom: 1.5em; text-indent: 1.5em; } 
        .prose p:first-of-type { text-indent: 0; }
        
        @media (max-width: 768px) {
            .font-mono article [class*="max-w-"] { width: 90% !important; padding-left: 0 !important; margin-left: auto !important; margin-right: auto !important; }
        }
      `}</style>
    </div>
  );
}

function ReadPageSkeleton() {
  return <div className="max-w-lg mx-auto h-screen p-6 animate-pulse"><Skeleton className="h-12 w-full rounded-2xl mb-10" /><Skeleton className="h-64 w-full rounded-3xl" /></div>
}
