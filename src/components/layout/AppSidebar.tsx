'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User as AppUser } from '@/lib/types';
import { 
  Home, 
  Search, 
  BookOpen, 
  User, 
  Plus,
  Library,
  Bell,
  Settings,
  HelpCircle,
  Info,
  Shield,
  LayoutGrid
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function AppSidebar() {
  const { user } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();

  const userProfileRef = (firestore && user) ? doc(firestore, 'users', user.uid) : null;
  const { data: userProfile } = useDoc<AppUser>(userProfileRef);

  const isAdmin = userProfile?.role?.toLowerCase() === 'admin';
  const isAuthor = userProfile?.role === 'penulis' || isAdmin;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  const navGroups = [
    {
      label: 'Utama',
      items: [
        { href: '/', icon: Home, label: 'Beranda' },
        { href: '/search', icon: Search, label: 'Eksplorasi' },
        { href: '/library', icon: Library, label: 'Pustaka Saya' },
        { href: '/studio', icon: LayoutGrid, label: 'Studio Penulis', hidden: !isAuthor },
      ]
    },
    {
      label: 'Aktivitas',
      items: [
        { href: userProfile ? `/profile/${userProfile.username.toLowerCase()}` : '/profile', icon: User, label: 'Profil Publik' },
        { href: '/notifications', icon: Bell, label: 'Kabar Terbaru' },
        { href: '/settings', icon: Settings, label: 'Pengaturan' },
      ]
    },
    {
      label: 'Informasi',
      items: [
        { href: '/guide', icon: HelpCircle, label: 'Panduan' },
        { href: '/about', icon: Info, label: 'Tentang' },
        { href: '/admin', icon: Shield, label: 'Otoritas', hidden: !isAdmin },
      ]
    }
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-24 flex flex-col items-center py-8 z-[150] hidden md:flex">
      {/* Background Rail Premium with Glassmorphism */}
      <div className="absolute inset-y-4 left-4 right-4 bg-white/40 backdrop-blur-2xl border border-white/20 rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] ring-1 ring-black/5 -z-10" />

      {/* Top Section: Logo with Stage */}
      <div className="mb-6 relative shrink-0">
        <Link href="/" className="block group">
          <div className="relative p-1 rounded-full transition-all duration-700 group-hover:rotate-[360deg]">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Logo className="h-12 w-12 rounded-full shadow-2xl ring-2 ring-primary/10 relative z-10" />
          </div>
        </Link>
      </div>

      {/* Navigation Area: Kinetic Scroll Zone */}
      <div className="flex-1 w-full overflow-y-auto scrollbar-hide px-4 py-4 relative">
        <nav className="flex flex-col gap-10 items-center w-full relative pb-10">
          <TooltipProvider delayDuration={0}>
            {navGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="flex flex-col gap-6 items-center w-full">
                {group.items.map((item) => {
                  if (item.hidden) return null;
                  const active = isActive(item.href);
                  
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        <Link 
                          href={item.href}
                          className="relative flex items-center justify-center w-full group outline-none"
                        >
                          <div className={cn(
                            "relative h-14 w-14 rounded-[1.75rem] flex items-center justify-center transition-all duration-500 z-10",
                            active 
                              ? "text-primary-foreground scale-110" 
                              : "text-muted-foreground/60 hover:text-primary hover:bg-primary/10"
                          )}>
                            <item.icon className={cn(
                              "h-6 w-6 transition-transform duration-500",
                              active ? "scale-110 drop-shadow-md" : "group-hover:scale-110"
                            )} strokeWidth={active ? 2.5 : 2} />
                            
                            {active && (
                              <motion.div
                                layoutId="rail-glow"
                                className="absolute inset-0 bg-primary shadow-[0_10px_25px_rgba(var(--primary),0.4)] rounded-[1.75rem] -z-10"
                                initial={false}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                              />
                            )}
                          </div>

                          {active && (
                            <motion.div 
                              layoutId="rail-indicator"
                              className="absolute -left-4 w-1.5 h-8 bg-primary rounded-r-full"
                              initial={false}
                              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                          )}
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="right" 
                        sideOffset={20}
                        className="bg-zinc-900 text-white border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest shadow-2xl animate-in zoom-in-95"
                      >
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
                {groupIdx < navGroups.length - 1 && (
                  <div className="w-8 h-px bg-border/50" />
                )}
              </div>
            ))}
          </TooltipProvider>
        </nav>
      </div>

      {/* Bottom Section: Primary Action */}
      <div className="mt-4 relative shrink-0 pb-2">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link 
                  href={isAuthor ? "/upload" : "/join-author"}
                  className={cn(
                    "h-14 w-14 rounded-[1.75rem] bg-white border border-border shadow-xl flex items-center justify-center transition-all group active:scale-90 text-primary/60 hover:text-primary"
                  )}
              >
                  <Plus className="h-7 w-7 group-hover:rotate-90 transition-transform duration-500" strokeWidth={3} />
              </Link>
            </TooltipTrigger>
            <TooltipContent 
              side="right" 
              sideOffset={20}
              className="bg-primary text-white border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest shadow-2xl"
            >
              {isAuthor ? 'Karya Baru' : 'Jadi Penulis'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-20">
        </div>
      </div>
    </aside>
  );
}
