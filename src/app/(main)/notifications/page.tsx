
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, writeBatch, arrayUnion, increment, where } from 'firebase/firestore';
import type { Notification, CollaborationInvitation } from '@/lib/types';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Bell, 
  MessageCircle, 
  UserPlus, 
  Heart, 
  PenTool, 
  Megaphone, 
  CheckCheck,
  ChevronRight,
  Loader2,
  Check,
  X,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

export default function NotificationsPage() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const notificationsQuery = useMemo(() => (
    (firestore && currentUser)
      ? query(collection(firestore, `users/${currentUser.uid}/notifications`), orderBy('createdAt', 'desc'))
      : null
  ), [firestore, currentUser]);

  const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);
  
  const pendingInvitesQuery = useMemo(() => (
    (firestore && currentUser) ? query(collection(firestore, 'collaborationInvitations'), where('collaboratorId', '==', currentUser.uid), where('status', '==', 'pending')) : null
  ), [firestore, currentUser]);

  const { data: pendingInvites } = useCollection<CollaborationInvitation>(pendingInvitesQuery);


  const handleNotificationClick = async (notification: Notification) => {
    if (notification.type === 'collaboration_invite') return; // Handled by buttons

    if (firestore && !notification.read && currentUser) {
      const notifRef = doc(firestore, `users/${currentUser.uid}/notifications`, notification.id);
      updateDoc(notifRef, { read: true }).catch(err => console.error(err));
    }
    router.push(notification.link);
  };
  
  const handleMarkAllAsRead = async () => {
      if (!firestore || !currentUser || !notifications) return;
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length === 0) return;
      const batch = writeBatch(firestore);
      unreadNotifications.forEach(notif => {
          const notifRef = doc(firestore, `users/${currentUser.uid}/notifications`, notif.id);
          batch.update(notifRef, { read: true });
      });
      await batch.commit();
  }

  const handleInviteResponse = async (invitation: CollaborationInvitation, accept: boolean) => {
    if (!firestore || !currentUser) return;
    setProcessingInviteId(invitation.id);
    
    const batch = writeBatch(firestore);
    const inviteRef = doc(firestore, 'collaborationInvitations', invitation.id);
    
    if (accept) {
      batch.update(inviteRef, { status: 'accepted' });
      const bookRef = doc(firestore, 'books', invitation.bookId);
      batch.update(bookRef, { collaboratorUids: arrayUnion(currentUser.uid) });
      
      const ownerNotifRef = doc(collection(firestore, `users/${invitation.ownerId}/notifications`));
      batch.set(ownerNotifRef, {
        type: 'broadcast',
        text: `${currentUser.displayName} telah menerima undangan kolaborasi Anda untuk "${invitation.bookTitle}".`,
        link: `/books/${invitation.bookId}/edit`,
        actor: { uid: currentUser.uid, displayName: currentUser.displayName!, photoURL: currentUser.photoURL! },
        read: false,
        createdAt: new Date(),
      });
      toast({ variant: 'success', title: 'Kolaborasi Diterima!' });

    } else {
      batch.update(inviteRef, { status: 'declined' });
      toast({ title: 'Kolaborasi Ditolak' });
    }
    
    try {
        await batch.commit();
    } catch(err) {
        toast({ variant: 'destructive', title: 'Gagal merespons undangan' });
    } finally {
        setProcessingInviteId(null);
    }
  }


  const groupedNotifications = useMemo(() => {
    if (!notifications) return { today: [], yesterday: [], earlier: [] };
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const earlier: Notification[] = [];
    notifications.forEach(notif => {
      const date = notif.createdAt.toDate();
      if (isToday(date)) today.push(notif);
      else if (isYesterday(date)) yesterday.push(notif);
      else earlier.push(notif);
    });
    return { today, yesterday, earlier };
  }, [notifications]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'comment': return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'follow': return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'favorite': return <Heart className="h-4 w-4 text-rose-500" fill="currentColor" />;
      case 'author_request': return <PenTool className="h-4 w-4 text-orange-500" />;
      case 'collaboration_invite': return <Users className="h-4 w-4 text-purple-500" />;
      case 'broadcast': return <Megaphone className="h-4 w-4 text-primary" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

  if (!isMounted) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-3">
            <Bell className="h-3 w-3" /> Pusat Notifikasi
          </div>
          <h1 className="text-4xl font-headline font-black tracking-tight">Kabar <span className="text-primary">Terbaru</span></h1>
        </div>
        <Button variant="outline" size="sm" disabled={unreadCount === 0} onClick={handleMarkAllAsRead} className="rounded-full px-6 font-bold border-2">
          <CheckCheck className="mr-2 h-4 w-4" /> Tandai Dibaca
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-bold uppercase tracking-widest">Sinkronisasi Kabar...</p>
        </div>
      ) : notifications?.length === 0 ? (
        <div className="text-center py-24 bg-card/50 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center gap-6 opacity-30">
          <Bell className="h-16 w-16" />
          <h3 className="font-headline text-2xl font-bold">Hening di Sini...</h3>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedNotifications).map(([key, list]) => {
            if (list.length === 0) return null;
            const title = key === 'today' ? 'Hari Ini' : key === 'yesterday' ? 'Kemarin' : 'Sebelumnya';
            return (
              <section key={key} className="space-y-4">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 pl-2">{title}</h2>
                <div className="grid gap-3">
                  <AnimatePresence mode="popLayout">
                    {list.map((notification, index) => {
                      const isInvite = notification.type === 'collaboration_invite';
                      const invitationId = isInvite ? notification.link.split('/invitations/')[1] : null;
                      const relevantInvite = invitationId ? pendingInvites?.find(inv => inv.id === invitationId) : null;
                      
                      return (
                        <motion.div key={notification.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                          <Card className={cn("group overflow-hidden border-none shadow-sm transition-all", !isInvite && "cursor-pointer hover:shadow-md", notification.read ? "bg-card/40" : "bg-card ring-1 ring-primary/10")} onClick={() => !isInvite && handleNotificationClick(notification)}>
                            <CardContent className="p-4 md:p-5 flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative shrink-0">
                                        <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                        <AvatarImage src={notification.actor.photoURL} alt={notification.actor.displayName} />
                                        <AvatarFallback className="bg-primary/5 text-primary font-black">{notification.actor.displayName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 bg-background p-1 rounded-full shadow-sm ring-1 ring-border">{getIcon(notification.type)}</div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("text-sm leading-relaxed", notification.read ? "text-muted-foreground" : "text-foreground font-medium")}>
                                        <span className="font-black text-foreground">{notification.actor.displayName}</span>{" "}{notification.text.replace(notification.actor.displayName, '').trim()}
                                        </p>
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground/60">{isMounted && notification.createdAt ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true, locale: id }) : '...'}</p>
                                    </div>
                                    {!isInvite && <ChevronRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary transition-all" />}
                                </div>

                                {relevantInvite && (
                                    <div className="pl-16 flex gap-2">
                                        <Button size="sm" className="rounded-full font-black flex-1 h-9 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleInviteResponse(relevantInvite, true)} disabled={processingInviteId === relevantInvite.id}>
                                            {processingInviteId === relevantInvite.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <><Check className="mr-1.5 h-4 w-4"/> Setuju</>}
                                        </Button>
                                        <Button size="sm" variant="destructive" className="rounded-full font-black flex-1 h-9 bg-rose-600 hover:bg-rose-700" onClick={() => handleInviteResponse(relevantInvite, false)} disabled={processingInviteId === relevantInvite.id}>
                                            <X className="mr-1.5 h-4 w-4"/> Tolak
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  )
}
