'use client';

import { Header } from '../../components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ProtectedLayout } from '@/components/auth/ProtectedLayout';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Instagram, Twitter, Github, Globe, ChevronRight } from 'lucide-react';
import Image from 'next/image';

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const isImmersiveRoute = pathname?.includes('/read') ||
                           pathname?.includes('/edit');

  const isPublicLegalPage = pathname === '/privacy' || pathname === '/terms';

  if (isPublicLegalPage) {
    return (
      <div className="bg-background text-foreground">
        <main className="w-full">
          {children}
        </main>
        <footer className="relative z-10 w-full mt-auto pt-20">
          <div className="bg-card/50 backdrop-blur-3xl border-t rounded-t-[3rem] md:rounded-t-[5rem] p-10 md:p-20 shadow-[0_-20px_100px_-20px_rgba(0,0,0,0.1)]">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                  <div className="lg:col-span-5 space-y-8">
                    <div className="flex items-center gap-4">
                      <Logo className="h-14 w-14 rounded-2xl shadow-2xl ring-1 ring-primary/10" />
                      <div>
                        <h2 className="font-headline text-3xl font-black tracking-tight leading-none text-foreground">Nusakarsa</h2>
                        <p className="text-xs font-black uppercase tracking-[0.4em] text-primary/60 mt-2">Imajinasi Digital</p>
                      </div>
                    </div>
                    <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-medium italic max-w-sm">
                      "Melestarikan akar kreativitas melalui teknologi, membangun peradaban sastra digital yang abadi dan bermartabat."
                    </p>
                    <div className="flex items-center gap-5 pt-4">
                      {[
                        { icon: Instagram, href: '#' },
                        { icon: Twitter, href: '#' },
                        { icon: Github, href: 'https://github.com/Zombiesigma' },
                        { icon: Globe, href: 'https://www.gunturpadilah.web.id/' }
                      ].map((social, i) => (
                        <a 
                          key={i} 
                          href={social.href} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-500 shadow-sm border border-transparent hover:border-primary/20"
                        >
                          <social.icon className="h-5 w-5" />
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-12 lg:gap-8">
                    <div className="space-y-8">
                      <h4 className="text-xs font-black uppercase tracking-[0.5em] text-primary">Navigasi</h4>
                      <ul className="space-y-5">
                        {[
                          {label: 'Eksplorasi', href: '/search'}, 
                          {label: 'Panduan', href: '/guide'},
                          {label: 'Tentang', href: '/about'}
                        ].map(item => (
                          <li key={item.label}>
                            <Link href={item.href} className="text-base font-bold text-muted-foreground hover:text-primary transition-colors inline-flex items-center group">
                              {item.label} <ChevronRight className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-8">
                      <h4 className="text-xs font-black uppercase tracking-[0.5em] text-primary">Legal</h4>
                      <ul className="space-y-5">
                        {[
                          {label: 'Pusat Kendali', href: '/admin'}, 
                          {label: 'Karir Penulis', href: '/join-author'},
                          {label: 'Kebijakan Privasi', href: '/privacy'},
                          {label: 'Ketentuan Layanan', href: '/terms'}
                        ].map(item => (
                          <li key={item.label}>
                            <Link href={item.href} className="text-base font-bold text-muted-foreground hover:text-primary transition-colors">{item.label}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-20 pt-10 border-t border-border/50 flex flex-col md:flex-row items-center justify-center gap-8 opacity-40 grayscale select-none text-center">
                  <p className="text-xs font-black uppercase tracking-[0.3em]">&copy; {new Date().getFullYear()} Nusakarsa. All Rights Reserved.</p>
                </div>
              </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <ProtectedLayout>
      <div className="relative flex h-dvh w-full bg-[#fdf8f4] overflow-hidden">
        {!isImmersiveRoute && <AppSidebar />}
        
        <div className={cn(
          "flex flex-col flex-1 min-w-0 relative overflow-hidden transition-all duration-500",
          !isImmersiveRoute && "md:ml-24"
        )}>
          {!isImmersiveRoute && <Header />}
          
          <main className={cn(
            "flex-1 overflow-y-auto relative no-scrollbar-mobile",
            !isImmersiveRoute && "pb-24 md:pb-0"
          )}>
            <div className={cn(
              "relative mx-auto w-full",
              isImmersiveRoute ? "h-full" : "container px-6 py-10 md:px-12 md:py-12 md:max-w-none"
            )}>
              {children}
            </div>
          </main>
          
          {!isImmersiveRoute && (
            <MobileNav />
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
