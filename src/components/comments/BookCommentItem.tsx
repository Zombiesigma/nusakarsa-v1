
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useFirestore, useUser, useDoc, useCollection } from '@/firebase';
import { doc, collection, serverTimestamp, query, orderBy, increment, writeBatch, getDocs, where, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageSquare, Send, Loader2, CornerDownRight, Reply, MoreHorizontal, Trash2, Edit, Smile, Star } from 'lucide-react';
import type { Comment, Book, BookCommentLike, User as AppUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const GifPicker = dynamic(() => import('gif-picker-react'), { ssr: false });

interface BookCommentItemProps {
    bookId: string;
    bookTitle: string;
    bookAuthorId: string;
    comment: Comment;
    currentUserProfile: AppUser | null;
}

export function BookCommentItem({ bookId, bookTitle, bookAuthorId, comment, currentUserProfile }: BookCommentItemProps) {
    const { user: currentUser } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isMounted, setIsMounted] = useState(false);

    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(comment.text);
    const [showGifPicker, setShowGifPicker] = useState(false);

    const REPLY_MAX_LENGTH = 500;

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const likeRef = useMemo(() => (
        (firestore && currentUser) ? doc(firestore, 'books', bookId, 'comments', comment.id, 'likes', currentUser.uid) : null
    ), [firestore, currentUser, bookId, comment.id]);
    const { data: likeDoc } = useDoc<BookCommentLike>(likeRef);
    const isLiked = !!likeDoc;

    const isCommentAuthor = currentUser?.uid === comment.userId;
    const isBookAuthor = currentUser?.uid === bookAuthorId;

    const handleToggleLike = async () => {
        if (!likeRef || !firestore || !currentUser || !currentUserProfile) {
            toast({ variant: 'destructive', title: 'Harap Masuk', description: 'Anda harus masuk untuk menyukai komentar.' });
            return;
        }
        setIsLiking(true);
        const commentRef = doc(firestore, 'books', bookId, 'comments', comment.id);
        const batch = writeBatch(firestore);

        try {
            if (isLiked) {
                batch.delete(likeRef);
                batch.update(commentRef, { likeCount: increment(-1) });
            } else {
                batch.set(likeRef, { userId: currentUser.uid, likedAt: serverTimestamp() });
                batch.update(commentRef, { likeCount: increment(1) });

                if (comment.userId !== currentUser.uid) {
                    const notificationRef = doc(collection(firestore, `users/${comment.userId}/notifications`));
                    batch.set(notificationRef, {
                        type: 'favorite',
                        text: `${currentUserProfile.displayName} menyukai ulasan Anda di karya "${bookTitle}".`,
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
            }
            await batch.commit();
        } catch (error) {
            console.error('Error toggling comment like:', error);
        } finally {
            setIsLiking(false);
        }
    };

    const repliesQuery = useMemo(() => (
        firestore ? query(collection(firestore, 'books', bookId, 'comments', comment.id, 'replies'), orderBy('createdAt', 'asc')) : null
    ), [firestore, bookId, comment.id]);
    const { data: replies } = useCollection<Comment>(repliesQuery);

    const handleReplySubmit = async (gifUrl?: string) => {
        if ((!replyText.trim() && !gifUrl) || !currentUser || !firestore || !currentUserProfile) return;

        setIsSubmittingReply(true);
        try {
            const batch = writeBatch(firestore);

            const commentRef = doc(firestore, 'books', bookId, 'comments', comment.id);
            const repliesCol = collection(commentRef, 'replies');
            const newReplyRef = doc(repliesCol);
            
            const replyData: Partial<Comment> = {
                text: replyText,
                userId: currentUser.uid,
                userName: currentUserProfile.displayName,
                username: currentUserProfile.username,
                userAvatarUrl: currentUserProfile.photoURL,
                createdAt: serverTimestamp(),
                likeCount: 0,
                replyCount: 0,
            };

            if (gifUrl) {
                replyData.gifUrl = gifUrl;
            }

            batch.set(newReplyRef, replyData);
            batch.update(commentRef, { replyCount: increment(1) });

            if (comment.userId !== currentUser.uid) {
                const ownerNotificationRef = doc(collection(firestore, `users/${comment.userId}/notifications`));
                batch.set(ownerNotificationRef, {
                    type: 'comment',
                    text: `${currentUserProfile.displayName} membalas ulasan Anda di karya "${bookTitle}".`,
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

            const mentions = replyText.match(/@(\w+)/g);
            if (mentions) {
                const usernames = mentions.map(m => m.substring(1));
                const uniqueUsernames = [...new Set(usernames)];

                const usersRef = collection(firestore, 'users');
                const usersQuery = query(usersRef, where('username', 'in', uniqueUsernames));
                const usersSnap = await getDocs(usersQuery);

                usersSnap.forEach(userDoc => {
                    const mentionedUser = userDoc.data() as AppUser;
                    if (mentionedUser.uid !== currentUser.uid && mentionedUser.uid !== comment.userId) { 
                        const notificationRef = doc(collection(firestore, `users/${mentionedUser.uid}/notifications`));
                        batch.set(notificationRef, {
                            type: 'comment',
                            text: `${currentUserProfile.displayName} menyebut Anda dalam balasan di karya "${bookTitle}".`,
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

            setReplyText('');
            setShowReplyInput(false);
            setShowGifPicker(false);
            toast({ title: 'Balasan Terkirim' });
        } catch (error) {
            console.error('Error submitting reply:', error);
            toast({ variant: 'destructive', title: 'Gagal Mengirim' });
        } finally {
            setIsSubmittingReply(false);
        }
    };

    const handleDeleteComment = async () => {
        if (!firestore) return;
        const batch = writeBatch(firestore);
        const commentRef = doc(firestore, 'books', bookId, 'comments', comment.id);

        try {
            // If the comment has a rating, update the book's average rating
            if (comment.rating && comment.rating > 0) {
                const bookRef = doc(firestore, 'books', bookId);
                const bookSnap = await getDoc(bookRef);
                const bookData = bookSnap.data() as Book;

                if (bookData) {
                    const currentRatingCount = bookData.ratingCount || 0;
                    const currentAverageRating = bookData.averageRating || 0;
                    
                    if (currentRatingCount > 1) {
                        const newRatingCount = currentRatingCount - 1;
                        const newAverageRating = ((currentAverageRating * currentRatingCount) - comment.rating) / newRatingCount;
                        batch.update(bookRef, { 
                            ratingCount: increment(-1), 
                            averageRating: newAverageRating 
                        });
                    } else {
                        // If this is the last rating, reset to 0
                        batch.update(bookRef, { ratingCount: 0, averageRating: 0 });
                    }
                }
            }

            batch.delete(commentRef);
            await batch.commit();
            toast({ title: "Komentar dihapus" });

        } catch (error) {
            console.error("Error deleting comment:", error);
            toast({ variant: 'destructive', title: "Gagal menghapus komentar" });
        }
    };

    const handleUpdateComment = async () => {
        if (!firestore || !editedText.trim()) return;
        const commentRef = doc(firestore, 'books', bookId, 'comments', comment.id);
        try {
            await updateDoc(commentRef, { text: editedText });
            setIsEditing(false);
            toast({ title: "Komentar diperbarui" });
        } catch (error) {
            console.error("Error updating comment:", error);
            toast({ variant: 'destructive', title: "Gagal memperbarui komentar" });
        }
    };

    const processTextForMentions = (text: string) => {
        return text.replace(/@(\w+)/g, (match, username) => {
            return `[${match}](/profile/${username.toLowerCase()})`;
        });
    };

    const renderRating = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={cn(
                            "h-3.5 w-3.5",
                            rating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-400/60"
                        )}
                    />
                ))}
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col group"
        >
            <div className="flex items-start gap-4">
                <Link href={comment.username ? `/profile/${comment.username}` : '#'} className="shrink-0">
                    <Avatar className="h-10 w-10 ring-2 ring-background shadow-md">
                        <AvatarImage src={comment.userAvatarUrl} alt={comment.userName} />
                        <AvatarFallback>{comment.userName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                </Link>
                <div className="flex-1 space-y-1">
                    <div className="bg-card/50 backdrop-blur-sm border border-border/50 p-4 rounded-2xl rounded-tl-none shadow-sm group-hover:shadow-md transition-all">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className='flex flex-col'>
                                <Link href={comment.username ? `/profile/${comment.username}` : '#'} className="font-bold text-sm hover:text-primary transition-colors">
                                    {comment.userName}
                                </Link>
                                {comment.rating && renderRating(comment.rating)}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground opacity-60">
                                    {isMounted && comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { locale: id, addSuffix: true }) : '...'}
                                </span>
                                {(isCommentAuthor || isBookAuthor) && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-1 rounded-lg">
                                            {isCommentAuthor && (
                                                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="w-full justify-start">
                                                    <Edit className="h-3.5 w-3.5 mr-2" /> Edit
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" onClick={handleDeleteComment} className="w-full justify-start text-red-500 hover:text-red-500">
                                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Hapus
                                            </Button>
                                        </PopoverContent>
                                    </Popover>
                                )}
                            </div>
                        </div>
                        {isEditing ? (
                            <div className="space-y-2">
                                <Textarea value={editedText} onChange={(e) => setEditedText(e.target.value)} className="w-full" />
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Batal</Button>
                                    <Button size="sm" onClick={handleUpdateComment}>Simpan</Button>
                                </div>
                            </div>
                        ) : (
                            <div className={cn(
                                'prose prose-sm max-w-none prose-p:leading-relaxed prose-blockquote:border-l-2 prose-blockquote:pl-3 prose-p:m-0 break-all', 
                                'text-foreground',
                                'markdown-content'
                            )}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {processTextForMentions(comment.text)}
                                </ReactMarkdown>
                                {comment.gifUrl && <img src={comment.gifUrl} className="mt-2 rounded-lg" alt="GIF" />}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2 pl-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className={cn(
                                'h-8 px-3 rounded-full text-xs font-bold transition-all',
                                isLiked ? 'text-red-500 bg-red-500/10 hover:bg-red-500/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                            )} 
                            onClick={handleToggleLike} 
                            disabled={isLiking}
                        >
                            <Heart className={cn('h-3.5 w-3.5 mr-1.5 transition-transform', isLiked && 'fill-current scale-110')} />
                            {comment.likeCount > 0 && <span className="mr-1.5">{comment.likeCount}</span>}
                            {isLiked ? 'Disukai' : 'Suka'}
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-3 rounded-full text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                            onClick={() => setShowReplyInput(!showReplyInput)}
                        >
                            <Reply className="h-3.5 w-3.5 mr-1.5" />
                            {comment.replyCount > 0 && <span className="mr-1.5">{comment.replyCount}</span>}
                        </Button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showReplyInput && currentUser && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex items-start gap-3 pl-14 pt-4">
                            <CornerDownRight className="h-4 w-4 text-muted-foreground mt-2" />
                            <Avatar className="h-8 w-8 ring-2 ring-background">
                                <AvatarImage src={currentUser.photoURL ?? ''} alt={currentUser.displayName ?? ''} />
                                <AvatarFallback>{currentUser.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 relative">
                                <Textarea 
                                    placeholder={`Balas ${comment.userName}... (gunakan @ untuk menyebut pengguna)`}
                                    className="w-full pr-20 min-h-[80px] bg-muted/20 border-none shadow-none focus-visible:ring-primary/20 text-sm rounded-xl py-3"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    disabled={isSubmittingReply}
                                    maxLength={REPLY_MAX_LENGTH}
                                />
                                <div className="absolute bottom-2 left-4 text-[9px] font-bold text-muted-foreground/60">
                                    {replyText.length} / {REPLY_MAX_LENGTH}
                                </div>
                                <div className="absolute bottom-2 right-2 flex gap-1">
                                    <Popover open={showGifPicker} onOpenChange={setShowGifPicker}>
                                        <PopoverTrigger asChild>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg">
                                                <Smile className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0 border-0 bg-transparent" align="end">
                                            <GifPicker giphyApiKey="YOUR_GIPHY_API_KEY" onGifClick={(gif) => handleReplySubmit(gif.url)} />
                                        </PopoverContent>
                                    </Popover>
                                    <Button 
                                        size="icon" 
                                        className="h-8 w-8 rounded-lg shadow-lg" 
                                        onClick={() => handleReplySubmit()} 
                                        disabled={isSubmittingReply || (!replyText.trim() && !comment.gifUrl) || replyText.length > REPLY_MAX_LENGTH}
                                    >
                                        {isSubmittingReply ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {replies && replies.length > 0 && (
                <div className="pl-14 pt-6 space-y-6 relative border-l-2 border-border/30 ml-5 mt-2">
                    {replies.map(reply => (
                        <div key={reply.id} className="flex items-start gap-3">
                             <Link href={reply.username ? `/profile/${reply.username}` : '#'} className="shrink-0">
                                <Avatar className="h-8 w-8 ring-2 ring-background shadow-sm">
                                    <AvatarImage src={reply.userAvatarUrl} alt={reply.userName} />
                                    <AvatarFallback>{reply.userName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </Link>
                            <div className="flex-1">
                                <div className="bg-muted/30 p-3.5 rounded-2xl rounded-tl-none border border-border/20">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <Link href={reply.username ? `/profile/${reply.username}` : '#'} className="font-bold text-xs hover:text-primary transition-colors">
                                            {reply.userName}
                                        </Link>
                                        <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground opacity-50">
                                            {isMounted && reply.createdAt ? formatDistanceToNow(reply.createdAt.toDate(), { locale: id, addSuffix: true }) : '...'}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        'prose prose-sm max-w-none prose-p:leading-relaxed prose-blockquote:border-l-2 prose-blockquote:pl-3 prose-p:m-0 break-all',
                                        'text-foreground',
                                        'markdown-content'
                                    )}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {processTextForMentions(reply.text)}
                                        </ReactMarkdown>
                                        {reply.gifUrl && <img src={reply.gifUrl} className="mt-2 rounded-lg" alt="GIF" />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
