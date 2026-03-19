
'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { notFound, useParams } from 'next/navigation';
import { useFirestore, useUser, useDoc, useCollection } from '@/firebase';
import { doc, updateDoc, collection, serverTimestamp, query, orderBy, writeBatch, increment, deleteDoc, getDocs, where, limit, arrayRemove, arrayUnion } from 'firebase/firestore';
import type { Book, Chapter, User as AppUser, CollaborationInvitation } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  PlusCircle, 
  BookUp, 
  GripVertical, 
  Settings, 
  ChevronLeft, 
  Menu, 
  Maximize2, 
  Minimize2,
  Headset,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Bold,
  Italic,
  Quote,
  Heading1,
  Clock,
  Trash2,
  AlertTriangle,
  Feather,
  Users,
  Send,
  Upload,
  Globe
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { uploadBookCover } from '@/lib/uploader';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MusicSidebar } from '@/components/MusicSidebar';
import { v4 as uuidv4 } from 'uuid';
import { republishBook } from '@/app/actions/book-actions';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const chapterSchema = z.object({
  title: z.string().min(1, "Judul diperlukan."),
  content: z.string().min(1, "Konten diperlukan."),
});

const bookSettingsSchema = z.object({
  title: z.string().min(3).max(100),
  genre: z.string(),
  type: z.enum(['book', 'poem']),
  synopsis: z.string().min(10).max(1000),
  visibility: z.enum(['public', 'followers_only']),
});

const genres = [
  { value: "fantasi", label: "Fantasi" },
  { value: "fiksi-ilmiah", label: "Fiksi Ilmiah" },
  { value: "misteri", label: "Misteri" },
  { value: "thriller", label: "Thriller" },
  { value: "horor", label: "Horor" },
  { value: "romansa", label: "Romansa" },
  { value: "fiksi-sejarah", label: "Fiksi Sejarah" },
  { value: "petualangan", label: "Petualangan" },
  { value: "pengembangan-diri", label: "Pengembangan Diri" },
  { value: "biografi", label: "Biografi" },
  { value: "humor", label: "Humor / Komedi" },
  { value: "spiritual", label: "Spiritual" },
  { value: "sastra-klasik", label: "Sastra Klasik" },
  { value: "puisi", label: "Puisi" },
];


type EditorTab = 'editor' | 'settings' | 'music' | 'collaboration';

export default function EditBookPage() {
  const params = useParams<{ id: string }>();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<EditorTab>('editor');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isDeletingChapter, setIsDeletingChapter] = useState<string | null>(null);
  
  const [collaboratorSearch, setCollaboratorSearch] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<AppUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
  const [isManagingCollabs, setIsManagingCollabs] = useState<string | null>(null);
  
  const novelTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const prevChapterIdRef = useRef<string | null>(null);
  const selectionRef = useRef({ start: 0, end: 0 });

  const bookRef = useMemo(() => (firestore ? doc(firestore, 'books', params.id) : null), [firestore, params.id]);
  const { data: book, isLoading: isBookLoading } = useDoc<Book>(bookRef);
  
  const { data: userProfile } = useDoc<AppUser>(
    (firestore && currentUser) ? doc(firestore, 'users', currentUser.uid) : null
  );

  const chaptersQuery = useMemo(() => (
    firestore ? query(collection(firestore, 'books', params.id, 'chapters'), orderBy('order', 'asc')) : null
  ), [firestore, params.id]);
  const { data: chapters, isLoading: areChaptersLoading } = useCollection<Chapter>(chaptersQuery);

  const invitationsQuery = useMemo(() => (
      firestore ? query(collection(firestore, 'collaborationInvitations'), where('bookId', '==', params.id)) : null
  ), [firestore, params.id]);
  const { data: invitations, isLoading: areInvitesLoading } = useCollection<CollaborationInvitation>(invitationsQuery);
    
  const collaboratorUsersQuery = useMemo(() => {
      if (!firestore || !book || !book.collaboratorUids || book.collaboratorUids.length === 0) return null;
      return query(collection(firestore, 'users'), where('uid', 'in', book.collaboratorUids));
  }, [firestore, book]);
  const { data: collaboratorUsers, isLoading: areCollabsLoading } = useCollection<AppUser>(collaboratorUsersQuery);

  const chapterForm = useForm<z.infer<typeof chapterSchema>>({
    resolver: zodResolver(chapterSchema),
    defaultValues: { title: '', content: '' },
  });

  const settingsForm = useForm<z.infer<typeof bookSettingsSchema>>({
    resolver: zodResolver(bookSettingsSchema),
  });
  
  const isAuthor = currentUser?.uid === book?.authorId;
  const canEdit = isAuthor || !!book?.collaboratorUids?.includes(currentUser?.uid ?? '') || userProfile?.role === 'admin';
  const isReviewing = book?.status === 'pending_review' && userProfile?.role !== 'admin';
  const isCompleted = book?.isCompleted === true;

  useEffect(() => {
    if (book) {
      settingsForm.reset({
        title: book.title,
        synopsis: book.synopsis,
        genre: book.genre,
        type: book.type || "book",
        visibility: book.visibility || "public",
      });
    }
  }, [book, settingsForm]);

  useEffect(() => {
    if (!chapters) return;
    if (chapters.length > 0 && !activeChapterId && activeTab === 'editor') {
      setActiveChapterId(chapters[0].id);
    }
    if (activeChapterId && activeChapterId !== prevChapterIdRef.current) {
        const activeChapter = chapters.find(c => c.id === activeChapterId);
        if (activeChapter) {
            chapterForm.reset({ title: activeChapter.title, content: activeChapter.content });
            prevChapterIdRef.current = activeChapterId;
        }
    }
  }, [chapters, activeChapterId, activeTab, chapterForm]);

  const saveCurrentChapter = async () => {
    if (!firestore || !activeChapterId || !chapterForm.formState.isDirty || isReviewing || isCompleted || !canEdit) return;
    try {
        const chapterRef = doc(firestore, 'books', params.id, 'chapters', activeChapterId);
        const values = chapterForm.getValues();
        await updateDoc(chapterRef, values);
        chapterForm.reset(values);
        setLastSaved(new Date());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const interval = setInterval(() => {
        if (activeTab === 'editor' && chapterForm.formState.isDirty && !isReviewing && !isCompleted && canEdit) saveCurrentChapter();
    }, 15000);
    return () => clearInterval(interval);
  }, [activeTab, chapterForm.formState.isDirty, isReviewing, isCompleted, activeChapterId, canEdit]);

  useEffect(() => {
    if (!firestore || collaboratorSearch.trim().length < 2) {
      setSearchedUsers([]);
      return;
    }

    const searchUsers = async () => {
      setIsSearchingUsers(true);
      const term = collaboratorSearch.toLowerCase();
      const usersRef = collection(firestore, 'users');
      // In a real-world scenario, this should be a more efficient, indexed search.
      // For this context, fetching and filtering is a workable approach for a small userbase.
      const usersSnap = await getDocs(usersRef);
      const allUsers = usersSnap.docs.map(doc => doc.data() as AppUser);
      const results = allUsers.filter(u =>
        (u.displayName.toLowerCase().includes(term) || u.username.toLowerCase().includes(term)) &&
        u.uid !== currentUser?.uid &&
        !book?.collaboratorUids?.includes(u.uid) &&
        !invitations?.some(inv => inv.collaboratorId === u.uid && inv.status === 'pending')
      ).slice(0, 5);
      
      setSearchedUsers(results);
      setIsSearchingUsers(false);
    }

    const timer = setTimeout(searchUsers, 500);
    return () => clearTimeout(timer);
  }, [collaboratorSearch, firestore, currentUser, book, invitations]);


  const handleTabSwitch = async (tab: EditorTab) => {
    if (tab === activeTab) return;
    if (activeTab === 'editor' && chapterForm.formState.isDirty) await saveCurrentChapter();
    setActiveTab(tab);
    if (tab !== 'editor') { setActiveChapterId(null); prevChapterIdRef.current = null; }
    setIsMobileSidebarOpen(false);
  };

  const handleChapterSelection = async (chapterId: string) => {
    if (chapterId === activeChapterId) { setIsMobileSidebarOpen(false); return; }
    if (chapterForm.formState.isDirty) await saveCurrentChapter();
    setActiveTab('editor');
    setActiveChapterId(chapterId);
    setIsMobileSidebarOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'File Terlalu Besar', description: 'Maksimal 5MB untuk sampul.' });
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSettingsSubmit = async (values: z.infer<typeof bookSettingsSchema>) => {
    if (!firestore || !bookRef || !canEdit || !book) return;
    setIsSavingSettings(true);
    try {
      let coverUrl = book.coverUrl || '';
      if (selectedFile) {
        coverUrl = await uploadBookCover(selectedFile, values.type, values.title);
      }
      await updateDoc(bookRef, { ...values, coverUrl });
      settingsForm.reset(values);
      setSelectedFile(null);
      setPreviewUrl(null);
      toast({ variant: "success", title: "Identitas Diperbarui" });
    } catch (error: any) { 
        toast({ variant: "destructive", title: "Gagal Menyimpan", description: error.message }); 
    } finally { 
        setIsSavingSettings(false); 
    }
  };


  const handlePublish = async () => {
    if (!firestore || !bookRef || !isAuthor || !book) return;
    setIsPublishing(true);
    
    try {
      if (activeTab === 'editor' && chapterForm.formState.isDirty) {
        await saveCurrentChapter();
      }

      if (book.status === 'published') {
        toast({ title: "Menerbitkan Ulang...", description: "Sedang membuat versi PDF baru, mohon tunggu." });
        const result = await republishBook(book.id);
        if (result.success) {
            toast({ variant: "success", title: "Karya Berhasil Diperbarui", description: "Naskah PDF terbaru telah dibuat." });
        } else {
            throw new Error(result.error);
        }
      } else {
        await updateDoc(bookRef, { status: 'pending_review' });
        toast({ variant: "success", title: "Karya Terkirim untuk Moderasi" });
      }

      setIsReviewDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal Menerbitkan", description: error.message || "Terjadi kesalahan." });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleMarkAsCompleted = async () => {
    if (!firestore || !bookRef || !isAuthor) return;
    setIsCompleting(true);
    try {
      await updateDoc(bookRef, { isCompleted: true });
      toast({ variant: "success", title: "Mahakarya Selesai!" });
    } catch (error) { toast({ variant: "destructive", title: "Gagal Menamatkan" }); } finally { setIsCompleting(false); }
  };

  const handleAddChapter = async () => {
    if (!firestore || !bookRef || isReviewing || isCompleted || !canEdit) return;
    if (chapterForm.formState.isDirty) await saveCurrentChapter();
    const newOrder = chapters ? chapters.length + 1 : 1;
    const batch = writeBatch(firestore);
    const newChapterDoc = doc(collection(firestore, 'books', params.id, 'chapters'));
    
    const initialContent = "Mulai tulis...";

    batch.set(newChapterDoc, {
        title: book?.type === 'poem' ? `BAIT ${newOrder}` : `Bab ${newOrder}`,
        content: initialContent,
        order: newOrder,
        createdAt: serverTimestamp()
    });
    batch.update(bookRef, { chapterCount: increment(1) });
    await batch.commit();
    setActiveChapterId(newChapterDoc.id);
    setActiveTab('editor');
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!firestore || !bookRef || isReviewing || isCompleted || !canEdit || (chapters && chapters.length <= 1)) return;
    
    setIsDeletingChapter(null);
    try {
        const batch = writeBatch(firestore);
        batch.delete(doc(firestore, 'books', params.id, 'chapters', chapterId));
        batch.update(bookRef, { chapterCount: increment(-1) });
        await batch.commit();
        
        if (activeChapterId === chapterId && chapters) {
            const remaining = chapters.filter(c => c.id !== chapterId);
            if (remaining.length > 0) setActiveChapterId(remaining[0].id);
            else setActiveChapterId(null);
        }
        
        toast({ title: "Bab Dihapus" });
    } catch (e) {
        toast({ variant: 'destructive', title: "Gagal Menghapus" });
    }
  };

  const insertMarkdown = useCallback((prefix: string, suffix: string = '') => {
    const textarea = novelTextareaRef.current;
    if (!textarea) return;

    const { start, end } = selectionRef.current;
    const text = textarea.value;

    const selection = text.substring(start, end);
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    const newContent = `${before}${prefix}${selection}${suffix}${after}`;

    chapterForm.setValue('content', newContent, { shouldDirty: true });

    setTimeout(() => {
        textarea.focus();
        if (selection.length > 0) {
            const newStart = start + prefix.length;
            const newEnd = newStart + selection.length;
            textarea.setSelectionRange(newStart, newEnd);
        } else {
            const newPos = start + prefix.length;
            textarea.setSelectionRange(newPos, newPos);
        }
    }, 0);
  }, [chapterForm]);

  const novelStats = useMemo(() => {
    const content = chapterForm.watch('content') || "";
    const words = content.split(/\s+/).filter(Boolean).length;
    const minutes = Math.ceil(words / 200);
    return { words, minutes };
  }, [chapterForm.watch('content')]);

  const handleInviteCollaborator = async (invitedUser: AppUser) => {
    if (!firestore || !currentUser || !userProfile || !book) return;

    if (invitedUser.uid === currentUser.uid) {
        toast({ variant: 'destructive', title: "Tidak bisa mengundang diri sendiri." });
        return;
    }

    setInvitingUserId(invitedUser.uid);
    try {
        if (book.collaboratorUids?.includes(invitedUser.uid)) {
            toast({ variant: 'destructive', title: "Sudah Menjadi Kolaborator" });
            return;
        }
        if (invitations?.some(inv => inv.collaboratorId === invitedUser.uid && inv.status === 'pending')) {
             toast({ variant: 'destructive', title: "Undangan Sudah Terkirim" });
             return;
        }

        const invitesRef = collection(firestore, 'collaborationInvitations');
        const newInviteRef = doc(invitesRef);
        
        const batch = writeBatch(firestore);

        batch.set(newInviteRef, {
            bookId: params.id,
            bookTitle: book.title,
            bookCoverUrl: book.coverUrl,
            ownerId: currentUser.uid,
            ownerName: userProfile.displayName,
            collaboratorId: invitedUser.uid,
            collaboratorEmail: invitedUser.email,
            status: 'pending',
            createdAt: serverTimestamp(),
        });

        const notifRef = doc(collection(firestore, 'users', invitedUser.uid, 'notifications'));
        batch.set(notifRef, {
            type: 'collaboration_invite',
            text: `${userProfile.displayName} mengundang Anda untuk berkolaborasi di karya "${book.title}".`,
            link: `/invitations/${newInviteRef.id}`,
            actor: {
                uid: currentUser.uid,
                displayName: userProfile.displayName,
                photoURL: userProfile.photoURL,
            },
            read: false,
            createdAt: serverTimestamp(),
        });

        await batch.commit();

        toast({ variant: 'success', title: "Undangan Terkirim", description: `Undangan kolaborasi telah dikirim ke ${invitedUser.displayName}.` });
        setCollaboratorSearch('');
        setSearchedUsers([]);

    } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: "Gagal Mengundang" });
    } finally {
        setInvitingUserId(null);
    }
  };
    
  const handleManageCollaborator = async (target: {type: 'invite', id: string} | {type: 'collaborator', uid: string}) => {
    if (!firestore || !bookRef || !book || !currentUser || !userProfile) return;
    
    const targetId = 'id' in target ? target.id : target.uid;
    setIsManagingCollabs(targetId);
    
    try {
        const batch = writeBatch(firestore);
        if(target.type === 'invite') {
            const inviteRef = doc(firestore, 'collaborationInvitations', target.id);
            batch.delete(inviteRef);
            toast({ title: 'Undangan Dibatalkan'});
        } else {
            batch.update(bookRef, {
                collaboratorUids: arrayRemove(target.uid)
            });
            
             const collaboratorNotifRef = doc(collection(firestore, `users/${target.uid}/notifications`));
             batch.set(collaboratorNotifRef, {
                type: 'broadcast',
                text: `Akses kolaborasi Anda untuk karya "${book.title}" telah dihapus oleh pemilik.`,
                link: `/studio`,
                actor: { uid: currentUser.uid, displayName: userProfile.displayName, photoURL: userProfile.photoURL, },
                read: false,
                createdAt: serverTimestamp(),
             });

            toast({ title: 'Kolaborator Dihapus' });
        }
        await batch.commit();
    } catch(e) {
        toast({ variant: 'destructive', title: 'Gagal' });
    } finally {
        setIsManagingCollabs(null);
    }
  }


  if (isBookLoading || areChaptersLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  if (!book) notFound();

  const isPoem = book.type === 'poem';
  const activeChapter = chapters?.find(c => c.id === activeChapterId);

  const SidebarContentBody = () => (
    <div className="flex flex-col h-full bg-background">
        <div className="p-6 border-b">
            <Link href={`/books/${book.id}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary mb-4 group">
                <ChevronLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" /> Kembali
            </Link>
            <div className="flex items-center gap-2 mb-1">
                <div className={cn("p-1.5 rounded-lg", isPoem ? "bg-rose-500/10 text-rose-600" : "bg-primary/10 text-primary")}>
                    {isPoem ? <Feather className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                </div>
                <p className="text-[10px] uppercase font-black tracking-widest opacity-60">{isPoem ? 'Poetry Studio' : 'Novel Studio'}</p>
            </div>
            <h2 className="font-headline text-xl font-bold truncate italic">"{book.title}"</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            <div className="grid grid-cols-1 gap-2">
                <Button variant={activeTab === 'settings' ? "secondary" : "ghost"} className="w-full justify-start h-11 px-3 rounded-xl gap-2 hover:bg-primary/5" onClick={() => handleTabSwitch('settings')}><Settings className="h-4 w-4" /><span className="text-xs font-bold">Identitas</span></Button>
                <Button variant={activeTab === 'music' ? "secondary" : "ghost"} className="w-full justify-start h-11 px-3 rounded-xl gap-2 hover:bg-primary/5" onClick={() => handleTabSwitch('music')}><Headset className="h-4 w-4" /><span className="text-xs font-bold">Musik</span></Button>
                <Button variant={activeTab === 'collaboration' ? "secondary" : "ghost"} className="w-full justify-start h-11 px-3 rounded-xl gap-2 hover:bg-primary/5" onClick={() => handleTabSwitch('collaboration')}><Users className="h-4 w-4" /><span className="text-xs font-bold">Kolaborasi</span></Button>
            </div>
            
            <div className="space-y-1 pt-4 border-t">
                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-2 mb-2 flex justify-between items-center">
                    <span>{isPoem ? 'Daftar Bait' : 'Daftar Bagian'}</span>
                    <Badge variant="outline" className="text-[8px] h-4 px-1.5">{chapters?.length || 0}</Badge>
                </div>
                {chapters?.map(chapter => (
                    <div key={chapter.id} className="group/item relative">
                        <Button 
                            variant={activeChapterId === chapter.id ? "secondary" : "ghost"} 
                            className={cn(
                                "w-full justify-start h-11 px-4 rounded-xl group transition-all hover:bg-primary/5",
                                activeChapterId === chapter.id ? "pr-10" : "hover:pr-10"
                            )} 
                            onClick={() => handleChapterSelection(chapter.id)}
                        >
                            <GripVertical className="h-4 w-4 opacity-30 shrink-0" />
                            <span className="truncate text-sm ml-2 font-medium">{chapter.title}</span>
                        </Button>
                        {!isReviewing && !isCompleted && canEdit && chapters.length > 1 && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsDeletingChapter(chapter.id); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-rose-500 opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-rose-50 rounded-lg"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
        <div className="p-4 border-t space-y-2">
            <Button variant="outline" className="w-full h-11 rounded-xl border-dashed border-2 font-bold hover:bg-primary/5 hover:text-primary transition-all" onClick={handleAddChapter} disabled={isReviewing || isCompleted || !canEdit}>
                <PlusCircle className="mr-2 h-4 w-4" /> {isPoem ? 'Tambah Bait' : 'Tambah Bab'}
            </Button>
            {isAuthor && !isCompleted && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="secondary" className="w-full h-11 rounded-xl text-emerald-600 bg-emerald-50 hover:bg-emerald-100 font-black uppercase text-[10px] tracking-widest" disabled={isReviewing || isCompleting}>
                            {isCompleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Tandai Tamat
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8">
                        <AlertDialogHeader>
                            <div className="mx-auto bg-emerald-50 p-4 rounded-2xl w-fit mb-4"><CheckCircle2 className="h-8 w-8 text-emerald-600" /></div>
                            <AlertDialogTitle className="font-headline text-2xl font-black text-center">Selesaikan Karya?</AlertDialogTitle>
                            <AlertDialogDescription className="text-center font-medium">Karya Anda akan mendapatkan lencana "Tamat" dan terkunci dari perubahan di masa mendatang.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-8 flex gap-3"><AlertDialogCancel className="rounded-full h-12 flex-1 border-2 font-bold">Batal</AlertDialogCancel><AlertDialogAction onClick={handleMarkAsCompleted} className="rounded-full h-12 flex-1 bg-emerald-600 font-black shadow-lg shadow-emerald-500/20">Ya, Tamatkan</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    </div>
  );

  return (
    <div className={cn("flex h-full overflow-hidden bg-muted/30", isZenMode && "h-screen m-0 z-[300] fixed inset-0")}>
      {!isZenMode && (
        <aside className="hidden md:flex flex-col w-72 lg:w-80 border-r shrink-0 shadow-sm relative z-[150]">
            <SidebarContentBody />
        </aside>
      )}
      
      <main className="flex-1 flex flex-col min-w-0 bg-background relative">
         {!isZenMode && (
            <header className="h-auto min-h-[5rem] md:min-h-[4rem] border-b flex items-center justify-between px-4 md:px-6 bg-background/95 backdrop-blur-md z-[110] shrink-0 shadow-sm pt-[max(1.5rem,env(safe-area-inset-top))] md:pt-0">
                <div className="flex items-center gap-4">
                    <div className="md:hidden">
                      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
                        <SheetTrigger asChild><Button variant="ghost" size="icon" className="rounded-xl"><Menu className="h-5 w-5"/></Button></SheetTrigger>
                        <SheetContent side="left" className="p-0 w-80">
                          <SheetHeader className="sr-only">
                            <SheetTitle>Navigasi Editor</SheetTitle>
                          </SheetHeader>
                          <SidebarContentBody />
                        </SheetContent>
                      </Sheet>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Link href={`/books/${book.id}`} className="hidden md:flex items-center justify-center h-9 w-9 rounded-xl bg-muted hover:bg-primary/10 hover:text-primary transition-all">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div className="flex flex-col">
                            <h3 className="font-black text-xs md:text-sm truncate max-w-[150px] md:max-w-[300px] italic">
                                {book.title}
                            </h3>
                            <p className="text-[9px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                                {activeTab === 'settings' ? 'Pengaturan' : activeTab === 'music' ? 'Musik' : activeTab === 'collaboration' ? 'Kolaborasi' : (activeChapter?.title || "Editor")}
                                {chapterForm.formState.isDirty && <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 transition-all">
                        <motion.div animate={{ scale: lastSaved ? [1, 1.2, 1] : 1 }} className={cn("h-1.5 w-1.5 rounded-full transition-colors", lastSaved ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-orange-500")} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                            {lastSaved ? `Tersimpan ${lastSaved.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : 'Menyimpan draf...'}
                        </span>
                    </div>
                    
                    <div className="h-8 w-px bg-border/50 hidden md:block" />

                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-muted-foreground hover:text-primary" onClick={() => setIsZenMode(true)}>
                            <Maximize2 className="h-4 w-4" />
                        </Button>
                        {isAuthor && (
                            <Button 
                                size="sm" 
                                className="rounded-full px-6 font-black text-[10px] uppercase tracking-widest h-9 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95" 
                                disabled={isPublishing} 
                                onClick={() => setIsReviewDialogOpen(true)}
                            >
                                <BookUp className="mr-2 h-3.5 w-3.5" /> Terbitkan
                            </Button>
                        )}
                    </div>
                </div>
            </header>
         )}

         {isZenMode && <Button variant="ghost" size="icon" className="fixed top-[calc(1.5rem+env(safe-area-inset-top))] right-6 z-[310] rounded-full bg-background/50 backdrop-blur" onClick={() => setIsZenMode(false)}><Minimize2 className="h-5 w-5" /></Button>}

        <div className={cn("flex-1 overflow-y-auto scrollbar-hide", activeTab === 'editor' && !isZenMode && "bg-muted/20")}>
            <AnimatePresence mode="wait">
                {activeTab === 'settings' ? (
                    <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto py-12 px-6">
                        <Form {...settingsForm}>
                            <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)}>
                                <div className="grid lg:grid-cols-12 gap-12 items-start">
                                    <div className="lg:col-span-5 lg:sticky lg:top-8">
                                        <Card className="rounded-[2.5rem] border-none shadow-xl bg-card overflow-hidden">
                                            <CardHeader className="bg-primary/5 border-b border-primary/10">
                                                <CardTitle className="text-lg font-headline font-bold">Sampul Karya</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-8">
                                                <div 
                                                    className="aspect-[2/3] bg-muted rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-all shadow-lg"
                                                    onClick={() => document.getElementById('cover-upload')?.click()}
                                                >
                                                    <Image 
                                                        src={previewUrl || book?.coverUrl || ''} 
                                                        alt="Sampul" 
                                                        fill 
                                                        className="object-cover transition-transform group-hover:scale-105 duration-500" 
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                                                        <Upload className="h-8 w-8 text-white" />
                                                    </div>
                                                </div>
                                                <input id="cover-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                                <p className="text-[9px] text-center text-muted-foreground mt-4 font-bold uppercase tracking-widest">Klik untuk mengubah sampul</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                    <div className="lg:col-span-7 space-y-8">
                                        <FormField control={settingsForm.control} name="title" render={({ field }) => ( <FormItem><FormLabel className="font-bold">Judul Karya</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={settingsForm.control} name="synopsis" render={({ field }) => ( <FormItem><FormLabel className="font-bold">Sinopsis</FormLabel><FormControl><Textarea rows={6} {...field} className="rounded-2xl" /></FormControl><FormMessage /></FormItem>)} />
                                        <div className="grid grid-cols-2 gap-6">
                                            <FormField control={settingsForm.control} name="genre" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold">Genre</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>{genres.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}/>
                                            <FormField control={settingsForm.control} name="type" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold">Tipe</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent><SelectItem value="book">Novel</SelectItem><SelectItem value="poem">Puisi</SelectItem></SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}/>
                                        </div>
                                        <FormField control={settingsForm.control} name="visibility" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold">Visibilitas</FormLabel>
                                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4 pt-2">
                                                    <Label className={cn("flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer", field.value === 'public' ? "border-primary bg-primary/5" : "bg-muted/50 border-transparent")}>
                                                        <Globe className="h-5 w-5"/>
                                                        <RadioGroupItem value="public" className="sr-only"/>
                                                        <span className="font-bold text-xs">Publik</span>
                                                    </Label>
                                                    <Label className={cn("flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer", field.value === 'followers_only' ? "border-primary bg-primary/5" : "bg-muted/50 border-transparent")}>
                                                        <Users className="h-5 w-5"/>
                                                        <RadioGroupItem value="followers_only" className="sr-only"/>
                                                        <span className="font-bold text-xs">Pengikut</span>
                                                    </Label>
                                                </RadioGroup>
                                            </FormItem>
                                        )}/>
                                    </div>
                                </div>
                                <div className="flex justify-end mt-12"><Button type="submit" size="lg" className="rounded-full px-10 h-14 font-black shadow-xl" disabled={isSavingSettings || !canEdit}>Simpan Perubahan</Button></div>
                            </form>
                        </Form>
                    </motion.div>
                ) : activeTab === 'music' ? (
                    <div key="music" className="max-w-2xl mx-auto py-12 px-6 h-full"><MusicSidebar bookId={params.id} /></div>
                ) : activeTab === 'collaboration' ? (
                  <motion.div key="collaboration" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto py-12 px-6 space-y-12">
                      {isAuthor && (
                        <div className="space-y-4">
                            <h3 className="font-headline font-black text-2xl">Undang Kolaborator</h3>
                            <div className="relative">
                                <Input
                                    placeholder="Cari nama atau username penulis..."
                                    value={collaboratorSearch}
                                    onChange={(e) => setCollaboratorSearch(e.target.value)}
                                    className="h-12 rounded-xl bg-muted/30 border-none px-5"
                                />
                                {isSearchingUsers && <Loader2 className="h-4 w-4 animate-spin absolute right-4 top-1/2 -translate-y-1/2" />}
                            </div>
                            
                            {searchedUsers.length > 0 && (
                                <div className="space-y-2 pt-2">
                                    {searchedUsers.map(u => (
                                        <div key={u.uid} className="flex items-center justify-between p-2 bg-card rounded-xl shadow-sm border">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10"><AvatarImage src={u.photoURL} /><AvatarFallback>{u.displayName[0]}</AvatarFallback></Avatar>
                                                <div>
                                                    <p className="font-bold text-sm">{u.displayName}</p>
                                                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                className="rounded-lg h-9"
                                                onClick={() => handleInviteCollaborator(u)}
                                                disabled={invitingUserId === u.uid}
                                            >
                                                {invitingUserId === u.uid ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                                                <span className="ml-2 hidden sm:inline">Undang</span>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <p className="text-xs text-muted-foreground px-1">Penulis yang diundang akan menerima notifikasi untuk menyetujui kolaborasi.</p>
                        </div>
                      )}

                      <div className="space-y-6">
                          <h3 className="font-headline font-black text-2xl">Tim Kolaborasi</h3>
                          {areCollabsLoading || areInvitesLoading ? (
                            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>
                          ) : (
                            <>
                                {collaboratorUsers && collaboratorUsers.map(collabUser => (
                                    <div key={collabUser.id} className="flex items-center justify-between p-4 bg-card rounded-2xl shadow-sm border">
                                        <div className="flex items-center gap-4">
                                            <Avatar><AvatarImage src={collabUser.photoURL} /><AvatarFallback>{collabUser.displayName[0]}</AvatarFallback></Avatar>
                                            <div>
                                                <p className="font-bold">{collabUser.displayName}</p>
                                                <p className="text-xs text-muted-foreground">@{collabUser.username}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleManageCollaborator({type: 'collaborator', uid: collabUser.uid})} disabled={!!isManagingCollabs || !isAuthor}>
                                            {isManagingCollabs === collabUser.uid ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                                        </Button>
                                    </div>
                                ))}

                                {invitations && invitations.filter(inv => inv.status === 'pending').map(invite => (
                                    <div key={invite.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl shadow-sm border">
                                        <div className="flex items-center gap-4">
                                            <Avatar><AvatarFallback>?</AvatarFallback></Avatar>
                                            <div>
                                                <p className="font-bold">{invite.collaboratorEmail}</p>
                                                <Badge variant="outline">Menunggu Persetujuan</Badge>
                                            </div>
                                        </div>
                                         <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleManageCollaborator({type: 'invite', id: invite.id})} disabled={!!isManagingCollabs || !isAuthor}>
                                            {isManagingCollabs === invite.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                                        </Button>
                                    </div>
                                ))}

                                {(!invitations || invitations.length === 0) && (!collaboratorUsers || collaboratorUsers.length === 0) && (
                                    <p className="text-muted-foreground text-center py-8">Belum ada kolaborator.</p>
                                )}
                            </>
                          )}
                      </div>
                  </motion.div>
                ) : activeChapter ? (
                    <motion.div key={activeChapterId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn("min-h-full py-12 px-4 md:px-12 flex flex-col items-center")}>
                        {!isZenMode && (
                            <div className="w-full max-w-[850px] flex items-center justify-start md:justify-center gap-1 mb-10 p-2 px-4 bg-background/80 backdrop-blur-xl border border-primary/10 rounded-[2.5rem] shadow-[0_15px_40px_-15px_rgba(59,130,246,0.2)] sticky top-4 z-[120] overflow-x-auto no-scrollbar ring-1 ring-white/20">
                                <Button variant="ghost" onClick={() => insertMarkdown('**', '**')} className="h-10 w-10 p-0 rounded-xl hover:bg-primary/10 hover:text-primary"><Bold className="h-4 w-4"/></Button>
                                <Button variant="ghost" onClick={() => insertMarkdown('*', '*')} className="h-10 w-10 p-0 rounded-xl hover:bg-primary/10 hover:text-primary"><Italic className="h-4 w-4"/></Button>
                                <Button variant="ghost" onClick={() => insertMarkdown('> ')} className="h-10 w-10 p-0 rounded-xl hover:bg-primary/10 hover:text-primary"><Quote className="h-4 w-4"/></Button>
                                <Button variant="ghost" onClick={() => insertMarkdown('### ')} className="h-10 w-10 p-0 rounded-xl hover:bg-primary/10 hover:text-primary"><Heading1 className="h-4 w-4"/></Button>
                                <div className="w-px h-10 bg-primary/10 mx-2 shrink-0" />
                                <p className="text-[9px] font-black uppercase tracking-widest text-primary/40 px-2">{isPoem ? 'Industrial Poetry Mode' : 'Industrial Novel Mode'}</p>
                            </div>
                        )}

                        <div className="w-full max-w-3xl">
                            <Form {...chapterForm}><form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                                <FormField control={chapterForm.control} name="title" render={({ field }) => (
                                    <FormItem className="mb-10">
                                        <FormControl>
                                            <Input 
                                                placeholder={isPoem ? "Judul Bait..." : "Judul Bab..."} 
                                                {...field} 
                                                className="border-none shadow-none focus-visible:ring-0 h-auto p-0 transition-colors text-center text-3xl md:text-5xl font-headline font-black"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )} />
                                
                                <div className="bg-white rounded-[2.5rem] shadow-[0_20px_80px_-20px_rgba(0,0,0,0.1)] p-8 md:p-16 border border-zinc-100 min-h-[80vh] relative group/paper">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                                    <FormField control={chapterForm.control} name="content" render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    onSelect={(e) => {
                                                        const target = e.currentTarget;
                                                        selectionRef.current = { start: target.selectionStart, end: target.selectionEnd };
                                                    }}
                                                    ref={(e) => {
                                                        field.ref(e);
                                                        novelTextareaRef.current = e;
                                                    }}
                                                    placeholder={isPoem ? "Tuangkan bait-bait indahmu..." : "Mulai tuangkan narasimu..."}
                                                    className={cn(
                                                        "min-h-[70vh] border-none shadow-none px-0 focus-visible:ring-0 resize-none no-scrollbar text-lg md:text-2xl font-serif leading-[1.8] text-zinc-800",
                                                        isPoem && "text-center italic"
                                                    )}
                                                    readOnly={!canEdit}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )} />
                                    
                                    {!isZenMode && (
                                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] hidden md:flex items-center gap-6 px-8 py-3 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl text-white/60">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-3 w-3 text-primary" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{novelStats.words} Kata</span>
                                            </div>
                                            <div className="w-px h-4 bg-white/10" />
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3 w-3 text-emerald-400" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Est. {novelStats.minutes} Menit Baca</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </form></Form>
                        </div>
                    </motion.div>
                ) : (
                    <div key="empty" className="flex flex-col items-center justify-center h-full opacity-30 p-12 text-center">
                        <FileText className="h-16 w-16 mb-6" />
                        <h4 className="text-2xl font-headline font-bold">
                            {isPoem ? 'Pilih atau Buat Bait Baru' : 'Pilih atau Buat Bab Baru'}
                        </h4>
                        {canEdit && <Button onClick={handleAddChapter} className="mt-6 rounded-full px-8">Buat Sekarang</Button>}
                    </div>
                )}
            </AnimatePresence>
        </div>
      </main>

      <AlertDialog open={!!isDeletingChapter} onOpenChange={(open) => !open && setIsDeletingChapter(null)}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8">
            <AlertDialogHeader>
                <div className="mx-auto bg-rose-50 p-4 rounded-2xl w-fit mb-4"><AlertTriangle className="h-8 w-8 text-rose-500" /></div>
                <AlertDialogTitle className="font-headline text-2xl font-black text-center">Hapus Bagian?</AlertDialogTitle>
                <AlertDialogDescription className="text-center font-medium">Tindakan ini permanen. Seluruh bait atau paragraf di bagian ini akan hilang dari sejarah naskah.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 flex gap-3"><AlertDialogCancel className="rounded-full h-12 flex-1 border-2 font-bold">Batal</AlertDialogCancel><AlertDialogAction onClick={() => isDeletingChapter && handleDeleteChapter(isDeletingChapter)} className="rounded-full h-12 flex-1 bg-rose-500 font-black shadow-lg shadow-rose-500/20">Ya, Hapus</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8">
            <AlertDialogHeader>
                <div className="mx-auto bg-primary/10 p-4 rounded-2xl w-fit mb-4"><BookUp className="h-8 w-8 text-primary" /></div>
                <AlertDialogTitle className="font-headline text-2xl font-black text-center">
                    {book?.status === 'published' ? 'Perbarui & Terbitkan Ulang?' : book?.status === 'rejected' ? 'Kirim Ulang untuk Moderasi?' : 'Terbitkan Karya?'}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-center font-medium">
                    {book?.status === 'published' 
                        ? "Perubahan pada karya Anda akan langsung terbit dan versi PDF baru akan dibuat secara otomatis." 
                        : book?.status === 'rejected'
                        ? "Karya ini sebelumnya ditolak. Setelah Anda merevisinya, kirim ulang agar dapat ditinjau kembali oleh tim kurasi."
                        : "Karya Anda akan dikirim ke tim kurasi Nusakarsa sebelum tampil secara resmi di hadapan seluruh pembaca."
                    }
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 flex flex-col sm:flex-row gap-2">
                <AlertDialogCancel className="rounded-full h-12 border-2 flex-1 font-bold">Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handlePublish} className="rounded-full h-12 flex-1 font-black bg-primary shadow-xl shadow-primary/20">
                    {book?.status === 'published' ? 'Ya, Terbitkan Ulang' : book?.status === 'rejected' ? 'Kirim Ulang' : 'Kirim Sekarang'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
