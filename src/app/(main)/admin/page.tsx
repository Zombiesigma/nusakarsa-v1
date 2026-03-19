

'use client';

import { useMemo, useState } from "react";
import { useFirestore, useCollection, useUser, useDoc } from '@/firebase';
import { collection, query, doc, writeBatch, updateDoc, where, deleteDoc, getDoc, getDocs, serverTimestamp, addDoc } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Users, 
  ShieldCheck, 
  BookOpen, 
  Megaphone, 
  CheckCircle2, 
  Trash2, 
  Flame, 
  ChevronRight,
  PenTool,
  Activity,
  ShieldAlert,
  FileText,
  Music2,
  Smartphone,
  MapPin,
  XCircle
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
} from "@/components/ui/alert-dialog";
import type { AuthorRequest, Book, User as AppUser } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateBookPdf } from "@/app/actions/pdf-generator";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionTarget, setRejectionTarget] = useState<{id: string, name: string, type: 'author' | 'book'} | null>(null);

  const { data: adminProfile, isLoading: isAdminChecking } = useDoc<AppUser>(
    (firestore && currentUser) ? doc(firestore, 'users', currentUser.uid) : null
  );

  const isAdmin = adminProfile?.role === 'admin';

  const authorRequestsQuery = useMemo(() => (
    (firestore && currentUser && isAdmin) ? query(collection(firestore, 'authorRequests'), where('status', '==', 'pending')) : null
  ), [firestore, currentUser, isAdmin]);
  const { data: rawAuthorRequests, isLoading: areAuthorRequestsLoading } = useCollection<AuthorRequest>(authorRequestsQuery);
  
  const authorRequests = useMemo(() => (
    rawAuthorRequests?.filter(r => r.status === 'pending') || []
  ), [rawAuthorRequests]);

  const pendingBooksQuery = useMemo(() => (
    (firestore && currentUser && isAdmin) ? query(collection(firestore, 'books'), where('status', '==', 'pending_review')) : null
  ), [firestore, currentUser, isAdmin]);
  const { data: pendingBooks, isLoading: areBooksLoading } = useCollection<Book>(pendingBooksQuery);
  
  const usersQuery = useMemo(() => (
    (firestore && currentUser && isAdmin) ? collection(firestore, 'users') : null
  ), [firestore, currentUser, isAdmin]);
  const { data: users, isLoading: areUsersLoading } = useCollection<AppUser>(usersQuery);

  const stats = useMemo(() => {
    if (!users) return { total: 0, admins: 0, penulis: 0, pembaca: 0 };
    return {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      penulis: users.filter(u => u.role === 'penulis').length,
      pembaca: users.filter(u => u.role === 'pembaca').length,
    }
  }, [users]);

  const handleApproveAuthor = async (request: AuthorRequest) => {
    if (!firestore) return;
    setProcessingId(request.id);
    try {
      const batch = writeBatch(firestore);
      const requestRef = doc(firestore, 'authorRequests', request.id);
      batch.update(requestRef, { status: 'approved' });
      
      const userRef = doc(firestore, 'users', request.userId);
      batch.update(userRef, { 
        role: 'penulis',
        phoneNumber: request.phoneNumber || '',
        domicile: request.domicile || '',
      });
      
      const notifRef = doc(collection(firestore, `users/${request.userId}/notifications`));
      batch.set(notifRef, {
        type: 'author_request',
        text: 'Permintaan penulis Anda telah disetujui. Selamat berkarya!',
        link: '/studio',
        actor: { uid: 'system', displayName: 'Sistem Nusakarsa', photoURL: 'https://raw.githubusercontent.com/Zombiesigma/nusakarsa-assets/main/uploads/1770617037724-WhatsApp_Image_2026-02-07_at_13.45.35.jpeg' },
        read: false,
        createdAt: serverTimestamp(),
      });

      await batch.commit();
      toast({ 
        variant: 'success', 
        title: "Pujangga Resmi Terdaftar", 
        description: `${request.name} sekarang adalah seorang penulis resmi.` 
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal Menyetujui" });
    } finally {
      setProcessingId(null);
    }
  };
  
  const handleReject = async () => {
    if (!firestore || !rejectionTarget) return;
    setProcessingId(rejectionTarget.id);
    
    const { id, type, name } = rejectionTarget;

    try {
      const batch = writeBatch(firestore);

      if (type === 'author') {
        const requestRef = doc(firestore, 'authorRequests', id);
        const requestSnap = await getDoc(requestRef);
        if (!requestSnap.exists()) throw new Error("Permintaan tidak ditemukan.");
        const requestData = requestSnap.data() as AuthorRequest;

        batch.update(requestRef, { status: 'rejected' });

        const notifRef = doc(collection(firestore, `users/${requestData.userId}/notifications`));
        batch.set(notifRef, {
            type: 'author_request',
            text: `Permintaan penulis Anda ditolak. Silakan periksa kembali data Anda.`,
            link: '/join-author',
            actor: { uid: 'system', displayName: 'Sistem Nusakarsa', photoURL: 'https://raw.githubusercontent.com/Zombiesigma/nusakarsa-assets/main/uploads/1770617037724-WhatsApp_Image_2026-02-07_at_13.45.35.jpeg' },
            read: false,
            createdAt: serverTimestamp(),
        });

        toast({ variant: 'destructive', title: "Permintaan Ditolak" });

      } else if (type === 'book') {
        const bookRef = doc(firestore, 'books', id);
        const bookSnap = await getDoc(bookRef);
        if (!bookSnap.exists()) throw new Error("Karya tidak ditemukan.");
        const bookData = bookSnap.data() as Book;

        batch.update(bookRef, { status: 'rejected' });

        const notifRef = doc(collection(firestore, `users/${bookData.authorId}/notifications`));
        batch.set(notifRef, {
            type: 'broadcast',
            text: `Karya Anda "${name}" membutuhkan revisi. Silakan periksa kembali di studio Anda.`,
            link: `/books/${id}/edit`,
            actor: { uid: 'system', displayName: 'Sistem Nusakarsa', photoURL: 'https://raw.githubusercontent.com/Zombiesigma/nusakarsa-assets/main/uploads/1770617037724-WhatsApp_Image_2026-02-07_at_13.45.35.jpeg' },
            read: false,
            createdAt: serverTimestamp(),
        });
        toast({ variant: 'destructive', title: "Karya Ditolak" });
      }
      
      await batch.commit();
    } catch (error) {
        toast({ variant: "destructive", title: "Gagal Menolak" });
    } finally {
        setProcessingId(null);
        setRejectionTarget(null);
    }
  };

  const handleApproveBook = async (bookId: string, bookTitle: string) => {
    if (!firestore) return;
    setProcessingId(bookId);
    try {
        const bookRef = doc(firestore, 'books', bookId);
        const bookSnap = await getDoc(bookRef);
        if (!bookSnap.exists()) throw new Error("Karya tidak ditemukan.");
        const bookData = bookSnap.data() as Book;
        
        const pdfUrl = await generateBookPdf(bookId);

        const batch = writeBatch(firestore);
        batch.update(bookRef, { status: 'published', fileUrl: pdfUrl, updatedAt: serverTimestamp() });
        
        const authorNotifRef = doc(collection(firestore, `users/${bookData.authorId}/notifications`));
        batch.set(authorNotifRef, {
            type: 'broadcast',
            text: `Selamat! Karya Anda "${bookData.title}" telah berhasil diterbitkan.`,
            link: `/books/${bookId}`,
            actor: { uid: 'system', displayName: 'Sistem Nusakarsa', photoURL: 'https://raw.githubusercontent.com/Zombiesigma/nusakarsa-assets/main/uploads/1770617037724-WhatsApp_Image_2026-02-07_at_13.45.35.jpeg' },
            read: false,
            createdAt: serverTimestamp(),
        });

        // The broadcast to all users has been removed to prevent batch write limits.
        // A scalable solution (e.g., using Cloud Functions) should be implemented for this.

        await batch.commit();
        toast({ variant: 'success', title: "Karya Resmi Terbit" });
    } catch (error) {
        console.error("Error approving book:", error);
        toast({ variant: "destructive", title: "Gagal Menyetujui", description: error.message });
    } finally {
        setProcessingId(null);
    }
  };

  if (isAdminChecking) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-bold uppercase tracking-[0.4em] text-[10px]">Otoritas Verifikasi...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="space-y-8 md:space-y-10 pb-20 w-full overflow-x-hidden px-1">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl md:text-5xl font-headline font-black tracking-tight leading-none">
            Pusat <span className="text-primary italic">Kendali</span>
          </h1>
        </motion.div>
        
        <div className="grid grid-cols-2 md:flex gap-2">
            <Button variant="outline" className="rounded-full font-bold shadow-sm h-11 md:h-12 px-4 md:px-6 text-xs md:text-sm" asChild>
                <Link href="/admin/broadcast"><Megaphone className="mr-2 h-4 w-4" /> Siaran</Link>
            </Button>
            <Button variant="outline" className="rounded-full font-bold shadow-sm h-11 md:h-12 px-4 md:px-6 text-xs md:text-sm" asChild>
                <Link href="/admin/music"><Music2 className="mr-2 h-4 w-4" /> Musik</Link>
            </Button>
            <Button className="rounded-full font-bold shadow-lg h-11 md:h-12 px-4 md:px-6 text-xs md:text-sm" asChild>
                <Link href="/admin/users"><Users className="mr-2 h-4 w-4" /> Anggota</Link>
            </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <Card className="md:col-span-8 border-none shadow-xl rounded-[2rem] bg-indigo-950 text-white overflow-hidden relative">
            <CardHeader className="p-6 md:p-8 border-b border-white/5">
                <CardTitle className="text-xl md:text-2xl font-headline font-black flex items-center gap-3">
                    <Activity className="h-5 w-5 text-indigo-400" /> Statistik Komunitas
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                    <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-300/50">Total Anggota</p>
                        <p className="text-2xl md:text-4xl font-black">{areUsersLoading ? '...' : stats.total}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-300/50">Pujangga Resmi</p>
                        <p className="text-2xl md:text-4xl font-black">{stats.penulis}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-300/50">Pembaca Setia</p>
                        <p className="text-2xl md:text-4xl font-black">{stats.pembaca}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-300/50">Tim Otoritas</p>
                        <p className="text-2xl md:text-4xl font-black">{stats.admins}</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="md:col-span-4 border-none shadow-xl rounded-[2rem] bg-card p-6 md:p-8 flex flex-col justify-between">
            <div className="space-y-4">
                <div className="p-3 rounded-2xl bg-primary/5 text-primary w-fit"><ShieldCheck className="h-5 w-5" /></div>
                <h3 className="text-lg font-bold font-headline">Status Integritas</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-muted-foreground">Basis Data</span>
                        <span className="text-emerald-600">Terhubung</span>
                    </div>
                </div>
            </div>
        </Card>
      </div>

      <Tabs defaultValue="authors" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-full h-auto">
            <TabsTrigger value="authors" className="rounded-full px-6 py-2 text-xs font-bold transition-all">
                Penulis {authorRequests.length > 0 && <span className="ml-1.5 bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">{authorRequests.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="books" className="rounded-full px-6 py-2 text-xs font-bold transition-all">
                Karya {pendingBooks && pendingBooks.length > 0 && <span className="ml-1.5 bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">{pendingBooks.length}</span>}
            </TabsTrigger>
        </TabsList>

        <TabsContent value="authors">
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-muted/30 border-b p-6 md:p-8">
                    <CardTitle className="text-lg md:text-2xl font-headline font-black">Permintaan Pujangga</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-6 font-black uppercase text-[9px] tracking-widest">Identitas</TableHead>
                                <TableHead className="font-black uppercase text-[9px] tracking-widest">Kontak</TableHead>
                                <TableHead className="text-right px-6 font-black uppercase text-[9px] tracking-widest">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {areAuthorRequestsLoading ? (
                                <TableRow><TableCell colSpan={3} className="h-32 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell></TableRow>
                            ) : authorRequests.length === 0 ? (
                                <TableRow><TableCell colSpan={3} className="h-48 text-center font-bold text-sm opacity-30">Semua Permintaan Diproses</TableCell></TableRow>
                            ) : authorRequests.map(request => (
                                <TableRow key={request.id}>
                                    <TableCell className="px-6 py-4">
                                        <p className="font-black text-sm">{request.name}</p>
                                        <div className="flex items-center gap-2 text-[9px] text-muted-foreground uppercase"><MapPin className="h-2.5 w-2.5" /> {request.domicile}</div>
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        <p className="flex items-center gap-1.5 font-medium"><Smartphone className="h-3 w-3" /> {request.phoneNumber}</p>
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => setRejectionTarget({ id: request.id, name: request.name, type: 'author' })} disabled={!!processingId} className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive text-[10px]">
                                              <XCircle className="mr-1 h-3 w-3" />
                                            </Button>
                                            <Button size="sm" onClick={() => handleApproveAuthor(request)} disabled={!!processingId} className="rounded-full text-[10px]">
                                              <CheckCircle2 className="mr-1 h-3 w-3" />
                                              Setuju
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="books">
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-muted/30 border-b p-6 md:p-8">
                    <CardTitle className="text-lg md:text-2xl font-headline font-black">Moderasi Mahakarya</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-6 font-black uppercase text-[9px] tracking-widest">Info Karya</TableHead>
                                <TableHead className="font-black uppercase text-[9px] tracking-widest">Penulis</TableHead>
                                <TableHead className="text-right px-6 font-black uppercase text-[9px] tracking-widest">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {areBooksLoading ? (
                                <TableRow><TableCell colSpan={3} className="h-32 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell></TableRow>
                            ) : pendingBooks?.length === 0 ? (
                                <TableRow><TableCell colSpan={3} className="h-48 text-center opacity-30 font-bold text-sm">Tidak ada antrean.</TableCell></TableRow>
                            ) : pendingBooks?.map(book => (
                                <TableRow key={book.id}>
                                    <TableCell className="px-6 py-4">
                                        <p className="font-black text-xs italic">"{book.title}"</p>
                                        <Badge variant="outline" className="text-[7px] uppercase mt-1">{book.genre}</Badge>
                                    </TableCell>
                                    <TableCell className="font-bold text-[10px]">{book.authorName}</TableCell>
                                    <TableCell className="text-right px-6">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => setRejectionTarget({ id: book.id, name: book.title, type: 'book' })} disabled={!!processingId} className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive text-[10px]">
                                              <XCircle className="mr-1 h-3 w-3" />
                                            </Button>
                                            <Button asChild size="sm" variant="outline" className="rounded-full text-[10px]">
                                                <Link href={`/admin/review/${book.id}`}>
                                                    <BookOpen className="mr-1 h-3 w-3" />
                                                    Review
                                                </Link>
                                            </Button>
                                            <Button size="sm" onClick={() => handleApproveBook(book.id, book.title)} disabled={!!processingId} className="rounded-full text-[10px]">
                                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                                Terbitkan
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      
      <AlertDialog open={!!rejectionTarget} onOpenChange={() => setRejectionTarget(null)}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8">
            <AlertDialogHeader>
                <div className="mx-auto bg-destructive/10 p-4 rounded-2xl w-fit mb-4"><XCircle className="h-8 w-8 text-destructive" /></div>
                <AlertDialogTitle className="font-headline text-2xl font-black text-center">Konfirmasi Penolakan</AlertDialogTitle>
                <AlertDialogDescription className="text-center font-medium leading-relaxed">
                  Apakah Anda yakin ingin menolak {rejectionTarget?.type === 'author' ? 'permintaan penulis' : 'karya'} <strong className="text-foreground">"{rejectionTarget?.name}"</strong>?
                  {rejectionTarget?.type === 'book' && " Karya akan dikembalikan ke status draf agar dapat direvisi oleh penulis."}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 flex gap-3">
                <AlertDialogCancel className="rounded-full h-12 flex-1 border-2 font-bold">Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleReject} className={cn(buttonVariants({ variant: 'destructive' }), "rounded-full h-12 flex-1 font-black shadow-lg shadow-destructive/20")}>
                    {processingId ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ya, Tolak"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
