'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Copy, Share2, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Book } from '@/lib/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareBookDialogProps {
    book: Book;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ShareBookDialog({ book, open, onOpenChange }: ShareBookDialogProps) {
    const { toast } = useToast();
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/books/${book.id}` : '';

    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => {
                document.body.style.pointerEvents = '';
                setShowLinkInput(false);
                setIsCopied(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [open]);

    const handleCopyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast({ variant: 'success', title: "Tautan Berhasil Disalin!" });
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            toast({ 
                variant: 'destructive', 
                title: "Gagal Menyalin Otomatis",
                description: "Silakan salin tautan secara manual dari kolom yang muncul.",
            });
            setShowLinkInput(true);
        }
    };
    
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Mahakarya: ${book.title} oleh ${book.authorName}`,
                    text: book.synopsis,
                    url: shareUrl,
                });
            } catch (err) {}
        } else {
            setShowLinkInput(true);
        }
    };


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                className="max-w-md w-[95vw] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden flex flex-col bg-background/95 backdrop-blur-xl"
                onCloseAutoFocus={(e) => {
                    e.preventDefault();
                    document.body.style.pointerEvents = '';
                }}
            >
                <div className="p-8 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border-b border-primary/10 shrink-0 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                    
                    <DialogHeader className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl shadow-primary/10 text-primary ring-1 ring-primary/20">
                                <Send className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="font-headline text-2xl font-black tracking-tight uppercase">Bagikan Karya</DialogTitle>
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mt-1">Jalin Koneksi Literasi</p>
                            </div>
                        </div>
                        <DialogDescription className="text-sm font-medium leading-relaxed text-muted-foreground/80">
                            Sebarkan bait-bait imajinasi dari <span className="font-black text-foreground italic">"{book.title}"</span>.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-10 space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        <Button size="lg" className="rounded-2xl h-16 font-black uppercase text-xs tracking-widest gap-3 shadow-xl" onClick={handleShare}>
                            <Share2 className="h-5 w-5" /> Bagikan Sekarang
                        </Button>
                        <Button variant="outline" size="lg" className="rounded-2xl h-16 font-black uppercase text-xs tracking-widest gap-3 border-2" onClick={handleCopyToClipboard}>
                            <Copy className="h-5 w-5 text-primary" /> Salin Tautan
                        </Button>
                    </div>

                    <AnimatePresence>
                    {showLinkInput && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: '1.5rem' }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="relative"
                        >
                            <Input 
                                readOnly 
                                value={shareUrl} 
                                className="h-14 rounded-2xl bg-muted/30 border-none pr-14 text-xs font-bold"
                            />
                            <Button size="icon" className={cn("absolute right-2 top-2 h-10 w-10 rounded-xl", isCopied && "bg-emerald-500")} onClick={handleCopyToClipboard}>
                                {isCopied ? <Check className="h-4 w-4"/> : <Copy className="h-4 w-4"/>}
                            </Button>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>

                <DialogFooter className="p-6 bg-muted/20 border-t border-border/50">
                    <Button 
                        variant="ghost" 
                        onClick={() => onOpenChange(false)} 
                        className="rounded-full font-bold h-12 w-full hover:bg-background/50 transition-all"
                    >
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
