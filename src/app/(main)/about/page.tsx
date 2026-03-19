'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { Globe, PenTool, Cpu, Lightbulb, ShieldCheck, Instagram, Twitter, Github, ChevronRight, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const technologies = [
    { title: "Next.js", desc: "Kerangka kerja React yang memberikan fondasi kuat untuk aplikasi web modern dengan rendering sisi server.", icon: "https://avatars.githubusercontent.com/u/126103961?s=200&v=4" },
    { title: "React", desc: "Pustaka JavaScript untuk membangun antarmuka pengguna yang interaktif dengan arsitektur berbasis komponen.", icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQcR5U16C8yXgBpl7-Bc7Itjx3_LRl425zINA&s" },
    { title: "TypeScript", desc: "Bahasa pemrograman dengan sistem tipe yang kuat untuk kode yang lebih aman, cepat, dan terstruktur.", icon: "https://svgl.app/library/typescript.svg" },
    { title: "Firebase", desc: "Infrastruktur Cloud Google yang menjamin keamanan data dan sinkronisasi real-time mahakarya.", icon: "https://svgl.app/library/firebase.svg" },
    { title: "Tailwind CSS", desc: "Sistem desain modern untuk antarmuka yang presisi, elegan, dan sepenuhnya responsif.", icon: "https://svgl.app/library/tailwindcss.svg" }
];

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1]
    }
  })
};

export default function AboutPage() {
  const initialArchitects = [
    {
        name: "Khalid Ar-Rahman",
        role: "Security",
        handle: "khalid_ar",
        avatar: "/tim/khalid.png",
        avatarHint: "man portrait",
        quote: "Membangun fondasi digital yang kokoh untuk masa depan literasi.",
    },
    {
        name: "Guntur Padilah",
        role: "Lead Full-stack & Idea",
        handle: "gunturpadilah",
        avatar: "/tim/guntur.jpeg",
        avatarHint: "male developer",
        quote: "Setiap baris kode adalah sebuah puisi yang menunggu untuk dibaca.",
    },
    {
        name: "Nursyifa Aeni",
        role: "Frontend Developer",
        handle: "syifa_aeni",
        avatar: "/tim/syifa.jpeg",
        avatarHint: "woman creative",
        quote: "Desain adalah jembatan sunyi antara imajinasi dan realitas.",
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-24 md:space-y-32 pb-32 relative overflow-x-hidden w-full px-4 -mt-10">
      <div className="absolute top-0 right-[-10%] w-64 md:w-96 h-64 md:h-96 bg-primary/10 rounded-full blur-[80px] md:blur-[120px] -z-10 pointer-events-none animate-pulse" />
      
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center space-y-8 pb-12"
      >
        <div className="flex justify-center mb-8">
            <div className="relative p-4 md:p-6 rounded-[2.5rem] bg-white shadow-2xl shadow-primary/10 group overflow-hidden border border-border/50 ring-1 ring-primary/5">
                <Logo className="w-16 h-16 md:w-24 md:h-20 transition-transform duration-700 group-hover:scale-110" />
            </div>
        </div>
        <div className="space-y-6 max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-7xl font-headline font-black text-foreground leading-[1.1] tracking-tight">
                Menghidupkan Jiwa <br/> Lewat <span className="text-primary italic underline decoration-primary/10">Teknologi.</span>
            </h1>
            <p className="text-sm md:text-xl text-muted-foreground leading-relaxed font-medium italic px-2 max-w-2xl mx-auto">
                "Nusakarsa bukan sekadar platform, ia adalah rumah bagi imajinasi murni di mana setiap karsa tumbuh menjadi mahakarya abadi."
            </p>
        </div>
      </motion.section>

      <section className="space-y-12">
        <div className="flex items-center gap-4 px-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 flex items-center gap-3 whitespace-nowrap">
                <Globe className="h-4 w-4 text-primary" /> Fondasi Platform
            </h2>
            <div className="h-px bg-border/50 flex-1" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
            {[
                { icon: Cpu, title: "Teknologi Terdepan", desc: "Menggunakan infrastruktur cloud modern untuk memastikan setiap detik pengalaman sastra Anda terasa magis dan aman.", color: "text-emerald-500" },
                { icon: Lightbulb, title: "Inspirasi Tanpa Batas", desc: "Kami membangun antarmuka yang bebas gangguan agar kreativitas Anda dapat mengalir dengan murni dari hati.", color: "text-orange-500" }
            ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md rounded-[2.5rem] p-8 h-full flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-500 border border-white/10 relative overflow-hidden">
                        <div className={cn("p-5 rounded-2xl bg-muted/50 mb-8 transition-all group-hover:bg-primary group-hover:text-white shadow-inner relative z-10", item.color)}>
                            <item.icon className="h-8 w-8 md:h-10 md:w-10" />
                        </div>
                        <h3 className="text-xl font-black mb-3 uppercase tracking-tight">{item.title}</h3>
                        <p className="text-muted-foreground leading-relaxed text-xs md:text-sm font-medium">{item.desc}</p>
                    </Card>
                </motion.div>
            ))}
        </div>
      </section>

      <section className="space-y-20 px-4">
        <div className="flex items-center gap-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 flex items-center gap-3 whitespace-nowrap">
                <PenTool className="h-4 w-4 text-primary" /> Tim Arsitek
            </h2>
            <div className="h-px bg-border/50 flex-1" />
        </div>
        
        <div className="grid grid-cols-1 gap-20 md:gap-28">
            {initialArchitects.map((dev, i) => (
                <motion.div
                    key={dev.handle}
                    variants={sectionVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    className="grid md:grid-cols-2 items-center gap-12 md:gap-20"
                >
                    {/* --- IMAGE COLUMN --- */}
                    <div className={cn("relative", i % 2 !== 0 && "md:order-last")}>
                        <div className="absolute -bottom-4 -right-4 h-full w-full rounded-3xl bg-primary -z-10" />
                        <Image 
                            src={dev.avatar} 
                            alt={dev.name} 
                            data-ai-hint={dev.avatarHint}
                            width={600}
                            height={600}
                            className="relative object-cover rounded-3xl shadow-2xl w-full h-auto aspect-square"
                        />
                    </div>

                    {/* --- TEXT COLUMN --- */}
                    <div className="space-y-8">
                        <Logo className="h-10 w-10" />
                        <div className="relative">
                            <Quote className="h-24 w-24 text-primary/10 absolute -top-10 -left-8" fill="currentColor" strokeWidth={0} />
                            <p className="relative text-2xl lg:text-3xl font-medium italic text-foreground/80 leading-relaxed">
                                "{dev.quote}"
                            </p>
                        </div>
                        <div className="pt-4 border-t border-border/50">
                            <h4 className="font-headline text-2xl font-bold text-foreground">{dev.name}</h4>
                            <p className="font-semibold text-sm uppercase tracking-widest text-primary">{dev.role}</p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
      </section>

      <section className="space-y-16 px-4">
        <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-headline font-black tracking-tight">Kekuatan di Balik <span className="text-primary italic underline decoration-primary/10">Sistem.</span></h2>
            <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto font-medium leading-relaxed opacity-80">
                Nusakarsa dibangun dengan tumpukan teknologi modern untuk memastikan setiap detik pengalaman sastra Anda terasa magis, cepat, dan aman.
            </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {technologies.map((tech, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
                    <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm rounded-[2rem] p-8 text-center border border-white/5 group h-full">
                        <div className="h-12 w-12 md:h-16 md:w-16 relative mb-8 mx-auto transition-all duration-700 group-hover:scale-110 drop-shadow-lg">
                            <Image src={tech.icon} alt={tech.title} fill className="object-contain" />
                        </div>
                        <h4 className="font-black text-xs md:text-sm mb-3 uppercase tracking-[0.1em] text-foreground">{tech.title}</h4>
                        <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed font-medium">{tech.desc}</p>
                    </Card>
                </motion.div>
            ))}
        </div>
      </section>
    </div>
  );
}
    
    

    
