'use client';

import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, Sparkles, Leaf } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Logo } from '@/components/Logo';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ProtectedLayout Nusakarsa Version.
 * Mengarahkan pengguna yang belum masuk ke gerbang /welcome.
 */
export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [showChildren, setShowChildren] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      if (typeof document !== 'undefined') {
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
      }
      router.replace('/welcome');
    }
    
    if (!isLoading && user) {
        const timer = setTimeout(() => setShowChildren(true), 1200); 
        return () => clearTimeout(timer);
    }
  }, [user, isLoading, router]);
  
  useEffect(() => {
    if (!firestore || !user) return;

    const userStatusRef = doc(firestore, 'users', user.uid);

    updateDoc(userStatusRef, {
      status: 'online',
      lastSeen: serverTimestamp(),
    }).catch(err => console.warn("Failed to set status:", err));

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
          updateDoc(userStatusRef, {
            lastSeen: serverTimestamp(),
          }).catch(err => console.warn("Heartbeat failed:", err));
      }
    }, 2 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [firestore, user]);


  if (isLoading || !user || !showChildren) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black overflow-hidden">
        <div className="absolute inset-0 bg-black/50 z-10" />
        
        <div className="relative flex flex-col items-center z-20">
            <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="relative mb-10"
            >
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <div className="relative z-10 p-1 rounded-[2.5rem] bg-gradient-to-tr from-primary via-accent to-primary shadow-2xl">
                    <Logo className="w-28 h-28 md:w-32 md:h-32 rounded-[2.3rem] ring-4 ring-background" />
                </div>
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="space-y-6 text-center"
            >
                <div className="space-y-1">
                    <h1 className="text-5xl md:text-6xl font-headline font-black tracking-tight text-white">
                        Nusakarsa
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">
                        Daya Cipta Bangsa
                    </p>
                </div>
                
                <div className="flex items-center justify-center gap-4 pt-4">
                    <div className="flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                animate={{ scale: [1, 1.6, 1], opacity: [0.3, 1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2, ease: "easeInOut" }}
                                className="w-2 h-2 rounded-full bg-primary"
                            />
                        ))}
                    </div>
                </div>
            </motion.div>
            
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="absolute bottom-16 flex items-center gap-2 text-white/30 select-none"
            >
                <Leaf className="w-3 h-3" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Melestarikan Akar Kreativitas</span>
            </motion.div>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        {children}
    </motion.div>
  );
}
